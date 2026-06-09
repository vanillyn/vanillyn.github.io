const VERT_BASE = `varying vec3 vNormal,vPos;varying vec2 vUv;varying vec3 vBary;attribute vec3 aBary;void main(){vNormal=normal;vPos=position;vUv=uv;vBary=aBary;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const VERT_SIMPLE = `varying vec3 vNormal,vPos;varying vec2 vUv;void main(){vNormal=normalMatrix*normal;vPos=(modelViewMatrix*vec4(position,1.)).xyz;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
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
    uLight: { value: 0.0 },
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform float time;uniform vec2 uMouse;uniform float uLight;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 uv=vUv*28.0;
  vec2 id=floor(uv);
  vec2 gv=fract(uv)-.5;
  float n=hash(id);
  float phase=n*6.2831+time*(0.3+n*0.4);
  float r=0.04+n*0.07;
  float d=smoothstep(r+.012,r-.012,length(gv));
  float pulse=sin(phase)*.5+.5;
  float glow=smoothstep(.28,.0,distance(vUv,uMouse));

  vec3 darkBase=mix(vec3(.015),vec3(.06,.065,.08),d*pulse);
  darkBase=mix(darkBase,vec3(.22,.28,.38)*d,glow);

  vec3 lightBase=mix(vec3(.94,.93,.91),vec3(.82,.86,.9),d*pulse);
  lightBase=mix(lightBase,vec3(.6,.72,.92)*d,glow);
  gl_FragColor=vec4(mix(darkBase,lightBase,uLight),1.);}`,
  depthWrite: false,
});

export const voxelMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: `uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vColor;
void main(){
  vNormal=normal;
  float str=mix(5.,20.,uHoverStrength);
  vec3 p=floor(position*str+.5)/str;
  float l=dot(normalize(normal),normalize(vec3(1,1.5,1)))*.5+.5;
  float q=floor(l*6.)/6.;
  vColor=vec3(q);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `varying vec3 vNormal;varying vec3 vColor;
void main(){
  vec3 n=normalize(vNormal);
  float rim=pow(1.-abs(dot(n,vec3(0,0,1))),3.);
  gl_FragColor=vec4(vColor+rim*vec3(.08,.12,.2),1.);}`,
});

export const vhsMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `uniform float time;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vNormal=normal;vPos=position;
  vec3 p=position;
  float glitch=step(.97,fract(sin(floor(p.y*12.+time*8.)*43758.5)*43758.5));
  p.x+=glitch*(fract(sin(p.y*100.+time)*437.5)-.5)*.22;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `uniform float time;varying vec3 vNormal;varying vec3 vPos;
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1,1)))*.5+.5;

  float sc=sin(gl_FragCoord.y*.8-time*12.)*.12+.88;

  float band=step(.94,sin(vPos.y*18.+time*6.))*.35;

  float snow=hash2(gl_FragCoord.xy+time*7.)*.06*(1.-l);
  vec3 col=vec3(l*sc+snow);
  col.r+=band*.45; col.b+=band*.25;

  float chrom=.018+abs(vPos.x)*.01;
  col.r=mix(col.r,l+chrom,sc*.5);
  col.b=mix(col.b,l-chrom,sc*.5);

  col.g=mix(col.g,col.g+.04*sin(time*3.+vPos.y*5.),band);
  gl_FragColor=vec4(col,1.);}`,
});

export const glassMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: `varying vec3 vNormal;varying vec3 vPos;varying vec3 vView;varying vec3 vWorldNorm;
void main(){
  vNormal=normalMatrix*normal;
  vWorldNorm=normal;
  vPos=position;
  vView=normalize(-(modelViewMatrix*vec4(position,1.)).xyz);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform float time;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vPos;varying vec3 vView;varying vec3 vWorldNorm;
void main(){
  vec3 n=normalize(vNormal);
  vec3 v=normalize(vView);
  float NdV=abs(dot(n,v));
  float fresnel=pow(1.-NdV,2.8);
  vec3 r=reflect(-v,n);
  float envA=r.y*.5+.5;
  float envB=dot(r,normalize(vec3(1,1.5,2.)))*.5+.5;

  float shimmer=sin(time*1.4+vPos.y*3.+vPos.x*2.)*.04+.96;
  vec3 envCol=mix(vec3(.04,.06,.1),vec3(.55,.78,1.)*shimmer,envA);
  vec3 refCol=mix(vec3(.06,.10,.16),vec3(.9,.95,1.),envB);

  vec3 interior=mix(vec3(.05,.14,.22),vec3(.15,.45,.7),NdV);
  float spec=pow(max(0.,dot(r,vec3(0,0,1))),120.)*2.0;
  float spec2=pow(max(0.,dot(r,normalize(vec3(-1,.5,1)))),45.)*.6;

  float film=sin(fresnel*18.+time*.5)*0.5+0.5;
  vec3 filmCol=.5+.5*cos(6.28*(vec3(0.,.33,.67)+film*.25));
  vec3 col=mix(interior,mix(refCol,envCol,fresnel*.85),NdV*.7)+vec3(spec+spec2);
  col+=filmCol*fresnel*.18;
  col=mix(col,vec3(.4,.72,1.)*col,uHoverStrength*.7);
  float alpha=.15+fresnel*.65+spec*.3;
  gl_FragColor=vec4(col,alpha);}`,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

export const contourMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `varying vec3 vNormal;varying vec3 vPos;void main(){vNormal=normal;vPos=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal;varying vec3 vPos;
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*noise3(p);p*=2.01;a*=.48;}return v;}
void main(){
  float n=fbm(vPos*1.8+vec3(0,time*.2,0));
  float line=smoothstep(.04,.0,abs(fract(n*10.)-.5));
  float edge=smoothstep(.03,.0,abs(fract(n*30.)-.5))*.4;
  float l=dot(normalize(vNormal),normalize(vec3(1,1.5,1)))*.5+.5;
  vec3 col=mix(vec3(.04,.04,.06),vec3(.88,.93,1.),(line+edge)*l);
  gl_FragColor=vec4(col,1.);}`,
});

export const sketchMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: VERT_SIMPLE,
  fragmentShader: `uniform float time;varying vec3 vNormal;varying vec3 vPos;varying vec2 vUv;
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float hatch(vec2 uv,float a,float sp,float jit){float c=cos(a),s=sin(a);float line=fract((c*uv.x-s*uv.y+n2(uv*2.+time*.1)*jit)/sp);return smoothstep(.1,.0,abs(line-.5)-.38);}
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float rim=1.-abs(dot(n,vec3(0,0,1)));
  float sk=0.;
  if(l>.25) sk=max(sk,hatch(vPos.xy*2.2,.7854,.1,.05));
  if(l>.45) sk=max(sk,hatch(vPos.xy*2.2,-.7854,.1,.05)*.8);
  if(l>.65) sk=max(sk,hatch(vPos.xy*2.2,0.,.08,.03)*.6);
  float outline=smoothstep(.35,.18,rim)*smoothstep(.4,.6,1.-l);
  float paper=n2(vPos.xy*40.+vPos.z*20.)*.04;
  gl_FragColor=vec4(mix(vec3(.96,.94,.91)+paper,vec3(.06,.05,.04),max(sk,outline)),1.);}`,
});

export const pixelateMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: `uniform float time;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vColor;
void main(){
  vNormal=normal;
  float str=mix(5.,28.,uHoverStrength);
  vec3 p=floor(position*str+.5)/str;
  float l=dot(normalize(normal),normalize(vec3(1,1.5,1)))*.5+.5;
  float q=floor(l*5.)/5.;
  float flicker=floor((sin(time*20.+p.x*17.+p.y*9.)*.5+.5)*3.)/3.;
  q=mix(q,q+flicker*.06,uHoverStrength);
  vColor=mix(vec3(q),vec3(q*.6,q*.8,q),uHoverStrength*.5);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `varying vec3 vNormal;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.);}`,
});

export const lightupMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader: `uniform float time;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vPos;varying vec2 vUv;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float rim=pow(1.-abs(dot(n,vec3(0,0,1))),2.);
  float wave=sin(vPos.y*5.-time*2.5)*.5+.5;
  float wave2=sin(vPos.x*4.+time*1.8)*.5+.5;
  float em=uHoverStrength*(wave*wave2*.8+rim*.4)*l;
  vec3 dark=vec3(l*.15,l*.18,l*.22);
  vec3 lit=vec3(.25,.65,1.)*l+vec3(.6,.85,1.)*em;
  gl_FragColor=vec4(mix(dark,lit,uHoverStrength),1.);}`,
});

export const liquidMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader:
    NOISE3 +
    `uniform float time;uniform vec3 uHoverPos;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vNormal=normal;vPos=position;
  float prox=1.-smoothstep(0.,2.2,distance(position,uHoverPos));
  float n1=noise3(position*2.8+time*1.4);
  float n2=noise3(position*5.5-time*2.1);
  vec3 disp=normal*(n1*2.-1.)*.14*uHoverStrength*prox;
  disp+=normal*(n2*2.-1.)*.05*uHoverStrength*prox;
  disp+=normal*sin(position.y*2.2+time)*.035;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position+disp,1.);}`,
  fragmentShader: `uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float fr=pow(1.-abs(dot(n,vec3(0,0,1))),2.);
  vec3 base=mix(vec3(l*.6),vec3(.3,.55,.9)*l,fr*uHoverStrength);
  gl_FragColor=vec4(base,1.);}`,
});

export const distortMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vNormal=normal;
  float spd=time*.35;
  float s=noise3(position*3.2+floor(spd)*7.3);
  float s2=noise3(position*3.2+floor(spd+1.)*7.3);
  float bl=smoothstep(.55,1.,fract(spd));
  vec3 off=vec3(
    mix(noise3(position+s*2.8),noise3(position+s2*2.8),bl),
    mix(noise3(position+s*2.9+1.),noise3(position+s2*2.9+1.),bl),
    mix(noise3(position+s*3.+2.),noise3(position+s2*3.+2.),bl))*2.-1.;
  vPos=position+off*.11;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(vPos,1.);}`,
  fragmentShader: `varying vec3 vNormal;varying vec3 vPos;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float rim=pow(1.-abs(dot(n,vec3(0,0,1))),3.)*.4;
  gl_FragColor=vec4(vec3(l)+rim*vec3(.1,.15,.25),1.);}`,
});

export const wireframeMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: `attribute vec3 aBary;varying vec3 vBary;varying vec3 vPos;void main(){vBary=aBary;vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform float time;varying vec3 vBary;varying vec3 vPos;
void main(){
  vec3 d=fwidth(vBary);
  vec3 a=smoothstep(vec3(0.),d*1.2,vBary);
  float edge=1.-min(min(a.x,a.y),a.z);
  if(edge<.05) discard;

  float pulse=sin(vPos.y*8.-time*3.)*.1+.9;
  float pulse2=sin(vPos.x*6.+time*2.)*.05+.95;

  float edgePow=pow(edge,0.7);
  vec3 col=mix(vec3(.4,.65,.9),vec3(.9,.97,1.),edgePow*pulse);

  float interf=sin((vPos.x+vPos.y)*22.-time*4.)*.04+.96;
  col*=interf*pulse2;
  gl_FragColor=vec4(col,edge*.95);}`,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
});

export const watercolorMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float n1=noise3(vPos*1.8+time*.08);
  float n2=noise3(vPos*3.5-time*.06);
  float n3=noise3(vPos*7.+time*.04);
  float wet=clamp(l+n1*.18+n2*.1+n3*.04,0.,1.);
  float bloom=noise3(vPos*4.+vec3(time*.15));
  float bloom2=noise3(vPos*9.-vec3(0,time*.1,0));
  vec3 c1=vec3(.55,.78,.94);
  vec3 c2=vec3(.88,.65,.82);
  vec3 c3=vec3(.78,.92,.68);
  vec3 col=mix(c1,c2,bloom);
  col=mix(col,c3,bloom2*.4);
  col*=wet;
  col+=noise3(vPos*25.+time*.02)*.04;
  float paper=noise3(vPos*60.)*.025;
  gl_FragColor=vec4(col+paper,wet*.96);}`,
  transparent: true,
});

export const motionBlurMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    uVelocity: { value: new THREE.Vector3() },
    ...hoverU,
  },
  vertexShader: `uniform vec3 uVelocity;varying vec3 vNormal;varying float vBlur;varying vec3 vPos;varying vec3 vVelDir;
void main(){
  vNormal=normal;vPos=position;
  vBlur=length(uVelocity);
  vVelDir=normalize(uVelocity+vec3(0.001));
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform float time;uniform vec3 uVelocity;varying vec3 vNormal;varying float vBlur;varying vec3 vPos;varying vec3 vVelDir;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float blur=smoothstep(0.,.12,vBlur);

  float fdir=dot(vVelDir,n)*.5+.5;
  float streak=fdir*blur;

  float ang=atan(vPos.y,vPos.x);
  float radial=sin(ang*4.-time*12.)*blur*.08;
  vec3 col=mix(vec3(l),vec3(l*.65,l*.8,l)*1.15+vec3(.05,.12,.25)*streak+radial,streak*.9);

  float rim=pow(1.-abs(dot(n,vec3(0,0,1))),3.);
  col+=vec3(.1,.3,.6)*rim*blur*.5;
  gl_FragColor=vec4(col,mix(1.,.45,blur*.8));}`,
  transparent: true,
});

export const metallicMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    NOISE3 +
    `uniform float time;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vec3 n=normalize(vNormal);
  vec3 v=vec3(0,0,1);
  float NdV=abs(dot(n,v));
  float fresnel=pow(1.-NdV,3.5);
  vec3 L1=normalize(vec3(1,1.5,2.));
  vec3 L2=normalize(vec3(-1,.5,1.));
  float d1=dot(n,L1)*.5+.5;
  float d2=dot(n,L2)*.3+.3;
  float s1=pow(max(0.,dot(reflect(-L1,n),v)),120.)*1.6;
  float s2=pow(max(0.,dot(reflect(-L2,n),v)),45.)*.6;

  float brushAngle=atan(n.z,n.x);
  float brush=sin(brushAngle*32.+noise3(vPos*8.)*.5)*.04+.96;
  float aniso=noise3(vPos*20.+vec3(0,time*.015,0))*.05;
  vec3 col=vec3(.62,.64,.68)*(d1+d2*.4)*brush+vec3(s1+s2)+fresnel*.25+aniso;

  float iridH=fract(fresnel*2.+time*.08+NdV*.5);
  vec3 irid=.5+.5*cos(6.28*(iridH+vec3(0.,.33,.67)));
  col=mix(col,irid*col*(1.+fresnel*.8),uHoverStrength*fresnel*.9);
  gl_FragColor=vec4(col,1.);}`,
});

export const paintMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, uPaintTex: { value: null }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader:
    NOISE3 +
    `uniform float time;uniform sampler2D uPaintTex;varying vec3 vNormal;varying vec3 vPos;varying vec2 vUv;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  vec4 paint=texture2D(uPaintTex,vUv);
  float grain=noise3(vPos*25.)*.07;
  float bristle=noise3(vPos*80.)*.03;
  vec3 base=vec3(.08,.08,.1)*l;
  vec3 col=mix(base,paint.rgb*(l+grain)+bristle,paint.a);
  gl_FragColor=vec4(col,1.);}`,
});

export const fireMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader:
    NOISE3 +
    `uniform float time;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vPos;varying float vHeat;
void main(){
  vNormal=normal;
  vec3 p=position;
  float heat=clamp((p.y+1.5)/3.,0.,1.);
  vHeat=heat;
  float f1=noise3(p*3.5+vec3(0,time*2.8,0));
  float f2=noise3(p*7.+vec3(0,time*4.5,0))*.5;
  float f3=noise3(p*14.+vec3(0,time*7.,0))*.25;
  float flicker=f1+f2+f3;
  p+=normal*flicker*heat*.18;
  p.y+=flicker*heat*.12;

  p.x+=sin(p.y*4.+time*3.)*heat*.04;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal;varying vec3 vPos;varying float vHeat;
void main(){
  float l=dot(normalize(vNormal),normalize(vec3(1,1.5,1)))*.4+.6;
  float n1=noise3(vPos*4.+vec3(0,time*3.5,0));
  float n2=noise3(vPos*9.+vec3(0,time*6.,0))*.5;
  float n3=noise3(vPos*18.+vec3(0,time*10.,0))*.25;
  float flame=clamp(vHeat*(n1+n2+n3)*1.3,0.,1.);
  vec3 col=vec3(.02,.0,.04);
  col=mix(col,vec3(.7,.04,.0),smoothstep(0.,.15,flame));
  col=mix(col,vec3(1.,.35,.0),smoothstep(.15,.42,flame));
  col=mix(col,vec3(1.,.82,.06),smoothstep(.38,.68,flame));
  col=mix(col,vec3(1.,1.,.95),smoothstep(.62,1.,flame));
  col*=l;

  float spark=step(.982,noise3(vPos*22.+time*2.))*flame;
  col+=vec3(1.,.55,.1)*spark*2.2;

  float blue=smoothstep(.2,.0,vHeat)*l;
  col+=vec3(.02,.04,.18)*blue;
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
    `uniform float time;uniform vec2 uResolution;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float cellSize=10.;
  vec2 cell=floor(gl_FragCoord.xy/cellSize);
  vec2 cv=fract(gl_FragCoord.xy/cellSize);
  float noise=hash3(vec3(cell,floor(time*10.)));
  float brightness=clamp(l+noise*.04,0.,1.);
  int lvl=int(floor(brightness*7.));
  vec2 c=cv-.5;
  float dot1=1.-smoothstep(.07,.11,length(c));
  float dash=smoothstep(.04,.0,abs(c.y))*smoothstep(.4,.3,abs(c.x));
  float plus=max(smoothstep(.03,.0,abs(c.x))*smoothstep(.42,.3,abs(c.y)),
                 smoothstep(.03,.0,abs(c.y))*smoothstep(.42,.3,abs(c.x)));
  float xmark=max(smoothstep(.035,.0,abs(c.x-c.y)*.7),smoothstep(.035,.0,abs(c.x+c.y)*.7));
  float hatch=max(plus,xmark);
  float colon=max(1.-smoothstep(.05,.09,length(c+vec2(0.,.18))),1.-smoothstep(.05,.09,length(c-vec2(0.,.18))));
  float full=smoothstep(.44,.4,length(c));
  float shape=0.;
  if(lvl<=0)shape=0.;
  else if(lvl==1)shape=dot1*.6;
  else if(lvl==2)shape=dash;
  else if(lvl==3)shape=colon;
  else if(lvl==4)shape=plus;
  else if(lvl==5)shape=xmark;
  else if(lvl==6)shape=hatch;
  else shape=full;

  float shimmer=hash3(vec3(cell*1.3,floor(time*3.)))*.06;
  vec3 col=vec3(.1+shimmer,.95+shimmer*.2,.35)*shape*brightness;
  gl_FragColor=vec4(col,shape>.01?1.:0.);}`,
  transparent: true,
});

export const celMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader: VERT_SIMPLE,
  fragmentShader: `uniform float time;uniform float uHoverStrength;varying vec3 vNormal;varying vec3 vPos;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)));
  float cel=floor(l*4.+.5)/4.;
  cel=clamp(cel,0.,1.);
  float rim=abs(dot(n,vec3(0,0,1)));
  float outline=1.-smoothstep(.2,.28,rim);
  vec3 shadow=vec3(.06,.07,.1);
  vec3 mid=vec3(.4,.45,.55);
  vec3 hi=vec3(.88,.9,1.);
  vec3 base=mix(shadow,mix(mid,hi,cel),smoothstep(0.,.3,cel));
  base=mix(base,vec3(.15,.6,1.)*1.1,uHoverStrength*cel*.7);
  gl_FragColor=vec4(mix(base,vec3(0.),outline),1.);}`,
});

export const hologramMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, ...hoverU },
  vertexShader:
    NOISE3 +
    `uniform float time;varying vec3 vNormal;varying vec3 vPos;varying float vFresnel;
void main(){
  vNormal=normal;vPos=position;
  vec3 camDir=normalize(cameraPosition-(modelMatrix*vec4(position,1.)).xyz);
  vFresnel=pow(1.-abs(dot(normalize(normalMatrix*normal),camDir)),2.);
  vec3 p=position;

  float jitter=noise3(vec3(p.y*14.+time*10.,time*3.,0.))*.007;
  float glitchLine=step(.988,fract(time*.7+p.y*3.1))*jitter*14.;
  p.x+=glitchLine;

  float seg=floor(p.y*5.);
  float segOff=step(.998,noise3(vec3(seg,time*2.,0.)))*(noise3(vec3(seg*7.,time,0.))-.5)*.12;
  p.x+=segOff;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:
    HASH3 +
    `uniform float time;varying vec3 vNormal;varying vec3 vPos;varying float vFresnel;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;

  float scan=step(.55,fract(vPos.y*10.-time*2.))*.12;
  float scan2=step(.8,fract(vPos.y*40.+time*6.))*.06;
  float fine=step(.94,fract(vPos.y*60.+time*5.));

  float diag=step(.92,fract((vPos.x+vPos.y)*8.-time))*.25;
  float diag2=step(.95,fract((vPos.x-vPos.y)*12.+time*.5))*.15;

  float glyph=step(.97,hash3(vec3(floor(vPos.y*18.),floor(vPos.x*18.),floor(time*4.))))*.5;
  vec3 col=vec3(.04,.82,.62)*l;
  col+=vec3(.0,.22,.16)*scan;
  col+=vec3(.0,.15,.10)*scan2;
  col+=vec3(.3,.92,.78)*fine*.7;
  col+=vec3(.0,.4,.32)*diag;
  col+=vec3(.0,.3,.24)*diag2;
  col+=vec3(.5,1.,.85)*glyph;
  col+=vec3(.12,.92,.72)*vFresnel*1.6;

  float colFlick=step(.994,hash3(vec3(floor(vPos.x*6.),0.,floor(time*.4))))*.5;
  col=mix(col,vec3(0.,.9,.68),colFlick);
  float flicker=step(.997,fract(time*.28+vPos.y*.08))*.6;
  col=mix(col,vec3(0.,.92,.7),flicker);
  float alpha=max(.18+vFresnel*.6,max(scan*.5,fine*.8));
  gl_FragColor=vec4(col,alpha);}`,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

export const chromaticMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    uChromaticStrength: { value: 1.0 },
    ...hoverU,
  },
  vertexShader: VERT_SIMPLE,
  fragmentShader: `uniform float time;uniform float uChromaticStrength;varying vec3 vNormal;varying vec3 vPos;varying vec2 vUv;
void main(){
  vec3 n=normalize(vNormal);
  float l=dot(n,normalize(vec3(1,1.5,1)))*.5+.5;
  float rim=pow(1.-abs(dot(n,vec3(0,0,1))),2.);

  float shift=rim*uChromaticStrength*.12;

  vec3 nR=normalize(vNormal+vec3(shift,0.,0.));
  vec3 nB=normalize(vNormal-vec3(shift,0.,0.));
  float lR=dot(nR,normalize(vec3(1,1.5,1)))*.5+.5;
  float lG=l;
  float lB=dot(nB,normalize(vec3(1,1.5,1)))*.5+.5;
  vec3 col=vec3(lR,lG,lB);

  float prism=rim*uChromaticStrength;
  col+=vec3(prism*.4,-prism*.1,prism*.5)*rim;
  col+=vec3(.1,.15,.22)*rim*.3;
  gl_FragColor=vec4(col,1.);}`,
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
  celMat,
  hologramMat,
  chromaticMat,
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
  "cel",
  "hologram",
  "chromatic",
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
  glassMat,
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
  celMat,
  bgMat,
  hologramMat,
  chromaticMat,
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
      fragmentShader: `uniform float time;uniform vec3 baseColor;varying vec3 vNormal;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),vec3(0,0,1))),2.);float pulse=sin(time*6.)*.5+.5;gl_FragColor=vec4(baseColor*(rim*2.+pulse*.5),rim+.1);}`,
      transparent: true,
    }),
    new THREE.ShaderMaterial({
      uniforms: { time: { value: time } },
      vertexShader: `varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float time;varying vec3 vPos;void main(){float h=fract(atan(vPos.x,vPos.z)/(3.14159*2.)+time*.3);vec3 col=.5+.5*cos(6.28*(h+vec3(0,.33,.67)));gl_FragColor=vec4(col,1.);}`,
    }),
  ];
  return effects[Math.floor(Math.random() * effects.length)];
}
