let composer = null;
let motionBlurPass = null;
let chromaticPass = null;

let rtA = null;
let rtB = null;

export const postEnabled = { motionBlur: false, chromatic: false };

const accumShader = {
  uniforms: {
    tDiffuse: { value: null },
    tPrev: { value: null },
    uBlend: { value: 0.5 },
    uEnabled: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tPrev;
    uniform float uBlend;
    uniform float uEnabled;
    varying vec2 vUv;
    void main(){
      vec4 cur  = texture2D(tDiffuse, vUv);
      vec4 prev = texture2D(tPrev,    vUv);
      float b = uBlend * uEnabled;
      gl_FragColor = mix(cur, prev, b);
    }
  `,
};

const chromaticShader = {
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: 0.0 },
    uEnabled: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uEnabled;
    varying vec2 vUv;
    void main(){
      vec2 dir    = vUv - 0.5;
      float dist  = length(dir);

      vec2 offset = dir * (dist * dist) * uStrength * 0.06 * uEnabled;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv        ).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv        ).a;
      gl_FragColor = vec4(r, g, b, a);
    }
  `,
};

export function initPost(renderer, scene, camera) {
  if (typeof THREE.EffectComposer === "undefined") {
    console.warn("[post] EffectComposer not loaded — post effects disabled");
    return false;
  }

  const w = renderer.domElement.width;
  const h = renderer.domElement.height;

  const rtParams = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  };
  rtA = new THREE.WebGLRenderTarget(w, h, rtParams);
  rtB = new THREE.WebGLRenderTarget(w, h, rtParams);

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));

  motionBlurPass = new THREE.ShaderPass(accumShader);
  motionBlurPass.uniforms.tPrev.value = rtB.texture;
  motionBlurPass.enabled = false;
  motionBlurPass.renderToScreen = false;
  composer.addPass(motionBlurPass);

  chromaticPass = new THREE.ShaderPass(chromaticShader);
  chromaticPass.enabled = false;
  chromaticPass.renderToScreen = false;
  composer.addPass(chromaticPass);

  const copyPass = new THREE.ShaderPass(THREE.CopyShader);
  copyPass.renderToScreen = true;
  composer.addPass(copyPass);

  window.addEventListener("resize", () => {
    const nw = renderer.domElement.width;
    const nh = renderer.domElement.height;
    composer.setSize(nw, nh);
    rtA.setSize(nw, nh);
    rtB.setSize(nw, nh);
  });

  return true;
}

export function renderPost(renderer, scene, camera) {
  if (!composer) {
    renderer.render(scene, camera);
    return;
  }

  if (motionBlurPass?.enabled) {
    motionBlurPass.uniforms.tPrev.value = rtB.texture;

    composer.render();

    renderer.setRenderTarget(rtB);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  } else {
    composer.render();
  }
}

export function setPostMotionBlur(enabled, blend = 0.5) {
  postEnabled.motionBlur = enabled;
  if (!motionBlurPass) return;
  motionBlurPass.enabled = enabled;
  motionBlurPass.uniforms.uBlend.value = Math.max(0, Math.min(0.95, blend));
  motionBlurPass.uniforms.uEnabled.value = enabled ? 1.0 : 0.0;
}

export function setBlurVelocity(vel) {
  if (!motionBlurPass) return;

  const blend = Math.min(vel * 20, 0.99);
  motionBlurPass.uniforms.uBlend.value = blend;
  motionBlurPass.uniforms.uEnabled.value = blend > 0.001 ? 1.0 : 0.0;
}

export function setPostChromatic(enabled, strength = 1.0) {
  postEnabled.chromatic = enabled;
  if (!chromaticPass) return;
  chromaticPass.enabled = enabled;
  chromaticPass.uniforms.uStrength.value = strength;
  chromaticPass.uniforms.uEnabled.value = enabled ? 1.0 : 0.0;
}

export function setChromaticStrength(v) {
  if (chromaticPass) {
    chromaticPass.uniforms.uStrength.value = v;
    chromaticPass.uniforms.uEnabled.value = v > 0.001 ? 1.0 : 0.0;
  }
}

export function getComposer() {
  return composer;
}
