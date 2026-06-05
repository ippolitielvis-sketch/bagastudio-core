"use client";

type ComponentSearchProps = {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  visibleCount: number;
};

export default function ComponentSearch({ value, onChange, totalCount, visibleCount }: ComponentSearchProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
      <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-[#050c14] px-3 py-2">
        <span className="text-xs text-cyan-200">🔎</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Cerca pezzo o modulo..."
          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-neutral-500"
        />
        {value.trim() && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-300 hover:border-cyan-300/40 hover:text-white"
          >
            reset
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
        <span>{visibleCount} visibili</span>
        <span>{totalCount} totali</span>
      </div>
    </div>
  );
}
