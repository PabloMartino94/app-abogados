export type Role = "Abogado" | "Asistente";

export type Client = {
  id: string;
  name: string;
  doc: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  blacklist: boolean;
  createdBy: string;
};

export type CaseStatus = "Iniciado" | "En trámite" | "Audiencia" | "Sentencia" | "Finalizado";

export type Fuero = "civil" | "laboral" | "penal" | "familia" | "comercial";

export type Case = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  status: CaseStatus;
  court: string;
  startDate: string;
  fuero: Fuero;
  notes: string;
  createdBy: string;
};

export type EventType = "Audiencia" | "Vencimiento" | "Reunión";

export type Duration = "15" | "30" | "60" | "120" | "all_day";

export type AppEvent = {
  id: string;
  type: EventType;
  date: string;
  time: string;
  duration: Duration;
  caseId: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  desc: string;
  description?: string;
  leadMinutes: NotificationLeadMinutes;
  createdBy: string;
  cancelled: boolean;
};

export type FileType = "PDF" | "Word" | "Imagen" | "Audio";

export type AppFile = {
  id: string;
  name: string;
  date: string;
  type: FileType;
  caseId: string;
  caseNumber: string;
  desc: string;
  description?: string;
  filePath: string;
};

export type TemplateType = "Demanda" | "Contrato" | "Poder" | "Carta documento";

export type DocTemplate = {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  filePath: string;
  fileName: string;
};

export type EmailTemplateType = "Recordatorio" | "Notificación" | "Seguimiento";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  type: EmailTemplateType;
  content: string;
};

export type NotificationLeadMinutes = 15 | 30 | 60 | 120 | 240 | 1440 | 4320;

export type NotificationSettings = {
  Audiencia: NotificationLeadMinutes;
  Vencimiento: NotificationLeadMinutes;
  Reunión: NotificationLeadMinutes;
};

export type ReportKind = "bug" | "mejora";

export type ReportPriority = "Baja" | "Media" | "Alta" | "Urgente";

export type ReportStatus = "Nuevo" | "En revisión" | "En progreso" | "Resuelto" | "Rechazado";

export type Report = {
  id: string;
  reportedBy: string;
  reportedByName: string;
  kind: ReportKind;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  pageContext: string;
  priority: ReportPriority;
  status: ReportStatus;
  createdAt: string;
};
