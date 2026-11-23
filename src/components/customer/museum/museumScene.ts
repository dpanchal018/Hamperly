import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshKit } from '../studio/meshKit';
import { containerForOption, ribbonForOption, studioItemsFromSelection, type ContainerKind } from '../studio/productShapes';
import type { MuseumExhibit } from './types';

export interface MuseumCallbacks {
  /** Fired when the scene itself changes focus (exhibit clicked, guided tour advanced). null = overview. */
  onFocusChange?: (index: number | null) => void;
  /** Fired on the first drag / tap inside the hall */
  onInteract?: () => void;
}

/* Hall dimensions (world units ≈ metres) */
const SPACING = 4.5;        // distance between exhibits along the hall (they alternate sides)
const SIDE_X = 3.6;         // exhibit distance from the centre aisle
const HALL_HALF = 6.5;      // half the hall width
const WALL_H = 7.5;
const PLINTH_TOP = 1.03;
const HAMPER_SCALE = 0.6;
const ENTRANCE_Z = 6;
const MAX_ITEMS = 9;

const FLY_TIME = 1.2;
const TOUR_DWELL = 7;
const BUILD_RADIUS = 34;
const SHOW_RADIUS = 36;
const FOG_COLOR = 0xf1dfd8;

const Y_AXIS = new THREE.Vector3(0, 1, 0);

interface Exhibit {
  data: MuseumExhibit;
  index: number;
  side: -1 | 1;
  pos: THREE.Vector3;
  root: THREE.Group;
  turn: THREE.Group;
  hit: THREE.Mesh;
  built: boolean;
  plaque: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture };
}

interface Flight {
  t: number;
  dur: number;
  p0: THREE.Vector3; c: THREE.Vector3; p1: THREE.Vector3;
  q0: THREE.Quaternion; q1: THREE.Quaternion;
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

const KINDS: ContainerKind[] = ['blush', 'kraft', 'velvet', 'wicker'];

/** Packaging from name keywords when present, otherwise a stable pick per hamper */
function containerFor(ex: MuseumExhibit): ContainerKind {
  const text = `${ex.name} ${ex.description ?? ''}`;
  if (/basket|wicker|woven|kraft|eco|velvet/i.test(text)) return containerForOption(text);
  return KINDS[hash(ex.id) % KINDS.length];
}

function fontVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/**
 * Imperative three.js scene for the Hamperly Museum: a boutique gallery hall where each
 * pre-made hamper stands on a lit plinth. Camera flies between exhibits, drag to look around.
 */
export class MuseumScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  private clock = new THREE.Clock();
  private kit = new MeshKit();
  private raycaster = new THREE.Raycaster();
  private exhibits: Exhibit[] = [];
  private hits: THREE.Mesh[] = [];
  private textures: THREE.Texture[] = [];
  private redraws: (() => void)[] = [];
  private focusSpot: THREE.SpotLight;
  private accentSpots: THREE.SpotLight[] = [];
  private envTarget: THREE.WebGLRenderTarget | null = null;
  private focus: number | null = null;
  private pose = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private orbit = { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, dragging: false };
  private flight: Flight | null = null;
  private guided = false;
  private t = 0;
  private lastMove = 0;      // time of arrival / last guided step
  private lastInteract = -100;
  private aspect = 1.6;
  private raf = 0;
  private visible = true;
  private disposed = false;
  private interacted = false;
  private readonly reducedMotion: boolean;
  private readonly mobile: boolean;
  private readonly cleanups: (() => void)[] = [];

  constructor(private canvas: HTMLCanvasElement, data: MuseumExhibit[], private callbacks: MuseumCallbacks = {}) {
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.mobile = window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color(FOG_COLOR);
    this.scene.fog = new THREE.Fog(FOG_COLOR, 16, 40);

    // Soft image-based light so brass, glass and the polished floor have something to reflect
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.envTarget = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.45;
    room.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => mt.dispose()); }
    });
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xfff4ea, 0xd9b0b8, 0.9);
    const fill = new THREE.DirectionalLight(0xfff0e0, 0.55);
    fill.position.set(2, 9, 6);
    this.scene.add(hemi, fill);

    // The one shadow caster: a warm spotlight that glides to whichever exhibit has focus
    this.focusSpot = new THREE.SpotLight(0xffe2bd, 70, 0, 0.42, 0.65, 2);
    this.focusSpot.castShadow = true;
    const sm = this.mobile ? 512 : 1024;
    this.focusSpot.shadow.mapSize.set(sm, sm);
    this.focusSpot.shadow.camera.near = 1;
    this.focusSpot.shadow.camera.far = 14;
    this.focusSpot.shadow.bias = -0.0008;
    this.scene.add(this.focusSpot, this.focusSpot.target);
    for (let i = 0; i < 2; i++) {
      const s = new THREE.SpotLight(0xffe8cc, 38, 0, 0.4, 0.7, 2);
      this.accentSpots.push(s);
      this.scene.add(s, s.target);
    }

    this.buildHall(data.length);
    data.forEach((d, i) => this.addExhibit(d, i));
    this.buildDecor();

    this.observeSize();
    this.setFocus(null, true);
    this.placeLights(1);
    this.bindPointer();
    document.fonts?.ready.then(() => { if (!this.disposed) this.redraws.forEach(fn => fn()); });
    this.loop();
  }

  /* ------------------------------------------------------------------ public API */

  get count() { return this.exhibits.length; }

  /** Fly to exhibit `index`, or to the overview when null. Does not fire onFocusChange. */
  setFocus(index: number | null, instant = false) {
    const n = this.exhibits.length;
    const next = index === null || n === 0 ? null : ((index % n) + n) % n;
    this.focus = next;
    this.computePose();
    this.lastMove = this.t;
    if (next !== null) this.ensureBuilt(this.exhibits[next]);
    if (instant || this.reducedMotion) {
      this.flight = null;
      this.orbit.yaw = this.orbit.pitch = this.orbit.vYaw = this.orbit.vPitch = 0;
      this.applyCamera();
      this.placeLights(1);
      return;
    }
    const p0 = this.camera.position.clone();
    const q0 = this.camera.quaternion.clone();
    const p1 = this.pose.pos.clone();
    const m = new THREE.Matrix4().lookAt(p1, this.pose.target, Y_AXIS);
    const q1 = new THREE.Quaternion().setFromRotationMatrix(m);
    // Walk through the aisle: pull the curve's middle towards the centre line and lift it slightly
    const c = p0.clone().add(p1).multiplyScalar(0.5);
    c.x *= 0.2;
    c.y = Math.max(p0.y, p1.y) + 0.5;
    const dist = p0.distanceTo(p1);
    this.flight = { t: 0, dur: FLY_TIME + Math.min(0.6, dist / 50), p0, c, p1, q0, q1 };
    this.orbit.yaw = this.orbit.pitch = this.orbit.vYaw = this.orbit.vPitch = 0;
  }

  next() { this.step(1); }
  prev() { this.step(-1); }
  overview() { this.setFocus(null); this.callbacks.onFocusChange?.(null); }

  setGuided(on: boolean) {
    this.guided = on;
    this.lastMove = this.t;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach(fn => fn());
    this.kit.disposeObject(this.scene);
    this.textures.forEach(t => t.dispose());
    this.envTarget?.dispose();
    this.scene.environment = null;
    this.renderer.dispose();
  }

  private step(dir: 1 | -1) {
    const n = this.exhibits.length;
    if (!n) return;
    const next = this.focus === null ? (dir > 0 ? 0 : n - 1) : (this.focus + dir + n) % n;
    this.setFocus(next);
    this.callbacks.onFocusChange?.(next);
  }

  /* ------------------------------------------------------------------ textures */

  private track<T extends THREE.Texture>(t: T): T {
    this.textures.push(t);
    return t;
  }

  private terrazzo() {
    const t = this.kit.canvasTexture((g, w, h) => {
      g.fillStyle = '#f4e8df'; g.fillRect(0, 0, w, h);
      const chips = ['#e9bfca', '#d9a5b4', '#c99a3e', '#ffffff', '#b98a8f', '#5e2652', '#efd6c4'];
      for (let i = 0; i < 2600; i++) {
        g.fillStyle = chips[i % chips.length];
        g.globalAlpha = 0.35 + Math.random() * 0.5;
        const x = Math.random() * w, y = Math.random() * h, r = 1 + Math.random() * (i % 9 === 0 ? 6 : 3);
        g.beginPath();
        g.ellipse(x, y, r, r * (0.5 + Math.random() * 0.5), Math.random() * 3, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      // Slab seams
      g.strokeStyle = 'rgba(160,120,110,0.35)'; g.lineWidth = 3;
      g.strokeRect(0, 0, w, h);
    }, 1024, 1024, [1, 1]);
    t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return this.track(t);
  }

  private plaster() {
    return this.track(this.kit.canvasTexture((g, w, h) => {
      g.fillStyle = '#f8eee8'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = i % 2 ? '#ead8cf' : '#fffaf6';
        g.globalAlpha = Math.random() * 0.25;
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      g.globalAlpha = 1;
    }, 256, 256, [1, 1]));
  }

  private glowTexture(radial: boolean) {
    return this.track(this.kit.canvasTexture((g, w, h) => {
      const grad = radial
        ? g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
        : g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, radial ? 'rgba(255,226,190,0.55)' : '#5a4a3a');
      grad.addColorStop(radial ? 0.55 : 0.6, radial ? 'rgba(255,226,190,0.18)' : '#1c150f');
      grad.addColorStop(1, radial ? 'rgba(255,226,190,0)' : '#000000');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    }, 256, 256));
  }

  private signTexture(eyebrow: string, main: string, script: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 512;
    const texture = this.track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const draw = () => {
      const g = canvas.getContext('2d')!, W = canvas.width, H = canvas.height;
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#3a1230';
      g.beginPath();
      if (g.roundRect) g.roundRect(8, 8, W - 16, H - 16, 60); else g.rect(8, 8, W - 16, H - 16);
      g.fill();
      g.strokeStyle = '#c99a3e'; g.lineWidth = 10; g.stroke();
      g.lineWidth = 3;
      g.beginPath();
      if (g.roundRect) g.roundRect(34, 34, W - 68, H - 68, 42); else g.rect(34, 34, W - 68, H - 68);
      g.stroke();
      const sans = fontVar('--font-jakarta', 'sans-serif');
      const serif = fontVar('--font-fraunces', 'Georgia, serif');
      const hand = fontVar('--font-dancing', 'cursive');
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = '#e8c97a';
      g.font = `700 54px ${sans}`;
      g.letterSpacing = '18px';
      g.fillText(eyebrow.toUpperCase(), W / 2, 140);
      g.letterSpacing = '0px';
      g.font = `600 210px ${serif}`;
      const mw = g.measureText(main).width;
      g.font = `700 190px ${hand}`;
      const sw = g.measureText(script).width;
      const gap = 40, total = mw + gap + sw;
      const x0 = W / 2 - Math.min(total, W - 160) / 2;
      const squeeze = Math.min(1, (W - 160) / total);
      g.save();
      g.translate(x0, 0);
      g.scale(squeeze, 1);
      g.textAlign = 'left';
      g.fillStyle = '#fbf1f3';
      g.font = `600 210px ${serif}`;
      g.fillText(main, 0, 380);
      g.fillStyle = '#efa3bd';
      g.font = `700 190px ${hand}`;
      g.fillText(script, mw + gap, 390);
      g.restore();
      texture.needsUpdate = true;
    };
    draw();
    this.redraws.push(draw);
    return texture;
  }

  private drawPlaque(ex: Exhibit) {
    const { canvas, texture } = ex.plaque;
    const g = canvas.getContext('2d')!, W = canvas.width, H = canvas.height;
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#9c7432'); grad.addColorStop(0.45, '#ecd08a'); grad.addColorStop(1, '#b38a3f');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(58,18,48,0.55)'; g.lineWidth = 6; g.strokeRect(18, 18, W - 36, H - 36);
    const sans = fontVar('--font-jakarta', 'sans-serif');
    const serif = fontVar('--font-fraunces', 'Georgia, serif');
    const hand = fontVar('--font-dancing', 'cursive');
    g.textAlign = 'center';
    g.fillStyle = '#3a1230';
    g.font = `800 30px ${sans}`;
    g.letterSpacing = '8px';
    g.fillText(`EXHIBIT NO. ${String(ex.index + 1).padStart(2, '0')}`, W / 2, 70);
    g.letterSpacing = '0px';
    let size = 66;
    g.font = `600 ${size}px ${serif}`;
    while (g.measureText(ex.data.name).width > W - 80 && size > 38) { size -= 2; g.font = `600 ${size}px ${serif}`; }
    g.fillText(ex.data.name, W / 2, 150, W - 70);
    g.fillStyle = '#5e2652';
    g.font = `700 42px ${hand}`;
    g.fillText(ex.data.occasionName ?? 'A Hamperly original', W / 2, 212, W - 90);
    texture.needsUpdate = true;
  }

  /* ------------------------------------------------------------------ hall */

  private hallEnd(n: number) {
    return -(Math.max(1, n) - 1) * SPACING - 7;
  }

  private buildHall(n: number) {
    const kit = this.kit;
    const zEnd = this.hallEnd(n);
    const len = ENTRANCE_Z - zEnd;
    const zMid = (ENTRANCE_Z + zEnd) / 2;

    // Polished terrazzo floor, extended out into the lobby in front of the entrance
    const lobby = 16;
    const floorLen = len + lobby;
    const ftex = this.terrazzo();
    ftex.repeat.set((HALL_HALF * 2 + 20) / 5, floorLen / 5);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_HALF * 2 + 20, floorLen), new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.22, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, zMid + lobby / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Side walls
    const wtex = this.plaster();
    wtex.repeat.set(len / 6, 1.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: wtex, roughness: 0.95 });
    const wallGeo = new THREE.PlaneGeometry(len, WALL_H);
    const dadoGeo = new THREE.BoxGeometry(len, 1.1, 0.08);
    const dadoMat = kit.mat(0xe4b3c0, 0.85);
    const lineGeo = new THREE.BoxGeometry(len, 0.06, 0.12);
    const corniceGeo = new THREE.BoxGeometry(len, 0.22, 0.3);
    const brass = kit.mat(0xc99a3e, 0.32, 0.85);
    for (const s of [-1, 1] as const) {
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(s * HALL_HALF, WALL_H / 2, zMid);
      wall.rotation.y = -s * Math.PI / 2;
      wall.receiveShadow = true;
      const dado = kit.mesh(dadoGeo, dadoMat, s * (HALL_HALF - 0.04), 0.55, zMid, false);
      dado.rotation.y = Math.PI / 2;
      const rail = kit.mesh(lineGeo, brass, s * (HALL_HALF - 0.06), 1.12, zMid, false);
      rail.rotation.y = Math.PI / 2;
      const cornice = kit.mesh(corniceGeo, kit.mat(0xfbf3ec, 0.8), s * (HALL_HALF - 0.15), WALL_H - 0.3, zMid, false);
      cornice.rotation.y = Math.PI / 2;
      const gilt = kit.mesh(lineGeo, brass, s * (HALL_HALF - 0.31), WALL_H - 0.45, zMid, false);
      gilt.rotation.y = Math.PI / 2;
      this.scene.add(wall, dado, rail, cornice, gilt);
    }

    // Ceiling with a long glowing skylight
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(HALL_HALF * 2, len), kit.mat(0xf7ebe3, 1));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, WALL_H, zMid);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.4, len - 4), new THREE.MeshBasicMaterial({ color: 0xfff6ea }));
    sky.rotation.x = Math.PI / 2;
    sky.position.set(0, WALL_H - 0.02, zMid);
    this.scene.add(ceiling, sky);

    // Far wall with the collection sign
    const endWall = new THREE.Mesh(new THREE.PlaneGeometry(HALL_HALF * 2, WALL_H), wallMat);
    endWall.position.set(0, WALL_H / 2, zEnd);
    const endSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshStandardMaterial({ map: this.signTexture('Thank you for visiting', 'Hamperly', 'with love'), roughness: 0.55 }));
    endSign.position.set(0, 4.4, zEnd + 0.05);
    this.scene.add(endWall, endSign);

    // Entrance wall with an arched doorway and the museum sign above it
    const facade = new THREE.Shape();
    facade.moveTo(-18, -0.2); facade.lineTo(18, -0.2); facade.lineTo(18, WALL_H + 1.5); facade.lineTo(-18, WALL_H + 1.5); facade.lineTo(-18, -0.2);
    const door = new THREE.Path();
    door.moveTo(-3.5, 0); door.lineTo(-3.5, 3.4);
    door.absellipse(0, 3.4, 3.5, 1.4, Math.PI, 0, true, 0);
    door.lineTo(3.5, 0); door.lineTo(-3.5, 0);
    facade.holes.push(door);
    const facadeMesh = new THREE.Mesh(new THREE.ShapeGeometry(facade, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, map: wtex, roughness: 0.92, side: THREE.DoubleSide }));
    facadeMesh.position.z = ENTRANCE_Z;
    facadeMesh.receiveShadow = true;
    const doorPts = new THREE.Path();
    doorPts.moveTo(-3.5, 0); doorPts.lineTo(-3.5, 3.4);
    doorPts.absellipse(0, 3.4, 3.5, 1.4, Math.PI, 0, true, 0);
    doorPts.lineTo(3.5, 0);
    const trimCurve = new THREE.CatmullRomCurve3(doorPts.getSpacedPoints(80).map(p => new THREE.Vector3(p.x, p.y, ENTRANCE_Z + 0.06)));
    const trim = kit.mesh(new THREE.TubeGeometry(trimCurve, 160, 0.09, 8, false), brass, 0, 0, 0, false);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshStandardMaterial({ map: this.signTexture('Welcome to the', 'Hamperly', 'Museum'), roughness: 0.5 }));
    sign.position.set(0, 5.85, ENTRANCE_Z + 0.06);
    this.scene.add(facadeMesh, trim, sign);

    // Columns and potted topiaries flanking the doorway
    const colGeo = new THREE.CylinderGeometry(0.3, 0.34, 5.2, 24);
    const capGeo = new THREE.BoxGeometry(0.9, 0.22, 0.9);
    const potGeo = new THREE.CylinderGeometry(0.42, 0.3, 0.7, 20);
    const leafGeo = new THREE.SphereGeometry(0.62, 20, 14);
    const cream = kit.mat(0xfbf3ec, 0.6);
    const leaf = kit.mat(0x5f8f4e, 0.8);
    const pot = kit.mat(0xb83d72, 0.45);
    for (const s of [-1, 1]) {
      this.scene.add(
        kit.mesh(colGeo, cream, s * 4.4, 2.6, ENTRANCE_Z + 0.4),
        kit.mesh(capGeo, brass, s * 4.4, 5.3, ENTRANCE_Z + 0.4),
        kit.mesh(capGeo, cream, s * 4.4, 0.11, ENTRANCE_Z + 0.4),
        kit.mesh(potGeo, pot, s * 5.6, 0.35, ENTRANCE_Z + 1.2),
        kit.mesh(leafGeo, leaf, s * 5.6, 1.25, ENTRANCE_Z + 1.2),
      );
      const crown = kit.mesh(leafGeo, leaf, s * 5.6, 2.0, ENTRANCE_Z + 1.2);
      crown.scale.setScalar(0.7);
      this.scene.add(crown);
    }
    // Lobby rug leading inside
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 12), kit.mat(0x8e2a57, 0.95));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.006, ENTRANCE_Z + 1);
    rug.receiveShadow = true;
    this.scene.add(rug);
  }

  /** Repeated hall decor drawn as InstancedMeshes: plinths, stanchions, ropes, niches, columns, light pools */
  private buildDecor() {
    const kit = this.kit;
    const n = this.exhibits.length;
    const dummy = new THREE.Object3D();

    const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, mats: THREE.Matrix4[], cast = true) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, mats.length));
      mats.forEach((mm, i) => im.setMatrixAt(i, mm));
      im.count = mats.length;
      im.castShadow = cast;
      im.receiveShadow = true;
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      this.scene.add(im);
      return im;
    };
    /** World matrix of a point given in an exhibit's local space */
    const local = (ex: Exhibit, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0) => {
      dummy.position.set(x, y, z); dummy.rotation.set(0, ry, 0); dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      ex.root.updateMatrix();
      return new THREE.Matrix4().multiplyMatrices(ex.root.matrix, dummy.matrix);
    };
    const world = (x: number, y: number, z: number, rx = 0, ry = 0) => {
      dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, 0); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      return dummy.matrix.clone();
    };

    const brass = kit.mat(0xc99a3e, 0.3, 0.85);
    const ex = this.exhibits;

    // Plinths: plum kick base, cream body, brass top trim
    instanced(new THREE.BoxGeometry(2.56, 0.12, 2.16), kit.mat(0x3a1230, 0.7), ex.map(e => local(e, 0, 0.06, 0)));
    instanced(new THREE.BoxGeometry(2.4, 0.86, 2.0), kit.mat(0xfbf4ef, 0.55), ex.map(e => local(e, 0, 0.55, 0)));
    instanced(new THREE.BoxGeometry(2.5, 0.05, 2.1), brass, ex.map(e => local(e, 0, 1.005, 0)));
    // Brass frame behind each plaque
    instanced(new THREE.BoxGeometry(1.62, 0.6, 0.02), brass, ex.map(e => local(e, 0, 0.66, 1.005)), false);

    // Velvet rope stanchions in front of each plinth
    const posts: THREE.Matrix4[] = [], bases: THREE.Matrix4[] = [], tops: THREE.Matrix4[] = [];
    ex.forEach(e => {
      for (const x of [-1.55, 1.55]) {
        posts.push(local(e, x, 0.48, 1.85));
        bases.push(local(e, x, 0.02, 1.85));
        tops.push(local(e, x, 0.98, 1.85));
      }
    });
    instanced(new THREE.CylinderGeometry(0.035, 0.04, 0.92, 12), brass, posts);
    instanced(new THREE.CylinderGeometry(0.17, 0.19, 0.04, 20), brass, bases);
    instanced(new THREE.SphereGeometry(0.07, 14, 10), brass, tops);
    const rope = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.55, 0.92, 1.85), new THREE.Vector3(-0.8, 0.66, 1.88),
      new THREE.Vector3(0, 0.6, 1.9), new THREE.Vector3(0.8, 0.66, 1.88), new THREE.Vector3(1.55, 0.92, 1.85),
    ]);
    instanced(new THREE.TubeGeometry(rope, 48, 0.035, 8, false), kit.mat(0x8e2a57, 0.9), ex.map(e => local(e, 0, 0, 0)));

    // Arched niches behind each exhibit, with brass trim
    const arch = new THREE.Shape();
    arch.moveTo(-1.8, 0); arch.lineTo(1.8, 0); arch.lineTo(1.8, 3.6);
    arch.absarc(0, 3.6, 1.8, 0, Math.PI, false);
    arch.lineTo(-1.8, 0);
    const nicheMats = ex.map(e => world(e.side * (HALL_HALF - 0.1), 0, e.pos.z, 0, -e.side * Math.PI / 2));
    instanced(new THREE.ShapeGeometry(arch, 24), kit.mat(0xf2c6d2, 0.9), nicheMats, false);
    const archPath = new THREE.Path();
    archPath.moveTo(-1.8, 1.1); archPath.lineTo(-1.8, 3.6);
    archPath.absarc(0, 3.6, 1.8, Math.PI, 0, true);
    archPath.lineTo(1.8, 1.1);
    const archCurve = new THREE.CatmullRomCurve3(archPath.getSpacedPoints(60).map(p => new THREE.Vector3(p.x, p.y, 0.04)));
    instanced(new THREE.TubeGeometry(archCurve, 120, 0.06, 8, false), brass, nicheMats, false);

    // Pilasters between niches (opposite each exhibit, plus both ends)
    const cols: THREE.Matrix4[] = [], caps: THREE.Matrix4[] = [];
    const addCol = (side: number, z: number) => {
      cols.push(world(side * (HALL_HALF - 0.28), (WALL_H - 0.7) / 2 + 0.1, z));
      caps.push(world(side * (HALL_HALF - 0.28), WALL_H - 0.62, z));
    };
    ex.forEach(e => addCol(-e.side, e.pos.z));
    for (const s of [-1, 1]) { addCol(s, SPACING); addCol(s, -n * SPACING); }
    instanced(new THREE.CylinderGeometry(0.26, 0.3, WALL_H - 0.9, 20), kit.mat(0xfbf3ec, 0.55), cols, false);
    instanced(new THREE.BoxGeometry(0.8, 0.2, 0.8), brass, caps, false);

    // Ceiling spot fixtures, soft light cones and warm pools on the floor
    const fixtures = ex.map(e => world(e.pos.x - e.side * 0.6, WALL_H - 0.2, e.pos.z));
    instanced(new THREE.CylinderGeometry(0.14, 0.2, 0.36, 16), brass, fixtures, false);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xffe2b8, map: this.glowTexture(false), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const cones = ex.map(e => {
      dummy.position.set(e.pos.x - e.side * 0.3, (WALL_H - 0.3 + PLINTH_TOP) / 2, e.pos.z);
      dummy.rotation.set(0, 0, e.side * 0.1); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      return dummy.matrix.clone();
    });
    instanced(new THREE.CylinderGeometry(0.16, 1.45, WALL_H - 0.3 - PLINTH_TOP, 32, 1, true), coneMat, cones, false);
    const poolMat = new THREE.MeshBasicMaterial({ map: this.glowTexture(true), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    instanced(new THREE.PlaneGeometry(4.6, 4.6), poolMat, ex.map(e => world(e.pos.x, 0.012, e.pos.z, -Math.PI / 2)), false);

    // Velvet benches down the centre aisle
    const benchZ: number[] = [];
    for (let k = 1; k < n - 1; k += 3) benchZ.push(-k * SPACING - SPACING / 2);
    if (benchZ.length) {
      instanced(new THREE.BoxGeometry(0.8, 0.22, 2.4), kit.mat(0x5e2652, 0.95), benchZ.map(z => world(0, 0.5, z)));
      instanced(new THREE.BoxGeometry(0.6, 0.4, 2.0), kit.mat(0xfbf3ec, 0.6), benchZ.map(z => world(0, 0.2, z)));
    }
  }

  private addExhibit(data: MuseumExhibit, index: number) {
    const side: -1 | 1 = index % 2 === 0 ? -1 : 1;
    const pos = new THREE.Vector3(side * SIDE_X, 0, -index * SPACING);
    const root = new THREE.Group();
    root.position.copy(pos);
    // Local +z faces the aisle
    root.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const turn = new THREE.Group();
    turn.position.y = PLINTH_TOP;
    root.add(turn);

    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 256;
    const texture = this.track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    const plaqueMesh = new THREE.Mesh(this.plaqueGeo, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35, metalness: 0.55 }));
    plaqueMesh.position.set(0, 0.66, 1.02);
    root.add(plaqueMesh);

    const hit = new THREE.Mesh(this.hitGeo, this.hitMat);
    hit.position.set(0, 1.6, 0.4);
    hit.userData.index = index;
    root.add(hit);

    this.scene.add(root);
    const ex: Exhibit = { data, index, side, pos, root, turn, hit, built: false, plaque: { canvas, texture } };
    this.drawPlaque(ex);
    this.redraws.push(() => this.drawPlaque(ex));
    this.exhibits.push(ex);
    this.hits.push(hit);
  }

  private plaqueGeo = new THREE.PlaneGeometry(1.5, 0.5);
  private hitGeo = new THREE.BoxGeometry(2.7, 3.2, 2.9);
  private hitMat = new THREE.MeshBasicMaterial({ visible: false });

  /** Build the actual hamper (container + gifts) for an exhibit; done lazily as the camera nears it */
  private ensureBuilt(ex: Exhibit) {
    if (ex.built) return;
    ex.built = true;
    const d = ex.data;
    const { items } = studioItemsFromSelection(
      d.items.map(it => ({ product: { id: it.productId, name: it.name, categories: { name: it.category } }, quantity: it.quantity })),
      MAX_ITEMS,
    );
    let kind = containerFor(d);
    if (!items.length && kind === 'wicker') kind = 'blush';
    const ribbon = ribbonForOption(d.name, kind);
    const c = kind === 'wicker' ? this.kit.buildBasket(ribbon) : this.kit.buildBox(kind, ribbon);
    const hamper = new THREE.Group();
    hamper.add(c.group);

    if (!items.length) {
      // Nothing listed inside: present it closed, lid on and bow tied
      if (c.lid) { c.lid.visible = true; c.lid.position.y = c.height + 0.1; }
      c.bow.scale.setScalar(c.bowScale);
    } else {
      if (kind === 'wicker') c.bow.scale.setScalar(c.bowScale);
      // Same grid the studio uses: fit the footprint, back rows first, shrink when crowded
      const n = items.length;
      const [fw, fd] = c.footprint;
      const cols = n <= 3 ? n : n <= 6 ? 3 : 4;
      const rows = Math.ceil(n / cols);
      const sx = Math.min(1.05, fw / cols);
      const sz = Math.min(0.98, fd / rows);
      const scale = Math.min(1, sx / 1.0, sz / 0.9);
      items.forEach((item, i) => {
        const { g } = this.kit.makeItem(item);
        const r = Math.floor(i / cols), col = i % cols;
        const inRow = r === rows - 1 ? n - r * cols : cols;
        g.position.set((col - (inRow - 1) / 2) * sx, c.floor, (r - (rows - 1) / 2) * sz);
        g.rotation.y = ((hash(item.key) % 100) / 100 - 0.5) * 0.6;
        g.scale.setScalar(scale);
        hamper.add(g);
      });
    }
    hamper.scale.setScalar(HAMPER_SCALE);
    ex.turn.add(hamper);
  }

  /* ------------------------------------------------------------------ camera */

  private computePose() {
    const narrow = this.aspect < 0.85 ? 1.45 : this.aspect < 1.3 ? 1.25 : 1;
    if (this.focus === null) {
      this.pose.pos.set(0, 3.5, ENTRANCE_Z + 9 + (narrow - 1) * 10);
      this.pose.target.set(0, 2.0, ENTRANCE_Z - 26);
      return;
    }
    const e = this.exhibits[this.focus];
    this.pose.target.set(e.pos.x, 1.55, e.pos.z);
    this.pose.pos.set(e.pos.x - e.side * 5.0 * narrow, 1.55 + 1.05 * narrow, e.pos.z + 1.7 * narrow);
  }

  private sph = new THREE.Spherical();
  private tmp = new THREE.Vector3();

  private applyCamera() {
    const { pos, target } = this.pose;
    const o = this.orbit;
    if (this.focus === null) {
      // Overview: stand still and look around
      this.tmp.subVectors(target, pos);
      this.sph.setFromVector3(this.tmp);
      this.sph.theta += o.yaw;
      this.sph.phi = Math.min(Math.PI - 0.2, Math.max(0.2, this.sph.phi - o.pitch));
      this.tmp.setFromSpherical(this.sph);
      this.camera.position.copy(pos);
      this.camera.lookAt(this.tmp.add(pos));
    } else {
      // Exhibit: orbit a little around it
      this.tmp.subVectors(pos, target);
      this.sph.setFromVector3(this.tmp);
      this.sph.theta += o.yaw;
      this.sph.phi = Math.min(1.5, Math.max(0.35, this.sph.phi - o.pitch));
      this.tmp.setFromSpherical(this.sph);
      this.camera.position.copy(target).add(this.tmp);
      this.camera.lookAt(target);
    }
  }

  /** Glide the spotlights towards the focused exhibit and its neighbours (k = 1 snaps) */
  private placeLights(k: number) {
    const n = this.exhibits.length;
    if (!n) return;
    const f = this.focus ?? 0;
    const aim = (spot: THREE.SpotLight, e: Exhibit) => {
      this.tmp.set(e.pos.x - e.side * 1.4, WALL_H - 0.4, e.pos.z + 0.4);
      spot.position.lerp(this.tmp, k);
      this.tmp.set(e.pos.x, PLINTH_TOP + 0.5, e.pos.z);
      spot.target.position.lerp(this.tmp, k);
    };
    aim(this.focusSpot, this.exhibits[f]);
    // Accent spots on the neighbours so the hall around the focus stays lit
    const others = [f - 1, f + 1, f + 2].filter(i => i >= 0 && i < n && i !== f).slice(0, 2);
    this.accentSpots.forEach((s, i) => {
      const idx = others[i];
      s.visible = idx !== undefined;
      if (idx !== undefined) aim(s, this.exhibits[idx]);
    });
  }

  /* ------------------------------------------------------------------ input, size, loop */

  private pick(e: PointerEvent): number | null {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.hits, false)[0];
    return hit ? (hit.object.userData.index as number) : null;
  }

  private bindPointer() {
    const el = this.canvas, o = this.orbit;
    let lx = 0, ly = 0, lt = 0, sx = 0, sy = 0, st = 0, moved = 0;
    const down = (e: PointerEvent) => {
      o.dragging = true; lx = sx = e.clientX; ly = sy = e.clientY; lt = st = performance.now(); moved = 0;
      o.vYaw = o.vPitch = 0;
      this.lastInteract = this.t;
      try { el.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
      if (!this.interacted) { this.interacted = true; this.callbacks.onInteract?.(); }
    };
    const move = (e: PointerEvent) => {
      if (!o.dragging) {
        if (e.pointerType === 'mouse' && !this.flight) el.style.cursor = this.pick(e) !== null ? 'pointer' : 'grab';
        return;
      }
      const now = performance.now(), dx = e.clientX - lx, dy = e.clientY - ly;
      const dts = Math.max(8, now - lt) / 1000;
      moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
      if (this.flight) { lx = e.clientX; ly = e.clientY; lt = now; return; }
      const k = this.focus === null ? 0.0022 : 0.005;
      o.yaw -= dx * k;
      o.pitch += dy * k * 0.7;
      o.vYaw = (-dx * k) / dts;
      o.vPitch = (dy * k * 0.7) / dts;
      this.clampOrbit();
      lx = e.clientX; ly = e.clientY; lt = now;
      this.lastInteract = this.t;
      el.style.cursor = 'grabbing';
    };
    const up = (e: PointerEvent) => {
      if (!o.dragging) return;
      o.dragging = false;
      el.style.cursor = 'grab';
      o.vYaw = Math.max(-2, Math.min(2, o.vYaw));
      o.vPitch = Math.max(-1, Math.min(1, o.vPitch));
      this.lastInteract = this.t;
      if (moved < 6 && performance.now() - st < 600 && e.type === 'pointerup') {
        const idx = this.pick(e);
        if (idx !== null && idx !== this.focus) {
          this.setFocus(idx);
          this.callbacks.onFocusChange?.(idx);
        }
      }
    };
    const handlers: [string, EventListener][] = [
      ['pointerdown', down as EventListener], ['pointermove', move as EventListener],
      ['pointerup', up as EventListener], ['pointercancel', up as EventListener],
    ];
    handlers.forEach(([k, fn]) => el.addEventListener(k, fn));
    el.style.cursor = 'grab';
    this.cleanups.push(() => handlers.forEach(([k, fn]) => el.removeEventListener(k, fn)));
  }

  private clampOrbit() {
    const o = this.orbit;
    const [ymax, pmin, pmax] = this.focus === null ? [0.38, -0.12, 0.18] : [0.6, -0.35, 0.3];
    if (o.yaw > ymax || o.yaw < -ymax) { o.yaw = Math.max(-ymax, Math.min(ymax, o.yaw)); o.vYaw = 0; }
    if (o.pitch > pmax || o.pitch < pmin) { o.pitch = Math.max(pmin, Math.min(pmax, o.pitch)); o.vPitch = 0; }
  }

  private observeSize() {
    const parent = this.canvas.parentElement!;
    const resize = () => {
      const w = parent.clientWidth, h = parent.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.aspect = w / h;
      this.camera.fov = this.aspect < 1 ? 50 : 42;
      this.camera.updateProjectionMatrix();
      this.computePose();
      if (!this.flight) this.applyCamera();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    const io = new IntersectionObserver(entries => { this.visible = entries[0]?.isIntersecting ?? true; });
    io.observe(this.canvas);
    this.cleanups.push(() => { ro.disconnect(); io.disconnect(); });
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible || document.hidden) { this.clock.getDelta(); return; }
    this.tick();
  };

  private tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.t += dt;
    const o = this.orbit;

    if (this.flight) {
      const f = this.flight;
      f.t += dt;
      const p = Math.min(1, f.t / f.dur), e = easeInOutCubic(p), u = 1 - e;
      // Quadratic Bézier through the aisle
      this.camera.position.set(
        u * u * f.p0.x + 2 * u * e * f.c.x + e * e * f.p1.x,
        u * u * f.p0.y + 2 * u * e * f.c.y + e * e * f.p1.y,
        u * u * f.p0.z + 2 * u * e * f.c.z + e * e * f.p1.z,
      );
      this.camera.quaternion.slerpQuaternions(f.q0, f.q1, e);
      if (p >= 1) { this.flight = null; this.lastMove = this.t; this.applyCamera(); }
    } else {
      if (!o.dragging) {
        // Inertia, then drift gently back to the framed view
        o.yaw += o.vYaw * dt; o.pitch += o.vPitch * dt;
        const damp = Math.exp(-3.5 * dt);
        o.vYaw *= damp; o.vPitch *= damp;
        this.clampOrbit();
        if (this.t - this.lastInteract > 4) {
          const back = 1 - Math.exp(-0.8 * dt);
          o.yaw -= o.yaw * back; o.pitch -= o.pitch * back;
        }
      }
      this.applyCamera();
    }

    // Guided tour: step on once the visitor has had time to look (pauses while they interact)
    if (this.guided && !this.flight && !o.dragging && this.exhibits.length > 0
      && this.t - Math.max(this.lastMove, this.lastInteract) > TOUR_DWELL) {
      this.step(1);
    }

    // Lazy-build the nearest unbuilt hamper (one per frame), hide far ones
    const cam = this.camera.position;
    let nearest: Exhibit | null = null, best = BUILD_RADIUS;
    for (const ex of this.exhibits) {
      const d = cam.distanceTo(ex.pos);
      ex.turn.visible = d < SHOW_RADIUS;
      if (!ex.built && d < best) { best = d; nearest = ex; }
    }
    if (nearest) this.ensureBuilt(nearest);

    // The focused exhibit turns slowly on its plinth; the rest settle back to face the aisle
    this.exhibits.forEach((ex, i) => {
      const r = ex.turn.rotation;
      if (i === this.focus && !this.reducedMotion) r.y += dt * 0.35;
      else if (r.y !== 0) {
        const home = Math.round(r.y / (Math.PI * 2)) * Math.PI * 2;
        r.y += (home - r.y) * (1 - Math.exp(-2.5 * dt));
        if (Math.abs(home - r.y) < 0.001) r.y = 0;
      }
    });

    this.placeLights(1 - Math.exp(-4 * dt));
    this.renderer.render(this.scene, this.camera);
  }
}
