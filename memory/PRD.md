# Konsza Samu school website – PRD
## Stack
Vite React TS frontend (/app/frontend), FastAPI + MongoDB backend (/app/backend). RO/HU i18n in src/lib/i18n.tsx. Self-hosted on k8s (deploy/k8s.yaml); uploads on PVC at PHOTO_STORAGE_DIR=/app/uploads.

## Iteration 1 (done)
Kapcsolat only in header right; footer reorganised (Tanári portál centre, contact info right); Tagintézmények dropdown; marquee, "Kik vagyunk", "Szeretnél megismerni minket?" removed.

## Iteration 2 (done, Jun 2026) – tested 100% (iteration_2.json)
- Tagintézmények: + Nagybaconi Iskola (6 total). Pages show images, description (HU/RO), address/phone/email, editable in admin tab "Tagintézmények" (admin+editor); and list that institution's news.
- News: required institution (replaces old categories); /noutati filters by institution; titles "Hírek"/"Noutăți". Existing news/photos auto-assigned to nagybaconi-iskola at startup.
- Közlemények és határozatok (/kozlemenyek): public PDF list; admin-only upload/delete; stored in konszasamu/documents/ on the same volume.
- Gallery: institution required on upload, changeable per photo; institution name overlay on public gallery + lightbox.
- Preview-only backend/.env created (local Mongo, preview admin) – production uses k8s secret.

## Iteration 3 (done)
- Removed "Testvériskolák" section (About) and "Magyar nyelvű oktatás" hero badge.
- Home gallery: one-tap institution filter chips (Mind + 6); institution name shown as frosted pill on each photo.

## Backlog
- P1: Show institution gallery on member page
- P2: Document categories (közlemény vs határozat), search
