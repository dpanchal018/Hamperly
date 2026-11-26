import * as THREE from 'three';
import type { ContainerKind, StudioItem } from './productShapes';
import { MeshKit, type ContainerState } from './meshKit';

export type Mood = 'day' | 'golden' | 'diwali';

interface ItemState {
  key: string;
  g: THREE.Group;
  x: number; z: number; tx: number; tz: number;
  y: number; vy: number; floor: number;
  state: 'falling' | 'rest' | 'leaving';
  squash: number; scale: number; baseScale: number;
  landed: boolean;
  placed: boolean;
  flame?: THREE.Mesh;
}


interface Effect {
  parts: THREE.Mesh[];
  life: number; max: number;
  mats: THREE.MeshBasicMaterial[];
  geo: THREE.BufferGeometry;
  gravity: number; drag: number;
}

const MOODS: Record<Mood, { sky: number; ground: number; hemi: number; key: number; keyI: number; keyPos: [number, number, number]; rim: number; rimI: number; exposure: number; diyas: boolean; shadow: number }> = {
  day: { sky: 0xfff6f8, ground: 0xe6b7c7, hemi: 0.9, key: 0xffffff, keyI: 2.2, keyPos: [5, 9, 6], rim: 0xffc4d6, rimI: 1.0, exposure: 1.05, diyas: false, shadow: 0.16 },
  golden: { sky: 0xffe2b8, ground: 0xc98a6a, hemi: 0.75, key: 0xffb066, keyI: 2.8, keyPos: [7, 4, 4], rim: 0xff8a6a, rimI: 1.2, exposure: 1.0, diyas: false, shadow: 0.24 },
  diwali: { sky: 0x4a3070, ground: 0x1a0e2a, hemi: 0.4, key: 0xffb45e, keyI: 0.9, keyPos: [3, 6, 7], rim: 0xb05cff, rimI: 0.9, exposure: 1.15, diyas: true, shadow: 0.32 },
};

/**
 * Imperative three.js scene for the hamper studio: a turntable with a box or basket,
 * gifts that drop in with a bounce, drag-to-spin 360°, wrap animation, lighting moods
 * and a gift tag that shows the recipient's name.
 */
export class HamperScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private hemi: THREE.HemisphereLight;
  private key: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private shadowMat = new THREE.ShadowMaterial({ opacity: 0.16 });
  private turn = new THREE.Group();
  private hamper = new THREE.Group();
  private itemsGroup = new THREE.Group();
  private fx = new THREE.Group();
  private diyas = new THREE.Group();
  private diyaLight = new THREE.PointLight(0xffa040, 0, 0, 2);
  private clock = new THREE.Clock();
  private kit = new MeshKit();
  private container: ContainerState | null = null;
  private items = new Map<string, ItemState>();
  private order: StudioItem[] = [];
  private effects: Effect[] = [];
  private spinBoost = 0;
  private wrap = { on: false, phase: 'idle' as 'idle' | 'lid' | 'bow' | 'done' | 'open', p: 0, bowP: 0 };
  private view = { theta: 0.55, phi: 0.42, radius: 11.5, vel: 0.25, dragging: false, lastInteract: -10, t: 0 };
  private tagName = '';
  private raf = 0;
  private visible = true;
  private disposed = false;
  private readonly reducedMotion: boolean;
  private readonly cleanups: (() => void)[] = [];

  constructor(private canvas: HTMLCanvasElement, private callbacks: { onFirstDrag?: () => void } = {}) {
    this.reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const mobile = window.innerWidth < 768;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.hemi = new THREE.HemisphereLight(0xfff6f8, 0xe6b7c7, 0.9);
    this.key = new THREE.DirectionalLight(0xffffff, 2.2);
    this.key.position.set(5, 9, 6);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    Object.assign(this.key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
    this.key.shadow.bias = -0.0005;
    this.rim = new THREE.DirectionalLight(0xffc4d6, 1.0);
    this.rim.position.set(-6, 5, -6);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-4, 2, 6);
    this.scene.add(this.hemi, this.key, this.rim, fill);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), this.shadowMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor, this.turn, this.fx);

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.4, 0.16, 96), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, map: this.kit.discTexture() }));
    disc.position.y = 0.08;
    disc.receiveShadow = true;
    const ring = this.kit.mesh(new THREE.TorusGeometry(3.36, 0.035, 12, 128), this.kit.mat(0xc99a3e, 0.3, 0.8), 0, 0.16, 0);
    ring.rotation.x = Math.PI / 2;
    this.hamper.position.y = 0.16;
    this.hamper.add(this.itemsGroup);
    this.diyas.visible = false;
    this.turn.add(disc, ring, this.hamper, this.diyas);
    this.buildDiyas();
    this.diyaLight.position.set(0, 1.4, 2.6);
    this.scene.add(this.diyaLight);

    this.bindPointer();
    this.observeSize();
    this.loop();
  }

  /* ------------------------------------------------------------------ public API */

  setContainer(kind: ContainerKind, ribbon: number) {
    if (this.container?.kind === kind && this.container.bow.userData.ribbon === ribbon) return;
    if (this.container) {
      this.hamper.remove(this.container.group);
      this.kit.disposeObject(this.container.group);
    }
    this.container = kind === 'wicker' ? this.kit.buildBasket(ribbon) : this.kit.buildBox(kind, ribbon);
    this.container.bow.userData.ribbon = ribbon;
    this.hamper.add(this.container.group);
    this.itemsGroup.visible = true;
    this.wrap = { on: false, phase: 'idle', p: 0, bowP: 0 };
    // Re-settle gifts onto the new floor
    this.items.forEach(it => {
      if (it.state === 'leaving') return;
      it.floor = this.container!.floor;
      it.y = Math.max(it.y, it.floor + 0.9);
      it.vy = 0;
      it.state = 'falling';
    });
    this.layout();
    this.drawTag();
  }

  setItems(next: StudioItem[]) {
    this.order = next;
    const keep = new Set(next.map(i => i.key));
    this.items.forEach((it, key) => {
      if (!keep.has(key) && it.state !== 'leaving') { it.state = 'leaving'; it.vy = 1.5; }
    });
    const instant = !this.clock.running || this.view.t < 0.3;
    next.forEach(item => {
      const existing = this.items.get(item.key);
      if (!existing || existing.state === 'leaving') {
        if (existing) this.removeItem(item.key);
        this.spawn(item, instant);
      }
    });
    if (next.length > 0 && this.wrap.on) this.setWrapped(false);
    this.layout();
  }

  setTagName(name: string) {
    this.tagName = name;
    this.drawTag();
  }

  setMood(mood: Mood) {
    const p = MOODS[mood];
    this.hemi.color.setHex(p.sky);
    this.hemi.groundColor.setHex(p.ground);
    this.hemi.intensity = p.hemi;
    this.key.color.setHex(p.key);
    this.key.intensity = p.keyI;
    this.key.position.set(...p.keyPos);
    this.rim.color.setHex(p.rim);
    this.rim.intensity = p.rimI;
    this.renderer.toneMappingExposure = p.exposure;
    this.diyas.visible = p.diyas;
    this.diyaLight.intensity = p.diyas ? 16 : 0;
    this.shadowMat.opacity = p.shadow;
  }

  setWrapped(on: boolean) {
    const c = this.container;
    if (!c) return;
    if (on) {
      this.wrap = { on: true, phase: c.lid ? 'lid' : 'bow', p: 0, bowP: 0 };
      if (c.lid) { c.lid.visible = true; c.lid.position.y = c.height + 3.1; }
    } else {
      this.wrap = { on: false, phase: 'open', p: 0, bowP: 0 };
      c.bow.scale.setScalar(0.001);
      this.itemsGroup.visible = true;
    }
  }

  resetView() {
    const v = this.view;
    v.phi = 0.42; v.vel = 0; v.lastInteract = v.t;
    v.theta = Math.round(v.theta / (Math.PI * 2)) * Math.PI * 2 + 0.55;
  }

  topView() {
    const v = this.view;
    v.phi = 1.2; v.vel = 0; v.lastInteract = v.t;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach(fn => fn());
    this.kit.disposeObject(this.scene);
    this.renderer.dispose();
  }

  private drawTag() {
    const c = this.container;
    if (!c) return;
    if (!c.tag) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 320;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const tag = this.kit.mesh(new THREE.PlaneGeometry(0.62, 0.39), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, side: THREE.DoubleSide, transparent: true }), 0, -0.3, 0.02);
      const pivot = new THREE.Group();
      pivot.position.copy(c.tagAnchor);
      pivot.add(this.kit.mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), this.kit.mat(0xc99a3e, 0.4, 0.6), 0, -0.07, 0.01), tag);
      c.group.add(pivot);
      c.tag = { canvas, texture, pivot };
    }
    const g = c.tag.canvas.getContext('2d')!, W = 512, H = 320;
    const name = this.tagName.trim();
    c.tag.pivot.visible = name.length > 0;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#fffdf8'; g.strokeStyle = '#c99a3e'; g.lineWidth = 10;
    g.beginPath();
    if (g.roundRect) g.roundRect(14, 14, W - 28, H - 28, 34); else g.rect(14, 14, W - 28, H - 28);
    g.fill(); g.stroke();
    g.fillStyle = '#c99a3e'; g.beginPath(); g.arc(W / 2, 52, 14, 0, Math.PI * 2); g.fill();
    g.textAlign = 'center';
    const sans = getComputedStyle(document.documentElement).getPropertyValue('--font-jakarta') || 'sans-serif';
    const script = getComputedStyle(document.documentElement).getPropertyValue('--font-dancing') || 'cursive';
    g.fillStyle = '#b83d72'; g.font = `700 34px ${sans}, sans-serif`; g.fillText('MADE FOR', W / 2, 120);
    g.fillStyle = '#3a1230'; g.font = `600 104px ${script}, cursive`;
    g.fillText(name.slice(0, 16), W / 2, 232, W - 60);
    c.tag.texture.needsUpdate = true;
  }

  private buildDiyas() {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + 0.2;
      const d = new THREE.Group();
      d.position.set(Math.cos(a) * 2.85, 0.16, Math.sin(a) * 2.85);
      const bowl = this.kit.mesh(new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), this.kit.mat(0xb5552e, 0.8, 0, { side: THREE.DoubleSide }), 0, 0.16, 0);
      const oil = this.kit.mesh(new THREE.CircleGeometry(0.14, 20), this.kit.mat(0xe0a33a, 0.3), 0, 0.15, 0);
      oil.rotation.x = -Math.PI / 2;
      const flame = this.kit.mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc04a }), 0.06, 0.23, 0, false);
      flame.scale.y = 1.7;
      d.add(bowl, oil, flame);
      d.userData.flame = flame;
      this.diyas.add(d);
    }
  }

  private spawn(item: StudioItem, instant: boolean) {
    const floor = this.container?.floor ?? 0.24;
    const { g, flame } = this.kit.makeItem(item);
    const st: ItemState = {
      key: item.key, g, x: 0, z: 0, tx: 0, tz: 0,
      y: instant ? floor : floor + 4.2, vy: 0, floor,
      state: instant ? 'rest' : 'falling', squash: 0, scale: 1, baseScale: 1, landed: instant, placed: false, flame,
    };
    g.rotation.set(instant ? 0 : (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.6, instant ? 0 : (Math.random() - 0.5) * 0.9);
    this.itemsGroup.add(g);
    this.items.set(item.key, st);
  }

  private removeItem(key: string) {
    const it = this.items.get(key);
    if (!it) return;
    this.itemsGroup.remove(it.g);
    this.kit.disposeObject(it.g);
    this.items.delete(key);
  }

  /** Arrange current gifts in a grid that fits the container footprint, back rows first */
  private layout() {
    const active = this.order.filter(i => this.items.get(i.key)?.state !== 'leaving');
    const n = active.length;
    if (!n) return;
    const [fw, fd] = this.container?.footprint ?? [2.8, 2];
    const cols = n <= 3 ? n : n <= 6 ? 3 : 4;
    const rows = Math.ceil(n / cols);
    const sx = Math.min(1.05, fw / cols);
    const sz = Math.min(0.98, fd / rows);
    const scale = Math.min(1, sx / 1.0, sz / 0.9);
    active.forEach((item, i) => {
      const st = this.items.get(item.key)!;
      const r = Math.floor(i / cols), c = i % cols;
      const inRow = r === rows - 1 ? n - r * cols : cols;
      st.tx = (c - (inRow - 1) / 2) * sx;
      st.tz = (r - (rows - 1) / 2) * sz;
      st.baseScale = scale;
      if (!st.placed) { st.x = st.tx; st.z = st.tz; st.placed = true; }
    });
  }

  /* ------------------------------------------------------------------ effects */

  private sparkle(g: THREE.Object3D) {
    const p = new THREE.Vector3();
    g.getWorldPosition(p);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true });
    const geo = new THREE.OctahedronGeometry(0.05);
    const parts: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Mesh(geo, mat);
      s.position.set(p.x, p.y + 0.2, p.z);
      const a = i / 12 * Math.PI * 2;
      s.userData.v = new THREE.Vector3(Math.cos(a) * 1.6, 1.4 + Math.random(), Math.sin(a) * 1.6);
      this.fx.add(s);
      parts.push(s);
    }
    this.effects.push({ parts, life: 0.8, max: 0.8, mats: [mat], geo, gravity: 6, drag: 0 });
  }

  private confetti() {
    if (this.reducedMotion) return;
    const mats = [0xb83d72, 0xc99a3e, 0xf2a7bd, 0x7fb3f0, 0xffffff].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, side: THREE.DoubleSide }));
    const geo = new THREE.PlaneGeometry(0.1, 0.055);
    const parts: THREE.Mesh[] = [];
    for (let i = 0; i < 150; i++) {
      const s = new THREE.Mesh(geo, mats[i % mats.length]);
      s.position.set((Math.random() - 0.5) * 1.5, 2.3, (Math.random() - 0.5) * 1.5);
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3.5;
      s.userData.v = new THREE.Vector3(Math.cos(a) * sp, 4 + Math.random() * 4, Math.sin(a) * sp);
      s.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      this.fx.add(s);
      parts.push(s);
    }
    this.effects.push({ parts, life: 2.8, max: 2.8, mats, geo, gravity: 7, drag: 1.2 });
  }

  private tickEffects(dt: number) {
    this.effects = this.effects.filter(e => {
      e.life -= dt;
      const a = Math.max(0, e.life / e.max);
      e.mats.forEach(m => { m.opacity = Math.min(1, a * 1.5); });
      e.parts.forEach(s => {
        const v = s.userData.v as THREE.Vector3;
        v.y -= e.gravity * dt;
        if (e.drag) v.multiplyScalar(Math.exp(-e.drag * dt));
        s.position.addScaledVector(v, dt);
        s.rotation.x += dt * 6;
        s.rotation.y += dt * 4;
      });
      if (e.life <= 0) {
        e.parts.forEach(s => this.fx.remove(s));
        e.geo.dispose();
        e.mats.forEach(m => m.dispose());
        return false;
      }
      return true;
    });
  }

  private tickWrap(dt: number) {
    const w = this.wrap, c = this.container;
    if (!c) return;
    if (w.on && w.phase === 'lid' && c.lid) {
      w.p = Math.min(1, w.p + dt * 1.5);
      c.lid.position.y = c.height + 0.1 + (1 - easeOutBounce(w.p)) * 3;
      if (w.p > 0.4) this.itemsGroup.visible = false;
      if (w.p >= 1) { w.phase = 'bow'; w.bowP = 0; }
    } else if (w.on && w.phase === 'bow') {
      w.bowP = Math.min(1, w.bowP + dt * 1.8);
      c.bow.scale.setScalar(Math.max(0.001, easeOutBack(w.bowP) * c.bowScale));
      if (w.bowP >= 1) {
        w.phase = 'done';
        this.confetti();
        if (!this.reducedMotion) this.spinBoost = 6.5;
      }
    } else if (!w.on && w.phase === 'open' && c.lid?.visible) {
      w.p = Math.min(1, w.p + dt * 2);
      c.lid.position.y = c.height + 0.1 + w.p * w.p * 4;
      if (w.p >= 1) c.lid.visible = false;
    }
  }

  /* ------------------------------------------------------------------ input, size, loop */

  private bindPointer() {
    const el = this.canvas, v = this.view;
    let lx = 0, ly = 0, lt = 0, first = true;
    const down = (e: PointerEvent) => {
      v.dragging = true; lx = e.clientX; ly = e.clientY; lt = performance.now(); v.vel = 0;
      try { el.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
      if (first) { first = false; this.callbacks.onFirstDrag?.(); }
    };
    const move = (e: PointerEvent) => {
      if (!v.dragging) return;
      const now = performance.now(), dx = e.clientX - lx, dy = e.clientY - ly;
      const dts = Math.max(8, now - lt) / 1000;
      v.theta += dx * 0.011;
      v.vel = (dx * 0.011) / dts;
      v.phi = Math.min(1.25, Math.max(0.1, v.phi + dy * 0.004));
      lx = e.clientX; ly = e.clientY; lt = now; v.lastInteract = v.t;
    };
    const up = () => {
      if (!v.dragging) return;
      v.dragging = false;
      v.vel = Math.max(-8, Math.min(8, v.vel));
      v.lastInteract = v.t;
    };
    const dbl = () => this.resetView();
    const handlers: [string, EventListener][] = [['pointerdown', down as EventListener], ['pointermove', move as EventListener], ['pointerup', up], ['pointercancel', up], ['dblclick', dbl]];
    handlers.forEach(([k, fn]) => el.addEventListener(k, fn));
    this.cleanups.push(() => handlers.forEach(([k, fn]) => el.removeEventListener(k, fn)));
  }

  private observeSize() {
    const parent = this.canvas.parentElement!;
    const resize = () => {
      const w = parent.clientWidth, h = parent.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.view.radius = w / h < 1 ? 15 : 11.5;
      this.camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    // Pause rendering while the studio is scrolled out of view
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
    const v = this.view;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    v.t += dt;
    if (!v.dragging) {
      const idle = v.t - v.lastInteract > 2.5;
      const target = idle && !this.reducedMotion ? 0.28 : 0;
      v.vel += (target - v.vel) * (1 - Math.exp(-(idle ? 0.8 : 2.2) * dt));
      v.theta += v.vel * dt;
    }
    if (this.spinBoost) {
      v.theta += this.spinBoost * dt;
      this.spinBoost *= Math.exp(-1.6 * dt);
      if (this.spinBoost < 0.05) this.spinBoost = 0;
    }
    this.turn.rotation.y = v.theta;
    this.camera.position.set(0, 1.0 + v.radius * Math.sin(v.phi), v.radius * Math.cos(v.phi));
    this.camera.lookAt(0, 0.9, 0);

    this.items.forEach((it, key) => {
      const g = it.g;
      if (it.state === 'falling') {
        it.vy -= 16 * dt;
        it.y += it.vy * dt;
        if (it.y <= it.floor) {
          it.y = it.floor;
          if (it.vy < -1.4) {
            if (!it.landed) { this.sparkle(g); it.landed = true; }
            it.squash = Math.min(0.22, -it.vy * 0.025);
            it.vy = -it.vy * 0.3;
          } else { it.vy = 0; it.state = 'rest'; }
        }
      } else if (it.state === 'leaving') {
        it.vy += 9 * dt;
        it.y += it.vy * dt;
        it.scale = Math.max(0.01, it.scale - dt * 0.9);
        if (it.y > it.floor + 5 || it.scale <= 0.02) { this.removeItem(key); return; }
      }
      const k = 1 - Math.exp(-8 * dt);
      it.x += (it.tx - it.x) * k;
      it.z += (it.tz - it.z) * k;
      it.squash *= Math.exp(-9 * dt);
      if (it.state === 'leaving') g.rotation.y += dt * 3;
      else { const r = 1 - Math.exp(-6 * dt); g.rotation.x -= g.rotation.x * r; g.rotation.z -= g.rotation.z * r; }
      const s = it.scale * it.baseScale;
      g.position.set(it.x, it.y, it.z);
      g.scale.set(s * (1 + it.squash * 0.5), s * (1 - it.squash), s * (1 + it.squash * 0.5));
      if (it.flame) it.flame.scale.y = 1.9 + Math.sin(v.t * 18 + it.x * 5) * 0.25;
    });

    if (this.container?.tag) this.container.tag.pivot.rotation.z = Math.sin(v.t * 1.7) * 0.08;
    if (this.diyas.visible) this.diyas.children.forEach((d, i) => { (d.userData.flame as THREE.Mesh).scale.y = 1.7 + Math.sin(v.t * 14 + i) * 0.3; });
    this.tickWrap(dt);
    this.tickEffects(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

function easeOutBounce(x: number) {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) { x -= 1.5 / d; return n * x * x + 0.75; }
  if (x < 2.5 / d) { x -= 2.25 / d; return n * x * x + 0.9375; }
  x -= 2.625 / d;
  return n * x * x + 0.984375;
}

function easeOutBack(x: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
