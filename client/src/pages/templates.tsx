import { useMemo, useState } from "react";
import { FileText, Mail, Plus, Wand2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import type { TemplateType } from "@/lib/types";

type Tab = "documentos" | "correo";

type EmailTemplateType = "Recordatorio" | "Notificación" | "Seguimiento";

export default function TemplatesPage() {
  const store = useStore();

  const [tab, setTab] = useState<Tab>("documentos");

  const [creatingDoc, setCreatingDoc] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);

  const [creatingEmail, setCreatingEmail] = useState(false);

  const docTemplates = store.docTemplates;
  const emailTemplates = store.emailTemplates;

  const docVariables = useMemo(
    () => ["{{cliente}}", "{{dni}}", "{{fecha}}", "{{expediente}}"],
    [],
  );

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl tracking-tight" data-testid="text-templates-title">
              Plantillas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-templates-subtitle">
              Variables: {docVariables.map((v, i) => (
                <span key={v} className="font-mono text-xs">
                  {v}
                  {i < docVariables.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </div>
        </header>

        <section className="mt-4 grid gap-3">
          <Card className="app-card rounded-3xl p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  tab === "documentos" ? "bg-primary text-primary-foreground" : "bg-white/60"
                }`}
                onClick={() => setTab("documentos")}
                data-testid="tab-templates-docs"
              >
                <FileText className="mr-2 inline h-4 w-4" />
                Documentos
              </button>
              <button
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  tab === "correo" ? "bg-primary text-primary-foreground" : "bg-white/60"
                }`}
                onClick={() => setTab("correo")}
                data-testid="tab-templates-email"
              >
                <Mail className="mr-2 inline h-4 w-4" />
                Correo
              </button>
            </div>
          </Card>

          {tab === "documentos" ? (
            <>
              <div className="flex items-center justify-between">
                <Button
                  className="rounded-2xl"
                  onClick={() => setCreatingDoc(true)}
                  data-testid="button-open-create-template"
                >
                  <Plus className="h-4 w-4" />
                  Crear plantilla
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setGeneratingDoc(true)}
                  data-testid="button-open-generate-document"
                >
                  <Wand2 className="h-4 w-4" />
                  Generar
                </Button>
              </div>

              {creatingDoc ? (
                <Card className="app-card rounded-3xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold" data-testid="text-create-template-title">
                      Crear plantilla (documento)
                    </div>
                    <button
                      className="text-sm font-medium text-primary"
                      onClick={() => setCreatingDoc(false)}
                      data-testid="button-close-create-template"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Nombre de plantilla</label>
                      <Input placeholder="Ej: Demanda laboral" data-testid="input-template-name" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                      <Select defaultValue="Demanda">
                        <SelectTrigger className="rounded-2xl" data-testid="select-template-type">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["Demanda", "Contrato", "Poder", "Carta documento"] as TemplateType[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Contenido</label>
                      <Textarea
                        className="min-h-40 rounded-2xl"
                        placeholder="Escribí el contenido y usá variables dinámicas"
                        data-testid="textarea-template-content"
                      />
                    </div>

                    <Button
                      className="rounded-2xl"
                      onClick={() => {
                        setCreatingDoc(false);
                        alert("En el prototipo: en próxima iteración lo conectamos al store");
                      }}
                      data-testid="button-submit-create-template"
                    >
                      Guardar
                    </Button>
                  </div>
                </Card>
              ) : null}

              {generatingDoc ? (
                <Card className="app-card rounded-3xl p-4" data-testid="panel-generate-document">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Generar documento</div>
                    <button
                      className="text-sm font-medium text-primary"
                      onClick={() => setGeneratingDoc(false)}
                      data-testid="button-close-generate"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Elegir plantilla</label>
                      <Select defaultValue={docTemplates[0]?.id}>
                        <SelectTrigger className="rounded-2xl" data-testid="select-generate-template">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {docTemplates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Cliente</label>
                        <Input placeholder="{{cliente}}" data-testid="input-var-cliente" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">DNI</label>
                        <Input inputMode="numeric" placeholder="{{dni}}" data-testid="input-var-dni" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Fecha</label>
                        <Input type="date" data-testid="input-var-fecha" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Expediente</label>
                        <Input placeholder="{{expediente}}" data-testid="input-var-expediente" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="rounded-2xl"
                        onClick={() => alert("En el prototipo: generar PDF")}
                        data-testid="button-generate-pdf"
                      >
                        Generar PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => alert("En el prototipo: generar Word")}
                        data-testid="button-generate-word"
                      >
                        Generar Word
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}

              <Card className="app-card rounded-3xl p-4">
                <div className="text-sm font-semibold" data-testid="text-templates-library">
                  Biblioteca (documentos)
                </div>
                <div className="mt-3 grid gap-2">
                  {docTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border bg-white/50 px-3 py-3"
                      data-testid={`row-template-${t.id}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{t.type}</div>
                        <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{t.content}</div>
                      </div>
                      <Badge variant="secondary">OK</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : null}

          {tab === "correo" ? (
            <>
              <div className="flex items-center justify-between">
                <Button
                  className="rounded-2xl"
                  onClick={() => setCreatingEmail(true)}
                  data-testid="button-open-create-email-template"
                >
                  <Plus className="h-4 w-4" />
                  Crear plantilla de correo
                </Button>
              </div>

              {creatingEmail ? (
                <Card className="app-card rounded-3xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold" data-testid="text-create-email-template-title">
                      Crear plantilla (correo)
                    </div>
                    <button
                      className="text-sm font-medium text-primary"
                      onClick={() => setCreatingEmail(false)}
                      data-testid="button-close-create-email-template"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
                      <Input placeholder="Ej: Recordatorio vencimiento" data-testid="input-email-template-name" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                      <Select defaultValue="Recordatorio">
                        <SelectTrigger className="rounded-2xl" data-testid="select-email-template-type">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["Recordatorio", "Notificación", "Seguimiento"] as EmailTemplateType[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Asunto</label>
                      <Input placeholder="Asunto del correo" data-testid="input-email-template-subject" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Contenido</label>
                      <Textarea
                        className="min-h-40 rounded-2xl"
                        placeholder="Usá variables como {{cliente}}, {{fecha}}, {{expediente}}"
                        data-testid="textarea-email-template-content"
                      />
                    </div>

                    <Button
                      className="rounded-2xl"
                      onClick={() => {
                        setCreatingEmail(false);
                        alert("En el prototipo: en próxima iteración lo conectamos al store");
                      }}
                      data-testid="button-submit-create-email-template"
                    >
                      Guardar
                    </Button>
                  </div>
                </Card>
              ) : null}

              <Card className="app-card rounded-3xl p-4">
                <div className="text-sm font-semibold" data-testid="text-email-templates-library">
                  Biblioteca (correo)
                </div>
                <div className="mt-3 grid gap-2">
                  {emailTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border bg-white/50 px-3 py-3"
                      data-testid={`row-email-template-${t.id}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{t.type}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Asunto: {t.subject}</div>
                        <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{t.content}</div>
                      </div>
                      <Badge variant="secondary">OK</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : null}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
