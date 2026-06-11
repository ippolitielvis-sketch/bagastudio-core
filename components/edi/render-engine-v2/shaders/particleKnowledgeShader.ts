import { AdditiveBlending, ShaderMaterial } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_FBM } from "./glsl/fbm.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";

export const PARTICLE_KNOWLEDGE_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uIntensity: { value: 1 },
  uParticleDensity: { value: 1 },
  uParticleSpeed: { value: .28 },
  uParticleSize: { value: 4 },
  uParticleOpacity: { value: .65 },
  uParticleLife: { value: 1 },
  uKnowledgeFlow: { value: .72 },
  uNoiseScale: { value: 1 },
  uStateHint: { value: 0 },
};

export const createParticleKnowledgeShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: structuredClone(PARTICLE_KNOWLEDGE_SHADER_UNIFORMS),
  vertexShader: `
    attribute float aKnowledgePhase;
    varying float vKnowledgeLife;
    varying float vKnowledgeSignal;
    uniform float uTime;
    uniform float uParticleSpeed;
    uniform float uParticleSize;
    uniform float uParticleLife;
    uniform float uKnowledgeFlow;
    uniform float uNoiseScale;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}

    void main(){
      float cycle=fract(aKnowledgePhase+uTime*uParticleSpeed*.08);
      float birth=smoothstep(0.,.18*uParticleLife,cycle);
      float dissolve=1.-smoothstep(.68*uParticleLife,uParticleLife,cycle);
      vKnowledgeLife=birth*dissolve;
      vKnowledgeSignal=ediOrganicPulse(cycle*2.4+aKnowledgePhase)*uKnowledgeFlow;
      vec3 displaced=position;
      displaced.xy+=(ediFbm(vec2(aKnowledgePhase*uNoiseScale,uTime*.025))-.5)*.018*uKnowledgeFlow;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(displaced,1.);
      gl_PointSize=uParticleSize*(.72+vKnowledgeSignal*.28)*vKnowledgeLife;
    }`,
  fragmentShader: `
    varying float vKnowledgeLife;
    varying float vKnowledgeSignal;
    uniform float uIntensity;
    uniform float uParticleDensity;
    uniform float uParticleOpacity;
    uniform float uStateHint;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}

    void main(){
      vec2 point=gl_PointCoord-.5;
      float softPoint=1.-smoothstep(.08,.5,length(point));
      vec3 color=ediEnergyColor(.22+vKnowledgeSignal*.35+uStateHint*.06);
      float alpha=softPoint*vKnowledgeLife*uParticleOpacity*uParticleDensity*uIntensity;
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
