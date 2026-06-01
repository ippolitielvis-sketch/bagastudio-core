import { type ConstraintInspectorV1Report } from "./constraintInspectorV1";

export type ConstraintValidationV21Item = {
  componentId: string;
  displayName: string;
  role: string | null;
  status: "valid" | "missing" | "invalid";
  severity: "ok" | "warning" | "error";
  note: string;
};

export type ConstraintValidationV21Report = {
  schema: "bagastudio-hardware-analyzer-v2-1-constraint-validation";
  version: 21;
  generatedAt: string;
  validationStatus: "CONSTRAINT_READY" | "CONSTRAINT_BLOCKED";
  allowedRoles: string[];
  totals: {
    analyzed: number;
    valid: number;
    missing: number;
    invalid: number;
  };
  items: ConstraintValidationV21Item[];
};

export const ALLOWED_CONSTRAINT_ROLES_V21 = [
  "externalPanel",
  "internalPanel",
  "backPanel",
  "shelf",
  "door",
  "topPanel",
  "bottomPanel",
  "plinth",
];

export function buildConstraintValidationV21Report(
  inspectorReport: ConstraintInspectorV1Report
): ConstraintValidationV21Report {
  const items: ConstraintValidationV21Item[] = inspectorReport.items.map((item) => {
    const role = item.role ? String(item.role).trim() : null;

    if (!role) {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        role: null,
        status: "missing",
        severity: "warning",
        note: "Ruolo produttivo mancante: assegnare o correggere il constraintRole prima della validazione completa.",
      };
    }

    if (!ALLOWED_CONSTRAINT_ROLES_V21.includes(role)) {
      return {
        componentId: item.componentId,
        displayName: item.displayName,
        role,
        status: "invalid",
        severity: "error",
        note: `Ruolo non valido: "${role}". Usare uno dei ruoli ammessi.`,
      };
    }

    return {
      componentId: item.componentId,
      displayName: item.displayName,
      role,
      status: "valid",
      severity: "ok",
      note: "Ruolo produttivo valido.",
    };
  });

  const totals = {
    analyzed: items.length,
    valid: items.filter((item) => item.status === "valid").length,
    missing: items.filter((item) => item.status === "missing").length,
    invalid: items.filter((item) => item.status === "invalid").length,
  };

  const validationStatus =
    totals.missing > 0 || totals.invalid > 0
      ? "CONSTRAINT_BLOCKED"
      : "CONSTRAINT_READY";

  return {
    schema: "bagastudio-hardware-analyzer-v2-1-constraint-validation",
    version: 21,
    generatedAt: new Date().toISOString(),
    validationStatus,
    allowedRoles: ALLOWED_CONSTRAINT_ROLES_V21,
    totals,
    items,
  };
}
