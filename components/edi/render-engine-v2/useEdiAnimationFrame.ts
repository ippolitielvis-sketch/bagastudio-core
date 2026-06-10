"use client";

import { useEffect } from "react";

export function useEdiAnimationFrame(render: (time: number, delta: number) => void) {
  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => { render(now / 1000, (now - previous) / 1000); previous = now; frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [render]);
}
