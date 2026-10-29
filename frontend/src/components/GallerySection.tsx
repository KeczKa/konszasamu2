import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLang, memberName } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { GalleryPhoto } from "@/lib/types";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const FALLBACK: GalleryPhoto[] = [
  { id: "fallback-1", src: "/images/classroom.jpg?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", institution: "", created_at: "" },
  { id: "fallback-2", src: "/images/students.jpg?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", institution: "", created_at: "" },
  { id: "fallback-3", src: "/images/village.jpg?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", institution: "", created_at: "" },
  { id: "fallback-4", src: "/images/library?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", institution: "", created_at: "" },
];

export function GallerySection({ institution }: { institution?: string }) {
  const { t } = useLang();
  const { data } = useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryPhoto[]>("/gallery"), retry: 1 });
  const [chosen, setChosen] = useState("all");
  const filter = institution ?? chosen;
  const hasPhotos = !!data && data.length > 0;
  const all = hasPhotos || institution ? data ?? [] : FALLBACK;
  const photos = filter === "all" ? all : all.filter((p) => p.institution === filter);

  const [active, setActive] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const close = () => setActive(null);
  const step = (dir: number) => setActive((cur) => (cur === null ? null : (cur + dir + photos.length) % photos.length));
  const scrollTrack = (dir: number) => trackRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  const chooseFilter = (slug: string) => {
    setChosen(slug);
    trackRef.current?.scrollTo({ left: 0 });
  };

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, photos.length]);

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

      {photos.length === 0 && <p data-testid="gallery-empty" className="mt-10 text-sm text-stone-500">{t.life.empty}</p>}

      <div className={cn("relative mt-8", photos.length === 0 && "hidden")}>
        <button
          data-testid="gallery-scroll-left"
          onClick={() => scrollTrack(-1)}
          aria-label="previous"
          className="absolute -left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-ink shadow-[0_4px_16px_rgba(28,25,23,0.12)] transition-transform duration-200 hover:-translate-y-[55%] hover:scale-105 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          data-testid="gallery-scroll-right"
          onClick={() => scrollTrack(1)}
          aria-label="next"
          className="absolute -right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-ink shadow-[0_4px_16px_rgba(28,25,23,0.12)] transition-transform duration-200 hover:-translate-y-[55%] hover:scale-105 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div ref={trackRef} data-testid="gallery-track" className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((p, i) => (
            <button
              key={p.id}
              data-testid={`gallery-photo-${p.id}`}
              onClick={() => setActive(i)}
              className="group relative shrink-0 cursor-zoom-in snap-start overflow-hidden rounded-2xl border border-border p-0"
            >
              <img
                src={p.src}
                alt={p.original_filename || t.life.alts[i % t.life.alts.length]}
                className="h-64 w-52 object-cover transition-transform duration-500 group-hover:scale-105 sm:h-80 sm:w-64"
              />
              {p.institution && (
                <>
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" aria-hidden="true" />
                  <span
                    data-testid={`gallery-photo-institution-${p.id}`}
                    className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] truncate rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-cream backdrop-blur-md"
                  >
                    {memberName(t, p.institution)}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {active !== null && (
        <div
          data-testid="gallery-lightbox"
          onClick={close}
          onContextMenu={(e) => {
            e.preventDefault();
            close();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/45 backdrop-blur-sm backdrop-grayscale"
        >
          <button
            data-testid="gallery-lightbox-close"
            onClick={close}
            aria-label="close"
            className="absolute right-5 top-5 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-ink transition-transform duration-200 hover:scale-105"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            data-testid="gallery-lightbox-prev"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="previous photo"
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-ink transition-transform duration-200 hover:scale-105 sm:left-8"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[active].src}
              alt={photos[active].original_filename || t.life.alts[active % t.life.alts.length]}
              data-testid="gallery-lightbox-image"
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            />
            {photos[active].institution && (
              <p
                data-testid="gallery-lightbox-institution"
                className="absolute bottom-5 left-5 max-w-[calc(100%-2.5rem)] truncate rounded-full border border-white/25 bg-ink/30 px-5 py-2.5 text-sm font-medium tracking-wide text-cream backdrop-blur-md sm:text-base"
              >
                {memberName(t, photos[active].institution)}
              </p>
            )}
          </div>
          <button
            data-testid="gallery-lightbox-next"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="next photo"
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-ink transition-transform duration-200 hover:scale-105 sm:right-8"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </section>
  );
}
