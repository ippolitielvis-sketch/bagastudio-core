"use client";

import { useEffect, useRef, useState } from "react";
import BlueprintLayer from "./layers/BlueprintLayer";
import CoreSphereLayer from "./layers/CoreSphereLayer";
import EnergyColumnLayer from "./layers/EnergyColumnLayer";
import GlowLayer from "./layers/GlowLayer";
import IdeaLayer from "./layers/IdeaLayer";
import OrbitalLayer from "./layers/OrbitalLayer";
import ParticleLayer from "./layers/ParticleLayer";
import TechnicalObjectsLayer from "./layers/TechnicalObjectsLayer";
import type { EdiLivingStateV3, EdiMicroEventV7, EdiProjectBlueprintV4, EdiSceneStateV7 } from "./types";

type EdiAnimatedCoreProps = { ediState?: EdiLivingStateV3; size?: number; projectBlueprint?: EdiProjectBlueprintV4 };

const COLORS = {
  idle: ["#22d3ee", "#2563eb"], thinking: ["#a78bfa", "#ec4899"], analyzing: ["#38bdf8", "#8b5cf6"],
  suggestion: ["#fbbf24", "#22d3ee"], warning: ["#f59e0b", "#fb7185"], success: ["#34d399", "#22d3ee"],
} as const;

export default function EdiAnimatedCore({ ediState = "idle", size = 48, projectBlueprint }: EdiAnimatedCoreProps) {
  const requestedSceneState: EdiSceneStateV7 = projectBlueprint && ediState === "idle" ? "projectDetected" : ediState;
  const [sceneState, setSceneState] = useState<EdiSceneStateV7>(requestedSceneState);
  const [observing, setObserving] = useState(false);
  const [microEvent, setMicroEvent] = useState<EdiMicroEventV7>(null);
  const previousSceneState = useRef<EdiSceneStateV7>(requestedSceneState);
  const visualState: EdiLivingStateV3 = sceneState === "projectDetected" ? "idle" : sceneState;
  const [primary, secondary] = COLORS[visualState];

  useEffect(() => {
    if (requestedSceneState === previousSceneState.current) return;
    const needsSilence = requestedSceneState === "projectDetected" || requestedSceneState === "thinking" || requestedSceneState === "analyzing" || requestedSceneState === "suggestion";
    previousSceneState.current = requestedSceneState;
    const observationTimer = window.setTimeout(() => setObserving(needsSilence), 0);
    const timer = window.setTimeout(() => {
      setSceneState(requestedSceneState);
      setObserving(false);
    }, needsSilence ? (requestedSceneState === "projectDetected" ? 1000 : 850) : 0);
    return () => {
      window.clearTimeout(observationTimer);
      window.clearTimeout(timer);
    };
  }, [requestedSceneState]);

  useEffect(() => {
    let eventTimer = 0;
    let clearTimer = 0;
    const schedule = () => {
      eventTimer = window.setTimeout(() => {
        const events: Exclude<EdiMicroEventV7, null>[] = ["compass", "pen", "roll", "idea"];
        setMicroEvent(events[Math.floor(Math.random() * events.length)]);
        clearTimer = window.setTimeout(() => {
          setMicroEvent(null);
          schedule();
        }, 2800);
      }, 20000 + Math.random() * 20000);
    };
    schedule();
    return () => {
      window.clearTimeout(eventTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  return (
    <span className={`edi-v3 edi-v3--${sceneState} ${observing ? "edi-v3--observing" : ""}`} style={{ width: size, height: size, ["--edi-primary" as string]: primary, ["--edi-secondary" as string]: secondary }}>
      <BlueprintLayer ediState={visualState} projectBlueprint={projectBlueprint} /><TechnicalObjectsLayer ediState={visualState} microEvent={microEvent} /><EnergyColumnLayer ediState={visualState} />
      <GlowLayer ediState={visualState} /><OrbitalLayer ediState={visualState} /><CoreSphereLayer ediState={visualState} />
      <ParticleLayer ediState={visualState} /><IdeaLayer ediState={visualState} microEvent={microEvent} />
      <style>{`
        .edi-v3{--edi-breath:10s;position:relative;display:inline-block;flex:none;isolation:isolate;animation:ediPresence var(--edi-breath) ease-in-out infinite}.edi-v3 span,.edi-v3 i{position:absolute;pointer-events:none}
        .edi-v3__blueprint{position:absolute;z-index:-2;left:50%;bottom:-76%;width:240%;height:175%;transform:translateX(-50%);overflow:visible;filter:drop-shadow(0 8px 7px #020617aa);animation:ediWorkshopParallax 18s ease-in-out infinite}.edi-v3__blueprint g,.edi-v3__blueprint path{fill:none;stroke-linecap:round;stroke-linejoin:round}
        .edi-v3__workshop{animation:ediWorkshopBreath var(--edi-breath) ease-in-out infinite}.edi-v3__table{fill:#071525;stroke:#164e63;stroke-width:.6}.edi-v3__sheet{fill:#082237;stroke:#38bdf855;stroke-width:.5}.edi-v3__sheet--back{transform:translate(2px,-2px);opacity:.28}.edi-v3__sheet--middle{transform:translate(-1px,-1px);opacity:.42}.edi-v3__sheet--front{fill:#092a42;opacity:.62}.edi-v3__workshop-light{fill:url(#ediWorkshopLightV8);animation:ediWorkshopLight var(--edi-breath) ease-in-out infinite}
        .edi-v3__sketch{stroke:#d6a96f;stroke-width:.7;opacity:.35;stroke-dasharray:3 5;animation:ediDesignedDraw var(--edi-breath) ease-in-out infinite}.edi-v3__cad{stroke:var(--edi-primary);stroke-width:.65;opacity:.55;stroke-dasharray:12 7;animation:ediDesignedCad var(--edi-breath) ease-in-out infinite}.edi-v3__micro{fill:var(--edi-secondary);font:5px monospace;opacity:.45;animation:ediDimensions var(--edi-breath) ease-in-out infinite}.edi-v3__micro-drawings{fill:none;stroke:#bae6fd;stroke-width:.55;font:4px monospace;opacity:0;animation:ediMicroDrawings 24s ease-in-out infinite}.edi-v3__spiral{transform-origin:80px 60px;animation:ediOrganicSpin 30s ease-in-out infinite}.edi-v3__seal,.edi-v3__project-path{fill:none;stroke:var(--edi-primary);stroke-width:.75;filter:drop-shadow(0 0 3px var(--edi-primary));animation:ediSeal var(--edi-breath) ease-in-out infinite}
        .edi-v3__energy{z-index:-1;left:47%;bottom:24%;width:6%;height:90%;background:linear-gradient(0deg,var(--edi-primary),transparent);filter:blur(2px) drop-shadow(0 0 5px var(--edi-primary));opacity:.6;animation:ediEnergyPulse var(--edi-breath) ease-in-out infinite}.edi-v3__energy span{inset:0;background:repeating-linear-gradient(0deg,transparent 0 5px,#fff 6px 7px);animation:ediRise var(--edi-breath) ease-in-out infinite}
        .edi-v3__glow{inset:10%;border-radius:50%;background:var(--edi-primary);filter:blur(14px);opacity:.6;animation:ediGlowBreath var(--edi-breath) ease-in-out infinite}
        .edi-v3__sphere{inset:17%;overflow:hidden;border-radius:50%;background:radial-gradient(circle at 34% 27%,#fff 0 4%,var(--edi-primary) 13%,transparent 37%),conic-gradient(var(--edi-secondary),#071a3a,var(--edi-primary),#08142d,var(--edi-secondary));box-shadow:inset -7px -9px 15px #020617,inset 4px 4px 9px #ffffff55,0 0 17px var(--edi-primary);animation:ediCoreBreath var(--edi-breath) ease-in-out infinite}.edi-v3__plasma{inset:-25%;border-radius:44%;background:conic-gradient(transparent,var(--edi-primary),transparent,var(--edi-secondary),transparent);mix-blend-mode:screen;animation:ediLiquidPlasma var(--edi-breath) ease-in-out infinite}.edi-v3__discharge{inset:12%;border:1px dashed #fff;border-radius:45%;opacity:.5;animation:ediDischarge var(--edi-breath) ease-in-out infinite}
        .edi-v3__orbitals{inset:0}.edi-v3__orbitals i{inset:5%;border:1px solid var(--edi-primary);border-radius:50%;box-shadow:0 0 7px var(--edi-primary);animation:ediPlanetary 12s ease-in-out infinite}.edi-v3__orbitals i:nth-child(2){inset:-2%;border-color:var(--edi-secondary);animation-duration:17s;animation-direction:reverse}.edi-v3__orbitals i:nth-child(3){inset:12%;opacity:.55;animation-duration:9s}
        .edi-v3__particles{inset:-20%}.edi-v3__particles i{left:calc(10% + var(--particle-index)*14%);top:calc(76% - var(--particle-index)*4%);color:#cffafe;font:5px monospace;text-shadow:0 0 5px var(--edi-primary);animation:ediInformationRise var(--edi-breath) ease-in-out infinite;animation-delay:calc(var(--particle-index)*-1.35s)}
        .edi-v3__objects{z-index:-1;inset:-38%;transform:perspective(80px) rotateX(18deg)}.edi-v3__objects i{color:#bae6fd;font:10px monospace;opacity:.42;text-shadow:0 3px 3px #020617;animation:ediSuspended var(--edi-breath) ease-in-out infinite}.edi-v3__objects i:nth-child(2){animation-delay:-2s}.edi-v3__objects i:nth-child(3){animation-delay:-4s}.edi-v3__objects i:nth-child(4){animation-delay:-6s}.edi-v3__compass{left:2%;top:72%}.edi-v3__square{right:0;top:76%}.edi-v3__pen{left:30%;bottom:-18%}.edi-v3__roll{right:17%;top:63%}
        .edi-v3__idea{right:-28%;top:-32%;color:#fde68a;font-size:13px;opacity:0;text-shadow:0 0 10px #fbbf24;transition:opacity 1.8s ease}.edi-v3__idea--visible{opacity:.9;animation:ediIdeaBreath var(--edi-breath) ease-in-out infinite}
        .edi-v3--observing .edi-v3__orbitals,.edi-v3--projectDetected .edi-v3__orbitals{animation-play-state:paused;opacity:.28}.edi-v3--observing .edi-v3__sphere{transform:scale(.96)}.edi-v3--analyzing .edi-v3__particles i{left:48%;top:48%}.edi-v3--analyzing .edi-v3__orbitals{opacity:.48}.edi-v3--analyzing .edi-v3__glow{inset:20%;filter:blur(8px)}.edi-v3__blueprint--project .edi-v3__sketch,.edi-v3__blueprint--project .edi-v3__cad{animation:ediBlueprintTransform var(--edi-breath) ease-in-out infinite}.edi-v3__objects--event-compass .edi-v3__compass{animation:ediCompassEvent 2.8s ease-in-out}.edi-v3__objects--event-pen .edi-v3__pen{animation:ediPenEvent 2.8s ease-in-out}.edi-v3__objects--event-roll .edi-v3__roll{animation:ediRollEvent 2.8s ease-in-out}
        .edi-v3--analyzing .edi-v3__cad,.edi-v3--thinking .edi-v3__sketch{opacity:.9;animation-duration:3s}.edi-v3--suggestion .edi-v3__idea{transition-duration:2.4s}.edi-v3--suggestion .edi-v3__sphere{transform:scale(1.08)}.edi-v3--warning .edi-v3__cad{stroke:#f59e0b}.edi-v3--success .edi-v3__energy{opacity:1;animation-duration:.8s}.edi-v3--success .edi-v3__cad{opacity:.82;animation-play-state:paused}
        @keyframes ediPresence{0%,100%{filter:saturate(.9)}38%{filter:saturate(1.18)}58%{filter:saturate(1.05)}}@keyframes ediWorkshopParallax{0%,100%{transform:translateX(-50%) translateY(0) rotate(-.5deg)}50%{transform:translateX(-50%) translateY(2px) rotate(.5deg)}}@keyframes ediWorkshopBreath{0%,100%{transform:scale(.99);transform-origin:80px 70px}50%{transform:scale(1.01)}}@keyframes ediWorkshopLight{0%,100%{opacity:.24;transform:scale(.92);transform-origin:80px 54px}50%{opacity:.6;transform:scale(1.08)}}@keyframes ediMicroDrawings{0%,18%,42%,100%{opacity:0;stroke-dashoffset:30}25%,35%{opacity:.65;stroke-dashoffset:0}62%,75%{opacity:.48;stroke-dashoffset:0}}@keyframes ediDesignedDraw{0%{stroke-dashoffset:80;opacity:.12}34%{stroke-dashoffset:20;opacity:.48}62%{stroke-dashoffset:0;opacity:.36}100%{stroke-dashoffset:-50;opacity:.12}}@keyframes ediDesignedCad{0%,20%{stroke-dashoffset:100;opacity:.08}50%{stroke-dashoffset:20;opacity:.78}76%{stroke-dashoffset:0;opacity:.48}100%{stroke-dashoffset:-35;opacity:.08}}@keyframes ediDimensions{0%,18%,100%{opacity:0}40%,62%{opacity:.65}78%{opacity:.1}}@keyframes ediSeal{0%,100%{opacity:.35;transform:scale(.92);transform-origin:80px 60px}45%{opacity:1;transform:scale(1.08)}}@keyframes ediOrganicSpin{0%{transform:rotate(0)}45%{transform:rotate(155deg)}65%{transform:rotate(205deg)}100%{transform:rotate(360deg)}}@keyframes ediEnergyPulse{0%,18%,100%{opacity:.25;transform:scaleY(.72)}42%{opacity:1;transform:scaleY(1.08)}58%{opacity:.72;transform:scaleY(1)}}@keyframes ediRise{0%,20%{transform:translateY(25%);opacity:0}45%{transform:translateY(-8%);opacity:1}70%,100%{transform:translateY(-25%);opacity:0}}@keyframes ediGlowBreath{0%,100%{transform:scale(.88);opacity:.38}45%{transform:scale(1.28);opacity:.84}68%{transform:scale(1.06);opacity:.62}}@keyframes ediCoreBreath{0%,100%{transform:scale(.94)}45%{transform:scale(1.12)}58%{transform:scale(1.17)}72%{transform:scale(1.03)}}@keyframes ediLiquidPlasma{0%{transform:rotate(0) scale(.95);border-radius:42%}45%{transform:rotate(155deg) scale(1.14);border-radius:49%}70%{transform:rotate(245deg) scale(1.02);border-radius:44%}100%{transform:rotate(360deg) scale(.95);border-radius:42%}}@keyframes ediDischarge{0%,25%,100%{transform:rotate(0);opacity:.12}43%{transform:rotate(145deg);opacity:.7}58%{transform:rotate(205deg);opacity:.45}}@keyframes ediPlanetary{0%{transform:rotate(0) rotateX(68deg) rotateZ(20deg)}38%{transform:rotate(120deg) rotateX(68deg) rotateZ(20deg)}62%{transform:rotate(245deg) rotateX(68deg) rotateZ(20deg)}100%{transform:rotate(360deg) rotateX(68deg) rotateZ(20deg)}}@keyframes ediInformationRise{0%{transform:translate(0,12px) scale(.8);opacity:0}30%{opacity:.75}58%{transform:translate(18px,-24px) scale(.35);opacity:.12}100%{transform:translate(22px,-30px) scale(.2);opacity:0}}@keyframes ediSuspended{0%,100%{transform:translate(0,0) rotate(-4deg)}50%{transform:translate(2px,-5px) rotate(5deg)}}@keyframes ediIdeaBreath{0%,35%,100%{opacity:.35;transform:scale(.92)}58%{opacity:1;transform:scale(1.22)}}@keyframes ediBlueprintTransform{0%,20%{opacity:.18;stroke-dashoffset:100}55%,100%{opacity:.85;stroke-dashoffset:0}}@keyframes ediCompassEvent{0%,100%{transform:rotate(-4deg)}45%{transform:rotate(22deg) scale(1.18)}}@keyframes ediPenEvent{0%,100%{transform:translate(0,0) rotate(-4deg)}50%{transform:translate(12px,-5px) rotate(8deg)}}@keyframes ediRollEvent{0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.45)}} 
      `}</style>
    </span>
  );
}
