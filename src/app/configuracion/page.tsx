"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMAIL_DEFAULT = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "" : "";

export default function ConfiguracionPage() {
  const [email, setEmail] = useState(EMAIL_DEFAULT);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok?: boolean; error?: string } | null>(null);

  async function enviarPrueba() {
    setResultado(null);
    setEnviando(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("test-email", {
        body: email.trim() ? { email: email.trim() } : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResultado({ ok: true });
    } catch (e) {
      setResultado({ error: e instanceof Error ? e.message : "Error al enviar" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-6 sm:p-8">
      <h2 className="text-[24px] font-bold text-rotary-blue mb-6">Configuración</h2>

      <section className="rounded-xl border-2 border-rotary-blue/20 bg-rotary-blue/5 p-6 max-w-xl">
        <h3 className="text-[20px] font-semibold text-rotary-blue mb-2">Prueba de correo</h3>
        <p className="text-[18px] text-slate-600 mb-4">
          Envía un correo de prueba para verificar que las notificaciones de MAYA funcionan. Si no ingresas un correo, se usará el del administrador (ADMIN_EMAIL).
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex-1 min-w-[200px]">
            <span className="block text-[18px] font-medium text-slate-700 mb-1">Correo de destino</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full min-h-touch rounded-lg border-2 border-slate-300 px-4 text-[20px]"
            />
          </label>
          <button
            type="button"
            onClick={enviarPrueba}
            disabled={enviando}
            className="min-h-touch px-8 rounded-xl bg-rotary-blue hover:bg-rotary-blue-dark text-white font-bold text-[20px] disabled:opacity-70"
          >
            {enviando ? "Enviando…" : "Enviar correo de prueba"}
          </button>
        </div>
        {resultado && (
          <div
            role="alert"
            className={`mt-4 p-4 rounded-xl text-[18px] font-semibold ${
              resultado.ok ? "bg-semaforo-verde/20 text-semaforo-verde-oscuro" : "bg-semaforo-rojo/10 text-semaforo-rojo"
            }`}
          >
            {resultado.ok ? "✓ Correo enviado. Revisa tu bandeja (y spam)." : resultado.error}
          </div>
        )}
      </section>
    </div>
  );
}
