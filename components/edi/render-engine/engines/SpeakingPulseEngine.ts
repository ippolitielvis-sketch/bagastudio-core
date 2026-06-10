import type { EdiRenderFrame } from "../types";

export function renderSpeakingPulse({ context, width, height, time, state }: EdiRenderFrame) {
  if (state !== "speaking") return;
  const pulse = (Math.sin(time * 4.2) + 1) * .5;
  context.strokeStyle = `rgba(166,225,242,${.12 + pulse * .35})`;
  context.lineWidth = .7;
  context.beginPath();
  context.moveTo(width * .34, height * .47);
  context.quadraticCurveTo(width * .5, height * (.38 - pulse * .04), width * .66, height * .47);
  context.stroke();
}
