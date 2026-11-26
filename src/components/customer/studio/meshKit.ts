import * as THREE from 'three';
import type { ContainerKind, ItemKind, StudioItem } from './productShapes';

export interface ContainerState {
  kind: ContainerKind;
  group: THREE.Group;
  floor: number;
  height: number;
  footprint: [number, number];
  lid: THREE.Group | null;
  bow: THREE.Group;
  bowScale: number;
  tagAnchor: THREE.Vector3;
  tag?: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; pivot: THREE.Group };
}

/**
 * Builds the shared 3D pieces (boxes, baskets, bows, gifts) used by both the
 * hamper studio and the museum tour.
 */
export class MeshKit {
  /* ------------------------------------------------------------------ helpers */

  mat(color: number, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  }

  glass() {
    return new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  }

  mesh(geo: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, castShadow = true) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = castShadow;
    m.receiveShadow = true;
    return m;
  }

  disposeObject(obj: THREE.Object3D) {
    obj.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => {
          const withMap = mt as THREE.MeshStandardMaterial;
          withMap.map?.dispose();
          mt.dispose();
        });
      }
    });
  }

  canvasTexture(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, repeat?: [number, number]) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }

  noiseTexture(base: string, speck: string, count: number) {
    return this.canvasTexture((g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.fillStyle = speck;
      for (let i = 0; i < count; i++) { g.globalAlpha = Math.random() * 0.35; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.globalAlpha = 1;
    }, 256, 256, [2, 2]);
  }

  discTexture() {
    return this.canvasTexture(g => {
      g.fillStyle = '#f8e1e8'; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = 'rgba(184,61,114,0.18)'; g.lineWidth = 3;
      for (let r = 60; r < 256; r += 48) { g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = 'rgba(184,61,114,0.24)';
      for (let i = 0; i < 48; i++) { g.save(); g.translate(256, 256); g.rotate(i / 48 * Math.PI * 2); g.fillRect(228, -3, 20, 6); g.restore(); }
    }, 512, 512);
  }

  wickerTexture() {
    return this.canvasTexture((g, w, h) => {
      g.fillStyle = '#7d5626'; g.fillRect(0, 0, w, h);
      const rows = 8, cols = 8, rh = h / rows, cw = w / cols;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const over = (r + k) % 2 === 0, x = k * cw, y = r * rh;
        const grad = g.createLinearGradient(x, y, x, y + rh);
        grad.addColorStop(0, over ? '#e0b06b' : '#c08f4f');
        grad.addColorStop(0.5, over ? '#cf9f5c' : '#ad7e43');
        grad.addColorStop(1, over ? '#9c7038' : '#7d5626');
        g.fillStyle = grad;
        g.beginPath(); g.ellipse(x + cw / 2, y + rh / 2, cw / 2 - 1, rh / 2 - 2, 0, 0, Math.PI * 2); g.fill();
      }
    }, 256, 256, [10, 2.5]);
  }

  bow(color: number, size: number) {
    const g = new THREE.Group();
    const m = this.mat(color, 0.35, 0.05);
    const loopGeo = new THREE.TorusGeometry(0.26 * size, 0.075 * size, 14, 36);
    const l = this.mesh(loopGeo, m, -0.24 * size); l.scale.set(1, 0.62, 0.55); l.rotation.z = 0.35;
    const r = this.mesh(loopGeo, m, 0.24 * size); r.scale.set(1, 0.62, 0.55); r.rotation.z = -0.35;
    const knot = this.mesh(new THREE.SphereGeometry(0.11 * size, 16, 12), m, 0, 0, 0.02);
    const tailGeo = new THREE.BoxGeometry(0.11 * size, 0.42 * size, 0.03 * size);
    const t1 = this.mesh(tailGeo, m, -0.1 * size, -0.22 * size); t1.rotation.z = 0.35;
    const t2 = this.mesh(tailGeo, m, 0.1 * size, -0.22 * size); t2.rotation.z = -0.35;
    g.add(l, r, knot, t1, t2);
    return g;
  }

  shred(w: number, d: number, y0: number, round: boolean) {
    const n = 320;
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.018, 0.045), this.mat(0xffffff, 0.8), n);
    const colors = [0xf2a7bd, 0xffffff, 0xe8c27a, 0xf6d9e1, 0xd9b48a];
    const o = new THREE.Object3D(), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      let x = (Math.random() - 0.5) * w, z = (Math.random() - 0.5) * d;
      if (round && x * x + z * z > (w / 2) * (w / 2)) { x *= 0.6; z *= 0.6; }
      o.position.set(x, y0 + 0.03 + Math.random() * 0.16, z);
      o.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.setHex(colors[i % colors.length]));
    }
    m.receiveShadow = true;
    return m;
  }

  /* ------------------------------------------------------------------ containers */

  buildBox(kind: Exclude<ContainerKind, 'wicker'>, ribbon: number): ContainerState {
    const W = 3.4, D = 2.4, H = 1.35, th = 0.08;
    const g = new THREE.Group();
    const wallMat = kind === 'kraft'
      ? this.mat(0xffffff, 0.92, 0, { map: this.noiseTexture('#c99b67', '#5a3a1a', 2500) })
      : kind === 'velvet'
      ? this.mat(0x4e1c42, 0.95)
      : this.mat(0xffffff, 0.5, 0, { map: this.noiseTexture('#f2b8c8', '#ffffff', 900) });
    const innerMat = kind === 'kraft' ? this.mat(0xb88a58, 0.95) : kind === 'velvet' ? this.mat(0x3a1230, 1) : this.mat(0xe9a2b9, 0.7);
    g.add(this.mesh(new THREE.BoxGeometry(W, th, D), innerMat, 0, th / 2, 0));
    g.add(this.mesh(new THREE.BoxGeometry(W, H, th), wallMat, 0, H / 2, D / 2 - th / 2));
    g.add(this.mesh(new THREE.BoxGeometry(W, H, th), wallMat, 0, H / 2, -D / 2 + th / 2));
    g.add(this.mesh(new THREE.BoxGeometry(th, H, D - 2 * th), wallMat, -W / 2 + th / 2, H / 2, 0));
    g.add(this.mesh(new THREE.BoxGeometry(th, H, D - 2 * th), wallMat, W / 2 - th / 2, H / 2, 0));
    const rb = this.mat(ribbon, 0.35, ribbon === 0xc99a3e ? 0.6 : 0.05);
    const bh = 0.2, by = H * 0.55, e = 0.012;
    g.add(this.mesh(new THREE.BoxGeometry(W + 2 * e, bh, 2 * e), rb, 0, by, D / 2 + e));
    g.add(this.mesh(new THREE.BoxGeometry(W + 2 * e, bh, 2 * e), rb, 0, by, -D / 2 - e));
    g.add(this.mesh(new THREE.BoxGeometry(2 * e, bh, D + 2 * e), rb, W / 2 + e, by, 0));
    g.add(this.mesh(new THREE.BoxGeometry(2 * e, bh, D + 2 * e), rb, -W / 2 - e, by, 0));
    const frontBow = this.bow(ribbon, 1);
    frontBow.position.set(0, by, D / 2 + 0.06);
    g.add(frontBow);

    const lid = new THREE.Group();
    lid.add(this.mesh(new THREE.BoxGeometry(W + 0.16, 0.2, D + 0.16), wallMat));
    lid.add(this.mesh(new THREE.BoxGeometry(0.26, 0.21, D + 0.18), rb, 0, 0.005, 0));
    lid.add(this.mesh(new THREE.BoxGeometry(W + 0.18, 0.21, 0.26), rb, 0, 0.005, 0));
    const lidBow = this.bow(ribbon, 1.5);
    lidBow.position.set(0, 0.22, 0);
    lidBow.rotation.x = -1.0;
    lidBow.scale.setScalar(0.001);
    lid.add(lidBow);
    lid.visible = false;
    g.add(lid, this.shred(W - 0.3, D - 0.3, th, false));
    return { kind, group: g, floor: th + 0.16, height: H, footprint: [W - 0.5, D - 0.4], lid, bow: lidBow, bowScale: 1, tagAnchor: new THREE.Vector3(0.02, by - 0.12, D / 2 + 0.1) };
  }

  buildBasket(ribbon: number): ContainerState {
    const R1 = 1.55, R2 = 1.9, H = 1.25;
    const g = new THREE.Group();
    const tex = this.wickerTexture();
    const wallMat = this.mat(0xffffff, 0.9, 0, { map: tex, bumpMap: tex, bumpScale: 0.03, side: THREE.DoubleSide });
    const wall = this.mesh(new THREE.CylinderGeometry(R2, R1, H, 64, 1, true), wallMat, 0, H / 2, 0);
    const base = this.mesh(new THREE.CircleGeometry(R1, 48), this.mat(0x8a6234, 0.95), 0, 0.02, 0);
    base.rotation.x = -Math.PI / 2;
    const rimMat = this.mat(0x9c7038, 0.8);
    const rimTorus = this.mesh(new THREE.TorusGeometry(R2, 0.09, 12, 72), rimMat, 0, H, 0);
    rimTorus.rotation.x = Math.PI / 2;
    const handle = this.mesh(new THREE.TorusGeometry(R2 - 0.05, 0.08, 12, 64, Math.PI), rimMat, 0, H, 0);
    const bow = this.bow(ribbon, 1);
    bow.position.set(0, H + R2 - 0.05, 0.08);
    bow.scale.setScalar(0.001);
    g.add(wall, base, rimTorus, handle, bow, this.shred(2.4, 2.4, 0.04, true));
    return { kind: 'wicker', group: g, floor: 0.22, height: H, footprint: [2.5, 2.1], lid: null, bow, bowScale: 1.4, tagAnchor: new THREE.Vector3(0.45, H + R2 - 0.5, 0.12) };
  }

  /* ------------------------------------------------------------------ gifts */

  makeItem(item: StudioItem): { g: THREE.Group; flame?: THREE.Mesh } {
    const g = new THREE.Group();
    const { accent, fill } = item;
    let flame: THREE.Mesh | undefined;
    const add = (...o: THREE.Object3D[]) => g.add(...o);
    switch (item.kind as ItemKind) {
      case 'candle': {
        const jar = this.mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.8, 40, 1, true), this.glass(), 0, 0.4, 0, false);
        const wax = this.mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.6, 40), this.mat(0xfff1dc, 0.7), 0, 0.3, 0);
        const label = this.mesh(new THREE.CylinderGeometry(0.365, 0.365, 0.28, 40, 1, true), this.mat(accent, 0.5), 0, 0.42, 0);
        const wick = this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), this.mat(0x222222, 0.9), 0, 0.65, 0);
        flame = this.mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffc26b, emissive: 0xff9a2e, emissiveIntensity: 2.2 }), 0, 0.75, 0, false);
        flame.scale.set(1, 1.9, 1);
        add(wax, label, wick, flame, jar);
        break;
      }
      case 'diffuser': {
        const bottle = this.mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.6, 32), this.glass(), 0, 0.3, 0, false);
        const liquid = this.mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.42, 32), this.mat(accent, 0.2, 0, { transparent: true, opacity: 0.75 }), 0, 0.22, 0);
        const neck = this.mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 20), this.mat(0xc99a3e, 0.3, 0.8), 0, 0.66, 0);
        add(liquid, bottle, neck);
        for (let i = 0; i < 6; i++) {
          const stick = this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6), this.mat(0x3b2a1e, 0.8), Math.cos(i) * 0.05, 1.05, Math.sin(i) * 0.05);
          stick.rotation.set(Math.sin(i * 1.3) * 0.25, 0, Math.cos(i * 1.3) * 0.25);
          add(stick);
        }
        break;
      }
      case 'mug': {
        const white = this.mat(0xffffff, 0.18, 0, { side: THREE.DoubleSide });
        const body = this.mesh(new THREE.CylinderGeometry(0.38, 0.33, 0.72, 40, 1, true), white, 0, 0.38, 0);
        const bottom = this.mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.04, 40), white, 0, 0.04, 0);
        const lip = this.mesh(new THREE.TorusGeometry(0.38, 0.022, 8, 40), white, 0, 0.74, 0);
        lip.rotation.x = Math.PI / 2;
        const handle = this.mesh(new THREE.TorusGeometry(0.17, 0.045, 12, 28), white, 0.42, 0.4, 0);
        handle.scale.set(0.85, 1.1, 1);
        const band = this.mesh(new THREE.CylinderGeometry(0.385, 0.37, 0.1, 40, 1, true), this.mat(accent, 0.4), 0, 0.58, 0);
        add(body, bottom, lip, handle, band, this.heart(accent, 0.17, 0, 0.42, 0.38));
        break;
      }
      case 'truffles': {
        add(this.mesh(new THREE.BoxGeometry(0.95, 0.2, 0.72), this.mat(0x4a2318, 0.55), 0, 0.1, 0));
        add(this.mesh(new THREE.BoxGeometry(0.97, 0.05, 0.74), this.mat(0xc99a3e, 0.3, 0.8), 0, 0.2, 0));
        const tc = [0x6b3420, 0xc99a3e, 0x3b1a10, 0xf3e3cf, 0x6b3420, 0x8b4a32];
        for (let i = 0; i < 6; i++) {
          const t = this.mesh(new THREE.SphereGeometry(0.11, 20, 14), this.mat(tc[i], i === 1 ? 0.3 : 0.5, i === 1 ? 0.6 : 0), -0.28 + (i % 3) * 0.28, 0.3, -0.15 + Math.floor(i / 3) * 0.3);
          t.scale.y = 0.85;
          add(t);
        }
        const lid = this.mesh(new THREE.BoxGeometry(0.97, 0.05, 0.74), this.mat(0xc99a3e, 0.3, 0.8), 0, 0.55, -0.46);
        lid.rotation.x = -1.3;
        add(lid);
        break;
      }
      case 'jar': {
        const n = 60;
        const bits = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 10, 8), this.mat(0xffffff, 0.6), n);
        const o = new THREE.Object3D(), c = new THREE.Color(), base = new THREE.Color(fill);
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.29;
          o.position.set(Math.cos(a) * r, 0.08 + Math.random() * 0.68, Math.sin(a) * r);
          o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
          o.scale.set(1.5, 0.8, 1);
          o.updateMatrix();
          bits.setMatrixAt(i, o.matrix);
          bits.setColorAt(i, c.copy(base).offsetHSL(0, 0, (Math.random() - 0.5) * 0.25));
        }
        bits.castShadow = true;
        const jar = this.mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.82, 40, 1, true), this.glass(), 0, 0.41, 0, false);
        const lid = this.mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.13, 40), this.mat(0xc99a3e, 0.28, 0.85), 0, 0.88, 0);
        const label = this.mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.18, 40, 1, true), this.mat(0xd9b48a, 0.85), 0, 0.3, 0);
        add(bits, label, lid, jar);
        break;
      }
      case 'flowers': {
        const wrap = this.mesh(new THREE.ConeGeometry(0.5, 1.15, 28, 1, true), this.mat(0xffffff, 0.9, 0, { side: THREE.DoubleSide, map: this.noiseTexture('#d9b48a', '#6b4a2a', 800) }), 0, 0.6, 0);
        wrap.rotation.x = Math.PI;
        const tie = this.mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 24), this.mat(accent, 0.4), 0, 0.42, 0);
        tie.rotation.x = Math.PI / 2;
        add(wrap, tie);
        const petals = [0xf2a7bd, 0xffffff, accent, 0xf7c8a6, 0xf2a7bd, 0xffffff, 0xe77fa0];
        const spots: [number, number, number][] = [[0, 1.32, 0], [-0.24, 1.2, 0.12], [0.24, 1.22, 0.1], [-0.1, 1.18, -0.24], [0.18, 1.16, -0.2], [0.04, 1.12, 0.28], [-0.3, 1.08, -0.08]];
        spots.forEach((p, i) => add(this.bloom(petals[i], p)));
        for (let i = 0; i < 6; i++) {
          const leaf = this.mesh(new THREE.SphereGeometry(0.14, 12, 8), this.mat(0x5f8f4e, 0.6), Math.cos(i) * 0.32, 1.02, Math.sin(i) * 0.32);
          leaf.scale.set(0.5, 0.12, 1.3); leaf.rotation.y = -i; leaf.rotation.x = 0.5;
          add(leaf);
        }
        break;
      }
      case 'diya': {
        for (let i = 0; i < 2; i++) {
          const x = i === 0 ? -0.22 : 0.22;
          const bowl = this.mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), this.mat(accent === 0xc99a3e ? 0xc99a3e : 0xb5552e, 0.6, accent === 0xc99a3e ? 0.7 : 0.1, { side: THREE.DoubleSide }), x, 0.2, 0);
          const oil = this.mesh(new THREE.CircleGeometry(0.18, 24), this.mat(0xe0a33a, 0.3), x, 0.19, 0);
          oil.rotation.x = -Math.PI / 2;
          const f = this.mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffc26b, emissive: 0xff9a2e, emissiveIntensity: 2.4 }), x + 0.08, 0.28, 0, false);
          f.scale.y = 1.8;
          if (!flame) flame = f;
          add(bowl, oil, f);
        }
        break;
      }
      case 'frame': {
        const frame = this.mesh(new THREE.BoxGeometry(0.72, 0.9, 0.07), this.mat(accent, 0.5, accent === 0xc99a3e ? 0.6 : 0), 0, 0.5, 0);
        frame.rotation.x = -0.18;
        const photo = this.mesh(new THREE.PlaneGeometry(0.54, 0.7), this.mat(0xf6d9e1, 0.9), 0, 0.5, 0.045);
        photo.rotation.x = -0.18;
        add(frame, photo, this.heart(0xb83d72, 0.1, 0, 0.52, 0.06));
        const stand = this.mesh(new THREE.BoxGeometry(0.06, 0.6, 0.04), this.mat(accent, 0.5), 0, 0.32, -0.22);
        stand.rotation.x = 0.4;
        add(stand);
        break;
      }
      case 'card': {
        const env = this.mesh(new THREE.BoxGeometry(0.8, 0.56, 0.03), this.mat(0xfffdf8, 0.9), 0, 0.34, 0);
        env.rotation.x = -0.25;
        const seal = this.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 20), this.mat(accent, 0.4), 0, 0.33, 0.04);
        seal.rotation.x = Math.PI / 2 - 0.25;
        add(env, seal);
        break;
      }
      case 'tin': {
        add(this.mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.62, 40), this.mat(accent, 0.3, 0.55), 0, 0.31, 0));
        add(this.mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 40), this.mat(0xc99a3e, 0.25, 0.85), 0, 0.66, 0));
        add(this.mesh(new THREE.CylinderGeometry(0.365, 0.365, 0.2, 40, 1, true), this.mat(0xfffdf8, 0.8), 0, 0.32, 0));
        break;
      }
      case 'soap': {
        const tones = [accent, 0xfff1dc, 0xc9b6e4];
        tones.forEach((t, i) => {
          const bar = this.mesh(new THREE.BoxGeometry(0.6, 0.18, 0.4), this.mat(t, 0.7), (i - 1) * 0.04, 0.09 + i * 0.18, (i % 2) * 0.03);
          bar.rotation.y = (i - 1) * 0.2;
          add(bar);
        });
        const twine = this.mesh(new THREE.BoxGeometry(0.05, 0.56, 0.42), this.mat(0xb08b5a, 0.9), 0, 0.28, 0);
        add(twine);
        break;
      }
      case 'bottle': {
        const body = this.mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.7, 32), this.mat(accent, 0.25, 0, { transparent: true, opacity: 0.9 }), -0.15, 0.35, 0);
        const pump = this.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 16), this.mat(0xc99a3e, 0.25, 0.85), -0.15, 0.79, 0);
        const nozzle = this.mesh(new THREE.BoxGeometry(0.18, 0.05, 0.06), this.mat(0xc99a3e, 0.25, 0.85), -0.07, 0.87, 0);
        const tube = this.mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.5, 24), this.mat(0xfffdf8, 0.5), 0.26, 0.25, 0.05);
        const cap = this.mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24), this.mat(accent, 0.4), 0.26, 0.55, 0.05);
        add(body, pump, nozzle, tube, cap);
        break;
      }
      case 'toy': {
        const colors = [0xe77fa0, 0x7fb3f0, 0xe8c27a, 0x7fb069, 0xc9b6e4];
        const spots: [number, number, number][] = [[-0.22, 0.15, 0.1], [0.2, 0.15, 0.12], [0, 0.15, -0.2], [-0.05, 0.45, 0.02], [0.05, 0.75, 0]];
        spots.forEach((p, i) => {
          const cube = this.mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), this.mat(colors[i], 0.45), p[0], p[1], p[2]);
          cube.rotation.y = i * 0.4;
          add(cube);
        });
        break;
      }
      case 'eye': {
        add(this.mesh(new THREE.BoxGeometry(0.55, 0.08, 0.32), this.mat(0xc99a6a, 0.7), 0, 0.04, 0));
        const charm = new THREE.Group();
        charm.position.set(0, 0.53, 0);
        charm.rotation.x = Math.PI / 2 - 0.12;
        ([[0.42, 0x1f4fb0, 0.06], [0.3, 0xffffff, 0.075], [0.19, 0x7fb3f0, 0.09], [0.09, 0x111133, 0.105]] as const).forEach(([r, col, h]) => charm.add(this.mesh(new THREE.CylinderGeometry(r, r, h, 48), this.mat(col, 0.12))));
        const ring = this.mesh(new THREE.TorusGeometry(0.43, 0.03, 10, 48), this.mat(0xc99a3e, 0.25, 0.9));
        ring.rotation.x = Math.PI / 2;
        charm.add(ring);
        add(charm);
        break;
      }
      case 'box': {
        add(this.mesh(new THREE.BoxGeometry(0.8, 0.5, 0.62), this.mat(fill, 0.55), 0, 0.25, 0));
        add(this.mesh(new THREE.BoxGeometry(0.84, 0.14, 0.66), this.mat(accent, 0.4, accent === 0xc99a3e ? 0.6 : 0), 0, 0.52, 0));
        add(this.mesh(new THREE.BoxGeometry(0.5, 0.22, 0.005), this.mat(0xfffdf8, 0.8), 0, 0.27, 0.313));
        break;
      }
      default: {
        // Wrapped gift: box + ribbon cross + small bow
        add(this.mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), this.mat(accent, 0.45), 0, 0.3, 0));
        add(this.mesh(new THREE.BoxGeometry(0.12, 0.62, 0.72), this.mat(0xfffdf8, 0.4), 0, 0.3, 0));
        add(this.mesh(new THREE.BoxGeometry(0.72, 0.62, 0.12), this.mat(0xfffdf8, 0.4), 0, 0.3, 0));
        const b = this.bow(0xfffdf8, 0.6);
        b.position.set(0, 0.66, 0);
        b.rotation.x = -1.1;
        add(b);
      }
    }
    return { g, flame };
  }

  heart(color: number, scale: number, x: number, y: number, z: number) {
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.9);
    sh.bezierCurveTo(-1.6, 0.2, -0.9, 1.5, 0, 0.7);
    sh.bezierCurveTo(0.9, 1.5, 1.6, 0.2, 0, -0.9);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 });
    geo.center();
    const m = this.mesh(geo, this.mat(color, 0.35), x, y, z);
    m.scale.setScalar(scale);
    return m;
  }

  bloom(color: number, p: [number, number, number]) {
    const b = new THREE.Group();
    const pm = this.mat(color, 0.55);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      const petal = this.mesh(new THREE.SphereGeometry(0.075, 12, 8), pm, Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
      petal.scale.set(1.3, 0.45, 0.85);
      petal.rotation.y = -a;
      b.add(petal);
    }
    b.add(this.mesh(new THREE.SphereGeometry(0.045, 10, 8), this.mat(0xf2c14e, 0.5), 0, 0.03, 0));
    b.position.set(...p);
    b.rotation.set(-0.3 + Math.random() * 0.6, Math.random() * 3, -0.3 + Math.random() * 0.6);
    return b;
  }

}
