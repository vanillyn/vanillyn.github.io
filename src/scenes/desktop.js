import { launchScene, closeScene } from "../scene.js";
import { BOT_USERS, FAKE_MESSAGES } from "./iyrs.js";

import {
  LINKS_FRIENDS,
  LINKS_ME,
  LINKS_SERVICES,
  DATA_ENTRIES,
} from "../nav.js";
function getSession() {
  try {
    const raw = localStorage.getItem("iyrs_session");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveSession(user) {
  try {
    localStorage.setItem(
      "iyrs_session",
      JSON.stringify({ user, ts: Date.now() }),
    );
  } catch (_) {}
}

function clearSession() {
  try {
    localStorage.removeItem("iyrs_session");
  } catch (_) {}
}

let _windowZCounter = 100;
function nextZ() {
  return ++_windowZCounter;
}

function makeDesktopWindow(opts = {}) {
  const {
    title = "window",
    width = 420,
    height = 320,
    top = 80,
    left = 120,
    content = null,
    desktop,
    onClose,
    resizable = false,
  } = opts;

  const win = document.createElement("div");
  win.style.cssText = `
    position:absolute;
    top:${top}px;left:${left}px;
    width:${width}px;
    background:#c0c0c0;
    border:2px solid #fff;
    border-right-color:#808080;border-bottom-color:#808080;
    box-shadow:2px 2px 0 #000;
    font-family:'Courier New',monospace;
    z-index:${nextZ()};
    min-width:160px;min-height:80px;
    ${resizable ? "resize:both;overflow:hidden;" : ""}
  `;

  const tb = document.createElement("div");
  tb.style.cssText = `
    background:linear-gradient(90deg,#000080,#1084d0);
    color:#fff;font-size:11px;font-weight:bold;
    padding:3px 4px;display:flex;justify-content:space-between;align-items:center;
    cursor:default;user-select:none;letter-spacing:0.5px;
  `;

  const titleSpan = document.createElement("span");
  titleSpan.textContent = title;
  tb.appendChild(titleSpan);

  const btns = document.createElement("div");
  btns.style.cssText = "display:flex;gap:2px;";

  function makeWinBtn(label) {
    const b = document.createElement("button");
    b.style.cssText = `
      width:16px;height:14px;font-size:9px;font-weight:bold;
      background:#c0c0c0;
      border:1px solid #fff;border-right-color:#808080;border-bottom-color:#808080;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      padding:0;font-family:monospace;line-height:1;
    `;
    b.textContent = label;
    return b;
  }

  const closeBtn = makeWinBtn("✕");
  closeBtn.addEventListener("click", () => {
    win.remove();
    onClose?.();
  });
  btns.appendChild(closeBtn);
  tb.appendChild(btns);
  win.appendChild(tb);

  const body = document.createElement("div");
  body.style.cssText = `
    padding:8px;background:#c0c0c0;font-size:11px;color:#000;
    max-height:${height}px;overflow:auto;line-height:1.5;
  `;
  if (content) {
    if (typeof content === "string") body.innerHTML = content;
    else body.appendChild(content);
  }
  win.appendChild(body);

  let dragging = false,
    ox = 0,
    oy = 0;
  tb.addEventListener("mousedown", (e) => {
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    win.style.zIndex = nextZ();
    e.preventDefault();
  });
  const onMouseMove = (e) => {
    if (!dragging) return;
    win.style.left = Math.max(0, e.clientX - ox) + "px";
    win.style.top = Math.max(0, e.clientY - oy) + "px";
  };
  const onMouseUp = () => {
    dragging = false;
  };
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  win.addEventListener("mousedown", () => {
    win.style.zIndex = nextZ();
  });

  win._cleanup = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  if (desktop) desktop.appendChild(win);
  return { win, body, cleanup: win._cleanup };
}

function makeIframeWindow(opts = {}) {
  const {
    title,
    src,
    srcdoc,
    width = 640,
    height = 420,
    top = 60,
    left = 80,
    desktop,
    onClose,
  } = opts;
  const bodyEl = document.createElement("div");
  bodyEl.style.cssText = "padding:0;overflow:hidden;";

  const iframe = document.createElement("iframe");
  iframe.style.cssText = `width:${width}px;height:${height}px;border:none;display:block;background:#fff;`;
  if (srcdoc) iframe.srcdoc = srcdoc;
  else if (src) iframe.src = src;
  bodyEl.appendChild(iframe);

  const { win, cleanup } = makeDesktopWindow({
    title,
    width,
    height,
    top,
    left,
    desktop,
    onClose,
    content: bodyEl,
  });
  win.querySelector("div:last-child").style.padding = "0";
  win.querySelector("div:last-child").style.maxHeight = "none";
  return { win, iframe, cleanup };
}

function makeLinkWindow(label, links, desktop) {
  const body = links
    .map(
      (l) => `
    <div style="padding:3px 0;border-bottom:1px solid #aaa;display:flex;align-items:center;gap:6px;">
      <span>${l.icon}</span>
      <span class="desk-link" data-url="${l.url}" style="color:#000080;font-size:11px;text-decoration:underline;cursor:pointer;">${l.label}</span>
    </div>`,
    )
    .join("");
  const { win } = makeDesktopWindow({
    title: label,
    content: body,
    width: 280,
    height: 200,
    top: 90,
    left: 130,
    desktop,
  });
  win.querySelectorAll(".desk-link").forEach((el) => {
    el.addEventListener("click", () => {
      openExternalWindow(el.dataset.url, el.textContent, desktop);
    });
  });
  return win;
}

function openExternalWindow(url, label, desktop) {
  makeIframeWindow({
    title: label || url,
    src: url,
    width: 700,
    height: 480,
    top: 100,
    left: 100,
    desktop,
  });
}

function makeTextWindow(label, text, desktop) {
  makeDesktopWindow({
    title: label,
    content: `<p style="margin:0;font-size:11px;line-height:1.6;">${text}</p>`,
    width: 340,
    height: 200,
    top: 100,
    left: 120,
    desktop,
  });
}

function makeDataWindow(desktop) {
  const bodyEl = document.createElement("div");
  DATA_ENTRIES.forEach((e) => {
    const row = document.createElement("div");
    row.style.cssText =
      "padding:4px 0;border-bottom:1px dotted #aaa;cursor:pointer;font-size:11px;";
    row.textContent = `📄 ${e.label}`;
    row.addEventListener("dblclick", () =>
      makeTextWindow(e.label, e.content, desktop),
    );
    bodyEl.appendChild(row);
  });
  makeDesktopWindow({
    title: "data",
    content: bodyEl,
    width: 220,
    height: 200,
    top: 110,
    left: 200,
    desktop,
  });
}

function makeVhsCanvas(container) {
  const cv = document.createElement("canvas");
  cv.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;z-index:1000;pointer-events:none;";
  container.appendChild(cv);
  const ctx = cv.getContext("2d");
  const grainCv = document.createElement("canvas");
  const grainCtx = grainCv.getContext("2d");
  let t = 0;
  let raf = null;
  function draw() {
    raf = requestAnimationFrame(draw);
    t++;
    const w = (cv.width = innerWidth),
      h = (cv.height = innerHeight);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const by = Math.random() * h;
      ctx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.1})`;
      ctx.fillRect(0, by, w, 1 + Math.random() * 6);
    }
    for (let i = 0; i < 4 + Math.floor(Math.random() * 5); i++) {
      const fy = Math.floor(Math.random() * h),
        fw = 30 + Math.random() * 300;
      const fx = Math.random() * (w - fw),
        a = 0.05 + Math.random() * 0.08;
      ctx.fillStyle = `rgba(255,20,60,${a})`;
      ctx.fillRect(fx, fy, fw, 1);
      ctx.fillStyle = `rgba(0,140,255,${a})`;
      ctx.fillRect(fx + 3, fy + 1, fw, 1);
    }
    if (Math.random() < 0.15) {
      const gy = Math.random() * h,
        gh = Math.random() * 20 + 3;
      ctx.fillStyle = `rgba(74,170,255,${Math.random() * 0.18})`;
      ctx.fillRect(0, gy, w, gh);
    }
    const scanY = (t * 1.5) % h;
    const sg = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
    sg.addColorStop(0, "rgba(180,220,255,0)");
    sg.addColorStop(0.5, `rgba(180,220,255,${0.05 + Math.random() * 0.04})`);
    sg.addColorStop(1, "rgba(180,220,255,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, scanY - 10, w, 20);
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
    ctx.drawImage(grainCv, 0, 0, w, h);
  }
  draw();
  return () => {
    cancelAnimationFrame(raf);
    cv.remove();
  };
}

function makeCrtCanvas(container) {
  const crtCv = document.createElement("canvas");
  crtCv.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:999;";
  container.appendChild(crtCv);
  const crtCtx = crtCv.getContext("2d");
  let crtRaf;
  function drawCrt() {
    crtRaf = requestAnimationFrame(drawCrt);
    const w = (crtCv.width = innerWidth),
      h = (crtCv.height = innerHeight);
    crtCtx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      crtCtx.fillStyle = "rgba(0,0,0,0.11)";
      crtCtx.fillRect(0, y, w, 1);
    }
    const vg = crtCtx.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.3,
      w / 2,
      h / 2,
      h * 0.85,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    crtCtx.fillStyle = vg;
    crtCtx.fillRect(0, 0, w, h);
    if (Math.random() < 0.025) {
      crtCtx.fillStyle = `rgba(200,220,255,${Math.random() * 0.015})`;
      crtCtx.fillRect(0, 0, w, h);
    }
    if (Math.random() < 0.012) {
      const gy = Math.random() * h;
      crtCtx.fillStyle = `rgba(200,220,255,${Math.random() * 0.04})`;
      crtCtx.fillRect(0, gy, w, 1 + Math.random() * 2);
    }
    [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ].forEach(([cx, cy]) => {
      const r = Math.min(w, h) * 0.14;
      const g2 = crtCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g2.addColorStop(0, "rgba(0,0,0,0.5)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      crtCtx.fillStyle = g2;
      crtCtx.fillRect(0, 0, w, h);
    });
  }
  drawCrt();
  return () => {
    cancelAnimationFrame(crtRaf);
    crtCv.remove();
  };
}

function makeIcon(label, icon, onDblClick) {
  const el = document.createElement("div");
  el.style.cssText = `
    display:flex;flex-direction:column;align-items:center;gap:3px;
    cursor:pointer;padding:6px;width:70px;user-select:none;
    border:1px solid transparent;
  `;
  el.innerHTML = `
    <span style="font-size:26px;line-height:1;">${icon}</span>
    <span style="font-size:10px;color:#fff;text-align:center;line-height:1.2;
      text-shadow:1px 1px 2px #000,0 0 6px #000;word-break:break-word;">${label}</span>
  `;
  el.addEventListener("click", () => {
    el.style.background = "rgba(0,80,200,0.5)";
    el.style.borderColor = "rgba(120,160,255,0.7)";
    setTimeout(() => {
      el.style.background = "transparent";
      el.style.borderColor = "transparent";
    }, 300);
  });
  el.addEventListener("dblclick", onDblClick);
  return el;
}

function makeIyrsExeContent() {
  return `
<canvas id="iy-vhs-canvas" style="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;"></canvas>
<div id="iy-overlay" style="position:absolute;inset:0;z-index:1;font-family:'Geist',sans-serif;background:#fafdee;display:flex;flex-direction:column;overflow:hidden;">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.035) 0px,rgba(0,0,0,0.035) 1px,transparent 1px,transparent 2px);pointer-events:none;z-index:2;"></div>
  <div style="background:#fff;border-bottom:2px solid #1a3a6e;display:flex;align-items:center;padding:0 16px;height:40px;position:relative;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:8px;margin-right:auto;">
      <div style="width:22px;height:22px;border-radius:50%;border:2px solid #4af;display:flex;align-items:center;justify-content:center;font-size:7px;color:#4af;font-weight:700;">...</div>
      <div style="font-size:14px;font-weight:600;color:#c8deff;letter-spacing:2px;text-transform:uppercase;font-family:'Geist Mono',monospace;">iyrs</div>
    </div>
  </div>
  <div style="display:flex;flex:1;overflow:hidden;min-height:0;">
    <div style="width:140px;flex-shrink:0;background:#fff;border-right:1px solid #1a3a6e;display:flex;flex-direction:column;padding:10px 0;position:relative;overflow:hidden;">
      <div style="font-size:8px;color:#2a5a8e;letter-spacing:2px;padding:0 12px 4px;text-transform:uppercase;font-family:'Geist Mono',monospace;">statistics</div>
      <div style="padding:3px 12px;font-size:10px;color:#4a7aaa;display:flex;justify-content:space-between;font-family:'Geist Mono',monospace;">uptime <span id="iy-win-uptime" style="color:#4af;">00:00:00</span></div>
      <div style="padding:3px 12px;font-size:10px;color:#4a7aaa;display:flex;justify-content:space-between;font-family:'Geist Mono',monospace;">live <span id="iy-win-nodes" style="color:#4af;">—</span></div>
      <div style="height:1px;background:#1a3a6e;margin:6px 12px;"></div>
      <div style="font-size:8px;color:#2a5a8e;letter-spacing:2px;padding:0 12px 4px;text-transform:uppercase;font-family:'Geist Mono',monospace;">chats</div>
      <div style="margin:2px 6px;padding:3px 8px;font-size:9px;color:#4af;border:1px solid #1a4a8e;background:rgba(74,170,255,0.07);font-family:'Geist Mono',monospace;">new</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;position:relative;overflow:hidden;min-width:0;">
      <div id="iy-win-greeting" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;transition:opacity 0.4s;">
        <div style="font-size:16px;font-weight:600;color:#1a4a8e;letter-spacing:3px;text-transform:uppercase;font-family:'Geist Mono',monospace;">...</div>
      </div>
      <div id="iy-win-messages" style="flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin;scrollbar-color:#1a3a6e transparent;"></div>
    </div>
  </div>
  <div style="border-top:1px solid #1a3a6e;padding:10px 14px;display:flex;gap:8px;align-items:center;background:#ccccff;flex-shrink:0;">
    <input id="iy-win-input" type="text" placeholder="..." autocomplete="off"
      style="flex:1;background:#eeeeff;border:1px solid #1a3a6e;color:#c8deff;font-family:'Geist',serif;font-size:11px;padding:7px 10px;outline:none;border-radius:3px;">
    <button id="iy-win-send"
      style="background:#ddddff;border:1px solid #1a4a8e;color:#4af;font-family:'Geist Mono',monospace;font-size:9px;padding:7px 10px;cursor:pointer;letter-spacing:1px;border-radius:3px;text-transform:uppercase;">-></button>
  </div>
  <div style="background:#aaaaff;border-top:1px solid #0e2040;padding:2px 16px;font-size:8px;color:#1a3a6e;letter-spacing:1px;font-family:'Geist Mono',monospace;">
    <span>must hold the sky</span>
  </div>
</div>`;
}

function initIyrsWindow(el) {
  const vhsCv = el.querySelector("#iy-vhs-canvas");
  const startT = Date.now();
  const grainCv = document.createElement("canvas");
  const grainCtx = grainCv.getContext("2d");
  let t2 = 0,
    vhsRaf = null;
  if (vhsCv) {
    const vhsCtx = vhsCv.getContext("2d");
    function drawVhs() {
      vhsRaf = requestAnimationFrame(drawVhs);
      t2++;
      const w = (vhsCv.width = el.offsetWidth || 640),
        h = (vhsCv.height = el.offsetHeight || 420);
      vhsCtx.clearRect(0, 0, w, h);
      vhsCtx.fillStyle = "rgba(0,0,10,0.4)";
      vhsCtx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        const by = Math.random() * h;
        vhsCtx.fillStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.08})`;
        vhsCtx.fillRect(0, by, w, 1 + Math.random() * 4);
      }
      const scanY2 = (t2 * 1.2) % h;
      const sg = vhsCtx.createLinearGradient(0, scanY2 - 6, 0, scanY2 + 6);
      sg.addColorStop(0, "rgba(180,220,255,0)");
      sg.addColorStop(0.5, `rgba(180,220,255,${0.04 + Math.random() * 0.03})`);
      sg.addColorStop(1, "rgba(180,220,255,0)");
      vhsCtx.fillStyle = sg;
      vhsCtx.fillRect(0, scanY2 - 6, w, 12);
      const gw = Math.floor(w / 4),
        gh2 = Math.floor(h / 4);
      grainCv.width = gw;
      grainCv.height = gh2;
      const id = grainCtx.createImageData(gw, gh2);
      const data = id.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 35;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 45;
      }
      grainCtx.putImageData(id, 0, 0);
      vhsCtx.drawImage(grainCv, 0, 0, w, h);
    }
    drawVhs();
  }

  const statInterval = setInterval(() => {
    const n = el.querySelector("#iy-win-nodes");
    const u = el.querySelector("#iy-win-uptime");
    if (n) n.textContent = (Math.floor(Math.random() * 900) + 100).toString();
    if (u) {
      const sec = (Date.now() - startT) / 1000;
      const p = (n) => String(Math.floor(n)).padStart(2, "0");
      u.textContent = `${p((sec / 3600) % 24)}:${p((sec / 60) % 60)}:${p(sec % 60)}`;
    }
  }, 800);

  const msgs = el.querySelector("#iy-win-messages");
  const greeting = el.querySelector("#iy-win-greeting");
  const input = el.querySelector("#iy-win-input");
  const sendBtn = el.querySelector("#iy-win-send");

  function addMsg(html, className) {
    if (greeting) greeting.style.opacity = "0";
    const d = document.createElement("div");
    d.className = `msg ${className}`;
    d.style.cssText =
      className === "user"
        ? "align-self:flex-end;background:#0e1e3a;border:1px solid #1a3a6e;color:#c8deff;border-radius:5px;padding:7px 11px;font-size:11px;max-width:80%;font-family:'Geist',sans-serif;"
        : "align-self:flex-start;background:#070a11;border:1px solid #0e2a4e;color:#7aaad4;border-radius:5px;padding:7px 11px;font-size:11px;max-width:80%;font-family:'Geist',sans-serif;";
    d.innerHTML = html;
    if (msgs) {
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  function addSys(text) {
    const d = document.createElement("div");
    d.style.cssText =
      "align-self:center;font-size:9px;color:#555;letter-spacing:2px;text-align:center;padding:2px 0;font-family:'Geist Mono',monospace;";
    d.textContent = text;
    if (msgs) {
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  addSys("connected to new");

  let fIdx = 0;
  const timers = [];
  function schedNext() {
    if (fIdx >= FAKE_MESSAGES.length) return;
    const msg = FAKE_MESSAGES[fIdx];
    const tm = setTimeout(() => {
      const u = BOT_USERS.find((x) => x.name === msg.user) || {
        name: msg.user,
        color: "#aaa",
      };
      const lc = msg.text.toLowerCase();
      let extra = "";
      if (lc.includes("ok 200")) extra = ' style="color:#4f4;font-weight:700;"';
      addMsg(
        `<span style="color:${u.color};font-size:9px;display:block;margin-bottom:2px;font-family:'Geist Mono',monospace;">${u.name}</span><span${extra}>${msg.text}</span>`,
        "room",
      );
      fIdx++;
      schedNext();
    }, msg.delay);
    timers.push(tm);
  }
  schedNext();

  function submit() {
    const val = input.value.trim();
    if (!val) return;
    addMsg(
      `<span style="color:#ccc;font-size:9px;display:block;margin-bottom:2px;font-family:'Geist Mono',monospace;">you</span>${val}`,
      "user",
    );
    input.value = "";
  }
  sendBtn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  return () => {
    cancelAnimationFrame(vhsRaf);
    clearInterval(statInterval);
    timers.forEach(clearTimeout);
  };
}

export function mountDesktop(container) {
  container.innerHTML = "";

  const stopVhs = makeVhsCanvas(container);
  const stopCrt = makeCrtCanvas(container);

  const session = getSession();
  const currentUser = session?.user || "guest";

  const desktop = document.createElement("div");
  desktop.style.cssText = `
    position:absolute;inset:0;background:#008080;
    overflow:hidden;font-family:'Courier New',monospace;
  `;
  container.appendChild(desktop);

  const wallCanvas = document.createElement("canvas");
  wallCanvas.width = wallCanvas.height = 4;
  const wctx = wallCanvas.getContext("2d");
  wctx.fillStyle = "#008080";
  wctx.fillRect(0, 0, 4, 4);
  wctx.fillStyle = "rgba(0,0,0,0.08)";
  wctx.fillRect(0, 0, 2, 2);
  wctx.fillRect(2, 2, 2, 2);
  desktop.style.backgroundImage = `url(${wallCanvas.toDataURL()})`;

  const iconArea = document.createElement("div");
  iconArea.style.cssText = `
    position:absolute;top:10px;left:10px;
    display:flex;flex-direction:column;flex-wrap:wrap;
    gap:8px;height:calc(100% - 60px);align-content:flex-start;
  `;
  desktop.appendChild(iconArea);

  const iyrsCleanups = [];

  iconArea.appendChild(
    makeIcon("iyrs.exe", "🖥️", () => {
      const bodyEl = document.createElement("div");
      bodyEl.style.cssText =
        "position:relative;width:640px;height:420px;overflow:hidden;";
      bodyEl.innerHTML = makeIyrsExeContent();
      const { win } = makeDesktopWindow({
        title: "iyrs.exe",
        width: 640,
        height: 420,
        top: 60,
        left: 100,
        content: bodyEl,
        desktop,
        onClose: () => {
          const idx = iyrsCleanups.findIndex((c) => c.win === win);
          if (idx !== -1) {
            iyrsCleanups[idx].cleanup();
            iyrsCleanups.splice(idx, 1);
          }
        },
      });
      win.querySelector("div:last-child").style.padding = "0";
      win.querySelector("div:last-child").style.maxHeight = "none";
      win.querySelector("div:last-child").style.overflow = "hidden";
      const cleanup = initIyrsWindow(bodyEl);
      iyrsCleanups.push({ win, cleanup });
    }),
  );

  iconArea.appendChild(
    makeIcon("mirrors.exe", "🪞", () => {
      closeScene("desktop");
      setTimeout(() => launchScene("mirrors"), 80);
    }),
  );

  iconArea.appendChild(
    makeIcon("links", "🌐", () => makeLinkWindow("links", LINKS_ME, desktop)),
  );
  iconArea.appendChild(
    makeIcon("friends", "👥", () =>
      makeLinkWindow("friends", LINKS_FRIENDS, desktop),
    ),
  );
  iconArea.appendChild(
    makeIcon("services", "⚙️", () =>
      makeLinkWindow("services", LINKS_SERVICES, desktop),
    ),
  );
  iconArea.appendChild(makeIcon("data", "📂", () => makeDataWindow(desktop)));

  const urlHint = document.createElement("div");
  urlHint.style.cssText = `
    position:absolute;top:6px;right:10px;
    font-size:9px;color:rgba(255,255,255,0.18);
    letter-spacing:1px;pointer-events:none;font-family:'Courier New',monospace;
  `;
  urlHint.textContent = `@${currentUser}`;
  desktop.appendChild(urlHint);

  const taskbar = document.createElement("div");
  taskbar.style.cssText = `
    position:absolute;bottom:0;left:0;right:0;height:30px;
    background:#c0c0c0;border-top:2px solid #fff;
    display:flex;align-items:center;padding:0 4px;gap:4px;z-index:200;
  `;
  desktop.appendChild(taskbar);

  const startBtn = document.createElement("button");
  startBtn.style.cssText = `
    background:#c0c0c0;
    border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;
    font-family:'Courier New',monospace;font-size:11px;font-weight:bold;
    padding:2px 10px;cursor:pointer;height:22px;
    display:flex;align-items:center;gap:4px;
  `;
  startBtn.innerHTML = `<span>🪟</span><span>Start</span>`;
  taskbar.appendChild(startBtn);

  const divider = document.createElement("div");
  divider.style.cssText =
    "width:1px;height:18px;background:#808080;margin:0 2px;";
  taskbar.appendChild(divider);

  const clock = document.createElement("div");
  clock.style.cssText = `
    margin-left:auto;font-size:11px;padding:2px 8px;
    border:1px inset #808080;background:#c0c0c0;min-width:55px;text-align:center;
  `;
  taskbar.appendChild(clock);
  function updateClock() {
    clock.textContent = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  updateClock();
  const clockInterval = setInterval(updateClock, 10000);

  const startMenu = document.createElement("div");
  startMenu.style.cssText = `
    position:absolute;bottom:30px;left:0;width:200px;
    background:#c0c0c0;
    border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;
    box-shadow:2px 2px 0 #000;
    display:none;z-index:300;
    font-family:'Courier New',monospace;font-size:11px;
  `;
  desktop.appendChild(startMenu);

  const smBanner = document.createElement("div");
  smBanner.style.cssText = `
    background:linear-gradient(180deg,#000080 0%,#1080d0 100%);
    color:#fff;font-size:12px;font-weight:bold;
    writing-mode:vertical-rl;transform:rotate(180deg);
    padding:8px 4px;letter-spacing:2px;
    position:absolute;left:0;top:0;bottom:0;width:22px;
    display:flex;align-items:center;justify-content:flex-end;
    user-select:none;
  `;
  smBanner.textContent = `ashOS`;
  startMenu.appendChild(smBanner);

  const smContent = document.createElement("div");
  smContent.style.cssText = "margin-left:22px;";
  startMenu.appendChild(smContent);

  function makeSmItem(label, icon, action, hasSubmenu = false) {
    const el = document.createElement("div");
    el.style.cssText = `
      padding:5px 12px 5px 8px;cursor:${action ? "pointer" : "default"};
      color:#000;display:flex;align-items:center;gap:6px;position:relative;
      font-size:11px;
    `;
    if (icon) {
      const ic = document.createElement("span");
      ic.style.cssText = "font-size:14px;width:18px;text-align:center;";
      ic.textContent = icon;
      el.appendChild(ic);
    }
    const lbl = document.createElement("span");
    lbl.style.flex = "1";
    lbl.textContent = label;
    el.appendChild(lbl);
    if (hasSubmenu) {
      const arrow = document.createElement("span");
      arrow.style.cssText = "font-size:9px;margin-left:auto;";
      arrow.textContent = "▶";
      el.appendChild(arrow);
    }
    if (action) {
      el.addEventListener("mouseenter", () => {
        el.style.background = "#000080";
        el.style.color = "#fff";
      });
      el.addEventListener("mouseleave", () => {
        el.style.background = "";
        el.style.color = "#000";
      });
      el.addEventListener("click", () => {
        startOpen = false;
        startMenu.style.display = "none";
        action();
      });
    }
    return el;
  }

  function makeSmSep() {
    const sep = document.createElement("div");
    sep.style.cssText = "height:1px;background:#808080;margin:2px 8px;";
    return sep;
  }

  const smUserLabel = document.createElement("div");
  smUserLabel.style.cssText = `
    padding:5px 12px 5px 8px;color:#555;font-size:10px;
    letter-spacing:1px;border-bottom:1px solid #aaa;margin-bottom:2px;
  `;
  smUserLabel.textContent = `logged in as: ${currentUser}`;
  smContent.appendChild(smUserLabel);

  smContent.appendChild(
    makeSmItem("iyrs.exe", "🖥️", () => {
      const bodyEl = document.createElement("div");
      bodyEl.style.cssText =
        "position:relative;width:640px;height:420px;overflow:hidden;";
      bodyEl.innerHTML = makeIyrsExeContent();
      const { win } = makeDesktopWindow({
        title: "iyrs.exe",
        width: 640,
        height: 420,
        top: 60,
        left: 100,
        content: bodyEl,
        desktop,
      });
      win.querySelector("div:last-child").style.padding = "0";
      win.querySelector("div:last-child").style.maxHeight = "none";
      win.querySelector("div:last-child").style.overflow = "hidden";
      initIyrsWindow(bodyEl);
    }),
  );

  smContent.appendChild(
    makeSmItem("mirrors.exe", "🪞", () => {
      closeScene("desktop");
      setTimeout(() => launchScene("mirrors"), 80);
    }),
  );

  smContent.appendChild(makeSmSep());

  smContent.appendChild(
    makeSmItem("links", "🌐", () => makeLinkWindow("links", LINKS_ME, desktop)),
  );
  smContent.appendChild(
    makeSmItem("friends", "👥", () =>
      makeLinkWindow("friends", LINKS_FRIENDS, desktop),
    ),
  );
  smContent.appendChild(
    makeSmItem("services", "⚙️", () =>
      makeLinkWindow("services", LINKS_SERVICES, desktop),
    ),
  );
  smContent.appendChild(
    makeSmItem("data", "📂", () => makeDataWindow(desktop)),
  );

  smContent.appendChild(makeSmSep());

  smContent.appendChild(
    makeSmItem("exit to forest", "🌲", () => launchScene("forest")),
  );

  smContent.appendChild(makeSmSep());

  smContent.appendChild(
    makeSmItem("log off...", "👤", () => {
      clearSession();
      closeScene("desktop");
    }),
  );

  smContent.appendChild(
    makeSmItem("shut down...", "⏻", () => {
      document.body.innerHTML =
        "<p style='font-family:monospace;padding:20px;color:#fff;background:#000;'>it is now safe to go to sleep.</p>";
    }),
  );

  let startOpen = false;
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startOpen = !startOpen;
    startMenu.style.display = startOpen ? "block" : "none";
  });
  document.addEventListener("click", () => {
    if (startOpen) {
      startOpen = false;
      startMenu.style.display = "none";
    }
  });

  return function cleanup() {
    stopVhs();
    stopCrt();
    clearInterval(clockInterval);
    iyrsCleanups.forEach((c) => c.cleanup());
    iyrsCleanups.length = 0;
  };
}
