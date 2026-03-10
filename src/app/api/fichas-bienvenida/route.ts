import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import jsPDF from "jspdf";
import { createAdminClient } from "@/lib/supabase/admin";

const PASSWORD_TEMPORAL = "Rotary2026!";
const LOGO_PATH = join(process.cwd(), "public", "logo-rotary.png");
const TAMANO_FUENTE_TITULO = 22;
const TAMANO_FUENTE_NORMAL = 14;
const TAMANO_FUENTE_PIE = 10;

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://maya-rotary.vercel.app";
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: perfiles, error: errPerfiles } = await supabase
      .from("perfiles")
      .select("id, user_id, nombre, mote")
      .order("nombre");

    if (errPerfiles) {
      return NextResponse.json(
        { error: "Error al obtener perfiles: " + errPerfiles.message },
        { status: 500 }
      );
    }

    if (!perfiles?.length) {
      return NextResponse.json(
        { error: "No hay socios en la tabla perfiles." },
        { status: 404 }
      );
    }

    const userIds = perfiles.map((p) => p.user_id).filter(Boolean) as string[];
    const emailMap: Record<string, string> = {};

    for (const uid of userIds) {
      const { data } = await supabase.auth.admin.getUserById(uid);
      if (data?.user?.email) {
        emailMap[uid] = data.user.email;
      }
    }

    const baseUrl = getBaseUrl();
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    let logoBase64: string | null = null;
    try {
      const buf = readFileSync(LOGO_PATH);
      logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      // Si no existe el logo, se usa solo texto
    }

    for (let i = 0; i < perfiles.length; i++) {
      const p = perfiles[i];
      const email = p.user_id ? emailMap[p.user_id] ?? "(sin correo)" : "(sin usuario)";

      if (i > 0) doc.addPage();
      dibujarFicha(doc, {
        nombre: p.nombre,
        mote: p.mote ?? "",
        url: baseUrl,
        usuario: email,
        password: PASSWORD_TEMPORAL,
      }, logoBase64);
    }

    const buffer = doc.output("arraybuffer");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Fichas-Bienvenida-MAYA.pdf"',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

interface FichaDatos {
  nombre: string;
  mote: string;
  url: string;
  usuario: string;
  password: string;
}

function dibujarFicha(doc: jsPDF, d: FichaDatos, logoBase64: string | null) {
  const margin = 20;
  let y = margin;

  if (logoBase64) {
    try {
      const logoW = 45;
      const logoH = 18;
      doc.addImage(logoBase64, "PNG", margin, y, logoW, logoH);
      y += logoH + 8;
    } catch {
      // Fallback a texto si falla la imagen
      doc.setFont("helvetica", "bold");
      doc.setFontSize(TAMANO_FUENTE_TITULO);
      doc.setTextColor(23, 69, 143);
      doc.text("ROTARY", margin, y);
      y += 10;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(TAMANO_FUENTE_TITULO);
    doc.setTextColor(23, 69, 143);
    doc.text("ROTARY INTERNATIONAL", margin, y);
    y += 10;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(23, 69, 143);
  doc.text("MAYA - Monitoreo de Proyectos", margin, y);
  y += 12;

  doc.setDrawColor(23, 69, 143);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 210 - margin, y);
  y += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(TAMANO_FUENTE_NORMAL);
  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.text("Ficha de Bienvenida", margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.text(`Nombre del Socio: ${d.nombre}`, margin, y);
  y += 8;
  if (d.mote) {
    doc.text(`Mote: ${d.mote}`, margin, y);
    y += 8;
  }

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Acceso al sistema", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`URL: ${d.url}`, margin, y);
  y += 8;
  doc.text(`Usuario: ${d.usuario}`, margin, y);
  y += 8;
  doc.text(`Contraseña Temporal: ${d.password}`, margin, y);
  y += 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Instrucciones", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(TAMANO_FUENTE_NORMAL);
  doc.text("Paso 1: Entra al sitio.", margin, y);
  y += 8;
  doc.text("Paso 2: Cambia tu contraseña.", margin, y);
  y += 8;
  doc.text("Paso 3: Sube tu primera evidencia.", margin, y);
  y += 20;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(TAMANO_FUENTE_PIE);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Por seguridad, cambie su contraseña después del primer inicio de sesión.",
    margin,
    297 - 15
  );
}
