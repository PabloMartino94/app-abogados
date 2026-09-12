import { useState, type ComponentType } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, CalendarClock, CalendarDays, CalendarPlus, Clock, Columns3, Copy,
  List, Mail, Pencil, Rows3, Search, ShieldAlert, Stamp, UserRound, Variable, Wand2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/bottom-nav";
import {
  HerramientaPlazos, HerramientaRegresiva, HerramientaDistancia,
  HerramientaCaducidad, HerramientaDiferenciaFechas,
} from "@/components/herramientas/fechas";
import {
  HerramientaTasaJusticia, HerramientaHonorarios,
  HerramientaIncapacidad, HerramientaPunitivos,
} from "@/components/herramientas/calculos";
import {
  HerramientaMontoALetras, HerramientaContador, HerramientaConversorTexto,
  HerramientaDuplicados, HerramientaExtraerEmails, HerramientaExtraerFechas,
  HerramientaCompararTextos,
} from "@/components/herramientas/texto";

type Herramienta = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: ComponentType<{ className?: string }>;
  Panel: ComponentType;
};

type Grupo = { titulo: string; herramientas: Herramienta[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "Plazos y fechas",
    herramientas: [
      {
        id: "plazos",
        nombre: "Plazos procesales",
        descripcion: "Vencimiento en días hábiles, con feriados y feria",
        icono: CalendarClock,
        Panel: HerramientaPlazos,
      },
      {
        id: "regresiva",
        nombre: "Fecha límite regresiva",
        descripcion: "Desde cuándo hay que empezar para llegar a tiempo",
        icono: Clock,
        Panel: HerramientaRegresiva,
      },
      {
        id: "distancia",
        nombre: "Ampliación por distancia",
        descripcion: "Días extra según los kilómetros",
        icono: CalendarPlus,
        Panel: HerramientaDistancia,
      },
      {
        id: "caducidad",
        nombre: "Caducidad de instancia",
        descripcion: "Cuándo se cumple el plazo de perención",
        icono: CalendarDays,
        Panel: HerramientaCaducidad,
      },
      {
        id: "diferencia",
        nombre: "Diferencia entre fechas",
        descripcion: "Edad exacta y tiempo transcurrido",
        icono: Columns3,
        Panel: HerramientaDiferenciaFechas,
      },
    ],
  },
  {
    titulo: "Cálculos",
    herramientas: [
      {
        id: "tasa",
        nombre: "Tasa de justicia",
        descripcion: "Ley 23.898, con alícuota reducida y exención",
        icono: Variable,
        Panel: HerramientaTasaJusticia,
      },
      {
        id: "honorarios",
        nombre: "Honorarios",
        descripcion: "Porcentaje sobre el monto, con piso en UMA",
        icono: Stamp,
        Panel: HerramientaHonorarios,
      },
      {
        id: "incapacidad",
        nombre: "Indemnización por incapacidad",
        descripcion: "Fórmulas Vuoto y Méndez",
        icono: UserRound,
        Panel: HerramientaIncapacidad,
      },
      {
        id: "punitivos",
        nombre: "Daños punitivos",
        descripcion: "Multa civil según Irigoyen Testa",
        icono: ShieldAlert,
        Panel: HerramientaPunitivos,
      },
    ],
  },
  {
    titulo: "Texto",
    herramientas: [
      {
        id: "letras",
        nombre: "Monto a letras",
        descripcion: "Importes escritos para contratos",
        icono: Wand2,
        Panel: HerramientaMontoALetras,
      },
      {
        id: "contador",
        nombre: "Contador de palabras",
        descripcion: "Palabras, caracteres, párrafos y carillas",
        icono: List,
        Panel: HerramientaContador,
      },
      {
        id: "conversor",
        nombre: "Conversor de texto",
        descripcion: "Mayúsculas, minúsculas, título y oración",
        icono: Pencil,
        Panel: HerramientaConversorTexto,
      },
      {
        id: "duplicados",
        nombre: "Eliminar duplicados",
        descripcion: "Limpia líneas repetidas de un listado",
        icono: Copy,
        Panel: HerramientaDuplicados,
      },
      {
        id: "emails",
        nombre: "Extraer correos",
        descripcion: "Saca todos los emails de un texto",
        icono: Mail,
        Panel: HerramientaExtraerEmails,
      },
      {
        id: "extraer-fechas",
        nombre: "Extraer fechas",
        descripcion: "Arma la cronología de un relato",
        icono: Search,
        Panel: HerramientaExtraerFechas,
      },
      {
        id: "comparar",
        nombre: "Comparar dos textos",
        descripcion: "Marca qué cambió entre dos versiones",
        icono: Rows3,
        Panel: HerramientaCompararTextos,
      },
    ],
  },
];

const TODAS = GRUPOS.flatMap((g) => g.herramientas);

export default function HerramientasPage() {
  const [, setLocation] = useLocation();
  const [activaId, setActivaId] = useState<string | null>(null);

  const activa = activaId ? TODAS.find((h) => h.id === activaId) ?? null : null;

  if (activa) {
    const Panel = activa.Panel;
    const Icono = activa.icono;
    return (
      <div className="min-h-dvh app-gradient">
        <div className="app-container">
          <header className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              onClick={() => setActivaId(null)}
              data-testid="button-back-herramientas"
            >
              <ArrowLeft className="h-4 w-4" />
              Herramientas
            </button>
          </header>

          <div className="mt-3 flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10">
              <Icono className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl tracking-tight" data-testid="text-herramienta-title">
                {activa.nombre}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{activa.descripcion}</p>
            </div>
          </div>

          <Card className="app-card mt-4 rounded-3xl p-4">
            <Panel />
          </Card>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation("/app/configuracion")}
            data-testid="button-back-settings"
          >
            <ArrowLeft className="h-4 w-4" />
            Configuración
          </button>
        </header>

        <div className="mt-3">
          <h1 className="font-serif text-2xl tracking-tight" data-testid="text-herramientas-title">
            Herramientas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-herramientas-subtitle">
            {TODAS.length} utilidades de cálculo para el trabajo diario. Funcionan en tu teléfono, sin
            enviar nada a ningún servidor.
          </p>
        </div>

        {GRUPOS.map((grupo) => (
          <section key={grupo.titulo} className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {grupo.titulo}
            </h2>
            <div className="mt-2 grid gap-2">
              {grupo.herramientas.map((h) => {
                const Icono = h.icono;
                return (
                  <button
                    key={h.id}
                    className="flex items-start gap-3 rounded-2xl border bg-white/50 px-3 py-3 text-left transition hover:bg-white/80"
                    onClick={() => setActivaId(h.id)}
                    data-testid={`button-herramienta-${h.id}`}
                  >
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                      <Icono className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{h.nombre}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{h.descripcion}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
