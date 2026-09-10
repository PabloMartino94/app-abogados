import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useStore } from "@/lib/api";
import type { CaseStatus, Duration, EventType, Fuero, NotificationLeadMinutes } from "@/lib/types";

type CreateKind = "client" | "case" | "event";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  kind: CreateKind;
  onCreated?: () => void;
};

const leadOptions: { label: string; value: NotificationLeadMinutes }[] = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
  { label: "2 h", value: 120 },
  { label: "4 h", value: 240 },
  { label: "24 h", value: 1440 },
  { label: "72 h", value: 4320 },
];

const durationOptions: { label: string; value: Duration }[] = [
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "1 hora", value: "60" },
  { label: "2 horas", value: "120" },
  { label: "Todo el día", value: "all_day" },
];

const clientSchema = z.object({
  name: z.string().optional().default(""),
  doc: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  blacklist: z.boolean().default(false),
  notes: z.string().optional().default(""),
}).refine(
  (data) => [data.name, data.doc, data.email, data.phone, data.address, data.notes].some((v) => v && v.trim().length > 0),
  { message: "Completá al menos un campo", path: ["name"] }
);

type ClientValues = z.infer<typeof clientSchema>;

const caseSchema = z.object({
  number: z.string().min(1, "Ingresá nombre o número"),
  fuero: z.enum(["civil", "laboral", "penal", "familia", "comercial"]),
  status: z.enum(["Iniciado", "En trámite", "Audiencia", "Sentencia", "Finalizado"]),
  startDate: z.string().min(1, "Ingresá la fecha"),
  clientId: z.string().optional().default(""),
  court: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

type CaseValues = z.infer<typeof caseSchema>;

const eventSchema = z.object({
  type: z.enum(["Audiencia", "Vencimiento", "Reunión"]),
  date: z.string().min(1, "Ingresá la fecha"),
  time: z.string().min(1, "Ingresá la hora"),
  duration: z.enum(["15", "30", "60", "120", "all_day"]),
  leadMinutes: z.number().int().min(1, "Seleccioná notificación"),
  caseId: z.string().optional().default(""),
  clientId: z.string().optional().default(""),
  desc: z.string().optional().default(""),
});

type EventValues = z.infer<typeof eventSchema>;

const NONE_VALUE = "__none__";

const USE_CONFIG = "__use_config__";

export function CreateDialog({ open, onOpenChange, kind, onCreated }: Props) {
  const store = useStore();
  const [showInlineClient, setShowInlineClient] = useState(false);
  const [inlineClientName, setInlineClientName] = useState("");
  const [useConfigNotification, setUseConfigNotification] = useState(true);

  const title = useMemo(() => {
    if (kind === "client") return "Nuevo cliente";
    if (kind === "case") return "Nuevo expediente";
    return "Nuevo evento";
  }, [kind]);

  const clientForm = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", doc: "", email: "", phone: "", address: "", blacklist: false, notes: "" },
    mode: "onChange",
  });

  const caseForm = useForm<CaseValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: { number: "", fuero: "civil", status: "Iniciado", startDate: new Date().toISOString().slice(0, 10), clientId: "", court: "", notes: "" },
    mode: "onChange",
  });

  const eventForm = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: "Audiencia", date: new Date().toISOString().slice(0, 10), time: "09:00", duration: "60", leadMinutes: 60, caseId: "", clientId: "", desc: "" },
    mode: "onChange",
  });

  const watchedClientId = eventForm.watch("clientId");
  const watchedCaseId = eventForm.watch("caseId");
  const watchedEventType = eventForm.watch("type");

  const activeCases = useMemo(() => {
    return store.cases.filter((c) => c.status !== "Finalizado");
  }, [store.cases]);

  const casesForSelectedClient = useMemo(() => {
    if (!watchedClientId) return activeCases;
    return activeCases.filter((c) => c.clientId === watchedClientId);
  }, [watchedClientId, activeCases]);

  useEffect(() => {
    if (kind !== "event") return;
    if (useConfigNotification) {
      const configValue = store.notificationSettings[watchedEventType as keyof typeof store.notificationSettings];
      if (configValue) {
        eventForm.setValue("leadMinutes", configValue, { shouldValidate: true });
      }
    }
  }, [watchedEventType, kind, useConfigNotification, store.notificationSettings]);

  useEffect(() => {
    if (kind !== "event") return;
    if (!watchedCaseId) return;
    const selectedCase = store.cases.find((c) => c.id === watchedCaseId);
    if (selectedCase && selectedCase.clientId) {
      eventForm.setValue("clientId", selectedCase.clientId);
    }
  }, [watchedCaseId, kind, store.cases]);

  useEffect(() => {
    if (kind !== "event") return;
    if (!watchedClientId) return;
    const clientCases = activeCases.filter((c) => c.clientId === watchedClientId);
    if (clientCases.length === 1) {
      eventForm.setValue("caseId", clientCases[0].id);
    } else {
      const currentCaseId = eventForm.getValues("caseId");
      if (currentCaseId && !clientCases.find((c) => c.id === currentCaseId)) {
        eventForm.setValue("caseId", "");
      }
    }
  }, [watchedClientId, kind, activeCases]);

  function close() {
    onOpenChange(false);
    setShowInlineClient(false);
    setInlineClientName("");
    setUseConfigNotification(true);
  }

  async function onSubmitClient(values: ClientValues) {
    await store.createClient({
      name: values.name || "",
      doc: values.doc || "",
      email: values.email || "",
      phone: values.phone || "",
      address: values.address || "",
      notes: values.notes || "",
      blacklist: Boolean(values.blacklist),
    });
    clientForm.reset();
    close();
    onCreated?.();
  }

  async function handleCreateInlineClient(): Promise<string> {
    const created = await store.createClient({
      name: inlineClientName,
      doc: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      blacklist: false,
    });
    setShowInlineClient(false);
    setInlineClientName("");
    return created.id;
  }

  async function onSubmitCase(values: CaseValues) {
    let clientId = values.clientId || "";
    if (showInlineClient && inlineClientName.trim()) {
      clientId = await handleCreateInlineClient();
    }
    await store.createCase({
      number: values.number,
      fuero: values.fuero as Fuero,
      court: values.court || "",
      status: values.status as CaseStatus,
      clientId,
      startDate: values.startDate,
      notes: values.notes || "",
    });
    caseForm.reset();
    close();
    onCreated?.();
  }

  async function onSubmitEvent(values: EventValues) {
    await store.createEvent({
      type: values.type as EventType,
      date: values.date,
      time: values.time,
      duration: values.duration as Duration,
      caseId: values.caseId || "",
      clientId: values.clientId || "",
      desc: values.desc || "",
      leadMinutes: values.leadMinutes as NotificationLeadMinutes,
    });
    eventForm.reset();
    close();
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-card w-[min(720px,calc(100vw-32px))] max-w-none rounded-3xl border-0 p-0 max-h-[90vh] overflow-y-auto">
        <div className="px-5 pb-5 pt-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl tracking-tight" data-testid="text-create-dialog-title">
              {title}
            </DialogTitle>
          </DialogHeader>

          {kind === "client" && (
            <div className="mt-4">
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="grid gap-3">
                  <FormField
                    control={clientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="name" data-testid="input-new-client-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="doc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNI/CUIT</FormLabel>
                        <FormControl>
                          <Input {...field} inputMode="numeric" data-testid="input-new-client-doc" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={clientForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input {...field} inputMode="numeric" autoComplete="tel" data-testid="input-new-client-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} inputMode="email" autoComplete="email" data-testid="input-new-client-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={clientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="street-address" data-testid="input-new-client-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="blacklist"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border bg-white/50 px-3 py-3">
                        <div>
                          <FormLabel>Lista negra</FormLabel>
                          <div className="text-xs text-muted-foreground">Marcar como cliente a evitar</div>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(Boolean(v))}
                            data-testid="checkbox-new-client-blacklist"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-24 rounded-2xl" data-testid="textarea-new-client-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button type="submit" className="rounded-2xl" data-testid="button-submit-new-client">
                      Guardar
                    </Button>
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={close} data-testid="button-cancel-new-client">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {kind === "case" && (
            <div className="mt-4">
              <Form {...caseForm}>
                <form onSubmit={caseForm.handleSubmit(onSubmitCase)} className="grid gap-3">
                  <FormField
                    control={caseForm.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre o número de expediente *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-new-case-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={caseForm.control}
                      name="fuero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuero *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="rounded-2xl" data-testid="select-new-case-fuero">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="civil">Civil</SelectItem>
                              <SelectItem value="laboral">Laboral</SelectItem>
                              <SelectItem value="penal">Penal</SelectItem>
                              <SelectItem value="familia">Familia</SelectItem>
                              <SelectItem value="comercial">Comercial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={caseForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="rounded-2xl" data-testid="select-new-case-status">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Iniciado">Iniciado</SelectItem>
                              <SelectItem value="En trámite">En trámite</SelectItem>
                              <SelectItem value="Audiencia">Audiencia</SelectItem>
                              <SelectItem value="Sentencia">Sentencia</SelectItem>
                              <SelectItem value="Finalizado">Finalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={caseForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de inicio *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-new-case-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={caseForm.control}
                    name="court"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juzgado</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-new-case-court" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormField
                      control={caseForm.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          {!showInlineClient ? (
                            <div className="flex gap-2">
                              <Select
                                value={field.value || NONE_VALUE}
                                onValueChange={(v) => field.onChange(v === NONE_VALUE ? "" : v)}
                              >
                                <FormControl>
                                  <SelectTrigger className="rounded-2xl flex-1" data-testid="select-new-case-client">
                                    <SelectValue placeholder="Sin cliente" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={NONE_VALUE}>Sin cliente</SelectItem>
                                  {store.clients.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name || c.doc || c.email || "Cliente"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="rounded-2xl shrink-0"
                                onClick={() => setShowInlineClient(true)}
                                data-testid="button-inline-new-client"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={inlineClientName}
                                onChange={(e) => setInlineClientName(e.target.value)}
                                placeholder="Nombre del nuevo cliente"
                                className="flex-1"
                                data-testid="input-inline-client-name"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-2xl shrink-0"
                                onClick={() => { setShowInlineClient(false); setInlineClientName(""); }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={caseForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-24 rounded-2xl" data-testid="textarea-new-case-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      type="submit"
                      className="rounded-2xl"
                      disabled={!caseForm.formState.isValid && !showInlineClient}
                      data-testid="button-submit-new-case"
                    >
                      Guardar
                    </Button>
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={close} data-testid="button-cancel-new-case">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {kind === "event" && (
            <div className="mt-4">
              <Form {...eventForm}>
                <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="grid gap-3">
                  <FormField
                    control={eventForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="rounded-2xl" data-testid="select-new-event-type">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Audiencia">Audiencia</SelectItem>
                            <SelectItem value="Vencimiento">Vencimiento</SelectItem>
                            <SelectItem value="Reunión">Reunión</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={eventForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-new-event-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={eventForm.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} data-testid="input-new-event-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={eventForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="rounded-2xl" data-testid="select-new-event-duration">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {durationOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={eventForm.control}
                      name="leadMinutes"
                      render={({ field }) => {
                        const configLabel = leadOptions.find(
                          (o) => o.value === store.notificationSettings[watchedEventType as keyof typeof store.notificationSettings]
                        )?.label ?? "";
                        return (
                          <FormItem>
                            <FormLabel>Notificación *</FormLabel>
                            <Select
                              value={useConfigNotification ? USE_CONFIG : String(field.value)}
                              onValueChange={(v) => {
                                if (v === USE_CONFIG) {
                                  setUseConfigNotification(true);
                                  const configValue = store.notificationSettings[watchedEventType as keyof typeof store.notificationSettings];
                                  field.onChange(configValue);
                                } else {
                                  setUseConfigNotification(false);
                                  field.onChange(Number(v));
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="rounded-2xl" data-testid="select-new-event-notification">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={USE_CONFIG}>
                                  Usar configuración ({configLabel})
                                </SelectItem>
                                {leadOptions.map((o) => (
                                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={eventForm.control}
                    name="caseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expediente</FormLabel>
                        <Select
                          value={field.value || NONE_VALUE}
                          onValueChange={(v) => field.onChange(v === NONE_VALUE ? "" : v)}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-2xl" data-testid="select-new-event-case">
                              <SelectValue placeholder="Sin expediente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Sin expediente</SelectItem>
                            {casesForSelectedClient.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.number}{c.clientName ? ` · ${c.clientName}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={eventForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select
                          value={field.value || NONE_VALUE}
                          onValueChange={(v) => {
                            field.onChange(v === NONE_VALUE ? "" : v);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-2xl" data-testid="select-new-event-client">
                              <SelectValue placeholder="Sin cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Sin cliente</SelectItem>
                            {store.clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name || c.doc || c.email || "Cliente"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={eventForm.control}
                    name="desc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-20 rounded-2xl" data-testid="textarea-new-event-desc" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button type="submit" className="rounded-2xl" data-testid="button-submit-new-event">
                      Guardar
                    </Button>
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={close} data-testid="button-cancel-new-event">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
