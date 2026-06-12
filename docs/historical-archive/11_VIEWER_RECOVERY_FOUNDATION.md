# 11 - Viewer Recovery Foundation

## Milestone - Recovery DAE/Viewer

# Contesto
Viewer Recovery nasce quando BagaStudio deve ripartire da problemi reali: DAE non affidabili, camera instabile, drag e selezione da preservare.

# Problema
Il Viewer non poteva sostenere nuovi engine se import, camera, vista corrente, drag e selezione modello non erano stabili.

# Decisione
Stabilire Viewer Recovery come fondazione prima di Viewer UX Premium Finale e Imported Model Hierarchy V1.

# Motivazione
Ogni engine successivo dipende dal Viewer. Se la base 3D cambia stato autonomamente, import, collisioni e recognition diventano inattendibili.

# Implementazione
Da verificare. Checkpoint dichiarato: branch `recovery/dae-import-fix`, commit `5a45668be1cd0812517b8d8fef1207bf4db4e0b7`, camera preservata, vista corrente mantenuta, drag DAE funzionante, rotazione DAE con clamp nella stanza, selezione intero modello DAE, drag moduli parametrici invariato.

# Evoluzione
Dopo recovery, la roadmap passa a Imported Model Hierarchy V1 come step solo dati.

# Impatto
Il Viewer diventa contratto tecnico: tutti gli engine devono rispettarne gli invarianti.

# Regole permanenti nate
- Non modificare camera.
- Non modificare drag DAE.
- Non modificare import.
- Non modificare selezione se lo step riguarda solo dati.
- Test reale prima del modulo successivo.

# Collegamenti con altri Engine
Import Intelligence, Recognition Intelligence, Collision V43, Join Assistant, Scene Composer.

# Conversazioni utilizzate
- `Ripresa BagaStudio Core - Recovery DAE/Viewer` (`conversations-004.json`)
- `Ripresa Viewer UX` (`conversations-004.json`)
- `BagaStudio Core Step 1` (`conversations-004.json`)
