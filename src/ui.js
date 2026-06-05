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

const vhsCv = document.getElementById("vhs-canvas");
const vhsCtx = vhsCv.getContext("2d");
export function resizeVhs() {
  vhsCv.width = innerWidth;
  vhsCv.height = innerHeight;
}
resizeVhs();
window.addEventListener("resize", resizeVhs);

let vhsT = 0;
const grainCv = document.createElement("canvas");
const grainCtx = grainCv.getContext("2d");
export function drawVhs() {
  requestAnimationFrame(drawVhs);
  vhsT++;
  const w = vhsCv.width,
    h = vhsCv.height;
  vhsCtx.clearRect(0, 0, w, h);
  vhsCtx.fillStyle = "rgba(0,0,10,0.5)";
  vhsCtx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    const by = Math.random() * h;
    vhsCtx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.1})`;
    vhsCtx.fillRect(0, by, w, 1 + Math.random() * 6);
  }
  for (let i = 0; i < 4 + Math.floor(Math.random() * 5); i++) {
    const fy = Math.floor(Math.random() * h),
      fw = 30 + Math.random() * 300,
      fx = Math.random() * (w - fw);
    const a = 0.05 + Math.random() * 0.08;
    vhsCtx.fillStyle = `rgba(255,20,60,${a})`;
    vhsCtx.fillRect(fx, fy, fw, 1);
    vhsCtx.fillStyle = `rgba(0,140,255,${a})`;
    vhsCtx.fillRect(fx + 3, fy + 1, fw, 1);
    vhsCtx.fillStyle = `rgba(0,255,100,${a * 0.4})`;
    vhsCtx.fillRect(fx - 2, fy, fw, 1);
  }
  if (Math.random() < 0.15) {
    const gy = Math.random() * h,
      gh = Math.random() * 20 + 3;
    vhsCtx.fillStyle = `rgba(74,170,255,${Math.random() * 0.18})`;
    vhsCtx.fillRect(0, gy, w, gh);
  }
  if (Math.random() < 0.04) {
    const ly = Math.random() * h;
    vhsCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
    vhsCtx.fillRect(0, ly, w, 1 + Math.floor(Math.random() * 3));
  }
  const scanY = (vhsT * 1.5) % h;
  const sg = vhsCtx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
  sg.addColorStop(0, "rgba(180,220,255,0)");
  sg.addColorStop(0.5, `rgba(180,220,255,${0.05 + Math.random() * 0.04})`);
  sg.addColorStop(1, "rgba(180,220,255,0)");
  vhsCtx.fillStyle = sg;
  vhsCtx.fillRect(0, scanY - 10, w, 20);
  const gw = Math.floor(w / 3),
    gh2 = Math.floor(h / 3);
  grainCv.width = gw;
  grainCv.height = gh2;
  const id = grainCtx.createImageData(gw, gh2);
  const data = id.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 50;
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 60;
  }
  grainCtx.putImageData(id, 0, 0);
  vhsCtx.drawImage(grainCv, 0, 0, w, h);
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
