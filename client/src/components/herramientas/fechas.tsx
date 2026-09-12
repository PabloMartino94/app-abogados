import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  calcularPlazo, calcularRegresivo, calcularCaducidad, diferenciaFechas,
  ampliacionPorDistancia, PLAZOS_CADUCIDAD, type OpcionesHabiles, type TipoCaducidad,
} from "@shared/tools/fechas";
import { Aviso, Campo, CampoFecha, CampoNumero, Resultado, diaDeLaSemana, mostrarFecha } from "./ui";

const HOY = new Date().toISOString().slice(0, 10);

/** Controles de feria judicial y días inhábiles extra, compartidos por varias herramientas. */
function OpcionesFeria({
  opciones,
  setOpciones,
}: {
  opciones: OpcionesHabiles;
  setOpciones: (o: OpcionesHabiles) => void;
}) {
  const [extraTexto, setExtraTexto] = useState("");

  function aplicarExtra(texto: string) {
    setExtraTexto(texto);
    const fechas = texto
      .split(/[\s,;]+/)
      .map((f) => f.trim())
      .filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f));
    setOpciones({ ...opciones, inhabilesExtra: fechas });
  }

  return (
    <div className="grid gap-3 rounded-2xl border bg-white/40 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold">Feria judicial de enero</div>
          <div className="text-xs text-muted-foreground">Todo el mes se cuenta como inhábil</div>
        </div>
        <Switch
          checked={opciones.feriaEnero}
          onCheckedChange={(v) => setOpciones({ ...opciones, feriaEnero: v })}
          data-testid="switch-feria-enero"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Campo etiqueta="Feria de invierno, desde">
          <Input
            type="date"
            value={opciones.feriaJulioDesde ?? ""}
            onChange={(e) => setOpciones({ ...opciones, feriaJulioDesde: e.target.value })}
            data-testid="input-feria-desde"
          />
        </Campo>
        <Campo etiqueta="hasta">
          <Input
            type="date"
            value={opciones.feriaJulioHasta ?? ""}
            onChange={(e) => setOpciones({ ...opciones, feriaJulioHasta: e.target.value })}
            data-testid="input-feria-hasta"
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Otros días inhábiles"
        ayuda="Una fecha por línea, en formato aaaa-mm-dd. Sirve para asuetos, paros o feriados provinciales."
      >
        <Textarea
          value={extraTexto}
          onChange={(e) => aplicarExtra(e.target.value)}
          className="min-h-16 rounded-2xl font-mono text-xs"
          placeholder="2026-04-30"
          data-testid="textarea-inhabiles-extra"
        />
      </Campo>

      <Aviso>
        Se computan los feriados nacionales fijos, los trasladables y los que dependen de la Pascua.
        Los puentes turísticos y las ferias que se fijan por acordada cada año hay que cargarlos acá a
        mano. Verificá siempre el vencimiento antes de presentar.
      </Aviso>
    </div>
  );
}

function ListaSalteados({ salteados }: { salteados: { fecha: string; motivo: string }[] }) {
  if (salteados.length === 0) return null;
  return (
    <details className="rounded-2xl border bg-white/40 px-3 py-2">
      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
        {salteados.length} día{salteados.length === 1 ? "" : "s"} salteado
        {salteados.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-2 grid gap-1">
        {salteados.map((s, i) => (
          <div key={i} className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{mostrarFecha(s.fecha)}</span>
            <span className="text-right">{s.motivo}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

export function HerramientaPlazos() {
  const [notificacion, setNotificacion] = useState(HOY);
  const [dias, setDias] = useState("5");
  const [opciones, setOpciones] = useState<OpcionesHabiles>({ feriaEnero: true, inhabilesExtra: [] });

  const resultado = useMemo(() => {
    const n = Number(dias);
    if (!notificacion || !isFinite(n) || n <= 0) return null;
    return calcularPlazo(notificacion, Math.floor(n), opciones);
  }, [notificacion, dias, opciones]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        El plazo empieza a correr el día hábil siguiente a la notificación (art. 156 CPCCN).
      </p>
      <CampoFecha etiqueta="Fecha de notificación" valor={notificacion} onChange={setNotificacion} testId="input-plazo-notificacion" />
      <CampoNumero etiqueta="Cantidad de días hábiles" valor={dias} onChange={setDias} testId="input-plazo-dias" />
      <OpcionesFeria opciones={opciones} setOpciones={setOpciones} />

      {resultado && (
        <>
          <Resultado
            titulo="Vence el"
            valor={`${mostrarFecha(resultado.vencimiento)} (${diaDeLaSemana(resultado.vencimiento)})`}
            testId="resultado-plazo"
          />
          <Resultado
            titulo="Plazo de gracia"
            valor={`${mostrarFecha(resultado.plazoDeGracia)} (${diaDeLaSemana(resultado.plazoDeGracia)})`}
            detalle="Dentro de las dos primeras horas del despacho de ese día (art. 124 CPCCN)."
          />
          <ListaSalteados salteados={resultado.salteados} />
        </>
      )}
    </div>
  );
}

export function HerramientaRegresiva() {
  const [objetivo, setObjetivo] = useState(HOY);
  const [dias, setDias] = useState("10");
  const [opciones, setOpciones] = useState<OpcionesHabiles>({ feriaEnero: true, inhabilesExtra: [] });

  const resultado = useMemo(() => {
    const n = Number(dias);
    if (!objetivo || !isFinite(n) || n <= 0) return null;
    return calcularRegresivo(objetivo, Math.floor(n), opciones);
  }, [objetivo, dias, opciones]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Para saber desde cuándo hay que empezar a trabajar para llegar a una fecha.
      </p>
      <CampoFecha etiqueta="Fecha objetivo" valor={objetivo} onChange={setObjetivo} testId="input-regresiva-objetivo" />
      <CampoNumero etiqueta="Días hábiles de anticipación" valor={dias} onChange={setDias} testId="input-regresiva-dias" />
      <OpcionesFeria opciones={opciones} setOpciones={setOpciones} />

      {resultado && (
        <>
          <Resultado
            titulo="Hay que arrancar el"
            valor={`${mostrarFecha(resultado.inicio)} (${diaDeLaSemana(resultado.inicio)})`}
            testId="resultado-regresiva"
          />
          <ListaSalteados salteados={resultado.salteados} />
        </>
      )}
    </div>
  );
}

export function HerramientaDistancia() {
  const [km, setKm] = useState("");

  const dias = useMemo(() => ampliacionPorDistancia(Number(km)), [km]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Un día más de plazo por cada 200 km o fracción que exceda esa distancia (art. 158 CPCCN).
      </p>
      <CampoNumero etiqueta="Distancia en kilómetros" valor={km} onChange={setKm} testId="input-distancia-km" />
      {km && (
        <Resultado
          titulo="Ampliación"
          valor={`${dias} día${dias === 1 ? "" : "s"}`}
          detalle="Se suma al plazo original, en días hábiles."
          testId="resultado-distancia"
        />
      )}
    </div>
  );
}

export function HerramientaCaducidad() {
  const [ultimoActo, setUltimoActo] = useState(HOY);
  const [tipo, setTipo] = useState<TipoCaducidad>("primera");
  const [opciones, setOpciones] = useState<OpcionesHabiles>({ feriaEnero: true, inhabilesExtra: [] });

  const resultado = useMemo(() => {
    if (!ultimoActo) return null;
    return calcularCaducidad(ultimoActo, tipo, opciones);
  }, [ultimoActo, tipo, opciones]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Plazos de los arts. 310 y 311 del CPCCN, contados en meses corridos desde el último acto de
        impulso.
      </p>
      <CampoFecha etiqueta="Último acto de impulso" valor={ultimoActo} onChange={setUltimoActo} testId="input-caducidad-acto" />
      <Campo etiqueta="Instancia">
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCaducidad)}>
          <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-caducidad-tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PLAZOS_CADUCIDAD) as TipoCaducidad[]).map((k) => (
              <SelectItem key={k} value={k}>{PLAZOS_CADUCIDAD[k].etiqueta}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>
      <OpcionesFeria opciones={opciones} setOpciones={setOpciones} />

      {resultado && (
        <>
          <Resultado
            titulo="Se cumplen los meses el"
            valor={mostrarFecha(resultado.vencimiento)}
            detalle={`${resultado.meses} meses corridos desde el último acto.`}
            testId="resultado-caducidad"
          />
          {resultado.vencimientoHabil !== resultado.vencimiento && (
            <Resultado
              titulo="Primer día hábil siguiente"
              valor={`${mostrarFecha(resultado.vencimientoHabil)} (${diaDeLaSemana(resultado.vencimientoHabil)})`}
              detalle="La fecha exacta caía en día inhábil o en feria."
            />
          )}
          <Aviso>
            El cómputo no contempla suspensiones ni interrupciones del plazo. Revisá el expediente
            antes de acusar o contestar una caducidad.
          </Aviso>
        </>
      )}
    </div>
  );
}

export function HerramientaDiferenciaFechas() {
  const [desde, setDesde] = useState("1990-01-01");
  const [hasta, setHasta] = useState(HOY);

  const resultado = useMemo(() => {
    if (!desde || !hasta) return null;
    return diferenciaFechas(desde, hasta);
  }, [desde, hasta]);

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Sirve para la edad exacta de una persona o para medir cuánto pasó entre dos hechos.
      </p>
      <CampoFecha etiqueta="Desde" valor={desde} onChange={setDesde} testId="input-diferencia-desde" />
      <CampoFecha etiqueta="Hasta" valor={hasta} onChange={setHasta} testId="input-diferencia-hasta" />

      {resultado && (
        <>
          <Resultado
            titulo="Diferencia"
            valor={`${resultado.anios} años, ${resultado.meses} meses y ${resultado.dias} días`}
            testId="resultado-diferencia"
          />
          <Resultado
            titulo="En días corridos"
            valor={resultado.diasTotales.toLocaleString("es-AR")}
          />
        </>
      )}
    </div>
  );
}
