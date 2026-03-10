"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBucketEvidencias, pathEvidencia, ACCEPT_EVIDENCIAS, MAX_SIZE_MB } from "@/lib/supabase/storage";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";

export default function EvidenciasPage() {
  const [proyectos, setProyectos] = useState<{ id: string; nombre_proyecto: string }[]>([]);
  const [proyectoId, setProyectoId] = useState<string>("");
  const [subiendo, setSubiendo] = useState(false);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const [errorConexion, setErrorConexion] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      try {
        const { data, error } = await supabase.from("proyectos").select("id, nombre_proyecto");
        if (cancelled) return;
        if (error) throw error;
        setProyectos(data || []);
      } catch (e) {
        if (cancelled) return;
        setProyectos([]);
        if (esErrorConexion(e)) setErrorConexion(true);
      } finally {
        if (!cancelled) setCargandoProyectos(false);
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, []);

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setMensaje(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!proyectoId) {
      setMensaje({ tipo: "error", text: "Elige un proyecto." });
      return;
    }
    const mb = file.size / (1024 * 1024);
    if (mb > MAX_SIZE_MB) {
      setMensaje({ tipo: "error", text: `El archivo no debe superar ${MAX_SIZE_MB} MB.` });
      return;
    }
    setSubiendo(true);
    try {
      const path = pathEvidencia(proyectoId, file.name);
      const { data, error } = await supabase.storage
        .from(getBucketEvidencias())
        .upload(path, file, { upsert: false });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from(getBucketEvidencias()).getPublicUrl(data.path);
      await supabase.from("evidencias").insert({
        proyecto_id: proyectoId,
        file_url: urlData.publicUrl,
      });
      setMensaje({ tipo: "ok", text: "Evidencia subida correctamente." });
    } catch (err) {
      setMensaje({
        tipo: "error",
        text: esErrorConexion(err) ? MSJ_CONEXION : (err instanceof Error ? err.message : "Error al subir. Intenta más tarde."),
      });
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-6 sm:p-8">
    <div className="space-y-8">
      {errorConexion && (
        <div role="alert" className="p-6 rounded-xl bg-rotary-blue/5 border-2 border-rotary-blue text-rotary-blue text-center">
          <p className="text-[22px] font-semibold">{MSJ_CONEXION}</p>
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold text-rotary-blue">
          Evidencias mensuales
        </h2>
        <p className="text-ui-lg text-slate-700 mt-1">
          Sube un PDF o foto como evidencia de tus logros del mes.
        </p>
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

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
        <label className="block">
          <span className="block text-ui-lg font-semibold text-slate-800 mb-2">
            Proyecto
          </span>
          <select
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            disabled={cargandoProyectos}
            className="w-full min-h-touch rounded-lg border border-slate-300 px-4 text-ui-base"
          >
            <option value="">{cargandoProyectos ? "Cargando…" : "Selecciona un proyecto"}</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_proyecto}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-ui-lg font-semibold text-slate-800 mb-2">
            Archivo (PDF o imagen, máx. {MAX_SIZE_MB} MB)
          </span>
          <input
            type="file"
            accept={ACCEPT_EVIDENCIAS}
            onChange={subirArchivo}
            disabled={!proyectoId || subiendo}
            className="block w-full text-ui-base file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-rotary-gold file:text-rotary-blue"
          />
        </label>
        {subiendo && (
          <p className="text-[18px] font-semibold text-slate-700">Subiendo… Por favor espera.</p>
        )}
      </div>
    </div>
    </div>
  );
}
