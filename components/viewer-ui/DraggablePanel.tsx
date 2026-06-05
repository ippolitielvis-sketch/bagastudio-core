"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

type DraggablePanelPosition = {
  x: number;
  y: number;
};

type DraggablePanelProps = {
  id: string;
  title: string;
  eyebrow?: string;
  defaultPosition?: DraggablePanelPosition;
  widthClassName?: string;
  zIndex?: number;
  onClose?: () => void;
  children: ReactNode;
};

const clampPanelPosition = (value: DraggablePanelPosition): DraggablePanelPosition => {
  if (typeof window === "undefined") return value;

  const safeMargin = 16;
  const maxX = Math.max(safeMargin, window.innerWidth - 220);
  const maxY = Math.max(safeMargin, window.innerHeight - 160);

  return {
    x: Math.min(Math.max(value.x, safeMargin), maxX),
    y: Math.min(Math.max(value.y, safeMargin), maxY),
  };
};

export default function DraggablePanel({
  id,
  title,
  eyebrow,
  defaultPosition = { x: 560, y: 220 },
  widthClassName = "w-[360px]",
  zIndex = 70,
  onClose,
  children,
}: DraggablePanelProps) {
  const [position, setPosition] = useState<DraggablePanelPosition>(() => defaultPosition);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(`bagastudio-panel-${id}`);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<DraggablePanelPosition>;
      if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
        setPosition(clampPanelPosition({ x: Number(parsed.x), y: Number(parsed.y) }));
      }
    } catch {
      // Ignore corrupted panel position cache.
    }
  }, [id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const next = clampPanelPosition({
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      });
      setPosition(next);
    };

    const handleUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      try {
        window.localStorage.setItem(`bagastudio-panel-${id}`, JSON.stringify(position));
      } catch {
        // Local storage may be unavailable.
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [id, position]);

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const resetPosition = () => {
    const next = clampPanelPosition(defaultPosition);
    setPosition(next);
    try {
      window.localStorage.removeItem(`bagastudio-panel-${id}`);
    } catch {
      // Local storage may be unavailable.
    }
  };

  return (
    <div
      className={`absolute ${widthClassName} rounded-3xl border border-cyan-400/25 bg-slate-950/94 text-white shadow-[0_28px_80px_rgba(0,0,0,0.58)] backdrop-blur-xl`}
      style={{ left: position.x, top: position.y, zIndex }}
    >
      <div
        className="flex cursor-move select-none items-center justify-between gap-3 rounded-t-3xl border-b border-white/10 bg-white/[0.035] px-4 py-3"
        onMouseDown={handleMouseDown}
        title="Trascina per spostare la finestra"
      >
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">{eyebrow}</div>
          )}
          <div className="truncate text-sm font-black tracking-wide text-white">{title}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-600/80 bg-slate-900/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 hover:bg-slate-800"
            onClick={resetPosition}
          >
            Reset
          </button>
          {onClose && (
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-600/80 bg-slate-900/70 text-sm font-black text-slate-200 hover:bg-red-500/20 hover:text-red-100"
              onClick={onClose}
              aria-label="Chiudi finestra"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
