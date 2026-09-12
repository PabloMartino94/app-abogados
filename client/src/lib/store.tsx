import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import type {
  AppEvent,
  AppFile,
  Case,
  Client,
  DocTemplate,
  EmailTemplate,
  NotificationSettings,
} from "@/lib/types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

type StoreState = {
  clients: Client[];
  cases: Case[];
  events: AppEvent[];
  files: AppFile[];
  docTemplates: DocTemplate[];
  emailTemplates: EmailTemplate[];
  notificationSettings: NotificationSettings;
};

type StoreApi = StoreState & {
  createClient: (input: Omit<Client, "id">) => Client;
  createCase: (input: Omit<Case, "id" | "clientName">) => Case;
  createEvent: (input: Omit<AppEvent, "id" | "clientName" | "caseNumber">) => AppEvent;
  createFile: (input: Omit<AppFile, "id" | "date" | "caseNumber"> & { file?: File | null }) => AppFile;

  createDocTemplate: (input: Omit<DocTemplate, "id">) => DocTemplate;
  createEmailTemplate: (input: Omit<EmailTemplate, "id">) => EmailTemplate;

  setNotificationSettings: (next: NotificationSettings) => void;
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<StoreState>(() => {
    const initialClients: Client[] = [
      {
        id: "c-1",
        name: "María González",
        doc: "27.123.456",
        email: "maria.gonzalez@mail.com",
        phone: "+54 11 4444 2222",
        address: "Av. Santa Fe 1234, CABA",
        notes: "Prefiere contacto por WhatsApp.",
        blacklist: false,
      },
      {
        id: "c-2",
        name: "Juan Pérez",
        doc: "20.987.654",
        email: "juan.perez@mail.com",
        phone: "+54 11 4333 1111",
        address: "San Martín 88, CABA",
        notes: "Enviar recordatorios 48h antes de audiencias.",
        blacklist: true,
      },
      {
        id: "c-3",
        name: "ACME S.A.",
        doc: "30-55555555-9",
        email: "legal@acme.com",
        phone: "+54 11 4000 0000",
        address: "Parque Industrial Norte",
        notes: "Contacto: administración.",
        blacklist: false,
      },
    ];

    const initialCases: Case[] = [
      {
        id: "e-1",
        number: "CIV-2026-0012",
        clientId: "c-1",
        clientName: "María González",
        status: "Audiencia",
        court: "Juzgado Civil N° 12",
        startDate: "2026-01-10",
        fuero: "civil",
        notes: "Observaciones del expediente",
      },
      {
        id: "e-2",
        number: "LAB-2025-0441",
        clientId: "c-2",
        clientName: "Juan Pérez",
        status: "En trámite",
        court: "Juzgado Laboral N° 3",
        startDate: "2025-11-22",
        fuero: "laboral",
        notes: "Observaciones del expediente",
      },
      {
        id: "e-3",
        number: "COM-2026-0100",
        clientId: "c-3",
        clientName: "ACME S.A.",
        status: "Iniciado",
        court: "Juzgado Comercial N° 2",
        startDate: "2026-01-29",
        fuero: "comercial",
        notes: "Observaciones del expediente",
      },
    ];

    const initialEvents: AppEvent[] = [
      {
        id: "a-1",
        type: "Audiencia",
        date: "2026-02-03",
        time: "09:30",
        clientId: "c-1",
        clientName: "María González",
        caseId: "e-1",
        caseNumber: "CIV-2026-0012",
        desc: "Audiencia preliminar",
      },
      {
        id: "a-2",
        type: "Vencimiento",
        date: "2026-02-04",
        time: "12:00",
        clientId: "c-2",
        clientName: "Juan Pérez",
        caseId: "e-2",
        caseNumber: "LAB-2025-0441",
        desc: "Presentación de prueba",
      },
      {
        id: "a-3",
        type: "Reunión",
        date: "2026-02-05",
        time: "10:00",
        clientId: "c-3",
        clientName: "ACME S.A.",
        caseId: "e-3",
        caseNumber: "COM-2026-0100",
        desc: "Revisión de estrategia",
      },
    ];

    const initialFiles: AppFile[] = [
      {
        id: "f-1",
        name: "Escrito inicial.pdf",
        date: "2026-01-12",
        type: "PDF",
        caseId: "e-1",
        caseNumber: "CIV-2026-0012",
        desc: "Presentación",
      },
      {
        id: "f-2",
        name: "Poder.docx",
        date: "2026-01-14",
        type: "Word",
        caseId: "e-2",
        caseNumber: "LAB-2025-0441",
        desc: "Poder simple",
      },
      {
        id: "f-3",
        name: "Audio - reunión.m4a",
        date: "2026-01-22",
        type: "Audio",
        caseId: "e-3",
        caseNumber: "COM-2026-0100",
        desc: "Notas de reunión",
      },
    ];

    const docTemplates: DocTemplate[] = [
      {
        id: "t-1",
        name: "Demanda estándar",
        type: "Demanda",
        source: "upload",
        content: "Sr./Sra. Juez...\n\nCliente: {{cliente}}\nDNI: {{dni}}\nFecha: {{fecha}}\nExpediente: {{expediente}}",
        filePath: "",
        fileName: "",
      },
      {
        id: "t-2",
        name: "Poder simple",
        type: "Poder",
        source: "upload",
        content: "Por la presente, {{cliente}}...",
        filePath: "",
        fileName: "",
      },
    ];

    const emailTemplates: EmailTemplate[] = [
      {
        id: "m-1",
        name: "Recordatorio de audiencia",
        type: "Recordatorio",
        subject: "Recordatorio: audiencia {{expediente}}",
        content:
          "Hola {{cliente}},\n\nTe recordamos la audiencia del expediente {{expediente}}.\nFecha: {{fecha}}\n\nSaludos,\n{{estudio}}",
      },
      {
        id: "m-2",
        name: "Solicitud de documentación",
        type: "Seguimiento",
        subject: "Documentación pendiente - {{expediente}}",
        content:
          "Hola {{cliente}},\n\nQuedó pendiente la siguiente documentación para el expediente {{expediente}}:\n- ...\n\nGracias,\n{{estudio}}",
      },
    ];

    const notificationSettings: NotificationSettings = {
      Audiencia: 1440,
      Vencimiento: 4320,
      Reunión: 60,
    };

    return {
      clients: initialClients,
      cases: initialCases,
      events: initialEvents,
      files: initialFiles,
      docTemplates,
      emailTemplates,
      notificationSettings,
    };
  });

  const api: StoreApi = useMemo(() => {
    return {
      ...state,

      createClient(input) {
        const created = { ...input, id: uid("c") };
        setState((s) => ({ ...s, clients: [created, ...s.clients] }));
        return created;
      },

      createCase(input) {
        const client = state.clients.find((c) => c.id === input.clientId);
        const created: Case = {
          ...input,
          id: uid("e"),
          clientName: client?.name ?? "(Sin cliente)",
        };
        setState((s) => ({ ...s, cases: [created, ...s.cases] }));
        return created;
      },

      createEvent(input) {
        const client = state.clients.find((c) => c.id === input.clientId);
        const caseItem = state.cases.find((c) => c.id === input.caseId);
        const created: AppEvent = {
          ...input,
          id: uid("a"),
          clientName: client?.name ?? "(Sin cliente)",
          caseNumber: caseItem?.number ?? "(Sin expediente)",
        };
        setState((s) => ({ ...s, events: [created, ...s.events] }));
        return created;
      },

      createFile(input) {
        const name = input.file?.name ?? input.name;
        const now = new Date();
        const caseItem = state.cases.find((c) => c.id === input.caseId);
        const created: AppFile = {
          id: uid("f"),
          name,
          date: now.toISOString().slice(0, 10),
          type: input.type,
          caseId: input.caseId,
          caseNumber: caseItem?.number ?? "(Sin expediente)",
          desc: input.desc,
        };
        setState((s) => ({ ...s, files: [created, ...s.files] }));
        return created;
      },

      createDocTemplate(input) {
        const created = { ...input, id: uid("t") };
        setState((s) => ({ ...s, docTemplates: [created, ...s.docTemplates] }));
        return created;
      },

      createEmailTemplate(input) {
        const created = { ...input, id: uid("m") };
        setState((s) => ({ ...s, emailTemplates: [created, ...s.emailTemplates] }));
        return created;
      },

      setNotificationSettings(next) {
        setState((s) => ({ ...s, notificationSettings: next }));
      },
    };
  }, [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
