import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Crest } from "@/components/Crest";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeaderNav() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/despre", label: t.nav.about },
    { to: "/noutati", label: t.nav.news },
    { to: "/contact", label: t.nav.contact },
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

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-cream/85 border-b border-border/80">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 shrink-0">
            <Crest className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="leading-tight">
              <span className="block font-heading font-semibold text-base sm:text-lg text-ink">{t.brand.nameShort}</span>
              <span className="block text-[11px] tracking-wide text-stone-500">{t.brand.location}</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7" aria-label="main">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`nav-${l.to === "/" ? "home" : l.to.slice(1)}`}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium transition-colors duration-200 hover:text-clay",
                    isActive ? "text-clay" : "text-stone-700"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div data-testid="lang-switcher" className="flex items-center rounded-full border border-border bg-white/70 p-0.5">
              {langButton("ro", "RO")}
              {langButton("hu", "HU")}
            </div>
            <Link
              to="/contact"
              data-testid="nav-cta"
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex rounded-full bg-clay text-clay-foreground hover:bg-clay/90 transition-transform duration-200 hover:-translate-y-0.5")}
            >
              {t.nav.contact}
            </Link>
            <button
              data-testid="mobile-menu-button"
              className="md:hidden p-2 text-ink cursor-pointer"
              onClick={() => setOpen(!open)}
              aria-label="menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav data-testid="mobile-menu" className="md:hidden pb-4 flex flex-col gap-1" aria-label="mobile">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-${l.to === "/" ? "home" : l.to.slice(1)}`}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive ? "bg-sand text-clay" : "text-stone-700 hover:bg-sand"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
