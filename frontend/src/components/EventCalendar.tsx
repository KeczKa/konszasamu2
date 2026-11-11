import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, eachDayOfInterval } from "date-fns";
import { ro as roLocale, hu as huLocale } from "date-fns/locale";
import { useLang, pick } from "@/lib/i18n";
import type { SchoolEvent } from "@/lib/types";
import { eventDate, isPast } from "@/lib/events";
import { EventList, EventPopup } from "@/components/EventList";
import { cn } from "@/lib/utils";

const MAX_CHIPS = 3;

export function EventCalendar({ events }: { events: SchoolEvent[] }) {
  const { lang, t } = useLang();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [open, setOpen] = useState<SchoolEvent | null>(null);
  const locale = lang === "ro" ? roLocale : huLocale;

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }),
    [month]
  );
  const monthEvents = events.filter((e) => isSameMonth(eventDate(e), month));
  const today = new Date();

  return (
    <div data-testid="events-calendar">
      <div className="flex items-center justify-between gap-3">
        <h3 data-testid="calendar-month-label" className="font-heading text-2xl font-semibold capitalize text-ink">
          {format(month, lang === "ro" ? "LLLL yyyy" : "yyyy. LLLL", { locale })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            data-testid="calendar-today"
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="cursor-pointer rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors duration-200 hover:border-clay hover:text-clay"
          >
            {t.events.today}
          </button>
          {[-1, 1].map((dir) => (
            <button
              key={dir}
              data-testid={dir < 0 ? "calendar-prev" : "calendar-next"}
              aria-label={dir < 0 ? t.events.prevMonth : t.events.nextMonth}
              onClick={() => setMonth((m) => addMonths(m, dir))}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-ink transition-colors duration-200 hover:border-clay hover:text-clay"
            >
              {dir < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-white">
        <div className="grid grid-cols-7 border-b border-border bg-sand/60">
          {t.events.weekdays.map((d) => (
            <div key={d} className="py-2.5 text-center font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(eventDate(e), day));
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                className={cn("min-h-14 border-b border-r border-border/70 p-1.5 sm:min-h-28 sm:p-2", !inMonth && "bg-stone-50/80")}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday ? "bg-clay font-semibold text-clay-foreground" : inMonth ? "text-ink" : "text-stone-300"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                  {dayEvents.map((e) => (
                    <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", isPast(e) ? "bg-stone-300" : "bg-clay")} />
                  ))}
                </div>
                <div className="mt-1 hidden space-y-1 sm:block">
                  {dayEvents.slice(0, MAX_CHIPS).map((e) => {
                    const past = isPast(e);
                    return (
                      <button
                        key={e.id}
                        data-testid={`calendar-event-${e.id}`}
                        data-past={past}
                        disabled={past}
                        onClick={() => setOpen(e)}
                        title={pick(lang, e, "title")}
                        className={cn(
                          "block w-full truncate rounded-md px-2 py-1 text-left text-xs font-medium transition-colors duration-200",
                          past ? "cursor-default bg-stone-100 text-stone-400" : "cursor-pointer bg-clay/10 text-clay hover:bg-clay hover:text-clay-foreground"
                        )}
                      >
                        {e.time && <span className="mr-1 opacity-75">{e.time}</span>}
                        {pick(lang, e, "title")}
                      </button>
                    );
                  })}
                  {dayEvents.length > MAX_CHIPS && (
                    <p className="px-2 text-[11px] text-stone-500">+{dayEvents.length - MAX_CHIPS} {t.events.more}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 sm:hidden">
        {monthEvents.length === 0 ? (
          <p data-testid="calendar-month-empty" className="text-sm text-stone-500">{t.events.monthEmpty}</p>
        ) : (
          <EventList events={monthEvents} compact testId="calendar-month-list" />
        )}
      </div>
      {monthEvents.length === 0 && <p className="mt-4 hidden text-sm text-stone-500 sm:block">{t.events.monthEmpty}</p>}
      {open && <EventPopup ev={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
