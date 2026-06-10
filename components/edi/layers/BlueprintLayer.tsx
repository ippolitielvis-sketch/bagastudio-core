import type { EdiLayerPropsV3, EdiProjectBlueprintV4 } from "../types";

export default function BlueprintLayer({ ediState, projectBlueprint }: EdiLayerPropsV3 & { projectBlueprint?: EdiProjectBlueprintV4 }) {
  return (
    <svg className={`edi-v3__blueprint edi-v3__blueprint--${ediState} ${projectBlueprint ? "edi-v3__blueprint--project" : ""}`} viewBox="0 0 160 90" aria-hidden="true">
      <defs><radialGradient id="ediWorkshopLightV8"><stop offset="0" stopColor="var(--edi-primary)" stopOpacity=".28" /><stop offset="1" stopColor="#020617" stopOpacity=".04" /></radialGradient></defs>
      <g className="edi-v3__workshop"><path className="edi-v3__table" d="M13 35l132 0 11 49H4z" /><path className="edi-v3__sheet edi-v3__sheet--back" d="M31 34h96l8 43H24z" /><path className="edi-v3__sheet edi-v3__sheet--middle" d="M27 31h100l7 43H21z" /><path className="edi-v3__sheet edi-v3__sheet--front" d="M24 28h104l6 43H18z" /><ellipse className="edi-v3__workshop-light" cx="80" cy="54" rx="48" ry="25" /></g>
      <g className="edi-v3__sketch">
        <circle cx="80" cy="60" r="29" /><circle cx="80" cy="60" r="18" />
        <path d="M22 60h116M80 17v70M40 80l80-42M40 38l80 42M30 72h100M46 24h68" />
        <path className="edi-v3__spiral" d="M80 60c0-10 15-10 15 0 0 17-30 17-30-3 0-26 48-26 48 3" />
      </g>
      <g className="edi-v3__cad">
        <path d="M24 51v18M136 51v18M24 75h112M29 71l-5 4 5 4M131 71l5 4-5 4" />
        <path d="M49 20v9M111 20v9M49 24h62M54 20l-5 4 5 4M106 20l5 4-5 4" />
        <path d="M45 60a35 35 0 0 1 70 0M51 60a29 29 0 0 0 58 0" />
      </g>
      <g className="edi-v3__micro"><text x="20" y="48">R 29</text><text x="118" y="48">60°</text><text x="69" y="86">X 0.00</text></g>
      <g className="edi-v3__seal"><circle cx="80" cy="60" r="8" /><path d="M80 52l7 4v8l-7 4-7-4v-8zM68 60h24M80 48v24" /></g>
      <g className="edi-v3__micro-drawings"><path d="M30 42h18v12H30zM33 51l6-6 6 6M112 42v13m-8-7h16M105 55h14M54 34h15l4 7H58z" /><text x="102" y="37">SEC A-A</text></g>
      {projectBlueprint?.paths?.map((path, index) => <path className="edi-v3__project-path" d={path} key={`${path}-${index}`} />)}
    </svg>
  );
}
