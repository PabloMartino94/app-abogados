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

const strongPassword = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos 1 mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos 1 número");

const schema = z
  .object({
    firmName: z.string().min(2, "Ingresá el nombre del estudio"),
    leadLawyer: z.string().min(2, "Ingresá el nombre del abogado principal"),
    email: z.string().email("Ingresá un email válido"),
    phone: z.string().min(6, "Ingresá un teléfono válido"),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export default function CreateAccountPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firmName: "",
      leadLawyer: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  async function onSubmit(values: Values) {
    setLoading(true);
    setError(null);
    try {
      await signup({
        firmName: values.firmName,
        name: values.leadLawyer,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      setLocation("/app");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
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
          <h1 className="mt-4 font-serif text-3xl tracking-tight" data-testid="text-create-account-title">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-create-account-subtitle">
            Configurá tu estudio en menos de 2 minutos.
          </p>
        </header>

        <Card className="app-card rounded-3xl p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" data-testid="text-signup-error">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="firmName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del estudio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Estudio Jurídico..."
                        autoComplete="organization"
                        data-testid="input-firm-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadLawyer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abogado principal</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nombre y apellido"
                        autoComplete="name"
                        data-testid="input-lead-lawyer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="nombre@estudio.com"
                        inputMode="email"
                        autoComplete="email"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="11 5555 5555"
                        inputMode="numeric"
                        autoComplete="tel"
                        data-testid="input-phone"
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
                        autoComplete="new-password"
                        placeholder="Mín. 8, 1 mayúscula, 1 número"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repetí la contraseña"
                        data-testid="input-confirm-password"
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
                data-testid="button-submit-create-account"
              >
                {loading ? "Creando…" : "Crear cuenta"}
              </Button>
            </form>
          </Form>
        </Card>

        <div className="mt-6 text-center">
          <button
            className="text-sm font-medium text-primary"
            onClick={() => setLocation("/login")}
            data-testid="link-go-login"
          >
            ¿Ya tenés cuenta? Iniciar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
