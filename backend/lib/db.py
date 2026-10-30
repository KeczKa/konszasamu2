"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "posts": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("created_at", DESCENDING)], name="created_desc"),
    ],
    "contact_messages": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("created_at", DESCENDING)], name="created_desc"),
    ],
    "users": [IndexModel([("email", ASCENDING)], name="email", unique=True)],
    "login_attempts": [IndexModel([("identifier", ASCENDING)], name="identifier")],
    "user_sessions": [
        IndexModel([("session_token", ASCENDING)], name="session_token", unique=True),
        IndexModel([("user_id", ASCENDING)], name="user_id"),
    ],
    "gallery_photos": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "events": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("date", ASCENDING)], name="date"),
    ],
    "institutions": [IndexModel([("slug", ASCENDING)], name="slug", unique=True)],
    "documents": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("created_at", DESCENDING)], name="created_desc"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
