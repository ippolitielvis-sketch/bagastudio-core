// @ts-nocheck

export type CurrentProductPackageBuilderV1Params = Record<string, any>;

export function buildCurrentProductPackageJsonV1(params: CurrentProductPackageBuilderV1Params) {
  const {
    productId, productName, productBrand, productCategory, packageVersion,
    modelExtension, modelFileName, modelDataUrl, space3DAnalyzerReport, space3DFileName,
    meshList, csvCixMatcherReport, space3DCsvFileName, space3DCixFileNames, space3DCsvParts, space3DCixParts,
    autoMappingV2Report, autoMappingV2ReviewedLabels,
    widthMin, widthMax, widthDefault, heightMin, heightMax, heightDefault, depthMin, depthMax, depthDefault,
    buildRuntimeComponentV2, parseBagaStudioJsonField, readCollisionNumberV1, DEFAULT_PRODUCT_MATERIALS, DEFAULT_PRODUCT_VIEWS,
    getAutoMappingEngineV2ReviewSummary,
  } = params;

  const normalizeCsv = (value: string, fallback: string[] = []) => {
    const items = value
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : fallback;
    return Array.from(new Set(items));
  };

  const isCanonicalGlb = ["glb", "gltf"].includes(modelExtension);
  const isSpace3DSource = ["s3d", "s3dbak"].includes(modelExtension) || Boolean(space3DAnalyzerReport);
  const safeModelName = modelFileName || (isSpace3DSource ? (space3DFileName || "space3d-source.s3d") : "imported-model.glb");
  // S3D è metadata: se è stato caricato anche un modello reale DAE/GLB/OBJ/STL,
  // il package deve usare quella geometria embedded invece di restare metadata-only.
  const hasEmbeddedRuntimeGeometry = Boolean(modelDataUrl);
  const primaryModelUrl = hasEmbeddedRuntimeGeometry ? modelDataUrl : isSpace3DSource ? null : `/models/${safeModelName}`;
  const convertedModelUrl = isCanonicalGlb && primaryModelUrl ? primaryModelUrl : null;

  const packageId =
    productId ||
    productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "") ||
    "new-product";
  const now = new Date().toISOString();

  const normalizeProductionMatchKey = (value: string) =>
    String(value || "")
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/^[0-9]+[-_\s]*/, "")
      .replace(/[-_]+/g, " ")
      .replace(/[^\w\sàèéìòù]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const findProductionMatchForMesh = (mesh: MeshConfig) => {
    const meshKeys = [
      mesh.displayName,
      mesh.meshName,
      mesh.partId || "",
      mesh.runtimeRole || "",
    ]
      .map(normalizeProductionMatchKey)
      .filter(Boolean);

    return (
      csvCixMatcherReport?.matches?.find((match) => {
        const csvKey = normalizeProductionMatchKey(match.csvPart.name);
        const cixKey = normalizeProductionMatchKey(match.cixPart?.partName || "");

        return meshKeys.some(
          (key) =>
            key === csvKey ||
            key === cixKey ||
            csvKey.includes(key) ||
            cixKey.includes(key) ||
            key.includes(csvKey) ||
            key.includes(cixKey)
        );
      }) || null
    );
  };

  const components = meshList.map((mesh, index) => {
    const runtimeComponent = buildRuntimeComponentV2(mesh, index);
    const productionMatch = findProductionMatchForMesh(mesh);

    return {
      ...runtimeComponent,

      productionReady: Boolean(productionMatch?.cixPart),
      csvSource: productionMatch?.csvPart?.name || null,
      cixSource: productionMatch?.cixPart?.fileName || null,
      productionMaterial: productionMatch?.csvPart?.material || null,
      productionQuantity: productionMatch?.csvPart?.quantity || null,
      productionConfidence: productionMatch?.confidence || 0,

      productionDimensions: productionMatch
        ? {
            width: productionMatch.csvPart.width,
            depth: productionMatch.csvPart.depth,
            thickness: productionMatch.csvPart.thickness,
          }
        : null,

      parametricData: (() => {
        const existingParametricData = parseBagaStudioJsonField(mesh.parametricData, {}) as Record<string, unknown>;
        return {
          originalWidth: readCollisionNumberV1(existingParametricData.originalWidth, productionMatch?.csvPart?.width) ?? null,
          originalHeight: readCollisionNumberV1(existingParametricData.originalHeight) ?? null,
          originalDepth: readCollisionNumberV1(existingParametricData.originalDepth, productionMatch?.csvPart?.depth) ?? null,
          originalThickness: readCollisionNumberV1(existingParametricData.originalThickness, productionMatch?.csvPart?.thickness) ?? null,

          currentWidth: readCollisionNumberV1(existingParametricData.currentWidth, productionMatch?.csvPart?.width) ?? null,
          currentHeight: readCollisionNumberV1(existingParametricData.currentHeight) ?? null,
          currentDepth: readCollisionNumberV1(existingParametricData.currentDepth, productionMatch?.csvPart?.depth) ?? null,
          currentThickness: readCollisionNumberV1(existingParametricData.currentThickness, mesh.panelThickness, productionMatch?.csvPart?.thickness) ?? null,

          lockExternalDimensions: true,
          parametricVersion: 1,
        };
      })(),

      manufacturingOverrideData: parseBagaStudioJsonField(mesh.manufacturingOverrideData, null),
    };
  });

  const componentCategories = Array.from(new Set(components.map((component) => component.category))).sort();
  const productPackageV3Summary = {
    schema: "bagastudio-product-package-v3-summary",
    version: 3.1,
    componentCount: components.length,
    componentCategories: Array.from(new Set(components.map((component: any) => component.componentCategory || component.category))).sort(),
    manufacturingReadyComponents: components.filter((component: any) => Boolean(component.productPackageV3?.csvRegenerationReady)).length,
    manufacturingMetadataReadyComponents: components.filter((component: any) => Boolean(component.manufacturingMetadataV31?.readiness?.hasThickness || component.manufacturingMetadataV31?.readiness?.hasHardware || component.manufacturingMetadataV31?.readiness?.hasDrillings)).length,
    panelThicknessComponents: components.filter((component: any) => component.panelThickness !== null && component.panelThickness !== undefined).length,
    hardwareLinkedComponents: components.filter((component: any) => Array.isArray(component.hardware) && component.hardware.length > 0).length,
    constraintRoles: components.reduce((acc: Record<string, number>, component: any) => {
      const role = component.constraintRole || "UNKNOWN";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {}),
    hardwareAnalyzerReadyComponents: components.filter((component: any) => Boolean(component.hardwareAnalyzerV1)).length,
    hardwareLinkedComponentsV1: components.filter((component: any) => Array.isArray(component.hardwareLinks) && component.hardwareLinks.length > 0).length,
    drillingLinkedComponentsV1: components.filter((component: any) => Array.isArray(component.drillingLinks) && component.drillingLinks.length > 0).length,
    dependencyGraphReadyComponents: components.filter((component: any) => Boolean(component.dependencyGraph)).length,
    parametricEditReady: true,
    futureModules: {
      parametricEdit: "prepared",
      manufacturingOverride: "prepared",
      csvRegeneration: "prepared",
      bomEngine: "prepared",
      assemblyEngine: "prepared",
      technicalSheets: "prepared",
    },
  };
  const runtimeMetadata = {
    schema: "bagastudio-runtime-metadata",
    version: 3,
    generatedAt: now,
    componentCount: components.length,
    categories: componentCategories,
    partIdStrategy: "stable-index-plus-display-name-slug",
    bridge: {
      viewer: true,
      configurator: true,
      materials: true,
      led: true,
      inserts: true,
      accessories: true,
      visibility: true,
      pricing: true,
      bom: true,
      cadExport: "prepared",
      technicalPoints: "prepared",
    },
  };

  return JSON.stringify(
    {
      schema: "bagastudio-product-package",
      packageVersion: packageVersion || "3.1.0",
      productPackageVersion: 3,
      generatedAt: now,
      viewerCompatible: true,
      engine: {
        name: "BagaStudio Core",
        minViewerVersion: "1.0.0",
        canonicalModelFormat: "glb",
        supportsEmbeddedModelDataUrl: true,
        supportsRuntimeMaterials: true,
        supportsComponentVisibility: true,
        supportsAccessories: true,
        supportsRuntimeMetadataV2: true,
        supportsAutoMappingEngineV2QualityGate: true,
        supportsStablePartIds: true,
        supportsComponentCategories: true,
        supportsProductPackageV3: true,
        supportsParametricEditData: true,
        supportsManufacturingOverrideData: true,
        supportsManufacturingMetadataV31: true,
        supportsEdgeBandingData: true,
        supportsHardwareAnalyzerV1: true,
        supportsManufacturingConstraintsV1: true,
        supportsDependencyGraphV1: true,
        supportsParametricDrillingRules: true,
      },
      metadata: {
        id: packageId,
        name: productName,
        brand: productBrand || "BagaStudio Core",
        productCategory,
        sourceFileName: safeModelName,
        originalFormat: modelExtension,
        componentCount: components.length,
        componentCategories,
        runtimeMetadataVersion: 3,
        productPackageV3Summary,
        packageSource: space3DAnalyzerReport ? "space3d-analyzer" : "admin-model-importer",
        productionReady: Boolean(csvCixMatcherReport?.matchedParts),
      },
      id: packageId,
      name: productName,
      brand: productBrand || "BagaStudio Core",
      category: productCategory,
      version: packageVersion || "2.0.0",
      assets: {
        modelUrl: primaryModelUrl,
        embeddedModelDataUrl: hasEmbeddedRuntimeGeometry ? modelDataUrl : null,
        originalFileUrl: isSpace3DSource ? null : `/models/${safeModelName}`,
        originalFormat: modelExtension,
        sourceFileName: safeModelName,
        convertedModelUrl,
        requiresConversion: !isCanonicalGlb || isSpace3DSource,
        conversionTargetFormat: "glb",
        hasRuntimeGeometry: Boolean(primaryModelUrl || convertedModelUrl || hasEmbeddedRuntimeGeometry),
        geometrySource: isSpace3DSource
          ? hasEmbeddedRuntimeGeometry
            ? "space3d-metadata-plus-admin-model-importer"
            : "space3d-analyzer-only"
          : "admin-model-importer",
      },
      dimensions: {
        width: { min: widthMin, max: widthMax, step: 10, default: widthDefault },
        height: { min: heightMin, max: heightMax, step: 10, default: heightDefault },
        depth: { min: depthMin, max: depthMax, step: 5, default: depthDefault },
      },
      defaultConfiguration: {
        dimensions: {
          width: widthDefault,
          height: heightDefault,
          depth: depthDefault,
        },
        activeViewId: "iso",
      },
      runtimeMetadata,
      productPackageV3: productPackageV3Summary,
      componentCategories,
      components,
      parts: components,
      productionData: {
        schema: "bagastudio-production-data",
        version: 1,
        source: "space3d-csv-cix",
        csvFileName: space3DCsvFileName || null,
        cixFileNames: space3DCixFileNames,
        csvParts: space3DCsvParts.length,
        cixParts: space3DCixParts.length,
        matchedParts: csvCixMatcherReport?.matchedParts || 0,
        unmatchedParts: csvCixMatcherReport?.unmatchedParts || 0,
        averageConfidence: csvCixMatcherReport?.averageConfidence || 0,
        matches: csvCixMatcherReport?.matches || [],
        autoMappingEngineV2: autoMappingV2Report,
        autoMappingClassificationV25: autoMappingV2Report?.classificationSummary || null,
        autoMappingClassifiedComponents: autoMappingV2Report?.classifiedComponents || [],
        productPackageV3: {
          panelThicknessReady: components.some((component: any) => component.panelThickness !== null),
          hardwareReady: components.some((component: any) => Array.isArray(component.hardware) && component.hardware.length > 0),
          drillingsReady: components.some((component: any) => Array.isArray(component.drillings) && component.drillings.length > 0),
          manufacturingDataReady: components.some((component: any) => component.manufacturingData && Object.keys(component.manufacturingData).length > 0),
          manufacturingMetadataV31Ready: components.some((component: any) => Boolean(component.manufacturingMetadataV31)),
          edgeBandingReady: components.some((component: any) => Boolean(component.edgeBanding)),
          materialCodesReady: components.some((component: any) => Boolean(component.materialCode)),
          hardwareAnalyzerV1Ready: components.some((component: any) => Boolean(component.hardwareAnalyzerV1)),
          dependencyGraphReady: components.some((component: any) => Boolean(component.dependencyGraph)),
          manufacturingConstraintsV1Ready: components.some((component: any) => Boolean(component.constraintRole)),
        },
        autoMappingQualityGate: autoMappingV2Report
          ? {
              score: autoMappingV2Report.qualityScore,
              level: autoMappingV2Report.qualityLevel,
              recommendedActions: autoMappingV2Report.recommendedActions,
              riskyMatches: autoMappingV2Report.riskyMatches,
              reviewSummary: getAutoMappingEngineV2ReviewSummary(),
              reviewedLabels: autoMappingV2ReviewedLabels,
            }
          : null,
      },
      materials: DEFAULT_PRODUCT_MATERIALS,
      options: [],
      accessories: [
        { id: "insert", name: "Inserto", stateType: "insert" },
        { id: "led", name: "LED", stateType: "accessory" },
      ],
      pricing: {
        basePrice: 900,
        margin: 0,
        vat: 22,
      },
      views: DEFAULT_PRODUCT_VIEWS,
      bridge: {
        schema: "bagastudio-viewer-configurator-bridge",
        version: 2,
        partIdField: "partId",
        meshNameField: "meshName",
        categoryField: "category",
        metadataField: "runtimeMetadata",
        runtimeTargets: ["materials", "visibility", "led", "insert", "accessories", "pricing", "bom", "technicalPoints", "manufacturingData", "hardwareAnalyzer", "constraints", "dependencyGraph"],
        productPackageV3: true,
        hardwareAnalyzerV1: true,
        manufacturingConstraintsV1: true,
      },
      geometryRuntime: {
        status: isSpace3DSource ? "metadata-only-requires-geometry-conversion" : ["glb", "gltf"].includes(modelExtension) ? "ready" : "requires-conversion-to-glb",
        originalFormat: modelExtension,
        preparedForViewer: Boolean(primaryModelUrl || convertedModelUrl),
        hasRuntimeGeometry: Boolean(primaryModelUrl || convertedModelUrl || hasEmbeddedRuntimeGeometry),
        preventViewerFallback: true,
        notes: space3DAnalyzerReport
          ? ["S3D analyzer package: solo metadata/componenti. Nessun modello 3D viene forzato nel Viewer finché non esiste una conversione geometria/GLB reale."]
          : [],
      },
    },
    null,
    2
  );

}
