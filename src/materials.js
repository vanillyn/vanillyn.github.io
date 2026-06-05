const VERT_BASE = `varying vec3 vNormal,vPos;varying vec2 vUv;varying vec3 vBary;attribute vec3 aBary;void main(){vNormal=normal;vPos=position;vUv=uv;vBary=aBary;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const VERT_SIMPLE = `varying vec3 vNormal,vPos;varying vec2 vUv;void main(){vNormal=normal;vPos=position;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const HASH3 = `float hash3(vec3 p){p=fract(p*vec3(443.897,441.423,437.195));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}`;
const NOISE3 =
  HASH3 +
  `float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}`;

export const hoverU = {
  uHoverPos: { value: new THREE.Vector3() },
  uIsHovered: { value: 0 },
  uHoverStrength: { value: 0 },
};

export const bgMat = new THREE.ShaderMaterial({
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

export const voxelMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: `uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal;void main(){vNormal=normal;vec3 p=position;float d=distance(p,uHoverPos);if(d<1.5){float t=uHoverStrength*(1.-d/1.5);t*=t;p=mix(p,floor(p*8.+.5)/8.,t);}gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `varying vec3 vNormal;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;gl_FragColor=vec4(vec3(l),1.);}`,
});

export const vhsMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `uniform float time;varying vec3 vNormal,vPos;void main(){vNormal=normal;vPos=position;vec3 p=position;p.x+=step(.95,sin(p.y*20.+time*15.))*.1;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `uniform float time;varying vec3 vNormal,vPos;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;float sc=sin(gl_FragCoord.y*.5-time*10.)*.2+.8;vec3 c=vec3(l);if(sin(time*2.)>0.){c.r+=l*step(.1,sin(vPos.y*50.+time*5.))*.2;c.b+=l*step(.1,cos(vPos.y*40.-time*5.))*.2;}gl_FragColor=vec4(c*sc,1.);}`,
});

export const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.05,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
});

export const contourMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `varying vec3 vNormal,vPos;void main(){vNormal=normal;vPos=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal,vPos;float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise3(p);p*=2.;a*=.5;}return v;}void main(){float n=fbm(vPos*2.+time*.3);float line=smoothstep(.05,.0,abs(fract(n*8.)-.5));float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;gl_FragColor=vec4(mix(vec3(.05),vec3(.9,.95,1.),line)*l,1.);}`,
});

export const sketchMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: VERT_SIMPLE,
  fragmentShader: `uniform float time;varying vec3 vNormal,vPos;varying vec2 vUv;float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}float hatch(vec2 uv,float a,float sp,float jit,float t){float c=cos(a),s=sin(a);float line=fract((c*uv.x-s*uv.y+n2(uv*3.+t)*jit)/sp);return smoothstep(.08,.0,abs(line-.5)-.35);}void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;float t=time*.2;float sk=max(hatch(vPos.xy*2.,.785,.12,.04,t)*step(.3,l),hatch(vPos.xy*2.,-.785,.12,.04,t)*step(.5,l)*.7);float edge=smoothstep(.1,.0,1.-smoothstep(.3,.5,abs(dot(normalize(vNormal),vec3(0,0,1))))-.2);gl_FragColor=vec4(mix(vec3(.97,.95,.92),vec3(.05,.04,.04),max(sk,edge)),1.);}`,
});

export const pixelateMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: `uniform float time;uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vColor;void main(){vNormal=normal;float strength=mix(6.0,32.0,uHoverStrength);vec3 p=floor(position*strength+0.5)/strength;float flicker=sin(time*20.+p.x*13.+p.y*7.)*0.5+0.5;float quantFlicker=floor(flicker*4.0)/4.0;p.z+=quantFlicker*0.02*uHoverStrength;float l=dot(normalize(normal),normalize(vec3(1,1,1)))*0.5+0.5;float ql=floor(l*8.0)/8.0;vColor=vec3(ql);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `varying vec3 vNormal;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.);}`,
});

export const lightupMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader: `uniform float time;uniform float uHoverStrength;varying vec3 vNormal,vPos;varying vec2 vUv;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*0.5+0.5;float wave=sin(vPos.y*4.+time*2.)*0.5+0.5;float em=uHoverStrength*wave*l;vec3 c=mix(vec3(l*0.4),vec3(0.3,0.8,1.)*l+vec3(em),uHoverStrength);gl_FragColor=vec4(c,1.);}`,
});

export const liquidMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader:
    NOISE3 +
    `uniform float time;uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal,vPos;void main(){vNormal=normal;vPos=position;vec3 p=position;float prox=1.-smoothstep(0.,2.5,distance(p,uHoverPos));p+=normal*(noise3(p*3.+time*2.)*2.-1.)*.18*uHoverStrength*prox;p+=normal*sin(p.y*2.+time)*.04;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `uniform float uHoverStrength;varying vec3 vNormal;void main(){vec3 n=normalize(vNormal);float l=dot(n,normalize(vec3(1,1,1)))*.5+.5;float fr=pow(1.-abs(dot(n,vec3(0,0,1))),2.)*uHoverStrength;gl_FragColor=vec4(mix(vec3(l),vec3(.5,.8,1.)*l,fr),1.);}`,
});

export const distortMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal;void main(){vNormal=normal;vec3 p=position;float s=noise3(p*4.+floor(time*.4)*7.3),s2=noise3(p*4.+floor(time*.4+1.)*7.3);float bl=smoothstep(.7,1.,fract(time*.4));vec3 off=vec3(mix(noise3(p+s*3.),noise3(p+s2*3.),bl),mix(noise3(p+s*3.1+1.),noise3(p+s2*3.1+1.),bl),mix(noise3(p+s*3.2+2.),noise3(p+s2*3.2+2.),bl))*2.-1.;p+=off*.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `varying vec3 vNormal;void main(){float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;gl_FragColor=vec4(vec3(l),1.);}`,
});

export const wireframeMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `attribute vec3 aBary;varying vec3 vBary;varying vec3 vPos;void main(){vBary=aBary;vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform float time;varying vec3 vBary;varying vec3 vPos;
void main(){
  float e=min(min(vBary.x,vBary.y),vBary.z);
  float edge=1.0-smoothstep(0.0,0.025,e);
  if(edge<0.01) discard;
  float pulse=sin(vPos.y*6.-time*3.)*.3+.7;
  vec3 col=vec3(0.25,0.85,1.0)*pulse;

  float vdot=step(0.92,max(vBary.x,max(vBary.y,vBary.z)));
  col=mix(col,vec3(1.0),vdot);
  gl_FragColor=vec4(col,edge+vdot*0.5);}`,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
});

export const watercolorMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal,vPos;varying vec2 vUv;
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;
  float n1=noise3(vPos*2.0+time*0.1);
  float n2=noise3(vPos*4.0-time*0.07);
  float n3=noise3(vPos*8.0+time*0.05);
  float wc=clamp(l+n1*0.15+n2*0.08+n3*0.04,0.,1.);
  float blooms=noise3(vPos*6.0+vec3(time*0.2,0.,0.));
  vec3 c=mix(vec3(0.6,0.8,0.95),vec3(0.9,0.7,0.85),blooms);
  c=mix(c,vec3(0.85,0.95,0.75),n2*0.5);
  c*=wc;
  c+=noise3(vPos*20.0)*0.06;
  gl_FragColor=vec4(c,0.92);}`,
  transparent: true,
});

export const motionBlurMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    uVelocity: { value: new THREE.Vector3() },
    ...hoverU,
  },
  vertexShader: `uniform vec3 uVelocity;varying vec3 vNormal;varying float vBlur;void main(){vNormal=normal;vBlur=length(uVelocity);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform float time;uniform vec3 uVelocity;varying vec3 vNormal;varying float vBlur;
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;
  float blur=smoothstep(0.,0.15,vBlur);
  float streak=sin(gl_FragCoord.x*0.5+gl_FragCoord.y*0.5-time*30.)*0.5+0.5;
  vec3 col=mix(vec3(l),vec3(l)*vec3(0.7,0.85,1.0),blur*streak*0.6);
  gl_FragColor=vec4(col,mix(1.0,0.55,blur*0.8));}`,
  transparent: true,
});

export const metallicMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    NOISE3 +
    `uniform float time;uniform float uHoverStrength;varying vec3 vNormal,vPos;
void main(){
  vec3 n=normalize(vNormal);
  float fresnel=pow(1.-abs(dot(n,normalize(vec3(0,0,1)))),3.);
  float diffuse=dot(n,normalize(vec3(1,1.5,2.)))*0.5+0.5;
  float spec=pow(max(dot(reflect(-normalize(vec3(1,1.5,2.)),n),vec3(0,0,1)),0.),64.)*0.9;
  float spec2=pow(max(dot(reflect(-normalize(vec3(-1,0.5,1.)),n),vec3(0,0,1)),0.),32.)*0.4;
  vec3 col=vec3(0.7,0.72,0.75)*diffuse+vec3(spec+spec2)+vec3(fresnel*0.3);
  col+=noise3(vPos*15.+vec3(0,time*0.02,0))*0.08;
  col=mix(col,vec3(0.4,0.7,1.0)*col,uHoverStrength*fresnel);
  gl_FragColor=vec4(col,1.);}`,
});

export const paintMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, uPaintTex: { value: null }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    NOISE3 +
    `uniform float time;uniform sampler2D uPaintTex;varying vec3 vNormal,vPos;varying vec2 vUv;
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;
  vec4 paint=texture2D(uPaintTex,vUv);
  float grain=noise3(vPos*30.)*0.06;
  vec3 base=vec3(l*0.3+0.1);
  vec3 col=mix(base,paint.rgb*l+grain,paint.a);
  gl_FragColor=vec4(col,1.);}`,
});

export const fireMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader:
    NOISE3 +
    `uniform float time;uniform float uHoverStrength;varying vec3 vNormal,vPos;varying float vHeat;
void main(){
  vNormal=normal;
  vec3 p=position;
  float heat=clamp((p.y+1.5)/3.0,0.,1.);
  vHeat=heat;
  float flicker=noise3(p*4.+vec3(0,time*3.,0))*0.5+noise3(p*8.+vec3(0,time*5.,0))*0.25;
  p+=normal*flicker*heat*0.18;
  p.y+=flicker*heat*0.12;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal,vPos;varying float vHeat;
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.4+.6;
  float n=noise3(vPos*5.+vec3(0,time*4.,0));
  float n2=noise3(vPos*10.+vec3(0,time*7.,0))*0.5;
  float flame=clamp(vHeat*(n+n2)*1.4,0.,1.);
  vec3 dark=vec3(0.05,0.0,0.0);
  vec3 red=vec3(0.9,0.1,0.0);
  vec3 orange=vec3(1.0,0.45,0.0);
  vec3 yellow=vec3(1.0,0.9,0.1);
  vec3 white=vec3(1.0,1.0,0.85);
  vec3 col=dark;
  col=mix(col,red,smoothstep(0.,0.25,flame));
  col=mix(col,orange,smoothstep(0.2,0.5,flame));
  col=mix(col,yellow,smoothstep(0.45,0.75,flame));
  col=mix(col,white,smoothstep(0.7,1.,flame));
  col*=l;
  float ember=step(0.97,noise3(vPos*20.+time*2.))*flame;
  col+=vec3(1.,0.5,0.1)*ember;
  gl_FragColor=vec4(col,1.);}`,
});

export const asciiMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    HASH3 +
    `uniform float time;uniform vec2 uResolution;varying vec3 vNormal,vPos;varying vec2 vUv;
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;

  float cellSize=12.0;
  vec2 cell=floor(gl_FragCoord.xy/cellSize);
  vec2 cellUv=fract(gl_FragCoord.xy/cellSize);

  float n=hash3(vec3(cell,floor(time*8.)));
  float brightness=l+n*0.05;

  int lvl=int(floor(brightness*6.));
  float cx=cellUv.x-.5, cy=cellUv.y-.5;
  float dot1=1.-smoothstep(.06,.1,length(vec2(cx,cy)));
  float dot2=max(1.-smoothstep(.06,.1,length(vec2(cx-.25,cy))),1.-smoothstep(.06,.1,length(vec2(cx+.25,cy))));
  float colon=max(1.-smoothstep(.05,.09,length(vec2(cx,cy-.2))),1.-smoothstep(.05,.09,length(vec2(cx,cy+.2))));
  float plus=max(smoothstep(.04,.0,abs(cx))*smoothstep(.45,.35,abs(cy)),smoothstep(.04,.0,abs(cy))*smoothstep(.45,.35,abs(cx)));
  float xmark=max(smoothstep(.04,.0,abs(cx-cy)*.7),smoothstep(.04,.0,abs(cx+cy)*.7));
  float hash=max(plus,xmark);
  float shape=0.;
  if(lvl<=0) shape=0.;
  else if(lvl==1) shape=dot1;
  else if(lvl==2) shape=dot2;
  else if(lvl==3) shape=colon;
  else if(lvl==4) shape=plus;
  else if(lvl==5) shape=xmark;
  else shape=hash;
  float glow=shape*brightness;
  vec3 col=vec3(1.0,1.0,1.0)*glow;
  gl_FragColor=vec4(col,shape>0.01?1.0:0.0);}`,
  transparent: true,
});

export const chromaticMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseDist: { value: 0.0 },
    ...hoverU,
  },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    NOISE3 +
    `uniform float time;uniform float uMouseDist;varying vec3 vNormal,vPos;varying vec2 vUv;
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;

  float strength=uMouseDist*0.04+0.002;
  vec3 n=normalize(vNormal);

  vec3 nr=normalize(n+vec3(strength,0.,0.));
  vec3 ng=n;
  vec3 nb=normalize(n+vec3(-strength,0.,0.));
  float lr=dot(nr,normalize(vec3(1,1,1)))*.5+.5;
  float lg=dot(ng,normalize(vec3(1,1,1)))*.5+.5;
  float lb=dot(nb,normalize(vec3(1,1,1)))*.5+.5;

  float fresnel=pow(1.-abs(dot(n,vec3(0,0,1))),2.);
  float nflicker=noise3(vPos*8.+time*0.5)*0.15;
  gl_FragColor=vec4(lr+fresnel*strength*8.,lg,lb+fresnel*strength*6.,1.);}`,
});

export const celMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader: `uniform float time;uniform float uHoverStrength;varying vec3 vNormal,vPos;varying vec2 vUv;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1,1)));

  float cel=floor(l*4.0)/4.0;
  cel=clamp(cel,0.0,1.0);

  float rim=abs(dot(n,vec3(0,0,1)));
  float outline=step(rim,0.25);

  vec3 base=mix(vec3(0.15,0.15,0.2),vec3(0.9,0.9,1.0),cel);
  base=mix(base,vec3(0.2,0.7,1.0),uHoverStrength*cel);
  gl_FragColor=vec4(mix(base,vec3(0.0),outline),1.);}`,
});

export const materials = [
  voxelMat,
  vhsMat,
  glassMat,
  contourMat,
  sketchMat,
  pixelateMat,
  lightupMat,
  liquidMat,
  distortMat,
  wireframeMat,
  watercolorMat,
  motionBlurMat,
  metallicMat,
  paintMat,
  fireMat,
  asciiMat,
  chromaticMat,
  celMat,
];
export const matNames = [
  "voxel",
  "vhs",
  "glass",
  "noise",
  "sketch",
  "pixelate",
  "light up",
  "liquid",
  "distort",
  "wireframe",
  "watercolor",
  "motion blur",
  "metallic",
  "paint",
  "fire",
  "ascii",
  "chromatic",
  "cel",
];

export const hoverLinkedMats = [
  voxelMat,
  pixelateMat,
  liquidMat,
  lightupMat,
  motionBlurMat,
  metallicMat,
  paintMat,
  fireMat,
  celMat,
  chromaticMat,
];
export const timeMats = [
  vhsMat,
  contourMat,
  sketchMat,
  distortMat,
  wireframeMat,
  watercolorMat,
  motionBlurMat,
  metallicMat,
  paintMat,
  fireMat,
  asciiMat,
  chromaticMat,
  celMat,
  bgMat,
];

let matIdx = Math.floor(Math.random() * materials.length);
let customMat = null;

export function curMat() {
  return customMat || materials[matIdx];
}
export function getMatIdx() {
  return matIdx;
}
export function getCustomMat() {
  return customMat;
}
export function setCustomMat(m) {
  customMat = m;
}

export function cycleMat(applyFn) {
  customMat = null;
  matIdx = (matIdx + 1) % materials.length;
  applyFn();
}

export function setMatByIdx(idx, applyFn) {
  customMat = null;
  matIdx = idx;
  applyFn();
}

export function makeLineMat(hex, opacity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(hex) },
      uOpacity: { value: opacity },
      time: { value: 0 },
    },
    vertexShader: `void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 baseColor;uniform float uOpacity;void main(){gl_FragColor=vec4(baseColor,uOpacity);}`,
    transparent: true,
  });
}

export function makeNodeHoverMat(time) {
  const effects = [
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: time },
        baseColor: { value: new THREE.Color("#4af") },
      },
      vertexShader: `varying vec3 vNormal;void main(){vNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float time;uniform vec3 baseColor;varying vec3 vNormal;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),vec3(0,0,1))),2.);float pulse=sin(time*6.)*.5+.5;gl_FragColor=vec4(baseColor*(rim*2.+pulse*0.5),rim+0.1);}`,
      transparent: true,
    }),

    new THREE.ShaderMaterial({
      uniforms: { time: { value: time } },
      vertexShader: `varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float time;varying vec3 vPos;void main(){float h=fract(atan(vPos.x,vPos.z)/(3.14159*2.)+time*.3);vec3 col=0.5+0.5*cos(6.28*(h+vec3(0,.33,.67)));gl_FragColor=vec4(col,1.);}`,
      transparent: false,
    }),

    new THREE.ShaderMaterial({
      uniforms: { time: { value: time } },
      vertexShader: `varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float time;varying vec3 vPos;float h(vec3 p){p=fract(p*vec3(443.9,441.4,437.2));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}void main(){float n=h(vPos*20.+time*10.);gl_FragColor=vec4(vec3(n),1.);}`,
    }),
  ];
  return effects[Math.floor(Math.random() * effects.length)];
}
