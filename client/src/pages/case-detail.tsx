import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, FileUp, Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/api";
import type { Case, CaseStatus, Fuero } from "@/lib/types";

type DraftFields = {
  number: string;
  fuero: Fuero;
  status: CaseStatus;
  court: string;
  startDate: string;
  notes: string;
};

function caseToDraft(c: Case): DraftFields {
  return {
    number: c.number,
    fuero: c.fuero,
    status: c.status,
    court: c.court,
    startDate: c.startDate,
    notes: c.notes,
  };
}

export default function CaseDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/app/expedientes/:id");
  const id = params?.id ?? "";

  const store = useStore();

  const caseItem = useMemo(() => store.cases.find((c) => c.id === id), [store.cases, id]);

  const createdByUser = useMemo(() => {
    if (!caseItem?.createdBy) return null;
    return store.users.find((u) => u.id === caseItem.createdBy) ?? null;
  }, [store.users, caseItem?.createdBy]);

  const caseEvents = useMemo(() => store.events.filter((e) => e.caseId === id), [store.events, id]);
  const caseFiles = useMemo(() => store.files.filter((f) => f.caseId === id), [store.files, id]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftFields>(() =>
    caseItem ? caseToDraft(caseItem) : { number: "", fuero: "civil", status: "Iniciado", court: "", startDate: "", notes: "" }
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (caseItem && !editing) {
      setDraft(caseToDraft(caseItem));
    }
  }, [caseItem, editing]);

  const handleSave = async () => {
    if (!caseItem) return;
    setSaving(true);
    try {
      await store.updateCase(id, {
        number: draft.number,
        fuero: draft.fuero,
        status: draft.status,
        court: draft.court,
        startDate: draft.startDate,
        notes: draft.notes,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (caseItem) setDraft(caseToDraft(caseItem));
    setEditing(false);
  };

  if (!caseItem) {
    return (
      <main className="min-h-dvh app-gradient">
        <div className="app-container" style={{ paddingBottom: 28 }}>
          <header className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              onClick={() => setLocation("/app/expedientes")}
              data-testid="button-back-cases"
            >
              <ArrowLeft className="h-4 w-4" />
              Expedientes
            </button>
          </header>
          <Card className="app-card rounded-3xl p-6 mt-4 text-center" data-testid="text-case-not-found">
            <p className="text-muted-foreground">Expediente no encontrado</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh app-gradient">
      <div className="app-container" style={{ paddingBottom: 28 }}>
        <header className="flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation("/app/expedientes")}
            data-testid="button-back-cases"
          >
            <ArrowLeft className="h-4 w-4" />
            Expedientes
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" data-testid="badge-case-status">
              {caseItem.status}
            </Badge>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl"
                onClick={() => setEditing(true)}
                data-testid="button-edit-case"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </header>

        <section className="mt-4 grid gap-3">
          <Card className="app-card rounded-3xl p-4">
            <h1 className="font-serif text-2xl tracking-tight" data-testid="text-case-number">
              {caseItem.number}
            </h1>
            {createdByUser && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-created-by">
                Cargado por: {createdByUser.name}
              </p>
            )}

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Número de expediente</label>
                <Input
                  value={draft.number}
                  onChange={(e) => setDraft({ ...draft, number: e.target.value })}
                  disabled={!editing}
                  data-testid="input-case-number"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Fuero</label>
                  <Select value={draft.fuero} onValueChange={(v) => setDraft({ ...draft, fuero: v as Fuero })} disabled={!editing}>
                    <SelectTrigger className="rounded-2xl" data-testid="select-case-fuero">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="civil">Civil</SelectItem>
                      <SelectItem value="laboral">Laboral</SelectItem>
                      <SelectItem value="penal">Penal</SelectItem>
                      <SelectItem value="familia">Familia</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Estado</label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as CaseStatus })} disabled={!editing}>
                    <SelectTrigger className="rounded-2xl" data-testid="select-case-status">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Iniciado">Iniciado</SelectItem>
                      <SelectItem value="En trámite">En trámite</SelectItem>
                      <SelectItem value="Audiencia">Audiencia</SelectItem>
                      <SelectItem value="Sentencia">Sentencia</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Juzgado</label>
                <Input
                  value={draft.court}
                  onChange={(e) => setDraft({ ...draft, court: e.target.value })}
                  disabled={!editing}
                  data-testid="input-case-court"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Cliente</label>
                <Input
                  value={caseItem.clientName}
                  disabled
                  data-testid="input-case-client"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Fecha inicio</label>
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                  disabled={!editing}
                  data-testid="input-case-start-date"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Observaciones</label>
                <Textarea
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className="min-h-24 rounded-2xl"
                  disabled={!editing}
                  data-testid="textarea-case-notes"
                />
              </div>

              {editing && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 rounded-2xl"
                    onClick={handleSave}
                    disabled={saving}
                    data-testid="button-save-case"
                  >
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={handleCancel}
                    disabled={saving}
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Eventos</div>
              <Button
                className="rounded-2xl"
                onClick={() => setLocation("/app/agenda")}
                data-testid="button-add-event"
              >
                <Plus className="h-4 w-4" />
                Agregar evento
              </Button>
            </div>
            <div className="mt-3 grid gap-2">
              {caseEvents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3" data-testid="text-no-events">
                  Sin eventos asociados
                </p>
              )}
              {caseEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-2xl border bg-white/50 px-3 py-3"
                  data-testid={`row-case-event-${e.id}`}
                >
                  <div>
                    <div className="text-sm font-medium">{e.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.date} · {e.time}
                    </div>
                  </div>
                  {e.cancelled ? (
                    <Badge variant="destructive">Cancelado</Badge>
                  ) : (
                    <Badge variant="secondary">Ver</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Documentos / Archivos</div>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setLocation("/app/archivos")}
                data-testid="button-upload-file"
              >
                <FileUp className="h-4 w-4" />
                Subir archivo
              </Button>
            </div>
            <div className="mt-3 grid gap-2">
              {caseFiles.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3" data-testid="text-no-files">
                  Sin archivos asociados
                </p>
              )}
              {caseFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-2xl border bg-white/50 px-3 py-3"
                  data-testid={`row-case-file-${f.id}`}
                >
                  <div>
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.type} · {f.date}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    data-testid={`button-view-file-${f.id}`}
                  >
                    Ver
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
