// Cálculos de fechas y plazos para la práctica forense argentina.
// Sin dependencias externas: se puede probar y usar tanto en el servidor
// como en el navegador.

export type DiaInhabil = { fecha: string; motivo: string };

export type OpcionesHabiles = {
  /** Feria judicial de enero (todo el mes). */
  feriaEnero: boolean;
  /** Feria judicial de invierno, en formato YYYY-MM-DD. */
  feriaJulioDesde?: string;
  feriaJulioHasta?: string;
  /** Fechas extra que el abogado sabe inhábiles (asuetos, paros, feriados locales). */
  inhabilesExtra?: string[];
};

export const OPCIONES_POR_DEFECTO: OpcionesHabiles = {
  feriaEnero: true,
  inhabilesExtra: [],
};

const MS_DIA = 24 * 60 * 60 * 1000;

/** Fecha en UTC a partir de "YYYY-MM-DD", para que no intervenga la zona horaria. */
export function parseFecha(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatFecha(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function sumarDias(date: Date, dias: number): Date {
  return new Date(date.getTime() + dias * MS_DIA);
}

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
export function domingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/**
 * Traslada un feriado trasladable al lunes siguiente cuando cae martes o
 * miércoles, y al lunes anterior cuando cae jueves o viernes (Ley 27.399).
 */
function trasladar(date: Date): Date {
  const dow = date.getUTCDay();
  if (dow === 2 || dow === 3) return sumarDias(date, dow === 2 ? 6 : 5);
  if (dow === 4 || dow === 5) return sumarDias(date, dow === 4 ? -3 : -4);
  return date;
}

/**
 * Feriados nacionales de un año. Incluye los inamovibles, los trasladables y
 * los que dependen de la Pascua. NO incluye los días no laborables ni los
 * "puentes turísticos", que se fijan por decreto cada año.
 */
export function feriadosNacionales(anio: number): DiaInhabil[] {
  const pascua = domingoDePascua(anio);

  const lista: DiaInhabil[] = [
    { fecha: formatFecha(new Date(Date.UTC(anio, 0, 1))), motivo: "Año Nuevo" },
    { fecha: formatFecha(sumarDias(pascua, -48)), motivo: "Carnaval" },
    { fecha: formatFecha(sumarDias(pascua, -47)), motivo: "Carnaval" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 2, 24))), motivo: "Día de la Memoria" },
    { fecha: formatFecha(sumarDias(pascua, -2)), motivo: "Viernes Santo" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 3, 2))), motivo: "Día del Veterano y de los Caídos en Malvinas" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 4, 1))), motivo: "Día del Trabajador" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 4, 25))), motivo: "Día de la Revolución de Mayo" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 5, 20))), motivo: "Paso a la Inmortalidad del Gral. Belgrano" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 6, 9))), motivo: "Día de la Independencia" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 11, 8))), motivo: "Inmaculada Concepción de María" },
    { fecha: formatFecha(new Date(Date.UTC(anio, 11, 25))), motivo: "Navidad" },
  ];

  // Trasladables.
  lista.push({
    fecha: formatFecha(trasladar(new Date(Date.UTC(anio, 7, 17)))),
    motivo: "Paso a la Inmortalidad del Gral. San Martín",
  });
  lista.push({
    fecha: formatFecha(trasladar(new Date(Date.UTC(anio, 9, 12)))),
    motivo: "Día del Respeto a la Diversidad Cultural",
  });
  lista.push({
    fecha: formatFecha(trasladar(new Date(Date.UTC(anio, 10, 20)))),
    motivo: "Día de la Soberanía Nacional",
  });

  return lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Devuelve el motivo por el que la fecha es inhábil, o null si es hábil. */
export function motivoInhabil(date: Date, opciones: OpcionesHabiles): string | null {
  const dow = date.getUTCDay();
  if (dow === 0) return "Domingo";
  if (dow === 6) return "Sábado";

  const iso = formatFecha(date);

  if (opciones.inhabilesExtra?.includes(iso)) return "Día inhábil cargado a mano";

  if (opciones.feriaEnero && date.getUTCMonth() === 0) return "Feria judicial de enero";

  if (opciones.feriaJulioDesde && opciones.feriaJulioHasta) {
    if (iso >= opciones.feriaJulioDesde && iso <= opciones.feriaJulioHasta) {
      return "Feria judicial de invierno";
    }
  }

  const feriado = feriadosNacionales(date.getUTCFullYear()).find((f) => f.fecha === iso);
  if (feriado) return feriado.motivo;

  return null;
}

export function esDiaHabil(date: Date, opciones: OpcionesHabiles): boolean {
  return motivoInhabil(date, opciones) === null;
}

export function proximoDiaHabil(date: Date, opciones: OpcionesHabiles): Date {
  let cursor = date;
  let guard = 0;
  while (!esDiaHabil(cursor, opciones) && guard < 400) {
    cursor = sumarDias(cursor, 1);
    guard++;
  }
  return cursor;
}

export type ResultadoPlazo = {
  vencimiento: string;
  /** Primeras dos horas hábiles del día siguiente (art. 124 CPCCN). */
  plazoDeGracia: string;
  salteados: DiaInhabil[];
};

/**
 * Vencimiento de un plazo en días hábiles judiciales. El cómputo arranca el
 * día hábil siguiente a la notificación (art. 156 CPCCN).
 */
export function calcularPlazo(
  notificacion: string,
  dias: number,
  opciones: OpcionesHabiles
): ResultadoPlazo {
  const salteados: DiaInhabil[] = [];
  let cursor = parseFecha(notificacion);
  let contados = 0;
  let guard = 0;

  while (contados < dias && guard < 3000) {
    cursor = sumarDias(cursor, 1);
    const motivo = motivoInhabil(cursor, opciones);
    if (motivo) {
      salteados.push({ fecha: formatFecha(cursor), motivo });
    } else {
      contados++;
    }
    guard++;
  }

  const gracia = proximoDiaHabil(sumarDias(cursor, 1), opciones);

  return {
    vencimiento: formatFecha(cursor),
    plazoDeGracia: formatFecha(gracia),
    salteados,
  };
}

/**
 * Fecha límite regresiva: desde cuándo hay que arrancar, contando hacia atrás
 * en días hábiles, para llegar a tiempo a una fecha objetivo.
 */
export function calcularRegresivo(
  objetivo: string,
  dias: number,
  opciones: OpcionesHabiles
): { inicio: string; salteados: DiaInhabil[] } {
  const salteados: DiaInhabil[] = [];
  let cursor = parseFecha(objetivo);
  let contados = 0;
  let guard = 0;

  while (contados < dias && guard < 3000) {
    cursor = sumarDias(cursor, -1);
    const motivo = motivoInhabil(cursor, opciones);
    if (motivo) {
      salteados.push({ fecha: formatFecha(cursor), motivo });
    } else {
      contados++;
    }
    guard++;
  }

  return { inicio: formatFecha(cursor), salteados };
}

/**
 * Ampliación del plazo por distancia: un día cada 200 km o fracción que exceda
 * los 200 km (art. 158 CPCCN).
 */
export function ampliacionPorDistancia(km: number): number {
  if (!isFinite(km) || km <= 0) return 0;
  return Math.floor(km / 200);
}

export type DiferenciaFechas = {
  anios: number;
  meses: number;
  dias: number;
  diasTotales: number;
};

/**
 * Suma meses a una fecha. Si el día no existe en el mes destino (por ejemplo,
 * un 31 sumado a un mes de 30), cae al último día de ese mes.
 */
export function sumarMeses(date: Date, meses: number): Date {
  const anio = date.getUTCFullYear();
  const mes = date.getUTCMonth() + meses;
  const dia = date.getUTCDate();
  const destino = new Date(Date.UTC(anio, mes, dia));
  // Si se pasó de mes, el día no existía: se retrocede al último día real.
  if (destino.getUTCDate() !== dia) destino.setUTCDate(0);
  return destino;
}

/**
 * Diferencia entre dos fechas, en años, meses y días, y en días corridos.
 * Se cuentan primero los meses completos y después los días sobrantes, que es
 * como se calcula una edad: evita los restos negativos de restar campo a campo.
 */
export function diferenciaFechas(desdeIso: string, hastaIso: string): DiferenciaFechas {
  let desde = parseFecha(desdeIso);
  let hasta = parseFecha(hastaIso);
  if (desde > hasta) [desde, hasta] = [hasta, desde];

  let mesesCompletos = 0;
  let guard = 0;
  while (sumarMeses(desde, mesesCompletos + 1).getTime() <= hasta.getTime() && guard < 20000) {
    mesesCompletos++;
    guard++;
  }

  const cursor = sumarMeses(desde, mesesCompletos);
  const dias = Math.round((hasta.getTime() - cursor.getTime()) / MS_DIA);
  const diasTotales = Math.round((hasta.getTime() - desde.getTime()) / MS_DIA);

  return {
    anios: Math.floor(mesesCompletos / 12),
    meses: mesesCompletos % 12,
    dias,
    diasTotales,
  };
}

export type TipoCaducidad = "primera" | "segunda" | "incidente";

export const PLAZOS_CADUCIDAD: Record<TipoCaducidad, { meses: number; etiqueta: string }> = {
  primera: { meses: 6, etiqueta: "Primera instancia (6 meses)" },
  segunda: { meses: 3, etiqueta: "Segunda o tercera instancia (3 meses)" },
  incidente: { meses: 3, etiqueta: "Incidentes (3 meses)" },
};

/**
 * Caducidad de instancia (arts. 310 y 311 CPCCN). El plazo corre en meses
 * corridos desde el último acto de impulso; si vence en feria, se traslada al
 * primer día hábil siguiente.
 */
export function calcularCaducidad(
  ultimoActo: string,
  tipo: TipoCaducidad,
  opciones: OpcionesHabiles
): { vencimiento: string; vencimientoHabil: string; meses: number } {
  const { meses } = PLAZOS_CADUCIDAD[tipo];
  const base = parseFecha(ultimoActo);

  const objetivo = sumarMeses(base, meses);

  return {
    vencimiento: formatFecha(objetivo),
    vencimientoHabil: formatFecha(proximoDiaHabil(objetivo, opciones)),
    meses,
  };
}
