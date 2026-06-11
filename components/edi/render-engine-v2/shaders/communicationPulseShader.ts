import { AdditiveBlending, ShaderMaterial } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_FBM } from "./glsl/fbm.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";

export const COMMUNICATION_PULSE_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uCommunicationStrength: { value: .68 },
  uCommunicationRadius: { value: 1.08 },
  uCommunicationSpeed: { value: .28 },
  uCommunicationWidth: { value: .045 },
  uCommunicationGlow: { value: .72 },
  uCommunicationDecay: { value: .76 },
  uStateHint: { value: 0 },
};

export const createCommunicationPulseShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: structuredClone(COMMUNICATION_PULSE_SHADER_UNIFORMS),
  vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uCommunicationStrength;
    uniform float uCommunicationRadius;
    uniform float uCommunicationSpeed;
    uniform float uCommunicationWidth;
    uniform float uCommunicationGlow;
    uniform float uCommunicationDecay;
    uniform float uStateHint;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}

    void main(){
      vec2 p=(vUv-.5)*2.;
      float cycle=fract(uTime*uCommunicationSpeed*.065+.18);
      float expansion=cycle*uCommunicationRadius;
      float envelope=smoothstep(.08,.24,cycle)*(1.-smoothstep(uCommunicationDecay,1.,cycle));
      float distortion=(ediFbm(p*.72+vec2(uTime*.012,-uTime*.009))-.5)*.1;
      float radius=length(p/vec2(1.12,.9))+distortion;
      float outward=1.-smoothstep(uCommunicationWidth,uCommunicationWidth*3.4,abs(radius-expansion));
      float externalMask=smoothstep(.24,.62,radius);
      float softReach=1.-smoothstep(expansion+.22,expansion+.5,radius);
      float energy=(outward+softReach*.12)*externalMask*envelope*uCommunicationStrength;
      vec3 color=ediEnergyColor(.62+uStateHint*.06);
      float alpha=energy*(.76+uCommunicationGlow*.24);
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
