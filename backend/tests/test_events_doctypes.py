# Regression tests: events CRUD/filtering/auth/validation + document doc_type (iteration 5)
import uuid

import bcrypt
import pytest
import requests
from pymongo import MongoClient

BASE = "https://72f697df-da92-4fed-bfd2-6e89bf803f61.preview.emergentagent.com/api"
ADMIN = {"email": "admin@konszasamu.ro", "password": "Preview-Admin-2026"}
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


def login(email, pw):
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    s.headers["Authorization"] = f"Bearer {s.cookies.get('access_token')}"
    return s


@pytest.fixture(scope="module")
def admin():
    return login(ADMIN["email"], ADMIN["password"])


@pytest.fixture(scope="module")
def editor():
    mc = MongoClient("mongodb://localhost:27017")["konszasamu_preview"]
    email = f"test_editor5_{uuid.uuid4().hex[:6]}@konszasamu.ro"
    mc.users.delete_many({"email": email})
    mc.users.insert_one({"id": str(uuid.uuid4()), "email": email, "name": "TEST Editor", "role": "editor",
                         "password_hash": bcrypt.hashpw(b"Editor-Pass-1", bcrypt.gensalt()).decode()})
    yield login(email, "Editor-Pass-1")
    mc.users.delete_many({"email": email})


def ev(**kw):
    b = {"date": "2026-11-20", "time": "", "title_ro": "TEST_ev_ro", "title_hu": "TEST_ev_hu",
         "description_ro": "d ro", "description_hu": "d hu", "location": "TEST loc", "institution": "ajtai-iskola"}
    b.update(kw)
    return b


# --- Events
class TestEvents:
    def test_list_seeded_sorted(self):
        r = requests.get(f"{BASE}/events")
        assert r.status_code == 200
        data = r.json()
        keys = [(e["date"], e["time"]) for e in data]
        assert keys == sorted(keys)
        titles = {e["title_hu"] for e in data}
        assert {"Mikulás-ünnepség", "Tanévnyitó"} <= titles or len(data) >= 4
        assert all("_id" not in e for e in data)

    def test_filter_includes_all(self):
        data = requests.get(f"{BASE}/events", params={"institution": "ajtai-iskola"}).json()
        assert all(e["institution"] in ("ajtai-iskola", "all") for e in data)
        assert any(e["institution"] == "all" for e in data)
        k = requests.get(f"{BASE}/events", params={"institution": "kisbaconi-ovoda"}).json()
        assert any(e["institution"] == "kisbaconi-ovoda" for e in k)

    def test_invalid_filter_slug_422(self):
        assert requests.get(f"{BASE}/events", params={"institution": "nope"}).status_code == 422

    def test_post_unauth_401(self):
        assert requests.post(f"{BASE}/events", json=ev()).status_code == 401

    def test_invalid_date_422(self, admin):
        assert admin.post(f"{BASE}/events", json=ev(date="2026-02-31")).status_code == 422

    def test_invalid_time_422(self, admin):
        assert admin.post(f"{BASE}/events", json=ev(time="25:99")).status_code == 422

    def test_missing_location_422(self, admin):
        b = ev(); b.pop("location")
        assert admin.post(f"{BASE}/events", json=b).status_code == 422
        assert admin.post(f"{BASE}/events", json=ev(location="")).status_code == 422

    def test_invalid_institution_422(self, admin):
        assert admin.post(f"{BASE}/events", json=ev(institution="xyz")).status_code == 422

    def test_crud_admin(self, admin):
        r = admin.post(f"{BASE}/events", json=ev(institution="all", time="09:30"))
        assert r.status_code == 201, r.text
        e = r.json(); eid = e["id"]
        assert e["institution"] == "all" and e["time"] == "09:30"
        try:
            lst = requests.get(f"{BASE}/events", params={"institution": "nagybaconi-ovoda"}).json()
            assert any(x["id"] == eid for x in lst)
            u = admin.put(f"{BASE}/events/{eid}", json=ev(title_hu="TEST_upd", institution="kisbaconi-iskola"))
            assert u.status_code == 200 and u.json()["title_hu"] == "TEST_upd"
            got = [x for x in requests.get(f"{BASE}/events").json() if x["id"] == eid][0]
            assert got["title_hu"] == "TEST_upd" and got["institution"] == "kisbaconi-iskola" and got["time"] == ""
        finally:
            assert admin.delete(f"{BASE}/events/{eid}").status_code == 204
        assert all(x["id"] != eid for x in requests.get(f"{BASE}/events").json())
        assert admin.delete(f"{BASE}/events/{eid}").status_code == 404
        assert admin.put(f"{BASE}/events/{eid}", json=ev()).status_code == 404

    def test_editor_can_manage(self, editor):
        r = editor.post(f"{BASE}/events", json=ev())
        assert r.status_code == 201
        assert editor.delete(f"{BASE}/events/{r.json()['id']}").status_code == 204


# --- Documents doc_type
class TestDocType:
    def test_existing_have_type(self):
        docs = requests.get(f"{BASE}/documents").json()
        assert all(d["doc_type"] in ("announcement", "decision") for d in docs)

    def test_upload_without_type_422(self, admin):
        r = admin.post(f"{BASE}/documents", data={"title_ro": "TEST", "title_hu": "TEST"},
                       files={"file": ("t.pdf", PDF, "application/pdf")})
        assert r.status_code == 422

    def test_upload_invalid_type_422(self, admin):
        r = admin.post(f"{BASE}/documents", data={"title_ro": "TEST", "title_hu": "TEST", "doc_type": "foo"},
                       files={"file": ("t.pdf", PDF, "application/pdf")})
        assert r.status_code == 422

    def test_upload_patch_delete(self, admin, editor):
        r = admin.post(f"{BASE}/documents", data={"title_ro": "TEST_dec", "title_hu": "TEST_dec", "doc_type": "decision"},
                       files={"file": ("t.pdf", PDF, "application/pdf")})
        assert r.status_code == 201, r.text
        did = r.json()["id"]
        try:
            assert r.json()["doc_type"] == "decision"
            assert requests.patch(f"{BASE}/documents/{did}", json={"doc_type": "announcement"}).status_code == 401
            assert editor.patch(f"{BASE}/documents/{did}", json={"doc_type": "announcement"}).status_code == 403
            assert admin.patch(f"{BASE}/documents/{did}", json={"doc_type": "bad"}).status_code == 422
            p = admin.patch(f"{BASE}/documents/{did}", json={"doc_type": "announcement"})
            assert p.status_code == 200 and p.json()["doc_type"] == "announcement"
            got = [d for d in requests.get(f"{BASE}/documents").json() if d["id"] == did][0]
            assert got["doc_type"] == "announcement"
            assert admin.patch(f"{BASE}/documents/nonexistent", json={"doc_type": "decision"}).status_code == 404
        finally:
            assert admin.delete(f"{BASE}/documents/{did}").status_code == 204
