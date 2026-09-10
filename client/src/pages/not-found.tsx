import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-dvh app-gradient flex items-center justify-center px-4">
      <Card className="app-card w-full max-w-2xl rounded-3xl">
        <CardContent className="pt-6">
          <div className="flex mb-3 gap-2 items-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h1 className="font-serif text-2xl tracking-tight">Página no encontrada</h1>
          </div>

          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-404-desc">
            No encontramos esta pantalla.
          </p>

          <Button
            className="mt-5 w-full rounded-2xl"
            onClick={() => setLocation("/")}
            data-testid="button-go-home"
          >
            Ir al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
