import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { apiDelete, apiGet, apiUpload } from "@/lib/api";
import type { GalleryPhoto } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function GalleryManager() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const photos = useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryPhoto[]>("/gallery") });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/gallery/${id}`),
    onSuccess: () => {
      toast.success(t.admin.photoDeleted);
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await apiUpload("/gallery", file);
      }
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    } catch {
      toast.error(t.admin.uploadError);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-sm text-stone-500">{t.admin.galleryHelp}</p>
        <div>
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
            disabled={uploading}
            data-testid="gallery-upload-button"
            className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90"
          >
            <ImagePlus className="mr-1 h-4 w-4" />
            {uploading ? t.admin.uploading : t.admin.uploadPhotos}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(photos.data ?? []).map((p) => (
          <div key={p.id} data-testid={`gallery-admin-photo-${p.id}`} className="group relative overflow-hidden rounded-2xl border border-border bg-white">
            <img src={p.src} alt={p.original_filename} className="aspect-[4/5] w-full object-cover" />
            <button
              onClick={() => remove.mutate(p.id)}
              data-testid={`gallery-delete-${p.id}`}
              aria-label={t.admin.delete}
              className="absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-destructive opacity-0 shadow transition-opacity duration-200 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {(photos.data ?? []).length === 0 && (
        <p data-testid="gallery-admin-empty" className="mt-6 text-sm text-stone-500">{t.admin.galleryEmpty}</p>
      )}
    </div>
  );
}
