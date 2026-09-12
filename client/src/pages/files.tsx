import { useMemo, useState } from "react";
import { FileAudio2, FileImage, FileText, FileUp, File, Search, Download, Eye, Plus, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import type { FileType, CaseStatus, Fuero } from "@/lib/types";

const FILE_TYPES: FileType[] = ["PDF", "Word", "Imagen", "Audio"];
const CASE_STATUSES: CaseStatus[] = ["Iniciado", "En trámite", "Audiencia", "Sentencia", "Finalizado"];
const FUEROS: Fuero[] = ["civil", "laboral", "penal", "familia", "comercial"];

function inferType(filename: string): FileType {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "Word";
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif")) return "Imagen";
  return "Audio";
}

const iconFor: Record<FileType, any> = {
  PDF: FileText,
  Word: File,
  Imagen: FileImage,
  Audio: FileAudio2,
};

export default function FilesPage() {
  const store = useStore();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFuero, setFilterFuero] = useState<string>("all");

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<globalThis.File[]>([]);
  const [uploadCaseId, setUploadCaseId] = useState<string>("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const caseMap = useMemo(() => {
    const map = new Map<string, typeof store.cases[0]>();
    store.cases.forEach((c) => map.set(c.id, c));
    return map;
  }, [store.cases]);

  const filteredFiles = useMemo(() => {
    return store.files.filter((f) => {
      if (filterType !== "all" && f.type !== filterType) return false;

      const linkedCase = caseMap.get(f.caseId);
      if (filterStatus !== "all") {
        if (!linkedCase || linkedCase.status !== filterStatus) return false;
      }
      if (filterFuero !== "all") {
        if (!linkedCase || linkedCase.fuero !== filterFuero) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = f.name.toLowerCase().includes(q);
        const caseNumMatch = linkedCase?.number?.toLowerCase().includes(q) ?? false;
        const caseClientMatch = linkedCase?.clientName?.toLowerCase().includes(q) ?? false;
        if (!nameMatch && !caseNumMatch && !caseClientMatch) return false;
      }

      return true;
    });
  }, [store.files, filterType, filterStatus, filterFuero, search, caseMap]);

  async function handleUpload() {
    if (uploadFiles.length === 0 || !uploadCaseId || uploading) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: uploadFiles.length });
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const f = uploadFiles[i];
        await store.createFile({
          file: f,
          name: f.name,
          type: inferType(f.name),
          caseId: uploadCaseId,
          desc: uploadDesc,
        });
        setUploadProgress({ done: i + 1, total: uploadFiles.length });
      }
      setUploadFiles([]);
      setUploadCaseId("");
      setUploadDesc("");
      setShowUpload(false);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  function removeUploadFile(index: number) {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl tracking-tight" data-testid="text-files-title">
              Archivos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-files-subtitle">
              {store.files.length} archivos cargados
            </p>
          </div>
          <Button
            className="rounded-2xl"
            onClick={() => setShowUpload(!showUpload)}
            data-testid="button-toggle-upload"
          >
            {showUpload ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showUpload ? "Cerrar" : "Subir archivo"}
          </Button>
        </header>

        {showUpload && (
          <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-upload-form">
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Subir archivo</div>
            </div>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Archivos (podés seleccionar varios)</label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setUploadFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
                  data-testid="input-file"
                />
                {uploadFiles.length > 0 && (
                  <div className="grid gap-1" data-testid="text-file-selected">
                    {uploadFiles.map((f, i) => (
                      <div
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between rounded-xl border bg-white/50 px-2.5 py-1.5 text-xs text-muted-foreground"
                        data-testid={`row-selected-file-${i}`}
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          className="ml-2 shrink-0 text-red-500 hover:text-red-600"
                          onClick={() => removeUploadFile(i)}
                          disabled={uploading}
                          data-testid={`button-remove-selected-file-${i}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Expediente asociado</label>
                <Select value={uploadCaseId} onValueChange={setUploadCaseId}>
                  <SelectTrigger className="rounded-2xl" data-testid="select-file-case">
                    <SelectValue placeholder="Seleccionar expediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.number} · {c.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Descripción (opcional)</label>
                <Textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="min-h-20 rounded-2xl"
                  placeholder="Descripción del archivo"
                  data-testid="textarea-file-desc"
                />
              </div>

              <Button
                className="rounded-2xl"
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || !uploadCaseId || uploading}
                data-testid="button-upload"
              >
                <FileUp className="mr-1.5 h-4 w-4" />
                {uploading
                  ? `Subiendo ${uploadProgress?.done ?? 0} de ${uploadProgress?.total ?? uploadFiles.length}…`
                  : uploadFiles.length > 1
                    ? `Subir ${uploadFiles.length} archivos`
                    : "Subir"}
              </Button>
            </div>
          </Card>
        )}

        <section className="mt-4 grid gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de archivo o expediente..."
              className="rounded-2xl pl-9"
              data-testid="input-search-files"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="min-w-0 rounded-2xl px-2 text-xs" data-testid="select-filter-type">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {FILE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="min-w-0 rounded-2xl px-2 text-xs" data-testid="select-filter-status">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {CASE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterFuero} onValueChange={setFilterFuero}>
              <SelectTrigger className="min-w-0 rounded-2xl px-2 text-xs" data-testid="select-filter-fuero">
                <SelectValue placeholder="Fuero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los fueros</SelectItem>
                {FUEROS.map((f) => (
                  <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground" data-testid="text-filtered-count">
            {filteredFiles.length} de {store.files.length} archivos
          </div>

          <div className="grid gap-2">
            {filteredFiles.length === 0 && (
              <div className="rounded-2xl border bg-white/50 px-3 py-6 text-center text-sm text-muted-foreground" data-testid="text-no-files">
                {store.files.length === 0
                  ? "No hay archivos cargados. Usá el botón \"Subir archivo\" para agregar uno."
                  : "No se encontraron archivos con los filtros seleccionados."}
              </div>
            )}
            {filteredFiles.map((f) => {
              const Icon = iconFor[f.type] || File;
              const linkedCase = caseMap.get(f.caseId);
              return (
                <div
                  key={f.id}
                  className="rounded-2xl border bg-white/50 px-3 py-3"
                  data-testid={`row-file-${f.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold" data-testid={`text-file-name-${f.id}`}>{f.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {f.date} · <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{f.type}</Badge>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <a
                            href={`/api/files/${f.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid h-8 w-8 place-items-center rounded-xl border bg-white/60 hover:bg-white/90 transition"
                            title="Ver archivo"
                            data-testid={`button-view-file-${f.id}`}
                          >
                            <Eye className="h-3.5 w-3.5 text-primary" />
                          </a>
                          <a
                            href={`/api/files/${f.id}/download`}
                            download
                            className="grid h-8 w-8 place-items-center rounded-xl border bg-white/60 hover:bg-white/90 transition"
                            title="Descargar archivo"
                            data-testid={`button-download-file-${f.id}`}
                          >
                            <Download className="h-3.5 w-3.5 text-primary" />
                          </a>
                        </div>
                      </div>
                      {linkedCase && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>Exp: {linkedCase.number}</span>
                          <span>·</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{linkedCase.status}</Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{linkedCase.fuero}</Badge>
                          <span>· {linkedCase.clientName}</span>
                        </div>
                      )}
                      {f.desc && (
                        <div className="mt-1 truncate text-xs text-muted-foreground">{f.desc}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
