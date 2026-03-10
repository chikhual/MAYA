"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFechaCorteISO, getEtiquetaSemana, yaCerroEstaSemana } from "@/lib/semana";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";
import type { Perfil, Proyecto } from "@/types/supabase";

type DirectorEstado = {
  perfil: Perfil;
  proyecto: Proyecto;
  estado: "verde" | "rojo";
};

export default function HomePage() {
  const [enviando, setEnviando] = useState<"verde" | "rojo" | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const [companeros, setCompaneros] = useState<DirectorEstado[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);
  const [sinProyectos, setSinProyectos] = useState<boolean | null>(null);
  const supabase = createClient();
  const fechaCorte = getFechaCorteISO();
  const etiqueta = getEtiquetaSemana();
  const cerrado = yaCerroEstaSemana();

  async function registrar(trabajo: boolean) {
    setMensaje(null);
    setErrorConexion(false);
    setEnviando(trabajo ? "verde" : "rojo");
    try {
      const { data: proyectos, error: errProyectos } = await supabase
        .from("proyectos")
        .select("id")
        .limit(1);
      if (errProyectos) throw errProyectos;
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
        text: trabajo ? "Registrado: Sí trabajaste esta semana." : "Registrado: No trabajaste esta semana.",
      });
      cargarCompaneros();
    } catch (e) {
      const esConexion = esErrorConexion(e);
      setErrorConexion(esConexion);
      setMensaje(esConexion ? null : {
        tipo: "error",
        text: e instanceof Error ? e.message : "Error al guardar. Intenta de nuevo.",
      });
    } finally {
      setEnviando(null);
    }
  }

  async function cargarCompaneros() {
    setErrorConexion(false);
    setCargandoLista(true);
    try {
      const tablaCheck = process.env.NEXT_PUBLIC_TABLE_CHECK_SEMANALES || "check_semanales";
      const { data: proyectos, error: eProyectos } = await supabase
        .from("proyectos")
        .select(`
          id,
          nombre_proyecto,
          director_id,
          perfiles ( id, nombre, mote, club, rol, foto_url )
        `);
      if (eProyectos) throw eProyectos;

      const { data: checks, error: eChecks } = await supabase
        .from(tablaCheck)
        .select("proyecto_id, completado")
        .eq("fecha_corte", fechaCorte);

      if (eChecks) {
        setCompaneros([]);
        setSinProyectos((proyectos?.length ?? 0) === 0);
        return;
      }

      const checksMap = new Map<string, boolean>();
      (checks || []).forEach((c: { proyecto_id: string; completado: boolean }) =>
        checksMap.set(c.proyecto_id, c.completado)
      );

      const list: DirectorEstado[] = [];
      const perfilesMap = new Map<string, Perfil>();

      for (const p of proyectos || []) {
        const row = p as unknown as {
          id: string;
          director_id: string;
          nombre_proyecto: string;
          perfiles: { id: string; nombre: string; mote?: string | null; club: string; rol: string; foto_url: string | null } | { id: string; nombre: string; mote?: string | null; club: string; rol: string; foto_url: string | null }[];
        };
        const raw = row.perfiles;
        const perfil = Array.isArray(raw) ? raw[0] : raw;
        if (!perfil) continue;
        if (!perfilesMap.has(perfil.id))
          perfilesMap.set(perfil.id, { ...perfil, mote: perfil.mote, user_id: null, created_at: "", updated_at: "" } as Perfil);

        const proyecto = {
          id: row.id,
          director_id: row.director_id,
          nombre_proyecto: row.nombre_proyecto,
          descripcion: null,
          meta_mensual: null,
          created_at: "",
          updated_at: "",
        } as Proyecto;

        const completado = checksMap.get(row.id);
        const estado: "verde" | "rojo" = completado === true ? "verde" : "rojo";

        list.push({
          perfil: perfilesMap.get(perfil.id)!,
          proyecto,
          estado,
        });
      }
      setCompaneros(list);
      // Sin proyectos en el sistema → mostrar bienvenida a nuevo director
      setSinProyectos((proyectos?.length ?? 0) === 0);
    } catch (e) {
      setCompaneros([]);
      if (esErrorConexion(e)) {
        setErrorConexion(true);
        setSinProyectos(false);
      }
    } finally {
      setCargandoLista(false);
    }
  }

  useEffect(() => {
    cargarCompaneros();
  }, [fechaCorte]);

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-6 sm:p-8">
      {/* Error de conexión prominente */}
      {errorConexion && (
        <div
          role="alert"
          className="mb-6 p-6 rounded-xl bg-rotary-blue/5 border-2 border-rotary-blue text-rotary-blue text-center"
        >
          <p className="text-[22px] font-semibold">{MSJ_CONEXION}</p>
        </div>
      )}

      {/* Bienvenida cuando no hay proyectos (sistema vacío o director sin asignación con RLS) */}
      {sinProyectos === true && !errorConexion && (
        <div className="mb-6 p-6 rounded-xl bg-rotary-gold/15 border border-rotary-gold/50 text-slate-800">
          <p className="text-[20px] font-semibold">Bienvenido a MONITOREO</p>
          <p className="text-[18px] mt-2">
            Aún no hay proyectos asignados a tu cuenta. Contacta al administrador del club para que te asignen uno y puedas registrar tu check-in semanal.
          </p>
        </div>
      )}

      {/* Título y semana */}
      <div className="border-b border-slate-100 pb-4 mb-6">
        <p className="text-[18px] text-slate-600">{etiqueta}</p>
        {cerrado && (
          <p className="text-[18px] text-semaforo-rojo font-semibold mt-1">
            Esta semana ya cerró (viernes 4:00 PM). Tu respuesta aplicará a la próxima.
          </p>
        )}
      </div>

      {/* Botones principales */}
      <section className="grid grid-cols-1 gap-4 sm:gap-6 mb-8">
        <button
          type="button"
          onClick={() => registrar(true)}
          disabled={!!enviando || sinProyectos === true}
          className="w-full min-h-[5rem] sm:min-h-[5.5rem] rounded-xl bg-semaforo-verde hover:bg-semaforo-verde-oscuro text-white font-semibold text-[22px] shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-rotary-gold disabled:opacity-70 flex items-center justify-center gap-3"
        >
          {enviando === "verde" ? (
            <span className="text-[20px]">Cargando…</span>
          ) : (
            <>
              <span className="text-2xl" aria-hidden>✓</span>
              <span>SÍ, HE TRABAJADO ESTA SEMANA</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => registrar(false)}
          disabled={!!enviando || sinProyectos === true}
          className="w-full min-h-[5rem] sm:min-h-[5.5rem] rounded-xl bg-semaforo-rojo hover:bg-semaforo-rojo-oscuro text-white font-semibold text-[22px] shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-rotary-gold disabled:opacity-70 flex items-center justify-center gap-3"
        >
          {enviando === "rojo" ? (
            <span className="text-[20px]">Cargando…</span>
          ) : (
            <>
              <span className="text-2xl" aria-hidden>✕</span>
              <span>NO HE PODIDO TRABAJAR</span>
            </>
          )}
        </button>
      </section>

      {mensaje && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded-xl text-[18px] font-semibold ${
            mensaje.tipo === "ok"
              ? "bg-semaforo-verde/10 text-semaforo-verde-oscuro border border-semaforo-verde/30"
              : "bg-semaforo-rojo/10 text-semaforo-rojo border border-semaforo-rojo/30"
          }`}
        >
          {mensaje.text}
        </div>
      )}

      {/* Lista de compañeros */}
      <section className="border-t border-slate-100 pt-6">
        <h2 className="text-[18px] font-semibold text-rotary-blue mb-4">
          Tus compañeros esta semana
        </h2>
        {cargandoLista ? (
          <p className="text-[18px] text-slate-600">Cargando…</p>
        ) : companeros.length === 0 ? (
          <p className="text-[18px] text-slate-600">Aún no hay directores en el sistema.</p>
        ) : (
          <ul className="space-y-3" role="list">
            {companeros.map(({ perfil, estado }) => (
              <li
                key={perfil.id}
                className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0"
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-200"
                  style={{
                    backgroundColor: estado === "verde" ? "#22c55e" : "#dc2626",
                  }}
                  aria-label={estado === "verde" ? "Ya hizo check esta semana" : "Pendiente"}
                />
                <span className="text-[24px] font-semibold text-rotary-blue">
                  {(perfil as { mote?: string | null }).mote?.trim() || perfil.nombre}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 h-1 w-20 rounded-full bg-rotary-gold" aria-hidden />
    </div>
  );
}
