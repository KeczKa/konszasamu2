import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { Institution, Post } from "@/lib/types";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { NewsCard } from "@/components/NewsCard";
import { GallerySection } from "@/components/GallerySection";
import { Reveal } from "@/components/Reveal";

function ContactCard({ info }: { info: Institution }) {
  const { t } = useLang();
  const rows = [
    { icon: MapPin, label: t.memberPage.address, value: info.address, testid: "member-address" },
    { icon: Phone, label: t.memberPage.phone, value: info.phone, testid: "member-phone" },
    { icon: Mail, label: t.memberPage.email, value: info.email, testid: "member-email" },
  ].filter((r) => r.value);
  if (rows.length === 0) return null;
  return (
    <div data-testid="member-contacts" className="rounded-3xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]">
      <h2 className="font-heading text-xl font-semibold text-ink">{t.memberPage.contacts}</h2>
      <div className="mt-5 space-y-4 text-sm">
        {rows.map((r) => (
          <div key={r.testid} className="flex gap-3">
            <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">{r.label}</p>
              <p data-testid={r.testid} className="mt-1 break-words text-stone-800">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberInstitution() {
  const { slug } = useParams();
  const { lang, t } = useLang();
  const member = t.members.find((m) => m.slug === slug);
  const info = useQuery({ queryKey: ["institution", slug], queryFn: () => apiGet<Institution>(`/institutions/${slug}`), enabled: !!member });
  const news = useQuery({ queryKey: ["posts"], queryFn: () => apiGet<Post[]>("/news"), enabled: !!member });
  const ownNews = (news.data ?? []).filter((p) => p.institution === slug);
  if (!member) return <Navigate to="/" replace />;

  const data = info.data;
  const description = data ? pick(lang, data, "description") : "";
  const [hero, ...more] = data?.images ?? [];
  const hasContent = !!(description || hero || data?.address || data?.phone || data?.email);

  return (
    <div data-testid={`member-page-${member.slug}`} className="min-h-screen bg-cream text-ink">
      <HeaderNav />
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.nav.members}</p>
          <h1 data-testid="member-page-title" className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {member.name}
          </h1>
        </Reveal>

        {data && !hasContent && <p data-testid="member-no-content" className="mt-8 text-sm text-stone-500">{t.memberPage.noContent}</p>}

        {hasContent && (
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-8">
              {hero && (
                <img src={hero} alt={member.name} data-testid="member-hero-image" className="aspect-[16/10] w-full rounded-3xl border border-border object-cover shadow-[0_8px_32px_-4px_rgba(28,25,23,0.12)]" />
              )}
              {description && (
                <div data-testid="member-description">
                  <h2 className="font-heading text-2xl font-semibold text-ink">{t.memberPage.about}</h2>
                  <div className="mt-4 space-y-4">
                    {description.split(/\n+/).filter(Boolean).map((para, i) => (
                      <p key={i} className="text-base leading-relaxed text-stone-700">{para}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {data && <ContactCard info={data} />}
              {more.length > 0 && (
                <div data-testid="member-images" className="grid grid-cols-2 gap-3">
                  {more.map((src) => (
                    <img key={src} src={src} alt={member.name} className="aspect-square w-full rounded-2xl border border-border object-cover" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-border">
        <GallerySection institution={member.slug} />
      </div>

      <section className="border-t border-border bg-sand">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t.memberPage.news}</h2>
          {news.data && ownNews.length === 0 && <p data-testid="member-no-news" className="mt-6 text-sm text-stone-500">{t.memberPage.noNews}</p>}
          <div data-testid="member-news" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ownNews.map((p) => <NewsCard key={p.id} post={p} />)}
          </div>
        </div>
      </section>
      <FooterEditorial />
    </div>
  );
}
