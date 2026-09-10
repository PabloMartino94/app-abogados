import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Pencil, Plus, Search, ShieldAlert, UserRound } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import { FabCreate } from "@/components/fab-create";
import { CreateDialog } from "@/components/create-dialog";
import { useStore } from "@/lib/api";

export default function ClientsPage() {
  const [, setLocation] = useLocation();
  const store = useStore();
  const [query, setQuery] = useState("");
  const [openCreateClient, setOpenCreateClient] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const usersMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of store.users) {
      map.set(u.id, u.name);
    }
    return map;
  }, [store.users]);

  const casesCountByClient = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of store.cases) {
      map.set(c.clientId, (map.get(c.clientId) ?? 0) + 1);
    }
    return map;
  }, [store.cases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const clients = store.clients.map((c) => ({
      ...c,
      casesCount: casesCountByClient.get(c.id) ?? 0,
    }));

    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.doc, c.email, c.phone, c.address, c.notes].some((v) =>
        (v ?? "").toLowerCase().includes(q)
      ),
    );
  }, [casesCountByClient, query, store.clients]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-serif text-2xl tracking-tight" data-testid="text-clients-title">
              Clientes
            </h1>
            <Button
              onClick={() => setOpenCreateClient(true)}
              className="rounded-2xl"
              data-testid="button-create-client"
            >
              <Plus className="mr-1 h-4 w-4" />
              Crear cliente
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border bg-white/60 px-3 py-2 backdrop-blur">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI, email, teléfono, dirección o notas"
              className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              type="search"
              data-testid="input-search-client"
            />
          </div>
        </header>

        {/* Desktop table view */}
        <section className="mt-4 hidden sm:block">
          <div className="app-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm" data-testid="table-clients">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">DNI/CUIT</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Teléfono</th>
                  <th className="px-3 py-2 font-medium">Dirección</th>
                  <th className="px-3 py-2 font-medium text-center">Exp.</th>
                  <th className="px-3 py-2 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setLocation(`/app/clientes/${c.id}`)}
                    className="border-b last:border-b-0 cursor-pointer hover:bg-muted/20 transition-colors"
                    data-testid={`row-client-${c.id}`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate max-w-[180px]" data-testid={`text-name-${c.id}`}>{c.name}</span>
                      </div>
                      {usersMap.get(c.createdBy) && (
                        <div className="text-[10px] text-muted-foreground mt-0.5" data-testid={`text-creator-${c.id}`}>
                          Cargado por: {usersMap.get(c.createdBy)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground" data-testid={`text-doc-${c.id}`}>{c.doc}</td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[160px]" data-testid={`text-email-${c.id}`}>{c.email}</td>
                    <td className="px-3 py-2 text-muted-foreground" data-testid={`text-phone-${c.id}`}>{c.phone}</td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[140px]" data-testid={`text-address-${c.id}`}>{c.address}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-cases-${c.id}`}>
                        {c.casesCount}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      {c.blacklist && (
                        <ShieldAlert className="h-4 w-4 text-red-500" data-testid={`status-blacklist-${c.id}`} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground" data-testid="text-no-clients">
                No se encontraron clientes
              </div>
            )}
          </div>
        </section>

        {/* Mobile list view */}
        <section className="mt-4 sm:hidden grid gap-1.5">
          {filtered.map((c) => {
            const isExpanded = expandedIds.has(c.id);
            return (
              <div
                key={c.id}
                className="app-card rounded-2xl overflow-hidden"
                data-testid={`card-client-${c.id}`}
              >
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                  onClick={() => toggleExpand(c.id)}
                  data-testid={`button-expand-${c.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <UserRound className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold truncate" data-testid={`text-name-${c.id}`}>{c.name}</span>
                    {c.blacklist && (
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" data-testid={`status-blacklist-${c.id}`} />
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1 text-sm border-t pt-2" data-testid={`details-client-${c.id}`}>
                    {c.doc && (
                      <div className="text-muted-foreground" data-testid={`text-doc-${c.id}`}>
                        <span className="font-medium text-foreground">DNI/CUIT:</span> {c.doc}
                      </div>
                    )}
                    {c.email && (
                      <div className="text-muted-foreground" data-testid={`text-email-${c.id}`}>
                        <span className="font-medium text-foreground">Email:</span> {c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div className="text-muted-foreground" data-testid={`text-phone-${c.id}`}>
                        <span className="font-medium text-foreground">Teléfono:</span> {c.phone}
                      </div>
                    )}
                    {c.address && (
                      <div className="text-muted-foreground" data-testid={`text-address-${c.id}`}>
                        <span className="font-medium text-foreground">Dirección:</span> {c.address}
                      </div>
                    )}
                    {c.notes && (
                      <div className="text-muted-foreground" data-testid={`text-notes-${c.id}`}>
                        <span className="font-medium text-foreground">Notas:</span> {c.notes}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-cases-${c.id}`}>
                        {c.casesCount} exp.
                      </Badge>
                      {c.blacklist && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-700">
                          <ShieldAlert className="h-3 w-3" />
                          Lista negra
                        </span>
                      )}
                    </div>
                    {usersMap.get(c.createdBy) && (
                      <div className="text-[11px] text-muted-foreground pt-0.5" data-testid={`text-creator-${c.id}`}>
                        Cargado por: {usersMap.get(c.createdBy)}
                      </div>
                    )}
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-2xl w-full"
                        onClick={(e) => { e.stopPropagation(); setLocation(`/app/clientes/${c.id}`); }}
                        data-testid={`button-edit-client-${c.id}`}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Ver / Editar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground" data-testid="text-no-clients">
              No se encontraron clientes
            </div>
          )}
        </section>
      </div>

      <CreateDialog open={openCreateClient} onOpenChange={setOpenCreateClient} kind="client" />

      <FabCreate />
      <BottomNav />
    </div>
  );
}
