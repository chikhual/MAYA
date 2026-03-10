"use client";

import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 1024px: tablets en portrait muestran hamburger; landscape muestran sidebar fijo
    const mq = window.matchMedia("(max-width: 1024px)");
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  return (
    <>
      <Header onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={!isMobile || sidebarOpen} onClose={isMobile ? () => setSidebarOpen(false) : undefined} />
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          />
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </>
  );
}
