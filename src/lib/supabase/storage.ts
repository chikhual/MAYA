const BUCKET_EVIDENCIAS = "evidencias";

export const ACCEPT_EVIDENCIAS = "application/pdf,image/jpeg,image/jpg,image/png";
export const MAX_SIZE_MB = 10;

export function getBucketEvidencias() {
  return BUCKET_EVIDENCIAS;
}

/** Path para avatar: avatars/[user_id].jpg */
export function pathAvatar(userId: string): string {
  return `avatars/${userId}.jpg`;
}

/**
 * Genera un path único para subir: proyecto_id / año-mes / nombre_archivo
 */
export function pathEvidencia(proyectoId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const yymm = new Date().toISOString().slice(0, 7);
  return `${proyectoId}/${yymm}/${Date.now()}_${safe}`;
}

/**
 * Path para logros de Agenda: evidencias/[user_id]/[mes_año]/archivo
 * Ej: evidencias/uuid/03_2025/foto.jpg
 */
export function pathLogroEvidencia(userId: string, mes: number, anio: number, fileName: string): string {
  const mesStr = String(mes).padStart(2, "0");
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${userId}/${mesStr}_${anio}/${Date.now()}_${safe}`;
}
