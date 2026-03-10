"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";

interface LogroItem {
  id: string;
  nombre_logro: string;
  descripcion: string | null;
  file_url: string;
  filename: string | null;
  es_imagen: boolean;
  mes: number;
  anio: number;
  perfil: { nombre: string; club: string | null } | null;
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function GaleriaPage() {
  const [logros, setLogros] = useState<LogroItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [anioFiltro, setAnioFiltro] = useState<number | "all">(new Date().getFullYear());
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      try {
        const q = supabase
          .from("logros_mensuales")
          .select(`
            id, nombre_logro, descripcion, file_url, filename, es_imagen, mes, anio,
            perfiles(nombre, club)
          `)
          .order("anio", { ascending: false })
          .order("mes", { ascending: false });

        const { data, error } = await q;
        if (cancelled) return;
        if (error) throw error;

        const items: LogroItem[] = (data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          nombre_logro: r.nombre_logro as string,
          descripcion: r.descripcion as string | null,
          file_url: r.file_url as string,
          filename: r.filename as string | null,
          es_imagen: r.es_imagen !== false,
          mes: r.mes as number,
          anio: r.anio as number,
          perfil: (r.perfiles as { nombre: string; club: string | null } | null) ?? null,
        }));

        setLogros(items);
      } catch (e) {
        if (cancelled) return;
        if (esErrorConexion(e)) setErrorConexion(true);
        setLogros([]);
      } finally {
        if (!cancelled) setCargando(false);
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, []);

  const filtrados = anioFiltro === "all"
    ? logros
    : logros.filter((l) => l.anio === anioFiltro);

  const años = [...new Set(logros.map((l) => l.anio))].sort((a, b) => b - a);

  return (
    <div className="rounded-xl bg-white shadow-sm border-2 border-rotary-blue/20 p-6 sm:p-8">
      <h2 className="text-[24px] font-bold text-rotary-blue mb-2">Galería del Club</h2>
      <p className="text-[20px] text-slate-600 mb-6">Logros compartidos por los compañeros del Club.</p>

      {errorConexion && (
        <div role="alert" className="p-6 rounded-xl bg-rotary-blue/5 border-2 border-rotary-blue text-rotary-blue text-center mb-6">
          <p className="text-[22px] font-semibold">{MSJ_CONEXION}</p>
        </div>
      )}

      {cargando ? (
        <p className="text-[20px] text-slate-600 text-center py-12">Cargando galería…</p>
      ) : (
        <>
          {años.length > 0 && (
            <div className="mb-6">
              <label className="text-[20px] font-semibold text-slate-800 mr-3">Año:</label>
              <select
                value={anioFiltro}
                onChange={(e) => setAnioFiltro(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="min-h-touch rounded-lg border-2 border-rotary-blue/30 px-4 text-[20px] py-2"
              >
                <option value="all">Todos</option>
                {años.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {filtrados.length === 0 ? (
            <p className="text-[20px] text-slate-600 text-center py-12">Aún no hay logros compartidos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtrados.map((logro) => (
                <article
                  key={logro.id}
                  className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {logro.es_imagen ? (
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(logro.file_url)}
                      className="block w-full aspect-square overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-rotary-blue"
                    >
                      <img
                        src={logro.file_url}
                        alt={logro.nombre_logro}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ) : (
                    <a
                      href={logro.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center w-full aspect-square bg-rotary-blue/5 p-4"
                    >
                      <svg className="w-20 h-20 text-rotary-blue mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[18px] font-semibold text-rotary-blue text-center truncate max-w-full px-2">
                        {logro.filename ?? "Documento"}
                      </span>
                      <span className="text-[16px] text-slate-600 mt-1">Abrir PDF</span>
                    </a>
                  )}
                  <div className="p-4">
                    <p className="text-[20px] font-bold text-slate-900">{logro.nombre_logro}</p>
                    {logro.perfil && (
                      <p className="text-[18px] text-slate-600">{logro.perfil.nombre}</p>
                    )}
                    {logro.perfil?.club && (
                      <p className="text-[16px] text-slate-500">{logro.perfil.club}</p>
                    )}
                    <p className="text-[16px] text-slate-500 mt-1">
                      {MESES[logro.mes - 1]} {logro.anio}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ampliar imagen"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Ampliación"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
