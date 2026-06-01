export type TechnicalEvidenceApprovalV46Status = "EVIDENCE_APPROVED" | "EVIDENCE_REVIEW_REQUIRED" | "EVIDENCE_BLOCKED";

export type TechnicalEvidenceApprovalV46Item = {
  id: string;
  sourceSuggestionId: string;
  wallId: string;
  wallLabel: string;
  severity: "info" | "warning" | "critical";
  decision: "approved" | "review" | "blocked";
  approvalRequired: boolean;
  reason: string;
  requiredAction: string;
  exportTargets: string[];
};

export type TechnicalEvidenceApprovalV46Report = {
  schema: "bagastudio-technical-evidence-approval-v4-6";
  version: "4.6";
  generatedAt: string;
  approvalStatus: TechnicalEvidenceApprovalV46Status;
  totals: {
    items: number;
    approved: number;
    review: number;
    blocked: number;
    approvalRequired: number;
  };
  policy: {
    aiSuggestionsAreNotFinalApproval: boolean;
    customerInputRemainsPrimary: boolean;
    installerOrTechnicianMustConfirmCriticalItems: boolean;
    photoDwgCanIncreaseConfidenceButNotOverrideApproval: boolean;
  };
  items: TechnicalEvidenceApprovalV46Item[];
  approvalGate: {
    canGenerateFinalPdf: boolean;
    canApproveInstallation: boolean;
    canProceedToRenderAr: boolean;
    blockerReasons: string[];
  };
  nextActions: string[];
};

export function resolveTechnicalEvidenceApprovalV46Status(items: TechnicalEvidenceApprovalV46Item[]): TechnicalEvidenceApprovalV46Status {
  if (items.some((item) => item.decision === "blocked")) return "EVIDENCE_BLOCKED";
  if (items.some((item) => item.decision === "review")) return "EVIDENCE_REVIEW_REQUIRED";
  return "EVIDENCE_APPROVED";
}

export function buildTechnicalEvidenceApprovalV46Report(
  aiSuggestionsReport: any
): TechnicalEvidenceApprovalV46Report {
  const items: TechnicalEvidenceApprovalV46Item[] = aiSuggestionsReport.suggestions.map((suggestion: any) => {
    const decision = suggestion.blocksApproval || suggestion.severity === "critical"
      ? "blocked"
      : suggestion.severity === "warning"
        ? "review"
        : "approved";

    return {
      id: `technical-evidence-v4-6-${suggestion.id}`,
      sourceSuggestionId: suggestion.id,
      wallId: suggestion.wallId,
      wallLabel: suggestion.wallLabel,
      severity: suggestion.severity,
      decision,
      approvalRequired: decision !== "approved",
      reason: suggestion.reason,
      requiredAction: suggestion.suggestedAction,
      exportTargets: suggestion.exportTargets,
    };
  });

  const approvalStatus = resolveTechnicalEvidenceApprovalV46Status(items);
  const blockerReasons = items
    .filter((item) => item.decision === "blocked")
    .map((item) => `${item.wallLabel}: ${item.requiredAction}`);

  return {
    schema: "bagastudio-technical-evidence-approval-v4-6",
    version: "4.6",
    generatedAt: new Date().toISOString(),
    approvalStatus,
    totals: {
      items: items.length,
      approved: items.filter((item) => item.decision === "approved").length,
      review: items.filter((item) => item.decision === "review").length,
      blocked: items.filter((item) => item.decision === "blocked").length,
      approvalRequired: items.filter((item) => item.approvalRequired).length,
    },
    policy: {
      aiSuggestionsAreNotFinalApproval: true,
      customerInputRemainsPrimary: true,
      installerOrTechnicianMustConfirmCriticalItems: true,
      photoDwgCanIncreaseConfidenceButNotOverrideApproval: true,
    },
    items,
    approvalGate: {
      canGenerateFinalPdf: approvalStatus !== "EVIDENCE_BLOCKED",
      canApproveInstallation: approvalStatus === "EVIDENCE_APPROVED",
      canProceedToRenderAr: aiSuggestionsReport.totals.renderArReadyWalls > 0 && approvalStatus !== "EVIDENCE_BLOCKED",
      blockerReasons,
    },
    nextActions: [
      "V4.7 Photo Environment Bridge: preparare foto locale per render contestualizzato e AR.",
      "V4.8 Final Technical Package: unire PDF, DXF, checklist, evidenze e approvazione.",
      "V5.0 Customer Photo Render Workflow: portare il mobile configurato nella foto del cliente.",
    ],
  };
}
