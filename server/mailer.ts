import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const NOTIFY_EMAIL = process.env.REPORTS_NOTIFY_EMAIL || GMAIL_USER;

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  // Se usa el puerto 587 (STARTTLS) en lugar del 465 (SSL) que trae por
  // defecto el shorthand "service: gmail": algunos proveedores de hosting
  // (incluido Render) bloquean el 465 y la conexión queda colgada hasta
  // hacer timeout. El 587 suele estar permitido.
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
} else {
  console.warn(
    "GMAIL_USER / GMAIL_APP_PASSWORD no configurados — las notificaciones por email de reportes están deshabilitadas."
  );
}

type ReportNotificationInput = {
  id: string;
  kind: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  pageContext?: string;
  priority: string;
  reporterName: string;
};

export async function sendReportNotification(report: ReportNotificationInput): Promise<void> {
  if (!transporter || !NOTIFY_EMAIL) return;

  const kindLabel = report.kind === "bug" ? "Error / Bug" : "Mejora";
  const subject = `[AboxApp] Nuevo reporte (${kindLabel}): ${report.title}`;

  const lines = [
    `Tipo: ${kindLabel}`,
    `Prioridad: ${report.priority}`,
    `Reportado por: ${report.reporterName}`,
    ``,
    `Título: ${report.title}`,
    ``,
    `Descripción:`,
    report.description || "(sin descripción)",
  ];

  if (report.kind === "bug") {
    lines.push(
      ``,
      `Pasos para reproducir:`,
      report.stepsToReproduce || "(no especificado)",
      ``,
      `Qué esperaba que pasara:`,
      report.expectedBehavior || "(no especificado)",
      ``,
      `Qué pasó en cambio:`,
      report.actualBehavior || "(no especificado)"
    );
  }

  if (report.pageContext) {
    lines.push(``, `Dónde ocurrió: ${report.pageContext}`);
  }

  const text = lines.join("\n");
  const html = `<pre style="font-family: inherit; white-space: pre-wrap;">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;

  try {
    await transporter.sendMail({
      from: `"AboxApp" <${GMAIL_USER}>`,
      to: NOTIFY_EMAIL,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Error enviando email de notificación de reporte:", err);
  }
}