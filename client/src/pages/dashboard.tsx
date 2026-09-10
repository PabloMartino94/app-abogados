import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { format, parseISO, isToday, isTomorrow, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, FileText, FolderKanban, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/bottom-nav";
import { FabCreate } from "@/components/fab-create";
import { CreateDialog } from "@/components/create-dialog";
import { useStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type CreateKind = "client" | "case" | "event";
type EventType = "Audiencia" | "Vencimiento" | "Reunión";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const store = useStore();
  const [dialogKind, setDialogKind] = useState<CreateKind | null>(null);
  const { user, account } = useAuth();

  const typeMeta: Record<string, { label: string; color: string }> = {
    Audiencia: { label: "Audiencia", color: "bg-red-500" },
    Vencimiento: { label: "Vencimiento", color: "bg-orange-500" },
    Reunión: { label: "Reunión", color: "bg-blue-500" },
  };

  const upcoming = useMemo(() => {
    const now = new Date();
    const weekAhead = addDays(now, 7);
    return store.events
      .filter((e) => {
        const d = parseISO(e.date);
        return d >= now || isToday(d);
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);
  }, [store.events]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const activeCases = store.cases.filter((c) => c.status === "Iniciado" || c.status === "En trámite" || c.status === "Audiencia").length;
    const hearingsThisWeek = store.events.filter((e) => {
      const d = parseISO(e.date);
      return e.type === "Audiencia" && d >= new Date() && isBefore(d, addDays(new Date(), 7));
    }).length;
    const dueToday = store.events.filter((e) => e.type === "Vencimiento" && e.date === today).length;
    return { activeCases, hearingsThisWeek, dueToday, totalClients: store.clients.length };
  }, [store.cases, store.events, store.clients]);

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground" data-testid="text-welcome">
              Hola, {user?.name?.split(" ")[0] ?? ""}
            </div>
            <h1 className="font-serif text-2xl tracking-tight" data-testid="text-dashboard-title">
              {account?.firmName ?? "Panel"}
            </h1>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setLocation("/app/configuracion")}
            data-testid="button-open-settings"
          >
            <UserRound className="h-4 w-4" />
            Perfil
          </Button>
        </header>

        <section className="mt-5 grid gap-3">
          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">Próximos eventos</div>
              </div>
              <button
                className="text-sm font-medium text-primary"
                onClick={() => setLocation("/app/agenda")}
                data-testid="link-see-agenda"
              >
                Ver agenda
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              {upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground py-3" data-testid="text-no-upcoming">
                  No hay eventos próximos.
                </p>
              )}
              {upcoming.map((ev) => {
                const meta = typeMeta[ev.type] ?? { label: ev.type, color: "bg-gray-400" };
                return (
                  <button
                    key={ev.id}
                    className="w-full rounded-2xl border bg-white/50 px-3 py-3 text-left backdrop-blur transition hover:bg-white/70"
                    onClick={() => setLocation("/app/agenda")}
                    data-testid={`card-upcoming-${ev.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${meta.color}`} />
                          <span className="text-sm font-medium">{meta.label}</span>
                          <span className="text-xs text-muted-foreground">{ev.time}</span>
                        </div>
                        <div className="mt-1 truncate text-sm text-muted-foreground">
                          {ev.clientName} · {ev.caseNumber}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {format(parseISO(ev.date), "EEE d MMM", { locale: es })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="app-card rounded-3xl p-4">
              <div className="text-xs text-muted-foreground">Alertas</div>
              <div className="mt-2 grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vencimientos hoy</span>
                  <Badge data-testid="badge-due-today">{stats.dueToday}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Audiencias semana</span>
                  <Badge variant="secondary" data-testid="badge-hearings-week">
                    {stats.hearingsThisWeek}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="app-card rounded-3xl p-4">
              <div className="text-xs text-muted-foreground">Resumen</div>
              <div className="mt-2 grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Exp. activos</span>
                  <span className="text-sm font-semibold" data-testid="text-active-cases">
                    {stats.activeCases}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Clientes</span>
                  <span className="text-sm font-semibold" data-testid="text-total-clients">
                    {stats.totalClients}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="app-card rounded-3xl p-4">
            <div className="text-sm font-semibold">Accesos rápidos</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                className="rounded-2xl border bg-white/50 px-3 py-3 text-left backdrop-blur transition hover:bg-white/70"
                onClick={() => setDialogKind("client")}
                data-testid="button-quick-new-client"
              >
                <UserRound className="h-4 w-4 text-primary" />
                <div className="mt-2 text-xs font-semibold">Nuevo cliente</div>
              </button>
              <button
                className="rounded-2xl border bg-white/50 px-3 py-3 text-left backdrop-blur transition hover:bg-white/70"
                onClick={() => setDialogKind("case")}
                data-testid="button-quick-new-case"
              >
                <FolderKanban className="h-4 w-4 text-primary" />
                <div className="mt-2 text-xs font-semibold">Nuevo expediente</div>
              </button>
              <button
                className="rounded-2xl border bg-white/50 px-3 py-3 text-left backdrop-blur transition hover:bg-white/70"
                onClick={() => setDialogKind("event")}
                data-testid="button-quick-new-event"
              >
                <FileText className="h-4 w-4 text-primary" />
                <div className="mt-2 text-xs font-semibold">Nuevo evento</div>
              </button>
            </div>
          </Card>
        </section>
      </div>

      {dialogKind && (
        <CreateDialog
          open={true}
          onOpenChange={(next) => { if (!next) setDialogKind(null); }}
          kind={dialogKind}
          onCreated={() => {
            const route = dialogKind === "client" ? "/app/clientes" : dialogKind === "case" ? "/app/expedientes" : "/app/agenda";
            setDialogKind(null);
            setLocation(route);
          }}
        />
      )}

      <FabCreate />
      <BottomNav />
    </div>
  );
}
