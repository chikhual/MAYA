/**
 * Lógica de cierre semanal: corte los viernes a las 16:00.
 * Si la fecha/hora actual es posterior al viernes 16:00, el check cuenta para la *siguiente* semana.
 */

const HORA_CIERRE = 16; // 4:00 PM
const DIA_VIERNES = 5; // 0 = domingo, 5 = viernes

/**
 * Obtiene el viernes de corte para la "semana actual" en zona horaria local.
 * Si hoy es después del viernes 16:00, devuelve el viernes de la próxima semana.
 */
export function getViernesCorte(date: Date = new Date()): Date {
  const d = new Date(date);
  const dia = d.getDay();
  const hora = d.getHours();
  const min = d.getMinutes();

  // Encontrar el viernes de esta semana (domingo = 0, lunes = 1, ... viernes = 5)
  let viernes = new Date(d);
  viernes.setHours(0, 0, 0, 0);
  const diffViernes = DIA_VIERNES - dia;
  viernes.setDate(viernes.getDate() + (diffViernes >= 0 ? diffViernes : diffViernes + 7));

  // Si hoy es viernes y ya pasaron las 16:00 (o exactamente 4:00 PM), el corte es el próximo viernes
  const yaPasoCierre = dia === DIA_VIERNES && (hora > HORA_CIERRE || (hora === HORA_CIERRE && min >= 0));
  if (yaPasoCierre) {
    viernes.setDate(viernes.getDate() + 7);
  } else if (dia > DIA_VIERNES) {
    // Sábado o domingo: el corte ya pasó, siguiente viernes
    viernes.setDate(viernes.getDate() + 7);
  }

  return viernes;
}

/**
 * Fecha de corte en formato YYYY-MM-DD para guardar en BD.
 * Usa componentes de fecha local (no toISOString) para evitar fallos en zonas horarias UTC+.
 */
export function getFechaCorteISO(date: Date = new Date()): string {
  const viernes = getViernesCorte(date);
  const y = viernes.getFullYear();
  const m = String(viernes.getMonth() + 1).padStart(2, "0");
  const d = String(viernes.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Viernes de la semana que contiene la fecha (sin avanzar a la próxima semana).
 * Lun–Jue → viernes de esta semana. Vie → hoy. Sáb–Dom → viernes pasado.
 */
function getViernesDeEstaSemana(date: Date): Date {
  const d = new Date(date);
  const dia = d.getDay();
  const viernes = new Date(d);
  viernes.setHours(0, 0, 0, 0);
  const diffViernes = DIA_VIERNES - dia;
  const offset = dia === 0 ? diffViernes - 7 : diffViernes;
  viernes.setDate(viernes.getDate() + offset);
  return viernes;
}

/**
 * ¿Estamos antes del cierre del viernes de esta semana? (para mensajes en UI)
 * Usa el viernes de la semana actual (no el de getViernesCorte) para detectar si ya cerramos.
 */
export function yaCerroEstaSemana(date: Date = new Date()): boolean {
  const d = new Date(date);
  const viernes = getViernesDeEstaSemana(d);
  const ahora = d.getTime();
  const cierre = new Date(viernes);
  cierre.setHours(HORA_CIERRE, 0, 0, 0);
  return ahora >= cierre.getTime();
}

/**
 * Etiqueta legible de la semana actual (ej. "Semana 10–16 Mar 2025").
 */
export function getEtiquetaSemana(date: Date = new Date()): string {
  const viernes = getViernesCorte(date);
  const lunes = new Date(viernes);
  lunes.setDate(lunes.getDate() - 4);
  return `Semana ${lunes.getDate()}–${viernes.getDate()} ${viernes.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`;
}

/**
 * Milisegundos hasta el cierre del viernes 4:00 PM.
 * Si ya pasó el cierre, devuelve 0.
 */
export function getMsHastaCierre(date: Date = new Date()): number {
  const viernes = getViernesCorte(date);
  const cierre = new Date(viernes);
  cierre.setHours(HORA_CIERRE, 0, 0, 0);
  const ms = cierre.getTime() - date.getTime();
  return Math.max(0, ms);
}

/**
 * Formato legible de cuenta regresiva: "X días Y horas Z minutos"
 * o "X horas Y minutos" si es el mismo día, o "Z minutos" si falta menos de 1 hora.
 */
export function formatCuentaRegresiva(ms: number): string {
  if (ms <= 0) return "Cierre realizado";

  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  const mins = m % 60;
  const hours = h % 24;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d} día${d !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? "s" : ""}`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins} minuto${mins !== 1 ? "s" : ""}`);

  return parts.join(" ");
}
