"use client";

import { useMemo, useState } from "react";

type WallSnapTarget = "back" | "front" | "left" | "right" | "center";

type OSnapPoint = {
  id: string;
  label: string;
  title: string;
  hint: string;
  type: "corner" | "mid" | "center";
  wall?: WallSnapTarget;
  className: string;
  // Hotspot grande ma invisibile: il punto compare solo quando il mouse entra qui.
  hotspotClassName?: string;
};

type OSnapOverlayProps = {
  activeWallSnap: WallSnapTarget | null;
  snapDistanceLabel: string;
  onSnapWall: (wall: WallSnapTarget) => void;
};

// BagaStudio V41.2:
// OSnap non invasivo stile CAD. I punti non restano accesi dopo lo snap.
// Sono hotspot tecnici piccoli: compaiono solo al passaggio mouse e sono pensati
// come foundation per snap stanza e futuro modulo-modulo.
const OSNAP_POINTS: OSnapPoint[] = [
  {
    id: "module-back-left",
    label: "□",
    title: "Angolo modulo",
    hint: "retro sinistra",
    type: "corner",
    wall: "left",
    className: "left-[38%] top-[54%]",
    hotspotClassName: "left-[36%] top-[52%]",
  },
  {
    id: "module-back-right",
    label: "□",
    title: "Angolo modulo",
    hint: "retro destra",
    type: "corner",
    wall: "right",
    className: "left-[62%] top-[54%]",
    hotspotClassName: "left-[60%] top-[52%]",
  },
  {
    id: "module-front-left",
    label: "□",
    title: "Angolo modulo",
    hint: "fronte sinistra",
    type: "corner",
    wall: "left",
    className: "left-[36%] top-[68%]",
    hotspotClassName: "left-[34%] top-[66%]",
  },
  {
    id: "module-front-right",
    label: "□",
    title: "Angolo modulo",
    hint: "fronte destra",
    type: "corner",
    wall: "right",
    className: "left-[64%] top-[68%]",
    hotspotClassName: "left-[62%] top-[66%]",
  },
  {
    id: "module-mid-back",
    label: "△",
    title: "Mezzeria modulo",
    hint: "retro",
    type: "mid",
    wall: "back",
    className: "left-1/2 top-[53%] -translate-x-1/2",
    hotspotClassName: "left-[48%] top-[51%]",
  },
  {
    id: "module-mid-front",
    label: "△",
    title: "Mezzeria modulo",
    hint: "fronte",
    type: "mid",
    wall: "front",
    className: "left-1/2 top-[70%] -translate-x-1/2 rotate-180",
    hotspotClassName: "left-[48%] top-[68%]",
  },
  {
    id: "module-mid-left",
    label: "△",
    title: "Mezzeria modulo",
    hint: "lato sinistro",
    type: "mid",
    wall: "left",
    className: "left-[34%] top-[61%] -rotate-90",
    hotspotClassName: "left-[32%] top-[59%]",
  },
  {
    id: "module-mid-right",
    label: "△",
    title: "Mezzeria modulo",
    hint: "lato destro",
    type: "mid",
    wall: "right",
    className: "left-[66%] top-[61%] rotate-90",
    hotspotClassName: "left-[64%] top-[59%]",
  },
  {
    id: "module-center",
    label: "○",
    title: "Centro modulo",
    hint: "asse",
    type: "center",
    wall: "center",
    className: "left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2",
    hotspotClassName: "left-[48%] top-[60%]",
  },
];

function getPointClasses(point: OSnapPoint, isHovered: boolean) {
  const base =
    "pointer-events-none absolute z-40 flex h-5 w-5 items-center justify-center border text-[9px] font-black leading-none opacity-0 transition-all duration-150";

  const shape =
    point.type === "center"
      ? "rounded-full"
      : point.type === "mid"
        ? "rounded-[6px]"
        : "rounded-[4px]";

  const tone = isHovered
    ? "border-cyan-100 bg-cyan-300/95 text-slate-950 opacity-100 shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_0_18px_rgba(34,211,238,0.70)] scale-110"
    : "border-cyan-100/0 bg-cyan-300/0 text-cyan-50/0 scale-75";

  return `${base} ${shape} ${tone}`;
}

function getHotspotClasses(point: OSnapPoint) {
  const shape = point.type === "center" ? "rounded-full" : "rounded-xl";
  return `absolute z-50 h-12 w-12 ${shape} pointer-events-auto cursor-crosshair outline-none`;
}

export default function OSnapOverlay({
  activeWallSnap,
  snapDistanceLabel,
  onSnapWall,
}: OSnapOverlayProps) {
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [snapPulseId, setSnapPulseId] = useState<string | null>(null);

  const hoveredPoint = useMemo(
    () => OSNAP_POINTS.find((point) => point.id === hoveredPointId) || null,
    [hoveredPointId]
  );

  const handleSnapPoint = (point: OSnapPoint) => {
    if (!point.wall) return;
    setSnapPulseId(point.id);
    onSnapWall(point.wall);

    window.setTimeout(() => {
      setSnapPulseId((current) => (current === point.id ? null : current));
      setHoveredPointId(null);
    }, 520);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[35]">
      {OSNAP_POINTS.map((point) => {
        const isHovered = hoveredPointId === point.id;
        const isPulsing = snapPulseId === point.id;

        return (
          <div key={point.id}>
            <button
              type="button"
              title={`${point.title} · ${point.hint} · ${snapDistanceLabel}`}
              aria-label={`${point.title} ${point.hint}`}
              onMouseEnter={() => setHoveredPointId(point.id)}
              onFocus={() => setHoveredPointId(point.id)}
              onMouseLeave={() => setHoveredPointId(null)}
              onBlur={() => setHoveredPointId(null)}
              onClick={() => handleSnapPoint(point)}
              className={`${getHotspotClasses(point)} ${point.hotspotClassName || point.className}`}
            />

            <div
              className={`${getPointClasses(point, isHovered || isPulsing)} ${point.className}`}
            >
              <span className="drop-shadow-[0_1px_5px_rgba(0,0,0,0.80)]">{point.label}</span>

              {isHovered && (
                <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-200/25 bg-slate-950/88 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-50 shadow-[0_10px_24px_rgba(0,0,0,0.42)] backdrop-blur-md">
                  {point.title}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {hoveredPoint && (
        <div className="pointer-events-none absolute bottom-[104px] left-1/2 z-40 -translate-x-1/2 rounded-full border border-cyan-200/18 bg-slate-950/78 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-50 shadow-[0_12px_34px_rgba(0,0,0,0.42)] backdrop-blur-md">
          {hoveredPoint.title}
          <span className="ml-2 text-cyan-200/75">{hoveredPoint.hint}</span>
          <span className="ml-2 text-emerald-200/75">{snapDistanceLabel}</span>
        </div>
      )}
    </div>
  );
}
