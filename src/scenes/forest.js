export function mountForest(container) {
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

  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setSize(window.innerWidth, window.innerHeight);
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(0x010804);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.42;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x010804, 0.055);
  scene.background = new THREE.Color(0x010804);

  const cam = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.05,
    120,
  );
  cam.position.set(0, 1.72, 12);

  const rng = mulberry32(7);

  scene.add(new THREE.AmbientLight(0x0a1a0a, 2.5));

  const moon = new THREE.DirectionalLight(0x99aacc, 0.3);
  moon.position.set(-12, 28, -8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -28;
  moon.shadow.camera.right = 28;
  moon.shadow.camera.top = 28;
  moon.shadow.camera.bottom = -28;
  moon.shadow.camera.far = 80;
  moon.shadow.bias = -0.001;
  scene.add(moon);

  const moonFill = new THREE.DirectionalLight(0x223344, 0.08);
  moonFill.position.set(8, 10, 6);
  scene.add(moonFill);

  const groundTex = makeProceduralGround(512);
  const groundMat = new THREE.MeshLambertMaterial({
    map: groundTex,
    color: 0x223318,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 120), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -20);
  ground.receiveShadow = true;
  scene.add(ground);

  const pathTex = makeProceduralPath(256);
  const pathMat = new THREE.MeshLambertMaterial({
    map: pathTex,
    color: 0x554433,
  });
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 120), pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.003, -20);
  path.receiveShadow = true;
  scene.add(path);

  const barkMat = new THREE.MeshLambertMaterial({ color: 0x0d1409 });
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

  function makeTree(x, z, h, radius, foliageMat) {
    const trunkH = h * 0.2;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.1, radius * 0.16, trunkH, 7),
      barkMat,
    );
    trunk.position.set(x, trunkH * 0.5, z);
    trunk.castShadow = true;
    scene.add(trunk);

    for (let t = 0; t < 4; t++) {
      const f = t / 4;
      const cr = radius * (1.0 - f * 0.32);
      const ch = h * (0.52 - f * 0.1);
      const cy = trunkH + h * f * 0.38;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(cr, ch, 8 + Math.floor(rng() * 3)),
        foliageMat,
      );
      cone.position.set(x, cy, z);
      cone.rotation.y = rng() * Math.PI * 2;
      cone.castShadow = true;
      scene.add(cone);
    }
  }

  for (let i = 0; i < 90; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const xOff = 2.0 + rng() * 11;
    const z = -32 + rng() * 58;
    const h = 5.5 + rng() * 9;
    const rad = 1.3 + rng() * 1.1;
    const mat = [foliage1, foliage2, foliage3][Math.floor(rng() * 3)];
    makeTree(side * xOff, z, h, rad, mat);
  }

  for (let i = 0; i < 28; i++) {
    makeTree(
      (rng() - 0.5) * 34,
      -28 - rng() * 22,
      6 + rng() * 12,
      1.2 + rng() * 1.6,
      foliage3,
    );
  }

  const bushMat = new THREE.MeshLambertMaterial({
    color: 0x080e05,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 60; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (1.8 + rng() * 7);
    const z = -28 + rng() * 46;
    const s = 0.25 + rng() * 0.55;
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), bushMat);
    bush.position.set(x, s * 0.6, z);
    bush.rotation.set(rng() * 0.4, rng() * Math.PI * 2, rng() * 0.4);
    scene.add(bush);
  }

  const logMat = new THREE.MeshLambertMaterial({ color: 0x0c1008 });
  for (let i = 0; i < 8; i++) {
    const x = (rng() - 0.5) * 14;
    const z = -22 + rng() * 28;
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.14, 1.2 + rng() * 1.8, 6),
      logMat,
    );
    log.position.set(x, 0.08, z);
    log.rotation.set(0.1 + rng() * 0.3, rng() * Math.PI, rng() * 0.2);
    scene.add(log);
  }

  const dz = -11.5;
  const wood = new THREE.MeshLambertMaterial({ color: 0x241408 });
  const woodDark = new THREE.MeshLambertMaterial({ color: 0x16100a });

  function box(w, h, d, mat, x, y, z, rx = 0, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.rotation.y = ry;
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

  const screenMat = new THREE.MeshBasicMaterial({ color: 0x050c0a });
  box(0.95, 0.6, 0.04, screenMat, 0, 1.38, dz - 0.2);

  box(0.06, 0.15, 0.06, woodDark, 0, 0.95, dz - 0.2);

  const deskLight = new THREE.PointLight(0xffcc77, 1.6, 8);
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
  for (let s = 0; s < 3; s++) {
    const sp = new THREE.Sprite(steamMat.clone());
    sp.scale.set(0.06, 0.14, 1);
    sp.position.set(-0.7 + (rng() - 0.5) * 0.06, 0.98 + s * 0.09, dz + 0.1);
    sp.userData.steamIdx = s;
    scene.add(sp);
  }

  const ffTex = makeGlowSprite();
  const fireflies = [];
  for (let i = 0; i < 28; i++) {
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
      (rng() - 0.5) * 18,
      0.4 + rng() * 3.2,
      -4 + (rng() - 0.5) * 30,
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
      opacity: 0.82,
    }),
  );
  moonSprite.scale.set(3.2, 3.2, 1);
  moonSprite.position.set(-18, 38, -55);
  scene.add(moonSprite);

  const haloTex = makeGlowSprite(0.15);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x8899cc,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.scale.set(10, 10, 1);
  halo.position.copy(moonSprite.position);
  scene.add(halo);

  const starGeo = new THREE.BufferGeometry();
  const starVerts = [];
  for (let i = 0; i < 1200; i++) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const rad = 90 + rng() * 10;
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
      size: 0.18,
      transparent: true,
      opacity: 0.7,
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
    canvas.requestPointerLock();
  });
  exitBtn.addEventListener("click", cleanup);

  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const moveDir = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const clk = new THREE.Clock();
  const SPEED = 3.6;

  let raf;
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clk.getDelta(), 0.05);
    const t = clk.getElapsedTime();

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
    cam.position.x = Math.max(-6, Math.min(6, cam.position.x));
    cam.position.z = Math.max(-26, Math.min(16, cam.position.z));
    cam.position.y = 1.72;

    deskLight.intensity =
      1.4 + Math.sin(t * 7.1) * 0.06 + Math.sin(t * 17.3) * 0.02;
    bulb.material.opacity = 0.6 + Math.sin(t * 7.1) * 0.15;

    fireflies.forEach((ff) => {
      const d = ff.userData;
      ff.position.y = d.baseY + Math.sin(t * d.speed + d.phase) * 0.35;
      ff.position.x += d.driftX;
      ff.position.z += d.driftZ;

      if (ff.position.x > 10) ff.position.x = -10;
      if (ff.position.x < -10) ff.position.x = 10;
      ff.material.opacity =
        0.15 + Math.abs(Math.sin(t * 1.6 + d.phase * 2.1)) * 0.72;
    });

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
    window.removeEventListener("resize", onResize);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("pointerlockchange", onPLC);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    r.dispose();
  }

  return cleanup;
}

function makeProceduralGround(size) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#0a130a";
  ctx.fillRect(0, 0, size, size);
  const rng = mulberry32(1);

  for (let i = 0; i < 3000; i++) {
    const x = rng() * size,
      y = rng() * size;
    const g = Math.floor(8 + rng() * 12);
    ctx.fillStyle = `rgb(${g},${Math.floor(g * 1.6)},${g})`;
    ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
  }

  for (let i = 0; i < 80; i++) {
    const x = rng() * size,
      y = rng() * size,
      r = 8 + rng() * 28;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(10,22,8,0.7)`);
    grd.addColorStop(1, `rgba(10,22,8,0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 12);
  return tex;
}

function makeProceduralPath(size) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#2a1c12";
  ctx.fillRect(0, 0, size, size);
  const rng = mulberry32(2);
  for (let i = 0; i < 2000; i++) {
    const x = rng() * size,
      y = rng() * size;
    const v = Math.floor(18 + rng() * 18);
    ctx.fillStyle = `rgb(${v},${Math.floor(v * 0.7)},${Math.floor(v * 0.5)})`;
    ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 12);
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

function makeMoonTex() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d");
  const rng = mulberry32(3);
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(220,230,245,1)");
  grd.addColorStop(0.85, "rgba(190,205,230,0.95)");
  grd.addColorStop(1, "rgba(180,200,230,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);

  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 14; i++) {
    const x = 24 + rng() * 80,
      y = 24 + rng() * 80,
      r = 2 + rng() * 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
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
