type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW_REQUIRED" | "LAYOUT_V2_BLOCKED";

type LayoutRoomIntelligenceV23WallRule = {
  id: string;
  passed: boolean;
};

type LayoutRoomIntelligenceV23Report = {
  schema: string;
  status: LayoutRoomIntelligenceV2Status;
  totals: {
    critical: number;
    exportBlockedRules: number;
  };
  wallRules: LayoutRoomIntelligenceV23WallRule[];
};

export type LayoutRoomIntelligenceV24CollisionSeverity = "ok" | "warning" | "critical";

export type LayoutRoomIntelligenceV24Check = {
  id: string;
  label: string;
  category: "clearance" | "opening" | "wall-support" | "service-point" | "baseboard" | "installation";
  severity: LayoutRoomIntelligenceV24CollisionSeverity;
  passed: boolean;
  minimumRequirement: string;
  detectedRisk: string;
  correctiveAction: string;
  exportImpact: "none" | "warning-layer" | "blocks-technical-export";
};

export type LayoutRoomIntelligenceV24Report = {
  schema: "bagastudio-layout-room-intelligence-v2-4";
  version: "2.4";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceLayoutRoomIntelligenceV23Schema: LayoutRoomIntelligenceV23Report["schema"];
  sourceLayoutRoomIntelligenceV23Status: LayoutRoomIntelligenceV2Status;
  layoutCollisionEngine: {
    validatesMinimumPassages: boolean;
    validatesOpeningsSwingArea: boolean;
    validatesFurnitureWallCompatibility: boolean;
    validatesTechnicalPointReachability: boolean;
    validatesInstallationAccess: boolean;
    sendsAlertsToWallElevationSheets: boolean;
  };
  thresholds: {
    minimumMainPassageCm: number;
    minimumServiceAccessCm: number;
    minimumDrawerOpeningCm: number;
    minimumInstallerWorkingAreaCm: number;
  };
  totals: {
    checks: number;
    passed: number;
    warnings: number;
    critical: number;
    exportBlockingChecks: number;
  };
  collisionChecks: LayoutRoomIntelligenceV24Check[];
  exportLayerActions: Array<{
    id: string;
    targetLayer: string;
    action: string;
    appliesWhen: string;
  }>;
  nextActions: string[];
};

export function buildLayoutRoomIntelligenceV24Report(params: {
  layoutV23: LayoutRoomIntelligenceV23Report;
}): LayoutRoomIntelligenceV24Report {
  const hasCriticalRules = params.layoutV23.totals.critical > 0;
  const hasExportBlocks = params.layoutV23.totals.exportBlockedRules > 0;
  const clearanceRule = params.layoutV23.wallRules.find((rule) => rule.id === "v2-3-rule-openings-clearance");
  const baseboardRule = params.layoutV23.wallRules.find((rule) => rule.id === "v2-3-rule-baseboard-cutout");
  const fixingRule = params.layoutV23.wallRules.find((rule) => rule.id === "v2-3-rule-wall-fixing-support");
  const plumbingRule = params.layoutV23.wallRules.find((rule) => rule.id === "v2-3-rule-plumbing-sink-height");
  const electricalRule = params.layoutV23.wallRules.find((rule) => rule.id === "v2-3-rule-electrical-services");

  const collisionChecks: LayoutRoomIntelligenceV24Check[] = [
    {
      id: "v2-4-check-main-passage",
      label: "Passaggio principale minimo",
      category: "clearance",
      severity: clearanceRule?.passed ? "ok" : "warning",
      passed: Boolean(clearanceRule?.passed),
      minimumRequirement: "Passaggio consigliato minimo 80 cm nelle zone operative principali.",
      detectedRisk: clearanceRule?.passed ? "Nessuna interferenza critica nota sui passaggi." : "Dati aperture/passaggi incompleti o da verificare.",
      correctiveAction: "Evidenziare il corridoio utile in overlay e bloccare solo in caso di interferenza reale con mobile/apertura.",
      exportImpact: clearanceRule?.passed ? "none" : "warning-layer",
    },
    {
      id: "v2-4-check-drawer-door-swing",
      label: "Apertura ante, cassetti e porte",
      category: "opening",
      severity: clearanceRule?.passed ? "ok" : "warning",
      passed: Boolean(clearanceRule?.passed),
      minimumRequirement: "Area di apertura libera davanti a cassetti, ante, porte e sportelli tecnici.",
      detectedRisk: clearanceRule?.passed ? "Area apertura coerente con le regole V2.3." : "Possibile collisione tra aperture stanza e parti mobili del prodotto.",
      correctiveAction: "Generare sagome apertura in prospetto/pianta e collegarle a collision overlay.",
      exportImpact: clearanceRule?.passed ? "none" : "warning-layer",
    },
    {
      id: "v2-4-check-wall-support-load",
      label: "Compatibilità parete / mobile sospeso",
      category: "wall-support",
      severity: fixingRule?.passed ? "ok" : "critical",
      passed: Boolean(fixingRule?.passed),
      minimumRequirement: "Tipo parete, carico mobile e ferramenta fissaggio devono essere validati prima di scheda finale.",
      detectedRisk: fixingRule?.passed ? "Supporto parete validabile dal Validator." : "Tipo parete o fissaggio non validato per mobili sospesi/mensole.",
      correctiveAction: "Richiedere tipo parete e ferramenta di fissaggio, poi inviare alert a layer fissaggi.",
      exportImpact: fixingRule?.passed ? "none" : "blocks-technical-export",
    },
    {
      id: "v2-4-check-technical-point-reachability",
      label: "Raggiungibilità punti elettrici/idraulici",
      category: "service-point",
      severity: plumbingRule?.passed && electricalRule?.passed ? "ok" : "warning",
      passed: Boolean(plumbingRule?.passed && electricalRule?.passed),
      minimumRequirement: "Punti tecnici quotati, accessibili e non coperti da fianchi, schiene o divisori.",
      detectedRisk: plumbingRule?.passed && electricalRule?.passed ? "Punti tecnici pronti per routing layer." : "Dati tecnici incompleti o non ancora associati al mobile.",
      correctiveAction: "Proiettare prese/scarichi sul prospetto parete e controllare interferenze con ingombro mobile.",
      exportImpact: plumbingRule?.passed && electricalRule?.passed ? "none" : "warning-layer",
    },
    {
      id: "v2-4-check-baseboard-installation",
      label: "Battiscopa, scassi e appoggio a parete",
      category: "baseboard",
      severity: baseboardRule?.passed ? "ok" : "warning",
      passed: Boolean(baseboardRule?.passed),
      minimumRequirement: "Battiscopa e scassi devono essere dichiarati quando il mobile arriva a parete o a terra.",
      detectedRisk: baseboardRule?.passed ? "Nessuno scasso bloccante rilevato." : "Possibile interferenza battiscopa/mobile da riportare in scheda.",
      correctiveAction: "Creare alert grafico su layer tecnico e nota montaggio dedicata.",
      exportImpact: baseboardRule?.passed ? "none" : "warning-layer",
    },
    {
      id: "v2-4-check-installer-working-area",
      label: "Area utile montatore",
      category: "installation",
      severity: hasCriticalRules || hasExportBlocks ? "critical" : "ok",
      passed: !(hasCriticalRules || hasExportBlocks),
      minimumRequirement: "Area operativa consigliata 70 cm davanti al mobile durante installazione e regolazioni.",
      detectedRisk: hasCriticalRules || hasExportBlocks ? "Sono presenti regole critiche che impediscono export tecnico affidabile." : "Area montaggio non bloccata dalle regole attuali.",
      correctiveAction: "Mostrare warning pre-export e rimandare a Smart Technical Validator prima di PDF/DXF finale.",
      exportImpact: hasCriticalRules || hasExportBlocks ? "blocks-technical-export" : "none",
    },
  ];

  const critical = collisionChecks.filter((check) => check.severity === "critical" && !check.passed).length;
  const warnings = collisionChecks.filter((check) => check.severity === "warning" && !check.passed).length;
  const passed = collisionChecks.filter((check) => check.passed).length;
  const exportBlockingChecks = collisionChecks.filter((check) => check.exportImpact === "blocks-technical-export" && !check.passed).length;

  return {
    schema: "bagastudio-layout-room-intelligence-v2-4",
    version: "2.4",
    generatedAt: new Date().toISOString(),
    status: exportBlockingChecks > 0 ? "LAYOUT_V2_BLOCKED" : warnings > 0 ? "LAYOUT_V2_REVIEW_REQUIRED" : "LAYOUT_V2_READY",
    sourceLayoutRoomIntelligenceV23Schema: params.layoutV23.schema,
    sourceLayoutRoomIntelligenceV23Status: params.layoutV23.status,
    layoutCollisionEngine: {
      validatesMinimumPassages: true,
      validatesOpeningsSwingArea: true,
      validatesFurnitureWallCompatibility: true,
      validatesTechnicalPointReachability: true,
      validatesInstallationAccess: true,
      sendsAlertsToWallElevationSheets: true,
    },
    thresholds: {
      minimumMainPassageCm: 80,
      minimumServiceAccessCm: 60,
      minimumDrawerOpeningCm: 45,
      minimumInstallerWorkingAreaCm: 70,
    },
    totals: {
      checks: collisionChecks.length,
      passed,
      warnings,
      critical,
      exportBlockingChecks,
    },
    collisionChecks,
    exportLayerActions: [
      { id: "v2-4-layer-clearance", targetLayer: "layer-alerts", action: "Disegna area passaggio minimo e sagome apertura.", appliesWhen: "warning o critical su clearance/opening" },
      { id: "v2-4-layer-fixing", targetLayer: "layer-fixing", action: "Riporta blocco fissaggi e richiesta verifica supporto parete.", appliesWhen: "parete/mobile sospeso non validati" },
      { id: "v2-4-layer-services", targetLayer: "layer-electrical/layer-plumbing", action: "Evidenzia punti tecnici non raggiungibili o coperti dal mobile.", appliesWhen: "prese/scarichi non associati a quote affidabili" },
      { id: "v2-4-layer-baseboard", targetLayer: "layer-alerts", action: "Aggiunge nota scasso battiscopa e interferenza appoggio a parete.", appliesWhen: "battiscopa o zoccolo interferiscono con installazione" },
    ],
    nextActions: [
      "Collegare le collisionChecks V2.4 ai dati reali della piantina tracciata e ai Product Package inseriti nella stanza.",
      "Aggiungere overlay visivo passaggi/aperture direttamente nel Viewer/Room Editor.",
      "Usare exportLayerActions per trasferire automaticamente warning e blocchi nei prospetti parete PDF/DXF.",
      "Preparare V2.5: Room Trace / Wall Editor con pareti, aperture e scala modificabili dall'utente.",
    ],
  };
}
