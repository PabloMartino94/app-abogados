import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { LogOut, Pencil, ShieldCheck, Trash2, UserPlus, BellRing, Mail, Plus, Variable, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { EmailTemplateType, NotificationLeadMinutes, NotificationSettings } from "@/lib/types";

const leadOptions: { label: string; value: NotificationLeadMinutes }[] = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
  { label: "2 h", value: 120 },
  { label: "4 h", value: 240 },
  { label: "24 h", value: 1440 },
  { label: "72 h", value: 4320 },
];

function leadLabel(m: number) {
  if (m >= 1440) return `${Math.round(m / 1440)} d`;
  if (m >= 60) return `${Math.round(m / 60)} h`;
  return `${m} min`;
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const store = useStore();
  const { user, logout } = useAuth();

  const [creating, setCreating] = useState(false);
  const [creatingEmail, setCreatingEmail] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [emailType, setEmailType] = useState<EmailTemplateType>("Recordatorio");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const lastFocusedField = useRef<"subject" | "content">("content");
  const subjectRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<EmailTemplateType>("Recordatorio");
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const editSubjectRef = useRef<HTMLInputElement>(null);
  const editContentRef = useRef<HTMLTextAreaElement>(null);
  const editLastFocused = useRef<"subject" | "content">("content");

  const templateVariables = ["{{cliente}}", "{{dni}}", "{{fecha}}", "{{expediente}}"];

  function insertVariable(variable: string) {
    if (lastFocusedField.current === "subject") {
      const el = subjectRef.current;
      if (!el) return;
      const start = el.selectionStart ?? emailSubject.length;
      const end = el.selectionEnd ?? start;
      const next = emailSubject.slice(0, start) + variable + emailSubject.slice(end);
      setEmailSubject(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + variable.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      const el = contentRef.current;
      if (!el) return;
      const start = el.selectionStart ?? emailContent.length;
      const end = el.selectionEnd ?? start;
      const next = emailContent.slice(0, start) + variable + emailContent.slice(end);
      setEmailContent(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + variable.length;
        el.setSelectionRange(pos, pos);
      });
    }
  }

  function insertEditVariable(variable: string) {
    if (editLastFocused.current === "subject") {
      const el = editSubjectRef.current;
      if (!el) return;
      const start = el.selectionStart ?? editSubject.length;
      const end = el.selectionEnd ?? start;
      const next = editSubject.slice(0, start) + variable + editSubject.slice(end);
      setEditSubject(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + variable.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      const el = editContentRef.current;
      if (!el) return;
      const start = el.selectionStart ?? editContent.length;
      const end = el.selectionEnd ?? start;
      const next = editContent.slice(0, start) + variable + editContent.slice(end);
      setEditContent(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + variable.length;
        el.setSelectionRange(pos, pos);
      });
    }
  }

  function resetCreateForm() {
    setCreatingEmail(false);
    setEmailName("");
    setEmailType("Recordatorio");
    setEmailSubject("");
    setEmailContent("");
  }

  async function handleCreateEmailTemplate() {
    if (!emailName.trim()) return;
    await store.createEmailTemplate({
      name: emailName,
      type: emailType,
      subject: emailSubject,
      content: emailContent,
    });
    resetCreateForm();
  }

  function startEditTemplate(t: { id: string; name: string; type: string; subject: string; content: string }) {
    setEditingTemplateId(t.id);
    setEditName(t.name);
    setEditType(t.type as EmailTemplateType);
    setEditSubject(t.subject);
    setEditContent(t.content);
  }

  async function saveEditTemplate() {
    if (!editingTemplateId || !editName.trim()) return;
    await store.updateEmailTemplate(editingTemplateId, {
      name: editName,
      type: editType,
      subject: editSubject,
      content: editContent,
    });
    setEditingTemplateId(null);
  }

  async function handleDeleteTemplate(id: string) {
    await store.deleteEmailTemplate(id);
    if (editingTemplateId === id) setEditingTemplateId(null);
  }

  const [notif, setNotif] = useState<NotificationSettings>(store.notificationSettings);

  const emailTemplates = store.emailTemplates;

  function applyNotif(next: NotificationSettings) {
    setNotif(next);
    store.setNotificationSettings(next);
  }

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl tracking-tight" data-testid="text-settings-title">
              Configuración
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-settings-subtitle">
              Perfil, usuarios y alertas.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={async () => {
              await logout();
              setLocation("/");
            }}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </header>

        <section className="mt-4 grid gap-3">
          <Card className="app-card rounded-3xl p-4">
            <div className="text-sm font-semibold" data-testid="text-profile-title">
              Perfil
            </div>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
                <Input placeholder="Nombre" data-testid="input-profile-name" />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Apellido</label>
                <Input placeholder="Apellido" data-testid="input-profile-lastname" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
                  <Input inputMode="numeric" placeholder="" data-testid="input-profile-phone" />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <Input inputMode="email" placeholder="" data-testid="input-profile-email" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Firma (opcional)</label>
                <Input type="file" data-testid="input-profile-signature" />
              </div>
              <Button
                className="rounded-2xl"
                onClick={() => alert("Perfil guardado (demo).")}
                data-testid="button-save-profile"
              >
                Guardar
              </Button>
            </div>
          </Card>

          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold" data-testid="text-users-title">
                Usuarios
              </div>
              <Button
                className="rounded-2xl"
                onClick={() => setCreating(true)}
                data-testid="button-open-create-user"
              >
                <UserPlus className="h-4 w-4" />
                Crear
              </Button>
            </div>

            {creating ? (
              <div className="mt-3 rounded-2xl border bg-white/50 p-3" data-testid="panel-create-user">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
                    <Input placeholder="Nombre" data-testid="input-new-user-name" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Email</label>
                    <Input inputMode="email" placeholder="email@estudio.com" data-testid="input-new-user-email" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Rol</label>
                    <Select defaultValue="Asistente">
                      <SelectTrigger className="rounded-2xl" data-testid="select-new-user-role">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Abogado">Abogado</SelectItem>
                        <SelectItem value="Asistente">Asistente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Contraseña</label>
                    <Input type="password" placeholder="Mínimo 8" data-testid="input-new-user-password" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="rounded-2xl"
                      onClick={() => {
                        setCreating(false);
                        alert("Usuario creado (demo).");
                      }}
                      data-testid="button-submit-create-user"
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => setCreating(false)}
                      data-testid="button-cancel-create-user"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {user && (
              <div className="mt-3 grid gap-2">
                <div
                  className="flex items-center justify-between gap-3 rounded-2xl border bg-white/50 px-3 py-3"
                  data-testid={`row-user-${user.id}`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{user.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === "Abogado" ? "default" : "secondary"} data-testid={`badge-role-${user.id}`}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border bg-white/50 px-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <div className="text-sm font-semibold" data-testid="text-alerts-title">
                    Alertas automáticas
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground" data-testid="text-alerts-desc">
                  Notificación en app y email (demo)
                </div>
              </div>
              <Switch data-testid="switch-alerts" defaultChecked />
            </div>
          </Card>

          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold" data-testid="text-notification-settings-title">
                Notificaciones (por tipo)
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground" data-testid="text-notification-settings-desc">
              Definí cuántos minutos/horas/días antes se notifica por Reunión, Audiencia y Vencimiento.
            </p>

            <div className="mt-3 grid gap-3">
              {([
                { key: "Reunión", color: "bg-blue-500" },
                { key: "Audiencia", color: "bg-red-500" },
                { key: "Vencimiento", color: "bg-orange-500" },
              ] as const).map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border bg-white/50 px-3 py-3"
                  data-testid={`row-notif-${row.key}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${row.color}`} />
                      <div className="text-sm font-semibold">{row.key}</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-notif-current-${row.key}`}>
                      Actual: {leadLabel(notif[row.key])} antes
                    </div>
                  </div>

                  <Select
                    value={String(notif[row.key])}
                    onValueChange={(v) => applyNotif({ ...notif, [row.key]: Number(v) as any })}
                  >
                    <SelectTrigger className="w-36 rounded-2xl" data-testid={`select-notif-${row.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leadOptions.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Card>
          <Card className="app-card rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold" data-testid="text-email-templates-title">
                  Plantillas de correo
                </div>
              </div>
              <Button
                className="rounded-2xl"
                onClick={() => setCreatingEmail(true)}
                data-testid="button-open-create-email-template"
              >
                <Plus className="h-4 w-4" />
                Crear
              </Button>
            </div>

            {creatingEmail && (
              <div className="mt-3 rounded-2xl border bg-white/50 p-3" data-testid="panel-create-email-template">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Nueva plantilla de correo</div>
                  <button
                    className="text-sm font-medium text-primary"
                    onClick={() => setCreatingEmail(false)}
                    data-testid="button-close-create-email-template"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
                    <Input value={emailName} onChange={(e) => setEmailName(e.target.value)} placeholder="Ej: Recordatorio vencimiento" data-testid="input-email-template-name" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                    <Select value={emailType} onValueChange={(v) => setEmailType(v as EmailTemplateType)}>
                      <SelectTrigger className="rounded-2xl" data-testid="select-email-template-type">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Recordatorio", "Notificación", "Seguimiento"] as EmailTemplateType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Insertar variable</label>
                    <div className="flex flex-wrap gap-1.5">
                      {templateVariables.map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="rounded-xl border bg-white/70 px-2.5 py-1 text-xs font-mono font-medium text-primary hover:bg-primary/10 transition"
                          onClick={() => insertVariable(v)}
                          data-testid={`button-insert-var-${v.replace(/[{}]/g, "")}`}
                        >
                          <Variable className="mr-1 inline h-3 w-3" />
                          {v}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Seleccioná una variable para insertarla en el asunto o contenido
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Asunto</label>
                    <Input
                      ref={subjectRef}
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      onFocus={() => { lastFocusedField.current = "subject"; }}
                      placeholder="Asunto del correo"
                      data-testid="input-email-template-subject"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Contenido</label>
                    <Textarea
                      ref={contentRef}
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      onFocus={() => { lastFocusedField.current = "content"; }}
                      className="min-h-32 rounded-2xl"
                      placeholder="Escribí el contenido del correo"
                      data-testid="textarea-email-template-content"
                    />
                  </div>
                  <Button
                    className="rounded-2xl"
                    onClick={handleCreateEmailTemplate}
                    data-testid="button-submit-create-email-template"
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-3 grid gap-2">
              {emailTemplates.length === 0 && !creatingEmail && (
                <div className="rounded-2xl border bg-white/50 px-3 py-4 text-center text-sm text-muted-foreground" data-testid="text-no-email-templates">
                  No hay plantillas de correo creadas
                </div>
              )}
              {emailTemplates.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border bg-white/50 px-3 py-3"
                  data-testid={`row-email-template-${t.id}`}
                >
                  {editingTemplateId === t.id ? (
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Editar plantilla</div>
                        <button className="text-sm font-medium text-primary" onClick={() => setEditingTemplateId(null)} data-testid={`button-cancel-edit-${t.id}`}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-name-${t.id}`} />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                        <Select value={editType} onValueChange={(v) => setEditType(v as EmailTemplateType)}>
                          <SelectTrigger className="rounded-2xl" data-testid={`select-edit-type-${t.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["Recordatorio", "Notificación", "Seguimiento"] as EmailTemplateType[]).map((et) => (
                              <SelectItem key={et} value={et}>{et}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Insertar variable</label>
                        <div className="flex flex-wrap gap-1.5">
                          {templateVariables.map((v) => (
                            <button
                              key={v}
                              type="button"
                              className="rounded-xl border bg-white/70 px-2.5 py-1 text-xs font-mono font-medium text-primary hover:bg-primary/10 transition"
                              onClick={() => insertEditVariable(v)}
                              data-testid={`button-edit-insert-var-${v.replace(/[{}]/g, "")}-${t.id}`}
                            >
                              <Variable className="mr-1 inline h-3 w-3" />
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Asunto</label>
                        <Input
                          ref={editSubjectRef}
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          onFocus={() => { editLastFocused.current = "subject"; }}
                          data-testid={`input-edit-subject-${t.id}`}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Contenido</label>
                        <Textarea
                          ref={editContentRef}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onFocus={() => { editLastFocused.current = "content"; }}
                          className="min-h-24 rounded-2xl"
                          data-testid={`textarea-edit-content-${t.id}`}
                        />
                      </div>
                      <Button className="rounded-2xl" onClick={saveEditTemplate} data-testid={`button-save-edit-${t.id}`}>
                        Guardar cambios
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{t.type}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Asunto: {t.subject}</div>
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.content}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="grid h-8 w-8 place-items-center rounded-xl border bg-white/60 hover:bg-white/90 transition"
                          onClick={() => startEditTemplate(t)}
                          data-testid={`button-edit-template-${t.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                        </button>
                        <button
                          className="grid h-8 w-8 place-items-center rounded-xl border bg-white/60 hover:bg-red-50 transition"
                          onClick={() => handleDeleteTemplate(t.id)}
                          data-testid={`button-delete-template-${t.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
