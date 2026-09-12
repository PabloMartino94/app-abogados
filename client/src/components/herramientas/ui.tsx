import type { PropsWithChildren, ReactNode } from "react";

import { Input } from "@/components/ui/input";

export function Campo({
  etiqueta,
  ayuda,
  children,
}: PropsWithChildren<{ etiqueta: string; ayuda?: string }>) {
  return (
    <div className="grid gap-2">
      <label className="text-xs font-semibold text-muted-foreground">{etiqueta}</label>
      {children}
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

export function CampoNumero({
  etiqueta,
  valor,
  onChange,
  ayuda,
  paso,
  testId,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  ayuda?: string;
  paso?: string;
  testId?: string;
}) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <Input
        type="number"
        inputMode="decimal"
        step={paso}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      />
    </Campo>
  );
}

export function CampoFecha({
  etiqueta,
  valor,
  onChange,
  ayuda,
  testId,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  ayuda?: string;
  testId?: string;
}) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <Input type="date" value={valor} onChange={(e) => onChange(e.target.value)} data-testid={testId} />
    </Campo>
  );
}

/** Recuadro de resultado: destaca el dato principal sin ruido alrededor. */
export function Resultado({
  titulo,
  valor,
  detalle,
  testId,
}: {
  titulo: string;
  valor: ReactNode;
  detalle?: ReactNode;
  testId?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/60 px-3 py-3" data-testid={testId}>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </div>
      <div className="mt-1 text-lg font-semibold text-foreground">{valor}</div>
      {detalle && <div className="mt-1.5 text-xs text-muted-foreground">{detalle}</div>}
    </div>
  );
}

export function Aviso({ children }: PropsWithChildren) {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
      {children}
    </p>
  );
}

/** Convierte "2026-09-12" a "12/09/2026" para mostrar. */
export function mostrarFecha(iso: string): string {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function diaDeLaSemana(iso: string): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-").map(Number);
  return DIAS_SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}
