import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
import asyncio

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response, File, UploadFile
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from lib.db import client, db, ensure_indexes
from lib.security import create_access_token, get_current_user, hash_password, permissions_for, require, verify_password
from routers.admin_ext import router as admin_ext_router
from routers.content import router as content_router
from lib.institutions import DEFAULT_INSTITUTION, InstitutionSlug
from lib.storage import put_object

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def aware(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


async def seed_admin() -> None:
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": email, "password_hash": hash_password(password),
            "name": "Administrator", "role": "admin", "picture": None, "created_at": utcnow(),
        })
        logger.info("Seeded admin user %s", email)
    else:
        if not verify_password(password, existing.get("password_hash") or ""):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
            logger.info("Updated admin password for %s", email)
        if existing.get("role") != "admin":
            await db.users.update_one({"email": email}, {"$set": {"role": "admin"}})


async def assign_default_institution() -> None:
    missing = {"institution": {"$exists": False}}
    await db.posts.update_many(missing, {"$set": {"institution": DEFAULT_INSTITUTION}, "$unset": {"category": ""}})
    await db.gallery_photos.update_many(missing, {"$set": {"institution": DEFAULT_INSTITUTION}})


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = __import__("asyncio").create_task(ensure_indexes())
    await seed_admin()
    await assign_default_institution()
    yield
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")
api_router.include_router(admin_ext_router)
api_router.include_router(content_router)


# ---------- Models ----------

class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AdminUser(BaseModel):
    id: str
    email: str
    name: str
    role: str
    permissions: List[str] = []


class PostIn(BaseModel):
    title_ro: str = Field(min_length=1)
    title_hu: str = Field(min_length=1)
    content_ro: str = Field(min_length=1)
    content_hu: str = Field(min_length=1)
    institution: InstitutionSlug
    cover_image: str = ""


class Post(PostIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    message: str = Field(min_length=1, max_length=4000)


class ContactMessage(ContactIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resolved: bool = False
    created_at: datetime = Field(default_factory=utcnow)


def post_from_doc(doc: dict) -> Post:
    doc.pop("_id", None)
    doc.pop("category", None)
    doc.setdefault("institution", DEFAULT_INSTITUTION)
    doc["created_at"] = aware(doc["created_at"])
    doc["updated_at"] = aware(doc["updated_at"])
    return Post(**doc)


def msg_from_doc(doc: dict) -> ContactMessage:
    doc.pop("_id", None)
    doc["created_at"] = aware(doc["created_at"])
    return ContactMessage(**doc)


# ---------- Auth routes ----------

@api_router.post("/auth/login", response_model=AdminUser)
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until") and aware(attempt["locked_until"]) > utcnow():
        raise HTTPException(status_code=429, detail="Prea multe încercări eșuate. Reîncercați peste 15 minute.")

    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        count = (attempt or {}).get("count", 0) + 1
        update = {"count": count}
        if count >= 5:
            update = {"count": 0, "locked_until": utcnow() + timedelta(minutes=15)}
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă.")

    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(user["id"], email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=720 * 60, path="/")
    return AdminUser(id=user["id"], email=email, name=user["name"], role=user.get("role", "admin"), permissions=permissions_for(user.get("role", "admin")))


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me", response_model=AdminUser)
async def me(user: dict = Depends(get_current_user)):
    return AdminUser(id=user["id"], email=user["email"], name=user["name"], role=user.get("role", ""), permissions=user.get("permissions", []))


# ---------- News routes ----------

@api_router.get("/news", response_model=List[Post])
async def list_posts(institution: Optional[InstitutionSlug] = None):
    query = {"institution": institution} if institution else {}
    docs = await db.posts.find(query).sort("created_at", -1).to_list(500)
    return [post_from_doc(d) for d in docs]


@api_router.get("/gallery/article-image/{filename}")
async def get_news_cover_image(filename: str):
    from fastapi import HTTPException
    from fastapi.responses import Response
    from lib.storage import get_object

    if (
        not filename
        or "/" in filename
        or "\\" in filename
        or ".." in filename
    ):
        raise HTTPException(status_code=400, detail="Invalid filename")

    try:
        data, content_type = await asyncio.to_thread(
            get_object, f"articles/{filename}"
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Image not found")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid storage path")

    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )

@api_router.post("/news/cover-image")
async def upload_news_cover_image(
    file: UploadFile = File(...),
    user: dict = Depends(require("posts")),
):

    allowed_types = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
    }

    content_type = (file.content_type or "").lower()
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Only JPEG, PNG, WebP and GIF images are allowed.",
        )

    data = await file.read(10 * 1024 * 1024 + 1)
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB.")

    filename = f"{uuid.uuid4()}.{allowed_types[content_type]}"
    storage_path = f"articles/{filename}"

    result = await asyncio.to_thread(
        put_object, storage_path, data, content_type
    )

    return {
        "url": f"/api/gallery/article-image/{filename}",
        "path": result["path"],
        "content_type": content_type,
    }

@api_router.get("/news/{post_id}", response_model=Post)
async def get_post(post_id: str):
    doc = await db.posts.find_one({"id": post_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Articolul nu a fost găsit")
    return post_from_doc(doc)


@api_router.post("/news", response_model=Post, status_code=201)
async def create_post(body: PostIn, user: dict = Depends(require("posts"))):
    post = Post(**body.model_dump())
    await db.posts.insert_one(post.model_dump())
    return post


@api_router.put("/news/{post_id}", response_model=Post)
async def update_post(post_id: str, body: PostIn, user: dict = Depends(require("posts"))):
    doc = await db.posts.find_one({"id": post_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Articolul nu a fost găsit")
    update = body.model_dump()
    update["updated_at"] = utcnow()
    await db.posts.update_one({"id": post_id}, {"$set": update})
    return post_from_doc(await db.posts.find_one({"id": post_id}))


@api_router.delete("/news/{post_id}", status_code=204)
async def delete_post(post_id: str, user: dict = Depends(require("posts"))):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Articolul nu a fost găsit")


# ---------- Contact routes ----------

@api_router.post("/contact", response_model=ContactMessage, status_code=201)
async def create_contact(body: ContactIn):
    msg = ContactMessage(**body.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
    return msg


@api_router.get("/contact", response_model=List[ContactMessage])
async def list_contacts(user: dict = Depends(require("messages"))):
    docs = await db.contact_messages.find().sort("created_at", -1).to_list(1000)
    return [msg_from_doc(d) for d in docs]


@api_router.patch("/contact/{msg_id}/resolve", response_model=ContactMessage)
async def resolve_contact(msg_id: str, user: dict = Depends(require("messages"))):
    doc = await db.contact_messages.find_one({"id": msg_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Mesajul nu a fost găsit")
    await db.contact_messages.update_one({"id": msg_id}, {"$set": {"resolved": not doc.get("resolved", False)}})
    return msg_from_doc(await db.contact_messages.find_one({"id": msg_id}))


@api_router.get("/")
async def root():
    return {"message": "Konsza Samu API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
