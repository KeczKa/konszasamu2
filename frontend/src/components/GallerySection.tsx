import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useLang, memberName, pick } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { GalleryPhoto } from "@/lib/types";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const pillCls = "rounded-full border border-white/25 bg-white/10 font-medium tracking-wide text-cream backdrop-blur-md";

interface Album {
  key: string;
  photos: GalleryPhoto[];
}

const albumKey = (p: GalleryPhoto) => `${p.caption_hu.trim().toLowerCase()}|${p.caption_ro.trim().toLowerCase()}`;
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function groupAlbums(photos: GalleryPhoto[]): Album[] {
  const map = new Map<string, GalleryPhoto[]>();
  photos.forEach((p) => {
    const k = albumKey(p);
    map.set(k, [...(map.get(k) ?? []), p]);
  });
  return [...map.entries()].map(([key, list]) => ({ key, photos: list }));
}

function AlbumCard({ album, onOpen }: { album: Album; onOpen: () => void }) {
  const { lang, t } = useLang();
  const cover = album.photos.find((p) => p.is_cover) ?? album.photos[0];
  const institutions = [...new Set(album.photos.map((p) => p.institution))];
  const caption = pick(lang, cover, "caption");
  const id = slugify(cover.caption_hu || cover.id);

  return (
    <button
      data-testid={`gallery-album-${id}`}
      onClick={onOpen}
      className="group relative shrink-0 cursor-zoom-in snap-start p-0 text-left"
    >
      {album.photos.length > 1 && (
        <>
          <span aria-hidden="true" className="absolute inset-0 translate-x-2 -translate-y-2 rotate-2 rounded-2xl border border-border bg-sand transition-transform duration-300 group-hover:translate-x-3 group-hover:rotate-3" />
          <span aria-hidden="true" className="absolute inset-0 translate-x-1 -translate-y-1 rotate-1 rounded-2xl border border-border bg-white transition-transform duration-300 group-hover:rotate-[1.5deg]" />
        </>
      )}
      <span className="relative block overflow-hidden rounded-2xl border border-border">
        <img
          src={cover.src}
          alt={caption || cover.original_filename}
          className="h-64 w-52 object-cover transition-transform duration-500 group-hover:scale-105 sm:h-80 sm:w-64"
        />
        <span className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/55" aria-hidden="true" />
        {caption && (
          <span
            data-testid={`gallery-album-caption-${id}`}
            className={cn(pillCls, "absolute right-3 top-3 line-clamp-2 max-w-[calc(100%-1.5rem)] rounded-2xl px-3.5 py-1.5 text-right text-xs")}
          >
            {caption}
          </span>
        )}
        <span className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-2">
          {institutions.length === 1 && (
            <span data-testid={`gallery-album-institution-${id}`} className={cn(pillCls, "max-w-full truncate px-4 py-2 text-xs")}>
              {memberName(t, institutions[0])}
            </span>
          )}
          <span data-testid={`gallery-album-count-${id}`} className={cn(pillCls, "flex items-center gap-1.5 bg-ink/30 px-3 py-1.5 text-xs")}>
            <Images className="h-3.5 w-3.5" /> {album.photos.length} {t.life.photos}
          </span>
        </span>
      </span>
    </button>
  );
}

function Lightbox({ photos, start, onClose }: { photos: GalleryPhoto[]; start: number; onClose: () => void }) {
  const { lang, t } = useLang();
  const [active, setActive] = useState(start);
  const step = (dir: number) => setActive((cur) => (cur + dir + photos.length) % photos.length);
  const photo = photos[active];
  const multi = photos.length > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length]);

  const navBtn = (dir: number) => (
    <button
      data-testid={dir < 0 ? "gallery-lightbox-prev" : "gallery-lightbox-next"}
      onClick={(e) => { e.stopPropagation(); step(dir); }}
      aria-label={dir < 0 ? "previous photo" : "next photo"}
      className={cn(
        "absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-ink transition-transform duration-200 hover:scale-105",
        dir < 0 ? "left-4 sm:left-8" : "right-4 sm:right-8"
      )}
    >
      {dir < 0 ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );

  return (
    <div
      data-testid="gallery-lightbox"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-stone-900/45 backdrop-blur-sm backdrop-grayscale"
    >
      <button
        data-testid="gallery-lightbox-close"
        onClick={onClose}
        aria-label="close"
        className="absolute right-5 top-5 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-ink transition-transform duration-200 hover:scale-105"
      >
        <X className="h-5 w-5" />
      </button>
      {multi && navBtn(-1)}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.src}
          alt={pick(lang, photo, "caption") || photo.original_filename}
          data-testid="gallery-lightbox-image"
          onContextMenu={(e) => e.preventDefault()}
          className="max-h-[75vh] min-w-[min(85vw,22rem)] max-w-[90vw] rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        />
        {pick(lang, photo, "caption") && (
          <p
            data-testid="gallery-lightbox-caption"
            className="absolute right-5 top-5 max-w-[calc(100%-2.5rem)] rounded-2xl border border-white/25 bg-ink/30 px-5 py-2.5 text-right text-sm font-medium tracking-wide text-cream backdrop-blur-md sm:text-base"
          >
            {pick(lang, photo, "caption")}
          </p>
        )}
        {photo.institution && (
          <p
            data-testid="gallery-lightbox-institution"
            className="absolute bottom-5 left-5 line-clamp-2 max-w-[calc(100%-7rem)] rounded-2xl border border-white/25 bg-ink/30 px-5 py-2.5 text-sm font-medium tracking-wide text-cream backdrop-blur-md sm:text-base"
          >
            {memberName(t, photo.institution)}
          </p>
        )}
        {multi && (
          <p data-testid="gallery-lightbox-counter" className="absolute bottom-5 right-5 rounded-full border border-white/25 bg-ink/30 px-4 py-2.5 font-mono text-xs text-cream backdrop-blur-md">
            {active + 1} {t.life.albumOf} {photos.length}
          </p>
        )}
      </div>
      {multi && (
        <div data-testid="gallery-lightbox-thumbs" onClick={(e) => e.stopPropagation()} className="flex max-w-[90vw] gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((p, i) => (
            <button
              key={p.id}
              data-testid={`gallery-lightbox-thumb-${i}`}
              onClick={() => setActive(i)}
              className={cn(
                "h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-[opacity,border-color] duration-200",
                i === active ? "border-cream opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={p.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {multi && navBtn(1)}
    </div>
  );
}

export function GallerySection({ institution }: { institution?: string }) {
  const { t } = useLang();
  const { data } = useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryPhoto[]>("/gallery"), retry: 1 });
  const [chosen, setChosen] = useState("all");
  const filter = institution ?? chosen;
  const hasPhotos = !!data && data.length > 0;
  const albums = useMemo(
    () => groupAlbums((data ?? []).filter((p) => filter === "all" || p.institution === filter)),
    [data, filter]
  );
  const [open, setOpen] = useState<Album | null>(null);
  const [overflows, setOverflows] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [albums]);

  const scrollTrack = (dir: number) => trackRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  const chooseFilter = (slug: string) => {
    setChosen(slug);
    trackRef.current?.scrollTo({ left: 0 });
  };

  if (!institution && !hasPhotos) return null;

  const arrow = (dir: number) => (
    <button
      data-testid={dir < 0 ? "gallery-scroll-left" : "gallery-scroll-right"}
      onClick={() => scrollTrack(dir)}
      aria-label={dir < 0 ? "previous" : "next"}
      className={cn(
        "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-ink shadow-[0_4px_16px_rgba(28,25,23,0.12)] transition-transform duration-200 hover:-translate-y-[55%] hover:scale-105 md:flex",
        dir < 0 ? "-left-4" : "-right-4"
      )}
    >
      {dir < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );

  return (
    <section data-testid="gallery-section" className={cn("mx-auto max-w-7xl px-5 sm:px-8", institution ? "py-16" : "py-20 sm:py-28")}>
      <Reveal>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.life.overline}</p>
        <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">{t.life.title}</h2>
      </Reveal>

      {hasPhotos && !institution && (
        <div data-testid="gallery-filters" className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
          {["all", ...t.members.map((m) => m.slug)].map((slug) => (
            <button
              key={slug}
              data-testid={`gallery-filter-${slug}`}
              aria-pressed={filter === slug}
              onClick={() => chooseFilter(slug)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
                filter === slug ? "border-clay bg-clay text-clay-foreground" : "border-border bg-white text-stone-700 hover:border-clay hover:text-clay"
              )}
            >
              {slug === "all" ? t.life.filterAll : memberName(t, slug)}
            </button>
          ))}
        </div>
      )}

      {albums.length === 0 && <p data-testid="gallery-empty" className="mt-10 text-sm text-stone-500">{t.life.empty}</p>}

      <div className={cn("relative mt-8", albums.length === 0 && "hidden")}>
        {overflows && arrow(-1)}
        {overflows && arrow(1)}
        <div ref={trackRef} data-testid="gallery-track" className="flex snap-x gap-6 overflow-x-auto px-1 pb-2 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {albums.map((a) => <AlbumCard key={a.key} album={a} onOpen={() => setOpen(a)} />)}
        </div>
      </div>

      {open && <Lightbox photos={open.photos} start={Math.max(0, open.photos.findIndex((p) => p.is_cover))} onClose={() => setOpen(null)} />}
    </section>
  );
}
