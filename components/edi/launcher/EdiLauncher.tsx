"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EdiCoreSphere from "./EdiCoreSphere";
import BlueprintMiniLayer from "./layers/BlueprintMiniLayer";
import EnergyPulseLayer from "./layers/EnergyPulseLayer";

const EDI_LAUNCHER_POSITION_KEY = "bagastudio:edi-launcher-position-v1";
const EDI_LAUNCHER_MARGIN = 12;
const EDI_LAUNCHER_DRAG_THRESHOLD = 5;
const EDI_LAUNCHER_DOCK_THRESHOLD = 48;

type EdiLauncherPosition = { left: number; top: number };
type EdiLauncherDock = "left" | "right" | "top" | "bottom" | null;
type EdiLauncherProps = { variant?: "viewer" | "home"; onActivate?: () => void };

export default function EdiLauncher({ variant = "viewer", onActivate }: EdiLauncherProps) {
  const isHome = variant === "home";
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; left: number; top: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [position, setPosition] = useState<EdiLauncherPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dockPreview, setDockPreview] = useState<EdiLauncherDock>(null);

  const clampPosition = useCallback((next: EdiLauncherPosition): EdiLauncherPosition => {
    const rect = launcherRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 112;
    const height = rect?.height ?? 112;
    return {
      left: Math.max(EDI_LAUNCHER_MARGIN, Math.min(window.innerWidth - width - EDI_LAUNCHER_MARGIN, next.left)),
      top: Math.max(EDI_LAUNCHER_MARGIN, Math.min(window.innerHeight - height - EDI_LAUNCHER_MARGIN, next.top)),
    };
  }, []);

  const getDefaultPosition = useCallback(
    () => clampPosition({ left: window.innerWidth - 444, top: window.innerHeight - 216 }),
    [clampPosition],
  );

  const getDockPosition = useCallback((next: EdiLauncherPosition): { position: EdiLauncherPosition; dock: EdiLauncherDock } => {
    const clamped = clampPosition(next);
    const rect = launcherRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 122;
    const height = rect?.height ?? 126;
    const distances = {
      left: clamped.left - EDI_LAUNCHER_MARGIN,
      right: window.innerWidth - EDI_LAUNCHER_MARGIN - width - clamped.left,
      top: clamped.top - EDI_LAUNCHER_MARGIN,
      bottom: window.innerHeight - EDI_LAUNCHER_MARGIN - height - clamped.top,
    };
    const dock = (Object.entries(distances).sort((a, b) => a[1] - b[1])[0]?.[0] || null) as EdiLauncherDock;
    if (!dock || distances[dock] > EDI_LAUNCHER_DOCK_THRESHOLD) return { position: clamped, dock: null };
    return {
      dock,
      position: clampPosition({
        left: dock === "left" ? EDI_LAUNCHER_MARGIN : dock === "right" ? window.innerWidth - width - EDI_LAUNCHER_MARGIN : clamped.left,
        top: dock === "top" ? EDI_LAUNCHER_MARGIN : dock === "bottom" ? window.innerHeight - height - EDI_LAUNCHER_MARGIN : clamped.top,
      }),
    };
  }, [clampPosition]);

  useEffect(() => {
    if (isHome) return;
    const frame = window.requestAnimationFrame(() => {
      let restoredPosition: EdiLauncherPosition | null = null;
      try {
        restoredPosition = JSON.parse(window.localStorage.getItem(EDI_LAUNCHER_POSITION_KEY) || "null");
      } catch {
        restoredPosition = null;
      }
      setPosition(clampPosition(restoredPosition || getDefaultPosition()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [clampPosition, getDefaultPosition, isHome]);

  useEffect(() => {
    if (isHome) return;
    const handleResize = () => setPosition((current) => (current ? clampPosition(current) : current));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition, isHome]);

  const persistPosition = (next: EdiLauncherPosition) => {
    window.localStorage.setItem(EDI_LAUNCHER_POSITION_KEY, JSON.stringify(next));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (isHome || !position || event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: position.left, top: position.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < EDI_LAUNCHER_DRAG_THRESHOLD) return;
    drag.moved = true;
    setDragging(true);
    const nextDock = getDockPosition({ left: drag.left + deltaX, top: drag.top + deltaY });
    setDockPreview(nextDock.dock);
    setPosition(clampPosition({ left: drag.left + deltaX, top: drag.top + deltaY }));
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      const finalPosition = getDockPosition({ left: drag.left + event.clientX - drag.startX, top: drag.top + event.clientY - drag.startY }).position;
      setPosition(finalPosition);
      persistPosition(finalPosition);
      suppressClickRef.current = true;
    }
    dragRef.current = null;
    setDragging(false);
    setDockPreview(null);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (onActivate) onActivate();
    else window.dispatchEvent(new Event("bagastudio:open-edi-workspace"));
  };

  const handleDoubleClick = () => {
    if (isHome) return;
    const defaultPosition = getDefaultPosition();
    setPosition(defaultPosition);
    persistPosition(defaultPosition);
  };

  return (
    <button
      ref={launcherRef}
      className={`edi-launcher-core${isHome ? " edi-launcher-core--home" : ""}${dragging ? " edi-launcher-core--dragging" : ""}${dockPreview ? " edi-launcher-core--dock-preview" : ""}`}
      type="button"
      style={isHome ? undefined : position ? { left: position.left, top: position.top } : { visibility: "hidden" }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      aria-label="Apri EDI Workspace"
    >
      <span className="edi-launcher-core__scene"><BlueprintMiniLayer /><EnergyPulseLayer /><EdiCoreSphere /></span><strong>Edi</strong>
      <style>{`
        .edi-launcher-core{position:fixed;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:8px;padding:0;border:0;background:transparent;color:#fff;cursor:grab;touch-action:none;user-select:none;filter:drop-shadow(0 14px 22px #020617cc);transition:transform .7s cubic-bezier(.22,1,.36,1),filter .35s ease}.edi-launcher-core--home{position:relative;z-index:auto;cursor:pointer;touch-action:auto}.edi-launcher-core--dragging{cursor:grabbing;transition:none}.edi-launcher-core--dock-preview{filter:drop-shadow(0 0 10px #fde68acc) drop-shadow(0 0 24px #38bdf8cc)}.edi-launcher-core__scene{position:relative;display:block;width:96px;height:96px}.edi-launcher-core__scene span,.edi-launcher-core__scene i{position:absolute;pointer-events:none}
        .edi-launcher-core__sphere{inset:3px;border-radius:50%;isolation:isolate;transition:transform 1.2s cubic-bezier(.22,1,.36,1);--edi-breath:4.2s;--edi-orbit:14s;--edi-energy:#7dd3fc;--edi-warm:#f4d58d;animation:ediLauncherBreath var(--edi-breath) ease-in-out infinite}.edi-launcher-core__glow{inset:-16%;z-index:0;border-radius:50%;opacity:.68;animation:ediLauncherGlow var(--edi-breath) ease-in-out infinite}.edi-launcher-core__glow i:first-child{inset:10%;border-radius:50%;background:radial-gradient(circle,#f8e8bb55 0,#60a5fa36 32%,#0b3a6822 60%,transparent 78%);filter:blur(16px)}.edi-launcher-core__glow i:last-child{inset:-4%;border-radius:50%;background:radial-gradient(circle,transparent 32%,#d4a64c18 54%,transparent 74%);filter:blur(22px)}.edi-launcher-core__nucleus{inset:28%;z-index:5;border-radius:50%;background:radial-gradient(circle at 43% 38%,#fffef8 0 13%,#fae9b5 24%,#bceaff 42%,#276d9c 68%,#07182c 100%);box-shadow:inset -8px -10px 16px #04101fcc,inset 5px 4px 11px #ffffffa8,0 0 13px #fff4c5dd,0 0 31px #65bff299,0 0 54px #d4a64c3d;animation:ediLauncherNucleus var(--edi-breath) ease-in-out infinite,ediLauncherThoughtCore 29s ease-in-out infinite}.edi-launcher-core__nucleus i{inset:30%;border-radius:50%;background:#fffdf2;box-shadow:0 0 9px #fff,0 0 19px #f5d98a;opacity:.84;animation:ediLauncherConsciousness var(--edi-breath) ease-in-out infinite}.edi-launcher-core__plasma{inset:14%;z-index:4;border-radius:48% 52% 46% 54%;overflow:hidden;mix-blend-mode:screen;filter:saturate(.7)}.edi-launcher-core__plasma i{inset:-28%;border-radius:44% 56% 47% 53%;background:conic-gradient(from 35deg,transparent 0 12%,#1a6fa555 18%,transparent 30%,#8ed8ff77 43%,transparent 58%,#d6ad5b44 70%,transparent 84%);filter:blur(2px);opacity:.68;animation:ediLauncherPlasma 11s ease-in-out infinite}.edi-launcher-core__plasma i:nth-child(2){inset:-18%;animation-duration:15s;animation-direction:reverse;opacity:.5}.edi-launcher-core__plasma i:nth-child(3){inset:2%;background:radial-gradient(ellipse at 35% 30%,#fff8df66,transparent 22%),radial-gradient(ellipse at 68% 62%,#5bbde866,transparent 30%);animation-duration:9s;opacity:.58}
        .edi-launcher-core__neural{position:absolute;inset:13%;z-index:6;width:74%;height:74%;overflow:visible;fill:#f5dfa0;stroke:#bdeaffaa;stroke-width:.75;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px #75c9ed);mix-blend-mode:screen}.edi-launcher-core__neural path{stroke-dasharray:8 5;animation:ediLauncherNeural 8s ease-in-out infinite}.edi-launcher-core__neural path:nth-child(2){animation-delay:-2.6s}.edi-launcher-core__neural path:nth-child(3){animation-delay:-5.2s}.edi-launcher-core__neural circle{animation:ediLauncherNode var(--edi-breath) ease-in-out infinite}.edi-launcher-core__refraction{inset:10%;z-index:7;border-radius:48% 52% 49% 51%;border:1px solid #dff5ff30;background:radial-gradient(circle at 32% 23%,#ffffff72 0 3%,transparent 15%),linear-gradient(138deg,#dff6ff1f 0 18%,transparent 35% 72%,#d5a94d17 88%);box-shadow:inset 7px 8px 14px #dff6ff18,inset -9px -12px 18px #020d1e99;backdrop-filter:blur(.6px);animation:ediLauncherField var(--edi-breath) ease-in-out infinite}.edi-launcher-core__fields{inset:-4%;z-index:8}.edi-launcher-core__fields i{left:4%;top:17%;width:92%;height:65%;border:.6px solid #d9b86b77;border-radius:47% 53% 42% 58%;transform:rotate(-18deg);box-shadow:0 0 4px #d8b35d33;animation:ediLauncherFieldOrbit 15s ease-in-out infinite}.edi-launcher-core__fields i:nth-child(2){left:12%;top:3%;width:72%;height:94%;border-color:#8ccce866;border-radius:55% 45% 61% 39%;animation-duration:19s;animation-direction:reverse}.edi-launcher-core__fields i:nth-child(3){left:18%;top:12%;width:65%;height:77%;border-style:dashed;border-color:#e0c17b55;animation-duration:12s}.edi-launcher-core__fields i:nth-child(4){left:2%;top:28%;width:96%;height:47%;border-color:#78c7e844;border-radius:62% 38% 48% 52%;animation-duration:22s;animation-direction:reverse}.edi-launcher-core__energy-leak{inset:-9%;z-index:9}.edi-launcher-core__energy-leak i{left:48%;top:5%;width:1px;height:13px;background:linear-gradient(transparent,#f6dfa2,transparent);filter:drop-shadow(0 0 3px #e9c46f);opacity:.38;animation:ediLauncherLeak 6s ease-in-out infinite}.edi-launcher-core__energy-leak i:nth-child(2){left:12%;top:58%;transform:rotate(-66deg);animation-delay:-2s}.edi-launcher-core__energy-leak i:nth-child(3){left:86%;top:65%;transform:rotate(54deg);animation-delay:-4s}.edi-launcher-core__particles{inset:-7%;z-index:10}.edi-launcher-core__particles i{left:calc(2% + var(--edi-particle)*10.4%);top:calc(9% + var(--edi-particle)*8%);width:1.5px;height:1.5px;border-radius:50%;background:#f5f1dc;box-shadow:0 0 4px 1px #7dc8ed88;animation:ediLauncherKnowledge 9s ease-in-out infinite;animation-delay:calc(var(--edi-particle)*-.9s)}
        .edi-launcher-core__blueprint{position:absolute;left:50%;bottom:-12px;width:126px;transform:translateX(-50%) perspective(120px) rotateX(48deg);transform-origin:center bottom;fill:none;stroke:#68c8ef88;stroke-width:.55;filter:drop-shadow(0 0 3px #d8ad5266);overflow:visible}.edi-launcher-core__blueprint-grid{stroke:#60a5c944;stroke-dasharray:2 4;animation:ediLauncherBlueprint 12s linear infinite}.edi-launcher-core__blueprint-seal{stroke:#d6b76d99;stroke-dasharray:8 3;animation:ediLauncherSeal 10s ease-in-out infinite}.edi-launcher-core__blueprint-tools{stroke:#e0bd7288;stroke-width:.8}.edi-launcher-core__blueprint-notes{stroke:#86d5f399;stroke-dasharray:3 2;animation:ediLauncherNotes 8s ease-in-out infinite}.edi-launcher-core__energy{left:47%;bottom:16%;width:6%;height:52%;background:linear-gradient(0deg,#e4bc6aaa,#7dd3fcaa 48%,transparent);filter:blur(2px);opacity:.72;animation:ediLauncherEnergy 7s ease-in-out infinite}.edi-launcher-core__energy i{inset:0;background:repeating-linear-gradient(0deg,transparent 0 5px,#fff9d7bb 6px 7px);animation:ediLauncherRise 3s linear infinite}.edi-launcher-core__energy b{left:50%;bottom:-3px;width:4px;height:4px;border-radius:50%;background:#f4d58d;box-shadow:0 0 8px #f4d58d;animation:ediLauncherSpark 6s ease-in-out infinite}.edi-launcher-core__energy b:last-child{animation-delay:-3s}.edi-launcher-core strong{font-family:Georgia,"Times New Roman",serif;font-size:20px;font-style:italic;font-weight:600;letter-spacing:.18em;text-indent:.18em;text-shadow:0 0 9px #38bdf888;transition:text-shadow .6s ease,color .6s ease}
        .edi-launcher-core__sphere[data-edi-state="thinking"],.edi-launcher-core__sphere[data-edi-state="analyzing"]{--edi-breath:3.5s;--edi-orbit:11s}.edi-launcher-core__sphere[data-edi-state="suggestion"],.edi-launcher-core__sphere[data-edi-state="success"]{--edi-warm:#ffe3a0}.edi-launcher-core__sphere[data-edi-state="warning"]{--edi-energy:#e7b46c;--edi-warm:#d99a53}.edi-launcher-core:hover{transform:scale(1.07)}.edi-launcher-core:hover .edi-launcher-core__sphere{transform:scale(1.045)}.edi-launcher-core:hover .edi-launcher-core__fields i{animation-duration:10s}.edi-launcher-core:hover .edi-launcher-core__glow{opacity:.9}.edi-launcher-core:hover strong{color:#fff7d6;text-shadow:0 0 14px #fbbf24,0 0 25px #38bdf8}@keyframes ediLauncherBreath{0%,100%{transform:scale(.985)}50%{transform:scale(1.018)}}@keyframes ediLauncherPlasma{0%,100%{transform:rotate(0) scale(1)}45%{transform:rotate(148deg) scale(1.08,.94)}70%{transform:rotate(246deg) scale(.96,1.07)}}@keyframes ediLauncherFieldOrbit{0%,100%{transform:rotate(-18deg) scale(1,.94)}44%{transform:rotate(136deg) scale(.96,1.04)}72%{transform:rotate(248deg) scale(1.03,.97)}}@keyframes ediLauncherGlow{50%{transform:scale(1.1);opacity:.88}}@keyframes ediLauncherNucleus{50%{transform:scale(1.065);filter:brightness(1.1)}}@keyframes ediLauncherConsciousness{50%{transform:scale(.78);opacity:1}}@keyframes ediLauncherThoughtCore{0%,92%,100%{transform:scale(1)}94%{transform:scale(.78)}96%{transform:scale(1.12)}}@keyframes ediLauncherNeural{0%,100%{stroke-dashoffset:0;opacity:.18}45%,58%{stroke-dashoffset:-18;opacity:.82}72%{opacity:.28}}@keyframes ediLauncherNode{50%{transform:scale(1.6);transform-origin:center;opacity:1}}@keyframes ediLauncherField{50%{transform:scale(1.025,.99);border-color:#f1d99b44}}@keyframes ediLauncherLeak{0%,100%{transform:translateY(4px) scaleY(.4);opacity:0}45%{opacity:.5}70%{transform:translateY(-8px) scaleY(1);opacity:0}}@keyframes ediLauncherKnowledge{0%,100%{transform:translate(0,10px) scale(.4);opacity:.08}42%{transform:translate(9px,-12px) scale(1);opacity:.72}65%{transform:translate(16px,-21px) scale(.3);opacity:.14}}@keyframes ediLauncherBlueprint{to{stroke-dashoffset:-42}}@keyframes ediLauncherSeal{0%,100%{stroke-dashoffset:0;opacity:.48}50%{stroke-dashoffset:-32;opacity:1}}@keyframes ediLauncherNotes{0%,100%{opacity:.22}45%,65%{opacity:.9}}@keyframes ediLauncherEnergy{50%{opacity:1;transform:scaleY(1.16)}}@keyframes ediLauncherRise{to{transform:translateY(-15px)}}@keyframes ediLauncherSpark{0%,100%{transform:translate(-50%,0) scale(.4);opacity:0}42%{opacity:1}72%{transform:translate(-50%,-40px) scale(1);opacity:0}}
      `}</style>
    </button>
  );
}
