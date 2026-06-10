export function mountForest(container) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(canvas);

  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;bottom:28px;left:50%;transform:translateX(-50%);font-family:'Geist Mono',monospace;font-size:10px;color:rgba(180,200,160,0.45);letter-spacing:2px;pointer-events:none;user-select:none;transition:opacity 1.5s;";
  hint.textContent = "...";
  container.appendChild(hint);
  setTimeout(() => {
    hint.style.opacity = "0";
  }, 5000);

  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setSize(innerWidth, innerHeight);
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(0x010502);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.55;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x010502, 0.072);

  const cam = new THREE.PerspectiveCamera(
    72,
    innerWidth / innerHeight,
    0.05,
    100,
  );
  cam.position.set(0, 1.7, 14);

  scene.add(new THREE.AmbientLight(0x081408, 1.2));

  const moon = new THREE.DirectionalLight(0x8899aa, 0.22);
  moon.position.set(-8, 20, -5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -20;
  moon.shadow.camera.right = 20;
  moon.shadow.camera.top = 20;
  moon.shadow.camera.bottom = -20;
  moon.shadow.camera.far = 60;
  scene.add(moon);

  const deskLight = new THREE.PointLight(0xffcc88, 1.4, 7);
  deskLight.position.set(0, 3.1, -10);
  deskLight.castShadow = true;
  scene.add(deskLight);

  scene.add(
    Object.assign(
      new THREE.Mesh(
        new THREE.PlaneGeometry(40, 60),
        new THREE.MeshLambertMaterial({ color: 0x070d05 }),
      ),
    ),
  );
  const pathMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 60),
    new THREE.MeshLambertMaterial({ color: 0x0f1a0c }),
  );
  pathMesh.rotation.x = -Math.PI / 2;
  pathMesh.position.set(0, 0.005, -10);
  pathMesh.receiveShadow = true;
  scene.add(pathMesh);

  const treeMat = new THREE.MeshLambertMaterial({ color: 0x060e05 });
  const barkMat = new THREE.MeshLambertMaterial({ color: 0x0a1108 });

  function makeTree(x, z, h, rad) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.11, rad * 0.17, h * 0.22, 6),
      barkMat,
    );
    trunk.position.set(x, h * 0.11, z);
    trunk.castShadow = true;
    scene.add(trunk);
    for (let t = 0; t < 3; t++) {
      const f = t / 3;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(
          rad * (0.9 - f * 0.28),
          h * (0.55 - f * 0.12),
          7,
        ),
        treeMat,
      );
      cone.position.set(x, h * 0.22 + h * f * 0.38, z);
      cone.castShadow = true;
      scene.add(cone);
    }
  }

  const rng = mulberry32(42);
  for (let i = 0; i < 80; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    makeTree(
      side * (2.2 + rng() * 10),
      -28 + rng() * 48,
      5 + rng() * 9,
      1.4 + rng() * 1.2,
    );
  }
  for (let i = 0; i < 18; i++) {
    makeTree(
      (rng() - 0.5) * 28,
      -22 - rng() * 18,
      5 + rng() * 10,
      1.2 + rng() * 1.4,
    );
  }

  const wood = new THREE.MeshLambertMaterial({ color: 0x2a1a0e });
  const leg = new THREE.MeshLambertMaterial({ color: 0x1a1008 });
  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  const dz = -11;
  box(2.4, 0.07, 1.0, wood, 0, 0.78, dz);
  box(0.07, 0.78, 0.07, leg, -1.1, 0.39, dz - 0.4);
  box(0.07, 0.78, 0.07, leg, 1.1, 0.39, dz - 0.4);
  box(0.07, 0.78, 0.07, leg, -1.1, 0.39, dz + 0.4);
  box(0.07, 0.78, 0.07, leg, 1.1, 0.39, dz + 0.4);
  box(
    0.9,
    0.56,
    0.04,
    new THREE.MeshLambertMaterial({ color: 0x040606, emissive: 0x020404 }),
    0,
    1.36,
    dz - 0.2,
  );
  box(0.06, 0.14, 0.06, leg, 0, 0.93, dz - 0.2);
  box(
    0.7,
    0.025,
    0.26,
    new THREE.MeshLambertMaterial({ color: 0x141c10 }),
    0.1,
    0.815,
    dz + 0.26,
  );
  box(0.04, 0.6, 0.04, leg, -0.9, 1.08, dz - 0.3);
  box(0.4, 0.025, 0.04, leg, -0.7, 1.38, dz - 0.3);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffeeaa }),
  );
  bulb.position.set(-0.5, 1.37, dz - 0.3);
  scene.add(bulb);

  const fireflies = [];
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color: 0x88ffaa,
        transparent: true,
        opacity: 0.6,
      }),
    );
    s.scale.set(0.06, 0.06, 1);
    s.position.set(
      (rng() - 0.5) * 16,
      0.5 + rng() * 3.5,
      -5 + (rng() - 0.5) * 28,
    );
    s.userData.o = rng() * Math.PI * 2;
    scene.add(s);
    fireflies.push(s);
  }

  const keys = {};
  function onKey(e) {
    keys[e.code] = e.type === "keydown";
  }
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);

  let yaw = 0,
    pitch = 0,
    pointerLocked = false,
    clickCount = 0;

  function onPLChange() {
    pointerLocked = document.pointerLockElement === canvas;
  }
  document.addEventListener("pointerlockchange", onPLChange);

  function onMouseMove(e) {
    if (!pointerLocked) return;
    yaw -= e.movementX * 0.0018;
    pitch = Math.max(-0.45, Math.min(0.4, pitch - e.movementY * 0.0018));
  }
  document.addEventListener("mousemove", onMouseMove);

  canvas.addEventListener("click", () => {
    if (!pointerLocked) {
      canvas.requestPointerLock();
    } else {
      location.reload();
    }
  });

  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const moveDir = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const clk = new THREE.Clock();
  const SPEED = 3.8;

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
    cam.position.x = Math.max(-5, Math.min(5, cam.position.x));
    cam.position.z = Math.max(-22, Math.min(16, cam.position.z));
    cam.position.y = 1.7;

    fireflies.forEach((ff) => {
      ff.position.y += Math.sin(t * 1.1 + ff.userData.o) * 0.003;
      ff.material.opacity =
        0.3 + Math.abs(Math.sin(t * 1.8 + ff.userData.o * 2.7)) * 0.5;
    });

    deskLight.intensity =
      1.2 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 13.1) * 0.02;

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

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
