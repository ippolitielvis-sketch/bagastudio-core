// @ts-nocheck
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Bounds } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { resolveDaeHierarchy } from "@/lib/importer/daeHierarchyResolver";
import { buildImporterReport } from "@/lib/importer/importerReportBuilder";
import { convertDaeToRuntimeGlb } from "@/lib/importer/runtimeGlbConverter";
import { parseCixFiles, type CixPart } from "@/lib/importer/cixParser";
import {
  buildCsvCixMatcherReport,
  matchCsvPartsToCixParts,
  parseSpazio3DCsv,
  type CsvCixMatch,
  type CsvPart,
} from "@/lib/importer/csvCixMatcher";
import { buildEvidenceToRenderArBridgeV47Report } from "@/lib/layout-room-intelligence/evidenceToRenderArBridgeV47";
import { buildTechnicalEvidenceApprovalV46Report } from "@/lib/layout-room-intelligence/technicalEvidenceApprovalV46";
import { buildAiTechnicalSuggestionsV45Report } from "@/lib/layout-room-intelligence/aiTechnicalSuggestionsV45";
import { buildAutomaticWallClassificationV44Report } from "@/lib/layout-room-intelligence/automaticWallClassificationV44";
import { buildWallEvidenceFusionV43Report } from "@/lib/layout-room-intelligence/wallEvidenceFusionV43";
import { buildWallDwgDxfEvidenceV42Report } from "@/lib/layout-room-intelligence/wallDwgDxfEvidenceV42";
import { buildWallPhotoEvidenceV41Report } from "@/lib/layout-room-intelligence/wallPhotoEvidenceV41";
import { buildWallAssistedRecognitionV40Report } from "@/lib/layout-room-intelligence/wallAssistedRecognitionV40";
import { buildTechnicalApprovalWorkflowV39Report } from "@/lib/layout-room-intelligence/technicalApprovalWorkflowV39";
import { buildInstallerChecklistEngineV38Report } from "@/lib/layout-room-intelligence/installerChecklistEngineV38";
import { buildInstallationRiskEngineV37Report } from "@/lib/layout-room-intelligence/installationRiskEngineV37";
import { buildWallTechnicalReportV36Report } from "@/lib/layout-room-intelligence/technicalWallReportV36";
import { buildWallIntelligenceMirrorShelfValidatorV35Report } from "@/lib/layout-room-intelligence/mirrorShelfValidatorV35";
import { buildWallIntelligenceFixingRecommendationV34Report } from "@/lib/layout-room-intelligence/fixingRecommendationEngineV34";
import { buildWallIntelligenceLoadAnalyzerV33Report } from "@/lib/layout-room-intelligence/wallLoadAnalyzerV33";
import { buildWallIntelligenceConfidenceEngineV32Report } from "@/lib/layout-room-intelligence/wallConfidenceEngineV32";
import { buildWallIntelligenceGuidedDescriptionV31Report } from "@/lib/layout-room-intelligence/guidedWallDescriptionV31";
import { buildDynamicRuleRegistryV26Report } from "@/lib/layout-room-intelligence/dynamicRuleRegistryV26";
import { buildDynamicRuleAdminBridgeV27Report } from "@/lib/layout-room-intelligence/dynamicRuleAdminBridgeV27";
import { buildDynamicRulePackV28Report } from "@/lib/layout-room-intelligence/rulePackSystemV28";
import { buildDynamicRuleConflictResolverV29Report } from "@/lib/layout-room-intelligence/ruleConflictResolverV29";
import { buildWallIntelligenceEngineV30Report } from "@/lib/layout-room-intelligence/wallIntelligenceEngineV30";
import { buildLayoutRoomIntelligenceV25Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceCoreRulesV25";
import { buildLayoutRoomIntelligenceV24Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceCollisionChecksV24";
import { buildLayoutRoomIntelligenceV22Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceWallElevationV22";
import { buildLayoutRoomIntelligenceV23Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceTechnicalRulesV23";
import { buildLayoutRoomIntelligenceV21Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceChecklistRiskV21";
import { buildLayoutRoomIntelligenceV2Report } from "@/lib/layout-room-intelligence/layoutRoomIntelligenceCoreReportV20";
import {
  buildLayoutDxfCadExportPrepV1Report,
  buildLayoutRoomIntelligenceV1Report,
  buildLayoutTechnicalSheetGeneratorV1Report,
  buildTechnicalKnowledgeBaseV1Report,
  buildTechnicalWallElevationSheetsV1Report,
  buildWallTechnicalPointsValidationV1Report,
} from "@/lib/layout-room-intelligence/layoutTechnicalFoundationV1";
import {
  buildHardwareCompatibilityMatrixV1Report,
  type HardwareCompatibilityMatrixV1Report,
  type HardwareCompatibilityV1Item,
  type HardwareCompatibilityV1Status,
  type HardwareProductionGateV12,
} from "@/lib/layout-room-intelligence/hardwareCompatibilityMatrixV12";
import { buildSmartTechnicalValidatorV1Report } from "@/lib/layout-room-intelligence/smartTechnicalValidatorV10";
import {
  buildProductionReadinessGateV1Report,
  type ProductionReadinessGateV1Report,
} from "@/lib/layout-room-intelligence/productionReadinessGateV10";
import {
  buildParametricEditV1Report,
  type ParametricEditV1Report,
} from "@/lib/layout-room-intelligence/parametricEditV10";
import { buildHardwareAnalyzerV2ThicknessReport } from "@/lib/layout-room-intelligence/hardwareAnalyzerV2Thickness";
import { buildConstraintInspectorV1Report, type ConstraintInspectorV1Report } from "@/lib/layout-room-intelligence/constraintInspectorV1";
import { buildConstraintValidationV21Report } from "@/lib/layout-room-intelligence/constraintValidationV21";
import { buildDrillingInspectorV1Report } from "@/lib/layout-room-intelligence/drillingInspectorV1";
import { buildDrillingValidationV22Report } from "@/lib/layout-room-intelligence/drillingValidationV22";
import { buildHardwareCollisionV23Report } from "@/lib/layout-room-intelligence/hardwareCollisionV23";
import {
  buildHardwarePatternRecognitionV1Report,
  type HardwarePatternRecognitionV1Report,
  type HardwarePatternRecognitionV1Type,
} from "@/lib/layout-room-intelligence/hardwarePatternRecognitionV1";
import {
  buildHardwareLinksEngineV1Report,
  type HardwareLinksEngineV1Report,
} from "@/lib/layout-room-intelligence/hardwareLinksEngineV1";
import {
  buildConstraintEngineV1Report,
  type ConstraintEngineV1Item,
  type ConstraintEngineV1Report,
} from "@/lib/layout-room-intelligence/constraintEngineV1";
import { applyManufacturingOverrideV1, buildManufacturingOverrideV1Report, type ManufacturingOverrideV1Report } from "@/lib/layout-room-intelligence/manufacturingOverrideV1";
import { buildCsvRegenerationGuardV1Report, type CsvRegenerationGuardV1Report, type CsvRegenerationGuardV1Status } from "@/lib/layout-room-intelligence/csvRegenerationGuardV1";
import {
  buildBomRegenerationV1Report,
  buildCsvCixRegenerationPipelineV1Report,
  buildFactoryEngineV1Report,
  buildFactoryEngineV2Report,
  buildFactoryExportPackageV1Report,
  buildFactoryProductionPackageV1Report,
  buildHardwareRepositionEngineV1Report,
  buildParametricStructureEditorV1Report,
  buildProductPackageRegenerationV1Report,
  buildProductPackageRegenerationV2Report,
  buildViewerSyncV1Report,
  buildViewerSyncV2Report,
  type BomRegenerationV1Report,
  type CsvCixRegenerationPipelineV1Report,
  type FactoryEngineV1Report,
  type FactoryEngineV2Report,
  type FactoryExportPackageV1Report,
  type FactoryProductionPackageV1Report,
  type HardwareRepositionEngineV1Report,
  type ParametricStructureEditorV1Report,
  type ProductPackageRegenerationV1Report,
  type ProductPackageRegenerationV2Report,
  type ViewerSyncV1Report,
  type ViewerSyncV2Report,
} from "@/lib/factory/factoryPipelineReportsV1";
import { buildCurrentProductPackageJsonV1 } from "@/lib/factory/currentProductPackageBuilderV1";
import {
  MeshConfig,
  BAGASTUDIO_ADMIN_AUTOSAVE_KEY,
  BAGASTUDIO_PRODUCT_LIBRARY_KEY,
  BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMATS,
  BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMAT_LABEL,
  ProductLibraryItem,
  AdminImporterDiagnostic,
  createAdminImporterDiagnostic,
  Space3DAnalyzerComponent,
  Space3DAnalyzerMaterial,
  Space3DAnalyzerReport,
  GeometryCompletionReport,
  CsvCixMatcherReportState,
  AutoMappingEngineV2ReviewItem,
  AutoMappingEngineV2ReportState,
  AutoMappingEngineV25ComponentCategory,
  AutoMappingEngineV25ClassifiedComponent,
  AutoMappingEngineV25ClassificationSummary,
  SPACE3D_SUPPORTED_FORMATS,
  SPACE3D_CSV_SUPPORTED_FORMATS,
  SPACE3D_CIX_SUPPORTED_FORMATS,
  SPACE3D_COMPONENT_KEYWORDS,
  SPACE3D_MATERIAL_KEYWORDS,
  normalizeSpace3DToken,
  uniqueByLowercase,
  guessSpace3DCategory,
  guessSpace3DMaterialCategory,
  buildSpace3DAnalyzerReport,
  space3DReportToMeshConfigs,
  DEFAULT_PRODUCT_MATERIALS,
  DEFAULT_PRODUCT_VIEWS,
  downloadJsonFile,
  guessPartName,
  guessComponentCategory,
  slugifyBagaStudioId,
  buildStablePartId,
  guessRuntimeRole,
  buildRuntimeTags,
  normalizeComponentCategory,
  parseBagaStudioCsvField,
  parseBagaStudioJsonField,
  ManufacturingConstraintRoleV1,
  inferManufacturingConstraintRoleV1,
  CollisionEngineV1Severity,
  CollisionEngineV1Issue,
  CollisionEngineV1Report,
  readCollisionNumberV1,
  normalizeCollisionArrayV1,
  readCollisionDimensionsV1,
  CsvRegenerationV1Report,
  normalizeCsvRegenerationKey,
  csvRegenerationEscape,
  buildCsvRegenerationV1Report,
  buildCsvRegenerationV1Csv,
  downloadCsvTextFile,
  ManufacturingDataInspectorV1Report,
  incrementInspectorCounterV1,
  readThicknessFromCsvRegenerationBridgeV1,
  buildManufacturingDataInspectorV1Report,
  readCollisionPointV1,
  readCollisionFootprintV15,
  pushCollisionIssueV1,
  buildCollisionEngineV1Report,
  buildHardwareAnalyzerV1,
  buildDefaultEdgeBanding,
  buildManufacturingMetadataV31,
  buildProductPackageV3ComponentData,
  buildRuntimeComponentV2,
  getStableMeshName,
  extractMeshesFromObject,
  buildAdminImporterDiagnostic,
  normalizeAdminMeshList,
  inferAutoMappingEngineV25ComponentCategory,
  classifyAutoMappingEngineV25Mesh,
  buildAutoMappingEngineV25ClassificationReport,
  AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE,
  AUTO_MAPPING_ENGINE_V2_HIGH_CONFIDENCE,
  AUTO_MAPPING_ENGINE_V2_SAFE_QUALITY_SCORE,
  normalizeAutoMappingV2Key,
  inferAutoMappingV2Category,
  inferAutoMappingV2MaterialSlots,
  CixDrillingExtractorV1Item,
  readCixParamNumberV1,
  parseCixMacroParamsV1,
  extractCixDrillingsV1,
  readCixDrillingLinksFromPartV1,
  buildAutoMappingV2MeshFromMatch,
  mergeAutoMappingV2MatchIntoMesh,
  buildAutoMappingEngineV2ReviewQueue,
  evaluateAutoMappingEngineV2Quality
} from "@/lib/admin-panel/adminPanelRuntimeV1";


function AdminGLBModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;

        gltf.scene.updateMatrixWorld(true);

        const previewGroup = new THREE.Group();
        let meshIndex = 0;

        gltf.scene.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;

          const sourceMesh = child as THREE.Mesh;
          const geometry = sourceMesh.geometry?.clone();
          if (!geometry) return;

          const meshName = getStableMeshName(sourceMesh.name, meshIndex);
          const isSelected = selectedMeshName === meshName;

          // Bake world transform into the geometry.
          // This avoids invisible GLB previews caused by nested groups, odd scales,
          // negative transforms, original material transparency, or camera fit issues.
          geometry.applyMatrix4(sourceMesh.matrixWorld);
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();

          const previewMesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
              color: isSelected ? "#ffffff" : "#d9d9d9",
              roughness: 0.45,
              metalness: 0.05,
              side: THREE.DoubleSide,
              emissive: isSelected ? new THREE.Color("#2563eb") : new THREE.Color("#000000"),
              emissiveIntensity: isSelected ? 0.7 : 0,
            })
          );

          previewMesh.name = meshName;
          previewMesh.userData.bagastudioMeshName = meshName;
          previewMesh.castShadow = true;
          previewMesh.receiveShadow = true;
          previewMesh.frustumCulled = false;

          previewGroup.add(previewMesh);
          meshIndex += 1;
        });

        previewGroup.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(previewGroup);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = Number.isFinite(maxDim) && maxDim > 0 ? 3 / maxDim : 1;

        if (meshIndex > 0 && !box.isEmpty()) {
          const debugBoxGeometry = new THREE.BoxGeometry(size.x || 0.01, size.y || 0.01, size.z || 0.01);
          const debugBoxMaterial = new THREE.MeshBasicMaterial({
            color: "#00e5ff",
            wireframe: true,
            transparent: true,
            opacity: 0.75,
          });
          const debugBox = new THREE.Mesh(debugBoxGeometry, debugBoxMaterial);
          debugBox.name = "BagaStudio_Runtime_GLB_Debug_Bounds";
          debugBox.position.copy(center);
          debugBox.userData.bagastudioDebugBounds = true;
          previewGroup.add(debugBox);

          const centerMarker = new THREE.Mesh(
            new THREE.SphereGeometry(Math.max(maxDim * 0.015, 0.01), 12, 12),
            new THREE.MeshBasicMaterial({ color: "#ff3b30" })
          );
          centerMarker.name = "BagaStudio_Runtime_GLB_Debug_Center";
          centerMarker.position.copy(center);
          centerMarker.userData.bagastudioDebugBounds = true;
          previewGroup.add(centerMarker);
        }

        if (meshIndex === 0) {
          console.warn("BagaStudio Admin GLB preview loaded without visible meshes", { url });
        }

        // Admin preview alignment: center X/Z and place the model bottom on the grid (Y=0).
        // This avoids imported FBX/OBJ/GLB models floating above or sinking below the grid
        // when their original pivot/origin comes from external 3D software.
        previewGroup.position.set(
          -center.x * scale,
          -box.min.y * scale,
          -center.z * scale
        );
        previewGroup.scale.setScalar(scale);
        previewGroup.rotation.y = modelRotationY;
        previewGroup.updateMatrixWorld(true);

        console.log("BagaStudio Admin GLB preview loaded", {
          meshes: meshIndex,
          size: size.toArray(),
          center: center.toArray(),
          scale,
        });

        setObject(previewGroup);
      },
      undefined,
      (error) => {
        console.error("BagaStudio Admin GLB preview load error:", error);
        if (!cancelled) setObject(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}

function AdminSTLModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const loader = new STLLoader();

    loader.load(url, (loadedGeometry) => {
      loadedGeometry.computeVertexNormals();
      loadedGeometry.computeBoundingBox();

      const box = loadedGeometry.boundingBox;

      if (box) {
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 3 / maxDim : 1;

        loadedGeometry.center();
        loadedGeometry.scale(scale, scale, scale);
        loadedGeometry.computeBoundingSphere();
      }

      setGeometry(loadedGeometry);
    });
  }, [url]);

  if (!geometry) return null;

  const meshName = "STL_Mesh";

  return (
    <mesh
      geometry={geometry}
      rotation={[0, modelRotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectMesh(meshName);
      }}
    >
      <meshStandardMaterial
        color={selectedMeshName === meshName ? "#ffffff" : "#ffcc66"}
        roughness={0.45}
        metalness={0.05}
        side={THREE.DoubleSide}
        emissive={selectedMeshName === meshName ? "#2563eb" : "#000000"}
        emissiveIntensity={selectedMeshName === meshName ? 0.7 : 0}
      />
    </mesh>
  );
}

function AdminOBJModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new OBJLoader();

    loader.load(url, (loadedObject) => {
      let meshIndex = 0;
      loadedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const stableMeshName = getStableMeshName(mesh.name, meshIndex);
          mesh.name = stableMeshName;
          mesh.userData.bagastudioMeshName = stableMeshName;
          mesh.frustumCulled = false;

          mesh.material = new THREE.MeshStandardMaterial({
            color: stableMeshName === selectedMeshName ? "#ffffff" : "#d9d9d9",
            roughness: 0.45,
            metalness: 0.05,
            side: THREE.DoubleSide,
            emissive: stableMeshName === selectedMeshName ? "#2563eb" : "#000000",
            emissiveIntensity: stableMeshName === selectedMeshName ? 0.7 : 0,
          });

          meshIndex += 1;
        }
      });

      const box = new THREE.Box3().setFromObject(loadedObject);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 3 / maxDim : 1;

      // Admin preview alignment: center X/Z and place the model bottom on the grid (Y=0).
      loadedObject.position.set(
        -center.x * scale,
        -box.min.y * scale,
        -center.z * scale
      );

      loadedObject.rotation.y = modelRotationY;
      loadedObject.scale.setScalar(scale);
      loadedObject.updateMatrixWorld(true);

      setObject(loadedObject);
    });
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}
function AdminFBXModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new FBXLoader();

    loader.load(url, (loadedObject) => {
      let meshIndex = 0;
      loadedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const stableMeshName = getStableMeshName(mesh.name, meshIndex);
          mesh.name = stableMeshName;
          mesh.userData.bagastudioMeshName = stableMeshName;
          mesh.frustumCulled = false;

          mesh.material = new THREE.MeshStandardMaterial({
            color: stableMeshName === selectedMeshName ? "#ffffff" : "#d9d9d9",
            roughness: 0.45,
            metalness: 0.05,
            side: THREE.DoubleSide,
            emissive: stableMeshName === selectedMeshName ? "#2563eb" : "#000000",
            emissiveIntensity: stableMeshName === selectedMeshName ? 0.7 : 0,
          });

          meshIndex += 1;
        }
      });

      const box = new THREE.Box3().setFromObject(loadedObject);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 3 / maxDim : 1;

      // Admin preview alignment: center X/Z and place the model bottom on the grid (Y=0).
      loadedObject.position.set(
        -center.x * scale,
        -box.min.y * scale,
        -center.z * scale
      );

      loadedObject.rotation.y = modelRotationY;
      loadedObject.scale.setScalar(scale);
      loadedObject.updateMatrixWorld(true);

      setObject(loadedObject);
    });
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}


function AdminDAEModel({
  url,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new ColladaLoader();

    loader.load(
      url,
      (collada) => {
        if (cancelled) return;

        const daeScene = collada?.scene;
        if (!daeScene) {
          console.error("BagaStudio Admin DAE preview load error: scene not found");
          setObject(null);
          return;
        }

        let meshIndex = 0;

        daeScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const stableMeshName = getStableMeshName(mesh.name, meshIndex);
            mesh.name = stableMeshName;
            mesh.userData.bagastudioMeshName = stableMeshName;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;

            mesh.material = new THREE.MeshStandardMaterial({
              color: stableMeshName === selectedMeshName ? "#ffffff" : "#d9d9d9",
              roughness: 0.45,
              metalness: 0.05,
              side: THREE.DoubleSide,
              emissive: stableMeshName === selectedMeshName ? "#2563eb" : "#000000",
              emissiveIntensity: stableMeshName === selectedMeshName ? 0.7 : 0,
            });

            meshIndex += 1;
          }
        });

        const box = new THREE.Box3().setFromObject(daeScene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = Number.isFinite(maxDim) && maxDim > 0 ? 3 / maxDim : 1;

        daeScene.position.set(
          -center.x * scale,
          -box.min.y * scale,
          -center.z * scale
        );

        daeScene.rotation.y = modelRotationY;
        daeScene.scale.setScalar(scale);
        daeScene.updateMatrixWorld(true);

        console.log("BagaStudio Admin DAE preview loaded", {
          meshes: meshIndex,
          size: size.toArray(),
          center: center.toArray(),
          scale,
        });

        const daeGroup = new THREE.Group();
daeGroup.name = daeScene.name || "DAE Preview";
daeGroup.position.copy(daeScene.position);
daeGroup.rotation.copy(daeScene.rotation);
daeGroup.scale.copy(daeScene.scale);
daeGroup.add(...daeScene.children);

setObject(daeGroup);
      },
      undefined,
      (error) => {
        console.error("BagaStudio Admin DAE preview load error:", error);
        if (!cancelled) setObject(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url, selectedMeshName, modelRotationY]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(e: any) => {
        e.stopPropagation();
        const clicked = e.object as THREE.Object3D;
        const meshName =
          clicked?.userData?.bagastudioMeshName ||
          clicked?.name ||
          clicked?.parent?.userData?.bagastudioMeshName ||
          clicked?.parent?.name ||
          "";
        if (!meshName) return;
        onSelectMesh(meshName);
      }}
    />
  );
}


function AdminModelRouter({
  url,
  fileName,
  selectedMeshName,
  onSelectMesh,
  modelRotationY,
}: {
  url: string;
  fileName: string;
  selectedMeshName: string;
  onSelectMesh: (meshName: string) => void;
  modelRotationY: number;
}) {
  const runtimeGlbObjectUrl =
    typeof window !== "undefined"
      ? (window as any)?.bagastudioLastRuntimeGlb?.objectUrl
      : null;

  const ext =
    runtimeGlbObjectUrl && runtimeGlbObjectUrl === url
      ? "glb"
      : fileName.split(".").pop()?.toLowerCase();

 if (ext === "glb" || ext === "gltf") {
  return (
   <AdminGLBModel
  url={url}
  selectedMeshName={selectedMeshName}
  onSelectMesh={onSelectMesh}
  modelRotationY={modelRotationY}
/>
  );
}

  if (ext === "stl") {
    return (
      <AdminSTLModel
        url={url}
        selectedMeshName={selectedMeshName}
        onSelectMesh={onSelectMesh}
        modelRotationY={modelRotationY}
      />
    );
  }

  if (ext === "obj") {
    return (
      <AdminOBJModel
        url={url}
        selectedMeshName={selectedMeshName}
        onSelectMesh={onSelectMesh}
        modelRotationY={modelRotationY}
      />
    );
  }
if (ext === "fbx") {
  return (
    <AdminFBXModel
      url={url}
      selectedMeshName={selectedMeshName}
      onSelectMesh={onSelectMesh}
      modelRotationY={modelRotationY}
    />
  );
}

if (ext === "dae") {
  return (
    <AdminDAEModel
      url={url}
      selectedMeshName={selectedMeshName}
      onSelectMesh={onSelectMesh}
      modelRotationY={modelRotationY}
    />
  );
}
  return null;
}
type AdminLanguage = "it" | "en";

const ADMIN_I18N = {
  it: {
    adminPanel: "Admin Panel",
    subtitle: "Importa modelli, configura componenti, materiali, accessori e genera il package JSON prodotto.",
    backViewer: "Torna al Viewer",
    downloadBackup: "Scarica backup",
    importer: "Importer",
    productCatalog: "Catalogo prodotti",
    materials: "Materiali",
    accessoriesPricing: "Accessori / Pricing",
    controlCenter: "Control Center",
    adminTools: "Admin Tools",
    toolsDesc: "Strumenti tecnici separati dal viewer cliente. Qui prepari package prodotto, mapping componenti e backup.",
    stepImport: "01 · Import modello",
    stepMapping: "02 · Mapping componenti",
    stepPackage: "03 · Product package",
    autosave: "Autosave",
    backupProject: "Backup progetto",
    backupDesc: "Autosave locale attivo. Usa backup manuale prima di modifiche importanti o prima di sostituire file.",
    restoreAutosave: "Ripristina autosave",
    importBackup: "Importa backup",
    import3d: "1. Importa modello 3D",
    formats: "Formati supportati: GLB, GLTF, DAE, FBX, OBJ, STL. GLB resta il formato finale consigliato per catalogo e configuratore.",
    rotation: "Rotazione",
    preview3d: "Preview 3D",
    mapping: "2. Mapping componenti",
    emptyMesh: "Qui comparirà la lista mesh del modello importato.",
    selectable: "Selezionabile",
    visible: "Visibile",
    ledCompatible: "Compatibile LED",
    insertCompatible: "Compatibile Inserto",
    ledPosition: "LED posizione",
    ledFrontOffset: "LED front offset",
    ledSideMargin: "LED side margin",
    ledYOffset: "LED Y offset",
    materialSlots: "Slot materiali",
    compatibleAccessories: "Accessori compatibili",
    componentCategory: "Categoria componente",
    supportsAccessories: "Supporta accessori",
    generatePackage: "3. Genera product package",
    productInfo: "Informazioni prodotto",
    productId: "ID prodotto",
    productName: "Nome prodotto",
    category: "Categoria",
    widthMin: "Larghezza min",
    widthDefault: "Larghezza default",
    widthMax: "Larghezza max",
    heightMin: "Altezza min",
    heightDefault: "Altezza default",
    heightMax: "Altezza max",
    depthMin: "Profondità min",
    depthDefault: "Profondità default",
    depthMax: "Profondità max",
    generateJson: "Genera JSON prodotto",
    noAutosaveLoaded: "Nessun autosave caricato",
    restoreCompleted: "Ripristino completato",
    dateUnavailable: "data non disponibile",
    autosaveAvailable: "Autosave disponibile",
    autosaveUnreadable: "Autosave presente ma non leggibile",
    noAutosaveAvailable: "Nessun autosave disponibile",
    noAutosaveToRestore: "Nessun autosave da ripristinare",
    autosaveError: "Errore: autosave non leggibile",
    backupFileError: "Errore: file backup non valido",
    chooseFile: "Scegli file",
    noFileSelected: "Nessun file selezionato",
    language: "Lingua",
    productLibrary: "Libreria prodotti",
    libraryDesc: "Salva e richiama package prodotto preparati nell’Admin.",
    saveToLibrary: "Salva in libreria",
    loadProduct: "Carica prodotto",
    deleteProduct: "Elimina",
    emptyLibrary: "Nessun prodotto salvato nella libreria.",
    librarySaved: "Prodotto salvato in libreria.",
  },
  en: {
    adminPanel: "Admin Panel",
    subtitle: "Import models, configure components, materials, accessories and generate the product JSON package.",
    backViewer: "Back to Viewer",
    downloadBackup: "Download backup",
    importer: "Importer",
    productCatalog: "Product catalog",
    materials: "Materials",
    accessoriesPricing: "Accessories / Pricing",
    controlCenter: "Control Center",
    adminTools: "Admin Tools",
    toolsDesc: "Technical tools separated from the client viewer. Here you prepare product packages, component mapping and backups.",
    stepImport: "01 · Import model",
    stepMapping: "02 · Component mapping",
    stepPackage: "03 · Product package",
    autosave: "Autosave",
    backupProject: "Project backup",
    backupDesc: "Local autosave is active. Use manual backup before important changes or before replacing files.",
    restoreAutosave: "Restore autosave",
    importBackup: "Import backup",
    import3d: "1. Import 3D model",
    formats: "Supported formats: GLB, GLTF, DAE, FBX, OBJ, STL. GLB remains the recommended final format for catalog and configurator.",
    rotation: "Rotation",
    preview3d: "3D Preview",
    mapping: "2. Component mapping",
    emptyMesh: "The imported model mesh list will appear here.",
    selectable: "Selectable",
    visible: "Visible",
    ledCompatible: "LED compatible",
    insertCompatible: "Insert compatible",
    ledPosition: "LED position",
    ledFrontOffset: "LED front offset",
    ledSideMargin: "LED side margin",
    ledYOffset: "LED Y offset",
    materialSlots: "Material slots",
    compatibleAccessories: "Compatible accessories",
    componentCategory: "Component category",
    supportsAccessories: "Supports accessories",
    generatePackage: "3. Generate product package",
    productInfo: "Product information",
    productId: "Product ID",
    productName: "Product name",
    category: "Category",
    widthMin: "Min width",
    widthDefault: "Default width",
    widthMax: "Max width",
    heightMin: "Min height",
    heightDefault: "Default height",
    heightMax: "Max height",
    depthMin: "Min depth",
    depthDefault: "Default depth",
    depthMax: "Max depth",
    generateJson: "Generate product JSON",
    noAutosaveLoaded: "No autosave loaded",
    restoreCompleted: "Restore completed",
    dateUnavailable: "date unavailable",
    autosaveAvailable: "Autosave available",
    autosaveUnreadable: "Autosave found but unreadable",
    noAutosaveAvailable: "No autosave available",
    noAutosaveToRestore: "No autosave to restore",
    autosaveError: "Error: autosave unreadable",
    backupFileError: "Error: invalid backup file",
    chooseFile: "Choose file",
    noFileSelected: "No file selected",
    language: "Language",
    productLibrary: "Product library",
    libraryDesc: "Save and recall product packages prepared in the Admin.",
    saveToLibrary: "Save to library",
    loadProduct: "Load product",
    deleteProduct: "Delete",
    emptyLibrary: "No products saved in the library.",
    librarySaved: "Product saved to library.",
  },
} as const;

export default function AdminPage() {

const [adminLanguage, setAdminLanguage] = useState<AdminLanguage>("it");
const adminT = ADMIN_I18N[adminLanguage];

const [meshList, setMeshList] = useState<MeshConfig[]>([]);
const [importerDiagnostic, setImporterDiagnostic] = useState<AdminImporterDiagnostic>(() => createAdminImporterDiagnostic());
const [generatedJson, setGeneratedJson] = useState("");
const [productId, setProductId] = useState("new-product");
const [productName, setProductName] = useState("Nuovo prodotto");
const [productCategory, setProductCategory] = useState("custom");
const [productBrand, setProductBrand] = useState("BagaStudio Core");
const [packageVersion, setPackageVersion] = useState("2.0.0");
const [widthDefault, setWidthDefault] = useState(180);
const [widthMin, setWidthMin] = useState(100);
const [widthMax, setWidthMax] = useState(350);

const [heightDefault, setHeightDefault] = useState(100);
const [heightMin, setHeightMin] = useState(70);
const [heightMax, setHeightMax] = useState(150);

const [depthDefault, setDepthDefault] = useState(60);
const [depthMin, setDepthMin] = useState(40);
const [depthMax, setDepthMax] = useState(100);
const [modelFileName, setModelFileName] = useState("");
const [modelExtension, setModelExtension] = useState("glb");
const [modelPreviewUrl, setModelPreviewUrl] = useState("");
const [modelDataUrl, setModelDataUrl] = useState("");
const [selectedMeshName, setSelectedMeshName] = useState("");
const [selectedMeshPulse, setSelectedMeshPulse] = useState(0);
const [mapperSearch, setMapperSearch] = useState("");
const [mapperCategoryFilter, setMapperCategoryFilter] = useState("all");
const [modelRotationY, setModelRotationY] = useState(0);
const [meshThumbnails, setMeshThumbnails] = useState<Record<string, string>>({});
const [backupStatus, setBackupStatus] = useState<string>(ADMIN_I18N.it.noAutosaveLoaded);
const [productLibrary, setProductLibrary] = useState<ProductLibraryItem[]>([]);
const [librarySearch, setLibrarySearch] = useState("");
const [selectedLibraryProductId, setSelectedLibraryProductId] = useState("");
const [space3DFileName, setSpace3DFileName] = useState("");
const [space3DAnalyzerReport, setSpace3DAnalyzerReport] = useState<Space3DAnalyzerReport | null>(null);
const [space3DStatus, setSpace3DStatus] = useState("S3D analyzer in attesa");
const [space3DCsvFileName, setSpace3DCsvFileName] = useState("");
const [space3DCsvParts, setSpace3DCsvParts] = useState<CsvPart[]>([]);
const [space3DCixFileNames, setSpace3DCixFileNames] = useState<string[]>([]);
const [space3DCixParts, setSpace3DCixParts] = useState<CixPart[]>([]);
const [csvCixMatcherReport, setCsvCixMatcherReport] = useState<CsvCixMatcherReportState | null>(null);
const [csvCixStatus, setCsvCixStatus] = useState("CSV/CIX matcher in attesa");
const [autoMappingV2Report, setAutoMappingV2Report] = useState<AutoMappingEngineV2ReportState | null>(null);
const [autoMappingV2Status, setAutoMappingV2Status] = useState("Auto Mapping Engine V2 in attesa");
const [autoMappingV2LastSnapshot, setAutoMappingV2LastSnapshot] = useState<MeshConfig[] | null>(null);
const [autoMappingV2ReviewedLabels, setAutoMappingV2ReviewedLabels] = useState<Record<string, boolean>>({});
const [geometryCompletionReport, setGeometryCompletionReport] = useState<GeometryCompletionReport>({
  status: "idle",
  daeMeshCount: 0,
  s3dComponentCount: 0,
  matchedCount: 0,
  missingCount: 0,
  missingParts: [],
  generatedAt: "",
});
const autosaveHydratedRef = useRef(false);
const meshCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
const meshInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
const suppressNextMeshAutoScrollRef = useRef(false);

useEffect(() => {
  if (!selectedMeshName) return;

  if (suppressNextMeshAutoScrollRef.current) {
    suppressNextMeshAutoScrollRef.current = false;
    return;
  }

  meshCardRefs.current[selectedMeshName]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  setTimeout(() => {
    meshInputRefs.current[selectedMeshName]?.focus();
    meshInputRefs.current[selectedMeshName]?.select();
  }, 80);
}, [selectedMeshName, selectedMeshPulse]);

function selectMeshCard(meshName: string) {
  if (!meshName) return;

  flushSync(() => {
    setSelectedMeshName(meshName);
    setSelectedMeshPulse((value) => value + 1);
  });

  requestAnimationFrame(() => {
    meshCardRefs.current[meshName]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });
}


function updateMeshConfig(meshName: string, patch: Partial<MeshConfig>) {
  if (!meshName) return;

  setMeshList((current) =>
    current.map((item) =>
      item.meshName === meshName ? { ...item, ...patch } : item
    )
  );
}

const mapperCategories = useMemo(() => {
  const categories = Array.from(
    new Set<string>(meshList.map((mesh) => mesh.category || "component"))
  );
  return categories.sort((a, b) => a.localeCompare(b));
}, [meshList]);

const filteredMapperMeshes = useMemo(() => {
  const query = mapperSearch.trim().toLowerCase();

  return meshList
    .map((mesh, index) => ({ mesh, index }))
    .filter(({ mesh }) => {
      const category = mesh.category || "component";
      const matchesCategory =
        mapperCategoryFilter === "all" || category === mapperCategoryFilter;

      const matchesSearch =
        query.length === 0 ||
        mesh.meshName.toLowerCase().includes(query) ||
        mesh.displayName.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
}, [meshList, mapperSearch, mapperCategoryFilter]);

const groupedMapperMeshes = useMemo(() => {
  const groups = new Map<string, Array<{ mesh: MeshConfig; index: number }>>();

  filteredMapperMeshes.forEach((item) => {
    const category = item.mesh.category || "component";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)?.push(item);
  });

  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}, [filteredMapperMeshes]);

const filteredProductLibrary = useMemo(() => {
  const query = librarySearch.trim().toLowerCase();

  if (!query) return productLibrary;

  return productLibrary.filter((item) => {
    const haystack = [
      item.id,
      item.name,
      item.category,
      item.brand,
      item.sourceFileName,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}, [productLibrary, librarySearch]);

const selectedLibraryProduct = useMemo(() => {
  return productLibrary.find((item) => item.id === selectedLibraryProductId) || productLibrary[0] || null;
}, [productLibrary, selectedLibraryProductId]);

const adminDashboardStats = useMemo(() => {
  const ledReady = meshList.filter((mesh) => mesh.compatibleLed).length;
  const insertReady = meshList.filter((mesh) => mesh.compatibleInsert).length;
  const accessoryReady = meshList.filter((mesh) => mesh.supportsAccessories).length;
  const hiddenParts = meshList.filter((mesh) => !mesh.visible).length;
  const selectableParts = meshList.filter((mesh) => mesh.selectable).length;

  return {
    products: productLibrary.length,
    components: meshList.length,
    selectableParts,
    hiddenParts,
    ledReady,
    insertReady,
    accessoryReady,
    hasModel: Boolean(modelPreviewUrl || modelDataUrl),
    hasJson: Boolean(generatedJson),
  };
}, [productLibrary, meshList, modelPreviewUrl, modelDataUrl, generatedJson]);


const selectedMapperMesh = useMemo(() => {
  return meshList.find((mesh) => mesh.meshName === selectedMeshName) || null;
}, [meshList, selectedMeshName]);

const importerReadiness = useMemo(() => {
  const hasSupportedFormat = ["glb", "gltf", "dae", "fbx", "obj", "stl"].includes(modelExtension);
  const hasComponents = meshList.length > 0;
  const hasMappedNames = meshList.every((mesh) => Boolean(mesh.displayName?.trim()));

  return {
    hasSupportedFormat,
    hasComponents,
    hasMappedNames,
    packageReady: Boolean(hasSupportedFormat && hasComponents && hasMappedNames),
  };
}, [modelExtension, meshList]);

const collisionEngineV1Report = useMemo(() => {
  return buildCollisionEngineV1Report(meshList);
}, [meshList]);

const [manufacturingOverrideThickness, setManufacturingOverrideThickness] = useState("17.8");

const manufacturingOverrideV1Report = useMemo(() => {
  return buildManufacturingOverrideV1Report(meshList, manufacturingOverrideThickness);
}, [meshList, manufacturingOverrideThickness]);

function downloadCollisionEngineV1Report() {
  downloadJsonFile(`bagastudio-collision-engine-v1-5-${Date.now()}.json`, collisionEngineV1Report);
}

function downloadManufacturingOverrideV1Report() {
  downloadJsonFile(`bagastudio-manufacturing-override-v1-${Date.now()}.json`, manufacturingOverrideV1Report);
}

function applyManufacturingOverrideThicknessV1() {
  setMeshList((current) => applyManufacturingOverrideV1(current, manufacturingOverrideThickness));
}


const csvRegenerationV1Report = useMemo(() => {
  return buildCsvRegenerationV1Report(
    space3DCsvParts,
    csvCixMatcherReport?.matches || [],
    meshList,
    manufacturingOverrideThickness,
    space3DCsvFileName
  );
}, [space3DCsvParts, csvCixMatcherReport, meshList, manufacturingOverrideThickness, space3DCsvFileName]);

function downloadCsvRegenerationV1Report() {
  downloadJsonFile(`bagastudio-csv-regeneration-v1-${Date.now()}.json`, csvRegenerationV1Report);
}

function downloadRegeneratedCsvV1() {
  downloadCsvTextFile(`bagastudio-rigenerato-${Date.now()}.csv`, buildCsvRegenerationV1Csv(csvRegenerationV1Report));
}





const manufacturingDataInspectorV1Report = useMemo(() => {
  return buildManufacturingDataInspectorV1Report(meshList);
}, [meshList]);

function downloadManufacturingDataInspectorV1Report() {
  downloadJsonFile(`bagastudio-manufacturing-data-inspector-v1-${Date.now()}.json`, manufacturingDataInspectorV1Report);
}





const hardwareAnalyzerV2ThicknessReport = useMemo(() => {
  return buildHardwareAnalyzerV2ThicknessReport(csvRegenerationV1Report, readCollisionNumberV1(manufacturingOverrideThickness));
}, [csvRegenerationV1Report, manufacturingOverrideThickness]);

function downloadHardwareAnalyzerV2ThicknessReport() {
  downloadJsonFile(`bagastudio-hardware-analyzer-v2-thickness-${Date.now()}.json`, hardwareAnalyzerV2ThicknessReport);
}






const constraintInspectorV1Report = useMemo(() => {
  return buildConstraintInspectorV1Report(csvRegenerationV1Report, meshList);
}, [csvRegenerationV1Report, meshList]);

function downloadConstraintInspectorV1Report() {
  downloadJsonFile(`bagastudio-constraint-inspector-v1-${Date.now()}.json`, constraintInspectorV1Report);
}



const constraintValidationV21Report = useMemo(() => {
  return buildConstraintValidationV21Report(constraintInspectorV1Report);
}, [constraintInspectorV1Report]);

function downloadConstraintValidationV21Report() {
  downloadJsonFile(`bagastudio-constraint-validation-v2-1-${Date.now()}.json`, constraintValidationV21Report);
}





const drillingInspectorV1Report = useMemo(() => {
  return buildDrillingInspectorV1Report(csvRegenerationV1Report, meshList);
}, [csvRegenerationV1Report, meshList]);

function downloadDrillingInspectorV1Report() {
  downloadJsonFile(`bagastudio-drilling-inspector-v1-${Date.now()}.json`, drillingInspectorV1Report);
}



const drillingValidationV22Report = useMemo(() => {
  return buildDrillingValidationV22Report(meshList);
}, [meshList]);

function downloadDrillingValidationV22Report() {
  downloadJsonFile(`bagastudio-drilling-validation-v2-2-${Date.now()}.json`, drillingValidationV22Report);
}



const hardwareCollisionV23Report = useMemo(() => {
  return buildHardwareCollisionV23Report(meshList);
}, [meshList]);

function downloadHardwareCollisionV23Report() {
  downloadJsonFile(`bagastudio-hardware-collision-v2-3-${Date.now()}.json`, hardwareCollisionV23Report);
}



const hardwarePatternRecognitionV1Report = useMemo(() => {
  return buildHardwarePatternRecognitionV1Report(meshList);
}, [meshList]);

function downloadHardwarePatternRecognitionV1Report() {
  downloadJsonFile(`bagastudio-hardware-pattern-recognition-v1-${Date.now()}.json`, hardwarePatternRecognitionV1Report);
}





const hardwareCompatibilityMatrixV1Report = useMemo(() => {
  return buildHardwareCompatibilityMatrixV1Report(hardwarePatternRecognitionV1Report, meshList);
}, [hardwarePatternRecognitionV1Report, meshList]);

function downloadHardwareCompatibilityMatrixV1Report() {
  downloadJsonFile(`bagastudio-hardware-compatibility-matrix-v1-2-${Date.now()}.json`, hardwareCompatibilityMatrixV1Report);
}



const hardwareLinksEngineV1Report = useMemo(() => {
  return buildHardwareLinksEngineV1Report(hardwarePatternRecognitionV1Report, hardwareCompatibilityMatrixV1Report);
}, [hardwarePatternRecognitionV1Report, hardwareCompatibilityMatrixV1Report]);

function downloadHardwareLinksEngineV1Report() {
  downloadJsonFile(`bagastudio-hardware-links-engine-v1-${Date.now()}.json`, hardwareLinksEngineV1Report);
}


const constraintEngineV1Report = useMemo(() => {
  return buildConstraintEngineV1Report(hardwareLinksEngineV1Report, meshList, csvRegenerationV1Report);
}, [hardwareLinksEngineV1Report, meshList, csvRegenerationV1Report]);

function downloadConstraintEngineV1Report() {
  downloadJsonFile(`bagastudio-constraint-engine-v1-${Date.now()}.json`, constraintEngineV1Report);
}


const productionReadinessGateV1Report = useMemo(() => {
  return buildProductionReadinessGateV1Report(
    hardwareCompatibilityMatrixV1Report,
    constraintEngineV1Report,
    collisionEngineV1Report,
    meshList,
    buildStablePartId
  );
}, [hardwareCompatibilityMatrixV1Report, constraintEngineV1Report, collisionEngineV1Report, meshList]);

function downloadProductionReadinessGateV1Report() {
  downloadJsonFile(`bagastudio-production-readiness-gate-v1-${Date.now()}.json`, productionReadinessGateV1Report);
}


const parametricEditV1Report = useMemo(() => {
  return buildParametricEditV1Report(
    productionReadinessGateV1Report,
    csvRegenerationV1Report,
    meshList,
    manufacturingOverrideThickness,
    buildStablePartId
  );
}, [productionReadinessGateV1Report, csvRegenerationV1Report, meshList, manufacturingOverrideThickness]);

function downloadParametricEditV1Report() {
  downloadJsonFile(`bagastudio-parametric-edit-v1-${Date.now()}.json`, parametricEditV1Report);
}


const csvRegenerationGuardV1Report = useMemo(() => {
  return buildCsvRegenerationGuardV1Report(
    csvRegenerationV1Report,
    parametricEditV1Report,
    productionReadinessGateV1Report
  );
}, [csvRegenerationV1Report, parametricEditV1Report, productionReadinessGateV1Report]);

function downloadCsvRegenerationGuardV1Report() {
  downloadJsonFile(`bagastudio-csv-regeneration-guard-v1-${Date.now()}.json`, csvRegenerationGuardV1Report);
}

const factoryExportPackageV1Report = useMemo(() => {
  return buildFactoryExportPackageV1Report({
    productId,
    productName,
    productCategory,
    productBrand,
    packageVersion,
    componentCount: meshList.length,
    compatibilityMatrix: hardwareCompatibilityMatrixV1Report,
    productionReadiness: productionReadinessGateV1Report,
    parametricEdit: parametricEditV1Report,
    csvRegeneration: csvRegenerationV1Report,
    csvGuard: csvRegenerationGuardV1Report,
  });
}, [
  productId,
  productName,
  productCategory,
  productBrand,
  packageVersion,
  meshList.length,
  hardwareCompatibilityMatrixV1Report,
  productionReadinessGateV1Report,
  parametricEditV1Report,
  csvRegenerationV1Report,
  csvRegenerationGuardV1Report,
]);

function downloadFactoryExportPackageV1Report() {
  downloadJsonFile(`bagastudio-factory-export-package-v1-${Date.now()}.json`, factoryExportPackageV1Report);
}



const bomRegenerationV1Report = useMemo(() => {
  return buildBomRegenerationV1Report(csvRegenerationV1Report, csvRegenerationGuardV1Report);
}, [csvRegenerationV1Report, csvRegenerationGuardV1Report]);

function downloadBomRegenerationV1Report() {
  downloadJsonFile(`bagastudio-bom-regeneration-v1-${Date.now()}.json`, bomRegenerationV1Report);
}



const hardwareRepositionEngineV1Report = useMemo(() => {
  return buildHardwareRepositionEngineV1Report(
    parametricEditV1Report,
    csvRegenerationV1Report,
    constraintEngineV1Report
  );
}, [parametricEditV1Report, csvRegenerationV1Report, constraintEngineV1Report]);

function downloadHardwareRepositionEngineV1Report() {
  downloadJsonFile(`bagastudio-hardware-reposition-engine-v1-${Date.now()}.json`, hardwareRepositionEngineV1Report);
}


const csvCixRegenerationPipelineV1Report = useMemo(() => {
  return buildCsvCixRegenerationPipelineV1Report(
    csvRegenerationV1Report,
    csvRegenerationGuardV1Report,
    bomRegenerationV1Report,
    hardwareRepositionEngineV1Report
  );
}, [csvRegenerationV1Report, csvRegenerationGuardV1Report, bomRegenerationV1Report, hardwareRepositionEngineV1Report]);

function downloadCsvCixRegenerationPipelineV1Report() {
  downloadJsonFile(`bagastudio-csv-cix-regeneration-pipeline-v1-${Date.now()}.json`, csvCixRegenerationPipelineV1Report);
}

const factoryEngineV1Report = useMemo(() => {
  return buildFactoryEngineV1Report({
    productionReadiness: productionReadinessGateV1Report,
    parametricEdit: parametricEditV1Report,
    csvGuard: csvRegenerationGuardV1Report,
    factoryExport: factoryExportPackageV1Report,
    bom: bomRegenerationV1Report,
    hardwareReposition: hardwareRepositionEngineV1Report,
    csvCixPipeline: csvCixRegenerationPipelineV1Report,
  });
}, [
  productionReadinessGateV1Report,
  parametricEditV1Report,
  csvRegenerationGuardV1Report,
  factoryExportPackageV1Report,
  bomRegenerationV1Report,
  hardwareRepositionEngineV1Report,
  csvCixRegenerationPipelineV1Report,
]);

function downloadFactoryEngineV1Report() {
  downloadJsonFile(`bagastudio-factory-engine-v1-${Date.now()}.json`, factoryEngineV1Report);
}


const productPackageRegenerationV1Report = useMemo(() => {
  return buildProductPackageRegenerationV1Report({
    factory: factoryEngineV1Report,
    currentPackage: buildCurrentProductPackageJson(),
    parametric: parametricEditV1Report,
    bom: bomRegenerationV1Report,
    hardware: hardwareRepositionEngineV1Report,
    csvCix: csvCixRegenerationPipelineV1Report,
  });
}, [
  factoryEngineV1Report,
  parametricEditV1Report,
  bomRegenerationV1Report,
  hardwareRepositionEngineV1Report,
  csvCixRegenerationPipelineV1Report,
  generatedJson,
  meshList,
  productId,
  productName,
]);

function downloadProductPackageRegenerationV1Report() {
  downloadJsonFile(`bagastudio-product-package-regeneration-v1-${Date.now()}.json`, productPackageRegenerationV1Report);
}


const viewerSyncV1Report = useMemo(() => {
  return buildViewerSyncV1Report({
    productPackage: productPackageRegenerationV1Report,
  });
}, [productPackageRegenerationV1Report]);

function downloadViewerSyncV1Report() {
  downloadJsonFile(`bagastudio-viewer-sync-v1-${Date.now()}.json`, viewerSyncV1Report);
}


const parametricStructureEditorV1Report = useMemo(() => {
  return buildParametricStructureEditorV1Report({
    viewerSync: viewerSyncV1Report,
  });
}, [viewerSyncV1Report]);

function downloadParametricStructureEditorV1Report() {
  downloadJsonFile(`bagastudio-parametric-structure-editor-v1-${Date.now()}.json`, parametricStructureEditorV1Report);
}


const factoryEngineV2Report = useMemo(() => {
  return buildFactoryEngineV2Report({
    factory: factoryEngineV1Report,
    productPackage: productPackageRegenerationV1Report,
    viewerSync: viewerSyncV1Report,
    structureEditor: parametricStructureEditorV1Report,
  });
}, [factoryEngineV1Report, productPackageRegenerationV1Report, viewerSyncV1Report, parametricStructureEditorV1Report]);

function downloadFactoryEngineV2Report() {
  downloadJsonFile(`bagastudio-factory-engine-v2-${Date.now()}.json`, factoryEngineV2Report);
}

const productPackageRegenerationV2Report = useMemo(() => {
  return buildProductPackageRegenerationV2Report({
    factoryV2: factoryEngineV2Report,
    productPackageV1: productPackageRegenerationV1Report,
    viewerSyncV1: viewerSyncV1Report,
    structureEditorV1: parametricStructureEditorV1Report,
  });
}, [factoryEngineV2Report, productPackageRegenerationV1Report, viewerSyncV1Report, parametricStructureEditorV1Report]);

function downloadProductPackageRegenerationV2Report() {
  downloadJsonFile(`bagastudio-product-package-regeneration-v2-${Date.now()}.json`, productPackageRegenerationV2Report);
}


const viewerSyncV2Report = useMemo(() => {
  return buildViewerSyncV2Report({
    productPackageV2: productPackageRegenerationV2Report,
    factoryV2: factoryEngineV2Report,
  });
}, [productPackageRegenerationV2Report, factoryEngineV2Report]);

function downloadViewerSyncV2Report() {
  downloadJsonFile(`bagastudio-viewer-sync-v2-${Date.now()}.json`, viewerSyncV2Report);
}


const factoryProductionPackageV1Report = useMemo(() => {
  return buildFactoryProductionPackageV1Report({
    factoryV2: factoryEngineV2Report,
    productPackageV2: productPackageRegenerationV2Report,
    viewerSyncV2: viewerSyncV2Report,
  });
}, [factoryEngineV2Report, productPackageRegenerationV2Report, viewerSyncV2Report]);

function downloadFactoryProductionPackageV1Report() {
  downloadJsonFile(`bagastudio-factory-production-package-v1-${Date.now()}.json`, factoryProductionPackageV1Report);
}


const layoutRoomIntelligenceV1Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV1Report({
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [factoryProductionPackageV1Report]);

function downloadLayoutRoomIntelligenceV1Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v1-${Date.now()}.json`, layoutRoomIntelligenceV1Report);
}

const layoutTechnicalSheetGeneratorV1Report = useMemo(() => {
  return buildLayoutTechnicalSheetGeneratorV1Report({
    layout: layoutRoomIntelligenceV1Report,
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [layoutRoomIntelligenceV1Report, factoryProductionPackageV1Report]);

function downloadLayoutTechnicalSheetGeneratorV1Report() {
  downloadJsonFile(`bagastudio-layout-technical-sheet-generator-v1-${Date.now()}.json`, layoutTechnicalSheetGeneratorV1Report);
}

const layoutDxfCadExportPrepV1Report = useMemo(() => {
  return buildLayoutDxfCadExportPrepV1Report({
    layout: layoutRoomIntelligenceV1Report,
    technicalSheets: layoutTechnicalSheetGeneratorV1Report,
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [layoutRoomIntelligenceV1Report, layoutTechnicalSheetGeneratorV1Report, factoryProductionPackageV1Report]);

function downloadLayoutDxfCadExportPrepV1Report() {
  downloadJsonFile(`bagastudio-layout-dxf-cad-export-prep-v1-${Date.now()}.json`, layoutDxfCadExportPrepV1Report);
}

const technicalWallElevationSheetsV1Report = useMemo(() => {
  return buildTechnicalWallElevationSheetsV1Report({
    layout: layoutRoomIntelligenceV1Report,
    technicalSheets: layoutTechnicalSheetGeneratorV1Report,
    cadExport: layoutDxfCadExportPrepV1Report,
  });
}, [layoutRoomIntelligenceV1Report, layoutTechnicalSheetGeneratorV1Report, layoutDxfCadExportPrepV1Report]);

function downloadTechnicalWallElevationSheetsV1Report() {
  downloadJsonFile(`bagastudio-technical-wall-elevation-sheets-v1-${Date.now()}.json`, technicalWallElevationSheetsV1Report);
}

const wallTechnicalPointsValidationV1Report = useMemo(() => {
  return buildWallTechnicalPointsValidationV1Report({
    layout: layoutRoomIntelligenceV1Report,
    elevations: technicalWallElevationSheetsV1Report,
  });
}, [layoutRoomIntelligenceV1Report, technicalWallElevationSheetsV1Report]);

function downloadWallTechnicalPointsValidationV1Report() {
  downloadJsonFile(`bagastudio-wall-technical-points-validation-v1-${Date.now()}.json`, wallTechnicalPointsValidationV1Report);
}



const technicalKnowledgeBaseV1Report = useMemo(() => {
  return buildTechnicalKnowledgeBaseV1Report(wallTechnicalPointsValidationV1Report);
}, [wallTechnicalPointsValidationV1Report]);

function downloadTechnicalKnowledgeBaseV1Report() {
  downloadJsonFile(`bagastudio-technical-knowledge-base-v1-${Date.now()}.json`, technicalKnowledgeBaseV1Report);
}


const smartTechnicalValidatorV1Report = useMemo(() => {
  return buildSmartTechnicalValidatorV1Report({
    knowledgeBase: technicalKnowledgeBaseV1Report,
    wallValidation: wallTechnicalPointsValidationV1Report,
  });
}, [technicalKnowledgeBaseV1Report, wallTechnicalPointsValidationV1Report]);

function downloadSmartTechnicalValidatorV1Report() {
  downloadJsonFile(`bagastudio-smart-technical-validator-v1-${Date.now()}.json`, smartTechnicalValidatorV1Report);
}


const layoutRoomIntelligenceV2Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV2Report({
    layoutV1: layoutRoomIntelligenceV1Report,
    smartValidator: smartTechnicalValidatorV1Report,
    factoryProductionPackage: factoryProductionPackageV1Report,
  });
}, [layoutRoomIntelligenceV1Report, smartTechnicalValidatorV1Report, factoryProductionPackageV1Report]);

function downloadLayoutRoomIntelligenceV2Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-${Date.now()}.json`, layoutRoomIntelligenceV2Report);
}



const layoutRoomIntelligenceV21Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV21Report({
    layoutV2: layoutRoomIntelligenceV2Report,
  });
}, [layoutRoomIntelligenceV2Report]);

function downloadLayoutRoomIntelligenceV21Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-1-${Date.now()}.json`, layoutRoomIntelligenceV21Report);
}




const layoutRoomIntelligenceV22Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV22Report({
    layoutV21: layoutRoomIntelligenceV21Report,
  });
}, [layoutRoomIntelligenceV21Report]);

function downloadLayoutRoomIntelligenceV22Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-2-${Date.now()}.json`, layoutRoomIntelligenceV22Report);
}




const layoutRoomIntelligenceV23Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV23Report({
    layoutV22: layoutRoomIntelligenceV22Report,
  });
}, [layoutRoomIntelligenceV22Report]);

function downloadLayoutRoomIntelligenceV23Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-3-${Date.now()}.json`, layoutRoomIntelligenceV23Report);
}


const layoutRoomIntelligenceV24Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV24Report({
    layoutV23: layoutRoomIntelligenceV23Report,
  });
}, [layoutRoomIntelligenceV23Report]);

function downloadLayoutRoomIntelligenceV24Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-4-${Date.now()}.json`, layoutRoomIntelligenceV24Report);
}

const layoutRoomIntelligenceV25Report = useMemo(() => {
  return buildLayoutRoomIntelligenceV25Report({
    layoutV24: layoutRoomIntelligenceV24Report,
  });
}, [layoutRoomIntelligenceV24Report]);

function downloadLayoutRoomIntelligenceV25Report() {
  downloadJsonFile(`bagastudio-layout-room-intelligence-v2-5-${Date.now()}.json`, layoutRoomIntelligenceV25Report);
}


const dynamicRuleRegistryV26Report = useMemo(() => {
  return buildDynamicRuleRegistryV26Report({
    layoutV25: layoutRoomIntelligenceV25Report,
  });
}, [layoutRoomIntelligenceV25Report]);

function downloadDynamicRuleRegistryV26Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-registry-v2-6-${Date.now()}.json`, dynamicRuleRegistryV26Report);
}


const dynamicRuleAdminBridgeV27Report = useMemo(() => {
  return buildDynamicRuleAdminBridgeV27Report({
    registryV26: dynamicRuleRegistryV26Report,
  });
}, [dynamicRuleRegistryV26Report]);

function downloadDynamicRuleAdminBridgeV27Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-admin-bridge-v2-7-${Date.now()}.json`, dynamicRuleAdminBridgeV27Report);
}


const dynamicRulePackV28Report = useMemo(() => {
  return buildDynamicRulePackV28Report({
    adminBridgeV27: dynamicRuleAdminBridgeV27Report,
  });
}, [dynamicRuleAdminBridgeV27Report]);

function downloadDynamicRulePackV28Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-pack-system-v2-8-${Date.now()}.json`, dynamicRulePackV28Report);
}


const dynamicRuleConflictResolverV29Report = useMemo(() => {
  return buildDynamicRuleConflictResolverV29Report({
    rulePackV28: dynamicRulePackV28Report,
  });
}, [dynamicRulePackV28Report]);

function downloadDynamicRuleConflictResolverV29Report() {
  downloadJsonFile(`bagastudio-dynamic-rule-conflict-resolver-v2-9-${Date.now()}.json`, dynamicRuleConflictResolverV29Report);
}


const wallIntelligenceEngineV30Report = useMemo(() => {
  return buildWallIntelligenceEngineV30Report({
    conflictResolverV29: dynamicRuleConflictResolverV29Report,
  });
}, [dynamicRuleConflictResolverV29Report]);

function downloadWallIntelligenceEngineV30Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-engine-v3-0-${Date.now()}.json`, wallIntelligenceEngineV30Report);
}




const wallIntelligenceGuidedDescriptionV31Report = useMemo(() => {
  return buildWallIntelligenceGuidedDescriptionV31Report({
    wallEngineV30: wallIntelligenceEngineV30Report,
  });
}, [wallIntelligenceEngineV30Report]);

function downloadWallIntelligenceGuidedDescriptionV31Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-guided-description-v3-1-${Date.now()}.json`, wallIntelligenceGuidedDescriptionV31Report);
}



const wallIntelligenceConfidenceEngineV32Report = useMemo(() => {
  return buildWallIntelligenceConfidenceEngineV32Report({
    guidedDescriptionV31: wallIntelligenceGuidedDescriptionV31Report,
  });
}, [wallIntelligenceGuidedDescriptionV31Report]);

function downloadWallIntelligenceConfidenceEngineV32Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-confidence-engine-v3-2-${Date.now()}.json`, wallIntelligenceConfidenceEngineV32Report);
}


const wallIntelligenceLoadAnalyzerV33Report = useMemo(() => {
  return buildWallIntelligenceLoadAnalyzerV33Report({
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    wallEngineV30: wallIntelligenceEngineV30Report,
  });
}, [wallIntelligenceConfidenceEngineV32Report, wallIntelligenceEngineV30Report]);

function downloadWallIntelligenceLoadAnalyzerV33Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-load-analyzer-v3-3-${Date.now()}.json`, wallIntelligenceLoadAnalyzerV33Report);
}


const wallIntelligenceFixingRecommendationV34Report = useMemo(() => {
  return buildWallIntelligenceFixingRecommendationV34Report({
    loadAnalyzerV33: wallIntelligenceLoadAnalyzerV33Report,
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
  });
}, [wallIntelligenceLoadAnalyzerV33Report, wallIntelligenceConfidenceEngineV32Report]);

function downloadWallIntelligenceFixingRecommendationV34Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-fixing-recommendation-v3-4-${Date.now()}.json`, wallIntelligenceFixingRecommendationV34Report);
}


const wallIntelligenceMirrorShelfValidatorV35Report = useMemo(() => {
  return buildWallIntelligenceMirrorShelfValidatorV35Report({
    fixingRecommendationV34: wallIntelligenceFixingRecommendationV34Report,
    spacingV25: layoutRoomIntelligenceV25Report,
  });
}, [wallIntelligenceFixingRecommendationV34Report, layoutRoomIntelligenceV25Report]);

function downloadWallIntelligenceMirrorShelfValidatorV35Report() {
  downloadJsonFile(`bagastudio-wall-intelligence-mirror-shelf-validator-v3-5-${Date.now()}.json`, wallIntelligenceMirrorShelfValidatorV35Report);
}


const wallTechnicalReportV36Report = useMemo(() => {
  return buildWallTechnicalReportV36Report({
    wallEngineV30: wallIntelligenceEngineV30Report,
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    loadAnalyzerV33: wallIntelligenceLoadAnalyzerV33Report,
    fixingRecommendationV34: wallIntelligenceFixingRecommendationV34Report,
    mirrorShelfValidatorV35: wallIntelligenceMirrorShelfValidatorV35Report,
  });
}, [
  wallIntelligenceEngineV30Report,
  wallIntelligenceConfidenceEngineV32Report,
  wallIntelligenceLoadAnalyzerV33Report,
  wallIntelligenceFixingRecommendationV34Report,
  wallIntelligenceMirrorShelfValidatorV35Report,
]);

function downloadWallTechnicalReportV36Report() {
  downloadJsonFile(`bagastudio-wall-technical-report-v3-6-${Date.now()}.json`, wallTechnicalReportV36Report);
}



const installationRiskEngineV37Report = useMemo(() => {
  return buildInstallationRiskEngineV37Report({
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    loadAnalyzerV33: wallIntelligenceLoadAnalyzerV33Report,
    fixingRecommendationV34: wallIntelligenceFixingRecommendationV34Report,
    mirrorShelfValidatorV35: wallIntelligenceMirrorShelfValidatorV35Report,
    technicalWallReportV36: wallTechnicalReportV36Report,
  });
}, [
  wallIntelligenceConfidenceEngineV32Report,
  wallIntelligenceLoadAnalyzerV33Report,
  wallIntelligenceFixingRecommendationV34Report,
  wallIntelligenceMirrorShelfValidatorV35Report,
  wallTechnicalReportV36Report,
]);

function downloadInstallationRiskEngineV37Report() {
  downloadJsonFile(`bagastudio-installation-risk-engine-v3-7-${Date.now()}.json`, installationRiskEngineV37Report);
}



const installerChecklistEngineV38Report = useMemo(() => {
  return buildInstallerChecklistEngineV38Report({
    installationRiskV37: installationRiskEngineV37Report,
    technicalWallReportV36: wallTechnicalReportV36Report,
  });
}, [installationRiskEngineV37Report, wallTechnicalReportV36Report]);

function downloadInstallerChecklistEngineV38Report() {
  downloadJsonFile(`bagastudio-installer-checklist-engine-v3-8-${Date.now()}.json`, installerChecklistEngineV38Report);
}


const technicalApprovalWorkflowV39Report = useMemo(() => {
  return buildTechnicalApprovalWorkflowV39Report({
    installationRiskV37: installationRiskEngineV37Report,
    installerChecklistV38: installerChecklistEngineV38Report,
    technicalWallReportV36: wallTechnicalReportV36Report,
  });
}, [installationRiskEngineV37Report, installerChecklistEngineV38Report, wallTechnicalReportV36Report]);

function downloadTechnicalApprovalWorkflowV39Report() {
  downloadJsonFile(`bagastudio-technical-approval-workflow-v3-9-${Date.now()}.json`, technicalApprovalWorkflowV39Report);
}


const wallAssistedRecognitionV40Report = useMemo(() => {
  return buildWallAssistedRecognitionV40Report({
    wallEngineV30: wallIntelligenceEngineV30Report,
    confidenceEngineV32: wallIntelligenceConfidenceEngineV32Report,
    technicalApprovalV39: technicalApprovalWorkflowV39Report,
  });
}, [wallIntelligenceEngineV30Report, wallIntelligenceConfidenceEngineV32Report, technicalApprovalWorkflowV39Report]);

function downloadWallAssistedRecognitionV40Report() {
  downloadJsonFile(`bagastudio-wall-assisted-recognition-v4-0-${Date.now()}.json`, wallAssistedRecognitionV40Report);
}


const wallPhotoEvidenceV41Report = useMemo(() => {
  return buildWallPhotoEvidenceV41Report({
    assistedRecognitionV40: wallAssistedRecognitionV40Report,
  });
}, [wallAssistedRecognitionV40Report]);

function downloadWallPhotoEvidenceV41Report() {
  downloadJsonFile(`bagastudio-wall-photo-evidence-intake-v4-1-${Date.now()}.json`, wallPhotoEvidenceV41Report);
}


const wallDwgDxfEvidenceV42Report = useMemo(() => {
  return buildWallDwgDxfEvidenceV42Report({
    assistedRecognitionV40: wallAssistedRecognitionV40Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
  });
}, [wallAssistedRecognitionV40Report, wallPhotoEvidenceV41Report]);

function downloadWallDwgDxfEvidenceV42Report() {
  downloadJsonFile(`bagastudio-wall-dwg-dxf-evidence-intake-v4-2-${Date.now()}.json`, wallDwgDxfEvidenceV42Report);
}



const wallEvidenceFusionV43Report = useMemo(() => {
  return buildWallEvidenceFusionV43Report({
    assistedRecognitionV40: wallAssistedRecognitionV40Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
    drawingEvidenceV42: wallDwgDxfEvidenceV42Report,
    technicalApprovalV39: technicalApprovalWorkflowV39Report,
  });
}, [wallAssistedRecognitionV40Report, wallPhotoEvidenceV41Report, wallDwgDxfEvidenceV42Report, technicalApprovalWorkflowV39Report]);

function downloadWallEvidenceFusionV43Report() {
  downloadJsonFile(`bagastudio-wall-evidence-fusion-engine-v4-3-${Date.now()}.json`, wallEvidenceFusionV43Report);
}


const automaticWallClassificationV44Report = useMemo(() => {
  return buildAutomaticWallClassificationV44Report({
    fusionV43: wallEvidenceFusionV43Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
    drawingEvidenceV42: wallDwgDxfEvidenceV42Report,
  });
}, [wallEvidenceFusionV43Report, wallPhotoEvidenceV41Report, wallDwgDxfEvidenceV42Report]);

function downloadAutomaticWallClassificationV44Report() {
  downloadJsonFile(`bagastudio-automatic-wall-classification-v4-4-${Date.now()}.json`, automaticWallClassificationV44Report);
}

const aiTechnicalSuggestionsV45Report = useMemo(() => {
  return buildAiTechnicalSuggestionsV45Report({
    classificationV44: automaticWallClassificationV44Report,
    fusionV43: wallEvidenceFusionV43Report,
    photoEvidenceV41: wallPhotoEvidenceV41Report,
    drawingEvidenceV42: wallDwgDxfEvidenceV42Report,
    technicalApprovalV39: technicalApprovalWorkflowV39Report,
    installerChecklistV38: installerChecklistEngineV38Report,
  });
}, [
  automaticWallClassificationV44Report,
  wallEvidenceFusionV43Report,
  wallPhotoEvidenceV41Report,
  wallDwgDxfEvidenceV42Report,
  technicalApprovalWorkflowV39Report,
  installerChecklistEngineV38Report,
]);

function downloadAiTechnicalSuggestionsV45Report() {
  downloadJsonFile(`bagastudio-ai-technical-suggestions-v4-5-${Date.now()}.json`, aiTechnicalSuggestionsV45Report);
}


const technicalEvidenceApprovalV46Report = useMemo(() => {
  return buildTechnicalEvidenceApprovalV46Report(aiTechnicalSuggestionsV45Report);
}, [aiTechnicalSuggestionsV45Report]);

function downloadTechnicalEvidenceApprovalV46Report() {
  downloadJsonFile(`bagastudio-technical-evidence-approval-v4-6-${Date.now()}.json`, technicalEvidenceApprovalV46Report);
}



const evidenceToRenderArBridgeV47Report = useMemo(() => {
  return buildEvidenceToRenderArBridgeV47Report({
    photoEvidenceReport: wallPhotoEvidenceV41Report,
    fusionReport: wallEvidenceFusionV43Report,
    approvalReport: technicalEvidenceApprovalV46Report,
  });
}, [wallPhotoEvidenceV41Report, wallEvidenceFusionV43Report, technicalEvidenceApprovalV46Report]);

function downloadEvidenceToRenderArBridgeV47Report() {
  downloadJsonFile(`bagastudio-evidence-to-render-ar-bridge-v4-7-${Date.now()}.json`, evidenceToRenderArBridgeV47Report);
}

const buildAdminBackup = (includeHeavyModelData = true) => ({
  schema: "bagastudio-admin-backup",
  version: 1,
  savedAt: new Date().toISOString(),
  state: {
    productId,
    productName,
    productCategory,
    productBrand,
    packageVersion,
    widthDefault,
    widthMin,
    widthMax,
    heightDefault,
    heightMin,
    heightMax,
    depthDefault,
    depthMin,
    depthMax,
    modelFileName,
    modelExtension,
    modelDataUrl: includeHeavyModelData ? modelDataUrl : "",
    selectedMeshName,
    modelRotationY,
    meshList,
    generatedJson: includeHeavyModelData ? generatedJson : "",
    importerDiagnostic,
    space3DFileName,
    space3DAnalyzerReport,
    space3DStatus,
    geometryCompletionReport,
    autoMappingV2Report,
    autoMappingV2Status,
    autoMappingV2ReviewedLabels,
  },
});

const restoreAdminBackup = (backup: any) => {
  const state = backup?.state ?? backup;
  if (!state) return;

  setProductId(state.productId ?? "new-product");
  setProductName(state.productName ?? "Nuovo prodotto");
  setProductCategory(state.productCategory ?? "custom");
  setProductBrand(state.productBrand ?? "BagaStudio Core");
  setPackageVersion(state.packageVersion ?? "2.0.0");

  setWidthDefault(Number(state.widthDefault ?? 180));
  setWidthMin(Number(state.widthMin ?? 100));
  setWidthMax(Number(state.widthMax ?? 350));

  setHeightDefault(Number(state.heightDefault ?? 100));
  setHeightMin(Number(state.heightMin ?? 70));
  setHeightMax(Number(state.heightMax ?? 150));

  setDepthDefault(Number(state.depthDefault ?? 60));
  setDepthMin(Number(state.depthMin ?? 40));
  setDepthMax(Number(state.depthMax ?? 100));

  setModelFileName(state.modelFileName ?? "");
  setModelExtension(state.modelExtension ?? "glb");
  setModelDataUrl(state.modelDataUrl ?? "");
  setSelectedMeshName(state.selectedMeshName ?? "");
  setModelRotationY(Number(state.modelRotationY ?? 0));
  setMeshList(
    Array.isArray(state.meshList)
      ? state.meshList.map((mesh: any, index: number) => ({
          ...mesh,
          category: normalizeComponentCategory(mesh.category, mesh.displayName || mesh.meshName || ""),
          partId: mesh.partId || buildStablePartId(mesh, index),
          componentType: mesh.componentType || "",
          runtimeRole: mesh.runtimeRole || guessRuntimeRole(mesh.displayName || mesh.meshName || "", mesh.category || "component"),
          tags: mesh.tags || "",
          supportsAccessories:
            typeof mesh.supportsAccessories === "boolean"
              ? mesh.supportsAccessories
              : Boolean(mesh.compatibleAccessories),
        }))
      : []
  );
  setGeneratedJson(state.generatedJson ?? "");
  setImporterDiagnostic(state.importerDiagnostic || createAdminImporterDiagnostic());
  setSpace3DFileName(state.space3DFileName || "");
  setSpace3DAnalyzerReport(state.space3DAnalyzerReport || null);
  setSpace3DStatus(state.space3DStatus || "S3D analyzer in attesa");
  setGeometryCompletionReport(state.geometryCompletionReport || {
    status: "idle",
    daeMeshCount: 0,
    s3dComponentCount: 0,
    matchedCount: 0,
    missingCount: 0,
    missingParts: [],
    generatedAt: "",
  });
  setAutoMappingV2Report(state.autoMappingV2Report || null);
  setAutoMappingV2Status(state.autoMappingV2Status || "Auto Mapping Engine V2 in attesa");
  setAutoMappingV2ReviewedLabels(state.autoMappingV2ReviewedLabels || {});

  setBackupStatus(`${adminT.restoreCompleted}: ${new Date().toLocaleString()}`);
};

useEffect(() => {
  if (typeof window === "undefined") return;

  const saved = window.localStorage.getItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const savedAt = parsed?.savedAt
        ? new Date(parsed.savedAt).toLocaleString()
        : adminT.dateUnavailable;
      setBackupStatus(`${adminT.autosaveAvailable}: ${savedAt}`);
    } catch {
      setBackupStatus(adminT.autosaveUnreadable);
    }
  } else {
    setBackupStatus(adminT.noAutosaveAvailable);
  }

  autosaveHydratedRef.current = true;
}, [adminLanguage]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!autosaveHydratedRef.current) return;

  const timer = window.setTimeout(() => {
    try {
      const backup = buildAdminBackup(false);
      window.localStorage.setItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY, JSON.stringify(backup));
      setBackupStatus(`${adminT.autosave}: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.warn("BagaStudio Admin autosave skipped", error);
      setBackupStatus("Autosave saltato: package troppo pesante");
    }
  }, 700);

  return () => window.clearTimeout(timer);
}, [
  productId,
  productName,
  productCategory,
  productBrand,
  packageVersion,
  widthDefault,
  widthMin,
  widthMax,
  heightDefault,
  heightMin,
  heightMax,
  depthDefault,
  depthMin,
  depthMax,
  modelFileName,
  modelExtension,
  modelDataUrl,
  selectedMeshName,
  modelRotationY,
  meshList,
  generatedJson,
  importerDiagnostic,
  space3DFileName,
  space3DAnalyzerReport,
  space3DStatus,
  adminLanguage,
]);

const downloadAdminBackup = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJsonFile(`bagastudio-admin-backup-${stamp}.json`, buildAdminBackup());
};

const restoreLastAutosave = () => {
  if (typeof window === "undefined") return;

  const saved = window.localStorage.getItem(BAGASTUDIO_ADMIN_AUTOSAVE_KEY);
  if (!saved) {
    setBackupStatus(adminT.noAutosaveToRestore);
    return;
  }

  try {
    restoreAdminBackup(JSON.parse(saved));
  } catch {
    setBackupStatus(adminT.autosaveError);
  }
};

const importBackupFile = async (file: File | undefined) => {
  if (!file) return;

  try {
    const text = await file.text();
    restoreAdminBackup(JSON.parse(text));
  } catch {
    setBackupStatus(adminT.backupFileError);
  }
};

useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    const saved = window.localStorage.getItem(BAGASTUDIO_PRODUCT_LIBRARY_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    setProductLibrary(Array.isArray(parsed) ? parsed : []);
  } catch {
    setProductLibrary([]);
  }
}, []);

function persistProductLibrary(nextLibrary: ProductLibraryItem[]) {
  setProductLibrary(nextLibrary);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      BAGASTUDIO_PRODUCT_LIBRARY_KEY,
      JSON.stringify(nextLibrary)
    );
  } catch (error) {
    console.warn("BagaStudio product library save skipped", error);
  }
}

function downloadProductLibraryJson() {
  const payload = {
    schema: "bagastudio-product-library",
    version: 1,
    exportedAt: new Date().toISOString(),
    total: productLibrary.length,
    products: productLibrary,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bagastudio-product-library-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadSelectedLibraryProductPackage(item: ProductLibraryItem) {
  const blob = new Blob([item.packageJson], {
    type: "application/json",
  });

  const safeName = (item.name || item.id || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName || "bagastudio-product"}-package.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importProductPackageToLibrary(file?: File | null) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const packageJson = String(reader.result || "");
      const parsed = JSON.parse(packageJson);

      const item: ProductLibraryItem = {
        id: parsed.id || parsed.metadata?.id || `product-${Date.now()}`,
        name: parsed.name || parsed.metadata?.name || file.name.replace(/\.json$/i, ""),
        category: parsed.category || parsed.metadata?.productCategory || "custom",
        brand: parsed.brand || parsed.metadata?.brand || "BagaStudio Core",
        sourceFileName: parsed.model?.fileName || parsed.modelFileName || file.name,
        savedAt: new Date().toISOString(),
        packageJson,
      };

      persistProductLibrary([
        item,
        ...productLibrary.filter((product) => product.id !== item.id),
      ]);
      setSelectedLibraryProductId(item.id);
      setBackupStatus(adminT.librarySaved);
    } catch (error) {
      console.error("BagaStudio product package import error", error);
      setBackupStatus(adminT.backupFileError);
    }
  };

  reader.readAsText(file);
}

function buildCurrentProductPackageJson() {
  return buildCurrentProductPackageJsonV1({
    productId,
    productName,
    productBrand,
    productCategory,
    packageVersion,
    modelExtension,
    modelFileName,
    modelDataUrl,
    space3DAnalyzerReport,
    space3DFileName,
    meshList,
    csvCixMatcherReport,
    space3DCsvFileName,
    space3DCixFileNames,
    space3DCsvParts,
    space3DCixParts,
    autoMappingV2Report,
    autoMappingV2ReviewedLabels,
    widthMin,
    widthMax,
    widthDefault,
    heightMin,
    heightMax,
    heightDefault,
    depthMin,
    depthMax,
    depthDefault,
    buildRuntimeComponentV2,
    parseBagaStudioJsonField,
    readCollisionNumberV1,
    DEFAULT_PRODUCT_MATERIALS,
    DEFAULT_PRODUCT_VIEWS,
    getAutoMappingEngineV2ReviewSummary,
  });
}

function saveCurrentProductToLibrary() {
  const packageJson = generatedJson || buildCurrentProductPackageJson();

  const item: ProductLibraryItem = {
    id: productId || `product-${Date.now()}`,
    name: productName || "Nuovo prodotto",
    category: productCategory || "custom",
    brand: productBrand || "BagaStudio Core",
    sourceFileName: modelFileName || "",
    savedAt: new Date().toISOString(),
    packageJson,
  };

  const nextLibrary = [
    item,
    ...productLibrary.filter((product) => product.id !== item.id),
  ];

  persistProductLibrary(nextLibrary);
  setGeneratedJson(packageJson);
  setSelectedLibraryProductId(item.id);
  setBackupStatus(adminT.librarySaved);
}

function loadProductFromLibrary(item: ProductLibraryItem) {
  try {
    const parsed = JSON.parse(item.packageJson);

    setProductId(parsed.id || parsed.metadata?.id || item.id);
    setProductName(parsed.name || parsed.metadata?.name || item.name);
    setProductCategory(parsed.category || parsed.metadata?.productCategory || item.category);
    setProductBrand(parsed.brand || parsed.metadata?.brand || item.brand);
    setPackageVersion(parsed.packageVersion || parsed.version || "2.0.0");

    setWidthMin(Number(parsed.dimensions?.width?.min ?? widthMin));
    setWidthDefault(Number(parsed.dimensions?.width?.default ?? widthDefault));
    setWidthMax(Number(parsed.dimensions?.width?.max ?? widthMax));
    setHeightMin(Number(parsed.dimensions?.height?.min ?? heightMin));
    setHeightDefault(Number(parsed.dimensions?.height?.default ?? heightDefault));
    setHeightMax(Number(parsed.dimensions?.height?.max ?? heightMax));
    setDepthMin(Number(parsed.dimensions?.depth?.min ?? depthMin));
    setDepthDefault(Number(parsed.dimensions?.depth?.default ?? depthDefault));
    setDepthMax(Number(parsed.dimensions?.depth?.max ?? depthMax));

    setModelFileName(parsed.assets?.sourceFileName || item.sourceFileName || "");
    setModelExtension(parsed.assets?.originalFormat || "glb");
    setModelDataUrl(parsed.assets?.embeddedModelDataUrl || parsed.assets?.modelUrl || "");
    setModelPreviewUrl(parsed.assets?.embeddedModelDataUrl || parsed.assets?.modelUrl || "");

    const parts = Array.isArray(parsed.parts) ? parsed.parts : parsed.components || [];
    setMeshList(
      parts.map((part: any, index: number) => ({
        meshName: part.meshName || part.originalName || part.id,
        partId: part.partId || part.id || buildStablePartId(part, index),
        componentType: part.componentType || part.runtimeMetadata?.componentType || "",
        runtimeRole: part.runtimeRole || part.runtimeMetadata?.runtimeRole || guessRuntimeRole(part.name || part.meshName || part.id || "", part.category || "component"),
        tags: Array.isArray(part.tags) ? part.tags.join(", ") : part.tags || "",
        displayName: part.customerName || part.label || part.name || part.meshName || part.id,
        category: part.category || "component",
        selectable: part.selectable !== false,
        visible: part.visible !== false,
        compatibleLed: Boolean(part.compatibleLed),
        compatibleInsert: Boolean(part.compatibleInsert),
        supportsAccessories: part.supportsAccessories !== false,
        materialSlots: Array.isArray(part.materialSlots)
          ? part.materialSlots.join(", ")
          : part.materialSlots || "main",
        compatibleAccessories: Array.isArray(part.compatibleAccessories)
          ? part.compatibleAccessories.join(", ")
          : part.compatibleAccessories || "",
        dimensions: part.productPackageV3?.dimensions ? JSON.stringify(part.productPackageV3.dimensions) : part.dimensions ? JSON.stringify(part.dimensions) : "",
        technicalPoints: part.productPackageV3?.technicalPoints ? JSON.stringify(part.productPackageV3.technicalPoints) : part.technicalPoints ? JSON.stringify(part.technicalPoints) : "",
        assemblyOrder: String(part.productPackageV3?.assemblyOrder ?? part.assemblyOrder ?? ""),
        panelThickness: String(part.productPackageV3?.panelThickness ?? part.manufacturingMetadataV31?.panelThickness ?? part.panelThickness ?? ""),
        materialCode: String(part.productPackageV3?.materialCode ?? part.manufacturingMetadataV31?.materialCode ?? part.materialCode ?? ""),
        edgeBanding: part.productPackageV3?.edgeBanding ? JSON.stringify(part.productPackageV3.edgeBanding) : part.manufacturingMetadataV31?.edgeBanding ? JSON.stringify(part.manufacturingMetadataV31.edgeBanding) : part.edgeBanding ? JSON.stringify(part.edgeBanding) : "",
        hardware: Array.isArray(part.productPackageV3?.hardware)
          ? part.productPackageV3.hardware.join(", ")
          : Array.isArray(part.hardware)
          ? part.hardware.join(", ")
          : part.hardware || "",
        drillings: part.productPackageV3?.drillings ? JSON.stringify(part.productPackageV3.drillings) : part.drillings ? JSON.stringify(part.drillings) : "",
        manufacturingData: part.productPackageV3?.manufacturingData ? JSON.stringify(part.productPackageV3.manufacturingData) : part.manufacturingData ? JSON.stringify(part.manufacturingData) : "",
        constraintRole: String(part.constraintRole || part.hardwareAnalyzerV1?.constraintRole || ""),
        hardwareLinks: part.hardwareAnalyzerV1?.hardwareLinks ? JSON.stringify(part.hardwareAnalyzerV1.hardwareLinks) : part.hardwareLinks ? JSON.stringify(part.hardwareLinks) : "",
        drillingLinks: part.hardwareAnalyzerV1?.drillingLinks ? JSON.stringify(part.hardwareAnalyzerV1.drillingLinks) : part.drillingLinks ? JSON.stringify(part.drillingLinks) : "",
        dependencyParents: Array.isArray(part.hardwareAnalyzerV1?.dependencyGraph?.parents)
          ? part.hardwareAnalyzerV1.dependencyGraph.parents.join(", ")
          : Array.isArray(part.dependencyGraph?.parents)
          ? part.dependencyGraph.parents.join(", ")
          : "",
        dependencyChildren: Array.isArray(part.hardwareAnalyzerV1?.dependencyGraph?.children)
          ? part.hardwareAnalyzerV1.dependencyGraph.children.join(", ")
          : Array.isArray(part.dependencyGraph?.children)
          ? part.dependencyGraph.children.join(", ")
          : "",
        ledPosition: part.mountPoints?.led?.position || "front",
        ledFrontOffset: String(part.mountPoints?.led?.frontOffset ?? "4"),
        ledSideMargin: String(part.mountPoints?.led?.sideMargin ?? "5"),
        ledYOffset: String(part.mountPoints?.led?.yOffset ?? "0"),
        insertPosition: Array.isArray(part.mountPoints?.insert?.position)
          ? part.mountPoints.insert.position.join(", ")
          : part.mountPoints?.insert?.position || "front",
        insertOffsetX: String(part.mountPoints?.insert?.offset?.x ?? "0"),
        insertOffsetY: String(part.mountPoints?.insert?.offset?.y ?? "0"),
        insertOffsetZ: String(part.mountPoints?.insert?.offset?.z ?? "1"),
      }))
    );

    setGeneratedJson(item.packageJson);
    setSelectedMeshName("");
  } catch (error) {
    console.error("BagaStudio product library load error", error);
  }
}

function deleteProductFromLibrary(productIdToDelete: string) {
  persistProductLibrary(
    productLibrary.filter((product) => product.id !== productIdToDelete)
  );
}

function updateCsvCixMatcherReport(nextCsvParts = space3DCsvParts, nextCixParts = space3DCixParts) {
  if (nextCsvParts.length === 0 || nextCixParts.length === 0) {
    setCsvCixMatcherReport(null);
    setCsvCixStatus(
      nextCsvParts.length === 0
        ? "Carica prima il CSV Space3D."
        : "Carica almeno un file CIX."
    );
    return;
  }

  const matches = matchCsvPartsToCixParts(nextCsvParts, nextCixParts);
  const report = buildCsvCixMatcherReport(matches);

  setCsvCixMatcherReport(report);
  setCsvCixStatus(
    `Match CSV/CIX: ${report.matchedParts}/${report.totalCsvParts} pezzi collegati · confidenza media ${report.averageConfidence}%`
  );
}

async function handleSpace3DCsvImport(file?: File | null) {
  if (!file) return;

  try {
    const text = await file.text();
    const csvParts = parseSpazio3DCsv(text);

    setSpace3DCsvFileName(file.name);
    setSpace3DCsvParts(csvParts);
    updateCsvCixMatcherReport(csvParts, space3DCixParts);
  } catch (error) {
    console.error("BagaStudio CSV import error:", error);
    setCsvCixStatus(error instanceof Error ? `Errore CSV: ${error.message}` : "Errore CSV sconosciuto.");
  }
}

async function handleSpace3DCixImport(files?: FileList | null) {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return;

  try {
    const cixFiles = await Promise.all(
      fileList.map(async (file) => ({
        fileName: file.name,
        content: await file.text(),
      }))
    );

    const cixDrillingsByFileName = Object.fromEntries(
      cixFiles.map((file) => [file.fileName, extractCixDrillingsV1(file.fileName, file.content)])
    );
    const parsedCixParts = parseCixFiles(cixFiles);
    const cixParts = parsedCixParts.map((part, index) => {
      const partFileName = String((part as { fileName?: string }).fileName || cixFiles[index]?.fileName || "");
      const drillingLinks = cixDrillingsByFileName[partFileName] || [];

      return {
        ...part,
        drillingLinks: drillingLinks.length > 0 ? JSON.stringify(drillingLinks) : "",
      } as CixPart & { drillingLinks?: string };
    });
    const extractedDrillings = Object.values(cixDrillingsByFileName).reduce((sum, items) => sum + items.length, 0);

    setSpace3DCixFileNames(fileList.map((file) => file.name));
    setSpace3DCixParts(cixParts);
    updateCsvCixMatcherReport(space3DCsvParts, cixParts);
    setCsvCixStatus(`CIX Drilling Extractor V1: ${extractedDrillings} forature rilevate da ${fileList.length} file CIX.`);
  } catch (error) {
    console.error("BagaStudio CIX import error:", error);
    setCsvCixStatus(error instanceof Error ? `Errore CIX: ${error.message}` : "Errore CIX sconosciuto.");
  }
}

function downloadCsvCixMatcherReport() {
  if (!csvCixMatcherReport) return;

  downloadJsonFile(`bagastudio-csv-cix-matcher-${Date.now()}.json`, {
    schema: "bagastudio-csv-cix-matcher-report",
    version: 1,
    csvFileName: space3DCsvFileName,
    cixFileNames: space3DCixFileNames,
    report: csvCixMatcherReport,
  });
}

function applyAutoMappingEngineV2() {
  if (!csvCixMatcherReport || csvCixMatcherReport.matches.length === 0) {
    setAutoMappingV2Report(null);
    setAutoMappingV2Status("Carica CSV e CIX prima di eseguire Auto Mapping Engine V2.");
    return;
  }

  const eligibleMatches = csvCixMatcherReport.matches.filter(
    (match) => Boolean(match.cixPart) && Number(match.confidence || 0) >= AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE
  );

  if (eligibleMatches.length === 0) {
    setAutoMappingV2Report(null);
    setAutoMappingV2Status("Auto Mapping V2 non applicato: nessun match sopra la soglia minima di confidenza.");
    return;
  }

  setMeshList((current) => {
    const usedMatchIndexes = new Set<number>();
    const updatedComponents: string[] = [];
    let appliedMatches = 0;

    setAutoMappingV2LastSnapshot(current);

    const nextMeshes = current.map((mesh) => {
      const meshKeys = [mesh.meshName, mesh.displayName, mesh.partId || "", mesh.runtimeRole || ""]
        .map(normalizeAutoMappingV2Key)
        .filter(Boolean);

      const matchIndex = eligibleMatches.findIndex((match, index) => {
        if (usedMatchIndexes.has(index)) return false;

        const matchKeys = [
          match.csvPart?.name || "",
          match.cixPart?.partName || "",
          match.cixPart?.fileName || "",
        ]
          .map(normalizeAutoMappingV2Key)
          .filter(Boolean);

        return meshKeys.some((meshKey) =>
          matchKeys.some((matchKey) =>
            meshKey === matchKey ||
            meshKey.includes(matchKey) ||
            matchKey.includes(meshKey)
          )
        );
      });

      if (matchIndex === -1) return mesh;

      usedMatchIndexes.add(matchIndex);
      appliedMatches += 1;
      updatedComponents.push(mesh.displayName || mesh.meshName || `Componente ${appliedMatches}`);
      return mergeAutoMappingV2MatchIntoMesh(mesh, eligibleMatches[matchIndex], matchIndex);
    });

    const placeholders = eligibleMatches
      .filter((_, index) => !usedMatchIndexes.has(index))
      .map((match, index) => buildAutoMappingV2MeshFromMatch(match, current.length + index));

    const finalMeshes = normalizeAdminMeshList([...nextMeshes, ...placeholders].map(classifyAutoMappingEngineV25Mesh));
    const classificationV25 = buildAutoMappingEngineV25ClassificationReport(finalMeshes);
    const placeholderComponents = placeholders.map((mesh) => mesh.displayName || mesh.meshName || "Placeholder metadata");
    const riskyMatches = eligibleMatches
      .filter((match) => Number(match.confidence || 0) < AUTO_MAPPING_ENGINE_V2_HIGH_CONFIDENCE)
      .slice(0, 20)
      .map((match) => `${match.csvPart?.name || "CSV senza nome"} → ${match.cixPart?.partName || match.cixPart?.fileName || "CIX senza nome"} (${match.confidence || 0}%)`);
    const lowConfidenceMatches = csvCixMatcherReport.matches
      .filter((match) => !match.cixPart || Number(match.confidence || 0) < AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE)
      .slice(0, 30)
      .map((match) => `${match.csvPart?.name || "CSV senza nome"} → ${match.cixPart?.partName || match.cixPart?.fileName || "CIX non collegato"} (${match.confidence || 0}%)`);
    const meshCountAfter = finalMeshes.length;
    const quality = evaluateAutoMappingEngineV2Quality({
      totalMatches: csvCixMatcherReport.matches.length,
      eligibleMatches: eligibleMatches.length,
      appliedMatches,
      createdPlaceholders: placeholders.length,
      skippedLowConfidence: csvCixMatcherReport.matches.length - eligibleMatches.length,
      averageConfidence: csvCixMatcherReport.averageConfidence,
      riskyMatches,
    });
    const reviewQueue = buildAutoMappingEngineV2ReviewQueue({
      riskyMatches,
      lowConfidenceMatches,
      placeholderComponents,
      qualityLevel: quality.qualityLevel,
    });

    setAutoMappingV2ReviewedLabels({});

    const report: AutoMappingEngineV2ReportState = {
      schema: "bagastudio-auto-mapping-engine-report",
      version: 2.5,
      totalMatches: csvCixMatcherReport.matches.length,
      eligibleMatches: eligibleMatches.length,
      appliedMatches,
      createdPlaceholders: placeholders.length,
      skippedLowConfidence: csvCixMatcherReport.matches.length - eligibleMatches.length,
      averageConfidence: csvCixMatcherReport.averageConfidence,
      confidenceThreshold: AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE,
      qualityScore: quality.qualityScore,
      qualityLevel: quality.qualityLevel,
      recommendedActions: quality.recommendedActions,
      riskyMatches,
      lowConfidenceMatches,
      reviewQueue,
      classificationSummary: classificationV25.summary,
      classifiedComponents: classificationV25.classifiedComponents,
      meshCountBefore: current.length,
      meshCountAfter,
      updatedComponents,
      placeholderComponents,
      generatedAt: new Date().toISOString(),
      notes: [
        "Auto Mapping Engine V2 applicato in modo conservativo: nessuna mesh esistente viene rimossa.",
        `Soglia minima confidenza: ${AUTO_MAPPING_ENGINE_V2_MIN_CONFIDENCE}%.`,
        "Snapshot locale creato prima dell'applicazione per ripristino rapido in sessione.",
        placeholders.length > 0
          ? "I match senza mesh geometrica corrispondente sono stati aggiunti come placeholder metadata."
          : "Tutti i match eleggibili sono stati collegati a componenti esistenti.",
        `Quality gate V2.2: ${quality.qualityLevel} (${quality.qualityScore}/100).`,
        `Review Queue V2.3: ${reviewQueue.length} elementi generati per controllo tecnico.`,
        `Component Classification V2.5: ${classificationV25.summary.classifiedComponents}/${classificationV25.summary.totalComponents} componenti classificati.`,
        "Review Actions V2.4: coda revisionabile con stato verificato/non verificato ed export dedicato.",
      ],
    };

    setAutoMappingV2Report(report);
    setAutoMappingV2Status(
      `Auto Mapping V2 completato: ${appliedMatches} componenti aggiornati, ${placeholders.length} placeholder creati · qualità ${quality.qualityScore}/100.`
    );

    return finalMeshes;
  });
}

function restoreAutoMappingEngineV2Snapshot() {
  if (!autoMappingV2LastSnapshot) {
    setAutoMappingV2Status("Nessuno snapshot Auto Mapping V2 disponibile in questa sessione.");
    return;
  }

  setMeshList(normalizeAdminMeshList(autoMappingV2LastSnapshot));
  setAutoMappingV2Report(null);
  setAutoMappingV2LastSnapshot(null);
  setAutoMappingV2ReviewedLabels({});
  setAutoMappingV2Status("Ripristino Auto Mapping V2 completato: mesh tornate allo stato precedente.");
}

function downloadAutoMappingEngineV2Report() {
  if (!autoMappingV2Report) return;

  downloadJsonFile(`bagastudio-auto-mapping-engine-v2-${Date.now()}.json`, {
    schema: "bagastudio-auto-mapping-engine-export",
    version: 2.4,
    csvFileName: space3DCsvFileName,
    cixFileNames: space3DCixFileNames,
    productId,
    productName,
    reviewedLabels: autoMappingV2ReviewedLabels,
    reviewSummary: getAutoMappingEngineV2ReviewSummary(),
    report: autoMappingV2Report,
  });
}

function buildAutoMappingEngineV2ReviewKey(item: AutoMappingEngineV2ReviewItem, index: number) {
  return `${item.severity}|${item.label}|${index}`;
}

function getAutoMappingEngineV2ReviewSummary() {
  if (!autoMappingV2Report) {
    return { total: 0, reviewed: 0, pending: 0, criticalPending: 0, warningPending: 0 };
  }

  const total = autoMappingV2Report.reviewQueue.length;
  const reviewed = autoMappingV2Report.reviewQueue.filter((item, index) =>
    Boolean(autoMappingV2ReviewedLabels[buildAutoMappingEngineV2ReviewKey(item, index)])
  ).length;
  const pendingItems = autoMappingV2Report.reviewQueue.filter((item, index) =>
    !autoMappingV2ReviewedLabels[buildAutoMappingEngineV2ReviewKey(item, index)]
  );

  return {
    total,
    reviewed,
    pending: Math.max(0, total - reviewed),
    criticalPending: pendingItems.filter((item) => item.severity === "critical").length,
    warningPending: pendingItems.filter((item) => item.severity === "warning").length,
  };
}

function toggleAutoMappingEngineV2ReviewItem(item: AutoMappingEngineV2ReviewItem, index: number) {
  const key = buildAutoMappingEngineV2ReviewKey(item, index);
  setAutoMappingV2ReviewedLabels((current) => ({
    ...current,
    [key]: !current[key],
  }));
}

function markAllAutoMappingEngineV2ReviewItemsReviewed() {
  if (!autoMappingV2Report) return;

  const next: Record<string, boolean> = {};
  autoMappingV2Report.reviewQueue.forEach((item, index) => {
    next[buildAutoMappingEngineV2ReviewKey(item, index)] = true;
  });
  setAutoMappingV2ReviewedLabels(next);
  setAutoMappingV2Status("Review Queue V2.4 marcata come verificata in sessione.");
}

function resetAutoMappingEngineV2ReviewActions() {
  setAutoMappingV2ReviewedLabels({});
  setAutoMappingV2Status("Review Queue V2.4 riportata a stato non verificato.");
}

function downloadAutoMappingEngineV2ReviewQueue() {
  if (!autoMappingV2Report) return;

  downloadJsonFile(`bagastudio-auto-mapping-review-queue-v2-${Date.now()}.json`, {
    schema: "bagastudio-auto-mapping-review-queue",
    version: 2.4,
    productId,
    productName,
    summary: getAutoMappingEngineV2ReviewSummary(),
    reviewedLabels: autoMappingV2ReviewedLabels,
    items: autoMappingV2Report.reviewQueue.map((item, index) => ({
      ...item,
      reviewed: Boolean(autoMappingV2ReviewedLabels[buildAutoMappingEngineV2ReviewKey(item, index)]),
    })),
  });
}

async function handleSpace3DImport(file?: File | null) {
  if (!file) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!["s3d", "s3dbak"].includes(ext)) {
    setSpace3DStatus("Formato non supportato: usa .s3d o .s3dbak");
    return;
  }

  setSpace3DFileName(file.name);
  setSpace3DStatus(`Analisi Space3D in corso: ${file.name}`);

  // S3D Analyzer: il file .s3d NON è una geometria 3D caricabile direttamente nel preview.
  // Se esiste già una geometria reale importata prima (DAE/GLB/OBJ/STL), la manteniamo
  // e usiamo il .s3d solo come sorgente metadata/mapping. Se non esiste geometria,
  // il package resta metadata-only e il Viewer lo bloccherà correttamente.
  if (!modelDataUrl) {
    setModelPreviewUrl("");
    setModelFileName(file.name);
    setModelExtension(ext);
  }

  try {
    const buffer = await file.arrayBuffer();
    let text = "";

    try {
      text = new TextDecoder("windows-1252").decode(buffer);
    } catch {
      text = new TextDecoder("utf-8").decode(buffer);
    }

    const report = buildSpace3DAnalyzerReport(file.name, file.size, text);
    const mappedMeshes = normalizeAdminMeshList(space3DReportToMeshConfigs(report));

    setSpace3DAnalyzerReport(report);
    setSpace3DStatus(
      `Analisi completata: ${report.stats.components} componenti / ${report.stats.materials} materiali rilevati`
    );

    if (mappedMeshes.length > 0) {
      setMeshList(mappedMeshes);
      suppressNextMeshAutoScrollRef.current = true;
      setSelectedMeshName(mappedMeshes[0]?.meshName || "");
    }

    setImporterDiagnostic(
      buildAdminImporterDiagnostic(file.name, ext, mappedMeshes, [
        "Import Space3D Analyzer V1: geometria 3D non ancora convertita, mapping componenti/materiali pronto.",
        ...report.warnings,
      ])
    );
  } catch (error) {
    console.error("BagaStudio Space3D analyzer error", error);
    setSpace3DStatus("Errore durante analisi Space3D");
    setSpace3DAnalyzerReport(null);
    setImporterDiagnostic(
      buildAdminImporterDiagnostic(file.name, ext, [], [], [
        error instanceof Error ? error.message : "Errore analisi file Space3D.",
      ])
    );
  }
}

function downloadSpace3DAnalyzerReport() {
  if (!space3DAnalyzerReport) return;

  downloadJsonFile(
    `bagastudio-space3d-analyzer-${Date.now()}.json`,
    space3DAnalyzerReport
  );
}

function normalizeGeometryMatchKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectMissingSpace3DParts() {
  if (!space3DAnalyzerReport) {
    setSpace3DStatus("Carica prima un file .s3d per confrontare i componenti.");
    return;
  }

  const daeMeshes = meshList.filter((mesh) => !mesh.meshName.startsWith("s3d_component_"));
  const daeKeys = new Set<string>(
    daeMeshes.flatMap((mesh): string[] => [
      normalizeGeometryMatchKey(mesh.meshName),
      normalizeGeometryMatchKey(mesh.displayName),
      normalizeGeometryMatchKey(mesh.partId || ""),
    ])
  );

  const missingParts = space3DAnalyzerReport.components
    .filter((component) => {
      const componentKey = normalizeGeometryMatchKey(component.name);
      if (!componentKey) return false;
      return !Array.from(daeKeys).some((key) => key && (componentKey.includes(key) || key.includes(componentKey)));
    })
    .map((component, index): MeshConfig => ({
      meshName: `reconstructed_${component.id}`,
      displayName: component.name || `Parte ricostruita ${index + 1}`,
      category: component.category || "component",
      partId: `reconstructed_${String(index + 1).padStart(3, "0")}_${slugifyBagaStudioId(component.name, "space3d_part")}`,
      componentType: "reconstructed-placeholder",
      runtimeRole: guessRuntimeRole(component.name, component.category || "component"),
      tags: "reconstructed, missing-from-dae, space3d, geometry-completion-v1",
      selectable: true,
      visible: true,
      compatibleLed: component.category === "panel" || component.name.toLowerCase().includes("led"),
      compatibleInsert: component.category === "panel",
      supportsAccessories: component.category !== "lighting",
      materialSlots: "main",
      compatibleAccessories: component.category === "hardware" ? "hardware" : "",
      dimensions: "",
      technicalPoints: "",
      assemblyOrder: "",
      panelThickness: "",
      hardware: component.category === "hardware" ? component.name : "",
      drillings: "",
      manufacturingData: "",
      constraintRole: "",
      hardwareLinks: "",
      drillingLinks: "",
      dependencyParents: "",
      dependencyChildren: "",
      ledPosition: "front",
      ledFrontOffset: "4",
      ledSideMargin: "5",
      ledYOffset: "0",
      insertPosition: "front",
      insertOffsetX: "0",
      insertOffsetY: "0",
      insertOffsetZ: "1",
    }));

  setGeometryCompletionReport({
    status: "ready",
    daeMeshCount: daeMeshes.length,
    s3dComponentCount: space3DAnalyzerReport.components.length,
    matchedCount: Math.max(space3DAnalyzerReport.components.length - missingParts.length, 0),
    missingCount: missingParts.length,
    missingParts,
    generatedAt: new Date().toISOString(),
  });

  setSpace3DStatus(
    `Geometry Completion V1: ${missingParts.length} parti mancanti rilevate su ${space3DAnalyzerReport.components.length} componenti S3D.`
  );
}

function applyMissingPartsAsPlaceholders() {
  if (geometryCompletionReport.missingParts.length === 0) {
    setSpace3DStatus("Nessuna parte mancante da aggiungere come placeholder.");
    return;
  }

  setMeshList((current) => {
    const existing = new Set(current.map((mesh) => mesh.meshName));
    const nextMissing = geometryCompletionReport.missingParts.filter(
      (mesh) => !existing.has(mesh.meshName)
    );

    return normalizeAdminMeshList([...current, ...nextMissing]);
  });

  setSpace3DStatus(
    `Placeholder metadata aggiunti: ${geometryCompletionReport.missingParts.length} parti ricostruite.`
  );
}

function buildSpace3DProductPackageDraft() {
  if (!space3DAnalyzerReport) return;

  const packageDraft = {
    schema: "bagastudio-product-package-from-space3d",
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      type: "space3d",
      fileName: space3DAnalyzerReport.fileName,
      analyzerVersion: space3DAnalyzerReport.version,
    },
    product: {
      id: productId,
      name: productName,
      category: productCategory,
      brand: productBrand,
    },
    dimensions: {
      width: { default: widthDefault, min: widthMin, max: widthMax },
      height: { default: heightDefault, min: heightMin, max: heightMax },
      depth: { default: depthDefault, min: depthMin, max: depthMax },
    },
    components: meshList,
    materials: space3DAnalyzerReport.materials,
    analyzerReport: space3DAnalyzerReport,
    geometryCompletion: {
      schema: "bagastudio-geometry-completion-report",
      version: 1,
      ...geometryCompletionReport,
    },
    reconstructedParts: geometryCompletionReport.missingParts,
    geometryStatus: geometryCompletionReport.missingParts.length > 0 ? "metadata-placeholders-ready" : "pending-geometry-bridge",
  };

  const jsonString = JSON.stringify(packageDraft, null, 2);
  setGeneratedJson(jsonString);
  downloadJsonFile("space3d-product-package-draft.json", jsonString);
}

async function handleAdminModelImport(file?: File | null) {
  if (!file) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "glb";
  const supported = ["glb", "gltf", "dae", "fbx", "obj", "stl"];

  setImporterDiagnostic(
    createAdminImporterDiagnostic({
      status: "loading",
      fileName: file.name,
      extension: ext,
      message: `Import ${file.name} in corso...`,
    })
  );

  setModelFileName(file.name);
  const url = URL.createObjectURL(file);
  setModelPreviewUrl(url);

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    setModelDataUrl(dataUrl);
    setModelExtension(ext);
    setSelectedMeshName("");
    setMeshList([]);

    if (!supported.includes(ext)) {
      const diagnostic = createAdminImporterDiagnostic({
        status: "error",
        fileName: file.name,
        extension: ext,
        message: "Formato non supportato dall'importer Admin.",
        errors: [`Formato .${ext} non supportato. Usa GLB, GLTF, DAE, FBX, OBJ o STL.`],
      });
      setImporterDiagnostic(diagnostic);
      return;
    }

    const applyMeshes = (meshes: MeshConfig[], warnings: string[] = []) => {
      const normalizedMeshes = normalizeAdminMeshList(meshes);
      setMeshList(normalizedMeshes);
      setImporterDiagnostic(buildAdminImporterDiagnostic(file.name, ext, normalizedMeshes, warnings));

      if (normalizedMeshes[0]?.meshName) {
        suppressNextMeshAutoScrollRef.current = true;
        setSelectedMeshName(normalizedMeshes[0].meshName);
      }
    };

    const applyError = (error: unknown) => {
      console.error("BagaStudio Admin model import error:", error);
      setMeshList([]);
      setImporterDiagnostic(
        buildAdminImporterDiagnostic(file.name, ext, [], [], [
          error instanceof Error ? error.message : "Errore sconosciuto durante import modello.",
        ])
      );
    };

    if (ext === "stl") {
      applyMeshes([
        {
          meshName: "STL_Mesh",
          displayName: "Componente STL",
          category: "component",
          supportsAccessories: true,
          selectable: true,
          visible: true,
          compatibleLed: false,
          compatibleInsert: false,
          materialSlots: "main",
          compatibleAccessories: "",
          ledPosition: "front",
          ledFrontOffset: "4",
          ledSideMargin: "5",
          ledYOffset: "0",
          insertPosition: "front",
          insertOffsetX: "0",
          insertOffsetY: "0",
          insertOffsetZ: "1",
        },
      ]);
      return;
    }

    if (ext === "obj") {
      new OBJLoader().load(
        url,
        (loadedObject) => applyMeshes(extractMeshesFromObject(loadedObject)),
        undefined,
        applyError
      );
      return;
    }

    if (ext === "fbx") {
      new FBXLoader().load(
        url,
        (loadedObject) => applyMeshes(extractMeshesFromObject(loadedObject)),
        undefined,
        applyError
      );
      return;
    }

    if (ext === "dae") {
      let daeHierarchyWarnings: string[] = [];

      try {
        const daeText = await file.text();
        const daeHierarchyReport = resolveDaeHierarchy(daeText);
        const importerReport = buildImporterReport({
          fileName: file.name,
          sourceFormat: daeHierarchyReport.sourceFormat,
          nodeCount: daeHierarchyReport.nodeCount,
          instanceNodeCount: daeHierarchyReport.instanceNodeCount,
          geometryCount: daeHierarchyReport.geometryCount,
          warnings: daeHierarchyReport.warnings,
        });

        daeHierarchyWarnings = [
          ...daeHierarchyReport.warnings,
          `Importer Report: ${importerReport.status}`,
          `DAE nodes: ${importerReport.statistics.nodes}`,
          `DAE instance nodes: ${importerReport.statistics.instanceNodes}`,
          `DAE geometries: ${importerReport.statistics.geometries}`,
        ];

        console.log("BagaStudio DAE Hierarchy Report:", daeHierarchyReport);
        console.log("BagaStudio Importer Report:", importerReport);

        try {
          const runtimeGlb = await convertDaeToRuntimeGlb({
            daeText,
            fileName: file.name,
            bakeTransforms: true,
            centerModel: true,
            normalizeScale: false,
          });

          const runtimeGlbObjectUrl = URL.createObjectURL(runtimeGlb.glbBlob);

          (window as any).bagastudioLastRuntimeGlb = {
            ...runtimeGlb,
            objectUrl: runtimeGlbObjectUrl,
            sourceFileName: file.name,
          };

          setModelFileName(runtimeGlb.fileName);
          setModelPreviewUrl(runtimeGlbObjectUrl);

          daeHierarchyWarnings.push(
            `Runtime GLB ready: ${runtimeGlb.fileName}`,
            `Runtime GLB meshes: ${runtimeGlb.meshCount}`,
            `Runtime GLB objects: ${runtimeGlb.objectCount}`,
            ...runtimeGlb.warnings
          );

          new GLTFLoader().load(
            runtimeGlbObjectUrl,
            (gltf) => {
              applyMeshes(extractMeshesFromObject(gltf.scene), daeHierarchyWarnings);
            },
            undefined,
            applyError
          );

          console.log("BagaStudio Runtime GLB V1:", {
            fileName: runtimeGlb.fileName,
            objectCount: runtimeGlb.objectCount,
            meshCount: runtimeGlb.meshCount,
            objectUrl: runtimeGlbObjectUrl,
            warnings: runtimeGlb.warnings,
            naming: runtimeGlb.naming,
          });

          return;
        } catch (runtimeGlbError) {
          const message =
            runtimeGlbError instanceof Error
              ? runtimeGlbError.message
              : "errore sconosciuto conversione GLB runtime.";

          daeHierarchyWarnings.push(`Runtime GLB V1 skipped: ${message}`);
          console.warn("BagaStudio Runtime GLB V1 skipped:", runtimeGlbError);
        }
      } catch (error) {
        console.warn("BagaStudio DAE Hierarchy Report skipped:", error);
        daeHierarchyWarnings = [
          error instanceof Error
            ? `DAE hierarchy analyzer: ${error.message}`
            : "DAE hierarchy analyzer: errore sconosciuto durante analisi.",
        ];
      }

      new ColladaLoader().load(
        url,
        (collada) => {
          const daeScene = collada?.scene;
          if (!daeScene) {
            applyError(new Error("DAE scene not found"));
            return;
          }
          applyMeshes(extractMeshesFromObject(daeScene), daeHierarchyWarnings);
        },
        undefined,
        applyError
      );
      return;
    }

    new GLTFLoader().load(
      url,
      (gltf) => applyMeshes(extractMeshesFromObject(gltf.scene)),
      undefined,
      applyError
    );
  } catch (error) {
    console.error("BagaStudio Admin file read error:", error);
    setImporterDiagnostic(
      buildAdminImporterDiagnostic(file.name, ext, [], [], [
        error instanceof Error ? error.message : "Errore lettura file modello.",
      ])
    );
  }
}

function downloadImporterDiagnosticJson() {
  downloadJsonFile(`bagastudio-importer-diagnostic-${Date.now()}.json`, {
    schema: "bagastudio-admin-importer-diagnostic",
    version: 1,
    diagnostic: importerDiagnostic,
    readiness: importerReadiness,
    selectedComponent: selectedMapperMesh,
    components: meshList,
  });
}


  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_28%),#02070d] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[34px] border border-cyan-400/20 bg-gradient-to-r from-[#061827]/95 via-[#07131f]/95 to-[#02070d]/95 shadow-[0_30px_120px_rgba(14,165,233,0.16)] backdrop-blur-2xl">
          <div className="flex flex-col gap-5 border-b border-cyan-400/10 px-6 py-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <img
                src="/bagastudio-core-brand.png"
                alt="BagaStudio Core"
                className="h-28 w-auto rounded-3xl object-contain shadow-[0_0_45px_rgba(14,165,233,0.18)]"
              />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.48em] text-cyan-300/90">
                  BAGASTUDIO CORE
                </p>
                <h1 className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {adminT.adminPanel}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  {adminT.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                {adminT.language}
                <select
                  value={adminLanguage}
                  onChange={(e) => setAdminLanguage(e.target.value as AdminLanguage)}
                  className="rounded-2xl border border-cyan-400/30 bg-slate-950 px-4 py-3 text-sm font-black normal-case text-white outline-none"
                >
                  <option className="bg-slate-950 text-white" value="it">Italiano</option>
                  <option className="bg-slate-950 text-white" value="en">English</option>
                </select>
              </label>
              <a
                href="/"
                className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 shadow-[0_0_22px_rgba(14,165,233,0.10)] transition hover:border-cyan-300/50 hover:bg-cyan-400/20"
              >
                {adminT.backViewer}
              </a>
              <button
                type="button"
                onClick={downloadAdminBackup}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.30)] transition hover:bg-cyan-400"
              >
                {adminT.downloadBackup}
              </button>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 px-6 py-4 md:grid-cols-4">
            <div className="rounded-2xl bg-cyan-500 px-4 py-3 text-center text-sm font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.30)]">
              {adminT.importer}
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
              {adminT.productCatalog}
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
              {adminT.materials}
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-center text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
              {adminT.accessoriesPricing}
            </div>
          </nav>
        </header>

        {/* bagastudio-admin-sticky-toolbar-v1 */}
        <div className="sticky top-0 z-[80] mb-4 rounded-2xl border border-cyan-400/20 bg-slate-950/90 p-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.scrollTo({top:0,behavior:"smooth"})} className="rounded-xl border px-3 py-2 text-xs font-black">
              ↑ Torna su
            </button>
            <button type="button" onClick={() => document.querySelector('[data-bagastudio-action="detect-missing-parts"]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))} className="rounded-xl border px-3 py-2 text-xs font-black">
              Rileva mancanti
            </button>
            <button type="button" onClick={() => document.querySelector('[data-bagastudio-action="apply-placeholder-metadata"]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))} className="rounded-xl border px-3 py-2 text-xs font-black">
              Placeholder
            </button>
            <button type="button" onClick={() => document.querySelector('[data-bagastudio-action="generate-product-package"]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}))} className="rounded-xl border px-3 py-2 text-xs font-black">
              Genera Package
            </button>
          </div>
        </div>


        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Prodotti</p>
            <p className="mt-2 text-3xl font-black text-white">{adminDashboardStats.products}</p>
            <p className="mt-1 text-xs text-slate-400">salvati nella libreria locale</p>
          </div>
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Componenti</p>
            <p className="mt-2 text-3xl font-black text-white">{adminDashboardStats.components}</p>
            <p className="mt-1 text-xs text-slate-400">{adminDashboardStats.selectableParts} selezionabili · {adminDashboardStats.hiddenParts} nascosti</p>
          </div>
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Configurabilità</p>
            <p className="mt-2 text-3xl font-black text-white">{adminDashboardStats.ledReady + adminDashboardStats.insertReady}</p>
            <p className="mt-1 text-xs text-slate-400">LED {adminDashboardStats.ledReady} · Inserti {adminDashboardStats.insertReady} · Accessori {adminDashboardStats.accessoryReady}</p>
          </div>
          <div className="rounded-[26px] border border-cyan-400/15 bg-[#06111d]/80 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Stato package</p>
            <p className="mt-2 text-lg font-black text-white">{adminDashboardStats.hasJson ? "JSON pronto" : "Da generare"}</p>
            <p className="mt-1 text-xs text-slate-400">{adminDashboardStats.hasModel ? "Modello caricato" : "Nessun modello caricato"}</p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-[30px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                {adminT.controlCenter}
              </p>
              <h2 className="mt-2 text-2xl font-black">{adminT.adminTools}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {adminT.toolsDesc}
              </p>
            </div>

            <div className="grid gap-2">
              <button type="button" className="rounded-2xl bg-cyan-500 px-4 py-3 text-left text-sm font-black text-white shadow-[0_0_24px_rgba(14,165,233,0.25)]">
                {adminT.stepImport}
              </button>
              <button type="button" className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
                {adminT.stepMapping}
              </button>
              <button type="button" className="rounded-2xl border border-cyan-400/15 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
                {adminT.stepPackage}
              </button>
            </div>

            <div className="rounded-2xl border border-cyan-400/15 bg-black/30 p-4 shadow-inner shadow-cyan-950/20">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{adminT.autosave}</p>
              <p className="mt-2 text-sm text-slate-300">{backupStatus}</p>
            </div>
          </aside>

          <div className="space-y-6">

        <section className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_20px_70px_rgba(14,165,233,0.10)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {adminT.backupProject}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {adminT.backupDesc}
              </p>
              <p className="mt-2 text-xs text-cyan-300">
                {backupStatus}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadAdminBackup}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
              >
                {adminT.downloadBackup}
              </button>

              <button
                type="button"
                onClick={restoreLastAutosave}
                className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-100"
              >
                {adminT.restoreAutosave}
              </button>

              <label className="cursor-pointer rounded-xl border border-cyan-400/25 bg-white/5 px-4 py-2 text-sm font-bold text-white">
                {adminT.importBackup}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => importBackupFile(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-orange-400/15 bg-[#120b05]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Collision Engine V1.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controllo collisioni produzione</h2>
              <p className="mt-1 text-sm text-slate-400">
                Verifica ferramenta fuori pannello, fori fuori pezzo, distanze minime dai bordi, incompatibilità spessori e sovrapposizioni tecniche.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadCollisionEngineV1Report}
              className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
            >
              Esporta report collisioni
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{collisionEngineV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Verificati</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{collisionEngineV1Report.totals.checkedComponents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Saltati</p>
              <p className="mt-1 text-2xl font-black text-slate-200">{collisionEngineV1Report.totals.skippedComponents}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{collisionEngineV1Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{collisionEngineV1Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-blue-400/15 bg-blue-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200">Info</p>
              <p className="mt-1 text-2xl font-black text-blue-100">{collisionEngineV1Report.totals.info}</p>
            </div>
          </div>

          <div className="mt-5 max-h-80 space-y-3 overflow-auto pr-2">
            {collisionEngineV1Report.issues.length === 0 ? (
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm text-emerald-100">
                Nessuna collisione rilevata sui dati tecnici attualmente compilati.
              </div>
            ) : (
              collisionEngineV1Report.issues.slice(0, 30).map((issue) => (
                <div key={issue.id} className="rounded-2xl border border-orange-400/10 bg-black/25 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">{issue.displayName}</p>
                      <p className="mt-1 text-xs text-slate-400">{issue.code} · {issue.targetLabel}</p>
                    </div>
                    <span className={
                      issue.severity === "critical"
                        ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                        : issue.severity === "warning"
                          ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                          : "rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-blue-100"
                    }>
                      {issue.severity}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-200">{issue.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{issue.recommendation}</p>
                  {(issue.value !== undefined || issue.limit !== undefined) && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Valore: {issue.value ?? "-"} · Limite: {issue.limit ?? "-"}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {collisionEngineV1Report.issues.length > 30 && (
            <p className="mt-3 text-xs text-slate-500">
              Mostrate le prime 30 anomalie. Esporta il report JSON per vedere l'elenco completo.
            </p>
          )}
        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#0d071a]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Manufacturing Data Inspector V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Ispezione dati produttivi importati</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla quali dati tecnici sono realmente disponibili prima di attivare Hardware Analyzer V2: spessori, ferramenta, forature e constraint.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                manufacturingDataInspectorV1Report.readiness === "READY_FOR_HARDWARE_ANALYZER_V2"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {manufacturingDataInspectorV1Report.readiness === "READY_FOR_HARDWARE_ANALYZER_V2"
                  ? "Ready for Analyzer V2"
                  : "Dati mancanti"}
              </span>

              <button
                type="button"
                onClick={downloadManufacturingDataInspectorV1Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta inspector
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{manufacturingDataInspectorV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Con spessore</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{manufacturingDataInspectorV1Report.totals.componentsWithThickness}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Hardware links</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{manufacturingDataInspectorV1Report.totals.hardwareLinks}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Forature</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{manufacturingDataInspectorV1Report.totals.drillingLinks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Thickness Inspector</p>
              <p className="mt-1 text-xs text-slate-500">
                Senza spessore: {manufacturingDataInspectorV1Report.totals.componentsWithoutThickness}
              </p>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-2">
                {manufacturingDataInspectorV1Report.thicknessRows.slice(0, 24).map((row) => (
                  <div key={row.componentId} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-200">{row.displayName}</span>
                    <span className={row.status === "ready" ? "font-black text-emerald-100" : "font-black text-red-100"}>
                      {row.thickness ?? "n/d"} mm
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Production Readiness</p>
              <div className="mt-3 grid gap-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Thickness Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.componentsWithThickness > 0 ? "font-black text-emerald-100" : "font-black text-red-100"}>
                    {manufacturingDataInspectorV1Report.totals.componentsWithThickness > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Hardware Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.hardwareLinks > 0 ? "font-black text-emerald-100" : "font-black text-yellow-100"}>
                    {manufacturingDataInspectorV1Report.totals.hardwareLinks > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Drilling Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.drillingLinks > 0 ? "font-black text-emerald-100" : "font-black text-yellow-100"}>
                    {manufacturingDataInspectorV1Report.totals.drillingLinks > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="text-slate-400">Constraint Data</span>
                  <span className={manufacturingDataInspectorV1Report.totals.componentsWithConstraintRole > 0 ? "font-black text-emerald-100" : "font-black text-yellow-100"}>
                    {manufacturingDataInspectorV1Report.totals.componentsWithConstraintRole > 0 ? "OK" : "MISSING"}
                  </span>
                </div>
              </div>

              {manufacturingDataInspectorV1Report.missingData.length > 0 && (
                <div className="mt-4 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-yellow-100">Dati mancanti</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                    {manufacturingDataInspectorV1Report.missingData.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Hardware Inspector</p>
              <p className="mt-1 text-xs text-slate-500">Componenti con hardware: {manufacturingDataInspectorV1Report.totals.componentsWithHardware}</p>
              <div className="mt-3 space-y-2">
                {manufacturingDataInspectorV1Report.hardwareSummary.length === 0 ? (
                  <p className="text-xs text-slate-500">Nessuna ferramenta rilevata.</p>
                ) : manufacturingDataInspectorV1Report.hardwareSummary.slice(0, 8).map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-black text-orange-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Drilling Inspector</p>
              <p className="mt-1 text-xs text-slate-500">Componenti con forature: {manufacturingDataInspectorV1Report.totals.componentsWithDrillings}</p>
              <div className="mt-3 space-y-2">
                {manufacturingDataInspectorV1Report.drillingSummary.length === 0 ? (
                  <p className="text-xs text-slate-500">Nessuna foratura rilevata.</p>
                ) : manufacturingDataInspectorV1Report.drillingSummary.slice(0, 8).map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-black text-cyan-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-black text-white">Constraint Inspector</p>
              <p className="mt-1 text-xs text-slate-500">Componenti con ruolo: {manufacturingDataInspectorV1Report.totals.componentsWithConstraintRole}</p>
              <div className="mt-3 space-y-2">
                {Object.entries(manufacturingDataInspectorV1Report.constraintRoles).length === 0 ? (
                  <p className="text-xs text-slate-500">Nessun constraint rilevato.</p>
                ) : Object.entries(manufacturingDataInspectorV1Report.constraintRoles).slice(0, 8).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                    <span className="text-slate-300">{role}</span>
                    <span className="font-black text-violet-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06121a]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Manufacturing Override Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Override spessori pannelli</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Applica un nuovo spessore tecnico mantenendo bloccate le dimensioni esterne. Questo step prepara il ricalcolo di quote interne, forature, ferramenta e CSV senza deformare il modulo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Nuovo spessore mm</span>
                <input
                  value={manufacturingOverrideThickness}
                  onChange={(event) => setManufacturingOverrideThickness(event.target.value)}
                  className="w-36 rounded-2xl border border-cyan-400/25 bg-black/30 px-4 py-3 text-sm font-black text-white outline-none focus:border-cyan-300"
                  placeholder="17.8"
                />
              </label>

              <button
                type="button"
                onClick={applyManufacturingOverrideThicknessV1}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              >
                Applica override
              </button>

              <button
                type="button"
                onClick={downloadManufacturingOverrideV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta report
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{manufacturingOverrideV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Editabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{manufacturingOverrideV1Report.totals.editableComponents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Da cambiare</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{manufacturingOverrideV1Report.totals.changedComponents}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Esterno bloccato</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{manufacturingOverrideV1Report.totals.lockedExternalDimensions}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Saltati</p>
              <p className="mt-1 text-2xl font-black text-slate-200">{manufacturingOverrideV1Report.totals.skippedComponents}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 space-y-3 overflow-auto pr-2">
            {manufacturingOverrideV1Report.items.slice(0, 20).map((item) => (
              <div key={item.componentId} className="rounded-2xl border border-cyan-400/10 bg-black/25 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Originale: {item.originalThickness ?? "n/d"} mm · Nuovo: {item.targetThickness ?? "n/d"} mm · Delta: {item.deltaThickness ?? "n/d"}
                    </p>
                  </div>
                  <span className={
                    item.status === "changed"
                      ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                      : item.status === "skipped"
                        ? "rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-200"
                        : "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                  }>
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-emerald-400/15 bg-[#061a14]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">CSV Regeneration Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rigenerazione CSV produzione</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Genera una prima versione CSV aggiornata dopo l'override spessore. Le dimensioni esterne restano bloccate; le righe non collegate vengono mantenute e segnalate come saltate.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadRegeneratedCsvV1}
                disabled={csvRegenerationV1Report.totals.csvRows === 0}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Scarica CSV rigenerato
              </button>

              <button
                type="button"
                onClick={downloadCsvRegenerationV1Report}
                disabled={csvRegenerationV1Report.totals.csvRows === 0}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta report
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Righe CSV</p>
              <p className="mt-1 text-2xl font-black text-white">{csvRegenerationV1Report.totals.csvRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Collegate</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{csvRegenerationV1Report.totals.linkedRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Aggiornate</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{csvRegenerationV1Report.totals.updatedRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Invariate</p>
              <p className="mt-1 text-2xl font-black text-slate-200">{csvRegenerationV1Report.totals.unchangedRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Saltate</p>
              <p className="mt-1 text-2xl font-black text-red-100">{csvRegenerationV1Report.totals.skippedRows}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#071611] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Pezzo</th>
                  <th className="px-3 py-3">Materiale</th>
                  <th className="px-3 py-3">Spessore</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {csvRegenerationV1Report.rows.slice(0, 30).map((row, index) => (
                  <tr key={`${index}-${row.name}`} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{row.name}</td>
                    <td className="px-3 py-2">{row.material || "-"}</td>
                    <td className="px-3 py-2">{row.originalThickness ?? "n/d"} → {row.regeneratedThickness ?? "n/d"}</td>
                    <td className="px-3 py-2">
                      <span className={
                        row.status === "updated"
                          ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                          : row.status === "skipped"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                      }>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06141a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">CSV Regeneration Guard V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controllo finale rigenerazione CSV</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica che le righe CSV rigenerate siano coerenti con Production Readiness Gate e Parametric Edit prima dell'export produttivo definitivo.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                csvRegenerationGuardV1Report.readiness === "CSV_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : csvRegenerationGuardV1Report.readiness === "CSV_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {csvRegenerationGuardV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadCsvRegenerationGuardV1Report}
                disabled={csvRegenerationGuardV1Report.totals.rows === 0}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta guard
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Righe</p>
              <p className="mt-1 text-2xl font-black text-white">{csvRegenerationGuardV1Report.totals.rows}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{csvRegenerationGuardV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{csvRegenerationGuardV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{csvRegenerationGuardV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Ingombri bloccati</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{csvRegenerationGuardV1Report.totals.externalDimensionsLocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#07161a] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Riga</th>
                  <th className="px-3 py-3">Pezzo</th>
                  <th className="px-3 py-3">Spessore</th>
                  <th className="px-3 py-3">Gate</th>
                  <th className="px-3 py-3">Nota</th>
                </tr>
              </thead>
              <tbody>
                {csvRegenerationGuardV1Report.items.slice(0, 30).map((item) => (
                  <tr key={`${item.rowIndex}-${item.name}`} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 text-slate-500">{item.rowIndex}</td>
                    <td className="px-3 py-2 font-semibold text-white">{item.name}</td>
                    <td className="px-3 py-2">{item.originalThickness ?? "n/d"} → {item.regeneratedThickness ?? "n/d"}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#1a0617]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Factory Export Package V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Pacchetto export factory</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida Matrix, Production Readiness, Parametric Edit, CSV rigenerato e Guard in un unico pacchetto JSON diagnostico per il flusso Factory.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryExportPackageV1Report.readiness === "FACTORY_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryExportPackageV1Report.readiness === "FACTORY_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryExportPackageV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadFactoryExportPackageV1Report}
                disabled={factoryExportPackageV1Report.summary.csvRows === 0}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta factory package
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryExportPackageV1Report.sources.componentCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Righe CSV</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryExportPackageV1Report.summary.csvRows}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Aggiornate</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{factoryExportPackageV1Report.summary.csvUpdatedRows}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review CSV</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryExportPackageV1Report.summary.csvReviewRows}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked CSV</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryExportPackageV1Report.summary.csvBlockedRows}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Spessore target</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{factoryExportPackageV1Report.sources.targetThickness ?? "n/d"}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Note export</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {factoryExportPackageV1Report.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>
        </section>



        <section className="rounded-[28px] border border-lime-400/15 bg-[#0f1a06]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-200">BOM Regeneration V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Distinta base rigenerata</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Raggruppa le righe del CSV rigenerato per materiale e spessore, preparando la futura distinta componenti/ferramenta del Factory Engine.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                bomRegenerationV1Report.readiness === "BOM_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : bomRegenerationV1Report.readiness === "BOM_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {bomRegenerationV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadBomRegenerationV1Report}
                disabled={bomRegenerationV1Report.totals.bomItems === 0}
                className="rounded-2xl border border-lime-400/25 bg-lime-400/10 px-5 py-3 text-sm font-black text-lime-100 transition hover:bg-lime-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta BOM V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Voci BOM</p>
              <p className="mt-1 text-2xl font-black text-white">{bomRegenerationV1Report.totals.bomItems}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{bomRegenerationV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{bomRegenerationV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{bomRegenerationV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{bomRegenerationV1Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#101a07] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Materiale</th>
                  <th className="px-3 py-3">Spessore</th>
                  <th className="px-3 py-3">Q.tà</th>
                  <th className="px-3 py-3">Componenti</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {bomRegenerationV1Report.items.slice(0, 30).map((item) => (
                  <tr key={item.key} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{item.material || "n/d"}</td>
                    <td className="px-3 py-2">{item.thickness ?? "n/d"}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2 text-slate-500">{item.componentNames.slice(0, 4).join(", ")}{item.componentNames.length > 4 ? "…" : ""}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06151a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Hardware Reposition Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Riposizionamento ferramenta parametrico</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il ricalcolo diagnostico di ferramenta e forature dopo cambio spessore, mantenendo riferimenti parametrici a bordo/asse e ingombro esterno bloccato.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                hardwareRepositionEngineV1Report.readiness === "REPOSITION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : hardwareRepositionEngineV1Report.readiness === "REPOSITION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {hardwareRepositionEngineV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadHardwareRepositionEngineV1Report}
                disabled={hardwareRepositionEngineV1Report.totals.components === 0}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta Reposition V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwareRepositionEngineV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Da riposizionare</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{hardwareRepositionEngineV1Report.totals.repositionRequired}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareRepositionEngineV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareRepositionEngineV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareRepositionEngineV1Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#071a1d] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Componente</th>
                  <th className="px-3 py-3">Delta</th>
                  <th className="px-3 py-3">CSV</th>
                  <th className="px-3 py-3">Constraint</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {hardwareRepositionEngineV1Report.items.slice(0, 30).map((item) => (
                  <tr key={item.componentId} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{item.displayName}</td>
                    <td className="px-3 py-2">{item.thicknessDelta ?? "n/d"}</td>
                    <td className="px-3 py-2">{item.linkedCsvRow ?? "n/d"}</td>
                    <td className="px-3 py-2">{item.constraintStatus ?? "n/d"}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "skipped"
                              ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-sky-400/15 bg-[#06111f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">CSV/CIX Regeneration Pipeline V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Pipeline rigenerazione CSV / CIX</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega CSV rigenerato, Guard, BOM e riposizionamento ferramenta per preparare la futura esportazione produttiva CSV/CIX senza modificare ancora i file macchina reali.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                csvCixRegenerationPipelineV1Report.readiness === "PIPELINE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : csvCixRegenerationPipelineV1Report.readiness === "PIPELINE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {csvCixRegenerationPipelineV1Report.readiness.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadCsvCixRegenerationPipelineV1Report}
                disabled={csvCixRegenerationPipelineV1Report.totals.components === 0}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Esporta Pipeline CSV/CIX V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{csvCixRegenerationPipelineV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Target CIX</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{csvCixRegenerationPipelineV1Report.totals.cixTargetsPlanned}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{csvCixRegenerationPipelineV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{csvCixRegenerationPipelineV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{csvCixRegenerationPipelineV1Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#071a2a] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Componente</th>
                  <th className="px-3 py-3">CSV</th>
                  <th className="px-3 py-3">BOM</th>
                  <th className="px-3 py-3">Hardware</th>
                  <th className="px-3 py-3">Target</th>
                  <th className="px-3 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {csvCixRegenerationPipelineV1Report.items.slice(0, 30).map((item) => (
                  <tr key={`${item.componentId}-${item.csvRow ?? item.displayName}`} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{item.displayName}</td>
                    <td className="px-3 py-2">{item.csvGuardStatus || item.csvStatus || "n/d"}</td>
                    <td className="px-3 py-2">{item.bomStatus || "n/d"}</td>
                    <td className="px-3 py-2">{item.hardwareRepositionStatus || "n/d"}</td>
                    <td className="px-3 py-2 text-slate-500">{item.outputTargets.join(" / ")}</td>
                    <td className="px-3 py-2">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "skipped"
                              ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#16071f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Factory Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Motore centrale produzione</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Raccoglie Production Gate, Parametric Edit, CSV Guard, BOM, Hardware Reposition e Pipeline CSV/CIX per produrre un unico stato Factory Ready / Review / Blocked.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryEngineV1Report.factoryStatus === "READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryEngineV1Report.factoryStatus === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryEngineV1Report.factoryStatus}
              </span>

              <button
                type="button"
                onClick={downloadFactoryEngineV1Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Factory Engine V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Score</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV1Report.factoryScore}/100</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV1Report.summary.components}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocchi</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryEngineV1Report.blockers.length}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryEngineV1Report.warnings.length}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Export</p>
              <p className="mt-1 text-sm font-black text-fuchsia-100">{factoryEngineV1Report.summary.exportReadiness.replace(/_/g, " ")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Blocchi critici</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(factoryEngineV1Report.blockers.length ? factoryEngineV1Report.blockers : ["Nessun blocco critico rilevato."]).map((item, index) => (
                  <li key={`factory-blocker-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-yellow-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-yellow-200">Revisioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(factoryEngineV1Report.warnings.length ? factoryEngineV1Report.warnings : ["Nessuna revisione obbligatoria."]).map((item, index) => (
                  <li key={`factory-warning-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Raccomandazioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {factoryEngineV1Report.recommendations.map((item, index) => (
                  <li key={`factory-recommendation-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061922]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Product Package Regeneration V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rigenerazione Product Package</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara una patch diagnostica del Product Package collegando Factory Engine, Parametric Edit, BOM, Hardware Reposition e Pipeline CSV/CIX. È il ponte verso Viewer Sync V1.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                productPackageRegenerationV1Report.status === "READY_TO_SYNC"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : productPackageRegenerationV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {productPackageRegenerationV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadProductPackageRegenerationV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Product Package V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{productPackageRegenerationV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Viewer Sync Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{productPackageRegenerationV1Report.totals.viewerSyncReady}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{productPackageRegenerationV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{productPackageRegenerationV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Next package</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">v{productPackageRegenerationV1Report.nextPackageVersion}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Componente</th>
                  <th className="px-4 py-3">Spessore</th>
                  <th className="px-4 py-3">Viewer</th>
                  <th className="px-4 py-3">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productPackageRegenerationV1Report.components.slice(0, 18).map((item) => (
                  <tr key={`product-package-regeneration-${item.componentId}`}>
                    <td className="px-4 py-3">
                      <p className="font-black text-white">{item.displayName}</p>
                      <p className="mt-1 text-slate-500">{item.note}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{item.targetThickness ?? "n/d"} mm</td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{item.viewerSyncReady ? "ready" : "review"}</td>
                    <td className="px-4 py-3">
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "skipped"
                              ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] border border-sky-400/15 bg-[#061525]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Viewer Sync V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Sincronizzazione Viewer</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara la sincronizzazione metadata-only dal Product Package rigenerato al Viewer, preservando geometria attuale, materiali, accessori, LED e configurazione cliente.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                viewerSyncV1Report.status === "SYNC_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : viewerSyncV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {viewerSyncV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadViewerSyncV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta Viewer Sync V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{viewerSyncV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{viewerSyncV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{viewerSyncV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{viewerSyncV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata only</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{viewerSyncV1Report.totals.metadataOnly}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Modalità</th>
                    <th className="px-4 py-3">Viewer</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {viewerSyncV1Report.components.slice(0, 18).map((item) => (
                    <tr key={`viewer-sync-v1-${item.componentId}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.geometryMode.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.viewerSyncReady ? "sync" : "review"}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : item.status === "skipped"
                                ? "rounded-full bg-slate-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200"
                                : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {viewerSyncV1Report.recommendations.map((item, index) => (
                  <li key={`viewer-sync-recommendation-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-violet-400/15 bg-[#130b24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Parametric Structure Editor V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Editor struttura parametrica</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il piano diagnostico per modificare struttura, spessori, divisori e riferimenti ferramenta mantenendo bloccato l'ingombro esterno e preservando il futuro workflow Viewer.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                parametricStructureEditorV1Report.status === "STRUCTURE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : parametricStructureEditorV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {parametricStructureEditorV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadParametricStructureEditorV1Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Structure Editor V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{parametricStructureEditorV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{parametricStructureEditorV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{parametricStructureEditorV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{parametricStructureEditorV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Rigenerazione</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{parametricStructureEditorV1Report.totals.requiresRegeneration}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{parametricStructureEditorV1Report.totals.metadataUpdates}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Azione</th>
                    <th className="px-4 py-3">Ingombro</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parametricStructureEditorV1Report.actions.slice(0, 18).map((item) => (
                    <tr key={`parametric-structure-editor-${item.componentId}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.actionType.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.keepsExternalDimensions ? "bloccato" : "review"}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Raccomandazioni</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {parametricStructureEditorV1Report.recommendations.map((item, index) => (
                  <li key={`parametric-structure-recommendation-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#18071f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Factory Engine V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Orchestratore factory avanzato</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida Factory Engine, Product Package Regeneration, Viewer Sync e Structure Editor in un unico stato operativo pronto per i prossimi step Viewer Sync V2 e rigenerazione reale Product Package.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryEngineV2Report.status === "FACTORY_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryEngineV2Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryEngineV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadFactoryEngineV2Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Factory Engine V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Score</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV2Report.factoryScore}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Fasi</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryEngineV2Report.totals.phases}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{factoryEngineV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryEngineV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryEngineV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Viewer Bridge</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{factoryEngineV2Report.viewerBridge.viewerSyncReady ? "OK" : "Review"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[280px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Fase</th>
                    <th className="px-4 py-3">Schema</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {factoryEngineV2Report.phases.map((item) => (
                    <tr key={`factory-engine-v2-${item.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.sourceSchema}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Viewer Bridge</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Product Package: {factoryEngineV2Report.viewerBridge.productPackageRegenerationReady ? "ready" : "review"}</p>
                  <p>Viewer Sync: {factoryEngineV2Report.viewerBridge.viewerSyncReady ? "ready" : "review"}</p>
                  <p>Ingombro esterno: {factoryEngineV2Report.viewerBridge.keepsExternalEnvelopeLocked ? "bloccato" : "review"}</p>
                  <p>Materiali/accessori/LED: {factoryEngineV2Report.viewerBridge.materialAccessoryLedWorkflowPreserved ? "preservati" : "review"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {factoryEngineV2Report.recommendations.map((item, index) => (
                    <li key={`factory-engine-v2-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061820]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Product Package V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rigenerazione pacchetto prodotto V2</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara la patch Product Package collegata a Factory Engine V2, mantenendo separati dati produttivi e configurazione cliente per preservare texture, accessori, LED e Kelvin nel Viewer.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                productPackageRegenerationV2Report.status === "PACKAGE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : productPackageRegenerationV2Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {productPackageRegenerationV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadProductPackageRegenerationV2Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Product Package V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Patch</p>
              <p className="mt-1 text-2xl font-black text-white">{productPackageRegenerationV2Report.totals.patches}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{productPackageRegenerationV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{productPackageRegenerationV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{productPackageRegenerationV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Geometria</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{productPackageRegenerationV2Report.totals.preserveGeometry}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{productPackageRegenerationV2Report.totals.metadataUpdates}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Struttura</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{productPackageRegenerationV2Report.totals.structureRegeneration}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Patch</th>
                    <th className="px-4 py-3">Viewer</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {productPackageRegenerationV2Report.patches.slice(0, 18).map((item) => (
                    <tr key={`product-package-v2-${item.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.patchType.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-slate-300">{item.viewerSyncHint}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Regole pacchetto</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Materiali: {productPackageRegenerationV2Report.packageRules.preserveMaterials ? "preservati" : "review"}</p>
                  <p>Accessori: {productPackageRegenerationV2Report.packageRules.preserveAccessories ? "preservati" : "review"}</p>
                  <p>LED/Kelvin: {productPackageRegenerationV2Report.packageRules.preserveLedConfiguration ? "preservati" : "review"}</p>
                  <p>Ingombro esterno: {productPackageRegenerationV2Report.packageRules.keepExternalEnvelopeLocked ? "bloccato" : "review"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {productPackageRegenerationV2Report.recommendations.map((item, index) => (
                    <li key={`product-package-v2-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#071421]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Viewer Sync V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Sincronizzazione Viewer V2</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il ponte tra Product Package V2 e Viewer, mantenendo separata la configurazione cliente dal layer produttivo per preservare texture, accessori, LED e Kelvin.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                viewerSyncV2Report.status === "VIEWER_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : viewerSyncV2Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {viewerSyncV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadViewerSyncV2Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta Viewer Sync V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{viewerSyncV2Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{viewerSyncV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{viewerSyncV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{viewerSyncV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Metadata</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{viewerSyncV2Report.totals.metadataOnly}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Geometry</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{viewerSyncV2Report.totals.geometryPatch}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Structure</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{viewerSyncV2Report.totals.structureRegeneration}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Sync</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {viewerSyncV2Report.items.slice(0, 18).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{item.syncMode.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.preservesCustomerConfiguration ? "preservata" : "review"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Regole Viewer</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Materiali: {viewerSyncV2Report.viewerRules.preserveExistingMaterials ? "preservati" : "review"}</p>
                  <p>Accessori: {viewerSyncV2Report.viewerRules.preserveExistingAccessories ? "preservati" : "review"}</p>
                  <p>LED/Kelvin: {viewerSyncV2Report.viewerRules.preserveExistingLedAndKelvin ? "preservati" : "review"}</p>
                  <p>Geometria: {viewerSyncV2Report.viewerRules.requireManualReviewBeforeGeometryRebuild ? "review manuale" : "automatica"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {viewerSyncV2Report.recommendations.map((item, index) => (
                    <li key={`viewer-sync-v2-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>


        <section className="rounded-[28px] border border-orange-400/15 bg-[#1b1207]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Factory Production Package V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Pacchetto produzione finale</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida Factory Engine V2, Product Package V2 e Viewer Sync V2 in un report unico per preparare produzione, Viewer e configurazione cliente senza perdita dati.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                factoryProductionPackageV1Report.status === "PRODUCTION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : factoryProductionPackageV1Report.status === "BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {factoryProductionPackageV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadFactoryProductionPackageV1Report}
                className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
              >
                Esporta Production Package
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{factoryProductionPackageV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{factoryProductionPackageV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{factoryProductionPackageV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{factoryProductionPackageV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Factory</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{factoryProductionPackageV1Report.totals.factoryIncluded}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Viewer</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{factoryProductionPackageV1Report.totals.viewerIncluded}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">CSV/CIX</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{factoryProductionPackageV1Report.totals.csvCixIncluded}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">BOM</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{factoryProductionPackageV1Report.totals.bomIncluded}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Componente</th>
                    <th className="px-4 py-3">Factory</th>
                    <th className="px-4 py-3">Viewer</th>
                    <th className="px-4 py-3">CSV/CIX</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {factoryProductionPackageV1Report.items.slice(0, 18).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-slate-500">{item.note}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.includeInFactoryPackage ? "incluso" : "bloccato"}</td>
                      <td className="px-4 py-3 text-slate-300">{item.includeInViewerPackage ? "incluso" : "review"}</td>
                      <td className="px-4 py-3 text-slate-300">{item.includeInCsvCixExport ? "incluso" : "review"}</td>
                      <td className="px-4 py-3">
                        <span className={
                          item.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : item.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Regole pacchetto</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Factory ready: {factoryProductionPackageV1Report.packageRules.requireFactoryReady ? "richiesto" : "non richiesto"}</p>
                  <p>Viewer sync: {factoryProductionPackageV1Report.packageRules.requireViewerSyncReady ? "richiesto" : "non richiesto"}</p>
                  <p>Config cliente: {factoryProductionPackageV1Report.packageRules.preserveCustomerMaterialsAccessoriesLed ? "preservata" : "review"}</p>
                  <p>Export CSV/CIX: {factoryProductionPackageV1Report.packageRules.includeCsvCixPayload ? "incluso" : "escluso"}</p>
                  <p>BOM: {factoryProductionPackageV1Report.packageRules.includeBomPayload ? "inclusa" : "esclusa"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {factoryProductionPackageV1Report.recommendations.map((item, index) => (
                    <li key={`factory-production-package-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06171b]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Intelligenza locale da piantina</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il controllo tecnico da piantina caricata: ingombri mobili, battiscopa, supporto pareti, passaggi, montabilità e schede tecniche.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV1Report.status === "ROOM_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV1Report.status === "ROOM_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Layout Intelligence
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Controlli</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV1Report.totals.checks}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pass</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV1Report.totals.pass}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Mobili collegati</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{layoutRoomIntelligenceV1Report.totals.furnitureItemsLinked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV1Report.checks.map((check) => (
                    <tr key={check.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{check.label}</p>
                        <p className="mt-1 text-slate-500">{check.note}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{check.category.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          check.status === "pass"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : check.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {check.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Dati richiesti</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Input pianta: {layoutRoomIntelligenceV1Report.assumptions.planInputMode.replace(/_/g, " ")}</p>
                  <p>Battiscopa: {layoutRoomIntelligenceV1Report.assumptions.baseboardDataRequired ? "obbligatorio" : "non richiesto"}</p>
                  <p>Tipo parete: {layoutRoomIntelligenceV1Report.assumptions.wallMaterialDataRequired ? "obbligatorio" : "non richiesto"}</p>
                  <p>Validazione ingombri: {layoutRoomIntelligenceV1Report.assumptions.furnitureFootprintValidationRequired ? "richiesta" : "non richiesta"}</p>
                  <p>Schede tecniche: {layoutRoomIntelligenceV1Report.assumptions.technicalSheetGenerationReady ? "predisposte" : "bloccate"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV1Report.recommendations.map((item, index) => (
                    <li key={`layout-room-intelligence-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-violet-400/15 bg-[#090f24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Layout / Room Intelligence V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Motore stanza, pareti e vincoli tecnici</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega piantina, muri, aperture, ingombri mobili, battiscopa, supporti parete, punti tecnici e Smart Technical Validator.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV2Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV2Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV2Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV2Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Layout Intelligence V2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Zone V2</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV2Report.totals.zones}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV2Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV2Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV2Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Mobili</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{layoutRoomIntelligenceV2Report.totals.linkedFurnitureItems}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Critici tecnici</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{layoutRoomIntelligenceV2Report.totals.criticalTechnicalIssues}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Zona / controllo</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV2Report.zones.map((zone) => (
                    <tr key={zone.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{zone.label}</p>
                        <p className="mt-1 text-slate-500">{zone.note}</p>
                        <p className="mt-1 text-violet-200">Output: {zone.linkedOutput}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{zone.type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          zone.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : zone.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {zone.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Regole V2 attive</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Guscio stanza chiuso: {layoutRoomIntelligenceV2Report.validationRules.requireClosedRoomShell ? "richiesto" : "non richiesto"}</p>
                  <p>Scala reale approvata: {layoutRoomIntelligenceV2Report.validationRules.requireScaledReference ? "richiesta" : "non richiesta"}</p>
                  <p>Aperture prima dei mobili: {layoutRoomIntelligenceV2Report.validationRules.requireOpeningsBeforeFurnitureApproval ? "sì" : "no"}</p>
                  <p>Gate Smart Validator: {layoutRoomIntelligenceV2Report.validationRules.requireSmartTechnicalValidatorGate ? "attivo" : "non attivo"}</p>
                  <p>Blocco export su critici: {layoutRoomIntelligenceV2Report.validationRules.blockTechnicalExportOnCriticalIssues ? "attivo" : "non attivo"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Prossime azioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV2Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#12071f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V2.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Checklist automatica, rischi stanza ed export gate</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Raffina il V2 trasformando zone e vincoli in priorità operative, preflight prospetti parete e blocco export tecnico.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV21Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV21Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV21Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV21Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Layout Intelligence V2.1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Checklist</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV21Report.totals.checklistItems}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Azioni P1</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV21Report.totals.p1Actions}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Azioni P2</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV21Report.totals.p2Actions}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Azioni P3</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV21Report.totals.p3Actions}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Rischi alti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV21Report.totals.highRisks}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Rischi medi</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV21Report.totals.mediumRisks}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Preview cliente</p>
              <p className="mt-1 text-sm font-black text-fuchsia-100">{layoutRoomIntelligenceV21Report.exportGate.customerPreviewReady ? "READY" : "BLOCCATA"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Priorità</th>
                    <th className="px-4 py-3">Checklist operativa</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV21Report.checklist.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-black text-white">{item.priority}</td>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-slate-500">{item.action}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.readiness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Preflight prospetti parete</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Prospetti generabili: {layoutRoomIntelligenceV21Report.wallElevationPreflight.canGenerateWallElevations ? "sì" : "no"}</p>
                  <p>Serve scala/guscio stanza: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsScaledRoomShell ? "sì" : "no"}</p>
                  <p>Serve approvazione aperture: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsOpeningsApproval ? "sì" : "no"}</p>
                  <p>Serve approvazione punti tecnici: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsTechnicalPointsApproval ? "sì" : "no"}</p>
                  <p>Serve Smart Validator pulito: {layoutRoomIntelligenceV21Report.wallElevationPreflight.needsSmartValidatorClearance ? "sì" : "no"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Export gate</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>PDF tecnico: {layoutRoomIntelligenceV21Report.exportGate.pdfReady ? "pronto" : "bloccato"}</p>
                  <p>DXF/CAD: {layoutRoomIntelligenceV21Report.exportGate.dxfCadReady ? "pronto" : "bloccato"}</p>
                  <p className="text-slate-400">{layoutRoomIntelligenceV21Report.exportGate.reason}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Matrice rischi</p>
                <ul className="mt-3 max-h-[150px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV21Report.risks.map((risk) => (
                    <li key={risk.id}>• <span className="font-black text-white">{risk.level.toUpperCase()}</span> — {risk.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-purple-400/15 bg-[#10061d]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200">Layout / Room Intelligence V2.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Prospetti parete tecnici e layer export</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida il V2.1 creando una struttura per prospetti parete, layer PDF/DXF/CAD, gate tecnici e legenda operativa.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV22Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV22Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV22Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV22Report}
                className="rounded-2xl border border-purple-400/25 bg-purple-400/10 px-5 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-400/20"
              >
                Esporta Layout Intelligence V2.2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Prospetti</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV22Report.totals.wallElevations}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV22Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV22Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV22Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-purple-400/15 bg-purple-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-purple-200">Priorità critiche</p>
              <p className="mt-1 text-2xl font-black text-purple-100">{layoutRoomIntelligenceV22Report.totals.criticalPriorities}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Gate bloccanti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV22Report.totals.exportBlockingGates}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[330px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Prospetto / layer</th>
                    <th className="px-4 py-3">Priorità</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV22Report.wallElevations.map((wall) => (
                    <tr key={wall.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{wall.title}</p>
                        <p className="mt-1 text-slate-500">{wall.note}</p>
                        <p className="mt-1 text-purple-200">Layer: {wall.requiredLayers.join(", ")}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-white">{wall.priority.toUpperCase()}</td>
                      <td className="px-4 py-3 text-slate-300">{wall.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200">Gate scheda parete</p>
                <ul className="mt-3 max-h-[165px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV22Report.wallSheetGates.map((gate) => (
                    <li key={gate.id}>• <span className="font-black text-white">{gate.passed ? "OK" : gate.blocking ? "BLOCK" : "REVIEW"}</span> — {gate.label}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200">Legenda layer export</p>
                <ul className="mt-3 max-h-[165px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV22Report.layerLegend.map((layer) => (
                    <li key={layer.id}>• <span className="font-black text-white">{layer.label}</span> — {layer.output}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200">Prossime azioni V2.2</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV22Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-2-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-amber-400/15 bg-[#211407]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V2.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Regole tecniche parete parametriche</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Consolida quote parete, lavandino appoggio/incasso, punti elettrici/idraulici, battiscopa, fissaggi e routing layer PDF/DXF/CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV23Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV23Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV23Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV23Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Layout Intelligence V2.3
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV23Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV23Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warnings</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV23Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV23Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Export bloccati</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{layoutRoomIntelligenceV23Report.totals.exportBlockedRules}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[330px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Regola tecnica</th>
                    <th className="px-4 py-3">Layer</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV23Report.wallRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-slate-500">{rule.action}</p>
                        <p className="mt-1 text-amber-200">Dati: {rule.requiredData.join(", ")}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{rule.exportLayer}</td>
                      <td className="px-4 py-3">
                        <span className={
                          rule.passed
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : rule.severity === "critical"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {rule.passed ? "passed" : rule.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Quote lavandino</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV23Report.sinkHeightRules.map((rule) => (
                    <li key={rule.id}>• <span className="font-black text-white">{rule.sinkType}</span>: piano a {rule.topHeightCm} cm — {rule.note}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Routing layer export</p>
                <ul className="mt-3 max-h-[150px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV23Report.exportRouting.map((route) => (
                    <li key={route.id}>• <span className="font-black text-white">{route.layer}</span> → {route.target}: {route.content}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V2.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV23Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-3-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061c1f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V2.4</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Collisioni layout e passaggi minimi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla passaggi, aperture, compatibilità parete/mobile, punti tecnici, battiscopa e area montatore prima dell'export tecnico.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV24Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV24Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV24Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV24Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Layout Intelligence V2.4
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Check</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV24Report.totals.checks}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV24Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV24Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV24Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Blocchi export</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{layoutRoomIntelligenceV24Report.totals.exportBlockingChecks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo layout</th>
                    <th className="px-4 py-3">Requisito</th>
                    <th className="px-4 py-3">Impatto export</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutRoomIntelligenceV24Report.collisionChecks.map((check) => (
                    <tr key={check.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{check.label}</p>
                        <p className="mt-1 text-slate-500">{check.detectedRisk}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{check.minimumRequirement}</td>
                      <td className="px-4 py-3 text-cyan-100">{check.exportImpact}</td>
                      <td className="px-4 py-3">
                        <span className={
                          check.passed
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : check.severity === "critical"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {check.passed ? "passed" : check.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Soglie operative V2.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Passaggio principale: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumMainPassageCm} cm</span></li>
                  <li>• Accesso tecnico: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumServiceAccessCm} cm</span></li>
                  <li>• Apertura cassetti: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumDrawerOpeningCm} cm</span></li>
                  <li>• Area montatore: <span className="font-black text-white">{layoutRoomIntelligenceV24Report.thresholds.minimumInstallerWorkingAreaCm} cm</span></li>
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Azioni layer export</p>
                <ul className="mt-3 max-h-[145px] space-y-2 overflow-auto text-sm text-slate-300">
                  {layoutRoomIntelligenceV24Report.exportLayerActions.map((action) => (
                    <li key={action.id}>• <span className="font-black text-white">{action.targetLayer}</span>: {action.action}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossime azioni V2.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV24Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-4-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#1b0b24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V2.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Interassi postazioni e specchi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Inserisce le regole minime per postazioni barber ed estetista: le poltrone e gli specchi collegati devono rispettare lo stesso interasse tecnico.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutRoomIntelligenceV25Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutRoomIntelligenceV25Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutRoomIntelligenceV25Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutRoomIntelligenceV25Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Layout Intelligence V2.5
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutRoomIntelligenceV25Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutRoomIntelligenceV25Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutRoomIntelligenceV25Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutRoomIntelligenceV25Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Blocchi export</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{layoutRoomIntelligenceV25Report.totals.exportBlockingChecks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Regole interasse</p>
              <div className="mt-3 grid gap-3">
                {layoutRoomIntelligenceV25Report.stationSpacingRules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-sm text-slate-400">{rule.appliesTo}</p>
                      </div>
                      <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-fuchsia-100">
                        {rule.stationType}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p>Poltrone/postazioni: <span className="font-black text-white">{rule.minimumCenterDistanceCm} cm</span></p>
                      <p>Specchi collegati: <span className="font-black text-white">{rule.mirrorCenterDistanceCm} cm</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Check automatici V2.5</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-300">
                  {layoutRoomIntelligenceV25Report.stationSpacingChecks.map((check) => (
                    <li key={check.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="font-black text-white">{check.label}</p>
                      <p className="mt-1 text-slate-400">{check.minimumRequirement}</p>
                      <p className="mt-1 text-slate-400">{check.mirrorRequirement}</p>
                      <p className="mt-2 text-xs text-fuchsia-100">{check.correctiveAction}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossime azioni V2.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutRoomIntelligenceV25Report.nextActions.map((item, index) => (
                    <li key={`layout-room-intelligence-v2-5-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-emerald-400/15 bg-[#061a13]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">Layout / Room Intelligence V2.6</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Dynamic Rule Registry</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il Rule Engine JSON-driven: le regole tecniche potranno essere aggiunte, esportate e gestite nel tempo senza inserirle solo come codice hardcoded.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRuleRegistryV26Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRuleRegistryV26Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRuleRegistryV26Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRuleRegistryV26Report}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20"
              >
                Esporta Rule Registry V2.6
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRuleRegistryV26Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Abilitate</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRuleRegistryV26Report.totals.enabled}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Admin editabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRuleRegistryV26Report.totals.adminEditable}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRuleRegistryV26Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocchi export</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRuleRegistryV26Report.totals.exportBlockingRules}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Rule set JSON-driven</p>
              <p className="mt-2 text-sm text-slate-400">{dynamicRuleRegistryV26Report.ruleSet.description}</p>
              <div className="mt-3 grid gap-3">
                {dynamicRuleRegistryV26Report.ruleSet.rules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{rule.message}</p>
                        <p className="mt-1 text-xs text-slate-500">{rule.id}</p>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">
                        {rule.source}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p>Target: <span className="font-black text-white">{rule.target}</span></p>
                      <p>Tipo: <span className="font-black text-white">{rule.type}</span></p>
                      <p>Layer: <span className="font-black text-white">{rule.exportLayer}</span></p>
                      <p>Admin: <span className="font-black text-white">{rule.editableFromAdmin ? "editabile" : "core locked"}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Valutazioni V2.6</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-300">
                  {dynamicRuleRegistryV26Report.evaluations.map((evaluation) => (
                    <li key={evaluation.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="font-black text-white">{evaluation.ruleId}</p>
                      <p className="mt-1 text-slate-400">Atteso: {evaluation.expected}</p>
                      <p className="mt-1 text-slate-400">Rilevato: {evaluation.detected}</p>
                      <p className="mt-2 text-xs text-emerald-100">{evaluation.action}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Prossime azioni V2.6</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleRegistryV26Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-registry-v2-6-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-amber-400/15 bg-[#1f1605]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V2.7</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rule Admin Bridge</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega il Dynamic Rule Registry al futuro Admin Rules Manager: import/export JSON, blocco regole core, validazione prima del salvataggio e profili cliente/settore.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRuleAdminBridgeV27Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRuleAdminBridgeV27Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRuleAdminBridgeV27Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRuleAdminBridgeV27Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Rule Admin Bridge V2.7
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Draft regole</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRuleAdminBridgeV27Report.totals.drafts}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRuleAdminBridgeV27Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRuleAdminBridgeV27Report.totals.needsReview}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Core locked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRuleAdminBridgeV27Report.totals.lockedCore}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Importabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRuleAdminBridgeV27Report.totals.importable}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Export</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{dynamicRuleAdminBridgeV27Report.totals.exportable}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Bozze regole Admin</p>
              <div className="mt-3 grid gap-3">
                {dynamicRuleAdminBridgeV27Report.drafts.map((draft) => (
                  <div key={draft.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{draft.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{draft.sourceRuleId}</p>
                      </div>
                      <span className={
                        draft.adminStatus === "ready"
                          ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                          : draft.adminStatus === "locked_core"
                            ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {draft.adminStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <p>Modulo: <span className="font-black text-white">{draft.module}</span></p>
                      <p>Tipo: <span className="font-black text-white">{draft.type}</span></p>
                      <p>Target: <span className="font-black text-white">{draft.target}</span></p>
                      <p>Valore cm: <span className="font-black text-white">{draft.numericValueCm ?? "n/d"}</span></p>
                    </div>
                    <p className="mt-3 text-xs text-amber-100">{draft.validationMessage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Contratto import/export</p>
                <p className="mt-2 text-sm text-slate-300">Schema accettato: <span className="font-black text-white">{dynamicRuleAdminBridgeV27Report.importExportContract.acceptedSchema}</span></p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Campi richiesti</p>
                <p className="mt-1 text-sm text-slate-300">{dynamicRuleAdminBridgeV27Report.importExportContract.requiredFields.join(", ")}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Operazioni bloccate</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {dynamicRuleAdminBridgeV27Report.importExportContract.blockedOperations.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V2.7</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleAdminBridgeV27Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-admin-bridge-v2-7-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#1b0620]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V2.8</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rule Pack System</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Organizza le regole tecniche in pacchetti attivabili per core, settore, cliente e progetto, così le nuove regole possono crescere senza modificare il codice principale.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRulePackV28Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRulePackV28Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRulePackV28Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRulePackV28Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Rule Pack V2.8
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pack</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRulePackV28Report.totals.packs}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Attivi</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRulePackV28Report.totals.active}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Bozze</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRulePackV28Report.totals.draft}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Locked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRulePackV28Report.totals.locked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Editabili</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRulePackV28Report.totals.editable}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Regole collegate</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{dynamicRulePackV28Report.totals.linkedRules}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Pacchetti regole</p>
              <div className="mt-3 grid gap-3">
                {dynamicRulePackV28Report.packs.map((pack) => (
                  <div key={pack.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{pack.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{pack.id} · {pack.profile}</p>
                      </div>
                      <span className={
                        pack.status === "active"
                          ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                          : pack.status === "locked"
                            ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {pack.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{pack.description}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                      <p>Categoria: <span className="font-black text-white">{pack.category}</span></p>
                      <p>Scope: <span className="font-black text-white">{pack.exportScope}</span></p>
                      <p>Regole: <span className="font-black text-white">{pack.ruleIds.length}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Ordine attivazione</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRulePackV28Report.activationOrder.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Policy conflitti</p>
                <p className="mt-2 text-sm text-slate-300">Priorità: <span className="font-black text-white">{dynamicRulePackV28Report.conflictPolicy.priority.join(" → ")}</span></p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Regole core locked sempre prevalenti</li>
                  <li>• Override ammesso solo su regole editabili</li>
                  <li>• Pack non valido blocca attivazione</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossime azioni V2.8</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRulePackV28Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-pack-v2-8-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-rose-400/15 bg-[#21070e]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-200">Layout / Room Intelligence V2.9</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Rule Conflict Resolver</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla conflitti tra Rule Pack, protegge le regole core bloccate e prepara rollback sicuro prima di attivare regole cliente/progetto.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                dynamicRuleConflictResolverV29Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : dynamicRuleConflictResolverV29Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {dynamicRuleConflictResolverV29Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadDynamicRuleConflictResolverV29Report}
                className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
              >
                Esporta Conflict Resolver V2.9
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Conflitti</p>
              <p className="mt-1 text-2xl font-black text-white">{dynamicRuleConflictResolverV29Report.totals.conflicts}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Bloccanti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{dynamicRuleConflictResolverV29Report.totals.blocking}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{dynamicRuleConflictResolverV29Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Info</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{dynamicRuleConflictResolverV29Report.totals.info}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pack sicuri</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{dynamicRuleConflictResolverV29Report.totals.safePacks}</p>
            </div>
            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-rose-200">Da rivedere</p>
              <p className="mt-1 text-2xl font-black text-rose-100">{dynamicRuleConflictResolverV29Report.totals.packsToReview}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Conflitti rilevati</p>
              <div className="mt-3 grid gap-3">
                {dynamicRuleConflictResolverV29Report.conflicts.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm text-emerald-100">
                    Nessun conflitto rilevato: i Rule Pack possono essere attivati secondo la priorità configurata.
                  </div>
                ) : dynamicRuleConflictResolverV29Report.conflicts.map((conflict) => (
                  <div key={conflict.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{conflict.conflictType.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-xs text-slate-500">{conflict.packId} · {conflict.ruleId}</p>
                      </div>
                      <span className={
                        conflict.severity === "error"
                          ? "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                          : conflict.severity === "warning"
                            ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-100"
                      }>
                        {conflict.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{conflict.detected}</p>
                    <p className="mt-2 text-sm text-slate-400">Risoluzione: <span className="text-slate-200">{conflict.resolution}</span></p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Decisione attivazione</p>
                <p className="mt-2 text-sm text-slate-300">
                  Attivazione pack: <span className="font-black text-white">{dynamicRuleConflictResolverV29Report.activationDecision.canActivateRulePacks ? "CONSENTITA" : "BLOCCATA"}</span>
                </p>
                <p className="mt-2 text-sm text-slate-300">Bloccanti: <span className="font-black text-white">{dynamicRuleConflictResolverV29Report.activationDecision.blockingConflicts}</span></p>
                <p className="mt-1 text-sm text-slate-300">Warning: <span className="font-black text-white">{dynamicRuleConflictResolverV29Report.activationDecision.warningConflicts}</span></p>
              </div>

              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Rollback sicuro</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleConflictResolverV29Report.rollbackPlan.map((item, index) => (
                    <li key={`dynamic-rule-conflict-v2-9-rollback-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Prossime azioni V2.9</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {dynamicRuleConflictResolverV29Report.nextActions.map((item, index) => (
                    <li key={`dynamic-rule-conflict-v2-9-next-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-emerald-400/15 bg-[#061b16]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">Layout / Room Intelligence V3.0</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Wall Intelligence Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prima fase basata sulla descrizione guidata del cliente. Foto e DWG/DXF restano predisposti come prove future per confermare o correggere il profilo parete.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceEngineV30Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceEngineV30Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceEngineV30Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceEngineV30Report}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20"
              >
                Esporta Wall Intelligence V3.0
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceEngineV30Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Sconosciute</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceEngineV30Report.totals.unknownWalls}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Elementi</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallIntelligenceEngineV30Report.totals.targets}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceEngineV30Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceEngineV30Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceEngineV30Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Profili parete da descrizione cliente</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceEngineV30Report.wallProfiles.map((wall) => (
                  <div key={wall.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{wall.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{wall.wallType} · fonte: {wall.inputSource.replace(/_/g, " ")} · confidenza: {wall.confidence}</p>
                      </div>
                      <span className={
                        wall.wallType === "unknown"
                          ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                          : "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100"
                      }>
                        {wall.acceptedForPreliminaryLayout ? "Layout preliminare" : "Bloccata"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{wall.customerDescription}</p>
                    <p className="mt-2 text-xs text-slate-500">Spessore: {wall.thicknessMm ? `${wall.thicknessMm} mm` : "da definire"} · Carico stimato: {wall.estimatedMaxLoadKg ? `${wall.estimatedMaxLoadKg} kg` : "da verificare"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Strategia V3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceEngineV30Report.strategy.mergePolicy.map((item, index) => (
                    <li key={`wall-intelligence-v3-merge-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Fissaggi e ferramenta suggerita</p>
                <div className="mt-3 grid gap-3">
                  {wallIntelligenceEngineV30Report.fixingTargets.map((target) => (
                    <div key={target.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">{target.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{target.category.replace(/_/g, " ")} · {target.estimatedWeightKg} kg · fissaggi min. {target.minimumRecommendedFixingPoints}</p>
                        </div>
                        <span className={
                          target.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : target.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {target.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{target.warning}</p>
                      <p className="mt-2 text-xs text-slate-500">Hardware: {target.suggestedHardware.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200">Prossime azioni V3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceEngineV30Report.nextActions.map((item, index) => (
                    <li key={`wall-intelligence-v3-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>




        <section className="rounded-[28px] border border-lime-400/15 bg-[#101b06]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-200">Layout / Room Intelligence V3.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Guided Wall Description</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Struttura la descrizione cliente della parete in una scheda guidata: tipo parete, spessore, carico, ostacoli e prove future foto/DWG.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceGuidedDescriptionV31Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceGuidedDescriptionV31Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceGuidedDescriptionV31Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceGuidedDescriptionV31Report}
                className="rounded-2xl border border-lime-400/25 bg-lime-400/10 px-5 py-3 text-sm font-black text-lime-100 transition hover:bg-lime-400/20"
              >
                Esporta Wall Description V3.1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Schede</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceGuidedDescriptionV31Report.totals.cards}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Complete</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceGuidedDescriptionV31Report.totals.completed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Incomplete</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceGuidedDescriptionV31Report.totals.incomplete}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Domande</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallIntelligenceGuidedDescriptionV31Report.totals.questions}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Mancanti</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceGuidedDescriptionV31Report.totals.missingRequired}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceGuidedDescriptionV31Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-200">Schede parete cliente</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceGuidedDescriptionV31Report.clientWallCards.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{card.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{card.wallType} · confidenza {card.confidence} · completamento {card.completionPercent}%</p>
                      </div>
                      <span className={
                        card.validatorDecision === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : card.validatorDecision === "blocked"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {card.validatorDecision}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{card.note}</p>
                    {card.missingRequiredFields.length > 0 && (
                      <p className="mt-2 text-xs text-yellow-100">Campi richiesti mancanti: {card.missingRequiredFields.join(" · ")}</p>
                    )}
                    <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                      {card.guidedQuestions.map((question) => (
                        <div key={question.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="font-black text-white">{question.label}</p>
                          <p className="mt-1">Default: {question.defaultValue}</p>
                          <p className="mt-1 text-lime-100">{question.status.replace(/_/g, " ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-lime-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-200">Principio V3.1</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Descrizione cliente come fonte primaria iniziale</li>
                  <li>• Foto e DWG/DXF come prove successive</li>
                  <li>• Parete sconosciuta ammessa solo per layout preliminare</li>
                  <li>• Fissaggi critici sempre soggetti a verifica installatore</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-lime-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-lime-200">Prossime azioni V3.1</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceGuidedDescriptionV31Report.nextActions.map((item, index) => (
                    <li key={`wall-guided-description-v3-1-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-amber-400/15 bg-[#1d1405]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V3.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Wall Confidence Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Calcola quanto è affidabile la descrizione cliente della parete e decide se servono verifiche prima di fissaggi, mensole, specchi o pensili.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceConfidenceEngineV32Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceConfidenceEngineV32Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceConfidenceEngineV32Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceConfidenceEngineV32Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Confidence V3.2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Schede</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceConfidenceEngineV32Report.totals.cards}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Alta</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceConfidenceEngineV32Report.totals.high}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Media</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceConfidenceEngineV32Report.totals.medium}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Bassa</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceConfidenceEngineV32Report.totals.low}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Verifiche</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceConfidenceEngineV32Report.totals.needsVerification}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceConfidenceEngineV32Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceConfidenceEngineV32Report.totals.errors}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Confidenza pareti</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceConfidenceEngineV32Report.confidenceCards.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{card.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{card.wallType} · score {card.confidenceScore}% · confidenza {card.confidenceLevel}</p>
                      </div>
                      <span className={
                        card.confidenceLevel === "alta"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : card.confidenceLevel === "media"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {card.confidenceLevel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{card.verificationReason}</p>
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                      <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3 text-emerald-100">
                        <p className="font-black uppercase tracking-[0.12em]">Segnali positivi</p>
                        <p className="mt-1 text-slate-300">{card.positiveSignals.length ? card.positiveSignals.join(" · ") : "Nessun segnale forte"}</p>
                      </div>
                      <div className="rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-yellow-100">
                        <p className="font-black uppercase tracking-[0.12em]">Mancanze</p>
                        <p className="mt-1 text-slate-300">{card.missingSignals.length ? card.missingSignals.join(" · ") : "Nessuna mancanza critica"}</p>
                      </div>
                    </div>
                    {card.alerts.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {card.alerts.map((alert) => (
                          <div key={alert.id} className={
                            alert.severity === "error"
                              ? "rounded-xl border border-red-400/10 bg-red-400/5 p-3 text-xs text-red-100"
                              : alert.severity === "warning"
                                ? "rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-xs text-yellow-100"
                                : "rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3 text-xs text-cyan-100"
                          }>
                            <p className="font-black">{alert.label}</p>
                            <p className="mt-1 text-slate-300">{alert.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Soglie V3.2</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• 0–40%: confidenza bassa</li>
                  <li>• 41–70%: confidenza media</li>
                  <li>• 71–100%: confidenza alta</li>
                  <li>• Foto/DWG/note aumentano la confidenza senza sostituire la descrizione cliente</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V3.2</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceConfidenceEngineV32Report.nextActions.map((item, index) => (
                    <li key={`wall-confidence-v3-2-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-rose-400/15 bg-[#210914]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-200">Layout / Room Intelligence V3.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Wall Load Analyzer</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Analizza carichi, peso stimato, punti fissaggio e capacità parete prima di confermare specchi, mensole e pensili.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceLoadAnalyzerV33Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceLoadAnalyzerV33Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceLoadAnalyzerV33Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceLoadAnalyzerV33Report}
                className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
              >
                Esporta Load Analyzer V3.3
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Target</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceLoadAnalyzerV33Report.totals.targets}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Safe</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceLoadAnalyzerV33Report.totals.safe}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceLoadAnalyzerV33Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critical</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceLoadAnalyzerV33Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceLoadAnalyzerV33Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceLoadAnalyzerV33Report.totals.warnings}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Analisi carichi parete</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceLoadAnalyzerV33Report.loadTargets.slice(0, 9).map((target) => (
                  <div key={target.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{target.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {target.category} · peso {target.estimatedWeightKg} kg · proiezione {target.projectedLoadKg} kg · {target.fixingPoints} fissaggi
                        </p>
                      </div>
                      <span className={
                        target.risk === "safe"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : target.risk === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {target.risk}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                        <p className="font-black text-white">Carico/fissaggio</p>
                        <p className="mt-1">{target.loadPerFixingKg} kg</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                        <p className="font-black text-white">Capacità parete</p>
                        <p className="mt-1">{target.wallCapacityKg === null ? "sconosciuta" : `${target.wallCapacityKg} kg`}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                        <p className="font-black text-white">Confidenza</p>
                        <p className="mt-1">{target.confidenceScore}%</p>
                      </div>
                    </div>
                    {target.warnings.length > 0 && (
                      <div className="mt-3 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-xs text-yellow-100">
                        <p className="font-black uppercase tracking-[0.12em]">Warning</p>
                        <p className="mt-1 text-slate-300">{target.warnings.join(" · ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Principi V3.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• La descrizione cliente resta la fonte primaria iniziale</li>
                  <li>• Il confidence score influenza il rischio carico</li>
                  <li>• Carichi critici richiedono verifica installatore</li>
                  <li>• Il sistema non certifica la sicurezza strutturale, ma blocca errori evidenti</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-rose-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-200">Prossime azioni V3.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceLoadAnalyzerV33Report.nextActions.map((item, index) => (
                    <li key={`wall-load-analyzer-v3-3-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-orange-400/15 bg-[#211008]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Layout / Room Intelligence V3.4</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Fixing Recommendation Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Suggerisce ferramenta, strategia di fissaggio e verifica installatore incrociando parete, carico, punti fissaggio e confidence score.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceFixingRecommendationV34Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceFixingRecommendationV34Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceFixingRecommendationV34Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceFixingRecommendationV34Report}
                className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
              >
                Esporta Fixing V3.4
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Raccomandazioni</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceFixingRecommendationV34Report.totals.recommendations}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Safe</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceFixingRecommendationV34Report.totals.safe}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceFixingRecommendationV34Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critical</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceFixingRecommendationV34Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Installatore</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceFixingRecommendationV34Report.totals.installerRequired}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Cartongesso</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{wallIntelligenceFixingRecommendationV34Report.totals.drywallWarnings}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Suggerimenti fissaggio</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceFixingRecommendationV34Report.recommendations.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Parete {item.wallType} · {item.recommendedFixingPoints} fissaggi consigliati · {item.loadPerFixingKg} kg/fissaggio
                        </p>
                      </div>
                      <span className={
                        item.status === "safe"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "warning"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl border border-orange-400/10 bg-orange-400/5 p-3 text-xs text-orange-50">
                      <p className="font-black uppercase tracking-[0.12em]">Ferramenta suggerita</p>
                      <p className="mt-1 text-slate-300">{item.suggestedHardware.join(" · ")}</p>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">{item.fixingStrategy}</p>

                    {item.warnings.length > 0 && (
                      <div className="mt-3 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3 text-xs text-yellow-100">
                        <p className="font-black uppercase tracking-[0.12em]">Warning</p>
                        <p className="mt-1 text-slate-300">{item.warnings.join(" · ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Principi V3.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• La descrizione cliente resta la base iniziale</li>
                  <li>• Il tipo parete condiziona la ferramenta suggerita</li>
                  <li>• Cartongesso e pareti sconosciute richiedono verifica</li>
                  <li>• Il suggerimento è preliminare, non certificazione strutturale</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-orange-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Prossime azioni V3.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceFixingRecommendationV34Report.nextActions.map((item, index) => (
                    <li key={`fixing-recommendation-v3-4-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#17081f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V3.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Mirror & Shelf Validator</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Valida specchi, mensole e pensili usando interassi postazioni, parete, carichi, fissaggi e livello di confidenza.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallIntelligenceMirrorShelfValidatorV35Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallIntelligenceMirrorShelfValidatorV35Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallIntelligenceMirrorShelfValidatorV35Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallIntelligenceMirrorShelfValidatorV35Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Validator V3.5
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Elementi</p>
              <p className="mt-1 text-2xl font-black text-white">{wallIntelligenceMirrorShelfValidatorV35Report.totals.items}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Specchi</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.mirrorItems}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Mensole</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.shelfItems}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Check KO</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallIntelligenceMirrorShelfValidatorV35Report.totals.failedChecks}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Validazione elementi sospesi</p>
              <div className="mt-3 grid gap-3">
                {wallIntelligenceMirrorShelfValidatorV35Report.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.mountingClass} · parete {item.wallType} · {item.recommendedFixingPoints} fissaggi · confidence {item.confidenceScore}%
                        </p>
                      </div>
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                      {item.checks.slice(0, 4).map((check) => (
                        <div key={`${item.id}-${check.code}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-slate-300">
                          <p className="font-black text-white">{check.label}</p>
                          <p className={check.passed ? "mt-1 text-emerald-200" : check.severity === "error" ? "mt-1 text-red-200" : "mt-1 text-yellow-200"}>
                            {check.passed ? "OK" : "DA VERIFICARE"}
                          </p>
                          <p className="mt-1 text-slate-500">{check.message}</p>
                        </div>
                      ))}
                    </div>

                    {item.installationNotes.length > 0 && (
                      <div className="mt-3 rounded-xl border border-fuchsia-400/10 bg-fuchsia-400/5 p-3 text-xs text-fuchsia-100">
                        <p className="font-black uppercase tracking-[0.12em]">Note installazione</p>
                        <p className="mt-1 text-slate-300">{item.installationNotes.join(" · ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Regole V3.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Gli specchi seguono l’interasse della postazione collegata</li>
                  <li>• Barber: interasse minimo 150 cm</li>
                  <li>• Estetista: interasse minimo 120 cm</li>
                  <li>• Mensole e pensili richiedono controllo carico, profondità e parete</li>
                  <li>• Cartongesso/sconosciuto attivano verifica installatore</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossime azioni V3.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallIntelligenceMirrorShelfValidatorV35Report.nextActions.map((item, index) => (
                    <li key={`mirror-shelf-validator-v3-5-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061922]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V3.6</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Technical Wall Report</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Report tecnico parete per installatore: descrizione cliente, confidence, carichi, fissaggi, specchi, mensole, pensili e output PDF/DXF/CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallTechnicalReportV36Report.status === "LAYOUT_V2_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallTechnicalReportV36Report.status === "LAYOUT_V2_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallTechnicalReportV36Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallTechnicalReportV36Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Report V3.6
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sezioni</p>
              <p className="mt-1 text-2xl font-black text-white">{wallTechnicalReportV36Report.totals.sections}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallTechnicalReportV36Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallTechnicalReportV36Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallTechnicalReportV36Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Layer export</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallTechnicalReportV36Report.totals.exportLayers}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Checklist</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{wallTechnicalReportV36Report.totals.installerNotes}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Sezioni report parete</p>
              <div className="mt-3 grid gap-3">
                {wallTechnicalReportV36Report.sections.map((section) => (
                  <div key={section.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{section.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Layer {section.exportLayer.toUpperCase()} · {section.summary}</p>
                      </div>
                      <span className={
                        section.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : section.status === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {section.status}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {section.items.map((item, index) => (
                        <li key={`${section.id}-item-${index}`}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Checklist installatore</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalReportV36Report.installerChecklist.map((item, index) => (
                    <li key={`wall-report-v3-6-check-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Export target</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalReportV36Report.exportTargets.map((item, index) => (
                    <li key={`wall-report-v3-6-export-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossime azioni V3.6</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalReportV36Report.nextActions.map((item, index) => (
                    <li key={`wall-report-v3-6-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-red-400/15 bg-[#21070b]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-200">Layout / Room Intelligence V3.7</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Installation Risk Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Valuta rischio reale di installazione usando confidence parete, carichi, fissaggi, validator specchi/mensole/pensili e report tecnico parete.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                installationRiskEngineV37Report.installRiskLevel === "LOW"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : installationRiskEngineV37Report.installRiskLevel === "MEDIUM"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : installationRiskEngineV37Report.installRiskLevel === "HIGH"
                      ? "rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-100"
                      : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {installationRiskEngineV37Report.installRiskLevel} · {installationRiskEngineV37Report.status}
              </span>

              <button
                type="button"
                onClick={downloadInstallationRiskEngineV37Report}
                className="rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/20"
              >
                Esporta Risk V3.7
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Risk score</p>
              <p className="mt-1 text-2xl font-black text-white">{installationRiskEngineV37Report.riskScore}/100</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{installationRiskEngineV37Report.installBlocked ? "SI" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Installatore</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{installationRiskEngineV37Report.installerRequired ? "SI" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Sopralluogo</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{installationRiskEngineV37Report.siteSurveyRequired ? "SI" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Fattori</p>
              <p className="mt-1 text-2xl font-black text-white">{installationRiskEngineV37Report.totals.factors}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{installationRiskEngineV37Report.totals.critical}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Fattori di rischio installazione</p>
              <div className="mt-3 grid gap-3">
                {installationRiskEngineV37Report.factors.map((factor) => (
                  <div key={factor.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{factor.label}</p>
                        <p className="mt-1 text-xs text-slate-400">Impatto {factor.impact} · {factor.reason}</p>
                      </div>
                      <span className={
                        factor.level === "LOW"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : factor.level === "MEDIUM"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : factor.level === "HIGH"
                              ? "rounded-full bg-orange-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-100"
                              : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {factor.level}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Azione: {factor.recommendedAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Azioni consigliate</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installationRiskEngineV37Report.recommendedActions.map((item, index) => (
                    <li key={`risk-v3-7-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Checklist installazione</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installationRiskEngineV37Report.installerChecklist.map((item, index) => (
                    <li key={`risk-v3-7-check-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-red-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-200">Prossime azioni V3.7</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installationRiskEngineV37Report.nextActions.map((item, index) => (
                    <li key={`risk-v3-7-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-amber-400/15 bg-[#221407]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Layout / Room Intelligence V3.8</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Installer Checklist Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Trasforma il rischio installazione e il report tecnico parete in una checklist operativa per installatore, PDF, DXF e CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                installerChecklistEngineV38Report.checklistStatus === "INSTALL_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : installerChecklistEngineV38Report.checklistStatus === "INSTALL_REVIEW_REQUIRED"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {installerChecklistEngineV38Report.checklistStatus}
              </span>

              <button
                type="button"
                onClick={downloadInstallerChecklistEngineV38Report}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/20"
              >
                Esporta Checklist V3.8
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Voci</p>
              <p className="mt-1 text-2xl font-black text-white">{installerChecklistEngineV38Report.totals.items}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Bloccate</p>
              <p className="mt-1 text-2xl font-black text-red-100">{installerChecklistEngineV38Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{installerChecklistEngineV38Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pronte</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{installerChecklistEngineV38Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Obbligatorie</p>
              <p className="mt-1 text-2xl font-black text-white">{installerChecklistEngineV38Report.totals.mandatory}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Evidenze</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{installerChecklistEngineV38Report.totals.evidenceRequired}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Checklist operativa installatore</p>
              <div className="mt-3 grid gap-3">
                {installerChecklistEngineV38Report.items.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.phase} · {item.reason}</p>
                      </div>
                      <span className={
                        item.status === "ready"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {item.status} · {item.priority}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Output: {item.outputTarget} · Evidenza richiesta: {item.evidenceRequired ? "SI" : "NO"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Sezioni stampabili</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installerChecklistEngineV38Report.printableSections.map((item, index) => (
                    <li key={`installer-v3-8-print-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Export target</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installerChecklistEngineV38Report.exportTargets.map((item, index) => (
                    <li key={`installer-v3-8-export-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-200">Prossime azioni V3.8</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {installerChecklistEngineV38Report.nextActions.map((item, index) => (
                    <li key={`installer-v3-8-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#140722]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Layout / Room Intelligence V3.9</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Technical Approval Workflow</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Chiude il ciclo tecnico parete: rischio, checklist, report installatore e stato finale approvato/non approvato per installazione.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalApprovalWorkflowV39Report.approvalStatus === "APPROVED"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : technicalApprovalWorkflowV39Report.approvalStatus === "REVIEW_REQUIRED"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : technicalApprovalWorkflowV39Report.approvalStatus === "REJECTED"
                      ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                      : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-200"
              }>
                {technicalApprovalWorkflowV39Report.approvalStatus}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalApprovalWorkflowV39Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Approval V3.9
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Gate</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalApprovalWorkflowV39Report.totals.gates}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pass</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{technicalApprovalWorkflowV39Report.totals.pass}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalApprovalWorkflowV39Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalApprovalWorkflowV39Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Installazione</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{technicalApprovalWorkflowV39Report.installAllowed ? "OK" : "NO"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sopralluogo</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalApprovalWorkflowV39Report.siteSurveyRequired ? "SI" : "NO"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Gate approvazione tecnica</p>
              <div className="mt-3 grid gap-3">
                {technicalApprovalWorkflowV39Report.gates.map((gate) => (
                  <div key={gate.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{gate.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{gate.source} · {gate.reason}</p>
                      </div>
                      <span className={
                        gate.gate === "pass"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : gate.gate === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                      }>
                        {gate.gate}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Azione: {gate.requiredAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalApprovalWorkflowV39Report.requiredActions.map((item, index) => (
                    <li key={`approval-v3-9-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalApprovalWorkflowV39Report.workflowSteps.map((item, index) => (
                    <li key={`approval-v3-9-step-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Export target</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalApprovalWorkflowV39Report.exportTargets.map((item, index) => (
                    <li key={`approval-v3-9-export-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061922]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V4.0</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Photo / DWG Assisted Recognition Framework</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara il passaggio alle prove reali: descrizione cliente come fonte primaria, foto/DWG/DXF come conferma, correzione o review tecnica.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallAssistedRecognitionV40Report.recognitionStatus === "ASSISTED_RECOGNITION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallAssistedRecognitionV40Report.recognitionStatus === "ASSISTED_RECOGNITION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallAssistedRecognitionV40Report.recognitionStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallAssistedRecognitionV40Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Recognition V4.0
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Evidenze</p>
              <p className="mt-1 text-2xl font-black text-white">{wallAssistedRecognitionV40Report.totals.evidences}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Cliente</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallAssistedRecognitionV40Report.totals.customerInputs}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Foto</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{wallAssistedRecognitionV40Report.totals.photoSlots}</p>
            </div>
            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-200">DWG/DXF</p>
              <p className="mt-1 text-2xl font-black text-indigo-100">{wallAssistedRecognitionV40Report.totals.dwgDxfSlots}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Accepted</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallAssistedRecognitionV40Report.totals.accepted}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallAssistedRecognitionV40Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Conflitti</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallAssistedRecognitionV40Report.totals.conflicts}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Evidenze parete V4.0</p>
              <div className="mt-3 grid gap-3">
                {wallAssistedRecognitionV40Report.evidences.slice(0, 8).map((evidence) => (
                  <div key={evidence.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{evidence.label}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Fonte {evidence.source} · dichiarato {evidence.declaredWallType} · rilevato {evidence.detectedWallType || "non disponibile"}
                        </p>
                      </div>
                      <span className={
                        evidence.status === "accepted"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : evidence.status === "conflict"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : evidence.status === "review"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100"
                      }>
                        {evidence.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">Azione: {evidence.requiredAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Fusion confidence</p>
                <div className="mt-3 space-y-3 text-sm text-slate-300">
                  {wallAssistedRecognitionV40Report.confidenceFusion.map((item) => (
                    <div key={item.wallId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{item.wallLabel}</span>
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">{item.fusedScore}% · {item.fusedLevel}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Cliente {item.customerScore}% · Evidenze {item.evidenceScore}% · {item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallAssistedRecognitionV40Report.requiredActions.map((item, index) => (
                    <li key={`recognition-v4-0-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallAssistedRecognitionV40Report.nextActions.map((item, index) => (
                    <li key={`recognition-v4-0-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#071827]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Layout / Room Intelligence V4.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Photo Evidence Intake</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Registra le foto parete come evidenze guidate: la descrizione cliente resta primaria, mentre la foto conferma, integra o apre una review tecnica.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallPhotoEvidenceV41Report.intakeStatus === "PHOTO_INTAKE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallPhotoEvidenceV41Report.intakeStatus === "PHOTO_INTAKE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallPhotoEvidenceV41Report.intakeStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallPhotoEvidenceV41Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta Photo Evidence V4.1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Slot foto</p>
              <p className="mt-1 text-2xl font-black text-white">{wallPhotoEvidenceV41Report.totals.photoSlots}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallPhotoEvidenceV41Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallPhotoEvidenceV41Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallPhotoEvidenceV41Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Boost potenziale</p>
              <p className="mt-1 text-2xl font-black text-sky-100">+{wallPhotoEvidenceV41Report.totals.potentialConfidenceBoost}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Checklist foto parete</p>
              <div className="mt-3 grid gap-3">
                {wallPhotoEvidenceV41Report.items.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">Tipo atteso {item.expectedWallType} · qualità {item.quality} · impatto confidence +{item.confidenceImpact}</p>
                      </div>
                      <span className={
                        item.status === "PHOTO_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "PHOTO_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "PHOTO_REVIEW"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-sky-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-100"
                      }>
                        {item.status}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {item.requiredShots.slice(0, 3).map((shot, index) => (
                        <li key={`${item.id}-shot-${index}`}>• {shot}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Policy foto</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Descrizione cliente primaria: {wallPhotoEvidenceV41Report.photoPolicy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Foto può confermare: {wallPhotoEvidenceV41Report.photoPolicy.photoCanConfirm ? "sì" : "no"}</li>
                  <li>• Foto può aprire review: {wallPhotoEvidenceV41Report.photoPolicy.photoCanOpenReview ? "sì" : "no"}</li>
                  <li>• Foto non approva criticità da sola: {wallPhotoEvidenceV41Report.photoPolicy.photoCannotAutoApproveCriticalInstall ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallPhotoEvidenceV41Report.requiredActions.map((item, index) => (
                    <li key={`photo-v4-1-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallPhotoEvidenceV41Report.nextActions.map((item, index) => (
                    <li key={`photo-v4-1-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-indigo-400/15 bg-[#081426]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200">Layout / Room Intelligence V4.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">DWG / DXF Evidence Intake</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Registra elaborati tecnici DWG/DXF/PDF come evidenze di conferma: quote, aperture, layer tecnici e vincoli restano collegati alla descrizione cliente e alle foto V4.1.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallDwgDxfEvidenceV42Report.intakeStatus === "DWG_DXF_INTAKE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallDwgDxfEvidenceV42Report.intakeStatus === "DWG_DXF_INTAKE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallDwgDxfEvidenceV42Report.intakeStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallDwgDxfEvidenceV42Report}
                className="rounded-2xl border border-indigo-400/25 bg-indigo-400/10 px-5 py-3 text-sm font-black text-indigo-100 transition hover:bg-indigo-400/20"
              >
                Esporta DWG/DXF Evidence V4.2
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Slot elaborati</p>
              <p className="mt-1 text-2xl font-black text-white">{wallDwgDxfEvidenceV42Report.totals.drawingSlots}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallDwgDxfEvidenceV42Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallDwgDxfEvidenceV42Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallDwgDxfEvidenceV42Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-200">Boost potenziale</p>
              <p className="mt-1 text-2xl font-black text-indigo-100">+{wallDwgDxfEvidenceV42Report.totals.potentialConfidenceBoost}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Layer e controlli elaborati</p>
              <div className="mt-3 grid gap-3">
                {wallDwgDxfEvidenceV42Report.items.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">Fonte {item.source.toUpperCase()} · qualità {item.quality} · impatto confidence +{item.confidenceImpact}</p>
                      </div>
                      <span className={
                        item.status === "DWG_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "DWG_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : item.status === "DWG_REVIEW"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-indigo-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100"
                      }>
                        {item.status}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {item.technicalLayers.slice(0, 4).map((layer, index) => (
                        <li key={`${item.id}-layer-${index}`}>• {layer}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Policy DWG/DXF</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Cliente resta fonte primaria: {wallDwgDxfEvidenceV42Report.drawingPolicy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• DWG/DXF conferma geometrie: {wallDwgDxfEvidenceV42Report.drawingPolicy.dwgDxfCanConfirmGeometry ? "sì" : "no"}</li>
                  <li>• Può aprire review: {wallDwgDxfEvidenceV42Report.drawingPolicy.dwgDxfCanOpenReview ? "sì" : "no"}</li>
                  <li>• Cross-check con foto: {wallDwgDxfEvidenceV42Report.drawingPolicy.photoAndDwgCanBeCrossChecked ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallDwgDxfEvidenceV42Report.requiredActions.map((item, index) => (
                    <li key={`dwg-v4-2-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallDwgDxfEvidenceV42Report.nextActions.map((item, index) => (
                    <li key={`dwg-v4-2-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>




        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#14081f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V4.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Evidence Fusion Engine</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Fonde descrizione cliente, foto, DWG/DXF e approvazione tecnica. La descrizione cliente resta primaria; le evidenze possono aumentare confidence o aprire review/blocco.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallEvidenceFusionV43Report.fusionStatus === "FUSION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallEvidenceFusionV43Report.fusionStatus === "FUSION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallEvidenceFusionV43Report.fusionStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallEvidenceFusionV43Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Evidence Fusion V4.3
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{wallEvidenceFusionV43Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallEvidenceFusionV43Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallEvidenceFusionV43Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallEvidenceFusionV43Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Conflicts</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{wallEvidenceFusionV43Report.totals.conflicts}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Confidence media</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{wallEvidenceFusionV43Report.totals.averageFusedConfidence}%</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Fusione evidenze per parete</p>
              <div className="mt-3 grid gap-3">
                {wallEvidenceFusionV43Report.items.slice(0, 6).map((item) => (
                  <div key={item.wallId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Parete {item.declaredWallType} · confidence fusa {item.fusedConfidence}% · livello {item.confidenceLevel}
                        </p>
                      </div>
                      <span className={
                        item.status === "FUSION_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "FUSION_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {item.sourceScores.map((source) => (
                        <div key={`${item.wallId}-${source.source}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{source.source.replace(/_/g, " ")}</p>
                          <p className="mt-1 text-lg font-black text-white">{source.score}%</p>
                          <p className="text-[10px] text-slate-500">peso {Math.round(source.weight * 100)}%</p>
                        </div>
                      ))}
                    </div>

                    {item.conflicts.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-yellow-100">
                        {item.conflicts.map((conflict) => (
                          <li key={conflict.id}>• {conflict.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Policy V4.3</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Cliente fonte primaria: {wallEvidenceFusionV43Report.fusionPolicy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Evidenze aumentano confidence: {wallEvidenceFusionV43Report.fusionPolicy.evidenceCanIncreaseConfidence ? "sì" : "no"}</li>
                  <li>• Conflitti forzano review: {wallEvidenceFusionV43Report.fusionPolicy.conflictsForceReview ? "sì" : "no"}</li>
                  <li>• Bridge render/AR da foto: {wallEvidenceFusionV43Report.fusionPolicy.photoEnvironmentReadyForRenderArBridge ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallEvidenceFusionV43Report.requiredActions.map((item, index) => (
                    <li key={`fusion-v4-3-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallEvidenceFusionV43Report.nextActions.map((item, index) => (
                    <li key={`fusion-v4-3-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>



        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061825]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V4.4</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Automatic Wall Classification</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Classificazione assistita della parete basata su descrizione cliente, foto, DWG/DXF ed Evidence Fusion V4.3. Il cliente resta fonte primaria: i suggerimenti automatici aprono review, non sovrascrivono da soli.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                automaticWallClassificationV44Report.classificationStatus === "CLASSIFICATION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : automaticWallClassificationV44Report.classificationStatus === "CLASSIFICATION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {automaticWallClassificationV44Report.classificationStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadAutomaticWallClassificationV44Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Classification V4.4
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{automaticWallClassificationV44Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{automaticWallClassificationV44Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{automaticWallClassificationV44Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{automaticWallClassificationV44Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Suggerimenti diversi</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{automaticWallClassificationV44Report.totals.changedSuggestions}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Confidence media</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{automaticWallClassificationV44Report.totals.averageConfidence}%</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Classificazione assistita per parete</p>
              <div className="mt-3 grid gap-3">
                {automaticWallClassificationV44Report.items.slice(0, 6).map((item) => (
                  <div key={item.wallId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.wallLabel}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          dichiarata {item.declaredWallType} · classificata {item.classifiedWallType} · confidence {item.finalConfidence}%
                        </p>
                      </div>
                      <span className={
                        item.status === "CLASSIFICATION_READY"
                          ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                          : item.status === "CLASSIFICATION_BLOCKED"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                      }>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {item.candidates.slice(0, 4).map((candidate, index) => (
                        <div key={`${item.wallId}-${candidate.source}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{candidate.source.replace(/_/g, " ")}</p>
                          <p className="mt-1 text-sm font-black text-white">{candidate.wallType}</p>
                          <p className="text-[10px] text-slate-500">confidence {candidate.confidence}%</p>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {item.classificationNotes.map((note, index) => (
                        <li key={`${item.wallId}-classification-note-${index}`}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Policy V4.4</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Cliente fonte primaria: {automaticWallClassificationV44Report.policy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Classificazione assistita: {automaticWallClassificationV44Report.policy.automaticClassificationIsAssistive ? "sì" : "no"}</li>
                  <li>• Conflitti forzano review: {automaticWallClassificationV44Report.policy.conflictsForceReview ? "sì" : "no"}</li>
                  <li>• Foto/DWG suggeriscono senza sovrascrivere: {automaticWallClassificationV44Report.policy.photoDwgCanSuggestButNotOverwrite ? "sì" : "no"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Azioni richieste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {automaticWallClassificationV44Report.requiredActions.map((item, index) => (
                    <li key={`classification-v4-4-action-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {automaticWallClassificationV44Report.nextActions.map((item, index) => (
                    <li key={`classification-v4-4-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#120b22]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Layout / Room Intelligence V4.5</p>
              <h2 className="mt-1 text-xl font-semibold text-white">AI Technical Suggestions</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Suggerimenti tecnici assistiti basati su classificazione parete, evidenze foto/DWG, fissaggi, checklist installatore e approvazione tecnica. Il motore suggerisce e blocca i casi critici, ma non approva automaticamente.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                aiTechnicalSuggestionsV45Report.suggestionStatus === "SUGGESTIONS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : aiTechnicalSuggestionsV45Report.suggestionStatus === "SUGGESTIONS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {aiTechnicalSuggestionsV45Report.suggestionStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadAiTechnicalSuggestionsV45Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Suggestions V4.5
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Suggerimenti</p>
              <p className="mt-1 text-2xl font-black text-white">{aiTechnicalSuggestionsV45Report.totals.suggestions}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Critici</p>
              <p className="mt-1 text-2xl font-black text-red-100">{aiTechnicalSuggestionsV45Report.totals.critical}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{aiTechnicalSuggestionsV45Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Info</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{aiTechnicalSuggestionsV45Report.totals.info}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocchi</p>
              <p className="mt-1 text-2xl font-black text-red-100">{aiTechnicalSuggestionsV45Report.totals.blockedWalls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Render/AR ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{aiTechnicalSuggestionsV45Report.totals.renderArReadyWalls}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Suggerimenti tecnici</p>
              <div className="mt-3 grid gap-3">
                {aiTechnicalSuggestionsV45Report.suggestions.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.wallLabel} · {item.category.replace(/_/g, " ")}</p>
                      </div>
                      <span className={
                        item.severity === "critical"
                          ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                          : item.severity === "warning"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-sky-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-100"
                      }>
                        {item.severity}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">{item.reason}</p>
                    <p className="mt-2 text-sm font-semibold text-violet-100">Azione: {item.suggestedAction}</p>
                    <p className="mt-2 text-xs text-slate-500">Blocca approvazione: {item.blocksApproval ? "sì" : "no"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Policy V4.5</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Assistivo: {aiTechnicalSuggestionsV45Report.policy.assistiveOnly ? "sì" : "no"}</li>
                  <li>• Cliente fonte primaria: {aiTechnicalSuggestionsV45Report.policy.customerInputRemainsPrimary ? "sì" : "no"}</li>
                  <li>• Nessuna approvazione automatica: {aiTechnicalSuggestionsV45Report.policy.noAutomaticApproval ? "sì" : "no"}</li>
                  <li>• Bridge render/AR foto: {aiTechnicalSuggestionsV45Report.policy.photoEnvironmentBridgeEnabled ? "attivo" : "non attivo"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Executive summary</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {aiTechnicalSuggestionsV45Report.executiveSummary.map((item, index) => (
                    <li key={`ai-v4-5-summary-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Prossimi step</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {aiTechnicalSuggestionsV45Report.nextActions.map((item, index) => (
                    <li key={`ai-v4-5-next-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#19091f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Layout / Room Intelligence V4.6</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Technical Evidence Approval</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Trasforma i suggerimenti tecnici V4.5 in un gate di approvazione tracciabile: cosa è approvato, cosa richiede review e cosa blocca PDF finale, installazione o render/AR.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalEvidenceApprovalV46Report.approvalStatus === "EVIDENCE_APPROVED"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : technicalEvidenceApprovalV46Report.approvalStatus === "EVIDENCE_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {technicalEvidenceApprovalV46Report.approvalStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalEvidenceApprovalV46Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta Approval V4.6
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Elementi</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalEvidenceApprovalV46Report.totals.items}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Approved</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{technicalEvidenceApprovalV46Report.totals.approved}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalEvidenceApprovalV46Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalEvidenceApprovalV46Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Approval richiesti</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{technicalEvidenceApprovalV46Report.totals.approvalRequired}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Gate approvazione</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• PDF finale: {technicalEvidenceApprovalV46Report.approvalGate.canGenerateFinalPdf ? "consentito" : "bloccato"}</li>
                <li>• Installazione: {technicalEvidenceApprovalV46Report.approvalGate.canApproveInstallation ? "approvabile" : "non approvabile"}</li>
                <li>• Render/AR da foto: {technicalEvidenceApprovalV46Report.approvalGate.canProceedToRenderAr ? "consentito" : "in attesa"}</li>
              </ul>

              {technicalEvidenceApprovalV46Report.approvalGate.blockerReasons.length > 0 && (
                <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/5 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-200">Blocchi rilevati</p>
                  <ul className="mt-2 space-y-1 text-xs text-red-100">
                    {technicalEvidenceApprovalV46Report.approvalGate.blockerReasons.slice(0, 5).map((item, index) => (
                      <li key={`approval-v4-6-blocker-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-200">Decisioni evidence</p>
              <div className="mt-3 grid gap-2">
                {technicalEvidenceApprovalV46Report.items.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-white">{item.wallLabel}</p>
                      <span className={
                        item.decision === "blocked"
                          ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                          : item.decision === "review"
                            ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                            : "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                      }>
                        {item.decision}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{item.requiredAction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061c24]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Layout / Room Intelligence V4.7</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Evidence-to-Render / AR Bridge</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Collega foto e approvazioni tecniche al futuro Photo Environment Intelligence: render del mobile nel locale cliente e preview AR senza confondere estetica e installabilità.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                evidenceToRenderArBridgeV47Report.bridgeStatus === "RENDER_AR_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : evidenceToRenderArBridgeV47Report.bridgeStatus === "RENDER_AR_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {evidenceToRenderArBridgeV47Report.bridgeStatus.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadEvidenceToRenderArBridgeV47Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Render/AR Bridge V4.7
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pareti</p>
              <p className="mt-1 text-2xl font-black text-white">{evidenceToRenderArBridgeV47Report.totals.walls}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Render ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{evidenceToRenderArBridgeV47Report.totals.photoRenderReady}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">AR ready</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{evidenceToRenderArBridgeV47Report.totals.arPreviewReady}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{evidenceToRenderArBridgeV47Report.totals.reviewRequired}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{evidenceToRenderArBridgeV47Report.totals.blocked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Pipeline render foto</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {evidenceToRenderArBridgeV47Report.renderPipeline.map((item, index) => (
                  <li key={`render-pipeline-v4-7-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Pipeline AR</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {evidenceToRenderArBridgeV47Report.arPipeline.map((item, index) => (
                  <li key={`ar-pipeline-v4-7-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {evidenceToRenderArBridgeV47Report.items.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-white">{item.wallLabel}</p>
                  <span className={
                    item.arPreviewReady
                      ? "rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100"
                      : item.photoRenderReady
                        ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                        : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                  }>
                    {item.arPreviewReady ? "AR READY" : item.photoRenderReady ? "RENDER READY" : "REVIEW"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{item.recommendedAction}</p>
                {item.warnings.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-yellow-100">
                    {item.warnings.map((warning, index) => (
                      <li key={`${item.id}-warning-${index}`}>• {warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#071422]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Layout Technical Sheet Generator V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Schede tecniche da piantina</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara le tavole tecniche da Layout Intelligence: piantina, battiscopa, pareti, fissaggi, punti tecnici, BOM e note montaggio.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutTechnicalSheetGeneratorV1Report.status === "SHEETS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutTechnicalSheetGeneratorV1Report.status === "SHEETS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutTechnicalSheetGeneratorV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutTechnicalSheetGeneratorV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta schede tecniche layout
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sezioni</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutTechnicalSheetGeneratorV1Report.totals.sections}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutTechnicalSheetGeneratorV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutTechnicalSheetGeneratorV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutTechnicalSheetGeneratorV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Mobili collegati</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{layoutTechnicalSheetGeneratorV1Report.totals.furnitureItemsLinked}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Scheda</th>
                    <th className="px-4 py-3">Fonte</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutTechnicalSheetGeneratorV1Report.sections.map((section) => (
                    <tr key={section.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{section.title}</p>
                        <p className="mt-1 text-slate-500">{section.output}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{section.source.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          section.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : section.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {section.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Regole generazione</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Tracciamento layout: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireLayoutTraceApproval ? "approvazione richiesta" : "non richiesto"}</p>
                  <p>Battiscopa: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireBaseboardData ? "dato obbligatorio" : "facoltativo"}</p>
                  <p>Supporto parete: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireWallSupportData ? "dato obbligatorio" : "facoltativo"}</p>
                  <p>Factory package: {layoutTechnicalSheetGeneratorV1Report.generationRules.requireFactoryPackageNotBlocked ? "non deve essere bloccato" : "non vincolante"}</p>
                  <p>Warning montaggio: {layoutTechnicalSheetGeneratorV1Report.generationRules.includeMountingWarnings ? "inclusi" : "esclusi"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutTechnicalSheetGeneratorV1Report.recommendations.map((item, index) => (
                    <li key={`layout-technical-sheet-generator-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[28px] border border-indigo-400/15 bg-[#0b1022]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200">Layout DXF / CAD Export Prep V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Preparazione export CAD da piantina</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara layer, dati e controlli per esportare piantina, ingombri mobili, battiscopa, punti tecnici e note montaggio verso DXF/PDF.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                layoutDxfCadExportPrepV1Report.status === "CAD_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : layoutDxfCadExportPrepV1Report.status === "CAD_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {layoutDxfCadExportPrepV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadLayoutDxfCadExportPrepV1Report}
                className="rounded-2xl border border-indigo-400/25 bg-indigo-400/10 px-5 py-3 text-sm font-black text-indigo-100 transition hover:bg-indigo-400/20"
              >
                Esporta preparazione CAD
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Layer</p>
              <p className="mt-1 text-2xl font-black text-white">{layoutDxfCadExportPrepV1Report.totals.layers}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{layoutDxfCadExportPrepV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{layoutDxfCadExportPrepV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{layoutDxfCadExportPrepV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-200">DXF / PDF</p>
              <p className="mt-1 text-2xl font-black text-indigo-100">{layoutDxfCadExportPrepV1Report.totals.dxfTargets}/{layoutDxfCadExportPrepV1Report.totals.pdfTargets}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Layer</th>
                    <th className="px-4 py-3">Output</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {layoutDxfCadExportPrepV1Report.layers.map((layer) => (
                    <tr key={layer.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{layer.layerName}</p>
                        <p className="mt-1 text-slate-500">{layer.note}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{layer.outputTarget.replace(/_/g, " + ")}</td>
                      <td className="px-4 py-3">
                        <span className={
                          layer.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : layer.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {layer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Regole export</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Traccia layout: {layoutDxfCadExportPrepV1Report.exportRules.requireApprovedLayoutTrace ? "approvata richiesta" : "non richiesta"}</p>
                  <p>Scala ambiente: {layoutDxfCadExportPrepV1Report.exportRules.requireScaledRoomReference ? "obbligatoria" : "facoltativa"}</p>
                  <p>Layer muri/aperture: {layoutDxfCadExportPrepV1Report.exportRules.requireWallAndOpeningLayers ? "obbligatori" : "facoltativi"}</p>
                  <p>Layer mobili: {layoutDxfCadExportPrepV1Report.exportRules.requireFurnitureFootprintLayers ? "obbligatori" : "facoltativi"}</p>
                  <p>ID Product Package: {layoutDxfCadExportPrepV1Report.exportRules.preserveProductPackageIds ? "preservati" : "non preservati"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {layoutDxfCadExportPrepV1Report.recommendations.map((item, index) => (
                    <li key={`layout-dxf-cad-export-prep-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#061720]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Technical Wall Elevation Sheets V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Prospetti parete tecnici</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prepara prospetti parete con mobili disegnati frontalmente, quote, punti elettrici, punti idraulici, carico acqua calda/fredda, scarico, prese nelle cassettiere e punti fissaggio.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalWallElevationSheetsV1Report.status === "ELEVATIONS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : technicalWallElevationSheetsV1Report.status === "ELEVATIONS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {technicalWallElevationSheetsV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalWallElevationSheetsV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta prospetti parete
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Layer</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalWallElevationSheetsV1Report.totals.layers}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{technicalWallElevationSheetsV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalWallElevationSheetsV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalWallElevationSheetsV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">PDF/DXF</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{technicalWallElevationSheetsV1Report.totals.pdfLayers}/{technicalWallElevationSheetsV1Report.totals.dxfLayers}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Punti tecnici</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{technicalWallElevationSheetsV1Report.totals.technicalPointLayers}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Layer prospetto</th>
                    <th className="px-4 py-3">Colore</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {technicalWallElevationSheetsV1Report.layers.map((layer) => (
                    <tr key={layer.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{layer.label}</p>
                        <p className="mt-1 text-slate-500">{layer.note}</p>
                        <p className="mt-1 text-[11px] text-cyan-200">{layer.layerName}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{layer.colorHint}</td>
                      <td className="px-4 py-3">
                        <span className={
                          layer.status === "ready"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : layer.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {layer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Regole prospetti</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Mobili in prospetto: {technicalWallElevationSheetsV1Report.wallElevationRules.drawFurnitureFrontElevations ? "obbligatori" : "facoltativi"}</p>
                  <p>Acqua calda/fredda: {technicalWallElevationSheetsV1Report.wallElevationRules.requireHotColdWaterPoints ? "obbligatoria" : "facoltativa"}</p>
                  <p>Scarico: {technicalWallElevationSheetsV1Report.wallElevationRules.requireDrainPoints ? "obbligatorio" : "facoltativo"}</p>
                  <p>Prese cassettiere: {technicalWallElevationSheetsV1Report.wallElevationRules.requireDrawerIntegratedSockets ? "obbligatorie" : "facoltative"}</p>
                  <p>Colori/layer separati: {technicalWallElevationSheetsV1Report.wallElevationRules.requireColorSeparatedLayers ? "attivi" : "non attivi"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalWallElevationSheetsV1Report.recommendations.map((item, index) => (
                    <li key={`technical-wall-elevation-sheets-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-sky-400/15 bg-[#06111f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Wall Technical Points Validation V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Validazione punti tecnici parete</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla prospetti parete, quote lavandino, acqua calda/fredda, scarico, prese nelle cassettiere, fissaggi, battiscopa e qualità grafica della scheda tecnica.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                wallTechnicalPointsValidationV1Report.status === "TECHNICAL_POINTS_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : wallTechnicalPointsValidationV1Report.status === "TECHNICAL_POINTS_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {wallTechnicalPointsValidationV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadWallTechnicalPointsValidationV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta validazione punti
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{wallTechnicalPointsValidationV1Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{wallTechnicalPointsValidationV1Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{wallTechnicalPointsValidationV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallTechnicalPointsValidationV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{wallTechnicalPointsValidationV1Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{wallTechnicalPointsValidationV1Report.totals.errors}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo</th>
                    <th className="px-4 py-3">Atteso</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {wallTechnicalPointsValidationV1Report.rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-slate-500">{rule.note}</p>
                        <p className="mt-1 text-[11px] text-sky-200">{rule.kind} / {rule.severity}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{rule.expected}</p>
                        <p className="mt-1 text-slate-500">{rule.actual}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          rule.status === "passed"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : rule.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {rule.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Regole lavandino</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Lavandino da appoggio: piano a <span className="font-black text-white">{wallTechnicalPointsValidationV1Report.sinkRules.countertopSinkTopHeightMm} mm</span></p>
                  <p>Lavandino da incasso: piano a <span className="font-black text-white">{wallTechnicalPointsValidationV1Report.sinkRules.insetSinkTopHeightMm} mm</span></p>
                  <p>Propaga quote a idraulica: {wallTechnicalPointsValidationV1Report.sinkRules.propagateHeightToPlumbingPoints ? "sì" : "no"}</p>
                  <p>Propaga quote a prospetti: {wallTechnicalPointsValidationV1Report.sinkRules.propagateHeightToWallElevations ? "sì" : "no"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {wallTechnicalPointsValidationV1Report.recommendations.map((item, index) => (
                    <li key={`wall-technical-points-validation-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-violet-400/15 bg-[#13091f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Technical Knowledge Base V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Knowledge Base tecnica</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Centralizza le regole tecniche BagaStudio per lavabi, idraulica, elettrico, pareti, battiscopa, mensole e qualità delle schede tecniche.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                technicalKnowledgeBaseV1Report.status === "KNOWLEDGE_BASE_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {technicalKnowledgeBaseV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadTechnicalKnowledgeBaseV1Report}
                className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
              >
                Esporta Knowledge Base V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Regole</p>
              <p className="mt-1 text-2xl font-black text-white">{technicalKnowledgeBaseV1Report.totals.rules}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Idraulica</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{technicalKnowledgeBaseV1Report.totals.plumbing}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Elettrico</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{technicalKnowledgeBaseV1Report.totals.electrical}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Pareti</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{technicalKnowledgeBaseV1Report.totals.wall}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{technicalKnowledgeBaseV1Report.totals.errors}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{technicalKnowledgeBaseV1Report.totals.warnings}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Regola</th>
                    <th className="px-4 py-3">Atteso</th>
                    <th className="px-4 py-3">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {technicalKnowledgeBaseV1Report.rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{rule.label}</p>
                        <p className="mt-1 text-slate-500">{rule.note}</p>
                        <p className="mt-1 text-[11px] text-violet-200">{rule.validationTarget}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{rule.expected}</p>
                        {typeof rule.valueMm === "number" && (
                          <p className="mt-1 text-[11px] font-black text-white">{rule.valueMm} mm</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          rule.severity === "error"
                            ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                            : rule.severity === "warning"
                              ? "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                              : "rounded-full bg-sky-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-100"
                        }>
                          {rule.category} / {rule.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Quote lavabi</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Lavandino da appoggio: <span className="font-black text-white">{technicalKnowledgeBaseV1Report.sinkHeights.countertopSinkTopHeightMm} mm</span></p>
                  <p>Lavandino da incasso: <span className="font-black text-white">{technicalKnowledgeBaseV1Report.sinkHeights.insetSinkTopHeightMm} mm</span></p>
                  <p className="text-slate-500">Le quote alimentano prospetti parete, idraulica, scarico, PDF/DXF/CAD e validazioni tecniche.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {technicalKnowledgeBaseV1Report.recommendations.map((item, index) => (
                    <li key={`technical-knowledge-base-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#071821]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">Smart Technical Validator V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Validatore tecnico intelligente</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Usa la Knowledge Base tecnica per trasformare regole, quote e punti tecnici in controlli automatici prima di PDF, DXF e CAD.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                smartTechnicalValidatorV1Report.status === "TECHNICAL_VALIDATION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : smartTechnicalValidatorV1Report.status === "TECHNICAL_VALIDATION_BLOCKED"
                    ? "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
                    : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {smartTechnicalValidatorV1Report.status.replace(/_/g, " ")}
              </span>

              <button
                type="button"
                onClick={downloadSmartTechnicalValidatorV1Report}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta Smart Validator V1
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Controlli</p>
              <p className="mt-1 text-2xl font-black text-white">{smartTechnicalValidatorV1Report.totals.checks}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Passed</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{smartTechnicalValidatorV1Report.totals.passed}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Review</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{smartTechnicalValidatorV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{smartTechnicalValidatorV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Appoggio</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{smartTechnicalValidatorV1Report.sinkHeights.countertopSinkTopHeightMm} mm</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Incasso</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{smartTechnicalValidatorV1Report.sinkHeights.insetSinkTopHeightMm} mm</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-black/30 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Controllo</th>
                    <th className="px-4 py-3">Rilevato</th>
                    <th className="px-4 py-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {smartTechnicalValidatorV1Report.issues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="px-4 py-3">
                        <p className="font-black text-white">{issue.label}</p>
                        <p className="mt-1 text-slate-500">{issue.expected}</p>
                        <p className="mt-1 text-[11px] text-cyan-200">{issue.category} / {issue.sourceRuleId}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{issue.detected}</p>
                        <p className="mt-1 text-slate-500">{issue.recommendation}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          issue.status === "passed"
                            ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100"
                            : issue.status === "blocked"
                              ? "rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-100"
                              : "rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100"
                        }>
                          {issue.status} / {issue.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Fonti collegate</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>Knowledge Base: <span className="font-black text-white">{smartTechnicalValidatorV1Report.sourceKnowledgeBaseStatus.replace(/_/g, " ")}</span></p>
                  <p>Wall Validation: <span className="font-black text-white">{smartTechnicalValidatorV1Report.sourceWallValidationStatus.replace(/_/g, " ")}</span></p>
                  <p className="text-slate-500">Il validatore è il gate tecnico prima della scheda esecutiva finale.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Raccomandazioni</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {smartTechnicalValidatorV1Report.recommendations.map((item, index) => (
                    <li key={`smart-technical-validator-v1-recommendation-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-emerald-400/15 bg-[#071a13]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200">Hardware Analyzer V2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Thickness Compatibility Check</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Primo validatore produttivo: verifica se gli spessori rigenerati sono compatibili con le regole produttive prima delle validazioni ferramenta/forature.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                hardwareAnalyzerV2ThicknessReport.productionStatus === "PRODUCTION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {hardwareAnalyzerV2ThicknessReport.productionStatus === "PRODUCTION_READY"
                  ? "Production Ready"
                  : "Production Blocked"}
              </span>

              <button
                type="button"
                onClick={downloadHardwareAnalyzerV2ThicknessReport}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/20"
              >
                Esporta analyzer
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Analizzati</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwareAnalyzerV2ThicknessReport.totals.analyzed}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Compatibili</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareAnalyzerV2ThicknessReport.totals.compatible}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Incompatibili</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareAnalyzerV2ThicknessReport.totals.incompatible}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Saltati</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareAnalyzerV2ThicknessReport.totals.skipped}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-orange-200">Mancanti</p>
              <p className="mt-1 text-2xl font-black text-orange-100">{hardwareAnalyzerV2ThicknessReport.totals.missing}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Originale</span>
              <span>Target</span>
              <span>Stato</span>
            </div>

            {hardwareAnalyzerV2ThicknessReport.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Hardware Analyzer V2.</div>
            ) : (
              hardwareAnalyzerV2ThicknessReport.items.map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.note}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.originalThickness ?? "n/d"} mm</span>
                  <span className="font-semibold text-slate-200">{item.targetThickness ?? "n/d"} mm</span>
                  <span className={
                    item.status === "compatible"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "skipped"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                  }>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-purple-400/15 bg-[#12071a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200">Constraint Inspector V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controllo ruoli produttivi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica preliminare dei ruoli componente prima del Constraint Validation: fianco, schiena, ripiano, anta, cielo, fondo e zoccolo.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadConstraintInspectorV1Report}
              className="rounded-2xl border border-purple-400/25 bg-purple-400/10 px-5 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-400/20"
            >
              Esporta constraint
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Analizzati</p>
              <p className="mt-1 text-2xl font-black text-white">{constraintInspectorV1Report.totals.analyzed}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Con ruolo</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{constraintInspectorV1Report.totals.withRole}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Senza ruolo</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{constraintInspectorV1Report.totals.withoutRole}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
              <div className="grid grid-cols-[1.3fr_0.8fr_0.6fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                <span>Componente</span>
                <span>Ruolo</span>
                <span>Stato</span>
              </div>

              {constraintInspectorV1Report.items.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Constraint Inspector.</div>
              ) : (
                constraintInspectorV1Report.items.map((item) => (
                  <div key={item.componentId} className="grid grid-cols-[1.3fr_0.8fr_0.6fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                    <div>
                      <p className="font-black text-white">{item.displayName}</p>
                      <p className="mt-1 text-slate-500">Sorgente: {item.source}</p>
                    </div>
                    <span className="font-semibold text-slate-200">{item.role || "-"}</span>
                    <span className={
                      item.status === "present"
                        ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                        : "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                    }>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-sm font-black text-white">Ruoli rilevati</p>
              <div className="mt-3 space-y-2">
                {Object.entries(constraintInspectorV1Report.roles).length === 0 ? (
                  <p className="text-xs text-slate-500">Nessun ruolo rilevato.</p>
                ) : (
                  Object.entries(constraintInspectorV1Report.roles).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
                      <span className="text-slate-300">{role}</span>
                      <span className="font-black text-purple-100">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#17071a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Hardware Analyzer V2.1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Constraint Validation</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Valida i ruoli produttivi rilevati dal Constraint Inspector: presenza ruolo e conformità ai valori ammessi.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                constraintValidationV21Report.validationStatus === "CONSTRAINT_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {constraintValidationV21Report.validationStatus === "CONSTRAINT_READY"
                  ? "Constraint Ready"
                  : "Constraint Blocked"}
              </span>

              <button
                type="button"
                onClick={downloadConstraintValidationV21Report}
                className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
              >
                Esporta validation
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Analizzati</p>
              <p className="mt-1 text-2xl font-black text-white">{constraintValidationV21Report.totals.analyzed}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Validi</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{constraintValidationV21Report.totals.valid}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Mancanti</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{constraintValidationV21Report.totals.missing}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Invalidi</p>
              <p className="mt-1 text-2xl font-black text-red-100">{constraintValidationV21Report.totals.invalid}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1.3fr_0.7fr_0.6fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ruolo</span>
              <span>Stato</span>
            </div>

            {constraintValidationV21Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Constraint Validation.</div>
            ) : (
              constraintValidationV21Report.items.map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1.3fr_0.7fr_0.6fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.note}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.role || "-"}</span>
                  <span className={
                    item.status === "valid"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "missing"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                  }>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#07131a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Hardware Analyzer V2.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Drilling Inspector V1</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica preliminare delle forature importate da CIX/CSV/modello prima di costruire il Drilling Validation.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                drillingInspectorV1Report.readiness === "DRILLING_DATA_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
              }>
                {drillingInspectorV1Report.readiness === "DRILLING_DATA_READY"
                  ? "Drilling Data Ready"
                  : "Drilling Data Missing"}
              </span>

              <button
                type="button"
                onClick={downloadDrillingInspectorV1Report}
                className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                Esporta drilling
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{drillingInspectorV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Con forature</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{drillingInspectorV1Report.totals.componentsWithDrillings}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Senza forature</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{drillingInspectorV1Report.totals.componentsWithoutDrillings}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Fori rilevati</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{drillingInspectorV1Report.totals.drillings}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1.2fr_0.45fr_0.65fr_0.65fr_0.55fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Fori</span>
              <span>Diametri</span>
              <span>Profondità</span>
              <span>Stato</span>
            </div>

            {drillingInspectorV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">Nessun componente disponibile per Drilling Inspector.</div>
            ) : (
              drillingInspectorV1Report.items.map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1.2fr_0.45fr_0.65fr_0.65fr_0.55fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Sorgente: {item.source}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.drillings}</span>
                  <span className="font-semibold text-slate-200">{item.diameters.length ? item.diameters.join(" / ") : "-"}</span>
                  <span className="font-semibold text-slate-200">{item.depths.length ? item.depths.join(" / ") : "-"}</span>
                  <span className={
                    item.status === "present"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                  }>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-orange-400/15 bg-[#1a1007]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">Hardware Analyzer V2.3</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Hardware Collision Check</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla sovrapposizioni, duplicazioni e distanze critiche tra forature sullo stesso componente.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <span className={
                hardwareCollisionV23Report.collisionStatus === "COLLISION_READY"
                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
                  : hardwareCollisionV23Report.collisionStatus === "COLLISION_WARNING"
                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-yellow-100"
                    : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100"
              }>
                {hardwareCollisionV23Report.collisionStatus === "COLLISION_READY"
                  ? "Collision Ready"
                  : hardwareCollisionV23Report.collisionStatus === "COLLISION_WARNING"
                    ? "Collision Warning"
                    : "Collision Blocked"}
              </span>

              <button
                type="button"
                onClick={downloadHardwareCollisionV23Report}
                className="rounded-2xl border border-orange-400/25 bg-orange-400/10 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/20"
              >
                Esporta collision
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Forature</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwareCollisionV23Report.totals.drillings}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Coppie controllate</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{hardwareCollisionV23Report.totals.checkedPairs}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareCollisionV23Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareCollisionV23Report.totals.errors}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.65fr_0.6fr_1.1fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Fori</span>
              <span>Stato</span>
              <span>Messaggio</span>
            </div>

            {hardwareCollisionV23Report.issues.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">
                Nessuna collisione rilevata tra le forature disponibili.
              </div>
            ) : (
              hardwareCollisionV23Report.issues.slice(0, 80).map((issue, index) => (
                <div key={`${issue.componentId}-${issue.code}-${index}`} className="grid grid-cols-[1fr_0.65fr_0.6fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{issue.displayName}</p>
                    <p className="mt-1 text-slate-500">Distanza {issue.distance} mm · soglia {issue.safeDistance} mm</p>
                  </div>
                  <span className="font-semibold text-slate-200">#{issue.firstIndex + 1} ↔ #{issue.secondIndex + 1}</span>
                  <span className={
                    issue.status === "error"
                      ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                      : "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                  }>
                    {issue.status}
                  </span>
                  <span className="text-slate-300">{issue.message}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-lime-400/15 bg-[#101a07]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-200">Hardware Pattern Recognition V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Riconoscimento pattern ferramenta</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Prima classificazione automatica delle forature: cerniere, minifix/giunzioni, reggipiani e pattern non riconosciuti.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadHardwarePatternRecognitionV1Report}
              className="rounded-2xl border border-lime-400/25 bg-lime-400/10 px-5 py-3 text-sm font-black text-lime-100 transition hover:bg-lime-400/20"
            >
              Esporta pattern
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Pattern</p>
              <p className="mt-1 text-2xl font-black text-white">{hardwarePatternRecognitionV1Report.totals.patterns}</p>
            </div>
            <div className="rounded-2xl border border-lime-400/15 bg-lime-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-lime-200">Cerniere</p>
              <p className="mt-1 text-2xl font-black text-lime-100">{hardwarePatternRecognitionV1Report.totals.hinges}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Minifix</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{hardwarePatternRecognitionV1Report.totals.minifix}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Reggipiani</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwarePatternRecognitionV1Report.totals.shelfPins}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Sconosciuti</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{hardwarePatternRecognitionV1Report.totals.unknown}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.75fr_0.55fr_1.1fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Pattern</span>
              <span>Conf.</span>
              <span>Motivo</span>
            </div>

            {hardwarePatternRecognitionV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">
                Nessuna foratura disponibile per il riconoscimento pattern.
              </div>
            ) : (
              hardwarePatternRecognitionV1Report.items.slice(0, 80).map((item, index) => (
                <div key={`${item.componentId}-${item.patternType}-${index}`} className="grid grid-cols-[1fr_0.75fr_0.55fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Fori: {item.drillingIndexes.map((idx) => `#${idx + 1}`).join(", ")}</p>
                  </div>
                  <span className={item.patternType === "unknown" ? "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100" : "h-fit rounded-full bg-lime-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-lime-100"}>
                    {item.label}
                  </span>
                  <span className="font-black text-slate-200">{item.confidence}%</span>
                  <span className="text-slate-300">{item.reason}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-teal-400/15 bg-[#071a16]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-200">Hardware Compatibility Matrix V1.2</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Matrice compatibilità ferramenta</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Incrocia Pattern Recognition V1 con la Knowledge Base V1.1: profili verificati, priorità, reliability score, production gate e blocco dei Divario generici non affidabili.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadHardwareCompatibilityMatrixV1Report}
              className="rounded-2xl border border-teal-400/25 bg-teal-400/10 px-5 py-3 text-sm font-black text-teal-100 transition hover:bg-teal-400/20"
            >
              Esporta matrix
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Compatibili</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareCompatibilityMatrixV1Report.totals.compatible}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{hardwareCompatibilityMatrixV1Report.totals.warning}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Non compatibili</p>
              <p className="mt-1 text-2xl font-black text-red-100">{hardwareCompatibilityMatrixV1Report.totals.incompatible}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Sconosciuti</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{hardwareCompatibilityMatrixV1Report.totals.unknown}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.65fr_0.65fr_0.4fr_0.55fr_0.5fr_1.1fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ferramenta</span>
              <span>Profilo</span>
              <span>Score</span>
              <span>Stato</span>
              <span>Gate</span>
              <span>Nota</span>
            </div>

            {hardwareCompatibilityMatrixV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun pattern disponibile per la matrice compatibilità.</div>
            ) : (
              hardwareCompatibilityMatrixV1Report.items.slice(0, 80).map((item, index) => (
                <div key={`${item.componentId}-${item.hardwareLabel}-${index}`} className="grid grid-cols-[1fr_0.65fr_0.65fr_0.4fr_0.55fr_0.5fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Spessore: {item.currentThickness ?? "-"} mm</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.hardwareLabel}</span>
                  <span className="font-semibold text-teal-100">{item.trustedProfile || "-"}</span>
                  <span className="font-black text-slate-100">{item.reliabilityScore || "-"}</span>
                  <span className={
                    item.status === "compatible"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "warning"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : item.status === "incompatible"
                          ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                          : "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100"
                  }>
                    {item.status}
                  </span>
                  <span className={
                    item.productionGate === "pass"
                      ? "h-fit rounded-full bg-cyan-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100"
                      : item.productionGate === "blocked"
                        ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                        : "h-fit rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-100"
                  }>
                    {item.productionGate || "review"}
                  </span>
                  <span className="text-slate-300">{item.note}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-sky-400/15 bg-[#07131f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Production Readiness Gate V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Semaforo produzione componenti</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Incrocia Compatibility Matrix V1.2, Constraint Engine V1 e Collision Engine V1.5 per classificare ogni componente come pass, review o blocked.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadProductionReadinessGateV1Report}
              className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/20"
            >
              Esporta production gate
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Pass</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{productionReadinessGateV1Report.totals.pass}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Review</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{productionReadinessGateV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{productionReadinessGateV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200">Componenti</p>
              <p className="mt-1 text-2xl font-black text-sky-100">{productionReadinessGateV1Report.totals.components}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[340px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.55fr_0.55fr_0.7fr_1.4fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Gate</span>
              <span>Matrix</span>
              <span>Problemi</span>
              <span>Motivazioni</span>
            </div>

            {productionReadinessGateV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun componente disponibile per il Production Readiness Gate.</div>
            ) : (
              productionReadinessGateV1Report.items.slice(0, 80).map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1fr_0.55fr_0.55fr_0.7fr_1.4fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.componentId}</p>
                  </div>
                  <span className={
                    item.status === "pass"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "blocked"
                        ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                        : "h-fit rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-100"
                  }>
                    {item.status}
                  </span>
                  <span className="font-semibold text-sky-100">{item.compatibilityGate || "-"}</span>
                  <span className="text-slate-300">
                    C:{item.collisionCritical}/{item.collisionWarnings} · V:{item.constraintErrors}/{item.constraintWarnings}
                  </span>
                  <span className="text-slate-300">{item.reasons.slice(0, 2).join(" ")}</span>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-violet-400/15 bg-[#12091f]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200">Parametric Edit V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Prontezza modifica parametrica</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Controlla quali componenti possono entrare nel Parametric Edit mantenendo l'ingombro esterno bloccato e preparando il ricalcolo interno.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadParametricEditV1Report}
              className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/20"
            >
              Esporta parametric edit
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Componenti</p>
              <p className="mt-1 text-2xl font-black text-white">{parametricEditV1Report.totals.components}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Ready</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{parametricEditV1Report.totals.ready}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-amber-200">Review</p>
              <p className="mt-1 text-2xl font-black text-amber-100">{parametricEditV1Report.totals.review}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Blocked</p>
              <p className="mt-1 text-2xl font-black text-red-100">{parametricEditV1Report.totals.blocked}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-violet-200">Esterni bloccati</p>
              <p className="mt-1 text-2xl font-black text-violet-100">{parametricEditV1Report.totals.externalDimensionsLocked}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Ricalcolo interno</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{parametricEditV1Report.totals.internalRecalculationRequired}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            {parametricEditV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun componente disponibile per Parametric Edit V1.</div>
            ) : (
              parametricEditV1Report.items.slice(0, 80).map((item) => (
                <div key={item.componentId} className="grid grid-cols-[1fr_0.55fr_0.7fr_0.7fr_1.4fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">{item.componentId}</p>
                  </div>
                  <span className={
                    item.status === "ready"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "blocked"
                        ? "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                        : item.status === "skipped"
                          ? "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100"
                          : "h-fit rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-100"
                  }>
                    {item.status}
                  </span>
                  <span className="text-slate-300">{item.originalThickness ?? "n/d"} → {item.targetThickness ?? "n/d"} mm</span>
                  <span className="text-slate-300">Ext: {item.externalDimensionsLocked ? "lock" : "review"}</span>
                  <span className="text-slate-300">{item.note}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-fuchsia-400/15 bg-[#17071a]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-200">Hardware Links Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Collegamenti ferramenta-forature</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Crea il primo collegamento strutturato tra componente, ferramenta riconosciuta e fori usati dal pattern.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadHardwareLinksEngineV1Report}
              className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20"
            >
              Esporta links
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fuchsia-200">Link creati</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-100">{hardwareLinksEngineV1Report.totals.links}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">Componenti collegati</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{hardwareLinksEngineV1Report.totals.linkedComponents}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">Pattern validi</p>
              <p className="mt-1 text-2xl font-black text-cyan-100">{hardwareLinksEngineV1Report.totals.validPatterns}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Ignorati</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{hardwareLinksEngineV1Report.totals.ignoredPatterns}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.75fr_0.65fr_0.55fr_1.05fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ferramenta</span>
              <span>Fori</span>
              <span>Conf.</span>
              <span>Stato</span>
            </div>

            {hardwareLinksEngineV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun pattern disponibile per creare hardware links.</div>
            ) : (
              hardwareLinksEngineV1Report.items.slice(0, 80).map((item, index) => (
                <div key={`${item.componentId}-${item.hardwareLabel}-${index}`} className="grid grid-cols-[1fr_0.75fr_0.65fr_0.55fr_1.05fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Profilo: {item.trustedProfile || "-"}</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.hardwareLabel}</span>
                  <span className="font-semibold text-fuchsia-100">{item.drillingIndexes.map((idx) => `#${idx + 1}`).join(", ")}</span>
                  <span className="font-black text-slate-200">{item.confidence}%</span>
                  <div>
                    <span className={item.status === "linked" ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100" : "h-fit rounded-full bg-slate-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-100"}>
                      {item.status}
                    </span>
                    <p className="mt-2 text-slate-400">{item.note}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>


        <section className="rounded-[28px] border border-rose-400/15 bg-[#1a0710]/85 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-200">Constraint Engine V1</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Controlli geometrici produttivi</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Verifica profondità foro, margine sicurezza 2 mm e limite lavorazioni passanti pari a spessore + 0.1 mm.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadConstraintEngineV1Report}
              className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
            >
              Esporta constraints
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Fori controllati</p>
              <p className="mt-1 text-2xl font-black text-white">{constraintEngineV1Report.totals.drillingsChecked}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">OK</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{constraintEngineV1Report.totals.ok}</p>
            </div>
            <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-yellow-200">Warning</p>
              <p className="mt-1 text-2xl font-black text-yellow-100">{constraintEngineV1Report.totals.warnings}</p>
            </div>
            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-red-200">Errori</p>
              <p className="mt-1 text-2xl font-black text-red-100">{constraintEngineV1Report.totals.errors}</p>
            </div>
            <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">Dati mancanti</p>
              <p className="mt-1 text-2xl font-black text-slate-100">{constraintEngineV1Report.totals.missingData}</p>
            </div>
          </div>

          <div className="mt-5 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/25">
            <div className="grid grid-cols-[1fr_0.7fr_0.55fr_0.55fr_1.2fr] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
              <span>Componente</span>
              <span>Ferramenta</span>
              <span>Foro</span>
              <span>Stato</span>
              <span>Messaggio</span>
            </div>

            {constraintEngineV1Report.items.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400">Nessun hardware link disponibile per i controlli constraint.</div>
            ) : (
              constraintEngineV1Report.items.slice(0, 100).map((item, index) => (
                <div key={`${item.componentId}-${item.hardwareLabel}-${item.drillingIndex}-${index}`} className="grid grid-cols-[1fr_0.7fr_0.55fr_0.55fr_1.2fr] gap-3 border-b border-white/5 px-4 py-3 text-xs">
                  <div>
                    <p className="font-black text-white">{item.displayName}</p>
                    <p className="mt-1 text-slate-500">Spessore {item.thickness ?? "-"} mm · profondità {item.depth ?? "-"} mm</p>
                  </div>
                  <span className="font-semibold text-slate-200">{item.hardwareLabel}</span>
                  <span className="font-semibold text-rose-100">#{item.drillingIndex + 1}</span>
                  <span className={
                    item.status === "ok"
                      ? "h-fit rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-100"
                      : item.status === "warning"
                        ? "h-fit rounded-full bg-yellow-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-yellow-100"
                        : "h-fit rounded-full bg-red-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-red-100"
                  }>
                    {item.status}
                  </span>
                  <span className="text-slate-300">{item.message}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{adminT.productLibrary}</h2>
              <p className="mt-1 text-sm text-slate-400">{adminT.libraryDesc}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveCurrentProductToLibrary}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(14,165,233,0.24)] transition hover:bg-cyan-400"
              >
                {adminT.saveToLibrary}
              </button>

              <button
                type="button"
                onClick={downloadProductLibraryJson}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Esporta libreria
              </button>

              <label className="cursor-pointer rounded-2xl border border-cyan-400/25 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Importa package
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(event) => importProductPackageToLibrary(event.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <input
              value={librarySearch}
              onChange={(event) => setLibrarySearch(event.target.value)}
              placeholder="Cerca prodotto, categoria, brand, file..."
              className="rounded-2xl border border-cyan-400/20 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
            />

            <div className="rounded-2xl border border-cyan-400/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
              {filteredProductLibrary.length} / {productLibrary.length} prodotti visibili
            </div>
          </div>

          {productLibrary.length === 0 ? (
            <p className="rounded-2xl border border-cyan-400/10 bg-black/30 p-4 text-sm text-slate-400">
              {adminT.emptyLibrary}
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-3">
                {filteredProductLibrary.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedLibraryProductId(item.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      selectedLibraryProduct?.id === item.id
                        ? "border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_28px_rgba(14,165,233,0.16)]"
                        : "border-cyan-400/15 bg-black/30 hover:border-cyan-300/35 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-base font-black text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.brand} · {item.category} · {item.sourceFileName || "package JSON"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {new Date(item.savedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            loadProductFromLibrary(item);
                          }}
                          className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
                        >
                          {adminT.loadProduct}
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            downloadSelectedLibraryProductPackage(item);
                          }}
                          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-500/20"
                        >
                          Scarica JSON
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteProductFromLibrary(item.id);
                          }}
                          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20"
                        >
                          {adminT.deleteProduct}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="rounded-2xl border border-cyan-400/15 bg-black/30 p-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                  Product Inspector
                </p>

                {selectedLibraryProduct ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Nome</p>
                      <p className="font-black text-white">{selectedLibraryProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ID</p>
                      <p className="break-all font-mono text-xs text-cyan-100">{selectedLibraryProduct.id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                        <p className="text-xs text-slate-500">Categoria</p>
                        <p className="font-bold text-white">{selectedLibraryProduct.category}</p>
                      </div>
                      <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                        <p className="text-xs text-slate-500">Brand</p>
                        <p className="font-bold text-white">{selectedLibraryProduct.brand}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Sorgente</p>
                      <p className="break-all text-slate-300">{selectedLibraryProduct.sourceFileName || "package JSON"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => loadProductFromLibrary(selectedLibraryProduct)}
                        className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-white transition hover:bg-cyan-400"
                      >
                        Apri prodotto
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSelectedLibraryProductPackage(selectedLibraryProduct)}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
                      >
                        Esporta package
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Seleziona un prodotto dalla libreria.</p>
                )}
              </aside>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-4">
            {adminT.import3d}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400">
              {adminT.chooseFile}
<input
  type="file"
  accept={BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMATS}
  onChange={(e) => {
    void handleAdminModelImport(e.target.files?.[0]);
  }}
  className="hidden"
/>
            </label>
            <span className="text-sm text-slate-300">{modelFileName || adminT.noFileSelected}</span>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            {adminT.formats}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Importer UI V2 attivo · {BAGASTUDIO_ADMIN_SUPPORTED_MODEL_FORMAT_LABEL}
          </p>

          <div className="mt-5 grid gap-3 rounded-2xl border border-cyan-400/15 bg-black/25 p-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                    importerDiagnostic.status === "ready"
                      ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : importerDiagnostic.status === "warning"
                      ? "border border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : importerDiagnostic.status === "error"
                      ? "border border-red-400/40 bg-red-400/10 text-red-200"
                      : importerDiagnostic.status === "loading"
                      ? "border border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                      : "border border-slate-400/20 bg-white/[0.03] text-slate-300"
                  }`}
                >
                  {importerDiagnostic.status}
                </span>
                <span className="text-sm font-bold text-white">{importerDiagnostic.message}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Mesh</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.meshCount}</p>
                </div>
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Selezionabili</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.selectableCount}</p>
                </div>
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">LED ready</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.ledReadyCount}</p>
                </div>
                <div className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                  <p className="text-slate-500">Inserti</p>
                  <p className="text-lg font-black text-white">{importerDiagnostic.insertReadyCount}</p>
                </div>
              </div>

              {(importerDiagnostic.warnings.length > 0 || importerDiagnostic.errors.length > 0) && (
                <div className="mt-3 space-y-2 text-xs">
                  {importerDiagnostic.errors.map((error) => (
                    <p key={error} className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-200">
                      Errore: {error}
                    </p>
                  ))}
                  {importerDiagnostic.warnings.map((warning) => (
                    <p key={warning} className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100">
                      Avviso: {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-white/[0.03] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Package readiness</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className={importerReadiness.hasSupportedFormat ? "text-emerald-200" : "text-red-200"}>
                  Formato supportato: {importerReadiness.hasSupportedFormat ? "Sì" : "No"}
                </p>
                <p className={importerReadiness.hasComponents ? "text-emerald-200" : "text-amber-200"}>
                  Componenti rilevati: {importerReadiness.hasComponents ? "Sì" : "No"}
                </p>
                <p className={importerReadiness.hasMappedNames ? "text-emerald-200" : "text-amber-200"}>
                  Nomi mapping: {importerReadiness.hasMappedNames ? "Completi" : "Da completare"}
                </p>
                <p className={importerReadiness.packageReady ? "text-emerald-300" : "text-slate-400"}>
                  Product Package: {importerReadiness.packageReady ? "Pronto" : "Non pronto"}
                </p>
              </div>
              <button
                type="button"
                onClick={downloadImporterDiagnosticJson}
                className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Scarica diagnostica importer
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Space3D Import Runtime V1</p>
                <h3 className="mt-1 text-lg font-black text-white">S3D Analyzer / Bridge</h3>
                <p className="mt-1 text-xs text-slate-400">Carica file .s3d o .s3dbak per estrarre componenti, materiali e metadata da Space3D.</p>
              </div>

              <label className="cursor-pointer rounded-xl bg-violet-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400">
                Importa .s3d
                <input
                  type="file"
                  accept={SPACE3D_SUPPORTED_FORMATS}
                  onChange={(event) => {
                    void handleSpace3DImport(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                Importa CSV
                <input
                  type="file"
                  accept={SPACE3D_CSV_SUPPORTED_FORMATS}
                  onChange={(event) => {
                    void handleSpace3DCsvImport(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-400">
                Importa CIX
                <input
                  type="file"
                  accept={SPACE3D_CIX_SUPPORTED_FORMATS}
                  multiple
                  onChange={(event) => {
                    void handleSpace3DCixImport(event.target.files);
                    event.currentTarget.value = "";
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
              <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                <p className="text-xs text-slate-500">File Space3D</p>
                <p className="mt-1 break-all text-sm font-bold text-white">{space3DFileName || "Nessun file caricato"}</p>
                <p className="mt-2 text-xs text-violet-200">{space3DStatus}</p>
              </div>

              <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                <p className="text-xs text-slate-500">Componenti rilevati</p>
                <p className="mt-1 text-2xl font-black text-white">{space3DAnalyzerReport?.stats.components ?? 0}</p>
                <p className="text-xs text-slate-400">Mapping automatico verso componenti BagaStudio</p>
              </div>

              <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                <p className="text-xs text-slate-500">Materiali rilevati</p>
                <p className="mt-1 text-2xl font-black text-white">{space3DAnalyzerReport?.stats.materials ?? 0}</p>
                <p className="text-xs text-slate-400">Material Extractor V1</p>
              </div>
            </div>

            {space3DAnalyzerReport && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">Componenti Space3D</p>
                    <p className="text-xs text-slate-500">Prime 40 voci filtrate</p>
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
                    {space3DAnalyzerReport.components.slice(0, 40).map((component) => (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => selectMeshCard(component.id)}
                        className="w-full rounded-lg border border-violet-400/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-violet-300/40 hover:bg-violet-400/10"
                      >
                        <p className="text-xs font-bold text-white">{component.name}</p>
                        <p className="text-[11px] text-slate-500">{component.category} · {component.id}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-violet-400/15 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">Materiali Space3D</p>
                    <p className="text-xs text-slate-500">Prime 40 voci</p>
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
                    {(space3DAnalyzerReport?.materials || []).slice(0, 40).map((material) => (
                      <div key={material.id} className="rounded-lg border border-violet-400/10 bg-white/[0.03] px-3 py-2">
                        <p className="text-xs font-bold text-white">{material.name}</p>
                        <p className="text-[11px] text-slate-500">{material.category} · {material.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!space3DAnalyzerReport}
                onClick={downloadSpace3DAnalyzerReport}
                className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Scarica report S3D
              </button>
              <button
                type="button"
                disabled={!space3DAnalyzerReport}
                data-bagastudio-action="generate-product-package"
                onClick={buildSpace3DProductPackageDraft}
                className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Genera Product Package draft
              </button>
              <button
                type="button"
                disabled={!space3DAnalyzerReport}
                data-bagastudio-action="detect-missing-parts"
                onClick={detectMissingSpace3DParts}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Rileva parti mancanti
              </button>
              <button
                type="button"
                disabled={geometryCompletionReport.missingParts.length === 0}
                data-bagastudio-action="apply-placeholder-metadata"
                onClick={applyMissingPartsAsPlaceholders}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Aggiungi placeholder metadata
              </button>
            </div>

            {geometryCompletionReport.status === "ready" && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-50">
                <p className="font-black uppercase tracking-[0.2em] text-amber-200">Geometry Completion V1</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">DAE mesh: {geometryCompletionReport.daeMeshCount}</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">S3D componenti: {geometryCompletionReport.s3dComponentCount}</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">Match stimati: {geometryCompletionReport.matchedCount}</div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-2">Mancanti: {geometryCompletionReport.missingCount}</div>
                </div>
                {geometryCompletionReport.missingParts.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
                    {geometryCompletionReport.missingParts.slice(0, 12).map((part) => (
                      <p key={part.meshName} className="truncate text-[11px] text-amber-100">
                        {part.displayName} · {part.category} · {part.partId}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => setModelRotationY(0)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 0°
  </button>

  <button
    type="button"
    onClick={() => setModelRotationY(Math.PI / 2)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 90°
  </button>

  <button
    type="button"
    onClick={() => setModelRotationY(Math.PI)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 180°
  </button>

  <button
    type="button"
    onClick={() => setModelRotationY((Math.PI * 3) / 2)}
    className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
  >
    {adminT.rotation} 270°
  </button>
</div>
        
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">CSV ↔ CIX Matcher V1</p>
                  <h3 className="mt-1 text-lg font-black text-white">Dati produzione Space3D</h3>
                  <p className="mt-1 text-xs text-slate-400">{csvCixStatus}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyAutoMappingEngineV2}
                    disabled={!csvCixMatcherReport}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Applica Auto Mapping V2
                  </button>

                  <button
                    type="button"
                    onClick={restoreAutoMappingEngineV2Snapshot}
                    disabled={!autoMappingV2LastSnapshot}
                    className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ripristina Auto Mapping
                  </button>

                  <button
                    type="button"
                    onClick={downloadAutoMappingEngineV2Report}
                    disabled={!autoMappingV2Report}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Scarica report Auto Mapping
                  </button>

                  <button
                    type="button"
                    onClick={downloadAutoMappingEngineV2ReviewQueue}
                    disabled={!autoMappingV2Report}
                    className="rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Scarica Review Queue
                  </button>

                  <button
                    type="button"
                    onClick={downloadCsvCixMatcherReport}
                    disabled={!csvCixMatcherReport}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Scarica report CSV/CIX
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">CSV</p>
                  <p className="mt-1 break-all text-sm font-bold text-white">{space3DCsvFileName || "Nessun CSV"}</p>
                  <p className="mt-2 text-xs text-emerald-200">{space3DCsvParts.length} pezzi letti</p>
                </div>

                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">CIX</p>
                  <p className="mt-1 text-sm font-bold text-white">{space3DCixFileNames.length} file caricati</p>
                  <p className="mt-2 text-xs text-emerald-200">{space3DCixParts.length} pezzi CNC letti</p>
                </div>

                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">Match</p>
                  <p className="mt-1 text-2xl font-black text-white">{csvCixMatcherReport?.matchedParts ?? 0}/{csvCixMatcherReport?.totalCsvParts ?? 0}</p>
                  <p className="mt-2 text-xs text-emerald-200">CSV collegati a CIX</p>
                </div>

                <div className="rounded-xl border border-emerald-400/15 bg-black/25 p-3">
                  <p className="text-xs text-slate-500">Confidenza media</p>
                  <p className="mt-1 text-2xl font-black text-white">{csvCixMatcherReport?.averageConfidence ?? 0}%</p>
                  <p className="mt-2 text-xs text-emerald-200">Matching V1</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] p-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Auto Mapping Engine V2</p>
                    <p className="mt-1 text-xs text-slate-300">{autoMappingV2Status}</p>
                  </div>
                  {autoMappingV2Report && (
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Applicati {autoMappingV2Report.appliedMatches}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Placeholder {autoMappingV2Report.createdPlaceholders}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Eleggibili {autoMappingV2Report.eligibleMatches}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Saltati {autoMappingV2Report.skippedLowConfidence}</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Qualità {autoMappingV2Report.qualityScore}/100</span>
                      <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Gate {autoMappingV2Report.qualityLevel}</span>
                      <span className="rounded-full border border-violet-300/20 bg-black/20 px-3 py-2 text-center text-violet-100">Review {getAutoMappingEngineV2ReviewSummary().reviewed}/{getAutoMappingEngineV2ReviewSummary().total}</span>
                      <span className="rounded-full border border-violet-300/20 bg-black/20 px-3 py-2 text-center text-violet-100">Pending {getAutoMappingEngineV2ReviewSummary().pending}</span>
                    </div>
                  )}
                </div>

                {autoMappingV2Report && (
                  <div className="mt-3 grid gap-3 text-xs lg:grid-cols-2">
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Componenti aggiornati</p>
                      <p className="mt-2 text-slate-300">
                        {autoMappingV2Report.updatedComponents.length > 0
                          ? autoMappingV2Report.updatedComponents.slice(0, 10).join(", ")
                          : "Nessun componente geometrico aggiornato direttamente."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Placeholder metadata</p>
                      <p className="mt-2 text-slate-300">
                        {autoMappingV2Report.placeholderComponents.length > 0
                          ? autoMappingV2Report.placeholderComponents.slice(0, 10).join(", ")
                          : "Nessun placeholder creato."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Azioni consigliate</p>
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {autoMappingV2Report.recommendedActions.slice(0, 4).map((action) => (
                          <li key={action}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
                      <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Match da verificare</p>
                      <p className="mt-2 text-slate-300">
                        {autoMappingV2Report.riskyMatches.length > 0
                          ? autoMappingV2Report.riskyMatches.slice(0, 6).join(", ")
                          : "Nessun match ambiguo rilevato sopra soglia."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3 lg:col-span-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black uppercase tracking-[0.14em] text-cyan-200">Review Queue V2.4</p>
                          <p className="mt-1 text-slate-400">
                            Verificati {getAutoMappingEngineV2ReviewSummary().reviewed}/{getAutoMappingEngineV2ReviewSummary().total} · Critici pending {getAutoMappingEngineV2ReviewSummary().criticalPending} · Warning pending {getAutoMappingEngineV2ReviewSummary().warningPending}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={markAllAutoMappingEngineV2ReviewItemsReviewed}
                            className="rounded-lg border border-violet-300/30 bg-violet-400/10 px-3 py-2 text-[11px] font-black text-violet-100 transition hover:bg-violet-400/20"
                          >
                            Segna tutto verificato
                          </button>
                          <button
                            type="button"
                            onClick={resetAutoMappingEngineV2ReviewActions}
                            className="rounded-lg border border-slate-300/20 bg-white/[0.04] px-3 py-2 text-[11px] font-black text-slate-200 transition hover:bg-white/[0.08]"
                          >
                            Reset review
                          </button>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-2 text-slate-300">
                        {autoMappingV2Report.reviewQueue.slice(0, 8).map((item, index) => {
                          const reviewKey = buildAutoMappingEngineV2ReviewKey(item, index);
                          const reviewed = Boolean(autoMappingV2ReviewedLabels[reviewKey]);

                          return (
                            <li key={reviewKey} className="rounded-lg border border-white/10 bg-black/20 p-2">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <span className="font-bold text-cyan-100">[{item.severity}] {item.label}</span>
                                  <span className="block text-slate-400">{item.reason}</span>
                                  <span className="block text-slate-300">{item.suggestedAction}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleAutoMappingEngineV2ReviewItem(item, index)}
                                  className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-black transition ${
                                    reviewed
                                      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20"
                                      : "border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                                  }`}
                                >
                                  {reviewed ? "Verificato" : "Da verificare"}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {csvCixMatcherReport && (
                <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-emerald-400/10 bg-black/20">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#06111d] text-emerald-200">
                      <tr>
                        <th className="px-3 py-2">CSV</th>
                        <th className="px-3 py-2">CIX</th>
                        <th className="px-3 py-2">Conf.</th>
                        <th className="px-3 py-2">Motivi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvCixMatcherReport.matches.slice(0, 30).map((match) => (
                        <tr key={`${match.csvPart.rowIndex}-${match.csvPart.name}`} className="border-t border-white/5 text-slate-300">
                          <td className="px-3 py-2">{match.csvPart.name}</td>
                          <td className="px-3 py-2">{match.cixPart?.fileName || "—"}</td>
                          <td className="px-3 py-2 font-bold text-white">{match.confidence}%</td>
                          <td className="px-3 py-2">{match.reasons.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

</section>
<section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
  <h2 className="text-xl font-semibold mb-4">
    {adminT.preview3d}
  </h2>

  <div className="h-[600px] overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[#030a12] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
    <Canvas
  camera={{ position: [4, 3, 6], fov: 45 }}
  style={{ background: "linear-gradient(180deg, #07111c 0%, #02070d 100%)" }}
>
  <ambientLight intensity={3} />
<directionalLight position={[5, 8, 5]} intensity={4} />
<directionalLight position={[-5, 3, -5]} intensity={2} />

  <gridHelper args={[10, 10]} />
  <axesHelper args={[3]} />

 <OrbitControls target={[0, 1.2, 0]} />

  {modelPreviewUrl ? (
 <AdminModelRouter
  url={modelPreviewUrl}
  fileName={modelFileName}
  selectedMeshName={selectedMeshName}
  onSelectMesh={(meshName) => {
    selectMeshCard(meshName);
  }}
  modelRotationY={modelRotationY}
/>
) : (
  <Html center>
    <div className="rounded-2xl border border-violet-400/30 bg-slate-950/90 px-5 py-4 text-center text-xs text-slate-200 shadow-2xl">
      <p className="font-black text-violet-200">Preview 3D non disponibile</p>
      <p className="mt-1 max-w-[260px] text-slate-400">Il file .s3d è stato analizzato come metadata. Serve conversione geometria reale prima del preview Viewer.</p>
    </div>
  </Html>
)}
</Canvas>
  </div>
</section>
        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {adminT.mapping}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {filteredMapperMeshes.length} / {meshList.length} componenti visibili
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_auto]">
              <input
                value={mapperSearch}
                onChange={(event) => setMapperSearch(event.target.value)}
                placeholder="Cerca mesh, nome o categoria"
                className="rounded-xl border border-cyan-400/20 bg-[#02070d] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />

              <select
                value={mapperCategoryFilter}
                onChange={(event) => setMapperCategoryFilter(event.target.value)}
                className="rounded-xl border border-cyan-400/20 bg-[#02070d] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
              >
                <option value="all">Tutte le categorie</option>
                {mapperCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setMapperSearch("");
                  setMapperCategoryFilter("all");
                }}
                className="rounded-xl border border-cyan-400/20 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
              >
                Reset
              </button>
            </div>
          </div>

          {selectedMapperMesh && (
            <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Componente selezionato</p>
                  <h3 className="mt-1 text-lg font-black text-white">{selectedMapperMesh.displayName}</h3>
                  <p className="mt-1 break-all font-mono text-xs text-cyan-100">{selectedMapperMesh.meshName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">{selectedMapperMesh.category}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">{selectedMapperMesh.materialSlots || "main"}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">LED {selectedMapperMesh.compatibleLed ? "ON" : "OFF"}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-black/20 px-3 py-2 text-center text-cyan-100">Inserto {selectedMapperMesh.compatibleInsert ? "ON" : "OFF"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-cyan-400/15 bg-black/30 p-4">
  {meshList.length === 0 ? (
    <p className="text-slate-400">
      {adminT.emptyMesh}
    </p>
  ) : filteredMapperMeshes.length === 0 ? (
    <p className="text-slate-400">
      Nessun componente trovato con i filtri attuali.
    </p>
  ) : (
    <div className="space-y-4">
      {groupedMapperMeshes.map(([category, items]) => (
        <div key={category} className="rounded-2xl border border-cyan-400/10 bg-white/[0.02] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-200">
              {category}
            </span>
            <span className="text-xs text-slate-500">
              {items.length} componenti
            </span>
          </div>

          <div className="space-y-2">
            {items.map(({ mesh, index }) => (
 <div
  key={index}
  ref={(el) => {
    meshCardRefs.current[mesh.meshName] = el;
  }}
  onClick={() => {
    selectMeshCard(mesh.meshName);
  }}
  className={`rounded-lg border p-3 space-y-2 ${
    selectedMeshName === mesh.meshName
      ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-sky-500/10"
      : "border-cyan-400/20"
  }`}
>
    {meshThumbnails[mesh.meshName] && (
  <img
    src={meshThumbnails[mesh.meshName]}
    alt={mesh.displayName}
    className="mb-2 h-20 w-full rounded-lg border border-cyan-400/20 object-contain bg-neutral-950"
  />
)}

<div className="flex items-center justify-between gap-3 text-xs text-slate-500">
  <span>Mesh: {mesh.meshName}</span>
  {selectedMeshName === mesh.meshName && (
    <span className="rounded-full border border-cyan-300/40 bg-cyan-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">
      Selezionato
    </span>
  )}
</div>

    <input
  ref={(el) => {
    meshInputRefs.current[mesh.meshName] = el;
  }}
  value={mesh.displayName}
      onChange={(e) => {
        const nextDisplayName = e.target.value;
        updateMeshConfig(mesh.meshName, {
          displayName: nextDisplayName,
          category: mesh.category || guessComponentCategory(nextDisplayName),
        });
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />

    <div className="grid grid-cols-2 gap-3 mt-3">
      <div>
        <label className="text-xs text-slate-400">{adminT.componentCategory}</label>
        <select
          value={mesh.category || "component"}
          onChange={(e) => {
            updateMeshConfig(mesh.meshName, { category: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
        >
          <option value="panel">Panel</option>
          <option value="front">Front</option>
          <option value="top">Top</option>
          <option value="side">Side</option>
          <option value="back">Back</option>
          <option value="drawer">Drawer</option>
          <option value="door">Door</option>
          <option value="shelf">Shelf</option>
          <option value="mirror">Mirror</option>
          <option value="hardware">Hardware</option>
          <option value="lighting">Lighting</option>
          <option value="insert">Insert</option>
          <option value="component">Component</option>
        </select>
      </div>

      <label className="mt-6 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mesh.supportsAccessories !== false}
          onChange={(e) => {
            updateMeshConfig(mesh.meshName, { supportsAccessories: e.target.checked });
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {adminT.supportsAccessories}
      </label>
    </div>

    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.selectable}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { selectable: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.selectable}
  </label>

  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.visible}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { visible: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.visible}
  </label>

  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.compatibleLed}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { compatibleLed: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.ledCompatible}
  </label>

  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={mesh.compatibleInsert}
  onChange={(e) => {
    updateMeshConfig(mesh.meshName, { compatibleInsert: e.target.checked });
  }}
  onClick={(e) => e.stopPropagation()}
/>
    {adminT.insertCompatible}
  </label>
</div>
{mesh.compatibleLed && (
  <div className="grid grid-cols-4 gap-3 mt-3">
    <div>
      <label className="text-xs text-slate-400">{adminT.ledPosition}</label>
      <select
        value={mesh.ledPosition}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledPosition: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      >
        <option value="front">Front</option>
        <option value="top">Top</option>
        <option value="side">Side</option>
      </select>
    </div>

    <div>
      <label className="text-xs text-slate-400">{adminT.ledFrontOffset}</label>
      <input
        type="number"
        value={mesh.ledFrontOffset}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledFrontOffset: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      />
    </div>

    <div>
      <label className="text-xs text-slate-400">{adminT.ledSideMargin}</label>
      <input
        type="number"
        value={mesh.ledSideMargin}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledSideMargin: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      />
    </div>

    <div>
      <label className="text-xs text-slate-400">{adminT.ledYOffset}</label>
      <input
        type="number"
        value={mesh.ledYOffset}
        onChange={(e) => {
          updateMeshConfig(mesh.meshName, { ledYOffset: e.target.value });
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
      />
    </div>
  </div>
)}
<div className="grid grid-cols-2 gap-3 mt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.materialSlots}</label>
    <input
      value={mesh.materialSlots}
      onChange={(e) => {
        updateMeshConfig(mesh.meshName, { materialSlots: e.target.value });
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder="main, top, frontale"
      className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.compatibleAccessories}</label>
    <input
      value={mesh.compatibleAccessories}
      onChange={(e) => {
        updateMeshConfig(mesh.meshName, { compatibleAccessories: e.target.value });
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder="led, inserto, maniglia"
      className="mt-1 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
  </div>
</div>

<div className="mt-3 rounded-xl border border-cyan-400/10 bg-black/20 p-3">
  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">Product Package V3 / Produzione</p>
  <div className="grid grid-cols-2 gap-3">
    <input
      value={mesh.panelThickness || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { panelThickness: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Spessore pannello es. 18.3"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.assemblyOrder || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { assemblyOrder: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Ordine montaggio"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.hardware || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { hardware: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Ferramenta es. cerniera, vite, basetta"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.materialCode || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { materialCode: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder="Codice materiale es. BAROK / NERO / ANGEL_WHITE"
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
    <input
      value={mesh.dimensions || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { dimensions: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder='Dimensioni JSON es. {"width":600,"height":720,"depth":18.3}'
      className="rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
    />
  </div>
  <textarea
    value={mesh.edgeBanding || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { edgeBanding: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Bordatura JSON es. {"top":"ABS 1mm","bottom":"ABS 1mm","left":"ABS 1mm","right":"ABS 1mm"}'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />
  <textarea
    value={mesh.technicalPoints || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { technicalPoints: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Punti tecnici JSON: prese, scarichi, fori, passacavi'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />
  <textarea
    value={mesh.drillings || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { drillings: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Forature JSON future da CSV/CIX'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />
  <textarea
    value={mesh.manufacturingData || ""}
    onChange={(e) => updateMeshConfig(mesh.meshName, { manufacturingData: e.target.value })}
    onClick={(e) => e.stopPropagation()}
    placeholder='Manufacturing data JSON per Parametric Edit / CSV regeneration'
    className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white text-sm"
  />

  <div className="mt-3 rounded-xl border border-amber-400/10 bg-amber-400/5 p-3">
    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">Hardware Analyzer V1 / Constraints</p>
    <div className="grid grid-cols-2 gap-3">
      <select
        value={mesh.constraintRole || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { constraintRole: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      >
        <option value="">Auto constraint role</option>
        <option value="STRUCTURAL">STRUCTURAL</option>
        <option value="DERIVED">DERIVED</option>
        <option value="ACCESSORY">ACCESSORY</option>
        <option value="HARDWARE">HARDWARE</option>
        <option value="UNKNOWN">UNKNOWN</option>
      </select>
      <input
        value={mesh.dependencyParents || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { dependencyParents: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Parents dependencyGraph es. fianco_sx"
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      />
      <input
        value={mesh.dependencyChildren || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { dependencyChildren: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Children dependencyGraph es. ripiano_1, cassetto_1"
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      />
      <input
        value={mesh.hardwareLinks || ""}
        onChange={(e) => updateMeshConfig(mesh.meshName, { hardwareLinks: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder='Hardware links JSON o vuoto'
        className="rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
      />
    </div>
    <textarea
      value={mesh.drillingLinks || ""}
      onChange={(e) => updateMeshConfig(mesh.meshName, { drillingLinks: e.target.value })}
      onClick={(e) => e.stopPropagation()}
      placeholder='Drilling links JSON parametrico: x=leftEdge+32, z=thickness/2'
      className="mt-3 min-h-20 w-full rounded-lg bg-[#02070d] border border-amber-400/20 px-3 py-2 text-white text-sm"
    />
  </div>
</div>
  </div>
))}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
        </section>

        <section className="rounded-[28px] border border-cyan-400/15 bg-[#06111d]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-4">
            {adminT.generatePackage}
          </h2>
<div className="space-y-3 rounded-xl border border-cyan-400/20 p-4">
  <h3 className="text-sm font-semibold text-white">{adminT.productInfo}</h3>

  <input
    type="text"
    value={productId}
    onChange={(e) => setProductId(e.target.value)}
    placeholder={adminT.productId}
    className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
  />

  <input
    type="text"
    value={productName}
    onChange={(e) => setProductName(e.target.value)}
    placeholder={adminT.productName}
    className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
  />

  <input
    type="text"
    value={productCategory}
    onChange={(e) => setProductCategory(e.target.value)}
    placeholder={adminT.category}
    className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
  />

  <div className="grid grid-cols-2 gap-3">
    <input
      type="text"
      value={productBrand}
      onChange={(e) => setProductBrand(e.target.value)}
      placeholder="Brand"
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />

    <input
      type="text"
      value={packageVersion}
      onChange={(e) => setPackageVersion(e.target.value)}
      placeholder="Package version"
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
  <div className="grid grid-cols-3 gap-3 pt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.widthMin}</label>
    <input
      type="number"
      value={widthMin}
      onChange={(e) => setWidthMin(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.widthDefault}</label>
    <input
      type="number"
      value={widthDefault}
      onChange={(e) => setWidthDefault(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.widthMax}</label>
    <input
      type="number"
      value={widthMax}
      onChange={(e) => setWidthMax(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
</div>
<div className="grid grid-cols-3 gap-3 pt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.heightMin}</label>
    <input
      type="number"
      value={heightMin}
      onChange={(e) => setHeightMin(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.heightDefault}</label>
    <input
      type="number"
      value={heightDefault}
      onChange={(e) => setHeightDefault(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.heightMax}</label>
    <input
      type="number"
      value={heightMax}
      onChange={(e) => setHeightMax(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
  </div>
<div className="grid grid-cols-3 gap-3 pt-3">
  <div>
    <label className="text-xs text-slate-400">{adminT.depthMin}</label>
    <input
      type="number"
      value={depthMin}
      onChange={(e) => setDepthMin(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.depthDefault}</label>
    <input
      type="number"
      value={depthDefault}
      onChange={(e) => setDepthDefault(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-400">{adminT.depthMax}</label>
    <input
      type="number"
      value={depthMax}
      onChange={(e) => setDepthMax(Number(e.target.value))}
      className="w-full rounded-lg bg-[#02070d] border border-cyan-400/20 px-3 py-2 text-white"
    />
  </div>
</div>
</div>
          <button
  onClick={() => {
    const jsonString = buildCurrentProductPackageJson();

    setGeneratedJson(jsonString);
    downloadJsonFile("product-package.json", jsonString);
  }}
  className="rounded-2xl bg-cyan-500 px-5 py-3 font-black text-white shadow-[0_0_28px_rgba(14,165,233,0.28)] transition hover:bg-cyan-400"
>
  {adminT.generateJson}
</button>
{generatedJson && (
  <pre className="mt-4 max-h-[400px] overflow-auto rounded-2xl border border-cyan-400/15 bg-black/30 p-4 text-xs text-green-300">
    {generatedJson}
  </pre>
)}
 </section>
          </div>
        </div>
      </div>
    
      {/* bagastudio-admin-back-to-top-safe-v2 */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        className="fixed bottom-5 right-5 z-[9999] rounded-full border border-cyan-300/30 bg-slate-950/95 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 shadow-2xl shadow-black/50 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-cyan-400/20"
        aria-label="Torna su"
      >
        ↑ Su
      </button>
</main>
);
}
