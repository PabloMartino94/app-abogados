// Conversión de montos a letras y cálculos económicos del foro argentino.
// Sin dependencias externas.

const UNIDADES = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];

const DECENAS = [
  "", "", "veinte", "treinta", "cuarenta", "cincuenta",
  "sesenta", "setenta", "ochenta", "noventa",
];

const CENTENAS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos",
];

/** Convierte 0-999 a letras. `apocope` usa "un" en lugar de "uno". */
function tramoCorto(n: number, apocope: boolean): string {
  if (n === 0) return "";
  if (n === 100) return "cien";

  const centena = Math.floor(n / 100);
  const resto = n % 100;

  const partes: string[] = [];
  if (centena > 0) partes.push(CENTENAS[centena]);

  if (resto > 0) {
    if (resto < 30) {
      let palabra = UNIDADES[resto];
      if (apocope && resto === 1) palabra = "un";
      if (apocope && resto === 21) palabra = "veintiún";
      partes.push(palabra);
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      if (unidad === 0) {
        partes.push(DECENAS[decena]);
      } else {
        let palabra = UNIDADES[unidad];
        if (apocope && unidad === 1) palabra = "un";
        partes.push(`${DECENAS[decena]} y ${palabra}`);
      }
    }
  }

  return partes.join(" ");
}

/** Convierte un entero no negativo a letras, en español rioplatense. */
export function enteroALetras(valor: number, apocope = false): string {
  const n = Math.floor(Math.abs(valor));
  if (n === 0) return "cero";
  if (n > 999999999999) return String(n);

  const millones = Math.floor(n / 1000000);
  const restoMillones = n % 1000000;
  const miles = Math.floor(restoMillones / 1000);
  const unidades = restoMillones % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      partes.push("un millón");
    } else {
      // El tramo de millones siempre apocopa: "veintiún millones".
      partes.push(`${tramoCorto(millones % 1000 === millones ? millones : millones, true)} millones`);
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      partes.push("mil");
    } else {
      partes.push(`${tramoCorto(miles, true)} mil`);
    }
  }

  if (unidades > 0) {
    partes.push(tramoCorto(unidades, apocope));
  }

  return partes.join(" ").replace(/\s+/g, " ").trim();
}

export type Moneda = "pesos" | "dólares" | "euros";

const SINGULAR: Record<Moneda, string> = {
  pesos: "peso",
  dólares: "dólar",
  euros: "euro",
};

export type MontoEnLetras = {
  /** Por ejemplo: "ciento veinte mil quinientos pesos con cincuenta centavos". */
  texto: string;
  /** Formato de contrato: "PESOS CIENTO VEINTE MIL QUINIENTOS CON 50/100". */
  formatoLegal: string;
};

/** Convierte un monto a letras, con sus centavos. */
export function montoALetras(monto: number, moneda: Moneda = "pesos"): MontoEnLetras {
  const negativo = monto < 0;
  const absoluto = Math.abs(monto);
  const entero = Math.floor(absoluto);
  const centavos = Math.round((absoluto - entero) * 100);

  // El redondeo de centavos puede empujar al entero siguiente.
  const enteroFinal = centavos === 100 ? entero + 1 : entero;
  const centavosFinal = centavos === 100 ? 0 : centavos;

  const letrasEntero = enteroALetras(enteroFinal, true);
  const nombreMoneda = enteroFinal === 1 ? SINGULAR[moneda] : moneda;

  let texto = `${letrasEntero} ${nombreMoneda}`;
  if (centavosFinal > 0) {
    const letrasCentavos = enteroALetras(centavosFinal, true);
    texto += ` con ${letrasCentavos} centavo${centavosFinal === 1 ? "" : "s"}`;
  }
  if (negativo) texto = `menos ${texto}`;

  const centavosPadded = String(centavosFinal).padStart(2, "0");
  const formatoLegal = `${moneda.toUpperCase()} ${letrasEntero.toUpperCase()} CON ${centavosPadded}/100`;

  return { texto, formatoLegal: negativo ? `MENOS ${formatoLegal}` : formatoLegal };
}

// ---------------------------------------------------------------------------
// Tasa de justicia (Ley 23.898)
// ---------------------------------------------------------------------------

export type AlicuotaTasa = "general" | "reducida" | "exento";

export const ALICUOTAS: Record<AlicuotaTasa, { porcentaje: number; etiqueta: string }> = {
  general: { porcentaje: 3, etiqueta: "General (3%)" },
  reducida: { porcentaje: 1.5, etiqueta: "Reducida (1,5%)" },
  exento: { porcentaje: 0, etiqueta: "Exento (0%)" },
};

export function tasaDeJusticia(
  montoProceso: number,
  alicuota: AlicuotaTasa
): { tasa: number; porcentaje: number } {
  const porcentaje = ALICUOTAS[alicuota].porcentaje;
  return { tasa: (montoProceso * porcentaje) / 100, porcentaje };
}

// ---------------------------------------------------------------------------
// Honorarios sobre base UMA (Ley 27.423)
// ---------------------------------------------------------------------------

export type ResultadoHonorarios = {
  porEscala: number;
  minimoEnPesos: number;
  /** El mayor entre el cálculo por escala y el mínimo en UMA. */
  aRegular: number;
  rigeElMinimo: boolean;
  enUma: number;
};

/**
 * Honorarios por porcentaje sobre el monto del proceso, con piso en UMA.
 * El valor de la UMA y el porcentaje se ingresan a mano porque se actualizan
 * periódicamente por acordada de la CSJN.
 */
export function honorarios(
  montoProceso: number,
  porcentaje: number,
  valorUma: number,
  minimoUma: number
): ResultadoHonorarios {
  const porEscala = (montoProceso * porcentaje) / 100;
  const minimoEnPesos = minimoUma * valorUma;
  const aRegular = Math.max(porEscala, minimoEnPesos);
  return {
    porEscala,
    minimoEnPesos,
    aRegular,
    rigeElMinimo: minimoEnPesos > porEscala,
    enUma: valorUma > 0 ? aRegular / valorUma : 0,
  };
}

// ---------------------------------------------------------------------------
// Indemnización por incapacidad
// ---------------------------------------------------------------------------

export type FormulaIncapacidad = "vuoto" | "mendez";

export type ResultadoIncapacidad = {
  capital: number;
  ingresoAnualComputable: number;
  aniosRestantes: number;
  tasa: number;
  edadTope: number;
  formula: string;
};

/**
 * Fórmulas de renta capitalizada. Vuoto (1978) usa tope 65 años y 6% de
 * interés. Méndez (2008) lleva el tope a 75 años, baja el interés al 4% y
 * ajusta el ingreso por la expectativa de progreso económico (60 / edad).
 */
export function indemnizacionIncapacidad(
  ingresoMensual: number,
  edad: number,
  porcentajeIncapacidad: number,
  formula: FormulaIncapacidad
): ResultadoIncapacidad {
  const esMendez = formula === "mendez";
  const edadTope = esMendez ? 75 : 65;
  const tasa = esMendez ? 0.04 : 0.06;

  const ingresoBase = esMendez && edad > 0 ? ingresoMensual * (60 / edad) : ingresoMensual;
  // Se computan 13 meses por el sueldo anual complementario.
  const ingresoAnual = ingresoBase * 13;
  const ingresoAnualComputable = ingresoAnual * (porcentajeIncapacidad / 100);

  const aniosRestantes = Math.max(0, edadTope - edad);
  const vn = Math.pow(1 + tasa, -aniosRestantes);
  const capital = tasa > 0 ? ingresoAnualComputable * ((1 - vn) / tasa) : 0;

  return {
    capital,
    ingresoAnualComputable,
    aniosRestantes,
    tasa,
    edadTope,
    formula: esMendez ? "Méndez (2008)" : "Vuoto (1978)",
  };
}

// ---------------------------------------------------------------------------
// Daños punitivos (fórmula de Irigoyen Testa)
// ---------------------------------------------------------------------------

/**
 * Multa civil óptima: D = C × (1 − Pc) / Pc, donde C es la indemnización
 * compensatoria y Pc la probabilidad de condena, expresada entre 0 y 1.
 */
export function danosPunitivos(
  indemnizacionCompensatoria: number,
  probabilidadCondena: number
): { multa: number; total: number; probabilidad: number } {
  const pc = Math.min(Math.max(probabilidadCondena, 0.0001), 1);
  const multa = indemnizacionCompensatoria * ((1 - pc) / pc);
  return {
    multa,
    total: indemnizacionCompensatoria + multa,
    probabilidad: pc,
  };
}

/** Formatea un número como moneda argentina. */
export function formatearPesos(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(isFinite(valor) ? valor : 0);
}
