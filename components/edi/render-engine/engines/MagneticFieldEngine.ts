import { mapEdiStateVisual } from "./StateVisualMapper";
import type { EdiRenderFrame } from "../types";

export function renderMagneticField({ context, width, height, time, state, reducedMotion }: EdiRenderFrame) {
  const visual = mapEdiStateVisual(state);
  context.lineCap = "round";
  context.setLineDash([10, 14]);
  for (let index = 0; index < 3; index += 1) {
    const bend = Math.sin(time * (reducedMotion ? .03 : .12) + index * 2) * width * .05;
    context.strokeStyle = index === 1 ? `rgba(106,196,226,${visual.magnetic * .35})` : `rgba(214,180,108,${visual.magnetic * .3})`;
    context.lineWidth = .55;
    context.beginPath();
    context.moveTo(width * .05, height * (.35 + index * .16));
    context.bezierCurveTo(width * .28, height * .1 + bend, width * .7, height * .85 - bend, width * .95, height * (.28 + index * .17));
    context.stroke();
  }
  context.setLineDash([]);
}
