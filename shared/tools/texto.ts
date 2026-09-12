// Utilidades de texto para el trabajo diario con escritos.
// Sin dependencias externas.

export type ConteoTexto = {
  caracteres: number;
  caracteresSinEspacios: number;
  palabras: number;
  oraciones: number;
  parrafos: number;
  /** Estimación de páginas a 2.400 caracteres por carilla. */
  paginasEstimadas: number;
};

export function contarTexto(texto: string): ConteoTexto {
  const caracteres = texto.length;
  const caracteresSinEspacios = texto.replace(/\s/g, "").length;

  const palabras = texto.trim() ? texto.trim().split(/\s+/).length : 0;

  const oraciones = texto.trim()
    ? texto.split(/[.!?…]+(?:\s|$)/).filter((s) => s.trim().length > 0).length
    : 0;

  const parrafos = texto.trim()
    ? texto.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    : 0;

  return {
    caracteres,
    caracteresSinEspacios,
    palabras,
    oraciones,
    parrafos,
    paginasEstimadas: caracteres > 0 ? Math.max(1, Math.ceil(caracteres / 2400)) : 0,
  };
}

export type ModoConversion = "mayusculas" | "minusculas" | "titulo" | "oracion";

/** Palabras que en un título van en minúscula, salvo que abran la frase. */
const MENORES = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "o", "u", "a", "ante", "con",
  "en", "para", "por", "sin", "sobre", "tras", "un", "una", "al",
]);

export function convertirTexto(texto: string, modo: ModoConversion): string {
  if (modo === "mayusculas") return texto.toLocaleUpperCase("es-AR");
  if (modo === "minusculas") return texto.toLocaleLowerCase("es-AR");

  if (modo === "titulo") {
    return texto
      .toLocaleLowerCase("es-AR")
      .split(/(\s+)/)
      .map((token, i) => {
        if (!token.trim()) return token;
        const limpia = token.replace(/[^\p{L}\p{N}]/gu, "");
        if (i > 0 && MENORES.has(limpia)) return token;
        return token.replace(/\p{L}/u, (c) => c.toLocaleUpperCase("es-AR"));
      })
      .join("");
  }

  // Modo oración: mayúscula después de punto, y la primera letra del texto.
  const minuscula = texto.toLocaleLowerCase("es-AR");
  let resultado = "";
  let capitalizarSiguiente = true;
  for (const caracter of minuscula) {
    if (capitalizarSiguiente && /\p{L}/u.test(caracter)) {
      resultado += caracter.toLocaleUpperCase("es-AR");
      capitalizarSiguiente = false;
    } else {
      resultado += caracter;
      if (/[.!?…]/.test(caracter)) capitalizarSiguiente = true;
    }
  }
  return resultado;
}

export type OpcionesDuplicados = {
  ignorarMayusculas: boolean;
  ignorarEspacios: boolean;
  ordenar: boolean;
};

export function eliminarDuplicados(
  texto: string,
  opciones: OpcionesDuplicados
): { resultado: string; originales: number; unicas: number; eliminadas: number } {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const vistas = new Set<string>();
  const unicas: string[] = [];

  for (const linea of lineas) {
    let clave = opciones.ignorarEspacios ? linea.trim() : linea;
    if (opciones.ignorarMayusculas) clave = clave.toLocaleLowerCase("es-AR");
    if (!vistas.has(clave)) {
      vistas.add(clave);
      unicas.push(opciones.ignorarEspacios ? linea.trim() : linea);
    }
  }

  const salida = opciones.ordenar
    ? [...unicas].sort((a, b) => a.localeCompare(b, "es-AR"))
    : unicas;

  return {
    resultado: salida.join("\n"),
    originales: lineas.length,
    unicas: salida.length,
    eliminadas: lineas.length - salida.length,
  };
}

const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export function extraerEmails(texto: string): string[] {
  const encontrados = texto.match(RE_EMAIL) ?? [];
  const unicos = new Set(encontrados.map((e) => e.toLowerCase()));
  return Array.from(unicos).sort();
}

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export type FechaExtraida = { textoOriginal: string; iso: string | null };

/**
 * Detecta fechas en los formatos habituales de un escrito: 12/09/2026,
 * 12-09-2026, 2026-09-12 y "12 de septiembre de 2026".
 */
export function extraerFechas(texto: string): FechaExtraida[] {
  const resultados: FechaExtraida[] = [];
  const vistas = new Set<string>();

  const agregar = (textoOriginal: string, iso: string | null) => {
    const clave = iso ?? textoOriginal.toLowerCase();
    if (vistas.has(clave)) return;
    vistas.add(clave);
    resultados.push({ textoOriginal, iso });
  };

  const dosDigitos = (n: number) => String(n).padStart(2, "0");
  const valida = (d: number, m: number, a: number) =>
    m >= 1 && m <= 12 && d >= 1 && d <= 31 && a >= 1000 && a <= 9999;

  // dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa
  for (const m of texto.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g)) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    let anio = Number(m[3]);
    if (m[3].length === 2) anio += anio < 50 ? 2000 : 1900;
    agregar(m[0], valida(dia, mes, anio) ? `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}` : null);
  }

  // aaaa-mm-dd
  for (const m of texto.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    const anio = Number(m[1]);
    const mes = Number(m[2]);
    const dia = Number(m[3]);
    agregar(m[0], valida(dia, mes, anio) ? `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}` : null);
  }

  // "12 de septiembre de 2026"
  const nombresMeses = MESES_ES.join("|");
  const reTextual = new RegExp(
    `\\b(\\d{1,2})\\s+de\\s+(${nombresMeses})\\s+de\\s+(\\d{4})\\b`,
    "gi"
  );
  for (const m of texto.matchAll(reTextual)) {
    const dia = Number(m[1]);
    const mes = MESES_ES.indexOf(m[2].toLocaleLowerCase("es-AR")) + 1;
    const anio = Number(m[3]);
    agregar(m[0], valida(dia, mes, anio) ? `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}` : null);
  }

  return resultados.sort((a, b) => {
    if (a.iso && b.iso) return a.iso.localeCompare(b.iso);
    if (a.iso) return -1;
    if (b.iso) return 1;
    return 0;
  });
}

export type LineaDiff = {
  tipo: "igual" | "agregada" | "quitada";
  texto: string;
};

/**
 * Comparación línea por línea mediante la subsecuencia común más larga, para
 * ver qué cambió entre dos versiones de un escrito.
 */
export function compararTextos(textoA: string, textoB: string): {
  lineas: LineaDiff[];
  agregadas: number;
  quitadas: number;
  iguales: number;
} {
  const a = textoA.split(/\r?\n/);
  const b = textoB.split(/\r?\n/);

  // Matriz de longitudes de la subsecuencia común más larga.
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const lineas: LineaDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lineas.push({ tipo: "igual", texto: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      lineas.push({ tipo: "quitada", texto: a[i] });
      i++;
    } else {
      lineas.push({ tipo: "agregada", texto: b[j] });
      j++;
    }
  }
  while (i < a.length) lineas.push({ tipo: "quitada", texto: a[i++] });
  while (j < b.length) lineas.push({ tipo: "agregada", texto: b[j++] });

  return {
    lineas,
    agregadas: lineas.filter((l) => l.tipo === "agregada").length,
    quitadas: lineas.filter((l) => l.tipo === "quitada").length,
    iguales: lineas.filter((l) => l.tipo === "igual").length,
  };
}
