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

const htmlResumenAdmin = (verde: number, rojo: number, etiqueta: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:2px solid #17458f;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:56px;height:56px;background:#17458f;border-radius:12px;line-height:56px;color:#f7a81b;font-weight:bold;font-size:28px;">M</div>
      <p style="margin:8px 0 0;font-size:18px;font-weight:600;color:#17458f;">MONITOREO · Club Rotario</p>
    </div>
    <hr style="border:none;border-top:2px solid #17458f;margin:24px 0;">
    <h2 style="font-size:22px;color:#17458f;margin:0 0 16px;">Resumen Semanal del Club</h2>
    <p style="font-size:18px;color:#475569;margin:0 0 24px;">${etiqueta}</p>
    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;padding:20px;background:#dcfce7;border-radius:12px;border:2px solid #22c55e;text-align:center;">
        <p style="font-size:14px;color:#15803d;margin:0 0 4px;">Socios en Verde</p>
        <p style="font-size:32px;font-weight:700;color:#22c55e;margin:0;">${verde}</p>
      </div>
      <div style="flex:1;padding:20px;background:#fee2e2;border-radius:12px;border:2px solid #dc2626;text-align:center;">
        <p style="font-size:14px;color:#b91c1c;margin:0 0 4px;">Socios en Rojo</p>
        <p style="font-size:32px;font-weight:700;color:#dc2626;margin:0;">${rojo}</p>
      </div>
    </div>
    <p style="font-size:14px;color:#64748b;margin:0;">Cierre automático ejecutado correctamente.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
      MAYA · Programa de Monitoreo
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
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const fromEmail = Deno.env.get("RESEND_FROM") || "MAYA <onboarding@resend.dev>";

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const fechaCorte = getFechaCorteISO();

    const { data: proyectos, error: eProy } = await supabase
      .from("proyectos")
      .select("id, director_id, nombre_proyecto, perfiles!director_id(id, nombre)");
    if (eProy) throw eProy;

    const { data: checks } = await supabase
      .from("check_semanales")
      .select("proyecto_id, completado")
      .eq("fecha_corte", fechaCorte);

    const checksMap = new Map<string, boolean>();
    (checks ?? []).forEach((c: { proyecto_id: string; completado: boolean }) => {
      checksMap.set(c.proyecto_id, c.completado);
    });

    let verde = 0;
    let rojo = 0;
    const inserts: { proyecto_id: string; completado: boolean; fecha_corte: string }[] = [];

    for (const p of proyectos ?? []) {
      const row = p as { id: string; director_id: string; nombre_proyecto: string };
      const exists = checksMap.has(row.id);
      const completado = exists ? (checksMap.get(row.id) ?? false) : false;

      if (completado) verde++;
      else {
        rojo++;
        if (!exists) inserts.push({ proyecto_id: row.id, completado: false, fecha_corte: fechaCorte });
      }
    }

    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from("check_semanales").upsert(inserts, {
        onConflict: "proyecto_id,fecha_corte",
      });
      if (insErr) throw insErr;
    }

    const viernes = new Date(fechaCorte);
    const lunes = new Date(viernes);
    lunes.setDate(lunes.getDate() - 4);
    const etiqueta = `Semana ${lunes.getDate()}–${viernes.getDate()} ${viernes.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`;

    if (adminEmail && resendKey) {
      await fetch(RESEND_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject: `Resumen Semanal: ${verde} Socios en Verde, ${rojo} Socios en Rojo`,
          html: htmlResumenAdmin(verde, rojo, etiqueta),
        }),
      });
    }

    return new Response(
      JSON.stringify({ ok: true, verde, rojo, insertados: inserts.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
