let iyrsOpen = false;
let iyrsStartTime = 0;

const sbNodes = document.getElementById("sb-nodes");
const sbLatency = document.getElementById("sb-latency");
const sbUptime = document.getElementById("sb-uptime");

function pad2(n) {
  return String(n).padStart(2, "0");
}
function fmtTime(sec) {
  return `${pad2(Math.floor(sec / 3600) % 24)}:${pad2(Math.floor(sec / 60) % 60)}:${pad2(Math.floor(sec) % 60)}`;
}

setInterval(() => {
  if (!iyrsOpen) return;
  sbNodes.textContent = (Math.floor(Math.random() * 900) + 100).toString();
  sbLatency.textContent = (Math.random() * 40 + 2).toFixed(1) + "ms";
  sbUptime.textContent = fmtTime((Date.now() - iyrsStartTime) / 1000);
}, 800);

export function isIyrsOpen() {
  return iyrsOpen;
}

const FAKE_USERS = [
  { name: "hazellyn", color: "#7af" },
  { name: "vanillyn", color: "#f9a" },
  { name: "moth", color: "#af7" },
  { name: "iyrsbot", color: "#fa4", isBot: true },
];

const FAKE_MESSAGES = [
  { user: "vanillyn", delay: 4000, text: "hey chat" },
  { user: "moth", delay: 6000, text: "hi!!" },
  { user: "moth", delay: 9000, text: "how's it goin?" },
  { user: "iyrsbot", delay: 14000, text: "OK 200" },
  { user: "hazellyn", delay: 20000, text: "lol" },
];

const MESSAGE_EFFECTS = [
  {
    match: "ok",
    effect: (el) => {
      el.style.color = "#4f4";
      el.style.fontWeight = "700";
    },
  },
];

const FILE_EFFECTS = [
  {
    match: "PICTURE_20160812",
    effect: () => addSystemMsg("..."),
  },
];

let fakeMsgIdx = 0;
let fakeMsgTimeout = null;

function scheduleFakeMessages() {
  fakeMsgIdx = 0;
  scheduleNext();
}

function scheduleNext() {
  if (fakeMsgIdx >= FAKE_MESSAGES.length) return;
  const msg = FAKE_MESSAGES[fakeMsgIdx];
  fakeMsgTimeout = setTimeout(() => {
    if (!iyrsOpen) return;
    const user = FAKE_USERS.find((u) => u.name === msg.user) || {
      name: msg.user,
      color: "#aaa",
    };
    addRoomMsg(user, msg.text);
    fakeMsgIdx++;
    scheduleNext();
  }, msg.delay);
}

function stopFakeMessages() {
  clearTimeout(fakeMsgTimeout);
  fakeMsgTimeout = null;
  fakeMsgIdx = 0;
}

function applyEffects(el, text) {
  const lower = text.toLowerCase();
  MESSAGE_EFFECTS.forEach(({ match, effect }) => {
    if (lower.includes(match.toLowerCase())) effect(el);
  });
}

export function addRoomMsg(user, text) {
  const msgs = document.getElementById("iy-messages");
  document.getElementById("iy-greeting").classList.add("hidden");

  const d = document.createElement("div");
  d.className = "msg room";
  d.innerHTML = `<span class="msg-user" style="color:${user.color};font-size:10px;font-family:'Geist Mono',monospace;display:block;margin-bottom:2px;">${user.name}</span>${escapeHtml(text)}`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  applyEffects(d, text);
  return d;
}

export function addUserMsg(text) {
  const msgs = document.getElementById("iy-messages");
  document.getElementById("iy-greeting").classList.add("hidden");
  const d = document.createElement("div");
  d.className = "msg user";
  d.innerHTML = `<span class="msg-user" style="color:#ccc;font-size:10px;font-family:'Geist Mono',monospace;display:block;margin-bottom:2px;">you</span>${escapeHtml(text)}`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  applyEffects(d, text);
}

export function addSystemMsg(text) {
  const msgs = document.getElementById("iy-messages");
  const d = document.createElement("div");
  d.className = "msg system";
  d.textContent = text;
  d.style.cssText =
    "align-self:center;font-size:9px;color:#555;letter-spacing:2px;text-align:center;background:none;border:none;padding:2px 0;";
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function addFileMsg(filename, localUrl, mimeType) {
  const msgs = document.getElementById("iy-messages");
  document.getElementById("iy-greeting").classList.add("hidden");

  const d = document.createElement("div");
  d.className = "msg user";

  if (mimeType && mimeType.startsWith("image/")) {
    d.innerHTML = `<span class="msg-user" style="color:#ccc;font-size:10px;font-family:'Geist Mono',monospace;display:block;margin-bottom:4px;">you · ${escapeHtml(filename)}</span><img src="${localUrl}" style="max-width:200px;max-height:160px;border:1px solid #ffdd0066;display:block;">`;
  } else if (mimeType && mimeType.startsWith("video/")) {
    d.innerHTML = `<span class="msg-user" style="color:#ccc;font-size:10px;font-family:'Geist Mono',monospace;display:block;margin-bottom:4px;">you · ${escapeHtml(filename)}</span><video src="${localUrl}" controls style="max-width:220px;border:1px solid #4af4;display:block;"></video>`;
  } else {
    d.innerHTML = `<span class="msg-user" style="color:#ccc;font-size:10px;font-family:'Geist Mono',monospace;display:block;margin-bottom:2px;">you</span>📎 ${escapeHtml(filename)}`;
  }

  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;

  const lower = filename.toLowerCase();
  FILE_EFFECTS.forEach(({ match, effect }) => {
    if (lower.includes(match.toLowerCase())) effect(filename, localUrl);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function iyrsNotImpl(e) {
  e?.preventDefault();
  addSystemMsg("not available yet.");
}

export function iyrsSubmit() {
  const inp = document.getElementById("iy-input");
  const val = inp.value.trim();
  if (!val) return;
  addUserMsg(val);
  inp.value = "";
}

export function iyrsFileUpload() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "*/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addFileMsg(file.name, url, file.type);
  };
  input.click();
}

export function openIyrs() {
  if (iyrsOpen) return;
  iyrsOpen = true;
  iyrsStartTime = Date.now();
  const ov = document.getElementById("iyrs-overlay");
  const vhs = document.getElementById("vhs-overlay");
  document.getElementById("iy-greeting").classList.remove("hidden");
  document.getElementById("iy-messages").innerHTML = "";
  addSystemMsg("connected to new");
  vhs.style.opacity = "1";
  setTimeout(() => {
    ov.classList.remove("settled");
    ov.classList.add("intro");
    ov.style.opacity = "1";
    ov.classList.add("active");
    setTimeout(() => {
      ov.classList.remove("intro");
      ov.classList.add("settled");
    }, 1400);
  }, 400);
  scheduleFakeMessages();
}

export function closeIyrs() {
  if (!iyrsOpen) return;
  iyrsOpen = false;
  stopFakeMessages();
  const ov = document.getElementById("iyrs-overlay");
  const vhs = document.getElementById("vhs-overlay");
  ov.style.opacity = "0";
  ov.classList.remove("active");
  setTimeout(() => {
    vhs.style.opacity = "0";
    ov.classList.remove("settled");
    ov.classList.add("intro");
  }, 500);
}

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

export const anotherChance = Math.random() < 0.05 ? "evelyn" : null;

let hoverGlitchTimer = null;
let glitchInterval = null;
let glitchActive = false;

export function startHoverGlitch() {
  if (hoverGlitchTimer) return;
  hoverGlitchTimer = setTimeout(() => {
    triggerGlitch();
  }, 5000);
}

export function cancelHoverGlitch() {
  if (hoverGlitchTimer) {
    clearTimeout(hoverGlitchTimer);
    hoverGlitchTimer = null;
  }
  if (glitchInterval) {
    clearInterval(glitchInterval);
    glitchInterval = null;
  }
  if (glitchActive) {
    stopGlitch();
  }
}

function triggerGlitch() {
  glitchActive = true;
  const body = document.body;
  let ticks = 0;
  const totalTicks = 40;
  glitchInterval = setInterval(() => {
    ticks++;
    const intensity = ticks / totalTicks;
    body.style.transform = `translate(${(Math.random() - 0.5) * intensity * 30}px,${(Math.random() - 0.5) * intensity * 20}px) skew(${(Math.random() - 0.5) * intensity * 5}deg)`;
    if (ticks >= totalTicks) {
      clearInterval(glitchInterval);
      glitchInterval = null;
      stopGlitch();
    }
  }, 50);
}

function stopGlitch() {
  glitchActive = false;
  document.body.style.filter = "";
  document.body.style.transform = "";
  document.body.style.cursor = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && iyrsOpen) closeIyrs();
});

window.iyrsNotImpl = iyrsNotImpl;
window.iyrsSubmit = iyrsSubmit;
window.iyrsFileUpload = iyrsFileUpload;
window.closeIyrs = closeIyrs;
