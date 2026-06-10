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

export function mountMirrors(container) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(canvas);

  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;bottom:28px;left:50%;transform:translateX(-50%);font-family:'Geist Mono',monospace;font-size:10px;color:rgba(160,160,220,0.4);letter-spacing:2px;pointer-events:none;user-select:none;transition:opacity 1.5s;";
  hint.textContent = "click to look · wasd to move · esc to exit";
  container.appendChild(hint);
  setTimeout(() => {
    hint.style.opacity = "0";
  }, 5000);

  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setSize(innerWidth, innerHeight);
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  r.setClearColor(0x000008);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.85;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000008, 10, 36);

  const cam = new THREE.PerspectiveCamera(
    80,
    innerWidth / innerHeight,
    0.05,
    60,
  );
  const sw = c2w(1, 1);
  cam.position.set(sw.x, 1.7, sw.z);

  scene.add(new THREE.AmbientLight(0x0a0a18, 3));
  const p1 = new THREE.PointLight(0x5566ff, 1.2, 20);
  p1.position.set(0, 3, 0);
  scene.add(p1);
  const p2 = new THREE.PointLight(0x3344cc, 0.8, 22);
  p2.position.set(-CELL * 3, 3, CELL * 2);
  scene.add(p2);
  const p3 = new THREE.PointLight(0x7744bb, 0.7, 18);
  p3.position.set(CELL * 2, 3, -CELL * 3);
  scene.add(p3);

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x040408,
    roughness: 0.12,
    metalness: 0.85,
  });
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAZE_W * CELL, MAZE_H * CELL),
    floorMat,
  );
  floorMesh.rotation.x = -Math.PI / 2;
  scene.add(floorMesh);

  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x020204,
    roughness: 0.9,
  });
  const ceilMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAZE_W * CELL, MAZE_H * CELL),
    ceilMat,
  );
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.y = WALL_H;
  scene.add(ceilMesh);

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0x99aabb,
    roughness: 0.05,
    metalness: 1.0,
  });

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

  const stripMat = new THREE.MeshBasicMaterial({ color: 0x223366 });
  for (let i = 0; i < 5; i++) {
    const ls = new THREE.Mesh(
      new THREE.BoxGeometry(MAZE_W * CELL * 0.55, 0.04, 0.07),
      stripMat,
    );
    ls.position.set(0, WALL_H - 0.02, -CELL * 2 + i * CELL);
    scene.add(ls);
  }

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x8899bb,
      roughness: 0.1,
      metalness: 0.9,
    }),
  );
  sphere.position.set(c2w(5, 5).x, 1.7, c2w(5, 5).z);
  scene.add(sphere);

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

    sphere.rotation.y = t * 0.4;
    p1.intensity = 1.1 + Math.sin(t * 0.7) * 0.15;
    p2.intensity = 0.75 + Math.sin(t * 0.9 + 1.1) * 0.1;

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

    r.setAnimationLoop(null);
  };
}
