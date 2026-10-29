import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { apiGet, apiPut, apiUpload } from "@/lib/api";
import type { Institution } from "@/lib/types";
import { IMAGE_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InstitutionSelect } from "@/components/admin/InstitutionSelect";

type Form = Omit<Institution, "slug">;
const EMPTY: Form = { description_ro: "", description_hu: "", address: "", phone: "", email: "", images: [] };

export function InstitutionsManager() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState(t.members[0].slug);
  const [form, setForm] = useState<Form>(EMPTY);
  const [uploading, setUploading] = useState(false);

  const info = useQuery({ queryKey: ["institution", slug], queryFn: () => apiGet<Institution>(`/institutions/${slug}`) });

  useEffect(() => {
    if (!info.data) return;
    const { slug: _ignored, ...rest } = info.data;
    setForm(rest);
  }, [info.data]);

  const save = useMutation({
    mutationFn: () => apiPut<Institution>(`/institutions/${slug}`, form),
    onSuccess: () => {
      toast.success(t.admin.instSaved);
      queryClient.invalidateQueries({ queryKey: ["institution", slug] });
    },
    onError: () => toast.error(t.contact.errorText),
  });

  const addImages = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (list.some((f) => !IMAGE_TYPES.includes(f.type) || f.size > 10 * 1024 * 1024)) {
      toast.error(t.admin.imageError);
      return;
    }
    setUploading(true);
    try {
      for (const file of list) {
        const res = await apiUpload<{ url: string }>("/news/cover-image", file);
        setForm((cur) => ({ ...cur, images: [...cur.images, res.url].slice(0, 12) }));
      }
    } catch {
      toast.error(t.admin.uploadError);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const field = (key: "address" | "phone" | "email", label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`inst-${key}`}>{label}</Label>
      <Input id={`inst-${key}`} data-testid={`institution-${key}-input`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <form
      data-testid="institution-form"
      onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      className="mt-8 space-y-5 rounded-3xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]"
    >
      <div className="max-w-sm space-y-2">
        <Label htmlFor="inst-slug">{t.admin.institution}</Label>
        <InstitutionSelect id="inst-slug" testId="institution-edit-select" value={slug} onChange={setSlug} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inst-desc-ro">{t.admin.descRo}</Label>
          <Textarea id="inst-desc-ro" rows={7} data-testid="institution-desc-ro-input" value={form.description_ro} onChange={(e) => setForm({ ...form, description_ro: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inst-desc-hu">{t.admin.descHu}</Label>
          <Textarea id="inst-desc-hu" rows={7} data-testid="institution-desc-hu-input" value={form.description_hu} onChange={(e) => setForm({ ...form, description_hu: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {field("address", t.admin.address)}
        {field("phone", t.admin.phone)}
        {field("email", t.admin.contactEmail)}
      </div>
      <div className="space-y-3">
        <Label>{t.admin.images}</Label>
        <div className="flex flex-wrap gap-3">
          {form.images.map((src, i) => (
            <div key={src} data-testid={`institution-image-${i}`} className="relative">
              <img src={src} alt="" className="h-24 w-32 rounded-xl border border-border object-cover" />
              <button
                type="button"
                aria-label={t.admin.removeImage}
                data-testid={`institution-image-remove-${i}`}
                onClick={() => setForm({ ...form, images: form.images.filter((x) => x !== src) })}
                className="absolute -right-2 -top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-destructive shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <input ref={fileRef} type="file" multiple accept={IMAGE_TYPES.join(",")} data-testid="institution-images-input" className="hidden" onChange={(e) => addImages(e.target.files)} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()} data-testid="institution-add-images-button" className="rounded-full">
          <ImagePlus className="mr-1 h-4 w-4" /> {uploading ? t.admin.uploading : t.admin.addImages}
        </Button>
      </div>
      <Button type="submit" disabled={save.isPending || uploading || info.isLoading} data-testid="institution-save-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
        {save.isPending ? t.admin.saving : t.admin.saveEdit}
      </Button>
    </form>
  );
}
