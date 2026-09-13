import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatearPesos } from "@shared/tools/montos";
import { calcularRubro, type Rubro } from "@shared/tools/valuacion";

function CampoChico({
  etiqueta,
  valor,
  onChange,
  testId,
}: {
  etiqueta: string;
  valor: number | undefined;
  onChange: (v: number) => void;
  testId?: string;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-[11px] font-semibold text-muted-foreground">{etiqueta}</label>
      <Input
        type="number"
        inputMode="decimal"
        className="h-9 rounded-xl"
        value={valor === undefined || valor === 0 ? "" : String(valor)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        data-testid={testId}
      />
    </div>
  );
}

export function FilaRubro({
  rubro,
  onChange,
  onEliminar,
}: {
  rubro: Rubro;
  onChange: (r: Rubro) => void;
  onEliminar: () => void;
}) {
  const valores = calcularRubro(rubro);
  const esIncapacidad = rubro.modo === "incapacidad";

  return (
    <div
      className={`rounded-2xl border px-3 py-3 ${rubro.incluido ? "bg-white/70" : "bg-white/40"}`}
      data-testid={`rubro-${rubro.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${rubro.incluido ? "" : "text-muted-foreground"}`}>
            {rubro.etiqueta}
          </div>
          {rubro.nota && <div className="mt-0.5 text-xs text-muted-foreground">{rubro.nota}</div>}
        </div>
        <Switch
          checked={rubro.incluido}
          onCheckedChange={(v) => onChange({ ...rubro, incluido: v })}
          data-testid={`switch-rubro-${rubro.id}`}
        />
      </div>

      {rubro.incluido && (
        <div className="mt-3 grid gap-3">
          {esIncapacidad ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <CampoChico
                  etiqueta="Ingreso mensual"
                  valor={rubro.ingresoMensual}
                  onChange={(v) => onChange({ ...rubro, ingresoMensual: v })}
                  testId={`input-ingreso-${rubro.id}`}
                />
                <CampoChico
                  etiqueta="Edad"
                  valor={rubro.edad}
                  onChange={(v) => onChange({ ...rubro, edad: v })}
                  testId={`input-edad-${rubro.id}`}
                />
                <CampoChico
                  etiqueta="% incapacidad"
                  valor={rubro.porcentaje}
                  onChange={(v) => onChange({ ...rubro, porcentaje: v })}
                  testId={`input-porcentaje-${rubro.id}`}
                />
              </div>

              <div className="grid gap-1 rounded-xl border bg-white/50 px-2.5 py-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Piso, fórmula Vuoto</span>
                  <span className="font-semibold">{formatearPesos(valores.min)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Techo, fórmula Méndez</span>
                  <span className="font-semibold">{formatearPesos(valores.max)}</span>
                </div>
              </div>

              <CampoChico
                etiqueta="Valor pretendido (vacío = usar el techo)"
                valor={rubro.pretendidoOverride}
                onChange={(v) => onChange({ ...rubro, pretendidoOverride: v || undefined })}
                testId={`input-override-${rubro.id}`}
              />
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <CampoChico
                etiqueta="Mínimo"
                valor={rubro.min}
                onChange={(v) => onChange({ ...rubro, min: v })}
                testId={`input-min-${rubro.id}`}
              />
              <CampoChico
                etiqueta="Pretendido"
                valor={rubro.pretendido}
                onChange={(v) => onChange({ ...rubro, pretendido: v })}
                testId={`input-pretendido-${rubro.id}`}
              />
              <CampoChico
                etiqueta="Máximo"
                valor={rubro.max}
                onChange={(v) => onChange({ ...rubro, max: v })}
                testId={`input-max-${rubro.id}`}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Aporta {formatearPesos(valores.pretendido)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-red-200 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onEliminar}
              data-testid={`button-eliminar-rubro-${rubro.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ListaRubros({
  rubros,
  onChange,
}: {
  rubros: Rubro[];
  onChange: (rubros: Rubro[]) => void;
}) {
  function actualizar(index: number, rubro: Rubro) {
    onChange(rubros.map((r, i) => (i === index ? rubro : r)));
  }

  function eliminar(index: number) {
    onChange(rubros.filter((_, i) => i !== index));
  }

  function agregar(modo: "manual" | "incapacidad") {
    onChange([
      ...rubros,
      {
        id: `nuevo-${Date.now()}`,
        etiqueta: modo === "incapacidad" ? "Incapacidad" : "Rubro nuevo",
        modo,
        incluido: true,
        min: 0,
        pretendido: 0,
        max: 0,
      },
    ]);
  }

  return (
    <div className="grid gap-2">
      {rubros.map((rubro, i) => (
        <FilaRubro
          key={rubro.id}
          rubro={rubro}
          onChange={(r) => actualizar(i, r)}
          onEliminar={() => eliminar(i)}
        />
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => agregar("manual")}
          data-testid="button-agregar-rubro"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Agregar rubro
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => agregar("incapacidad")}
          data-testid="button-agregar-incapacidad"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Agregar incapacidad
        </Button>
      </div>
    </div>
  );
}
