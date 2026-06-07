import {
  initScene,
  scene,
  camera,
  renderer,
  clock,
  raycaster,
  mouse,
} from "./src/scene.js";
import {
  materials,
  matNames,
  hoverU,
  bgMat,
  curMat,
  getMatIdx,
  getCustomMat,
  setCustomMat,
  cycleMat,
  setMatByIdx,
  hoverLinkedMats,
  timeMats,
  makeLineMat,
  paintMat,
  motionBlurMat,
  wireframeMat,
} from "./src/materials.js";
import {
  initModelGroup,
  getModelGroup,
  spawnFallback,
  loadGLTF,
  loadStartupModel,
  applyMatToModel,
} from "./src/model.js";
import {
  initNav,
  allLayerMats,
  layers,
  clickables,
  labelEls,
  hubFriends,
  hubServices,
  returnNode,
  dataNode,
  activateMe,
  activateFriends,
  activateServices,
  activatedataMenu,
  tickOpacity,
  showdataPopup,
} from "./src/nav.js";
import {
  drawPost,
  drawVhs,
  startHold,
  cancelHold,
  showTooltip,
  hideTooltip,
  labelPos,
} from "./src/ui.js";
import { isIyrsOpen, openIyrs, anotherChance } from "./src/iyrs.js";
import { initMobile } from "./src/mobile.js";
import { initPaintTex, paintAt } from "./src/paint.js";
initScene();
initModelGroup(scene, curMat);

const paintTex = initPaintTex();
paintMat.uniforms.uPaintTex.value = paintTex;

const artifactGroup = new THREE.Group();
scene.add(artifactGroup);

initNav(artifactGroup);

const randomdonut = Math.random() < 0.08;
if (randomdonut) {
  spawnFallback(() => new THREE.TorusGeometry(1.0, 0.38, 64, 128));
} else {
  loadStartupModel();
}

if (anotherChance) {
  const ns = document.getElementById("name-span");
  if (ns) ns.textContent = anotherChance;
}

function restoreModel() {
  const mg = getModelGroup();
  if (mg.children.length === 0) loadStartupModel();
}

let isLight = false;
let lightTween = 0;

function applyTheme(light) {
  isLight = light;
  document.documentElement.classList.toggle("light", light);
  const ctxTheme = document.getElementById("ctx-theme");
  if (ctxTheme) ctxTheme.textContent = light ? "dark mode" : "light mode";
}

document.getElementById("ctx-theme")?.addEventListener("click", () => {
  ctxMenu.style.display = "none";
  applyTheme(!isLight);
});

let previewRenderer = null;
let previewScene = null;
let previewCamera = null;
const previewGeo = new THREE.IcosahedronGeometry(0.8, 1);
const previewMesh = new THREE.Mesh(previewGeo, materials[0]);

function initPreviewRenderer() {
  if (previewRenderer) return;
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 80;
  previewRenderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  previewRenderer.setSize(80, 80);
  previewScene = new THREE.Scene();
  previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  previewCamera.position.z = 2.5;
  previewScene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0);
  dl.position.set(2, 3, 2);
  previewScene.add(dl);
  previewScene.add(previewMesh);
}

function renderPreview(mat, t) {
  initPreviewRenderer();
  previewMesh.material = mat;
  if (mat.uniforms?.time) mat.uniforms.time.value = t;
  previewRenderer.render(previewScene, previewCamera);
  return previewRenderer.domElement.toDataURL();
}

let mouseX = 0,
  mouseY = 0,
  mousePosNX = 0,
  mousePosNY = 0;
let camZoom = 10,
  camZoomActual = 10,
  camTX = 0,
  camTY = 0;
let hoverTarget = 0;
const BASE_FOV = 45;
let hoverTimer = null;
let isHoveringModel = false;
let prevRotY = 0,
  prevRotX = 0;
let flashEl = null;

function updateSub() {
  const sub = document.getElementById("shader-sub");
  sub.textContent = getCustomMat() ? "custom" : matNames[getMatIdx()];
  document
    .querySelectorAll(".shader-grid-cell")
    .forEach((el) => el.classList.remove("ctx-active-item"));
  if (!getCustomMat()) {
    const active = document.querySelector(
      `.shader-grid-cell[data-idx="${getMatIdx()}"]`,
    );
    if (active) active.classList.add("ctx-active-item");
  }
}

function doApplyMat() {
  applyMatToModel();
  updateSub();
}

document.getElementById("name-span").addEventListener("click", (e) => {
  e.stopPropagation();
  cycleMat(doApplyMat);
});
document.getElementById("shader-sub").addEventListener("click", (e) => {
  e.stopPropagation();
  cycleMat(doApplyMat);
});

const ctxMenu = document.getElementById("shader-ctx-menu");

function buildShaderGrid() {
  const grid = document.getElementById("shader-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const t = clock.getElapsedTime();
  matNames.forEach((name, idx) => {
    const cell = document.createElement("div");
    cell.className = "shader-grid-cell";
    cell.setAttribute("data-idx", idx);

    try {
      const img = document.createElement("img");
      img.className = "shader-grid-preview";
      img.style.cssText =
        "width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;";
      img.src = renderPreview(materials[idx], t);
      cell.style.position = "relative";
      cell.style.overflow = "hidden";
      cell.appendChild(img);
    } catch (e) {}

    const label = document.createElement("span");
    label.className = "shader-grid-label";
    label.textContent = name;
    label.style.position = "relative";
    label.style.zIndex = "1";
    cell.appendChild(label);

    cell.addEventListener("click", () => {
      ctxMenu.style.display = "none";
      setMatByIdx(idx, doApplyMat);
    });
    grid.appendChild(cell);
  });
}

document.getElementById("name-span").addEventListener("contextmenu", (e) => {
  e.preventDefault();
  e.stopPropagation();
  buildShaderGrid();
  ctxMenu.style.cssText = `display:block;left:${e.clientX}px;top:${e.clientY}px`;
  updateSub();
});
document.addEventListener("click", () => (ctxMenu.style.display = "none"));
document.addEventListener("contextmenu", (e) => {
  if (!e.target.closest("#shader-ctx-menu") && e.target.id !== "name-span")
    ctxMenu.style.display = "none";
});

const meshHandlers = {
  "ctx-mesh-tknot": () =>
    spawnFallback(() => new THREE.TorusKnotGeometry(1, 0.32, 128, 32)),
  "ctx-mesh-ico": () =>
    spawnFallback(() => new THREE.IcosahedronGeometry(1.2, 1)),
  "ctx-mesh-octa": () =>
    spawnFallback(() => new THREE.OctahedronGeometry(1.4, 0)),
  "ctx-mesh-ball": () =>
    spawnFallback(() => new THREE.SphereGeometry(1, 32, 16)),
  "ctx-mesh-cone": () => spawnFallback(() => new THREE.ConeGeometry(1, 2, 32)),
  "ctx-mesh-dode": () =>
    spawnFallback(() => new THREE.DodecahedronGeometry(1.2)),
  "ctx-mesh-duck": () =>
    loadGLTF(
      "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf",
    ),
  "ctx-mesh-milk": () =>
    loadGLTF(
      "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf",
    ),
};

Object.entries(meshHandlers).forEach(([id, handler]) => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener("click", () => {
      ctxMenu.style.display = "none";
      handler();
    });
  }
});

document.getElementById("ctx-mesh-milk").addEventListener("click", () => {
  ctxMenu.style.display = "none";
  loadGLTF(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf",
  );
});
document.getElementById("ctx-upload-model").addEventListener("click", () => {
  ctxMenu.style.display = "none";
  document.getElementById("model-upload").click();
});
document.getElementById("ctx-upload-shader").addEventListener("click", () => {
  ctxMenu.style.display = "none";
  document.getElementById("shader-upload").click();
});

document.getElementById("model-upload").addEventListener("change", (e) => {
  if (e.target.files[0]) loadGLTF(URL.createObjectURL(e.target.files[0]));
});
document.getElementById("shader-upload").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      setCustomMat(
        new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, ...hoverU },
          vertexShader: `varying vec3 vNormal,vPos;varying vec2 vUv;void main(){vNormal=normal;vPos=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader: ev.target.result,
        }),
      );
      doApplyMat();
    } catch (err) {
      console.warn(err);
      setCustomMat(null);
    }
  };
  r.readAsText(f);
});

function flashAndReload() {
  if (flashEl) return;
  const hue = Math.floor(Math.random() * 360);
  flashEl = document.createElement("div");
  flashEl.style.cssText = `
    position:fixed;inset:0;z-index:9999;pointer-events:none;
    background:hsl(${hue},80%,60%);opacity:0;
    transition:opacity 0.06s ease;
  `;
  document.body.appendChild(flashEl);
  requestAnimationFrame(() => {
    flashEl.style.opacity = "1";
    setTimeout(() => {
      flashEl.style.opacity = "0";
      setTimeout(() => location.reload(), 200);
    }, 80);
  });
}

const holdExcluded = new Set([
  document.getElementById("name-span"),
  document.getElementById("shader-sub"),
  document.getElementById("bio-span"),
]);
function isExcluded(e) {
  if (holdExcluded.has(e.target)) return true;
  if (isIyrsOpen()) return true;
  raycaster.setFromCamera(mouse, camera);
  return (
    raycaster.intersectObjects(clickables).length > 0 ||
    raycaster.intersectObjects(getModelGroup().children, true).length > 0
  );
}

document.addEventListener("mousedown", (e) =>
  startHold(e, isExcluded, openIyrs),
);
document.addEventListener("mouseup", cancelHold);
document.addEventListener("mouseleave", cancelHold);

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX - innerWidth / 2;
  mouseY = e.clientY - innerHeight / 2;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -((e.clientY / innerHeight) * 2 - 1);
  bgMat.uniforms.uMouse.value.set(
    e.clientX / innerWidth,
    1 - e.clientY / innerHeight,
  );
  mousePosNX = mouse.x;
  mousePosNY = mouse.y;
  if (!isIyrsOpen()) {
    camTX = mousePosNX * 0.5;
    camTY = mousePosNY * 0.5;
  }

  if (getMatIdx() === 13 && !getCustomMat()) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(getModelGroup().children, true);
    if (hits.length && hits[0].uv) paintAt(hits[0].uv);
  }
});

document.addEventListener(
  "wheel",
  (e) => {
    if (isIyrsOpen()) return;
    e.preventDefault();
    camZoom = Math.max(4, Math.min(20, camZoom + e.deltaY * 0.015));
  },
  { passive: false },
);

document.addEventListener("click", () => {
  if (isIyrsOpen()) return;
  raycaster.setFromCamera(mouse, camera);
  const li = raycaster.intersectObjects(clickables);
  const mi = raycaster.intersectObjects(getModelGroup().children, true);
  if (li.length) {
    const obj = li[0].object;
    if (obj === hubFriends?.mesh) {
      activateFriends(artifactGroup);
      return;
    }
    if (obj === hubServices?.mesh) {
      activateServices(artifactGroup);
      return;
    }
    if (returnNode && obj === returnNode.mesh) {
      activateMe(restoreModel);
      return;
    }
    if (dataNode && obj === dataNode.mesh) {
      const mg = getModelGroup();
      while (mg.children.length) mg.remove(mg.children[0]);
      activatedataMenu(artifactGroup);
      return;
    }
    if (obj.userData.isdataEntry) {
      showdataPopup(obj.userData.popup);
      return;
    }
    const u = obj.userData.url;
    if (u) window.open(u, "_blank");
  } else if (mi.length) {
    document.getElementById("model-upload").click();
  }
});

initMobile({
  mouse,
  bgMat,
  onTap: ({ clientX, clientY }) => {
    if (isIyrsOpen()) return;
    mouse.x = (clientX / innerWidth) * 2 - 1;
    mouse.y = -((clientY / innerHeight) * 2 - 1);
    raycaster.setFromCamera(mouse, camera);
    const li = raycaster.intersectObjects(clickables);
    if (li.length) {
      const obj = li[0].object;
      if (obj === hubFriends?.mesh) {
        activateFriends(artifactGroup);
        return;
      }
      if (obj === hubServices?.mesh) {
        activateServices(artifactGroup);
        return;
      }
      if (returnNode && obj === returnNode.mesh) {
        activateMe(restoreModel);
        return;
      }
      if (dataNode && obj === dataNode.mesh) {
        const mg = getModelGroup();
        while (mg.children.length) mg.remove(mg.children[0]);
        activatedataMenu(artifactGroup);
        return;
      }
      if (obj.userData.isdataEntry) {
        showdataPopup(obj.userData.popup);
        return;
      }
      const u = obj.userData.url;
      if (u) window.open(u, "_blank");
    }
  },
  onHoldStart: () => {
    if (!isIyrsOpen()) openIyrs();
  },
  onHoldEnd: cancelHold,
  onPinch: (delta) => {
    camZoom = Math.max(4, Math.min(20, camZoom + delta));
  },
  onDrag: (dx, dy) => {
    artifactGroup.rotation.y += dx * 0.005;
    artifactGroup.rotation.x += dy * 0.005;
    mouseX = dx * 0.5;
    mouseY = dy * 0.5;
  },
});

drawVhs();
updateSub();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  const targetLight = isLight ? 1 : 0;
  lightTween += (targetLight - lightTween) * 0.06;
  if (bgMat.uniforms.uLight) bgMat.uniforms.uLight.value = lightTween;

  timeMats.forEach((m) => {
    if (m.uniforms?.time) m.uniforms.time.value = t;
  });
  allLayerMats.forEach((m) => {
    if (m.uniforms?.time) m.uniforms.time.value = t;
  });
  hoverLinkedMats.forEach((m) => {
    if (!m.uniforms) return;
    m.uniforms.time.value = t;
    m.uniforms.uHoverStrength.value = hoverU.uHoverStrength.value;
    m.uniforms.uHoverPos.value.copy(hoverU.uHoverPos.value);
  });
  if (getCustomMat()?.uniforms?.time) getCustomMat().uniforms.time.value = t;

  const rotVelY = artifactGroup.rotation.y - prevRotY;
  const rotVelX = artifactGroup.rotation.x - prevRotX;
  if (motionBlurMat.uniforms?.uVelocity)
    motionBlurMat.uniforms.uVelocity.value.set(rotVelY * 10, rotVelX * 10, 0);
  prevRotY = artifactGroup.rotation.y;
  prevRotX = artifactGroup.rotation.x;

  tickOpacity();

  if (!isIyrsOpen()) {
    camera.position.x += (camTX - camera.position.x) * 0.04;
    camera.position.y += (camTY - camera.position.y) * 0.04;
    camZoomActual += (camZoom - camZoomActual) * 0.08;
    camera.position.z = camZoomActual;
    const d = Math.sqrt(mousePosNX * mousePosNX + mousePosNY * mousePosNY);
    camera.fov += (BASE_FOV + d * 12 - camera.fov) * 0.06;
    camera.updateProjectionMatrix();
  }

  artifactGroup.rotation.y +=
    0.05 * (mouseX * 0.001 - artifactGroup.rotation.y);
  artifactGroup.rotation.x +=
    0.05 * (mouseY * 0.001 - artifactGroup.rotation.x);
  artifactGroup.rotation.z += 0.001;

  if (dataNode?.mesh) {
    dataNode.mesh.rotation.y += 0.02;
    dataNode.mesh.rotation.x += 0.01;
    const pulse = Math.sin(t * 3) * 0.5 + 0.5;
    if (dataNode.mat?.uniforms?.uOpacity)
      dataNode.mat.uniforms.uOpacity.value = 0.5 + pulse * 0.4;
  }

  raycaster.setFromCamera(mouse, camera);
  const li = raycaster.intersectObjects(clickables);
  const mi = raycaster.intersectObjects(getModelGroup().children, true);

  let hovNode = null;
  if (!isIyrsOpen()) {
    if (li.length) {
      document.body.style.cursor = "pointer";
      hovNode = li[0].object;
      const ud = hovNode.userData;
      if (ud.isDataNode) showTooltip("data");
      else if (ud.isDataEntry) showTooltip(ud.label);
      else showTooltip(ud.isHub || ud.isReturn ? ud.label : `url: ${ud.url}`);

      if (isHoveringModel) {
        clearTimeout(hoverTimer);
        isHoveringModel = false;
      }
      hoverTarget = 0;
    } else if (mi.length) {
      document.body.style.cursor = "pointer";
      showTooltip("upload custom model (.gltf/.glb)");
      hoverTarget = 1;
      hoverU.uHoverPos.value.copy(
        getModelGroup().worldToLocal(mi[0].point.clone()),
      );

      if (!isHoveringModel) {
        isHoveringModel = true;
        hoverTimer = setTimeout(() => {
          if (isHoveringModel) {
            flashAndReload();
          }
        }, 10000);
      }
    } else {
      document.body.style.cursor = "default";
      hideTooltip();
      hoverTarget = 0;

      if (isHoveringModel) {
        clearTimeout(hoverTimer);
        isHoveringModel = false;
      }
    }
  }

  hoverU.uHoverStrength.value +=
    (hoverTarget - hoverU.uHoverStrength.value) * 0.06;
  labelEls.forEach((item) =>
    labelPos(
      item.mesh,
      item.el,
      item.mesh === hovNode,
      camera,
      getModelGroup(),
    ),
  );

  renderer.render(scene, camera);
  drawPost(mousePosNX, mousePosNY);
}
animate();
