import { launchScene, closeScene } from "../scene.js";

const VALID_USERS = [
  { user: "vanillyn", pass: "temporal" },
  { user: "hazellyn", pass: "azimuth" },
  { user: "moth", pass: "nightjar" },
];

export function mountLogin(container) {
  container.innerHTML = "";

  const root = document.createElement("div");
  root.style.cssText = `
    position:absolute;inset:0;
    background:#008080;
    display:flex;align-items:center;justify-content:center;
  `;
  container.appendChild(root);

  // inject 98.css
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/98.css";
  document.head.appendChild(link);

  const win = document.createElement("div");
  win.className = "window";
  win.style.cssText = "width:min(320px,90vw);";
  win.innerHTML = `
    <div class="title-bar">
      <div class="title-bar-text">Log On to iyrs</div>
      <div class="title-bar-controls">
        <button aria-label="Close" id="login-close"></button>
      </div>
    </div>
    <div class="window-body" style="padding:16px;">
      <p style="margin:0 0 14px;font-size:12px;">
        Enter your username and password.
      </p>
      <div class="field-row-stacked" style="margin-bottom:10px;">
        <label for="login-user">Username</label>
        <input id="login-user" type="text" autocomplete="off" spellcheck="false" />
      </div>
      <div class="field-row-stacked" style="margin-bottom:14px;">
        <label for="login-pass">Password</label>
        <input id="login-pass" type="password" autocomplete="off" />
      </div>
      <div id="login-status" style="font-size:11px;min-height:16px;margin-bottom:10px;color:maroon;"></div>
      <div class="field-row" style="justify-content:flex-end;gap:6px;">
        <button id="login-submit">OK</button>
        <button id="login-cancel">Cancel</button>
      </div>
    </div>
  `;
  root.appendChild(win);

  const userEl = win.querySelector("#login-user");
  const passEl = win.querySelector("#login-pass");
  const statusEl = win.querySelector("#login-status");

  setTimeout(() => userEl.focus(), 80);

  let locked = false;

  function attempt() {
    if (locked) return;
    const u = userEl.value.trim().toLowerCase();
    const p = passEl.value;
    const match = VALID_USERS.find((v) => v.user === u && v.pass === p);
    if (match) {
      locked = true;
      statusEl.style.color = "green";
      statusEl.textContent = "loading...";
      setTimeout(() => {
        closeScene("login");
        setTimeout(() => launchScene("desktop"), 80);
      }, 700);
    } else {
      statusEl.style.color = "maroon";
      statusEl.textContent = "incorrect username or password.";
      passEl.value = "";
      passEl.focus();
      setTimeout(() => {
        statusEl.textContent = "";
      }, 2200);
    }
  }

  win.querySelector("#login-submit").addEventListener("click", attempt);
  win
    .querySelector("#login-cancel")
    .addEventListener("click", () => closeScene("login"));
  win
    .querySelector("#login-close")
    .addEventListener("click", () => closeScene("login"));
  passEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attempt();
  });
  userEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") passEl.focus();
  });

  return function cleanup() {
    link.remove();
  };
}
