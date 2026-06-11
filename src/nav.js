import { makeLineMat } from "./materials.js";
import { launchScene } from "./scene.js";
import { settings, setSetting, onSettingsChange } from "./settings.js";

export const LINKS_ME = [
  { label: "neo-polita", url: "https://discord.gg/2KVRMDHCnN", icon: "🌐" },
  { label: "hazel/run", url: "https://discord.gg/kH8N2wUmMC", icon: "🌐" },
  { label: "github", url: "https://github.com/vanillyn", icon: "🌐" },
  { label: "twitch", url: "https://twitch.tv/vanillynBot", icon: "🌐" },
];
export const LINKS_FRIENDS = [
  { label: "!", url: "https://powuts.straw.page", icon: "🌐" },
];
export const LINKS_SERVICES = [
  { label: "niskbot", url: "https://vanillyn.github.io/dashboard", icon: "🌐" },
];

const HUB_FRIENDS_COLOR = "#3af";
const HUB_SERVICES_COLOR = "#3f9";
const RETURN_COLOR = "#f44";
const DATA_NODE_COLOR = "#ffdd00";
const SETTINGS_NODE_COLOR = "#c8aaff";

export const DATA_ENTRIES = [
  {
    label: "placeholder",
    popup: { type: "text", content: "placeholder text :3" },
  },
  {
    label: "about me",
    popup: {
      type: "mixed",
      blocks: [
        {
          type: "image",
          src: "https://static-cdn.jtvnw.net/jtv_user_pictures/07e4d1f2-5acc-4086-b0d6-9f1ddabe916f-profile_image-70x70.png",
        },
        {
          type: "text",
          content:
            'im vanillyn. i sorta just behave how people like me too. i prioritize being likable over anything else, which is ironic considering how many people dislike me. this includes not really having a gender or sexuality. i am whatever you see me as. id say im good with programming and troubleshooting. i really love computers and really love helping people with it. anything with computers, really. i wish i could say "i do this specific thing and asking me to do anything else wont work" but really i do everything. i dont have many friends, if at all. i wish to be able to talk to people more often in private, because i miss being able to be myself, but i guess people dont want myself. its fine either way. thanks for checking out my website btw. i dont do anything right now, but i promise there will be cool projects.',
        },
      ],
    },
  },
  {
    label: "current version",
    popup: { type: "text", content: "website version 1.6" },
  },
  {
    label: "about the website",
    popup: {
      type: "text",
      content:
        'this website is sorta just a culmination of me having made websites for a while, i just dont want to have a "normal" ui and just choose to do this.',
    },
  },
  { label: "scene test", popup: { type: "script", sceneId: "cube" } },
  {
    label: "submenu test",
    submenu: [
      {
        label: "placeholder a",
        popup: { type: "text", content: "a description placeholder." },
      },
      {
        label: "placeholder b",
        popup: { type: "text", content: "b description placeholder." },
      },
      {
        label: "nested submenu",
        submenu: [
          {
            label: "placeholder c",
            popup: { type: "text", content: "the ultimate placeholder." },
          },
        ],
      },
    ],
  },
];

const NODE_GEOS = [
  () => new THREE.SphereGeometry(0.09, 10, 10),
  () => new THREE.IcosahedronGeometry(0.1, 0),
  () => new THREE.OctahedronGeometry(0.1, 0),
  () => new THREE.TetrahedronGeometry(0.11, 0),
];

const labelsContainer = document.getElementById("labels-container");
export const allLayerMats = [];
export const layers = {};
export let clickables = [];
export let labelEls = [];
export let activeLayer = "me";
export let hubFriends, hubServices, returnNode;
export let dataNode = null;
export let settingsNode = null;

let _artifactGroup = null;
let dataMenuMeshes = [],
  dataMenuEls = [],
  dataMenuMats = [];
let subMenuStack = [];
const opacityTweens = new Map();

let settingsDialog = null;

function buildSettingsDialog() {
  if (settingsDialog) {
    settingsDialog.style.display = "block";
    return;
  }
  const el = document.createElement("div");
  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(5,5,8,0.97);border:1px solid ${SETTINGS_NODE_COLOR};
    color:${SETTINGS_NODE_COLOR};font-family:'Geist Mono',monospace;font-size:12px;
    padding:26px 32px;width:340px;max-width:90vw;
    letter-spacing:1px;line-height:2;z-index:500;pointer-events:auto;
  `;

  function row(label, inputHtml) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(200,170,255,0.1);padding:6px 0;">
      <span style="font-size:10px;color:#9a8acc;">${label}</span>${inputHtml}
    </div>`;
  }

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
      <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;">settings</span>
      <span id="settings-close" style="cursor:pointer;opacity:0.4;font-size:16px;">✕</span>
    </div>
    ${row(
      "fov",
      `<div style="display:flex;align-items:center;gap:8px;">
      <input id="s-fov" type="range" min="30" max="100" value="${settings.fov}" style="width:110px;accent-color:${SETTINGS_NODE_COLOR};">
      <span id="s-fov-val" style="width:28px;text-align:right;font-size:11px;">${settings.fov}</span>
    </div>`,
    )}
    ${row(
      "sensitivity",
      `<div style="display:flex;align-items:center;gap:8px;">
      <input id="s-sens" type="range" min="20" max="200" value="${Math.round(settings.mouseSensitivity * 100)}" style="width:110px;accent-color:${SETTINGS_NODE_COLOR};">
      <span id="s-sens-val" style="width:28px;text-align:right;font-size:11px;">${settings.mouseSensitivity.toFixed(1)}</span>
    </div>`,
    )}
    <div style="margin-top:18px;font-size:9px;color:#5a4a8a;letter-spacing:1px;">changes apply immediately</div>
  `;

  document.body.appendChild(el);
  settingsDialog = el;

  el.querySelector("#settings-close").addEventListener("click", () => {
    el.style.display = "none";
  });

  const fovSlider = el.querySelector("#s-fov");
  const fovVal = el.querySelector("#s-fov-val");
  fovSlider.addEventListener("input", () => {
    const v = parseInt(fovSlider.value);
    fovVal.textContent = v;
    setSetting("fov", v);
  });

  const sensSlider = el.querySelector("#s-sens");
  const sensVal = el.querySelector("#s-sens-val");
  sensSlider.addEventListener("input", () => {
    const v = parseInt(sensSlider.value) / 100;
    sensVal.textContent = v.toFixed(1);
    setSetting("mouseSensitivity", v);
  });
}

export function fadeMat(mat, target, speed = 0.04) {
  opacityTweens.set(mat, { target, speed });
}

export function tickOpacity() {
  opacityTweens.forEach((tw, mat) => {
    const cur = mat.uniforms.uOpacity.value;
    const next = cur + (tw.target - cur) * tw.speed;
    mat.uniforms.uOpacity.value =
      Math.abs(next - tw.target) < 0.001 ? tw.target : next;
    mat.visible = mat.uniforms.uOpacity.value > 0.001;
    if (mat.uniforms.uOpacity.value === tw.target) opacityTweens.delete(mat);
  });
}

function makeLine(p1, p2, mat) {
  const d = p1.distanceTo(p2);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, d, 6), mat);
  m.position.copy(p2.clone().add(p1).divideScalar(2));
  m.lookAt(p2);
  m.rotateX(Math.PI / 2);
  return m;
}

function makeHubNode(label, hexColor, pos, group) {
  const mat = makeLineMat(hexColor, 0);
  allLayerMats.push(mat);
  const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), mat);
  node.position.copy(pos);
  node.userData = { isHub: true, label };
  group.add(node);
  const div = document.createElement("div");
  div.className = "track-label";
  div.innerText = label;
  labelsContainer.appendChild(div);
  return { mesh: node, el: div, mat };
}

function buildLayer(links, hexColor, group) {
  const mat = makeLineMat(hexColor, 0);
  allLayerMats.push(mat);
  const meshes = [],
    els = [];
  links.forEach((lk, idx) => {
    let cur = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
    );
    for (let s = 0; s < 5 + Math.floor(Math.random() * 5); s++) {
      const nxt = cur.clone(),
        ax = Math.floor(Math.random() * 3);
      const dr = Math.random() > 0.5 ? 1 : -1,
        d = 0.7 + Math.random() * 0.8;
      if (ax === 0) nxt.x += dr * d;
      else if (ax === 1) nxt.y += dr * d;
      else nxt.z += dr * d;
      group.add(makeLine(cur, nxt, mat));
      cur = nxt;
    }
    const node = new THREE.Mesh(NODE_GEOS[idx % NODE_GEOS.length](), mat);
    node.position.copy(cur);
    node.userData = { url: lk.url, label: lk.label };
    group.add(node);
    meshes.push(node);
    const div = document.createElement("div");
    div.className = "track-label";
    div.innerText = lk.label;
    labelsContainer.appendChild(div);
    els.push({ mesh: node, el: div });
  });
  return { meshes, labelEls: els, mat, clickableNodes: meshes };
}

const popupEl = (() => {
  const el = document.createElement("div");
  el.id = "data-popup";
  el.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(5,5,5,0.97);border:1px solid #ffdd00;
    color:#ffdd00;font-family:'Geist Mono',monospace;font-size:13px;
    padding:22px 30px;max-width:480px;width:90vw;text-align:center;
    letter-spacing:1px;line-height:1.7;z-index:500;
    display:none;pointer-events:auto;max-height:80vh;overflow-y:auto;`;
  const closeBtn = document.createElement("div");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText =
    "position:sticky;top:0;float:right;cursor:pointer;opacity:0.5;font-size:16px;padding:0 0 8px 12px;";
  closeBtn.onclick = () => {
    el.style.display = "none";
  };
  el.appendChild(closeBtn);
  const body = document.createElement("div");
  body.id = "data-popup-body";
  el.appendChild(body);
  document.body.appendChild(el);
  return { el, body };
})();

export function showdataPopup(popup) {
  if (popup?.type === "script") {
    launchScene(popup.sceneId);
    return;
  }
  popupEl.body.innerHTML = "";
  if (!popup || typeof popup === "string") {
    const t = document.createElement("span");
    t.textContent = popup || "";
    popupEl.body.appendChild(t);
    popupEl.el.style.display = "block";
    return;
  }
  switch (popup.type) {
    case "text": {
      const t = document.createElement("p");
      t.style.margin = "0";
      t.textContent = popup.content;
      popupEl.body.appendChild(t);
      break;
    }
    case "image": {
      const img = document.createElement("img");
      img.src = popup.src;
      img.style.cssText =
        "max-width:100%;border:1px solid #ffdd0066;display:block;margin:0 auto 10px;";
      popupEl.body.appendChild(img);
      break;
    }
    case "mixed": {
      (popup.blocks || []).forEach((block) => {
        if (block.type === "text") {
          const t = document.createElement("p");
          t.style.cssText = "margin:0 0 10px;";
          t.textContent = block.content;
          popupEl.body.appendChild(t);
        } else if (block.type === "image") {
          const img = document.createElement("img");
          img.src = block.src;
          img.style.cssText =
            "max-width:100%;border:1px solid #ffdd0066;display:block;margin:0 auto 10px;";
          popupEl.body.appendChild(img);
        }
      });
      break;
    }
    default: {
      const t = document.createElement("span");
      t.textContent = JSON.stringify(popup);
      popupEl.body.appendChild(t);
    }
  }
  popupEl.el.style.display = "block";
}

function pushSubMenu(entries, group) {
  const meshes = [],
    els = [],
    mats = [];
  entries.forEach((entry, i) => {
    const mat = makeLineMat(DATA_NODE_COLOR, 0);
    allLayerMats.push(mat);
    mats.push(mat);
    const angle = (i / entries.length) * Math.PI * 2,
      r = 2.0;
    const pos = new THREE.Vector3(
      Math.cos(angle) * r,
      Math.sin(angle) * r * 0.7,
      0.8,
    );
    const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), mat);
    node.position.copy(pos);
    node.userData = entry.submenu
      ? {
          isDataEntry: true,
          isSubMenuHub: true,
          label: entry.label,
          subEntries: entry.submenu,
        }
      : { isDataEntry: true, label: entry.label, popup: entry.popup };
    group.add(node);
    meshes.push(node);
    const div = document.createElement("div");
    div.className = "track-label";
    div.innerText = entry.label;
    div.style.color = DATA_NODE_COLOR;
    div.style.fontSize = "9px";
    labelsContainer.appendChild(div);
    els.push({ mesh: node, el: div });
  });
  mats.forEach((m) => fadeMat(m, 1, 0.06));
  subMenuStack.push({ meshes, els, mats, entries });
}

function popSubMenuLevel(group) {
  const top = subMenuStack.pop();
  if (!top) return;
  top.meshes.forEach((m) => group && group.remove(m));
  top.els.forEach(({ el }) => el.remove());
  top.mats.forEach((m) => {
    opacityTweens.delete(m);
    m.uniforms.uOpacity.value = 0;
    m.visible = false;
  });
}

function clearAllSubMenus(group) {
  while (subMenuStack.length) popSubMenuLevel(group);
}
function currentSubLevel() {
  return subMenuStack.length ? subMenuStack[subMenuStack.length - 1] : null;
}

export function openSubMenu(entries) {
  const prev = currentSubLevel();
  if (prev) {
    prev.mats.forEach((m) => fadeMat(m, 0, 0.05));
    prev.els.forEach(({ el }) => {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    });
  } else dataMenuMats.forEach((m) => fadeMat(m, 0, 0.05));
  pushSubMenu(entries, _artifactGroup);
  if (returnNode) {
    returnNode.mesh.userData = {
      isReturn: true,
      isReturnToData: true,
      label: "← back",
    };
    returnNode.el.innerText = "← back";
  }
  updateClickables();
}

export function closeSubMenu() {
  if (subMenuStack.length > 1) {
    popSubMenuLevel(_artifactGroup);
    const prev = currentSubLevel();
    if (prev) {
      prev.mats.forEach((m) => fadeMat(m, 1, 0.05));
      prev.els.forEach(({ el }) => {
        el.style.opacity = "";
        el.style.pointerEvents = "";
      });
    }
    updateClickables();
    return;
  }
  clearAllSubMenus(_artifactGroup);
  dataMenuMats.forEach((m) => fadeMat(m, 1, 0.05));
  if (returnNode) {
    returnNode.mesh.userData = {
      isReturn: true,
      isReturnToData: false,
      label: "← return",
    };
    returnNode.el.innerText = "← return";
  }
  updateClickables();
}

function buildDataMenu(group) {
  if (dataMenuMeshes.length) return;
  DATA_ENTRIES.forEach((entry, i) => {
    const mat = makeLineMat(DATA_NODE_COLOR, 0);
    allLayerMats.push(mat);
    dataMenuMats.push(mat);
    const angle = (i / DATA_ENTRIES.length) * Math.PI * 2,
      r = 2.5;
    const pos = new THREE.Vector3(
      Math.cos(angle) * r,
      Math.sin(angle) * r * 0.7,
      0.5,
    );
    const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), mat);
    node.position.copy(pos);
    node.userData = entry.submenu
      ? {
          isDataEntry: true,
          isSubMenuHub: true,
          label: entry.label,
          subEntries: entry.submenu,
        }
      : { isDataEntry: true, label: entry.label, popup: entry.popup };
    group.add(node);
    dataMenuMeshes.push(node);
    const div = document.createElement("div");
    div.className = "track-label";
    div.innerText = entry.label;
    div.style.color = DATA_NODE_COLOR;
    labelsContainer.appendChild(div);
    dataMenuEls.push({ mesh: node, el: div });
  });
}

export function initNav(artifactGroup) {
  _artifactGroup = artifactGroup;
  layers.me = buildLayer(LINKS_ME, "#ffffff", artifactGroup);

  hubFriends = makeHubNode(
    "→ friends",
    HUB_FRIENDS_COLOR,
    new THREE.Vector3(3.5, 1.2, 0.5),
    artifactGroup,
  );
  hubServices = makeHubNode(
    "→ services",
    HUB_SERVICES_COLOR,
    new THREE.Vector3(-3.5, -1.0, 0.3),
    artifactGroup,
  );

  const decMat = makeLineMat("#223355", 1);
  allLayerMats.push(decMat);
  for (let i = 0; i < 6; i++) {
    let cur = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 3,
    );
    for (let s = 0; s < 3 + Math.floor(Math.random() * 4); s++) {
      const nxt = cur.clone(),
        ax = Math.floor(Math.random() * 3);
      const dr = Math.random() > 0.5 ? 1 : -1,
        d = 0.4 + Math.random() * 1.2;
      if (ax === 0) nxt.x += dr * d;
      else if (ax === 1) nxt.y += dr * d;
      else nxt.z += dr * d;
      artifactGroup.add(makeLine(cur, nxt, decMat));
      cur = nxt;
    }
  }

  const smat = makeLineMat(DATA_NODE_COLOR, 0.8);
  allLayerMats.push(smat);
  const snode = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), smat);
  snode.position.set(2.1, -1.9, 0.3);
  snode.userData = { isDataNode: true, label: "data" };
  artifactGroup.add(snode);
  const sdiv = document.createElement("div");
  sdiv.className = "track-label";
  sdiv.innerText = "data";
  sdiv.style.color = DATA_NODE_COLOR;
  labelsContainer.appendChild(sdiv);
  dataNode = { mesh: snode, el: sdiv, mat: smat };

  const stmat = makeLineMat(SETTINGS_NODE_COLOR, 0.8);
  allLayerMats.push(stmat);
  const stnode = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), stmat);
  stnode.position.set(-2.1, 1.9, 0.3);
  stnode.userData = { isSettingsNode: true, label: "settings" };
  artifactGroup.add(stnode);
  const stdiv = document.createElement("div");
  stdiv.className = "track-label";
  stdiv.innerText = "settings";
  stdiv.style.color = SETTINGS_NODE_COLOR;
  labelsContainer.appendChild(stdiv);
  settingsNode = { mesh: stnode, el: stdiv, mat: stmat };

  fadeMat(layers.me.mat, 1, 0.03);
  fadeMat(hubFriends.mat, 0.7, 0.03);
  fadeMat(hubServices.mat, 0.7, 0.03);
  updateClickables();
}

function ensureReturn(artifactGroup) {
  if (!returnNode) {
    returnNode = makeHubNode(
      "← return",
      RETURN_COLOR,
      new THREE.Vector3(0, 3.2, 0.2),
      artifactGroup,
    );
    returnNode.mesh.userData = {
      isReturn: true,
      isReturnToData: false,
      label: "← return",
    };
  }
}

export function activateMe(restoreModel) {
  activeLayer = "me";
  popupEl.el.style.display = "none";
  clearAllSubMenus(_artifactGroup);
  fadeMat(layers.me.mat, 1, 0.05);
  fadeMat(hubFriends.mat, 0.7, 0.05);
  fadeMat(hubServices.mat, 0.7, 0.05);
  if (layers.friends) fadeMat(layers.friends.mat, 0, 0.05);
  if (layers.services) fadeMat(layers.services.mat, 0, 0.05);
  if (returnNode) fadeMat(returnNode.mat, 0, 0.05);
  if (dataNode) fadeMat(dataNode.mat, 0.8, 0.05);
  if (settingsNode) fadeMat(settingsNode.mat, 0.8, 0.05);
  dataMenuMats.forEach((m) => fadeMat(m, 0, 0.05));
  if (restoreModel) restoreModel();
  updateClickables();
}

export function activateFriends(artifactGroup) {
  if (!layers.friends)
    layers.friends = buildLayer(
      LINKS_FRIENDS,
      HUB_FRIENDS_COLOR,
      artifactGroup,
    );
  activeLayer = "friends";
  fadeMat(layers.me.mat, 0, 0.05);
  fadeMat(hubFriends.mat, 0, 0.05);
  fadeMat(hubServices.mat, 0, 0.05);
  fadeMat(layers.friends.mat, 1, 0.05);
  if (layers.services) fadeMat(layers.services.mat, 0, 0.05);
  if (dataNode) fadeMat(dataNode.mat, 0, 0.05);
  if (settingsNode) fadeMat(settingsNode.mat, 0, 0.05);
  dataMenuMats.forEach((m) => fadeMat(m, 0, 0.05));
  clearAllSubMenus(artifactGroup);
  ensureReturn(artifactGroup);
  returnNode.mesh.userData = {
    isReturn: true,
    isReturnToData: false,
    label: "← return",
  };
  returnNode.el.innerText = "← return";
  fadeMat(returnNode.mat, 0.8, 0.05);
  updateClickables();
}

export function activateServices(artifactGroup) {
  if (!layers.services)
    layers.services = buildLayer(
      LINKS_SERVICES,
      HUB_SERVICES_COLOR,
      artifactGroup,
    );
  activeLayer = "services";
  fadeMat(layers.me.mat, 0, 0.05);
  fadeMat(hubFriends.mat, 0, 0.05);
  fadeMat(hubServices.mat, 0, 0.05);
  if (layers.friends) fadeMat(layers.friends.mat, 0, 0.05);
  fadeMat(layers.services.mat, 1, 0.05);
  if (dataNode) fadeMat(dataNode.mat, 0, 0.05);
  if (settingsNode) fadeMat(settingsNode.mat, 0, 0.05);
  dataMenuMats.forEach((m) => fadeMat(m, 0, 0.05));
  clearAllSubMenus(artifactGroup);
  ensureReturn(artifactGroup);
  returnNode.mesh.userData = {
    isReturn: true,
    isReturnToData: false,
    label: "← return",
  };
  returnNode.el.innerText = "← return";
  fadeMat(returnNode.mat, 0.8, 0.05);
  updateClickables();
}

export function activatedataMenu(artifactGroup) {
  buildDataMenu(artifactGroup);
  activeLayer = "data";
  fadeMat(layers.me.mat, 0, 0.05);
  fadeMat(hubFriends.mat, 0, 0.05);
  fadeMat(hubServices.mat, 0, 0.05);
  if (layers.friends) fadeMat(layers.friends.mat, 0, 0.05);
  if (layers.services) fadeMat(layers.services.mat, 0, 0.05);
  if (dataNode) fadeMat(dataNode.mat, 0, 0.05);
  if (settingsNode) fadeMat(settingsNode.mat, 0, 0.05);
  dataMenuMats.forEach((m) => fadeMat(m, 1, 0.05));
  ensureReturn(artifactGroup);
  returnNode.mesh.userData = {
    isReturn: true,
    isReturnToData: false,
    label: "← return",
  };
  returnNode.el.innerText = "← return";
  fadeMat(returnNode.mat, 0.8, 0.05);
  updateClickables();
}

function updateClickables() {
  clickables = [];
  labelEls = [];
  if (activeLayer === "me") {
    clickables.push(
      ...layers.me.clickableNodes,
      hubFriends.mesh,
      hubServices.mesh,
    );
    if (dataNode) clickables.push(dataNode.mesh);
    if (settingsNode) clickables.push(settingsNode.mesh);
    labelEls.push(
      ...layers.me.labelEls,
      { mesh: hubFriends.mesh, el: hubFriends.el },
      { mesh: hubServices.mesh, el: hubServices.el },
    );
    if (dataNode) labelEls.push({ mesh: dataNode.mesh, el: dataNode.el });
    if (settingsNode)
      labelEls.push({ mesh: settingsNode.mesh, el: settingsNode.el });
  } else if (activeLayer === "friends") {
    clickables.push(...layers.friends.clickableNodes);
    if (returnNode) clickables.push(returnNode.mesh);
    labelEls.push(...layers.friends.labelEls);
    if (returnNode) labelEls.push({ mesh: returnNode.mesh, el: returnNode.el });
  } else if (activeLayer === "services") {
    clickables.push(...layers.services.clickableNodes);
    if (returnNode) clickables.push(returnNode.mesh);
    labelEls.push(...layers.services.labelEls);
    if (returnNode) labelEls.push({ mesh: returnNode.mesh, el: returnNode.el });
  } else if (activeLayer === "data") {
    const top = currentSubLevel();
    if (top) {
      clickables.push(...top.meshes);
      labelEls.push(...top.els);
    } else {
      clickables.push(...dataMenuMeshes);
      labelEls.push(...dataMenuEls);
    }
    if (returnNode) {
      clickables.push(returnNode.mesh);
      labelEls.push({ mesh: returnNode.mesh, el: returnNode.el });
    }
  }

  const activeEls = new Set(labelEls.map((x) => x.el));
  const allEls = [
    ...(layers.me?.labelEls ?? []),
    ...(layers.friends?.labelEls ?? []),
    ...(layers.services?.labelEls ?? []),
    { el: hubFriends?.el },
    { el: hubServices?.el },
    ...(returnNode ? [{ el: returnNode.el }] : []),
    ...dataMenuEls,
    ...subMenuStack.flatMap((l) => l.els),
    ...(dataNode ? [{ el: dataNode.el }] : []),
    ...(settingsNode ? [{ el: settingsNode.el }] : []),
  ];
  allEls.forEach(({ el }) => {
    if (!el) return;
    el.style.opacity = activeEls.has(el) ? "" : "0";
    el.style.pointerEvents = activeEls.has(el) ? "" : "none";
  });
}

export function openSettingsDialog() {
  buildSettingsDialog();
}
