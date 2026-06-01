type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

type LayoutRoomIntelligenceV2Zone = {
  id: string;
  label: string;
  type: string;
  status: "ready" | "review" | "blocked";
  requiredInput: string[];
  linkedOutput: string;
  note: string;
};

type LayoutRoomIntelligenceV2Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
  zones: LayoutRoomIntelligenceV2Zone[];
  sourceSmartValidatorStatus: string;
  validationRules: { requireScaledReference: boolean };
  totals: { blocked: number };
};

export type LayoutRoomIntelligenceV21Readiness = "ready" | "review" | "blocked";

export type LayoutRoomIntelligenceV21RiskLevel = "low" | "medium" | "high";

export type LayoutRoomIntelligenceV21ChecklistItem = {
  id: string;
  label: string;
  sourceZoneId: string;
  readiness: LayoutRoomIntelligenceV21Readiness;
  priority: "P1" | "P2" | "P3";
  action: string;
};

export type LayoutRoomIntelligenceV21Risk = {
  id: string;
  label: string;
  level: LayoutRoomIntelligenceV21RiskLevel;
  affectedArea: string;
  mitigation: string;
};

export type LayoutRoomIntelligenceV21Report = {
  schema: "bagastudio-layout-room-intelligence-v2-1";
  version: "2.1";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLayoutRoomIntelligenceV2Schema: LayoutRoomIntelligenceV2Report["schema"];
  sourceLayoutRoomIntelligenceV2Status: LayoutRoomIntelligenceV2Status;
  automation: {
    autoChecklist: boolean;
    wallElevationPreflight: boolean;
    roomRiskMatrix: boolean;
    exportGateSummary: boolean;
  };
  totals: {
    checklistItems: number;
    p1Actions: number;
    p2Actions: number;
    p3Actions: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
  };
  checklist: LayoutRoomIntelligenceV21ChecklistItem[];
  risks: LayoutRoomIntelligenceV21Risk[];
  wallElevationPreflight: {
    canGenerateWallElevations: boolean;
    needsScaledRoomShell: boolean;
    needsOpeningsApproval: boolean;
    needsTechnicalPointsApproval: boolean;
    needsSmartValidatorClearance: boolean;
  };
  exportGate: {
    pdfReady: boolean;
    dxfCadReady: boolean;
    customerPreviewReady: boolean;
    reason: string;
  };
  nextActions: string[];
};

export function buildLayoutRoomIntelligenceV21Report(params: {
  layoutV2: LayoutRoomIntelligenceV2Report;
}): LayoutRoomIntelligenceV21Report {
  const blockedZones = params.layoutV2.zones.filter((zone) => zone.status === "blocked");
  const reviewZones = params.layoutV2.zones.filter((zone) => zone.status === "review");
  const roomShellZone = params.layoutV2.zones.find((zone) => zone.type === "room_shell");
  const openingZone = params.layoutV2.zones.find((zone) => zone.type === "opening");
  const technicalPointZone = params.layoutV2.zones.find((zone) => zone.type === "technical_point");
  const wallElevationZone = params.layoutV2.zones.find((zone) => zone.type === "wall_elevation");

  const checklist: LayoutRoomIntelligenceV21ChecklistItem[] = params.layoutV2.zones.map((zone) => ({
    id: `v2-1-check-${zone.id}`,
    label: zone.label,
    sourceZoneId: zone.id,
    readiness: zone.status,
    priority: zone.status === "blocked" ? "P1" : zone.status === "review" ? "P2" : "P3",
    action:
      zone.status === "blocked"
        ? `Sbloccare: ${zone.requiredInput.join(", ")}.`
        : zone.status === "review"
          ? `Verificare e approvare: ${zone.requiredInput.join(", ")}.`
          : `Pronto per output: ${zone.linkedOutput}.`,
  }));

  const risks: LayoutRoomIntelligenceV21Risk[] = [
    ...blockedZones.map((zone): LayoutRoomIntelligenceV21Risk => ({
      id: `risk-high-${zone.id}`,
      label: `Blocco su ${zone.label}`,
      level: "high",
      affectedArea: zone.type.replace(/_/g, " "),
      mitigation: zone.note,
    })),
    ...reviewZones.map((zone): LayoutRoomIntelligenceV21Risk => ({
      id: `risk-medium-${zone.id}`,
      label: `Dato da approvare su ${zone.label}`,
      level: "medium",
      affectedArea: zone.type.replace(/_/g, " "),
      mitigation: `Completare input richiesti: ${zone.requiredInput.join(", ")}.`,
    })),
  ];

  if (risks.length === 0) {
    risks.push({
      id: "risk-low-layout-ready",
      label: "Layout V2 pronto per schede tecniche",
      level: "low",
      affectedArea: "technical export",
      mitigation: "Procedere con generazione prospetti, PDF tecnico e DXF/CAD quando il modulo export sarà collegato.",
    });
  }

  const highRisks = risks.filter((risk) => risk.level === "high").length;
  const mediumRisks = risks.filter((risk) => risk.level === "medium").length;
  const lowRisks = risks.filter((risk) => risk.level === "low").length;
  const pdfReady = params.layoutV2.status === "LAYOUT_V2_READY" && highRisks === 0;
  const customerPreviewReady = params.layoutV2.totals.blocked === 0;

  return {
    schema: "bagastudio-layout-room-intelligence-v2-1",
    version: "2.1",
    generatedAt: new Date().toISOString(),
    status: params.layoutV2.status,
    sourceLayoutRoomIntelligenceV2Schema: params.layoutV2.schema,
    sourceLayoutRoomIntelligenceV2Status: params.layoutV2.status,
    automation: {
      autoChecklist: true,
      wallElevationPreflight: true,
      roomRiskMatrix: true,
      exportGateSummary: true,
    },
    totals: {
      checklistItems: checklist.length,
      p1Actions: checklist.filter((item) => item.priority === "P1").length,
      p2Actions: checklist.filter((item) => item.priority === "P2").length,
      p3Actions: checklist.filter((item) => item.priority === "P3").length,
      highRisks,
      mediumRisks,
      lowRisks,
    },
    checklist,
    risks,
    wallElevationPreflight: {
      canGenerateWallElevations: wallElevationZone?.status === "ready" && params.layoutV2.status === "LAYOUT_V2_READY",
      needsScaledRoomShell: roomShellZone?.status !== "ready",
      needsOpeningsApproval: openingZone?.status !== "ready",
      needsTechnicalPointsApproval: technicalPointZone?.status !== "ready",
      needsSmartValidatorClearance: params.layoutV2.sourceSmartValidatorStatus !== "TECHNICAL_VALIDATION_READY",
    },
    exportGate: {
      pdfReady,
      dxfCadReady: pdfReady && params.layoutV2.validationRules.requireScaledReference,
      customerPreviewReady,
      reason: pdfReady
        ? "Nessun blocco critico rilevato: export tecnico predisposto."
        : customerPreviewReady
          ? "Anteprima cliente possibile, ma servono approvazioni prima di PDF/DXF/CAD finale."
          : "Export bloccato finché restano zone critiche o Smart Technical Validator non superato.",
    },
    nextActions: [
      "Trasformare la checklist V2.1 in input UI compilabili per stanza, muri, aperture e punti tecnici.",
      "Collegare la matrice rischi ai futuri alert visivi su pianta e prospetto parete.",
      "Usare exportGate come blocco reale prima di PDF/DXF/CAD tecnico finale.",
    ],
  };
}
