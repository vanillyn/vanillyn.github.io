const MAZE_W = 11;
const MAZE_H = 11;
const CELL = 3.0;
const WALL_H = 3.8;

const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

function c2w(col, row) {
  return new THREE.Vector3(
    (col - MAZE_W / 2 + 0.5) * CELL,
    0,
    (row - MAZE_H / 2 + 0.5) * CELL,
  );
}

function makeFlameTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d");
  const grd = ctx.createRadialGradient(32, 40, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,230,100,1)");
  grd.addColorStop(0.3, "rgba(255,140,20,0.7)");
  grd.addColorStop(0.7, "rgba(200,60,10,0.2)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

function makeGoldTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, 128, 128);
  grd.addColorStop(0.0, "#c8a84b");
  grd.addColorStop(0.2, "#f0d060");
  grd.addColorStop(0.4, "#b8922a");
  grd.addColorStop(0.6, "#e8c850");
  grd.addColorStop(0.8, "#a07820");
  grd.addColorStop(1.0, "#d4b040");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 128,
      y = Math.random() * 128;
    const v = Math.random() > 0.5 ? 20 : -20;
    ctx.fillStyle = `rgba(255,200,50,${Math.random() * 0.08})`;
    ctx.fillRect(x, y, 1, 1);
  }
  return new THREE.CanvasTexture(cv);
}

export function mountMirrors(container) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(canvas);

  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;bottom:28px;left:50%;transform:translateX(-50%);font-family:'Geist Mono',monospace;font-size:10px;color:rgba(220,180,80,0.4);letter-spacing:2px;pointer-events:none;user-select:none;transition:opacity 1.5s;";
  hint.textContent = "you'll find us at the end.";
  container.appendChild(hint);
  setTimeout(() => {
    hint.style.opacity = "0";
  }, 5000);

  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setSize(innerWidth, innerHeight);
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  r.setClearColor(0x050401);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0804, 12, 42);

  const cam = new THREE.PerspectiveCamera(
    80,
    innerWidth / innerHeight,
    0.05,
    60,
  );
  const sw = c2w(1, 1);
  cam.position.set(sw.x, 1.7, sw.z);

  scene.add(new THREE.AmbientLight(0x2a1a08, 6));

  const keyLight = new THREE.PointLight(0xffcc55, 2.2, 28);
  keyLight.position.set(0, WALL_H - 0.5, 0);
  scene.add(keyLight);

  const fillBlue = new THREE.PointLight(0x2233aa, 0.6, 30);
  fillBlue.position.set(-CELL * 2, 2.0, CELL * 2);
  scene.add(fillBlue);

  const fillWarm = new THREE.PointLight(0xff9933, 0.9, 24);
  fillWarm.position.set(CELL * 3, 1.8, -CELL * 3);
  scene.add(fillWarm);

  const candlePositions = [
    c2w(1, 5),
    c2w(3, 3),
    c2w(5, 9),
    c2w(9, 5),
    c2w(5, 5),
    c2w(7, 7),
    c2w(3, 9),
    c2w(9, 1),
  ];
  const candleLights = [];
  candlePositions.forEach((pos) => {
    const col = Math.round(pos.x / CELL + MAZE_W / 2 - 0.5);
    const row = Math.round(pos.z / CELL + MAZE_H / 2 - 0.5);
    if (col < 0 || col >= MAZE_W || row < 0 || row >= MAZE_H) return;
    if (MAP[row]?.[col]) return;

    const pl = new THREE.PointLight(0xffaa33, 1.4, 10);
    pl.position.set(pos.x, 1.4, pos.z);
    pl.userData.baseIntensity = 1.4;
    pl.userData.phase = Math.random() * Math.PI * 2;
    scene.add(pl);
    candleLights.push(pl);
  });

  const goldTex = makeGoldTexture();

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xaabbcc,
    roughness: 0.02,
    metalness: 1.0,
    envMapIntensity: 1.0,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1208,
    roughness: 0.08,
    metalness: 0.9,
  });

  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x0d0a06,
    roughness: 0.85,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    map: goldTex,
    roughness: 0.25,
    metalness: 0.95,
    color: 0xd4a830,
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0xb89020,
    roughness: 0.3,
    metalness: 0.9,
    map: goldTex,
  });

  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAZE_W * CELL, MAZE_H * CELL),
    floorMat,
  );
  floorMesh.rotation.x = -Math.PI / 2;
  scene.add(floorMesh);

  const ceilMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAZE_W * CELL, MAZE_H * CELL),
    ceilMat,
  );
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.y = WALL_H;
  scene.add(ceilMesh);

  for (let row = 0; row < MAZE_H; row++) {
    for (let col = 0; col < MAZE_W; col++) {
      if (!MAP[row][col]) continue;
      const wp = c2w(col, row);
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(CELL, WALL_H, CELL),
        mirrorMat,
      );
      m.position.set(wp.x, WALL_H / 2, wp.z);
      scene.add(m);
    }
  }

  const TRIM_H = 0.12;
  const TRIM_DEPTH = 0.04;
  const trimGeo_h = new THREE.BoxGeometry(CELL, TRIM_H, TRIM_DEPTH);
  const trimGeo_v = new THREE.BoxGeometry(TRIM_DEPTH, TRIM_H, CELL);

  for (let row = 0; row < MAZE_H; row++) {
    for (let col = 0; col < MAZE_W; col++) {
      if (!MAP[row][col]) continue;
      const wp = c2w(col, row);

      const faces = [
        { dr: 0, dc: -1, rx: 0, rz: -CELL / 2, geo: trimGeo_h },
        { dr: 0, dc: 1, rx: 0, rz: CELL / 2, geo: trimGeo_h },
        { dr: -1, dc: 0, rx: -CELL / 2, rz: 0, geo: trimGeo_v },
        { dr: 1, dc: 0, rx: CELL / 2, rz: 0, geo: trimGeo_v },
      ];

      faces.forEach(({ dr, dc, rx, rz, geo }) => {
        const nr = row + dr,
          nc = col + dc;
        if (nr < 0 || nr >= MAZE_H || nc < 0 || nc >= MAZE_W) return;
        if (MAP[nr][nc]) return;

        const topTrim = new THREE.Mesh(geo, goldMat);
        topTrim.position.set(wp.x + rx, WALL_H - TRIM_H / 2, wp.z + rz);
        scene.add(topTrim);

        const botTrim = new THREE.Mesh(geo, goldMat);
        botTrim.position.set(wp.x + rx, TRIM_H / 2, wp.z + rz);
        scene.add(botTrim);

        const midTrim = new THREE.Mesh(geo, goldMat);
        midTrim.position.set(wp.x + rx, WALL_H / 2, wp.z + rz);
        scene.add(midTrim);
      });
    }
  }

  const PILLAR_R = 0.1;
  const PILLAR_H = WALL_H;
  const pillarGeo = new THREE.CylinderGeometry(
    PILLAR_R,
    PILLAR_R * 1.3,
    PILLAR_H,
    8,
  );
  const pillarCapGeo = new THREE.CylinderGeometry(
    PILLAR_R * 1.6,
    PILLAR_R * 1.5,
    0.14,
    8,
  );
  const pillarBaseGeo = new THREE.CylinderGeometry(
    PILLAR_R * 1.5,
    PILLAR_R * 1.6,
    0.14,
    8,
  );

  function addPillar(x, z) {
    const shaft = new THREE.Mesh(pillarGeo, pillarMat);
    shaft.position.set(x, PILLAR_H / 2, z);
    scene.add(shaft);

    const cap = new THREE.Mesh(pillarCapGeo, goldMat);
    cap.position.set(x, PILLAR_H - 0.07, z);
    scene.add(cap);

    const base = new THREE.Mesh(pillarBaseGeo, goldMat);
    base.position.set(x, 0.07, z);
    scene.add(base);
  }

  for (let row = 0; row < MAZE_H; row++) {
    for (let col = 0; col < MAZE_W; col++) {
      if (!MAP[row][col]) continue;
      const wp = c2w(col, row);
      let openNeighbors = 0;
      [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ].forEach(([dr, dc]) => {
        const nr = row + dr,
          nc = col + dc;
        if (nr >= 0 && nr < MAZE_H && nc >= 0 && nc < MAZE_W && !MAP[nr][nc])
          openNeighbors++;
      });

      if (openNeighbors >= 2) {
        addPillar(wp.x, wp.z);
      }
    }
  }

  const flameTex = makeFlameTexture();
  const flameMat = new THREE.SpriteMaterial({
    map: flameTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.9,
  });

  const flames = [];
  candleLights.forEach((pl) => {
    const stickGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.25, 6);
    const stick = new THREE.Mesh(stickGeo, goldMat);
    stick.position.set(pl.position.x, 0.125, pl.position.z);
    scene.add(stick);

    const flame = new THREE.Sprite(flameMat.clone());
    flame.scale.set(0.18, 0.26, 1);
    flame.position.set(pl.position.x, 1.45, pl.position.z);
    flame.userData.phase = pl.userData.phase;
    scene.add(flame);
    flames.push(flame);
  });

  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xd4a830,
    roughness: 0.05,
    metalness: 1.0,
    emissive: 0x331100,
    emissiveIntensity: 0.4,
  });
  const centerMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 3),
    centerMat,
  );
  const centerPos = c2w(5, 5);
  centerMesh.position.set(centerPos.x, 1.7, centerPos.z);
  scene.add(centerMesh);

  const orbitMat = new THREE.MeshStandardMaterial({
    color: 0x8899bb,
    roughness: 0.02,
    metalness: 1.0,
    emissive: 0x112244,
    emissiveIntensity: 0.3,
  });
  const orbiters = [];
  for (let i = 0; i < 3; i++) {
    const om = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), orbitMat);
    om.userData.angle = (i / 3) * Math.PI * 2;
    om.userData.radius = 1.1;
    om.userData.speed = 0.5 + i * 0.12;
    scene.add(om);
    orbiters.push(om);
  }

  const borderGeo = new THREE.BoxGeometry(MAZE_W * CELL, 0.02, 0.08);
  const borderGeo2 = new THREE.BoxGeometry(0.08, 0.02, MAZE_H * CELL);
  const halfW = (MAZE_W * CELL) / 2;
  const halfH = (MAZE_H * CELL) / 2;
  [
    [0, 0, halfH],
    [0, 0, -halfH],
  ].forEach(([x, y, z]) => {
    const b = new THREE.Mesh(borderGeo, goldMat);
    b.position.set(x, 0.01, z);
    scene.add(b);
  });
  [
    [halfW, 0, 0],
    [-halfW, 0, 0],
  ].forEach(([x, y, z]) => {
    const b = new THREE.Mesh(borderGeo2, goldMat);
    b.position.set(x, 0.01, z);
    scene.add(b);
  });

  const keys = {};
  function onKey(e) {
    keys[e.code] = e.type === "keydown";
  }
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);

  let yaw = Math.PI,
    pitch = 0,
    pointerLocked = false;

  function onPLChange() {
    pointerLocked = document.pointerLockElement === canvas;
  }
  document.addEventListener("pointerlockchange", onPLChange);

  function onMouseMove(e) {
    if (!pointerLocked) return;
    yaw -= e.movementX * 0.002;
    pitch = Math.max(-0.55, Math.min(0.55, pitch - e.movementY * 0.002));
  }
  document.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", () => {
    if (!pointerLocked) canvas.requestPointerLock();
  });

  const SPEED = 4.5;
  const PR = 0.32;
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const mdir = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const clk = new THREE.Clock();

  function isWall(wx, wz) {
    const col = Math.floor(wx / CELL + MAZE_W / 2);
    const row = Math.floor(wz / CELL + MAZE_H / 2);
    if (col < 0 || col >= MAZE_W || row < 0 || row >= MAZE_H) return true;
    return MAP[row][col] === 1;
  }

  function tryMove(pos, dx, dz) {
    if (!isWall(pos.x + dx + Math.sign(dx) * PR, pos.z)) pos.x += dx;
    if (!isWall(pos.x, pos.z + dz + Math.sign(dz) * PR)) pos.z += dz;
  }

  let raf;
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clk.getDelta(), 0.05);
    const t = clk.getElapsedTime();

    euler.set(pitch, yaw, 0, "YXZ");
    cam.quaternion.setFromEuler(euler);

    mdir.set(0, 0, 0);
    if (keys["KeyW"] || keys["ArrowUp"]) mdir.z -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) mdir.z += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) mdir.x -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) mdir.x += 1;
    if (mdir.lengthSq() > 0)
      mdir.normalize().applyEuler(new THREE.Euler(0, yaw, 0));
    vel.lerp(mdir.multiplyScalar(SPEED), 0.18);
    tryMove(cam.position, vel.x * dt, 0);
    tryMove(cam.position, 0, vel.z * dt);
    cam.position.y = 1.7;

    candleLights.forEach((pl, i) => {
      const flicker =
        Math.sin(t * 8.3 + pl.userData.phase) * 0.15 +
        Math.sin(t * 17.1 + pl.userData.phase * 1.7) * 0.07;
      pl.intensity = pl.userData.baseIntensity + flicker;
    });

    flames.forEach((fl) => {
      const ft = t * 9 + fl.userData.phase;
      fl.scale.set(
        0.16 + Math.sin(ft) * 0.03,
        0.24 + Math.sin(ft * 1.3) * 0.04,
        1,
      );
    });

    keyLight.intensity = 2.1 + Math.sin(t * 0.4) * 0.3;

    centerMesh.rotation.y = t * 0.35;
    centerMesh.rotation.x = Math.sin(t * 0.22) * 0.3;
    centerMesh.position.y = 1.7 + Math.sin(t * 0.9) * 0.12;

    orbiters.forEach((om) => {
      const a = om.userData.angle + t * om.userData.speed;
      om.position.set(
        centerPos.x + Math.cos(a) * om.userData.radius,
        1.7 + Math.sin(t * 1.1 + om.userData.angle) * 0.25,
        centerPos.z + Math.sin(a) * om.userData.radius,
      );
      om.rotation.y = t * 1.2;
    });

    r.render(scene, cam);
  }
  tick();

  function onResize() {
    r.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  return function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKey);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("pointerlockchange", onPLChange);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    r.dispose();
  };
}
