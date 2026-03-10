"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBucketEvidencias, pathLogroEvidencia } from "@/lib/supabase/storage";
import { ACCEPT_EVIDENCIAS, MAX_SIZE_MB } from "@/lib/supabase/storage";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function esImagen(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}

export default function AgendaPage() {
  const [logros, setLogros] = useState<Record<number, { id: string }>>({});
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
  const [nombreLogro, setNombreLogro] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const [errorConexion, setErrorConexion] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("logros_mensuales")
          .select("id, mes")
          .eq("user_id", user.id)
          .eq("anio", anio);
        if (cancelled) return;
        const map: Record<number, { id: string }> = {};
        (data ?? []).forEach((r) => { map[r.mes] = { id: r.id }; });
        setLogros(map);
      } catch (e) {
        if (cancelled) return;
        if (esErrorConexion(e)) setErrorConexion(true);
        setLogros({});
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, [anio]);

  useEffect(() => {
    if (!archivo) { setPreview(null); return; }
    if (archivo.type.startsWith("image/")) {
      const url = URL.createObjectURL(archivo);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [archivo]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMensaje({ tipo: "error", text: `El archivo no debe superar ${MAX_SIZE_MB} MB.` });
      return;
    }
    setArchivo(file);
    setMensaje(null);
    e.target.value = "";
  }

  async function compartirLogro() {
    if (mesSeleccionado === null || !nombreLogro.trim() || !archivo) {
      setMensaje({ tipo: "error", text: "Completa el nombre del logro y sube una evidencia." });
      return;
    }
    setSubiendo(true);
    setMensaje(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No has iniciado sesión");
      const path = pathLogroEvidencia(user.id, mesSeleccionado, anio, archivo.name);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(getBucketEvidencias())
        .upload(path, archivo, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from(getBucketEvidencias()).getPublicUrl(uploadData.path);
      const { data: perfil } = await supabase.from("perfiles").select("id").eq("user_id", user.id).limit(1).single();

      const payload = {
        user_id: user.id,
        perfil_id: perfil?.id ?? null,
        mes: mesSeleccionado,
        anio,
        nombre_logro: nombreLogro.trim(),
        descripcion: descripcion.trim() || null,
        file_url: urlData.publicUrl,
        filename: archivo.name,
        es_imagen: esImagen(archivo.name),
      };

      const existe = logros[mesSeleccionado];
      if (existe) {
        const { error: updErr } = await supabase
          .from("logros_mensuales")
          .update(payload)
          .eq("id", existe.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from("logros_mensuales").insert(payload);
        if (insErr) throw insErr;
      }

      setLogros((prev) => ({ ...prev, [mesSeleccionado]: { id: existe?.id ?? "" } }));
      setMensaje({ tipo: "ok", text: "¡Logro compartido correctamente con el Club!" });
      setNombreLogro("");
      setDescripcion("");
      setArchivo(null);
      setTimeout(() => setMesSeleccionado(null), 1500);
    } catch (e) {
      setMensaje({
        tipo: "error",
        text: esErrorConexion(e) ? MSJ_CONEXION : (e instanceof Error ? e.message : "Error al subir. Intenta más tarde."),
      });
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border-2 border-rotary-blue/20 p-6 sm:p-8">
      <h2 className="text-[24px] font-bold text-rotary-blue mb-2">Agenda de Logros</h2>
      <p className="text-[20px] text-slate-600 mb-6">Selecciona un mes para registrar tu logro.</p>

      {errorConexion && (
        <div role="alert" className="p-6 rounded-xl bg-rotary-blue/5 border-2 border-rotary-blue text-rotary-blue text-center mb-6">
          <p className="text-[22px] font-semibold">{MSJ_CONEXION}</p>
        </div>
      )}

      {/* Selector de año */}
      <div className="mb-6">
        <label className="text-[20px] font-semibold text-slate-800 mr-3">Año:</label>
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="min-h-touch rounded-lg border-2 border-rotary-blue/30 px-4 text-[20px] py-2"
        >
          {[anio - 1, anio, anio + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Cuadrícula de 12 meses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {MESES.map((nombre, idx) => {
          const mes = idx + 1;
          const completado = !!logros[mes];
          return (
            <button
              key={mes}
              type="button"
              onClick={() => setMesSeleccionado(mes)}
              className={`flex flex-col items-center justify-center min-h-[100px] rounded-xl border-2 transition-all text-[20px] font-semibold ${
                completado
                  ? "bg-semaforo-verde/10 border-semaforo-verde text-semaforo-verde-oscuro"
                  : "bg-white border-rotary-blue/30 text-slate-700 hover:border-rotary-blue hover:bg-rotary-blue/5"
              }`}
            >
              <span className="mb-1">{nombre}</span>
              <span className="text-3xl" title={completado ? "Completado" : "Pendiente"}>
                {completado ? "✅" : "⏳"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal de formulario */}
      {mesSeleccionado !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white border-2 border-rotary-blue shadow-xl p-6 sm:p-8">
            <h3 className="text-[22px] font-bold text-rotary-blue mb-6">
              Logro de {MESES[mesSeleccionado - 1]} {anio}
            </h3>

            {mensaje && (
              <div
                role="alert"
                className={`mb-6 p-4 rounded-xl text-[18px] font-semibold ${
                  mensaje.tipo === "ok" ? "bg-semaforo-verde/20 text-semaforo-verde-oscuro" : "bg-semaforo-rojo/10 text-semaforo-rojo"
                }`}
              >
                {mensaje.text}
              </div>
            )}

            <div className="space-y-5">
              <label className="block">
                <span className="block text-[20px] font-semibold text-slate-800 mb-2">Nombre del Logro</span>
                <input
                  type="text"
                  value={nombreLogro}
                  onChange={(e) => setNombreLogro(e.target.value)}
                  placeholder="Ej. Entrega de sillas de ruedas"
                  className="w-full min-h-touch rounded-lg border-2 border-slate-300 px-4 text-[20px]"
                />
              </label>

              <label className="block">
                <span className="block text-[20px] font-semibold text-slate-800 mb-2">Descripción breve</span>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="¿Qué se logró este mes?"
                  rows={3}
                  className="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-[20px]"
                />
              </label>

              <label className="block">
                <span className="block text-[20px] font-semibold text-slate-800 mb-2">Subir Evidencia</span>
                <input
                  type="file"
                  accept={ACCEPT_EVIDENCIAS}
                  onChange={handleFileChange}
                  className="hidden"
                  id="archivo-logro"
                />
                <label
                  htmlFor="archivo-logro"
                  className="flex flex-col items-center justify-center min-h-[120px] rounded-xl border-2 border-dashed border-rotary-blue cursor-pointer hover:bg-rotary-blue/5 transition-colors"
                >
                  {preview ? (
                    <img src={preview} alt="Vista previa" className="max-h-24 w-auto rounded-lg object-contain" />
                  ) : archivo && !archivo.type.startsWith("image/") ? (
                    <div className="flex flex-col items-center gap-2 text-rotary-blue">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[18px] font-semibold truncate max-w-xs">{archivo.name}</span>
                    </div>
                  ) : (
                    <span className="text-[20px] font-semibold text-rotary-blue">PDF o imagen (JPG/PNG)</span>
                  )}
                </label>
              </label>

              <button
                type="button"
                onClick={compartirLogro}
                disabled={subiendo}
                className="w-full min-h-[4.5rem] rounded-xl bg-rotary-blue hover:bg-rotary-blue-dark text-white font-bold text-[22px] disabled:opacity-70 flex items-center justify-center"
              >
                {subiendo ? "Subiendo…" : "Compartir mi logro con el Club"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMesSeleccionado(null)}
              className="mt-4 w-full py-3 text-[18px] font-semibold text-slate-600 hover:text-slate-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
