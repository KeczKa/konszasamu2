"""Idempotent setup: creates database indexes. Content (news, events, photos) is added from the admin panel."""
import asyncio

from lib.db import ensure_indexes


async def main():
    await ensure_indexes()
    print("Setup complete: indexes ensured.")


if __name__ == "__main__":
    asyncio.run(main())
