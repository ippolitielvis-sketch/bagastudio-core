import { OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Mesh, Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass as ThreeRenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { RenderPass } from "../pipeline/RenderPass";
import type { EdiV2Frame } from "../types";

export class CompositePass implements RenderPass {
  readonly id = "composite";
  readonly composite = true;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material = new ShaderMaterial({
    transparent: true,
    uniforms: { uTexture: { value: null } },
    vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}",
    fragmentShader: "varying vec2 vUv; uniform sampler2D uTexture; void main(){gl_FragColor=texture2D(uTexture,vUv);}",
  });
  private mesh = new Mesh(new PlaneGeometry(2, 2), this.material);
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private size = 140;

  constructor() { this.scene.add(this.mesh); }

  setSize(size: number) {
    this.size = size;
    this.composer?.setSize(size, size);
    this.bloom?.resolution.set(size, size);
  }

  render(frame: EdiV2Frame) {
    this.material.uniforms.uTexture.value = frame.target.texture;
    if (!this.composer) {
      this.composer = new EffectComposer(frame.renderer);
      this.composer.addPass(new ThreeRenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new Vector2(this.size, this.size), .55, .72, .18);
      this.composer.addPass(this.bloom);
      this.composer.setSize(this.size, this.size);
    }
    if (this.bloom) {
      this.bloom.strength = (frame.state === "success" ? .78 : frame.state === "speaking" ? .68 : .52) * frame.intensity * frame.laboratory.bloomIntensity;
      this.bloom.radius = frame.laboratory.bloomRadius;
      this.bloom.threshold = frame.laboratory.bloomThreshold;
    }
    this.composer.render(frame.delta);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.composer?.dispose();
    this.composer = null;
    this.bloom = null;
  }
}
