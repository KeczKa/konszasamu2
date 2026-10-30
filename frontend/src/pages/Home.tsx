import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ro as roLocale, hu as huLocale } from "date-fns/locale";
import { useLang, pick } from "@/lib/i18n";
import { apiGet } from "@/lib/api";
import type { Post, SchoolEvent } from "@/lib/types";
import { splitEvents } from "@/lib/events";
import { EventList } from "@/components/EventList";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { MaskedLine, Reveal, FadeIn } from "@/components/Reveal";
import { GallerySection } from "@/components/GallerySection";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_IMG = "/images/mainphoto.jpg?crop=entropy&cs=srgb&fm=jpg&q=85";

export default function Home() {
  const { lang, t } = useLang();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 700], [0, 90]);
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => apiGet<Post[]>("/news"), retry: 1 });
  const latest = (posts.data ?? []).slice(0, 3);
  const events = useQuery({ queryKey: ["events"], queryFn: () => apiGet<SchoolEvent[]>("/events"), retry: 1 });
  const nextEvents = splitEvents(events.data ?? []).upcoming.slice(0, 3);

  return (
    <div data-testid="home-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-24 lg:pb-24">
          <div className="flex flex-col justify-center">
            <FadeIn>
              <p data-testid="hero-overline" className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">
                {t.hero.overline}
              </p>
            </FadeIn>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {t.hero.lines.map((line, i) => (
                <MaskedLine key={line} delay={0.08 + i * 0.14}>
                  <span className={i === 1 ? "italic text-clay" : undefined}>{line}</span>
                </MaskedLine>
              ))}
            </h1>
            <FadeIn delay={0.55}>
              <p data-testid="hero-motto" className="mt-6 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
                {t.hero.motto}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/noutati"
                  data-testid="hero-cta-news"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-clay text-clay-foreground hover:bg-clay/90 transition-transform duration-200 hover:-translate-y-0.5")}
                >
                  {t.hero.ctaPrimary} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div data-testid="home-events" className="mt-12 border-t border-border pt-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.events.homeTitle}</h2>
                  <Link to="/esemenyek" data-testid="home-events-view-all" className="group flex items-center gap-1.5 text-sm font-semibold text-clay">
                    {t.events.viewAll}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
                {events.data && nextEvents.length === 0 && <p data-testid="home-events-empty" className="mt-4 text-sm text-stone-500">{t.events.empty}</p>}
                <div className="mt-4"><EventList events={nextEvents} compact testId="home-events-list" /></div>
              </div>
            </FadeIn>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl border border-clay/25" aria-hidden="true" />
            <motion.figure style={{ y: parallaxY }} className="relative overflow-hidden rounded-3xl shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06),0_24px_64px_-8px_rgba(28,25,23,0.18)]">
              <img
                src={HERO_IMG}
                alt={t.brand.location}
                data-testid="hero-image"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
            </motion.figure>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-sand">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.homeNews.overline}</p>
              <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                {t.homeNews.title}
              </h2>
            </div>
            <Link to="/noutati" data-testid="home-news-view-all" className="group flex items-center gap-2 text-sm font-semibold text-clay">
              {t.homeNews.viewAll}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {latest.length === 0 && (
              <p data-testid="home-news-empty" className="text-sm text-stone-500">{t.homeNews.empty}</p>
            )}
            {latest.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.1}>
                <Link
                  to={`/noutati/${p.id}`}
                  data-testid={`home-news-card-${p.id}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-border bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-6px_rgba(28,25,23,0.14)]"
                >
                  {p.cover_image && (
                    <div className="overflow-hidden">
                      <img src={p.cover_image} alt={pick(lang, p, "title")} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="flex items-center gap-2 text-xs text-stone-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(p.created_at), "d MMMM yyyy", { locale: lang === "ro" ? roLocale : huLocale })}
                    </p>
                    <h3 className="mt-3 font-heading text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-clay">
                      {pick(lang, p, "title")}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{pick(lang, p, "content")}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <GallerySection />

      <FooterEditorial />
    </div>
  );
}
