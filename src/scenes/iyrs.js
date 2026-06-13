import { isSceneActive, closeScene, launchScene } from "../scene.js";
import { getSession, clearSession } from "../session.js";

export const BOT_USERS = [
  { name: "hazellyn", color: "#7af" },
  { name: "vanillyn", color: "#f9a" },
  { name: "moth", color: "#af7" },
  { name: "iyrsbot", color: "#fa4", isBot: true },
  { name: "echo", color: "#d8f" },
  { name: "clover", color: "#6e8" },
  { name: "toast", color: "#fb7" },
];

export const FAKE_MESSAGES = [
  { user: "system", delay: 50, text: "scene.iyrs" },
  ...Array.from({ length: 15 }, () => ({
    user: btoa(crypto.getRandomValues(new Uint8Array(6))).substring(0, 8),
    delay: Math.floor(Math.random() * 16) * 1 + 100,
    text: "cupId took His shot",
  })),
  { user: "vanillyn", delay: 4000, text: "hey chat" },
  { user: "moth", delay: 6000, text: "hi!!" },
  { user: "moth", delay: 9000, text: "how's it goin?" },
  { user: "iyrsbot", delay: 14000, text: "ok 200" },
  { user: "hazellyn", delay: 20000, text: "lol" },
  { user: "toast", delay: 23000, text: "is the bot broken again" },
  { user: "echo", delay: 26000, text: "where did my sweet bot go" },
  { user: "toast", delay: 27000, text: "bot.ping" },
  { user: "iyrsbot", delay: 27200, text: "error 500" },
  { user: "clover", delay: 32000, text: "see what you did" },
  { user: "toast", delay: 35000, text: "i didnt do anything i swear" },
  { user: "vanillyn", delay: 40000, text: "yuh" },
  { user: "hazellyn", delay: 45000, text: "im gonna reboot it" },
  { user: "iyrsbot", delay: 52000, text: "ok 200" },
  { user: "moth", delay: 53000, text: "yay back to normal :3" },
];

const MESSAGE_TRIGGERS = [
  { match: "scene.test", handler: () => launchScene("cube") },
  { match: "bot.ping", handler: () => addSystemMsg("pinging iyrs...") },
];

const MESSAGE_EFFECTS = [
  {
    match: "ok 200",
    effect: (el) => {
      el.style.color = "#4f4";
      el.style.fontWeight = "700";
    },
  },
];

const FILE_TRIGGERS = [
  { match: "PICTURE_20160812", effect: () => addSystemMsg("where") },
];

let _container = null;
let _startTime = 0;
let _fakeMsgIdx = 0;
let _fakeMsgTimeout = null;
let _statInterval = null;
let _vhsRaf = null;

function _esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _fmtTime(sec) {
  const p = (n) => String(Math.floor(n)).padStart(2, "0");
  return `${p((sec / 3600) % 24)}:${p((sec / 60) % 60)}:${p(sec % 60)}`;
}

function _applyEffects(el, text) {
  const lower = text.toLowerCase();
  MESSAGE_EFFECTS.forEach(({ match, effect }) => {
    if (lower.includes(match)) effect(el);
  });
}

export function addRoomMsg(user, text, container) {
  const c = container || _container;
  if (!c) return;
  const msgs = c.querySelector("#iy-messages");
  if (!msgs) return;
  c.querySelector("#iy-greeting")?.classList.add("hidden");
  const d = document.createElement("div");
  d.className = "msg room";
  d.innerHTML = `<span class="msg-user" style="color:${user.color}">${_esc(user.name)}</span>${_esc(text)}`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  _applyEffects(d, text);
}

export function addUserMsg(text, container) {
  const c = container || _container;
  if (!c) return;
  const msgs = c.querySelector("#iy-messages");
  if (!msgs) return;
  c.querySelector("#iy-greeting")?.classList.add("hidden");
  const d = document.createElement("div");
  d.className = "msg user";
  d.innerHTML = `<span class="msg-user" style="color:#ccc">you</span>${_esc(text)}`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  _applyEffects(d, text);
}

export function addSystemMsg(text, container) {
  const c = container || _container;
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

function addFileMsg(filename, localUrl, mimeType, container) {
  const c = container || _container;
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

function _scheduleNextFake(container) {
  if (_fakeMsgIdx >= FAKE_MESSAGES.length) return;
  const msg = FAKE_MESSAGES[_fakeMsgIdx];
  _fakeMsgTimeout = setTimeout(() => {
    if (!isSceneActive("iyrs")) return;
    const user = BOT_USERS.find((u) => u.name === msg.user) || {
      name: msg.user,
      color: "#aaa",
    };
    addRoomMsg(user, msg.text, container);
    _fakeMsgIdx++;
    _scheduleNextFake(container);
  }, msg.delay);
}

function _submit(container) {
  const inp = container.querySelector("#iy-input");
  const val = inp.value.trim();
  if (!val) return;
  addUserMsg(val, container);
  inp.value = "";
  const lower = val.toLowerCase();
  for (const t of MESSAGE_TRIGGERS) {
    if (lower.includes(t.match.toLowerCase())) {
      t.handler(val);
      return;
    }
  }
}

function _fileUpload(container) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "*/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addFileMsg(file.name, url, file.type, container);
    const lower = file.name.toLowerCase();
    FILE_TRIGGERS.forEach(({ match, effect }) => {
      if (lower.includes(match.toLowerCase())) effect(file.name, url);
    });
  };
  input.click();
}

function _showAboutPopup(container) {
  let popup = container.querySelector("#iy-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "iy-popup";
    popup.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:2px solid #1a3a6e;color:#1a3a6e;font-family:'Geist Mono',monospace;font-size:12px;padding:22px 28px;max-width:360px;width:88vw;letter-spacing:1px;line-height:1.8;z-index:600;pointer-events:auto;box-shadow:0 0 40px rgba(74,170,255,0.12);`;
    container.appendChild(popup);
  }
  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #1a3a6e;padding-bottom:10px;">
      <span style="font-size:9px;letter-spacing:3px;color:#2a5a8e;text-transform:uppercase;">about</span>
      <span style="cursor:pointer;opacity:0.4;font-size:16px;" id="iy-popup-close">✕</span>
    </div>
    <div style="font-size:13px;color:#1a3a6e;margin-bottom:8px;">(c) iyrs 1992–</div>
    <div style="font-size:10px;color:#4a7aaa;line-height:1.9;margin-bottom:18px;">chat relayed on the internet</div>
    <div style="border-top:1px solid #dde6ee;padding-top:12px;font-size:10px;color:#4a8acc;">
      <a id="iy-contact-link" href="#" style="color:#1a6fcc;text-decoration:none;letter-spacing:2px;border-bottom:1px solid #4af;">contact us</a>
    </div>`;
  popup
    .querySelector("#iy-popup-close")
    ?.addEventListener("click", () => popup.remove());
}

function _buildUserWidget(container) {
  const session = getSession();
  if (!session) return null;
  const wrap = document.createElement("div");
  wrap.id = "iy-user-widget";
  wrap.style.cssText =
    "position:relative;display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;";
  wrap.innerHTML = `
    <span style="font-size:10px;color:#4af;letter-spacing:1px;font-family:'Geist Mono',monospace;">@${_esc(session.user)}</span>
    <span style="font-size:8px;color:#4af;opacity:0.6;">▾</span>
    <div id="iy-user-menu" style="display:none;position:absolute;top:100%;right:0;background:#050a14;border:1px solid #1a3a6e;min-width:120px;z-index:700;font-family:'Geist Mono',monospace;">
      <div id="iy-signout-btn" style="padding:8px 14px;font-size:10px;color:#f88;cursor:pointer;letter-spacing:1px;">sign out</div>
    </div>`;
  wrap.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = wrap.querySelector("#iy-user-menu");
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  });
  document.addEventListener("click", () => {
    const menu = wrap.querySelector("#iy-user-menu");
    if (menu) menu.style.display = "none";
  });
  wrap.querySelector("#iy-signout-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    clearSession();
    closeScene("iyrs");
  });
  return wrap;
}

export function buildIyrsHTML() {
  return `
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
    <div id="iy-header-user" style="margin-left:12px;"></div>
    <span id="iy-close" style="color:#4af;font-size:18px;cursor:pointer;padding:0 8px;opacity:0.5;transition:opacity 0.15s;user-select:none;font-weight:300;margin-left:8px;">✕</span>
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
#iy-overlay.intro #iy-nav,#iy-overlay.intro #iy-close,#iy-overlay.intro #iy-header-user{display:none;}
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
</style>`;
}

export function mountIyrs(container) {
  _container = container;
  _startTime = Date.now();

  container.innerHTML = buildIyrsHTML();
  container.style.background = "transparent";

  const overlay = container.querySelector("#iy-overlay");
  overlay.classList.add("intro");
  overlay.style.opacity = "1";
  setTimeout(() => {
    overlay.classList.remove("intro");
    overlay.classList.add("settled");
  }, 1400);

  const userWidget = _buildUserWidget(container);
  if (userWidget)
    container.querySelector("#iy-header-user").appendChild(userWidget);

  _statInterval = setInterval(() => {
    const n = container.querySelector("#sb-nodes");
    const l = container.querySelector("#sb-latency");
    const u = container.querySelector("#sb-uptime");
    if (n) n.textContent = (Math.floor(Math.random() * 900) + 100).toString();
    if (l) l.textContent = (Math.random() * 40 + 2).toFixed(1) + "ms";
    if (u) u.textContent = _fmtTime((Date.now() - _startTime) / 1000);
  }, 800);

  addSystemMsg("connected to new", container);
  _fakeMsgIdx = 0;
  _scheduleNextFake(container);

  container.querySelector("#iy-close").onclick = () => closeScene("iyrs");
  container.querySelector("#iy-send").onclick = () => _submit(container);
  container.querySelector("#iy-attach").onclick = () => _fileUpload(container);
  container.querySelector("#iy-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") _submit(container);
  });

  container.querySelector("#nav-about").onclick = (e) => {
    e.preventDefault();
    _showAboutPopup(container);
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
      addSystemMsg("not available yet.", container);
    });
  });
}

export function cleanupIyrs() {
  clearTimeout(_fakeMsgTimeout);
  clearInterval(_statInterval);
  cancelAnimationFrame(_vhsRaf);
  _fakeMsgTimeout = null;
  _statInterval = null;
  _vhsRaf = null;
  _container = null;
}
