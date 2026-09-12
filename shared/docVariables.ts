// Catálogo de variables disponibles para las plantillas de documentos.
// Es la única fuente de verdad: el servidor arma los datos con estas claves
// y la pantalla de Plantillas se las muestra al abogado para que sepa qué
// puede escribir dentro de su archivo .docx.

export type DocVariableGroup = "Cliente" | "Expediente" | "Estudio" | "General";

export type DocVariable = {
  key: string;
  label: string;
  group: DocVariableGroup;
  example: string;
};

export const DOC_VARIABLE_GROUPS: DocVariableGroup[] = [
  "Cliente",
  "Expediente",
  "Estudio",
  "General",
];

export const DOC_VARIABLES: DocVariable[] = [
  { key: "cliente", label: "Nombre del cliente", group: "Cliente", example: "Guillermo Marsala" },
  { key: "cliente_dni", label: "DNI o CUIT", group: "Cliente", example: "20-12345678-3" },
  { key: "cliente_domicilio", label: "Domicilio", group: "Cliente", example: "Santa Cruz 560, Mendoza" },
  { key: "cliente_email", label: "Email", group: "Cliente", example: "cliente@correo.com" },
  { key: "cliente_telefono", label: "Teléfono", group: "Cliente", example: "261 555-0000" },

  { key: "expediente", label: "Número de expediente", group: "Expediente", example: "12345/2026" },
  { key: "expediente_fuero", label: "Fuero", group: "Expediente", example: "Civil" },
  { key: "expediente_estado", label: "Estado", group: "Expediente", example: "En trámite" },
  { key: "expediente_juzgado", label: "Juzgado", group: "Expediente", example: "Juzgado Civil N° 3" },
  { key: "expediente_inicio", label: "Fecha de inicio", group: "Expediente", example: "01/03/2026" },

  { key: "estudio", label: "Nombre del estudio", group: "Estudio", example: "Tonelli & Asociados" },
  { key: "abogado", label: "Abogado que genera el documento", group: "Estudio", example: "Pablo Martino" },

  { key: "fecha", label: "Fecha de hoy", group: "General", example: "12/09/2026" },
  { key: "fecha_larga", label: "Fecha de hoy en letras", group: "General", example: "12 de septiembre de 2026" },
];

// Claves antiguas que la pantalla de Plantillas anunciaba antes de este catálogo.
// Se siguen aceptando para no romper plantillas ya escritas.
export const DOC_VARIABLE_ALIASES: Record<string, string> = {
  dni: "cliente_dni",
};
