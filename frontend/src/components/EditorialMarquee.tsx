import { useLang } from "@/lib/i18n";

export function EditorialMarquee() {
  const { t } = useLang();
  const items = t.marquee;
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-8 font-heading text-lg sm:text-xl italic text-stone-600">{item}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-clay/60" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
  return (
    <div data-testid="editorial-marquee" className="overflow-hidden border-y border-border bg-sand py-4" aria-hidden="true">
      <div className="marquee-track flex w-max">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
