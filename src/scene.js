import { bgMat } from "./materials.js";
import { mountForest } from "./scenes/forest.js";
import { mountMirrors } from "./scenes/mirrors.js";
import { mountDesktop } from "./scenes/desktop.js";
import { mountIyrs, cleanupIyrs } from "./scenes/iyrs.js";
import { hasClearedForest } from "./session.js";

export let scene, camera, renderer, clock, raycaster, mouse;

export function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0);
  dl.position.set(5, 5, 5);
  scene.add(dl);

  const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), bgMat);
  bgPlane.position.set(0, 0, -28);
  scene.add(bgPlane);

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener("resize", _onResize);
  return { scene, camera, renderer, clock, raycaster, mouse };
}

function _onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

let activeSceneId = null;
let activeCleanup = null;
let sceneContainer = null;

function getOrCreateContainer() {
  if (sceneContainer) return sceneContainer;
  sceneContainer = document.createElement("div");
  sceneContainer.id = "scene-container";
  sceneContainer.style.cssText = `position:fixed;inset:0;z-index:200;opacity:0;pointer-events:none;transition:opacity 0.5s ease;`;
  document.body.appendChild(sceneContainer);
  return sceneContainer;
}

export function isSceneActive(id) {
  return id ? activeSceneId === id : activeSceneId !== null;
}

export function closeScene(id) {
  if (id && activeSceneId !== id) return;
  if (!activeSceneId) return;

  const container = getOrCreateContainer();
  container.style.opacity = "0";
  container.style.pointerEvents = "none";

  const closing = activeSceneId;
  activeSceneId = null;

  setTimeout(() => {
    if (typeof activeCleanup === "function") activeCleanup();
    activeCleanup = null;
    container.innerHTML = "";
    SCENES[closing]?.onClose?.();
  }, 10);
}

export function launchScene(id) {
  const def = SCENES[id];
  if (!def) {
    console.warn("[scene] unknown scene:", id);
    return;
  }

  if (activeSceneId) {
    const prev = activeSceneId;
    if (typeof activeCleanup === "function") activeCleanup();
    activeCleanup = null;
    SCENES[prev]?.onClose?.();
  }

  activeSceneId = id;
  const container = getOrCreateContainer();
  container.innerHTML = "";

  activeCleanup = def.mount(container) ?? null;
  container.style.opacity = "1";
  container.style.pointerEvents = "auto";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeSceneId) {
    if (document.pointerLockElement) {
      document.exitPointerLock();
      return;
    }
    closeScene();
  }
});

const SCENES = {
  iyrs: {
    mount(container) {
      mountIyrs(container);
    },
    onClose() {
      cleanupIyrs();
    },
  },

  desktop: {
    mount(container) {
      return mountDesktop(container);
    },
  },

  forest: {
    mount(container) {
      return mountForest(container);
    },
  },

  mirrors: {
    mount(container) {
      return mountMirrors(container);
    },
  },

  cube: {
    mount(container) {
      const canvas = document.createElement("canvas");
      canvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;display:block;";
      container.appendChild(canvas);

      const exitBtn = _makeExitBtn(() => closeScene("cube"));
      container.appendChild(exitBtn);

      const r = new THREE.WebGLRenderer({ canvas, antialias: true });
      r.setSize(innerWidth, innerHeight);
      r.setPixelRatio(Math.min(devicePixelRatio, 2));

      const s = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(
        45,
        innerWidth / innerHeight,
        0.1,
        100,
      );
      cam.position.z = 4;
      s.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dl = new THREE.DirectionalLight(0xffffff, 1.2);
      dl.position.set(3, 4, 3);
      s.add(dl);

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.4,
          metalness: 0.3,
        }),
      );
      s.add(cube);

      const clk = new THREE.Clock();
      let raf = null;
      function tick() {
        raf = requestAnimationFrame(tick);
        const t = clk.getElapsedTime();
        cube.rotation.x = t * 0.4;
        cube.rotation.y = t * 0.6;
        r.render(s, cam);
      }
      tick();

      function onResize() {
        r.setSize(innerWidth, innerHeight);
        cam.aspect = innerWidth / innerHeight;
        cam.updateProjectionMatrix();
      }
      window.addEventListener("resize", onResize);

      return function cleanup() {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        cube.geometry.dispose();
        cube.material.dispose();
        r.dispose();
      };
    },
  },
};

function _makeExitBtn(onClick) {
  const btn = document.createElement("div");
  btn.style.cssText = `position:absolute;top:18px;right:22px;font-family:'Geist Mono',monospace;font-size:12px;color:rgba(255,255,255,0.4);cursor:pointer;letter-spacing:2px;z-index:10;transition:color 0.15s;pointer-events:auto;user-select:none;`;
  btn.textContent = "← exit";
  btn.onmouseenter = () => (btn.style.color = "rgba(255,255,255,0.9)");
  btn.onmouseleave = () => (btn.style.color = "rgba(255,255,255,0.4)");
  btn.onclick = onClick;
  return btn;
}

export function openIyrs() {
  launchScene("iyrs");
}
export function closeIyrs() {
  closeScene("iyrs");
}
export function isIyrsOpen() {
  return isSceneActive("iyrs");
}
export const anotherChance = Math.random() < 0.05 ? "evelyn" : null;

if (Math.random() < 0.01) {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(
      () => {
        document.body.innerHTML = `<p>try again next time.</p>`;
      },
      800 + Math.random() * 1200,
    );
  });
}

let _hoverGlitchTimer = null;
let _glitchInterval = null;

export function startHoverGlitch() {
  if (_hoverGlitchTimer) return;
  _hoverGlitchTimer = setTimeout(_triggerGlitch, 5000);
}

export function cancelHoverGlitch() {
  clearTimeout(_hoverGlitchTimer);
  _hoverGlitchTimer = null;
  if (_glitchInterval) {
    clearInterval(_glitchInterval);
    _glitchInterval = null;
  }
  document.body.style.filter = "";
  document.body.style.transform = "";
}

function _triggerGlitch() {
  let ticks = 0;
  const total = 40;
  _glitchInterval = setInterval(() => {
    ticks++;
    const i = ticks / total;
    document.body.style.transform = `translate(${(Math.random() - 0.5) * i * 30}px,${(Math.random() - 0.5) * i * 20}px) skew(${(Math.random() - 0.5) * i * 5}deg)`;
    if (ticks >= total) {
      clearInterval(_glitchInterval);
      _glitchInterval = null;
      document.body.style.transform = "";
    }
  }, 50);
}
