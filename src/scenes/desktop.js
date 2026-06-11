import { closeScene, launchScene } from "../scene.js";
import { LINKS_FRIENDS, LINKS_ME, LINKS_SERVICES } from "../nav.js";
const DATA_ENTRIES = [
  { label: "placeholder", content: "placeholder text :3" },
  {
    label: "about me",
    content:
      "im vanillyn. i sorta just behave how people like me too. i prioritize being likable over anything else, which is ironic considering how many people dislike me. this includes not really having a gender or sexuality. i am whatever you see me as.",
  },
  { label: "current version", content: "website version 1.6" },
  {
    label: "about the website",
    content:
      'this website is sorta just a culmination of me having made websites for a while, i just dont want to have a "normal" ui and just choose to do this.',
  },
];

function makeIcon(label, icon, onClick) {
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
  el.addEventListener("mouseenter", () => {
    el.style.background = "rgba(0,80,200,0.5)";
    el.style.borderColor = "rgba(120,160,255,0.7)";
  });
  el.addEventListener("mouseleave", () => {
    el.style.background = "transparent";
    el.style.borderColor = "transparent";
  });
  el.addEventListener("dblclick", onClick);
  return el;
}

function makeWindow(title, bodyHtml, onClose, opts = {}) {
  const win = document.createElement("div");
  win.style.cssText = `
    position:absolute;
    top:${opts.top ?? 80}px;left:${opts.left ?? 100}px;
    width:${opts.width ?? 360}px;
    background:#c0c0c0;
    border:2px solid #fff;
    border-right-color:#808080;border-bottom-color:#808080;
    box-shadow:2px 2px 0 #000;
    font-family:'Courier New',monospace;
    z-index:${opts.z ?? 20};
    min-width:180px;
  `;

  const tb = document.createElement("div");
  tb.style.cssText = `
    background:linear-gradient(90deg,#000080,#1084d0);
    color:#fff;font-size:11px;font-weight:bold;
    padding:3px 4px;display:flex;justify-content:space-between;align-items:center;
    cursor:default;user-select:none;letter-spacing:0.5px;
  `;
  tb.innerHTML = `
    <span>${title}</span>
    <div style="display:flex;gap:2px;">
      <button style="width:16px;height:14px;font-size:9px;font-weight:bold;background:#c0c0c0;
        border:1px solid #fff;border-right-color:#808080;border-bottom-color:#808080;
        cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;
        font-family:monospace;line-height:1;" id="win-close-btn">✕</button>
    </div>
  `;
  win.appendChild(tb);

  const body = document.createElement("div");
  body.style.cssText = `
    padding:10px;background:#c0c0c0;font-size:11px;color:#000;
    max-height:${opts.maxH ?? 300}px;overflow-y:auto;line-height:1.5;
  `;
  body.innerHTML = bodyHtml;
  win.appendChild(body);

  tb.querySelector("#win-close-btn").addEventListener("click", () => {
    win.remove();
    onClose?.();
  });

  let dragging = false,
    ox = 0,
    oy = 0;
  tb.addEventListener("mousedown", (e) => {
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    win.style.zIndex = 999;
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    win.style.left = e.clientX - ox + "px";
    win.style.top = e.clientY - oy + "px";
  });
  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  return win;
}

export function mountDesktop(container) {
  container.innerHTML = "";

  const crtCv = document.createElement("canvas");
  crtCv.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1000;";
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

  const desktop = document.createElement("div");
  desktop.style.cssText = `
    position:absolute;inset:0;
    background:#008080;
    overflow:hidden;
    font-family:'Courier New',monospace;
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
    gap:8px;height:calc(100% - 60px);
    align-content:flex-start;
  `;
  desktop.appendChild(iconArea);

  function openLinkWindow(label, links) {
    const body = links
      .map(
        (l) =>
          `<div style="padding:3px 0;border-bottom:1px solid #999;display:flex;align-items:center;gap:6px;">
        <span>${l.icon}</span>
        <a href="${l.url}" target="_blank" rel="noopener"
          style="color:#000080;font-size:11px;text-decoration:underline;cursor:pointer;">${l.label}</a>
       </div>`,
      )
      .join("");
    const w = makeWindow(label, body, null, { top: 90, left: 130, width: 280 });
    desktop.appendChild(w);
  }

  function openTextWindow(label, text) {
    const w = makeWindow(
      label,
      `<p style="margin:0;font-size:11px;line-height:1.6;">${text}</p>`,
      null,
      { top: 100, left: 120, width: 340, maxH: 200 },
    );
    desktop.appendChild(w);
  }

  function openDataWindow() {
    const body = DATA_ENTRIES.map(
      (e) =>
        `<div style="padding:4px 0;border-bottom:1px dotted #aaa;cursor:pointer;font-size:11px;" data-key="${e.label}">
        📄 ${e.label}
       </div>`,
    ).join("");
    const w = makeWindow("data", body, null, {
      top: 110,
      left: 200,
      width: 220,
    });
    w.querySelectorAll("[data-key]").forEach((el) => {
      el.addEventListener("dblclick", () => {
        const entry = DATA_ENTRIES.find((e) => e.label === el.dataset.key);
        if (entry) openTextWindow(entry.label, entry.content);
      });
    });
    desktop.appendChild(w);
  }

  iconArea.appendChild(
    makeIcon("iyrs.exe", "🖥️", () => {
      closeScene("desktop");
      setTimeout(() => launchScene("iyrs"), 80);
    }),
  );
  iconArea.appendChild(
    makeIcon("mirrors.exe", "🪞", () => {
      closeScene("desktop");
      setTimeout(() => launchScene("mirrors"), 80);
    }),
  );
  iconArea.appendChild(
    makeIcon("links", "🌐", () => openLinkWindow("links", LINKS_ME)),
  );
  iconArea.appendChild(
    makeIcon("friends", "👥", () => openLinkWindow("friends", LINKS_FRIENDS)),
  );
  iconArea.appendChild(
    makeIcon("services", "⚙️", () =>
      openLinkWindow("services", LINKS_SERVICES),
    ),
  );
  iconArea.appendChild(makeIcon("data", "📂", openDataWindow));

  const taskbar = document.createElement("div");
  taskbar.style.cssText = `
    position:absolute;bottom:0;left:0;right:0;height:30px;
    background:#c0c0c0;
    border-top:2px solid #fff;
    display:flex;align-items:center;
    padding:0 4px;gap:4px;z-index:100;
  `;
  desktop.appendChild(taskbar);

  const startBtn = document.createElement("button");
  startBtn.style.cssText = `
    background:#c0c0c0;
    border:2px solid #fff;
    border-right-color:#808080;border-bottom-color:#808080;
    font-family:'Courier New',monospace;font-size:11px;font-weight:bold;
    padding:2px 10px;cursor:pointer;height:22px;
    display:flex;align-items:center;gap:4px;
  `;
  startBtn.innerHTML = `<span>🪟</span><span>Start</span>`;
  taskbar.appendChild(startBtn);

  const div = document.createElement("div");
  div.style.cssText = "width:1px;height:18px;background:#808080;margin:0 2px;";
  taskbar.appendChild(div);

  const clock = document.createElement("div");
  clock.style.cssText = `
    margin-left:auto;font-size:11px;padding:2px 8px;
    border:1px inset #808080;background:#c0c0c0;min-width:55px;text-align:center;
  `;
  taskbar.appendChild(clock);
  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  updateClock();
  const clockInterval = setInterval(updateClock, 10000);

  let startOpen = false;
  const startMenu = document.createElement("div");
  startMenu.style.cssText = `
    position:absolute;bottom:30px;left:0;
    width:160px;
    background:#c0c0c0;
    border:2px solid #fff;
    border-right-color:#808080;border-bottom-color:#808080;
    box-shadow:2px 2px 0 #000;
    display:none;z-index:200;
    font-family:'Courier New',monospace;font-size:11px;
  `;
  desktop.appendChild(startMenu);

  const startItems = [
    { label: "exit to forest", action: () => closeScene("desktop") },
    { label: "─────────────", action: null },
    {
      label: "shut down...",
      action: () => {
        document.body.innerHTML =
          "<p style='font-family:monospace;padding:20px;color:#fff;background:#000;'>it is now safe to turn off your computer.</p>";
      },
    },
  ];
  startItems.forEach((item) => {
    const el = document.createElement("div");
    el.style.cssText = `padding:5px 12px;cursor:${item.action ? "pointer" : "default"};color:#000;`;
    el.textContent = item.label;
    if (item.action) {
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
        item.action();
      });
    }
    startMenu.appendChild(el);
  });

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startOpen = !startOpen;
    startMenu.style.display = startOpen ? "block" : "none";
  });
  document.addEventListener("click", () => {
    startOpen = false;
    startMenu.style.display = "none";
  });

  const urlHint = document.createElement("div");
  urlHint.style.cssText = `
    position:absolute;top:6px;right:10px;
    font-size:9px;color:rgba(255,255,255,0.18);
    letter-spacing:1px;pointer-events:none;font-family:'Courier New',monospace;
  `;
  urlHint.textContent = "@vanillyn";
  desktop.appendChild(urlHint);

  return function cleanup() {
    cancelAnimationFrame(crtRaf);
    clearInterval(clockInterval);
  };
}
