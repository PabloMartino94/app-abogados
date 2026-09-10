import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  async function onSubmit(values: Values) {
    setLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
      setLocation("/app");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh app-gradient">
      <div className="app-container" style={{ paddingBottom: 40, paddingTop: 40, minHeight: "100dvh" }}>
        <header className="mb-6">
          <button
            className="text-sm font-medium text-primary"
            onClick={() => setLocation("/")}
            data-testid="button-back-welcome"
          >
            Volver
          </button>
          <h1 className="mt-4 font-serif text-3xl tracking-tight" data-testid="text-login-title">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-login-subtitle">
            Accedé a tu estudio.
          </p>
        </header>

        <Card className="app-card rounded-3xl p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" data-testid="text-login-error">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="email"
                        inputMode="email"
                        placeholder="nombre@estudio.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-1 w-full rounded-2xl"
                disabled={loading || !form.formState.isValid}
                data-testid="button-submit-login"
              >
                {loading ? "Ingresando…" : "Entrar"}
              </Button>
            </form>
          </Form>
        </Card>

        <div className="mt-6 text-center">
          <button
            className="text-sm font-medium text-primary"
            onClick={() => setLocation("/crear-cuenta")}
            data-testid="link-go-create-account"
          >
            ¿No tenés cuenta? Crear cuenta
          </button>
        </div>
      </div>
    </main>
  );
}
