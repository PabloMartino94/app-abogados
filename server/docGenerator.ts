import { createReport } from "docx-templates";
import type * as schema from "../shared/schema.js";
import { DOC_VARIABLE_ALIASES } from "../shared/docVariables.js";

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Convierte "2026-03-01" (como se guardan las fechas en la base) a "01/03/2026". */
function toDisplayDate(iso: string): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function toLongDate(date: Date): string {
  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

function capitalize(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type DocDataInput = {
  client?: schema.Client | null;
  caseRecord?: schema.Case | null;
  firmName?: string;
  lawyerName?: string;
  now?: Date;
};

/**
 * Arma el objeto de datos que se inyecta en la plantilla, con una clave por
 * cada variable del catálogo. Las variables sin dato quedan como cadena vacía
 * para que el documento se genere igual, con el espacio en blanco a completar.
 */
export function buildDocData(input: DocDataInput): Record<string, string> {
  const { client, caseRecord, firmName, lawyerName } = input;
  const now = input.now ?? new Date();

  const data: Record<string, string> = {
    cliente: client?.name ?? "",
    cliente_dni: client?.doc ?? "",
    cliente_domicilio: client?.address ?? "",
    cliente_email: client?.email ?? "",
    cliente_telefono: client?.phone ?? "",

    expediente: caseRecord?.number ?? "",
    expediente_fuero: capitalize(caseRecord?.fuero ?? ""),
    expediente_estado: caseRecord?.status ?? "",
    expediente_juzgado: caseRecord?.court ?? "",
    expediente_inicio: toDisplayDate(caseRecord?.startDate ?? ""),

    estudio: firmName ?? "",
    abogado: lawyerName ?? "",

    fecha: toDisplayDate(now.toISOString().slice(0, 10)),
    fecha_larga: toLongDate(now),
  };

  for (const [alias, target] of Object.entries(DOC_VARIABLE_ALIASES)) {
    data[alias] = data[target] ?? "";
  }

  return data;
}

export async function generateDocx(
  template: Buffer,
  data: Record<string, string>
): Promise<Buffer> {
  const output = await createReport({
    template,
    data,
    cmdDelimiter: ["{{", "}}"],
    failFast: false,
    rejectNullish: false,
  });
  return Buffer.from(output);
}

/**
 * Traduce los errores de docx-templates a algo que un abogado pueda accionar.
 * El caso habitual es una variable escrita en la plantilla que no existe en el
 * catálogo (un typo, o una variable inventada).
 */
export function describeTemplateError(err: any): string {
  // Con failFast: false la librería agrupa todos los errores de la plantilla,
  // que pueden llegar como arreglo, como `errors`, o como un único error.
  const parts: string[] = [];
  const collect = (value: any) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (Array.isArray(value.errors)) {
      value.errors.forEach(collect);
      return;
    }
    parts.push(value.message ?? String(value));
  };
  collect(err);

  const raw = parts.join(" | ") || String(err);
  const unknown = new Set<string>();

  const referencePattern = /(\w+) is not defined/g;
  let match: RegExpExecArray | null;
  while ((match = referencePattern.exec(raw)) !== null) {
    unknown.add(match[1]);
  }

  if (unknown.size > 0) {
    const list = [...unknown].map((name) => `{{${name}}}`).join(", ");
    return `La plantilla usa variables que no existen: ${list}. Revisá la lista de variables disponibles y corregí el archivo .docx.`;
  }

  return `No se pudo generar el documento a partir de la plantilla. Detalle: ${raw}`;
}
