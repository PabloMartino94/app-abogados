import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Plus, UserPlus, FolderPlus, CalendarPlus } from "lucide-react";
import { CreateDialog } from "@/components/create-dialog";

type CreateKind = "client" | "case" | "event";

export function FabCreate() {
  const [open, setOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<CreateKind | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openDialog(kind: CreateKind) {
    setOpen(false);
    setDialogKind(kind);
  }

  function handleCreated() {
    if (dialogKind === "client") setLocation("/app/clientes");
    else if (dialogKind === "case") setLocation("/app/expedientes");
    else if (dialogKind === "event") setLocation("/app/agenda");
    setDialogKind(null);
  }

  return (
    <>
      <div className="app-fab">
        <div className="relative">
          {open ? (
            <div className="absolute bottom-14 right-0 z-[50] grid w-56 gap-2">
              <button
                className="app-card app-shadow-soft flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold"
                onClick={() => openDialog("client")}
                data-testid="fab-create-client"
              >
                <UserPlus className="h-4 w-4 text-primary" />
                Crear cliente
              </button>
              <button
                className="app-card app-shadow-soft flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold"
                onClick={() => openDialog("case")}
                data-testid="fab-create-case"
              >
                <FolderPlus className="h-4 w-4 text-primary" />
                Crear expediente
              </button>
              <button
                className="app-card app-shadow-soft flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold"
                onClick={() => openDialog("event")}
                data-testid="fab-create-event"
              >
                <CalendarPlus className="h-4 w-4 text-primary" />
                Crear evento
              </button>
            </div>
          ) : null}

          {open ? (
            <button
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              data-testid="fab-backdrop"
            />
          ) : null}

          <button
            className="app-shadow-soft relative z-[60] grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground transition hover:opacity-95 active:scale-[0.98]"
            onClick={() => setOpen((v) => !v)}
            data-testid="fab-toggle"
            aria-expanded={open}
            aria-label="Crear"
          >
            <Plus className={`h-5 w-5 transition ${open ? "rotate-45" : "rotate-0"}`} />
          </button>
        </div>
      </div>

      {dialogKind && (
        <CreateDialog
          open={true}
          onOpenChange={(next) => { if (!next) setDialogKind(null); }}
          kind={dialogKind}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
