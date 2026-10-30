"""Member institution pages and official PDF documents."""
import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from lib.db import db
from lib.institutions import INSTITUTION_SLUGS, InstitutionSlug
from lib.security import require
from lib.storage import delete_object, get_object, put_object

router = APIRouter()

MAX_PDF_BYTES = 20 * 1024 * 1024
DocType = Literal["announcement", "decision"]


class InstitutionIn(BaseModel):
    description_ro: str = Field(default="", max_length=10000)
    description_hu: str = Field(default="", max_length=10000)
    address: str = Field(default="", max_length=300)
    phone: str = Field(default="", max_length=60)
    email: str = Field(default="", max_length=120)
    images: List[str] = Field(default_factory=list, max_length=12)


class Institution(InstitutionIn):
    slug: str


class OfficialDocument(BaseModel):
    id: str
    title_ro: str
    title_hu: str
    doc_type: str
    original_filename: str
    size: int
    url: str
    created_at: datetime


def institution_out(slug: str, doc: dict | None) -> Institution:
    data = {k: v for k, v in (doc or {}).items() if k in InstitutionIn.model_fields}
    return Institution(slug=slug, **data)


def document_out(doc: dict) -> OfficialDocument:
    created = doc["created_at"]
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return OfficialDocument(
        id=doc["id"],
        title_ro=doc["title_ro"],
        title_hu=doc["title_hu"],
        doc_type=doc.get("doc_type", "announcement"),
        original_filename=doc.get("original_filename", "document.pdf"),
        size=doc.get("size", 0),
        url=f"/api/documents/{doc['id']}/file",
        created_at=created,
    )


# ---------- Member institutions ----------

@router.get("/institutions", response_model=List[Institution])
async def list_institutions():
    docs = {d["slug"]: d for d in await db.institutions.find().to_list(50)}
    return [institution_out(s, docs.get(s)) for s in INSTITUTION_SLUGS]


@router.get("/institutions/{slug}", response_model=Institution)
async def get_institution(slug: InstitutionSlug):
    return institution_out(slug, await db.institutions.find_one({"slug": slug}))


@router.put("/institutions/{slug}", response_model=Institution)
async def update_institution(slug: InstitutionSlug, body: InstitutionIn, user: dict = Depends(require("institutions"))):
    if any(not img.startswith("/api/") for img in body.images):
        raise HTTPException(status_code=400, detail="Invalid image URL")
    data = body.model_dump()
    await db.institutions.update_one(
        {"slug": slug},
        {"$set": {**data, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return Institution(slug=slug, **data)


# ---------- Official documents (PDF) ----------

@router.get("/documents", response_model=List[OfficialDocument])
async def list_documents():
    docs = await db.documents.find().sort("created_at", -1).to_list(1000)
    return [document_out(d) for d in docs]


@router.post("/documents", response_model=OfficialDocument, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title_ro: str = Form(..., min_length=1, max_length=300),
    title_hu: str = Form(..., min_length=1, max_length=300),
    doc_type: DocType = Form(...),
    user: dict = Depends(require("documents")),
):
    data = await file.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="A fájl túl nagy (max. 20 MB). / Fișierul este prea mare (max. 20 MB).")
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=415, detail="Csak PDF fájl tölthető fel. / Doar fișiere PDF.")

    doc_id = str(uuid.uuid4())
    path = f"konszasamu/documents/{doc_id}.pdf"
    await asyncio.to_thread(put_object, path, data, "application/pdf")
    doc = {
        "id": doc_id,
        "title_ro": title_ro.strip(),
        "title_hu": title_hu.strip(),
        "doc_type": doc_type,
        "storage_path": path,
        "original_filename": file.filename or "document.pdf",
        "size": len(data),
        "created_at": datetime.now(timezone.utc),
    }
    await db.documents.insert_one(doc)
    return document_out(doc)


@router.get("/documents/{doc_id}/file")
async def document_file(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        data, _ = await asyncio.to_thread(get_object, doc["storage_path"])
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc_id}.pdf"', "Cache-Control": "public, max-age=3600"},
    )


class DocTypeUpdate(BaseModel):
    doc_type: DocType


@router.patch("/documents/{doc_id}", response_model=OfficialDocument)
async def update_document_type(doc_id: str, body: DocTypeUpdate, user: dict = Depends(require("documents"))):
    doc = await db.documents.find_one_and_update({"id": doc_id}, {"$set": {"doc_type": body.doc_type}}, return_document=True)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_out(doc)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: str, user: dict = Depends(require("documents"))):
    doc = await db.documents.find_one_and_delete({"id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await asyncio.to_thread(delete_object, doc["storage_path"])
