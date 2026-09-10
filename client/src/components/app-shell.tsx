import { PropsWithChildren } from "react";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh app-gradient">
      <div className="app-container">{children}</div>
      <BottomNav />
    </div>
  );
}
