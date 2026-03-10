import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API = "https://api.resend.com/emails";

function getFechaCorteISO(): string {
  const d = new Date();
  const dia = d.getDay();
  const hora = d.getHours();
  const min = d.getMinutes();
  const DIA_VIERNES = 5;
  const HORA_CIERRE = 16;

  let viernes = new Date(d);
  viernes.setHours(0, 0, 0, 0);
  const diffViernes = DIA_VIERNES - dia;
  viernes.setDate(viernes.getDate() + (diffViernes >= 0 ? diffViernes : diffViernes + 7));

  const yaPasoCierre = dia === DIA_VIERNES && (hora > HORA_CIERRE || (hora === HORA_CIERRE && min >= 0));
  if (yaPasoCierre || dia > DIA_VIERNES) viernes.setDate(viernes.getDate() + 7);

  const y = viernes.getFullYear();
  const m = String(viernes.getMonth() + 1).padStart(2, "0");
  const day = String(viernes.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const htmlRecordatorio = (nombre: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:56px;height:56px;background:#17458f;border-radius:12px;line-height:56px;color:#f7a81b;font-weight:bold;font-size:28px;">M</div>
      <p style="margin:8px 0 0;font-size:18px;font-weight:600;color:#17458f;">MONITOREO · Club Rotario</p>
    </div>
    <hr style="border:none;border-top:2px solid #17458f;margin:24px 0;">
    <p style="font-size:20px;color:#334155;line-height:1.6;margin:0 0 16px;">
      Hola <strong>${nombre}</strong>,
    </p>
    <p style="font-size:18px;color:#475569;line-height:1.7;margin:0 0 24px;">
      No olvides marcar tu avance semanal antes de las 4:00 PM para que tu semáforo aparezca en <span style="color:#22c55e;font-weight:600;">verde</span>.
    </p>
    <p style="font-size:16px;color:#64748b;margin:0;">
      — Equipo MAYA
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
      Recordatorio automático · Programa de Monitoreo
    </p>
  </div>
</body>
</html>
`;

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM") || "MAYA <onboarding@resend.dev>";

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const fechaCorte = getFechaCorteISO();

    const { data: proyectos, error: eProy } = await supabase
      .from("proyectos")
      .select("id, director_id, perfiles!director_id(id, nombre, user_id)");
    if (eProy) throw eProy;

    const { data: checks } = await supabase
      .from("check_semanales")
      .select("proyecto_id, completado")
      .eq("fecha_corte", fechaCorte);

    const conCheckVerde = new Set<string>();
    (checks ?? []).forEach((c: { proyecto_id: string; completado: boolean }) => {
      if (c.completado) conCheckVerde.add(c.proyecto_id);
    });

    const directorProyectos = new Map<string, { nombre: string; proyectoIds: string[] }>();
    for (const p of proyectos ?? []) {
      const row = p as { id: string; director_id: string; perfiles: { id: string; nombre: string; user_id: string | null } | { id: string; nombre: string; user_id: string | null }[] };
      const perfil = Array.isArray(row.perfiles) ? row.perfiles[0] : row.perfiles;
      if (!perfil?.user_id) continue;
      if (!directorProyectos.has(perfil.user_id)) {
        directorProyectos.set(perfil.user_id, { nombre: perfil.nombre, proyectoIds: [] });
      }
      directorProyectos.get(perfil.user_id)!.proyectoIds.push(row.id);
    }

    const directoresPendientes = new Map<string, { nombre: string; email?: string }>();
    for (const [userId, { nombre, proyectoIds }] of directorProyectos) {
      const algunoVerde = proyectoIds.some((id) => conCheckVerde.has(id));
      if (!algunoVerde) directoresPendientes.set(userId, { nombre });
    }

    const userIds = [...directoresPendientes.keys()];
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, enviados: 0, mensaje: "Todos han hecho check-in" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const users = usersData?.users ?? [];
    for (const u of users) {
      if (directoresPendientes.has(u.id)) {
        const entry = directoresPendientes.get(u.id)!;
        entry.email = u.email ?? undefined;
      }
    }

    let enviados = 0;
    for (const [userId, { nombre, email }] of directoresPendientes) {
      if (!email) continue;
      const res = await fetch(RESEND_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Compañero, falta 1 hora para el reporte semanal de MAYA",
          html: htmlRecordatorio(nombre),
        }),
      });
      if (res.ok) enviados++;
    }

    return new Response(JSON.stringify({ ok: true, enviados, total_pendientes: userIds.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
