// Three.js scene shell shared by all mini-games: renderer, camera, lights,
// tap/click picking, text-label blocks, render loop with an update hook.
// All visuals are primitives + canvas labels — no external assets.

// Three.js is vendored locally (MIT) and imported by relative path — no
// import map (needs iOS 16.4+) and no CDN required, so this runs on any
// ES-module-capable Safari and fully offline once deployed.
import * as THREE from '../vendor/three.module.js';

export const three = {
  renderer: null,
  scene: null,
  camera: null,
  updateHook: null,   // (dt) => void, set by the active game
  pickHandler: null,  // (mesh) => void
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
const pickables = new Set();

export function initScene(canvas) {
  three.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  three.scene = new THREE.Scene();
  three.scene.background = new THREE.Color(0x11162a);
  three.scene.fog = new THREE.Fog(0x11162a, 60, 150);

  three.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
  setCamera([0, 6, -12], [0, 1, 4]);

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(6, 14, -8);
  three.scene.add(sun);
  three.scene.add(new THREE.AmbientLight(0x8899cc, 1.1));

  resize();
  addEventListener('resize', resize);
  // iOS reports stale innerWidth/innerHeight right after rotation
  addEventListener('orientationchange', () => setTimeout(resize, 300));

  canvas.addEventListener('pointerdown', onPointerDown);

  three.renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (three.updateHook) three.updateHook(dt);
    three.renderer.render(three.scene, three.camera);
  });
}

function resize() {
  const w = innerWidth, h = innerHeight;
  three.renderer.setSize(w, h, false);
  three.camera.aspect = w / h;
  three.camera.updateProjectionMatrix();
}

export function setCamera(pos, lookAt) {
  three.camera.position.set(...pos);
  three.camera.lookAt(...lookAt);
}

function onPointerDown(e) {
  if (!three.pickHandler) return;
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, three.camera);
  const hits = raycaster.intersectObjects([...pickables], false);
  if (hits.length) three.pickHandler(hits[0].object);
}

// ---------- builders ----------

export function makeGroup() {
  const g = new THREE.Group();
  three.scene.add(g);
  return g;
}

/** Recursively dispose a group's geometries/materials/textures and remove it. */
export function disposeGroup(group) {
  if (!group) return;
  group.traverse((o) => {
    pickables.delete(o);
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
  three.scene.remove(group);
}

export function makeBox(group, pos, size, color, pickable = false) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.position.set(...pos);
  group.add(mesh);
  if (pickable) pickables.add(mesh);
  return mesh;
}

export function makeSphere(group, pos, radius, color) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.position.set(...pos);
  group.add(mesh);
  return mesh;
}

export function setColor(mesh, color) {
  mesh.material.color.set(color);
}

export const COLORS = [0x3380e6, 0xe68c26, 0x8c4dcc, 0x26b38c];
export const GREEN = 0x2ecc40;
export const RED = 0xe03c30;

// ---------- text labels (canvas sprites) ----------

function wrapLines(text, maxChars) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && line.length + w.length + 1 > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Crisp text sprite. worldWidth controls on-screen size; text wraps to fit.
 */
export function makeLabel(group, text, pos, worldWidth = 4, fontPx = 44) {
  const lines = wrapLines(text, 24);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${fontPx}px sans-serif`;
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width), 10);
  const lineH = fontPx * 1.2;
  canvas.width = Math.ceil(textW + 24);
  canvas.height = Math.ceil(lineH * lines.length + 16);

  const c2 = canvas.getContext('2d');
  c2.font = `bold ${fontPx}px sans-serif`;
  c2.textAlign = 'center';
  c2.textBaseline = 'middle';
  c2.fillStyle = 'rgba(8,10,20,0.55)';
  if (c2.roundRect) {
    c2.roundRect(0, 0, canvas.width, canvas.height, 12);
    c2.fill();
  } else {
    c2.fillRect(0, 0, canvas.width, canvas.height);
  }
  c2.fillStyle = '#fff';
  lines.forEach((l, i) => c2.fillText(l, canvas.width / 2, (i + 0.5) * lineH + 8));

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  const aspect = canvas.height / canvas.width;
  sprite.scale.set(worldWidth, worldWidth * aspect, 1);
  sprite.position.set(...pos);
  sprite.renderOrder = 5;
  group.add(sprite);
  return sprite;
}

/** Box + floating label above it; the box is pickable and carries its label
 *  in userData so games that move blocks can move/hide the label too. */
export function makeAnswerBlock(group, text, pos, size, color) {
  const box = makeBox(group, pos, size, color, true);
  const labelWidth = Math.max(size[0] * 1.15, 3);
  box.userData.label = makeLabel(group, text, [pos[0], pos[1] + size[1] / 2 + 0.9, pos[2]], labelWidth);
  return box;
}

/** Keep an answer block's label floating above its (possibly moved) box. */
export function syncLabel(box, yOffset = 0.9) {
  const label = box.userData.label;
  if (!label) return;
  label.position.set(
    box.position.x,
    box.position.y + (box.geometry.parameters.height * box.scale.y) / 2 + yOffset,
    box.position.z
  );
}
