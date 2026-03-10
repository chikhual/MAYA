"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";

export function LayoutSwitcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
