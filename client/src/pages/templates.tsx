import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, Plus, Trash2, Upload, Wand2, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import type { TemplateType } from "@/lib/types";
import { DOC_VARIABLES, DOC_VARIABLE_GROUPS } from "@shared/docVariables";

const TEMPLATE_TYPES: TemplateType[] = ["Demanda", "Contrato", "Poder", "Carta documento"];

export default function TemplatesPage() {
  const [, setLocation] = useLocation();
  const store = useStore();

  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TemplateType>("Contrato");
  const [newFile, setNewFile] = useState<globalThis.File | null>(null);

  const [templateId, setTemplateId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [saveToCase, setSaveToCase] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const templates = store.docTemplates;
  const usableTemplates = useMemo(() => templates.filter((t) => t.filePath), [templates]);

  const selectedCase = useMemo(
    () => store.cases.find((c) => c.id === caseId) ?? null,
    [store.cases, caseId],
  );
  const selectedClient = useMemo(
    () => (selectedCase ? store.clients.find((c) => c.id === selectedCase.clientId) ?? null : null),
    [store.clients, selectedCase],
  );

  async function handleUploadTemplate() {
    if (uploading || !newName.trim() || !newFile) return;
    setError("");
    setNotice("");
    setUploading(true);
    try {
      await store.createDocTemplate({ name: newName.trim(), type: newType, file: newFile });
      setNewName("");
      setNewFile(null);
      setShowUpload(false);
      setNotice("Plantilla guardada.");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la plantilla.");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    if (generating || !templateId) return;
    setError("");
    setNotice("");
    setGenerating(true);
    try {
      const { blob, filename } = await store.generateDocument({
        templateId,
        caseId: caseId || undefined,
        saveToCase: saveToCase && Boolean(caseId),
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNotice(
        saveToCase && caseId
          ? "Documento generado y guardado en los archivos del expediente."
          : "Documento generado.",
      );
    } catch (err: any) {
      setError(err?.message || "No se pudo generar el documento.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (deletingId) return;
    if (!window.confirm(`¿Seguro que querés eliminar la plantilla "${name}"?`)) return;
    setError("");
    setNotice("");
    setDeletingId(id);
    try {
      await store.deleteDocTemplate(id);
      if (templateId === id) setTemplateId("");
    } catch (err: any) {
      setError(err?.message || "No se pudo eliminar la plantilla.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation("/app/configuracion")}
            data-testid="button-back-settings"
          >
            <ArrowLeft className="h-4 w-4" />
            Configuración
          </button>
          <Button
            className="rounded-2xl"
            onClick={() => setShowUpload(!showUpload)}
            data-testid="button-toggle-upload-template"
          >
            {showUpload ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            {showUpload ? "Cerrar" : "Subir plantilla"}
          </Button>
        </header>

        <div className="mt-3">
          <h1 className="font-serif text-2xl tracking-tight" data-testid="text-templates-title">
            Plantillas de documentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-templates-subtitle">
            Subí un archivo Word con variables y generá el documento ya completado con los datos del expediente.
          </p>
        </div>

        {error && (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
            data-testid="text-template-error"
          >
            {error}
          </div>
        )}
        {notice && !error && (
          <div
            className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700"
            data-testid="text-template-notice"
          >
            {notice}
          </div>
        )}

        {showUpload && (
          <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-upload-template">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Subir plantilla</div>
            </div>

            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Contrato de arrendamiento rural"
                  data-testid="input-template-name"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                <Select value={newType} onValueChange={(v) => setNewType(v as TemplateType)}>
                  <SelectTrigger className="rounded-2xl" data-testid="select-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Archivo Word (.docx)</label>
                <Input
                  type="file"
                  accept=".docx"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  data-testid="input-template-file"
                />
                <p className="text-xs text-muted-foreground">
                  El membrete, la tipografía y los márgenes viajan dentro de este archivo: el documento generado los conserva tal cual.
                </p>
              </div>

              <Button
                className="rounded-2xl"
                onClick={handleUploadTemplate}
                disabled={uploading || !newName.trim() || !newFile}
                data-testid="button-submit-template"
              >
                {uploading ? "Guardando…" : "Guardar plantilla"}
              </Button>
            </div>
          </Card>
        )}

        <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-generate-document">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Generar documento</div>
          </div>

          {usableTemplates.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground" data-testid="text-no-usable-templates">
              Todavía no hay plantillas con archivo Word cargado. Subí una para empezar.
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Plantilla</label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-generate-template">
                    <SelectValue placeholder="Elegir plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {usableTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Expediente</label>
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-generate-case">
                    <SelectValue placeholder="Elegir expediente" />
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

              {selectedCase && (
                <div
                  className="rounded-2xl border bg-white/50 px-3 py-3 text-xs text-muted-foreground"
                  data-testid="text-generate-preview"
                >
                  <div className="font-semibold text-foreground">Se va a completar con:</div>
                  <div className="mt-1.5 grid gap-0.5">
                    <div>Cliente: {selectedClient?.name || "(sin cliente vinculado)"}</div>
                    <div>DNI / CUIT: {selectedClient?.doc || "—"}</div>
                    <div>Domicilio: {selectedClient?.address || "—"}</div>
                    <div>Expediente: {selectedCase.number} · {selectedCase.status}</div>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm" data-testid="label-save-to-case">
                <input
                  type="checkbox"
                  id="save-to-case"
                  checked={saveToCase}
                  onChange={(e) => setSaveToCase(e.target.checked)}
                  disabled={!caseId}
                  className="h-4 w-4 rounded border-input"
                  data-testid="checkbox-save-to-case"
                />
                <span className={caseId ? "" : "text-muted-foreground"}>
                  Guardar una copia en los archivos del expediente
                </span>
              </label>

              <Button
                className="rounded-2xl"
                onClick={handleGenerate}
                disabled={generating || !templateId}
                data-testid="button-generate-document"
              >
                <FileText className="mr-1.5 h-4 w-4" />
                {generating ? "Generando…" : "Generar Word"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Para obtener el PDF, abrí el Word generado y usá "Guardar como PDF".
              </p>
            </div>
          )}
        </Card>

        <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-templates-library">
          <div className="text-sm font-semibold">Biblioteca</div>
          <div className="mt-3 grid gap-2">
            {templates.length === 0 && (
              <div
                className="rounded-2xl border bg-white/50 px-3 py-6 text-center text-sm text-muted-foreground"
                data-testid="text-no-templates"
              >
                Todavía no hay plantillas cargadas.
              </div>
            )}
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-3 rounded-2xl border bg-white/50 px-3 py-3"
                data-testid={`row-template-${t.id}`}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{t.type}</Badge>
                    {t.fileName ? (
                      <span className="truncate">{t.fileName}</span>
                    ) : (
                      <span className="text-amber-600">Sin archivo .docx</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 rounded-xl border-red-200 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deletingId === t.id}
                  data-testid={`button-delete-template-${t.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="ml-1">{deletingId === t.id ? "Eliminando…" : "Eliminar"}</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-variables">
          <div className="text-sm font-semibold">Variables disponibles</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Escribilas tal cual dentro del archivo Word, en el lugar donde tiene que aparecer el dato.
          </p>
          <div className="mt-3 grid gap-3">
            {DOC_VARIABLE_GROUPS.map((group) => (
              <div key={group}>
                <div className="text-xs font-semibold text-muted-foreground">{group}</div>
                <div className="mt-1.5 grid gap-1">
                  {DOC_VARIABLES.filter((v) => v.group === group).map((v) => (
                    <div
                      key={v.key}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-xl border bg-white/50 px-2.5 py-1.5"
                      data-testid={`row-variable-${v.key}`}
                    >
                      <code className="font-mono text-xs text-primary">{`{{${v.key}}}`}</code>
                      <span className="text-xs text-muted-foreground">{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
