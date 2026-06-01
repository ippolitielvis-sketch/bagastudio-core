export type LayoutRoomIntelligenceV2Status = "LAYOUT_V2_READY" | "LAYOUT_V2_REVIEW" | "LAYOUT_V2_BLOCKED";

type WallIntelligenceEngineV30ReportLike = {
  schema: string;
  totals: { walls: number; unknownWalls: number };
};

type WallIntelligenceConfidenceEngineV32ReportLike = {
  schema: string;
  totals: { high: number; medium: number; low: number; needsVerification: number };
};

type WallIntelligenceLoadAnalyzerV33ReportLike = {
  schema: string;
  totals: { targets: number; review: number; critical: number; blocked: number };
};

type WallIntelligenceFixingRecommendationV34ReportLike = {
  schema: string;
  totals: { recommendations: number; critical: number; warning: number; installerRequired: number; drywallWarnings: number };
};

type WallIntelligenceMirrorShelfValidatorV35ReportLike = {
  schema: string;
  totals: { items: number; review: number; blocked: number; mirrorItems: number; shelfItems: number; suspendedCabinets: number; failedChecks: number };
};

export type WallTechnicalReportV36SectionStatus = "ready" | "review" | "blocked";

export type WallTechnicalReportV36Section = {
  id: string;
  title: string;
  status: WallTechnicalReportV36SectionStatus;
  summary: string;
  exportLayer: "pdf" | "dxf" | "cad" | "installer";
  items: string[];
};

export type WallTechnicalReportV36Report = {
  schema: "bagastudio-wall-technical-report-v3-6";
  version: "3.6";
  generatedAt: string;
  status: LayoutRoomIntelligenceV2Status;
  sourceReports: {
    guidedWallDescription: string;
    confidenceEngine: string;
    loadAnalyzer: string;
    fixingRecommendation: string;
    mirrorShelfValidator: string;
  };
  reportPrinciples: {
    clientDescriptionFirst: boolean;
    installerReadable: boolean;
    pdfDxfCadReady: boolean;
    notStructuralCertification: boolean;
  };
  sections: WallTechnicalReportV36Section[];
  totals: {
    sections: number;
    ready: number;
    review: number;
    blocked: number;
    installerNotes: number;
    exportLayers: number;
  };
  installerChecklist: string[];
  exportTargets: string[];
  nextActions: string[];
};

function resolveWallTechnicalReportV36Status(sections: WallTechnicalReportV36Section[]): LayoutRoomIntelligenceV2Status {
  if (sections.some((section) => section.status === "blocked")) return "LAYOUT_V2_BLOCKED";
  if (sections.some((section) => section.status === "review")) return "LAYOUT_V2_REVIEW";
  return "LAYOUT_V2_READY";
}

export function buildWallTechnicalReportV36Report(params: {
  wallEngineV30: WallIntelligenceEngineV30ReportLike;
  confidenceEngineV32: WallIntelligenceConfidenceEngineV32ReportLike;
  loadAnalyzerV33: WallIntelligenceLoadAnalyzerV33ReportLike;
  fixingRecommendationV34: WallIntelligenceFixingRecommendationV34ReportLike;
  mirrorShelfValidatorV35: WallIntelligenceMirrorShelfValidatorV35ReportLike;
}): WallTechnicalReportV36Report {
  const confidenceReview = params.confidenceEngineV32.totals.low + params.confidenceEngineV32.totals.medium;
  const loadBlocked = params.loadAnalyzerV33.totals.blocked;
  const fixingCritical = params.fixingRecommendationV34.totals.critical;
  const validatorBlocked = params.mirrorShelfValidatorV35.totals.blocked;

  const sections: WallTechnicalReportV36Section[] = [
    {
      id: "wall-description",
      title: "Descrizione parete cliente",
      status: params.wallEngineV30.totals.unknownWalls > 0 ? "review" : "ready",
      summary: "Riepilogo tipologia parete, spessore, note, vincoli e fonte descrittiva primaria.",
      exportLayer: "pdf",
      items: [
        `Pareti analizzate: ${params.wallEngineV30.totals.walls}`,
        `Pareti sconosciute: ${params.wallEngineV30.totals.unknownWalls}`,
        "Foto/DWG restano evidenze future di conferma, non fonte primaria V3.",
      ],
    },
    {
      id: "confidence",
      title: "Affidabilità informazioni",
      status: confidenceReview > 0 ? "review" : "ready",
      summary: "Valuta quanto sono affidabili le informazioni inserite dal cliente prima di generare schede tecniche.",
      exportLayer: "installer",
      items: [
        `Confidence alta: ${params.confidenceEngineV32.totals.high}`,
        `Confidence media/bassa: ${confidenceReview}`,
        `Verifiche richieste: ${params.confidenceEngineV32.totals.needsVerification}`,
      ],
    },
    {
      id: "load-analysis",
      title: "Carichi parete",
      status: loadBlocked > 0 ? "blocked" : params.loadAnalyzerV33.totals.review > 0 ? "review" : "ready",
      summary: "Controlla specchi, mensole e pensili rispetto a peso stimato, punti fissaggio e capacità parete.",
      exportLayer: "pdf",
      items: [
        `Target carico: ${params.loadAnalyzerV33.totals.targets}`,
        `Da revisionare: ${params.loadAnalyzerV33.totals.review}`,
        `Critici/bloccanti: ${params.loadAnalyzerV33.totals.critical}/${params.loadAnalyzerV33.totals.blocked}`,
      ],
    },
    {
      id: "fixing-recommendations",
      title: "Ferramenta e fissaggi suggeriti",
      status: fixingCritical > 0 ? "blocked" : params.fixingRecommendationV34.totals.warning > 0 ? "review" : "ready",
      summary: "Raccoglie ferramenta consigliata, numero fissaggi, strategia installazione e motivazioni tecniche.",
      exportLayer: "dxf",
      items: [
        `Raccomandazioni: ${params.fixingRecommendationV34.totals.recommendations}`,
        `Installatore richiesto: ${params.fixingRecommendationV34.totals.installerRequired}`,
        `Warning cartongesso: ${params.fixingRecommendationV34.totals.drywallWarnings}`,
      ],
    },
    {
      id: "mirror-shelf-validator",
      title: "Specchi, mensole e pensili",
      status: validatorBlocked > 0 ? "blocked" : params.mirrorShelfValidatorV35.totals.review > 0 ? "review" : "ready",
      summary: "Valida interassi specchi/postazioni, mensole, pensili sospesi, profondità, carichi e fissaggi.",
      exportLayer: "cad",
      items: [
        `Elementi: ${params.mirrorShelfValidatorV35.totals.items}`,
        `Specchi: ${params.mirrorShelfValidatorV35.totals.mirrorItems}`,
        `Mensole/Pensili: ${params.mirrorShelfValidatorV35.totals.shelfItems}/${params.mirrorShelfValidatorV35.totals.suspendedCabinets}`,
        `Check KO: ${params.mirrorShelfValidatorV35.totals.failedChecks}`,
      ],
    },
  ];

  const status = resolveWallTechnicalReportV36Status(sections);
  const installerChecklist = [
    "Confermare tipo parete prima del montaggio definitivo.",
    "Verificare spessore reale e presenza montanti o rinforzi su cartongesso.",
    "Controllare peso reale di specchi, mensole e pensili rispetto ai dati Product Package.",
    "Confermare interasse specchi/postazioni: barber 150 cm, estetista 120 cm.",
    "Verificare fissaggi suggeriti e aggiornare scheda tecnica se il supporto reale cambia.",
  ];

  return {
    schema: "bagastudio-wall-technical-report-v3-6",
    version: "3.6",
    generatedAt: new Date().toISOString(),
    status,
    sourceReports: {
      guidedWallDescription: params.wallEngineV30.schema,
      confidenceEngine: params.confidenceEngineV32.schema,
      loadAnalyzer: params.loadAnalyzerV33.schema,
      fixingRecommendation: params.fixingRecommendationV34.schema,
      mirrorShelfValidator: params.mirrorShelfValidatorV35.schema,
    },
    reportPrinciples: {
      clientDescriptionFirst: true,
      installerReadable: true,
      pdfDxfCadReady: true,
      notStructuralCertification: true,
    },
    sections,
    totals: {
      sections: sections.length,
      ready: sections.filter((section) => section.status === "ready").length,
      review: sections.filter((section) => section.status === "review").length,
      blocked: sections.filter((section) => section.status === "blocked").length,
      installerNotes: installerChecklist.length,
      exportLayers: new Set(sections.map((section) => section.exportLayer)).size,
    },
    installerChecklist,
    exportTargets: ["PDF scheda tecnica parete", "DXF punti fissaggio", "CAD prospetto parete", "Checklist installatore"],
    nextActions: [
      "Generare layout stampabile PDF con sezioni parete, alert, fissaggi e checklist.",
      "Collegare quote reali e layer DXF/CAD ai punti fissaggio del Technical Wall Report.",
      "Preparare V3.7 Installation Risk Engine con rischio installazione e sopralluogo consigliato.",
      "Far aumentare/diminuire confidence quando arrivano foto, DWG, DXF o note installatore.",
    ],
  };
}
