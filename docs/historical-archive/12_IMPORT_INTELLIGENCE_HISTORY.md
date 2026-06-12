# 12 - Import Intelligence History

## Milestone - Import Intelligence

# Contesto
Import Intelligence nasce dalla necessita di portare dentro BagaStudio asset reali e non sempre puliti: STL, GLB, GLTF, OBJ, FBX, DAE, S3D e formati futuri.

# Problema
Un import visuale non basta. Senza normalizzazione, component list, texture coerenti e metadata, il modello resta opaco.

# Decisione
Costruire una pipeline DAE/S3D con runtime import, analyzer, component list e preparazione verso Product Package.

# Motivazione
BagaStudio deve trasformare asset esterni in entita lavorabili dal Viewer e dagli engine successivi.

# Implementazione
Da verificare. Sono citati Importer Pipeline V2 DAE, S3D Import Runtime V1, analyzer `.s3d`, DAE importer nel Viewer e component list runtime.

# Evoluzione
Import Intelligence si salda con Recognition Intelligence: il sistema deve riconoscere moduli e parti, non solo caricarli.

# Impatto
Import diventa inizio della catena tecnica che alimenta materiali, collisioni, BOM e pricing.

# Regole permanenti nate
- Preservare Viewer durante import.
- Aggiungere dati in modo non distruttivo.
- Mantenere modello importato manipolabile.

# Collegamenti con altri Engine
Viewer Recovery, Product Package, Recognition, Material/Texture, Pricing/BOM.

# Conversazioni utilizzate
- `Riprendere BagaStudio Core` (`conversations-003.json`)
- `Importer Pipeline V2 DAE` (`conversations-004.json`)
- `Aggiornamento S3D Product Package` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)
