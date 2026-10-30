import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLang } from "@/lib/i18n";
import { apiDelete, apiGet, apiPatch, apiUpload } from "@/lib/api";
import type { OfficialDocument } from "@/lib/types";
import { DOC_TYPES } from "@/lib/types";
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
  const [docType, setDocType] = useState("");

  const docs = useQuery({ queryKey: ["documents"], queryFn: () => apiGet<OfficialDocument[]>("/documents") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const upload = useMutation({
    mutationFn: () => apiUpload<OfficialDocument>("/documents", file as File, { title_ro: titleRo, title_hu: titleHu, doc_type: docType }),
    onSuccess: () => {
      toast.success(t.admin.docUploaded);
      setTitleRo(""); setTitleHu(""); setFile(null); setDocType("");
      if (fileRef.current) fileRef.current.value = "";
      refresh();
    },
    onError: () => toast.error(t.admin.docError),
  });

  const retype = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => apiPatch(`/documents/${id}`, { doc_type: value }),
    onSuccess: () => { toast.success(t.admin.docTypeUpdated); refresh(); },
  });

  const typeSelect = (value: string, onChange: (v: string) => void, testId: string, id?: string) => (
    <select
      id={id}
      required
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    >
      <option value="" disabled>{t.admin.chooseDocType}</option>
      {DOC_TYPES.map((k) => <option key={k} value={k}>{t.docsPage.types[k]}</option>)}
    </select>
  );

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
        <div className="max-w-xs space-y-2">
          <Label htmlFor="doc-type">{t.admin.docType} *</Label>
          {typeSelect(docType, setDocType, "document-type-select", "doc-type")}
        </div>
        <div className="max-w-md space-y-2">
          <Label htmlFor="doc-file">{t.admin.docFile}</Label>
          <Input id="doc-file" ref={fileRef} type="file" accept="application/pdf" required data-testid="document-file-input" onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
        <Button type="submit" disabled={upload.isPending || !file || !docType} data-testid="document-upload-button" className="rounded-full bg-clay text-clay-foreground hover:bg-clay/90">
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
            <div className="flex items-center gap-2">
            <div className="w-36">{typeSelect(d.doc_type, (v) => retype.mutate({ id: d.id, value: v }), `admin-document-type-${d.id}`)}</div>
            <Button variant="outline" size="sm" onClick={() => remove.mutate(d.id)} data-testid={`admin-document-delete-${d.id}`} className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-1 h-3.5 w-3.5" /> {t.admin.delete}
            </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
