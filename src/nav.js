import { makeLineMat } from "./materials.js";

const LINKS_ME = [
  { label: "neo-polita", url: "https://discord.gg/2KVRMDHCnN" },
  { label: "hazel/run", url: "https://discord.gg/kH8N2wUmMC" },
  { label: "github", url: "https://github.com/vanillyn" },
  { label: "twitch", url: "https://twitch.tv/vanillynBot" },
];
const LINKS_FRIENDS = [{ label: "!", url: "https://powuts.straw.page" }];
const LINKS_SERVICES = [
  { label: "niskbot", url: "https://vanillyn.github.io/dashboard" },
];

const HUB_FRIENDS_COLOR = "#3af";
const HUB_SERVICES_COLOR = "#3f9";
const RETURN_COLOR = "#f44";
const SECRET_NODE_COLOR = "#ffdd00";

const SECRET_ENTRIES = [{ label: "placeholder", popup: "placeholder text :3" }];

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
export let secretNode = null;

let _artifactGroup = null;
let secretMenuMeshes = [];
let secretMenuEls = [];
let secretMenuMats = [];

const opacityTweens = new Map();

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
  el.id = "secret-popup";
  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(5,5,5,0.97);border:1px solid #ffdd00;
    color:#ffdd00;font-family:'Share Tech Mono',monospace;font-size:13px;
    padding:22px 30px;max-width:360px;text-align:center;
    letter-spacing:1px;line-height:1.7;z-index:500;
    display:none;pointer-events:auto;
  `;
  const closeBtn = document.createElement("div");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `position:absolute;top:8px;right:12px;cursor:pointer;opacity:0.5;font-size:16px;`;
  closeBtn.onclick = () => {
    el.style.display = "none";
  };
  el.appendChild(closeBtn);
  const textNode = document.createElement("span");
  el.appendChild(textNode);
  document.body.appendChild(el);
  return { el, textNode };
})();

export function showSecretPopup(text) {
  popupEl.textNode.textContent = text;
  popupEl.el.style.display = "block";
}

function buildSecretMenu(group) {
  if (secretMenuMeshes.length) return;
  SECRET_ENTRIES.forEach((entry, i) => {
    const mat = makeLineMat(SECRET_NODE_COLOR, 0);
    allLayerMats.push(mat);
    secretMenuMats.push(mat);
    const angle = (i / SECRET_ENTRIES.length) * Math.PI * 2;
    const r = 2.5;
    const pos = new THREE.Vector3(
      Math.cos(angle) * r,
      Math.sin(angle) * r * 0.7,
      0.5,
    );
    const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), mat);
    node.position.copy(pos);
    node.userData = {
      isSecretEntry: true,
      label: entry.label,
      popup: entry.popup,
    };
    group.add(node);
    secretMenuMeshes.push(node);
    const div = document.createElement("div");
    div.className = "track-label";
    div.innerText = entry.label;
    div.style.color = "#ffdd00";
    labelsContainer.appendChild(div);
    secretMenuEls.push({ mesh: node, el: div });
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

  const smat = makeLineMat(SECRET_NODE_COLOR, 0.8);
  allLayerMats.push(smat);
  const snode = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), smat);
  snode.position.set(2.1, -1.9, 0.3);
  snode.userData = { isSecretNode: true, label: "data" };
  artifactGroup.add(snode);
  const sdiv = document.createElement("div");
  sdiv.className = "track-label";
  sdiv.innerText = "data";
  sdiv.style.color = "#ffdd00";
  labelsContainer.appendChild(sdiv);
  secretNode = { mesh: snode, el: sdiv, mat: smat };

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
    returnNode.mesh.userData = { isReturn: true, label: "← return" };
  }
}

export function activateMe(restoreModel) {
  activeLayer = "me";
  fadeMat(layers.me.mat, 1, 0.05);
  fadeMat(hubFriends.mat, 0.7, 0.05);
  fadeMat(hubServices.mat, 0.7, 0.05);
  if (layers.friends) fadeMat(layers.friends.mat, 0, 0.05);
  if (layers.services) fadeMat(layers.services.mat, 0, 0.05);
  if (returnNode) fadeMat(returnNode.mat, 0, 0.05);

  secretMenuMats.forEach((m) => fadeMat(m, 0, 0.05));

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
  secretMenuMats.forEach((m) => fadeMat(m, 0, 0.05));
  ensureReturn(artifactGroup);
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
  secretMenuMats.forEach((m) => fadeMat(m, 0, 0.05));
  ensureReturn(artifactGroup);
  fadeMat(returnNode.mat, 0.8, 0.05);
  updateClickables();
}

export function activateSecretMenu(artifactGroup) {
  buildSecretMenu(artifactGroup);
  activeLayer = "secret";
  fadeMat(layers.me.mat, 0, 0.05);
  fadeMat(hubFriends.mat, 0, 0.05);
  fadeMat(hubServices.mat, 0, 0.05);
  if (layers.friends) fadeMat(layers.friends.mat, 0, 0.05);
  if (layers.services) fadeMat(layers.services.mat, 0, 0.05);
  secretMenuMats.forEach((m) => fadeMat(m, 1, 0.05));

  if (secretNode) fadeMat(secretNode.mat, 0, 0.05);
  ensureReturn(artifactGroup);
  returnNode.mesh.userData = { isReturn: true, label: "← return" };
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
    if (secretNode) clickables.push(secretNode.mesh);
    labelEls.push(
      ...layers.me.labelEls,
      { mesh: hubFriends.mesh, el: hubFriends.el },
      { mesh: hubServices.mesh, el: hubServices.el },
    );
    if (secretNode) labelEls.push({ mesh: secretNode.mesh, el: secretNode.el });
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
  } else if (activeLayer === "secret") {
    clickables.push(...secretMenuMeshes);
    if (returnNode) clickables.push(returnNode.mesh);
    labelEls.push(...secretMenuEls);
    if (returnNode) labelEls.push({ mesh: returnNode.mesh, el: returnNode.el });
  }

  const activeEls = new Set(labelEls.map((x) => x.el));
  const allEls = [
    ...(layers.me?.labelEls ?? []),
    ...(layers.friends?.labelEls ?? []),
    ...(layers.services?.labelEls ?? []),
    { el: hubFriends?.el },
    { el: hubServices?.el },
    ...(returnNode ? [{ el: returnNode.el }] : []),
    ...secretMenuEls,
    ...(secretNode ? [{ el: secretNode.el }] : []),
  ];
  allEls.forEach(({ el }) => {
    if (!el) return;
    el.style.opacity = activeEls.has(el) ? "" : "0";
    el.style.pointerEvents = activeEls.has(el) ? "" : "none";
  });
}
