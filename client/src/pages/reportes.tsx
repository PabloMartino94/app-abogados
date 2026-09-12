import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bug, Lightbulb, Plus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import type { ReportStatus } from "@/lib/types";

const STATUSES: ReportStatus[] = ["Nuevo", "En revisión", "En progreso", "Resuelto", "Rechazado"];

const statusVariant: Record<ReportStatus, "default" | "secondary" | "destructive" | "outline"> = {
  "Nuevo": "default",
  "En revisión": "secondary",
  "En progreso": "secondary",
  "Resuelto": "outline",
  "Rechazado": "destructive",
};

const priorityColor: Record<string, string> = {
  Baja: "bg-slate-400",
  Media: "bg-blue-500",
  Alta: "bg-orange-500",
  Urgente: "bg-red-500",
};

export default function ReportesPage() {
  const [, setLocation] = useLocation();
  const store = useStore();

  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return store.reports.filter((r) => {
      if (filterKind !== "all" && r.kind !== filterKind) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [store.reports, filterKind, filterStatus]);

  async function handleDelete(id: string, title: string) {
    if (deletingId) return;
    if (!window.confirm(`¿Seguro que querés eliminar el reporte "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      await store.deleteReport(id);
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
            onClick={() => setLocation("/app/reportar")}
            data-testid="button-new-report"
          >
            <Plus className="h-4 w-4" />
            Nuevo reporte
          </Button>
        </header>

        <div className="mt-3">
          <h1 className="font-serif text-2xl tracking-tight" data-testid="text-reportes-title">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-reportes-subtitle">
            {store.reports.length} reportes recibidos
          </p>
        </div>

        <section className="mt-4 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterKind} onValueChange={setFilterKind}>
              <SelectTrigger className="rounded-2xl text-xs" data-testid="select-filter-kind">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="bug">Errores</SelectItem>
                <SelectItem value="mejora">Mejoras</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="rounded-2xl text-xs" data-testid="select-filter-status">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            {filtered.length === 0 && (
              <div
                className="rounded-2xl border bg-white/50 px-3 py-6 text-center text-sm text-muted-foreground"
                data-testid="text-no-reports"
              >
                {store.reports.length === 0
                  ? "Todavía no hay reportes. Usá \"Nuevo reporte\" para cargar el primero."
                  : "No se encontraron reportes con los filtros seleccionados."}
              </div>
            )}
            {filtered.map((r) => (
              <Card key={r.id} className="app-card rounded-3xl p-4" data-testid={`row-report-${r.id}`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      r.kind === "bug" ? "bg-red-500/10" : "bg-amber-500/10"
                    }`}
                  >
                    {r.kind === "bug" ? (
                      <Bug className="h-4 w-4 text-red-500" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" data-testid={`text-report-title-${r.id}`}>
                          {r.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={`inline-block h-2 w-2 rounded-full ${priorityColor[r.priority] || "bg-slate-400"}`} />
                          <span>{r.priority}</span>
                          <span>·</span>
                          <span>{r.reportedByName}</span>
                          <span>·</span>
                          <span>{new Date(r.createdAt).toLocaleDateString("es-AR")}</span>
                        </div>
                      </div>
                      <Badge variant={statusVariant[r.status]} className="shrink-0" data-testid={`badge-report-status-${r.id}`}>
                        {r.status}
                      </Badge>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap" data-testid={`text-report-description-${r.id}`}>
                      {r.description}
                    </p>

                    {r.kind === "bug" && (r.stepsToReproduce || r.expectedBehavior || r.actualBehavior) && (
                      <div className="mt-2 grid gap-1 rounded-2xl border bg-white/50 p-3 text-xs text-muted-foreground">
                        {r.stepsToReproduce && (
                          <div>
                            <span className="font-semibold text-foreground">Pasos: </span>
                            {r.stepsToReproduce}
                          </div>
                        )}
                        {r.expectedBehavior && (
                          <div>
                            <span className="font-semibold text-foreground">Esperaba: </span>
                            {r.expectedBehavior}
                          </div>
                        )}
                        {r.actualBehavior && (
                          <div>
                            <span className="font-semibold text-foreground">Pasó: </span>
                            {r.actualBehavior}
                          </div>
                        )}
                      </div>
                    )}

                    {r.pageContext && (
                      <div className="mt-1.5 text-xs text-muted-foreground">Dónde: {r.pageContext}</div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Estado:</label>
                      <Select
                        value={r.status}
                        onValueChange={(v) => store.updateReportStatus(r.id, v as ReportStatus)}
                      >
                        <SelectTrigger className="h-8 w-40 rounded-xl text-xs" data-testid={`select-update-status-${r.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto h-8 rounded-xl border-red-200 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(r.id, r.title)}
                        disabled={deletingId === r.id}
                        data-testid={`button-delete-report-${r.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="ml-1">{deletingId === r.id ? "Eliminando…" : "Eliminar"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
