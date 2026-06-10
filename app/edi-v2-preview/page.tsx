"use client";

import { useState } from "react";
import EdiRenderEngineV2 from "@/components/edi/render-engine-v2/EdiRenderEngineV2";
import type { EdiV2State } from "@/components/edi/render-engine-v2/types";

const states: EdiV2State[] = ["idle", "thinking", "analyzing", "speaking", "suggestion", "warning", "success"];

export default function EdiV2PreviewPage() {
  const [state, setState] = useState<EdiV2State>("idle");
  const [fps, setFps] = useState(0);
  const [size, setSize] = useState(320);
  const [intensity, setIntensity] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  return <main className="min-h-screen bg-[#050b12] p-10 text-white"><h1 className="text-xl font-semibold">EDI Render Engine V2 Preview</h1><p className="mt-2 text-sm text-slate-400">Isolated development preview · {fps} FPS</p><section className="mt-8 flex min-h-[420px] items-center justify-center"><EdiRenderEngineV2 state={state} size={size} intensity={intensity} reducedMotion={reducedMotion} onFps={setFps} /></section><nav className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">{states.map((item) => <button key={item} type="button" onClick={() => setState(item)} className={`rounded-full px-4 py-2 text-sm ${state === item ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>{item}</button>)}</nav><section className="mx-auto mt-8 grid max-w-xl gap-5 rounded-2xl bg-white/5 p-5 text-sm"><label>Size: {size}px<input className="mt-2 w-full" type="range" min="120" max="480" step="10" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label><label>Intensity: {intensity.toFixed(1)}<input className="mt-2 w-full" type="range" min=".3" max="2" step=".1" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label><label className="flex items-center gap-3"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />Reduced motion</label></section></main>;
}
