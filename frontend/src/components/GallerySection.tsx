import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { GalleryPhoto } from "@/lib/types";
import { Reveal } from "@/components/Reveal";

const FALLBACK: GalleryPhoto[] = [
  { id: "fallback-1", src: "/images/classroom.jpg?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", created_at: "" },
  { id: "fallback-2", src: "/images/students.jpg?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", created_at: "" },
  { id: "fallback-3", src: "/images/village.jpg?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", created_at: "" },
  { id: "fallback-4", src: "/images/library?crop=entropy&cs=srgb&fm=jpg&q=85", original_filename: "", created_at: "" },
];

export function GallerySection() {
  const { t } = useLang();
  const { data } = useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryPhoto[]>("/gallery"), retry: 1 });
  const photos = data && data.length > 0 ? data : FALLBACK;

  const [active, setActive] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const close = () => setActive(null);
  const step = (dir: number) => setActive((cur) => (cur === null ? null : (cur + dir + photos.length) % photos.length));
  const scrollTrack = (dir: number) => trackRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

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
    <section data-testid="gallery-section" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.life.overline}</p>
        <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">{t.life.title}</h2>
      </Reveal>

      <div className="relative mt-12">
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
              className="group shrink-0 cursor-zoom-in snap-start overflow-hidden rounded-2xl border border-border p-0"
            >
              <img
                src={p.src}
                alt={p.original_filename || t.life.alts[i % t.life.alts.length]}
                className="h-64 w-52 object-cover transition-transform duration-500 group-hover:scale-105 sm:h-80 sm:w-64"
              />
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
          <img
            src={photos[active].src}
            alt={photos[active].original_filename || t.life.alts[active % t.life.alts.length]}
            data-testid="gallery-lightbox-image"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          />
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
