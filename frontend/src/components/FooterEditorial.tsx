import { Link } from "react-router-dom";
import { Mail, MapPin, Clock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Crest } from "@/components/Crest";

export function FooterEditorial() {
  const { t } = useLang();
  return (
    <footer data-testid="footer" className="relative overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute -bottom-10 left-0 right-0 select-none text-center font-heading font-bold text-[18vw] leading-none tracking-tight text-cream/[0.04]">
        KONSZA SAMU
      </div>
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Crest className="h-11 w-11" />
              <span className="font-heading text-xl font-semibold">{t.brand.name}</span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone-300">{t.footer.tagline}</p>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{t.footer.addressLabel}</p>
                <p className="mt-1 text-stone-200">{t.footer.address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{t.footer.hoursLabel}</p>
                <p className="mt-1 text-stone-200">{t.footer.hours}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{t.footer.emailLabel}</p>
                <p className="mt-1 text-stone-200">{t.footer.email}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm md:items-end">
            <Link data-testid="footer-news-link" to="/noutati" className="text-stone-300 transition-colors duration-200 hover:text-orange-300">{t.nav.news}</Link>
            <Link data-testid="footer-about-link" to="/despre" className="text-stone-300 transition-colors duration-200 hover:text-orange-300">{t.nav.about}</Link>
            <Link data-testid="footer-contact-link" to="/contact" className="text-stone-300 transition-colors duration-200 hover:text-orange-300">{t.nav.contact}</Link>
            <Link data-testid="footer-admin-link" to="/admin/login" className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500 transition-colors duration-200 hover:text-orange-300">
              {t.footer.adminLink} →
            </Link>
          </div>
        </div>
        <div className="mt-14 border-t border-cream/10 pt-6 text-xs text-stone-500">
          © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
