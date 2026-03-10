"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  { href: "/", label: "Inicio", icon: "🏠" },
  {
    label: "Editor",
    icon: "✏️",
    children: [
      { href: "/", label: "Proyectos" },
      { href: "/dashboard", label: "Semáforos" },
      { href: "/evidencias", label: "Datos Históricos" },
      { href: "/editor/agenda", label: "Agenda de Logros" },
      { href: "/galeria", label: "Galería del Club" },
    ],
  },
  {
    label: "Administrador",
    icon: "⚙️",
    children: [
      { href: "/admin/usuarios", label: "Usuarios" },
      { href: "/admin/fichas-bienvenida", label: "Fichas de Bienvenida" },
      { href: "/admin/proyectos-globales", label: "Proyectos Globales" },
      { href: "/admin/indicadores", label: "Indicadores" },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isEditorActive = ["/", "/dashboard", "/evidencias", "/editor/agenda", "/galeria"].includes(pathname);
  const isAdminActive = pathname.startsWith("/admin");
  const [editorOpen, setEditorOpen] = useState(isEditorActive);
  const [adminOpen, setAdminOpen] = useState(isAdminActive);
  const [perfil, setPerfil] = useState<{ nombre: string; mote?: string | null; foto_url: string | null } | null>(null);
  const [perfilCargado, setPerfilCargado] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function cargar() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPerfil({ nombre: "Usuario", mote: null, foto_url: null });
          setPerfilCargado(true);
          return;
        }
        const { data, error } = await supabase
          .from("perfiles")
          .select("nombre, mote, foto_url")
          .eq("user_id", user.id)
          .limit(1);
        const p = error ? null : data?.[0];
        setPerfil(p ? { nombre: p.nombre, mote: p.mote, foto_url: p.foto_url } : { nombre: user.email?.split("@")[0] ?? "Usuario", foto_url: null });
      } catch {
        setPerfil({ nombre: "Usuario", mote: null, foto_url: null });
      } finally {
        setPerfilCargado(true);
      }
    }
    cargar();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => cargar());
    const onPerfilUpdated = () => cargar();
    window.addEventListener("perfil-updated", onPerfilUpdated);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("perfil-updated", onPerfilUpdated);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = () => onClose?.();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [open, onClose]);

  return (
    <aside
      className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-700"
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {/* Logo Rotary Campestre Aguascalientes */}
      <div className="p-4 border-b border-slate-100">
        <img
          src="/logo-rotary.png"
          alt="Rotary Campestre Aguascalientes"
          className="h-12 w-auto max-w-full object-contain"
        />
      </div>

      {/* Usuario - Clic para ir a Mi Perfil */}
      <Link
        href="/perfil"
        onClick={onClose}
        className="p-4 border-b border-slate-100 block hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-rotary-blue/10 flex items-center justify-center text-rotary-blue font-semibold text-lg flex-shrink-0">
            {perfil?.foto_url ? (
              <img src={perfil.foto_url} alt="" className="w-full h-full object-cover" />
            ) : (
              ((perfil?.mote?.trim() || perfil?.nombre) ?? "U").slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 truncate text-[24px]">{perfilCargado ? (perfil?.mote?.trim() || perfil?.nombre || "Usuario") : "Cargando…"}</p>
            <p className="text-xs text-slate-500">Mi Perfil</p>
          </div>
        </div>
      </Link>

      {/* Navegación */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {menuItems.map((item) =>
            "href" in item ? (
              <li key={(item as { href: string }).href}>
                <Link
                  href={(item as { href: string }).href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === (item as { href: string }).href
                      ? "bg-rotary-blue text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ) : (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() =>
                    item.label === "Editor"
                      ? setEditorOpen(!editorOpen)
                      : setAdminOpen(!adminOpen)
                  }
                  className={`flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    (item.label === "Editor" && editorOpen) ||
                    (item.label === "Administrador" && adminOpen)
                      ? "bg-slate-100 text-rotary-blue"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      (item.label === "Editor" && editorOpen) ||
                      (item.label === "Administrador" && adminOpen)
                        ? "rotate-180"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {(item.label === "Editor" ? editorOpen : adminOpen) && (
                  <ul className="mt-0.5 ml-4 pl-4 border-l border-slate-200 space-y-0.5">
                    {item.children!.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className={`block py-2 text-sm font-medium transition-colors ${
                            pathname === child.href
                              ? "text-rotary-blue font-semibold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          )}
        </ul>
      </nav>
    </aside>
  );
}
