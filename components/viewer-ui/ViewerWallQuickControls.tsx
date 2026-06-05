"use client";

type ViewerWallQuickVisibility = {
  backWall: boolean;
  leftWall: boolean;
  rightWall: boolean;
  ceiling: boolean;
};

type ViewerWallQuickControlsProps = {
  visibility: ViewerWallQuickVisibility;
  onToggle: (key: keyof ViewerWallQuickVisibility) => void;
  onReset: () => void;
};

const WALL_QUICK_ITEMS: Array<{ key: keyof ViewerWallQuickVisibility; label: string; shortLabel: string }> = [
  { key: "backWall", label: "Parete fondo", shortLabel: "Fondo" },
  { key: "leftWall", label: "Parete sinistra", shortLabel: "SX" },
  { key: "rightWall", label: "Parete destra", shortLabel: "DX" },
  { key: "ceiling", label: "Soffitto", shortLabel: "Top" },
];

export default function ViewerWallQuickControls({
  visibility,
  onToggle,
  onReset,
}: ViewerWallQuickControlsProps) {
  return (
    <div className="absolute right-[292px] top-[7.25rem] z-30 w-[210px] rounded-2xl border border-cyan-400/20 bg-slate-950/68 p-3 text-[10px] font-black text-slate-100 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="uppercase tracking-[0.2em] text-cyan-200">Pareti</div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Quick view</div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide text-slate-200 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
          title="Riaccendi tutte le pareti"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {WALL_QUICK_ITEMS.map((item) => {
          const isVisible = visibility[item.key];

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onToggle(item.key)}
              className={`rounded-xl border px-2 py-2 text-left transition ${
                isVisible
                  ? "border-emerald-300/35 bg-emerald-500/12 text-emerald-50 hover:bg-emerald-400/20"
                  : "border-red-300/30 bg-red-950/42 text-red-100 hover:bg-red-900/55"
              }`}
              title={`${isVisible ? "Spegni" : "Accendi"} ${item.label}`}
            >
              <span className="block text-[9px] uppercase tracking-[0.13em] opacity-70">
                {isVisible ? "ON" : "OFF"}
              </span>
              <span className="block text-xs font-black uppercase tracking-wide">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-[9px] leading-snug text-slate-400">
        Nasconde solo la vista della stanza. Collisioni e snap restano attivi.
      </div>
    </div>
  );
}
