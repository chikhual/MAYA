"use client";

import Link from "next/link";
import type { Perfil, Proyecto } from "@/types/supabase";

type EvidenciaResumida = { id: string; file_url: string; fecha_subida: string };

type Props = {
  perfil: Perfil & { biografia?: string | null; mote?: string | null };
  proyecto: Proyecto;
  estado: "verde" | "rojo";
  evidencias: EvidenciaResumida[];
};

export function FichaDirector({ perfil, proyecto, estado, evidencias }: Props) {
  const hitos = evidencias.slice(0, 2);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Foto circular a la izquierda */}
        <div className="relative flex-shrink-0">
          <div
            className="w-[100px] h-[100px] rounded-full overflow-hidden bg-rotary-blue/10 flex items-center justify-center ring-4"
            style={{ boxShadow: `0 0 0 4px ${estado === "verde" ? "#22c55e" : "#dc2626"}` }}
          >
            {(perfil as { foto_url?: string | null }).foto_url ? (
              <img
                src={(perfil as { foto_url?: string }).foto_url!}
                alt={perfil.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[32px] font-bold text-rotary-blue">
                {((perfil as { mote?: string | null }).mote?.trim() || perfil.nombre).slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full border-2 border-white"
            style={{ backgroundColor: estado === "verde" ? "#22c55e" : "#dc2626" }}
            aria-label={estado === "verde" ? "Cumplió" : "Pendiente"}
            title={estado === "verde" ? "Cumplió" : "Pendiente"}
          />
        </div>

        {/* Nombre/mote, Club y resumen a la derecha */}
        <div className="flex-1 min-w-0">
          <p className="text-[26px] font-bold text-rotary-blue">
            {(perfil as { mote?: string | null }).mote?.trim() || perfil.nombre}
          </p>
          {perfil.club && <p className="text-[20px] text-slate-600 mt-0.5">{perfil.club}</p>}

          {/* Resumen visual últimos 2 hitos */}
          <div className="mt-4 flex flex-wrap gap-2">
            {hitos.length === 0 ? (
              <span className="text-[18px] text-slate-500">Sin hitos registrados</span>
            ) : (
              hitos.map((ev) => (
                <a
                  key={ev.id}
                  href={ev.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rotary-gold/20 text-rotary-blue font-semibold text-[18px] hover:bg-rotary-gold/30 transition-colors"
                >
                  <span>✓</span>
                  <span>{new Date(ev.fecha_subida).toLocaleDateString("es-ES", { month: "short", year: "2-digit" })}</span>
                </a>
              ))
            )}
          </div>

          <Link
            href={`/director/${perfil.id}`}
            className="mt-4 inline-flex items-center justify-center min-h-[3rem] px-6 rounded-lg bg-rotary-blue hover:bg-rotary-blue-dark text-white font-semibold text-[20px]"
          >
            Ver Evidencias
          </Link>
        </div>
      </div>
    </li>
  );
}
