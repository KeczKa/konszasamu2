import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useLang, pick } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { OfficialDocument } from "@/lib/types";
import { DOC_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function Documents() {
  const { lang, t } = useLang();
  const docs = useQuery({ queryKey: ["documents"], queryFn: () => apiGet<OfficialDocument[]>("/documents"), retry: 1 });
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const all = docs.data ?? [];
  const years = [...new Set(all.map((d) => d.created_at.slice(0, 4)))].sort().reverse();
  const q = normalize(query.trim());
  const visible = all.filter(
    (d) =>
      (filter === "all" || d.doc_type === filter) &&
      (year === "all" || d.created_at.startsWith(year)) &&
      (!q || normalize(`${d.title_hu} ${d.title_ro} ${d.created_at.slice(0, 4)}`).includes(q))
  );

  return (
    <div data-testid="documents-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />
      <section className="mx-auto min-h-[50vh] max-w-5xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.docsPage.overline}</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.docsPage.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">{t.docsPage.intro}</p>
        </Reveal>

        <div data-testid="documents-filters" className="mt-10 flex flex-wrap gap-2">
          {["all", ...DOC_TYPES].map((k) => (
            <button
              key={k}
              data-testid={`documents-filter-${k}`}
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
                filter === k ? "border-clay bg-clay text-clay-foreground" : "border-border bg-white text-stone-700 hover:border-clay hover:text-clay"
              )}
            >
              {k === "all" ? t.docsPage.filterAll : t.docsPage.typesPlural[k]}
            </button>
          ))}
        </div>

        <div data-testid="documents-search" className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.docsPage.searchPlaceholder}
              aria-label={t.docsPage.searchPlaceholder}
              data-testid="documents-search-input"
              className="h-11 w-full rounded-full border border-border bg-white pl-11 pr-10 text-sm outline-none transition-colors duration-200 focus:border-clay [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label={t.docsPage.clearSearch}
                data-testid="documents-search-clear"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-stone-500 hover:bg-sand hover:text-clay"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label={t.docsPage.allYears}
            data-testid="documents-year-select"
            className="h-11 cursor-pointer rounded-full border border-border bg-white px-5 text-sm outline-none focus:border-clay sm:w-44"
          >
            <option value="all">{t.docsPage.allYears}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {docs.data && visible.length === 0 && (
          <p data-testid="documents-empty" className="mt-10 text-sm text-stone-500">{docs.data.length === 0 ? t.docsPage.empty : t.docsPage.emptyFiltered}</p>
        )}

        <ul className="mt-8 divide-y divide-border border-y border-border">
          {visible.map((d) => (
            <li key={d.id} data-testid={`document-row-${d.id}`}>
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                data-testid={`document-open-${d.id}`}
                className="group flex items-center gap-5 py-5 transition-colors duration-200 hover:bg-sand/60 sm:px-3"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span data-testid={`document-type-${d.id}`} className="mb-1 inline-block rounded-full bg-sand px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-clay">
                    {t.docsPage.types[d.doc_type]}
                  </span>
                  <span className="block font-heading text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-clay">
                    {pick(lang, d, "title")}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-stone-500">
                    {format(new Date(d.created_at), "yyyy.MM.dd")} · PDF · {d.size < 1024 * 1024 ? `${Math.max(1, Math.round(d.size / 1024))} KB` : `${(d.size / 1024 / 1024).toFixed(1)} MB`}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-clay">
                  <span className="hidden sm:inline">{t.docsPage.open}</span> <ExternalLink className="h-4 w-4" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <FooterEditorial />
    </div>
  );
}
