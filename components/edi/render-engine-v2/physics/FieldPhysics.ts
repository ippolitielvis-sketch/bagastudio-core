export class FieldPhysics {
  strength(time: number) { return .75 + Math.sin(time * .4) * .12; }
}
