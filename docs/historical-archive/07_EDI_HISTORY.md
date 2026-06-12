# 07 - EDI History

## Milestone - Motori cognitivi EDI

# Contesto
La conversazione EDI Animated Core elenca motori dichiarati validati: Knowledge Coverage, Dependency Graph, Reasoning, Analysis Panel, Natural Reasoning, Natural Language, Cognitive Memory, Decision e Planning.

# Problema
EDI doveva essere piu di un pannello; doveva avere continuita cognitiva e presenza in Home e Viewer.

# Decisione
Mantenere tutta la logica EDI esistente e intervenire prima solo su posizione/visual del launcher.

# Motivazione
Le logiche EDI erano considerate checkpoint stabile; modificarle durante una fase visuale avrebbe creato regressioni.

# Implementazione
Da verificare. Vengono dichiarati EDI disponibile in Home, pulsante Home funzionante, reset su scena vuota e overlay separato dal Canvas.

# Evoluzione
La fase successiva non e cognitiva ma visuale: EDI deve diventare entita viva.

# Impatto
Nasce separazione tra EDI logic ed EDI visual.

# Regole permanenti nate
Non modificare logica EDI durante interventi visual/UX.

# Collegamenti con altri Engine
Home, Viewer, Analysis Panel, Visual Engine.

# Conversazioni utilizzate
- `EDI Animated Core` (`conversations-005.json`)

## Milestone - Dock relocation e sfera viva

# Contesto
L'immagine ufficiale con sfera energetica e strumenti diventa reference artistica, non asset statico.

# Problema
Il launcher statico e la posizione vicino alla bussola non comunicavano ruolo e presenza di EDI.

# Decisione
Spostare il launcher vicino a Focus/Fit/Reset e sostituirlo con EdiAnimatedCoreV1.

# Motivazione
EDI deve apparire come nucleo vivo vicino ai controlli operativi del Viewer.

# Implementazione
Da verificare. Prompt richiesto: componente separato `EdiAnimatedCoreV1.tsx`, plasma interno, bagliore, orbite, particelle e stati Idle/Thinking/Analyzing/Suggestion/Warning/Success.

# Evoluzione
La conversazione precisa che la direzione non e un riquadro o scheda: deve restare solo la sfera.

# Impatto
EDI visual diventa dominio autonomo.

# Regole permanenti nate
Solo UI/visual; non toccare Viewer, camera, import, collisioni, join o selection.

# Collegamenti con altri Engine
Viewer controls, Home, EDI Render Engine V2.

# Conversazioni utilizzate
- `EDI Animated Core` (`conversations-005.json`)

## Milestone - EDI Render Engine V2

# Contesto
Dopo il primo animated core, la conversazione dichiara checkpoint EDI Render Engine V2 Foundation con RFC completate.

# Problema
Il renderer SVG non basta per la direzione visuale richiesta.

# Decisione
Non evolvere piu il renderer SVG. SVG resta EDI Visual Prototype V1; sviluppo futuro solo su EDI Render Engine V2.

# Motivazione
Serve pipeline GPU dedicata, scalabile e modulare.

# Implementazione
Da verificare. Sono citati Three.js 0.184.0, React Three Fiber, ShaderMaterial, WebGLRenderer, EffectComposer, UnrealBloomPass, Preview Panel e Shader Pipeline.

# Evoluzione
RFC-1102 Shader Laboratory prepara Heart Shader, Plasma Shader, Magnetic Distortion, Particle Physics, Volumetric Glow, Thought Pulse e Speaking Pulse.

# Impatto
EDI diventa motore grafico indipendente.

# Regole permanenti nate
Una RFC alla volta; non contaminare Viewer/Home/Launcher/SVG Prototype.

# Collegamenti con altri Engine
EDI Cognitive, Shader Laboratory, Visual State Animator.

# Conversazioni utilizzate
- `BagaStudio Shader Laboratory` (`conversations-005.json`)
