"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      const esConexion = esErrorConexion(e);
      setError(esConexion ? MSJ_CONEXION : (e instanceof Error ? e.message : "Error al iniciar sesión"));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-rotary-blue text-center mb-2">
          MONITOREO
        </h1>
        <p className="text-[18px] text-slate-700 text-center mb-8">
          Club Rotario · Inicia sesión
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="block text-[18px] font-semibold text-slate-800 mb-2">
              Correo electrónico
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={cargando}
              className="w-full min-h-[3.5rem] rounded-lg border border-slate-300 px-4 text-[18px] disabled:opacity-70"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="block text-[18px] font-semibold text-slate-800 mb-2">
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={cargando}
              className="w-full min-h-[3.5rem] rounded-lg border border-slate-300 px-4 text-[18px] disabled:opacity-70"
              autoComplete="current-password"
            />
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recordar}
              onChange={(e) => setRecordar(e.target.checked)}
              disabled={cargando}
              className="w-6 h-6 rounded border-slate-300 text-rotary-blue focus:ring-rotary-blue focus:ring-2"
            />
            <span className="text-[18px] font-medium text-slate-800">
              Recordar mi acceso en este equipo
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-semaforo-rojo/10 text-semaforo-rojo text-[18px] font-semibold"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full min-h-[4rem] rounded-xl bg-rotary-blue hover:bg-rotary-blue-dark text-white font-semibold text-[20px] disabled:opacity-70 flex items-center justify-center"
          >
            {cargando ? "Cargando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
