import { AdditiveBlending, Color, ShaderMaterial } from "three";
import { EDI_GLSL_COLOR } from "./glsl/color.glsl";
import { EDI_GLSL_FBM } from "./glsl/fbm.glsl";
import { EDI_GLSL_HASH } from "./glsl/hash.glsl";
import { EDI_GLSL_NOISE } from "./glsl/noise.glsl";
import { EDI_GLSL_PULSE } from "./glsl/pulse.glsl";

export const VOLUMETRIC_PRESENCE_SHADER_UNIFORMS = {
  uTime: { value: 0 },
  uPresence: { value: .72 },
  uPresenceRadius: { value: .88 },
  uPresenceOpacity: { value: .24 },
  uPresenceSoftness: { value: .72 },
  uPresenceColor: { value: new Color("#4f9fca") },
  uPresencePulse: { value: .42 },
  uStateHint: { value: 0 },
};

export const createVolumetricPresenceShaderMaterial = () => new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: {
    ...VOLUMETRIC_PRESENCE_SHADER_UNIFORMS,
    uPresenceColor: { value: VOLUMETRIC_PRESENCE_SHADER_UNIFORMS.uPresenceColor.value.clone() },
  },
  vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uPresence;
    uniform float uPresenceRadius;
    uniform float uPresenceOpacity;
    uniform float uPresenceSoftness;
    uniform vec3 uPresenceColor;
    uniform float uPresencePulse;
    uniform float uStateHint;

    ${EDI_GLSL_HASH}
    ${EDI_GLSL_NOISE}
    ${EDI_GLSL_FBM}
    ${EDI_GLSL_PULSE}
    ${EDI_GLSL_COLOR}

    void main(){
      vec2 p=(vUv-.5)*2.;
      float time=uTime*.045;
      float pulse=ediOrganicPulse(uTime*.16)*uPresencePulse;
      vec2 drift=vec2(ediFbm(p*.72+vec2(time,-time*.6)),ediFbm(p.yx*.68+vec2(-time*.5,time)));
      float depth=length((p+(drift-.5)*.12)/vec2(1.08,.86));
      float livingBoundary=uPresenceRadius+(drift.x-.5)*.16+pulse*.025;
      float body=1.-smoothstep(livingBoundary-uPresenceSoftness*.34,livingBoundary+uPresenceSoftness*.28,depth);
      float innerBreath=smoothstep(.08,.74,depth)*(1.-smoothstep(.58,1.12,depth));
      float volume=body*(.42+innerBreath*.58)*( .82+pulse*.18);
      vec3 energy=ediEnergyColor(.14+drift.y*.34+uStateHint*.05);
      vec3 color=mix(uPresenceColor,energy,.42);
      float alpha=volume*uPresence*uPresenceOpacity;
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
