import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ro as roLocale, hu as huLocale } from "date-fns/locale";
import { useLang, pick, memberName } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { Post } from "@/lib/types";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

export default function NewsList() {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<string>("all");
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => apiGet<Post[]>("/news"), retry: 1 });

  const all = posts.data ?? [];
  const filtered = filter === "all" ? all : all.filter((p) => p.institution === filter);
  const [featured, ...rest] = filtered;

  const fmt = (iso: string) => format(new Date(iso), "d MMMM yyyy", { locale: lang === "ro" ? roLocale : huLocale });

  return (
    <div data-testid="news-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.newsPage.overline}</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.newsPage.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">{t.newsPage.intro}</p>
        </Reveal>

        <Reveal delay={0.15}>
          <div data-testid="news-filters" className="mt-10 flex flex-wrap gap-2">
            {["all", ...t.members.map((m) => m.slug)].map((c) => (
              <button
                key={c}
                data-testid={`news-filter-${c}`}
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                  filter === c ? "border-clay bg-clay text-clay-foreground" : "border-border bg-white text-stone-600 hover:border-clay/40 hover:text-clay"
                )}
              >
                {c === "all" ? t.newsPage.all : memberName(t, c)}
              </button>
            ))}
          </div>
        </Reveal>

        {filtered.length === 0 && (
          <p data-testid="news-empty" className="mt-16 text-sm text-stone-500">{t.newsPage.empty}</p>
        )}

        {featured && (
          <Reveal delay={0.2}>
            <Link
              to={`/noutati/${featured.id}`}
              data-testid="news-featured"
              className="group mt-10 grid overflow-hidden rounded-3xl border border-border bg-white shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-8px_rgba(28,25,23,0.16)] lg:grid-cols-2"
            >
              {featured.cover_image && (
                <div className="overflow-hidden">
                  <img src={featured.cover_image} alt={pick(lang, featured, "title")} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              )}
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <span className="w-fit rounded-full bg-clay/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-clay">
                  {t.newsPage.featuredBadge} · {memberName(t, featured.institution)}
                </span>
                <h2 className="mt-5 font-heading text-2xl font-semibold leading-tight text-ink transition-colors duration-200 group-hover:text-clay sm:text-3xl">
                  {pick(lang, featured, "title")}
                </h2>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-600 sm:text-base">{pick(lang, featured, "content")}</p>
                <p className="mt-6 flex items-center gap-2 text-xs text-stone-500">
                  <CalendarDays className="h-3.5 w-3.5" /> {fmt(featured.created_at)}
                </p>
              </div>
            </Link>
          </Reveal>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link
                to={`/noutati/${p.id}`}
                data-testid={`news-card-${p.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-6px_rgba(28,25,23,0.14)]"
              >
                {p.cover_image && (
                  <div className="overflow-hidden">
                    <img src={p.cover_image} alt={pick(lang, p, "title")} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <span className="w-fit rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-clay">
                    {memberName(t, p.institution)}
                  </span>
                  <h3 className="mt-3 font-heading text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-clay">
                    {pick(lang, p, "title")}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-600">{pick(lang, p, "content")}</p>
                  <p className="mt-4 flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />{fmt(p.created_at)}</span>
                    <span className="flex items-center gap-1 font-semibold text-clay">
                      {t.newsPage.readMore}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <FooterEditorial />
    </div>
  );
}
