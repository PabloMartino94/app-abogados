import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, Save, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import type { DraftDocument, DraftTurn, TemplateType } from "@/lib/types";

const TEMPLATE_TYPES: TemplateType[] = ["Demanda", "Contrato", "Poder", "Carta documento"];

const EJEMPLOS = [
  "Necesito un contrato de arrendamiento rural para la explotación de un viñedo en Mendoza, con precio mixto: una parte en dinero y otra en quintales de uva.",
  "Armame una carta documento intimando al pago de alquileres atrasados.",
  "Necesito un poder general para juicios.",
];

/** Texto plano del documento, para que el asistente recuerde qué redactó. */
function draftToText(draft: DraftDocument): string {
  const parts = [draft.titulo];
  for (const section of draft.secciones) {
    parts.push(section.titulo);
    parts.push(...section.parrafos);
  }
  return parts.join("\n");
}

export default function RedactarPage() {
  const [, setLocation] = useLocation();
  const store = useStore();

  const [turns, setTurns] = useState<DraftTurn[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<DraftDocument | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<TemplateType>("Contrato");
  const [saving, setSaving] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, draft, thinking]);

  const aiEnabled = store.account?.aiEnabled ?? true;

  async function send(text: string) {
    const message = text.trim();
    if (!message || thinking) return;
    setError("");
    const nextTurns: DraftTurn[] = [...turns, { role: "abogado", text: message }];
    setTurns(nextTurns);
    setInput("");
    setThinking(true);
    try {
      const result = await store.draftWithAi(nextTurns);

      if (result.estado === "borrador" && result.documento) {
        setDraft(result.documento);
        if (!name) setName(result.documento.titulo);
        setTurns([
          ...nextTurns,
          {
            role: "asistente",
            text: `${result.mensaje}\n\n[DOCUMENTO REDACTADO]\n${draftToText(result.documento)}`,
          },
        ]);
      } else {
        const preguntas = result.preguntas ?? [];
        const body = [result.mensaje, ...preguntas.map((q, i) => `${i + 1}. ${q}`)]
          .filter(Boolean)
          .join("\n");
        setTurns([...nextTurns, { role: "asistente", text: body }]);
      }
    } catch (err: any) {
      setError(err?.message || "El asistente no pudo responder.");
      setTurns(nextTurns);
    } finally {
      setThinking(false);
    }
  }

  async function handleSave() {
    if (saving || !draft || !name.trim()) return;
    setError("");
    setSaving(true);
    try {
      await store.createDocTemplate({
        name: name.trim(),
        type,
        source: "ia",
        content: JSON.stringify(draft),
      });
      setLocation("/app/plantillas");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la plantilla.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">
        <header className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation("/app/plantillas")}
            data-testid="button-back-plantillas"
          >
            <ArrowLeft className="h-4 w-4" />
            Plantillas
          </button>
        </header>

        <div className="mt-3">
          <h1 className="font-serif text-2xl tracking-tight" data-testid="text-redactar-title">
            Redactar con el asistente
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-redactar-subtitle">
            Contale qué documento necesitás. Te va a preguntar lo que falte y después redacta el borrador
            con el membrete del estudio.
          </p>
        </div>

        {!aiEnabled && (
          <div
            className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800"
            data-testid="text-ai-disabled"
          >
            El asistente todavía no está configurado en el servidor. Falta cargar la clave de IA.
          </div>
        )}

        {error && (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
            data-testid="text-redactar-error"
          >
            {error}
          </div>
        )}

        {turns.length === 0 && (
          <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-examples">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Por ejemplo, pedile</div>
            </div>
            <div className="mt-3 grid gap-2">
              {EJEMPLOS.map((ejemplo, i) => (
                <button
                  key={i}
                  className="rounded-2xl border bg-white/50 px-3 py-2.5 text-left text-xs text-muted-foreground transition hover:bg-white/80"
                  onClick={() => send(ejemplo)}
                  disabled={thinking}
                  data-testid={`button-example-${i}`}
                >
                  {ejemplo}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No hace falta que le pases los datos del cliente: el asistente deja las variables puestas y
              AboxApp las completa al generar el documento.
            </p>
          </Card>
        )}

        <section className="mt-4 grid gap-3">
          {turns.map((turn, i) => (
            <div
              key={i}
              className={turn.role === "abogado" ? "flex justify-end" : "flex justify-start"}
              data-testid={`row-turn-${i}`}
            >
              <div
                className={
                  turn.role === "abogado"
                    ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-3 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[85%] whitespace-pre-wrap rounded-2xl border bg-white/70 px-3 py-2.5 text-sm"
                }
              >
                {turn.role === "asistente" ? turn.text.split("\n[DOCUMENTO REDACTADO]")[0] : turn.text}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start" data-testid="text-thinking">
              <div className="rounded-2xl border bg-white/70 px-3 py-2.5 text-sm text-muted-foreground">
                Redactando…
              </div>
            </div>
          )}
        </section>

        {draft && (
          <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-draft-preview">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Borrador</div>
            </div>

            <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border bg-white/50 px-3 py-3">
              <div className="text-center text-sm font-semibold" data-testid="text-draft-title">
                {draft.titulo}
              </div>
              {draft.secciones.map((section, i) => (
                <div key={i} className="mt-3">
                  <div className="text-xs font-semibold">{section.titulo}</div>
                  {section.parrafos.map((parrafo, j) => (
                    <p key={j} className="mt-1 text-xs text-muted-foreground">
                      {parrafo}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Revisalo antes de usarlo. Si querés cambiar algo, pedíselo abajo y lo vuelve a redactar.
            </p>

            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nombre para guardarlo en la biblioteca
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Contrato de arrendamiento rural — viñedo"
                  data-testid="input-draft-name"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                <Select value={type} onValueChange={(v) => setType(v as TemplateType)}>
                  <SelectTrigger className="min-w-0 rounded-2xl" data-testid="select-draft-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="rounded-2xl"
                onClick={handleSave}
                disabled={saving || !name.trim()}
                data-testid="button-save-draft"
              >
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? "Guardando…" : "Guardar como plantilla"}
              </Button>
            </div>
          </Card>
        )}

        <Card className="app-card mt-4 rounded-3xl p-4" data-testid="card-input">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-24 rounded-2xl"
            placeholder={
              draft
                ? "Pedile un cambio: agregá una cláusula de ajuste de precio…"
                : "Contale qué documento necesitás…"
            }
            disabled={thinking}
            data-testid="textarea-redactar-input"
          />
          <Button
            className="mt-3 w-full rounded-2xl"
            onClick={() => send(input)}
            disabled={thinking || !input.trim()}
            data-testid="button-send-redactar"
          >
            {thinking ? "Redactando…" : "Enviar"}
          </Button>
        </Card>

        <div ref={bottomRef} />
      </div>

      <BottomNav />
    </div>
  );
}
