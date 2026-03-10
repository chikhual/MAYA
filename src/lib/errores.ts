/**
 * Detecta si un error es de conexión/red (para mostrar mensaje amigable).
 */
export function esErrorConexion(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("conexión") ||
      msg.includes("connection") ||
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("load failed") ||
      msg.includes("timeout") ||
      msg.includes("aborted")
    );
  }
  return false;
}

/** Mensaje amigable para errores de conexión (Regla de Oro UI: texto grande, claro) */
export const MSJ_CONEXION =
  "Lo sentimos, hay un problema de conexión. Intenta más tarde.";
