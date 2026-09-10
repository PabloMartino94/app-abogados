import { useMemo, useState, type DragEvent } from "react";
import { useLocation } from "wouter";
import { Filter, LayoutGrid, Columns3, Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { FabCreate } from "@/components/fab-create";
import { CreateDialog } from "@/components/create-dialog";
import { useStore } from "@/lib/api";
import type { CaseStatus, Fuero } from "@/lib/types";

type ViewMode = "lista" | "kanban";

const STATUS_ORDER: CaseStatus[] = ["Iniciado", "En trámite", "Audiencia", "Sentencia", "Finalizado"];

const statusTone: Record<CaseStatus, string> = {
  Iniciado: "bg-slate-500",
  "En trámite": "bg-blue-500",
  Audiencia: "bg-red-500",
  Sentencia: "bg-violet-500",
  Finalizado: "bg-emerald-600",
};

export default function CasesPage() {
  const [, setLocation] = useLocation();
  const store = useStore();

  const [view, setView] = useState<ViewMode>("lista");
  const [status, setStatus] = useState<"all" | CaseStatus>("all");
  const [fuero, setFuero] = useState<"all" | Fuero>("all");
  const [openCreateCase, setOpenCreateCase] = useState(false);

  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<CaseStatus | null>(null);

  const filtered = useMemo(() => {
    return store.cases.filter((c) => {
      const okStatus = status === "all" ? true : c.status === status;
      const okFuero = fuero === "all" ? true : c.fuero === fuero;
      return okStatus && okFuero;
    });
  }, [fuero, status, store.cases]);

  const columns = useMemo(() => {
    return STATUS_ORDER.map((s) => ({
      status: s,
      items: filtered.filter((c) => c.status === s),
    }));
  }, [filtered]);

  function handleDragStart(e: DragEvent, caseId: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", caseId);
    setDraggedCaseId(caseId);
  }

  function handleDragEnd() {
    setDraggedCaseId(null);
    setDropTarget(null);
  }

  function handleDragOver(e: DragEvent, targetStatus: CaseStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(targetStatus);
  }

  function handleDragLeave() {
    setDropTarget(null);
  }

  async function handleDrop(e: DragEvent, targetStatus: CaseStatus) {
    e.preventDefault();
    const caseId = e.dataTransfer.getData("text/plain");
    setDraggedCaseId(null);
    setDropTarget(null);
    if (!caseId) return;
    const theCase = store.cases.find((c) => c.id === caseId);
    if (!theCase || theCase.status === targetStatus) return;
    await store.updateCase(caseId, { status: targetStatus });
  }

  async function handleInlineStatusChange(caseId: string, newStatus: CaseStatus) {
    await store.updateCase(caseId, { status: newStatus });
  }

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl tracking-tight" data-testid="text-cases-title">
                Expedientes
              </h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="text-cases-subtitle">
                Filtrá por estado o fuero. Alterná entre Lista y Kanban.
              </p>
            </div>

            <Button
              onClick={() => setOpenCreateCase(true)}
              className="rounded-2xl"
              data-testid="button-create-case"
            >
              <Plus className="mr-1 h-4 w-4" />
              Crear
            </Button>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl border bg-white/60 px-3 py-2 text-sm font-medium backdrop-blur w-full sm:w-auto sm:self-start"
            onClick={() => setView((v) => (v === "lista" ? "kanban" : "lista"))}
            data-testid="button-toggle-cases-view"
          >
            {view === "lista" ? <Columns3 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            {view === "lista" ? "Ver Kanban" : "Ver Lista"}
          </button>
        </header>

        <section className="mt-4 grid gap-3">
          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="grid flex-1 grid-cols-2 gap-2">
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="rounded-2xl" data-testid="select-filter-status">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Iniciado">Iniciado</SelectItem>
                    <SelectItem value="En trámite">En trámite</SelectItem>
                    <SelectItem value="Audiencia">Audiencia</SelectItem>
                    <SelectItem value="Sentencia">Sentencia</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={fuero} onValueChange={(v) => setFuero(v as any)}>
                  <SelectTrigger className="rounded-2xl" data-testid="select-filter-fuero">
                    <SelectValue placeholder="Fuero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los fueros</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="laboral">Laboral</SelectItem>
                    <SelectItem value="penal">Penal</SelectItem>
                    <SelectItem value="familia">Familia</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {view === "lista" ? (
            <div className="grid gap-3">
              {filtered.map((c) => (
                <Card key={c.id} className="app-card rounded-3xl p-4" data-testid={`card-case-${c.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="min-w-0 text-left flex-1"
                      onClick={() => setLocation(`/app/expedientes/${c.id}`)}
                      data-testid={`link-case-${c.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusTone[c.status]}`} />
                        <div className="truncate text-sm font-semibold">{c.number}</div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">Cliente: {c.clientName}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Juzgado: {c.court}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Inicio: {c.startDate}</div>
                    </button>
                    <div className="shrink-0 text-right grid gap-2">
                      <Select
                        value={c.status}
                        onValueChange={(v) => handleInlineStatusChange(c.id, v as CaseStatus)}
                      >
                        <SelectTrigger className="rounded-2xl h-8 text-xs w-[130px]" data-testid={`select-case-status-${c.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground" data-testid={`text-case-fuero-${c.id}`}>
                        {c.fuero}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground" data-testid="text-no-cases">
                  No se encontraron expedientes
                </div>
              )}
            </div>
          ) : (
            <div
              className="-mx-4 overflow-x-auto px-4 pb-2"
              data-testid="kanban-container"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex gap-3">
                {columns.map((col) => (
                  <div
                    key={col.status}
                    className={`w-[260px] shrink-0 rounded-3xl transition-colors ${
                      dropTarget === col.status ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, col.status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.status)}
                  >
                    <Card className="app-card rounded-3xl p-3 h-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusTone[col.status]}`} />
                          <div className="text-sm font-semibold">{col.status}</div>
                        </div>
                        <Badge variant="secondary" data-testid={`badge-kanban-count-${col.status}`}>
                          {col.items.length}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 min-h-[60px]">
                        {col.items.map((c) => (
                          <div
                            key={c.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, c.id)}
                            onDragEnd={handleDragEnd}
                            className={`rounded-2xl border bg-white/50 px-3 py-3 text-left backdrop-blur transition cursor-grab active:cursor-grabbing hover:bg-white/70 ${
                              draggedCaseId === c.id ? "opacity-40 scale-95" : ""
                            }`}
                            data-testid={`kanban-card-${c.id}`}
                          >
                            <button
                              className="w-full text-left"
                              onClick={() => setLocation(`/app/expedientes/${c.id}`)}
                            >
                              <div className="text-sm font-semibold">{c.number}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{c.clientName}</div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{c.fuero}</span>
                                <span className={`h-2 w-2 rounded-full ${statusTone[c.status]}`} />
                              </div>
                            </button>
                          </div>
                        ))}
                        {col.items.length === 0 ? (
                          <div className="rounded-2xl border-2 border-dashed bg-white/20 px-3 py-6 text-center text-xs text-muted-foreground" data-testid={`kanban-empty-${col.status}`}>
                            Arrastrá un expediente aquí
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <CreateDialog open={openCreateCase} onOpenChange={setOpenCreateCase} kind="case" />

      <FabCreate />
      <BottomNav />
    </div>
  );
}
