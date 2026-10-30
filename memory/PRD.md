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

## Iteration 4 (done)
- Lightbox shows institution name on the enlarged photo; home quote section removed; footer slimmer.
- Member pages show their own gallery photos.
- Bug fix: member page news filtered client-side by institution (robust even with an older backend). Tested (iteration_4).

## Iteration 5 (done)
- PDF types (Közlemény/Határozat), required on upload, changeable; filter on /kozlemenyek.
- Events (/esemenyek): date+optional time, HU/RO name & description, location, institution or 'all'; admin+editor manage; click opens popup with grey backdrop; past events grey & inactive; home shows next 3 (replaced stats); member pages show own + 'all' events. Tested (iteration_5/6).

## Backlog
- P2: Document search; event calendar export (iCal)
