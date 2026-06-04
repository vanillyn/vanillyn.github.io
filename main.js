const FALLBACK_GEOS = [
  () => new THREE.TorusKnotGeometry(1, 0.32, 128, 32),
  () => new THREE.IcosahedronGeometry(1.2, 1),
  () => new THREE.OctahedronGeometry(1.4, 0),
];

let iyrsOpen = false,
  iyrsStartTime = 0;
const sbNodes = document.getElementById("sb-nodes");
const sbLatency = document.getElementById("sb-latency");
const sbUptime = document.getElementById("sb-uptime");

function pad2(n) {
  return String(n).padStart(2, "0");
}
function fmtTime(sec) {
  return `${pad2(Math.floor(sec / 3600) % 24)}:${pad2(Math.floor(sec / 60) % 60)}:${pad2(Math.floor(sec) % 60)}`;
}

setInterval(() => {
  if (!iyrsOpen) return;
  sbNodes.textContent = (Math.floor(Math.random() * 900) + 100).toString();
  sbLatency.textContent = (Math.random() * 40 + 2).toFixed(1) + "ms";
  sbUptime.textContent = fmtTime((Date.now() - iyrsStartTime) / 1000);
}, 800);

function iyrsNotImpl(e) {
  e && e.preventDefault();
  addAiMsg("not implemented yet.");
  document.getElementById("iy-greeting").classList.add("hidden");
}
function iyrsSubmit() {
  const inp = document.getElementById("iy-input");
  const val = inp.value.trim();
  if (!val) return;
  addUserMsg(val);
  inp.value = "";
  setTimeout(() => addAiMsg("not implemented yet."), 400 + Math.random() * 600);
  document.getElementById("iy-greeting").classList.add("hidden");
}
function addUserMsg(text) {
  const msgs = document.getElementById("iy-messages");
  const d = document.createElement("div");
  d.className = "msg user";
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}
function addAiMsg(text) {
  const msgs = document.getElementById("iy-messages");
  const d = document.createElement("div");
  d.className = "msg ai";
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function openIyrs() {
  if (iyrsOpen) return;
  iyrsOpen = true;
  iyrsStartTime = Date.now();
  const ov = document.getElementById("iyrs-overlay");
  const vhs = document.getElementById("vhs-overlay");
  document.getElementById("iy-greeting").classList.remove("hidden");
  document.getElementById("iy-messages").innerHTML = "";
  vhs.style.opacity = "1";
  setTimeout(() => {
    ov.classList.remove("settled");
    ov.classList.add("intro");
    ov.style.opacity = "1";
    ov.classList.add("active");
    setTimeout(() => {
      ov.classList.remove("intro");
      ov.classList.add("settled");
    }, 1400);
  }, 400);
}
function closeIyrs() {
  if (!iyrsOpen) return;
  iyrsOpen = false;
  const ov = document.getElementById("iyrs-overlay");
  const vhs = document.getElementById("vhs-overlay");
  ov.style.opacity = "0";
  ov.classList.remove("active");
  setTimeout(() => {
    vhs.style.opacity = "0";
    ov.classList.remove("settled");
    ov.classList.add("intro");
  }, 500);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && iyrsOpen) closeIyrs();
});

const vhsCv = document.getElementById("vhs-canvas");
const vhsCtx = vhsCv.getContext("2d");
function resizeVhs() {
  vhsCv.width = innerWidth;
  vhsCv.height = innerHeight;
}
resizeVhs();
window.addEventListener("resize", resizeVhs);

let vhsT = 0;
const grainCv = document.createElement("canvas");
const grainCtx = grainCv.getContext("2d");

function drawVhs() {
  requestAnimationFrame(drawVhs);
  vhsT++;
  const w = vhsCv.width,
    h = vhsCv.height;
  vhsCtx.clearRect(0, 0, w, h);

  vhsCtx.fillStyle = "rgba(0,0,10,0.5)";
  vhsCtx.fillRect(0, 0, w, h);

  for (let i = 0; i < 8; i++) {
    const by = Math.random() * h;
    vhsCtx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.1})`;
    vhsCtx.fillRect(0, by, w, 1 + Math.random() * 6);
  }

  const numFringe = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numFringe; i++) {
    const fy = Math.floor(Math.random() * h);
    const fw = 30 + Math.random() * 300;
    const fx = Math.random() * (w - fw);
    const alpha = 0.05 + Math.random() * 0.08;
    vhsCtx.fillStyle = `rgba(255,20,60,${alpha})`;
    vhsCtx.fillRect(fx, fy, fw, 1);
    vhsCtx.fillStyle = `rgba(0,140,255,${alpha})`;
    vhsCtx.fillRect(fx + 3, fy + 1, fw, 1);
    vhsCtx.fillStyle = `rgba(0,255,100,${alpha * 0.4})`;
    vhsCtx.fillRect(fx - 2, fy, fw, 1);
  }

  if (Math.random() < 0.15) {
    const gy = Math.random() * h;
    const gh = Math.random() * 20 + 3;
    vhsCtx.fillStyle = `rgba(74,170,255,${Math.random() * 0.18})`;
    vhsCtx.fillRect(0, gy, w, gh);
  }
  if (Math.random() < 0.04) {
    const ly = Math.random() * h;
    vhsCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
    vhsCtx.fillRect(0, ly, w, 1 + Math.floor(Math.random() * 3));
  }

  const scanY = (vhsT * 1.5) % h;
  const sg = vhsCtx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
  sg.addColorStop(0, "rgba(180,220,255,0)");
  sg.addColorStop(0.5, `rgba(180,220,255,${0.05 + Math.random() * 0.04})`);
  sg.addColorStop(1, "rgba(180,220,255,0)");
  vhsCtx.fillStyle = sg;
  vhsCtx.fillRect(0, scanY - 10, w, 20);

  const gw = Math.floor(w / 3),
    gh2 = Math.floor(h / 3);
  grainCv.width = gw;
  grainCv.height = gh2;
  const id = grainCtx.createImageData(gw, gh2);
  const data = id.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 50;
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 60;
  }
  grainCtx.putImageData(id, 0, 0);
  vhsCtx.imageSmoothingEnabled = true;
  vhsCtx.drawImage(grainCv, 0, 0, w, h);

  vhsCtx.fillRect(0, 0, w, h);
}
drawVhs();

window.onload = () => {
  const container = document.getElementById("canvas-container");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    innerWidth / innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0);
  dl.position.set(5, 5, 5);
  scene.add(dl);

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const hoverU = {
    uHoverPos: { value: new THREE.Vector3() },
    uIsHovered: { value: 0 },
    uHoverStrength: { value: 0 },
  };

  const VERT_BASE = `varying vec3 vNormal,vPos;varying vec2 vUv;void main(){vNormal=normal;vPos=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
  const HASH3 = `float hash3(vec3 p){p=fract(p*vec3(443.897,441.423,437.195));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}`;
  const NOISE3 =
    HASH3 +
    `float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}`;

  const bgMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float time;uniform vec2 uMouse;varying vec2 vUv;
void main(){
    vec2 uv=vUv*30.0,grid=fract(uv)-.5;
    float dots=smoothstep(.15,.05,length(grid));
    float lx=smoothstep(.03,.01,abs(grid.y)),ly=smoothstep(.03,.01,abs(grid.x));
    float n=fract(sin(dot(floor(uv),vec2(12.9898,78.233)))*43758.5453);
    float lines=(lx+ly)*step(.4,n);
    float pulse=sin(time*.5+n*10.)*.5+.5;
    float glow=smoothstep(.22,.0,distance(vUv,uMouse));
    vec3 c=mix(vec3(.02),vec3(.15),max(dots*pulse,lines*.3));
    c=mix(c,vec3(.35),max(dots,lx+ly)*glow);
    gl_FragColor=vec4(c,1.);}`,
    depthWrite: false,
  });
  const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), bgMat);
  bgPlane.position.set(0, 0, -28);
  scene.add(bgPlane);

  const voxelMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, ...hoverU },
    vertexShader: `uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal;void main(){vNormal=normal;vec3 p=position;float d=distance(p,uHoverPos);if(d<1.5){float t=uHoverStrength*(1.-d/1.5);t*=t;p=mix(p,floor(p*8.+.5)/8.,t);}gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying vec3 vNormal;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;gl_FragColor=vec4(vec3(l),1.);}`,
  });
  const vhsMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `uniform float time;varying vec3 vNormal,vPos;void main(){vNormal=normal;vPos=position;vec3 p=position;p.x+=step(.95,sin(p.y*20.+time*15.))*.1;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform float time;varying vec3 vNormal,vPos;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;float sc=sin(gl_FragCoord.y*.5-time*10.)*.2+.8;vec3 c=vec3(l);if(sin(time*2.)>0.){c.r+=l*step(.1,sin(vPos.y*50.+time*5.))*.2;c.b+=l*step(.1,cos(vPos.y*40.-time*5.))*.2;}gl_FragColor=vec4(c*sc,1.);}`,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const contourMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 vNormal,vPos;void main(){vNormal=normal;vPos=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:
      NOISE3 +
      `uniform float time;varying vec3 vNormal,vPos;float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise3(p);p*=2.;a*=.5;}return v;}void main(){float n=fbm(vPos*2.+time*.3);float line=smoothstep(.05,.0,abs(fract(n*8.)-.5));float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;gl_FragColor=vec4(mix(vec3(.05),vec3(.9,.95,1.),line)*l,1.);}`,
  });
  const sketchMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: VERT_BASE,
    fragmentShader: `uniform float time;varying vec3 vNormal,vPos;varying vec2 vUv;float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}float hatch(vec2 uv,float a,float sp,float jit,float t){float c=cos(a),s=sin(a);float line=fract((c*uv.x-s*uv.y+n2(uv*3.+t)*jit)/sp);return smoothstep(.08,.0,abs(line-.5)-.35);}void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;float t=time*.2;float sk=max(hatch(vPos.xy*2.,.785,.12,.04,t)*step(.3,l),hatch(vPos.xy*2.,-.785,.12,.04,t)*step(.5,l)*.7);float edge=smoothstep(.1,.0,1.-smoothstep(.3,.5,abs(dot(normalize(vNormal),vec3(0,0,1))))-.2);gl_FragColor=vec4(mix(vec3(.97,.95,.92),vec3(.05,.04,.04),max(sk,edge)),1.);}`,
  });
  const pixelateMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, ...hoverU },
    vertexShader: `uniform float time;uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vColor;void main(){vNormal=normal;float strength=mix(6.0,32.0,uHoverStrength);vec3 p=floor(position*strength+0.5)/strength;float flicker=sin(time*20.+p.x*13.+p.y*7.)*0.5+0.5;float quantFlicker=floor(flicker*4.0)/4.0;p.z+=quantFlicker*0.02*uHoverStrength;float l=dot(normalize(normal),normalize(vec3(1,1,1)))*0.5+0.5;float ql=floor(l*8.0)/8.0;vColor=vec3(ql);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying vec3 vNormal;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.);}`,
  });

  const lightupMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, ...hoverU },
    vertexShader: VERT_BASE,
    fragmentShader: `uniform float time;uniform float uHoverStrength;varying vec3 vNormal,vPos;varying vec2 vUv;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*0.5+0.5;float wave=sin(vPos.y*4.+time*2.)*0.5+0.5;float em=uHoverStrength*wave*l;vec3 c=mix(vec3(l*0.4),vec3(0.3,0.8,1.)*l+vec3(em),uHoverStrength);gl_FragColor=vec4(c,1.);}`,
  });
  const liquidMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, ...hoverU },
    vertexShader:
      NOISE3 +
      `uniform float time;uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal,vPos;void main(){vNormal=normal;vPos=position;vec3 p=position;float prox=1.-smoothstep(0.,2.5,distance(p,uHoverPos));p+=normal*(noise3(p*3.+time*2.)*2.-1.)*.18*uHoverStrength*prox;p+=normal*sin(p.y*2.+time)*.04;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform float uHoverStrength;varying vec3 vNormal;void main(){vec3 n=normalize(vNormal);float l=dot(n,normalize(vec3(1,1,1)))*.5+.5;float fr=pow(1.-abs(dot(n,vec3(0,0,1))),2.)*uHoverStrength;gl_FragColor=vec4(mix(vec3(l),vec3(.5,.8,1.)*l,fr),1.);}`,
  });
  const distortMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader:
      NOISE3 +
      `uniform float time;varying vec3 vNormal;void main(){vNormal=normal;vec3 p=position;float s=noise3(p*4.+floor(time*.4)*7.3),s2=noise3(p*4.+floor(time*.4+1.)*7.3);float bl=smoothstep(.7,1.,fract(time*.4));vec3 off=vec3(mix(noise3(p+s*3.),noise3(p+s2*3.),bl),mix(noise3(p+s*3.1+1.),noise3(p+s2*3.1+1.),bl),mix(noise3(p+s*3.2+2.),noise3(p+s2*3.2+2.),bl))*2.-1.;p+=off*.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying vec3 vNormal;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;gl_FragColor=vec4(vec3(l),1.);}`,
  });

  let customMat = null;
  const materials = [
    voxelMat,
    vhsMat,
    glassMat,
    contourMat,
    sketchMat,
    pixelateMat,
    lightupMat,
    liquidMat,
    distortMat,
  ];
  const matNames = [
    "voxel",
    "vhs",
    "glass",
    "noise",
    "sketch",
    "pixelate",
    "light up",
    "liquid",
    "distort",
  ];
  let matIdx = Math.floor(Math.random() * materials.length);

  function curMat() {
    return customMat || materials[matIdx];
  }
  function applyMat() {
    modelGroup.traverse((c) => {
      if (c.isMesh) c.material = curMat();
    });
  }
  function cycleMat() {
    customMat = null;
    matIdx = (matIdx + 1) % materials.length;
    applyMat();
    updateSub();
  }
  function updateSub() {
    const sub = document.getElementById("shader-sub");
    sub.textContent = customMat ? "custom" : matNames[matIdx];
    document
      .querySelectorAll(".ctx-active-item")
      .forEach((el) => el.classList.remove("ctx-active-item"));
    if (!customMat) {
      const id = [
        "ctx-sh-voxel",
        "ctx-sh-vhs",
        "ctx-sh-glass",
        "ctx-sh-noise",
        "ctx-sh-sketch",
        "ctx-sh-pixelate",
        "ctx-sh-lightup",
        "ctx-sh-liquid",
        "ctx-sh-distort",
      ][matIdx];
      const el = document.getElementById(id);
      if (el) el.classList.add("ctx-active-item");
    }
  }

  const artifactGroup = new THREE.Group();
  scene.add(artifactGroup);
  const modelGroup = new THREE.Group();
  artifactGroup.add(modelGroup);

  const BLANK_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  const IMG_EXT =
    /\.(png|jpe?g|webp|ktx2?|basis|dds|tga|bmp|gif|svg|bin)(\?.*)?$/i;
  const loaderManager = new THREE.LoadingManager();
  loaderManager.setURLModifier((url) => {
    if (IMG_EXT.test(url)) return BLANK_PNG;
    return url;
  });
  const loader = new THREE.GLTFLoader(loaderManager);

  function clearModel() {
    while (modelGroup.children.length)
      modelGroup.remove(modelGroup.children[0]);
  }
  function spawnFallback(geoFn) {
    clearModel();
    const g = geoFn
      ? geoFn()
      : FALLBACK_GEOS[Math.floor(Math.random() * FALLBACK_GEOS.length)]();
    g.computeVertexNormals();
    modelGroup.add(new THREE.Mesh(g, curMat()));
  }
  function loadGLTF(url) {
    loader.load(
      url,
      (gltf) => {
        clearModel();
        gltf.scene.traverse((c) => {
          if (!c.isMesh) return;

          if (c.material) {
            const m = c.material;
            [
              "map",
              "normalMap",
              "roughnessMap",
              "metalnessMap",
              "emissiveMap",
              "aoMap",
              "alphaMap",
              "bumpMap",
              "displacementMap",
              "lightMap",
              "envMap",
            ].forEach((k) => {
              if (m[k]) {
                m[k].dispose();
                m[k] = null;
              }
            });
          }
          c.geometry = c.geometry.toNonIndexed();
          c.geometry.computeVertexNormals();
          c.material = curMat();
        });
        const box = new THREE.Box3().setFromObject(gltf.scene);
        gltf.scene.position.sub(box.getCenter(new THREE.Vector3()));
        const sz = box.getSize(new THREE.Vector3());
        gltf.scene.scale.multiplyScalar(3 / Math.max(sz.x, sz.y, sz.z));
        modelGroup.add(gltf.scene);
      },
      undefined,
      () => spawnFallback(),
    );
  }
  spawnFallback();
  document.getElementById("model-upload").addEventListener("change", (e) => {
    if (e.target.files[0]) loadGLTF(URL.createObjectURL(e.target.files[0]));
  });

  function makeLineMat(hex, opacity = 1) {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(hex) },
        uOpacity: { value: opacity },
      },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float time;uniform vec3 baseColor;uniform float uOpacity;varying vec2 vUv;void main(){float p=sin(vUv.y*20.-time*3.)*.5+.5;gl_FragColor=vec4(mix(baseColor*.4,baseColor*1.2,p),uOpacity);}`,
      transparent: true,
    });
  }
  function makeLine(p1, p2, mat) {
    const d = p1.distanceTo(p2);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, d, 6),
      mat,
    );
    m.position.copy(p2.clone().add(p1).divideScalar(2));
    m.lookAt(p2);
    m.rotateX(Math.PI / 2);
    return m;
  }
  const NODE_GEOS = [
    () => new THREE.SphereGeometry(0.09, 10, 10),
    () => new THREE.IcosahedronGeometry(0.1, 0),
    () => new THREE.OctahedronGeometry(0.1, 0),
    () => new THREE.TetrahedronGeometry(0.11, 0),
  ];

  const LINKS_ME = [
    {
      label: "neo-polita",
      url: "https://discord.gg/2KVRMDHCnN",
    },
    {
      label: "hazel/run",
      url: "https://discord.gg/kH8N2wUmMC",
    },
    { label: "github", url: "https://github.com/vanillyn" },
    { label: "twitch", url: "https://twitch.tv/vanillynBot" },
  ];
  const LINKS_FRIENDS = [{ label: "!", url: "https://powuts.straw.page" }];
  const LINKS_SERVICES = [
    { label: "niskbot", url: "https://vanillyn.github.io/dashboard" },
  ];

  const labelsContainer = document.getElementById("labels-container");

  let activeLayer = "me";
  const layers = {};
  let clickables = [];
  let labelEls = [];
  const allLayerMats = [];

  const HUB_FRIENDS_COLOR = "#3af";
  const HUB_SERVICES_COLOR = "#3f9";
  const RETURN_COLOR = "#f44";

  function buildLayer(links, hexColor, group) {
    const mat = makeLineMat(hexColor, 0);
    allLayerMats.push(mat);
    const meshes = [],
      labelEls = [];
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
        const ln = makeLine(cur, nxt, mat);
        group.add(ln);
        meshes.push(ln);
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
      labelEls.push({ mesh: node, el: div, isNode: true });
    });
    return {
      meshes,
      labelEls,
      mat,
      clickableNodes: labelEls.map((x) => x.mesh),
    };
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

  layers.me = buildLayer(LINKS_ME, "#ffffff", artifactGroup);

  const hubFriends = makeHubNode(
    "→ friends",
    HUB_FRIENDS_COLOR,
    new THREE.Vector3(3.5, 1.2, 0.5),
    artifactGroup,
  );
  const hubServices = makeHubNode(
    "→ services",
    HUB_SERVICES_COLOR,
    new THREE.Vector3(-3.5, -1.0, 0.3),
    artifactGroup,
  );

  let returnNode = null;

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

  const opacityTweens = new Map();
  function fadeMat(mat, target, speed = 0.04) {
    opacityTweens.set(mat, { target, speed });
  }
  function tickOpacity() {
    opacityTweens.forEach((tw, mat) => {
      const cur = mat.uniforms.uOpacity.value;
      const next = cur + (tw.target - cur) * tw.speed;
      mat.uniforms.uOpacity.value =
        Math.abs(next - tw.target) < 0.001 ? tw.target : next;
      mat.visible = mat.uniforms.uOpacity.value > 0.001;
      if (mat.uniforms.uOpacity.value === tw.target) opacityTweens.delete(mat);
    });
  }

  function activateMe() {
    activeLayer = "me";

    fadeMat(layers.me.mat, 1, 0.05);

    fadeMat(hubFriends.mat, 0.7, 0.05);
    fadeMat(hubServices.mat, 0.7, 0.05);

    if (layers.friends) fadeMat(layers.friends.mat, 0, 0.05);
    if (layers.services) fadeMat(layers.services.mat, 0, 0.05);

    if (returnNode) fadeMat(returnNode.mat, 0, 0.05);

    updateClickables();
  }
  function activateFriends() {
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
    ensureReturn();
    fadeMat(returnNode.mat, 0.8, 0.05);
    updateClickables();
  }
  function activateServices() {
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
    ensureReturn();
    fadeMat(returnNode.mat, 0.8, 0.05);
    updateClickables();
  }
  function ensureReturn() {
    if (!returnNode) {
      returnNode = makeHubNode(
        "← return",
        RETURN_COLOR,
        new THREE.Vector3(0, 3.2, 0.2),
        artifactGroup,
      );
      returnNode.mesh.userData = {
        isReturn: true,
        label: "← return",
      };
    }
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
      labelEls.push(
        ...layers.me.labelEls,
        { mesh: hubFriends.mesh, el: hubFriends.el },
        { mesh: hubServices.mesh, el: hubServices.el },
      );
    } else if (activeLayer === "friends") {
      clickables.push(...layers.friends.clickableNodes);
      if (returnNode) clickables.push(returnNode.mesh);
      labelEls.push(...layers.friends.labelEls);
      if (returnNode)
        labelEls.push({
          mesh: returnNode.mesh,
          el: returnNode.el,
        });
    } else if (activeLayer === "services") {
      clickables.push(...layers.services.clickableNodes);
      if (returnNode) clickables.push(returnNode.mesh);
      labelEls.push(...layers.services.labelEls);
      if (returnNode)
        labelEls.push({
          mesh: returnNode.mesh,
          el: returnNode.el,
        });
    }

    const activeEls = new Set(labelEls.map((x) => x.el));
    const allPossibleLabels = [
      ...(layers.me ? layers.me.labelEls : []),
      ...(layers.friends ? layers.friends.labelEls : []),
      ...(layers.services ? layers.services.labelEls : []),
      { el: hubFriends.el },
      { el: hubServices.el },
      ...(returnNode ? [{ el: returnNode.el }] : []),
    ];
    allPossibleLabels.forEach(({ el }) => {
      el.style.opacity = activeEls.has(el) ? "" : "0";
      el.style.pointerEvents = activeEls.has(el) ? "" : "none";
    });
  }

  fadeMat(layers.me.mat, 1, 0.03);
  fadeMat(hubFriends.mat, 0.7, 0.03);
  fadeMat(hubServices.mat, 0.7, 0.03);
  updateClickables();

  updateSub();

  const postCanvas = document.getElementById("post-canvas");
  const postCtx = postCanvas.getContext("2d");
  function resizePost() {
    postCanvas.width = innerWidth;
    postCanvas.height = innerHeight;
  }
  resizePost();
  function drawPost(nx, ny) {
    const w = postCanvas.width,
      h = postCanvas.height;
    postCtx.clearRect(0, 0, w, h);

    const cx = w / 2,
      cy = h / 2;
    const eg = postCtx.createRadialGradient(
      cx + nx * 6,
      cy + ny * 6,
      h * 0.45,
      cx + nx * 6,
      cy + ny * 6,
      h * 0.78,
    );
    eg.addColorStop(0, "rgba(0,0,0,0)");
    eg.addColorStop(1, "rgba(0,0,0,0.22)");
    postCtx.fillStyle = eg;
    postCtx.fillRect(0, 0, w, h);
  }

  const HOLD_MS = 3000;
  let holdTimer = null,
    holdStart = 0;
  const holdRing = document.getElementById("hold-ring");
  const ringProg = document.getElementById("ring-prog");
  const CIRC = 2 * Math.PI * 26;
  const holdExcluded = new Set([
    document.getElementById("name-span"),
    document.getElementById("shader-sub"),
    document.getElementById("bio-span"),
  ]);
  function isExcluded(e) {
    if (holdExcluded.has(e.target)) return true;
    raycaster.setFromCamera(mouse, camera);
    return (
      raycaster.intersectObjects(clickables).length > 0 ||
      raycaster.intersectObjects(modelGroup.children, true).length > 0
    );
  }
  function startHold(e) {
    if (iyrsOpen || isExcluded(e)) return;
    holdStart = Date.now();
    holdRing.style.display = "block";
    holdRing.style.left = e.clientX - 16 + "px";
    holdRing.style.top = e.clientY - 16 + "px";
    ringProg.style.strokeDasharray = `0 ${CIRC}`;
    holdTimer = setInterval(() => {
      const pct = Math.min((Date.now() - holdStart) / HOLD_MS, 1);
      ringProg.style.strokeDasharray = `${CIRC * pct} ${CIRC * (1 - pct)}`;
      if (pct >= 1) {
        clearInterval(holdTimer);
        holdTimer = null;
        holdRing.style.display = "none";
        openIyrs();
      }
    }, 30);
  }
  function cancelHold() {
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
    holdRing.style.display = "none";
  }
  document.addEventListener("mousedown", startHold);
  document.addEventListener("mouseup", cancelHold);
  document.addEventListener("mouseleave", cancelHold);

  let mouseX = 0,
    mouseY = 0,
    mousePosNX = 0,
    mousePosNY = 0;
  let camZoom = 10,
    camZoomActual = 10,
    camTX = 0,
    camTY = 0,
    hoverTarget = 0;
  const BASE_FOV = 45;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX - innerWidth / 2;
    mouseY = e.clientY - innerHeight / 2;
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    bgMat.uniforms.uMouse.value.set(
      e.clientX / innerWidth,
      1 - e.clientY / innerHeight,
    );
    mousePosNX = (e.clientX / innerWidth) * 2 - 1;
    mousePosNY = -((e.clientY / innerHeight) * 2 - 1);
    if (!iyrsOpen) {
      camTX = mousePosNX * 0.5;
      camTY = mousePosNY * 0.5;
    }
  });
  document.addEventListener(
    "wheel",
    (e) => {
      if (iyrsOpen) return;
      e.preventDefault();
      camZoom = Math.max(4, Math.min(20, camZoom + e.deltaY * 0.015));
    },
    { passive: false },
  );
  document.addEventListener("click", () => {
    if (iyrsOpen) return;
    raycaster.setFromCamera(mouse, camera);
    const li = raycaster.intersectObjects(clickables);
    const mi = raycaster.intersectObjects(modelGroup.children, true);
    if (li.length) {
      const obj = li[0].object;
      if (obj === hubFriends.mesh) {
        activateFriends();
        return;
      }
      if (obj === hubServices.mesh) {
        activateServices();
        return;
      }
      if (returnNode && obj === returnNode.mesh) {
        activateMe();
        return;
      }
      const u = obj.userData.url;
      if (u) window.open(u, "_blank");
    } else if (mi.length) document.getElementById("model-upload").click();
  });

  document.getElementById("name-span").addEventListener("click", (e) => {
    e.stopPropagation();
    cycleMat();
  });
  document.getElementById("shader-sub").addEventListener("click", (e) => {
    e.stopPropagation();
    cycleMat();
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
  ];
  shaderPicks.forEach(([id, idx]) => {
    document.getElementById(id).addEventListener("click", () => {
      ctxMenu.style.display = "none";
      customMat = null;
      matIdx = idx;
      applyMat();
      updateSub();
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
  document.getElementById("shader-upload").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        customMat = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, ...hoverU },
          vertexShader: `varying vec3 vNormal,vPos;varying vec2 vUv;void main(){vNormal=normal;vPos=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader: ev.target.result,
        });
        applyMat();
        updateSub();
      } catch (err) {
        console.warn(err);
        customMat = null;
      }
    };
    r.readAsText(f);
  });

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    resizePost();
  });

  const tooltip = document.getElementById("link-tooltip");
  function labelPos(mesh, el, hov) {
    const v = new THREE.Vector3();
    mesh.getWorldPosition(v);
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * innerWidth,
      y = (v.y * -0.5 + 0.5) * innerHeight;
    el.style.setProperty("--tx", `${x + 15}px`);
    el.style.setProperty("--ty", `${y - 15}px`);
    el.style.transform = `translate(${x + 15}px,${y - 15}px)`;
    el.classList.toggle("hovered", hov);

    const mat = mesh.material;
    let matOpacity = 1;
    if (mat && mat.uniforms && mat.uniforms.uOpacity) {
      matOpacity = mat.uniforms.uOpacity.value;
    }

    const screenPos = new THREE.Vector2(v.x, v.y);
    const occRay = new THREE.Raycaster();
    occRay.setFromCamera(screenPos, camera);
    const modelHits = occRay.intersectObjects(modelGroup.children, true);
    let occluded = false;
    if (modelHits.length > 0) {
      const nodeWorldPos = new THREE.Vector3();
      mesh.getWorldPosition(nodeWorldPos);
      const nodeDist = camera.position.distanceTo(nodeWorldPos);
      if (modelHits[0].distance < nodeDist - 0.1) {
        occluded = true;
      }
    }
    el.style.opacity = occluded ? "0" : String(matOpacity);
  }
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    bgMat.uniforms.time.value = t;
    vhsMat.uniforms.time.value = t;
    contourMat.uniforms.time.value = t;
    sketchMat.uniforms.time.value = t;
    distortMat.uniforms.time.value = t;
    allLayerMats.forEach((m) => {
      if (m.uniforms?.time) m.uniforms.time.value = t;
    });
    [voxelMat, pixelateMat, liquidMat, lightupMat].forEach((m) => {
      m.uniforms.time.value = t;
      m.uniforms.uHoverStrength.value = hoverU.uHoverStrength.value;
      m.uniforms.uHoverPos.value.copy(hoverU.uHoverPos.value);
    });
    if (customMat?.uniforms?.time) customMat.uniforms.time.value = t;
    tickOpacity();

    if (!iyrsOpen) {
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
    const mi = raycaster.intersectObjects(modelGroup.children, true);

    let hovNode = null;
    if (!iyrsOpen) {
      if (li.length) {
        document.body.style.cursor = "pointer";
        tooltip.style.opacity = "1";
        hovNode = li[0].object;
        const ud = hovNode.userData;
        if (ud.isHub) tooltip.innerText = ud.label;
        else if (ud.isReturn) tooltip.innerText = ud.label;
        else tooltip.innerText = `url: ${ud.url}`;
        hoverTarget = 0;
      } else if (mi.length) {
        document.body.style.cursor = "pointer";
        tooltip.style.opacity = "1";
        tooltip.innerText = "upload custom model (.gltf/.glb)";
        hoverTarget = 1;
        hoverU.uHoverPos.value.copy(
          modelGroup.worldToLocal(mi[0].point.clone()),
        );
      } else {
        document.body.style.cursor = "default";
        tooltip.style.opacity = "0";
        hoverTarget = 0;
      }
    }
    hoverU.uHoverStrength.value +=
      (hoverTarget - hoverU.uHoverStrength.value) * 0.06;
    labelEls.forEach((item) =>
      labelPos(item.mesh, item.el, item.mesh === hovNode),
    );
    renderer.render(scene, camera);
    drawPost(mousePosNX, mousePosNY);
  }
  animate();
};
