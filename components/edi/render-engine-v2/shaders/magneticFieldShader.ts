import { AdditiveBlending, ShaderMaterial } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_FBM } from "./glsl/fbm.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";

export const MAGNETIC_FIELD_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uIntensity: { value: 1 },
  uFieldStrength: { value: 1 },
  uFieldSpeed: { value: .35 },
  uFieldDistortion: { value: .8 },
  uFieldThickness: { value: .035 },
  uFieldOpacity: { value: .55 },
  uFieldNoise: { value: .65 },
  uStateHint: { value: 0 },
};

export const createMagneticFieldShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: structuredClone(MAGNETIC_FIELD_SHADER_UNIFORMS),
  vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uFieldStrength;
    uniform float uFieldSpeed;
    uniform float uFieldDistortion;
    uniform float uFieldThickness;
    uniform float uFieldOpacity;
    uniform float uFieldNoise;
    uniform float uStateHint;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}

    float forceLine(vec2 p,float offset,float phase){
      float time=uTime*uFieldSpeed;
      float bend=sin(p.x*2.3+phase+time*.28)*.16*uFieldDistortion;
      bend+=ediNoise(vec2(p.x*1.8+phase,time*.06))*.12*uFieldNoise;
      bend+=(ediFbm(vec2(p.x*.9+phase,time*.035))-.5)*.06*uFieldNoise;
      float lineDistance=abs(p.y-offset-bend);
      float openEnds=smoothstep(1.05,.42,abs(p.x));
      return (1.-smoothstep(uFieldThickness,uFieldThickness*2.5,lineDistance))*openEnds;
    }

    void main(){
      vec2 p=(vUv-.5)*2.;
      float pulse=ediOrganicPulse(uTime*uFieldSpeed*.35);
      float upper=forceLine(p, .42+uFieldStrength*.035, .2);
      float middle=forceLine(p,-.02,2.1);
      float lower=forceLine(p,-.44-uFieldStrength*.03,4.2);
      float field=(upper*.72+middle+lower*.72)*( .82+pulse*.18);
      float centerFade=smoothstep(.18,.48,length(p));
      vec3 color=ediEnergyColor(.22+pulse*.3+uStateHint*.08);
      float alpha=field*centerFade*uIntensity*uFieldOpacity;
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
