import type { EdiExecutionRequest } from "../core/executionRequestTypes";

export type EdiIntegrationBoundaryValidationIssue =
  | "missing-request"
  | "missing-request-id"
  | "missing-request-mode"
  | "missing-request-domain";

export type EdiIntegrationBoundaryValidationResult = {
  valid: boolean;
  issues: readonly EdiIntegrationBoundaryValidationIssue[];
};

export type EdiIntegrationBoundaryRequest = {
  request?: EdiExecutionRequest;
  validation: EdiIntegrationBoundaryValidationResult;
};

export const validateEdiIntegrationBoundaryRequest = (
  request?: EdiExecutionRequest | null,
): EdiIntegrationBoundaryValidationResult => {
  const issues: EdiIntegrationBoundaryValidationIssue[] = [];

  if (!request) {
    return {
      valid: false,
      issues: ["missing-request"],
    };
  }

  if (!request.id) {
    issues.push("missing-request-id");
  }

  if (!request.mode) {
    issues.push("missing-request-mode");
  }

  if (!request.targetDomain) {
    issues.push("missing-request-domain");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};

export const createEdiIntegrationBoundaryRequest = (
  request?: EdiExecutionRequest | null,
): EdiIntegrationBoundaryRequest => {
  const validation = validateEdiIntegrationBoundaryRequest(request);

  return {
    request: validation.valid && request ? request : undefined,
    validation,
  };
};
