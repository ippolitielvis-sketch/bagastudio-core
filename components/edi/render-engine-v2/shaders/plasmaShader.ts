import { AdditiveBlending, Color, ShaderMaterial } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_FBM } from "./glsl/fbm.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";

export const PLASMA_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uIntensity: { value: 1 },
  uPlasmaIntensity: { value: 1 },
  uPulseIntensity: { value: 1 },
  uFlowSpeed: { value: .65 },
  uNoiseScale: { value: 1 },
  uEnergyColorA: { value: new Color("#082f78") },
  uEnergyColorB: { value: new Color("#e2a84d") },
  uEnergyMix: { value: .5 },
  uSoftness: { value: 1 },
};

export const createPlasmaShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: {
    ...PLASMA_SHADER_UNIFORMS,
    uEnergyColorA: { value: PLASMA_SHADER_UNIFORMS.uEnergyColorA.value.clone() },
    uEnergyColorB: { value: PLASMA_SHADER_UNIFORMS.uEnergyColorB.value.clone() },
  },
  vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uPlasmaIntensity;
    uniform float uPulseIntensity;
    uniform float uFlowSpeed;
    uniform float uNoiseScale;
    uniform vec3 uEnergyColorA;
    uniform vec3 uEnergyColorB;
    uniform float uEnergyMix;
    uniform float uSoftness;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}

    void main(){
      vec2 p=(vUv-.5)*2.;
      float time=uTime*uFlowSpeed;
      float radius=length(p/vec2(1.08,.84));
      vec2 flow=vec2(ediFbm(p*uNoiseScale+vec2(time*.08,-time*.05)),ediFbm(p.yx*uNoiseScale+vec2(-time*.04,time*.07)));
      float plasma=ediFbm((p+flow*.18)*uNoiseScale*2.1+vec2(time*.055,-time*.035));
      float pulse=ediOrganicPulse(time*.42)*uPulseIntensity;
      float envelope=1.-smoothstep(.38+uSoftness*.08,1.1+uSoftness*.12,radius);
      float filaments=smoothstep(.42,.78,plasma+flow.x*.22+pulse*.08);
      vec3 sharedEnergy=ediEnergyColor(plasma*.72+pulse*.12);
      vec3 customEnergy=mix(uEnergyColorA,uEnergyColorB,clamp(plasma+uEnergyMix-.5,0.,1.));
      vec3 color=mix(sharedEnergy,customEnergy,.62);
      float alpha=envelope*(filaments*.55+plasma*.22)*uIntensity*uPlasmaIntensity;
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
