import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import type { Valuation } from "@/lib/types";
import { formatearPesos, tasaDeJusticia } from "@shared/tools/montos";
import { diferenciaFechas } from "@shared/tools/fechas";
import {
  calcularValuacion, rubrosDePlantilla, DATOS_INICIALES, PLANTILLAS,
  type DatosValuacion, type PlantillaId,
} from "@shared/tools/valuacion";
import { Aviso, Campo, CampoFecha, CampoNumero, mostrarFecha } from "@/components/herramientas/ui";
import { ListaRubros } from "@/components/valuacion/rubros";
import { PanelResultado } from "@/components/valuacion/resultado";

function numero(valor: string | undefined): number {
  const n = Number(valor);
  return isFinite(n) ? n : 0;
}

export default function ValuacionPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/app/valuacion/:caseId");
  const caseId = params?.caseId ?? "";

  const store = useStore();

  const caseItem = useMemo(() => store.cases.find((c) => c.id === caseId), [store.cases, caseId]);
  const client = useMemo(
    () => (caseItem ? store.clients.find((c) => c.id === caseItem.clientId) ?? null : null),
    [store.clients, caseItem],
  );

  const [datos, setDatos] = useState<DatosValuacion>(DATOS_INICIALES);
  const [nombre, setNombre] = useState("");
  const [guardadas, setGuardadas] = useState<Valuation[]>([]);
  const [valuacionId, setValuacionId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [iniciada, setIniciada] = useState(false);

  // Trae del expediente y del cliente lo que ya está cargado, para no retipear.
  useEffect(() => {
    if (!caseItem || iniciada) return;
    setDatos((previo) => ({
      ...previo,
      fechaHecho: caseItem.incidentDate || "",
      sumaAsegurada: numero(caseItem.policyLimit),
      franquicia: numero(caseItem.deductible),
    }));
  }, [caseItem, iniciada]);

  useEffect(() => {
    if (!caseId) return;
    store
      .listValuations(caseId)
      .then(setGuardadas)
      .catch(() => setGuardadas([]));
    // La lista se recarga sola al guardar; no hace falta observar más.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const resultado = useMemo(() => calcularValuacion(datos), [datos]);

  /** Edad del cliente a la fecha del hecho, o a hoy si no hay fecha del hecho. */
  const edadSugerida = useMemo(() => {
    if (!client?.birthDate) return 0;
    const hasta = datos.fechaHecho || new Date().toISOString().slice(0, 10);
    return diferenciaFechas(client.birthDate, hasta).anios;
  }, [client?.birthDate, datos.fechaHecho]);

  function elegirPlantilla(id: PlantillaId) {
    const rubros = rubrosDePlantilla(id).map((rubro) =>
      rubro.modo === "incapacidad"
        ? {
            ...rubro,
            ingresoMensual: numero(client?.monthlyIncome),
            edad: edadSugerida,
          }
        : rubro,
    );
    setDatos({ ...datos, plantilla: id, rubros });
    setIniciada(true);
  }

  async function guardar() {
    if (guardando || !caseId) return;
    setError("");
    setMensaje("");
    setGuardando(true);
    try {
      const payload = { name: nombre.trim() || "Valuación", data: JSON.stringify(datos) };
      const guardada = valuacionId
        ? await store.updateValuation(valuacionId, payload)
        : await store.createValuation(caseId, payload);
      setValuacionId(guardada.id);
      setNombre(guardada.name);
      setGuardadas(await store.listValuations(caseId));
      setMensaje("Valuación guardada.");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la valuación.");
    } finally {
      setGuardando(false);
    }
  }

  function abrir(valuacion: Valuation) {
    try {
      const parsed = JSON.parse(valuacion.data) as DatosValuacion;
      setDatos({ ...DATOS_INICIALES, ...parsed });
      setNombre(valuacion.name);
      setValuacionId(valuacion.id);
      setIniciada(true);
      setMensaje("");
      setError("");
    } catch {
      setError("Esa valuación guardada está dañada y no se pudo abrir.");
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar esta valuación guardada?")) return;
    try {
      await store.deleteValuation(id);
      setGuardadas(await store.listValuations(caseId));
      if (valuacionId === id) {
        setValuacionId(null);
        setNombre("");
      }
    } catch (err: any) {
      setError(err?.message || "No se pudo eliminar.");
    }
  }

  function usarTasaDeJusticia() {
    const tasa = tasaDeJusticia(resultado.ajustado.pretendido, "general").tasa;
    setDatos({ ...datos, costosLitigio: Math.round(tasa) });
  }

  if (!caseItem) {
    return (
      <div className="min-h-dvh app-gradient">
        <div className="app-container">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation("/app/expedientes")}
            data-testid="button-back-expedientes"
          >
            <ArrowLeft className="h-4 w-4" />
            Expedientes
          </button>
          <p className="mt-6 text-sm text-muted-foreground">No se encontró el expediente.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const sinRubros = datos.rubros.length === 0;

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation(`/app/expedientes/${caseId}`)}
            data-testid="button-back-expediente"
          >
            <ArrowLeft className="h-4 w-4" />
            Expediente
          </button>
        </header>

        <div className="mt-3">
          <h1 className="font-serif text-2xl tracking-tight" data-testid="text-valuacion-title">
            Valuación del caso
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-valuacion-subtitle">
            {caseItem.number} · {caseItem.clientName}
          </p>
        </div>

        {error && (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
            data-testid="text-valuacion-error"
          >
            {error}
          </div>
        )}
        {mensaje && !error && (
          <div
            className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700"
            data-testid="text-valuacion-mensaje"
          >
            {mensaje}
          </div>
        )}

        {guardadas.length > 0 && (
          <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-guardadas">
            <div className="text-sm font-semibold">Valuaciones guardadas</div>
            <div className="mt-2 grid gap-2">
              {guardadas.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border bg-white/50 px-3 py-2"
                  data-testid={`row-valuacion-${v.id}`}
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => abrir(v)}
                    data-testid={`button-abrir-valuacion-${v.id}`}
                  >
                    <div className="truncate text-sm font-semibold">{v.name || "Valuación"}</div>
                    <div className="text-xs text-muted-foreground">
                      {mostrarFecha(String(v.updatedAt).slice(0, 10))}
                      {valuacionId === v.id ? " · abierta" : ""}
                    </div>
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-xl border-red-200 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => eliminar(v.id)}
                    data-testid={`button-eliminar-valuacion-${v.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {sinRubros ? (
          <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-elegir-plantilla">
            <div className="text-sm font-semibold">¿Qué tipo de reclamo es?</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Carga los rubros habituales de esa materia. Después podés agregar o sacar los que quieras.
            </p>
            <div className="mt-3 grid gap-2">
              {PLANTILLAS.map((p) => (
                <button
                  key={p.id}
                  className="rounded-2xl border bg-white/50 px-3 py-3 text-left transition hover:bg-white/80"
                  onClick={() => elegirPlantilla(p.id)}
                  data-testid={`button-plantilla-${p.id}`}
                >
                  <div className="text-sm font-semibold">{p.nombre}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{p.descripcion}</div>
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <>
            <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-rubros">
              <div className="text-sm font-semibold">Rubros del reclamo</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Activá los que correspondan y cargá el mínimo, el pretendido y el máximo de cada uno.
              </p>
              {client?.birthDate || client?.monthlyIncome ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Del cliente se tomaron
                  {client?.monthlyIncome ? ` el ingreso de ${formatearPesos(numero(client.monthlyIncome))}` : ""}
                  {client?.birthDate && client?.monthlyIncome ? " y" : ""}
                  {client?.birthDate ? ` la edad de ${edadSugerida} años` : ""}.
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-700">
                  El cliente no tiene cargada la fecha de nacimiento ni el ingreso: cargalos en su ficha
                  para que las fórmulas se completen solas.
                </p>
              )}
              <div className="mt-3">
                <ListaRubros
                  rubros={datos.rubros}
                  onChange={(rubros) => setDatos({ ...datos, rubros })}
                />
              </div>
            </Card>

            <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-supuestos">
              <div className="text-sm font-semibold">Supuestos del caso</div>

              <div className="mt-3 grid gap-3">
                <CampoNumero
                  etiqueta="Responsabilidad atribuible a la contraparte (%)"
                  valor={String(datos.responsabilidadContraria)}
                  onChange={(v) => setDatos({ ...datos, responsabilidadContraria: Number(v) || 0 })}
                  ayuda="100 si la culpa es toda de ellos. Si hay concurrencia, bajá el porcentaje."
                  testId="input-responsabilidad"
                />

                <div className="grid gap-3 rounded-2xl border bg-white/40 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold">Calcular intereses</div>
                      <div className="text-xs text-muted-foreground">Desde la fecha del hecho</div>
                    </div>
                    <Switch
                      checked={datos.aplicarIntereses}
                      onCheckedChange={(v) => setDatos({ ...datos, aplicarIntereses: v })}
                      data-testid="switch-intereses"
                    />
                  </div>

                  {datos.aplicarIntereses && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <CampoFecha
                          etiqueta="Fecha del hecho"
                          valor={datos.fechaHecho}
                          onChange={(v) => setDatos({ ...datos, fechaHecho: v })}
                          testId="input-fecha-hecho"
                        />
                        <CampoFecha
                          etiqueta="Cuantificación"
                          valor={datos.fechaCuantificacion}
                          onChange={(v) => setDatos({ ...datos, fechaCuantificacion: v })}
                          testId="input-fecha-cuantificacion"
                        />
                      </div>
                      <CampoNumero
                        etiqueta="Tasa de interés puro anual (%)"
                        valor={String(datos.tasaPuraAnual)}
                        onChange={(v) => setDatos({ ...datos, tasaPuraAnual: Number(v) || 0 })}
                        paso="0.5"
                        testId="input-tasa-pura"
                      />
                      <Aviso>
                        La tasa no viene fijada por el sistema. Para montos a valores actuales, la Corte
                        aplica interés puro desde el hecho hasta la cuantificación, y recién después la
                        tasa plena. Confirmá qué tasa corresponde en tu jurisdicción antes de usar el
                        número en una presentación.
                      </Aviso>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <CampoNumero
                    etiqueta="Suma asegurada"
                    valor={String(datos.sumaAsegurada)}
                    onChange={(v) => setDatos({ ...datos, sumaAsegurada: Number(v) || 0 })}
                    testId="input-suma-asegurada"
                  />
                  <CampoNumero
                    etiqueta="Franquicia"
                    valor={String(datos.franquicia)}
                    onChange={(v) => setDatos({ ...datos, franquicia: Number(v) || 0 })}
                    testId="input-franquicia"
                  />
                </div>
                {datos.sumaAsegurada === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sin suma asegurada cargada, el cálculo asume que no hay tope de cobertura.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <CampoNumero
                    etiqueta="Probabilidad de éxito (%)"
                    valor={String(datos.probabilidadExito)}
                    onChange={(v) => setDatos({ ...datos, probabilidadExito: Number(v) || 0 })}
                    testId="input-probabilidad"
                  />
                  <CampoNumero
                    etiqueta="Años hasta cobrar"
                    valor={String(datos.aniosHastaCobro)}
                    onChange={(v) => setDatos({ ...datos, aniosHastaCobro: Number(v) || 0 })}
                    testId="input-anios-cobro"
                  />
                </div>

                <CampoNumero
                  etiqueta="Tasa de descuento anual (%)"
                  valor={String(datos.tasaDescuentoAnual)}
                  onChange={(v) => setDatos({ ...datos, tasaDescuentoAnual: Number(v) || 0 })}
                  ayuda="Para traer a hoy lo que se cobraría dentro de varios años."
                  testId="input-tasa-descuento"
                />

                <div className="grid gap-2">
                  <CampoNumero
                    etiqueta="Costos estimados de litigar"
                    valor={String(datos.costosLitigio)}
                    onChange={(v) => setDatos({ ...datos, costosLitigio: Number(v) || 0 })}
                    testId="input-costos"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit rounded-xl"
                    onClick={usarTasaDeJusticia}
                    data-testid="button-usar-tasa-justicia"
                  >
                    Usar la tasa de justicia (3%)
                  </Button>
                </div>

                <Campo etiqueta="Notas">
                  <Textarea
                    value={datos.notas}
                    onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
                    className="min-h-20 rounded-2xl"
                    placeholder="Fundamentos, antecedentes de casos parecidos, lo que ofreció la aseguradora…"
                    data-testid="textarea-notas"
                  />
                </Campo>
              </div>
            </Card>

            <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-resultado">
              <div className="text-sm font-semibold">Resultado</div>
              <div className="mt-3">
                <PanelResultado resultado={resultado} />
              </div>
            </Card>

            <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-guardar">
              <Campo etiqueta="Nombre de esta valuación">
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Reclamo inicial a la aseguradora"
                  data-testid="input-nombre-valuacion"
                />
              </Campo>
              <Button
                className="mt-3 w-full rounded-2xl"
                onClick={guardar}
                disabled={guardando}
                data-testid="button-guardar-valuacion"
              >
                <Save className="mr-1.5 h-4 w-4" />
                {guardando ? "Guardando…" : valuacionId ? "Guardar cambios" : "Guardar valuación"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Guardar varias versiones sirve para ver cómo se movió el número durante la negociación.
              </p>
            </Card>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
