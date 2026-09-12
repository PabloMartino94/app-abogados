import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ALICUOTAS, tasaDeJusticia, honorarios, indemnizacionIncapacidad, danosPunitivos,
  formatearPesos, type AlicuotaTasa, type FormulaIncapacidad,
} from "@shared/tools/montos";
import { Aviso, Campo, CampoNumero, Resultado } from "./ui";

export function HerramientaTasaJusticia() {
  const [monto, setMonto] = useState("");
  const [alicuota, setAlicuota] = useState<AlicuotaTasa>("general");

  const resultado = useMemo(() => {
    const m = Number(monto);
    if (!isFinite(m) || m <= 0) return null;
    return tasaDeJusticia(m, alicuota);
  }, [monto, alicuota]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Tasa de justicia de la Ley 23.898, para la justicia nacional y federal.
      </p>
      <CampoNumero etiqueta="Monto del proceso" valor={monto} onChange={setMonto} testId="input-tasa-monto" />
      <Campo etiqueta="Alícuota">
        <Select value={alicuota} onValueChange={(v) => setAlicuota(v as AlicuotaTasa)}>
          <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-tasa-alicuota">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ALICUOTAS) as AlicuotaTasa[]).map((k) => (
              <SelectItem key={k} value={k}>{ALICUOTAS[k].etiqueta}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      {resultado && (
        <>
          <Resultado
            titulo="Tasa a abonar"
            valor={formatearPesos(resultado.tasa)}
            detalle={`${resultado.porcentaje}% sobre ${formatearPesos(Number(monto))}.`}
            testId="resultado-tasa"
          />
          <Aviso>
            Si corresponde el pago diferido o alguna exención, verificá el caso concreto: la
            calculadora sólo aplica la alícuota elegida.
          </Aviso>
        </>
      )}
    </div>
  );
}

export function HerramientaHonorarios() {
  const [monto, setMonto] = useState("");
  const [porcentaje, setPorcentaje] = useState("20");
  const [valorUma, setValorUma] = useState("");
  const [minimoUma, setMinimoUma] = useState("10");

  const resultado = useMemo(() => {
    const m = Number(monto);
    const p = Number(porcentaje);
    const u = Number(valorUma);
    const min = Number(minimoUma);
    if (!isFinite(m) || m <= 0 || !isFinite(p) || !isFinite(u) || !isFinite(min)) return null;
    return honorarios(m, p, u, min);
  }, [monto, porcentaje, valorUma, minimoUma]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Honorarios sobre el monto del proceso, con piso en UMA (Ley 27.423).
      </p>
      <CampoNumero etiqueta="Monto del proceso" valor={monto} onChange={setMonto} testId="input-honorarios-monto" />
      <CampoNumero etiqueta="Porcentaje a aplicar" valor={porcentaje} onChange={setPorcentaje} paso="0.5" testId="input-honorarios-porcentaje" />
      <CampoNumero
        etiqueta="Valor de la UMA"
        valor={valorUma}
        onChange={setValorUma}
        ayuda="La CSJN lo actualiza periódicamente por acordada. Cargá el valor vigente al momento de regular."
        testId="input-honorarios-uma"
      />
      <CampoNumero etiqueta="Mínimo en UMA" valor={minimoUma} onChange={setMinimoUma} testId="input-honorarios-minimo" />

      {resultado && (
        <>
          <Resultado
            titulo="Honorarios a regular"
            valor={formatearPesos(resultado.aRegular)}
            detalle={
              resultado.rigeElMinimo
                ? "Rige el mínimo en UMA, porque supera el cálculo por porcentaje."
                : "Rige el cálculo por porcentaje, porque supera el mínimo en UMA."
            }
            testId="resultado-honorarios"
          />
          <Resultado titulo="Por porcentaje" valor={formatearPesos(resultado.porEscala)} />
          <Resultado
            titulo="Mínimo en UMA"
            valor={formatearPesos(resultado.minimoEnPesos)}
            detalle={`Equivale a ${resultado.enUma.toFixed(2)} UMA.`}
          />
          <Aviso>
            El porcentaje y el mínimo dependen del tipo de proceso, la etapa cumplida y la instancia.
            Esta herramienta hace la cuenta: la escala aplicable la elegís vos.
          </Aviso>
        </>
      )}
    </div>
  );
}

export function HerramientaIncapacidad() {
  const [ingreso, setIngreso] = useState("");
  const [edad, setEdad] = useState("");
  const [incapacidad, setIncapacidad] = useState("");
  const [formula, setFormula] = useState<FormulaIncapacidad>("mendez");

  const resultado = useMemo(() => {
    const i = Number(ingreso);
    const e = Number(edad);
    const inc = Number(incapacidad);
    if (!isFinite(i) || i <= 0 || !isFinite(e) || e <= 0 || !isFinite(inc) || inc <= 0) return null;
    return indemnizacionIncapacidad(i, e, inc, formula);
  }, [ingreso, edad, incapacidad, formula]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Capital que, colocado a interés, se agota al llegar a la edad tope reponiendo la ganancia
        perdida.
      </p>
      <CampoNumero etiqueta="Ingreso mensual" valor={ingreso} onChange={setIngreso} testId="input-incapacidad-ingreso" />
      <CampoNumero etiqueta="Edad al momento del hecho" valor={edad} onChange={setEdad} testId="input-incapacidad-edad" />
      <CampoNumero etiqueta="Porcentaje de incapacidad" valor={incapacidad} onChange={setIncapacidad} paso="0.1" testId="input-incapacidad-porcentaje" />
      <Campo etiqueta="Fórmula">
        <Select value={formula} onValueChange={(v) => setFormula(v as FormulaIncapacidad)}>
          <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-incapacidad-formula">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mendez">Méndez (2008) — tope 75 años, 4%</SelectItem>
            <SelectItem value="vuoto">Vuoto (1978) — tope 65 años, 6%</SelectItem>
          </SelectContent>
        </Select>
      </Campo>

      {resultado && (
        <>
          <Resultado
            titulo="Capital"
            valor={formatearPesos(resultado.capital)}
            detalle={`${resultado.formula}. ${resultado.aniosRestantes} años hasta los ${resultado.edadTope}, a una tasa del ${(resultado.tasa * 100).toFixed(0)}%.`}
            testId="resultado-incapacidad"
          />
          <Resultado
            titulo="Ingreso anual computable"
            valor={formatearPesos(resultado.ingresoAnualComputable)}
            detalle="Trece meses por el sueldo anual complementario, aplicado el porcentaje de incapacidad."
          />
        </>
      )}
    </div>
  );
}

export function HerramientaPunitivos() {
  const [compensatoria, setCompensatoria] = useState("");
  const [probabilidad, setProbabilidad] = useState("50");

  const resultado = useMemo(() => {
    const c = Number(compensatoria);
    const p = Number(probabilidad);
    if (!isFinite(c) || c <= 0 || !isFinite(p) || p <= 0 || p > 100) return null;
    return danosPunitivos(c, p / 100);
  }, [compensatoria, probabilidad]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Multa civil del art. 52 bis de la Ley 24.240, según la fórmula de Irigoyen Testa:
        D = C × (1 − Pc) / Pc.
      </p>
      <CampoNumero etiqueta="Indemnización compensatoria (C)" valor={compensatoria} onChange={setCompensatoria} testId="input-punitivos-compensatoria" />
      <CampoNumero
        etiqueta="Probabilidad de condena (Pc), en %"
        valor={probabilidad}
        onChange={setProbabilidad}
        ayuda="Qué chance hay de que el dañador sea efectivamente condenado a reparar."
        testId="input-punitivos-probabilidad"
      />

      {resultado && (
        <>
          <Resultado
            titulo="Multa civil"
            valor={formatearPesos(resultado.multa)}
            detalle={`Con una probabilidad de condena del ${(resultado.probabilidad * 100).toFixed(0)}%.`}
            testId="resultado-punitivos"
          />
          <Resultado titulo="Total reclamable" valor={formatearPesos(resultado.total)} />
          <Aviso>
            La fórmula da la multa que desalienta el daño en términos económicos. El monto final
            queda a criterio del juez, que pondera además la gravedad y la conducta del proveedor.
          </Aviso>
        </>
      )}
    </div>
  );
}
