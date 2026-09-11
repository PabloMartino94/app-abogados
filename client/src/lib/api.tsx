import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppEvent, AppFile, Case, CaseStatus, Client, DocTemplate, EmailTemplate, Fuero, NotificationSettings, Report, ReportKind, ReportPriority, ReportStatus } from "@/lib/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

export type AccountUser = { id: string; name: string; email: string; role: string };

type StoreApi = {
  clients: Client[];
  cases: Case[];
  events: AppEvent[];
  files: AppFile[];
  docTemplates: DocTemplate[];
  emailTemplates: EmailTemplate[];
  notificationSettings: NotificationSettings;
  users: AccountUser[];
  reports: Report[];

  createClient: (input: Omit<Client, "id" | "createdBy">) => Promise<Client>;
  updateClient: (id: string, input: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  createCase: (input: Omit<Case, "id" | "clientName" | "createdBy">) => Promise<Case>;
  updateCase: (id: string, input: Partial<Case>) => Promise<Case>;
  createEvent: (input: Omit<AppEvent, "id" | "clientName" | "caseNumber" | "createdBy" | "cancelled">) => Promise<AppEvent>;
  updateEvent: (id: string, input: Partial<AppEvent & { cancelled: boolean }>) => Promise<AppEvent>;
  createFile: (input: Omit<AppFile, "id" | "date" | "caseNumber" | "filePath"> & { file?: globalThis.File | null }) => Promise<AppFile>;
  createDocTemplate: (input: Omit<DocTemplate, "id">) => Promise<DocTemplate>;
  createEmailTemplate: (input: Omit<EmailTemplate, "id">) => Promise<EmailTemplate>;
  updateEmailTemplate: (id: string, input: Partial<EmailTemplate>) => Promise<EmailTemplate>;
  deleteEmailTemplate: (id: string) => Promise<void>;
  setNotificationSettings: (next: NotificationSettings) => Promise<void>;
  createReport: (input: {
    kind: ReportKind;
    title: string;
    description: string;
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    pageContext?: string;
    priority: ReportPriority;
  }) => Promise<Report>;
  updateReportStatus: (id: string, status: ReportStatus) => Promise<Report>;
};

const StoreContext = createContext<StoreApi | null>(null);

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function useStoreData() {
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchJson<AccountUser[]>("/api/users"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetchJson<Client[]>("/api/clients"),
  });

  const { data: rawCases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => fetchJson<Array<{ id: string; number: string; clientId: string; status: string; court: string; startDate: string; fuero: string; notes: string; createdBy: string }>>("/api/cases"),
  });

  const cases: Case[] = useMemo(() => {
    return rawCases.map((c) => {
      const client = clients.find((cl) => cl.id === c.clientId);
      return { ...c, status: c.status as CaseStatus, fuero: c.fuero as Fuero, clientName: client?.name ?? "(Sin cliente)", createdBy: c.createdBy || "" };
    });
  }, [rawCases, clients]);

  const { data: rawEvents = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => fetchJson<Array<{ id: string; type: string; date: string; time: string; duration: string; caseId: string; clientId: string; description: string; leadMinutes: number; createdBy: string; cancelled: boolean }>>("/api/events"),
  });

  const events: AppEvent[] = useMemo(() => {
    return rawEvents.map((e) => {
      const client = clients.find((cl) => cl.id === e.clientId);
      const caseItem = cases.find((c) => c.id === e.caseId);
      return {
        ...e,
        type: e.type as AppEvent["type"],
        duration: (e.duration || "60") as AppEvent["duration"],
        desc: e.description,
        clientName: client?.name ?? "(Sin cliente)",
        caseNumber: caseItem?.number ?? "(Sin expediente)",
        leadMinutes: (e.leadMinutes || 60) as AppEvent["leadMinutes"],
        createdBy: e.createdBy || "",
        cancelled: e.cancelled || false,
      };
    });
  }, [rawEvents, clients, cases]);

  const { data: rawFiles = [] } = useQuery({
    queryKey: ["files"],
    queryFn: () => fetchJson<Array<{ id: string; name: string; date: string; type: string; caseId: string; description: string; filePath: string }>>("/api/files"),
  });

  const files: AppFile[] = useMemo(() => {
    return rawFiles.map((f) => {
      const caseItem = cases.find((c) => c.id === f.caseId);
      return {
        ...f,
        type: f.type as AppFile["type"],
        desc: f.description,
        filePath: f.filePath || "",
        caseNumber: caseItem?.number ?? "(Sin expediente)",
      };
    });
  }, [rawFiles, cases]);

  const { data: docTemplates = [] } = useQuery({
    queryKey: ["doc-templates"],
    queryFn: () => fetchJson<DocTemplate[]>("/api/doc-templates"),
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => fetchJson<EmailTemplate[]>("/api/email-templates"),
  });

  const { data: rawSettings = [] } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => fetchJson<Array<{ eventType: string; leadMinutes: string }>>("/api/notification-settings"),
  });

  const notificationSettings: NotificationSettings = useMemo(() => {
    const defaults = { Audiencia: 1440, Vencimiento: 4320, Reunión: 60 } as NotificationSettings;
    rawSettings.forEach((s) => {
      if (s.eventType === "Audiencia" || s.eventType === "Vencimiento" || s.eventType === "Reunión") {
        defaults[s.eventType] = parseInt(s.leadMinutes, 10) as any;
      }
    });
    return defaults;
  }, [rawSettings]);

  const { data: rawReports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: () =>
      fetchJson<
        Array<{
          id: string;
          reportedBy: string;
          kind: string;
          title: string;
          description: string;
          stepsToReproduce: string;
          expectedBehavior: string;
          actualBehavior: string;
          pageContext: string;
          priority: string;
          status: string;
          createdAt: string;
        }>
      >("/api/reports"),
  });

  const reports: Report[] = useMemo(() => {
    return rawReports
      .map((r) => {
        const reporter = users.find((u) => u.id === r.reportedBy);
        return {
          ...r,
          kind: r.kind as ReportKind,
          priority: r.priority as ReportPriority,
          status: r.status as ReportStatus,
          reportedByName: reporter?.name ?? "—",
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [rawReports, users]);

  const createClientMutation = useMutation({
    mutationFn: (input: Omit<Client, "id" | "createdBy">) => fetchJson<Client>("/api/clients", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, ...fields }: Partial<Client> & { id: string }) => fetchJson<Client>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(fields) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const createCaseMutation = useMutation({
    mutationFn: (input: Omit<Case, "id" | "clientName" | "createdBy">) => fetchJson<any>("/api/cases", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });

  const updateCaseMutation = useMutation({
    mutationFn: ({ id, ...fields }: Partial<Case> & { id: string }) => fetchJson<Case>(`/api/cases/${id}`, { method: "PUT", body: JSON.stringify(fields) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });

  const createEventMutation = useMutation({
    mutationFn: (input: Omit<AppEvent, "id" | "clientName" | "caseNumber" | "createdBy" | "cancelled">) => {
      const payload = { type: input.type, date: input.date, time: input.time, duration: input.duration, caseId: input.caseId, clientId: input.clientId, description: input.desc, leadMinutes: input.leadMinutes };
      return fetchJson<any>("/api/events", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, ...fields }: Partial<AppEvent & { cancelled: boolean }> & { id: string }) => {
      const payload: any = { ...fields };
      if (fields.desc !== undefined) {
        payload.description = fields.desc;
        delete payload.desc;
      }
      delete payload.clientName;
      delete payload.caseNumber;
      return fetchJson<any>(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const createFileMutation = useMutation({
    mutationFn: async (input: Omit<AppFile, "id" | "date" | "caseNumber" | "filePath"> & { file?: globalThis.File | null }) => {
      const formData = new FormData();
      if (input.file) formData.append("file", input.file);
      formData.append("name", input.name);
      formData.append("type", input.type);
      formData.append("caseId", input.caseId);
      formData.append("description", input.desc || "");
      const res = await fetch("/api/files", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });

  const createDocTemplateMutation = useMutation({
    mutationFn: (input: Omit<DocTemplate, "id">) => fetchJson<DocTemplate>("/api/doc-templates", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-templates"] }),
  });

  const createEmailTemplateMutation = useMutation({
    mutationFn: (input: Omit<EmailTemplate, "id">) => fetchJson<EmailTemplate>("/api/email-templates", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const updateEmailTemplateMutation = useMutation({
    mutationFn: ({ id, ...input }: Partial<EmailTemplate> & { id: string }) => fetchJson<EmailTemplate>(`/api/email-templates/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const deleteEmailTemplateMutation = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/email-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const setNotificationSettingsMutation = useMutation({
    mutationFn: async (next: NotificationSettings) => {
      await Promise.all(
        (["Audiencia", "Vencimiento", "Reunión"] as const).map((type) =>
          fetchJson("/api/notification-settings", { method: "POST", body: JSON.stringify({ eventType: type, leadMinutes: String(next[type]) }) })
        )
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-settings"] }),
  });

  const createReportMutation = useMutation({
    mutationFn: (input: {
      kind: ReportKind;
      title: string;
      description: string;
      stepsToReproduce?: string;
      expectedBehavior?: string;
      actualBehavior?: string;
      pageContext?: string;
      priority: ReportPriority;
    }) => fetchJson<any>("/api/reports", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      fetchJson<any>(`/api/reports/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  return {
    clients,
    cases,
    events,
    files,
    docTemplates,
    emailTemplates,
    notificationSettings,
    users,
    reports,
    createClient: (input: Omit<Client, "id" | "createdBy">) => createClientMutation.mutateAsync(input),
    updateClient: (id: string, input: Partial<Client>) => updateClientMutation.mutateAsync({ id, ...input }),
    deleteClient: async (id: string) => { await deleteClientMutation.mutateAsync(id); },
    createCase: (input: Omit<Case, "id" | "clientName" | "createdBy">) => createCaseMutation.mutateAsync(input),
    updateCase: (id: string, input: Partial<Case>) => updateCaseMutation.mutateAsync({ id, ...input }),
    createEvent: (input: Omit<AppEvent, "id" | "clientName" | "caseNumber" | "createdBy" | "cancelled">) => createEventMutation.mutateAsync(input),
    updateEvent: (id: string, input: Partial<AppEvent & { cancelled: boolean }>) => updateEventMutation.mutateAsync({ id, ...input }),
    createFile: (input: Omit<AppFile, "id" | "date" | "caseNumber" | "filePath"> & { file?: globalThis.File | null }) => createFileMutation.mutateAsync(input),
    createDocTemplate: (input: Omit<DocTemplate, "id">) => createDocTemplateMutation.mutateAsync(input),
    createEmailTemplate: (input: Omit<EmailTemplate, "id">) => createEmailTemplateMutation.mutateAsync(input),
    updateEmailTemplate: (id: string, input: Partial<EmailTemplate>) => updateEmailTemplateMutation.mutateAsync({ id, ...input }),
    deleteEmailTemplate: async (id: string) => { await deleteEmailTemplateMutation.mutateAsync(id); },
    setNotificationSettings: (next: NotificationSettings) => setNotificationSettingsMutation.mutateAsync(next),
    createReport: (input: {
      kind: ReportKind;
      title: string;
      description: string;
      stepsToReproduce?: string;
      expectedBehavior?: string;
      actualBehavior?: string;
      pageContext?: string;
      priority: ReportPriority;
    }) => createReportMutation.mutateAsync(input),
    updateReportStatus: (id: string, status: ReportStatus) => updateReportStatusMutation.mutateAsync({ id, status }),
  };
}

export function ApiProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProviderInner>{children}</ApiProviderInner>
    </QueryClientProvider>
  );
}

function ApiProviderInner({ children }: PropsWithChildren) {
  const api = useStoreData();
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("ApiProvider missing");
  return ctx;
}
