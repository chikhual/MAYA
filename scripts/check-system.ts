#!/usr/bin/env npx tsx
/**
 * MAYA - Diagnóstico del sistema
 * Ejecutar: npm run check-system
 * Requiere: dotenv, @supabase/supabase-js, variables en .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { getFechaCorteISO, getEtiquetaSemana, yaCerroEstaSemana } from "../src/lib/semana";
import { getBucketEvidencias } from "../src/lib/supabase/storage";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type Result = { ok: boolean; msg: string; detail?: string };

const COLUMNS = {
  perfiles: ["id", "user_id", "nombre", "club", "rol", "foto_url", "created_at"],
  proyectos: ["id", "director_id", "nombre_proyecto", "descripcion", "created_at"],
  check_semanales: ["id", "proyecto_id", "completado", "fecha_corte", "comentario", "created_at"],
} as const;

function createDate(year: number, month: number, day: number, hour: number, min: number): Date {
  const d = new Date(year, month - 1, day, hour, min, 0, 0);
  return d;
}

async function testDbIntegrity(supabase: ReturnType<typeof createClient>): Promise<Result> {
  const tableNames = ["perfiles", "proyectos", "check_semanales"] as const;

  for (const name of tableNames) {
    const cols = COLUMNS[name];
    const { error } = await supabase.from(name).select(cols[0]).limit(1);
    if (error) {
      if (name === "check_semanales" && error.message?.includes("check_semanales")) {
        const alt = await supabase.from("checkins_semanales").select("id").limit(1);
        if (!alt.error) {
          return { ok: true, msg: "Tablas OK (checkins_semanales)", detail: "Se usa checkins_semanales en lugar de check_semanales" };
        }
      }
      return {
        ok: false,
        msg: `Tabla '${name}' no accesible`,
        detail: error.message,
      };
    }
  }

  const { error: rlsRead } = await supabase.from("perfiles").select("id").limit(1);
  if (rlsRead) {
    return { ok: false, msg: "RLS bloquea lectura en perfiles", detail: rlsRead.message };
  }

  return { ok: true, msg: "Tablas OK, RLS permite lectura" };
}

function testTemporalLogic(): Result[] {
  const results: Result[] = [];

  const jueves = createDate(2025, 3, 13, 10, 0);
  const viernes405 = createDate(2025, 3, 14, 16, 5);
  const sabado = createDate(2025, 3, 15, 10, 0);

  const cerradoJueves = yaCerroEstaSemana(jueves);
  const cerradoViernes = yaCerroEstaSemana(viernes405);
  const cerradoSabado = yaCerroEstaSemana(sabado);

  const fechaJueves = getFechaCorteISO(jueves);
  const fechaViernes = getFechaCorteISO(viernes405);
  const fechaSabado = getFechaCorteISO(sabado);

  const etiquetaSabado = getEtiquetaSemana(sabado);

  if (!cerradoJueves) {
    results.push({ ok: true, msg: "Jueves: Check-in permitido (cerrado=false)" });
  } else {
    results.push({ ok: false, msg: "Jueves: Debería permitir check-in", detail: `cerrado=${cerradoJueves}` });
  }

  if (cerradoViernes) {
    results.push({ ok: true, msg: "Viernes 4:05 PM: Semana Cerrada (cerrado=true)" });
  } else {
    results.push({ ok: false, msg: "Viernes 4:05 PM: Debería mostrar Semana Cerrada", detail: `cerrado=${cerradoViernes}` });
  }

  if (cerradoSabado && fechaSabado !== fechaJueves) {
    results.push({ ok: true, msg: "Sábado: Semana siguiente (Pendiente)", detail: etiquetaSabado });
  } else {
    results.push({
      ok: false,
      msg: "Sábado: Debería mostrar semana siguiente",
      detail: `cerrado=${cerradoSabado}, fecha=${fechaSabado}`,
    });
  }

  return results;
}

async function testStorage(supabase: ReturnType<typeof createClient>): Promise<Result> {
  const bucket = getBucketEvidencias();
  try {
    const { data, error } = await supabase.storage.from(bucket).list("", { limit: 1 });
    if (error) {
      if (error.message?.includes("Bucket not found") || error.message?.includes("404")) {
        return { ok: false, msg: "Bucket 'evidencias' no existe", detail: error.message };
      }
      return { ok: false, msg: "Bucket no accesible", detail: error.message };
    }
    return { ok: true, msg: "Bucket accesible" };
  } catch (e) {
    return {
      ok: false,
      msg: "Error al conectar con Storage",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

async function testAuth(supabase: ReturnType<typeof createClient>): Promise<Result> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && error.message !== "Auth session missing!") {
      return { ok: false, msg: "Auth getUser falló", detail: error.message };
    }
    if (user) {
      return { ok: true, msg: `Conectado: ${user.email ?? user.id}` };
    }
    return { ok: true, msg: "Auth OK (API operativa, sin sesión en script)" };
  } catch (e) {
    return {
      ok: false,
      msg: "Auth inaccesible",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

function printReport(
  db: Result,
  temporal: Result[],
  storage: Result,
  auth: Result
) {
  const sep = "─".repeat(50);
  console.log("\n");
  console.log("  ╔═══════════════════════════════════════════════╗");
  console.log("  ║        MAYA — Reporte de Diagnóstico         ║");
  console.log("  ╚═══════════════════════════════════════════════╝");
  console.log("\n");

  const icon = (ok: boolean) => (ok ? "✅" : "❌");
  console.log(`  ${icon(db.ok)} Conexión DB: ${db.ok ? "OK" : db.msg}`);
  if (db.detail) console.log(`     └─ ${db.detail}`);
  console.log();

  console.log(`  ${icon(storage.ok)} Bucket Evidencias: ${storage.ok ? "Accesible" : storage.msg}`);
  if (storage.detail) console.log(`     └─ ${storage.detail}`);
  console.log();

  const temporalOk = temporal.every((r) => r.ok);
  console.log(`  ${icon(temporalOk)} Lógica de Viernes:`);
  temporal.forEach((r) => {
    console.log(`     ${r.ok ? "✓" : "✗"} ${r.msg}${r.detail ? ` (${r.detail})` : ""}`);
  });
  console.log();

  console.log(`  ${auth.ok ? "🚀" : "❌"} Estado del Auth: ${auth.ok ? auth.msg : auth.msg}`);
  if (auth.detail) console.log(`     └─ ${auth.detail}`);
  console.log("\n" + sep + "\n");
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error("❌ Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

  const [dbResult, storageResult, authResult] = await Promise.all([
    testDbIntegrity(supabase),
    testStorage(supabase),
    testAuth(supabase),
  ]);

  const temporalResults = testTemporalLogic();
  printReport(dbResult, temporalResults, storageResult, authResult);

  const anyFail =
    !dbResult.ok ||
    !storageResult.ok ||
    temporalResults.some((r) => !r.ok) ||
    !authResult.ok;

  process.exit(anyFail ? 1 : 0);
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});
