#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("❌ No existe .env.local");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      const k = l.slice(0, i).trim();
      const v = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      return [k, v];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log("🔗 Conectando a Supabase...", url);
  console.log("");

  try {
    const { data: perfiles, error: e1 } = await supabase.from("perfiles").select("id, nombre, club").limit(5);
    if (e1) {
      console.log("❌ Tabla perfiles:", e1.message);
      if (e1.code === "42P01") console.log("   → Ejecuta supabase/schema.sql en el SQL Editor de Supabase.");
    } else {
      console.log("✅ perfiles:", perfiles?.length ?? 0, "registros");
      if (perfiles?.length) console.log("   ", perfiles);
    }

    const { data: proyectos, error: e2 } = await supabase.from("proyectos").select("id, nombre_proyecto, director_id").limit(5);
    if (e2) {
      console.log("❌ Tabla proyectos:", e2.message);
    } else {
      console.log("✅ proyectos:", proyectos?.length ?? 0, "registros");
      if (proyectos?.length) console.log("   ", proyectos);
    }

    const { data: checks, error: e3 } = await supabase.from("check_semanales").select("id, proyecto_id, completado, fecha_corte").limit(5);
    if (e3) {
      console.log("❌ Tabla check_semanales:", e3.message);
    } else {
      console.log("✅ check_semanales:", checks?.length ?? 0, "registros");
      if (checks?.length) console.log("   ", checks);
    }

    console.log("");
    console.log("✅ Conexión a la base de datos correcta.");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

test();
