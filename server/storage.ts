import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import * as schema from "../shared/schema.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export { pool };

export interface IStorage {
  createAccount(input: schema.InsertAccount): Promise<schema.Account>;
  getAccount(id: string): Promise<schema.Account | undefined>;

  createUser(input: schema.InsertUser): Promise<schema.User>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  getUserById(id: string): Promise<schema.User | undefined>;
  getUsersByAccount(accountId: string): Promise<schema.User[]>;

  getAllClients(accountId: string): Promise<schema.Client[]>;
  getClient(accountId: string, id: string): Promise<schema.Client | undefined>;
  createClient(input: schema.InsertClient): Promise<schema.Client>;
  updateClient(accountId: string, id: string, input: Partial<schema.InsertClient>): Promise<schema.Client>;

  getAllCases(accountId: string): Promise<schema.Case[]>;
  getCase(accountId: string, id: string): Promise<schema.Case | undefined>;
  createCase(input: schema.InsertCase): Promise<schema.Case>;
  updateCase(accountId: string, id: string, input: Partial<schema.InsertCase>): Promise<schema.Case>;

  getAllEvents(accountId: string): Promise<schema.Event[]>;
  getEvent(accountId: string, id: string): Promise<schema.Event | undefined>;
  createEvent(input: schema.InsertEvent): Promise<schema.Event>;
  updateEvent(accountId: string, id: string, input: Partial<schema.InsertEvent & { cancelled: boolean }>): Promise<schema.Event>;

  getAllFiles(accountId: string): Promise<schema.File[]>;
  getFile(accountId: string, id: string): Promise<schema.File | undefined>;
  createFile(input: schema.InsertFile): Promise<schema.File>;

  getAllDocTemplates(accountId: string): Promise<schema.DocTemplate[]>;
  getDocTemplate(accountId: string, id: string): Promise<schema.DocTemplate | undefined>;
  createDocTemplate(input: schema.InsertDocTemplate): Promise<schema.DocTemplate>;

  getAllEmailTemplates(accountId: string): Promise<schema.EmailTemplate[]>;
  getEmailTemplate(accountId: string, id: string): Promise<schema.EmailTemplate | undefined>;
  createEmailTemplate(input: schema.InsertEmailTemplate): Promise<schema.EmailTemplate>;
  updateEmailTemplate(accountId: string, id: string, input: Partial<schema.InsertEmailTemplate>): Promise<schema.EmailTemplate>;
  deleteEmailTemplate(accountId: string, id: string): Promise<void>;

  getAllNotificationSettings(accountId: string): Promise<schema.NotificationSetting[]>;
  getNotificationSetting(accountId: string, eventType: string): Promise<schema.NotificationSetting | undefined>;
  upsertNotificationSetting(input: schema.InsertNotificationSetting): Promise<schema.NotificationSetting>;
}

export class DbStorage implements IStorage {
  async createAccount(input: schema.InsertAccount): Promise<schema.Account> {
    const rows = await db.insert(schema.accounts).values(input).returning();
    return rows[0];
  }

  async getAccount(id: string): Promise<schema.Account | undefined> {
    const rows = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id));
    return rows[0];
  }

  async createUser(input: schema.InsertUser): Promise<schema.User> {
    const rows = await db.insert(schema.users).values(input).returning();
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return rows[0];
  }

  async getUserById(id: string): Promise<schema.User | undefined> {
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return rows[0];
  }

  async getUsersByAccount(accountId: string): Promise<schema.User[]> {
    return db.select().from(schema.users).where(eq(schema.users.accountId, accountId));
  }

  async getAllClients(accountId: string): Promise<schema.Client[]> {
    return db.select().from(schema.clients).where(eq(schema.clients.accountId, accountId));
  }

  async getClient(accountId: string, id: string): Promise<schema.Client | undefined> {
    const rows = await db.select().from(schema.clients).where(and(eq(schema.clients.id, id), eq(schema.clients.accountId, accountId)));
    return rows[0];
  }

  async createClient(input: schema.InsertClient): Promise<schema.Client> {
    const rows = await db.insert(schema.clients).values(input).returning();
    return rows[0];
  }

  async updateClient(accountId: string, id: string, input: Partial<schema.InsertClient>): Promise<schema.Client> {
    const rows = await db.update(schema.clients).set(input).where(and(eq(schema.clients.id, id), eq(schema.clients.accountId, accountId))).returning();
    return rows[0];
  }

  async getAllCases(accountId: string): Promise<schema.Case[]> {
    return db.select().from(schema.cases).where(eq(schema.cases.accountId, accountId));
  }

  async getCase(accountId: string, id: string): Promise<schema.Case | undefined> {
    const rows = await db.select().from(schema.cases).where(and(eq(schema.cases.id, id), eq(schema.cases.accountId, accountId)));
    return rows[0];
  }

  async createCase(input: schema.InsertCase): Promise<schema.Case> {
    const rows = await db.insert(schema.cases).values(input).returning();
    return rows[0];
  }

  async updateCase(accountId: string, id: string, input: Partial<schema.InsertCase>): Promise<schema.Case> {
    const rows = await db.update(schema.cases).set(input).where(and(eq(schema.cases.id, id), eq(schema.cases.accountId, accountId))).returning();
    return rows[0];
  }

  async getAllEvents(accountId: string): Promise<schema.Event[]> {
    return db.select().from(schema.events).where(eq(schema.events.accountId, accountId));
  }

  async getEvent(accountId: string, id: string): Promise<schema.Event | undefined> {
    const rows = await db.select().from(schema.events).where(and(eq(schema.events.id, id), eq(schema.events.accountId, accountId)));
    return rows[0];
  }

  async createEvent(input: schema.InsertEvent): Promise<schema.Event> {
    const rows = await db.insert(schema.events).values(input).returning();
    return rows[0];
  }

  async updateEvent(accountId: string, id: string, input: Partial<schema.InsertEvent & { cancelled: boolean }>): Promise<schema.Event> {
    const rows = await db.update(schema.events).set(input).where(and(eq(schema.events.id, id), eq(schema.events.accountId, accountId))).returning();
    return rows[0];
  }

  async getAllFiles(accountId: string): Promise<schema.File[]> {
    return db.select().from(schema.files).where(eq(schema.files.accountId, accountId));
  }

  async getFile(accountId: string, id: string): Promise<schema.File | undefined> {
    const rows = await db.select().from(schema.files).where(and(eq(schema.files.id, id), eq(schema.files.accountId, accountId)));
    return rows[0];
  }

  async createFile(input: schema.InsertFile): Promise<schema.File> {
    const rows = await db.insert(schema.files).values(input).returning();
    return rows[0];
  }

  async getAllDocTemplates(accountId: string): Promise<schema.DocTemplate[]> {
    return db.select().from(schema.docTemplates).where(eq(schema.docTemplates.accountId, accountId));
  }

  async getDocTemplate(accountId: string, id: string): Promise<schema.DocTemplate | undefined> {
    const rows = await db.select().from(schema.docTemplates).where(and(eq(schema.docTemplates.id, id), eq(schema.docTemplates.accountId, accountId)));
    return rows[0];
  }

  async createDocTemplate(input: schema.InsertDocTemplate): Promise<schema.DocTemplate> {
    const rows = await db.insert(schema.docTemplates).values(input).returning();
    return rows[0];
  }

  async getAllEmailTemplates(accountId: string): Promise<schema.EmailTemplate[]> {
    return db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.accountId, accountId));
  }

  async getEmailTemplate(accountId: string, id: string): Promise<schema.EmailTemplate | undefined> {
    const rows = await db.select().from(schema.emailTemplates).where(and(eq(schema.emailTemplates.id, id), eq(schema.emailTemplates.accountId, accountId)));
    return rows[0];
  }

  async createEmailTemplate(input: schema.InsertEmailTemplate): Promise<schema.EmailTemplate> {
    const rows = await db.insert(schema.emailTemplates).values(input).returning();
    return rows[0];
  }

  async updateEmailTemplate(accountId: string, id: string, input: Partial<schema.InsertEmailTemplate>): Promise<schema.EmailTemplate> {
    const rows = await db.update(schema.emailTemplates).set(input).where(and(eq(schema.emailTemplates.id, id), eq(schema.emailTemplates.accountId, accountId))).returning();
    return rows[0];
  }

  async deleteEmailTemplate(accountId: string, id: string): Promise<void> {
    await db.delete(schema.emailTemplates).where(and(eq(schema.emailTemplates.id, id), eq(schema.emailTemplates.accountId, accountId)));
  }

  async getAllNotificationSettings(accountId: string): Promise<schema.NotificationSetting[]> {
    return db.select().from(schema.notificationSettings).where(eq(schema.notificationSettings.accountId, accountId));
  }

  async getNotificationSetting(accountId: string, eventType: string): Promise<schema.NotificationSetting | undefined> {
    const rows = await db.select().from(schema.notificationSettings).where(
      and(eq(schema.notificationSettings.accountId, accountId), eq(schema.notificationSettings.eventType, eventType))
    );
    return rows[0];
  }

  async upsertNotificationSetting(input: schema.InsertNotificationSetting): Promise<schema.NotificationSetting> {
    const existing = await this.getNotificationSetting(input.accountId, input.eventType);
    if (existing) {
      const rows = await db
        .update(schema.notificationSettings)
        .set({ leadMinutes: input.leadMinutes })
        .where(and(
          eq(schema.notificationSettings.accountId, input.accountId),
          eq(schema.notificationSettings.eventType, input.eventType)
        ))
        .returning();
      return rows[0];
    }
    const rows = await db.insert(schema.notificationSettings).values(input).returning();
    return rows[0];
  }
}

export const storage = new DbStorage();
