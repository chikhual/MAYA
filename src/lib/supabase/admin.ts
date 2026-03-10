import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con Service Role Key para operaciones de administración
 * (ej. listar usuarios, obtener emails). Solo usar en servidor (API routes).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
