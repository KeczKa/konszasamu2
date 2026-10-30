import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLang, memberName } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { SchoolEvent } from "@/lib/types";
import { splitEvents } from "@/lib/events";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { EventList } from "@/components/EventList";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

export default function Events() {
  const { t } = useLang();
  const [filter, setFilter] = useState("all");
  const events = useQuery({ queryKey: ["events"], queryFn: () => apiGet<SchoolEvent[]>("/events"), retry: 1 });
  const visible = (events.data ?? []).filter((e) => filter === "all" || e.institution === filter || e.institution === "all");
  const { upcoming, past } = splitEvents(visible);

  return (
    <div data-testid="events-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />
      <section className="mx-auto min-h-[50vh] max-w-5xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.events.overline}</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.events.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">{t.events.intro}</p>
        </Reveal>

        <div data-testid="events-filters" className="mt-10 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
          {["all", ...t.members.map((m) => m.slug)].map((slug) => (
            <button
              key={slug}
              data-testid={`events-filter-${slug}`}
              aria-pressed={filter === slug}
              onClick={() => setFilter(slug)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
                filter === slug ? "border-clay bg-clay text-clay-foreground" : "border-border bg-white text-stone-700 hover:border-clay hover:text-clay"
              )}
            >
              {slug === "all" ? t.events.filterAll : memberName(t, slug)}
            </button>
          ))}
        </div>

        <h2 className="mt-12 font-heading text-2xl font-semibold text-ink">{t.events.upcoming}</h2>
        {events.data && upcoming.length === 0 && <p data-testid="events-empty" className="mt-4 text-sm text-stone-500">{t.events.empty}</p>}
        <div className="mt-6"><EventList events={upcoming} testId="events-upcoming" /></div>

        {past.length > 0 && (
          <>
            <h2 className="mt-14 font-heading text-2xl font-semibold text-stone-400">{t.events.past}</h2>
            <div className="mt-6"><EventList events={past} testId="events-past" /></div>
          </>
        )}
      </section>
      <FooterEditorial />
    </div>
  );
}
