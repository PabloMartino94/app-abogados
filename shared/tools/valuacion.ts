// Valuación de casos: cuánto vale el reclamo, cuánto es cobrable de verdad y
// desde qué número conviene negociar.
//
// La cadena de cálculo es: liquidación por rubros -> intereses -> ajuste por
// responsabilidad -> tope por la póliza -> rango de negociación.
//
// Sin dependencias externas salvo las fórmulas de incapacidad, que ya viven en
// el módulo de montos y están probadas aparte.

import { indemnizacionIncapacidad } from "./montos";

export type Tripleta = { min: number; pretendido: number; max: number };

export type ModoRubro = "manual" | "incapacidad";

export type Rubro = {
  id: string;
  etiqueta: string;
  modo: ModoRubro;
  incluido: boolean;
  nota?: string;

  // Modo manual: los tres valores los carga el abogado.
  min?: number;
  pretendido?: number;
  max?: number;

  // Modo incapacidad: el piso y el techo salen de las dos fórmulas aceptadas.
  ingresoMensual?: number;
  edad?: number;
  porcentaje?: number;
  /** Si está cargado, reemplaza el valor pretendido que sugiere la fórmula. */
  pretendidoOverride?: number;
};

export type PlantillaId = "accidente_transito" | "despido" | "consumo" | "generico";

export type Plantilla = {
  id: PlantillaId;
  nombre: string;
  descripcion: string;
  rubros: { etiqueta: string; modo: ModoRubro; nota?: string }[];
};

export const PLANTILLAS: Plantilla[] = [
  {
    id: "accidente_transito",
    nombre: "Accidente de tránsito",
    descripcion: "Reclamo por daños contra el responsable y su aseguradora",
    rubros: [
      { etiqueta: "Incapacidad sobreviniente física", modo: "incapacidad", nota: "Art. 1746 CCyC. El piso lo da Vuoto y el techo Méndez." },
      { etiqueta: "Incapacidad sobreviniente psíquica", modo: "incapacidad", nota: "Según el porcentaje que asigne la pericia psicológica." },
      { etiqueta: "Daño moral", modo: "manual", nota: "Art. 1741 CCyC: cotizar la satisfacción sustitutiva concreta (un viaje, un vehículo, un bien determinado)." },
      { etiqueta: "Gastos médicos y de farmacia", modo: "manual", nota: "Documentados, más los que se presumen según la entidad de las lesiones." },
      { etiqueta: "Gastos de traslado", modo: "manual" },
      { etiqueta: "Tratamiento psicológico", modo: "manual", nota: "Cantidad de sesiones por valor de sesión." },
      { etiqueta: "Lucro cesante", modo: "manual", nota: "Ingresos efectivamente perdidos durante la incapacidad transitoria." },
      { etiqueta: "Privación de uso del vehículo", modo: "manual", nota: "Días sin el rodado por un valor diario." },
      { etiqueta: "Desvalorización venal del rodado", modo: "manual" },
      { etiqueta: "Reparación del vehículo", modo: "manual", nota: "Según presupuesto." },
    ],
  },
  {
    id: "despido",
    nombre: "Despido",
    descripcion: "Liquidación final e indemnizaciones",
    rubros: [
      { etiqueta: "Indemnización por antigüedad", modo: "manual", nota: "Mejor remuneración mensual, normal y habitual, por año de servicio." },
      { etiqueta: "Preaviso", modo: "manual" },
      { etiqueta: "Integración del mes de despido", modo: "manual" },
      { etiqueta: "SAC proporcional", modo: "manual" },
      { etiqueta: "Vacaciones proporcionales", modo: "manual" },
      { etiqueta: "Multas e incrementos", modo: "manual", nota: "Según las intimaciones cursadas y la registración." },
      { etiqueta: "Daño moral", modo: "manual", nota: "Sólo si hay un agravio que exceda el despido en sí." },
    ],
  },
  {
    id: "consumo",
    nombre: "Derecho del consumidor",
    descripcion: "Reclamo por incumplimiento o producto defectuoso",
    rubros: [
      { etiqueta: "Daño emergente", modo: "manual" },
      { etiqueta: "Daño moral", modo: "manual" },
      { etiqueta: "Daño punitivo", modo: "manual", nota: "Art. 52 bis Ley 24.240. La herramienta de daños punitivos calcula la multa óptima." },
      { etiqueta: "Gastos", modo: "manual" },
    ],
  },
  {
    id: "generico",
    nombre: "Genérico",
    descripcion: "Rubros libres, para cualquier otro reclamo",
    rubros: [{ etiqueta: "Rubro", modo: "manual" }],
  },
];

export type DatosValuacion = {
  plantilla: PlantillaId;
  rubros: Rubro[];

  /** Porcentaje del daño atribuible a la contraparte. 100 = responsabilidad total. */
  responsabilidadContraria: number;

  // Intereses: dos tramos, según la doctrina de la Corte para montos fijados a
  // valores actuales. La tasa no está fijada por el sistema a propósito.
  fechaHecho: string;
  fechaCuantificacion: string;
  tasaPuraAnual: number;
  aplicarIntereses: boolean;

  // Cobrabilidad.
  sumaAsegurada: number;
  franquicia: number;

  // Costo de litigar, para el piso de negociación.
  probabilidadExito: number;
  aniosHastaCobro: number;
  tasaDescuentoAnual: number;
  costosLitigio: number;

  notas: string;
};

export const DATOS_INICIALES: DatosValuacion = {
  plantilla: "accidente_transito",
  rubros: [],
  responsabilidadContraria: 100,
  fechaHecho: "",
  fechaCuantificacion: new Date().toISOString().slice(0, 10),
  tasaPuraAnual: 6,
  aplicarIntereses: true,
  sumaAsegurada: 0,
  franquicia: 0,
  probabilidadExito: 70,
  aniosHastaCobro: 3,
  tasaDescuentoAnual: 6,
  costosLitigio: 0,
  notas: "",
};

export function rubrosDePlantilla(id: PlantillaId): Rubro[] {
  const plantilla = PLANTILLAS.find((p) => p.id === id) ?? PLANTILLAS[PLANTILLAS.length - 1];
  return plantilla.rubros.map((r, i) => ({
    id: `${id}-${i}`,
    etiqueta: r.etiqueta,
    modo: r.modo,
    nota: r.nota,
    incluido: false,
    min: 0,
    pretendido: 0,
    max: 0,
  }));
}

/** Valores de un rubro. En incapacidad, el piso es Vuoto y el techo Méndez. */
export function calcularRubro(rubro: Rubro): Tripleta {
  if (!rubro.incluido) return { min: 0, pretendido: 0, max: 0 };

  if (rubro.modo === "incapacidad") {
    const ingreso = rubro.ingresoMensual ?? 0;
    const edad = rubro.edad ?? 0;
    const porcentaje = rubro.porcentaje ?? 0;
    if (ingreso <= 0 || edad <= 0 || porcentaje <= 0) {
      return { min: 0, pretendido: 0, max: 0 };
    }
    const vuoto = indemnizacionIncapacidad(ingreso, edad, porcentaje, "vuoto").capital;
    const mendez = indemnizacionIncapacidad(ingreso, edad, porcentaje, "mendez").capital;
    const min = Math.min(vuoto, mendez);
    const max = Math.max(vuoto, mendez);
    return {
      min,
      pretendido: rubro.pretendidoOverride ?? max,
      max,
    };
  }

  const min = rubro.min ?? 0;
  const max = rubro.max ?? 0;
  const pretendido = rubro.pretendido ?? 0;
  return { min, pretendido, max };
}

function sumar(a: Tripleta, b: Tripleta): Tripleta {
  return {
    min: a.min + b.min,
    pretendido: a.pretendido + b.pretendido,
    max: a.max + b.max,
  };
}

function escalar(t: Tripleta, factor: number): Tripleta {
  return {
    min: t.min * factor,
    pretendido: t.pretendido * factor,
    max: t.max * factor,
  };
}

const MS_ANIO = 365.25 * 24 * 60 * 60 * 1000;

/** Años transcurridos entre dos fechas, con decimales. */
export function aniosEntre(desdeIso: string, hastaIso: string): number {
  if (!desdeIso || !hastaIso) return 0;
  const desde = new Date(`${desdeIso}T00:00:00Z`).getTime();
  const hasta = new Date(`${hastaIso}T00:00:00Z`).getTime();
  if (!isFinite(desde) || !isFinite(hasta) || hasta <= desde) return 0;
  return (hasta - desde) / MS_ANIO;
}

export type ResultadoValuacion = {
  /** Suma de los rubros incluidos. */
  liquidacion: Tripleta;
  /** Intereses puros desde el hecho hasta la cuantificación. */
  intereses: Tripleta;
  aniosDeIntereses: number;
  /** Liquidación más intereses. */
  reclamo: Tripleta;
  /** Reclamo después de descontar la responsabilidad que no es de la contraparte. */
  ajustado: Tripleta;
  /** Lo que puede pagar la aseguradora: tope en la póliza, menos la franquicia. */
  cobrableDeAseguradora: Tripleta;
  /** Lo que excede la póliza y queda a cargo del asegurado. */
  excedentePoliza: Tripleta;
  /** Valor presente de litigar: probabilidad por monto, descontado, menos costos. */
  valorEsperadoLitigio: number;
  rango: { apertura: number; objetivo: number; piso: number };
  /** true si el tope de la póliza está recortando el reclamo. */
  limitadoPorPoliza: boolean;
};

export function calcularValuacion(datos: DatosValuacion): ResultadoValuacion {
  const liquidacion = datos.rubros
    .map(calcularRubro)
    .reduce(sumar, { min: 0, pretendido: 0, max: 0 });

  const aniosDeIntereses = datos.aplicarIntereses
    ? aniosEntre(datos.fechaHecho, datos.fechaCuantificacion)
    : 0;

  // Interés puro y simple sobre el capital, que es como se liquida el primer
  // tramo cuando el monto se fija a valores actuales.
  const factorInteres = (datos.tasaPuraAnual / 100) * aniosDeIntereses;
  const intereses = escalar(liquidacion, factorInteres);
  const reclamo = sumar(liquidacion, intereses);

  const factorResponsabilidad = Math.min(Math.max(datos.responsabilidadContraria, 0), 100) / 100;
  const ajustado = escalar(reclamo, factorResponsabilidad);

  const topePoliza = datos.sumaAsegurada > 0 ? datos.sumaAsegurada : Infinity;
  const franquicia = Math.max(datos.franquicia, 0);

  const cobrar = (monto: number) => {
    if (!isFinite(topePoliza)) return monto;
    return Math.max(0, Math.min(monto, topePoliza) - franquicia);
  };
  const exceder = (monto: number) => {
    if (!isFinite(topePoliza)) return 0;
    return Math.max(0, monto - topePoliza);
  };

  const cobrableDeAseguradora: Tripleta = {
    min: cobrar(ajustado.min),
    pretendido: cobrar(ajustado.pretendido),
    max: cobrar(ajustado.max),
  };

  const excedentePoliza: Tripleta = {
    min: exceder(ajustado.min),
    pretendido: exceder(ajustado.pretendido),
    max: exceder(ajustado.max),
  };

  // Valor presente de ganar el juicio dentro de N años, por la probabilidad de
  // ganarlo, menos lo que cuesta litigarlo.
  const probabilidad = Math.min(Math.max(datos.probabilidadExito, 0), 100) / 100;
  const descuento = Math.pow(1 + datos.tasaDescuentoAnual / 100, Math.max(datos.aniosHastaCobro, 0));
  const valorPresente = descuento > 0 ? cobrableDeAseguradora.pretendido / descuento : 0;
  const valorEsperadoLitigio = Math.max(0, probabilidad * valorPresente - Math.max(datos.costosLitigio, 0));

  const apertura = ajustado.max;
  const objetivo = Math.min(ajustado.pretendido, cobrableDeAseguradora.pretendido || ajustado.pretendido);

  return {
    liquidacion,
    intereses,
    aniosDeIntereses,
    reclamo,
    ajustado,
    cobrableDeAseguradora,
    excedentePoliza,
    valorEsperadoLitigio,
    rango: {
      apertura,
      objetivo,
      piso: Math.min(valorEsperadoLitigio, objetivo),
    },
    limitadoPorPoliza: excedentePoliza.pretendido > 0,
  };
}
