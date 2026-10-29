
"""Local filesystem storage for uploaded images."""
import os
from pathlib import Path, PurePosixPath

STORAGE_DIR = Path(os.environ.get("PHOTO_STORAGE_DIR", "/app/uploads"))

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
}


def delete_object(path: str) -> None:
    _safe_path(path).unlink(missing_ok=True)


def _safe_path(relative_path: str) -> Path:
    relative = PurePosixPath(relative_path)

    if (
        relative.is_absolute()
        or not relative.parts
        or ".." in relative.parts
    ):
        raise ValueError("Invalid storage path")

    root = STORAGE_DIR.resolve()
    target = (root / Path(*relative.parts)).resolve()

    if not target.is_relative_to(root):
        raise ValueError("Invalid storage path")

    return target


def put_object(path: str, data: bytes, content_type: str) -> dict:
    target = _safe_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)

    # Avoid accidentally overwriting an existing image.
    with target.open("xb") as output:
        output.write(data)

    return {
        "path": path,
        "size": len(data),
        "content_type": content_type,
    }


def get_object(path: str) -> tuple[bytes, str]:
    target = _safe_path(path)

    if not target.is_file():
        raise FileNotFoundError("Stored image not found")

    content_type = CONTENT_TYPES.get(
        target.suffix.lower(),
        "application/octet-stream",
    )

    return target.read_bytes(), content_type
