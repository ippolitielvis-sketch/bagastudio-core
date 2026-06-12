# 06 - Scene Composer / Collision / Join History

## Milestone - Dalla stanza al motore spaziale

# Contesto
RoomEnvironment, Ground Alignment, viste camera, Viewer Pad, Texture Quality e Scene Composer Foundation emergono nella roadmap ambiente.

# Problema
La stanza non e sfondo: contiene pareti, pavimento, moduli, DAE, porte/finestre, materiali e vincoli.

# Decisione
Trattare ambiente e scena come fondazione del Scene Composer.

# Motivazione
Un configuratore professionale deve comporre oggetti in spazio reale.

# Implementazione
Da verificare. Le conversazioni citano RoomEnvironment estratto, Room Materials V1 OK, Room Textures V1 OK, stanza opzionale e Empty Room Premium V32.

# Evoluzione
La stanza default ON prepara snap parete, collisioni e composizione.

# Impatto
La scena diventa dominio tecnico con regole.

# Regole permanenti nate
Non toccare Viewer/scaling/import quando si lavora solo su stanza.

# Collegamenti con altri Engine
Viewer, Material/Texture, Collision, Product Package.

# Conversazioni utilizzate
- `Configurazione Ambiente V1` (`conversations-004.json`)
- `Ripresa BagaStudio Core - RoomEnvironment Refactor` (`conversations-004.json`)
- `Prossimi passi V32` (`conversations-004.json`)

## Milestone - Collisione modulo-modulo e rollback

# Contesto
Il checkpoint Collision Engine/Giunzioni dichiara collisione modulo-modulo funzionante e DAE integrato nel motore collisioni esistente.

# Problema
I moduli non devono attraversarsi; il rollback deve essere coerente e l'utente deve ricevere feedback.

# Decisione
Usare collisione, rollback e toast come flusso operativo.

# Motivazione
Senza feedback, un blocco corretto sembra un bug. Senza rollback, la scena si corrompe.

# Implementazione
Da verificare. Sono citati `resolveSceneModuleCollisionV42`, `candidateStatus`, `previousTransform`, `moduleCollisionNoticeV42` e patch minime sul toast.

# Evoluzione
La collisione entra nella stessa linea del Join Assistant.

# Impatto
Il motore spaziale diventa base di Scene Composer.

# Regole permanenti nate
Non toccare Join Assistant validato per correggere solo toast collisione; patch minima.

# Collegamenti con altri Engine
Viewer, Imported Model Hierarchy, Join Assistant, Product Package.

# Conversazioni utilizzate
- `Fix trasformazione modulo` (`conversations-004.json`)
- `Stabilizzazione motore collisione` (`conversations-004.json`)

## Milestone - Join Assistant

# Contesto
Join Assistant appare come UI di relazione tra moduli.

# Problema
Una giunzione non e solo contatto geometrico: richiede posizione persistente, drag, chiusura e non interferenza con notice parete.

# Decisione
Stabilizzare Join Assistant con posizione persistente/trascinabile, chiusura automatica quando i moduli si separano e clamp drag finestra.

# Motivazione
Il join deve essere relazione guidata, non comportamento nascosto.

# Implementazione
Da verificare. Viene dichiarata rimozione del debug JOIN DIAGNOSTIC e fix del notice parete.

# Evoluzione
Join Assistant diventa parte del flusso Join/Collision/Rollback/Toast.

# Impatto
La composizione diventa assistita.

# Regole permanenti nate
Join Assistant validato non va modificato in patch non correlate.

# Collegamenti con altri Engine
Collision, Viewer, Recognition, Product Package.

# Conversazioni utilizzate
- `Stabilizzazione motore collisione` (`conversations-004.json`)
