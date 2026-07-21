// ---- Post-processing stack (SSAO + bloom), no examples/jsm dependency ----
// The scene renders to an offscreen colour target that ALSO captures depth.
// From the depth we do screen-space ambient occlusion (SSAO): crevices,
// contact points and clustered geometry darken while open areas stay lit,
// giving the flat-shaded world real depth. Optional hand-rolled bloom rides
// on top. A final composite multiplies the AO into the scene, adds bloom and
// writes to the canvas. Used only when SSAO or bloom is on (auto-exposure is
// handled separately on the renderer's tone mapping).

import * as THREE from 'three';

const QUAD_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BRIGHT_FRAG = /* glsl */`
  uniform sampler2D tDiffuse; uniform float threshold; varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = vec4(c * smoothstep(threshold, threshold + 0.25, l), 1.0);
  }`;

const BLUR_FRAG = /* glsl */`
  uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
  void main() {
    vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227;
    sum += texture2D(tDiffuse, vUv + dir * 1.384).rgb * 0.316;
    sum += texture2D(tDiffuse, vUv - dir * 1.384).rgb * 0.316;
    sum += texture2D(tDiffuse, vUv + dir * 3.230).rgb * 0.070;
    sum += texture2D(tDiffuse, vUv - dir * 3.230).rgb * 0.070;
    gl_FragColor = vec4(sum, 1.0);
  }`;

// ---- SSAO: reconstruct view-space position from depth, sample a hemisphere
// kernel oriented by the depth-derived normal, count occluders ----
const SSAO_FRAG = /* glsl */`
  uniform sampler2D tDepth;
  uniform mat4 uProj;
  uniform mat4 uInvProj;
  uniform vec2 uRes;
  uniform float uRadius;
  uniform float uBias;
  uniform vec3 uKernel[16];
  varying vec2 vUv;

  vec3 viewPos(vec2 uv, float d) {
    vec4 ndc = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
    vec4 v = uInvProj * ndc;
    return v.xyz / v.w;
  }
  float hash(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    float d = texture2D(tDepth, vUv).x;
    if (d >= 0.9999) { gl_FragColor = vec4(1.0); return; }   // sky — no AO
    vec3 P = viewPos(vUv, d);
    vec3 N = normalize(cross(dFdx(P), dFdy(P)));
    float ang = hash(vUv * uRes) * 6.2831853;
    vec3 rv = vec3(cos(ang), sin(ang), 0.0);
    vec3 T = normalize(rv - N * dot(rv, N));
    vec3 Bt = cross(N, T);
    mat3 TBN = mat3(T, Bt, N);
    float occ = 0.0;
    for (int i = 0; i < 16; i++) {
      vec3 sp = P + (TBN * uKernel[i]) * uRadius;
      vec4 clip = uProj * vec4(sp, 1.0);
      vec2 suv = (clip.xy / clip.w) * 0.5 + 0.5;
      if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
      float sz = viewPos(suv, texture2D(tDepth, suv).x).z;  // scene depth there
      float rc = smoothstep(0.0, 1.0, uRadius / max(0.0001, abs(P.z - sz)));
      occ += (sz >= sp.z + uBias ? 1.0 : 0.0) * rc;
    }
    gl_FragColor = vec4(vec3(1.0 - occ / 16.0), 1.0);
  }`;

// a small box blur to smooth the noisy AO
const AO_BLUR_FRAG = /* glsl */`
  uniform sampler2D tAO; uniform vec2 texel; varying vec2 vUv;
  void main() {
    float s = 0.0;
    for (int x = -2; x <= 2; x++)
      for (int y = -2; y <= 2; y++)
        s += texture2D(tAO, vUv + vec2(float(x), float(y)) * texel).r;
    gl_FragColor = vec4(vec3(s / 25.0), 1.0);
  }`;

const COMPOSITE_FRAG = /* glsl */`
  uniform sampler2D tScene;
  uniform sampler2D tAO;
  uniform sampler2D tBloom;
  uniform float aoStrength;
  uniform float bloomStrength;
  uniform bool useAO;
  uniform bool useBloom;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tScene, vUv).rgb;
    if (useAO) c *= mix(1.0, texture2D(tAO, vUv).r, aoStrength);
    if (useBloom) c += texture2D(tBloom, vUv).rgb * bloomStrength;
    gl_FragColor = vec4(c, 1.0);
  }`;

// hemisphere kernel: points in the +Z hemisphere, bunched toward the origin
function buildKernel(n) {
  const k = [];
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(
      Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 0.9 + 0.1);
    v.normalize();
    let s = i / n; s = 0.1 + 0.9 * s * s; // more samples close in
    v.multiplyScalar(s);
    k.push(v);
  }
  return k;
}

export class PostFX {
  constructor(renderer) {
    this.renderer = renderer;
    const w = renderer.domElement.width, h = renderer.domElement.height;
    // colour + DEPTH target (non-MSAA so the depth is sampleable for SSAO)
    this.rtScene = new THREE.WebGLRenderTarget(w, h);
    this.rtScene.texture.colorSpace = THREE.SRGBColorSpace;
    this.rtScene.depthTexture = new THREE.DepthTexture(w, h);
    this.rtScene.depthTexture.type = THREE.UnsignedIntType;
    // AO at half res (+ its blur target)
    this.rtAO = new THREE.WebGLRenderTarget(w >> 1, h >> 1);
    this.rtAOb = new THREE.WebGLRenderTarget(w >> 1, h >> 1);
    // bloom scratch at quarter res
    this.rtA = new THREE.WebGLRenderTarget(w >> 2, h >> 2);
    this.rtB = new THREE.WebGLRenderTarget(w >> 2, h >> 2);

    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.quadScene.add(this.quad);

    const mat = (frag, uniforms) => new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false,
    });
    this.ssaoMat = mat(SSAO_FRAG, {
      tDepth: { value: null }, uProj: { value: new THREE.Matrix4() },
      uInvProj: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2() },
      uRadius: { value: 1.6 }, uBias: { value: 0.04 }, uKernel: { value: buildKernel(16) },
    });
    this.aoBlurMat = mat(AO_BLUR_FRAG, { tAO: { value: null }, texel: { value: new THREE.Vector2() } });
    this.brightMat = mat(BRIGHT_FRAG, { tDiffuse: { value: null }, threshold: { value: 0.78 } });
    this.blurMat = mat(BLUR_FRAG, { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } });
    this.compositeMat = mat(COMPOSITE_FRAG, {
      tScene: { value: null }, tAO: { value: null }, tBloom: { value: null },
      aoStrength: { value: 0.85 }, bloomStrength: { value: 0.55 },
      useAO: { value: false }, useBloom: { value: false },
    });
  }

  setSize(w, h) {
    this.rtScene.setSize(w, h);
    this.rtAO.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
    this.rtAOb.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
    this.rtA.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
    this.rtB.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
  }

  _pass(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
  }

  // opts: { ssao, bloom, aoRadius, aoStrength }
  render(scene, camera, opts = {}) {
    const r = this.renderer;
    r.setRenderTarget(this.rtScene);
    r.render(scene, camera);

    if (opts.ssao) {
      const u = this.ssaoMat.uniforms;
      u.tDepth.value = this.rtScene.depthTexture;
      u.uProj.value.copy(camera.projectionMatrix);
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      u.uRes.value.set(this.rtAO.width, this.rtAO.height);
      u.uRadius.value = opts.aoRadius ?? 1.6;
      this._pass(this.ssaoMat, this.rtAO);
      this.aoBlurMat.uniforms.tAO.value = this.rtAO.texture;
      this.aoBlurMat.uniforms.texel.value.set(1 / this.rtAO.width, 1 / this.rtAO.height);
      this._pass(this.aoBlurMat, this.rtAOb);
    }

    if (opts.bloom) {
      this.brightMat.uniforms.tDiffuse.value = this.rtScene.texture;
      this._pass(this.brightMat, this.rtA);
      this.blurMat.uniforms.tDiffuse.value = this.rtA.texture;
      this.blurMat.uniforms.dir.value.set(1 / this.rtA.width, 0);
      this._pass(this.blurMat, this.rtB);
      this.blurMat.uniforms.tDiffuse.value = this.rtB.texture;
      this.blurMat.uniforms.dir.value.set(0, 1 / this.rtB.height);
      this._pass(this.blurMat, this.rtA);
    }

    const c = this.compositeMat.uniforms;
    c.tScene.value = this.rtScene.texture;
    c.tAO.value = this.rtAOb.texture;
    c.tBloom.value = this.rtA.texture;
    c.useAO.value = !!opts.ssao;
    c.useBloom.value = !!opts.bloom;
    c.aoStrength.value = opts.aoStrength ?? 0.85;
    this._pass(this.compositeMat, null);
  }

  dispose() {
    for (const rt of [this.rtScene, this.rtAO, this.rtAOb, this.rtA, this.rtB]) rt.dispose();
    this.rtScene.depthTexture?.dispose();
  }
}
