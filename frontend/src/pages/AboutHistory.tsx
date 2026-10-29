import { BookOpen, GraduationCap, Users } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";

const LIBRARY_IMG = "/images/library.jpg?crop=entropy&cs=srgb&fm=jpg&q=85";
const VILLAGE_IMG = "/images/village.jpg?crop=entropy&cs=srgb&fm=jpg&q=85";
const PROGRAM_ICONS = [GraduationCap, BookOpen, Users];

export default function AboutHistory() {
  const { t } = useLang();

  return (
    <div data-testid="about-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 lg:pt-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.about.overline}</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.about.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">{t.about.intro}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <img src={VILLAGE_IMG} alt={t.brand.location} className="aspect-[4/3] w-full rounded-3xl border border-border object-cover shadow-[0_8px_32px_-4px_rgba(28,25,23,0.12)]" />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <Reveal>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t.about.historyTitle}</h2>
        </Reveal>
        <div className="relative mt-12 space-y-0 border-l-2 border-clay/30 pl-8 sm:pl-12">
          {t.about.timeline.map((item, i) => (
            <Reveal key={item.year} delay={i * 0.08}>
              <div data-testid={`timeline-item-${i}`} className="relative pb-12 last:pb-0">
                <span className="absolute -left-[41px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-clay bg-cream sm:-left-[57px]" aria-hidden="true" />
                <p className="font-mono text-sm font-semibold tracking-widest text-clay">{item.year}</p>
                <h3 className="mt-2 font-heading text-xl font-semibold text-ink sm:text-2xl">{item.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2">
          <Reveal>
            <img src={LIBRARY_IMG} alt={t.life.alts[3]} className="w-full rounded-3xl border border-cream/10 object-cover shadow-[0_16px_48px_-8px_rgba(0,0,0,0.5)]" />
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{t.about.programsTitle}</h2>
            <div className="mt-8 space-y-6">
              {t.about.programs.map((p, i) => {
                const Icon = PROGRAM_ICONS[i];
                return (
                  <div key={p.title} data-testid={`program-${i}`} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay/20 text-orange-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-lg font-semibold">{p.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-stone-300">{p.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <Reveal>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t.about.sisterTitle}</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {t.about.sister.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.1}>
              <div data-testid={`sister-school-${i}`} className="h-full rounded-2xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-6px_rgba(28,25,23,0.14)]">
                <h3 className="font-heading text-lg font-semibold text-ink sm:text-xl">{s.name}</h3>
                <p className="mt-2 text-sm text-stone-500">{s.place}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <FooterEditorial />
    </div>
  );
}
