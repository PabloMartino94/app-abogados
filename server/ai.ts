import { DOC_VARIABLES } from "../shared/docVariables.js";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

// Se prueban en orden. La cuota del free tier es por modelo, así que cuando uno
// está saturado o sin cuota, el siguiente suele responder. Se puede cambiar la
// lista con la variable GEMINI_MODEL (separada por comas) sin tocar el código.
const DEFAULT_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Un turno de la conversación entre el abogado y el asistente. */
export type DraftTurn = {
  role: "abogado" | "asistente";
  text: string;
};

export type DraftSection = {
  titulo: string;
  parrafos: string[];
};

export type DraftDocument = {
  titulo: string;
  secciones: DraftSection[];
};

export type DraftResult = {
  estado: "preguntas" | "borrador";
  mensaje: string;
  preguntas?: string[];
  documento?: DraftDocument;
};

function variableCatalogueForPrompt(): string {
  return DOC_VARIABLES.map((v) => `{{${v.key}}} = ${v.label}`).join("\n");
}

const SYSTEM_INSTRUCTION = `Sos el asistente de redacción jurídica de AboxApp, un sistema de gestión para estudios de abogados de Argentina. Trabajás para un abogado matriculado: él es el responsable profesional del documento, vos preparás el borrador.

TU TRABAJO
Redactar documentos jurídicos completos (contratos, demandas, poderes, cartas documento, planillas de relevamiento de datos) en español rioplatense formal, con la técnica y la terminología del derecho argentino. Citá la normativa aplicable cuando corresponda (por ejemplo, la Ley 13.246 de arrendamientos y aparcerías rurales, el Código Civil y Comercial de la Nación, leyes provinciales) y adaptá las cláusulas a la actividad concreta del caso.

CÓMO TRABAJÁS
1. Si te falta información esencial para redactar bien, PREGUNTÁ antes de redactar. Hacé pocas preguntas por vez (hasta 6), concretas, en lenguaje llano, y sólo las que cambian el contenido del documento.
2. No preguntes los datos personales de las partes (nombre, DNI, domicilio, teléfono, email) ni el número de expediente: esos los completa el sistema automáticamente con variables. Preguntá únicamente lo sustantivo del caso.
3. Cuando tengas lo suficiente, redactá el documento completo. Ante un dato menor que falte, usá una variable o un espacio para completar a mano, y seguí adelante.

VARIABLES
Los datos de las partes y del expediente NO los escribas vos: insertá la variable correspondiente, que el sistema reemplaza después con los datos reales. Variables disponibles:
${variableCatalogueForPrompt()}

Usá exclusivamente esas variables, escritas exactamente así, con las llaves dobles. Si hace falta un dato que no está en la lista (por ejemplo la superficie de un predio o el número de padrón de riego), no inventes un valor: dejá una línea de guiones bajos para completar a mano, así: ____________.

FORMATO DE RESPUESTA
Respondé SIEMPRE con un único objeto JSON válido, sin texto antes ni después, y sin marcadores de código.

Cuando necesites más información:
{"estado":"preguntas","mensaje":"una frase breve explicando qué necesitás","preguntas":["pregunta 1","pregunta 2"]}

Cuando redactes el documento:
{"estado":"borrador","mensaje":"una frase breve sobre lo que redactaste y qué conviene revisar","documento":{"titulo":"TÍTULO DEL DOCUMENTO","secciones":[{"titulo":"PRIMERA — OBJETO","parrafos":["texto del párrafo","otro párrafo"]}]}}

Reglas del documento: el título va en mayúsculas; cada cláusula o sección es un elemento de "secciones" con su título y sus párrafos; el texto de los párrafos es texto plano, sin asteriscos ni markdown; no incluyas el membrete, el logo ni el pie del estudio, que los agrega el sistema.`;

function buildTranscript(turns: DraftTurn[]): string {
  return turns
    .map((turn) => (turn.role === "abogado" ? `[ABOGADO]: ${turn.text}` : `[ASISTENTE]: ${turn.text}`))
    .join("\n\n");
}

/**
 * Extrae el texto generado recorriendo la respuesta. Se contemplan la forma de
 * la Interactions API y la de generateContent, para que un cambio de formato del
 * lado de Google no rompa la función en silencio.
 */
function extractText(payload: any): string {
  const chunks: string[] = [];

  const steps = payload?.steps;
  if (Array.isArray(steps)) {
    for (const step of steps) {
      if (Array.isArray(step?.content)) {
        for (const item of step.content) {
          if (typeof item?.text === "string") chunks.push(item.text);
        }
      }
    }
  }

  if (chunks.length === 0) {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (typeof part?.text === "string") chunks.push(part.text);
      }
    }
  }

  if (chunks.length === 0 && typeof payload?.output_text === "string") {
    chunks.push(payload.output_text);
  }

  return chunks.join("").trim();
}

/**
 * Aísla el objeto JSON dentro de la respuesta del modelo. Aunque el prompt pide
 * JSON puro, los modelos a veces lo envuelven en un bloque de código o agregan
 * una línea antes, así que se recorta por las llaves.
 */
function parseJsonResponse(text: string): any {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/,"").trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("La respuesta del asistente no tenía el formato esperado.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeResult(parsed: any): DraftResult {
  const mensaje = typeof parsed?.mensaje === "string" ? parsed.mensaje : "";

  if (parsed?.estado === "borrador" && parsed?.documento) {
    const secciones: DraftSection[] = Array.isArray(parsed.documento.secciones)
      ? parsed.documento.secciones
          .map((section: any) => ({
            titulo: typeof section?.titulo === "string" ? section.titulo : "",
            parrafos: Array.isArray(section?.parrafos)
              ? section.parrafos.filter((p: any) => typeof p === "string")
              : [],
          }))
          .filter((section: DraftSection) => section.titulo || section.parrafos.length > 0)
      : [];

    if (secciones.length === 0) {
      throw new Error("El asistente devolvió un documento vacío. Probá pedirle el borrador de nuevo.");
    }

    return {
      estado: "borrador",
      mensaje,
      documento: {
        titulo: typeof parsed.documento.titulo === "string" ? parsed.documento.titulo : "DOCUMENTO",
        secciones,
      },
    };
  }

  const preguntas = Array.isArray(parsed?.preguntas)
    ? parsed.preguntas.filter((q: any) => typeof q === "string")
    : [];

  return { estado: "preguntas", mensaje, preguntas };
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

type GeminiFailure = { status: number; body: string };

async function callGemini(
  model: string,
  apiKey: string,
  transcript: string
): Promise<{ ok: true; payload: any } | ({ ok: false } & GeminiFailure)> {
  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      system_instruction: SYSTEM_INSTRUCTION,
      input: transcript,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Gemini API error (${model}):`, res.status, body);
    return { ok: false, status: res.status, body };
  }

  return { ok: true, payload: await res.json() };
}

/** Convierte el último error de Google en algo accionable para el abogado. */
function describeGeminiFailure(failure: GeminiFailure | null): string {
  if (!failure) return "El asistente no pudo responder.";

  if (failure.status === 429) {
    const retry = /retry in ([\d.]+)s/i.exec(failure.body);
    const seconds = retry ? Math.ceil(Number(retry[1])) : null;
    return seconds
      ? `El asistente llegó al límite de pedidos por minuto del plan gratuito. Probá de nuevo en unos ${seconds} segundos.`
      : "El asistente llegó al límite de pedidos del plan gratuito. Probá de nuevo en un minuto.";
  }

  if (RETRYABLE_STATUS.has(failure.status)) {
    return "El servicio de IA está saturado en este momento. Probá de nuevo en un minuto.";
  }

  if (failure.status === 400 || failure.status === 404) {
    return `El asistente rechazó el pedido (código ${failure.status}). Puede ser que el modelo configurado ya no exista.`;
  }

  if (failure.status === 401 || failure.status === 403) {
    return "La clave de IA no es válida o no tiene permisos.";
  }

  return `El asistente no respondió correctamente (código ${failure.status}).`;
}

export async function draftDocument(turns: DraftTurn[]): Promise<DraftResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta configurar la clave de IA (GEMINI_API_KEY) para poder redactar documentos."
    );
  }

  const models = (process.env.GEMINI_MODEL || DEFAULT_MODELS.join(","))
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const transcript = buildTranscript(turns);
  let lastFailure: GeminiFailure | null = null;

  for (const model of models) {
    // Un reintento corto por modelo: los 500 de saturación suelen ser pasajeros.
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await callGemini(model, apiKey, transcript);

      if (result.ok) {
        const text = extractText(result.payload);
        if (!text) {
          console.error(
            "Gemini API: respuesta sin texto",
            JSON.stringify(result.payload).slice(0, 2000)
          );
          throw new Error("El asistente devolvió una respuesta vacía.");
        }
        return normalizeResult(parseJsonResponse(text));
      }

      lastFailure = { status: result.status, body: result.body };

      if (RETRYABLE_STATUS.has(result.status) && attempt === 0) {
        await sleep(1500);
        continue;
      }
      // Sin cuota o error definitivo: se prueba el modelo siguiente.
      break;
    }
  }

  throw new Error(describeGeminiFailure(lastFailure));
}
