"""School events, tagged by member institution or 'all'."""
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional, Union

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from lib.db import db
from lib.institutions import InstitutionSlug
from lib.security import require

router = APIRouter()

EventInstitution = Union[InstitutionSlug, Literal["all"]]


class EventIn(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(default="", pattern=r"^(\d{2}:\d{2})?$")
    title_ro: str = Field(min_length=1, max_length=200)
    title_hu: str = Field(min_length=1, max_length=200)
    description_ro: str = Field(default="", max_length=5000)
    description_hu: str = Field(default="", max_length=5000)
    location: str = Field(min_length=1, max_length=200)
    institution: EventInstitution


class Event(EventIn):
    id: str


def event_out(doc: dict) -> Event:
    return Event(**{k: v for k, v in doc.items() if k in Event.model_fields})


def validate_date(body: EventIn) -> None:
    try:
        datetime.strptime(f"{body.date} {body.time or '00:00'}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date or time")


@router.get("/events", response_model=List[Event])
async def list_events(institution: Optional[InstitutionSlug] = None):
    query = {"institution": {"$in": [institution, "all"]}} if institution else {}
    docs = await db.events.find(query).sort([("date", 1), ("time", 1)]).to_list(2000)
    return [event_out(d) for d in docs]


@router.post("/events", response_model=Event, status_code=201)
async def create_event(body: EventIn, user: dict = Depends(require("events"))):
    validate_date(body)
    doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": datetime.now(timezone.utc)}
    await db.events.insert_one(doc)
    return event_out(doc)


@router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, body: EventIn, user: dict = Depends(require("events"))):
    validate_date(body)
    result = await db.events.update_one({"id": event_id}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(id=event_id, **body.model_dump())


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(event_id: str, user: dict = Depends(require("events"))):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
