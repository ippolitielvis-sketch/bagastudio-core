"use client";

import { useEffect, useMemo, useState } from "react";
import DraggablePanel from "./DraggablePanel";
import type { RoomEnvironmentSettings } from "../viewer/RoomEnvironment";

type RoomQuickVisibility = {
  backWall: boolean;
  leftWall: boolean;
  rightWall: boolean;
  ceiling: boolean;
};

type RoomPanelDraft = {
  roomWidthCm: number;
  roomDepthCm: number;
  roomHeightCm: number;
  baseboardHeightCm: number;
  baseboardDepthCm: number;
};

type RoomPanelProps = {
  environment?: RoomEnvironmentSettings;
  visibility: RoomQuickVisibility;
  roomVisible: boolean;
  onToggleRoomVisible: () => void;
  onToggleWall: (key: keyof RoomQuickVisibility) => void;
  onResetWalls: () => void;
  onApplyRoom: (settings: RoomPanelDraft) => void;
  onResetRoom: () => void;
};

const clampRoomValue = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const buildDraftFromEnvironment = (environment?: RoomEnvironmentSettings): RoomPanelDraft => ({
  roomWidthCm: clampRoomValue(Number(environment?.roomWidthCm || 420), 120, 2000),
  roomDepthCm: clampRoomValue(Number(environment?.roomDepthCm || 360), 120, 2000),
  roomHeightCm: clampRoomValue(Number(environment?.roomHeightCm || 280), 180, 600),
  baseboardHeightCm: 10,
  baseboardDepthCm: 2,
});

const WALL_ITEMS: Array<{ key: keyof RoomQuickVisibility; label: string; note: string }> = [
  { key: "backWall", label: "Fondo", note: "parete tecnica" },
  { key: "leftWall", label: "SX", note: "lato stanza" },
  { key: "rightWall", label: "DX", note: "lato stanza" },
  { key: "ceiling", label: "Soffitto", note: "volume alto" },
];

export default function RoomPanel({
  environment,
  visibility,
  roomVisible,
  onToggleRoomVisible,
  onToggleWall,
  onResetWalls,
  onApplyRoom,
  onResetRoom,
}: RoomPanelProps) {
  const [activeTab, setActiveTab] = useState<"room" | "walls" | "baseboard">("room");
  const [draft, setDraft] = useState<RoomPanelDraft>(() => buildDraftFromEnvironment(environment));

  useEffect(() => {
    setDraft(buildDraftFromEnvironment(environment));
  }, [environment?.roomWidthCm, environment?.roomDepthCm, environment?.roomHeightCm]);

  const roomSummary = useMemo(
    () => `${draft.roomWidthCm} × ${draft.roomDepthCm} × ${draft.roomHeightCm} cm`,
    [draft.roomWidthCm, draft.roomDepthCm, draft.roomHeightCm]
  );

  const updateDraft = (key: keyof RoomPanelDraft, value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;

    setDraft((current) => ({
      ...current,
      [key]: parsed,
    }));
  };

  const applyRoom = () => {
    onApplyRoom({
      roomWidthCm: clampRoomValue(draft.roomWidthCm, 120, 2000),
      roomDepthCm: clampRoomValue(draft.roomDepthCm, 120, 2000),
      roomHeightCm: clampRoomValue(draft.roomHeightCm, 180, 600),
      baseboardHeightCm: clampRoomValue(draft.baseboardHeightCm, 0, 60),
      baseboardDepthCm: clampRoomValue(draft.baseboardDepthCm, 0, 40),
    });
  };

  const resetRoom = () => {
    const next = buildDraftFromEnvironment(undefined);
    setDraft(next);
    onResetRoom();
  };

  return (
    <DraggablePanel
      id="room-panel-premium-v44"
      eyebrow="Ambiente"
      title="Room Panel Premium"
      defaultPosition={{ x: 18, y: 210 }}
      widthClassName="w-[340px]"
      zIndex={68}
    >
      <div className="space-y-4 text-xs text-slate-100">
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/8 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Stanza attiva</div>
          <div className="mt-1 text-lg font-black text-white">{roomSummary}</div>
          <div className="mt-1 text-[10px] leading-snug text-slate-400">
            Collisioni, snap e future quotature useranno queste misure.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-slate-900/60 p-1">
          {[
            ["room", "Stanza"],
            ["walls", "Pareti"],
            ["baseboard", "Battiscopa"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`rounded-xl px-2 py-2 text-[9px] font-black uppercase tracking-[0.1em] transition ${
                activeTab === key
                  ? "bg-cyan-400/18 text-cyan-50 ring-1 ring-cyan-300/35"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "room" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onToggleRoomVisible}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                roomVisible
                  ? "border-emerald-300/35 bg-emerald-400/12 text-emerald-50 hover:bg-emerald-400/20"
                  : "border-red-300/30 bg-red-950/42 text-red-100 hover:bg-red-900/55"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-[0.14em] opacity-70">
                    {roomVisible ? "ON" : "OFF"}
                  </span>
                  <span className="block text-sm font-black uppercase tracking-wide">Stanza visibile</span>
                  <span className="mt-1 block text-[9px] leading-snug text-slate-400">
                    Spegne/accende pavimento, pareti, soffitto e battiscopa nel Viewer.
                  </span>
                </div>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide">
                  {roomVisible ? "Accesa" : "Spenta"}
                </span>
              </div>
            </button>

            <div className="grid grid-cols-3 gap-2">
              {[
                ["roomWidthCm", "Larghezza", 10],
                ["roomDepthCm", "Profondità", 10],
                ["roomHeightCm", "Altezza", 5],
              ].map(([key, label, step]) => (
                <label key={key as string} className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
                  <input
                    type="number"
                    value={draft[key as keyof RoomPanelDraft]}
                    step={step as number}
                    onChange={(event) => updateDraft(key as keyof RoomPanelDraft, event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs font-black text-white outline-none transition focus:border-cyan-300/60"
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetRoom}
                className="flex-1 rounded-xl border border-slate-600/70 bg-slate-900/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 hover:bg-slate-800"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyRoom}
                className="flex-1 rounded-xl border border-cyan-300/35 bg-cyan-500/18 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50 hover:bg-cyan-400/24"
              >
                Applica
              </button>
            </div>
          </div>
        )}

        {activeTab === "walls" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {WALL_ITEMS.map((item) => {
                const visible = visibility[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onToggleWall(item.key)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      visible
                        ? "border-emerald-300/35 bg-emerald-400/12 text-emerald-50 hover:bg-emerald-400/20"
                        : "border-red-300/30 bg-red-950/42 text-red-100 hover:bg-red-900/55"
                    }`}
                  >
                    <span className="block text-[9px] font-black uppercase tracking-[0.14em] opacity-70">
                      {visible ? "ON" : "OFF"}
                    </span>
                    <span className="block text-sm font-black uppercase tracking-wide">{item.label}</span>
                    <span className="mt-1 block text-[9px] text-slate-400">{item.note}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onResetWalls}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 hover:bg-cyan-400/10"
            >
              Riaccendi tutte le pareti
            </button>
            <div className="rounded-2xl border border-amber-300/18 bg-amber-400/10 p-3 text-[10px] leading-snug text-amber-50">
              Parete frontale: prevista nel Room Constraint Engine, utile per blocco rotazioni e schede tecniche.
            </div>
          </div>
        )}

        {activeTab === "baseboard" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["baseboardHeightCm", "Altezza", 1],
                ["baseboardDepthCm", "Profondità", 0.5],
              ].map(([key, label, step]) => (
                <label key={key as string} className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
                  <input
                    type="number"
                    value={draft[key as keyof RoomPanelDraft]}
                    step={step as number}
                    onChange={(event) => updateDraft(key as keyof RoomPanelDraft, event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs font-black text-white outline-none transition focus:border-cyan-300/60"
                  />
                </label>
              ))}
            </div>
            <div className="rounded-2xl border border-amber-300/18 bg-amber-400/10 p-3 text-[10px] leading-snug text-amber-50">
              V1 salva i valori. V2 userà il battiscopa per snap, collisioni, scassi e avvisi tecnici.
            </div>
          </div>
        )}


      </div>
    </DraggablePanel>
  );
}
