let composer = null;
let motionBlurPass = null;
let chromaticPass = null;
let prevFrameRT = null;
let accumRT = null;

export let postEnabled = { motionBlur: false, chromatic: false };

const ACCUM_BLEND = 0.55;

const accumShader = {
  uniforms: {
    tDiffuse: { value: null },
    tPrev: { value: null },
    blend: { value: ACCUM_BLEND },
    strength: { value: 1.0 },
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tPrev;
    uniform float blend;
    uniform float strength;
    varying vec2 vUv;
    void main(){
      vec4 cur=texture2D(tDiffuse,vUv);
      vec4 prev=texture2D(tPrev,vUv);
      gl_FragColor=mix(cur,prev,blend*strength);
    }
  `,
};

const chromaticShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.0 },
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float strength;
    varying vec2 vUv;
    void main(){
      vec2 dir=vUv-0.5;
      float dist=length(dir);
      vec2 offset=dir*(dist*dist)*strength*0.08;
      float r=texture2D(tDiffuse,vUv+offset).r;
      float g=texture2D(tDiffuse,vUv).g;
      float b=texture2D(tDiffuse,vUv-offset).b;
      float a=texture2D(tDiffuse,vUv).a;
      gl_FragColor=vec4(r,g,b,a);
    }
  `,
};

export function initPost(renderer, scene, camera) {
  if (typeof THREE.EffectComposer === "undefined") {
    console.warn("EffectComposer not loaded — post effects disabled");
    return false;
  }

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));

  motionBlurPass = new THREE.ShaderPass(accumShader);
  motionBlurPass.enabled = false;
  composer.addPass(motionBlurPass);

  chromaticPass = new THREE.ShaderPass(chromaticShader);
  chromaticPass.renderToScreen = false;
  chromaticPass.enabled = false;
  composer.addPass(chromaticPass);

  const copyPass = new THREE.ShaderPass(THREE.CopyShader);
  copyPass.renderToScreen = true;
  composer.addPass(copyPass);

  const w = renderer.domElement.width;
  const h = renderer.domElement.height;
  prevFrameRT = new THREE.WebGLRenderTarget(w, h);

  window.addEventListener("resize", () => {
    const nw = renderer.domElement.width;
    const nh = renderer.domElement.height;
    composer.setSize(nw, nh);
    prevFrameRT.setSize(nw, nh);
  });

  return true;
}

export function setPostMotionBlur(enabled, strength = 1.0) {
  postEnabled.motionBlur = enabled;
  if (motionBlurPass) {
    motionBlurPass.enabled = enabled;
    motionBlurPass.uniforms.strength.value = strength;
  }
}

export function setPostChromatic(enabled, strength = 1.0) {
  postEnabled.chromatic = enabled;
  if (chromaticPass) {
    chromaticPass.enabled = enabled;
    chromaticPass.uniforms.strength.value = strength;
  }
}

export function setChromaticStrength(v) {
  if (chromaticPass) chromaticPass.uniforms.strength.value = v;
}

export function renderPost(renderer, scene, camera) {
  if (!composer) {
    renderer.render(scene, camera);
    return;
  }

  if (motionBlurPass?.enabled && prevFrameRT) {
    motionBlurPass.uniforms.tPrev.value = prevFrameRT.texture;
  }

  composer.render();

  if (motionBlurPass?.enabled && prevFrameRT) {
    renderer.copyFramebufferToTexture(
      new THREE.Vector2(0, 0),
      prevFrameRT.texture,
    );
  }
}

export function getComposer() {
  return composer;
}
