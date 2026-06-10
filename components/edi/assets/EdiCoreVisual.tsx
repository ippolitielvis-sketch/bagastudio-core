export type EdiCoreVisualState = "idle" | "thinking" | "analyzing" | "speaking" | "suggestion" | "warning" | "success";

const particles = [[18, 53], [25, 31], [38, 20], [75, 19], [91, 35], [102, 58], [91, 77], [74, 91], [38, 88], [19, 75]];

function MagneticFields() {
  return <g className="edi-core-visual__fields"><path d="M8 69C24 33 72 10 110 39" /><path d="M15 87c29 22 73 15 96-20" /><path d="M31 13C9 42 22 85 66 103" /><path d="M91 16c25 25 17 65-17 88" /></g>;
}

function PlasmaField() {
  return <g className="edi-core-visual__plasma"><path d="M35 65c-5-19 9-37 28-37 22 0 35 22 25 41-10 20-45 22-53-4Z" /><path d="M42 72c-13-14-4-37 15-40 22-3 38 20 25 39-10 15-29 14-40 1Z" /><path d="M45 35c8-8 21-11 31-5M31 59c-3 15 5 27 18 34M73 91c13-5 22-16 22-29" /></g>;
}

function HeartCore() {
  return <><path className="edi-core-visual__heart" d="M59 39c14-2 25 10 22 24-3 16-16 25-29 20-14-5-19-20-11-32 4-7 10-11 18-12Z" fill="url(#edi-v1-heart)" /><path className="edi-core-visual__consciousness" d="M58 50c7-1 12 5 10 12-2 7-8 11-14 8-6-3-7-10-4-15 2-3 5-5 8-5Z" /></>;
}

function NeuralFilaments() {
  return <g className="edi-core-visual__neural"><path d="M56 53 42 43 29 47 15 37M48 66 35 74 23 69 11 80M69 54 82 42 98 46 111 34M68 68 83 77 96 72 110 83M58 43 52 28 59 14M59 78 67 94 62 108" /><path d="M42 43 37 30 27 23M35 74 30 87 19 94M82 42 88 29 99 21M83 77 90 91 102 98" /></g>;
}

function KnowledgeParticles() {
  return <g className="edi-core-visual__particles">{particles.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r={index % 3 === 0 ? 1.15 : .7} style={{ animationDelay: `${index * -.8}s` }} />)}</g>;
}

function EnergyLeaks() {
  return <g className="edi-core-visual__leaks"><path d="M60 31 57 20 61 10M35 50 22 44 14 35M83 55 97 49 108 39M77 79 89 91 96 105" /><circle cx="61" cy="10" r="1.2" /><circle cx="108" cy="39" r=".9" /></g>;
}

function BlueprintBase() {
  return <g className="edi-core-visual__blueprint"><path d="M19 119h82M31 125V99m19 26V96m20 29V96m19 29V99M25 112h70M37 104h46" /><path d="M60 101l11 7v13l-11 6-11-6v-13zM60 101v26M49 108l22 13M71 108l-22 13" /><path d="M27 120l8-16 7 16M82 104l-8 17h17z" /></g>;
}

function VerticalEnergyColumn() {
  return <g className="edi-core-visual__pulse"><path d="M60 103V82" /><circle cx="60" cy="103" r="1.5" /></g>;
}

export default function EdiCoreVisual({ state = "idle" }: { state?: EdiCoreVisualState }) {
  return (
    <span className="edi-core-visual" data-edi-state={state} aria-hidden="true">
      {/* Approved professional SVG/Lottie/Canvas assets can replace this visual behind the same API. */}
      <svg className="edi-core-visual__asset" viewBox="0 0 120 132">
        <defs>
          <radialGradient id="edi-v1-heart" cx="43%" cy="39%"><stop offset="0" stopColor="#fffef8" /><stop offset=".24" stopColor="#fae4aa" /><stop offset=".54" stopColor="#8bd3ee" stopOpacity=".92" /><stop offset="1" stopColor="#082a49" stopOpacity="0" /></radialGradient>
          <linearGradient id="edi-v1-field" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#69c8eb" stopOpacity=".2" /><stop offset=".48" stopColor="#e2bd70" stopOpacity=".86" /><stop offset="1" stopColor="#63bce1" stopOpacity=".18" /></linearGradient>
          <filter id="edi-v1-soft"><feGaussianBlur stdDeviation="3.2" /></filter>
          <filter id="edi-v1-glint"><feGaussianBlur stdDeviation=".65" /></filter>
        </defs>
        <g className="edi-core-visual__aura" filter="url(#edi-v1-soft)"><path d="M26 65C22 34 44 15 68 19c28 5 38 29 27 53-11 23-38 32-58 18-9-6-10-15-11-25Z" /><path d="M36 72C17 48 36 24 58 25c24 1 39 23 31 43-9 22-37 31-53 4Z" /></g>
        <MagneticFields /><PlasmaField /><HeartCore /><NeuralFilaments /><KnowledgeParticles /><EnergyLeaks /><BlueprintBase /><VerticalEnergyColumn />
      </svg>
      <style>{`
        .edi-core-visual{position:absolute;inset:0;display:block;isolation:isolate;animation:ediV1Breath 4.4s ease-in-out infinite}.edi-core-visual__asset{position:absolute;left:-13%;top:-15%;width:126%;height:138%;overflow:visible;filter:drop-shadow(0 0 8px #5abce144) drop-shadow(0 0 13px #d6ae5840)}
        .edi-core-visual__aura{fill:#58bce1;opacity:.22;animation:ediV1Aura 4.4s ease-in-out infinite}.edi-core-visual__aura path:last-child{fill:#d8b361;opacity:.42}
        .edi-core-visual__fields{fill:none;stroke:url(#edi-v1-field);stroke-width:.65;stroke-linecap:round;stroke-dasharray:15 8;filter:url(#edi-v1-glint)}.edi-core-visual__fields path{animation:ediV1Field 15s ease-in-out infinite}.edi-core-visual__fields path:nth-child(2){animation-duration:19s;animation-direction:reverse}.edi-core-visual__fields path:nth-child(3){animation-duration:22s}.edi-core-visual__fields path:nth-child(4){animation-duration:17s;animation-direction:reverse}
        .edi-core-visual__plasma{fill:none;stroke:#63c5e8;stroke-linecap:round;filter:url(#edi-v1-soft);mix-blend-mode:screen}.edi-core-visual__plasma path:first-child{stroke-width:7;opacity:.25;animation:ediV1Plasma 12s ease-in-out infinite}.edi-core-visual__plasma path:nth-child(2){stroke:#d8b362;stroke-width:4;opacity:.21;animation:ediV1Plasma 17s ease-in-out infinite reverse}.edi-core-visual__plasma path:nth-child(n+3){stroke-width:1;stroke-dasharray:7 5;opacity:.72;filter:url(#edi-v1-glint);animation:ediV1Flow 8s ease-in-out infinite}
        .edi-core-visual__heart{transform-origin:60px 61px;animation:ediV1Heart 4.4s ease-in-out infinite}.edi-core-visual__consciousness{fill:#fffdf3;filter:url(#edi-v1-soft);transform-origin:59px 60px;animation:ediV1Consciousness 4.4s ease-in-out infinite}.edi-core-visual__neural{fill:none;stroke:#b9e9f6;stroke-width:.85;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:8 5;filter:url(#edi-v1-glint);animation:ediV1Neural 8s ease-in-out infinite}.edi-core-visual__neural path:last-child{stroke:#e0bd72;stroke-width:.65;animation-delay:-4s}
        .edi-core-visual__particles{fill:#f3d996;filter:url(#edi-v1-glint)}.edi-core-visual__particles circle{transform-origin:60px 60px;animation:ediV1Particle 8.5s ease-in-out infinite}.edi-core-visual__blueprint{fill:none;stroke:#72c8e788;stroke-width:.55;stroke-dasharray:3 3;filter:url(#edi-v1-glint);animation:ediV1Blueprint 12s linear infinite}.edi-core-visual__blueprint path:nth-child(n+2){stroke:#d8b66d88}.edi-core-visual__pulse{fill:#f2d68f;stroke:#e8c778;stroke-width:.8;filter:url(#edi-v1-glint);animation:ediV1Pulse 4.4s ease-in-out infinite}
        .edi-core-visual__leaks{fill:#f4d990;stroke:#d8ecf3;stroke-width:.7;stroke-linecap:round;filter:url(#edi-v1-glint);animation:ediV1Leaks 7s ease-in-out infinite}.edi-core-visual[data-edi-state="speaking"]{animation-duration:3s}.edi-core-visual[data-edi-state="speaking"] .edi-core-visual__heart,.edi-core-visual[data-edi-state="speaking"] .edi-core-visual__pulse{animation-duration:3s}.edi-core-visual[data-edi-state="thinking"] .edi-core-visual__plasma path{animation-duration:7s}.edi-core-visual[data-edi-state="analyzing"] .edi-core-visual__neural,.edi-core-visual[data-edi-state="analyzing"] .edi-core-visual__particles{opacity:1}.edi-core-visual[data-edi-state="suggestion"] .edi-core-visual__consciousness{filter:url(#edi-v1-soft);opacity:1}.edi-core-visual[data-edi-state="suggestion"] .edi-core-visual__leaks{stroke:#ffe5a0;animation-duration:4s}.edi-core-visual[data-edi-state="warning"]{filter:sepia(.18) saturate(.82)}.edi-core-visual[data-edi-state="success"] .edi-core-visual__pulse{animation-duration:2.8s}
        @keyframes ediV1Breath{50%{transform:scale(1.022)}}@keyframes ediV1Aura{50%{transform:scale(1.1);transform-origin:60px 60px;opacity:.34}}@keyframes ediV1Field{0%,100%{stroke-dashoffset:0;transform:scale(1,.96);transform-origin:60px 60px}50%{stroke-dashoffset:-35;transform:scale(.96,1.04)}}@keyframes ediV1Plasma{50%{transform:rotate(8deg) scale(1.06,.95);transform-origin:60px 60px}}@keyframes ediV1Flow{50%{stroke-dashoffset:-22;opacity:1}}@keyframes ediV1Heart{0%,100%{transform:scale(.94);opacity:.86}50%{transform:scale(1.08);opacity:1}}@keyframes ediV1Consciousness{0%,100%{transform:scale(.7);opacity:.65}50%{transform:scale(1.1);opacity:1}}@keyframes ediV1Neural{0%,100%{stroke-dashoffset:0;opacity:.2}48%,62%{stroke-dashoffset:-24;opacity:.92}78%{opacity:.3}}@keyframes ediV1Particle{0%,100%{transform:scale(1) translate(0,0);opacity:.12}48%{transform:scale(.3) translate(15px,-10px);opacity:.84}72%{transform:scale(1.1) translate(-4px,6px);opacity:.3}}@keyframes ediV1Leaks{0%,100%{transform:translateY(3px);opacity:.15}52%{transform:translateY(-4px);opacity:.85}}@keyframes ediV1Blueprint{to{stroke-dashoffset:-42}}@keyframes ediV1Pulse{0%,100%{transform:translateY(4px);opacity:.2}50%{transform:translateY(-7px);opacity:.9}}
      `}</style>
    </span>
  );
}
