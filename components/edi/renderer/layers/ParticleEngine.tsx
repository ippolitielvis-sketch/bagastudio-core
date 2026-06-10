const points = [[14, 51], [23, 29], [38, 17], [72, 18], [91, 35], [99, 62], [79, 86], [40, 86]];

export default function ParticleEngine() {
  return <g className="edi-renderer__particles">{points.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r=".8" style={{ animationDelay: `${index * -.8}s` }} />)}</g>;
}
