import { ShaderMaterial, AdditiveBlending } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";
import { EDI_GLSL_SDF } from "./glsl/sdf.glsl";

export const HEART_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uIntensity: { value: 1 },
  uPulseSpeed: { value: 1 },
  uRadius: { value: .48 },
  uNoise: { value: .7 },
  uGlow: { value: 1 },
};

export const createHeartShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: structuredClone(HEART_SHADER_UNIFORMS),
  vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uPulseSpeed;
    uniform float uRadius;
    uniform float uNoise;
    uniform float uGlow;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}
    ${EDI_GLSL_SDF}

    void main(){
      vec2 p=(vUv-.5)*2.;
      float angle=atan(p.y,p.x);
      float organicTime=uTime*uPulseSpeed;
      float slowPulse=ediOrganicPulse(organicTime);
      float innerNoise=ediNoise(p*3.4+vec2(organicTime*.08,-organicTime*.055));
      float edgeNoise=(sin(angle*5.+organicTime*.22)+sin(angle*9.-organicTime*.17)*.55)*.022*uNoise;
      float radius=uRadius*(.965+slowPulse*.045)+edgeNoise;
      float distanceToCore=ediEllipseDistance(p,vec2(1.04,.92));
      float body=ediSoftBody(distanceToCore,radius);
      float innerPlasma=exp(-7.5*distanceToCore*distanceToCore)*( .72+innerNoise*.28);
      float hotCenter=exp(-24.*dot(p,p));
      float softGlow=exp(-5.2*distanceToCore*distanceToCore)*uGlow;
      vec3 energyWhite=vec3(1.,.98,.88);
      vec3 color=ediEnergyColor(innerNoise*.55+slowPulse*.18);
      color=mix(color,energyWhite,clamp(hotCenter*1.45,0.,1.));
      float alpha=(body*.55+innerPlasma*.82+hotCenter*1.3+softGlow*.18)*uIntensity;
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
