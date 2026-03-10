"use client";

import { useState } from "react";

export default function FichasBienvenidaPage() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generarPDF() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/fichas-bienvenida");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Fichas-Bienvenida-MAYA.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el PDF");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-8">
      <h2 className="text-xl font-semibold text-rotary-blue mb-2">Fichas de Bienvenida</h2>
      <p className="text-slate-600 mb-6">
        Genera un archivo PDF con una ficha por cada socio cargado. Cada ficha incluye nombre, mote,
        URL de acceso, usuario y contraseña temporal con las instrucciones de primer uso.
      </p>
      <button
        type="button"
        onClick={generarPDF}
        disabled={cargando}
        className="inline-flex items-center gap-2 px-5 py-3 bg-rotary-blue text-white font-semibold rounded-lg hover:bg-rotary-blue-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {cargando ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generando PDF…
          </>
        ) : (
          "GENERAR FICHAS DE BIENVENIDA (PDF)"
        )}
      </button>
      {error && (
        <p className="mt-4 text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
