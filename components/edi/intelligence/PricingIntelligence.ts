import type {
  EdiPricingAnalysisInput,
  EdiPricingObservation,
  EdiPricingObservationInput,
  EdiPricingObservationType,
} from "./pricingObservationTypes";

export const createPricingObservation = <TPayload = unknown>(
  input: EdiPricingObservationInput<TPayload>,
): EdiPricingObservation<TPayload> => ({
  ...input,
  timestamp: input.timestamp ?? Date.now(),
});

const valueObservation = <TPayload>(
  input: EdiPricingAnalysisInput,
  type: EdiPricingObservationType,
  value: TPayload | undefined,
): EdiPricingObservation<TPayload> | null => value === undefined ? null : createPricingObservation({
  id: `${input.analysisId}:${type.toLowerCase()}`,
  type,
  analysisId: input.analysisId,
  source: input.source,
  payload: value,
  metadata: input.metadata,
  confidence: 1,
  reason: "typed-pricing-summary",
});

export class PricingIntelligence {
  private observations: EdiPricingObservation[] = [];

  analyzePricing(input: EdiPricingAnalysisInput): readonly EdiPricingObservation[] {
    const next: Array<EdiPricingObservation | null> = [
      valueObservation(input, "MATERIAL_COST_DETECTED", input.materialCost),
      valueObservation(input, "PANEL_AREA_DETECTED", input.panelArea),
      valueObservation(input, "EDGE_COST_DETECTED", input.edgeCost),
      valueObservation(input, "HARDWARE_COST_DETECTED", input.hardwareCost),
      valueObservation(input, "MACHINING_COST_DETECTED", input.machiningCost),
      valueObservation(input, "LABOR_COST_DETECTED", input.laborCost),
      valueObservation(input, "MARGIN_PROFILE_DETECTED", input.marginProfile),
      valueObservation(input, "VAT_PROFILE_DETECTED", input.vatProfile),
      valueObservation(input, "PRICE_CONFIGURATION_DETECTED", input.priceConfiguration),
    ];
    this.observations = next.filter((observation): observation is EdiPricingObservation => observation !== null);
    return this.getObservations();
  }

  getObservations(): readonly EdiPricingObservation[] {
    return [...this.observations];
  }

  clear() {
    this.observations = [];
  }
}
