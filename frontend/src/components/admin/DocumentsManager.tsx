import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLang } from "@/lib/i18n";
import { apiDelete, apiGet, apiUpload } from "@/lib/api";
import type { OfficialDocument } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DocumentsManager() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [titleRo, setTitleRo] = useState("");
  const [titleHu, setTitleHu] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const docs = useQuery({ queryKey: ["documents"], queryFn: () => apiGet<OfficialDocument[]>("/documents") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const upload = useMutation({
    mutationFn: () => apiUpload<OfficialDocument>("/documents", file as File, { title_ro: titleRo, title_hu: titleHu }),
    onSuccess: () => {
      toast.success(t.admin.docUploaded);
      setTitleRo(""); setTitleHu(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      refresh();
    },
    onError: () => toast.error(t.admin.docError),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/documents/${id}`),
    onSuccess: () => { toast.success(t.admin.docDeleted); refresh(); },
  });

  const pickFile = (f?: File) => {
    if (f && (f.type !== "application/pdf" || f.size > 20 * 1024 * 1024)) {
      toast.error(t.admin.docError);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f ?? null);
  };

  return (
    <div className="mt-8 space-y-6">
      <form
        data-testid="document-form"
        onSubmit={(e) => { e.preventDefault(); if (file) upload.mutate(); }}
        className="space-y-5 rounded-3xl border border-border bg-white p-7 shadow-[0_4px_24px_-2px_rgba(28,25,23,0.06)]"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doc-title-ro">{t.admin.docTitleRo}</Label>
            <Input id="doc-title-ro" data-testid="document-title-ro-input" value={titleRo} onChange={(e) => setTitleRo(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-title-hu">{t.admin.docTitleHu}</Label>
            <Input id="doc-title-hu" data-testid="document-title-hu-input" value={titleHu} onChange={(e) => setTitleHu(e.target.value)} required />
          </div>
        </div>
        <div className="max-w-md space-y-2">
          <Label htmlFor="doc-file">{t.admin.docFile}</Label>
          <Input id="doc-file" ref={fileRef} type="file" accept="application/pdf" required data-testid="document-file-input" onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
        <Button type="submit" disabled={upload.isPending || !file} data-testid="document-upload-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
          <Upload className="mr-1 h-4 w-4" /> {upload.isPending ? t.admin.uploading : t.admin.docUpload}
        </Button>
      </form>

      <div className="space-y-3">
        {docs.data?.length === 0 && <p data-testid="admin-no-documents" className="text-sm text-stone-500">{t.admin.docsEmpty}</p>}
        {(docs.data ?? []).map((d) => (
          <div key={d.id} data-testid={`admin-document-row-${d.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5">
            <a href={d.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 hover:text-clay">
              <FileText className="h-5 w-5 shrink-0 text-clay" />
              <span className="min-w-0">
                <span className="block truncate font-heading font-semibold">{d.title_hu}</span>
                <span className="block text-xs text-stone-500">{d.title_ro} • {format(new Date(d.created_at), "yyyy-MM-dd")}</span>
              </span>
            </a>
            <Button variant="outline" size="sm" onClick={() => remove.mutate(d.id)} data-testid={`admin-document-delete-${d.id}`} className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-1 h-3.5 w-3.5" /> {t.admin.delete}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
