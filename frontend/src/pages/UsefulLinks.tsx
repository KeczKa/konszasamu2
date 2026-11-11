import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Globe, MapPin, Phone } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { UsefulLink } from "@/lib/types";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";

function LinkCard({ link }: { link: UsefulLink }) {
  const { t } = useLang();
  return (
    <div data-testid={`link-card-${link.id}`} className="flex flex-col rounded-3xl border border-border bg-white p-6 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-6px_rgba(28,25,23,0.14)]">
      <h2 className="font-heading text-lg font-semibold leading-snug text-ink">{link.name}</h2>
      <div className="mt-4 flex-1 space-y-2.5 text-sm text-stone-700">
        {link.address && <p className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay" />{link.address}</p>}
        {link.phone && (
          <a href={`tel:${link.phone.replace(/\s/g, "")}`} className="flex gap-2.5 transition-colors duration-200 hover:text-clay">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-clay" />{link.phone}
          </a>
        )}
      </div>
      {link.url && (
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          data-testid={`link-website-${link.id}`}
          className="group mt-5 inline-flex items-center gap-2 self-start rounded-full bg-clay/10 px-4 py-2 text-sm font-semibold text-clay transition-colors duration-200 hover:bg-clay hover:text-clay-foreground"
        >
          <Globe className="h-4 w-4" /> {t.linksPage.website}
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>
      )}
    </div>
  );
}

export default function UsefulLinks() {
  const { t } = useLang();
  const links = useQuery({ queryKey: ["links"], queryFn: () => apiGet<UsefulLink[]>("/links"), retry: 1 });

  return (
    <div data-testid="links-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />
      <section className="mx-auto min-h-[50vh] max-w-6xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.linksPage.overline}</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.linksPage.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">{t.linksPage.intro}</p>
        </Reveal>
        {links.data?.length === 0 && <p data-testid="links-empty" className="mt-12 text-sm text-stone-500">{t.linksPage.empty}</p>}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(links.data ?? []).map((l) => <LinkCard key={l.id} link={l} />)}
        </div>
      </section>
      <FooterEditorial />
    </div>
  );
}
