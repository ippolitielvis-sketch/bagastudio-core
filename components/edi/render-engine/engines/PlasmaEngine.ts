import { mapEdiStateVisual } from "./StateVisualMapper";
import type { EdiRenderFrame } from "../types";

export function renderPlasma({ context, width, height, time, state, reducedMotion }: EdiRenderFrame) {
  const visual = mapEdiStateVisual(state);
  context.lineCap = "round";
  for (let index = 0; index < 5; index += 1) {
    const phase = time * (reducedMotion ? .08 : .22) * visual.speed + index * 1.7;
    context.strokeStyle = index % 2 ? `rgba(218,180,103,${visual.plasma * .24})` : `rgba(92,197,232,${visual.plasma * .34})`;
    context.lineWidth = index % 2 ? .8 : 1.3;
    context.beginPath();
    context.moveTo(width * (.18 + index * .05), height * (.5 + Math.sin(phase) * .12));
    context.bezierCurveTo(width * .34, height * (.18 + Math.cos(phase) * .08), width * .67, height * (.78 + Math.sin(phase * .7) * .09), width * (.82 - index * .03), height * (.42 + Math.cos(phase) * .13));
    context.stroke();
  }
}
