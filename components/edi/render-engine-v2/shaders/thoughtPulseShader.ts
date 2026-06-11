import { AdditiveBlending, ShaderMaterial } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_FBM } from "./glsl/fbm.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";

export const THOUGHT_PULSE_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uPulseStrength: { value: .72 },
  uPulseRadius: { value: .82 },
  uPulseSpeed: { value: .32 },
  uPulseWidth: { value: .055 },
  uPulseGlow: { value: .8 },
  uPulseDecay: { value: .72 },
  uStateHint: { value: 0 },
};

export const createThoughtPulseShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: structuredClone(THOUGHT_PULSE_SHADER_UNIFORMS),
  vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uPulseStrength;
    uniform float uPulseRadius;
    uniform float uPulseSpeed;
    uniform float uPulseWidth;
    uniform float uPulseGlow;
    uniform float uPulseDecay;
    uniform float uStateHint;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}

    float neuralPath(vec2 p,float angle,float phase){
      mat2 rotation=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
      vec2 q=rotation*p;
      float organic=(ediFbm(vec2(q.x*.9+phase,uTime*.015))-.5)*.16;
      return 1.-smoothstep(uPulseWidth,uPulseWidth*3.,abs(q.y-organic));
    }

    void main(){
      vec2 p=(vUv-.5)*2.;
      float cycle=fract(uTime*uPulseSpeed*.08);
      float expansion=cycle*uPulseRadius;
      float envelope=smoothstep(0.,.16,cycle)*(1.-smoothstep(uPulseDecay,1.,cycle));
      float radius=length(p/vec2(1.06,.88));
      float wave=1.-smoothstep(uPulseWidth,uPulseWidth*3.,abs(radius-expansion));
      float paths=max(neuralPath(p,.34,.4),max(neuralPath(p,-.62,2.1),neuralPath(p,1.08,4.2)));
      float propagation=paths*smoothstep(expansion+.12,expansion-.08,radius);
      float energy=(wave+propagation*.38)*envelope*uPulseStrength;
      vec3 color=ediEnergyColor(.48+uStateHint*.08);
      float alpha=energy*(.72+uPulseGlow*.28);
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
