export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-6">
      <div
        className="w-16 h-16 border-4 border-rotary-blue border-t-transparent rounded-full animate-spin"
        aria-hidden
      />
      <p className="text-[22px] font-semibold text-slate-800">Cargando tu acceso…</p>
    </div>
  );
}
