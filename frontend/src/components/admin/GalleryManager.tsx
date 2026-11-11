import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api";
import type { GalleryPhoto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstitutionSelect } from "@/components/admin/InstitutionSelect";
import { cn } from "@/lib/utils";

const MAX = 100;

function PhotoCard({ p, onChange, onDelete, onCover }: { p: GalleryPhoto; onChange: (body: Partial<GalleryPhoto>) => void; onDelete: () => void; onCover: () => void }) {
  const { t } = useLang();
  const [hu, setHu] = useState(p.caption_hu);
  const [ro, setRo] = useState(p.caption_ro);
  const dirty = (hu !== p.caption_hu || ro !== p.caption_ro) && hu.trim() && ro.trim();

  return (
    <div data-testid={`gallery-admin-photo-${p.id}`} className="group relative overflow-hidden rounded-2xl border border-border bg-white">
      <img src={p.src} alt={p.original_filename} className="aspect-[4/5] w-full object-cover" />
      <button
        onClick={onDelete}
        data-testid={`gallery-delete-${p.id}`}
        aria-label={t.admin.delete}
        className="absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-destructive opacity-0 shadow transition-opacity duration-200 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        onClick={onCover}
        disabled={p.is_cover}
        data-testid={`gallery-set-cover-${p.id}`}
        data-cover={p.is_cover}
        aria-label={p.is_cover ? t.admin.isCover : t.admin.setCover}
        title={p.is_cover ? t.admin.isCover : t.admin.setCover}
        className={cn(
          "absolute left-2 top-2 flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold shadow transition-[opacity,background-color] duration-200",
          p.is_cover ? "cursor-default bg-clay text-clay-foreground" : "cursor-pointer bg-white/90 text-stone-600 hover:text-clay sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        )}
      >
        <Star className={cn("h-4 w-4", p.is_cover && "fill-current")} />
        {p.is_cover && t.admin.isCover}
      </button>
      <div className="space-y-2 p-2">
        <InstitutionSelect
          testId={`gallery-photo-institution-select-${p.id}`}
          value={p.institution}
          onChange={(slug) => onChange({ institution: slug })}
          className="h-8 text-xs"
        />
        <Input aria-label={t.admin.captionHu} placeholder="HU" maxLength={MAX} value={hu} onChange={(e) => setHu(e.target.value)} data-testid={`gallery-photo-caption-hu-${p.id}`} className="h-8 text-xs" />
        <Input aria-label={t.admin.captionRo} placeholder="RO" maxLength={MAX} value={ro} onChange={(e) => setRo(e.target.value)} data-testid={`gallery-photo-caption-ro-${p.id}`} className="h-8 text-xs" />
        {dirty && (
          <Button size="sm" onClick={() => onChange({ caption_hu: hu, caption_ro: ro })} data-testid={`gallery-photo-caption-save-${p.id}`} className="h-8 w-full rounded-full bg-clay text-xs text-clay-foreground hover:bg-clay/90">
            <Check className="mr-1 h-3.5 w-3.5" /> {t.admin.saveCaption}
          </Button>
        )}
      </div>
    </div>
  );
}

export function GalleryManager() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [institution, setInstitution] = useState("");
  const [captionHu, setCaptionHu] = useState("");
  const [captionRo, setCaptionRo] = useState("");
  const ready = !!institution && !!captionHu.trim() && !!captionRo.trim();

  const photos = useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryPhoto[]>("/gallery") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["gallery"] });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/gallery/${id}`),
    onSuccess: () => { toast.success(t.admin.photoDeleted); refresh(); },
  });

  const cover = useMutation({
    mutationFn: (id: string) => apiPost(`/gallery/${id}/cover`),
    onSuccess: () => { toast.success(t.admin.coverSaved); refresh(); },
    onError: () => toast.error(t.contact.errorText),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<GalleryPhoto> }) => apiPatch(`/gallery/${id}`, body),
    onSuccess: (_d, v) => { toast.success("institution" in v.body ? t.admin.institutionUpdated : t.admin.captionSaved); refresh(); },
    onError: () => toast.error(t.contact.errorText),
  });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !ready) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await apiUpload("/gallery", file, { institution, caption_hu: captionHu.trim(), caption_ro: captionRo.trim() });
      }
      refresh();
    } catch {
      toast.error(t.admin.uploadError);
      refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-8">
      <p className="max-w-2xl text-sm text-stone-500">{t.admin.galleryHelp} {t.admin.galleryChooseFirst}</p>
      <div data-testid="gallery-upload-form" className="mt-5 grid gap-4 rounded-3xl border border-border bg-white p-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="gallery-institution">{t.admin.institution} *</Label>
          <InstitutionSelect id="gallery-institution" testId="gallery-institution-select" value={institution} onChange={setInstitution} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gallery-caption-hu">{t.admin.captionHu} *</Label>
          <Input id="gallery-caption-hu" maxLength={MAX} value={captionHu} onChange={(e) => setCaptionHu(e.target.value)} placeholder="Karácsony 2026" data-testid="gallery-caption-hu-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gallery-caption-ro">{t.admin.captionRo} *</Label>
          <Input id="gallery-caption-ro" maxLength={MAX} value={captionRo} onChange={(e) => setCaptionRo(e.target.value)} placeholder="Crăciun 2026" data-testid="gallery-caption-ro-input" />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          data-testid="gallery-upload-input"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !ready}
          data-testid="gallery-upload-button"
          className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90"
        >
          <ImagePlus className="mr-1 h-4 w-4" />
          {uploading ? t.admin.uploading : t.admin.uploadPhotos}
        </Button>
        <p className="text-xs text-stone-500 sm:col-span-2 lg:col-span-4">{t.admin.captionHint}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(photos.data ?? []).map((p) => (
          <PhotoCard
            key={`${p.id}-${p.caption_hu}-${p.caption_ro}`}
            p={p}
            onChange={(body) => update.mutate({ id: p.id, body })}
            onDelete={() => remove.mutate(p.id)}
            onCover={() => cover.mutate(p.id)}
          />
        ))}
      </div>
      {(photos.data ?? []).length === 0 && (
        <p data-testid="gallery-admin-empty" className="mt-6 text-sm text-stone-500">{t.admin.galleryEmpty}</p>
      )}
    </div>
  );
}
