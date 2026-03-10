"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFechaCorteISO, getEtiquetaSemana } from "@/lib/semana";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";
import { FichaDirector } from "@/components/FichaDirector";
import { BannerCierreSemanal } from "@/components/BannerCierreSemanal";
import type { Perfil, Proyecto } from "@/types/supabase";

type EvidenciaResumida = { id: string; file_url: string; fecha_subida: string };

type DirectorEstado = {
  perfil: Perfil & { biografia?: string | null };
  proyecto: Proyecto;
  estado: "verde" | "rojo";
  evidencias: EvidenciaResumida[];
};

export default function DashboardPage() {
  const [items, setItems] = useState<DirectorEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const fechaCorte = getFechaCorteISO();
  const etiqueta = getEtiquetaSemana();

  useEffect(() => {
    async function cargar() {
      try {
        const { data: proyectos, error: eProyectos } = await supabase
          .from("proyectos")
          .select(`
            id,
            nombre_proyecto,
            director_id,
            perfiles ( id, nombre, mote, club, rol, foto_url, biografia )
          `);

        if (eProyectos) throw eProyectos;

        const { data: checks } = await supabase
          .from(process.env.NEXT_PUBLIC_TABLE_CHECK_SEMANALES || "check_semanales")
          .select("id, proyecto_id, completado, fecha_corte")
          .eq("fecha_corte", fechaCorte);

        const { data: allEvidencias } = await supabase
          .from("evidencias")
          .select("id, proyecto_id, file_url, fecha_subida")
          .order("fecha_subida", { ascending: false });

        const checksMap = new Map<string, { proyecto_id: string; completado: boolean } | null>();
        (checks || []).forEach((c: { proyecto_id: string; completado: boolean }) =>
          checksMap.set(c.proyecto_id, c)
        );

        const evidenciasPorProyecto = new Map<string, EvidenciaResumida[]>();
        (allEvidencias ?? []).forEach((ev: { id: string; proyecto_id: string; file_url: string; fecha_subida: string }) => {
          const list = evidenciasPorProyecto.get(ev.proyecto_id) ?? [];
          if (list.length < 2) list.push({ id: ev.id, file_url: ev.file_url, fecha_subida: ev.fecha_subida });
          evidenciasPorProyecto.set(ev.proyecto_id, list);
        });

        const list: DirectorEstado[] = [];
        const perfilesMap = new Map<string, Perfil & { biografia?: string | null }>();

        for (const p of proyectos || []) {
          const row = p as unknown as { id: string; director_id: string; nombre_proyecto: string; perfiles: { id: string; nombre: string; mote?: string | null; club: string; rol: string; foto_url: string | null; biografia?: string | null } | { id: string; nombre: string; mote?: string | null; club: string; rol: string; foto_url: string | null; biografia?: string | null }[] };
          const raw = row.perfiles;
          const perfil = Array.isArray(raw) ? raw[0] : raw;
          if (!perfil) continue;
          if (!perfilesMap.has(perfil.id)) perfilesMap.set(perfil.id, { ...perfil, user_id: null, created_at: "", updated_at: "" } as Perfil & { biografia?: string | null });

          const proyecto = {
            id: p.id,
            director_id: p.director_id,
            nombre_proyecto: p.nombre_proyecto,
            descripcion: null,
            meta_mensual: null,
            created_at: "",
            updated_at: "",
          } as Proyecto;

          const check = checksMap.get(p.id) ?? null;
          const estado: "verde" | "rojo" =
            check !== null ? (check.completado ? "verde" : "rojo") : "rojo";

          const evidencias = evidenciasPorProyecto.get(p.id) ?? [];

          list.push({
            perfil: perfilesMap.get(perfil.id)!,
            proyecto,
            estado,
            evidencias,
          });
        }

        setItems(list);
      } catch (e) {
        setError(esErrorConexion(e) ? MSJ_CONEXION : (e instanceof Error ? e.message : "Error al cargar"));
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [fechaCorte]);

  if (cargando) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-8">
        <p className="text-slate-600 text-center">Cargando semáforos…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-8">
        <div
          role="alert"
          className="rounded-xl p-6 text-center border-2 border-rotary-blue/30 bg-rotary-blue/5"
        >
          <p className="text-[22px] font-semibold text-rotary-blue">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-6 sm:p-8">
    <div className="space-y-8">
      <BannerCierreSemanal />
      <div>
        <h2 className="text-ui-2xl font-bold text-rotary-blue">
          Semáforos del Club
        </h2>
        <p className="text-ui-lg text-slate-700 mt-1">
          {etiqueta}
        </p>
      </div>

      <ul className="space-y-4" role="list">
        {items.length === 0 ? (
          <li className="rounded-xl border border-slate-200 bg-white p-6 text-ui-lg text-slate-500 text-center">
            Aún no hay directores o proyectos. Añade perfiles y proyectos en Supabase.
          </li>
        ) : (
          items.map(({ perfil, proyecto, estado, evidencias }) => (
            <FichaDirector
              key={proyecto.id}
              perfil={perfil}
              proyecto={proyecto}
              estado={estado}
              evidencias={evidencias}
            />
          ))
        )}
      </ul>
    </div>
    </div>
  );
}
