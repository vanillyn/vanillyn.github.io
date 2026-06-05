let paintCanvas = null;
let paintCtx = null;
let paintTexture = null;

const SIZE = 512;
let hue = 0;

export function initPaintTex() {
  paintCanvas = document.createElement("canvas");
  paintCanvas.width = paintCanvas.height = SIZE;
  paintCtx = paintCanvas.getContext("2d");
  paintCtx.fillStyle = "rgba(0,0,0,0)";
  paintCtx.fillRect(0, 0, SIZE, SIZE);
  paintTexture = new THREE.CanvasTexture(paintCanvas);
  return paintTexture;
}

export function getPaintTexture() {
  return paintTexture;
}

export function paintAt(uv) {
  if (!paintCtx || !paintTexture) return;
  hue = (hue + 2) % 360;
  const px = uv.x * SIZE;
  const py = (1 - uv.y) * SIZE;
  const r = 18 + Math.random() * 10;
  const grad = paintCtx.createRadialGradient(px, py, 0, px, py, r);
  grad.addColorStop(0, `hsla(${hue},80%,65%,0.85)`);
  grad.addColorStop(0.6, `hsla(${hue},70%,55%,0.4)`);
  grad.addColorStop(1, `hsla(${hue},60%,45%,0)`);
  paintCtx.globalCompositeOperation = "source-over";
  paintCtx.fillStyle = grad;
  paintCtx.beginPath();
  paintCtx.arc(px, py, r, 0, Math.PI * 2);
  paintCtx.fill();
  paintTexture.needsUpdate = true;
}

export function clearPaint() {
  if (!paintCtx) return;
  paintCtx.clearRect(0, 0, SIZE, SIZE);
  if (paintTexture) paintTexture.needsUpdate = true;
}
