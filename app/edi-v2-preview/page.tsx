"use client";

import { useState } from "react";
import EdiRenderEngineV2 from "@/components/edi/render-engine-v2/EdiRenderEngineV2";
import { EDI_V2_LABORATORY_PRESETS } from "@/components/edi/render-engine-v2/laboratory";
import type { EdiV2LaboratoryProfile, EdiV2ShaderMode, EdiV2State, EdiV2VisualMode } from "@/components/edi/render-engine-v2/types";

const states: EdiV2State[] = ["idle", "thinking", "analyzing", "speaking", "suggestion", "warning", "success"];
const modes: EdiV2VisualMode[] = ["prototype", "minimal", "energy", "experimental"];
const shaderModes: EdiV2ShaderMode[] = ["heart", "plasma", "magnetic", "particles", "glow", "composite"];
const sliders: Array<{ key: keyof Pick<EdiV2LaboratoryProfile, "bloomIntensity" | "bloomRadius" | "bloomThreshold" | "heartIntensity" | "heartPulseSpeed" | "heartRadius" | "heartNoise" | "heartGlow" | "plasmaIntensity" | "magneticIntensity" | "particleDensity" | "distortionIntensity" | "pulseIntensity" | "animationSpeed">; label: string; min?: number }> = [
  { key: "bloomIntensity", label: "Bloom strength" },
  { key: "bloomRadius", label: "Bloom radius", min: 0 },
  { key: "bloomThreshold", label: "Bloom threshold", min: 0 },
  { key: "heartIntensity", label: "Heart intensity" },
  { key: "heartPulseSpeed", label: "Heart pulse speed", min: 0 },
  { key: "heartRadius", label: "Heart radius", min: .2 },
  { key: "heartNoise", label: "Heart noise", min: 0 },
  { key: "heartGlow", label: "Heart glow", min: 0 },
  { key: "plasmaIntensity", label: "Plasma intensity" },
  { key: "magneticIntensity", label: "Magnetic intensity" },
  { key: "particleDensity", label: "Particle density", min: 0 },
  { key: "distortionIntensity", label: "Distortion intensity", min: 0 },
  { key: "pulseIntensity", label: "Pulse intensity", min: 0 },
  { key: "animationSpeed", label: "Time speed", min: 0 },
];

export default function EdiV2PreviewPage() {
  const [state, setState] = useState<EdiV2State>("idle");
  const [fps, setFps] = useState(0);
  const [size, setSize] = useState(320);
  const [intensity, setIntensity] = useState(1);
  const [background, setBackground] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [laboratory, setLaboratory] = useState<EdiV2LaboratoryProfile>(EDI_V2_LABORATORY_PRESETS.prototype);
  const setMode = (mode: EdiV2VisualMode) => setLaboratory(EDI_V2_LABORATORY_PRESETS[mode]);
  const setParameter = (key: typeof sliders[number]["key"], value: number) => setLaboratory((current) => ({ ...current, [key]: value }));

  return <main className={`min-h-screen p-8 text-white transition-colors ${background ? "bg-[#050b12]" : "bg-transparent"}`}>
    <header className="mx-auto flex max-w-6xl items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[.28em] text-cyan-200/60">RFC-1102</p><h1 className="mt-2 text-2xl font-semibold">EDI Shader Laboratory</h1><p className="mt-2 text-sm text-slate-400">Isolated WebGL pipeline bench</p></div><div className="rounded-full border border-cyan-200/15 bg-cyan-200/5 px-4 py-2 font-mono text-sm text-cyan-100">{fps} FPS</div></header>
    <div className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-[1fr_340px]">
      <section className={`flex min-h-[560px] items-center justify-center rounded-3xl border border-white/5 transition-colors ${background ? "bg-black/20" : "bg-[linear-gradient(135deg,#e2e8f0,#94a3b8)]"}`}><EdiRenderEngineV2 state={state} size={size} intensity={intensity} reducedMotion={reducedMotion} laboratory={laboratory} onFps={setFps} /></section>
      <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/[.04] p-5 text-sm">
        <section><p className="mb-3 text-xs uppercase tracking-[.2em] text-slate-400">Visual mode</p><div className="grid grid-cols-2 gap-2">{modes.map((mode) => <button key={mode} type="button" onClick={() => setMode(mode)} className={`rounded-xl px-3 py-2 capitalize ${laboratory.mode === mode ? "bg-cyan-200 text-slate-950" : "bg-white/5 text-slate-300"}`}>{mode}</button>)}</div></section>
        <section><p className="mb-3 text-xs uppercase tracking-[.2em] text-slate-400">Shader mode</p><div className="grid grid-cols-3 gap-2">{shaderModes.map((mode) => <button key={mode} type="button" onClick={() => setLaboratory((current) => ({ ...current, shaderMode: mode }))} className={`rounded-xl px-2 py-2 capitalize ${laboratory.shaderMode === mode ? "bg-blue-300 text-slate-950" : "bg-white/5 text-slate-300"}`}>{mode}</button>)}</div></section>
        <section><p className="mb-3 text-xs uppercase tracking-[.2em] text-slate-400">EDI state</p><div className="flex flex-wrap gap-2">{states.map((item) => <button key={item} type="button" onClick={() => setState(item)} className={`rounded-full px-3 py-1.5 ${state === item ? "bg-amber-200 text-slate-950" : "bg-white/5 text-slate-300"}`}>{item}</button>)}</div></section>
        <section className="grid max-h-[380px] gap-4 overflow-y-auto pr-2">{sliders.map(({ key, label, min = .1 }) => <label key={key}>{label}: <span className="font-mono text-cyan-100">{laboratory[key].toFixed(2)}</span><input className="mt-2 w-full" type="range" min={min} max="2" step=".05" value={laboratory[key]} onChange={(event) => setParameter(key, Number(event.target.value))} /></label>)}<label>Global intensity: <span className="font-mono text-cyan-100">{intensity.toFixed(2)}</span><input className="mt-2 w-full" type="range" min=".3" max="2" step=".05" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label><label>Size: <span className="font-mono text-cyan-100">{size}px</span><input className="mt-2 w-full" type="range" min="120" max="480" step="10" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label></section>
        <section className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setLaboratory((current) => ({ ...current, paused: !current.paused }))} className="rounded-xl bg-white/5 px-3 py-2">{laboratory.paused ? "Resume animation" : "Pause animation"}</button><button type="button" onClick={() => setBackground((current) => !current)} className="rounded-xl bg-white/5 px-3 py-2">Background {background ? "off" : "on"}</button><button type="button" onClick={() => setReducedMotion((current) => !current)} className={`col-span-2 rounded-xl px-3 py-2 ${reducedMotion ? "bg-amber-200 text-slate-950" : "bg-white/5"}`}>Reduced motion {reducedMotion ? "on" : "off"}</button></section>
      </aside>
    </div>
  </main>;
}
