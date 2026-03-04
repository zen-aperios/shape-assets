import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/controls/OrbitControls.js";
import {
  buildPresetShapePoints,
  buildPointsFromImageUrl,
  buildPointsFromMeshFile
} from "./shape-samplers.js";

const container = document.getElementById("app");
const shapeSelect = document.getElementById("shapeSelect");
const imageInput = document.getElementById("imageInput");
const meshInput = document.getElementById("meshInput");
const externalCountInput = document.getElementById("externalCount");
const internalCountInput = document.getElementById("internalCount");
const shapeScaleInput = document.getElementById("shapeScale");
const surfaceExternalOnlyInput = document.getElementById("surfaceExternalOnly");
const faceMinTravelInput = document.getElementById("faceMinTravel");
const movementModeInput = document.getElementById("movementMode");
const internalMovementInput = document.getElementById("internalMovement");
const gridEnabledInput = document.getElementById("gridEnabled");
const collisionEnabledInput = document.getElementById("collisionEnabled");
const travelSpeedInput = document.getElementById("travelSpeed");
const externalSizeInput = document.getElementById("externalSize");
const internalSpeedInput = document.getElementById("internalSpeed");
const internalSizeInput = document.getElementById("internalSize");
const sphereGapInput = document.getElementById("sphereGap");
const cursorSizeInput = document.getElementById("cursorSize");
const cursorForceInput = document.getElementById("cursorForce");
const cursorLinkDistanceInput = document.getElementById("cursorLinkDistance");
const cursorLineColorInput = document.getElementById("cursorLineColor");
const gridColorInput = document.getElementById("gridColor");
const sphereColorInput = document.getElementById("sphereColor");
const internalColorInput = document.getElementById("internalColor");
const internalDetailShadingInput = document.getElementById("internalDetailShading");
const sphereShadowsInput = document.getElementById("sphereShadows");
const sphereOpacityInput = document.getElementById("sphereOpacity");
const sphereGlareInput = document.getElementById("sphereGlare");
const sphereMatteInput = document.getElementById("sphereMatte");
const internalMatteInput = document.getElementById("internalMatte");
const sphereGlowInput = document.getElementById("sphereGlow");
const exportDataBtn = document.getElementById("exportDataBtn");
const exportWebflowBtn = document.getElementById("exportWebflowBtn");
const statusLine = document.getElementById("statusLine");
const customImageOption = shapeSelect.querySelector('option[value="custom-image"]');
const customMeshOption = shapeSelect.querySelector('option[value="custom-mesh"]');

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle("error", isError);
}

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0xd6d6d6, 16, 44);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 35;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.28));
const topLight = new THREE.DirectionalLight(0xffffff, 2.45);
topLight.position.set(0, 16, 0);
topLight.target.position.set(0, 0, 0);
scene.add(topLight);
scene.add(topLight.target);
const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
keyLight.position.set(7, 9, 6);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x5b84ff, 1.4, 50, 2);
rimLight.position.set(-8, -4, 8);
scene.add(rimLight);
const sweepLightA = new THREE.DirectionalLight(0xfff3e0, 0.35);
sweepLightA.position.set(12, 4, 4);
scene.add(sweepLightA);
const sweepLightB = new THREE.DirectionalLight(0x7da7ff, 0.25);
sweepLightB.position.set(-10, -3, -6);
scene.add(sweepLightB);

const group = new THREE.Group();
group.position.set(0, 0, 0);
scene.add(group);
const importCageGroup = new THREE.Group();
group.add(importCageGroup);
const maxCursorLinks = 3;
const cursorLinkPositions = new Float32Array(maxCursorLinks * 2 * 3);
const cursorLinkGeometry = new THREE.BufferGeometry();
cursorLinkGeometry.setAttribute("position", new THREE.BufferAttribute(cursorLinkPositions, 3));
cursorLinkGeometry.setDrawRange(0, 0);
const cursorLinkMaterial = new THREE.LineBasicMaterial({
  color: cursorLineColorInput?.value || "#cad9ff",
  transparent: true,
  opacity: 0.82
});
const cursorLinkLines = new THREE.LineSegments(cursorLinkGeometry, cursorLinkMaterial);
group.add(cursorLinkLines);

let externalCount = Number(externalCountInput?.value) || 900;
let internalCount = Number(internalCountInput?.value) || 200;
let sphereCount = Math.max(0, externalCount + internalCount);
const baseShapeRadius = 5.7;
let shapeScale = Number(shapeScaleInput?.value) || 1;
let surfaceExternalOnly = surfaceExternalOnlyInput?.checked ?? false;

const particleGeometry = new THREE.SphereGeometry(0.1, 20, 16);
const externalParticleMaterial = new THREE.MeshStandardMaterial({
  color: 0x90b2ff,
  roughness: 0.62,
  metalness: 0.12,
  emissive: 0x000000,
  emissiveIntensity: 0.06,
  transparent: true,
  opacity: 0.95
});
const internalParticleMaterial = new THREE.MeshStandardMaterial({
  color: 0x4f6fb6,
  roughness: 0.62,
  metalness: 0.12,
  emissive: 0x000000,
  emissiveIntensity: 0.06,
  transparent: true,
  opacity: 0.95
});
const sharedShadowLightDir = { value: new THREE.Vector3(0, 1, 0) };
const sharedShadowCenter = { value: new THREE.Vector3(0, 0, 0) };
const externalShadowUniforms = {
  uSharedLightDir: sharedShadowLightDir,
  uSharedCenter: sharedShadowCenter,
  uSharedShadowStrength: { value: 0.5 },
  uSharedShadowSoftness: { value: 0.2 }
};
const internalShadowUniforms = {
  uSharedLightDir: sharedShadowLightDir,
  uSharedCenter: sharedShadowCenter,
  uSharedShadowStrength: { value: 0.5 },
  uSharedShadowSoftness: { value: 0.2 }
};

function enableSharedShadow(material, shadowUniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSharedLightDir = shadowUniforms.uSharedLightDir;
    shader.uniforms.uSharedCenter = shadowUniforms.uSharedCenter;
    shader.uniforms.uSharedShadowStrength = shadowUniforms.uSharedShadowStrength;
    shader.uniforms.uSharedShadowSoftness = shadowUniforms.uSharedShadowSoftness;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vSharedWorldPosition;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vec4 sharedWorldPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
sharedWorldPosition = instanceMatrix * sharedWorldPosition;
#endif
sharedWorldPosition = modelMatrix * sharedWorldPosition;
vSharedWorldPosition = sharedWorldPosition.xyz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vSharedWorldPosition;
uniform vec3 uSharedLightDir;
uniform vec3 uSharedCenter;
uniform float uSharedShadowStrength;
uniform float uSharedShadowSoftness;`
      )
      .replace(
        "#include <dithering_fragment>",
        `vec3 sharedN = normalize(vSharedWorldPosition - uSharedCenter);
float sharedLit = dot(sharedN, normalize(uSharedLightDir)) * 0.5 + 0.5;
float sharedMask = smoothstep(uSharedShadowSoftness, 1.0 - uSharedShadowSoftness, sharedLit);
float sharedShade = mix(1.0 - uSharedShadowStrength, 1.0, sharedMask);
gl_FragColor.rgb *= sharedShade;
#include <dithering_fragment>`
      );
  };
  material.customProgramCacheKey = () => "shared-shadow-v1";
  material.needsUpdate = true;
}
enableSharedShadow(externalParticleMaterial, externalShadowUniforms);
enableSharedShadow(internalParticleMaterial, internalShadowUniforms);

const materialControls = {
  color: "#90b2ff",
  internalColor: "#4f6fb6",
  opacity: 0.95,
  glare: 0.45,
  matte: 0.35,
  internalMatte: 0.45,
  glow: 0.35
};

const motionControls = {
  travelSpeed: Number(travelSpeedInput?.value ?? 8),
  externalSize: Number(externalSizeInput?.value ?? 1),
  internalSpeed: Number(internalSpeedInput?.value ?? 0.8),
  internalSize: Number(internalSizeInput?.value ?? 0.9),
  sphereGap: Number(sphereGapInput?.value ?? 0.19),
  cursorSize: Number(cursorSizeInput?.value ?? 4.0),
  cursorForce: Number(cursorForceInput?.value ?? 2.4),
  cursorLinkDistance: Number(cursorLinkDistanceInput?.value ?? 2.8)
};

function readMotionControls() {
  motionControls.travelSpeed = Number(travelSpeedInput?.value ?? motionControls.travelSpeed);
  motionControls.externalSize = Number(externalSizeInput?.value ?? motionControls.externalSize);
  motionControls.internalSpeed = Number(internalSpeedInput?.value ?? motionControls.internalSpeed);
  motionControls.internalSize = Number(internalSizeInput?.value ?? motionControls.internalSize);
  motionControls.sphereGap = Number(sphereGapInput?.value ?? motionControls.sphereGap);
  motionControls.cursorSize = Number(cursorSizeInput?.value ?? motionControls.cursorSize);
  motionControls.cursorForce = Number(cursorForceInput?.value ?? motionControls.cursorForce);
  motionControls.cursorLinkDistance = Number(cursorLinkDistanceInput?.value ?? motionControls.cursorLinkDistance);
}

function applyMaterialControls() {
  const internalDetails = internalDetailShadingInput?.checked ?? true;
  const sphereShadowsEnabled = sphereShadowsInput?.checked ?? true;
  externalParticleMaterial.color.set(materialControls.color);
  internalParticleMaterial.color.set(materialControls.internalColor);
  externalParticleMaterial.transparent = materialControls.opacity < 0.999;
  internalParticleMaterial.transparent = materialControls.opacity < 0.999;
  externalParticleMaterial.opacity = materialControls.opacity;
  internalParticleMaterial.opacity = materialControls.opacity;
  const extBaseMetalness = 0.06 + materialControls.glare * 0.45;
  const extBaseRoughness = 0.92 - materialControls.glare * 0.55;
  const extMatte = Math.max(0, Math.min(1, materialControls.matte));
  externalParticleMaterial.metalness = extBaseMetalness * (1 - extMatte);
  externalParticleMaterial.roughness = extBaseRoughness * (1 - extMatte) + 1.0 * extMatte;
  externalParticleMaterial.emissive.set(0x050505);
  externalParticleMaterial.emissiveIntensity = 0.04 + materialControls.glow * 0.14;
  externalShadowUniforms.uSharedShadowStrength.value = sphereShadowsEnabled ? 0.5 : 0.0;
  externalShadowUniforms.uSharedShadowSoftness.value = 0.2;

  if (internalDetails) {
    const intBaseMetalness = 0.06 + materialControls.glare * 0.45;
    const intBaseRoughness = 0.92 - materialControls.glare * 0.55;
    const intMatte = Math.max(0, Math.min(1, materialControls.internalMatte));
    internalParticleMaterial.metalness = intBaseMetalness * (1 - intMatte);
    internalParticleMaterial.roughness = intBaseRoughness * (1 - intMatte) + 1.0 * intMatte;
    internalParticleMaterial.emissive.set(0x050505);
    internalParticleMaterial.emissiveIntensity = 0.04 + materialControls.glow * 0.14;
    internalShadowUniforms.uSharedShadowStrength.value = sphereShadowsEnabled ? 0.5 : 0.0;
    internalShadowUniforms.uSharedShadowSoftness.value = 0.2;
  } else {
    internalParticleMaterial.metalness = 0.0;
    internalParticleMaterial.roughness = 1.0;
    internalParticleMaterial.emissive.set(0x000000);
    internalParticleMaterial.emissiveIntensity = 0.0;
    internalShadowUniforms.uSharedShadowStrength.value = 0.0;
    internalShadowUniforms.uSharedShadowSoftness.value = 0.2;
  }
  externalParticleMaterial.needsUpdate = true;
  internalParticleMaterial.needsUpdate = true;
  rimLight.intensity = 1.1 + materialControls.glow * 0.9;
}

let particles = [];
let currentShapePoints = [];
let shapeBatches = [];
let shapeNeighbors = [];
let surfacePointMask = [];
let surfacePointIndices = [];
let interiorPointIndices = [];
let internalOrbitIndices = [];
let surfaceNeighbors = [];
let alternateLineBands = [];
let alternateLineIds = [];
let oneWayLaneBands = [];
let oneWayLaneIds = [];
let oneWayOrbitBands = [];
let oneWayOrbitBandIds = [];
let faceHorizontalOrbitBands = [];
let faceHorizontalOrbitBandIds = [];
let oneWayGlobalCursor = 0;
let gridRowBands = [];
let gridRowIds = [];
let gridColBands = [];
let gridColIds = [];
let staticCoverageIndices = [];
let normalExternalOrbitIndices = [];
let normalInternalOrbitIndices = [];
let normalExternalSlotMap = new Map();
let normalInternalSlotMap = new Map();
let externalParticleMesh = null;
let internalParticleMesh = null;
let movementMode = movementModeInput?.value || "normal";
let internalMovementMode = internalMovementInput?.value || "normal";
let oneWayDirection = "right";
let gridEnabled = gridEnabledInput?.checked ?? true;
let collisionEnabled = collisionEnabledInput?.checked ?? true;
let faceMinTravel = Number(faceMinTravelInput?.value) || 18;
let gridLineColor = gridColorInput?.value || "#d0d0d0";
let forceAllSurfacePoints = false;
const radialDirs = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0)
];
function clearImportCage() {
  for (let i = importCageGroup.children.length - 1; i >= 0; i--) {
    const child = importCageGroup.children[i];
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
    importCageGroup.remove(child);
  }
}

function rebuildImportCage(points, enabled) {
  clearImportCage();
  if (!enabled || !gridEnabled || !points.length) return;

  const box = new THREE.Box3();
  for (let i = 0; i < points.length; i++) box.expandByPoint(points[i]);
  const size = box.getSize(new THREE.Vector3());
  const min = box.min.clone();
  const pad = Math.max(0.2, Math.max(size.x, size.y, size.z) * 0.03);
  min.subScalar(pad);
  const paddedSize = size.clone().addScalar(pad * 2);

  const maxDim = Math.max(paddedSize.x, paddedSize.y, paddedSize.z);
  const baseDiv = 13;
  const cell = Math.max(0.2, maxDim / baseDiv);
  const nx = Math.max(2, Math.ceil(paddedSize.x / cell));
  const ny = Math.max(2, Math.ceil(paddedSize.y / cell));
  const nz = Math.max(2, Math.ceil(paddedSize.z / cell));

  const occupied = new Set();
  const toKey = (x, y, z) => `${x},${y},${z}`;
  const fromKey = (key) => key.split(",").map((n) => Number(n));

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    let x = Math.floor((p.x - min.x) / cell);
    let y = Math.floor((p.y - min.y) / cell);
    let z = Math.floor((p.z - min.z) / cell);
    x = Math.max(0, Math.min(nx - 1, x));
    y = Math.max(0, Math.min(ny - 1, y));
    z = Math.max(0, Math.min(nz - 1, z));
    occupied.add(toKey(x, y, z));
  }

  const shell = new Set();
  const dirs = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0],
    [0, -1, 0], [0, 0, 1], [0, 0, -1]
  ];
  occupied.forEach((key) => {
    const [x, y, z] = fromKey(key);
    for (let i = 0; i < dirs.length; i++) {
      const nx0 = x + dirs[i][0];
      const ny0 = y + dirs[i][1];
      const nz0 = z + dirs[i][2];
      if (nx0 < 0 || nx0 >= nx || ny0 < 0 || ny0 >= ny || nz0 < 0 || nz0 >= nz || !occupied.has(toKey(nx0, ny0, nz0))) {
        shell.add(key);
        break;
      }
    }
  });

  const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(cell * 0.95, cell * 0.95, cell * 0.95));
  const maxCubes = 1200;
  let placed = 0;
  shell.forEach((key) => {
    if (placed >= maxCubes) return;
    const [x, y, z] = fromKey(key);
    const cx = min.x + (x + 0.5) * cell;
    const cy = min.y + (y + 0.5) * cell;
    const cz = min.z + (z + 0.5) * cell;
    const lines = new THREE.LineSegments(
      edgeGeo.clone(),
      new THREE.LineBasicMaterial({
        color: gridLineColor,
        transparent: true,
        opacity: 0.36
      })
    );
    lines.position.set(cx, cy, cz);
    importCageGroup.add(lines);
    placed++;
  });

  edgeGeo.dispose();
}

function randomParticleMotion(p) {
  const internalMul = p.isInternal ? motionControls.internalSpeed : 1;
  p.pathSpeed = (0.08 + motionControls.travelSpeed * 0.018) * (0.9 + Math.random() * 0.2) * internalMul;
  p.followRate = 8.5;
  p.turnTimer = 0.08 + Math.random() * 0.3;
}

function buildWeightedBandAllocation(bandIds, bands, totalCount) {
  const ids = (bandIds || []).slice();
  if (!ids.length || totalCount <= 0) return { order: [], targets: new Map() };

  const weights = ids.map((id) => Math.max(1, bands?.[id]?.length || 1));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) return { order: [], targets: new Map() };

  const targets = new Map();
  const fracs = [];
  let assigned = 0;
  for (let i = 0; i < ids.length; i++) {
    const raw = (weights[i] / weightSum) * totalCount;
    const base = Math.floor(raw);
    targets.set(ids[i], base);
    fracs.push({ id: ids[i], frac: raw - base });
    assigned += base;
  }

  if (totalCount >= ids.length) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if ((targets.get(id) || 0) === 0) {
        targets.set(id, 1);
        assigned++;
      }
    }
  }

  if (assigned < totalCount) {
    fracs.sort((a, b) => b.frac - a.frac);
    let k = 0;
    while (assigned < totalCount && fracs.length) {
      const id = fracs[k % fracs.length].id;
      targets.set(id, (targets.get(id) || 0) + 1);
      assigned++;
      k++;
    }
  } else if (assigned > totalCount) {
    const shrink = ids
      .map((id) => ({ id, count: targets.get(id) || 0 }))
      .sort((a, b) => b.count - a.count);
    let k = 0;
    while (assigned > totalCount && k < shrink.length * 4) {
      const item = shrink[k % shrink.length];
      const c = targets.get(item.id) || 0;
      const min = totalCount >= ids.length ? 1 : 0;
      if (c > min) {
        targets.set(item.id, c - 1);
        assigned--;
      }
      k++;
    }
  }

  const remaining = new Map();
  for (let i = 0; i < ids.length; i++) remaining.set(ids[i], targets.get(ids[i]) || 0);
  const order = [];
  let left = totalCount;
  while (left > 0) {
    let pushedThisRound = false;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const c = remaining.get(id) || 0;
      if (c <= 0) continue;
      order.push(id);
      remaining.set(id, c - 1);
      left--;
      pushedThisRound = true;
      if (left <= 0) break;
    }
    if (!pushedThisRound) break;
  }

  return { order, targets };
}

function wrapIndex(value, length) {
  if (length <= 0) return 0;
  return ((value % length) + length) % length;
}

function getTravelDirectionSign() {
  return oneWayDirection === "left" || oneWayDirection === "down" ? -1 : 1;
}

function getOrbitBandForParticle(p) {
  if (movementMode === "tornado") {
    if (p.isInternal && internalOrbitIndices.length) {
      return internalOrbitIndices;
    }
    return oneWayOrbitBands[p.oneWayLane] || null;
  }
  if (p.isInternal && internalOrbitIndices.length) {
    return internalOrbitIndices;
  }
  return oneWayOrbitBands[p.oneWayLane] || null;
}

function getFaceHorizontalBandForParticle(p) {
  return faceHorizontalOrbitBands[p.oneWayLane] || null;
}

const instanceDummy = new THREE.Object3D();
const specWhiteColor = new THREE.Color(0xffffff);
const shadowTintColor = new THREE.Color(0x1e2433);
const tempNormal = new THREE.Vector3();
const tempLightDirKey = new THREE.Vector3();
const tempLightDirA = new THREE.Vector3();
const tempLightDirB = new THREE.Vector3();

function writeInstances(elapsed = 0) {
  if (!externalParticleMesh || !internalParticleMesh) return;
  const maxExternal = Math.max(0, externalCount);
  const maxInternal = Math.max(0, internalCount);
  let externalIndex = 0;
  let internalIndex = 0;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    instanceDummy.position.copy(p.pos);
    const scale = p.isInternal ? motionControls.internalSize : motionControls.externalSize;
    instanceDummy.scale.setScalar(scale);
    instanceDummy.updateMatrix();
    if (p.isInternal && internalIndex < maxInternal) {
      internalParticleMesh.setMatrixAt(internalIndex, instanceDummy.matrix);
      internalIndex++;
    } else if (externalIndex < maxExternal) {
      externalParticleMesh.setMatrixAt(externalIndex, instanceDummy.matrix);
      externalIndex++;
    }
  }
  externalParticleMesh.count = externalIndex;
  internalParticleMesh.count = internalIndex;
  externalParticleMesh.instanceMatrix.needsUpdate = true;
  internalParticleMesh.instanceMatrix.needsUpdate = true;
}

function fibonacciSpherePoint(i, n, r) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * goldenAngle;
  return new THREE.Vector3(Math.cos(theta) * radius * r, y * r, Math.sin(theta) * radius * r);
}

function rebuildSpheres(count) {
  if (externalParticleMesh) {
    group.remove(externalParticleMesh);
    externalParticleMesh.dispose();
    externalParticleMesh = null;
  }
  if (internalParticleMesh) {
    group.remove(internalParticleMesh);
    internalParticleMesh.dispose();
    internalParticleMesh = null;
  }

  sphereCount = count;
  particles = [];

  externalParticleMesh = new THREE.InstancedMesh(
    particleGeometry,
    externalParticleMaterial,
    Math.max(1, externalCount)
  );
  internalParticleMesh = new THREE.InstancedMesh(
    particleGeometry,
    internalParticleMaterial,
    Math.max(1, internalCount)
  );
  externalParticleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  internalParticleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Shared shadow field replaces per-particle shadow-map casting.
  externalParticleMesh.castShadow = false;
  internalParticleMesh.castShadow = false;
  externalParticleMesh.receiveShadow = false;
  internalParticleMesh.receiveShadow = false;
  group.add(externalParticleMesh);
  group.add(internalParticleMesh);

  for (let i = 0; i < sphereCount; i++) {
    const p0 = fibonacciSpherePoint(i, sphereCount, baseShapeRadius);
    const p = {
      anchor: p0.clone(),
      pos: p0.clone(),
      batchId: 0,
      currentIndex: 0,
      prevIndex: -1,
      nextIndex: 0,
      segmentT: 0,
      pathSpeed: 0,
      followRate: 0,
      turnTimer: 0,
      cursorTear: 0,
      sepVel: new THREE.Vector3(),
      normalStep: 1,
      radialDir: (Math.random() * 4) | 0,
      faceSlot: 0,
      faceStep: 1,
      lineBand: 0,
      lineSlot: 0,
      lineStep: 1,
      staticIndex: 0,
      oneWayLane: 0,
      oneWaySlot: 0,
      oneWayStep: 1,
      oneWayOffset: 0,
      isInternal: false,
      internalDepth: 0.8,
      gridFamily: 0,
      gridBand: 0,
      gridSlot: 0,
      gridStep: 1
    };
    randomParticleMotion(p);
    particles.push(p);
  }

  writeInstances();
}

function buildShapeTravelData(points, forceSurface = false) {
  if (!points.length) {
    shapeBatches = [];
    shapeNeighbors = [];
    surfacePointMask = [];
    surfacePointIndices = [];
    interiorPointIndices = [];
    surfaceNeighbors = [];
    alternateLineBands = [];
    alternateLineIds = [];
    oneWayLaneBands = [];
    oneWayLaneIds = [];
    oneWayOrbitBands = [];
    oneWayOrbitBandIds = [];
    faceHorizontalOrbitBands = [];
    faceHorizontalOrbitBandIds = [];
    oneWayGlobalCursor = 0;
    gridRowBands = [];
    gridRowIds = [];
    gridColBands = [];
    gridColIds = [];
    staticCoverageIndices = [];
    normalExternalOrbitIndices = [];
    normalInternalOrbitIndices = [];
    normalExternalSlotMap = new Map();
    normalInternalSlotMap = new Map();
    return;
  }

  const pointCount = points.length;
  const batchCount = Math.max(8, Math.min(48, Math.round(pointCount / 70)));
  const seeds = [];
  for (let i = 0; i < batchCount; i++) {
    const idx = Math.floor((i / batchCount) * pointCount) % pointCount;
    seeds.push(points[idx].clone());
  }

  const batchOfPoint = new Array(pointCount).fill(0);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < pointCount; i++) {
      let bestBatch = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let b = 0; b < batchCount; b++) {
        const d = points[i].distanceToSquared(seeds[b]);
        if (d < bestDist) {
          bestDist = d;
          bestBatch = b;
        }
      }
      batchOfPoint[i] = bestBatch;
    }

    const sums = Array.from({ length: batchCount }, () => ({ p: new THREE.Vector3(), n: 0 }));
    for (let i = 0; i < pointCount; i++) {
      const b = batchOfPoint[i];
      sums[b].p.add(points[i]);
      sums[b].n++;
    }
    for (let b = 0; b < batchCount; b++) {
      if (sums[b].n > 0) seeds[b].copy(sums[b].p.multiplyScalar(1 / sums[b].n));
    }
  }

  shapeBatches = Array.from({ length: batchCount }, () => []);
  for (let i = 0; i < pointCount; i++) {
    shapeBatches[batchOfPoint[i]].push(i);
  }
  for (let b = shapeBatches.length - 1; b >= 0; b--) {
    if (!shapeBatches[b].length) shapeBatches.splice(b, 1);
  }

  shapeNeighbors = Array.from({ length: pointCount }, () => []);
  const maxNeighbors = 12;
  for (let i = 0; i < pointCount; i++) {
    const candidateBatch = batchOfPoint[i];
    const candidates = shapeBatches[candidateBatch]?.length ? shapeBatches[candidateBatch] : null;
    const source = candidates && candidates.length > 1 ? candidates : null;
    const list = [];

    const pool = source || [...Array(pointCount).keys()];
    for (let t = 0; t < pool.length; t++) {
      const j = pool[t];
      if (j === i) continue;
      const d = points[i].distanceToSquared(points[j]);
      if (list.length < maxNeighbors) {
        list.push({ j, d });
        continue;
      }
      let worstIdx = 0;
      for (let m = 1; m < list.length; m++) {
        if (list[m].d > list[worstIdx].d) worstIdx = m;
      }
      if (d < list[worstIdx].d) list[worstIdx] = { j, d };
    }
    list.sort((a, b) => a.d - b.d);
    shapeNeighbors[i] = list.map((item) => item.j);
  }

  // Build a strict surface set using voxel shell exposure (not radial threshold).
  surfacePointMask = new Array(pointCount).fill(false);
  surfacePointIndices = [];
  if (forceSurface) {
    for (let i = 0; i < pointCount; i++) {
      surfacePointMask[i] = true;
      surfacePointIndices.push(i);
    }
  } else {
  const shellBox = new THREE.Box3();
  for (let i = 0; i < pointCount; i++) shellBox.expandByPoint(points[i]);
  const shellSize = shellBox.getSize(new THREE.Vector3());
  const shellMin = shellBox.min.clone();
  const shellMaxDim = Math.max(shellSize.x, shellSize.y, shellSize.z, 0.0001);
  const shellCell = shellMaxDim / Math.max(9, Math.round(Math.cbrt(pointCount) * 1.45));
  const voxelToPoints = new Map();
  const toKey = (x, y, z) => `${x},${y},${z}`;
  const parseKey = (key) => key.split(",").map((n) => Number(n));

  for (let i = 0; i < pointCount; i++) {
    const p = points[i];
    const cx = Math.floor((p.x - shellMin.x) / shellCell);
    const cy = Math.floor((p.y - shellMin.y) / shellCell);
    const cz = Math.floor((p.z - shellMin.z) / shellCell);
    const key = toKey(cx, cy, cz);
    let list = voxelToPoints.get(key);
    if (!list) {
      list = [];
      voxelToPoints.set(key, list);
    }
    list.push(i);
  }

  const neighborDirs = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0],
    [0, -1, 0], [0, 0, 1], [0, 0, -1]
  ];
  voxelToPoints.forEach((indices, key) => {
    const [cx, cy, cz] = parseKey(key);
    let exposed = false;
    for (let i = 0; i < neighborDirs.length; i++) {
      const n = neighborDirs[i];
      if (!voxelToPoints.has(toKey(cx + n[0], cy + n[1], cz + n[2]))) {
        exposed = true;
        break;
      }
    }
    if (!exposed) return;
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      surfacePointMask[idx] = true;
      surfacePointIndices.push(idx);
    }
  });

    if (!surfacePointIndices.length) {
      const radii = points.map((p) => p.length()).sort((a, b) => a - b);
      const cutIdx = Math.max(0, Math.min(radii.length - 1, Math.floor(radii.length * 0.82)));
      const surfaceThreshold = radii[cutIdx] ?? 0;
      for (let i = 0; i < pointCount; i++) {
        if (points[i].length() >= surfaceThreshold) {
          surfacePointMask[i] = true;
          surfacePointIndices.push(i);
        }
      }
    }
  }

  surfaceNeighbors = Array.from({ length: pointCount }, () => []);
  const maxSurfaceNeighbors = 10;
  const surfaceByBatch = Array.from({ length: shapeBatches.length }, () => []);
  for (let i = 0; i < surfacePointIndices.length; i++) {
    const idx = surfacePointIndices[i];
    const b = batchOfPoint[idx];
    if (b >= 0 && b < surfaceByBatch.length) surfaceByBatch[b].push(idx);
  }

  interiorPointIndices = [];
  for (let i = 0; i < pointCount; i++) {
    if (!surfacePointMask[i]) interiorPointIndices.push(i);
  }
  if (!interiorPointIndices.length) {
    // Force-surface datasets still need a pool for internal mode.
    interiorPointIndices = surfacePointIndices.slice();
  }
  internalOrbitIndices = interiorPointIndices.slice().sort((a, b) => {
    const pa = points[a];
    const pb = points[b];
    const aa = Math.atan2(pa.z, pa.x);
    const ab = Math.atan2(pb.z, pb.x);
    if (Math.abs(aa - ab) > 0.0001) return aa - ab;
    return pa.y - pb.y;
  });
  for (let i = 0; i < surfacePointIndices.length; i++) {
    const idx = surfacePointIndices[i];
    const b = batchOfPoint[idx];
    let pool = (b >= 0 && b < surfaceByBatch.length) ? surfaceByBatch[b] : surfacePointIndices;
    if (!pool || pool.length < 2) pool = surfacePointIndices;

    const list = [];
    for (let t = 0; t < pool.length; t++) {
      const j = pool[t];
      if (j === idx) continue;
      const d = points[idx].distanceToSquared(points[j]);
      if (list.length < maxSurfaceNeighbors) {
        list.push({ j, d });
        continue;
      }
      let worstIdx = 0;
      for (let m = 1; m < list.length; m++) {
        if (list[m].d > list[worstIdx].d) worstIdx = m;
      }
      if (d < list[worstIdx].d) list[worstIdx] = { j, d };
    }
    list.sort((a, b0) => a.d - b0.d);
    surfaceNeighbors[idx] = list.map((item) => item.j);
  }

  const lineCount = 24;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    if (points[i].y < minY) minY = points[i].y;
    if (points[i].y > maxY) maxY = points[i].y;
  }
  const yRange = Math.max(0.0001, maxY - minY);
  alternateLineBands = Array.from({ length: lineCount }, () => []);
  for (let i = 0; i < points.length; i++) {
    const ny = (points[i].y - minY) / yRange;
    const band = Math.max(0, Math.min(lineCount - 1, Math.floor(ny * lineCount)));
    alternateLineBands[band].push(i);
  }
  for (let i = 0; i < lineCount; i++) {
    alternateLineBands[i].sort((a, b) => {
      const ax = points[a].x;
      const bx = points[b].x;
      if (Math.abs(ax - bx) > 0.0001) return ax - bx;
      return points[a].z - points[b].z;
    });
  }
  alternateLineIds = [];
  for (let i = 0; i < lineCount; i++) {
    if (alternateLineBands[i].length > 0) alternateLineIds.push(i);
  }

  rebuildOneWayLanes(points);
  rebuildOneWayOrbit(points);
  rebuildFaceHorizontalOrbit(points);
  rebuildGridTravelLines(points);

  const coverageSource = surfacePointIndices.length ? surfacePointIndices : [...Array(points.length).keys()];
  const box = new THREE.Box3();
  for (let i = 0; i < coverageSource.length; i++) box.expandByPoint(points[coverageSource[i]]);
  const size = box.getSize(new THREE.Vector3());
  const min = box.min.clone();
  const maxDim = Math.max(size.x, size.y, size.z, 0.0001);
  const cell = maxDim / Math.max(8, Math.round(Math.cbrt(coverageSource.length) * 1.3));
  const buckets = new Map();
  const bucketOrder = [];
  for (let i = 0; i < coverageSource.length; i++) {
    const pointIndex = coverageSource[i];
    const p = points[pointIndex];
    const cx = Math.floor((p.x - min.x) / cell);
    const cy = Math.floor((p.y - min.y) / cell);
    const cz = Math.floor((p.z - min.z) / cell);
    const key = `${cx},${cy},${cz}`;
    let list = buckets.get(key);
    if (!list) {
      list = [];
      buckets.set(key, list);
      bucketOrder.push(key);
    }
    list.push(pointIndex);
  }
  for (let i = 0; i < bucketOrder.length; i++) {
    const list = buckets.get(bucketOrder[i]);
    list.sort((a, b) => points[a].lengthSq() - points[b].lengthSq());
  }
  staticCoverageIndices = [];
  let remaining = coverageSource.length;
  while (remaining > 0) {
    for (let i = 0; i < bucketOrder.length; i++) {
      const list = buckets.get(bucketOrder[i]);
      if (!list || !list.length) continue;
      staticCoverageIndices.push(list.shift());
      remaining--;
    }
  }

  normalExternalOrbitIndices = staticCoverageIndices.length
    ? staticCoverageIndices.slice()
    : (surfacePointIndices.length ? surfacePointIndices.slice() : [...Array(points.length).keys()]);
  normalInternalOrbitIndices = internalOrbitIndices.length
    ? internalOrbitIndices.slice()
    : (interiorPointIndices.length ? interiorPointIndices.slice() : normalExternalOrbitIndices.slice());
  normalExternalSlotMap = new Map();
  for (let i = 0; i < normalExternalOrbitIndices.length; i++) {
    normalExternalSlotMap.set(normalExternalOrbitIndices[i], i);
  }
  normalInternalSlotMap = new Map();
  for (let i = 0; i < normalInternalOrbitIndices.length; i++) {
    normalInternalSlotMap.set(normalInternalOrbitIndices[i], i);
  }
}

function rebuildOneWayLanes(points) {
  oneWayLaneBands = [];
  oneWayLaneIds = [];
  if (!points.length) return;

  const box = new THREE.Box3();
  for (let i = 0; i < points.length; i++) box.expandByPoint(points[i]);
  const size = box.getSize(new THREE.Vector3());
  const min = box.min.clone();

  const laneMap = new Map();
  const laneKeys = [];
  const toKey = (a, b) => `${a},${b}`;
  const laneDiv = Math.max(4, Math.round(Math.cbrt(points.length) * 0.85));

  if (oneWayDirection === "right" || oneWayDirection === "left") {
    const sy = Math.max(0.0001, size.y);
    const sz = Math.max(0.0001, size.z);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const iy = Math.max(0, Math.min(laneDiv - 1, Math.floor(((p.y - min.y) / sy) * laneDiv)));
      const iz = Math.max(0, Math.min(laneDiv - 1, Math.floor(((p.z - min.z) / sz) * laneDiv)));
      const key = toKey(iy, iz);
      let list = laneMap.get(key);
      if (!list) {
        list = [];
        laneMap.set(key, list);
        laneKeys.push(key);
      }
      list.push(i);
    }
    for (let i = 0; i < laneKeys.length; i++) {
      laneMap.get(laneKeys[i]).sort((a, b) => points[a].x - points[b].x);
    }
  } else {
    const sx = Math.max(0.0001, size.x);
    const sz = Math.max(0.0001, size.z);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const ix = Math.max(0, Math.min(laneDiv - 1, Math.floor(((p.x - min.x) / sx) * laneDiv)));
      const iz = Math.max(0, Math.min(laneDiv - 1, Math.floor(((p.z - min.z) / sz) * laneDiv)));
      const key = toKey(ix, iz);
      let list = laneMap.get(key);
      if (!list) {
        list = [];
        laneMap.set(key, list);
        laneKeys.push(key);
      }
      list.push(i);
    }
    for (let i = 0; i < laneKeys.length; i++) {
      laneMap.get(laneKeys[i]).sort((a, b) => points[a].y - points[b].y);
    }
  }

  oneWayLaneBands = laneKeys.map((key) => laneMap.get(key));
  oneWayLaneIds = [];
  for (let i = 0; i < oneWayLaneBands.length; i++) {
    if (oneWayLaneBands[i].length > 1) oneWayLaneIds.push(i);
  }
  if (!oneWayLaneIds.length) {
    for (let i = 0; i < oneWayLaneBands.length; i++) {
      if (oneWayLaneBands[i].length > 0) oneWayLaneIds.push(i);
    }
  }
}

function rebuildOneWayOrbit(points) {
  oneWayOrbitBands = [];
  oneWayOrbitBandIds = [];
  if (!points.length) return;

  const source = surfacePointIndices.length ? surfacePointIndices.slice() : [...Array(points.length).keys()];
  const center = new THREE.Vector3();
  for (let i = 0; i < source.length; i++) center.add(points[source[i]]);
  center.multiplyScalar(1 / Math.max(1, source.length));

  if (movementMode === "tornado") {
    // Pre-direction-linked tornado: strict horizontal ring orbits on an outer shell.
    const outerSource = [];
    const seenOuter = new Set();
    {
      const azCount = 96;
      const elCount = 42;
      const bins = new Map();
      const twoPi = Math.PI * 2;
      const toKey = (a, e) => `${a},${e}`;

      for (let i = 0; i < source.length; i++) {
        const idx = source[i];
        const p = points[idx];
        const vx = p.x - center.x;
        const vy = p.y - center.y;
        const vz = p.z - center.z;
        const r = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (r < 0.00001) continue;
        const az = (Math.atan2(vz, vx) + Math.PI) / twoPi;
        const el = Math.acos(Math.max(-1, Math.min(1, vy / r))) / Math.PI;
        const ia = Math.max(0, Math.min(azCount - 1, Math.floor(az * azCount)));
        const ie = Math.max(0, Math.min(elCount - 1, Math.floor(el * elCount)));
        const key = toKey(ia, ie);
        let list = bins.get(key);
        if (!list) {
          list = [];
          bins.set(key, list);
        }
        list.push({ idx, r });
      }

      bins.forEach((list) => {
        list.sort((a, b) => b.r - a.r);
        const keep = Math.min(6, list.length);
        for (let i = 0; i < keep; i++) {
          const idx = list[i].idx;
          if (!seenOuter.has(idx)) {
            seenOuter.add(idx);
            outerSource.push(idx);
          }
        }
      });
    }

    const minDesiredOrbitPoints = Math.max(360, Math.floor(externalCount * 0.9));
    const activeSource = outerSource.length >= minDesiredOrbitPoints ? outerSource : source;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < activeSource.length; i++) {
      const y = points[activeSource[i]].y;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const yRange = Math.max(0.0001, maxY - minY);
    const ringCount = Math.max(18, Math.min(72, Math.round(Math.sqrt(activeSource.length) * 1.1)));
    const rings = Array.from({ length: ringCount }, () => []);

    for (let i = 0; i < activeSource.length; i++) {
      const idx = activeSource[i];
      const p = points[idx];
      const ny = (p.y - minY) / yRange;
      const ring = Math.max(0, Math.min(ringCount - 1, Math.floor(ny * ringCount)));
      const angle = Math.atan2(p.z - center.z, p.x - center.x);
      rings[ring].push({ idx, angle });
    }

    oneWayOrbitBands = [];
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      if (ring.length < 6) continue;

      const angleBinCount = Math.max(36, Math.min(192, Math.round(Math.sqrt(ring.length) * 4.6)));
      const perBinCap = ring.length > 220 ? 3 : ring.length > 90 ? 2 : 1;
      const bins = Array.from({ length: angleBinCount }, () => []);
      const twoPi = Math.PI * 2;
      for (let j = 0; j < ring.length; j++) {
        const item = ring[j];
        const p = points[item.idx];
        const vx = p.x - center.x;
        const vy = p.y - center.y;
        const vz = p.z - center.z;
        const r3 = vx * vx + vy * vy + vz * vz;
        const u = (item.angle + Math.PI) / twoPi;
        const bi = Math.max(0, Math.min(angleBinCount - 1, Math.floor(u * angleBinCount)));
        const bucket = bins[bi];
        bucket.push({ idx: item.idx, angle: item.angle, r3 });
        bucket.sort((a, b) => b.r3 - a.r3);
        if (bucket.length > perBinCap) bucket.length = perBinCap;
      }

      const band = [];
      for (let layer = 0; layer < perBinCap; layer++) {
        for (let bi = 0; bi < bins.length; bi++) {
          const item = bins[bi][layer];
          if (item) band.push(item);
        }
      }

      const dedup = [];
      const used = new Set();
      for (let j = 0; j < band.length; j++) {
        const idx = band[j].idx;
        if (used.has(idx)) continue;
        used.add(idx);
        dedup.push(idx);
      }
      if (dedup.length >= 6) oneWayOrbitBands.push(dedup);
    }
    oneWayOrbitBandIds = [];
    for (let i = 0; i < oneWayOrbitBands.length; i++) {
      if (oneWayOrbitBands[i].length > 2) oneWayOrbitBandIds.push(i);
    }

    if (oneWayOrbitBandIds.length) {
      oneWayGlobalCursor = 0;
      return;
    }
  }

  const binCount = Math.max(48, Math.round(Math.sqrt(source.length) * 5));
  const bins = Array.from({ length: binCount }, () => []);
  const twoPi = Math.PI * 2;

  for (let i = 0; i < source.length; i++) {
    const idx = source[i];
    const p = points[idx];
    const angle =
      oneWayDirection === "right" || oneWayDirection === "left"
        ? Math.atan2(p.z - center.z, p.x - center.x)
        : Math.atan2(p.z - center.z, p.y - center.y);
    const u = (angle + Math.PI) / twoPi;
    const bi = Math.max(0, Math.min(binCount - 1, Math.floor(u * binCount)));
    const secondary =
      oneWayDirection === "right" || oneWayDirection === "left"
        ? p.y - center.y
        : p.x - center.x;
    bins[bi].push({ idx, secondary });
  }

  for (let i = 0; i < bins.length; i++) {
    bins[i].sort((a, b) => a.secondary - b.secondary);
  }

  const orbit = [];
  let remaining = source.length;
  while (remaining > 0) {
    for (let i = 0; i < bins.length; i++) {
      const bucket = bins[i];
      if (!bucket.length) continue;
      orbit.push(bucket.shift().idx);
      remaining--;
    }
  }

  oneWayOrbitBands = [orbit];
  oneWayOrbitBandIds = orbit.length ? [0] : [];
  oneWayGlobalCursor = 0;
}

function rebuildFaceHorizontalOrbit(points) {
  faceHorizontalOrbitBands = [];
  faceHorizontalOrbitBandIds = [];
  if (!points.length) return;
  const minBandLength = Math.max(3, Math.floor(faceMinTravel));

  const source = surfacePointIndices.length ? surfacePointIndices.slice() : [...Array(points.length).keys()];
  if (!source.length) return;

  const center = new THREE.Vector3();
  for (let i = 0; i < source.length; i++) center.add(points[source[i]]);
  center.multiplyScalar(1 / Math.max(1, source.length));

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < source.length; i++) {
    const y = points[source[i]].y;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const yRange = Math.max(0.0001, maxY - minY);
  const ringCount = Math.max(10, Math.min(40, Math.round(Math.sqrt(source.length) * 0.8)));
  const rings = Array.from({ length: ringCount }, () => []);
  const twoPi = Math.PI * 2;

  const toStableBand = (entries) => {
    if (!entries || entries.length < 3) return [];
    const ordered = entries.slice().sort((a, b) => a.angle - b.angle);
    if (ordered.length < 2) return ordered.map((item) => item.idx);

    // Rotate the ring so the seam sits in the largest empty angle gap.
    let maxGap = -1;
    let startAt = 0;
    for (let i = 0; i < ordered.length; i++) {
      const cur = ordered[i].angle;
      const next = i === ordered.length - 1 ? ordered[0].angle + twoPi : ordered[i + 1].angle;
      const gap = next - cur;
      if (gap > maxGap) {
        maxGap = gap;
        startAt = (i + 1) % ordered.length;
      }
    }

    const band = [];
    for (let i = 0; i < ordered.length; i++) {
      const j = (startAt + i) % ordered.length;
      band.push(ordered[j].idx);
    }
    return band;
  };

  for (let i = 0; i < source.length; i++) {
    const idx = source[i];
    const p = points[idx];
    const ny = (p.y - minY) / yRange;
    const ring = Math.max(0, Math.min(ringCount - 1, Math.floor(ny * ringCount)));
    const angle = Math.atan2(p.z - center.z, p.x - center.x);
    rings[ring].push({ idx, angle });
  }

  // Bottom cap tends to jitter with tiny sparse rings, so merge low bands.
  const bottomMergeCount = Math.max(1, Math.min(3, Math.floor(ringCount * 0.18)));
  const bottomEntries = [];
  for (let i = 0; i < bottomMergeCount; i++) {
    if (rings[i].length) bottomEntries.push(...rings[i]);
  }
  if (bottomEntries.length >= minBandLength) {
    const bottomBand = toStableBand(bottomEntries);
    if (bottomBand.length >= minBandLength) faceHorizontalOrbitBands.push(bottomBand);
  }

  for (let i = bottomMergeCount; i < rings.length; i++) {
    if (rings[i].length < minBandLength) continue;
    const band = toStableBand(rings[i]);
    if (band.length >= minBandLength) faceHorizontalOrbitBands.push(band);
  }

  if (!faceHorizontalOrbitBands.length && source.length >= minBandLength) {
    const fallbackEntries = source.map((idx) => {
      const p = points[idx];
      return { idx, angle: Math.atan2(p.z - center.z, p.x - center.x) };
    });
    const fallbackBand = toStableBand(fallbackEntries);
    if (fallbackBand.length >= minBandLength) faceHorizontalOrbitBands.push(fallbackBand);
  }

  for (let i = 0; i < faceHorizontalOrbitBands.length; i++) {
    if (faceHorizontalOrbitBands[i].length > 2) faceHorizontalOrbitBandIds.push(i);
  }
}

function rebuildGridTravelLines(points) {
  gridRowBands = [];
  gridRowIds = [];
  gridColBands = [];
  gridColIds = [];
  if (!points.length) return;

  const box = new THREE.Box3();
  for (let i = 0; i < points.length; i++) box.expandByPoint(points[i]);
  const size = box.getSize(new THREE.Vector3());
  const min = box.min.clone();
  const sx = Math.max(0.0001, size.x);
  const sy = Math.max(0.0001, size.y);
  const sz = Math.max(0.0001, size.z);
  const div = Math.max(5, Math.round(Math.cbrt(points.length) * 0.9));

  const rowMap = new Map();
  const colMap = new Map();
  const rowKey = (iy, iz) => `${iy},${iz}`;
  const colKey = (ix, iz) => `${ix},${iz}`;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const ix = Math.max(0, Math.min(div - 1, Math.floor(((p.x - min.x) / sx) * div)));
    const iy = Math.max(0, Math.min(div - 1, Math.floor(((p.y - min.y) / sy) * div)));
    const iz = Math.max(0, Math.min(div - 1, Math.floor(((p.z - min.z) / sz) * div)));

    const rk = rowKey(iy, iz);
    if (!rowMap.has(rk)) rowMap.set(rk, []);
    rowMap.get(rk).push(i);

    const ck = colKey(ix, iz);
    if (!colMap.has(ck)) colMap.set(ck, []);
    colMap.get(ck).push(i);
  }

  rowMap.forEach((list) => list.sort((a, b) => points[a].x - points[b].x));
  colMap.forEach((list) => list.sort((a, b) => points[a].y - points[b].y));

  gridRowBands = Array.from(rowMap.values());
  gridColBands = Array.from(colMap.values());
  for (let i = 0; i < gridRowBands.length; i++) {
    if (gridRowBands[i].length > 1) gridRowIds.push(i);
  }
  for (let i = 0; i < gridColBands.length; i++) {
    if (gridColBands[i].length > 1) gridColIds.push(i);
  }
  if (!gridRowIds.length) {
    for (let i = 0; i < gridRowBands.length; i++) {
      if (gridRowBands[i].length > 0) gridRowIds.push(i);
    }
  }
  if (!gridColIds.length) {
    for (let i = 0; i < gridColBands.length; i++) {
      if (gridColBands[i].length > 0) gridColIds.push(i);
    }
  }
}

function chooseNextIndexNormal(p) {
  const neighbors = shapeNeighbors[p.currentIndex];
  if (!neighbors || neighbors.length === 0) return p.currentIndex;

  const jitter = 0;
  const branchChance = 0.01;
  const reverseChance = 0.005;
  if (p.prevIndex >= 0 && Math.random() < reverseChance) return p.prevIndex;

  if (p.prevIndex < 0) {
    const earlyCount = Math.min(4, neighbors.length);
    return neighbors[(Math.random() * earlyCount) | 0];
  }

  const current = currentShapePoints[p.currentIndex];
  const previous = currentShapePoints[p.prevIndex];
  tempPointA.copy(current).sub(previous);
  const dirLen = tempPointA.length();
  if (dirLen < 0.00001) {
    return neighbors[(Math.random() * Math.min(4, neighbors.length)) | 0];
  }
  tempPointA.multiplyScalar(1 / dirLen);

  let bestNeighbor = neighbors[0];
  let bestScore = -Number.POSITIVE_INFINITY;
  for (let i = 0; i < neighbors.length; i++) {
    const n = neighbors[i];
    if (n === p.prevIndex && neighbors.length > 1) continue;

    tempPointB.copy(currentShapePoints[n]).sub(current);
    const segLen = tempPointB.length();
    if (segLen < 0.00001) continue;
    tempPointB.multiplyScalar(1 / segLen);

    const alignment = tempPointA.dot(tempPointB);
    const distanceBias = -i * 0.025;
    const randomBias = (Math.random() * 2 - 1) * jitter;
    const score = alignment * 1.25 + distanceBias + randomBias;
    if (score > bestScore) {
      bestScore = score;
      bestNeighbor = n;
    }
  }

  if (neighbors.length > 2 && Math.random() < branchChance) {
    const branchPool = neighbors.slice(0, Math.min(6, neighbors.length));
    return branchPool[(Math.random() * branchPool.length) | 0];
  }

  return bestNeighbor;
}

function chooseNextIndexNormalEven(p) {
  const band = p.isInternal ? normalInternalOrbitIndices : normalExternalOrbitIndices;
  if (!band || !band.length) return p.currentIndex;
  const slotMap = p.isInternal ? normalInternalSlotMap : normalExternalSlotMap;
  let slot = slotMap.get(p.currentIndex);
  if (slot === undefined) {
    slot = (Math.random() * band.length) | 0;
  }
  const step = p.normalStep || 1;
  const nextSlot = (slot + step + band.length) % band.length;
  return band[nextSlot];
}

function chooseNextIndexFaceCover(p) {
  const neighbors = surfaceNeighbors[p.currentIndex];
  if (!neighbors || neighbors.length === 0) {
    if (surfacePointIndices.length) {
      return surfacePointIndices[(Math.random() * surfacePointIndices.length) | 0];
    }
    return p.currentIndex;
  }

  if (surfacePointIndices.length && Math.random() < 0.015) {
    return surfacePointIndices[(Math.random() * surfacePointIndices.length) | 0];
  }

  let candidates = neighbors.slice();
  if (p.prevIndex >= 0 && candidates.length > 1) {
    candidates = candidates.filter((n) => n !== p.prevIndex);
    if (!candidates.length) candidates = neighbors.slice();
  }
  const pickCount = Math.min(8, candidates.length);
  return candidates[(Math.random() * pickCount) | 0];
}

function pickRandomSurfaceIndex(fallbackIndex = 0) {
  if (!surfacePointIndices.length) return fallbackIndex;
  return surfacePointIndices[(Math.random() * surfacePointIndices.length) | 0];
}

function ensureSurfaceIndex(index, fallbackIndex = 0) {
  if (!surfacePointIndices.length) return index;
  if (index >= 0 && index < surfacePointMask.length && surfacePointMask[index]) return index;
  return pickRandomSurfaceIndex(fallbackIndex);
}

function chooseNextIndexSurfaceOnly(p) {
  const safeIndex = ensureSurfaceIndex(p.currentIndex, p.currentIndex);
  const neighbors = surfaceNeighbors[safeIndex];
  if (!neighbors || !neighbors.length) {
    return pickRandomSurfaceIndex(safeIndex);
  }
  let candidates = neighbors;
  if (p.prevIndex >= 0 && neighbors.length > 1) {
    const filtered = neighbors.filter((n) => n !== p.prevIndex);
    if (filtered.length) candidates = filtered;
  }
  const next = candidates[(Math.random() * Math.min(8, candidates.length)) | 0];
  return ensureSurfaceIndex(next, safeIndex);
}

function chooseNextIndexRadial4(p) {
  const neighbors = shapeNeighbors[p.currentIndex];
  if (!neighbors || neighbors.length === 0) return p.currentIndex;

  const jitter = 0.05;
  if (p.radialDir === undefined || p.radialDir === null) p.radialDir = (Math.random() * 4) | 0;
  if (Math.random() < 0.02 + jitter * 0.08) p.radialDir = (Math.random() * 4) | 0;
  const dir = radialDirs[p.radialDir];

  const current = currentShapePoints[p.currentIndex];
  let bestNeighbor = neighbors[0];
  let bestScore = -Number.POSITIVE_INFINITY;
  for (let i = 0; i < neighbors.length; i++) {
    const n = neighbors[i];
    if (n === p.prevIndex && neighbors.length > 1) continue;
    tempPointA.copy(currentShapePoints[n]).sub(current);
    const segLen = tempPointA.length();
    if (segLen < 0.00001) continue;
    tempPointA.multiplyScalar(1 / segLen);
    const score = tempPointA.dot(dir) * 1.3 - i * 0.02 + (Math.random() * 2 - 1) * jitter * 0.1;
    if (score > bestScore) {
      bestScore = score;
      bestNeighbor = n;
    }
  }

  if (bestScore < 0.1 && neighbors.length > 1) {
    return neighbors[(Math.random() * Math.min(5, neighbors.length)) | 0];
  }
  return bestNeighbor;
}

function chooseDirectionalNeighbor(p, directionVec) {
  const neighbors = shapeNeighbors[p.currentIndex];
  if (!neighbors || neighbors.length === 0) return p.currentIndex;

  const jitter = 0.04;
  const current = currentShapePoints[p.currentIndex];
  let bestNeighbor = neighbors[0];
  let bestScore = -Number.POSITIVE_INFINITY;
  for (let i = 0; i < neighbors.length; i++) {
    const n = neighbors[i];
    if (n === p.prevIndex && neighbors.length > 1) continue;
    tempPointA.copy(currentShapePoints[n]).sub(current);
    const segLen = tempPointA.length();
    if (segLen < 0.00001) continue;
    tempPointA.multiplyScalar(1 / segLen);
    const score = tempPointA.dot(directionVec) * 1.35 - i * 0.02 + (Math.random() * 2 - 1) * jitter * 0.12;
    if (score > bestScore) {
      bestScore = score;
      bestNeighbor = n;
    }
  }
  if (bestScore < 0.08 && neighbors.length > 1) {
    return neighbors[(Math.random() * Math.min(5, neighbors.length)) | 0];
  }
  return bestNeighbor;
}

function chooseNextIndexOneWay(p) {
  const useFaceHorizontal = movementMode === "face-one-way" && surfaceExternalOnly && !p.isInternal;
  const band = useFaceHorizontal ? faceHorizontalOrbitBands[p.oneWayLane] : oneWayOrbitBands[p.oneWayLane];
  if (!band || band.length === 0) {
    return p.currentIndex;
  }
  const nextSlot = (p.oneWaySlot + p.oneWayStep + band.length) % band.length;
  return band[nextSlot];
}

function chooseNextIndexAlternateLines(p) {
  const band = alternateLineBands[p.lineBand];
  if (!band || band.length === 0) return p.currentIndex;
  const nextSlot = (p.lineSlot + p.lineStep + band.length) % band.length;
  return band[nextSlot];
}

function chooseNextIndexGridTravel(p) {
  const bands = p.gridFamily === 0 ? gridRowBands : gridColBands;
  const band = bands[p.gridBand];
  if (!band || band.length === 0) return p.currentIndex;
  const nextSlot = (p.gridSlot + p.gridStep + band.length) % band.length;
  return band[nextSlot];
}

function chooseNextIndexFootballPattern(p) {
  // Spiral-like travel around the longest axis, similar to football laces wrapping.
  const absX = Math.abs(p.anchor.x);
  const absY = Math.abs(p.anchor.y);
  const absZ = Math.abs(p.anchor.z);
  let axis = axisX;
  if (absY > absX && absY > absZ) axis = axisY;
  else if (absZ > absX && absZ > absY) axis = axisZ;

  tempPointA.copy(p.anchor);
  tempPointB.copy(axis).multiplyScalar(Math.sign(tempPointA.dot(axis)) || 1);
  tempPointC.crossVectors(axis, tempPointA);
  if (tempPointC.lengthSq() > 0.0001) {
    tempPointC.normalize().multiplyScalar(0.78).add(tempPointB.multiplyScalar(0.62)).normalize();
    return chooseDirectionalNeighbor(p, tempPointC);
  }
  tempPointB.normalize();
  return chooseDirectionalNeighbor(p, tempPointB);
}

function chooseNextIndexBasketballPattern(p) {
  // Alternating seam-flow on spherical bands (latitude/longitude style).
  tempPointA.copy(p.anchor).normalize();
  const band = Math.floor((tempPointA.y + 1) * 8);
  const seamAxis = band % 2 === 0 ? axisY : axisX;
  tempPointB.crossVectors(seamAxis, tempPointA);
  if (tempPointB.lengthSq() < 0.0001) tempPointB.copy(axisZ);
  else tempPointB.normalize();
  return chooseDirectionalNeighbor(p, tempPointB);
}

function chooseNextIndexForInternalMode(p) {
  if (!p.isInternal) return null;
  if (internalMovementMode === "match") return null;
  if (internalMovementMode === "static") return p.currentIndex;
  return chooseNextIndexNormal(p);
}

function chooseNextIndex(p) {
  if (movementMode === "normal") return chooseNextIndexNormalEven(p);
  const internalChoice = chooseNextIndexForInternalMode(p);
  if (internalChoice !== null) return internalChoice;
  if (movementMode === "face-one-way") {
    if (surfaceExternalOnly && !p.isInternal) return chooseNextIndexOneWay(p);
    return chooseNextIndexNormal(p);
  }
  if (surfaceExternalOnly && !p.isInternal && movementMode !== "face-one-way") return chooseNextIndexSurfaceOnly(p);
  if (movementMode === "face-cover") return chooseNextIndexFaceCover(p);
  if (movementMode === "static-detail") return p.currentIndex;
  if (movementMode === "radial-4") return chooseNextIndexRadial4(p);
  if (movementMode === "one-way" || movementMode === "tornado") return chooseNextIndexOneWay(p);
  if (movementMode === "alternate-lines") return chooseNextIndexAlternateLines(p);
  if (movementMode === "grid-travel") return chooseNextIndexGridTravel(p);
  if (movementMode === "football-pattern") return chooseNextIndexFootballPattern(p);
  if (movementMode === "basketball-pattern") return chooseNextIndexBasketballPattern(p);
  return chooseNextIndexNormal(p);
}

function buildOneWayBandOrder(totalCount) {
  const ids = oneWayOrbitBandIds.slice();
  if (!ids.length || totalCount <= 0) return [];

  const weights = ids.map((id) => Math.max(1, oneWayOrbitBands[id]?.length || 1));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) return [];

  const targets = new Map();
  const fracs = [];
  let assigned = 0;
  for (let i = 0; i < ids.length; i++) {
    const raw = (weights[i] / weightSum) * totalCount;
    const base = Math.floor(raw);
    targets.set(ids[i], base);
    fracs.push({ id: ids[i], frac: raw - base });
    assigned += base;
  }

  // Ensure every band has at least one particle when possible.
  if (totalCount >= ids.length) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if ((targets.get(id) || 0) === 0) {
        targets.set(id, 1);
        assigned += 1;
      }
    }
  }

  if (assigned < totalCount) {
    fracs.sort((a, b) => b.frac - a.frac);
    let k = 0;
    while (assigned < totalCount) {
      const id = fracs[k % fracs.length].id;
      targets.set(id, (targets.get(id) || 0) + 1);
      assigned++;
      k++;
    }
  } else if (assigned > totalCount) {
    const shrink = ids
      .map((id) => ({ id, count: targets.get(id) || 0 }))
      .sort((a, b) => b.count - a.count);
    let k = 0;
    while (assigned > totalCount && k < shrink.length * 4) {
      const item = shrink[k % shrink.length];
      const c = targets.get(item.id) || 0;
      const min = totalCount >= ids.length ? 1 : 0;
      if (c > min) {
        targets.set(item.id, c - 1);
        assigned--;
      }
      k++;
    }
  }

  const remaining = new Map();
  for (let i = 0; i < ids.length; i++) remaining.set(ids[i], targets.get(ids[i]) || 0);
  const order = [];
  let left = totalCount;
  while (left > 0) {
    let pushedThisRound = false;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const c = remaining.get(id) || 0;
      if (c <= 0) continue;
      order.push(id);
      remaining.set(id, c - 1);
      left--;
      pushedThisRound = true;
      if (left <= 0) break;
    }
    if (!pushedThisRound) break;
  }
  return order;
}

function applyBasePoints(basePoints, showImportCage = false, forceSurface = false) {
  if (!basePoints.length || particles.length === 0) return;

  const min = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  const max = new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  for (let i = 0; i < basePoints.length; i++) {
    min.min(basePoints[i]);
    max.max(basePoints[i]);
  }
  const center = min.clone().add(max).multiplyScalar(0.5);

  currentShapePoints = basePoints.map((p) => p.clone().sub(center));

  let maxLen = 0;
  for (let i = 0; i < currentShapePoints.length; i++) {
    maxLen = Math.max(maxLen, currentShapePoints[i].length());
  }
  if (maxLen > 0.0001) {
    const scale = (baseShapeRadius * shapeScale * 0.95) / maxLen;
    for (let i = 0; i < currentShapePoints.length; i++) {
      currentShapePoints[i].multiplyScalar(scale);
    }
  }
  rebuildImportCage(currentShapePoints, showImportCage);

  forceAllSurfacePoints = !!forceSurface;
  buildShapeTravelData(currentShapePoints, forceAllSurfacePoints);
  const surfaceSeedOffset = surfacePointIndices.length ? ((Math.random() * surfacePointIndices.length) | 0) : 0;
  const staticSeedOffset = staticCoverageIndices.length ? ((Math.random() * staticCoverageIndices.length) | 0) : 0;
  const lineSeedOffset = alternateLineIds.length ? ((Math.random() * alternateLineIds.length) | 0) : 0;
  const lineAllocation = buildWeightedBandAllocation(alternateLineIds, alternateLineBands, particles.length);
  const lineOrder = lineAllocation.order;
  const lineTargets = lineAllocation.targets;
  let lineCursor = 0;
  const lineCounters = new Map();
  const internalTargetCount = interiorPointIndices.length ? Math.min(internalCount, particles.length) : 0;
  let internalAssigned = 0;
  const oneWaySeedOffset = 0;
  const faceOneWayActive = movementMode === "face-one-way" && surfaceExternalOnly;
  const oneWayBandIds = faceOneWayActive ? faceHorizontalOrbitBandIds : oneWayOrbitBandIds;
  const oneWayBands = faceOneWayActive ? faceHorizontalOrbitBands : oneWayOrbitBands;
  const oneWayExternalCount = Math.max(0, particles.length - internalTargetCount);
  const oneWayAllocation = buildWeightedBandAllocation(oneWayBandIds, oneWayBands, oneWayExternalCount);
  const oneWayOrder = oneWayAllocation.order;
  const oneWayTargets = oneWayAllocation.targets;
  let oneWayExternalCursor = 0;
  const oneWayCounters = new Map();
  const rowSeedOffset = gridRowIds.length ? ((Math.random() * gridRowIds.length) | 0) : 0;
  const colSeedOffset = gridColIds.length ? ((Math.random() * gridColIds.length) | 0) : 0;
  const rowAllocation = buildWeightedBandAllocation(gridRowIds, gridRowBands, Math.ceil(particles.length * 0.5));
  const colAllocation = buildWeightedBandAllocation(gridColIds, gridColBands, Math.floor(particles.length * 0.5));
  const rowOrder = rowAllocation.order;
  const rowTargets = rowAllocation.targets;
  const colOrder = colAllocation.order;
  const colTargets = colAllocation.targets;
  let rowCursor = 0;
  let colCursor = 0;
  const rowCounters = new Map();
  const colCounters = new Map();
  const normalExternalCount = Math.max(0, particles.length - internalTargetCount);
  let normalExternalCursor = 0;
  let normalInternalCursor = 0;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const useInternal = internalAssigned < internalTargetCount && interiorPointIndices.length > 0;
    p.isInternal = useInternal;
    if (useInternal) internalAssigned++;
    p.internalDepth = p.isInternal ? (0.68 + Math.random() * 0.22) : 1;
    p.batchId = i % Math.max(1, shapeBatches.length);
    const batch = shapeBatches[p.batchId];
    let idx = batch?.length ? batch[(Math.random() * batch.length) | 0] : ((Math.random() * currentShapePoints.length) | 0);
    if (p.isInternal) {
      idx = interiorPointIndices[(Math.random() * interiorPointIndices.length) | 0];
    } else if (surfaceExternalOnly && surfacePointIndices.length) {
      idx = pickRandomSurfaceIndex(idx);
    }
    if (movementMode === "face-cover" && surfacePointIndices.length) {
      if (!p.isInternal) {
        const t = Math.floor((i / Math.max(1, particles.length)) * surfacePointIndices.length);
        p.faceSlot = (surfaceSeedOffset + t) % surfacePointIndices.length;
        p.faceStep = (Math.random() < 0.5 ? 1 : -1) * (1 + ((Math.random() * 2) | 0));
        idx = surfacePointIndices[p.faceSlot];
      }
    } else if (movementMode === "normal") {
      const band = p.isInternal ? normalInternalOrbitIndices : normalExternalOrbitIndices;
      if (band && band.length) {
        if (p.isInternal) {
          const denom = Math.max(1, internalTargetCount);
          const slot = Math.floor((normalInternalCursor / denom) * band.length);
          normalInternalCursor++;
          idx = band[Math.max(0, Math.min(band.length - 1, slot))];
        } else {
          const denom = Math.max(1, normalExternalCount);
          const slot = Math.floor((normalExternalCursor / denom) * band.length);
          normalExternalCursor++;
          idx = band[Math.max(0, Math.min(band.length - 1, slot))];
        }
      }
      p.normalStep = 1;
    } else if (movementMode === "static-detail" && staticCoverageIndices.length) {
      if (!p.isInternal) {
        p.staticIndex = (staticSeedOffset + i) % staticCoverageIndices.length;
        idx = staticCoverageIndices[p.staticIndex];
      }
    } else if (faceOneWayActive && !p.isInternal && oneWayBandIds.length) {
      const bandId =
        oneWayOrder.length
          ? oneWayOrder[(oneWaySeedOffset + oneWayExternalCursor) % oneWayOrder.length]
          : oneWayBandIds[(oneWaySeedOffset + i) % oneWayBandIds.length];
      oneWayExternalCursor++;
      p.oneWayLane = bandId;
      const band = oneWayBands[p.oneWayLane];
      const seen = oneWayCounters.get(p.oneWayLane) || 0;
      oneWayCounters.set(p.oneWayLane, seen + 1);
      const targetForBand = Math.max(1, oneWayTargets.get(p.oneWayLane) || 1);
      p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
      p.oneWaySlot = p.oneWayOffset;
      p.oneWayStep = 1;
      idx = band[p.oneWaySlot];
    } else if ((movementMode === "one-way" || movementMode === "tornado") && (!p.isInternal || internalMovementMode === "match")) {
      if (movementMode === "tornado" && !p.isInternal && oneWayOrbitBandIds.length) {
        const bandPos = (oneWaySeedOffset + i) % oneWayOrbitBandIds.length;
        p.oneWayLane = oneWayOrbitBandIds[bandPos];
        const band = oneWayOrbitBands[p.oneWayLane];
        const seen = oneWayCounters.get(p.oneWayLane) || 0;
        oneWayCounters.set(p.oneWayLane, seen + 1);
        const targetForBand = Math.max(1, oneWayTargets.get(p.oneWayLane) || 1);
        p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.oneWaySlot = p.oneWayOffset;
        p.oneWayStep = 1;
        idx = band[p.oneWaySlot];
      } else if (p.isInternal && internalOrbitIndices.length) {
        const band = internalOrbitIndices;
        const seen = oneWayCounters.get(-1) || 0;
        oneWayCounters.set(-1, seen + 1);
        const targetForInternal = Math.max(1, internalTargetCount);
        p.oneWayLane = -1;
        p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForInternal) * band.length));
        p.oneWaySlot = p.oneWayOffset;
        p.oneWayStep = movementMode === "tornado" ? 1 : getTravelDirectionSign();
        idx = band[p.oneWaySlot];
      } else if (oneWayOrbitBandIds.length) {
        const bandId =
          oneWayOrder.length
            ? oneWayOrder[(oneWaySeedOffset + oneWayExternalCursor) % oneWayOrder.length]
            : oneWayOrbitBandIds[(oneWaySeedOffset + i) % oneWayOrbitBandIds.length];
        oneWayExternalCursor++;
        p.oneWayLane = bandId;
        const band = oneWayOrbitBands[p.oneWayLane];
        const seen = oneWayCounters.get(p.oneWayLane) || 0;
        oneWayCounters.set(p.oneWayLane, seen + 1);
        const targetForBand = Math.max(1, oneWayTargets.get(p.oneWayLane) || 1);
        p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.oneWaySlot = p.oneWayOffset;
        p.oneWayStep = movementMode === "tornado" ? 1 : getTravelDirectionSign();
        idx = band[p.oneWaySlot];
      }
    } else if (movementMode === "grid-travel" && (!p.isInternal || internalMovementMode === "match") && (gridRowIds.length || gridColIds.length)) {
      p.gridFamily = i % 2;
      if (p.gridFamily === 0 && gridRowIds.length) {
        const bandId =
          rowOrder.length
            ? rowOrder[(rowSeedOffset + rowCursor) % rowOrder.length]
            : gridRowIds[(rowSeedOffset + i) % gridRowIds.length];
        rowCursor++;
        p.gridBand = bandId;
        const band = gridRowBands[p.gridBand];
        const seen = rowCounters.get(p.gridBand) || 0;
        rowCounters.set(p.gridBand, seen + 1);
        const targetForBand = Math.max(1, rowTargets.get(p.gridBand) || 1);
        p.gridSlot = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.gridStep = p.gridBand % 2 === 0 ? 1 : -1;
        idx = band[Math.max(0, Math.min(band.length - 1, p.gridSlot))];
      } else if (gridColIds.length) {
        p.gridFamily = 1;
        const bandId =
          colOrder.length
            ? colOrder[(colSeedOffset + colCursor) % colOrder.length]
            : gridColIds[(colSeedOffset + i) % gridColIds.length];
        colCursor++;
        p.gridBand = bandId;
        const band = gridColBands[p.gridBand];
        const seen = colCounters.get(p.gridBand) || 0;
        colCounters.set(p.gridBand, seen + 1);
        const targetForBand = Math.max(1, colTargets.get(p.gridBand) || 1);
        p.gridSlot = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.gridStep = p.gridBand % 2 === 0 ? 1 : -1;
        idx = band[Math.max(0, Math.min(band.length - 1, p.gridSlot))];
      }
    } else if (movementMode === "alternate-lines" && (!p.isInternal || internalMovementMode === "match") && alternateLineIds.length) {
      const bandId =
        lineOrder.length
          ? lineOrder[(lineSeedOffset + lineCursor) % lineOrder.length]
          : alternateLineIds[(lineSeedOffset + i) % alternateLineIds.length];
      lineCursor++;
      p.lineBand = bandId;
      const band = alternateLineBands[p.lineBand];
      const seen = lineCounters.get(p.lineBand) || 0;
      lineCounters.set(p.lineBand, seen + 1);
      const targetForBand = Math.max(1, lineTargets.get(p.lineBand) || 1);
      p.lineSlot = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
      p.lineStep = p.lineBand % 2 === 0 ? 1 : -1;
      idx = band[Math.max(0, Math.min(band.length - 1, p.lineSlot))];
    }
    if (!p.isInternal && surfaceExternalOnly && surfacePointIndices.length) {
      idx = ensureSurfaceIndex(idx, idx);
    }
    p.currentIndex = idx;
    p.prevIndex = -1;
    p.radialDir = (Math.random() * 4) | 0;
    p.nextIndex = chooseNextIndex(p);
    p.segmentT = movementMode === "one-way" || movementMode === "tornado" || faceOneWayActive ? 0 : Math.random();
    p.anchor.copy(currentShapePoints[idx]);
    if (p.isInternal) p.anchor.multiplyScalar(p.internalDepth);
    p.pos.copy(p.anchor);
    p.sepVel.set(0, 0, 0);
    randomParticleMotion(p);
  }

  group.position.set(0, 0, 0);
  controls.target.set(0, 0, 0);
  writeInstances();
}

let customImagePoints = null;
let customMeshPoints = null;
let customImageFile = null;
let customMeshFile = null;
let resampleRequestId = 0;

function applyPresetFromSelect() {
  const selected = shapeSelect.value;

  if (selected === "custom-image") {
    if (!customImagePoints) {
      setStatus("Upload an image first, then choose Custom Image.", true);
      return;
    }
    applyBasePoints(customImagePoints, true, false);
    setStatus("Applied custom image shape.");
    return;
  }

  if (selected === "custom-mesh") {
    if (!customMeshPoints) {
      setStatus("Upload a mesh first, then choose Custom Mesh.", true);
      return;
    }
    applyBasePoints(customMeshPoints, true, true);
    setStatus("Applied custom mesh shape.");
    return;
  }

  applyBasePoints(buildPresetShapePoints(selected, sphereCount, baseShapeRadius), false, false);
  setStatus(`Applied preset: ${selected}.`);
}

function applyGridToggle() {
  gridEnabled = gridEnabledInput?.checked ?? true;
  if (!gridEnabled) {
    clearImportCage();
    setStatus("Grid hidden.");
    return;
  }
  applyPresetFromSelect();
}

function applyGridLineColor() {
  gridLineColor = gridColorInput?.value || gridLineColor;
  for (let i = 0; i < importCageGroup.children.length; i++) {
    const child = importCageGroup.children[i];
    if (child?.material?.color) {
      child.material.color.set(gridLineColor);
      child.material.needsUpdate = true;
    }
  }
}

const pointerNdc = new THREE.Vector2(99, 99);
let cursorActive = false;

function updatePointer(clientX, clientY) {
  pointerNdc.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNdc.y = -(clientY / window.innerHeight) * 2 + 1;
  cursorActive = true;
}

window.addEventListener("pointermove", (e) => updatePointer(e.clientX, e.clientY));
window.addEventListener("mousemove", (e) => updatePointer(e.clientX, e.clientY));
window.addEventListener("pointerleave", () => {
  pointerNdc.set(99, 99);
  cursorActive = false;
});
window.addEventListener("mouseleave", () => {
  pointerNdc.set(99, 99);
  cursorActive = false;
});

imageInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  customImageFile = file;
  const url = URL.createObjectURL(file);
  setStatus("Loading image shape...");
  try {
    const points = await buildPointsFromImageUrl(url, sphereCount);
    customImagePoints = points;
    customImageOption.disabled = false;
    shapeSelect.value = "custom-image";
    applyPresetFromSelect();
    setStatus(`Image loaded: ${file.name}`);
  } catch (err) {
    console.error(err);
    setStatus("Could not build shape from that image.", true);
  } finally {
    URL.revokeObjectURL(url);
  }
});

meshInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  customMeshFile = file;
  setStatus("Loading mesh shape...");
  try {
    const points = await buildPointsFromMeshFile(file, sphereCount, baseShapeRadius);
    customMeshPoints = points;
    customMeshOption.disabled = false;
    shapeSelect.value = "custom-mesh";
    applyPresetFromSelect();
    setStatus(`Mesh loaded: ${file.name}`);
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Could not build shape from that mesh.", true);
  }
});

shapeSelect.addEventListener("change", applyPresetFromSelect);

sphereColorInput.addEventListener("input", (e) => {
  materialControls.color = e.target.value;
  applyMaterialControls();
});

internalColorInput?.addEventListener("input", (e) => {
  materialControls.internalColor = e.target.value;
  applyMaterialControls();
});
internalDetailShadingInput?.addEventListener("change", applyMaterialControls);
sphereShadowsInput?.addEventListener("change", applyMaterialControls);

sphereOpacityInput.addEventListener("input", (e) => {
  materialControls.opacity = Number(e.target.value);
  applyMaterialControls();
});

sphereGlareInput.addEventListener("input", (e) => {
  materialControls.glare = Number(e.target.value);
  applyMaterialControls();
});

sphereMatteInput?.addEventListener("input", (e) => {
  materialControls.matte = Number(e.target.value);
  applyMaterialControls();
});

internalMatteInput?.addEventListener("input", (e) => {
  materialControls.internalMatte = Number(e.target.value);
  applyMaterialControls();
});

sphereGlowInput.addEventListener("input", (e) => {
  materialControls.glow = Number(e.target.value);
  applyMaterialControls();
});

async function rebuildImportedPointsForCurrentSelection(nextCount) {
  const selected = shapeSelect.value;
  const requestId = resampleRequestId;

  if (selected === "custom-image" && customImageFile) {
    const url = URL.createObjectURL(customImageFile);
    setStatus("Resampling image shape...");
    try {
      const points = await buildPointsFromImageUrl(url, nextCount);
      if (requestId !== resampleRequestId) return;
      customImagePoints = points;
    } catch (err) {
      console.error(err);
      setStatus("Could not resample custom image shape.", true);
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }

  if (selected === "custom-mesh" && customMeshFile) {
    setStatus("Resampling mesh shape...");
    try {
      const points = await buildPointsFromMeshFile(customMeshFile, nextCount, baseShapeRadius);
      if (requestId !== resampleRequestId) return;
      customMeshPoints = points;
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Could not resample custom mesh shape.", true);
    }
  }
}

async function applyCountSliders() {
  externalCount = Number(externalCountInput?.value) || 0;
  internalCount = Number(internalCountInput?.value) || 0;
  const nextCount = Math.max(0, externalCount + internalCount);
  const requestId = ++resampleRequestId;
  rebuildSpheres(nextCount);
  await rebuildImportedPointsForCurrentSelection(nextCount);
  if (requestId !== resampleRequestId) return;
  applyPresetFromSelect();
  setStatus(`Counts: ext ${externalCount}, int ${internalCount} (total ${nextCount})`);
}

externalCountInput?.addEventListener("input", applyCountSliders);
internalCountInput?.addEventListener("input", applyCountSliders);

function applyMovementMode() {
  movementMode = movementModeInput?.value || "normal";
  internalMovementMode = internalMovementInput?.value || "normal";
  if (movementMode === "alternate-lines" || movementMode === "grid-travel" || movementMode === "face-cover") {
    movementMode = "normal";
    if (movementModeInput) movementModeInput.value = "normal";
  }
  if (movementMode === "one-way") {
    movementMode = "tornado";
    if (movementModeInput) movementModeInput.value = "tornado";
  }
  oneWayDirection = "right";
  if (currentShapePoints.length) rebuildOneWayLanes(currentShapePoints);
  if (currentShapePoints.length) rebuildOneWayOrbit(currentShapePoints);
  if (currentShapePoints.length) rebuildFaceHorizontalOrbit(currentShapePoints);
  if (movementMode === "one-way" || movementMode === "tornado" || movementMode === "face-one-way") oneWayGlobalCursor = 0;
  const surfaceSeedOffset = surfacePointIndices.length ? ((Math.random() * surfacePointIndices.length) | 0) : 0;
  const staticSeedOffset = staticCoverageIndices.length ? ((Math.random() * staticCoverageIndices.length) | 0) : 0;
  const lineSeedOffset = alternateLineIds.length ? ((Math.random() * alternateLineIds.length) | 0) : 0;
  const lineAllocation = buildWeightedBandAllocation(alternateLineIds, alternateLineBands, particles.length);
  const lineOrder = lineAllocation.order;
  const lineTargets = lineAllocation.targets;
  let lineCursor = 0;
  const lineCounters = new Map();
  const internalTargetCount = interiorPointIndices.length ? Math.min(internalCount, particles.length) : 0;
  let internalAssigned = 0;
  const oneWaySeedOffset = 0;
  const faceOneWayActive = movementMode === "face-one-way" && surfaceExternalOnly;
  const oneWayBandIds = faceOneWayActive ? faceHorizontalOrbitBandIds : oneWayOrbitBandIds;
  const oneWayBands = faceOneWayActive ? faceHorizontalOrbitBands : oneWayOrbitBands;
  const oneWayExternalCount = Math.max(0, particles.length - internalTargetCount);
  const oneWayAllocation = buildWeightedBandAllocation(oneWayBandIds, oneWayBands, oneWayExternalCount);
  const oneWayOrder = oneWayAllocation.order;
  const oneWayTargets = oneWayAllocation.targets;
  let oneWayExternalCursor = 0;
  const oneWayCounters = new Map();
  const rowSeedOffset = gridRowIds.length ? ((Math.random() * gridRowIds.length) | 0) : 0;
  const colSeedOffset = gridColIds.length ? ((Math.random() * gridColIds.length) | 0) : 0;
  const rowAllocation = buildWeightedBandAllocation(gridRowIds, gridRowBands, Math.ceil(particles.length * 0.5));
  const colAllocation = buildWeightedBandAllocation(gridColIds, gridColBands, Math.floor(particles.length * 0.5));
  const rowOrder = rowAllocation.order;
  const rowTargets = rowAllocation.targets;
  const colOrder = colAllocation.order;
  const colTargets = colAllocation.targets;
  let rowCursor = 0;
  let colCursor = 0;
  const rowCounters = new Map();
  const colCounters = new Map();
  const normalExternalCount = Math.max(0, particles.length - internalTargetCount);
  let normalExternalCursor = 0;
  let normalInternalCursor = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const useInternal = internalAssigned < internalTargetCount && interiorPointIndices.length > 0;
    p.isInternal = useInternal;
    if (useInternal) internalAssigned++;
    p.internalDepth = p.isInternal ? (0.68 + Math.random() * 0.22) : 1;
    if (movementMode === "face-cover" && surfacePointIndices.length) {
      if (p.isInternal) {
        p.currentIndex = interiorPointIndices[(Math.random() * interiorPointIndices.length) | 0];
        p.anchor.copy(currentShapePoints[p.currentIndex]);
        p.pos.lerp(p.anchor, 0.55);
      } else {
      const t = Math.floor((i / Math.max(1, particles.length)) * surfacePointIndices.length);
      p.faceSlot = (surfaceSeedOffset + t) % surfacePointIndices.length;
      p.faceStep = (Math.random() < 0.5 ? 1 : -1) * (1 + ((Math.random() * 2) | 0));
      p.currentIndex = surfacePointIndices[p.faceSlot];
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      p.pos.lerp(p.anchor, 0.55);
      }
    } else if (movementMode === "normal") {
      const band = p.isInternal ? normalInternalOrbitIndices : normalExternalOrbitIndices;
      if (band && band.length) {
        if (p.isInternal) {
          const denom = Math.max(1, internalTargetCount);
          const slot = Math.floor((normalInternalCursor / denom) * band.length);
          normalInternalCursor++;
          p.currentIndex = band[Math.max(0, Math.min(band.length - 1, slot))];
        } else {
          const denom = Math.max(1, normalExternalCount);
          const slot = Math.floor((normalExternalCursor / denom) * band.length);
          normalExternalCursor++;
          p.currentIndex = band[Math.max(0, Math.min(band.length - 1, slot))];
        }
      }
      p.normalStep = 1;
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      if (p.isInternal) p.anchor.multiplyScalar(p.internalDepth);
      p.pos.lerp(p.anchor, 0.55);
    } else if (movementMode === "static-detail" && staticCoverageIndices.length) {
      if (p.isInternal) {
        p.currentIndex = interiorPointIndices[(Math.random() * interiorPointIndices.length) | 0];
      } else {
      p.staticIndex = (staticSeedOffset + i) % staticCoverageIndices.length;
      p.currentIndex = staticCoverageIndices[p.staticIndex];
      }
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      if (p.isInternal) p.anchor.multiplyScalar(p.internalDepth);
      p.pos.copy(p.anchor);
    } else if (faceOneWayActive && !p.isInternal && oneWayBandIds.length) {
      const bandId =
        oneWayOrder.length
          ? oneWayOrder[(oneWaySeedOffset + oneWayExternalCursor) % oneWayOrder.length]
          : oneWayBandIds[(oneWaySeedOffset + i) % oneWayBandIds.length];
      oneWayExternalCursor++;
      p.oneWayLane = bandId;
      const band = oneWayBands[p.oneWayLane];
      const seen = oneWayCounters.get(p.oneWayLane) || 0;
      oneWayCounters.set(p.oneWayLane, seen + 1);
      const targetForBand = Math.max(1, oneWayTargets.get(p.oneWayLane) || 1);
      p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
      p.oneWaySlot = p.oneWayOffset;
      p.oneWayStep = 1;
      p.currentIndex = band[p.oneWaySlot];
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      p.pos.lerp(p.anchor, 0.55);
      p.segmentT = 0;
    } else if ((movementMode === "one-way" || movementMode === "tornado") && (!p.isInternal || internalMovementMode === "match")) {
      if (movementMode === "tornado" && !p.isInternal && oneWayOrbitBandIds.length) {
        const bandPos = (oneWaySeedOffset + i) % oneWayOrbitBandIds.length;
        p.oneWayLane = oneWayOrbitBandIds[bandPos];
        const band = oneWayOrbitBands[p.oneWayLane];
        const seen = oneWayCounters.get(p.oneWayLane) || 0;
        oneWayCounters.set(p.oneWayLane, seen + 1);
        const targetForBand = Math.max(1, oneWayTargets.get(p.oneWayLane) || 1);
        p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.oneWaySlot = p.oneWayOffset;
        p.oneWayStep = 1;
        p.currentIndex = band[p.oneWaySlot];
        p.anchor.copy(currentShapePoints[p.currentIndex]);
        if (p.isInternal) p.anchor.multiplyScalar(p.internalDepth);
        p.pos.lerp(p.anchor, 0.55);
        p.segmentT = 0;
      } else if (p.isInternal && internalOrbitIndices.length) {
        const band = internalOrbitIndices;
        const seen = oneWayCounters.get(-1) || 0;
        oneWayCounters.set(-1, seen + 1);
        const targetForInternal = Math.max(1, internalTargetCount);
        p.oneWayLane = -1;
        p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForInternal) * band.length));
        p.oneWaySlot = p.oneWayOffset;
        p.oneWayStep = movementMode === "tornado" ? 1 : getTravelDirectionSign();
        p.currentIndex = band[p.oneWaySlot];
        p.anchor.copy(currentShapePoints[p.currentIndex]);
        p.anchor.multiplyScalar(p.internalDepth);
        p.pos.lerp(p.anchor, 0.55);
        p.segmentT = 0;
      } else if (oneWayOrbitBandIds.length) {
        const bandId =
          oneWayOrder.length
            ? oneWayOrder[(oneWaySeedOffset + oneWayExternalCursor) % oneWayOrder.length]
            : oneWayOrbitBandIds[(oneWaySeedOffset + i) % oneWayOrbitBandIds.length];
        oneWayExternalCursor++;
        p.oneWayLane = bandId;
        const band = oneWayOrbitBands[p.oneWayLane];
        const seen = oneWayCounters.get(p.oneWayLane) || 0;
        oneWayCounters.set(p.oneWayLane, seen + 1);
        const targetForBand = Math.max(1, oneWayTargets.get(p.oneWayLane) || 1);
        p.oneWayOffset = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.oneWaySlot = p.oneWayOffset;
        p.oneWayStep = movementMode === "tornado" ? 1 : getTravelDirectionSign();
        p.currentIndex = band[p.oneWaySlot];
        p.anchor.copy(currentShapePoints[p.currentIndex]);
        p.pos.lerp(p.anchor, 0.55);
        p.segmentT = 0;
      }
    } else if (movementMode === "grid-travel" && (!p.isInternal || internalMovementMode === "match") && (gridRowIds.length || gridColIds.length)) {
      p.gridFamily = i % 2;
      if (p.gridFamily === 0 && gridRowIds.length) {
        const bandId =
          rowOrder.length
            ? rowOrder[(rowSeedOffset + rowCursor) % rowOrder.length]
            : gridRowIds[(rowSeedOffset + i) % gridRowIds.length];
        rowCursor++;
        p.gridBand = bandId;
        const band = gridRowBands[p.gridBand];
        const seen = rowCounters.get(p.gridBand) || 0;
        rowCounters.set(p.gridBand, seen + 1);
        const targetForBand = Math.max(1, rowTargets.get(p.gridBand) || 1);
        p.gridSlot = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.gridStep = p.gridBand % 2 === 0 ? 1 : -1;
        p.currentIndex = band[Math.max(0, Math.min(band.length - 1, p.gridSlot))];
      } else if (gridColIds.length) {
        p.gridFamily = 1;
        const bandId =
          colOrder.length
            ? colOrder[(colSeedOffset + colCursor) % colOrder.length]
            : gridColIds[(colSeedOffset + i) % gridColIds.length];
        colCursor++;
        p.gridBand = bandId;
        const band = gridColBands[p.gridBand];
        const seen = colCounters.get(p.gridBand) || 0;
        colCounters.set(p.gridBand, seen + 1);
        const targetForBand = Math.max(1, colTargets.get(p.gridBand) || 1);
        p.gridSlot = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
        p.gridStep = p.gridBand % 2 === 0 ? 1 : -1;
        p.currentIndex = band[Math.max(0, Math.min(band.length - 1, p.gridSlot))];
      }
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      if (p.isInternal) p.anchor.multiplyScalar(p.internalDepth);
      p.pos.lerp(p.anchor, 0.55);
    } else if (movementMode === "alternate-lines" && (!p.isInternal || internalMovementMode === "match") && alternateLineIds.length) {
      const bandId =
        lineOrder.length
          ? lineOrder[(lineSeedOffset + lineCursor) % lineOrder.length]
          : alternateLineIds[(lineSeedOffset + i) % alternateLineIds.length];
      lineCursor++;
      p.lineBand = bandId;
      const band = alternateLineBands[p.lineBand];
      const seen = lineCounters.get(p.lineBand) || 0;
      lineCounters.set(p.lineBand, seen + 1);
      const targetForBand = Math.max(1, lineTargets.get(p.lineBand) || 1);
      p.lineSlot = Math.min(band.length - 1, Math.floor((seen / targetForBand) * band.length));
      p.lineStep = p.lineBand % 2 === 0 ? 1 : -1;
      p.currentIndex = band[Math.max(0, Math.min(band.length - 1, p.lineSlot))];
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      if (p.isInternal) p.anchor.multiplyScalar(p.internalDepth);
      p.pos.lerp(p.anchor, 0.55);
    }
    if (!p.isInternal && surfaceExternalOnly && surfacePointIndices.length) {
      p.currentIndex = ensureSurfaceIndex(p.currentIndex, p.currentIndex);
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      p.pos.lerp(p.anchor, 0.55);
    }
    p.prevIndex = -1;
    p.radialDir = (Math.random() * 4) | 0;
    p.nextIndex = chooseNextIndex(p);
    p.sepVel.set(0, 0, 0);
    randomParticleMotion(p);
  }
  const modeLabel =
    movementMode === "face-cover"
      ? "Face Cover"
      : movementMode === "radial-4"
        ? "Radial 4-Way"
        : movementMode === "face-one-way"
          ? (surfaceExternalOnly ? "Face One-Way Horizontal" : "Face One-Way (enable Face Only)")
        : movementMode === "one-way"
          ? `One Way (${oneWayDirection})`
          : movementMode === "tornado"
            ? "Tornado"
          : movementMode === "alternate-lines"
            ? "Alternate Lines"
            : movementMode === "static-detail"
              ? "Static Detail"
            : movementMode === "grid-travel"
              ? "Grid Travel"
              : movementMode === "football-pattern"
                ? "Football Pattern"
                : movementMode === "basketball-pattern"
                ? "Basketball Pattern"
            : "Normal";
  const innerLabel =
    internalMovementMode === "match"
      ? "Match Outer"
      : internalMovementMode === "static"
        ? "Static"
        : "Normal";
  setStatus(`Movement mode: ${modeLabel} | Inner: ${innerLabel}`);
}

function round4(n) {
  return Number(n.toFixed(4));
}

function buildExportSnapshot() {
  const external = [];
  const internal = [];
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const dst = p.isInternal ? internal : external;
    dst.push([round4(p.pos.x), round4(p.pos.y), round4(p.pos.z)]);
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    shape: {
      name: shapeSelect?.value || "custom",
      scale: round4(shapeScale),
      movementMode
    },
    render: {
      externalSize: round4(motionControls.externalSize),
      internalSize: round4(motionControls.internalSize),
      externalColor: materialControls.color,
      internalColor: materialControls.internalColor,
      opacity: round4(materialControls.opacity)
    },
    points: { external, internal }
  };
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildWebflowEmbedHtml(payload) {
  const payloadText = JSON.stringify(payload);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    html,body,#shape-object{margin:0;width:100%;height:100%}
    body{overflow:hidden;background:transparent}
    #shape-object canvas{display:block}
  </style>
</head>
<body>
  <div id="shape-object"></div>
  <script src="https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js"></script>
  <script>
  (() => {
    const payload = ${payloadText};
    const container = document.getElementById("shape-object");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.28));
    const topLight = new THREE.DirectionalLight(0xffffff, 2.2);
    topLight.position.set(0, 16, 0);
    scene.add(topLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(7, 9, 6);
    scene.add(keyLight);

    const group = new THREE.Group();
    scene.add(group);
    const geo = new THREE.SphereGeometry(0.1, 14, 12);

    const extMat = new THREE.MeshStandardMaterial({
      color: payload.render.externalColor,
      transparent: payload.render.opacity < 0.999,
      opacity: payload.render.opacity,
      roughness: 0.62,
      metalness: 0.12
    });
    const intMat = new THREE.MeshStandardMaterial({
      color: payload.render.internalColor,
      transparent: payload.render.opacity < 0.999,
      opacity: payload.render.opacity,
      roughness: 0.62,
      metalness: 0.12
    });

    function buildInstances(points, material, scale) {
      const mesh = new THREE.InstancedMesh(geo, material, Math.max(1, points.length));
      const dummy = new THREE.Object3D();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        dummy.position.set(p[0], p[1], p[2]);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.count = points.length;
      mesh.instanceMatrix.needsUpdate = true;
      return mesh;
    }

    group.add(buildInstances(payload.points.external, extMat, payload.render.externalSize || 1));
    group.add(buildInstances(payload.points.internal, intMat, payload.render.internalSize || 1));

    function onResize() {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    onResize();
    window.addEventListener("resize", onResize);

    function animate(t) {
      const s = t * 0.001;
      group.rotation.y = s * 0.16;
      group.rotation.x = Math.sin(s * 0.3) * 0.05;
      group.rotation.z = Math.sin(s * 0.22) * 0.03;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
  </script>
</body>
</html>`;
}

function exportSnapshotJson() {
  const payload = buildExportSnapshot();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadTextFile(`shape-object-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");
  setStatus("Exported shape snapshot JSON.");
}

function exportWebflowEmbed() {
  const payload = buildExportSnapshot();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const html = buildWebflowEmbedHtml(payload);
  downloadTextFile(`webflow-shape-embed-${stamp}.html`, html, "text/html");
  setStatus("Exported Webflow embed HTML.");
}

exportDataBtn?.addEventListener("click", exportSnapshotJson);
exportWebflowBtn?.addEventListener("click", exportWebflowEmbed);

function retuneAllParticles() {
  readMotionControls();
  for (let i = 0; i < particles.length; i++) {
    randomParticleMotion(particles[i]);
  }
}

travelSpeedInput?.addEventListener("input", retuneAllParticles);
externalSizeInput?.addEventListener("input", readMotionControls);
internalSpeedInput?.addEventListener("input", retuneAllParticles);
internalSizeInput?.addEventListener("input", readMotionControls);
sphereGapInput?.addEventListener("input", readMotionControls);
cursorSizeInput?.addEventListener("input", readMotionControls);
cursorForceInput?.addEventListener("input", readMotionControls);
cursorLinkDistanceInput?.addEventListener("input", readMotionControls);
cursorLineColorInput?.addEventListener("input", () => {
  cursorLinkMaterial.color.set(cursorLineColorInput.value);
});
gridColorInput?.addEventListener("input", () => {
  applyGridLineColor();
  if (gridEnabled && currentShapePoints.length) applyPresetFromSelect();
});
faceMinTravelInput?.addEventListener("input", () => {
  faceMinTravel = Number(faceMinTravelInput.value) || faceMinTravel;
  if (currentShapePoints.length) rebuildFaceHorizontalOrbit(currentShapePoints);
  if (movementMode === "face-one-way") applyMovementMode();
});
collisionEnabledInput?.addEventListener("change", () => {
  collisionEnabled = collisionEnabledInput.checked;
  setStatus(collisionEnabled ? "Collision enabled." : "Collision disabled.");
});
movementModeInput?.addEventListener("change", applyMovementMode);
internalMovementInput?.addEventListener("change", applyMovementMode);
gridEnabledInput?.addEventListener("change", applyGridToggle);
shapeScaleInput?.addEventListener("input", () => {
  shapeScale = Number(shapeScaleInput.value) || 1;
  applyPresetFromSelect();
  setStatus(`Shape scale: ${shapeScale.toFixed(2)}x`);
});
surfaceExternalOnlyInput?.addEventListener("change", () => {
  surfaceExternalOnly = surfaceExternalOnlyInput.checked;
  applyMovementMode();
  setStatus(surfaceExternalOnly ? "Face-only mapping enabled for external spheres." : "Face-only mapping disabled.");
});

const clock = new THREE.Clock();
const tempPointA = new THREE.Vector3();
const tempPointB = new THREE.Vector3();
const tempPointC = new THREE.Vector3();
const tempShadowCenter = new THREE.Vector3();
const axisX = new THREE.Vector3(1, 0, 0);
const axisY = new THREE.Vector3(0, 1, 0);
const axisZ = new THREE.Vector3(0, 0, 1);
const tempProjected = new THREE.Vector3();
const tempCamRight = new THREE.Vector3();
const tempCamUp = new THREE.Vector3();
const tempWorldPush = new THREE.Vector3();
const tempSeparate = new THREE.Vector3();
const tempClampOffset = new THREE.Vector3();
const tempCursorWorld = new THREE.Vector3();
const tempCursorLocal = new THREE.Vector3();
const tempCameraForward = new THREE.Vector3();
const cursorRaycaster = new THREE.Raycaster();
const cursorPlane = new THREE.Plane();
const separationGrid = new Map();

function enforceParticleSeparation(dt = 1, strength = 1) {
  const minParticleDistance = Math.max(0.02, motionControls.sphereGap || 0.19);
  const minParticleDistanceSq = minParticleDistance * minParticleDistance;
  const separationCellSize = minParticleDistance * 1.35;
  const sepStrength = Math.max(0.05, Math.min(1.5, strength));
  const damping = 0.78;
  const maxStep = minParticleDistance * 0.36;
  separationGrid.clear();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i].pos;
    const cx = Math.floor(p.x / separationCellSize);
    const cy = Math.floor(p.y / separationCellSize);
    const cz = Math.floor(p.z / separationCellSize);
    const key = `${cx},${cy},${cz}`;
    let list = separationGrid.get(key);
    if (!list) {
      list = [];
      separationGrid.set(key, list);
    }
    list.push(i);
  }

  for (let i = 0; i < particles.length; i++) {
    const pi = particles[i].pos;
    const cx = Math.floor(pi.x / separationCellSize);
    const cy = Math.floor(pi.y / separationCellSize);
    const cz = Math.floor(pi.z / separationCellSize);

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        for (let oz = -1; oz <= 1; oz++) {
          const key = `${cx + ox},${cy + oy},${cz + oz}`;
          const list = separationGrid.get(key);
          if (!list) continue;

          for (let k = 0; k < list.length; k++) {
            const j = list[k];
            if (j <= i) continue;

            const pj = particles[j].pos;
            tempSeparate.copy(pi).sub(pj);
            const distSq = tempSeparate.lengthSq();
            if (distSq >= minParticleDistanceSq) continue;

            let dist = Math.sqrt(distSq);
            if (dist < 0.00001) {
              tempSeparate.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
              dist = 0.00001;
            } else {
              tempSeparate.multiplyScalar(1 / dist);
            }

            const push = (minParticleDistance - dist) * 0.5 * sepStrength;
            particles[i].sepVel.addScaledVector(tempSeparate, push);
            particles[j].sepVel.addScaledVector(tempSeparate, -push);
          }
        }
      }
    }
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.sepVel) continue;
    p.sepVel.multiplyScalar(Math.pow(damping, Math.max(0.5, dt * 60)));
    const len = p.sepVel.length();
    if (len > maxStep && len > 0.000001) {
      p.sepVel.multiplyScalar(maxStep / len);
    }
    p.pos.add(p.sepVel);
  }
}

function clearCursorLinks() {
  cursorLinkGeometry.setDrawRange(0, 0);
}

function updateCursorLinks(hasCursor) {
  if (!hasCursor || !particles.length) {
    clearCursorLinks();
    return;
  }

  group.getWorldPosition(tempShadowCenter);
  camera.getWorldDirection(tempCameraForward);
  cursorPlane.setFromNormalAndCoplanarPoint(tempCameraForward, tempShadowCenter);
  cursorRaycaster.setFromCamera(pointerNdc, camera);
  if (!cursorRaycaster.ray.intersectPlane(cursorPlane, tempCursorWorld)) {
    clearCursorLinks();
    return;
  }

  tempCursorLocal.copy(tempCursorWorld);
  group.worldToLocal(tempCursorLocal);

  const maxDist = Math.max(0.001, motionControls.cursorLinkDistance);
  const maxDistSq = maxDist * maxDist;
  const bestDist = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const bestIdx = [-1, -1, -1];

  for (let i = 0; i < particles.length; i++) {
    const d = tempCursorLocal.distanceToSquared(particles[i].pos);
    if (d > maxDistSq) continue;
    if (d >= bestDist[maxCursorLinks - 1]) continue;
    for (let k = 0; k < maxCursorLinks; k++) {
      if (d < bestDist[k]) {
        for (let s = maxCursorLinks - 1; s > k; s--) {
          bestDist[s] = bestDist[s - 1];
          bestIdx[s] = bestIdx[s - 1];
        }
        bestDist[k] = d;
        bestIdx[k] = i;
        break;
      }
    }
  }

  let lineCount = 0;
  for (let i = 0; i < maxCursorLinks; i++) {
    const idx = bestIdx[i];
    if (idx < 0) continue;
    const p = particles[idx].pos;
    const base = lineCount * 6;
    cursorLinkPositions[base + 0] = tempCursorLocal.x;
    cursorLinkPositions[base + 1] = tempCursorLocal.y;
    cursorLinkPositions[base + 2] = tempCursorLocal.z;
    cursorLinkPositions[base + 3] = p.x;
    cursorLinkPositions[base + 4] = p.y;
    cursorLinkPositions[base + 5] = p.z;
    lineCount++;
  }

  cursorLinkGeometry.attributes.position.needsUpdate = true;
  cursorLinkGeometry.setDrawRange(0, lineCount * 2);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const hasCursor2D = cursorActive && Math.abs(pointerNdc.x) <= 1.2 && Math.abs(pointerNdc.y) <= 1.2;
  const repelRadiusNdc = 0.09 + motionControls.cursorSize * 0.095;
  const repelStrength = motionControls.cursorForce * 2.2;
  const maxOutlineOffset = 0.34;
  const faceOneWayActive = movementMode === "face-one-way" && surfaceExternalOnly;
  const oneWayBandIds = faceOneWayActive ? faceHorizontalOrbitBandIds : oneWayOrbitBandIds;
  const oneWayBands = faceOneWayActive ? faceHorizontalOrbitBands : oneWayOrbitBands;
  const oneWayLikeMode =
    movementMode === "one-way" || movementMode === "tornado" || faceOneWayActive;
  const tornadoDirectionSign = 1;
  const oneWayFlowSpeedBase = 0.45 + motionControls.travelSpeed * 0.02;
  const oneWayFlowSpeed =
    movementMode === "tornado" || faceOneWayActive
      ? (0.05 + motionControls.travelSpeed * 0.008)
      : oneWayFlowSpeedBase;
  if (oneWayLikeMode) {
    oneWayGlobalCursor = (oneWayGlobalCursor + oneWayFlowSpeed * dt) % 1000000;
  }
  group.getWorldPosition(tempShadowCenter);
  sharedShadowCenter.value.copy(tempShadowCenter);
  sharedShadowLightDir.value.copy(topLight.position).sub(tempShadowCenter).normalize();

  if (hasCursor2D) {
    tempCamRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    tempCamUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    const particleOneWayMode = oneWayLikeMode && (
      (faceOneWayActive
        ? (!p.isInternal && oneWayBandIds.length > 0)
        : (
          (movementMode === "tornado"
            ? (p.isInternal
                ? (internalMovementMode === "match" && internalOrbitIndices.length > 1)
                : oneWayBandIds.length > 0)
            : false) ||
          (p.isInternal
            ? (internalMovementMode === "match" && internalOrbitIndices.length > 1)
            : oneWayBandIds.length > 0)
        ))
    );

    if (movementMode === "static-detail" && staticCoverageIndices.length && !p.isInternal) {
      p.currentIndex = staticCoverageIndices[p.staticIndex % staticCoverageIndices.length];
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      p.pos.copy(p.anchor);
      continue;
    }

    if (surfaceExternalOnly && !p.isInternal && surfacePointIndices.length && !surfacePointMask[p.currentIndex]) {
      p.currentIndex = pickRandomSurfaceIndex(p.currentIndex);
      p.prevIndex = -1;
      p.nextIndex = faceOneWayActive ? chooseNextIndexOneWay(p) : chooseNextIndexSurfaceOnly(p);
      p.segmentT = 0;
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      p.pos.copy(p.anchor);
    } else if (movementMode === "face-cover" && surfacePointIndices.length && !surfacePointMask[p.currentIndex]) {
      p.currentIndex = surfacePointIndices[(Math.random() * surfacePointIndices.length) | 0];
      p.prevIndex = -1;
      p.nextIndex = chooseNextIndexFaceCover(p);
      p.segmentT = 0;
      p.anchor.copy(currentShapePoints[p.currentIndex]);
      p.pos.copy(p.anchor);
    } else if (movementMode === "alternate-lines" && alternateLineIds.length) {
      const band = alternateLineBands[p.lineBand];
      if (!band || band.length === 0) {
        p.lineBand = alternateLineIds[(Math.random() * alternateLineIds.length) | 0];
        p.lineSlot = 0;
      }
    } else if (particleOneWayMode) {
      const band = faceOneWayActive && !p.isInternal ? getFaceHorizontalBandForParticle(p) : getOrbitBandForParticle(p);
      if (!band || band.length < 2) {
        const useExternalBand = !p.isInternal;
        if (useExternalBand) {
          p.oneWayLane = oneWayBandIds[(Math.random() * oneWayBandIds.length) | 0];
          const nextBand = oneWayBands[p.oneWayLane];
          p.oneWayOffset = Math.min(nextBand.length - 1, Math.max(0, p.oneWayOffset));
          p.oneWaySlot = p.oneWayOffset;
          p.oneWayStep = movementMode === "tornado" || faceOneWayActive ? 1 : getTravelDirectionSign();
          p.currentIndex = nextBand[p.oneWaySlot];
          p.nextIndex = nextBand[(p.oneWaySlot + p.oneWayStep + nextBand.length) % nextBand.length];
        } else {
          p.oneWayLane = -1;
          const nextBand = internalOrbitIndices;
          p.oneWayOffset = Math.min(nextBand.length - 1, Math.max(0, p.oneWayOffset));
          p.oneWaySlot = p.oneWayOffset;
          p.oneWayStep = movementMode === "tornado" ? 1 : getTravelDirectionSign();
          p.currentIndex = nextBand[p.oneWaySlot];
          p.nextIndex = nextBand[(p.oneWaySlot + p.oneWayStep + nextBand.length) % nextBand.length];
        }
      }
    } else if (movementMode === "grid-travel" && (gridRowIds.length || gridColIds.length)) {
      const bands = p.gridFamily === 0 ? gridRowBands : gridColBands;
      const ids = p.gridFamily === 0 ? gridRowIds : gridColIds;
      const band = bands[p.gridBand];
      if (!band || band.length < 2) {
        if (ids.length) {
          p.gridBand = ids[(Math.random() * ids.length) | 0];
          const nextBand = bands[p.gridBand];
          p.gridSlot = (Math.random() * nextBand.length) | 0;
          p.gridStep = p.gridBand % 2 === 0 ? 1 : -1;
          p.currentIndex = nextBand[p.gridSlot];
          p.nextIndex = nextBand[(p.gridSlot + p.gridStep + nextBand.length) % nextBand.length];
        }
      }
    }

    if (currentShapePoints.length > 1) {
      if (particleOneWayMode) {
        const band = faceOneWayActive && !p.isInternal ? getFaceHorizontalBandForParticle(p) : getOrbitBandForParticle(p);
        if (band && band.length > 1) {
          if (movementMode === "tornado" || faceOneWayActive) {
            // Normalized phase keeps all particles at the same 360 cycle speed.
            const n = band.length;
            const basePhase = p.oneWayOffset / Math.max(1, n);
            const signedPhase = basePhase + oneWayGlobalCursor * tornadoDirectionSign;
            const loopPhase = ((signedPhase % 1) + 1) % 1;
            const slotFloat = loopPhase * n;
            const slot = Math.floor(slotFloat) % n;
            const frac = slotFloat - slot;
            p.oneWaySlot = slot;
            p.currentIndex = band[slot];
            const nextSlot = tornadoDirectionSign >= 0 ? (slot + 1) % n : (slot - 1 + n) % n;
            p.nextIndex = band[nextSlot];
            p.anchor.copy(tempPointA.copy(currentShapePoints[p.currentIndex]).lerp(currentShapePoints[p.nextIndex], frac));
          } else {
            const whole = Math.floor(oneWayGlobalCursor);
            const frac = oneWayGlobalCursor - whole;
            if (p.oneWayStep >= 0) {
              p.oneWaySlot = wrapIndex(p.oneWayOffset + whole, band.length);
              const nextSlot = wrapIndex(p.oneWaySlot + 1, band.length);
              p.currentIndex = band[p.oneWaySlot];
              p.nextIndex = band[nextSlot];
              p.anchor.copy(tempPointA.copy(currentShapePoints[p.currentIndex]).lerp(currentShapePoints[p.nextIndex], frac));
            } else {
              p.oneWaySlot = wrapIndex(p.oneWayOffset - whole, band.length);
              const nextSlot = wrapIndex(p.oneWaySlot - 1, band.length);
              p.currentIndex = band[p.oneWaySlot];
              p.nextIndex = band[nextSlot];
              p.anchor.copy(tempPointA.copy(currentShapePoints[p.currentIndex]).lerp(currentShapePoints[p.nextIndex], frac));
            }
          }
        } else if (band && band.length === 1) {
          p.currentIndex = band[0];
          p.nextIndex = band[0];
          p.anchor.copy(currentShapePoints[band[0]]);
        }
      } else {
        p.turnTimer -= dt;
        if (p.turnTimer <= 0) {
          p.pathSpeed = (0.08 + motionControls.travelSpeed * 0.018) * (0.85 + Math.random() * 0.3);
          p.turnTimer = 0.08 + Math.random() * 0.3;
        }
        p.segmentT += p.pathSpeed * dt;
        while (p.segmentT >= 1) {
          p.segmentT -= 1;
          if (movementMode === "face-cover" && surfacePointIndices.length) {
            p.faceSlot = (p.faceSlot + p.faceStep + surfacePointIndices.length) % surfacePointIndices.length;
            const nextSlot = (p.faceSlot + p.faceStep + surfacePointIndices.length) % surfacePointIndices.length;
            p.prevIndex = p.currentIndex;
            p.currentIndex = surfacePointIndices[p.faceSlot];
            p.nextIndex = surfacePointIndices[nextSlot];
          } else if (movementMode === "alternate-lines" && alternateLineIds.length) {
            const band = alternateLineBands[p.lineBand];
            if (band && band.length > 1) {
              p.lineSlot = (p.lineSlot + p.lineStep + band.length) % band.length;
              const nextSlot = (p.lineSlot + p.lineStep + band.length) % band.length;
              p.prevIndex = p.currentIndex;
              p.currentIndex = band[p.lineSlot];
              p.nextIndex = band[nextSlot];
            } else {
              p.prevIndex = p.currentIndex;
              p.currentIndex = p.nextIndex;
              p.nextIndex = chooseNextIndex(p);
            }
          } else if (movementMode === "grid-travel" && (gridRowIds.length || gridColIds.length)) {
            const bands = p.gridFamily === 0 ? gridRowBands : gridColBands;
            const ids = p.gridFamily === 0 ? gridRowIds : gridColIds;
            const band = bands[p.gridBand];
            if (band && band.length > 1) {
              p.gridSlot = (p.gridSlot + p.gridStep + band.length) % band.length;
              const nextSlot = (p.gridSlot + p.gridStep + band.length) % band.length;
              p.prevIndex = p.currentIndex;
              p.currentIndex = band[p.gridSlot];
              p.nextIndex = band[nextSlot];
            } else if (ids.length) {
              p.gridBand = ids[(Math.random() * ids.length) | 0];
              const targetBand = bands[p.gridBand];
              p.gridSlot = (Math.random() * targetBand.length) | 0;
              p.gridStep = p.gridBand % 2 === 0 ? 1 : -1;
              const nextSlot = (p.gridSlot + p.gridStep + targetBand.length) % targetBand.length;
              p.prevIndex = p.currentIndex;
              p.currentIndex = targetBand[p.gridSlot];
              p.nextIndex = targetBand[nextSlot];
            } else {
              p.prevIndex = p.currentIndex;
              p.currentIndex = p.nextIndex;
              p.nextIndex = chooseNextIndex(p);
            }
          } else {
            p.prevIndex = p.currentIndex;
            p.currentIndex = p.nextIndex;
            p.nextIndex = chooseNextIndex(p);
          }
        }
      }

      if (!particleOneWayMode) {
        if (surfaceExternalOnly && !p.isInternal && surfacePointIndices.length && !surfacePointMask[p.nextIndex]) {
          p.nextIndex = chooseNextIndexSurfaceOnly(p);
        } else if (movementMode === "face-cover" && surfacePointIndices.length && !surfacePointMask[p.nextIndex]) {
          p.nextIndex = chooseNextIndexFaceCover(p);
        }

        tempPointA.copy(currentShapePoints[p.currentIndex]);
        tempPointB.copy(currentShapePoints[p.nextIndex]);
        p.anchor.copy(tempPointA.lerp(tempPointB, p.segmentT));
      }
      if (p.isInternal) p.anchor.multiplyScalar(p.internalDepth);
    }

    if ((movementMode === "tornado" || faceOneWayActive) && particleOneWayMode) {
      // Keep one-way orbit particles exactly on the shared orbit clock for uniform speed.
      p.pos.copy(p.anchor);
    } else {
      const recoveryScale = p.cursorTear > 0.01 ? 0.16 : 1;
      p.pos.lerp(p.anchor, Math.min(1, p.followRate * recoveryScale * dt));
    }
    p.cursorTear = Math.max(0, p.cursorTear - dt * 0.38);

    if (hasCursor2D && !particleOneWayMode && !p.isInternal) {
      tempProjected.copy(p.pos).project(camera);
      const dx = tempProjected.x - pointerNdc.x;
      const dy = tempProjected.y - pointerNdc.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < repelRadiusNdc) {
        const falloff = 1 - d / repelRadiusNdc;
        p.cursorTear = Math.max(p.cursorTear, Math.min(1.8, falloff * 1.8));
        if (d > 0.0001) {
          const nx = dx / d;
          const ny = dy / d;
          tempWorldPush.copy(tempCamRight).multiplyScalar(nx).addScaledVector(tempCamUp, ny);
        } else {
          tempWorldPush.copy(tempCamRight);
        }
        const cursorScale = movementMode === "face-cover" ? 0.65 : 1.7;
        p.pos.addScaledVector(tempWorldPush, falloff * falloff * repelStrength * cursorScale);
      }
    }

  }

  if (collisionEnabled && movementMode !== "static-detail" && movementMode !== "tornado") {
    const sepStrength = oneWayLikeMode ? 0.55 : 0.9;
    enforceParticleSeparation(dt, sepStrength);
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    // Keep particle close to its path anchor so it doesn't spread beyond shape outline.
    tempClampOffset.copy(p.pos).sub(p.anchor);
    const offsetLen = tempClampOffset.length();
    const dynamicOffset =
      movementMode === "face-cover"
        ? 0.02 + p.cursorTear * 0.04
        : movementMode === "static-detail"
          ? 0.0001
          : movementMode === "tornado"
            ? 0.012
            : movementMode === "one-way"
              ? 0.04
          : maxOutlineOffset + p.cursorTear * (2.2 + motionControls.cursorSize * 1.1);
    if (offsetLen > dynamicOffset) {
      p.pos.copy(p.anchor).addScaledVector(tempClampOffset, dynamicOffset / offsetLen);
    }
  }

  updateCursorLinks(hasCursor2D);

  const t = clock.elapsedTime;
  sweepLightA.position.set(Math.cos(t * 0.62) * 13, 5 + Math.sin(t * 0.41) * 2.4, Math.sin(t * 0.62) * 13);
  sweepLightB.position.set(Math.cos(t * -0.5) * 11, -4 + Math.sin(t * 0.33) * 2.2, Math.sin(t * -0.5) * 11);
  writeInstances(t);

  if (movementMode === "one-way" || movementMode === "tornado" || faceOneWayActive) {
    group.rotation.set(0, 0, 0);
  } else {
    group.rotation.y += dt * 0.16;
    group.rotation.x = Math.sin(t * 0.3) * 0.05;
    group.rotation.z = Math.sin(t * 0.22) * 0.03;
  }
  group.position.set(0, 0, 0);
  controls.target.set(0, 0, 0);

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

applyMaterialControls();
rebuildSpheres(sphereCount);
applyPresetFromSelect();
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
