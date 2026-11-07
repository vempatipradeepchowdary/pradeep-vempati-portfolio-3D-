import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

// AETHER: a golden ring above an endless sea of clouds, fragments of marble
// temples drifting around it, and beyond it a colonnade that runs into space,
// with a staircase climbing to a celestial gateway.

let seed = 7
const rnd = (a = 1, b) => { seed = (seed * 16807) % 2147483647; const r = (seed - 1) / 2147483646; return b === undefined ? r * a : a + r * (b - a) }

const SUN = new THREE.Vector3(0, 0.17, -1).normalize()
const RING = new THREE.Vector3(0, 62, -140)

const KEYS = [
  ['#home', 'start', [0, 46, 160], [0, 66, -140]],
  ['#home', 'end', [0, 54, 40], [0, 62, -140]],
  ['#about', 'start', [-34, 58, -10], [10, 63, -140]],
  ['#about', 'end', [18, 60, -76], [0, 62, -170]],
  ['#skills', 'start', [0, 62, -108], [0, 62, -210]],
  ['#skills', 'end', [0, 61, -176], [0, 57, -270]],
  ['#experience', 'start', [-22, 56, -222], [22, 52, -310]],
  ['#experience', 'end', [16, 52, -300], [0, 54, -390]],
  ['#projects', 'start', [0, 52, -348], [0, 57, -460]],
  ['#projects', 'end', [0, 52, -520], [0, 60, -640]],
  ['#education', 'start', [0, 56, -556], [0, 84, -680]],
  ['#approach', 'end', [0, 117, -672], [0, 124, -760]],
  ['#contact', 'start', [0, 118, -690], [0, 126, -760]],
  ['#contact', 'end', [0, 118, -696], [0, 126, -760]],
]

const NOISE = /* glsl */ `
  float h12(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p=mat2(1.6,1.2,-1.2,1.6)*p; a*=.5; } return s; }`

const SKY = /* glsl */ `
  ${NOISE}
  uniform vec3 uSun; uniform float uT;
  vec3 skyCol(vec3 d){
    float y=d.y;
    vec3 hor=vec3(.92,.56,.3), mid=vec3(.2,.13,.38), zen=vec3(.006,.014,.06);
    vec3 c=mix(hor,mid,smoothstep(-.02,.24,y));
    c=mix(c,zen,smoothstep(.18,.72,y));
    vec2 q=d.xz/(d.y+.35);
    float neb=fbm(q*1.6+vec2(uT*.004,0.));
    float neb2=fbm(q*3.4-vec2(0.,uT*.003)+7.);
    c+=(vec3(.55,.32,1.)*neb*neb*1.1+vec3(.2,.45,1.)*pow(neb2,3.)*.9)*smoothstep(.16,.55,y)*.3;
    vec2 g=floor(d.xy*vec2(420.,420.)+d.z*300.);
    float st=step(.9975,h12(g))*smoothstep(.25,.6,y);
    c+=vec3(1.,.95,.9)*st*1.4;
    float s=max(dot(d,uSun),0.);
    c+=vec3(1.6,1.,.45)*pow(s,6.)*.35+vec3(3.,2.3,1.5)*pow(s,80.)*.5+vec3(14.)*pow(s,3000.);
    return c;
  }`

function marble(env) {
  const m = new THREE.MeshStandardMaterial({ color: 0xf3efe7, roughness: 0.32, metalness: 0, envMap: env, envMapIntensity: 0.9 })
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 wq=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          wq=instanceMatrix*wq;
        #endif
        vW=(modelMatrix*wq).xyz;`)
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vW;\n${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float v=fbm(vW.xz*.18+vW.y*.11);
        float vein=1.-smoothstep(.0,.025,abs(fract(v*4.)-.5)-.47);
        diffuseColor.rgb*=1.-vein*.22;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.,.95,.88),fbm(vW.xy*.05));`)
  }
  return m
}

class Boxes {
  constructor() { this.items = [] }
  add(p, s, r = [0, 0, 0]) { this.items.push([p, s, r]) }
  build(geo, material) {
    const im = new THREE.InstancedMesh(geo, material, this.items.length)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    this.items.forEach(([p, s, r], i) => {
      q.setFromEuler(new THREE.Euler(...r))
      m.compose(new THREE.Vector3(...p), q, new THREE.Vector3(...s))
      im.setMatrixAt(i, m)
    })
    im.frustumCulled = false
    return im
  }
}

function glowPlane(color, w, h, power, round = true) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: color }, uT: { value: 0 }, uP: { value: power }, uR: { value: round ? 1 : 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `${NOISE}
      uniform vec3 uC; uniform float uT,uP,uR; varying vec2 vUv;
      void main(){ vec2 p=vUv*2.-1.; float e=mix(max(abs(p.x)*.9,abs(p.y)),length(p),uR);
        float core=1.-smoothstep(0.,1.,e);
        float a=atan(p.y,p.x); float sw=.6+.4*vn(vec2(a*3.+uT*.3,length(p)*4.-uT*.5));
        vec3 c=uC*pow(core,2.)*sw+vec3(1.,.92,.8)*pow(core,8.)*1.2;
        gl_FragColor=vec4(c*uP,1.); }`,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
  mesh.frustumCulled = false
  return { mesh, m }
}

export async function createAether({ canvas, still = false, reduced = false }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: still })
  } catch { return null }
  if (!renderer.getContext()) return null

  const small = Math.min(innerWidth, innerHeight) < 700
  const weak = small || (navigator.hardwareConcurrency || 8) <= 4
  let dpr = Math.min(devicePixelRatio || 1, weak ? 1.1 : 1.5)
  renderer.setPixelRatio(dpr)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x9a6a4a, 0.00055)
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 6000)
  scene.add(camera)
  const shared = { uSun: { value: SUN }, uT: { value: 0 } }

  // Sky
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: shared,
    vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `${SKY}\n varying vec3 vD; void main(){ gl_FragColor=vec4(skyCol(normalize(vD)),1.); }`,
  })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), skyMat)
  sky.frustumCulled = false
  sky.renderOrder = -10
  scene.add(sky)

  // Reflections come from the same sky.
  const envScene = new THREE.Scene()
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), skyMat))
  const pm = new THREE.PMREMGenerator(renderer)
  const env = pm.fromScene(envScene, 0.02, 0.1, 100, { size: weak ? 256 : 512 }).texture
  pm.dispose()

  const sunLight = new THREE.DirectionalLight(0xffd29a, 2.1)
  sunLight.position.copy(SUN).multiplyScalar(100)
  scene.add(sunLight)
  const fill = new THREE.DirectionalLight(0x8f86ff, 0.9)
  fill.position.set(0.4, 0.6, 1)
  scene.add(fill)
  scene.add(new THREE.HemisphereLight(0x8d8fe0, 0xd8a774, 0.42))

  const marbleM = marble(env)
  const gold = new THREE.MeshStandardMaterial({ color: 0xe4b866, metalness: 1, roughness: 0.26, envMap: env, envMapIntensity: 1.3 })
  const goldDark = new THREE.MeshStandardMaterial({ color: 0xb98a3e, metalness: 1, roughness: 0.4, envMap: env, envMapIntensity: 1 })
  const crystal = new THREE.MeshStandardMaterial({ color: 0xd9d0ff, metalness: 0.1, roughness: 0.04, envMap: env, envMapIntensity: 1.8, transparent: true, opacity: 0.55 })
  const animated = []

  // The sea of clouds, endless: it follows the camera, the pattern stays put.
  const cloudU = { ...shared, uFog: { value: new THREE.Color(0.9, 0.55, 0.3) }, uLayer: { value: 0 } }
  const cloudMat = (layer) => new THREE.ShaderMaterial({
    transparent: layer > 0, depthWrite: layer === 0,
    uniforms: { ...cloudU, uLayer: { value: layer } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `${NOISE}
      uniform vec3 uSun,uFog; uniform float uT,uLayer; varying vec3 vW;
      void main(){
        vec2 p=vW.xz*.0042+vec2(uT*.006,uT*.002)+uLayer*13.;
        float d=fbm(p)+fbm(p*2.7+3.)*.35;
        float l=fbm(p+uSun.xz*.06)+fbm((p+uSun.xz*.06)*2.7+3.)*.35;
        float lit=clamp((d-l)*3.2+.55,0.,1.);
        float top=smoothstep(.45,1.05,d);
        vec3 shadow=vec3(.17,.14,.34), sunlit=vec3(1.05,.72,.45);
        vec3 c=mix(shadow,sunlit,lit)*(.7+.5*top);
        float dist=length(vW.xz-cameraPosition.xz);
        c=mix(c,uFog,1.-exp(-dist*.0007));
        float a=uLayer>.5?smoothstep(.62,.95,d)*.75*(1.-smoothstep(600.,1600.,dist)):1.;
        gl_FragColor=vec4(c,a);
      }`,
  })
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), cloudMat(0))
  sea.rotation.x = -Math.PI / 2
  sea.frustumCulled = false
  scene.add(sea)
  const wisps = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), cloudMat(1))
  wisps.rotation.x = -Math.PI / 2
  wisps.position.y = 16
  wisps.frustumCulled = false
  scene.add(wisps)
  const cloudMats = [sea.material, wisps.material]

  // Distant planets with lit atmospheres.
  const planetMat = (base, band, atm) => new THREE.ShaderMaterial({
    uniforms: { uSun: shared.uSun, uB: { value: new THREE.Color(base) }, uK: { value: new THREE.Color(band) }, uA: { value: new THREE.Color(atm) } },
    vertexShader: 'varying vec3 vN,vP; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vP=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `${NOISE}
      uniform vec3 uSun,uB,uK,uA; varying vec3 vN,vP;
      void main(){ vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vP);
        float lat=n.y*6.+fbm(n.xz*3.)*1.6;
        vec3 c=mix(uB,uK,.5+.5*sin(lat));
        float lit=smoothstep(-.15,.6,dot(n,uSun));
        float rim=pow(1.-max(dot(n,v),0.),3.);
        c=c*(.06+lit*1.3)+uA*rim*(.25+lit*1.4);
        gl_FragColor=vec4(c,1.); }`,
  })
  const planet = new THREE.Mesh(new THREE.SphereGeometry(520, 64, 48), planetMat(0x6f6aa8, 0xc9b8e8, 0x9fb8ff))
  planet.position.set(-1500, 420, -3000)
  scene.add(planet)
  const planetRing = new THREE.Mesh(new THREE.RingGeometry(700, 1050, 128, 1), new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vP; void main(){ vUv=uv; vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vP; void main(){ float r=length(vP.xy); float b=.5+.5*sin(r*.07)*sin(r*.023);
      float a=smoothstep(700.,760.,r)*(1.-smoothstep(980.,1050.,r))*.45*b; gl_FragColor=vec4(vec3(1.4,1.2,1.)*a,a); }`,
  }))
  planetRing.position.copy(planet.position)
  planetRing.rotation.set(1.25, 0.3, 0.2)
  scene.add(planetRing)
  const moon = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 32), planetMat(0xd8c2a4, 0xf2e6d2, 0xffe2b8))
  moon.position.set(1400, 820, -2700)
  scene.add(moon)

  // The golden ring and its armillary bands.
  const ringGroup = new THREE.Group()
  ringGroup.position.copy(RING)
  scene.add(ringGroup)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(58, 3.4, 48, 256), gold)
  ringGroup.add(ring)
  const inner = new THREE.Mesh(new THREE.TorusGeometry(53.5, 0.7, 16, 256), goldDark)
  ringGroup.add(inner)
  const bands = [new THREE.Mesh(new THREE.TorusGeometry(66, 0.9, 16, 256), gold), new THREE.Mesh(new THREE.TorusGeometry(71, 0.5, 12, 256), goldDark)]
  bands[0].rotation.set(0.35, 0.5, 0)
  bands[1].rotation.set(-0.4, -0.3, 0.6)
  bands.forEach((b) => ringGroup.add(b))
  const studs = new Boxes()
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    studs.add([Math.cos(a) * 58, Math.sin(a) * 58, 3.2], [1.4, 3.6, 1], [0, 0, a])
  }
  ringGroup.add(studs.build(new THREE.BoxGeometry(1, 1, 1), marbleM))
  const veil = glowPlane(new THREE.Color(1.2, 0.85, 1.5), 116, 116, 0.05)
  ringGroup.add(veil.mesh)
  animated.push(veil.m)

  // Drifting fragments of temples around the ring.
  const frag = new Boxes()
  const fragGold = new Boxes()
  for (let i = 0; i < (weak ? 260 : 460); i++) {
    const dir = new THREE.Vector3(rnd(-1, 1), rnd(-0.6, 0.8), rnd(-1, 1)).normalize()
    const p = RING.clone().addScaledVector(dir, rnd(78, 260))
    if (Math.abs(p.x) < 40 && Math.abs(p.y - 58) < 26) continue
    if (p.y < 22) p.y = 22 + rnd(30)
    const big = rnd() < 0.12
    const s = big ? [rnd(8, 20), rnd(3, 6), rnd(6, 14)] : [rnd(0.8, 5), rnd(0.8, 5), rnd(0.8, 5)]
    ;(rnd() < 0.2 ? fragGold : frag).add([p.x, p.y, p.z], s, [rnd(6), rnd(6), rnd(6)])
  }
  const fragMesh = frag.build(new THREE.BoxGeometry(1, 1, 1), marbleM)
  const fragGoldMesh = fragGold.build(new THREE.BoxGeometry(1, 1, 1), gold)
  scene.add(fragMesh, fragGoldMesh)
  // Broken column drums among them.
  const drums = new Boxes()
  for (let i = 0; i < 40; i++) {
    const dir = new THREE.Vector3(rnd(-1, 1), rnd(-0.3, 0.7), rnd(-1, 1)).normalize()
    const p = RING.clone().addScaledVector(dir, rnd(90, 230))
    if (Math.abs(p.x) < 40 && Math.abs(p.y - 58) < 26) continue
    drums.add([p.x, Math.max(p.y, 30), p.z], [rnd(1.2, 2.6), rnd(2, 9), rnd(1.2, 2.6)], [rnd(3), rnd(3), rnd(3)])
  }
  scene.add(drums.build(new THREE.CylinderGeometry(1, 1, 1, 24), marbleM))

  // Impossible staircases floating in the sky.
  const stairGeo = new THREE.BoxGeometry(1, 1, 1)
  const flights = new Boxes()
  ;[[-140, 70, -60, 0.3, 0.6], [150, 95, -200, -0.4, -0.5], [-120, 120, -330, 1.1, 0.2], [170, 60, -420, 0.2, 2.6], [-180, 40, -520, -0.8, 1.4]].forEach(([x, y, z, rx, ry]) => {
    const g = new THREE.Object3D()
    g.position.set(x, y, z)
    g.rotation.set(rx, ry, rx * 0.5)
    g.updateMatrixWorld()
    for (let k = 0; k < 26; k++) {
      const v = new THREE.Vector3(0, k * 0.9, -k * 1.4).applyMatrix4(g.matrixWorld)
      flights.add([v.x, v.y, v.z], [10, 0.9, 1.4], [g.rotation.x, g.rotation.y, g.rotation.z])
    }
  })
  scene.add(flights.build(stairGeo, marbleM))

  // Floating islands with small temples, around the Experience stretch.
  const islandG = new THREE.ConeGeometry(1, 1, 9, 1)
  islandG.rotateX(Math.PI)
  islandG.translate(0, -0.5, 0)
  const islands = new Boxes()
  const tops = new Boxes()
  const cols = new Boxes()
  const domes = new Boxes()
  ;[[-62, 40, -236, 22], [72, 30, -262, 26], [-86, 64, -300, 18], [58, 72, -318, 16], [-44, 20, -330, 20], [96, 50, -210, 14]].forEach(([x, y, z, r]) => {
    islands.add([x, y, z], [r, r * 1.6, r], [0, rnd(6), 0])
    tops.add([x, y + 0.6, z], [r * 0.95, 1.2, r * 0.95])
    const cr = r * 0.42
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2
      cols.add([x + Math.cos(a) * cr, y + 1.2 + 5, z + Math.sin(a) * cr], [0.55, 10, 0.55])
    }
    domes.add([x, y + 11.6, z], [cr + 1, cr + 1, cr + 1])
  })
  scene.add(islands.build(islandG, new THREE.MeshStandardMaterial({ color: 0x8b7a68, roughness: 0.9, envMap: env, envMapIntensity: 0.6 })))
  scene.add(tops.build(new THREE.CylinderGeometry(1, 1, 1, 9), marbleM))
  scene.add(cols.build(new THREE.CylinderGeometry(1, 1, 1, 16), marbleM))
  const domeG = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  scene.add(domes.build(domeG, gold))

  // The temple: a nave of columns running into infinity.
  const nave = new Boxes()
  nave.add([0, 37, -700], [46, 6, 720])
  scene.add(nave.build(new THREE.BoxGeometry(1, 1, 1), marbleM))
  const inlay = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 720), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.8) }))
  inlay.rotation.x = -Math.PI / 2
  inlay.position.set(0, 40.05, -700)
  scene.add(inlay)
  const shafts = new Boxes()
  const caps = new Boxes()
  const arches = new Boxes()
  for (let z = -350; z > -1060; z -= 10) {
    ;[-15, 15].forEach((x) => {
      shafts.add([x, 57, z], [1.6, 34, 1.6])
      caps.add([x, 74.6, z], [2.4, 1.2, 2.4])
      caps.add([x, 40.6, z], [2.4, 1.2, 2.4])
    })
    if (z > -560 && Math.round(z) % 20 === 10) arches.add([0, 75, z], [1, 1, 1])
  }
  scene.add(shafts.build(new THREE.CylinderGeometry(1, 1, 1, 24), marbleM))
  scene.add(caps.build(new THREE.CylinderGeometry(1, 1, 1, 24), gold))
  scene.add(arches.build(new THREE.TorusGeometry(15, 0.55, 12, 64, Math.PI), gold))
  // Crystal obelisks hovering in the nave.
  const crystals = new Boxes()
  ;[[-7, 58, -420], [7, 60, -470], [-6, 62, -520]].forEach(([x, y, z]) => crystals.add([x, y, z], [2.4, 6, 2.4], [0, rnd(3), 0]))
  const crystalMesh = crystals.build(new THREE.OctahedronGeometry(1, 0), crystal)
  scene.add(crystalMesh)

  // The staircase and the celestial gateway.
  const steps = new Boxes()
  for (let k = 0; k < 100; k++) steps.add([0, 40 + k * 0.7 + 0.35, -575 - k * 1.25], [24, 0.7, 1.25])
  steps.add([0, 107, -735], [44, 6, 70])
  scene.add(steps.build(new THREE.BoxGeometry(1, 1, 1), marbleM))
  const gateB = new Boxes()
  gateB.add([-12, 126, -728], [3.2, 32, 3.2])
  gateB.add([12, 126, -728], [3.2, 32, 3.2])
  scene.add(gateB.build(new THREE.BoxGeometry(1, 1, 1), gold))
  const archTop = new THREE.Mesh(new THREE.TorusGeometry(12, 1.6, 16, 96, Math.PI), gold)
  archTop.position.set(0, 142, -728)
  scene.add(archTop)
  const portal = glowPlane(new THREE.Color(2.2, 1.5, 2.6), 22, 44, 0.55, false)
  portal.mesh.position.set(0, 132, -729)
  scene.add(portal.mesh)
  animated.push(portal.m)

  // Golden motes drifting in the light.
  const N = weak ? 400 : 1000
  const mp = new Float32Array(N * 3)
  const ms = new Float32Array(N)
  for (let i = 0; i < N; i++) { mp.set([rnd(90), rnd(60), rnd(90)], i * 3); ms[i] = rnd() }
  const mg = new THREE.BufferGeometry()
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3))
  mg.setAttribute('aS', new THREE.BufferAttribute(ms, 1))
  const moteU = { uT: shared.uT, uCam: { value: new THREE.Vector3() }, uPx: { value: 1 } }
  const motes = new THREE.Points(mg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: moteU,
    vertexShader: `uniform float uT,uPx; uniform vec3 uCam; attribute float aS; varying float vA;
      void main(){ vec3 p=position+vec3(sin(uT*.1+aS*40.)*2.,uT*(.2+aS*.5),cos(uT*.08+aS*30.)*2.);
        vec3 b=vec3(90.,60.,90.); p=mod(p-uCam+b*.5,b)-b*.5+uCam;
        vec4 mv=viewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
        gl_PointSize=uPx*(1.+aS*2.)*(24./-mv.z); vA=smoothstep(1.,8.,-mv.z)*(.3+aS*.6); }`,
    fragmentShader: 'varying float vA; void main(){ float a=1.-smoothstep(.1,.5,length(gl_PointCoord-.5)); gl_FragColor=vec4(vec3(2.2,1.6,.8)*a*vA,1.); }',
  }))
  motes.frustumCulled = false
  scene.add(motes)

  // Post: bloom, sun rays, then grade.
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: weak ? 0 : 4 }))
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.28, 0.5, 1.6)
  composer.addPass(bloom)
  const rays = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uSunUv: { value: new THREE.Vector2(0.5, 0.6) }, uOn: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uSunUv; uniform float uOn; varying vec2 vUv;
      void main(){ vec3 base=texture2D(tDiffuse,vUv).rgb;
        vec2 dl=(vUv-uSunUv)/40.; vec2 p=vUv; float w=1.; vec3 acc=vec3(0.);
        for(int i=0;i<40;i++){ p-=dl; vec3 s=texture2D(tDiffuse,p).rgb; acc+=max(s-vec3(2.4),0.)*w; w*=.955; }
        gl_FragColor=vec4(base+acc*.018*uOn*vec3(1.,.82,.58),1.); }`,
  })
  composer.addPass(rays)
  composer.addPass(new OutputPass())
  const lens = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uT; varying vec2 vUv;
      void main(){ vec2 c=vUv-.5; vec3 col=texture2D(tDiffuse,vUv).rgb; col*=1.-dot(c,c)*.9;
        col=mix(vec3(dot(col,vec3(.3,.59,.11))),col,1.12);
        col=col*col*(3.-2.*col)*.25+col*.75;
        col+=(fract(52.98*fract(dot(gl_FragCoord.xy,vec2(.0671,.0058))+uT))-.5)*.02; gl_FragColor=vec4(col,1.); }`,
  })
  composer.addPass(lens)

  // Scroll to camera
  let stops = []
  const measure = () => {
    const vh = innerHeight
    const max = document.documentElement.scrollHeight - vh
    stops = KEYS.map(([sel, at]) => {
      const el = document.querySelector(sel)
      if (!el) return 0
      const r = el.getBoundingClientRect()
      const top = r.top + scrollY
      const y = at === 'start' ? (sel === '#home' ? 0 : top + vh * 0.42) : top + r.height - vh
      return Math.min(Math.max(y, 0), max)
    })
    for (let i = 1; i < stops.length; i++) stops[i] = Math.max(stops[i], stops[i - 1] + 1)
  }
  const ease = (t) => t * t * (3 - 2 * t)
  const cam = new THREE.Vector3()
  const tgt = new THREE.Vector3()
  const pose = (y) => {
    let i = 0
    while (i < stops.length - 2 && y >= stops[i + 1]) i++
    const t = ease(Math.min(Math.max((y - stops[i]) / (stops[i + 1] - stops[i]), 0), 1))
    cam.set(...KEYS[i][2]).lerp(new THREE.Vector3(...KEYS[i + 1][2]), t)
    tgt.set(...KEYS[i][3]).lerp(new THREE.Vector3(...KEYS[i + 1][3]), t)
  }

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false)
    composer.setPixelRatio(renderer.getPixelRatio())
    composer.setSize(innerWidth, innerHeight)
    bloom.resolution.set(innerWidth / 2, innerHeight / 2)
    camera.aspect = innerWidth / innerHeight
    camera.fov = camera.aspect < 0.8 ? 60 : 40
    camera.updateProjectionMatrix()
    measure()
  }
  resize()
  addEventListener('resize', resize)

  const ptr = { x: 0, y: 0, sx: 0, sy: 0 }
  const onMove = (e) => { ptr.x = e.clientX / innerWidth - 0.5; ptr.y = e.clientY / innerHeight - 0.5 }
  addEventListener('pointermove', onMove, { passive: true })

  const sunPos = new THREE.Vector3()
  const view = new THREE.Vector3()
  let time = 4
  let last = performance.now()
  let spent = 0
  let frames = 0
  const frame = (now = performance.now()) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    if (!reduced && !still) time += dt
    spent += dt * 1000
    frames++
    if (frames === 40) {
      if (spent / frames > 30 && dpr > 0.7) { dpr = Math.max(0.7, dpr - 0.15); renderer.setPixelRatio(dpr); resize() }
      frames = 0
      spent = 0
    }
    ptr.sx += (ptr.x - ptr.sx) * 0.04
    ptr.sy += (ptr.y - ptr.sy) * 0.04
    pose(scrollY)
    camera.position.set(cam.x + ptr.sx * 3 + Math.sin(time * 0.19) * 0.5, cam.y - ptr.sy * 1.6 + Math.sin(time * 0.15) * 0.4, cam.z)
    camera.lookAt(tgt.x + ptr.sx * 4, tgt.y - ptr.sy * 2.5, tgt.z)

    shared.uT.value = time
    animated.forEach((m) => { m.uniforms.uT.value = time })
    cloudMats.forEach((m) => { m.uniforms.uT.value = time })
    sky.position.copy(camera.position)
    sea.position.set(camera.position.x, 0, camera.position.z)
    wisps.position.set(camera.position.x, 16, camera.position.z)
    ring.rotation.z = time * 0.02
    bands[0].rotation.y = 0.5 + time * 0.05
    bands[1].rotation.x = -0.4 + time * 0.04
    fragMesh.rotation.y = Math.sin(time * 0.05) * 0.02
    crystalMesh.rotation.y = time * 0.2
    moteU.uCam.value.copy(camera.position)
    moteU.uPx.value = renderer.getPixelRatio()

    sunPos.copy(camera.position).addScaledVector(SUN, 1000).project(camera)
    camera.getWorldDirection(view)
    rays.uniforms.uSunUv.value.set(sunPos.x * 0.5 + 0.5, sunPos.y * 0.5 + 0.5)
    rays.uniforms.uOn.value = Math.max(0, view.dot(SUN)) ** 2
    lens.uniforms.uT.value = time % 10
    composer.render()
  }

  let raf = 0
  if (still) window.__still = () => frame(performance.now())
  else {
    const loop = (now) => { frame(now); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
  }
  return {
    measure,
    dispose() { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', onMove); renderer.dispose() },
  }
}
