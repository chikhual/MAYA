"use client";

import { useState } from "react";
import { getFechaCorteISO, getEtiquetaSemana, yaCerroEstaSemana } from "@/lib/semana";
import { createClient } from "@/lib/supabase/client";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";

export default function CheckinPage() {
  const [enviando, setEnviando] = useState<"verde" | "rojo" | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const supabase = createClient();
  const fechaCorte = getFechaCorteISO();
  const etiqueta = getEtiquetaSemana();
  const cerrado = yaCerroEstaSemana();

  async function registrar(trabajo: boolean) {
    setMensaje(null);
    setEnviando(trabajo ? "verde" : "rojo");

    try {
      // Obtener el primer proyecto del usuario (MVP: asumimos 1 proyecto por usuario o selección futura)
      const { data: proyectos } = await supabase
        .from("proyectos")
        .select("id")
        .limit(1);

      const proyectoId = proyectos?.[0]?.id;
      if (!proyectoId) {
        setMensaje({ tipo: "error", text: "No tienes un proyecto asignado. Contacta al administrador." });
        setEnviando(null);
        return;
      }

      const { error } = await supabase.from(process.env.NEXT_PUBLIC_TABLE_CHECK_SEMANALES || "check_semanales").upsert(
        {
          proyecto_id: proyectoId,
          completado: trabajo,
          fecha_corte: fechaCorte,
          comentario: null,
        },
        { onConflict: "proyecto_id,fecha_corte" }
      );

      if (error) throw error;
      setMensaje({
        tipo: "ok",
        text: trabajo
          ? "Registrado: Sí trabajaste esta semana."
          : "Registrado: No trabajaste esta semana.",
      });
    } catch (e) {
      setMensaje({
        tipo: "error",
        text: esErrorConexion(e) ? MSJ_CONEXION : (e instanceof Error ? e.message : "Error al guardar. Intenta de nuevo."),
      });
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-6 sm:p-8">
    <div className="space-y-8">
      <div>
        <h2 className="text-ui-2xl font-bold text-rotary-blue">
          Check-in rápido
        </h2>
        <p className="text-ui-lg text-slate-600 mt-1">
          {etiqueta}
        </p>
        {cerrado && (
          <p className="text-ui-base text-semaforo-rojo font-semibold mt-2">
            Esta semana ya cerró (viernes 4:00 PM). Tu respuesta se aplicará a la próxima semana.
          </p>
        )}
      </div>

      {mensaje && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-ui-lg font-semibold ${
            mensaje.tipo === "ok"
              ? "bg-semaforo-verde/15 text-semaforo-verde-oscuro"
              : "bg-semaforo-rojo/15 text-semaforo-rojo"
          }`}
        >
          {mensaje.text}
        </div>
      )}

      <div className="grid gap-6">
        <button
          type="button"
          onClick={() => registrar(true)}
          disabled={!!enviando}
          className="w-full min-h-[5rem] md:min-h-[6rem] rounded-2xl bg-semaforo-verde hover:bg-semaforo-verde-oscuro text-white font-bold text-ui-xl md:text-ui-2xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-rotary-gold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {enviando === "verde" ? (
            <span className="text-ui-xl">Cargando…</span>
          ) : (
            <>
              <span className="text-4xl" aria-hidden>✓</span>
              <span>SÍ TRABAJÉ ESTA SEMANA</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => registrar(false)}
          disabled={!!enviando}
          className="w-full min-h-[5rem] md:min-h-[6rem] rounded-2xl bg-semaforo-rojo hover:bg-semaforo-rojo-oscuro text-white font-bold text-ui-xl md:text-ui-2xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-rotary-gold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {enviando === "rojo" ? (
            <span className="text-ui-xl">Cargando…</span>
          ) : (
            <>
              <span className="text-4xl" aria-hidden>✕</span>
              <span>NO HE PODIDO TRABAJAR</span>
            </>
          )}
        </button>
      </div>

      <p className="text-ui-base text-slate-600">
        Solo necesitas tocar un botón. El sistema guarda tu respuesta para esta semana.
      </p>
    </div>
    </div>
  );
}
