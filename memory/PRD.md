# Konsza Samu school website – PRD
## Original request (improvements)
1. "Kapcsolat" only as header right button. 2. Footer: remove Hírek/Iskolánkról/Kapcsolat links; contact info right; "Tanári portál" middle, bigger. 3. New menu "Tagintézmények" with submenus Ajtai Iskola, Kisbaconi Iskola, Kisbaconi Óvoda, Nagybaconi Óvoda, Ajtai Óvoda (title-only pages, fixed text). 4–6. Remove marquee strip, "Kik vagyunk" section, "Szeretnél megismerni minket?" band.
## Stack
Vite React TS frontend (/app/frontend), FastAPI + MongoDB backend. RO/HU i18n in src/lib/i18n.tsx.
## Implemented (Jun 2026)
- All 6 items done; member pages at /tagintezmenyek/:slug (MemberInstitution.tsx); added "start" script for supervisor. Tested 100%.
## Backlog
- Content for member institution pages (photos, description, contacts)
