"use client";

export default function RoomOrientationOverlay() {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-40 select-none">
      <div className="relative h-[118px] w-[118px] opacity-75">
        <div className="absolute inset-0 rounded-full border border-cyan-300/15 bg-slate-950/20 backdrop-blur-[2px]" />

        <div className="absolute left-1/2 top-[12px] -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.22em] text-cyan-100/80">
          Fondo
        </div>

        <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.22em] text-cyan-100/80">
          Fronte
        </div>

        <div className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/75">
          SX
        </div>

        <div className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/75">
          DX
        </div>

        <div className="absolute left-1/2 top-[31px] h-[56px] w-px -translate-x-1/2 bg-cyan-300/25" />
        <div className="absolute left-[31px] top-1/2 h-px w-[56px] -translate-y-1/2 bg-cyan-300/25" />

        <div className="absolute left-1/2 top-[30px] -translate-x-1/2 text-[12px] font-black leading-none text-cyan-200/70">
          ↑
        </div>
        <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 text-[12px] font-black leading-none text-cyan-200/70">
          ↓
        </div>
        <div className="absolute left-[30px] top-1/2 -translate-y-1/2 text-[12px] font-black leading-none text-cyan-200/70">
          ←
        </div>
        <div className="absolute right-[30px] top-1/2 -translate-y-1/2 text-[12px] font-black leading-none text-cyan-200/70">
          →
        </div>

        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-cyan-200/85 shadow-[0_0_14px_rgba(103,232,249,0.35)]" />
        <div className="absolute left-1/2 top-1/2 h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />
      </div>
    </div>
  );
}
