import { PropsWithChildren } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center app-gradient">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
