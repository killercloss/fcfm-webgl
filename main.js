import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const HEIGHTMAP_URL = "./heightmap.png"; // <-- cambia aquí

// --- Parámetros del terreno ---
const HM_SIZE = 256;          // 256x256
const TERRAIN_SIZE = 400;     // ancho/largo en unidades del mundo
const HEIGHT_SCALE = 60;      // altura máxima del terreno (ajústalo)
const BASE_Y = 0;             // offset base del terreno
const WATER_Y = -5;           // opcional: nivel agua

// --- Jugador ---
const PLAYER_HEIGHT = 2.0;    // altura de cámara sobre el suelo
const GRAVITY = 25;
const WALK_SPEED = 10;
const RUN_SPEED = 18;
const JUMP_VELOCITY = 10;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Scene + Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2000);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.9);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(80, 120, 60);
dir.castShadow = false;
scene.add(dir);

// Controls (FPS)
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

const blocker = document.getElementById("blocker");
blocker.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => blocker.classList.add("hidden"));
controls.addEventListener("unlock", () => blocker.classList.remove("hidden"));

// Input WASD
const keys = new Set();
addEventListener("keydown", (e) => keys.add(e.code));
addEventListener("keyup", (e) => keys.delete(e.code));

// --- Util: carga heightmap y devuelve alturas normalizadas 0..1 ---
async function loadHeightData(url, size) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const heights = new Float32Array(size * size);

  // Luma aproximada (si viene en color también sirve)
  for (let i = 0; i < size * size; i++) {
    const r = data[i * 4 + 0];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; // 0..1
    heights[i] = luma;
  }
  return heights;
}

// --- Construye terreno desde alturas ---
function buildTerrain(heights, size, worldSize, heightScale) {
  const segs = size - 1; // 255 segments
  const geo = new THREE.PlaneGeometry(worldSize, worldSize, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // PlaneGeometry indexa vértices en orden fila-col
    const h = heights[i] * heightScale + BASE_Y;
    pos.setY(i, h);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x3b7a57,
    roughness: 1.0,
    metalness: 0.0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return { mesh, geo };
}

// --- Muestras de altura: bilinear sobre el heightmap ---
function sampleHeightBilinear(heights, size, xWorld, zWorld, worldSize, heightScale) {
  // Convertir world x,z a UV 0..1 (asumiendo plano centrado en 0,0)
  const half = worldSize / 2;
  const u = (xWorld + half) / worldSize;  // 0..1
  const v = (zWorld + half) / worldSize;  // 0..1

  // clamp fuera del terreno
  const uu = Math.min(1, Math.max(0, u));
  const vv = Math.min(1, Math.max(0, v));

  const x = uu * (size - 1);
  const y = vv * (size - 1);

  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(size - 1, x0 + 1);
  const y1 = Math.min(size - 1, y0 + 1);

  const tx = x - x0;
  const ty = y - y0;

  const i00 = y0 * size + x0;
  const i10 = y0 * size + x1;
  const i01 = y1 * size + x0;
  const i11 = y1 * size + x1;

  const h00 = heights[i00];
  const h10 = heights[i10];
  const h01 = heights[i01];
  const h11 = heights[i11];

  const hx0 = h00 * (1 - tx) + h10 * tx;
  const hx1 = h01 * (1 - tx) + h11 * tx;
  const h = hx0 * (1 - ty) + hx1 * ty;

  return h * heightScale + BASE_Y;
}

// --- Main ---
let heights = null;
let terrain = null;

let velocityY = 0;
let onGround = false;

(async function init() {
  heights = await loadHeightData(HEIGHTMAP_URL, HM_SIZE);

  const { mesh, geo } = buildTerrain(heights, HM_SIZE, TERRAIN_SIZE, HEIGHT_SCALE);
  terrain = { mesh, geo };
  scene.add(mesh);

  // Agua simple (opcional)
  const waterGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 1, 1);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x234a7a, roughness: 0.2, metalness: 0.0, transparent: true, opacity: 0.55 });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = WATER_Y;
  scene.add(water);

  // Spawn: centro
  controls.getObject().position.set(0, 20, 0);
  animate();
})();

// Resize
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());

  if (heights && controls.isLocked) {
    // Movimiento horizontal
    const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? RUN_SPEED : WALK_SPEED;

    const forward = new THREE.Vector3();
    controls.getDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize().negate();

    const move = new THREE.Vector3();
    if (keys.has("KeyW")) move.add(forward);
    if (keys.has("KeyS")) move.sub(forward);
    if (keys.has("KeyD")) move.add(right);
    if (keys.has("KeyA")) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      controls.getObject().position.add(move);
    }

    // Gravedad + salto
    velocityY -= GRAVITY * dt;

    const p = controls.getObject().position;
    const groundY = sampleHeightBilinear(heights, HM_SIZE, p.x, p.z, TERRAIN_SIZE, HEIGHT_SCALE);

    const targetY = groundY + PLAYER_HEIGHT;

    if (p.y <= targetY) {
      p.y = targetY;
      velocityY = 0;
      onGround = true;
    } else {
      onGround = false;
      p.y += velocityY * dt;
    }

    if (keys.has("Space") && onGround) {
      velocityY = JUMP_VELOCITY;
      onGround = false;
    }
  }

  renderer.render(scene, camera);
}
