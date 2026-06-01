export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

export type DynamicRuleConflictResolverV29Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
};

export type WallIntelligenceV30WallType = "masonry" | "drywall" | "wood" | "concrete" | "technical" | "unknown";
export type WallIntelligenceV30InputSource = "client_description" | "photo_assisted_future" | "dwg_dxf_future";
export type WallIntelligenceV30Confidence = "high" | "medium" | "low" | "unknown";
export type WallIntelligenceV30CheckStatus = "ready" | "review" | "blocked";

export type WallIntelligenceV30Profile = {
  id: string;
  label: string;
  wallType: WallIntelligenceV30WallType;
  inputSource: WallIntelligenceV30InputSource;
  confidence: WallIntelligenceV30Confidence;
  thicknessMm: number | null;
  estimatedMaxLoadKg: number | null;
  customerDescription: string;
  requiresInstallerVerification: boolean;
  acceptedForPreliminaryLayout: boolean;
  futureEvidenceSlots: string[];
};

export type WallIntelligenceV30FixingTarget = {
  id: string;
  label: string;
  category: "mirror" | "suspended_cabinet" | "shelf" | "wall_panel" | "technical_point";
  estimatedWeightKg: number;
  linkedWallId: string;
  requiredFixingPoints: number;
  minimumRecommendedFixingPoints: number;
  suggestedHardware: string[];
  status: WallIntelligenceV30CheckStatus;
  warning: string;
};

export type WallIntelligenceEngineV30Report = {
  schema: "bagastudio-wall-intelligence-engine-v3-0";
  version: "3.0";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceRuleResolverSchema: DynamicRuleConflictResolverV29Report["schema"];
  strategy: {
    primaryInput: "client_description";
    futureInputs: WallIntelligenceV30InputSource[];
    mergePolicy: string[];
    doesNotReplaceInstallerVerification: boolean;
  };
  wallProfiles: WallIntelligenceV30Profile[];
  fixingTargets: WallIntelligenceV30FixingTarget[];
  technicalWarnings: string[];
  totals: {
    walls: number;
    unknownWalls: number;
    targets: number;
    ready: number;
    review: number;
    blocked: number;
  };
  nextActions: string[];
};

export function buildWallIntelligenceEngineV30Report(params: {
  conflictResolverV29: DynamicRuleConflictResolverV29Report;
}): WallIntelligenceEngineV30Report {
  const wallProfiles: WallIntelligenceV30Profile[] = [
    {
      id: "wall-v3-0-client-main",
      label: "Parete principale da descrizione cliente",
      wallType: "unknown",
      inputSource: "client_description",
      confidence: "unknown",
      thicknessMm: null,
      estimatedMaxLoadKg: null,
      customerDescription: "Prima fase: il cliente descrive la parete tramite scheda guidata. Foto e DWG saranno prove successive di conferma.",
      requiresInstallerVerification: true,
      acceptedForPreliminaryLayout: true,
      futureEvidenceSlots: ["foto parete", "pianta quotata", "DWG/DXF", "nota installatore"],
    },
    {
      id: "wall-v3-0-masonry-reference",
      label: "Profilo riferimento muratura",
      wallType: "masonry",
      inputSource: "client_description",
      confidence: "medium",
      thicknessMm: 120,
      estimatedMaxLoadKg: 80,
      customerDescription: "Parete dichiarata in muratura: valida per pre-verifica fissaggi, da confermare in sopralluogo.",
      requiresInstallerVerification: true,
      acceptedForPreliminaryLayout: true,
      futureEvidenceSlots: ["foto", "DWG/DXF", "conferma supporto"],
    },
    {
      id: "wall-v3-0-drywall-reference",
      label: "Profilo riferimento cartongesso",
      wallType: "drywall",
      inputSource: "client_description",
      confidence: "medium",
      thicknessMm: 75,
      estimatedMaxLoadKg: 25,
      customerDescription: "Parete dichiarata in cartongesso: richiede verifica montanti e ferramenta dedicata.",
      requiresInstallerVerification: true,
      acceptedForPreliminaryLayout: true,
      futureEvidenceSlots: ["foto", "posizione montanti", "scheda parete", "DWG/DXF"],
    },
  ];

  const fixingTargets: WallIntelligenceV30FixingTarget[] = wallProfiles.flatMap((wall) => {
    if (wall.wallType === "unknown") {
      return [
        {
          id: `v3-0-target-mirror-${wall.id}`,
          label: "Specchio sospeso / pannello specchio",
          category: "mirror",
          estimatedWeightKg: 18,
          linkedWallId: wall.id,
          requiredFixingPoints: 4,
          minimumRecommendedFixingPoints: 4,
          suggestedHardware: ["Dati parete insufficienti", "Richiedere descrizione cliente", "Confermare con foto/DWG in fase successiva"],
          status: "review",
          warning: "Tipo parete sconosciuto: il layout può proseguire, ma fissaggi e scheda tecnica restano da validare.",
        },
      ];
    }

    if (wall.wallType === "drywall") {
      return [
        {
          id: `v3-0-target-mirror-${wall.id}`,
          label: "Specchio su cartongesso",
          category: "mirror",
          estimatedWeightKg: 18,
          linkedWallId: wall.id,
          requiredFixingPoints: 4,
          minimumRecommendedFixingPoints: 4,
          suggestedHardware: ["Tassello metallico tipo Molly", "Ancoraggio su montante", "Verifica carico installatore"],
          status: "review",
          warning: "Cartongesso: verificare montanti e carico reale prima di confermare specchi/pensili.",
        },
        {
          id: `v3-0-target-shelf-${wall.id}`,
          label: "Mensola sospesa su cartongesso",
          category: "shelf",
          estimatedWeightKg: 12,
          linkedWallId: wall.id,
          requiredFixingPoints: 3,
          minimumRecommendedFixingPoints: 3,
          suggestedHardware: ["Staffa su montante", "Tassello cartongesso certificato", "Limitare carico utile"],
          status: "review",
          warning: "Mensola su cartongesso: evitare carichi elevati senza supporto strutturale.",
        },
      ];
    }

    return [
      {
        id: `v3-0-target-mirror-${wall.id}`,
        label: "Specchio / pannello su muratura",
        category: "mirror",
        estimatedWeightKg: 18,
        linkedWallId: wall.id,
        requiredFixingPoints: 4,
        minimumRecommendedFixingPoints: 4,
        suggestedHardware: ["Tassello ad espansione per muratura", "Vite adeguata al peso", "Verifica supporto reale"],
        status: "ready",
        warning: "Pre-verifica positiva su muratura dichiarata, da confermare in installazione.",
      },
    ];
  });

  const blocked = fixingTargets.filter((target) => target.status === "blocked").length;
  const review = fixingTargets.filter((target) => target.status === "review").length;
  const ready = fixingTargets.filter((target) => target.status === "ready").length;
  const unknownWalls = wallProfiles.filter((wall) => wall.wallType === "unknown").length;
  const resolverBlocked = params.conflictResolverV29.status === "LAYOUT_V2_BLOCKED";

  return {
    schema: "bagastudio-wall-intelligence-engine-v3-0",
    version: "3.0",
    generatedAt: new Date().toISOString(),
    status: resolverBlocked || blocked > 0
      ? "LAYOUT_V2_BLOCKED"
      : review > 0 || unknownWalls > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceRuleResolverSchema: params.conflictResolverV29.schema,
    strategy: {
      primaryInput: "client_description",
      futureInputs: ["photo_assisted_future", "dwg_dxf_future"],
      mergePolicy: [
        "La descrizione cliente crea il primo profilo parete e permette il layout preliminare.",
        "Foto e DWG/DXF non sostituiscono la descrizione: confermano, correggono o aumentano la confidenza del profilo.",
        "Se foto/DWG contraddicono la descrizione cliente, il sistema mette la parete in REVIEW e chiede conferma.",
        "Le regole di fissaggio critiche restano bloccanti fino a verifica installatore quando il supporto non è certo.",
      ],
      doesNotReplaceInstallerVerification: true,
    },
    wallProfiles,
    fixingTargets,
    technicalWarnings: fixingTargets
      .filter((target) => target.status !== "ready")
      .map((target) => target.warning),
    totals: {
      walls: wallProfiles.length,
      unknownWalls,
      targets: fixingTargets.length,
      ready,
      review,
      blocked,
    },
    nextActions: [
      "Creare scheda cliente guidata: tipo parete, spessore, materiale, presenza montanti, note e confidenza dato.",
      "Collegare ogni mobile/specchio/mensola alla parete corrispondente del Room Editor.",
      "Aggiungere motore suggerimento ferramenta in base a parete, peso stimato e categoria elemento.",
      "Preparare V3.1 con Wall Profile Form e predisposizione futura a foto/DWG come evidenze collegate.",
    ],
  };
}

