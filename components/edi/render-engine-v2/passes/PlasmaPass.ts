import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial } from "three";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";
import { createPassScene } from "./passUtils";

export class PlasmaPass implements RenderPass {
  readonly id = "plasma";
  private view = createPassScene();
  private material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uActivity: { value: 1 }, uWarning: { value: 0 }, uDistortion: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uActivity; uniform float uWarning; uniform float uDistortion;
      float field(vec2 p,float phase){return sin(p.x*7.+phase+sin(p.y*5.-phase*.6))*sin(p.y*8.-phase*.7+sin(p.x*4.));}
      void main(){
        vec2 p=(vUv-.5)*2.; float r=length(p); float angle=atan(p.y,p.x);
        float flow=field(p*(1.35+uDistortion*.25),uTime*.34)+(.35+uDistortion*.2)*field(p.yx*(1.8+uDistortion*.3),-uTime*.21);
        float plume=exp(-3.2*r*r)*smoothstep(.08,.72,abs(flow));
        float tendril=exp(-32.*abs(sin(angle*3.+flow*.8+uTime*.08)))*smoothstep(.15,.85,r)*(1.-smoothstep(.75,1.25,r));
        vec3 blue=vec3(.035,.36,.78); vec3 gold=vec3(.92,.56,.18);
        vec3 color=mix(blue,gold,clamp(.28+flow*.22+uWarning*.35,0.,1.));
        float alpha=(plume*.32+tendril*.3)*uActivity*(1.-smoothstep(.82,1.35,r));
        gl_FragColor=vec4(color*alpha,alpha);
      }`,
  });
  private mesh = new Mesh(new PlaneGeometry(1.9, 1.55), this.material);

  constructor() { this.view.scene.add(this.mesh); }
  render(frame: EdiV2Frame) {
    const activity = frame.state === "analyzing" ? 1.35 : frame.state === "thinking" ? 1.15 : .9;
    this.material.uniforms.uTime.value = frame.reducedMotion ? frame.time * .12 : frame.time;
    this.material.uniforms.uActivity.value = activity * frame.intensity * frame.laboratory.plasmaIntensity;
    this.material.uniforms.uWarning.value = frame.state === "warning" ? 1 : 0;
    this.material.uniforms.uDistortion.value = frame.laboratory.distortionIntensity;
    frame.renderer.render(this.view.scene, this.view.camera);
  }
  dispose() { this.mesh.geometry.dispose(); this.material.dispose(); }
}
