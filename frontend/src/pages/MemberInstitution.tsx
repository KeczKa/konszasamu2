import { Navigate, useParams } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";

export default function MemberInstitution() {
  const { slug } = useParams();
  const { t } = useLang();
  const member = t.members.find((m) => m.slug === slug);
  if (!member) return <Navigate to="/" replace />;

  return (
    <div data-testid={`member-page-${member.slug}`} className="min-h-screen bg-cream text-ink">
      <HeaderNav />
      <section className="mx-auto min-h-[50vh] max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.nav.members}</p>
          <h1 data-testid="member-page-title" className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {member.name}
          </h1>
        </Reveal>
      </section>
      <FooterEditorial />
    </div>
  );
}
