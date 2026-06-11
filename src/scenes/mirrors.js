const MAZE_W = 11,
  MAZE_H = 11,
  CELL = 3.0,
  WALL_H = 3.8;

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

function isMobile() {
  return (
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
    window.innerWidth < 600
  );
}

function c2w(col, row) {
  return new THREE.Vector3(
    (col - MAZE_W / 2 + 0.5) * CELL,
    0,
    (row - MAZE_H / 2 + 0.5) * CELL,
  );
}

function makeGoldTex() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 128, 128);
  g.addColorStop(0, "#c8a84b");
  g.addColorStop(0.2, "#f0d060");
  g.addColorStop(0.4, "#b8922a");
  g.addColorStop(0.6, "#e8c850");
  g.addColorStop(0.8, "#a07820");
  g.addColorStop(1, "#d4b040");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

function makeFlameTex() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(32, 40, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,230,100,1)");
  g.addColorStop(0.3, "rgba(255,140,20,0.7)");
  g.addColorStop(0.7, "rgba(200,60,10,0.2)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

const mirrorVertShader = `
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vWorldPos;
void main(){
  vNormal = normalMatrix * normal;
  vWorldPos = (modelMatrix * vec4(position,1.)).xyz;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
}`;

const mirrorFragShader = `
uniform float uTime;
uniform vec3 uCamPos;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vWorldPos;
void main(){
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(uCamPos - vWorldPos);
  vec3 r = reflect(-viewDir, n);
  float envY = r.y * 0.5 + 0.5;
  float shimmer = sin(uTime * 1.2 + vWorldPos.x * 0.8 + vWorldPos.z * 0.6) * 0.04;
  vec3 envCol = mix(vec3(0.18, 0.22, 0.30), vec3(0.72, 0.82, 1.0), envY + shimmer);
  float fresnel = pow(1.0 - max(0.0, dot(n, viewDir)), 2.2);
  vec3 base = vec3(0.78, 0.70, 0.52);
  vec3 col = mix(base * 0.85, envCol, 0.55 + fresnel * 0.35);
  float scan = sin(vWorldPos.y * 18.0 + uTime * 0.3) * 0.012 + 1.0;
  col *= scan;
  gl_FragColor = vec4(col, 1.0);
}`;

function makeVhsOverlay(container) {
  const cv = document.createElement("canvas");
  cv.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;z-index:8;pointer-events:none;";
  container.appendChild(cv);
  const ctx = cv.getContext("2d");
  const grainCv = document.createElement("canvas");
  const grainCtx = grainCv.getContext("2d");
  let t = 0;
  let raf = null;
  function draw() {
    raf = requestAnimationFrame(draw);
    t++;
    const w = (cv.width = innerWidth),
      h = (cv.height = innerHeight);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const by = Math.random() * h;
      ctx.fillStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.08})`;
      ctx.fillRect(0, by, w, 1 + Math.random() * 4);
    }
    for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
      const fy = Math.floor(Math.random() * h),
        fw = 20 + Math.random() * 200;
      const fx = Math.random() * (w - fw),
        a = 0.04 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(255,20,60,${a})`;
      ctx.fillRect(fx, fy, fw, 1);
      ctx.fillStyle = `rgba(0,140,255,${a})`;
      ctx.fillRect(fx + 2, fy + 1, fw, 1);
    }
    if (Math.random() < 0.1) {
      const gy = Math.random() * h,
        gh = Math.random() * 14 + 2;
      ctx.fillStyle = `rgba(74,170,255,${Math.random() * 0.1})`;
      ctx.fillRect(0, gy, w, gh);
    }
    const scanY = (t * 1.2) % h;
    const sg = ctx.createLinearGradient(0, scanY - 8, 0, scanY + 8);
    sg.addColorStop(0, "rgba(180,220,255,0)");
    sg.addColorStop(0.5, `rgba(180,220,255,${0.04 + Math.random() * 0.03})`);
    sg.addColorStop(1, "rgba(180,220,255,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, scanY - 8, w, 16);
    const gw = Math.floor(w / 3),
      gh2 = Math.floor(h / 3);
    grainCv.width = gw;
    grainCv.height = gh2;
    const id = grainCtx.createImageData(gw, gh2);
    const data = id.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 40;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 50;
    }
    grainCtx.putImageData(id, 0, 0);
    ctx.drawImage(grainCv, 0, 0, w, h);
  }
  draw();
  return () => {
    cancelAnimationFrame(raf);
    cv.remove();
  };
}

export function mountMirrors(container) {
  if (isMobile()) {
    const guard = document.createElement("div");
    guard.style.cssText = `
      position:absolute;inset:0;background:#050401;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-family:'Geist Mono',monospace;color:#c8a84b;text-align:center;padding:32px;gap:16px;
    `;
    guard.innerHTML = `
      <div style="font-size:28px;letter-spacing:2px;">🪞</div>
      <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;">desktop only</div>
      <div style="font-size:10px;color:#6a5a3a;letter-spacing:1px;max-width:280px;line-height:1.8;">
        requires a keyboard and mouse.<br>visit on a larger screen.
      </div>`;
    container.appendChild(guard);
    return () => {};
  }

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(canvas);

  const stopVhs = makeVhsOverlay(container);

  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;bottom:28px;left:50%;transform:translateX(-50%);" +
    'font-family:"Geist Mono",monospace;font-size:10px;color:rgba(220,180,80,0.5);' +
    "letter-spacing:2px;pointer-events:none;user-select:none;transition:opacity 1.5s;z-index:10;";
  hint.textContent = "wasd / arrows to move · mouse to look";
  container.appendChild(hint);
  setTimeout(() => {
    hint.style.opacity = "0";
  }, 5000);

  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setSize(innerWidth, innerHeight);
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  r.setClearColor(0x080603);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.4;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0e0a06, 10, 36);

  const cam = new THREE.PerspectiveCamera(
    80,
    innerWidth / innerHeight,
    0.05,
    60,
  );
  const sw = c2w(1, 1);
  cam.position.set(sw.x, 1.7, sw.z);

  scene.add(new THREE.AmbientLight(0xfff2d8, 3.2));

  const keyLight = new THREE.DirectionalLight(0xfff0cc, 2.8);
  keyLight.position.set(4, 12, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -20;
  keyLight.shadow.camera.right = 20;
  keyLight.shadow.camera.top = 20;
  keyLight.shadow.camera.bottom = -20;
  keyLight.shadow.camera.far = 40;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xaac8ff, 0.8);
  rimLight.position.set(-6, 8, -6);
  scene.add(rimLight);

  const goldTex = makeGoldTex();
  const flameTex = makeFlameTex();

  const mirrorUniforms = {
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
  };
  const mirrorMat = new THREE.ShaderMaterial({
    uniforms: mirrorUniforms,
    vertexShader: mirrorVertShader,
    fragmentShader: mirrorFragShader,
    side: THREE.FrontSide,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1e1508,
    roughness: 0.06,
    metalness: 0.92,
  });
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x10100c,
    roughness: 0.9,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    map: goldTex,
    roughness: 0.22,
    metalness: 0.96,
    color: 0xd4a830,
  });
  const pillarMat = new THREE.MeshStandardMaterial({
    map: goldTex,
    roughness: 0.28,
    metalness: 0.92,
    color: 0xb89020,
  });

  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAZE_W * CELL, MAZE_H * CELL),
    floorMat,
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
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
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    }
  }

  const trimH = new THREE.BoxGeometry(CELL, 0.12, 0.04);
  const trimV = new THREE.BoxGeometry(0.04, 0.12, CELL);
  for (let row = 0; row < MAZE_H; row++) {
    for (let col = 0; col < MAZE_W; col++) {
      if (!MAP[row][col]) continue;
      const wp = c2w(col, row);
      const faces = [
        { dr: 0, dc: -1, rx: 0, rz: -CELL / 2, geo: trimH },
        { dr: 0, dc: 1, rx: 0, rz: CELL / 2, geo: trimH },
        { dr: -1, dc: 0, rx: -CELL / 2, rz: 0, geo: trimV },
        { dr: 1, dc: 0, rx: CELL / 2, rz: 0, geo: trimV },
      ];
      faces.forEach(({ dr, dc, rx, rz, geo }) => {
        const nr = row + dr,
          nc = col + dc;
        if (nr < 0 || nr >= MAZE_H || nc < 0 || nc >= MAZE_W || MAP[nr][nc])
          return;
        [WALL_H - 0.06, WALL_H / 2, 0.06].forEach((y) => {
          const t = new THREE.Mesh(geo, goldMat);
          t.position.set(wp.x + rx, y, wp.z + rz);
          scene.add(t);
        });
      });
    }
  }

  const pillarGeo = new THREE.CylinderGeometry(0.1, 0.13, WALL_H, 8);
  const capGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.14, 8);
  const baseGeo = new THREE.CylinderGeometry(0.15, 0.16, 0.14, 8);
  for (let row = 0; row < MAZE_H; row++) {
    for (let col = 0; col < MAZE_W; col++) {
      if (!MAP[row][col]) continue;
      const wp = c2w(col, row);
      let openN = 0;
      [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ].forEach(([dr, dc]) => {
        const nr = row + dr,
          nc = col + dc;
        if (nr >= 0 && nr < MAZE_H && nc >= 0 && nc < MAZE_W && !MAP[nr][nc])
          openN++;
      });
      if (openN < 2) continue;
      const shaft = new THREE.Mesh(pillarGeo, pillarMat);
      shaft.position.set(wp.x, WALL_H / 2, wp.z);
      shaft.castShadow = true;
      scene.add(shaft);
      [WALL_H - 0.07, 0.07].forEach((y) => {
        const c = new THREE.Mesh(y > 0.5 ? capGeo : baseGeo, goldMat);
        c.position.set(wp.x, y, wp.z);
        scene.add(c);
      });
    }
  }

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
  const candleLights = [],
    flames = [];
  const flameMat = new THREE.SpriteMaterial({
    map: flameTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.9,
  });
  const stickMat = new THREE.MeshStandardMaterial({
    map: goldTex,
    roughness: 0.3,
    metalness: 0.95,
    color: 0xd4a830,
  });

  candlePositions.forEach((pos) => {
    const col = Math.round(pos.x / CELL + MAZE_W / 2 - 0.5);
    const row = Math.round(pos.z / CELL + MAZE_H / 2 - 0.5);
    if (col < 0 || col >= MAZE_W || row < 0 || row >= MAZE_H || MAP[row]?.[col])
      return;

    const pl = new THREE.PointLight(0xffaa33, 2.2, 8);
    pl.position.set(pos.x, 1.5, pos.z);
    pl.castShadow = true;
    pl.shadow.mapSize.set(256, 256);
    pl.userData.baseI = 2.2;
    pl.userData.phase = Math.random() * Math.PI * 2;
    scene.add(pl);
    candleLights.push(pl);

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.04, 0.25, 6),
      stickMat,
    );
    stick.position.set(pos.x, 0.125, pos.z);
    scene.add(stick);

    const fl = new THREE.Sprite(flameMat.clone());
    fl.scale.set(0.18, 0.26, 1);
    fl.position.set(pos.x, 1.52, pos.z);
    fl.userData.phase = pl.userData.phase;
    scene.add(fl);
    flames.push(fl);
  });

  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xd4a830,
    roughness: 0.04,
    metalness: 1.0,
    emissive: 0x442200,
    emissiveIntensity: 0.6,
  });
  const centerMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 3),
    centerMat,
  );
  const centerPos = c2w(5, 5);
  centerMesh.position.set(centerPos.x, 1.7, centerPos.z);
  scene.add(centerMesh);

  const orbitMat = new THREE.MeshStandardMaterial({
    color: 0x9ab8cc,
    roughness: 0.02,
    metalness: 1.0,
    emissive: 0x112244,
    emissiveIntensity: 0.5,
  });
  const orbiters = Array.from({ length: 3 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), orbitMat);
    m.userData.angle = (i / 3) * Math.PI * 2;
    m.userData.speed = 0.5 + i * 0.12;
    scene.add(m);
    return m;
  });

  const capsuleMat = new THREE.MeshStandardMaterial({
    color: 0x3a3060,
    roughness: 0.4,
    metalness: 0.2,
  });
  const charBody = new THREE.Group();
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.9, 10),
    capsuleMat,
  );
  torso.position.y = 0.9;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), capsuleMat);
  head.position.y = 1.55;
  charBody.add(torso, head);
  scene.add(charBody);

  const keys = {};
  const onKey = (e) => {
    keys[e.code] = e.type === "keydown";
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);

  let yaw = Math.PI,
    pitch = 0,
    pointerLocked = false;
  const onPLC = () => {
    pointerLocked = document.pointerLockElement === canvas;
  };
  document.addEventListener("pointerlockchange", onPLC);
  const onMouseMove = (e) => {
    if (!pointerLocked) return;
    yaw -= e.movementX * 0.002;
    pitch = Math.max(-0.55, Math.min(0.55, pitch - e.movementY * 0.002));
  };
  document.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", () => {
    if (!pointerLocked) canvas.requestPointerLock();
  });

  const SPEED = 4.5,
    PR = 0.32;
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const mdir = new THREE.Vector3(),
    vel = new THREE.Vector3();
  const clk = new THREE.Clock();
  let bobTime = 0;
  const BASE_Y = 1.7;

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
    const moving = mdir.lengthSq() > 0;
    if (moving) mdir.normalize().applyEuler(new THREE.Euler(0, yaw, 0));
    vel.lerp(mdir.multiplyScalar(SPEED), 0.18);
    tryMove(cam.position, vel.x * dt, 0);
    tryMove(cam.position, 0, vel.z * dt);

    if (moving) bobTime += dt * 9.0;
    const bobTarget = moving ? Math.sin(bobTime) * 0.055 : 0;
    const rollTarget = moving ? Math.sin(bobTime * 0.5) * 0.008 : 0;
    cam.position.y += (BASE_Y + bobTarget - cam.position.y) * 0.18;
    cam.rotation.z += (rollTarget - cam.rotation.z) * 0.12;

    mirrorUniforms.uTime.value = t;
    mirrorUniforms.uCamPos.value.copy(cam.position);

    const behind = new THREE.Vector3(0, 0, 1.2).applyEuler(
      new THREE.Euler(0, yaw, 0),
    );
    charBody.position.set(
      cam.position.x + behind.x,
      0,
      cam.position.z + behind.z,
    );
    charBody.rotation.y = yaw + Math.PI;

    candleLights.forEach((pl) => {
      pl.intensity =
        pl.userData.baseI +
        Math.sin(t * 8.3 + pl.userData.phase) * 0.18 +
        Math.sin(t * 17.1 + pl.userData.phase * 1.7) * 0.07;
    });
    flames.forEach((fl) => {
      const ft = t * 9 + fl.userData.phase;
      fl.scale.set(
        0.16 + Math.sin(ft) * 0.03,
        0.24 + Math.sin(ft * 1.3) * 0.04,
        1,
      );
    });

    centerMesh.rotation.y = t * 0.35;
    centerMesh.rotation.x = Math.sin(t * 0.22) * 0.3;
    centerMesh.position.y = 1.7 + Math.sin(t * 0.9) * 0.12;
    orbiters.forEach((om) => {
      const a = om.userData.angle + t * om.userData.speed;
      om.position.set(
        centerPos.x + Math.cos(a) * 1.1,
        1.7 + Math.sin(t * 1.1 + om.userData.angle) * 0.25,
        centerPos.z + Math.sin(a) * 1.1,
      );
      om.rotation.y = t * 1.2;
    });

    r.render(scene, cam);
  }
  tick();

  const onResize = () => {
    r.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  };
  window.addEventListener("resize", onResize);

  return function cleanup() {
    cancelAnimationFrame(raf);
    stopVhs();
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKey);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("pointerlockchange", onPLC);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    [
      mirrorMat,
      floorMat,
      ceilMat,
      goldMat,
      pillarMat,
      flameMat,
      stickMat,
      centerMat,
      orbitMat,
      capsuleMat,
    ].forEach((m) => m.dispose?.());
    [goldTex, flameTex].forEach((t) => t.dispose());
    [pillarGeo, capGeo, baseGeo, trimH, trimV].forEach((g) => g.dispose());
    r.dispose();
  };
}
