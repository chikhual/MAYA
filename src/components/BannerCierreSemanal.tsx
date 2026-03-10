"use client";

import { useState, useEffect } from "react";
import { getMsHastaCierre, formatCuentaRegresiva, yaCerroEstaSemana } from "@/lib/semana";

export function BannerCierreSemanal() {
  const [cuenta, setCuenta] = useState<string>("");
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    function actualizar() {
      if (yaCerroEstaSemana()) {
        setCuenta("Cierre realizado");
        setCerrado(true);
        return;
      }
      const ms = getMsHastaCierre();
      setCuenta(formatCuentaRegresiva(ms));
    }

    actualizar();
    const id = setInterval(actualizar, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-xl border-2 border-rotary-blue/40 bg-rotary-blue/5 px-6 py-4 mb-6"
      role="status"
      aria-live="polite"
    >
      <p className="text-[20px] font-semibold text-rotary-blue text-center">
        {cerrado ? (
          "El ciclo de esta semana ha cerrado."
        ) : (
          <>
            El ciclo actual cierra en: <strong>{cuenta}</strong> (viernes 4:00 PM)
          </>
        )}
      </p>
    </div>
  );
}
