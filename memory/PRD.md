# PRD — Konsza Samu School Website (konszasamu.ro rebuild)

## Original problem statement
"I have a web site for my workplace in wordpress. i want to write the code for a web site similar to that. I give you the url: konszasamu.ro"

User choices: same structure & content with a fresh modern design; contact form saving enquiries + blog/news with admin; bilingual Romanian + Hungarian. Later: wants the project in GitLab for deployment on own Linux machine + Kubernetes cluster.

## Product
Bilingual (HU default / RO) public website + mini-CMS for Școala Gimnazială „Konsza Samu” din Bățanii Mari (Konsza Samu Általános Iskola, Nagybacon) — a Hungarian-language elementary school in Covasna County, Transylvania.

## User personas
- Parent/visitor: reads news in RO or HU, learns about the school, sends enrollment/contact enquiries.
- Teacher/admin (headmaster): logs in, publishes/edits/deletes bilingual news articles, reads and resolves contact messages.

## Architecture
- Backend: FastAPI + motor (MongoDB), all routes under /api. JWT in httpOnly cookie (12h), bcrypt, brute-force lockout (5 fails → 15 min). Admin seeded idempotently from .env at startup.
- Frontend: Vite + React 19 + TS, Tailwind v4, shadcn/ui, motion (framer-motion), lenis smooth scroll, date-fns RO/HU locales. LanguageContext persisted to localStorage ("konsza_lang_pref").
- Deploy artifacts: backend/Dockerfile, frontend/Dockerfile + nginx.conf (SPA fallback + /api proxy), deploy/k8s.yaml, .gitlab-ci.yml.

## Core requirements (static)
- Bilingual RO/HU everywhere with instant toggle
- Public pages: Home, About/History, News list, News detail, Contact
- Admin: login, article CRUD (dual RO+HU fields), message inbox with resolve toggle
- Contact form persists to MongoDB

## Implemented (2026-10-09)
- Full design system (warm stone/terracotta/forest, Lora + DM Sans + JetBrains Mono, paper grain, glass header, editorial marquee, masked-line hero reveal, parallax hero image, scroll reveals)
- Pages: Home (hero, stats, mission bento, latest 3 news, gallery, quote, CTA), AboutHistory (timeline, programs, sister schools), NewsList (featured + category filters), NewsDetail (related articles), Contact (form → DB + toast), AdminLogin, AdminDashboard (stats, posts CRUD, messages inbox)
- Backend: /api/auth/{login,logout,me}, /api/news CRUD, /api/contact POST/GET/PATCH resolve
- Seed: 6 bilingual articles (backend/seed.py, idempotent)
- Deployment: Dockerfiles, nginx conf, K8s manifests, GitLab CI pipeline

## Implemented (2026-10-14, round 2) — Google login with RBAC + editable gallery
- Emergent-managed Google Auth: "Belépés Google-fiókkal / Intră cu Google" button on /admin/login; AuthCallback exchanges session_id via backend (`POST /api/auth/google-session` → Emergent session-data endpoint); 7-day `session_token` httpOnly cookie; password login kept as fallback. Only PRE-REGISTERED emails get in (403 otherwise).
- RBAC (`lib/security.py` ROLE_PERMISSIONS): admin = posts+messages+gallery+users; editor = posts+gallery; viewer = messages. Enforced server-side via `Depends(require(perm))` on all protected routes; /auth/me returns permissions; dashboard tabs/stats render per permission.
- User management: admin-only tab (Felhasználók/Utilizatori) — add by email+name+role, change role, delete (self-delete blocked). Users then log in with their @konszasamu.ro Google account.
- Editable gallery: `gallery_photos` collection; upload (JPG/PNG/WebP/GIF, ≤10MB) → Emergent object storage (`lib/storage.py`), served via `/api/gallery/image/{id}`; soft delete; 4 seeded external photos. Public home gallery: horizontal carousel with left/right arrows; click photo → lightbox with grayscale backdrop, prev/next + ESC/X; right-click closes (per user spec).
- Verified: RBAC matrix via curl with seeded sessions (viewer 403 on posts/users, 200 messages; editor 201 posts + gallery upload, 403 messages/users), upload→serve→delete round-trip through object storage, logout kills session, fake session_id → 401, browser pass of lightbox/right-click/dashboard tabs. Real Google OAuth round-trip NOT tested (needs a real Google account).
## Implemented (2026-10-14) — merged user's GitLab `dev` branch
- User's repo received via GitLab export bundle (branch `dev`), diffed and merged into workspace.
- Adopted: user's `.gitlab-ci.yml` (buildx + `suliweb` runner + kubectl deploy to `dev` namespace), `deploy/k8s.yaml` (dev namespace, `gitlab-registry` pull secret, `registry.gitlab.com/konszasamu/webpage/*` images, host `dev.konszasamu.ro`), hardened `frontend/Dockerfile` (buildx platform, npm registry pin, network timeout), new `frontend/.dockerignore`, minimal `backend/requirements.txt`, QueryClient defaults (staleTime 30s, retry 1, no refetchOnWindowFocus).
- NOT adopted (would break preview/app): user's stripped `package.json` (drops @base-ui/shadcn deps used by components/ui), stripped `vite.config.ts` (drops /api proxy + platform plugins), `api.ts` rewrite (renames ApiError.body → detail; pages use .body). Root-cause fix instead: `vite.config.ts` now loads both @emergentbase plugins dynamically with try/catch so off-platform (local/Docker/CI) builds succeed with the same file; platform tarballs verified publicly fetchable.
- Verified after merge: typecheck clean, both services up, /api via Vite proxy + public URL OK (7 posts), overlay probe 200, home screenshot OK.

## Verified
- curl: news list (6 posts), login 401/200, /me, contact create/list, auth guard 401, news create/delete — all via public URL
- yarn typecheck clean
- Browser pass: RO switch, news browsing, article open, contact submit (toast), admin login → dashboard → messages tab

## Backlog
- P0 (user-driven): push to GitLab (Save → Save to GitLab), provision own MongoDB + K8s deploy using repo manifests
- P1: image upload for article covers (object storage), real school photos replacing Unsplash, editable contact info/address, events calendar page, teacher/staff directory page
- P2: email notification on new contact message (Resend), public announcements banner, article search + pagination, SEO metadata per page

## Next tasks
1. User pushes repo to GitLab and sets secrets
2. Optional: swap placeholder imagery/text with real school content
3. Optional: P1 features on request
