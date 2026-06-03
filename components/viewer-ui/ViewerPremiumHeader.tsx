"use client";

type LanguageCode = "it" | "en";
type ViewerPanel = "config" | "materials" | "accessories" | "views" | "save" | "produce" | "help" | "admin";

type ViewerPremiumHeaderProps = {
  t: any;
  language: LanguageCode;
  activePanel: ViewerPanel;
  totalPrice: number;
  onOpenLogo: () => void;
  onAdminPanel: () => void;
  onLanguageChange: (language: LanguageCode) => void;
  onPanelChange: (panel: ViewerPanel) => void;
  onSave: () => void;
  onExport: () => void;
  onQuote: () => void;
};

export default function ViewerPremiumHeader({
  t,
  language,
  activePanel,
  totalPrice,
  onOpenLogo,
  onAdminPanel,
  onLanguageChange,
  onPanelChange,
  onSave,
  onExport,
  onQuote,
}: ViewerPremiumHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-sky-400/20 bg-[#030b13]/90 px-3 py-2 backdrop-blur-2xl shadow-[0_18px_70px_rgba(0,0,0,0.42)]">
      <div className="rounded-[26px] border border-sky-400/20 bg-gradient-to-r from-[#05131f]/95 via-[#07111c]/95 to-[#03101b]/95 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_45px_rgba(14,165,233,0.08)]">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-[220px] items-center gap-4">
            <button
              type="button"
              onClick={onOpenLogo}
              title={t.openLogo}
              className="group rounded-2xl border border-transparent p-1 transition hover:border-sky-400/30 hover:bg-sky-400/5"
            >
              <img
                src="/bagastudio-core-brand.png"
                alt="BagaStudio Core"
                className="h-14 w-auto shrink-0 object-contain drop-shadow-[0_0_28px_rgba(14,165,233,0.46)] transition group-hover:scale-[1.045]"
              />
            </button>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-1 xl:flex">
            {[
              ["⬡", t.configurator],
              ["◉", t.realisticRender],
              ["AR", t.ar],
              ["▤", t.quotes],
            ].map((item, index) => (
              <div
                key={item[1]}
                className={`flex min-w-[124px] flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
                  index === 0
                    ? "border-sky-400/20 bg-sky-500/10"
                    : index === 1
                    ? "border-cyan-400/20 bg-cyan-500/10"
                    : index === 2
                    ? "border-violet-400/20 bg-violet-500/10"
                    : "border-emerald-400/20 bg-emerald-500/10"
                }`}
              >
                <div className="text-lg font-black text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.35)]">
                  {item[0]}
                </div>
                <div className="text-center text-[11px] font-bold tracking-wide text-neutral-200">
                  {item[1]}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-sky-300/25 bg-sky-500/10 px-4 py-2 shadow-[0_0_25px_rgba(14,165,233,0.16)]">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-300">{t.totalPrice}</p>
              <p className="mt-0 text-[26px] font-black leading-none text-sky-300 drop-shadow-[0_0_15px_rgba(14,165,233,0.32)]">
                € {totalPrice.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-400">{t.vatIncluded}</p>
            </div>

            <div
              onClick={onAdminPanel}
              className="cursor-pointer rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-black/40 px-4 py-2 shadow-[0_0_18px_rgba(14,165,233,0.08)] transition hover:border-sky-400/40 hover:shadow-[0_0_24px_rgba(14,165,233,0.18)]"
            >
              <div className="text-[10px] font-bold tracking-[0.35em] text-sky-400">
                BAGASTUDIO CORE
              </div>

              <h3 className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                ⚙ {t.adminPanel}
              </h3>

              <p className="hidden">
                {t.adminPanelDescription}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">{t.language}</span>
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}
                className="rounded-xl border border-sky-500/30 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none"
              >
                <option className="bg-slate-950 text-white" value="it">
                  {t.italian}
                </option>
                <option className="bg-slate-950 text-white" value="en">
                  {t.english}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            {([
              ["config", "↧", "CARICA"],
              ["materials", "▧", "CONFIGURA"],
              ["accessories", "✦", "ACCESSORI"],
              ["views", "◱", t.views],
              ["save", "✓", "SALVA"],
              ["produce", "▤", "PRODUCI"],
              ["help", "?", "AIUTO"],
              ["admin", "⚙", t.studioTools],
            ] as Array<[ViewerPanel, string, string]>).map((tab) => (
              <button
                key={tab[0]}
                onClick={() => onPanelChange(tab[0])}
                className={`rounded-2xl px-4 py-2.5 text-sm font-black tracking-wide transition ${
                  activePanel === tab[0]
                    ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 text-white shadow-[0_0_28px_rgba(14,165,233,0.42)]"
                    : "bg-white/[0.045] text-neutral-300 hover:bg-sky-500/10 hover:text-white"
                }`}
              >
                <span className="mr-2">{tab[1]}</span>{tab[2]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onSave} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-neutral-200 hover:bg-white/[0.08]">
              {t.save}
            </button>
            <button onClick={onExport} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-neutral-200 hover:bg-white/[0.08]">
              {t.export}
            </button>
            <button onClick={onQuote} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-white shadow-[0_0_22px_rgba(14,165,233,0.35)] hover:bg-sky-400">
              {t.quote}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
