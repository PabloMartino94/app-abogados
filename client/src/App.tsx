import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import { RequireAuth } from "@/components/require-auth";

import WelcomePage from "@/pages/welcome";
import CreateAccountPage from "@/pages/create-account";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/client-detail";
import CasesPage from "@/pages/cases";
import CaseDetailPage from "@/pages/case-detail";
import AgendaPage from "@/pages/agenda";
import TemplatesPage from "@/pages/templates";
import RedactarPage from "@/pages/redactar";
import FilesPage from "@/pages/files";
import SettingsPage from "@/pages/settings";
import ReportarPage from "@/pages/reportar";
import ReportesPage from "@/pages/reportes";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <RequireAuth>
      <Component />
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={WelcomePage} />
      <Route path="/crear-cuenta" component={CreateAccountPage} />
      <Route path="/login" component={LoginPage} />

      <Route path="/app">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/app/clientes">{() => <ProtectedRoute component={ClientsPage} />}</Route>
      <Route path="/app/clientes/:id">{(params) => <RequireAuth><ClientDetailPage /></RequireAuth>}</Route>
      <Route path="/app/expedientes">{() => <ProtectedRoute component={CasesPage} />}</Route>
      <Route path="/app/expedientes/:id">{(params) => <RequireAuth><CaseDetailPage /></RequireAuth>}</Route>
      <Route path="/app/agenda">{() => <ProtectedRoute component={AgendaPage} />}</Route>
      <Route path="/app/plantillas">{() => <ProtectedRoute component={TemplatesPage} />}</Route>
      <Route path="/app/redactar">{() => <ProtectedRoute component={RedactarPage} />}</Route>
      <Route path="/app/archivos">{() => <ProtectedRoute component={FilesPage} />}</Route>
      <Route path="/app/configuracion">{() => <ProtectedRoute component={SettingsPage} />}</Route>
      <Route path="/app/reportar">{() => <ProtectedRoute component={ReportarPage} />}</Route>
      <Route path="/app/reportes">{() => <ProtectedRoute component={ReportesPage} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
