# 31 - Duplication Report

## Scopo

Validare duplicazioni, contraddizioni e ripetizioni nell'Historical Archive.

## Risultati automatici principali

- Link Markdown rotti: 0.
- Titoli conversazione citati e non trovati nei JSON: 0, esclusi alias estesi dei checkpoint omonimi usati per chiarezza.
- Duplicazioni milestone esatte rilevate: 1.
- Contraddizioni bloccanti rilevate: 0.

## Duplicazioni controllate

### Product Package V2

- Presente in [05_IMPORT_PRODUCT_PACKAGE_HISTORY.md](05_IMPORT_PRODUCT_PACKAGE_HISTORY.md).
- Presente in [14_PRODUCT_PACKAGE_HISTORY.md](14_PRODUCT_PACKAGE_HISTORY.md).

Valutazione: duplicazione controllata e accettabile.

Motivo:
- [05](05_IMPORT_PRODUCT_PACKAGE_HISTORY.md) tratta Product Package nel flusso Import / Product Package.
- [14](14_PRODUCT_PACKAGE_HISTORY.md) lo tratta come capitolo engine dedicato.

Rischio: basso. La duplicazione aiuta la navigazione, ma in futuro potrebbe generare divergenze se un documento viene aggiornato e l'altro no.

## Duplicazioni semantiche non critiche

| Tema | Documenti | Valutazione |
|---|---|---|
| Viewer Recovery | [04](04_VIEWER_HISTORY.md), [11](11_VIEWER_RECOVERY_FOUNDATION.md), [18](18_PERMANENT_DESIGN_PRINCIPLES.md) | Accettabile: storia, fondazione, principio |
| EDI Render Engine V2 | [07](07_EDI_HISTORY.md), [16](16_EDI_VISUAL_ENGINE_HISTORY.md), [24](24_RFC_ORIGIN_MAP.md) | Accettabile: storia, engine, RFC |
| Imported Model Hierarchy V1 | [13](13_RECOGNITION_INTELLIGENCE_HISTORY.md), [18](18_PERMANENT_DESIGN_PRINCIPLES.md), [24](24_RFC_ORIGIN_MAP.md) | Accettabile: engine, principio, origine |
| Conservazione / Merge Safe | [02](02_DECISION_LOG.md), [18](18_PERMANENT_DESIGN_PRINCIPLES.md), [25](25_HISTORICAL_GLOSSARY.md) | Accettabile: decisione, principio, glossario |
| Scene Composer / Collision / Join | [06](06_SCENE_COMPOSER_COLLISION_JOIN_HISTORY.md), [20](20_ENGINE_RELATIONSHIP_MAP.md), [22](22_ENGINE_DEPENDENCIES.md) | Accettabile: storia, mappa, dipendenze |

## Decisioni duplicate

Non sono state rilevate decisioni duplicate in conflitto. Le decisioni ricorrenti sono ripetute con funzione diversa:

- come decisione storica in [02_DECISION_LOG.md](02_DECISION_LOG.md);
- come matrice in [21_DECISION_TO_ENGINE_MATRIX.md](21_DECISION_TO_ENGINE_MATRIX.md);
- come principio in [18_PERMANENT_DESIGN_PRINCIPLES.md](18_PERMANENT_DESIGN_PRINCIPLES.md);
- come termine in [25_HISTORICAL_GLOSSARY.md](25_HISTORICAL_GLOSSARY.md).

## RFC duplicate

Non sono state rilevate RFC duplicate in conflitto.

RFC EDI sono elencate in:
- [16_EDI_VISUAL_ENGINE_HISTORY.md](16_EDI_VISUAL_ENGINE_HISTORY.md);
- [24_RFC_ORIGIN_MAP.md](24_RFC_ORIGIN_MAP.md);
- [26_MASTER_INDEX.md](26_MASTER_INDEX.md).

Valutazione: duplicazione intenzionale e utile alla navigazione.

## Glossario incompleto

Il glossario e buono ma non esaustivo. Termini candidati per ampliamento futuro:

- Hardware Analyzer;
- Manufacturing Constraints;
- Constraint Engine;
- Smart Technical Validator;
- Auto Mapping Engine V2;
- CSV/CIX Matcher;
- Empty Room Premium;
- RoomEnvironment;
- Visual State Animator;
- EdiCoreRenderer.

## Timeline incoerente

Non sono state rilevate incoerenze cronologiche bloccanti. La timeline usa raggruppamenti per periodo, non ogni singola conversazione giornaliera.

Rischio residuo: alcune conversazioni con lo stesso titolo `Ripresa BagaStudio Core` richiedono alias descrittivi per distinguere i checkpoint. Questo e stato gestito nei documenti con suffissi esplicativi.

## Contraddizioni

Nessuna contraddizione architetturale bloccante rilevata.

Possibili tensioni non bloccanti:

- Phase 1 contiene ancora [01_EXECUTIVE_SUMMARY.md](01_EXECUTIVE_SUMMARY.md), mentre Phase 2/3 dichiarano che non e piu documento principale. Non e una contraddizione: e un documento storico mantenuto.
- Alcuni engine sono documentati come concettuali (`Reasoning Bridge`, `Module Registry`), mentre altri sono milestone operative. La distinzione e indicata in [22_ENGINE_DEPENDENCIES.md](22_ENGINE_DEPENDENCIES.md), [25_HISTORICAL_GLOSSARY.md](25_HISTORICAL_GLOSSARY.md) e [30_MISSING_KNOWLEDGE.md](30_MISSING_KNOWLEDGE.md).

## Giudizio duplicazioni

Le duplicazioni sono funzionali alla navigazione e non compromettono la certificazione. L'unica duplicazione da monitorare e `Product Package V2` tra capitolo combinato e capitolo dedicato.
