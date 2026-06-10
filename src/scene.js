import { bgMat } from "./materials.js";
import { mountForest } from "./scenes/forest.js";
import { mountMirrors } from "./scenes/mirrors.js";
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

  window.addEventListener("resize", onResize);
  return { scene, camera, renderer, clock, raycaster, mouse };
}

function onResize() {
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
  sceneContainer.style.cssText = `
    position:fixed;inset:0;z-index:200;
    opacity:0;pointer-events:none;
    transition:opacity 0.5s ease;
  `;
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
      _iyrsMount(container);
      return _iyrsCleanup;
    },
    onClose() {
      _iyrsOnClose();
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
        r.dispose();
      };
    },
  },
};

let _iyrsStartTime = 0;
let _iyrsFakeMsgTimeout = null;
let _iyrsFakeMsgIdx = 0;
let _iyrsStatInterval = null;
let _iyrsContainer = null;

const _BOT_USERS = [
  { name: "hazellyn", color: "#7af" },
  { name: "vanillyn", color: "#f9a" },
  { name: "moth", color: "#af7" },
  { name: "iyrsbot", color: "#fa4", isBot: true },
  { name: "echo", color: "#d8f" },
  { name: "clover", color: "#6e8" },
  { name: "toast", color: "#fb7" },
];

const _FAKE_MESSAGES = [
  { user: "iyrs", delay: 100, text: "scene.iyrs" },
  { user: "vanillyn", delay: 4000, text: "hey chat" },
  { user: "moth", delay: 6000, text: "hi!!" },
  { user: "moth", delay: 9000, text: "how's it goin?" },
  { user: "iyrsbot", delay: 14000, text: "OK 200" },
  { user: "hazellyn", delay: 20000, text: "lol" },
  { user: "toast", delay: 23000, text: "is the bot broken again" },
  { user: "echo", delay: 26000, text: "WHERE DID MY SWEET BOT GO" },
  { user: "toast", delay: 27000, text: "bot.ping" },
  { user: "iyrsbot", delay: 27200, text: "ERROR 500" },
  { user: "clover", delay: 32000, text: "see what you did" },
  { user: "toast", delay: 35000, text: "i didnt do anything i swear" },
  { user: "vanillyn", delay: 40000, text: "yuh" },
  { user: "hazellyn", delay: 45000, text: "im gonna reboot it" },
  { user: "iyrsbot", delay: 52000, text: "OK 200" },
  { user: "moth", delay: 53000, text: "yay back to normal :3" },
];

const _MESSAGE_TRIGGERS = [
  { match: "scene.test", handler: () => launchScene("cube") },
  { match: "bot.ping", handler: () => _iyrsAddSystemMsg("pinging iyrs...") },
];

const _MESSAGE_EFFECTS = [
  {
    match: "ok 200",
    effect: (el) => {
      el.style.color = "#4f4";
      el.style.fontWeight = "700";
    },
  },
];

const _FILE_TRIGGERS = [
  { match: "PICTURE_20160812", effect: () => _iyrsAddSystemMsg("where") },
];

function _iyrsMount(container) {
  _iyrsContainer = container;
  _iyrsStartTime = Date.now();

  container.innerHTML = _iyrsHTML();
  container.style.background = "transparent";

  const vhsCv = container.querySelector("#iy-vhs-canvas");
  _startVhs(vhsCv);

  _iyrsStatInterval = setInterval(() => {
    const n = container.querySelector("#sb-nodes");
    const l = container.querySelector("#sb-latency");
    const u = container.querySelector("#sb-uptime");
    if (n) n.textContent = (Math.floor(Math.random() * 900) + 100).toString();
    if (l) l.textContent = (Math.random() * 40 + 2).toFixed(1) + "ms";
    if (u) u.textContent = _fmtTime((Date.now() - _iyrsStartTime) / 1000);
  }, 800);

  const overlay = container.querySelector("#iy-overlay");
  overlay.classList.add("intro");
  overlay.style.opacity = "1";
  setTimeout(() => {
    overlay.classList.remove("intro");
    overlay.classList.add("settled");
  }, 1400);

  _iyrsAddSystemMsg("connected to new");
  _iyrsFakeMsgIdx = 0;
  _scheduleNextFake(container);

  container.querySelector("#iy-close").onclick = () => closeScene("iyrs");
  container.querySelector("#iy-send").onclick = () => _iyrsSubmit(container);
  container.querySelector("#iy-attach").onclick = () =>
    _iyrsFileUpload(container);
  container.querySelector("#iy-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") _iyrsSubmit(container);
  });

  container.querySelector("#nav-about").onclick = (e) => {
    e.preventDefault();
    _showIyrsPopup(container, { type: "about" });
  };
  container.querySelector("#nav-source").onclick = (e) => {
    e.preventDefault();
    window.open("https://github.com/vanillyn/vanillyn.github.io", "_blank");
  };
  container.querySelector("#nav-signin").onclick = (e) => {
    e.preventDefault();
    closeScene("iyrs");
    setTimeout(() => launchScene("forest"), 10);
  };

  container.addEventListener("click", (e) => {
    if (e.target.id === "iy-contact-link") {
      e.preventDefault();
      closeScene("iyrs");
      setTimeout(() => launchScene("mirrors"), 10);
    }
  });

  container.querySelectorAll("[data-notimpl]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      _iyrsAddSystemMsg("not available yet.");
    });
  });

  window.iyrsNotImpl = (e) => {
    e?.preventDefault();
    _iyrsAddSystemMsg("not available yet.");
  };
  window.iyrsSubmit = () => _iyrsSubmit(container);
  window.iyrsFileUpload = () => _iyrsFileUpload(container);
  window.closeIyrs = () => closeScene("iyrs");
}

function _iyrsCleanup() {}

function _iyrsOnClose() {
  clearTimeout(_iyrsFakeMsgTimeout);
  clearInterval(_iyrsStatInterval);
  _iyrsFakeMsgTimeout = null;
  _iyrsStatInterval = null;
  _iyrsContainer = null;
  cancelAnimationFrame(_vhsRaf);
}

function _showIyrsPopup(container, opts) {
  let popup = container.querySelector("#iy-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "iy-popup";
    popup.style.cssText = `
     position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
     background:#fff;border:2px solid #1a3a6e;
     color:#1a3a6e;font-family:'Geist Mono',monospace;font-size:12px;
     padding:22px 28px;max-width:360px;width:88vw;
     letter-spacing:1px;line-height:1.8;z-index:600;
     pointer-events:auto;box-shadow:0 0 40px rgba(74,170,255,0.12);
   `;
    container.appendChild(popup);
  }

  if (opts.type === "about") {
    popup.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #1a3a6e;padding-bottom:10px;">
        <span style="font-size:9px;letter-spacing:3px;color:#2a5a8e;text-transform:uppercase;">about</span>
        <span style="cursor:pointer;opacity:0.4;font-size:16px;" id="iy-popup-close">✕</span>
      </div>
      <div style="font-size:13px;color:#1a3a6e;margin-bottom:8px;">(c) iyrs 1992–</div>
      <div style="font-size:10px;color:#4a7aaa;line-height:1.9;margin-bottom:18px;">
      chat relayed on the internet
      </div>
      <div style="border-top:1px solid #dde6ee;padding-top:12px;font-size:10px;color:#4a8acc;">
        <a id="iy-contact-link" href="#" style="color:#1a6fcc;text-decoration:none;letter-spacing:2px;border-bottom:1px solid #4af;">contact us</a>
      </div>
    `;
  }

  popup.querySelector("#iy-popup-close")?.addEventListener("click", () => {
    popup.remove();
  });
}

function _scheduleNextFake(container) {
  if (_iyrsFakeMsgIdx >= _FAKE_MESSAGES.length) return;
  const msg = _FAKE_MESSAGES[_iyrsFakeMsgIdx];
  _iyrsFakeMsgTimeout = setTimeout(() => {
    if (!isSceneActive("iyrs")) return;
    const user = _BOT_USERS.find((u) => u.name === msg.user) || {
      name: msg.user,
      color: "#aaa",
    };
    _iyrsAddRoomMsg(user, msg.text, container);
    _iyrsFakeMsgIdx++;
    _scheduleNextFake(container);
  }, msg.delay);
}

function _iyrsSubmit(container) {
  const inp = container.querySelector("#iy-input");
  const val = inp.value.trim();
  if (!val) return;
  _iyrsAddUserMsg(val, container);
  inp.value = "";

  const lower = val.toLowerCase();
  for (const t of _MESSAGE_TRIGGERS) {
    if (lower.includes(t.match.toLowerCase())) {
      t.handler(val);
      return;
    }
  }
}

function _iyrsFileUpload(container) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "*/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    _iyrsAddFileMsg(file.name, url, file.type, container);
    const lower = file.name.toLowerCase();
    _FILE_TRIGGERS.forEach(({ match, effect }) => {
      if (lower.includes(match.toLowerCase())) effect(file.name, url);
    });
  };
  input.click();
}

function _iyrsAddRoomMsg(user, text, container) {
  const c = container || _iyrsContainer;
  if (!c) return;
  const msgs = c.querySelector("#iy-messages");
  if (!msgs) return;
  c.querySelector("#iy-greeting")?.classList.add("hidden");
  const d = document.createElement("div");
  d.className = "msg room";
  d.innerHTML = `<span class="msg-user" style="color:${user.color}">${_esc(user.name)}</span>${_esc(text)}`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  _applyMsgEffects(d, text);
}

function _iyrsAddUserMsg(text, container) {
  const c = container || _iyrsContainer;
  if (!c) return;
  const msgs = c.querySelector("#iy-messages");
  if (!msgs) return;
  c.querySelector("#iy-greeting")?.classList.add("hidden");
  const d = document.createElement("div");
  d.className = "msg user";
  d.innerHTML = `<span class="msg-user" style="color:#ccc">you</span>${_esc(text)}`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  _applyMsgEffects(d, text);
}

function _iyrsAddSystemMsg(text, container) {
  const c = container || _iyrsContainer;
  if (!c) return;
  const msgs = c.querySelector("#iy-messages");
  if (!msgs) return;
  const d = document.createElement("div");
  d.className = "msg system";
  d.textContent = text;
  d.style.cssText =
    "align-self:center;font-size:9px;color:#555;letter-spacing:2px;text-align:center;background:none;border:none;padding:2px 0;";
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function _iyrsAddFileMsg(filename, localUrl, mimeType, container) {
  const c = container || _iyrsContainer;
  if (!c) return;
  const msgs = c.querySelector("#iy-messages");
  if (!msgs) return;
  c.querySelector("#iy-greeting")?.classList.add("hidden");
  const d = document.createElement("div");
  d.className = "msg user";
  if (mimeType?.startsWith("image/")) {
    d.innerHTML = `<span class="msg-user" style="color:#ccc">you · ${_esc(filename)}</span><img src="${localUrl}" style="max-width:200px;max-height:160px;border:1px solid #ffdd0066;display:block;">`;
  } else if (mimeType?.startsWith("video/")) {
    d.innerHTML = `<span class="msg-user" style="color:#ccc">you · ${_esc(filename)}</span><video src="${localUrl}" controls style="max-width:220px;border:1px solid #4af4;display:block;"></video>`;
  } else {
    d.innerHTML = `<span class="msg-user" style="color:#ccc">you</span>📎 ${_esc(filename)}`;
  }
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function _applyMsgEffects(el, text) {
  const lower = text.toLowerCase();
  _MESSAGE_EFFECTS.forEach(({ match, effect }) => {
    if (lower.includes(match.toLowerCase())) effect(el);
  });
}

function _esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _fmtTime(sec) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(sec / 3600) % 24)}:${p(Math.floor(sec / 60) % 60)}:${p(Math.floor(sec) % 60)}`;
}

let _vhsRaf = null;
function _startVhs(cv) {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const grainCv = document.createElement("canvas");
  const grainCtx = grainCv.getContext("2d");
  let t = 0;
  function draw() {
    _vhsRaf = requestAnimationFrame(draw);
    t++;
    const w = (cv.width = innerWidth),
      h = (cv.height = innerHeight);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,10,0.5)";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const by = Math.random() * h;
      ctx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.1})`;
      ctx.fillRect(0, by, w, 1 + Math.random() * 6);
    }
    for (let i = 0; i < 4 + Math.floor(Math.random() * 5); i++) {
      const fy = Math.floor(Math.random() * h),
        fw = 30 + Math.random() * 300,
        fx = Math.random() * (w - fw),
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
}

function _makeExitBtn(onClick) {
  const btn = document.createElement("div");
  btn.style.cssText = `
    position:absolute;top:18px;right:22px;
    font-family:'Geist Mono',monospace;font-size:12px;
    color:rgba(255,255,255,0.4);cursor:pointer;letter-spacing:2px;
    z-index:10;transition:color 0.15s;pointer-events:auto;user-select:none;
  `;
  btn.textContent = "← exit";
  btn.onmouseenter = () => (btn.style.color = "rgba(255,255,255,0.9)");
  btn.onmouseleave = () => (btn.style.color = "rgba(255,255,255,0.4)");
  btn.onclick = onClick;
  return btn;
}

function _iyrsHTML() {
  return `
<canvas id="iy-vhs-canvas" style="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;"></canvas>
<div id="iy-overlay" style="position:absolute;inset:0;z-index:1;font-family:'Geist',sans-serif;background:#fafdee;display:flex;flex-direction:column;">
  <div id="iy-scanlines" style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.035) 0px,rgba(0,0,0,0.035) 1px,transparent 1px,transparent 2px);pointer-events:none;z-index:1;"></div>
  <div id="iy-header" style="background:#fff;border-bottom:2px solid #1a3a6e;display:flex;align-items:center;padding:0 24px;height:48px;position:relative;flex-shrink:0;clip-path:polygon(0 0,100% 0,100% 100%,12px 100%);">
    <div id="iy-logo-zone" style="display:flex;align-items:center;gap:10px;margin-right:auto;transition:all 1s cubic-bezier(.4,0,.2,1);">
      <div id="iy-logo-circle" style="width:28px;height:28px;border-radius:50%;border:2px solid #4af;display:flex;align-items:center;justify-content:center;font-size:9px;color:#4af;font-weight:700;flex-shrink:0;">...</div>
      <div id="iy-logo-text" style="font-size:18px;font-weight:600;color:#c8deff;letter-spacing:3px;text-transform:uppercase;font-family:'Geist Mono',monospace;">...</div>
    </div>
    <nav id="iy-nav" style="display:flex;margin-left:20px;">
      <a id="nav-about" href="#" style="color:#7aaad4;font-size:12px;letter-spacing:1px;text-decoration:none;padding:0 16px;height:48px;display:flex;align-items:center;border-left:1px solid rgba(74,170,255,0.1);font-weight:500;text-transform:uppercase;">about</a>
      <a id="nav-source" href="#" style="color:#7aaad4;font-size:12px;letter-spacing:1px;text-decoration:none;padding:0 16px;height:48px;display:flex;align-items:center;border-left:1px solid rgba(74,170,255,0.1);font-weight:500;text-transform:uppercase;">source</a>
      <a id="nav-signin" href="#" style="color:#7aaad4;font-size:12px;letter-spacing:1px;text-decoration:none;padding:0 16px;height:48px;display:flex;align-items:center;border-left:1px solid rgba(74,170,255,0.1);font-weight:500;text-transform:uppercase;">sign in</a>
    </nav>
    <span id="iy-close" style="color:#4af;font-size:18px;cursor:pointer;padding:0 8px;opacity:0.5;transition:opacity 0.15s;user-select:none;font-weight:300;">✕</span>
  </div>
  <div id="iy-body" style="display:flex;flex:1;overflow:hidden;min-height:0;">
    <div id="iy-sidebar" style="width:190px;flex-shrink:0;background:#fff;border-right:1px solid #1a3a6e;display:flex;flex-direction:column;padding:14px 0;position:relative;overflow:hidden;">
      <div class="sb-label">statistics</div>
      <div class="sb-stat">uptime <span id="sb-uptime">00:00:00</span></div>
      <div class="sb-stat">live <span id="sb-nodes">—</span></div>
      <div class="sb-stat">latency <span id="sb-latency">—</span></div>
      <div class="sb-divider"></div>
      <div class="sb-label">chats</div>
      <div class="sb-node active" data-notimpl>new</div>
      <div class="sb-node" data-notimpl>########### #### ##</div>
      <div class="sb-node" data-notimpl>#### ####### #### ##</div>
      <div class="sb-node" data-notimpl>##### ###### #### ##</div>
      <div class="sb-node" data-notimpl>######## ### #### ##</div>
    </div>
    <div id="iy-main" style="flex:1;display:flex;flex-direction:column;position:relative;overflow:hidden;min-width:0;">
      <div id="iy-greeting" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;opacity:1;transition:opacity 0.4s;">
        <div id="iy-greeting-text" style="font-size:20px;font-weight:600;color:#1a4a8e;letter-spacing:4px;text-transform:uppercase;font-family:'Geist Mono',monospace;">...</div>
        <div id="iy-greeting-sub" style="font-size:9px;color:#0e2a4e;letter-spacing:2px;margin-top:5px;font-family:'Geist Mono',monospace;"></div>
      </div>
      <div id="iy-messages" style="flex:1;overflow-y:auto;padding:18px 22px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:#1a3a6e transparent;"></div>
    </div>
  </div>
  <div id="iy-input-zone" style="border-top:1px solid #1a3a6e;padding:12px 18px;display:flex;gap:9px;align-items:center;background:#ccccff;flex-shrink:0;">
    <button id="iy-attach" style="background:#ddddff;border:1px solid #1a4a8e;color:#4af;font-size:15px;width:36px;height:36px;cursor:pointer;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;">📎</button>
    <input id="iy-input" type="text" placeholder="..." autocomplete="off" style="flex:1;background:#eeeeff;border:1px solid #1a3a6e;color:#c8deff;font-family:'Geist',serif;font-size:12px;padding:9px 13px;outline:none;border-radius:4px;">
    <button id="iy-send" style="background:#ddddff;border:1px solid #1a4a8e;color:#4af;font-family:'Geist Mono',monospace;font-size:10px;padding:9px 14px;cursor:pointer;letter-spacing:2px;border-radius:4px;text-transform:uppercase;">-></button>
  </div>
  <div id="iy-statusbar" style="background:#aaaaff;border-top:1px solid #0e2040;padding:3px 22px;font-size:8px;color:#1a3a6e;display:flex;gap:22px;letter-spacing:1px;flex-shrink:0;font-family:'Geist Mono',monospace;">
    <span>must hold the sky</span>
  </div>
</div>
<style>
#iy-overlay.intro #iy-logo-zone{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);flex-direction:column;gap:8px;}
#iy-overlay.intro #iy-logo-circle{width:60px;height:60px;font-size:0;}
#iy-overlay.intro #iy-logo-text{font-size:36px;letter-spacing:8px;}
#iy-overlay.intro #iy-nav,#iy-overlay.intro #iy-close{display:none;}
.sb-label{font-size:8px;color:#2a5a8e;letter-spacing:2px;padding:0 16px 5px;text-transform:uppercase;font-family:'Geist Mono',monospace;}
.sb-stat{padding:3px 16px;font-size:10px;color:#4a7aaa;display:flex;justify-content:space-between;align-items:center;font-family:'Geist Mono',monospace;}
.sb-stat span{color:#4af;font-size:11px;}
.sb-divider{height:1px;background:#1a3a6e;margin:8px 16px;}
.sb-node{margin:2px 8px;padding:4px 10px;font-size:9px;color:#2a5a8e;border:1px solid transparent;cursor:pointer;letter-spacing:1px;font-family:'Geist Mono',monospace;}
.sb-node:hover{color:#4af;border-color:#1a3a6e;}
.sb-node.active{color:#4af;border-color:#1a4a8e;background:rgba(74,170,255,0.07);}
.msg{max-width:70%;padding:9px 13px;font-size:12px;line-height:1.55;position:relative;border-radius:6px;font-family:'Geist',sans-serif;}
.msg.user{align-self:flex-end;background:#0e1e3a;border:1px solid #1a3a6e;color:#c8deff;border-bottom-right-radius:2px;}
.msg.room,.msg.ai{align-self:flex-start;background:#070a11;border:1px solid #0e2a4e;color:#7aaad4;border-bottom-left-radius:2px;}
.msg-user{color:#4af;font-size:10px;font-family:'Geist Mono',monospace;display:block;margin-bottom:2px;letter-spacing:1px;}
#iy-greeting.hidden{opacity:0;}
#iy-messages::-webkit-scrollbar{width:3px;}
#iy-messages::-webkit-scrollbar-thumb{background:#1a3a6e;border-radius:2px;}
#iy-nav a:hover{color:#fff;background:rgba(74,170,255,0.06);}
@media(max-width:600px){#iy-sidebar{display:none;}#iy-main .msg{max-width:90%;}}
</style>
`;
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
