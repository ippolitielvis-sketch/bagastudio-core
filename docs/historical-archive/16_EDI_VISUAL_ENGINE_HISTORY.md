# 16 - EDI Visual Engine History

## Milestone - EDI Render Engine V2 e Shader Laboratory

# Contesto
Dopo EdiAnimatedCoreV1, la conversazione dichiara checkpoint EDI Render Engine V2 Foundation con RFC: EdiCoreRenderer, Visual State Animator, HeartCore + PlasmaEngine, Magnetic Field, Neural Thought Network, Preview Panel e Shader Pipeline.

# Problema
Il renderer SVG non e adeguato alla visione di EDI come entita viva e motore visuale evoluto.

# Decisione
Non evolvere piu SVG. Il renderer SVG resta EDI Visual Prototype V1; lo sviluppo continua su EDI Render Engine V2.

# Motivazione
Serve una pipeline GPU per shader, post-processing, particelle, glow volumetrico e stati cognitivi visivi.

# Implementazione
Da verificare. Technology audit: Three.js 0.184.0, React Three Fiber, ShaderMaterial, WebGLRenderer, EffectComposer e UnrealBloomPass disponibili. RFC-1102 trasforma `/edi-v2-preview` in Shader Laboratory.

# Evoluzione
Roadmap: Heart Shader, Plasma Shader, Magnetic Distortion, Particle Physics, Volumetric Glow, Thought Pulse, Speaking Pulse. La review cita pass separati: HeartPass, PlasmaPass, GlowPass, FieldPass, ParticlePass, CompositePass.

# Impatto
EDI Visual Engine diventa architettura GPU modulare, isolata da Viewer/Home/Launcher.

# Regole permanenti nate
- Una RFC alla volta.
- Non modificare Viewer/Home/Launcher.
- Non contaminare SVG Prototype V1.
- Checkpoint Git dopo validazione.

# Collegamenti con altri Engine
EDI Cognitive Engine, Shader Laboratory, Preview Panel, Visual State Animator.

# Conversazioni utilizzate
- `EDI Animated Core` (`conversations-005.json`)
- `BagaStudio Shader Laboratory` (`conversations-005.json`)
