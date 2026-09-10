import { Link, useLocation } from "wouter";
import { CalendarDays, LayoutGrid, Settings, Users, FolderKanban, FileText } from "lucide-react";

const items = [
  { href: "/app", label: "Dashboard", icon: LayoutGrid, testId: "nav-dashboard" },
  { href: "/app/clientes", label: "Clientes", icon: Users, testId: "nav-clientes" },
  { href: "/app/expedientes", label: "Expedientes", icon: FolderKanban, testId: "nav-expedientes" },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays, testId: "nav-agenda" },
  { href: "/app/archivos", label: "Archivos", icon: FileText, testId: "nav-archivos" },
  { href: "/app/configuracion", label: "Config.", icon: Settings, testId: "nav-configuracion" },
] as const;

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="app-bottom-nav border-t bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      data-testid="bottom-nav"
    >
      <div className="mx-auto w-full max-w-md px-3 lg:max-w-none lg:px-6">
        <div className="grid grid-cols-6 gap-1 py-2 lg:mx-auto lg:max-w-3xl">
          {items.map((it) => {
            const active = location === it.href || (it.href !== "/app" && location.startsWith(it.href));
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs transition ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-black/5"
                }`}
                data-testid={it.testId}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="leading-none">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
