// Envío de notificaciones por email vía la API HTTP de Brevo en lugar de SMTP.
//
// Render bloquea el tráfico saliente por los puertos SMTP (25, 465, 587) en
// los servicios del plan gratuito, así que enviar por Gmail/SMTP directo
// nunca va a funcionar ahí (da igual el puerto o el proveedor). La API de
// Brevo funciona sobre HTTPS normal (puerto 443), que no está bloqueado.
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER;
const NOTIFY_EMAIL = process.env.REPORTS_NOTIFY_EMAIL || BREVO_SENDER_EMAIL;

if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
  console.warn(
    "BREVO_API_KEY / BREVO_SENDER_EMAIL no configurados — las notificaciones por email de reportes están deshabilitadas."
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
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !NOTIFY_EMAIL) return;

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
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "AboxApp", email: BREVO_SENDER_EMAIL },
        to: [{ email: NOTIFY_EMAIL }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo API respondió ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error("Error enviando email de notificación de reporte:", err);
  }
}
