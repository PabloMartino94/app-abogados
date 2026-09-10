import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function LogoMark() {
  return (
    <div
      className="relative grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground app-shadow-soft"
      aria-hidden="true"
    >
      <span className="font-serif text-lg tracking-tight">Ab</span>
      <span className="absolute -bottom-2 left-1/2 h-3 w-10 -translate-x-1/2 rounded-full bg-primary/20 blur-md" />
    </div>
  );
}

export default function WelcomePage() {
  const [, setLocation] = useLocation();

  const bullets = useMemo(
    () => [
      { title: "Clientes", desc: "Ficha completa, notas y seguimiento" },
      { title: "Expedientes", desc: "Estados, eventos y documentos" },
      { title: "Agenda", desc: "Audiencias, vencimientos y alertas" },
    ],
    [],
  );

  return (
    <main className="min-h-dvh app-gradient">
      <div className="app-container" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", paddingBottom: 32, paddingTop: 40 }}>
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <div className="font-serif text-2xl tracking-tight" data-testid="text-app-title">
                AboxApp
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-app-subtitle">
                Gestión legal, simple y sobria.
              </div>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <h1 className="text-balance font-serif text-3xl tracking-tight">
            Tu estudio, en el bolsillo.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground" data-testid="text-welcome-desc">
            Organiza clientes, expedientes, agenda y documentos con una interfaz pensada para
            usar con una mano.
          </p>

          <div className="mt-6 grid gap-3">
            <Button
              data-testid="button-create-account"
              className="w-full rounded-2xl"
              onClick={() => setLocation("/crear-cuenta")}
            >
              Crear cuenta
            </Button>
            <Button
              data-testid="button-login"
              className="w-full rounded-2xl"
              variant="outline"
              onClick={() => setLocation("/login")}
            >
              Iniciar sesión
            </Button>
          </div>
        </section>

        <section className="mt-8">
          <Card className="app-card rounded-3xl p-4">
            <div className="grid gap-3">
              {bullets.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-semibold" data-testid={`text-feature-${b.title}`}> 
                      {b.title}
                    </div>
                    <div className="text-sm text-muted-foreground">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <footer className="mt-auto pt-8">
          <p className="text-xs text-muted-foreground" data-testid="text-legal-note">
            Demo de prototipo (sin backend). Datos en memoria para la experiencia.
          </p>
        </footer>
      </div>
    </main>
  );
}
