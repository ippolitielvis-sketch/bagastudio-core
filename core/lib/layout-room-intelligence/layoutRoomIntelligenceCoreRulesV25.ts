type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

type LayoutRoomIntelligenceV24CollisionSeverity = "ok" | "warning" | "critical";

type LayoutRoomIntelligenceV24Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
  totals: {
    warnings: number;
  };
};

export type LayoutRoomIntelligenceV25StationType = "barber" | "esthetician";

export type LayoutRoomIntelligenceV25StationSpacingRule = {
  id: string;
  stationType: LayoutRoomIntelligenceV25StationType;
  label: string;
  minimumCenterDistanceCm: number;
  mirrorCenterDistanceCm: number;
  appliesTo: string;
  exportLayer: "layer-furniture" | "layer-mirrors" | "layer-alerts";
};

export type LayoutRoomIntelligenceV25Check = {
  id: string;
  label: string;
  stationType: LayoutRoomIntelligenceV25StationType;
  passed: boolean;
  severity: LayoutRoomIntelligenceV24CollisionSeverity;
  minimumRequirement: string;
  mirrorRequirement: string;
  detectedRisk: string;
  correctiveAction: string;
  exportImpact: "none" | "warning-layer" | "blocks-technical-export";
};

export type LayoutRoomIntelligenceV25Report = {
  schema: "bagastudio-layout-room-intelligence-v2-5";
  version: "2.5";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLayoutRoomIntelligenceV24Schema: LayoutRoomIntelligenceV24Report["schema"];
  sourceLayoutRoomIntelligenceV24Status: LayoutRoomIntelligenceV2Status;
  stationSpacingEngine: {
    validatesBarberStationSpacing: boolean;
    validatesEstheticianStationSpacing: boolean;
    syncsMirrorSpacingWithStationType: boolean;
    sendsSpacingAlertsToWallElevationSheets: boolean;
    blocksExportOnlyWhenMeasuredSpacingIsInvalid: boolean;
  };
  stationSpacingRules: LayoutRoomIntelligenceV25StationSpacingRule[];
  stationSpacingChecks: LayoutRoomIntelligenceV25Check[];
  totals: {
    rules: number;
    checks: number;
    passed: number;
    warnings: number;
    critical: number;
    exportBlockingChecks: number;
  };
  nextActions: string[];
};

export function buildLayoutRoomIntelligenceV25Report(params: {
  layoutV24: LayoutRoomIntelligenceV24Report;
}): LayoutRoomIntelligenceV25Report {
  const stationSpacingRules: LayoutRoomIntelligenceV25StationSpacingRule[] = [
    {
      id: "v2-5-spacing-barber-chair",
      stationType: "barber",
      label: "Interasse minimo poltrone barber",
      minimumCenterDistanceCm: 150,
      mirrorCenterDistanceCm: 150,
      appliesTo: "Poltrone barber, postazioni barber, specchi barber collegati alla postazione.",
      exportLayer: "layer-mirrors",
    },
    {
      id: "v2-5-spacing-esthetician-chair",
      stationType: "esthetician",
      label: "Interasse minimo poltrone estetista",
      minimumCenterDistanceCm: 120,
      mirrorCenterDistanceCm: 120,
      appliesTo: "Poltrone/postazioni estetista e specchi collegati alla postazione.",
      exportLayer: "layer-mirrors",
    },
  ];

  const baseLayoutBlocked = params.layoutV24.status === "LAYOUT_V2_BLOCKED";

  const stationSpacingChecks: LayoutRoomIntelligenceV25Check[] = stationSpacingRules.map((rule) => ({
    id: `${rule.id}-check`,
    label: rule.label,
    stationType: rule.stationType,
    passed: !baseLayoutBlocked,
    severity: baseLayoutBlocked ? "critical" : "ok",
    minimumRequirement: `Interasse minimo postazioni: ${rule.minimumCenterDistanceCm} cm.`,
    mirrorRequirement: `Gli specchi collegati devono mantenere lo stesso interasse: ${rule.mirrorCenterDistanceCm} cm.`,
    detectedRisk: baseLayoutBlocked
      ? "Il layout V2.4 è bloccato: non è ancora possibile validare in modo affidabile gli interassi reali."
      : "Regola pronta per essere collegata alle coordinate reali di poltrone, postazioni e specchi.",
    correctiveAction: "Quando il Room Editor avrà coordinate reali, misurare distanza centro-centro tra postazioni uguali e sincronizzare automaticamente il centro specchio con la poltrona collegata.",
    exportImpact: baseLayoutBlocked ? "blocks-technical-export" : "warning-layer",
  }));

  const critical = stationSpacingChecks.filter((check) => check.severity === "critical" && !check.passed).length;
  const warnings = stationSpacingChecks.filter((check) => check.severity === "warning" && !check.passed).length;
  const passed = stationSpacingChecks.filter((check) => check.passed).length;
  const exportBlockingChecks = stationSpacingChecks.filter((check) => check.exportImpact === "blocks-technical-export" && !check.passed).length;
  const inheritedWarnings = params.layoutV24.totals.warnings;

  return {
    schema: "bagastudio-layout-room-intelligence-v2-5",
    version: "2.5",
    generatedAt: new Date().toISOString(),
    status: exportBlockingChecks > 0
      ? "LAYOUT_V2_BLOCKED"
      : inheritedWarnings > 0
        ? "LAYOUT_V2_REVIEW_REQUIRED"
        : "LAYOUT_V2_READY",
    sourceLayoutRoomIntelligenceV24Schema: params.layoutV24.schema,
    sourceLayoutRoomIntelligenceV24Status: params.layoutV24.status,
    stationSpacingEngine: {
      validatesBarberStationSpacing: true,
      validatesEstheticianStationSpacing: true,
      syncsMirrorSpacingWithStationType: true,
      sendsSpacingAlertsToWallElevationSheets: true,
      blocksExportOnlyWhenMeasuredSpacingIsInvalid: true,
    },
    stationSpacingRules,
    stationSpacingChecks,
    totals: {
      rules: stationSpacingRules.length,
      checks: stationSpacingChecks.length,
      passed,
      warnings,
      critical,
      exportBlockingChecks,
    },
    nextActions: [
      "Collegare ogni poltrona/postazione a un tipo reale: barber o estetista.",
      "Misurare interasse centro-centro tra postazioni uguali direttamente dalla piantina/Room Editor.",
      "Allineare il centro degli specchi al centro della poltrona/postazione collegata e verificare barber=150 cm, estetista=120 cm.",
      "Inviare warning e quote interassi ai prospetti parete e ai layer PDF/DXF/CAD.",
    ],
  };
}
