import { bgMat } from './materials.js';

export let scene, camera, renderer, clock, raycaster, mouse;

export function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.getElementById('canvas-container').appendChild(renderer.domElement);

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

  window.addEventListener('resize', onResize);
  return { scene, camera, renderer, clock, raycaster, mouse };
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
