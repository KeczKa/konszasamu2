import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Clock, Mail, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { apiPost, ApiError } from "@/lib/api";
import type { ContactMessage } from "@/lib/types";
import { HeaderNav } from "@/components/HeaderNav";
import { FooterEditorial } from "@/components/FooterEditorial";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const send = useMutation({
    mutationFn: () => apiPost<ContactMessage>("/contact", { name, email, phone: phone || null, message }),
    onSuccess: () => {
      toast.success(t.contact.successTitle, { description: t.contact.successText });
      setName(""); setEmail(""); setPhone(""); setMessage("");
    },
    onError: (err) => {
      const detail = err instanceof ApiError && typeof (err.body as { detail?: string })?.detail === "string"
        ? (err.body as { detail: string }).detail
        : t.contact.errorText;
      toast.error(t.contact.errorText, { description: detail });
    },
  });

  const info = [
    { icon: MapPin, label: t.contact.addressLabel, value: t.contact.address, testid: "contact-address" },
    { icon: Mail, label: t.contact.emailLabel, value: t.contact.email, testid: "contact-email" },
    { icon: Clock, label: t.contact.hoursLabel, value: t.contact.hours, testid: "contact-hours" },
  ];

  return (
    <div data-testid="contact-page" className="min-h-screen bg-cream text-ink">
      <HeaderNav />

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-clay">{t.contact.overline}</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.contact.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">{t.contact.intro}</p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <Reveal delay={0.1}>
            <div className="space-y-6">
              {info.map((item) => (
                <div key={item.testid} data-testid={item.testid} className="flex gap-4 rounded-2xl border border-border bg-white p-6 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl bg-forest p-6 text-forest-foreground">
                <p className="font-heading text-lg font-semibold italic">„{t.hero.motto}”</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <form
              data-testid="contact-form"
              onSubmit={(e) => { e.preventDefault(); send.mutate(); }}
              className="rounded-3xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)] sm:p-10"
            >
              <h2 className="font-heading text-xl font-semibold text-ink sm:text-2xl">{t.contact.formTitle}</h2>
              <div className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">{t.contact.nameLabel}</Label>
                    <Input id="contact-name" data-testid="contact-name-input" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">{t.contact.emailLabel}</Label>
                    <Input id="contact-email" type="email" data-testid="contact-email-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">{t.contact.phoneLabel}</Label>
                  <Input id="contact-phone" data-testid="contact-phone-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">{t.contact.messageLabel}</Label>
                  <Textarea id="contact-message" rows={6} data-testid="contact-message-input" value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={send.isPending}
                  data-testid="contact-submit-button"
                  className="w-full rounded-full bg-clay text-clay-foreground hover:bg-clay/90 transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto"
                >
                  <Send className="mr-1 h-4 w-4" />
                  {send.isPending ? t.contact.sending : t.contact.submit}
                </Button>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      <FooterEditorial />
    </div>
  );
}
