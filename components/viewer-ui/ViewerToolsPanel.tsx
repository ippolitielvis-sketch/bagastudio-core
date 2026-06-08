"use client";

import DraggablePanel from "./DraggablePanel";

type CameraPresetViewId = "front" | "left" | "right" | "top" | "3d";

type ViewerToolsPanelProps = {
  xRayEnabled: boolean;
  xRayOpacity: number;
  onToggleXRay?: () => void;
  onChangeXRayOpacity?: (value: number) => void;
  contoursEnabled: boolean;
  onToggleContours: () => void;
  onFocus: () => void;
  onFit: () => void;
  onResetView: () => void;
  onSaveCameraPreset?: (viewId: CameraPresetViewId) => void;
  onApplyCameraPreset?: (viewId: CameraPresetViewId) => void;
};

const CAMERA_PRESET_VIEWS: Array<{ id: CameraPresetViewId; label: string }> = [
  { id: "front", label: "FR" },
  { id: "left", label: "SX" },
  { id: "right", label: "DX" },
  { id: "top", label: "TOP" },
  { id: "3d", label: "3D" },
];

function ToolToggle({
  label,
  note,
  active,
  onClick,
  disabled = false,
}: {
  label: string;
  note: string;
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`rounded-2xl border p-3 text-left transition ${
        disabled
          ? "cursor-not-allowed border-slate-700/60 bg-slate-950/55 text-slate-500"
          : active
            ? "border-cyan-300/35 bg-cyan-400/14 text-cyan-50 hover:bg-cyan-400/22"
            : "border-slate-600/55 bg-slate-900/70 text-slate-300 hover:border-cyan-300/25 hover:bg-slate-800/80"
      }`}
    >
      <span className="block text-[9px] font-black uppercase tracking-[0.14em] opacity-70">
        {active ? "ON" : "OFF"}
      </span>
      <span className="block text-sm font-black uppercase tracking-wide">{label}</span>
      <span className="mt-1 block text-[9px] leading-snug text-slate-400">{note}</span>
    </button>
  );
}

function CameraPresetButton({
  label,
  onClick,
  tone = "cyan",
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  tone?: "cyan" | "emerald";
  disabled?: boolean;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-300/22 bg-emerald-500/12 text-emerald-50 hover:bg-emerald-400/22"
      : "border-cyan-300/22 bg-cyan-500/12 text-cyan-50 hover:bg-cyan-400/22";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`rounded-xl border px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.12em] transition ${
        disabled ? "cursor-not-allowed border-slate-700/60 bg-slate-950/50 text-slate-500" : toneClass
      }`}
    >
      {label}
    </button>
  );
}

export default function ViewerToolsPanel({
  xRayEnabled,
  xRayOpacity,
  onToggleXRay,
  onChangeXRayOpacity,
  contoursEnabled,
  onToggleContours,
  onFocus,
  onFit,
  onResetView,
  onSaveCameraPreset,
  onApplyCameraPreset,
}: ViewerToolsPanelProps) {
  const xRayDisabled = !onToggleXRay || !onChangeXRayOpacity;
  const cameraPresetDisabled = !onSaveCameraPreset || !onApplyCameraPreset;

  return (
    <DraggablePanel
      id="viewer-tools-panel-v45b"
      eyebrow="Vista"
      title="Viewer Tools"
      defaultPosition={{ x: 18, y: 585 }}
      widthClassName="w-[320px]"
      zIndex={69}
    >
      <div className="space-y-4 text-xs text-slate-100">
        <div className="grid grid-cols-2 gap-2">
          <ToolToggle
            label="X-Ray"
            note={xRayDisabled ? "Collega page.tsx per controllo diretto." : `${Math.round(xRayOpacity * 100)}% opacità`}
            active={xRayEnabled}
            onClick={onToggleXRay}
            disabled={xRayDisabled}
          />
          <ToolToggle
            label="Contorni"
            note="Bordi e silhouette modello."
            active={contoursEnabled}
            onClick={onToggleContours}
          />
          <ToolToggle
            label="Highlight"
            note="Selezione pezzi attiva."
            active={true}
            disabled
          />
        </div>

        {!xRayDisabled && (
          <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/55 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
              <span>Opacità X-Ray</span>
              <span>{Math.round(xRayOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.08}
              max={0.9}
              step={0.01}
              value={xRayOpacity}
              onChange={(event) => onChangeXRayOpacity?.(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onFocus}
            className="rounded-xl border border-cyan-300/20 bg-cyan-500/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50 hover:bg-cyan-400/22"
          >
            Focus
          </button>
          <button
            type="button"
            onClick={onFit}
            className="rounded-xl border border-emerald-300/20 bg-emerald-500/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-50 hover:bg-emerald-400/20"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={onResetView}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 hover:bg-white/10"
          >
            Reset
          </button>
        </div>

        <div className="rounded-2xl border border-cyan-300/16 bg-cyan-400/8 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Camera Preset</div>
              <div className="mt-1 text-[9px] font-semibold leading-snug text-slate-400">
                Salva la vista corrente o richiama una vista calibrata.
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-300">
              V1
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {CAMERA_PRESET_VIEWS.map((view) => (
              <CameraPresetButton
                key={`apply-${view.id}`}
                label={view.label}
                onClick={() => onApplyCameraPreset?.(view.id)}
                disabled={cameraPresetDisabled}
              />
            ))}
          </div>

          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {CAMERA_PRESET_VIEWS.map((view) => (
              <CameraPresetButton
                key={`save-${view.id}`}
                label={`Salva ${view.label}`}
                tone="emerald"
                onClick={() => onSaveCameraPreset?.(view.id)}
                disabled={cameraPresetDisabled}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/16 bg-amber-400/10 p-3 text-[10px] leading-snug text-amber-50">
          Pannello unico per strumenti vista. Drag & Drop modulo e Undo/Redo arriveranno in step separati.
        </div>
      </div>
    </DraggablePanel>
  );
}
