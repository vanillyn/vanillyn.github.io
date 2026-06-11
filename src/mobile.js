let touchStartX = 0,
  touchStartY = 0;
let lastTouchDist = null;
let touchHoldTimer = null;
const TOUCH_HOLD_MS = 500;

export function initMobile({
  onTap,
  onHoldStart,
  onHoldEnd,
  onPinch,
  onDrag,
  mouse,
  bgMat,
}) {
  const isMobile =
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
    window.innerWidth < 600;

  if (!isMobile) return;

  const hint = document.getElementById("mobile-hint");
  if (hint) {
    hint.style.display = "block";
    setTimeout(() => {
      hint.style.opacity = "0";
    }, 3000);
  }

  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;

      mouse.x = (t.clientX / innerWidth) * 2 - 1;
      mouse.y = -((t.clientY / innerHeight) * 2 - 1);
      if (bgMat?.uniforms?.uMouse) {
        bgMat.uniforms.uMouse.value.set(
          t.clientX / innerWidth,
          1 - t.clientY / innerHeight,
        );
      }

      if (e.touches.length === 1) {
        touchHoldTimer = setTimeout(() => {
          onHoldStart?.({ clientX: t.clientX, clientY: t.clientY });
        }, TOUCH_HOLD_MS);
      }

      if (e.touches.length === 2) {
        clearTimeout(touchHoldTimer);
        onHoldEnd?.();
        lastTouchDist = getTouchDist(e.touches);
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      clearTimeout(touchHoldTimer);
      onHoldEnd?.();

      if (e.touches.length === 2) {
        const dist = getTouchDist(e.touches);
        if (lastTouchDist !== null) {
          const delta = lastTouchDist - dist;
          onPinch?.(delta * 0.05);
        }
        lastTouchDist = dist;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        onDrag?.(dx, dy);
        mouse.x = (t.clientX / innerWidth) * 2 - 1;
        mouse.y = -((t.clientY / innerHeight) * 2 - 1);
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    (e) => {
      clearTimeout(touchHoldTimer);
      onHoldEnd?.();
      lastTouchDist = null;

      const t = e.changedTouches[0];
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      if (dx < 10 && dy < 10) {
        mouse.x = (t.clientX / innerWidth) * 2 - 1;
        mouse.y = -((t.clientY / innerHeight) * 2 - 1);
        onTap?.({ clientX: t.clientX, clientY: t.clientY });
      }
    },
    { passive: true },
  );
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function desktopWarning(container, sceneName = "this scene") {
  const isMobile =
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
    window.innerWidth < 600;
  if (!isMobile) return false;

  const el = document.createElement("div");
  el.style.cssText = `
    position:absolute;inset:0;
    background:#050505;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:'Geist Mono',monospace;color:#888;
    text-align:center;padding:40px;gap:20px;
  `;
  el.innerHTML = `
    <div style="font-size:32px;">🖥️</div>
    <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#ccc;">desktop only</div>
    <div style="font-size:10px;color:#555;letter-spacing:1px;max-width:260px;line-height:1.9;">
      ${sceneName} requires a keyboard and mouse.<br>open on a larger screen.
    </div>
  `;
  container.appendChild(el);
  return true;
}
