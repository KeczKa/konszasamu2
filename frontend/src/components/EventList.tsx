import { useEffect, useRef, useState } from "react";
import { CalendarDays, MapPin, X, Building2 } from "lucide-react";
import { useLang, pick, memberName } from "@/lib/i18n";
import type { SchoolEvent } from "@/lib/types";
import { dayMonth, formatEventDate, isPast } from "@/lib/events";
import { cn } from "@/lib/utils";

function EventPopup({ ev, onClose }: { ev: SchoolEvent; onClose: () => void }) {
  const { lang, t } = useLang();
  const entered = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const description = pick(lang, ev, "description");
  return (
    <div
      data-testid="event-popup"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/45 p-5 backdrop-blur-sm backdrop-grayscale"
    >
      <div
        data-testid="event-popup-card"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => { entered.current = true; }}
        onMouseLeave={() => entered.current && onClose()}
        className="relative w-full max-w-lg animate-in fade-in zoom-in-95 rounded-3xl border border-border bg-cream p-8 text-ink shadow-[0_24px_80px_rgba(0,0,0,0.35)] duration-200"
      >
        <button
          data-testid="event-popup-close"
          onClick={onClose}
          aria-label={t.events.close}
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-sand text-ink transition-transform duration-200 hover:scale-105"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{memberName(t, ev.institution)}</p>
        <h3 data-testid="event-popup-title" className="mt-3 pr-10 font-heading text-2xl font-semibold leading-snug">{pick(lang, ev, "title")}</h3>
        <div className="mt-5 space-y-3 text-sm text-stone-700">
          <p data-testid="event-popup-date" className="flex items-center gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-clay" />{formatEventDate(ev, lang)}</p>
          <p data-testid="event-popup-location" className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0 text-clay" />{ev.location}</p>
          <p data-testid="event-popup-institution" className="flex items-center gap-3"><Building2 className="h-4 w-4 shrink-0 text-clay" />{memberName(t, ev.institution)}</p>
        </div>
        {description && (
          <p data-testid="event-popup-description" className="mt-6 whitespace-pre-line border-t border-border pt-5 text-base leading-relaxed text-stone-700">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function EventRow({ ev, onOpen, compact }: { ev: SchoolEvent; onOpen: (ev: SchoolEvent) => void; compact?: boolean }) {
  const { lang } = useLang();
  const past = isPast(ev);
  const timer = useRef<number | undefined>(undefined);
  const { day, month, year } = dayMonth(ev, lang);

  const handlers = past
    ? {}
    : {
        onMouseEnter: () => { timer.current = window.setTimeout(() => onOpen(ev), 250); },
        onMouseLeave: () => window.clearTimeout(timer.current),
        onClick: () => { window.clearTimeout(timer.current); onOpen(ev); },
      };

  return (
    <li>
      <div
        data-testid={`event-row-${ev.id}`}
        data-past={past}
        role={past ? undefined : "button"}
        tabIndex={past ? -1 : 0}
        onKeyDown={(e) => !past && e.key === "Enter" && onOpen(ev)}
        {...handlers}
        className={cn(
          "flex items-center gap-5 rounded-2xl border px-4 transition-[background-color,border-color,transform] duration-200",
          compact ? "py-3" : "py-4 sm:px-5",
          past
            ? "cursor-default border-transparent bg-stone-100/60 text-stone-400 grayscale"
            : "cursor-pointer border-border bg-white hover:-translate-y-0.5 hover:border-clay/40 hover:bg-white"
        )}
      >
        <div className={cn("flex w-14 shrink-0 flex-col items-center rounded-xl py-1.5", past ? "bg-stone-200/70" : "bg-clay/10")}>
          <span className={cn("font-heading text-2xl font-semibold leading-none", past ? "text-stone-400" : "text-clay")}>{day}</span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider">{month}</span>
          {!compact && <span className="text-[10px] opacity-70">{year}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-heading font-semibold leading-snug", compact ? "text-base" : "text-lg", past ? "text-stone-400" : "text-ink")}>
            {pick(lang, ev, "title")}
          </p>
          <p className={cn("mt-1 flex items-center gap-1.5 truncate text-sm", past ? "text-stone-400" : "text-stone-500")}>
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{ev.location}{ev.time ? ` · ${ev.time}` : ""}</span>
          </p>
        </div>
      </div>
    </li>
  );
}

export function EventList({ events, compact, testId }: { events: SchoolEvent[]; compact?: boolean; testId: string }) {
  const [open, setOpen] = useState<SchoolEvent | null>(null);
  return (
    <>
      <ul data-testid={testId} className={cn("space-y-3", compact && "space-y-2")}>
        {events.map((ev) => <EventRow key={ev.id} ev={ev} onOpen={setOpen} compact={compact} />)}
      </ul>
      {open && <EventPopup ev={open} onClose={() => setOpen(null)} />}
    </>
  );
}
