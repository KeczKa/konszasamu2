import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { UsefulLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Form = Omit<UsefulLink, "id">;
const EMPTY: Form = { name: "", address: "", phone: "", url: "" };

export function LinksManager() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const links = useQuery({ queryKey: ["links"], queryFn: () => apiGet<UsefulLink[]>("/links") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["links"] });
  const reset = () => { setForm(EMPTY); setEditingId(null); setShowForm(false); };

  const save = useMutation({
    mutationFn: () => (editingId ? apiPut(`/links/${editingId}`, form) : apiPost("/links", form)),
    onSuccess: () => { toast.success(t.admin.linkSaved); reset(); refresh(); },
    onError: () => toast.error(t.contact.errorText),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/links/${id}`),
    onSuccess: () => { toast.success(t.admin.linkDeleted); refresh(); },
  });

  const field = (key: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`link-${key}`}>{label}</Label>
      <Input id={`link-${key}`} data-testid={`link-${key}-input`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <div className="mt-8 space-y-6">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} data-testid="new-link-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
          <Plus className="mr-1 h-4 w-4" /> {t.admin.newLink}
        </Button>
      )}
      {showForm && (
        <form
          data-testid="link-form"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="space-y-5 rounded-3xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {field("name", `${t.admin.linkName} *`, { required: true, maxLength: 200 })}
            {field("address", t.admin.linkAddress, { maxLength: 300 })}
            {field("phone", t.admin.linkPhone, { maxLength: 60 })}
            {field("url", t.admin.linkUrl, { type: "url", maxLength: 500, pattern: "https?://.+" })}
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={save.isPending} data-testid="link-save-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
              {save.isPending ? t.admin.saving : t.admin.saveEdit}
            </Button>
            <Button type="button" variant="outline" onClick={reset} data-testid="link-cancel-button" className="rounded-full">{t.admin.cancel}</Button>
          </div>
        </form>
      )}
      <div className="space-y-3">
        {links.data?.length === 0 && <p data-testid="admin-no-links" className="text-sm text-stone-500">{t.admin.linksEmpty}</p>}
        {(links.data ?? []).map((l) => (
          <div key={l.id} data-testid={`admin-link-row-${l.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5">
            <div className="min-w-0">
              <p className="truncate font-heading font-semibold">{l.name}</p>
              <p className="truncate text-xs text-stone-500">{[l.address, l.phone, l.url].filter(Boolean).join(" • ")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { const { id, ...rest } = l; setForm(rest); setEditingId(id); setShowForm(true); }} data-testid={`admin-link-edit-${l.id}`} className="rounded-full">
                <Pencil className="mr-1 h-3.5 w-3.5" /> {t.admin.edit}
              </Button>
              <Button variant="outline" size="sm" onClick={() => remove.mutate(l.id)} data-testid={`admin-link-delete-${l.id}`} className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-1 h-3.5 w-3.5" /> {t.admin.delete}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
