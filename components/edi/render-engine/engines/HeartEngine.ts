import { mapEdiStateVisual } from "./StateVisualMapper";
import type { EdiRenderFrame } from "../types";

export function renderHeart({ context, width, height, time, state, intensity }: EdiRenderFrame) {
  const visual = mapEdiStateVisual(state);
  const pulse = 1 + Math.sin(time * visual.speed * 2.2) * .07 * visual.heart;
  const x = width * .5;
  const y = height * .46;
  const radius = width * .11 * pulse;
  const glow = context.createRadialGradient(x - radius * .2, y - radius * .25, 0, x, y, radius * 2.8);
  glow.addColorStop(0, `rgba(255,254,244,${Math.min(1, intensity)})`);
  glow.addColorStop(.22, `rgba(245,216,151,${visual.warm * .9})`);
  glow.addColorStop(.55, `rgba(82,184,222,${visual.heart * .42})`);
  glow.addColorStop(1, "rgba(5,24,42,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.ellipse(x, y, radius * 1.15, radius * .9, -.18, 0, Math.PI * 2);
  context.fill();
}
