import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useLang, pick } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { OfficialDocument } from "@/lib/types";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";

export default function Documents() {
  const { lang, t } = useLang();
  const docs = useQuery({ queryKey: ["documents"], queryFn: () => apiGet<OfficialDocument[]>("/documents"), retry: 1 });

  return (
    <div data-testid="documents-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />
      <section className="mx-auto min-h-[50vh] max-w-5xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.docsPage.overline}</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.docsPage.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">{t.docsPage.intro}</p>
        </Reveal>

        {docs.data && docs.data.length === 0 && (
          <p data-testid="documents-empty" className="mt-12 text-sm text-stone-500">{t.docsPage.empty}</p>
        )}

        <ul className="mt-12 divide-y divide-border border-y border-border">
          {(docs.data ?? []).map((d) => (
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
                  <span className="block font-heading text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-clay">
                    {pick(lang, d, "title")}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-stone-500">
                    {format(new Date(d.created_at), "yyyy.MM.dd")} · PDF · {(d.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </span>
                <span className="hidden items-center gap-1.5 text-sm font-semibold text-clay sm:flex">
                  {t.docsPage.open} <ExternalLink className="h-4 w-4" />
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
