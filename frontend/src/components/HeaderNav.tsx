import { Fragment, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Crest } from "@/components/Crest";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navCls = (isActive: boolean) =>
  cn("text-sm font-medium transition-colors duration-200 hover:text-clay", isActive ? "text-clay" : "text-stone-700");
const mobileCls = (isActive: boolean) =>
  cn("px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200", isActive ? "bg-sand text-clay" : "text-stone-700 hover:bg-sand");
const testId = (to: string) => (to === "/" ? "home" : to.slice(1));

export function HeaderNav() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/despre", label: t.nav.about },
    { to: "/noutati", label: t.nav.news },
    { to: "/esemenyek", label: t.nav.events },
    { to: "/kozlemenyek", label: t.nav.documents },
  ];

  const langButton = (l: Lang, label: string) => (
    <button
      key={l}
      data-testid={`lang-switch-${l}`}
      aria-pressed={lang === l}
      onClick={() => setLang(l)}
      className={cn(
        "px-2.5 py-1 text-xs font-semibold tracking-widest rounded-full transition-colors duration-200 cursor-pointer",
        lang === l ? "bg-clay text-clay-foreground" : "text-stone-600 hover:text-clay"
      )}
    >
      {label}
    </button>
  );

  const membersDropdown = (
    <div className="group relative" data-testid="nav-members">
      <button
        data-testid="nav-members-trigger"
        className={cn(navCls(location.pathname.startsWith("/tagintezmenyek")), "flex items-center gap-1 cursor-pointer")}
      >
        {t.nav.members}
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div data-testid="nav-members-dropdown" className="w-60 rounded-2xl border border-border bg-cream p-2 shadow-[0_12px_40px_-6px_rgba(28,25,23,0.18)]">
          {t.members.map((m) => (
            <NavLink
              key={m.slug}
              to={`/tagintezmenyek/${m.slug}`}
              data-testid={`nav-member-${m.slug}`}
              className={({ isActive }) =>
                cn("block rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-sand hover:text-clay", isActive ? "bg-sand text-clay" : "text-stone-700")
              }
            >
              {m.name}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );

  const mobileMembers = (
    <div data-testid="mobile-nav-members" className="flex flex-col gap-1">
      <p className="px-3 pt-2.5 pb-1 text-sm font-medium text-stone-500">{t.nav.members}</p>
      {t.members.map((m) => (
        <NavLink
          key={m.slug}
          to={`/tagintezmenyek/${m.slug}`}
          onClick={() => setOpen(false)}
          data-testid={`mobile-nav-member-${m.slug}`}
          className={({ isActive }) => cn(mobileCls(isActive), "pl-7")}
        >
          {m.name}
        </NavLink>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-cream/85 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-4">
          <Link to="/" data-testid="nav-logo" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Crest className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="leading-tight">
              <span className="block whitespace-nowrap font-heading font-semibold text-sm sm:text-lg text-ink">{t.brand.nameShort}</span>
              <span className="hidden sm:block text-[11px] tracking-wide text-stone-500">{t.brand.location}</span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-6" aria-label="main">
            {links.map((l, i) => (
              <Fragment key={l.to}>
                <NavLink to={l.to} data-testid={`nav-${testId(l.to)}`} className={({ isActive }) => navCls(isActive)}>
                  {l.label}
                </NavLink>
                {i === 1 && membersDropdown}
              </Fragment>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div data-testid="lang-switcher" className="flex items-center rounded-full border border-border bg-white/70 p-0.5">
              {langButton("ro", "RO")}
              {langButton("hu", "HU")}
            </div>
            <Link
              to="/contact"
              data-testid="nav-cta"
              className={cn(buttonVariants({ size: "sm" }), "inline-flex shrink-0 px-2.5 sm:px-3 rounded-full bg-clay text-clay-foreground hover:bg-clay/90 transition-transform duration-200 hover:-translate-y-0.5")}
            >
              {t.nav.contact}
            </Link>
            <button
              data-testid="mobile-menu-button"
              className="xl:hidden p-1.5 text-ink cursor-pointer"
              onClick={() => setOpen(!open)}
              aria-label="menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav data-testid="mobile-menu" className="xl:hidden pb-4 flex flex-col gap-1" aria-label="mobile">
            {links.map((l, i) => (
              <Fragment key={l.to}>
                <NavLink
                  to={l.to}
                  onClick={() => setOpen(false)}
                  data-testid={`mobile-nav-${testId(l.to)}`}
                  className={({ isActive }) => mobileCls(isActive)}
                >
                  {l.label}
                </NavLink>
                {i === 1 && mobileMembers}
              </Fragment>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
