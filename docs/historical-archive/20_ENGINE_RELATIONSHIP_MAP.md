# 20 - Engine Relationship Map

Questo documento mappa le relazioni tra gli Engine ricostruiti nell'Historical Archive. Usare insieme a [22_ENGINE_DEPENDENCIES.md](22_ENGINE_DEPENDENCIES.md), [21_DECISION_TO_ENGINE_MATRIX.md](21_DECISION_TO_ENGINE_MATRIX.md) e [26_MASTER_INDEX.md](26_MASTER_INDEX.md).

## Mappa generale degli Engine

```mermaid
graph TD
  Core[BagaStudio Core]
  Viewer[Viewer]
  Import[Import Intelligence]
  Recognition[Recognition]
  ImportedGraph[Imported Graph]
  ModuleRegistry[Module Registry]
  Selection[Selection]
  ProductPackage[Product Package]
  SceneComposer[Scene Composer]
  Collision[Collision]
  Join[Join Assistant]
  Pricing[Pricing]
  Factory[Factory]
  EDI[EDI]
  VisualEngine[Visual Engine]
  ReasoningBridge[Reasoning Bridge]
  Timeline[Timeline]
  Decisions[Decision Log]
  Roadmap[Roadmap]

  Core --> Viewer
  Core --> Import
  Core --> ProductPackage
  Core --> SceneComposer
  Core --> EDI

  Viewer --> Selection
  Viewer --> Import
  Viewer --> SceneComposer
  Viewer --> EDI

  Import --> ProductPackage
  Import --> Recognition
  Recognition --> ImportedGraph
  ImportedGraph --> ModuleRegistry
  ModuleRegistry --> Selection
  ProductPackage --> ModuleRegistry
  ProductPackage --> Pricing
  ProductPackage --> Factory

  Selection --> SceneComposer
  SceneComposer --> Collision
  SceneComposer --> Join
  Collision --> Join
  Join --> SceneComposer

  EDI --> ReasoningBridge
  EDI --> VisualEngine
  VisualEngine --> Viewer
  ReasoningBridge --> ProductPackage
  ReasoningBridge --> SceneComposer

  Decisions --> Roadmap
  Roadmap --> Timeline
  Timeline --> Core
```

## Pipeline tecnica principale

```mermaid
flowchart LR
  A[Import file 3D] --> B[Import Intelligence]
  B --> C[Product Package]
  C --> D[Recognition]
  D --> E[Imported Graph]
  E --> F[Module Registry]
  F --> G[Selection]
  G --> H[Scene Composer]
  H --> I[Collision]
  H --> J[Join Assistant]
  F --> K[Pricing]
  K --> L[Factory]
```

## Layer EDI

```mermaid
flowchart TD
  EDI[EDI Core] --> KC[Knowledge Coverage]
  EDI --> DG[Dependency Graph]
  EDI --> RE[Reasoning Engine]
  EDI --> NL[Natural Language]
  EDI --> MEM[Cognitive Memory]
  EDI --> DEC[Decision Engine]
  EDI --> PLAN[Planning Engine]
  EDI --> VIS[Visual Engine]
  VIS --> SVG[EDI Visual Prototype V1]
  VIS --> GPU[EDI Render Engine V2]
  GPU --> LAB[Shader Laboratory]
  LAB --> HEART[Heart Shader]
  LAB --> PLASMA[Plasma Shader]
  LAB --> PARTICLES[Particle Physics]
```

## Relazioni documentali

- Viewer: [04_VIEWER_HISTORY.md](04_VIEWER_HISTORY.md), [11_VIEWER_RECOVERY_FOUNDATION.md](11_VIEWER_RECOVERY_FOUNDATION.md)
- Import Intelligence: [05_IMPORT_PRODUCT_PACKAGE_HISTORY.md](05_IMPORT_PRODUCT_PACKAGE_HISTORY.md), [12_IMPORT_INTELLIGENCE_HISTORY.md](12_IMPORT_INTELLIGENCE_HISTORY.md)
- Recognition / Imported Graph: [13_RECOGNITION_INTELLIGENCE_HISTORY.md](13_RECOGNITION_INTELLIGENCE_HISTORY.md)
- Product Package: [14_PRODUCT_PACKAGE_HISTORY.md](14_PRODUCT_PACKAGE_HISTORY.md)
- Scene Composer / Collision / Join: [06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md)
- Pricing / Factory: [15_PRICING_FACTORY_HISTORY.md](15_PRICING_FACTORY_HISTORY.md)
- EDI / Visual Engine: [07_EDI_HISTORY.md](07_EDI_HISTORY.md), [16_EDI_VISUAL_ENGINE_HISTORY.md](16_EDI_VISUAL_ENGINE_HISTORY.md)
- Decisioni: [02_DECISION_LOG.md](02_DECISION_LOG.md)
- Timeline: [17_BAGASTUDIO_TIMELINE.md](17_BAGASTUDIO_TIMELINE.md)
- Roadmap: [03_ROADMAP_EXTRACTED.md](03_ROADMAP_EXTRACTED.md)
