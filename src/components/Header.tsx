"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const usuario = user?.email ?? user?.user_metadata?.nombre ?? "Usuario";

  return (
    <header className="h-12 bg-rotary-blue text-white flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded hover:bg-white/10"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <span className="text-sm font-medium tracking-tight">
        MONITOREO · Gestión de Proyectos
        </span>
      </div>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 py-2 px-3 rounded hover:bg-white/10 transition-colors text-sm font-medium"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <span>{usuario}</span>
          <svg
            className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] bg-white rounded-lg shadow-lg border border-slate-200 text-slate-800 z-50">
            <Link
              href="/perfil"
              onClick={() => setDropdownOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-slate-50"
            >
              Mi Perfil
            </Link>
            <Link
              href="/configuracion"
              onClick={() => setDropdownOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-slate-50"
            >
              Configuración
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-semaforo-rojo font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
