"use client";

type ViewerRuntimeStatusBarProps = {
  componentCount: number;
  selectedCount: number;
};

export default function ViewerRuntimeStatusBar({
  componentCount,
  selectedCount,
}: ViewerRuntimeStatusBarProps) {
  return (
    <div className="border-b border-sky-400/10 bg-[#030911]/95 px-3 py-2">
      <div className="mx-auto flex max-w-[1900px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-300">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/15 px-3 py-1 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.12)]">Runtime stabile</span>
          <span className="rounded-full border border-sky-400/25 bg-sky-400/15 px-3 py-1 text-sky-200 shadow-[0_0_18px_rgba(56,189,248,0.12)]">{componentCount} componenti</span>
          <span className="rounded-full border border-violet-400/25 bg-violet-400/15 px-3 py-1 text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.12)]">{selectedCount} selezionati</span>
          <span className="rounded-full border border-amber-400/25 bg-amber-400/15 px-3 py-1 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.1)]">X-Ray</span>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <span>DAE / JSON</span>
          <span>PartId</span>
          <span>X-Ray</span>
          <span>Multi-select</span>
        </div>
      </div>
    </div>
  );
}
