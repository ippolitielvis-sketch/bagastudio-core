"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, MouseEvent, PointerEvent, SetStateAction } from "react";

type WallSnapTarget = "back" | "front" | "left" | "right" | "center";
type WallSnapDistanceMode = "touch" | "5" | "10" | "custom";

type SceneComposerPanelProps = {
  modelSceneOffset: { x: number; z: number; rotationYDeg?: number };
  resetModelRoomPosition: () => void;
  moveModelInRoom: (deltaX?: number, deltaZ?: number) => void;
  rotateModelInRoom: (deltaRotationYDeg?: number) => void;
  activeWallSnap: WallSnapTarget | null;
  wallSnapDistanceMode: WallSnapDistanceMode;
  setWallSnapDistanceMode: Dispatch<SetStateAction<WallSnapDistanceMode>>;
  customWallSnapDistanceCm: number;
  setCustomWallSnapDistanceCm: Dispatch<SetStateAction<number>>;
  getWallSnapModeLabel: () => string;
  snapModelToWall: (wall: WallSnapTarget) => void;
  sceneModulesV38: any[];
  activeSceneModuleIdV38: string;
  selectSceneModuleV38: (moduleId: string) => void;
  addSceneModuleSnapshotV38: () => void;
  duplicateActiveSceneModuleV42: () => void;
  deleteActiveSceneModuleV42: () => void;
};

export default function SceneComposerPanel({
  modelSceneOffset,
  resetModelRoomPosition,
  moveModelInRoom,
  rotateModelInRoom,
  activeWallSnap,
  wallSnapDistanceMode,
  setWallSnapDistanceMode,
  customWallSnapDistanceCm,
  setCustomWallSnapDistanceCm,
  getWallSnapModeLabel,
  snapModelToWall,
  sceneModulesV38,
  activeSceneModuleIdV38,
  selectSceneModuleV38,
  addSceneModuleSnapshotV38,
  duplicateActiveSceneModuleV42,
  deleteActiveSceneModuleV42,
}: SceneComposerPanelProps) {
  const holdMoveTimerRef = useRef<number | null>(null);
  const stopHoldMove = useCallback(() => {
    if (holdMoveTimerRef.current !== null) {
      window.clearInterval(holdMoveTimerRef.current);
      holdMoveTimerRef.current = null;
    }
  }, []);

  const startHoldMove = useCallback((deltaX = 0, deltaZ = 0) => {
    stopHoldMove();
    moveModelInRoom(deltaX, deltaZ);
    holdMoveTimerRef.current = window.setInterval(() => {
      moveModelInRoom(deltaX, deltaZ);
    }, 130);
  }, [moveModelInRoom, stopHoldMove]);

  useEffect(() => {
    window.addEventListener("mouseup", stopHoldMove);
    window.addEventListener("pointerup", stopHoldMove);
    window.addEventListener("blur", stopHoldMove);
    return () => {
      window.removeEventListener("mouseup", stopHoldMove);
      window.removeEventListener("pointerup", stopHoldMove);
      window.removeEventListener("blur", stopHoldMove);
      stopHoldMove();
    };
  }, [stopHoldMove]);

  const getHoldMoveButtonProps = (deltaX = 0, deltaZ = 0) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      startHoldMove(deltaX, deltaZ);
    },
    onPointerUp: stopHoldMove,
    onPointerLeave: stopHoldMove,
    onPointerCancel: stopHoldMove,
    onClick: (event: MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  return (
<div className="absolute bottom-24 right-4 z-30 w-[260px] rounded-[24px] border border-emerald-400/20 bg-slate-950/78 p-3 text-[10px] font-black text-slate-100 shadow-2xl shadow-emerald-950/25 backdrop-blur-xl">
  <div className="mb-2 flex items-center justify-between gap-2">
    <div>
      <span className="block uppercase tracking-[0.18em] text-emerald-200">Muovi modulo</span>
      <span className="block text-[8px] uppercase tracking-[0.12em] text-slate-500">Scene V42</span>
    </div>
    <button
      type="button"
      onClick={resetModelRoomPosition}
      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide text-slate-200 transition hover:border-emerald-300/45 hover:bg-emerald-400/10"
      title="Riporta il modulo vicino alla parete"
    >
      Reset
    </button>
  </div>

  <div className="mb-2 rounded-2xl border border-cyan-300/15 bg-cyan-950/15 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100">
    <div className="flex items-center justify-between gap-2">
      <span>Orientamento stanza</span>
      <span className="text-emerald-200">Fondo ↑ · Fronte ↓</span>
    </div>
    <div className="mt-1 text-[8px] font-bold normal-case tracking-normal text-slate-400">
      I comandi seguono gli assi della stanza, non la camera. Anche se ruoti la vista, Fondo/Fronte/SX/DX restano coerenti.
    </div>
  </div>

  <div className="grid grid-cols-3 gap-1">
    <span />
    <button
      type="button"
      {...getHoldMoveButtonProps(0, -0.16)}
      className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/10"
      title="Verso parete di fondo"
    >
      <span className="block text-base leading-none">↑</span>
      <span className="mt-1 block text-[8px] uppercase tracking-[0.12em] text-slate-300">Fondo</span>
    </button>
    <span />
    <button
      type="button"
      {...getHoldMoveButtonProps(-0.16, 0)}
      className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/10"
      title="Verso lato sinistro stanza"
    >
      <span className="block text-base leading-none">←</span>
      <span className="mt-1 block text-[8px] uppercase tracking-[0.12em] text-slate-300">SX stanza</span>
    </button>
    <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-2 py-2 text-center text-[9px] text-emerald-100">
      <span className="block text-[8px] uppercase tracking-[0.12em] text-emerald-200">Modulo</span>
      X {modelSceneOffset.x.toFixed(1)}<br />Z {modelSceneOffset.z.toFixed(1)}
    </div>
    <button
      type="button"
      {...getHoldMoveButtonProps(0.16, 0)}
      className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/10"
      title="Verso lato destro stanza"
    >
      <span className="block text-base leading-none">→</span>
      <span className="mt-1 block text-[8px] uppercase tracking-[0.12em] text-slate-300">DX stanza</span>
    </button>
    <span />
    <button
      type="button"
      {...getHoldMoveButtonProps(0, 0.16)}
      className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/10"
      title="Verso fronte / ingresso stanza"
    >
      <span className="block text-base leading-none">↓</span>
      <span className="mt-1 block text-[8px] uppercase tracking-[0.12em] text-slate-300">Fronte</span>
    </button>
    <span />
  </div>

  <div className="mt-2 grid grid-cols-3 gap-1">
    <button
      type="button"
      onClick={() => rotateModelInRoom(-15)}
      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
      title="Ruota modulo a sinistra"
    >
      ↺
    </button>
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-1.5 text-center text-[9px] text-cyan-100">
      R {Math.round(modelSceneOffset.rotationYDeg || 0)}°
    </div>
    <button
      type="button"
      onClick={() => rotateModelInRoom(15)}
      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
      title="Ruota modulo a destra"
    >
      ↻
    </button>
  </div>

  <div className="mt-3 rounded-[22px] border border-emerald-400/25 bg-[#07111c]/90 p-3 shadow-[0_18px_46px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.05)]">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-base text-emerald-200">⌁</span>
        <div>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-emerald-100">Snap parete</span>
          <span className="block text-[9px] font-semibold normal-case tracking-normal text-slate-400">
            {activeWallSnap ? `Parete: ${activeWallSnap}` : "Seleziona lato"}
          </span>
        </div>
      </div>
      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-100">
        {getWallSnapModeLabel()}
      </span>
    </div>

    <div className="space-y-1.5">
      {[
        ["touch", "Appoggiato", "0.5 cm"],
        ["5", "5 cm", ""],
        ["10", "10 cm", ""],
      ].map(([mode, label, value]) => {
        const isActiveMode = wallSnapDistanceMode === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setWallSnapDistanceMode(mode as "touch" | "5" | "10")}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-[12px] transition ${
              isActiveMode
                ? "border-emerald-300/70 bg-emerald-400/12 text-white shadow-[0_0_18px_rgba(16,185,129,0.12)]"
                : "border-white/10 bg-white/[0.035] text-slate-200 hover:border-emerald-300/35 hover:bg-emerald-400/8"
            }`}
          >
            <span className="font-bold">{label}</span>
            {value && (
              <span className="rounded-lg border border-emerald-300/30 bg-black/20 px-2 py-0.5 text-[11px] font-black text-emerald-100">
                {value}
              </span>
            )}
          </button>
        );
      })}

      <div
        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
          wallSnapDistanceMode === "custom"
            ? "border-emerald-300/70 bg-emerald-400/12"
            : "border-white/10 bg-white/[0.035]"
        }`}
      >
        <button
          type="button"
          onClick={() => setWallSnapDistanceMode("custom")}
          className="text-left text-[12px] font-bold text-slate-100"
        >
          Personalizzato
        </button>
        <label className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/25 px-2 py-1">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={customWallSnapDistanceCm}
            onChange={(event) => {
              setCustomWallSnapDistanceCm(Number(event.target.value));
              setWallSnapDistanceMode("custom");
            }}
            className="w-12 bg-transparent text-right text-[11px] font-black text-emerald-100 outline-none"
          />
          <span className="text-[10px] font-bold text-slate-400">cm</span>
        </label>
      </div>
    </div>

    <div className="mt-3 grid grid-cols-3 gap-1.5">
      <span />
      <button
        type="button"
        onClick={() => snapModelToWall("back")}
        className={`rounded-xl border px-2 py-2 text-[9px] uppercase tracking-wide transition ${
          activeWallSnap === "back"
            ? "border-emerald-200/75 bg-emerald-400/22 text-white"
            : "border-emerald-300/20 bg-emerald-400/8 text-emerald-100 hover:border-emerald-200/60 hover:bg-emerald-400/16"
        }`}
        title="Aggancia alla parete di fondo"
      >
        Fondo
      </button>
      <span />
      <button
        type="button"
        onClick={() => snapModelToWall("left")}
        className={`rounded-xl border px-2 py-2 text-[9px] uppercase tracking-wide transition ${
          activeWallSnap === "left"
            ? "border-emerald-200/75 bg-emerald-400/22 text-white"
            : "border-emerald-300/20 bg-emerald-400/8 text-emerald-100 hover:border-emerald-200/60 hover:bg-emerald-400/16"
        }`}
        title="Aggancia alla parete sinistra"
      >
        SX
      </button>
      <button
        type="button"
        onClick={() => snapModelToWall("center")}
        className={`rounded-xl border px-2 py-2 text-[9px] uppercase tracking-wide transition ${
          activeWallSnap === "center"
            ? "border-emerald-200/75 bg-emerald-400/22 text-white"
            : "border-emerald-300/20 bg-emerald-400/8 text-emerald-100 hover:border-emerald-200/60 hover:bg-emerald-400/16"
        }`}
        title="Riporta il modulo al centro stanza"
      >
        Centro
      </button>
      <button
        type="button"
        onClick={() => snapModelToWall("right")}
        className={`rounded-xl border px-2 py-2 text-[9px] uppercase tracking-wide transition ${
          activeWallSnap === "right"
            ? "border-emerald-200/75 bg-emerald-400/22 text-white"
            : "border-emerald-300/20 bg-emerald-400/8 text-emerald-100 hover:border-emerald-200/60 hover:bg-emerald-400/16"
        }`}
        title="Aggancia alla parete destra"
      >
        DX
      </button>
      <span />
      <button
        type="button"
        onClick={() => snapModelToWall("front")}
        className={`rounded-xl border px-2 py-2 text-[9px] uppercase tracking-wide transition ${
          activeWallSnap === "front"
            ? "border-emerald-200/75 bg-emerald-400/22 text-white"
            : "border-emerald-300/20 bg-emerald-400/8 text-emerald-100 hover:border-emerald-200/60 hover:bg-emerald-400/16"
        }`}
        title="Aggancia alla parete frontale"
      >
        Fronte
      </button>
      <span />
    </div>

    <p className="mt-2 text-[9px] font-semibold leading-snug text-slate-400">
      Distanza del modulo dalla parete sul lato selezionato.
    </p>
  </div>

  <div className="mt-2 rounded-xl border border-violet-300/15 bg-violet-400/[0.055] p-1.5">
    <div className="mb-1 flex items-center justify-between gap-2 px-1">
      <span className="text-[8px] font-black uppercase tracking-[0.16em] text-violet-100">Moduli scena V42</span>
      <span className="text-[8px] font-bold uppercase tracking-wide text-slate-500">
        {sceneModulesV38.length} mod.
      </span>
    </div>

    <div className="mb-1 max-h-[70px] space-y-1 overflow-auto pr-1">
      {sceneModulesV38.map((module) => (
        <button
          key={module.id}
          type="button"
          onClick={() => selectSceneModuleV38(module.id)}
          className={`w-full rounded-lg border px-2 py-1 text-left text-[9px] transition ${
            activeSceneModuleIdV38 === module.id
              ? "border-violet-200/70 bg-violet-400/25 text-white"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-violet-200/50 hover:bg-violet-400/12"
          }`}
          title="Seleziona modulo scena"
        >
          <span className="block truncate font-black">{module.name}</span>
          <span className="block truncate text-[8px] text-slate-500">
            X {Number(module.transform?.x || 0).toFixed(1)} · Z {Number(module.transform?.z || 0).toFixed(1)} · R {Math.round(Number(module.transform?.rotationYDeg || 0))}°
          </span>
        </button>
      ))}
    </div>

    <div className="grid grid-cols-3 gap-1">
      <button
        type="button"
        onClick={addSceneModuleSnapshotV38}
        className="rounded-lg border border-violet-300/20 bg-violet-400/10 px-2 py-1.5 text-[9px] uppercase tracking-wide text-violet-100 transition hover:border-violet-200/60 hover:bg-violet-400/18"
        title="Crea un nuovo modulo scena dalla posizione corrente"
      >
        + Nuovo
      </button>
      <button
        type="button"
        onClick={duplicateActiveSceneModuleV42}
        className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-1.5 text-[9px] uppercase tracking-wide text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-400/18"
        title="Duplica il modulo attivo con posizione indipendente"
      >
        Duplica
      </button>
      <button
        type="button"
        onClick={deleteActiveSceneModuleV42}
        disabled={sceneModulesV38.length <= 1}
        className="rounded-lg border border-red-300/20 bg-red-400/10 px-2 py-1.5 text-[9px] uppercase tracking-wide text-red-100 transition hover:border-red-200/60 hover:bg-red-400/18 disabled:cursor-not-allowed disabled:opacity-35"
        title="Elimina il modulo attivo"
      >
        Elimina
      </button>
    </div>
  </div>
</div>  );
}
