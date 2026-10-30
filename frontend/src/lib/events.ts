import { format } from "date-fns";
import { ro as roLocale, hu as huLocale } from "date-fns/locale";
import type { Lang } from "@/lib/i18n";
import type { SchoolEvent } from "@/lib/types";

export const eventDate = (e: SchoolEvent) => {
  const [y, m, d] = e.date.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function isPast(e: SchoolEvent): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate(e) < today;
}

export function splitEvents(events: SchoolEvent[]) {
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter(isPast).reverse();
  return { upcoming, past };
}

export function formatEventDate(e: SchoolEvent, lang: Lang, pattern = "yyyy. MMMM d., EEEE"): string {
  const locale = lang === "ro" ? roLocale : huLocale;
  const p = lang === "ro" ? "EEEE, d MMMM yyyy" : pattern;
  return format(eventDate(e), p, { locale }) + (e.time ? ` · ${e.time}` : "");
}

export function dayMonth(e: SchoolEvent, lang: Lang) {
  const locale = lang === "ro" ? roLocale : huLocale;
  const d = eventDate(e);
  return { day: format(d, "d"), month: format(d, "MMM", { locale }).replace(".", ""), year: format(d, "yyyy") };
}
