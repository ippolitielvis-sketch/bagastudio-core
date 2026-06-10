import type { EdiRenderEngineState, EdiStateVisual } from "../types";

const visuals: Record<EdiRenderEngineState, EdiStateVisual> = {
  idle: { heart: .72, plasma: .45, particles: .35, magnetic: .28, speed: .55, warm: .45 },
  thinking: { heart: .84, plasma: .72, particles: .48, magnetic: .45, speed: .72, warm: .5 },
  analyzing: { heart: .9, plasma: .82, particles: .8, magnetic: .52, speed: .8, warm: .48 },
  speaking: { heart: 1, plasma: .68, particles: .62, magnetic: .44, speed: 1, warm: .58 },
  suggestion: { heart: 1, plasma: .8, particles: .7, magnetic: .54, speed: .82, warm: 1 },
  warning: { heart: .88, plasma: .62, particles: .42, magnetic: .36, speed: .6, warm: .82 },
  success: { heart: .96, plasma: .66, particles: .68, magnetic: .48, speed: .68, warm: .72 },
};

export function mapEdiStateVisual(state: EdiRenderEngineState): EdiStateVisual {
  return visuals[state];
}
