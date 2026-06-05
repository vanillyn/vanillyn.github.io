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

export function addUserMsg(text) {
  const msgs = document.getElementById("iy-messages");
  const d = document.createElement("div");
  d.className = "msg user";
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

export function addAiMsg(text) {
  const msgs = document.getElementById("iy-messages");
  const d = document.createElement("div");
  d.className = "msg ai";
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

export function iyrsNotImpl(e) {
  e?.preventDefault();
  addAiMsg("not implemented yet.");
  document.getElementById("iy-greeting").classList.add("hidden");
}

export function iyrsSubmit() {
  const inp = document.getElementById("iy-input");
  const val = inp.value.trim();
  if (!val) return;
  addUserMsg(val);
  inp.value = "";
  setTimeout(() => addAiMsg("not implemented yet."), 400 + Math.random() * 600);
  document.getElementById("iy-greeting").classList.add("hidden");
}

export function openIyrs() {
  if (iyrsOpen) return;
  iyrsOpen = true;
  iyrsStartTime = Date.now();
  const ov = document.getElementById("iyrs-overlay");
  const vhs = document.getElementById("vhs-overlay");
  document.getElementById("iy-greeting").classList.remove("hidden");
  document.getElementById("iy-messages").innerHTML = "";
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
}

export function closeIyrs() {
  if (!iyrsOpen) return;
  iyrsOpen = false;
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && iyrsOpen) closeIyrs();
});

window.iyrsNotImpl = iyrsNotImpl;
window.iyrsSubmit = iyrsSubmit;
window.closeIyrs = closeIyrs;
