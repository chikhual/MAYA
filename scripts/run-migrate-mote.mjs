#!/usr/bin/env node
/**
 * Ejecuta la migración para agregar columna 'mote' a perfiles.
 * Requiere: DATABASE_URL en .env.local (Supabase > Settings > Database > Connection string)
 * Ejecutar: node scripts/run-migrate-mote.mjs
 */
import pg from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) {
    console.error("❌ Falta DATABASE_URL en .env.local");
    console.log("\nObtén la URL en Supabase:");
    console.log("  Dashboard > Project Settings > Database > Connection string (URI)");
    console.log("  Copia la URI y añádela como DATABASE_URL en .env.local\n");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query("ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS mote TEXT;");
    console.log("✅ Migración ejecutada: columna 'mote' agregada a perfiles.");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
