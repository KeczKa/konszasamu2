
"""Google OAuth session exchange, user management (RBAC) and gallery endpoints."""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import PurePosixPath
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field

from lib.db import db
from lib.institutions import DEFAULT_INSTITUTION, InstitutionSlug
from lib.security import get_current_user, permissions_for, require
from lib.storage import STORAGE_DIR, get_object, put_object

router = APIRouter()

SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}
MAX_IMAGE_BYTES = 10 * 1024 * 1024


class GoogleSessionIn(BaseModel):
    session_id: str


class UserSessionOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    permissions: List[str]


class UserIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    role: str


class RoleUpdate(BaseModel):
    role: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    picture: Optional[str] = None


class GalleryPhoto(BaseModel):
    id: str
    src: str
    original_filename: str
    institution: str
    created_at: datetime


class GalleryInstitutionUpdate(BaseModel):
    institution: InstitutionSlug


def user_out(doc: dict) -> UserOut:
    return UserOut(
        id=doc["id"],
        email=doc["email"],
        name=doc.get("name", ""),
        role=doc.get("role", "viewer"),
        picture=doc.get("picture"),
    )


def photo_out(doc: dict) -> GalleryPhoto:
    src = doc.get("external_url") or f"/api/gallery/image/{doc['id']}"
    created = doc["created_at"]
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return GalleryPhoto(
        id=doc["id"],
        src=src,
        original_filename=doc.get("original_filename", ""),
        institution=doc.get("institution", DEFAULT_INSTITUTION),
        created_at=created,
    )


# ---------- Google OAuth ----------

@router.post("/auth/google-session", response_model=UserSessionOut)
async def google_session(body: GoogleSessionIn, response: Response):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            SESSION_DATA_URL,
            headers={"X-Session-ID": body.session_id},
        )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")

    data = r.json()
    email = data["email"].lower()

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=403,
            detail="Ez a Google-fiók nincs regisztrálva. / Acest cont Google nu este înregistrat.",
        )

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "name": data.get("name") or user.get("name", ""),
                "picture": data.get("picture"),
            }
        },
    )

    session_token = data["session_token"]
    await db.user_sessions.delete_many({"user_id": user["id"]})
    await db.user_sessions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 86400,
        path="/",
    )

    return UserSessionOut(
        id=user["id"],
        email=email,
        name=data.get("name", user.get("name", "")),
        role=user.get("role", "viewer"),
        permissions=permissions_for(user.get("role", "")),
    )


@router.post("/auth/logout-google")
async def logout_google(
    response: Response,
    request_user=Depends(get_current_user),
):
    await db.user_sessions.delete_many({"user_id": request_user["id"]})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---------- User management (admin) ----------

@router.get("/users", response_model=List[UserOut])
async def list_users(user: dict = Depends(require("users"))):
    docs = await db.users.find().sort("email", 1).to_list(500)
    return [user_out(d) for d in docs]


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(body: UserIn, user: dict = Depends(require("users"))):
    if body.role not in ("admin", "editor", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role")

    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(
            status_code=409,
            detail="Ez az email cím már létezik. / Acest email există deja.",
        )

    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": body.name,
        "role": body.role,
        "picture": None,
        "password_hash": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)
    return user_out(doc)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user_role(
    user_id: str,
    body: RoleUpdate,
    user: dict = Depends(require("users")),
):
    if body.role not in ("admin", "editor", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role")

    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": body.role}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return user_out(await db.users.find_one({"id": user_id}))


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: str, user: dict = Depends(require("users"))):
    if user_id == user["id"]:
        raise HTTPException(
            status_code=400,
            detail="Saját magadat nem törölheted. / Nu te poți șterge pe tine însuți.",
        )

    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    await db.user_sessions.delete_many({"user_id": user_id})


# ---------- Gallery ----------

@router.get("/gallery", response_model=List[GalleryPhoto])
async def list_gallery():
    docs = await db.gallery_photos.find(
        {"is_deleted": False}
    ).sort("created_at", 1).to_list(500)

    return [photo_out(d) for d in docs]


@router.post("/gallery", response_model=GalleryPhoto, status_code=201)
async def upload_gallery_photo(
    file: UploadFile = File(...),
    institution: InstitutionSlug = Form(...),
    user: dict = Depends(require("gallery")),
):
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Csak képfájlok (JPG, PNG, WebP, GIF). / Doar imagini (JPG, PNG, WebP, GIF).",
        )

    data = await file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="A fájl túl nagy (max. 10 MB). / Fișierul este prea mare (max. 10 MB).",
        )

    ext = ALLOWED_IMAGE_TYPES[content_type]
    relative_path = f"konszasamu/gallery/{uuid.uuid4().hex}.{ext}"

    try:
        result = await asyncio.to_thread(
            put_object,
            relative_path,
            data,
            content_type,
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="A helyi tárhely nem érhető el. / Stocarea locală nu este disponibilă.",
        )

    doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "external_url": None,
        "original_filename": file.filename or "photo",
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "institution": institution,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        await db.gallery_photos.insert_one(doc)
    except Exception:
        # Best-effort cleanup if MongoDB metadata insertion fails.
        try:
            target = (STORAGE_DIR / PurePosixPath(relative_path)).resolve()
            root = STORAGE_DIR.resolve()
            if target.is_relative_to(root) and target.is_file():
                await asyncio.to_thread(target.unlink)
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="A kép mentése sikerült, de a metaadatok mentése nem. / Imaginea a fost salvată, dar metadatele nu.",
        )

    return photo_out(doc)


@router.get("/gallery/image/{photo_id}")
async def gallery_image(photo_id: str):
    doc = await db.gallery_photos.find_one(
        {"id": photo_id, "is_deleted": False}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")

    # Keep existing externally hosted images working.
    external_url = doc.get("external_url")
    if external_url:
        return RedirectResponse(url=external_url, status_code=307)

    storage_path = doc.get("storage_path")
    if not storage_path:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        data, _ = await asyncio.to_thread(get_object, storage_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid storage path")
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not read image from local storage.",
        )

    return Response(
        content=data,
        media_type=doc.get("content_type", "application/octet-stream"),
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.patch("/gallery/{photo_id}", response_model=GalleryPhoto)
async def update_gallery_photo(
    photo_id: str,
    body: GalleryInstitutionUpdate,
    user: dict = Depends(require("gallery")),
):
    result = await db.gallery_photos.update_one(
        {"id": photo_id, "is_deleted": False},
        {"$set": {"institution": body.institution}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo_out(await db.gallery_photos.find_one({"id": photo_id}))


@router.delete("/gallery/{photo_id}", status_code=204)
async def delete_gallery_photo(
    photo_id: str,
    user: dict = Depends(require("gallery")),
):
    result = await db.gallery_photos.update_one(
        {"id": photo_id},
        {"$set": {"is_deleted": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
