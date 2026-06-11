export const EDI_PRICING_OBSERVATION_TYPES = [
  "MATERIAL_COST_DETECTED",
  "PANEL_AREA_DETECTED",
  "EDGE_COST_DETECTED",
  "HARDWARE_COST_DETECTED",
  "MACHINING_COST_DETECTED",
  "LABOR_COST_DETECTED",
  "MARGIN_PROFILE_DETECTED",
  "VAT_PROFILE_DETECTED",
  "PRICE_CONFIGURATION_DETECTED",
] as const;

export type EdiPricingObservationType = typeof EDI_PRICING_OBSERVATION_TYPES[number];
export type EdiPricingSource = "MATERIAL_LIBRARY" | "FACTORY_SETTINGS" | "BOM" | "AREA_PRICING" | "MACHINE_HOURS" | "LABOR_HOURS" | "MARKUP" | "VAT" | string;

export type EdiPricingAnalysisInput = {
  analysisId: string;
  source: EdiPricingSource;
  materialCost?: number;
  panelArea?: number;
  edgeCost?: number;
  hardwareCost?: number;
  machiningCost?: number;
  laborCost?: number;
  marginProfile?: string;
  vatProfile?: string;
  priceConfiguration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type EdiPricingObservation<TPayload = unknown> = {
  id: string;
  type: EdiPricingObservationType;
  timestamp: number;
  analysisId: string;
  source: EdiPricingSource;
  payload?: TPayload;
  metadata?: Record<string, unknown>;
  confidence: number;
  reason?: string;
};

export type EdiPricingObservationInput<TPayload = unknown> =
  Omit<EdiPricingObservation<TPayload>, "timestamp"> & { timestamp?: number };
