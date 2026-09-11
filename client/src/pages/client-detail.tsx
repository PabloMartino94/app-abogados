import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, FilePlus2, Pencil, ShieldAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/api";
import type { Client } from "@/lib/types";

export default function ClientDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/app/clientes/:id");
  const id = params?.id ?? "";

  const store = useStore();

  const client = useMemo(() => store.clients.find((c) => c.id === id), [store.clients, id]);

  const createdByUser = useMemo(() => {
    if (!client?.createdBy) return null;
    return store.users.find((u) => u.id === client.createdBy);
  }, [store.users, client?.createdBy]);

  const clientCases = useMemo(() => store.cases.filter((c) => c.clientId === id), [store.cases, id]);

  const clientEvents = useMemo(
    () => store.events.filter((e) => e.clientId === id && !e.cancelled),
    [store.events, id],
  );

  const clientCaseIds = useMemo(() => new Set(clientCases.map((c) => c.id)), [clientCases]);
  const clientFiles = useMemo(
    () => store.files.filter((f) => clientCaseIds.has(f.caseId)),
    [store.files, clientCaseIds],
  );

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (client) {
      setDraft({
        name: client.name,
        doc: client.doc,
        phone: client.phone,
        email: client.email,
        address: client.address,
        blacklist: client.blacklist,
        notes: client.notes,
      });
    }
  }, [client]);

  if (!client) {
    return (
      <main className="min-h-dvh app-gradient">
        <div className="app-container" style={{ paddingBottom: 28 }}>
          <header className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              onClick={() => setLocation("/app/clientes")}
              data-testid="button-back-clients"
            >
              <ArrowLeft className="h-4 w-4" />
              Clientes
            </button>
          </header>
          <div className="mt-8 text-center text-muted-foreground" data-testid="text-client-not-found">
            Cliente no encontrado
          </div>
        </div>
      </main>
    );
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await store.updateClient(id, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    const warning =
      clientCases.length > 0
        ? `Este cliente tiene ${clientCases.length} expediente${clientCases.length === 1 ? "" : "s"} asociado${clientCases.length === 1 ? "" : "s"}. Los expedientes NO se van a borrar, pero van a quedar sin cliente vinculado.\n\n¿Seguro que querés eliminar a este cliente?`
        : "¿Seguro que querés eliminar a este cliente? Esta acción no se puede deshacer.";
    if (!window.confirm(warning)) return;
    setDeleting(true);
    try {
      await store.deleteClient(id);
      setLocation("/app/clientes");
    } finally {
      setDeleting(false);
    }
  }

  function cancel() {
    setDraft({
      name: client!.name,
      doc: client!.doc,
      phone: client!.phone,
      email: client!.email,
      address: client!.address,
      blacklist: client!.blacklist,
      notes: client!.notes,
    });
    setEditing(false);
  }

  return (
    <main className="min-h-dvh app-gradient">
      <div className="app-container" style={{ paddingBottom: 28 }}>
        <header className="flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation("/app/clientes")}
            data-testid="button-back-clients"
          >
            <ArrowLeft className="h-4 w-4" />
            Clientes
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              disabled={saving}
              onClick={() => {
                if (editing) {
                  cancel();
                } else {
                  setEditing(true);
                }
              }}
              data-testid="button-edit-client"
            >
              <Pencil className="h-4 w-4" />
              {editing ? "Cerrar" : "Editar"}
            </Button>
            {!editing && (
              <Button
                variant="outline"
                className="rounded-2xl text-red-600 hover:bg-red-50"
                disabled={deleting}
                onClick={handleDelete}
                data-testid="button-delete-client"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
            )}
          </div>
        </header>

        <section className="mt-4">
          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {editing ? (
                    <Input
                      value={draft.name ?? ""}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="font-serif text-2xl tracking-tight"
                      data-testid="input-client-name"
                    />
                  ) : (
                    <h1 className="truncate font-serif text-2xl tracking-tight" data-testid="text-client-name">
                      {client.name}
                    </h1>
                  )}
                  {(editing ? draft.blacklist : client.blacklist) ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-700"
                      data-testid="status-blacklist"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Lista negra
                    </span>
                  ) : null}
                </div>
                {editing ? (
                  <div className="mt-1">
                    <label className="text-xs font-semibold text-muted-foreground">DNI/CUIT</label>
                    <Input
                      value={draft.doc ?? ""}
                      onChange={(e) => setDraft({ ...draft, doc: e.target.value })}
                      data-testid="input-client-doc"
                    />
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-muted-foreground" data-testid="text-client-doc">
                    DNI/CUIT: {client.doc}
                  </div>
                )}
                {createdByUser && (
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-client-created-by">
                    Cargado por: {createdByUser.name}
                  </div>
                )}
              </div>
              <Badge variant="secondary" data-testid="badge-client-cases">
                {clientCases.length} exp.
              </Badge>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
                <Input
                  value={editing ? (draft.phone ?? "") : client.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  inputMode="numeric"
                  disabled={!editing}
                  data-testid="input-client-phone"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <Input
                  value={editing ? (draft.email ?? "") : client.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  inputMode="email"
                  disabled={!editing}
                  data-testid="input-client-email"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Dirección</label>
                <Input
                  value={editing ? (draft.address ?? "") : client.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  disabled={!editing}
                  data-testid="input-client-address"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Lista negra</label>
                <Select
                  value={(editing ? draft.blacklist : client.blacklist) ? "si" : "no"}
                  onValueChange={(v) => setDraft({ ...draft, blacklist: v === "si" })}
                  disabled={!editing}
                >
                  <SelectTrigger className="rounded-2xl" data-testid="select-client-blacklist">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="si">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Notas</label>
                <Textarea
                  value={editing ? (draft.notes ?? "") : client.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  disabled={!editing}
                  className="min-h-24 rounded-2xl"
                  data-testid="textarea-client-notes"
                />
              </div>

              {editing ? (
                <div className="flex gap-2">
                  <Button className="rounded-2xl flex-1" onClick={save} disabled={saving} data-testid="button-save-client">
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={cancel} disabled={saving} data-testid="button-cancel-edit">
                    Cancelar
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        </section>

        <section className="mt-4 grid gap-3">
          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold" data-testid="text-associated-cases">
                Expedientes asociados
              </div>
              <Button
                className="rounded-2xl"
                onClick={() => setLocation("/app/expedientes")}
                data-testid="button-create-case-from-client"
              >
                <FilePlus2 className="h-4 w-4" />
                Crear expediente
              </Button>
            </div>

            <div className="mt-3 grid gap-2">
              {clientCases.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2" data-testid="text-no-cases">
                  Sin expedientes asociados
                </div>
              ) : (
                clientCases.map((e) => (
                  <button
                    key={e.id}
                    className="flex items-center justify-between rounded-2xl border bg-white/50 px-3 py-3 text-left backdrop-blur transition hover:bg-white/70"
                    onClick={() => setLocation(`/app/expedientes/${e.id}`)}
                    data-testid={`row-client-case-${e.id}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{e.number}</div>
                      <div className="text-xs text-muted-foreground">Estado: {e.status}</div>
                    </div>
                    <Badge variant="secondary">Ver</Badge>
                  </button>
                ))
              )}
            </div>
          </Card>

          {clientFiles.length > 0 && (
            <Card className="app-card rounded-3xl p-4">
              <div className="text-sm font-semibold" data-testid="text-client-documents">
                Documentos
              </div>
              <div className="mt-3 grid gap-2">
                {clientFiles.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-2xl border bg-white/50 px-3 py-3"
                    data-testid={`row-client-document-${d.id}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.date} — {d.caseNumber}</div>
                    </div>
                    <Badge variant="secondary">{d.type}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="app-card rounded-3xl p-4">
            <div className="text-sm font-semibold" data-testid="text-client-history">
              Historial de eventos
            </div>
            <div className="mt-3 grid gap-2">
              {clientEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2" data-testid="text-no-events">
                  Sin eventos registrados
                </div>
              ) : (
                clientEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-2xl border bg-white/50 px-3 py-3"
                    data-testid={`row-client-history-${ev.id}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{ev.type}: {ev.desc || ev.caseNumber}</div>
                      <div className="text-xs text-muted-foreground">{ev.date} — {ev.time}</div>
                    </div>
                    <Badge variant="secondary">{ev.type}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
