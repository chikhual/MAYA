"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";

type Evidencia = { id: string; file_url: string; fecha_subida: string };
type PerfilConFoto = { id: string; nombre: string; club: string; foto_url: string | null };

export default function DirectorEvidenciasPage() {
  const params = useParams();
  const id = params.id as string;
  const [perfil, setPerfil] = useState<PerfilConFoto | null>(null);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function cargar() {
      try {
        const { data: p, error: ePerfil } = await supabase
          .from("perfiles")
          .select("id, nombre, club, foto_url")
          .eq("id", id)
          .single();
        if (ePerfil) throw ePerfil;
        setPerfil(p);

        const { data: proyectos } = await supabase
          .from("proyectos")
          .select("id")
          .eq("director_id", id);
        const ids = (proyectos ?? []).map((x) => x.id);
        if (ids.length > 0) {
          const { data: ev } = await supabase
            .from("evidencias")
            .select("id, file_url, fecha_subida")
            .in("proyecto_id", ids)
            .order("fecha_subida", { ascending: false });
          setEvidencias(ev ?? []);
        }
      } catch (e) {
        setError(esErrorConexion(e) ? MSJ_CONEXION : (e instanceof Error ? e.message : "Error al cargar"));
      } finally {
        setCargando(false);
      }
    }
    if (id) cargar();
  }, [id]);

  if (cargando) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-8">
        <p className="text-[20px] text-slate-600 text-center">Cargando…</p>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-8">
        <p className="text-[20px] text-semaforo-rojo font-semibold">{error ?? "Director no encontrado"}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-[20px] text-rotary-blue font-semibold hover:underline">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-6 sm:p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-rotary-blue/10 border-2 border-slate-200 flex items-center justify-center">
          {perfil.foto_url ? (
            <img src={perfil.foto_url} alt={perfil.nombre} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-rotary-blue">{perfil.nombre.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-slate-900">{perfil.nombre}</h2>
          {perfil.club && <p className="text-[20px] text-slate-600">{perfil.club}</p>}
        </div>
      </div>

      <h3 className="text-[22px] font-semibold text-rotary-blue mb-4">Evidencias</h3>
      {evidencias.length === 0 ? (
        <p className="text-[20px] text-slate-500">No hay evidencias subidas.</p>
      ) : (
        <ul className="space-y-3">
          {evidencias.map((ev) => (
            <li key={ev.id}>
              <a
                href={ev.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-[20px] font-medium text-rotary-blue"
              >
                <span>📄</span>
                <span>Evidencia {new Date(ev.fecha_subida).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/dashboard"
        className="mt-6 inline-block text-[20px] text-rotary-blue font-semibold hover:underline"
      >
        ← Volver al Dashboard
      </Link>
    </div>
  );
}
