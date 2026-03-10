#!/usr/bin/env node
/**
 * MAYA - Importar socios desde CSV
 *
 * Mapeo:
 *   Nombre de confianza -> mote
 *   Nombre -> nombre
 *   Correo electrónico -> email (auth)
 *   Clasificación -> profesion
 *
 * Uso: node scripts/import-socios.mjs datos/socios.csv
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Ejecutar antes: ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS profesion TEXT;
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD_TEMPORAL = "Rotary2026!";

const CSV_ENCODING = "utf-8";

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0];
  const sep = header.includes(";") ? ";" : ",";
  const headers = header.split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], sep);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j]?.trim() ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line, sep) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === sep) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Uso: node scripts/import-socios.mjs <ruta-al-csv>");
    console.error("Ejemplo: node scripts/import-socios.mjs datos/socios.csv");
    process.exit(1);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("❌ Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  let csvContent;
  try {
    csvContent = readFileSync(resolve(process.cwd(), csvPath), CSV_ENCODING);
  } catch (e) {
    console.error("❌ No se pudo leer el archivo:", csvPath, e.message);
    process.exit(1);
  }

  const rows = parseCSV(csvContent);
  if (rows.length === 0) {
    console.log("No hay filas en el CSV.");
    process.exit(0);
  }

  console.log(`\n📋 Importando ${rows.length} socios desde ${csvPath}\n`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const email = (r["Correo electrónico"] ?? r["correo electrónico"] ?? r["Email"] ?? r["email"] ?? r["Correo"] ?? "").trim();
    const nombre = (r["Nombre"] ?? r["nombre"] ?? r["Nombre completo"] ?? "").trim();
    const mote = (r["Nombre de confianza"] ?? r["nombre de confianza"] ?? r["Mote"] ?? r["mote"] ?? "").trim();
    const profesion = (r["Clasificación"] ?? r["clasificación"] ?? r["Profesión"] ?? "").trim();

    if (!email || !nombre) {
      console.log(`  ⏭️  Fila ${i + 2}: omitida (falta email o nombre)`);
      fail++;
      continue;
    }

    try {
      const { data: user, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD_TEMPORAL,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message?.includes("already been registered") || authError.message?.includes("already registered")) {
          const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const existing = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (existing) {
            const { data: existPerfil } = await supabase.from("perfiles").select("id").eq("user_id", existing.id).maybeSingle();
            if (existPerfil) {
              const { error: updErr } = await supabase.from("perfiles").update({ nombre, mote: mote || null, profesion: profesion || null }).eq("user_id", existing.id);
              if (!updErr) {
                console.log(`  ✅ ${nombre} (${email}) - perfil actualizado`);
                ok++;
              } else {
                console.log(`  ❌ ${nombre}: ${updErr.message}`);
                fail++;
              }
            } else {
              const { error: insErr } = await supabase.from("perfiles").insert({
                user_id: existing.id,
                nombre,
                mote: mote || null,
                club: "Por asignar",
                profesion: profesion || null,
              });
              if (!insErr) {
                console.log(`  ✅ ${nombre} (${email}) - perfil creado (usuario ya existía)`);
                ok++;
              } else {
                console.log(`  ❌ ${nombre}: ${insErr.message}`);
                fail++;
              }
            }
          } else {
            console.log(`  ❌ ${nombre}: ${authError.message}`);
            fail++;
          }
        } else {
          console.log(`  ❌ ${nombre}: ${authError.message}`);
          fail++;
        }
        continue;
      }

      if (!user?.user?.id) {
        console.log(`  ❌ ${nombre}: no se obtuvo ID de usuario`);
        fail++;
        continue;
      }

      const { error: perfilError } = await supabase.from("perfiles").insert({
        user_id: user.user.id,
        nombre,
        mote: mote || null,
        club: "Por asignar",
        profesion: profesion || null,
      });

      if (perfilError) {
        console.log(`  ❌ ${nombre}: ${perfilError.message}`);
        fail++;
      } else {
        console.log(`  ✅ ${nombre} (${email})`);
        ok++;
      }
    } catch (e) {
      console.log(`  ❌ ${nombre}: ${e.message}`);
      fail++;
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`✅ Socios cargados con éxito: ${ok}`);
  if (fail > 0) console.log(`❌ Fallidos u omitidos: ${fail}`);
  console.log("─".repeat(50) + "\n");
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});
