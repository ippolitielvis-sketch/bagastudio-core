import { AdditiveBlending, ShaderMaterial } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_FBM } from "./glsl/fbm.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";

export const NEURAL_FILAMENT_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uIntensity: { value: 1 },
  uFilamentDensity: { value: .8 },
  uFilamentSpeed: { value: .22 },
  uFilamentThickness: { value: .018 },
  uFilamentGlow: { value: .72 },
  uPulseStrength: { value: .65 },
  uNoiseScale: { value: 1 },
  uStateHint: { value: 0 },
};

export const createNeuralFilamentShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: structuredClone(NEURAL_FILAMENT_SHADER_UNIFORMS),
  vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uFilamentDensity;
    uniform float uFilamentSpeed;
    uniform float uFilamentThickness;
    uniform float uFilamentGlow;
    uniform float uPulseStrength;
    uniform float uNoiseScale;
    uniform float uStateHint;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}

    float filament(vec2 p,float angle,float phase){
      float time=uTime*uFilamentSpeed;
      mat2 rotation=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
      vec2 q=rotation*p;
      float organic=ediFbm(vec2(q.x*uNoiseScale+phase,time*.035))-.5;
      float path=abs(q.y-organic*.18);
      float reach=smoothstep(.88,.08,abs(q.x));
      float thought=ediOrganicPulse(time*.28+phase);
      float travel=smoothstep(.08,.38,thought)*smoothstep(.96,.58,thought);
      float coreCrossing=smoothstep(.86,.1,length(p));
      return (1.-smoothstep(uFilamentThickness,uFilamentThickness*3.2,path))*reach*travel*coreCrossing;
    }

    void main(){
      vec2 p=(vUv-.5)*2.;
      float first=filament(p, .32, .4);
      float second=filament(p,-.58,2.2);
      float third=filament(p,1.08,4.1);
      float density=mix(first,max(first,max(second,third)),clamp(uFilamentDensity,0.,1.));
      float glow=smoothstep(.72,.03,length(p))*uFilamentGlow;
      float pulse=ediOrganicPulse(uTime*uFilamentSpeed*.32)*uPulseStrength;
      vec3 color=ediEnergyColor(.32+pulse*.28+uStateHint*.06);
      float alpha=density*(.62+glow*.38)*(1.+pulse*.25)*uIntensity;
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
