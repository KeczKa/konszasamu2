"""Useful links: external institutions with contact data, managed by admins."""
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from lib.db import db
from lib.security import require

router = APIRouter()


class LinkIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(default="", max_length=300)
    phone: str = Field(default="", max_length=60)
    url: str = Field(default="", max_length=500, pattern=r"^(https?://\S+)?$")


class UsefulLink(LinkIn):
    id: str


def link_out(doc: dict) -> UsefulLink:
    return UsefulLink(**{k: v for k, v in doc.items() if k in UsefulLink.model_fields})


@router.get("/links", response_model=List[UsefulLink])
async def list_links():
    docs = await db.useful_links.find().sort("created_at", 1).to_list(500)
    return [link_out(d) for d in docs]


@router.post("/links", response_model=UsefulLink, status_code=201)
async def create_link(body: LinkIn, user: dict = Depends(require("links"))):
    doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": datetime.now(timezone.utc)}
    await db.useful_links.insert_one(doc)
    return link_out(doc)


@router.put("/links/{link_id}", response_model=UsefulLink)
async def update_link(link_id: str, body: LinkIn, user: dict = Depends(require("links"))):
    result = await db.useful_links.update_one({"id": link_id}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    return UsefulLink(id=link_id, **body.model_dump())


@router.delete("/links/{link_id}", status_code=204)
async def delete_link(link_id: str, user: dict = Depends(require("links"))):
    result = await db.useful_links.delete_one({"id": link_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
