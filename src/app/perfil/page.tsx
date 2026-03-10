"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBucketEvidencias, pathAvatar } from "@/lib/supabase/storage";
import { esErrorConexion, MSJ_CONEXION } from "@/lib/errores";

export default function PerfilPage() {
  const [nombre, setNombre] = useState("");
  const [mote, setMote] = useState("");
  const [club, setClub] = useState("");
  const [rol, setRol] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    const timeoutMs = 15000;

    async function cargar() {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      );
      try {
        const { data: { user } } = await Promise.race([
          supabase.auth.getUser(),
          timeout,
        ]);
        if (cancelled) return;
        if (!user) {
          setCargando(false);
          return;
        }
        const res1 = await Promise.race([
          supabase
            .from("perfiles")
            .select("id, nombre, mote, club, rol, foto_url")
            .eq("user_id", user.id)
            .limit(1),
          timeout,
        ]);
        if (cancelled) return;
        let perfiles = res1.data as { id?: string; nombre?: string; mote?: string; club?: string; rol?: string; foto_url?: string | null }[] | null;
        let queryError = res1.error;
        if (res1.error) {
          const res2 = await Promise.race([
            supabase
              .from("perfiles")
              .select("id, nombre, club, rol, foto_url")
              .eq("user_id", user.id)
              .limit(1),
            timeout,
          ]);
          if (cancelled) return;
          perfiles = res2.data as typeof perfiles;
          queryError = res2.error;
        }
        const p = queryError ? null : perfiles?.[0];
        if (p) {
          const row = p as { id: string; nombre?: string; mote?: string; club?: string; rol?: string; foto_url?: string | null };
          setPerfilId(row.id);
          setNombre(row.nombre ?? "");
          setMote(row.mote ?? "");
          setClub(row.club ?? "");
          setRol(row.rol ?? "");
          setFotoUrl(row.foto_url ?? null);
        } else {
          setNombre(user.email?.split("@")[0] ?? "Usuario");
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "timeout") {
          setError("La carga tardó demasiado. Revisa tu conexión y recarga la página.");
        } else {
          setError(esErrorConexion(e) ? MSJ_CONEXION : "No se pudo cargar tu perfil. Recarga la página.");
        }
        setNombre("Usuario");
      } finally {
        if (!cancelled) setCargando(false);
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, []);

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = pathAvatar(user.id);
    const { error: err } = await supabase.storage
      .from(getBucketEvidencias())
      .upload(path, file, { upsert: true });
    if (err) {
      setError(err.message);
      return;
    }
    const { data: urlData } = supabase.storage.from(getBucketEvidencias()).getPublicUrl(path);
    setFotoUrl(`${urlData.publicUrl}?t=${Date.now()}`);
    if (perfilId) {
      await supabase.from("perfiles").update({ foto_url: urlData.publicUrl }).eq("id", perfilId);
    }
    e.target.value = "";
  }

  async function guardar() {
    setError(null);
    setGuardadoOk(false);
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No has iniciado sesión");
      const datos: Record<string, unknown> = { nombre, mote: mote || null, club, rol: rol || null };
      if (fotoUrl) datos.foto_url = fotoUrl;
      if (perfilId) {
        const { error: err } = await supabase.from("perfiles").update(datos).eq("id", perfilId);
        if (err) throw err;
      } else {
        const insertData: Record<string, unknown> = { nombre, mote: mote || null, club, rol: rol || null, user_id: user.id };
        if (fotoUrl) insertData.foto_url = fotoUrl;
        const { data: nuevo, error: err } = await supabase
          .from("perfiles")
          .insert(insertData)
          .select("id")
          .single();
        if (err) throw err;
        setPerfilId(nuevo?.id ?? null);
      }
      setGuardadoOk(true);
      window.dispatchEvent(new CustomEvent("perfil-updated"));
      setTimeout(() => setGuardadoOk(false), 5000);
    } catch (e) {
      setError(esErrorConexion(e) ? MSJ_CONEXION : (e instanceof Error ? e.message : "Error al guardar"));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-8">
        <p className="text-[20px] text-slate-600 text-center">Cargando tu perfil…</p>
        <p className="text-[16px] text-slate-400 text-center mt-2">Si tarda mucho, revisa tu conexión.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 p-6 sm:p-8">
      <h2 className="text-[24px] font-bold text-rotary-blue mb-6">Mi Perfil</h2>

      {guardadoOk && (
        <div
          role="alert"
          className="mb-6 p-6 rounded-xl bg-semaforo-verde/20 border-2 border-semaforo-verde text-semaforo-verde-oscuro text-center"
        >
          <p className="text-[26px] font-bold">¡Excelente! Tus datos se han guardado correctamente, compañero.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 p-4 rounded-xl bg-semaforo-rojo/10 text-semaforo-rojo text-[20px] font-semibold">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-semaforo-rojo text-white rounded-lg font-medium hover:bg-semaforo-rojo-oscuro"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="space-y-6 max-w-xl">
        {/* Foto de perfil - 200x200px */}
        <label className="block">
          <span className="block text-[20px] font-semibold text-slate-800 mb-3">Foto de perfil</span>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            className="relative w-[200px] h-[200px] rounded-full overflow-hidden bg-rotary-blue/10 border-4 border-slate-200 cursor-pointer flex items-center justify-center hover:ring-4 hover:ring-rotary-gold transition-all flex-shrink-0"
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt="Tu foto" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl text-rotary-blue/60 font-semibold">
                {nombre.slice(0, 2).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={subirFoto}
            className="hidden"
          />
          <p className="text-[18px] text-slate-600 mt-2">Haz clic en el círculo para cambiar tu fotografía</p>
        </label>

        <label className="block">
          <span className="block text-[20px] font-semibold text-slate-800 mb-2">Nombre completo</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full min-h-[3.5rem] rounded-lg border border-slate-300 px-4 text-[20px]"
          />
        </label>

        <label className="block">
          <span className="block text-[20px] font-semibold text-slate-800 mb-2">
            Mote / Apodo (Cómo te gusta que te digan)
          </span>
          <input
            type="text"
            value={mote}
            onChange={(e) => setMote(e.target.value)}
            placeholder="Ej. El Compa, Pancho"
            className="w-full min-h-[4rem] rounded-lg border-2 border-rotary-blue/30 px-4 text-[22px] font-medium"
          />
        </label>

        <label className="block">
          <span className="block text-[20px] font-semibold text-slate-800 mb-2">Club Rotario</span>
          <input
            type="text"
            value={club}
            onChange={(e) => setClub(e.target.value)}
            placeholder="Ej. Rotario Campestre"
            className="w-full min-h-[3.5rem] rounded-lg border border-slate-300 px-4 text-[20px]"
          />
        </label>

        <label className="block">
          <span className="block text-[20px] font-semibold text-slate-800 mb-2">Cargo / Rol</span>
          <input
            type="text"
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            placeholder="Ej. Director de Proyectos"
            className="w-full min-h-[3.5rem] rounded-lg border border-slate-300 px-4 text-[20px]"
          />
        </label>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-full min-h-[4.5rem] rounded-xl bg-rotary-blue hover:bg-rotary-blue-dark text-white font-bold text-[22px] disabled:opacity-70 flex items-center justify-center"
        >
          {guardando ? "Actualizando…" : "ACTUALIZAR MI PERFIL"}
        </button>
      </div>
    </div>
  );
}
