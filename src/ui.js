export const postCanvas = document.getElementById("post-canvas");
const postCtx = postCanvas.getContext("2d");
export function resizePost() {
  postCanvas.width = innerWidth;
  postCanvas.height = innerHeight;
}
resizePost();
window.addEventListener("resize", resizePost);

export function drawPost(nx, ny) {
  const w = postCanvas.width,
    h = postCanvas.height;
  postCtx.clearRect(0, 0, w, h);
  const cx = w / 2,
    cy = h / 2;
  const eg = postCtx.createRadialGradient(
    cx + nx * 6,
    cy + ny * 6,
    h * 0.45,
    cx + nx * 6,
    cy + ny * 6,
    h * 0.78,
  );
  eg.addColorStop(0, "rgba(0,0,0,0)");
  eg.addColorStop(1, "rgba(0,0,0,0.22)");
  postCtx.fillStyle = eg;
  postCtx.fillRect(0, 0, w, h);
}

const HOLD_MS = 3000;
let holdTimer = null,
  holdStart = 0;
const holdRing = document.getElementById("hold-ring");
const ringProg = document.getElementById("ring-prog");
const CIRC = 2 * Math.PI * 26;

export function startHold(e, isExcluded, onComplete) {
  if (isExcluded(e)) return;
  holdStart = Date.now();
  holdRing.style.display = "block";
  holdRing.style.left = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - 16 + "px";
  holdRing.style.top = (e.clientY ?? e.touches?.[0]?.clientY ?? 0) - 16 + "px";
  ringProg.style.strokeDasharray = `0 ${CIRC}`;
  holdTimer = setInterval(() => {
    const pct = Math.min((Date.now() - holdStart) / HOLD_MS, 1);
    ringProg.style.strokeDasharray = `${CIRC * pct} ${CIRC * (1 - pct)}`;
    if (pct >= 1) {
      clearInterval(holdTimer);
      holdTimer = null;
      holdRing.style.display = "none";
      onComplete();
    }
  }, 30);
}

export function cancelHold() {
  if (holdTimer) {
    clearInterval(holdTimer);
    holdTimer = null;
  }
  holdRing.style.display = "none";
}

const tooltip = document.getElementById("link-tooltip");
export function showTooltip(text) {
  tooltip.innerText = text;
  tooltip.style.opacity = "1";
}
export function hideTooltip() {
  tooltip.style.opacity = "0";
}

export function labelPos(mesh, el, hov, camera, modelGroup) {
  const v = new THREE.Vector3();
  mesh.getWorldPosition(v);
  v.project(camera);
  const x = (v.x * 0.5 + 0.5) * innerWidth;
  const y = (v.y * -0.5 + 0.5) * innerHeight;
  el.style.setProperty("--tx", `${x + 15}px`);
  el.style.setProperty("--ty", `${y - 15}px`);
  el.style.transform = `translate(${x + 15}px,${y - 15}px)`;
  el.classList.toggle("hovered", hov);

  const mat = mesh.material;
  let matOpacity = 1;
  if (mat?.uniforms?.uOpacity) matOpacity = mat.uniforms.uOpacity.value;

  const occRay = new THREE.Raycaster();
  occRay.setFromCamera(new THREE.Vector2(v.x, v.y), camera);
  const hits = occRay.intersectObjects(modelGroup.children, true);
  if (hits.length > 0) {
    const nodePos = new THREE.Vector3();
    mesh.getWorldPosition(nodePos);
    if (hits[0].distance < camera.position.distanceTo(nodePos) - 0.1) {
      el.style.opacity = "0";
      return;
    }
  }
  el.style.opacity = String(matOpacity);
}
