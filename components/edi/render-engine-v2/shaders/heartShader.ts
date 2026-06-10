import { ShaderMaterial, AdditiveBlending } from "three";

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

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 p){
      vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }

    void main(){
      vec2 p=(vUv-.5)*2.;
      float angle=atan(p.y,p.x);
      float organicTime=uTime*uPulseSpeed;
      float slowPulse=.5+.5*sin(organicTime+sin(organicTime*.37)*.65);
      float innerNoise=noise(p*3.4+vec2(organicTime*.08,-organicTime*.055));
      float edgeNoise=(sin(angle*5.+organicTime*.22)+sin(angle*9.-organicTime*.17)*.55)*.022*uNoise;
      float radius=uRadius*(.965+slowPulse*.045)+edgeNoise;
      float distanceToCore=length(p/vec2(1.04,.92));
      float body=1.-smoothstep(radius*.68,radius,distanceToCore);
      float innerPlasma=exp(-7.5*distanceToCore*distanceToCore)*( .72+innerNoise*.28);
      float hotCenter=exp(-24.*dot(p,p));
      float softGlow=exp(-5.2*distanceToCore*distanceToCore)*uGlow;
      vec3 deepBlue=vec3(.025,.16,.46);
      vec3 warmGold=vec3(1.,.62,.18);
      vec3 energyWhite=vec3(1.,.98,.88);
      vec3 color=mix(deepBlue,warmGold,clamp(innerNoise*.55+slowPulse*.18,0.,1.));
      color=mix(color,energyWhite,clamp(hotCenter*1.45,0.,1.));
      float alpha=(body*.55+innerPlasma*.82+hotCenter*1.3+softGlow*.18)*uIntensity;
      gl_FragColor=vec4(color*alpha,alpha);
    }`,
});
