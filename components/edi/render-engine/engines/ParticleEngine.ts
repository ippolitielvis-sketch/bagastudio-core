import { mapEdiStateVisual } from "./StateVisualMapper";
import type { EdiRenderFrame } from "../types";

export function renderParticles({ context, width, height, time, state, compact }: EdiRenderFrame) {
  const visual = mapEdiStateVisual(state);
  const count = compact ? 8 : 14;
  for (let index = 0; index < count; index += 1) {
    const angle = index * 2.41 + time * .12 * visual.speed;
    const radius = width * (.18 + (index % 5) * .055);
    const attraction = .68 + Math.sin(time * .4 + index) * .16;
    const x = width * .5 + Math.cos(angle) * radius * attraction;
    const y = height * .46 + Math.sin(angle * 1.13) * radius * .65 * attraction;
    context.fillStyle = `rgba(243,215,148,${visual.particles * (.28 + (index % 3) * .18)})`;
    context.beginPath();
    context.arc(x, y, index % 4 ? .65 : 1.1, 0, Math.PI * 2);
    context.fill();
  }
}
