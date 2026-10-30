import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang, memberName } from "@/lib/i18n";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { SchoolEvent } from "@/lib/types";
import { formatEventDate, isPast } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InstitutionSelect } from "@/components/admin/InstitutionSelect";
import { cn } from "@/lib/utils";

type Form = Omit<SchoolEvent, "id">;
const EMPTY: Form = { date: "", time: "", title_ro: "", title_hu: "", description_ro: "", description_hu: "", location: "", institution: "" };

export function EventsManager() {
  const { lang, t } = useLang();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const events = useQuery({ queryKey: ["events"], queryFn: () => apiGet<SchoolEvent[]>("/events") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["events"] });
  const reset = () => { setForm(EMPTY); setEditingId(null); setShowForm(false); };

  const save = useMutation({
    mutationFn: () => (editingId ? apiPut(`/events/${editingId}`, form) : apiPost("/events", form)),
    onSuccess: () => { toast.success(t.admin.eventSaved); reset(); refresh(); },
    onError: () => toast.error(t.contact.errorText),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/events/${id}`),
    onSuccess: () => { toast.success(t.admin.eventDeleted); refresh(); },
  });

  const startEdit = (ev: SchoolEvent) => {
    const { id, ...rest } = ev;
    setForm(rest); setEditingId(id); setShowForm(true);
  };
  const input = (key: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`ev-${key}`}>{label}</Label>
      <Input id={`ev-${key}`} data-testid={`event-${key}-input`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );
  const textarea = (key: "description_ro" | "description_hu", label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`ev-${key}`}>{label}</Label>
      <Textarea id={`ev-${key}`} rows={4} data-testid={`event-${key}-input`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="mt-8 space-y-6">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} data-testid="new-event-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
          <Plus className="mr-1 h-4 w-4" /> {t.admin.newEvent}
        </Button>
      )}
      {showForm && (
        <form
          data-testid="event-form"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="space-y-5 rounded-3xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]"
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {input("date", `${t.admin.eventDate} *`, { type: "date", required: true })}
            {input("time", t.admin.eventTime, { type: "time" })}
            <div className="space-y-2">
              <Label htmlFor="ev-institution">{t.admin.institution} *</Label>
              <InstitutionSelect id="ev-institution" testId="event-institution-select" allowAll value={form.institution} onChange={(v) => setForm({ ...form, institution: v })} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {input("title_hu", `${t.admin.eventTitleHu} *`, { required: true, maxLength: 200 })}
            {input("title_ro", `${t.admin.eventTitleRo} *`, { required: true, maxLength: 200 })}
            {textarea("description_hu", t.admin.eventDescHu)}
            {textarea("description_ro", t.admin.eventDescRo)}
          </div>
          <div className="max-w-md">{input("location", `${t.admin.eventLocation} *`, { required: true, maxLength: 200 })}</div>
          <div className="flex gap-3">
            <Button type="submit" disabled={save.isPending} data-testid="event-save-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
              {save.isPending ? t.admin.saving : t.admin.saveEdit}
            </Button>
            <Button type="button" variant="outline" onClick={reset} data-testid="event-cancel-button" className="rounded-full">{t.admin.cancel}</Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {events.data?.length === 0 && <p data-testid="admin-no-events" className="text-sm text-stone-500">{t.admin.eventsEmpty}</p>}
        {[...(events.data ?? [])].reverse().map((ev) => (
          <div key={ev.id} data-testid={`admin-event-row-${ev.id}`} className={cn("flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5", isPast(ev) && "opacity-60")}>
            <div className="min-w-0">
              <p className="truncate font-heading font-semibold">{ev.title_hu}</p>
              <p className="text-xs text-stone-500">{formatEventDate(ev, lang)} • {ev.location} • {memberName(t, ev.institution)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(ev)} data-testid={`admin-event-edit-${ev.id}`} className="rounded-full">
                <Pencil className="mr-1 h-3.5 w-3.5" /> {t.admin.edit}
              </Button>
              <Button variant="outline" size="sm" onClick={() => remove.mutate(ev.id)} data-testid={`admin-event-delete-${ev.id}`} className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-1 h-3.5 w-3.5" /> {t.admin.delete}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
