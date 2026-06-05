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
  activateMe,
  activateFriends,
  activateServices,
  tickOpacity,
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
import { isIyrsOpen, openIyrs } from "./src/iyrs.js";
import { initMobile } from "./src/mobile.js";
import { initPaintTex, getPaintTexture, paintAt } from "./src/paint.js";

initScene();
initModelGroup(scene, curMat);

const paintTex = initPaintTex();
paintMat.uniforms.uPaintTex.value = paintTex;

const artifactGroup = new THREE.Group();
scene.add(artifactGroup);

initNav(artifactGroup);
loadStartupModel();

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

let prevRotY = 0,
  prevRotX = 0;

function updateSub() {
  const sub = document.getElementById("shader-sub");
  sub.textContent = getCustomMat() ? "custom" : matNames[getMatIdx()];
  document
    .querySelectorAll(".ctx-active-item")
    .forEach((el) => el.classList.remove("ctx-active-item"));
  if (!getCustomMat()) {
    const ids = [
      "ctx-sh-voxel",
      "ctx-sh-vhs",
      "ctx-sh-glass",
      "ctx-sh-noise",
      "ctx-sh-sketch",
      "ctx-sh-pixelate",
      "ctx-sh-lightup",
      "ctx-sh-liquid",
      "ctx-sh-distort",
      "ctx-sh-wireframe",
      "ctx-sh-watercolor",
      "ctx-sh-motionblur",
      "ctx-sh-metallic",
      "ctx-sh-paint",
    ];
    const el = document.getElementById(ids[getMatIdx()]);
    if (el) el.classList.add("ctx-active-item");
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
document.getElementById("name-span").addEventListener("contextmenu", (e) => {
  e.preventDefault();
  e.stopPropagation();
  ctxMenu.style.cssText = `display:block;left:${e.clientX}px;top:${e.clientY}px`;
});
document.addEventListener("click", () => (ctxMenu.style.display = "none"));
document.addEventListener("contextmenu", (e) => {
  if (!e.target.closest("#shader-ctx-menu") && e.target.id !== "name-span")
    ctxMenu.style.display = "none";
});

const shaderPicks = [
  ["ctx-sh-voxel", 0],
  ["ctx-sh-vhs", 1],
  ["ctx-sh-glass", 2],
  ["ctx-sh-noise", 3],
  ["ctx-sh-sketch", 4],
  ["ctx-sh-pixelate", 5],
  ["ctx-sh-lightup", 6],
  ["ctx-sh-liquid", 7],
  ["ctx-sh-distort", 8],
  ["ctx-sh-wireframe", 9],
  ["ctx-sh-watercolor", 10],
  ["ctx-sh-motionblur", 11],
  ["ctx-sh-metallic", 12],
  ["ctx-sh-paint", 13],
];
shaderPicks.forEach(([id, idx]) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", () => {
    ctxMenu.style.display = "none";
    setMatByIdx(idx, doApplyMat);
  });
});

document.getElementById("ctx-mesh-tknot").addEventListener("click", () => {
  ctxMenu.style.display = "none";
  spawnFallback(() => new THREE.TorusKnotGeometry(1, 0.32, 128, 32));
});
document.getElementById("ctx-mesh-ico").addEventListener("click", () => {
  ctxMenu.style.display = "none";
  spawnFallback(() => new THREE.IcosahedronGeometry(1.2, 1));
});
document.getElementById("ctx-mesh-octa").addEventListener("click", () => {
  ctxMenu.style.display = "none";
  spawnFallback(() => new THREE.OctahedronGeometry(1.4, 0));
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
      activateMe();
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
        activateMe();
        return;
      }
      const u = obj.userData.url;
      if (u) window.open(u, "_blank");
    }
  },
  onHoldStart: ({ clientX, clientY }) => {
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
  if (motionBlurMat.uniforms?.uVelocity) {
    motionBlurMat.uniforms.uVelocity.value.set(rotVelY * 10, rotVelX * 10, 0);
  }
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

  raycaster.setFromCamera(mouse, camera);
  const li = raycaster.intersectObjects(clickables);
  const mi = raycaster.intersectObjects(getModelGroup().children, true);

  let hovNode = null;
  if (!isIyrsOpen()) {
    if (li.length) {
      document.body.style.cursor = "pointer";
      hovNode = li[0].object;
      const ud = hovNode.userData;
      showTooltip(ud.isHub || ud.isReturn ? ud.label : `url: ${ud.url}`);
      hoverTarget = 0;
    } else if (mi.length) {
      document.body.style.cursor = "pointer";
      showTooltip("upload custom model (.gltf/.glb)");
      hoverTarget = 1;
      hoverU.uHoverPos.value.copy(
        getModelGroup().worldToLocal(mi[0].point.clone()),
      );
    } else {
      document.body.style.cursor = "default";
      hideTooltip();
      hoverTarget = 0;
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
