import { useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Ban, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, List, Pencil, Plus, Rows3, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomNav } from "@/components/bottom-nav";
import { FabCreate } from "@/components/fab-create";
import { CreateDialog } from "@/components/create-dialog";
import { useStore } from "@/lib/api";
import type { AppEvent, Duration, EventType, NotificationLeadMinutes } from "@/lib/types";

type Mode = "dia" | "semana" | "lista";

function dotColor(type: EventType) {
  if (type === "Audiencia") return "bg-red-500";
  if (type === "Vencimiento") return "bg-orange-500";
  return "bg-blue-500";
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const durationLabels: Record<string, string> = {
  "15": "15 min",
  "30": "30 min",
  "60": "1 hora",
  "120": "2 horas",
  "all_day": "Todo el día",
};

const leadOptions: { label: string; value: NotificationLeadMinutes }[] = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
  { label: "2 h", value: 120 },
  { label: "4 h", value: 240 },
  { label: "24 h", value: 1440 },
  { label: "72 h", value: 4320 },
];

type EventDraft = {
  type: EventType;
  date: string;
  time: string;
  duration: Duration;
  desc: string;
  leadMinutes: NotificationLeadMinutes;
  caseId: string;
  clientId: string;
};

export default function AgendaPage() {
  const store = useStore();
  const [mode, setMode] = useState<Mode>("lista");
  const [openCreateEvent, setOpenCreateEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EventDraft | null>(null);

  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const weekStart = useMemo(() => startOfWeek(selectedDay, { weekStartsOn: 1 }), [selectedDay]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const usersMap = useMemo(() => {
    const m = new Map<string, string>();
    store.users.forEach((u) => m.set(u.id, u.name));
    return m;
  }, [store.users]);

  const eventsSorted = useMemo(() => {
    return [...store.events].sort((a, b) => {
      const adt = `${a.date}T${a.time}`;
      const bdt = `${b.date}T${b.time}`;
      return adt.localeCompare(bdt);
    });
  }, [store.events]);

  const eventsForSelectedDay = useMemo(() => {
    const key = dayKey(selectedDay);
    return eventsSorted.filter((e) => e.date === key);
  }, [eventsSorted, selectedDay]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AppEvent[]>();
    for (const d of weekDays) map.set(dayKey(d), []);
    for (const e of eventsSorted) {
      if (map.has(e.date)) map.get(e.date)!.push(e);
    }
    return map;
  }, [eventsSorted, weekDays]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return store.events.find((e) => e.id === selectedEventId) ?? null;
  }, [selectedEventId, store.events]);

  function leadLabel(type: EventType) {
    const minutes = store.notificationSettings[type];
    if (minutes >= 1440) return `${Math.round(minutes / 1440)} d antes`;
    if (minutes >= 60) return `${Math.round(minutes / 60)} h antes`;
    return `${minutes} min antes`;
  }

  function openEventDetail(ev: AppEvent) {
    setSelectedEventId(ev.id);
    setEditing(false);
    setDraft(null);
  }

  function startEditing() {
    if (!selectedEvent) return;
    setDraft({
      type: selectedEvent.type,
      date: selectedEvent.date,
      time: selectedEvent.time,
      duration: selectedEvent.duration,
      desc: selectedEvent.desc,
      leadMinutes: selectedEvent.leadMinutes,
      caseId: selectedEvent.caseId,
      clientId: selectedEvent.clientId,
    });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraft(null);
  }

  async function saveEvent() {
    if (!selectedEvent || !draft) return;
    await store.updateEvent(selectedEvent.id, {
      type: draft.type,
      date: draft.date,
      time: draft.time,
      duration: draft.duration,
      desc: draft.desc,
      leadMinutes: draft.leadMinutes,
      caseId: draft.caseId,
      clientId: draft.clientId,
    });
    setEditing(false);
    setDraft(null);
  }

  async function cancelEvent() {
    if (!selectedEvent) return;
    await store.updateEvent(selectedEvent.id, { cancelled: true });
    setSelectedEventId(null);
  }

  function renderEventRow(e: AppEvent, testIdPrefix: string) {
    return (
      <button
        key={e.id}
        className={`w-full text-left rounded-2xl border px-3 py-3 transition hover:bg-white/70 ${e.cancelled ? "bg-red-50/50 opacity-60" : "bg-white/50"}`}
        onClick={() => openEventDetail(e)}
        data-testid={`${testIdPrefix}-${e.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full ${dotColor(e.type)}`} />
              <div className="text-sm font-semibold">{e.type}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {e.time}
              </div>
              {e.cancelled && (
                <Badge variant="destructive" className="text-xs" data-testid={`badge-cancelled-${e.id}`}>Anulado</Badge>
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {e.clientName} · {e.caseNumber}
            </div>
            {e.desc && <div className="mt-1 text-xs text-muted-foreground">{e.desc}</div>}
            <div className="mt-1 text-xs text-muted-foreground">
              Cargado por: {usersMap.get(e.createdBy) || "—"}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <Badge variant="secondary">{format(new Date(e.date + "T00:00:00"), "EEE d MMM", { locale: es })}</Badge>
            <div className="mt-2 text-xs text-muted-foreground" data-testid={`text-event-lead-${e.id}`}>
              {leadLabel(e.type)}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl tracking-tight" data-testid="text-agenda-title">
              Agenda
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-agenda-subtitle">
              Día · Semana · Lista
            </p>
          </div>
          <Button className="rounded-2xl" onClick={() => setOpenCreateEvent(true)} data-testid="button-open-create-event">
            <Plus className="h-4 w-4" />
            Crear
          </Button>
        </header>

        <section className="mt-4 grid gap-3">
          <Card className="app-card rounded-3xl p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  mode === "dia" ? "bg-primary text-primary-foreground" : "bg-white/60"
                }`}
                onClick={() => setMode("dia")}
                data-testid="tab-agenda-day"
              >
                <CalendarDays className="mr-2 inline h-4 w-4" />
                Día
              </button>
              <button
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  mode === "semana" ? "bg-primary text-primary-foreground" : "bg-white/60"
                }`}
                onClick={() => setMode("semana")}
                data-testid="tab-agenda-week"
              >
                <Rows3 className="mr-2 inline h-4 w-4" />
                Semana
              </button>
              <button
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  mode === "lista" ? "bg-primary text-primary-foreground" : "bg-white/60"
                }`}
                onClick={() => setMode("lista")}
                data-testid="tab-agenda-list"
              >
                <List className="mr-2 inline h-4 w-4" />
                Lista
              </button>
            </div>
          </Card>

          {mode === "dia" ? (
            <Card className="app-card rounded-3xl p-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  className="grid h-10 w-10 place-items-center rounded-2xl border bg-white/60"
                  onClick={() => setSelectedDay((d) => addDays(d, -1))}
                  data-testid="button-day-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="text-sm font-semibold" data-testid="text-day-title">
                    {format(selectedDay, "EEEE d MMM", { locale: es })}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid="text-day-lead">
                    Notificaciones: {leadLabel("Audiencia")} / {leadLabel("Vencimiento")} / {leadLabel("Reunión")}
                  </div>
                </div>
                <button
                  className="grid h-10 w-10 place-items-center rounded-2xl border bg-white/60"
                  onClick={() => setSelectedDay((d) => addDays(d, 1))}
                  data-testid="button-day-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {eventsForSelectedDay.length === 0 ? (
                  <div className="rounded-2xl border bg-white/50 px-3 py-3 text-sm text-muted-foreground" data-testid="empty-day">
                    No hay eventos para este día.
                  </div>
                ) : null}

                {eventsForSelectedDay.map((e) => renderEventRow(e, "row-day-event"))}
              </div>
            </Card>
          ) : null}

          {mode === "semana" ? (
            <div className="-mx-4 overflow-x-auto px-4 pb-2" style={{ WebkitOverflowScrolling: "touch" }} data-testid="week-scroll">
              <div className="flex gap-3">
                {weekDays.map((d) => {
                  const key = dayKey(d);
                  const items = eventsByDay.get(key) ?? [];
                  return (
                    <Card key={key} className="app-card w-[280px] shrink-0 rounded-3xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold" data-testid={`text-weekday-${key}`}>
                            {format(d, "EEE d MMM", { locale: es })}
                          </div>
                          <div className="text-xs text-muted-foreground">{items.length} eventos</div>
                        </div>
                        <button
                          className="rounded-2xl border bg-white/60 px-3 py-2 text-xs font-semibold"
                          onClick={() => {
                            setSelectedDay(d);
                            setMode("dia");
                          }}
                          data-testid={`button-open-day-${key}`}
                        >
                          Ver
                        </button>
                      </div>

                      <div className="mt-3 grid gap-2">
                        {items.length === 0 ? (
                          <div className="rounded-2xl border bg-white/50 px-3 py-3 text-sm text-muted-foreground" data-testid={`empty-weekday-${key}`}>
                            Sin eventos
                          </div>
                        ) : null}

                        {items.map((e) => (
                          <button
                            key={e.id}
                            className={`w-full text-left rounded-2xl border px-3 py-3 transition hover:bg-white/70 ${e.cancelled ? "bg-red-50/50 opacity-60" : "bg-white/50"}`}
                            onClick={() => openEventDetail(e)}
                            data-testid={`row-week-event-${e.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${dotColor(e.type)}`} />
                                <div className="text-sm font-semibold">{e.type}</div>
                                {e.cancelled && <Badge variant="destructive" className="text-xs">Anulado</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground">{e.time}</div>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {e.clientName} · {e.caseNumber}
                            </div>
                          </button>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}

          {mode === "lista" ? (
            <Card className="app-card rounded-3xl p-4">
              <div className="text-sm font-semibold" data-testid="text-events-list">
                Eventos
              </div>
              <div className="mt-3 grid gap-2">
                {eventsSorted.map((e) => renderEventRow(e, "row-agenda-event"))}
              </div>
            </Card>
          ) : null}
        </section>
      </div>

      <Dialog open={!!selectedEventId} onOpenChange={(open) => { if (!open) { setSelectedEventId(null); setEditing(false); setDraft(null); } }}>
        <DialogContent className="app-card w-[min(720px,calc(100vw-32px))] max-w-none rounded-3xl border-0 p-0 max-h-[90vh] overflow-y-auto">
          <div className="px-5 pb-5 pt-5">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl tracking-tight" data-testid="text-event-detail-title">
                {editing ? "Editar evento" : "Detalle del evento"}
              </DialogTitle>
            </DialogHeader>

            {selectedEvent && (
              <div className="mt-4 grid gap-3">
                {selectedEvent.cancelled && !editing && (
                  <div className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-700" data-testid="text-event-cancelled">
                    Este evento fue anulado
                  </div>
                )}

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                  {editing && draft ? (
                    <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as EventType })}>
                      <SelectTrigger className="rounded-2xl" data-testid="select-edit-event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Audiencia">Audiencia</SelectItem>
                        <SelectItem value="Vencimiento">Vencimiento</SelectItem>
                        <SelectItem value="Reunión">Reunión</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dotColor(selectedEvent.type)}`} />
                      <span className="text-sm font-medium" data-testid="text-event-type">{selectedEvent.type}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Fecha</label>
                    {editing && draft ? (
                      <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} data-testid="input-edit-event-date" />
                    ) : (
                      <div className="text-sm" data-testid="text-event-date">{selectedEvent.date}</div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Hora</label>
                    {editing && draft ? (
                      <Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} data-testid="input-edit-event-time" />
                    ) : (
                      <div className="text-sm" data-testid="text-event-time">{selectedEvent.time}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Duración</label>
                    {editing && draft ? (
                      <Select value={draft.duration} onValueChange={(v) => setDraft({ ...draft, duration: v as Duration })}>
                        <SelectTrigger className="rounded-2xl" data-testid="select-edit-event-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                          <SelectItem value="all_day">Todo el día</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm" data-testid="text-event-duration">{durationLabels[selectedEvent.duration] || selectedEvent.duration}</div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Notificación</label>
                    {editing && draft ? (
                      <Select value={String(draft.leadMinutes)} onValueChange={(v) => setDraft({ ...draft, leadMinutes: Number(v) as NotificationLeadMinutes })}>
                        <SelectTrigger className="rounded-2xl" data-testid="select-edit-event-lead">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {leadOptions.map((o) => (
                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm" data-testid="text-event-lead">{leadLabel(selectedEvent.type)}</div>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Cliente</label>
                  {editing && draft ? (
                    <Select value={draft.clientId || "__none__"} onValueChange={(v) => setDraft({ ...draft, clientId: v === "__none__" ? "" : v })}>
                      <SelectTrigger className="rounded-2xl" data-testid="select-edit-event-client">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin cliente</SelectItem>
                        {store.clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name || c.doc || "Cliente"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm" data-testid="text-event-client">{selectedEvent.clientName}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Expediente</label>
                  {editing && draft ? (
                    <Select value={draft.caseId || "__none__"} onValueChange={(v) => setDraft({ ...draft, caseId: v === "__none__" ? "" : v })}>
                      <SelectTrigger className="rounded-2xl" data-testid="select-edit-event-case">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin expediente</SelectItem>
                        {store.cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm" data-testid="text-event-case">{selectedEvent.caseNumber}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Descripción</label>
                  {editing && draft ? (
                    <Textarea
                      value={draft.desc}
                      onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                      className="min-h-20 rounded-2xl"
                      data-testid="textarea-edit-event-desc"
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground" data-testid="text-event-desc">{selectedEvent.desc || "—"}</div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground" data-testid="text-event-created-by">
                  Cargado por: {usersMap.get(selectedEvent.createdBy) || "—"}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {editing ? (
                    <>
                      <Button className="rounded-2xl" onClick={saveEvent} data-testid="button-save-event">
                        <Check className="mr-1 h-4 w-4" />
                        Guardar cambios
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={cancelEditing} data-testid="button-cancel-edit-event">
                        <X className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      {!selectedEvent.cancelled && (
                        <>
                          <Button variant="outline" className="rounded-2xl" onClick={startEditing} data-testid="button-edit-event">
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button variant="destructive" className="rounded-2xl" onClick={cancelEvent} data-testid="button-cancel-event">
                            <Ban className="mr-1 h-4 w-4" />
                            Anular evento
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateDialog open={openCreateEvent} onOpenChange={setOpenCreateEvent} kind="event" />

      <FabCreate />
      <BottomNav />
    </div>
  );
}
