# Regression tests: gallery bilingual captions (iteration 7) + useful links (/api/links) CRUD & RBAC
import uuid

import bcrypt
import pytest
import requests
from pymongo import MongoClient

BASE = "https://72f697df-da92-4fed-bfd2-6e89bf803f61.preview.emergentagent.com/api"
ADMIN = {"email": "admin@konszasamu.ro", "password": "Preview-Admin-2026"}
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082")
MC = MongoClient("mongodb://localhost:27017")["konszasamu_preview"]


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    s.headers["Authorization"] = f"Bearer {s.cookies.get('access_token')}"
    return s


@pytest.fixture(scope="module")
def editor():
    email = "test_editor_links@konszasamu.ro"
    MC.users.delete_many({"email": email})
    MC.users.insert_one({"id": str(uuid.uuid4()), "email": email, "name": "TEST Editor", "role": "editor",
                         "password_hash": bcrypt.hashpw(b"Editor-Pass-1", bcrypt.gensalt()).decode()})
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json={"email": email, "password": "Editor-Pass-1"})
    assert r.status_code == 200, r.text
    s.headers["Authorization"] = f"Bearer {s.cookies.get('access_token')}"
    yield s
    MC.users.delete_many({"email": email})


def upload(sess, **data):
    body = {"institution": "ajtai-iskola", "caption_hu": "TEST_Karácsony 2026", "caption_ro": "TEST_Crăciun 2026"}
    body.update(data)
    body = {k: v for k, v in body.items() if v is not None}
    return sess.post(f"{BASE}/gallery", files={"file": ("TEST.png", PNG, "image/png")}, data=body)


def purge_photo(sess, pid):
    sess.delete(f"{BASE}/gallery/{pid}")
    MC.gallery_photos.delete_one({"id": pid})  # hard-remove only the record this test created


# --- Gallery captions
class TestGalleryCaptions:
    def test_missing_caption_hu_422(self, admin):
        assert upload(admin, caption_hu=None).status_code == 422

    def test_missing_caption_ro_422(self, admin):
        assert upload(admin, caption_ro=None).status_code == 422

    def test_caption_too_long_422(self, admin):
        assert upload(admin, caption_hu="x" * 101).status_code == 422
        assert upload(admin, caption_ro="x" * 101).status_code == 422

    def test_caption_100_ok_and_patch(self, admin):
        r = upload(admin, caption_hu="h" * 100)
        assert r.status_code == 201, r.text
        d = r.json()
        pid = d["id"]
        try:
            assert d["caption_hu"] == "h" * 100 and d["caption_ro"] == "TEST_Crăciun 2026"
            p = admin.patch(f"{BASE}/gallery/{pid}", json={"caption_hu": "TEST_Új", "caption_ro": "TEST_Nou"})
            assert p.status_code == 200
            assert p.json()["caption_hu"] == "TEST_Új" and p.json()["institution"] == "ajtai-iskola"
            g = [x for x in requests.get(f"{BASE}/gallery").json() if x["id"] == pid][0]
            assert g["caption_hu"] == "TEST_Új" and g["caption_ro"] == "TEST_Nou"
            assert admin.patch(f"{BASE}/gallery/{pid}", json={}).status_code == 400
            assert admin.patch(f"{BASE}/gallery/{pid}", json={"caption_hu": "x" * 101}).status_code == 422
            assert admin.patch(f"{BASE}/gallery/{pid}", json={"caption_hu": ""}).status_code == 422
            assert requests.patch(f"{BASE}/gallery/{pid}", json={"caption_hu": "a"}).status_code == 401
        finally:
            purge_photo(admin, pid)

    def test_whitespace_caption_rejected(self, admin):
        """Whitespace-only caption should not be stored as empty string."""
        r = upload(admin, caption_hu="   ")
        if r.status_code == 201:
            purge_photo(admin, r.json()["id"])
        assert r.status_code == 422, f"whitespace caption accepted, stored as {r.json().get('caption_hu')!r}"


# --- Useful links
class TestLinks:
    def test_list_public(self):
        r = requests.get(f"{BASE}/links")
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_unauth_401(self):
        assert requests.post(f"{BASE}/links", json={"name": "TEST"}).status_code == 401

    def test_editor_403(self, editor):
        assert editor.post(f"{BASE}/links", json={"name": "TEST"}).status_code == 403

    def test_invalid_url_422(self, admin):
        assert admin.post(f"{BASE}/links", json={"name": "TEST", "url": "abc"}).status_code == 422
        assert admin.post(f"{BASE}/links", json={"name": "TEST", "url": "ftp://x.ro"}).status_code == 422

    def test_missing_name_422(self, admin):
        assert admin.post(f"{BASE}/links", json={"url": "https://a.ro"}).status_code == 422
        assert admin.post(f"{BASE}/links", json={"name": ""}).status_code == 422

    def test_crud(self, admin):
        body = {"name": "TEST_Prefektúra", "address": "Sf. Gheorghe", "phone": "0267 123", "url": "https://prefectura.ro"}
        r = admin.post(f"{BASE}/links", json=body)
        assert r.status_code == 201
        lid = r.json()["id"]
        try:
            assert {k: r.json()[k] for k in body} == body
            assert lid in [x["id"] for x in requests.get(f"{BASE}/links").json()]
            u = admin.put(f"{BASE}/links/{lid}", json={**body, "name": "TEST_Edited", "url": ""})
            assert u.status_code == 200 and u.json()["name"] == "TEST_Edited"
            g = [x for x in requests.get(f"{BASE}/links").json() if x["id"] == lid][0]
            assert g["name"] == "TEST_Edited" and g["url"] == ""
            assert all("_id" not in x and "created_at" not in x for x in requests.get(f"{BASE}/links").json())
            assert admin.put(f"{BASE}/links/nope", json=body).status_code == 404
        finally:
            assert admin.delete(f"{BASE}/links/{lid}").status_code == 204
        assert lid not in [x["id"] for x in requests.get(f"{BASE}/links").json()]
        assert admin.delete(f"{BASE}/links/{lid}").status_code == 404
