import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bug, CheckCircle2, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/api";
import type { ReportKind, ReportPriority } from "@/lib/types";

const PRIORITIES: ReportPriority[] = ["Baja", "Media", "Alta", "Urgente"];

export default function ReportarPage() {
  const [, setLocation] = useLocation();
  const store = useStore();

  const [kind, setKind] = useState<ReportKind | null>(null);
  const [step, setStep] = useState<"kind" | "form" | "done">("kind");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [pageContext, setPageContext] = useState("");
  const [priority, setPriority] = useState<ReportPriority>("Media");
  const [saving, setSaving] = useState(false);

  function chooseKind(k: ReportKind) {
    setKind(k);
    setStep("form");
  }

  function resetAll() {
    setKind(null);
    setStep("kind");
    setTitle("");
    setDescription("");
    setStepsToReproduce("");
    setExpectedBehavior("");
    setActualBehavior("");
    setPageContext("");
    setPriority("Media");
  }

  async function handleSubmit() {
    if (!kind || !title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      await store.createReport({
        kind,
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: kind === "bug" ? stepsToReproduce.trim() : "",
        expectedBehavior: kind === "bug" ? expectedBehavior.trim() : "",
        actualBehavior: kind === "bug" ? actualBehavior.trim() : "",
        pageContext: pageContext.trim(),
        priority,
      });
      setStep("done");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container" style={{ paddingBottom: 28 }}>
        <header className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setLocation("/app/configuracion")}
            data-testid="button-back-settings"
          >
            <ArrowLeft className="h-4 w-4" />
            Configuración
          </button>
        </header>

        <div className="mt-3">
          <h1 className="font-serif text-2xl tracking-tight" data-testid="text-reportar-title">
            Reportar un problema o mejora
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-reportar-subtitle">
            Contanos qué pasó o qué te gustaría que la app hiciera. Te avisamos cuando lo revisemos.
          </p>
        </div>

        {step === "kind" && (
          <section className="mt-5 grid gap-3">
            <Card
              className="app-card cursor-pointer rounded-3xl p-4 transition hover:bg-white/60"
              onClick={() => chooseKind("bug")}
              data-testid="button-kind-bug"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-500/10">
                  <Bug className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Encontré un error</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Algo no funciona como debería (un botón, un guardado, una pantalla)
                  </div>
                </div>
              </div>
            </Card>

            <Card
              className="app-card cursor-pointer rounded-3xl p-4 transition hover:bg-white/60"
              onClick={() => chooseKind("mejora")}
              data-testid="button-kind-mejora"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Tengo una idea o mejora</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Algo que ayudaría a trabajar mejor, aunque hoy no esté roto
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {step === "form" && kind && (
          <section className="mt-5">
            <Card className="app-card rounded-3xl p-4">
              <div className="flex items-center gap-2">
                {kind === "bug" ? (
                  <Bug className="h-4 w-4 text-red-500" />
                ) : (
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                )}
                <div className="text-sm font-semibold">
                  {kind === "bug" ? "Reportar un error" : "Proponer una mejora"}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {kind === "bug" ? "¿Qué título le pondrías al problema?" : "¿Cómo resumirías tu idea?"}
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={kind === "bug" ? "Ej: El botón Ver no abre el archivo" : "Ej: Poder filtrar clientes por fuero"}
                    data-testid="input-report-title"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {kind === "bug" ? "Contanos qué pasó" : "Contanos tu idea con más detalle"}
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-24 rounded-2xl"
                    placeholder={kind === "bug" ? "Describí el problema" : "Describí la mejora que te gustaría"}
                    data-testid="textarea-report-description"
                  />
                </div>

                {kind === "bug" && (
                  <>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        ¿Cómo lo reproducimos? (pasos)
                      </label>
                      <Textarea
                        value={stepsToReproduce}
                        onChange={(e) => setStepsToReproduce(e.target.value)}
                        className="min-h-20 rounded-2xl"
                        placeholder="1. Entrar a... 2. Hacer clic en... 3. ..."
                        data-testid="textarea-report-steps"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">¿Qué esperabas que pasara?</label>
                        <Textarea
                          value={expectedBehavior}
                          onChange={(e) => setExpectedBehavior(e.target.value)}
                          className="min-h-16 rounded-2xl"
                          data-testid="textarea-report-expected"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">¿Qué pasó en cambio?</label>
                        <Textarea
                          value={actualBehavior}
                          onChange={(e) => setActualBehavior(e.target.value)}
                          className="min-h-16 rounded-2xl"
                          data-testid="textarea-report-actual"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    ¿En qué parte de la app? (opcional)
                  </label>
                  <Input
                    value={pageContext}
                    onChange={(e) => setPageContext(e.target.value)}
                    placeholder="Ej: Expedientes > detalle de expediente"
                    data-testid="input-report-context"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Prioridad</label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as ReportPriority)}>
                    <SelectTrigger className="rounded-2xl" data-testid="select-report-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 rounded-2xl"
                    onClick={handleSubmit}
                    disabled={!canSubmit || saving}
                    data-testid="button-submit-report"
                  >
                    {saving ? "Enviando…" : "Enviar reporte"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => setStep("kind")}
                    disabled={saving}
                    data-testid="button-back-kind"
                  >
                    Atrás
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        )}

        {step === "done" && (
          <section className="mt-5">
            <Card className="app-card rounded-3xl p-6 text-center" data-testid="card-report-done">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="mt-3 font-serif text-xl tracking-tight">¡Gracias por avisarnos!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Recibimos tu reporte y lo vamos a revisar a la brevedad.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1 rounded-2xl" onClick={resetAll} data-testid="button-report-another">
                  Enviar otro reporte
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={() => setLocation("/app/configuracion")}
                  data-testid="button-done-settings"
                >
                  Volver a Configuración
                </Button>
              </div>
            </Card>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
