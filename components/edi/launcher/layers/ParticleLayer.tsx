export default function ParticleLayer() {
  return <span className="edi-launcher-core__particles">{[0, 1, 2, 3, 4, 5].map((index) => <i key={index} style={{ ["--edi-particle" as string]: index }} />)}</span>;
}
