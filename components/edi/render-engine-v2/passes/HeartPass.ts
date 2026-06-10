import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

export class HeartPass implements RenderPass {
  readonly id = "heart";
  private view = createPassScene();
  private material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 }, uState: { value: 0 }, uDistortion: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uIntensity; uniform float uState; uniform float uDistortion;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 p=(vUv-.5)*2.; float a=atan(p.y,p.x); float breath=.94+.06*sin(uTime*(uState>2.5?5.:1.8));
        float irregular=(sin(a*5.+uTime*.32)*.08+sin(a*9.-uTime*.21)*.045)*uDistortion;
        float d=length(p/vec2(1.05,.82))-irregular;
        float core=exp(-18.*d*d/(breath*breath)); float center=exp(-10.*dot(p,p));
        float grain=.94+.06*hash(floor(p*90.));
        vec3 warm=vec3(1.,.74,.30); vec3 white=vec3(1.,.98,.88);
        vec3 color=mix(warm,white,clamp(center*1.35,0.,1.))*grain;
        float alpha=(core*.62+center*1.25)*uIntensity;
        gl_FragColor=vec4(color*alpha,alpha);
      }`,
  });
  private mesh = new Mesh(new PlaneGeometry(1.12, .92), this.material);

  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) {
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .15 : frame.time;
    this.material.uniforms.uIntensity.value = frame.intensity * frame.laboratory.heartIntensity * (frame.state === "success" ? 1.2 : 1);
    this.material.uniforms.uState.value = ["idle", "thinking", "analyzing", "speaking", "suggestion", "warning", "success"].indexOf(frame.state);
    this.material.uniforms.uDistortion.value = frame.laboratory.distortionIntensity;
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
