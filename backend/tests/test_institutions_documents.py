# Regression tests: member institutions, news institution tagging, PDF documents, gallery institution
import io
import uuid

import bcrypt
import pytest
import requests
from pymongo import MongoClient

BASE = "https://72f697df-da92-4fed-bfd2-6e89bf803f61.preview.emergentagent.com/api"
ADMIN = {"email": "admin@konszasamu.ro", "password": "Preview-Admin-2026"}
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082")
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    tok = s.cookies.get("access_token")
    s.headers["Authorization"] = f"Bearer {tok}"
    return s


@pytest.fixture(scope="module")
def editor():
    mc = MongoClient("mongodb://localhost:27017")["konszasamu_preview"]
    email = "test_editor@konszasamu.ro"
    mc.users.delete_many({"email": email})
    mc.users.insert_one({"id": str(uuid.uuid4()), "email": email, "name": "TEST Editor", "role": "editor",
                         "password_hash": bcrypt.hashpw(b"Editor-Pass-1", bcrypt.gensalt()).decode()})
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json={"email": email, "password": "Editor-Pass-1"})
    assert r.status_code == 200, r.text
    s.headers["Authorization"] = f"Bearer {s.cookies.get('access_token')}"
    yield s
    mc.users.delete_many({"email": email})


def post_body(inst="ajtai-iskola"):
    b = {"title_ro": "TEST_ro", "title_hu": "TEST_hu", "content_ro": "c", "content_hu": "c"}
    if inst:
        b["institution"] = inst
    return b


# --- News institution tagging
class TestNews:
    def test_create_without_institution_422(self, admin):
        assert admin.post(f"{BASE}/news", json=post_body(None)).status_code == 422

    def test_invalid_institution_422(self, admin):
        assert admin.post(f"{BASE}/news", json=post_body("nope")).status_code == 422

    def test_create_and_filter(self, admin):
        r = admin.post(f"{BASE}/news", json=post_body("kisbaconi-ovoda"))
        assert r.status_code == 201
        pid = r.json()["id"]
        assert r.json()["institution"] == "kisbaconi-ovoda"
        try:
            f = requests.get(f"{BASE}/news", params={"institution": "kisbaconi-ovoda"}).json()
            assert pid in [p["id"] for p in f]
            assert all(p["institution"] == "kisbaconi-ovoda" for p in f)
            other = requests.get(f"{BASE}/news", params={"institution": "ajtai-ovoda"}).json()
            assert pid not in [p["id"] for p in other]
            allp = requests.get(f"{BASE}/news").json()
            assert pid in [p["id"] for p in allp]
            assert all("institution" in p and "category" not in p for p in allp)
            u = admin.put(f"{BASE}/news/{pid}", json=post_body("ajtai-ovoda"))
            assert u.status_code == 200 and u.json()["institution"] == "ajtai-ovoda"
        finally:
            assert admin.delete(f"{BASE}/news/{pid}").status_code == 204

    def test_filter_invalid_slug_422(self):
        assert requests.get(f"{BASE}/news", params={"institution": "bad"}).status_code == 422


# --- Member institutions
class TestInstitutions:
    def test_list_six(self):
        r = requests.get(f"{BASE}/institutions")
        assert r.status_code == 200
        slugs = [i["slug"] for i in r.json()]
        assert slugs[0] == "nagybaconi-iskola" and len(slugs) == 6

    def test_unknown_slug_422(self):
        assert requests.get(f"{BASE}/institutions/xyz").status_code == 422

    def test_put_unauth_401(self):
        assert requests.put(f"{BASE}/institutions/ajtai-ovoda", json={}).status_code == 401

    def test_put_and_get(self, admin):
        orig = requests.get(f"{BASE}/institutions/ajtai-ovoda").json()
        img = admin.post(f"{BASE}/news/cover-image", files={"file": ("a.png", PNG, "image/png")})
        assert img.status_code == 200
        body = {"description_ro": "TEST ro", "description_hu": "TEST hu", "address": "Addr",
                "phone": "123", "email": "x@y.ro", "images": [img.json()["url"]]}
        try:
            r = admin.put(f"{BASE}/institutions/ajtai-ovoda", json=body)
            assert r.status_code == 200
            g = requests.get(f"{BASE}/institutions/ajtai-ovoda").json()
            assert g["description_hu"] == "TEST hu" and g["images"] == body["images"]
            assert requests.get(BASE.replace("/api", "") + body["images"][0]).status_code == 200
        finally:
            orig.pop("slug")
            admin.put(f"{BASE}/institutions/ajtai-ovoda", json=orig)

    def test_put_external_image_400(self, admin):
        r = admin.put(f"{BASE}/institutions/ajtai-ovoda", json={"images": ["https://evil.com/a.png"]})
        assert r.status_code == 400


# --- Official PDF documents
class TestDocuments:
    def test_unauth_401(self):
        r = requests.post(f"{BASE}/documents", files={"file": ("a.pdf", PDF, "application/pdf")},
                          data={"title_ro": "a", "title_hu": "b"})
        assert r.status_code == 401

    def test_editor_403(self, editor):
        r = editor.post(f"{BASE}/documents", files={"file": ("a.pdf", PDF, "application/pdf")},
                        data={"title_ro": "a", "title_hu": "b"})
        assert r.status_code == 403

    def test_non_pdf_415(self, admin):
        r = admin.post(f"{BASE}/documents", files={"file": ("a.png", PNG, "image/png")},
                       data={"title_ro": "a", "title_hu": "b"})
        assert r.status_code == 415

    def test_missing_title_422(self, admin):
        r = admin.post(f"{BASE}/documents", files={"file": ("a.pdf", PDF, "application/pdf")}, data={"title_ro": "a"})
        assert r.status_code == 422

    def test_upload_view_delete(self, admin):
        r = admin.post(f"{BASE}/documents", files={"file": ("TEST.pdf", PDF, "application/pdf")},
                       data={"title_ro": "TEST_ro", "title_hu": "TEST_hu"})
        assert r.status_code == 201
        d = r.json()
        assert d["title_hu"] == "TEST_hu" and d["size"] == len(PDF)
        assert d["id"] in [x["id"] for x in requests.get(f"{BASE}/documents").json()]
        f = requests.get(BASE.replace("/api", "") + d["url"])
        assert f.status_code == 200 and f.headers["content-type"].startswith("application/pdf")
        assert f.content == PDF
        import os
        assert os.path.isfile(f"/app/uploads/konszasamu/documents/{d['id']}.pdf")
        assert admin.delete(f"{BASE}/documents/{d['id']}").status_code == 204
        assert requests.get(BASE.replace("/api", "") + d["url"]).status_code == 404
        assert admin.delete(f"{BASE}/documents/{d['id']}").status_code == 404


# --- Gallery institution
class TestGallery:
    def test_upload_without_institution_422(self, admin):
        r = admin.post(f"{BASE}/gallery", files={"file": ("a.png", PNG, "image/png")})
        assert r.status_code == 422

    def test_upload_patch_delete(self, admin):
        r = admin.post(f"{BASE}/gallery", files={"file": ("TEST.png", PNG, "image/png")},
                       data={"institution": "ajtai-iskola"})
        assert r.status_code == 201
        pid = r.json()["id"]
        assert r.json()["institution"] == "ajtai-iskola"
        try:
            p = admin.patch(f"{BASE}/gallery/{pid}", json={"institution": "kisbaconi-iskola"})
            assert p.status_code == 200 and p.json()["institution"] == "kisbaconi-iskola"
            g = [x for x in requests.get(f"{BASE}/gallery").json() if x["id"] == pid]
            assert g and g[0]["institution"] == "kisbaconi-iskola"
            assert admin.patch(f"{BASE}/gallery/{pid}", json={"institution": "bad"}).status_code == 422
            assert requests.patch(f"{BASE}/gallery/{pid}", json={"institution": "ajtai-iskola"}).status_code == 401
        finally:
            assert admin.delete(f"{BASE}/gallery/{pid}").status_code == 204
