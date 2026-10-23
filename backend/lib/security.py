"""Auth + RBAC shared between server.py and routers."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request

from lib.db import db

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 12

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "admin": {"posts", "messages", "gallery", "users"},
    "editor": {"posts", "gallery"},
    "viewer": {"messages"},
}


def permissions_for(role: str) -> list[str]:
    return sorted(ROLE_PERMISSIONS.get(role, set()))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def _load_user(user_id: str) -> dict | None:
    user = await db.users.find_one({"id": user_id})
    if not user:
        return None
    user.pop("_id", None)
    user.pop("password_hash", None)
    user["permissions"] = permissions_for(user.get("role", ""))
    return user


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        try:
            payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await _load_user(payload["sub"])
        if user:
            return user
        raise HTTPException(status_code=401, detail="User not found")

    session_token = request.cookies.get("session_token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await _load_user(session["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require(permission: str):
    async def dependency(user: dict = Depends(get_current_user)) -> dict:
        if permission not in ROLE_PERMISSIONS.get(user.get("role", ""), set()):
            raise HTTPException(status_code=403, detail="Nincs jogosultsága ehhez a művelethez. / Nu aveți permisiunea pentru această acțiune.")
        return user

    return dependency
