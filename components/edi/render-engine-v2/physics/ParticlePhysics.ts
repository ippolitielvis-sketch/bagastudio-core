import { Vector3 } from "three";

export type EdiNeuralPathV1 = {
  id: string;
  points: ReadonlyArray<readonly [number, number, number]>;
  weight?: number;
};

export type EdiCognitiveParticleEventV1 = {
  id: string;
  type: "thought" | "analysis" | "speech" | "suggestion" | "warning" | "success";
  strength: number;
  pathId?: string;
};

export type EdiParticleEngineInputV1 = {
  neuralPaths: ReadonlyArray<EdiNeuralPathV1>;
  cognitiveEvents: ReadonlyArray<EdiCognitiveParticleEventV1>;
};

const DEFAULT_NEURAL_PATHS_V1: ReadonlyArray<EdiNeuralPathV1> = [
  { id: "core-flow-a", points: [[-.72, -.18, 0], [-.34, .12, 0], [0, 0, 0], [.38, -.16, 0], [.72, .2, 0]] },
  { id: "core-flow-b", points: [[-.62, .34, 0], [-.22, .2, 0], [0, 0, 0], [.28, .24, 0], [.66, -.3, 0]] },
  { id: "core-flow-c", points: [[-.46, -.5, 0], [-.18, -.22, 0], [0, 0, 0], [.18, .28, 0], [.5, .48, 0]] },
];

export class ParticlePhysics {
  private input: EdiParticleEngineInputV1 = { neuralPaths: DEFAULT_NEURAL_PATHS_V1, cognitiveEvents: [] };

  setInput(input: Partial<EdiParticleEngineInputV1>) {
    this.input = { ...this.input, ...input };
  }

  update(position: Vector3, time: number, index: number) {
    const usablePaths = this.input.neuralPaths.filter((path) => path.points.length > 1);
    const paths = usablePaths.length ? usablePaths : DEFAULT_NEURAL_PATHS_V1;
    const path = paths[index % paths.length];
    const progress = (time * .08 + index / Math.max(1, paths.length * 6)) % 1;
    const segmentProgress = progress * (path.points.length - 1);
    const segmentIndex = Math.min(path.points.length - 2, Math.floor(segmentProgress));
    const localProgress = segmentProgress - segmentIndex;
    const start = path.points[segmentIndex];
    const end = path.points[segmentIndex + 1];
    position.set(
      start[0] + (end[0] - start[0]) * localProgress,
      start[1] + (end[1] - start[1]) * localProgress,
      start[2] + (end[2] - start[2]) * localProgress,
    );
  }
}
