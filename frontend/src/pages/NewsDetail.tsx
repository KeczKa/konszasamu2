import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ro as roLocale, hu as huLocale } from "date-fns/locale";
import { useLang, pick } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { Post } from "@/lib/types";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const post = useQuery({ queryKey: ["post", id], queryFn: () => apiGet<Post>(`/news/${id}`), retry: 1 });
  const all = useQuery({ queryKey: ["posts"], queryFn: () => apiGet<Post[]>("/news"), retry: 1 });

  const p = post.data;
  const others = (all.data ?? []).filter((x) => x.id !== id).slice(0, 2);

  return (
    <div data-testid="news-detail-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />

      <article className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 lg:pt-16">
        <Reveal>
          <Link to="/noutati" data-testid="news-back-link" className="group flex w-fit items-center gap-2 text-sm font-semibold text-clay">
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            {t.newsPage.backToList}
          </Link>
        </Reveal>

        {post.isError && (
          <p data-testid="news-not-found" className="mt-16 text-sm text-stone-500">{t.newsPage.notFound}</p>
        )}

        {p && (
          <>
            <Reveal delay={0.1}>
              <span className="mt-8 inline-block rounded-full bg-sand px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-clay">
                {t.newsPage.categories[p.category] ?? p.category}
              </span>
              <h1 data-testid="news-detail-title" className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
                {pick(lang, p, "title")}
              </h1>
              <p className="mt-5 flex items-center gap-2 text-sm text-stone-500">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(p.created_at), "d MMMM yyyy", { locale: lang === "ro" ? roLocale : huLocale })}
              </p>
            </Reveal>

            {p.cover_image && (
              <Reveal delay={0.2}>
                <img
                  src={p.cover_image}
                  alt={pick(lang, p, "title")}
                  data-testid="news-detail-image"
                  className="mt-10 w-full rounded-3xl border border-border object-cover shadow-[0_8px_32px_-4px_rgba(28,25,23,0.12)]"
                />
              </Reveal>
            )}

            <Reveal delay={0.3}>
              <div data-testid="news-detail-content" className="mt-10 space-y-6">
                {pick(lang, p, "content").split(/\n+/).filter(Boolean).map((para, i) => (
                  <p key={i} className={i === 0
                    ? "font-heading text-lg leading-relaxed text-stone-800 sm:text-xl"
                    : "text-base leading-relaxed text-stone-700"}>
                    {para}
                  </p>
                ))}
              </div>
            </Reveal>
          </>
        )}
      </article>

      {others.length > 0 && (
        <section className="border-t border-border bg-sand">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <h2 className="font-heading text-xl font-semibold text-ink sm:text-2xl">{t.homeNews.title}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {others.map((o) => (
                <Link
                  key={o.id}
                  to={`/noutati/${o.id}`}
                  data-testid={`news-related-${o.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-6px_rgba(28,25,23,0.14)]"
                >
                  <h3 className="font-heading text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-clay">
                    {pick(lang, o, "title")}
                  </h3>
                  <ArrowRight className="h-5 w-5 shrink-0 text-clay transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <FooterEditorial />
    </div>
  );
}
