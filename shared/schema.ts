import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firmName: text("firm_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("Abogado"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  name: text("name").notNull().default(""),
  doc: text("doc").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  notes: text("notes").notNull().default(""),
  blacklist: boolean("blacklist").notNull().default(false),
  createdBy: varchar("created_by").notNull().default(""),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  number: text("number").notNull(),
  clientId: varchar("client_id").notNull().default(""),
  status: text("status").notNull(),
  court: text("court").notNull().default(""),
  startDate: text("start_date").notNull(),
  fuero: text("fuero").notNull(),
  notes: text("notes").notNull().default(""),
  createdBy: varchar("created_by").notNull().default(""),
});

export const insertCaseSchema = createInsertSchema(cases).omit({ id: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: text("duration").notNull().default("60"),
  caseId: varchar("case_id").notNull().default(""),
  clientId: varchar("client_id").notNull().default(""),
  description: text("description").notNull().default(""),
  leadMinutes: integer("lead_minutes").notNull().default(60),
  createdBy: varchar("created_by").notNull().default(""),
  cancelled: boolean("cancelled").notNull().default(false),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  caseId: varchar("case_id").notNull(),
  description: text("description").notNull().default(""),
  filePath: text("file_path").notNull().default(""),
});

export const insertFileSchema = createInsertSchema(files).omit({ id: true });
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export const docTemplates = pgTable("doc_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
});

export const insertDocTemplateSchema = createInsertSchema(docTemplates).omit({ id: true });
export type InsertDocTemplate = z.infer<typeof insertDocTemplateSchema>;
export type DocTemplate = typeof docTemplates.$inferSelect;

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true });
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  eventType: text("event_type").notNull(),
  leadMinutes: text("lead_minutes").notNull(),
});

export const insertNotificationSettingSchema = createInsertSchema(notificationSettings).omit({ id: true });
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
