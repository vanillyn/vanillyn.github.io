import { launchScene, closeScene } from "../scene.js";
import { desktopWarning } from "../mobile.js";
const DESK_Z = -11.5;
const DESK_X = 0;
const MONITOR_INTERACT_DIST = 2.2;

const SCREEN_W = 0.95;
const SCREEN_H = 0.6;
const SCREEN_X = 0;
const SCREEN_Y = 1.38;

function computeMatrix3d(corners, w, h) {
  const [tl, tr, br, bl] = corners;

  function adj(m) {
    return [
      m[4] * m[8] - m[5] * m[7],
      m[2] * m[7] - m[1] * m[8],
      m[1] * m[5] - m[2] * m[4],
      m[5] * m[6] - m[3] * m[8],
      m[0] * m[8] - m[2] * m[6],
      m[2] * m[3] - m[0] * m[5],
      m[3] * m[7] - m[4] * m[6],
      m[1] * m[6] - m[0] * m[7],
      m[0] * m[4] - m[1] * m[3],
    ];
  }
  function multmm(a, b) {
    const c = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        let s = 0;
        for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j];
        c[3 * i + j] = s;
      }
    return c;
  }
  function multmv(m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
    ];
  }
  function basisToPoints(p1, p2, p3, p4) {
    const m = [p1[0], p2[0], p3[0], p1[1], p2[1], p3[1], 1, 1, 1];
    const v = multmv(adj(m), [p4[0], p4[1], 1]);
    return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
  }
  const s = basisToPoints([0, 0], [w, 0], [w, h], [0, h]);
  const d = basisToPoints(tl, tr, br, bl);
  const t = multmm(d, adj(s));
  return [
    t[0] / t[8],
    t[3] / t[8],
    0,
    t[6] / t[8],
    t[1] / t[8],
    t[4] / t[8],
    0,
    t[7] / t[8],
    0,
    0,
    1,
    0,
    t[2] / t[8],
    t[5] / t[8],
    0,
    1,
  ];
}

export function mountForest(container) {
  if (desktopWarning(container, "forest")) return () => {};
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(canvas);

  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;bottom:32px;left:50%;transform:translateX(-50%);" +
    "font-family:'Geist Mono',monospace;font-size:10px;color:rgba(160,210,140,0.5);" +
    "letter-spacing:3px;pointer-events:none;user-select:none;transition:opacity 2s;" +
    "text-align:center;white-space:nowrap;";
  hint.textContent = "...";
  container.appendChild(hint);
  setTimeout(() => {
    hint.style.opacity = "0";
  }, 4000);

  const monitorHint = document.createElement("div");
  monitorHint.style.cssText =
    "position:absolute;bottom:80px;left:50%;transform:translateX(-50%);" +
    "font-family:'Geist Mono',monospace;font-size:10px;color:rgba(160,210,140,0.0);" +
    "letter-spacing:3px;pointer-events:none;user-select:none;" +
    "transition:color 0.4s;white-space:nowrap;";
  monitorHint.textContent = "[E] use computer";
  container.appendChild(monitorHint);

  const exitBtn = document.createElement("div");
  exitBtn.style.cssText =
    "position:absolute;top:18px;right:22px;font-family:'Geist Mono',monospace;" +
    "font-size:11px;color:rgba(160,210,140,0.35);cursor:pointer;letter-spacing:2px;" +
    "z-index:10;transition:color 0.15s;pointer-events:auto;user-select:none;";
  exitBtn.textContent = "← exit";
  exitBtn.onmouseenter = () => {
    exitBtn.style.color = "rgba(160,210,140,0.9)";
  };
  exitBtn.onmouseleave = () => {
    exitBtn.style.color = "rgba(160,210,140,0.35)";
  };
  container.appendChild(exitBtn);

  const iframeWrap = document.createElement("div");
  iframeWrap.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:0;" +
    "overflow:hidden;pointer-events:none;z-index:5;";
  container.appendChild(iframeWrap);

  const IFRAME_W = 640;
  const IFRAME_H = 400;

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    `position:absolute;top:0;left:0;width:${IFRAME_W}px;height:${IFRAME_H}px;` +
    "border:none;transform-origin:0 0;pointer-events:auto;background:#008080;";
  iframe.setAttribute("scrolling", "no");
  iframeWrap.appendChild(iframe);

  let monitorActive = false;

  function showMonitor() {
    monitorActive = true;
    iframeWrap.style.pointerEvents = "auto";

    if (document.pointerLockElement) document.exitPointerLock();
    monitorHint.style.color = "rgba(160,210,140,0)";

    import("./login_inline.js")
      .then((m) => {
        iframe.srcdoc = m.getLoginHTML();
      })
      .catch(() => {
        iframe.srcdoc = getLoginSrcdoc();
      });
  }

  function hideMonitor() {
    monitorActive = false;
    iframeWrap.style.pointerEvents = "none";
    iframe.style.transform = "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)";
    iframeWrap.style.width = "0";
    iframeWrap.style.height = "0";
  }

  function onIframeMessage(e) {
    if (e.data === "login:success") {
      hideMonitor();
      closeScene("forest");
      setTimeout(() => launchScene("desktop"), 80);
    }
    if (e.data === "login:cancel") {
      hideMonitor();
    }
  }
  window.addEventListener("message", onIframeMessage);

  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setSize(window.innerWidth, window.innerHeight);
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(0x010804);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.72;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x010804, 0.028);
  scene.background = new THREE.Color(0x010804);

  const cam = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.05,
    140,
  );
  cam.position.set(0, 1.72, 12);

  const rng = mulberry32(7);

  scene.add(new THREE.AmbientLight(0x1a2a18, 5));
  const moon = new THREE.DirectionalLight(0xbbccdd, 0.9);
  moon.position.set(-12, 28, -8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -36;
  moon.shadow.camera.right = 36;
  moon.shadow.camera.top = 36;
  moon.shadow.camera.bottom = -36;
  moon.shadow.camera.far = 100;
  moon.shadow.bias = -0.001;
  scene.add(moon);
  const moonFill = new THREE.DirectionalLight(0x334455, 0.22);
  moonFill.position.set(8, 10, 6);
  scene.add(moonFill);
  const groundGlow = new THREE.PointLight(0x223a18, 1.8, 22);
  groundGlow.position.set(0, 0.2, 0);
  scene.add(groundGlow);

  const texLoader = new THREE.TextureLoader();
  function loadTex(url, repeat = 1) {
    const t = texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    return t;
  }

  const groundFallbackTex = makeProceduralGround(512);
  const groundMat = new THREE.MeshLambertMaterial({
    map: groundFallbackTex,
    color: 0x223318,
  });
  const groundColorTex = loadTex(
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/mud_forest/mud_forest_diff_4k.jpg",
    10,
  );
  setTimeout(() => {
    if (groundColorTex.image) {
      groundMat.map = groundColorTex;
      groundMat.needsUpdate = true;
    }
  }, 2000);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 140), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -20);
  ground.receiveShadow = true;
  scene.add(ground);

  const pathTex = makeProceduralPath(256);
  const pathMat = new THREE.MeshLambertMaterial({
    map: pathTex,
    color: 0x554433,
  });
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 140), pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.003, -20);
  path.receiveShadow = true;
  scene.add(path);

  const barkTex = makeProceduralBark(256);
  const barkMat = new THREE.MeshLambertMaterial({
    map: barkTex,
    color: 0x0d1409,
  });
  const phBark = loadTex(
    "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/bark_willow_02/bark_willow_02_diff_1k.jpg",
    2,
  );
  setTimeout(() => {
    if (phBark.image) {
      barkMat.map = phBark;
      barkMat.needsUpdate = true;
    }
  }, 2000);

  const foliage1 = new THREE.MeshLambertMaterial({
    color: 0x091208,
    side: THREE.DoubleSide,
  });
  const foliage2 = new THREE.MeshLambertMaterial({
    color: 0x0a1507,
    side: THREE.DoubleSide,
  });
  const foliage3 = new THREE.MeshLambertMaterial({
    color: 0x061004,
    side: THREE.DoubleSide,
  });

  function makeTree(x, z, h, radius, foliageMat, rngLocal) {
    const ng = rngLocal || rng;
    const trunkH = h * 0.22;
    const trunkSeg = 5 + Math.floor(ng() * 3);
    let ty = 0,
      tx = x,
      tz = z;
    for (let seg = 0; seg < trunkSeg; seg++) {
      const segH = trunkH / trunkSeg;
      const r0 = radius * 0.16 * (1 - (seg / trunkSeg) * 0.5);
      const r1 = radius * 0.16 * (1 - ((seg + 1) / trunkSeg) * 0.5);
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(r1, r0, segH, 7),
        barkMat,
      );
      trunk.position.set(tx, ty + segH / 2, tz);
      trunk.rotation.z = (ng() - 0.5) * 0.04;
      trunk.rotation.x = (ng() - 0.5) * 0.04;
      trunk.castShadow = true;
      scene.add(trunk);
      ty += segH;
      tx += (ng() - 0.5) * 0.04;
      tz += (ng() - 0.5) * 0.04;
    }
    const numLayers = 5 + Math.floor(ng() * 3);
    for (let i = 0; i < numLayers; i++) {
      const f = i / numLayers;
      const cr = radius * (1.05 - f * 0.4) * (0.85 + ng() * 0.3);
      const ch = h * (0.45 - f * 0.08) * (0.9 + ng() * 0.2);
      const cy = trunkH + h * f * 0.36;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(cr, ch, 7 + Math.floor(ng() * 4)),
        foliageMat,
      );
      cone.position.set(tx + (ng() - 0.5) * 0.12, cy, tz + (ng() - 0.5) * 0.12);
      cone.rotation.y = ng() * Math.PI * 2;
      cone.rotation.x = (ng() - 0.5) * 0.05;
      cone.castShadow = true;
      scene.add(cone);
    }
    if (h > 9) {
      for (let b = 0; b < 3; b++) {
        const ba = ng() * Math.PI * 2;
        const bh = trunkH * (0.4 + ng() * 0.4);
        const bl = radius * (0.6 + ng() * 0.8);
        const branch = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.03, radius * 0.05, bl, 5),
          barkMat,
        );
        branch.position.set(
          tx + Math.cos(ba) * bl * 0.4,
          bh,
          tz + Math.sin(ba) * bl * 0.4,
        );
        branch.rotation.z = Math.cos(ba) * 0.5;
        branch.rotation.x = Math.sin(ba) * 0.5;
        scene.add(branch);
      }
    }
  }

  for (let i = 0; i < 100; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const xOff = 2.0 + rng() * 12;
    const z = -34 + rng() * 62;
    const h = 6 + rng() * 11;
    const rad = 1.4 + rng() * 1.2;
    const mat = [foliage1, foliage2, foliage3][Math.floor(rng() * 3)];
    makeTree(side * xOff, z, h, rad, mat);
  }
  for (let i = 0; i < 35; i++) {
    makeTree(
      (rng() - 0.5) * 40,
      -30 - rng() * 28,
      7 + rng() * 14,
      1.3 + rng() * 1.8,
      foliage3,
    );
  }

  const bushMat = new THREE.MeshLambertMaterial({
    color: 0x080e05,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 70; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (1.8 + rng() * 7);
    const z = -30 + rng() * 52;
    const s = 0.25 + rng() * 0.6;
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), bushMat);
    bush.position.set(x, s * 0.6, z);
    bush.rotation.set(rng() * 0.4, rng() * Math.PI * 2, rng() * 0.4);
    scene.add(bush);
  }

  const logMat = new THREE.MeshLambertMaterial({ color: 0x0c1008 });
  for (let i = 0; i < 12; i++) {
    const x = (rng() - 0.5) * 16,
      z = -24 + rng() * 32;
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.15, 1.4 + rng() * 2.0, 6),
      logMat,
    );
    log.position.set(x, 0.08, z);
    log.rotation.set(0.1 + rng() * 0.25, rng() * Math.PI, rng() * 0.2);
    scene.add(log);
  }

  const rockMat = new THREE.MeshLambertMaterial({ color: 0x1a1c18 });
  const rockMat2 = new THREE.MeshLambertMaterial({ color: 0x141612 });
  function makeRock(x, z, scale, mat) {
    const geo = new THREE.DodecahedronGeometry(scale * (0.8 + rng() * 0.5), 0);
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(x, scale * 0.3, z);
    rock.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    rock.scale.set(
      1 + (rng() - 0.5) * 0.4,
      0.6 + rng() * 0.5,
      1 + (rng() - 0.5) * 0.4,
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
  for (let i = 0; i < 28; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    makeRock(
      side * (1.5 + rng() * 9),
      -28 + rng() * 46,
      0.15 + rng() * 0.55,
      i % 3 === 0 ? rockMat2 : rockMat,
    );
  }
  for (let i = 0; i < 5; i++) {
    makeRock(-2 + rng() * 4, -14 + rng() * 4, 0.1 + rng() * 0.35, rockMat);
  }

  const dz = DESK_Z;
  const wood = new THREE.MeshLambertMaterial({ color: 0x241408 });
  const woodDark = new THREE.MeshLambertMaterial({ color: 0x16100a });
  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  box(2.6, 0.07, 1.1, wood, 0, 0.78, dz);
  for (const [lx, lz] of [
    [-1.2, -0.44],
    [1.2, -0.44],
    [-1.2, 0.44],
    [1.2, 0.44],
  ]) {
    box(0.07, 0.78, 0.07, woodDark, lx, 0.39, dz + lz);
  }

  const screenMat = new THREE.MeshBasicMaterial({ color: 0x020505 });
  const monitorMesh = box(
    SCREEN_W,
    SCREEN_H,
    0.04,
    screenMat,
    SCREEN_X,
    SCREEN_Y,
    dz - 0.2,
  );

  const screenGlowMat = new THREE.MeshBasicMaterial({
    color: 0x003a10,
    transparent: true,
    opacity: 0.0,
  });
  const screenGlowMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.97, 0.62, 0.01),
    screenGlowMat,
  );
  screenGlowMesh.position.set(0, SCREEN_Y, dz - 0.19);
  scene.add(screenGlowMesh);

  box(0.06, 0.15, 0.06, woodDark, 0, 0.95, dz - 0.2);

  const deskLight = new THREE.PointLight(0xffcc77, 1.8, 9);
  deskLight.position.set(-0.52, 1.42, dz - 0.28);
  deskLight.castShadow = true;
  deskLight.shadow.mapSize.set(512, 512);
  scene.add(deskLight);
  box(0.04, 0.64, 0.04, woodDark, -0.9, 1.12, dz - 0.28);
  box(0.44, 0.025, 0.04, woodDark, -0.7, 1.44, dz - 0.28);

  const bulbTex = makeGlowSprite();
  const bulb = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: bulbTex,
      color: 0xffeeaa,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    }),
  );
  bulb.scale.set(0.28, 0.28, 1);
  bulb.position.set(-0.52, 1.43, dz - 0.28);
  scene.add(bulb);

  const kbMat = new THREE.MeshLambertMaterial({ color: 0x0f0f12 });
  box(0.72, 0.022, 0.24, kbMat, 0.12, 0.812, dz + 0.28);
  const mugMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1e });
  const mugMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.045, 0.12, 10),
    mugMat,
  );
  mugMesh.position.set(-0.7, 0.84, dz + 0.1);
  mugMesh.castShadow = true;
  scene.add(mugMesh);

  const steamMat = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
  });
  const steamSprites = [];
  for (let s = 0; s < 3; s++) {
    const sp = new THREE.Sprite(steamMat.clone());
    sp.scale.set(0.06, 0.14, 1);
    sp.position.set(-0.7 + (rng() - 0.5) * 0.06, 0.98 + s * 0.09, dz + 0.1);
    sp.userData.steamIdx = s;
    sp.userData.phase = rng() * Math.PI * 2;
    scene.add(sp);
    steamSprites.push(sp);
  }

  const rayTex = makeGodRayTexture();
  const rays = [];
  const rayPositions = [
    { x: -3, z: -5, scale: [1.8, 18, 1], opacity: 0.06 },
    { x: 1.5, z: -10, scale: [1.2, 14, 1], opacity: 0.04 },
    { x: -5, z: -18, scale: [2.2, 20, 1], opacity: 0.05 },
    { x: 4, z: -22, scale: [1.4, 16, 1], opacity: 0.035 },
    { x: -1, z: 3, scale: [1.6, 12, 1], opacity: 0.05 },
  ];
  rayPositions.forEach((rp) => {
    const rayMat = new THREE.SpriteMaterial({
      map: rayTex,
      transparent: true,
      opacity: rp.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x88aacc,
    });
    const ray = new THREE.Sprite(rayMat);
    ray.scale.set(rp.scale[0], rp.scale[1], 1);
    ray.position.set(rp.x, rp.scale[1] / 2 - 1, rp.z);
    ray.userData.baseOpacity = rp.opacity;
    ray.userData.phase = Math.random() * Math.PI * 2;
    scene.add(ray);
    rays.push(ray);
  });

  const mistGeo = new THREE.BufferGeometry();
  const mistCount = 280;
  const mistPos = new Float32Array(mistCount * 3);
  const mistPhases = new Float32Array(mistCount);
  for (let i = 0; i < mistCount; i++) {
    mistPos[i * 3] = (Math.random() - 0.5) * 28;
    mistPos[i * 3 + 1] = Math.random() * 3.5;
    mistPos[i * 3 + 2] = -30 + Math.random() * 50;
    mistPhases[i] = Math.random() * Math.PI * 2;
  }
  mistGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(mistPos, 3),
  );
  const mistTex = makeGlowSprite(0.4);
  const mistMat = new THREE.PointsMaterial({
    map: mistTex,
    size: 1.8,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0x6688aa,
    sizeAttenuation: true,
  });
  const mistParticles = new THREE.Points(mistGeo, mistMat);
  scene.add(mistParticles);

  const puffTex = makeGlowSprite(0.3);
  const puffs = [];
  for (let i = 0; i < 40; i++) {
    const puffMat = new THREE.SpriteMaterial({
      map: puffTex,
      transparent: true,
      opacity: 0.025 + Math.random() * 0.02,
      blending: THREE.AdditiveBlending,
      color: 0x445566,
      depthWrite: false,
    });
    const puff = new THREE.Sprite(puffMat);
    const s = 1.5 + Math.random() * 3.5;
    puff.scale.set(s, s * 0.5, 1);
    puff.position.set(
      (Math.random() - 0.5) * 24,
      0.3 + Math.random() * 1.8,
      -28 + Math.random() * 50,
    );
    puff.userData.drift = (Math.random() - 0.5) * 0.003;
    puff.userData.baseOpacity = puffMat.opacity;
    puff.userData.phase = Math.random() * Math.PI * 2;
    scene.add(puff);
    puffs.push(puff);
  }

  const ffTex = makeGlowSprite();
  const fireflies = [];
  for (let i = 0; i < 35; i++) {
    const mat = new THREE.SpriteMaterial({
      map: ffTex,
      color: new THREE.Color().setHSL(0.27 + rng() * 0.08, 1, 0.6),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const ff = new THREE.Sprite(mat);
    ff.scale.set(0.07 + rng() * 0.04, 0.07 + rng() * 0.04, 1);
    ff.position.set(
      (rng() - 0.5) * 20,
      0.4 + rng() * 3.5,
      -6 + (rng() - 0.5) * 36,
    );
    ff.userData = {
      phase: rng() * Math.PI * 2,
      speed: 0.6 + rng() * 0.8,
      driftX: (rng() - 0.5) * 0.003,
      driftZ: (rng() - 0.5) * 0.003,
      baseY: ff.position.y,
    };
    scene.add(ff);
    fireflies.push(ff);
  }

  const moonTex = makeMoonTex();
  const moonSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: moonTex,
      color: 0xddeeff,
      transparent: true,
      opacity: 0.88,
    }),
  );
  moonSprite.scale.set(3.8, 3.8, 1);
  moonSprite.position.set(-18, 38, -55);
  scene.add(moonSprite);
  const haloTex = makeGlowSprite(0.15);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x8899cc,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.scale.set(13, 13, 1);
  halo.position.copy(moonSprite.position);
  scene.add(halo);
  const moonShaftMat = new THREE.SpriteMaterial({
    map: makeGodRayTexture(),
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    color: 0xaabbdd,
    depthWrite: false,
  });
  const moonShaft = new THREE.Sprite(moonShaftMat);
  moonShaft.scale.set(8, 55, 1);
  moonShaft.position.set(-10, 22, -45);
  scene.add(moonShaft);

  const starGeo = new THREE.BufferGeometry();
  const starVerts = [];
  for (let i = 0; i < 1400; i++) {
    const theta = rng() * Math.PI * 2,
      phi = Math.acos(2 * rng() - 1),
      rad = 95 + rng() * 10;
    starVerts.push(
      rad * Math.sin(phi) * Math.cos(theta),
      rad * Math.abs(Math.cos(phi)) + 5,
      rad * Math.sin(phi) * Math.sin(theta),
    );
  }
  starGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVerts, 3),
  );
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.75,
    }),
  );
  scene.add(stars);

  const keys = {};
  function onKey(e) {
    keys[e.code] = e.type === "keydown";
  }
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);

  let yaw = 0,
    pitch = 0,
    pointerLocked = false;
  function onPLC() {
    pointerLocked = document.pointerLockElement === canvas;
  }
  document.addEventListener("pointerlockchange", onPLC);
  function onMouseMove(e) {
    if (!pointerLocked) return;
    yaw -= e.movementX * 0.0018;
    pitch = Math.max(-0.45, Math.min(0.42, pitch - e.movementY * 0.0018));
  }
  document.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", () => {
    if (!monitorActive) canvas.requestPointerLock();
  });
  exitBtn.addEventListener("click", cleanup);

  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const moveDir = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const clk = new THREE.Clock();
  const SPEED = 3.6;

  let nearMonitor = false;

  function onKeydown(e) {
    if (e.code === "KeyE" && nearMonitor && !monitorActive) {
      showMonitor();
    }
    if (e.code === "Escape" && monitorActive) {
      hideMonitor();
    }
  }
  window.addEventListener("keydown", onKeydown);

  const screenCorners3D = [
    new THREE.Vector3(-SCREEN_W / 2, SCREEN_H / 2, 0.021),
    new THREE.Vector3(SCREEN_W / 2, SCREEN_H / 2, 0.021),
    new THREE.Vector3(SCREEN_W / 2, -SCREEN_H / 2, 0.021),
    new THREE.Vector3(-SCREEN_W / 2, -SCREEN_H / 2, 0.021),
  ];

  const _v = new THREE.Vector3();
  const _proj = new THREE.Vector3();

  function projectCorner(localCorner) {
    _v.copy(localCorner);
    monitorMesh.localToWorld(_v);

    _proj.copy(_v).project(cam);

    return [
      (_proj.x * 0.5 + 0.5) * window.innerWidth,
      (-_proj.y * 0.5 + 0.5) * window.innerHeight,
    ];
  }

  function updateIframeTransform() {
    const pts = screenCorners3D.map((c) => projectCorner(c));

    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const bw = maxX - minX,
      bh = maxY - minY;

    iframeWrap.style.left = minX + "px";
    iframeWrap.style.top = minY + "px";
    iframeWrap.style.width = bw + "px";
    iframeWrap.style.height = bh + "px";
    iframeWrap.style.overflow = "visible";

    const relPts = pts.map((p) => [p[0] - minX, p[1] - minY]);

    const m = computeMatrix3d(relPts, IFRAME_W, IFRAME_H);
    iframe.style.transform = `matrix3d(${m.join(",")})`;
  }

  let raf;
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clk.getDelta(), 0.05);
    const t = clk.getElapsedTime();

    if (!monitorActive) {
      euler.set(pitch, yaw, 0, "YXZ");
      cam.quaternion.setFromEuler(euler);
      moveDir.set(0, 0, 0);
      if (keys["KeyW"] || keys["ArrowUp"]) moveDir.z -= 1;
      if (keys["KeyS"] || keys["ArrowDown"]) moveDir.z += 1;
      if (keys["KeyA"] || keys["ArrowLeft"]) moveDir.x -= 1;
      if (keys["KeyD"] || keys["ArrowRight"]) moveDir.x += 1;
      if (moveDir.lengthSq() > 0)
        moveDir.normalize().applyEuler(new THREE.Euler(0, yaw, 0));
      vel.lerp(moveDir.multiplyScalar(SPEED), 0.14);
      cam.position.addScaledVector(vel, dt);
      cam.position.x = Math.max(-7, Math.min(7, cam.position.x));
      cam.position.z = Math.max(-28, Math.min(16, cam.position.z));
      cam.position.y = 1.72;
    }

    const ddx = cam.position.x - DESK_X;
    const ddz = cam.position.z - DESK_Z;
    const dist = Math.sqrt(ddx * ddx + ddz * ddz);
    const wasNear = nearMonitor;
    nearMonitor = dist < MONITOR_INTERACT_DIST && !monitorActive;
    if (nearMonitor !== wasNear) {
      monitorHint.style.color = nearMonitor
        ? "rgba(160,210,140,0.75)"
        : "rgba(160,210,140,0.0)";
      screenGlowMat.opacity = nearMonitor ? 0.18 : 0.0;
    }

    if (monitorActive) {
      updateIframeTransform();
    }

    deskLight.intensity =
      1.6 + Math.sin(t * 7.1) * 0.07 + Math.sin(t * 17.3) * 0.025;
    bulb.material.opacity = 0.65 + Math.sin(t * 7.1) * 0.18;

    steamSprites.forEach((sp) => {
      sp.position.y += 0.004;
      sp.material.opacity = Math.max(0, 0.12 - (sp.position.y - 0.98) * 0.15);
      if (sp.position.y > 1.4) {
        sp.position.y = 0.98 + sp.userData.steamIdx * 0.09;
        sp.material.opacity = 0.12;
      }
    });

    fireflies.forEach((ff) => {
      const d = ff.userData;
      ff.position.y = d.baseY + Math.sin(t * d.speed + d.phase) * 0.38;
      ff.position.x += d.driftX;
      ff.position.z += d.driftZ;
      if (ff.position.x > 12) ff.position.x = -12;
      if (ff.position.x < -12) ff.position.x = 12;
      ff.material.opacity =
        0.15 + Math.abs(Math.sin(t * 1.6 + d.phase * 2.1)) * 0.78;
    });

    rays.forEach((ray) => {
      ray.material.opacity =
        ray.userData.baseOpacity *
        (0.85 + Math.sin(t * 0.4 + ray.userData.phase) * 0.15);
    });
    moonShaft.material.opacity = 0.07 + Math.sin(t * 0.25) * 0.02;

    const mp = mistGeo.attributes.position.array;
    for (let i = 0; i < mistCount; i++) {
      mp[i * 3] += Math.sin(t * 0.15 + mistPhases[i]) * 0.002;
      mp[i * 3 + 1] += 0.0006;
      if (mp[i * 3 + 1] > 4.0) mp[i * 3 + 1] = 0;
    }
    mistGeo.attributes.position.needsUpdate = true;
    mistMat.opacity = 0.03 + Math.sin(t * 0.2) * 0.01;

    puffs.forEach((puff) => {
      puff.position.x += puff.userData.drift;
      if (puff.position.x > 14) puff.position.x = -14;
      if (puff.position.x < -14) puff.position.x = 14;
      puff.material.opacity =
        puff.userData.baseOpacity *
        (0.7 + Math.sin(t * 0.3 + puff.userData.phase) * 0.3);
    });

    groundGlow.intensity = 1.6 + Math.sin(t * 0.3) * 0.3;
    stars.rotation.y = t * 0.0008;
    r.render(scene, cam);
  }
  tick();

  function onResize() {
    r.setSize(window.innerWidth, window.innerHeight);
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKey);
    window.removeEventListener("keydown", onKeydown);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("message", onIframeMessage);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("pointerlockchange", onPLC);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    r.dispose();
  }

  return cleanup;
}

function getLoginSrcdoc() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<link rel="stylesheet" href="https://unpkg.com/98.css"/>
<style>
  body { margin:0; background:#008080; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
  .window { width:280px; }
  p { font-size:11px; margin:0 0 12px; }
  #status { font-size:11px; min-height:16px; margin-bottom:8px; color:maroon; }
</style>
</head>
<body>
<div class="window">
  <div class="title-bar">
    <div class="title-bar-text">Log On to iyrs</div>
    <div class="title-bar-controls">
      <button aria-label="Close" id="btn-cancel-title"></button>
    </div>
  </div>
  <div class="window-body" style="padding:14px;">
    <p>Enter your username and password.</p>
    <div class="field-row-stacked" style="margin-bottom:8px;">
      <label for="u">Username</label>
      <input id="u" type="text" autocomplete="off" spellcheck="false"/>
    </div>
    <div class="field-row-stacked" style="margin-bottom:10px;">
      <label for="p">Password</label>
      <input id="p" type="password" autocomplete="off"/>
    </div>
    <div id="status"></div>
    <div class="field-row" style="justify-content:flex-end;gap:6px;">
      <button id="btn-ok">OK</button>
      <button id="btn-cancel">Cancel</button>
    </div>
  </div>
</div>
<script>
const USERS = [
  {user:"vanillyn",pass:"temporal"},
  {user:"hazellyn",pass:"azimuth"},
  {user:"moth",pass:"nightjar"},
];
const u = document.getElementById("u");
const p = document.getElementById("p");
const status = document.getElementById("status");
let locked = false;
function attempt() {
  if (locked) return;
  const match = USERS.find(v => v.user === u.value.trim().toLowerCase() && v.pass === p.value);
  if (match) {
    locked = true;
    status.style.color = "green";
    status.textContent = "loading...";
    setTimeout(() => window.parent.postMessage("login:success", "*"), 700);
  } else {
    status.style.color = "maroon";
    status.textContent = "incorrect username or password.";
    p.value = "";
    p.focus();
    setTimeout(() => { status.textContent = ""; }, 2200);
  }
}
function cancel() { window.parent.postMessage("login:cancel", "*"); }
document.getElementById("btn-ok").addEventListener("click", attempt);
document.getElementById("btn-cancel").addEventListener("click", cancel);
document.getElementById("btn-cancel-title").addEventListener("click", cancel);
p.addEventListener("keydown", e => { if (e.key === "Enter") attempt(); });
u.addEventListener("keydown", e => { if (e.key === "Enter") p.focus(); });
setTimeout(() => u.focus(), 80);
</script>
</body>
</html>`;
}

function makeProceduralGround(size) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#0a130a";
  ctx.fillRect(0, 0, size, size);
  const rng = mulberry32(1);
  for (let i = 0; i < 4000; i++) {
    const x = rng() * size,
      y = rng() * size,
      g = Math.floor(8 + rng() * 14);
    ctx.fillStyle = `rgb(${g},${Math.floor(g * 1.6)},${g})`;
    ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
  }
  for (let i = 0; i < 100; i++) {
    const x = rng() * size,
      y = rng() * size,
      rv = 8 + rng() * 28;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, rv);
    grd.addColorStop(0, "rgba(10,22,8,0.7)");
    grd.addColorStop(1, "rgba(10,22,8,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, rv, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 14);
  return tex;
}
function makeProceduralPath(size) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#2a1c12";
  ctx.fillRect(0, 0, size, size);
  const rng = mulberry32(2);
  for (let i = 0; i < 2500; i++) {
    const x = rng() * size,
      y = rng() * size,
      v = Math.floor(18 + rng() * 20);
    ctx.fillStyle = `rgb(${v},${Math.floor(v * 0.7)},${Math.floor(v * 0.5)})`;
    ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  return tex;
}
function makeProceduralBark(size) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#0d0d0a";
  ctx.fillRect(0, 0, size, size);
  const rng = mulberry32(9);
  for (let x = 0; x < size; x += 2 + Math.floor(rng() * 4)) {
    const l = Math.floor(10 + rng() * 20),
      h = 8 + Math.floor(rng() * (size - 8)),
      y = Math.floor(rng() * (size - h));
    ctx.fillStyle = `rgb(${l},${Math.floor(l * 0.9)},${Math.floor(l * 0.7)})`;
    ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), h);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return tex;
}
function makeGlowSprite(innerStop = 0.0) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d");
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(innerStop, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.5)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}
function makeGodRayTexture() {
  const cv = document.createElement("canvas");
  cv.width = 32;
  cv.height = 128;
  const ctx = cv.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, 32, 0);
  grd.addColorStop(0, "rgba(255,255,255,0)");
  grd.addColorStop(0.5, "rgba(255,255,255,1)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  const grdV = ctx.createLinearGradient(0, 0, 0, 128);
  grdV.addColorStop(0, "rgba(255,255,255,0.8)");
  grdV.addColorStop(0.6, "rgba(255,255,255,0.4)");
  grdV.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 32, 128);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = grdV;
  ctx.fillRect(0, 0, 32, 128);
  return new THREE.CanvasTexture(cv);
}
function makeMoonTex() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d");
  const rng = mulberry32(3);
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(225,235,250,1)");
  grd.addColorStop(0.82, "rgba(195,210,235,0.95)");
  grd.addColorStop(1, "rgba(180,200,230,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalAlpha = 0.13;
  for (let i = 0; i < 16; i++) {
    const x = 24 + rng() * 80,
      y = 24 + rng() * 80,
      rv = 2 + rng() * 9;
    ctx.beginPath();
    ctx.arc(x, y, rv, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100,110,140,1)";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(cv);
}
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
