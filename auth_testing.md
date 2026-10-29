# Auth Testing Playbook — Konsza Samu school site

Admin auth: JWT in httpOnly cookie `access_token` (12h), bcrypt password hash, brute-force lockout (5 fails → 15 min) via `login_attempts` collection. Admin is seeded idempotently at startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in backend/.env.

Step 1: MongoDB check — `db.users.find({role:"admin"})` should show one admin with `$2b$` hash; indexes on users.email (unique), login_attempts.identifier.

Step 2: API check:
```
curl -c cookies.txt -X POST https://iskola-frissites--8e91ytku.preview.emergentagent.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"<admin email>","password":"<admin password>"}'
curl -b cookies.txt https://iskola-frissites--8e91ytku.preview.emergentagent.com/api/auth/me
curl -b cookies.txt -X POST https://iskola-frissites--8e91ytku.preview.emergentagent.com/api/auth/logout
```
Login returns the admin user object and sets the cookie; /me returns the same user; wrong password returns 401 with a detail string; 5 wrong attempts return 429.

Protected routes (require cookie): POST/PUT/DELETE /api/news, GET /api/contact, PATCH /api/contact/{id}/resolve → all return 401 without a session.

Frontend: cookie rides same-origin fetch automatically (no auth headers); AdminDashboard redirects to /admin/login when /auth/me 401s; login page shows `detail` string on error.

Credentials live in /app/memory/test_credentials.md.

---

# Google Auth (Emergent-managed) Testing Playbook

Flow: login button → `https://auth.emergentagent.com/?redirect=<origin>/admin` → lands at `/admin#session_id=...` → App detects hash via `useLocation().hash` → AuthCallback POSTs `/api/auth/google-session` → backend exchanges session_id at `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` (header `X-Session-ID`) → user must exist in `users` by email (else 403) → `user_sessions` doc created (7-day expiry, timezone-aware) → httpOnly `session_token` cookie set.

Backend checks `access_token` (JWT, password login) first, then `session_token` cookie. RBAC: `lib/security.py` ROLE_PERMISSIONS — admin {posts, messages, gallery, users}, editor {posts, gallery}, viewer {messages}. Endpoints use `Depends(require("<perm>"))`.

Manual test without a real Google account (seed a session directly):
```
mongosh --eval "
use('app');
db.user_sessions.insertOne({
  id: 'test-sess-1', user_id: '<admin user id from db.users>',
  session_token: 'test_google_session_1',
  expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date()
});"
curl -b "session_token=test_google_session_1" https://iskola-frissites--8e91ytku.preview.emergentagent.com/api/auth/me
# cleanup:
mongosh --eval "use('app'); db.user_sessions.deleteMany({session_token: /test_google/});"
```
Expect: /me returns the admin user with permissions. Permission checks: with a viewer-role user session, POST /api/news → 403, GET /api/contact → 200; with editor, POST /api/news → 201, GET /api/users → 403. Cleanup test sessions afterwards.
