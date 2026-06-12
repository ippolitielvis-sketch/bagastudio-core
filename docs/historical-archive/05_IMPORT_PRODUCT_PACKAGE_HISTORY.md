# 05 - Import / Product Package History

## Milestone - Import multi-formato come esigenza originaria

# Contesto
La pipeline asset viene citata quando BagaStudio Core supera il prototipo: import STL, divisione in Blender, esportazione GLB e supporto futuro GLB/GLTF/OBJ/FBX/STL, con conversioni DAE/3DS/STEP/STP/IGES/IFC verso GLB.

# Problema
I pezzi importati potevano vedersi male e un file 3D grezzo non bastava per materiali, BOM e produzione.

# Decisione
Stabilizzare il loader prima di aggiungere funzioni nuove e progettare import multi-formato.

# Motivazione
Tutto il valore successivo dipende da import affidabile: selezione, materiali, collisioni, pricing e factory.

# Implementazione
Da verificare. Le conversazioni guidano verso ricerca di `GLTFLoader`, `loader.load`, `scene.add` e punti di caricamento Three.js.

# Evoluzione
Il tema diventa Importer Pipeline V2 DAE, poi S3D Product Package V2.

# Impatto
Import diventa fondazione del Core.

# Regole permanenti nate
Prima stabilizzare caricamento e scala; poi funzioni.

# Collegamenti con altri Engine
Viewer, Product Package, Recognition, BOM.

# Conversazioni utilizzate
- `Riprendere BagaStudio Core` (`conversations-003.json`)
- `Ripresa Viewer3D Multi-Loader` (`conversations-003.json`)

## Milestone - Importer Pipeline V2 DAE

# Contesto
La conversazione riparte da Importer Pipeline V2 - DAE Support e introduce anche la richiesta di trovare texture online e aggiungerle al programma.

# Problema
DAE porta geometrie e materiali, ma non garantisce texture complete, metadata runtime o coerenza di componenti.

# Decisione
Estendere la pipeline DAE e collegarla al Viewer. La parte texture online resta Da verificare.

# Motivazione
Import tecnico e resa visuale devono convergere.

# Implementazione
Da verificare. La conversazione non riporta il diff completo, ma colloca la funzione in BagaStudio Core e Viewer.

# Evoluzione
La pipeline DAE confluisce nel Product Package V2 e nella component list runtime.

# Impatto
DAE diventa sorgente per asset configurabili.

# Regole permanenti nate
Ogni import deve preservare compatibilita Viewer e preparare dati runtime.

# Collegamenti con altri Engine
Texture/Material Engine, Product Package, Viewer.

# Conversazioni utilizzate
- `Importer Pipeline V2 DAE` (`conversations-004.json`)

## Milestone - Product Package V2

# Contesto
La conversazione Product Package V2 dichiara S3D Import Runtime V1 funzionante, analyzer `.s3d`, DAE importer nel Viewer e component list runtime.

# Problema
Dopo import, il prodotto aveva bisogno di identita tecnica: parti, categorie, metadata e collegamento configuratore.

# Decisione
S3D Product Package V2 deve introdurre partId automatici, categorie componenti, metadata runtime, bridge Viewer/configuratore e preparazione geometria/runtime.

# Motivazione
Il Product Package rende il prodotto configurabile, prezzabile e producibile.

# Implementazione
Da verificare. La stessa conversazione registra un bug storico: texture applicate solo dopo aver selezionato o applicato texture al pezzo successivo.

# Evoluzione
La tappa prepara Auto Mapping Engine V2 e Imported Model Hierarchy V1.

# Impatto
Nasce il contratto tra import visuale e logica tecnica.

# Regole permanenti nate
Ogni parte deve avere identita; metadata runtime non devono rompere il Viewer.

# Collegamenti con altri Engine
Recognition, Pricing/BOM, Factory, Scene Composer.

# Conversazioni utilizzate
- `Aggiornamento S3D Product Package` (`conversations-004.json`)
- `BagaStudio Core V2` (`conversations-004.json`)
