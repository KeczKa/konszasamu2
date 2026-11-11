# Regression tests: album cover choice (POST /api/gallery/{id}/cover) - iteration 9
import os
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://72f697df-da92-4fed-bfd2-6e89bf803f61.preview.emergentagent.com").rstrip("/") + "/api"
ADMIN = {"email": "admin@konszasamu.ro", "password": "Preview-Admin-2026"}
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082")
CREATED = []


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    s.headers["Authorization"] = f"Bearer {s.cookies.get('access_token')}"
    yield s
    for pid in CREATED:
        s.delete(f"{BASE}/gallery/{pid}")


def upload(s, hu, ro):
    r = s.post(f"{BASE}/gallery", files={"file": ("TEST.png", PNG, "image/png")},
               data={"institution": "ajtai-iskola", "caption_hu": hu, "caption_ro": ro})
    assert r.status_code == 201, r.text
    CREATED.append(r.json()["id"])
    return r.json()


def covers(s, ids):
    return {p["id"]: p["is_cover"] for p in requests.get(f"{BASE}/gallery").json() if p["id"] in ids}


class TestAlbumCover:
    def test_unauth_401(self, admin):
        p = upload(admin, "TEST_Cov A", "TEST_Cov A ro")
        assert requests.post(f"{BASE}/gallery/{p['id']}/cover").status_code == 401

    def test_unknown_404(self, admin):
        assert admin.post(f"{BASE}/gallery/nope-xyz/cover").status_code == 404

    def test_list_has_is_cover(self, admin):
        p = upload(admin, "TEST_Cov B", "TEST_Cov B ro")
        assert p["is_cover"] is False
        assert covers(admin, [p["id"]])[p["id"]] is False

    def test_single_cover_per_album(self, admin):
        a = [upload(admin, "TEST_Xmas", "TEST_Craciun") for _ in range(2)]
        a.append(upload(admin, "  test_xmas ", "test_CRACIUN"))  # same album case-insensitive/trimmed
        b = [upload(admin, "TEST_Farsang", "TEST_Carnaval") for _ in range(2)]
        ids = [p["id"] for p in a + b]
        r = admin.post(f"{BASE}/gallery/{b[0]['id']}/cover")
        assert r.status_code == 200 and r.json()["is_cover"] is True
        r = admin.post(f"{BASE}/gallery/{a[2]['id']}/cover")
        assert r.status_code == 200 and r.json()["is_cover"] is True
        c = covers(admin, ids)
        assert [c[p["id"]] for p in a] == [False, False, True]
        assert c[b[0]["id"]] is True  # other album unaffected
        admin.post(f"{BASE}/gallery/{a[0]['id']}/cover")
        c = covers(admin, ids)
        assert [c[p["id"]] for p in a] == [True, False, False]

    def test_caption_edit_resets_cover(self, admin):
        p = upload(admin, "TEST_Edit", "TEST_Edit ro")
        admin.post(f"{BASE}/gallery/{p['id']}/cover")
        r = admin.patch(f"{BASE}/gallery/{p['id']}", json={"caption_hu": "TEST_Edit moved"})
        assert r.status_code == 200
        assert r.json()["caption_hu"] == "TEST_Edit moved"
        assert r.json()["is_cover"] is False, "caption edit should reset is_cover"
