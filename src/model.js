import { curMat } from "./materials.js";

export const FALLBACK_GEOS = [
  () => new THREE.TorusKnotGeometry(1, 0.32, 128, 32),
  () => new THREE.IcosahedronGeometry(1.2, 1),
  () => new THREE.OctahedronGeometry(1.4, 0),
];

export const STARTUP_MODELS = [];

export let modelGroup = null;

const loaderManager = new THREE.LoadingManager();

loaderManager.onError = (url) => console.warn("loader error:", url);

const loader = new THREE.GLTFLoader(loaderManager);
const textureLoader = new THREE.TextureLoader(loaderManager);
const dracoLoader = (() => {
  if (typeof THREE.DRACOLoader === "undefined") return null;
  const dl = new THREE.DRACOLoader();
  dl.setDecoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/",
  );
  return dl;
})();
if (dracoLoader) loader.setDRACOLoader(dracoLoader);

export function initModelGroup(scene, mat) {
  modelGroup = new THREE.Group();
  scene.add(modelGroup);
  return modelGroup;
}

export function clearModel() {
  if (!modelGroup) return;
  while (modelGroup.children.length) modelGroup.remove(modelGroup.children[0]);
}

export function spawnFallback(geoFn) {
  clearModel();
  const g = geoFn
    ? geoFn()
    : FALLBACK_GEOS[Math.floor(Math.random() * FALLBACK_GEOS.length)]();
  g.computeVertexNormals();
  modelGroup.add(new THREE.Mesh(g, curMat()));
}

export function applyMatToModel() {
  if (!modelGroup) return;
  modelGroup.traverse((c) => {
    if (c.isMesh) c.material = curMat();
  });
}

function processGltf(gltf) {
  clearModel();
  gltf.scene.traverse((c) => {
    if (!c.isMesh) return;
    c.geometry = c.geometry.toNonIndexed();
    c.geometry.computeVertexNormals();
    c.material = curMat();
  });
  const box = new THREE.Box3().setFromObject(gltf.scene);
  gltf.scene.position.sub(box.getCenter(new THREE.Vector3()));
  const sz = box.getSize(new THREE.Vector3());
  gltf.scene.scale.multiplyScalar(3 / Math.max(sz.x, sz.y, sz.z));
  modelGroup.add(gltf.scene);
}

export function loadGLTF(url) {
  loader.load(url, processGltf, undefined, (err) => {
    console.warn("gltf load failed:", err);
    spawnFallback();
  });
}

export function getModelGroup() {
  return modelGroup;
}

export function loadStartupModel() {
  if (STARTUP_MODELS.length === 0) {
    spawnFallback();
    return;
  }
  const url = STARTUP_MODELS[Math.floor(Math.random() * STARTUP_MODELS.length)];
  loadGLTF(url);
}
