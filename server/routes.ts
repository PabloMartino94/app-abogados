import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as schema from "../shared/schema.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { uploadFile, downloadFile } from "./fileStorage";
import { sendReportNotification } from "./mailer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

declare module "express-session" {
  interface SessionData {
    userId: string;
    accountId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId || !req.session?.accountId) {
    return res.status(401).json({ error: "No autorizado" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { firmName, name, email, phone, password } = req.body;
      if (!firmName || !name || !email || !password) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Ya existe una cuenta con este email" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const account = await storage.createAccount({ firmName });
      const user = await storage.createUser({
        accountId: account.id,
        name,
        email,
        passwordHash,
        role: "Abogado",
      });
      req.session.userId = user.id;
      req.session.accountId = account.id;
      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        account: { id: account.id, firmName: account.firmName },
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Error al crear la cuenta" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Email o contraseña incorrectos" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Email o contraseña incorrectos" });
      }
      const account = await storage.getAccount(user.accountId);
      req.session.userId = user.id;
      req.session.accountId = user.accountId;
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        account: { id: account?.id, firmName: account?.firmName },
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "No autorizado" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "No autorizado" });
    }
    const account = await storage.getAccount(user.accountId);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      account: { id: account?.id, firmName: account?.firmName },
    });
  });

  app.get("/api/users", requireAuth, async (req, res) => {
    const users = await storage.getUsersByAccount(req.session.accountId!);
    res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
  });

  app.get("/api/clients", requireAuth, async (req, res) => {
    const clients = await storage.getAllClients(req.session.accountId!);
    res.json(clients);
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    const client = await storage.getClient(req.session.accountId!, req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    const parsed = schema.insertClientSchema.safeParse({ ...req.body, accountId: req.session.accountId, createdBy: req.session.userId });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const client = await storage.createClient(parsed.data);
    res.status(201).json(client);
  });

  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const { accountId, id: _id, ...fields } = req.body;
      const client = await storage.updateClient(req.session.accountId!, req.params.id, fields);
      if (!client) return res.status(404).json({ error: "Client not found" });
      res.json(client);
    } catch (err: any) {
      console.error("Update client error:", err);
      res.status(500).json({ error: "Error al actualizar cliente" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getClient(req.session.accountId!, req.params.id);
      if (!existing) return res.status(404).json({ error: "Client not found" });
      await storage.deleteClient(req.session.accountId!, req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      console.error("Delete client error:", err);
      res.status(500).json({ error: "Error al eliminar cliente" });
    }
  });

  app.get("/api/cases", requireAuth, async (req, res) => {
    const cases = await storage.getAllCases(req.session.accountId!);
    res.json(cases);
  });

  app.get("/api/cases/:id", requireAuth, async (req, res) => {
    const caseData = await storage.getCase(req.session.accountId!, req.params.id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });
    res.json(caseData);
  });

  app.post("/api/cases", requireAuth, async (req, res) => {
    const parsed = schema.insertCaseSchema.safeParse({ ...req.body, accountId: req.session.accountId, createdBy: req.session.userId });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const caseData = await storage.createCase(parsed.data);
    res.status(201).json(caseData);
  });

  app.put("/api/cases/:id", requireAuth, async (req, res) => {
    try {
      const { accountId, id: _id, ...fields } = req.body;
      const caseData = await storage.updateCase(req.session.accountId!, req.params.id, fields);
      if (!caseData) return res.status(404).json({ error: "Case not found" });
      res.json(caseData);
    } catch (err: any) {
      console.error("Update case error:", err);
      res.status(500).json({ error: "Error al actualizar expediente" });
    }
  });

  app.get("/api/events", requireAuth, async (req, res) => {
    const events = await storage.getAllEvents(req.session.accountId!);
    res.json(events);
  });

  app.get("/api/events/:id", requireAuth, async (req, res) => {
    const event = await storage.getEvent(req.session.accountId!, req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    const parsed = schema.insertEventSchema.safeParse({ ...req.body, accountId: req.session.accountId, createdBy: req.session.userId });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const event = await storage.createEvent(parsed.data);
    res.status(201).json(event);
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const { accountId, id: _id, ...fields } = req.body;
      const event = await storage.updateEvent(req.session.accountId!, req.params.id, fields);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (err: any) {
      console.error("Update event error:", err);
      res.status(500).json({ error: "Error al actualizar evento" });
    }
  });

  app.get("/api/files", requireAuth, async (req, res) => {
    const files = await storage.getAllFiles(req.session.accountId!);
    res.json(files);
  });

  app.get("/api/files/:id", requireAuth, async (req, res) => {
    const file = await storage.getFile(req.session.accountId!, req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  });

  app.post("/api/files", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const uploadedFile = req.file;
      const { name, type, caseId, description } = req.body;
      if (!name || !type || !caseId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }
      const now = new Date().toISOString().slice(0, 10);
      let filePath = "";
      if (uploadedFile) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(uploadedFile.originalname);
        const key = `${req.session.accountId}/${unique}${ext}`;
        await uploadFile(key, uploadedFile.buffer, uploadedFile.mimetype);
        filePath = key;
      }
      const file = await storage.createFile({
        accountId: req.session.accountId!,
        name,
        date: now,
        type,
        caseId,
        description: description || "",
        filePath,
      });
      res.status(201).json(file);
    } catch (err: any) {
      console.error("Upload file error:", err);
      res.status(500).json({ error: "Error al subir archivo" });
    }
  });

  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    const file = await storage.getFile(req.session.accountId!, req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    if (!file.filePath) return res.status(404).json({ error: "No file stored" });
    try {
      const { buffer, contentType } = await downloadFile(file.filePath);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
      res.send(buffer);
    } catch (err: any) {
      console.error("Download file error:", err);
      res.status(404).json({ error: "File missing from storage" });
    }
  });

  app.get("/api/files/:id/view", requireAuth, async (req, res) => {
    const file = await storage.getFile(req.session.accountId!, req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    if (!file.filePath) return res.status(404).json({ error: "No file stored" });
    try {
      const { buffer, contentType } = await downloadFile(file.filePath);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${file.name}"`);
      res.send(buffer);
    } catch (err: any) {
      console.error("View file error:", err);
      res.status(404).json({ error: "File missing from storage" });
    }
  });

  app.get("/api/doc-templates", requireAuth, async (req, res) => {
    const templates = await storage.getAllDocTemplates(req.session.accountId!);
    res.json(templates);
  });

  app.get("/api/doc-templates/:id", requireAuth, async (req, res) => {
    const template = await storage.getDocTemplate(req.session.accountId!, req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  });

  app.post("/api/doc-templates", requireAuth, async (req, res) => {
    const parsed = schema.insertDocTemplateSchema.safeParse({ ...req.body, accountId: req.session.accountId });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const template = await storage.createDocTemplate(parsed.data);
    res.status(201).json(template);
  });

  app.get("/api/email-templates", requireAuth, async (req, res) => {
    const templates = await storage.getAllEmailTemplates(req.session.accountId!);
    res.json(templates);
  });

  app.get("/api/email-templates/:id", requireAuth, async (req, res) => {
    const template = await storage.getEmailTemplate(req.session.accountId!, req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  });

  app.post("/api/email-templates", requireAuth, async (req, res) => {
    const parsed = schema.insertEmailTemplateSchema.safeParse({ ...req.body, accountId: req.session.accountId });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const template = await storage.createEmailTemplate(parsed.data);
    res.status(201).json(template);
  });

  app.put("/api/email-templates/:id", requireAuth, async (req, res) => {
    const existing = await storage.getEmailTemplate(req.session.accountId!, req.params.id);
    if (!existing) return res.status(404).json({ error: "Template not found" });
    const { name, type, subject, content } = req.body;
    const updated = await storage.updateEmailTemplate(req.session.accountId!, req.params.id, { name, type, subject, content });
    res.json(updated);
  });

  app.delete("/api/email-templates/:id", requireAuth, async (req, res) => {
    const existing = await storage.getEmailTemplate(req.session.accountId!, req.params.id);
    if (!existing) return res.status(404).json({ error: "Template not found" });
    await storage.deleteEmailTemplate(req.session.accountId!, req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/notification-settings", requireAuth, async (req, res) => {
    const settings = await storage.getAllNotificationSettings(req.session.accountId!);
    res.json(settings);
  });

  app.post("/api/notification-settings", requireAuth, async (req, res) => {
    const parsed = schema.insertNotificationSettingSchema.safeParse({ ...req.body, accountId: req.session.accountId });
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const setting = await storage.upsertNotificationSetting(parsed.data);
    res.status(200).json(setting);
  });

  app.get("/api/reports", requireAuth, async (req, res) => {
    const reports = await storage.getAllReports(req.session.accountId!);
    res.json(reports);
  });

  app.get("/api/reports/:id", requireAuth, async (req, res) => {
    const report = await storage.getReport(req.session.accountId!, req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  });

  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const parsed = schema.insertReportSchema.safeParse({
        ...req.body,
        accountId: req.session.accountId,
        reportedBy: req.session.userId,
      });
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const report = await storage.createReport(parsed.data);

      const reporter = await storage.getUserById(req.session.userId!);
      sendReportNotification({
        id: report.id,
        kind: report.kind,
        title: report.title,
        description: report.description,
        stepsToReproduce: report.stepsToReproduce,
        expectedBehavior: report.expectedBehavior,
        actualBehavior: report.actualBehavior,
        pageContext: report.pageContext,
        priority: report.priority,
        reporterName: reporter?.name || "Desconocido",
      }).catch((err) => console.error("Error enviando notificación de reporte:", err));

      res.status(201).json(report);
    } catch (err: any) {
      console.error("Create report error:", err);
      res.status(500).json({ error: "Error al crear el reporte" });
    }
  });

  app.put("/api/reports/:id", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Falta el estado" });
      const existing = await storage.getReport(req.session.accountId!, req.params.id);
      if (!existing) return res.status(404).json({ error: "Report not found" });
      const report = await storage.updateReportStatus(req.session.accountId!, req.params.id, status);
      res.json(report);
    } catch (err: any) {
      console.error("Update report error:", err);
      res.status(500).json({ error: "Error al actualizar el reporte" });
    }
  });

  app.delete("/api/reports/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getReport(req.session.accountId!, req.params.id);
      if (!existing) return res.status(404).json({ error: "Report not found" });
      await storage.deleteReport(req.session.accountId!, req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      console.error("Delete report error:", err);
      res.status(500).json({ error: "Error al eliminar el reporte" });
    }
  });

  return httpServer;
}
