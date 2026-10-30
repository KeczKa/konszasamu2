import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, FileText, Inbox, LogOut, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLang, memberName } from "@/lib/i18n";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload } from "@/lib/api";
import type { AdminUser, ContactMessage, Post } from "@/lib/types";
import { IMAGE_TYPES } from "@/lib/types";
import { Crest } from "@/components/Crest";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { InstitutionsManager } from "@/components/admin/InstitutionsManager";
import { DocumentsManager } from "@/components/admin/DocumentsManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { InstitutionSelect } from "@/components/admin/InstitutionSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormState {
  title_ro: string;
  title_hu: string;
  content_ro: string;
  content_hu: string;
  institution: string;
  cover_image: string;
}

const EMPTY_FORM: FormState = { title_ro: "", title_hu: "", content_ro: "", content_hu: "", institution: "", cover_image: "" };

export default function AdminDashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [coverUploading, setCoverUploading] = useState(false);

  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGet<AdminUser>("/auth/me"), retry: false });
  const perms = new Set(me.data?.permissions ?? []);

  const posts = useQuery({ queryKey: ["posts"], queryFn: () => apiGet<Post[]>("/news"), enabled: perms.has("posts") });
  const messages = useQuery({ queryKey: ["messages"], queryFn: () => apiGet<ContactMessage[]>("/contact"), enabled: perms.has("messages") });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["messages"] });
  };

  const logout = useMutation({
    mutationFn: () => apiPost("/auth/logout"),
    onSettled: () => {
      queryClient.clear();
      navigate("/admin/login");
    },
  });

  const uploadCover = async (file?: File) => {
  if (!file) return;

  if (!IMAGE_TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) {
    toast.error(t.admin.imageError);
    return;
  }

  setCoverUploading(true);
  try {
    const result = await apiUpload<{ url: string }>(
      "/news/cover-image",
      file,
    );
    setForm((current) => ({ ...current, cover_image: result.url }));
  } catch {
    toast.error(t.admin.uploadError);
  } finally {
    setCoverUploading(false);
  }
};

  const save = useMutation({
    mutationFn: () => (editingId ? apiPut<Post>(`/news/${editingId}`, form) : apiPost<Post>("/news", form)),
    onSuccess: () => {
      toast.success(t.admin.savedOk);
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/news/${id}`),
    onSuccess: () => { toast.success(t.admin.deletedOk); invalidate(); },
  });

  const resolve = useMutation({
    mutationFn: (id: string) => apiPatch<ContactMessage>(`/contact/${id}/resolve`),
    onSuccess: () => invalidate(),
  });

  if (me.isError) return <Navigate to="/admin/login" replace />;
  if (!me.data) return <div className="min-h-screen bg-cream" />;

  const tabDefs = [
    { key: "posts", label: t.admin.tabPosts },
    { key: "messages", label: t.admin.tabMessages },
    { key: "gallery", label: t.admin.tabGallery },
    { key: "events", label: t.admin.tabEvents },
    { key: "institutions", label: t.admin.tabInstitutions },
    { key: "documents", label: t.admin.tabDocuments },
    { key: "users", label: t.admin.tabUsers },
  ].filter((d) => perms.has(d.key));
  const activeTab = tabDefs.some((d) => d.key === tab) ? tab : (tabDefs[0]?.key ?? "");

  const allPosts = posts.data ?? [];
  const allMsgs = messages.data ?? [];
  const pendingCount = allMsgs.filter((m) => !m.resolved).length;

  const startEdit = (p: Post) => {
    setEditingId(p.id);
    setForm({ title_ro: p.title_ro, title_hu: p.title_hu, content_ro: p.content_ro, content_hu: p.content_hu, institution: p.institution, cover_image: p.cover_image });
    setShowForm(true);
  };

  const stats = [
    ...(perms.has("posts") ? [{ label: t.admin.statsPosts, value: allPosts.length, icon: Newspaper, testid: "stat-posts" }] : []),
    ...(perms.has("messages") ? [
      { label: t.admin.statsMessages, value: allMsgs.length, icon: Inbox, testid: "stat-messages" },
      { label: t.admin.statsPending, value: pendingCount, icon: FileText, testid: "stat-pending" },
    ] : []),
  ];

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-ink text-cream">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" data-testid="admin-home-link" className="flex items-center gap-3">
            <Crest className="h-9 w-9" />
            <span className="font-heading font-semibold">{t.admin.dashboard}</span>
          </Link>
          <div className="flex items-center gap-4">
            <span data-testid="admin-user-email" className="hidden text-sm text-stone-400 sm:block">
              {t.admin.welcome}, {me.data.name} · {t.admin.roles[me.data.role] ?? me.data.role}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              data-testid="admin-logout-button"
              className="rounded-full border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
            >
              <LogOut className="mr-1 h-4 w-4" /> {t.admin.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {stats.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.testid} data-testid={s.testid} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay/10 text-clay">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-stone-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 overflow-x-auto border-b border-border">
          {tabDefs.map((d) => (
            <button
              key={d.key}
              data-testid={`admin-tab-${d.key}`}
              aria-pressed={activeTab === d.key}
              onClick={() => setTab(d.key)}
              className={cn(
                "cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                activeTab === d.key ? "border-clay text-clay" : "border-transparent text-stone-500 hover:text-ink"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="mt-8">
            <div className="flex justify-end">
              <Button
                onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(!showForm); }}
                data-testid="admin-new-post-button"
                className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90"
              >
                <Plus className="mr-1 h-4 w-4" /> {t.admin.newPost}
              </Button>
            </div>

            {showForm && (
              <form
                data-testid="admin-post-form"
                onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
                className="mt-6 space-y-5 rounded-3xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]"
              >
                <h2 className="font-heading text-xl font-semibold">{editingId ? t.admin.editPost : t.admin.newPost}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="f-title-ro">{t.admin.titleRo}</Label>
                    <Input id="f-title-ro" data-testid="post-title-ro-input" value={form.title_ro} onChange={(e) => setForm({ ...form, title_ro: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="f-title-hu">{t.admin.titleHu}</Label>
                    <Input id="f-title-hu" data-testid="post-title-hu-input" value={form.title_hu} onChange={(e) => setForm({ ...form, title_hu: e.target.value })} required />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="f-content-ro">{t.admin.contentRo}</Label>
                    <Textarea id="f-content-ro" rows={6} data-testid="post-content-ro-input" value={form.content_ro} onChange={(e) => setForm({ ...form, content_ro: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="f-content-hu">{t.admin.contentHu}</Label>
                    <Textarea id="f-content-hu" rows={6} data-testid="post-content-hu-input" value={form.content_hu} onChange={(e) => setForm({ ...form, content_hu: e.target.value })} required />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="f-institution">{t.admin.institution} *</Label>
                    <InstitutionSelect id="f-institution" testId="post-institution-select" value={form.institution} onChange={(v) => setForm({ ...form, institution: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="f-cover-file">{t.admin.coverImage}</Label>
                    <Input
                      id="f-cover-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      data-testid="post-cover-file-input"
                      disabled={coverUploading}
                      onChange={(e) => {
                        void uploadCover(e.target.files?.[0]);
                        e.currentTarget.value = "";
                      }}
                    />

                    {coverUploading && (
                      <p className="text-sm text-stone-500">{t.admin.uploadingImage}</p>
                    )}

                    {form.cover_image && (
                      <div className="space-y-2">
                        <img
                          src={form.cover_image}
                          alt=""
                          className="max-h-48 rounded-xl border border-border object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setForm((current) => ({ ...current, cover_image: "" }))
                          }
                        >
                          {t.admin.removeCover}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={save.isPending || coverUploading} data-testid="post-save-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
                    {save.isPending ? t.admin.saving : editingId ? t.admin.saveEdit : t.admin.save}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} data-testid="post-cancel-button" className="rounded-full">
                    {t.admin.cancel}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 space-y-3">
              {allPosts.length === 0 && <p data-testid="admin-no-posts" className="text-sm text-stone-500">{t.admin.noPosts}</p>}
              {allPosts.map((p) => (
                <div key={p.id} data-testid={`admin-post-row-${p.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]">
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-lg font-semibold">{p.title_hu}</h3>
                    <p className="text-xs text-stone-500">
                      {memberName(t, p.institution)} • {format(new Date(p.created_at), "yyyy-MM-dd")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(p)} data-testid={`admin-edit-${p.id}`} className="rounded-full">
                      <Pencil className="mr-1 h-3.5 w-3.5" /> {t.admin.edit}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove.mutate(p.id)} data-testid={`admin-delete-${p.id}`} className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> {t.admin.delete}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="mt-8 space-y-3">
            {allMsgs.length === 0 && <p data-testid="admin-no-messages" className="text-sm text-stone-500">{t.admin.noMessages}</p>}
            {allMsgs.map((m) => (
              <div key={m.id} data-testid={`admin-message-row-${m.id}`} className={cn("rounded-2xl border bg-white p-5 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]", m.resolved ? "border-border opacity-70" : "border-clay/30")}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.name} <span className="text-sm font-normal text-stone-500">• {m.email}{m.phone ? ` • ${m.phone}` : ""}</span></p>
                    <p className="text-xs text-stone-500">{format(new Date(m.created_at), "yyyy-MM-dd HH:mm")}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolve.mutate(m.id)}
                    data-testid={`admin-resolve-${m.id}`}
                    className={cn("rounded-full", m.resolved ? "text-green-700 border-green-700/30" : "text-clay border-clay/30")}
                  >
                    {m.resolved ? <CheckCircle2 className="mr-1 h-4 w-4" /> : <Circle className="mr-1 h-4 w-4" />}
                    {m.resolved ? t.admin.resolved : t.admin.markResolved}
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">{m.message}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "gallery" && <GalleryManager />}

        {activeTab === "events" && <EventsManager />}

        {activeTab === "institutions" && <InstitutionsManager />}

        {activeTab === "documents" && <DocumentsManager />}

        {activeTab === "users" && <UsersManager currentUserId={me.data.id} />}
      </main>
    </div>
  );
}
