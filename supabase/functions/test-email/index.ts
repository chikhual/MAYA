import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API = "https://api.resend.com/emails";

const htmlTest = `
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
    <h2 style="font-size:22px;color:#17458f;margin:0 0 16px;">✓ Prueba de correo exitosa</h2>
    <p style="font-size:18px;color:#475569;line-height:1.7;margin:0 0 24px;">
      Si recibiste este correo, el sistema de notificaciones de MAYA está funcionando correctamente.
    </p>
    <p style="font-size:14px;color:#64748b;margin:0;">
      — Sistema MAYA
    </p>
  </div>
</body>
</html>
`;

Deno.serve(async (req) => {
  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const fromEmail = Deno.env.get("RESEND_FROM") || "MAYA <onboarding@resend.dev>";

    let to = adminEmail;
    try {
      const body = await req.json();
      if (body?.email && typeof body.email === "string") to = body.email;
    } catch {
      /* sin body, usar ADMIN_EMAIL */
    }

    if (!resendKey || !to) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY o ADMIN_EMAIL no configurados, o envía { email: 'tu@email.com' } en el body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: "MAYA – Prueba de correo exitosa ✓",
        html: htmlTest,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message || data || "Error al enviar" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id, to }), {
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
