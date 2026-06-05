"use client";

export default function RoomOrientationOverlay() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-3xl border border-cyan-300/20 bg-slate-950/58 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
      <div className="grid w-[210px] grid-cols-3 grid-rows-3 items-center gap-1 text-center">
        <div />
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-2 py-1.5">Fondo ↑</div>
        <div />
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-2 py-1.5">← SX</div>
        <div className="rounded-full border border-white/15 bg-white/10 px-2 py-2 text-white">Stanza</div>
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-2 py-1.5">DX →</div>
        <div />
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-2 py-1.5">Fronte ↓</div>
        <div />
      </div>
    </div>
  );
}
