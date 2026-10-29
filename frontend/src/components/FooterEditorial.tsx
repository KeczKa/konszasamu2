import { Link } from "react-router-dom";
import { Mail, MapPin, Clock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Crest } from "@/components/Crest";

export function FooterEditorial() {
  const { t } = useLang();
  return (
    <footer data-testid="footer" className="relative overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute -bottom-4 left-0 right-0 select-none text-center font-heading font-bold text-[10vw] leading-none tracking-tight text-cream/[0.04]">
        KONSZA SAMU
      </div>
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-3 md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Crest className="h-9 w-9" />
              <span className="font-heading text-xl font-semibold">{t.brand.name}</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-300">{t.footer.tagline}</p>
          </div>
          <div className="flex md:items-center md:justify-center">
            <Link data-testid="footer-admin-link" to="/admin/login" className="font-heading text-2xl font-semibold text-cream transition-colors duration-200 hover:text-orange-300 sm:text-3xl">
              {t.footer.adminLink} →
            </Link>
          </div>
          <div className="space-y-2.5 text-sm md:justify-self-end">
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
        </div>
        <div className="mt-8 border-t border-cream/10 pt-4 text-xs text-stone-500">
          © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
