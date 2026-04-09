import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import {
  buildPresetShapePoints,
  buildPointsFromImageUrl,
  buildPointsFromMeshFile,
  buildMeshAssetFromFile
} from "./shape-samplers.js";
import {
  refs,
  customImageOption,
  customMeshOption,
  setStatus,
  updateNucleusControlSections
} from "./ui-controls.js";

const {
  container,
  shapeSelect,
  imageInput,
  meshInput,
  reflectionImageBtn,
  reflectionImageInput,
  shapeScaleInput,
  collisionEnabledInput,
  travelSpeedInput,
  showImportedSurfaceInput,
  sphereColorInput,
  internalColorInput,
  nucleusCornerRadiusInput,
  nucleusYOffsetInput,
  lightDistanceInput,
  nucleusColorInput,
  nucleusOpacityInput,
  nucleusGlareInput,
  nucleusMatteInput,
  nucleusGlowInput,
  nucleusTransmissionInput,
  nucleusThicknessInput,
  nucleusAttenuationColorInput,
  nucleusAttenuationDistanceInput,
  nucleusSpecularInput,
  nucleusSpecularColorInput,
  nucleusClearcoatInput,
  nucleusClearcoatRoughnessInput,
  nucleusIridescenceInput,
  nucleusIorInput,
  nucleusEnvIntensityInput,
  nucleusReflectTintInput,
  nucleusReflectTintMixInput,
  surfaceChromaInput,
  reflectionStrengthInput,
  nucleusRimStrengthInput,
  nucleusRimPowerInput,
  nucleusRimColorInput,
  nucleusNoiseAmountInput,
  nucleusNoiseScaleInput,
  nucleusShellModeInput,
  nucleusShellColorInput,
  nucleusShellThicknessInput,
  nucleusShellLayersInput,
  nucleusPulseAmountInput,
  nucleusPulseSpeedInput,
  nucleusDistortionAmountInput,
  nucleusDistortionSpeedInput,
  nucleusBlobAmountInput,
  nucleusBlobScaleInput,
  nucleusBlobSpeedInput,
  nucleusGradientTopInput,
  nucleusGradientBottomInput,
  nucleusGradientMixInput,
  nucleusSpinXInput,
  nucleusSpinYInput,
  nucleusSpinZInput,
  nucleusBloomEnabledInput,
  nucleusBloomStrengthInput,
  nucleusBloomRadiusInput,
  nucleusBloomThresholdInput,
  internalDetailShadingInput,
  particleLightingInput,
  sphereShadowsInput,
  shadowContrastInput,
  sphereOpacityInput,
  sphereGlareInput,
  sphereMatteInput,
  internalMatteInput,
  sphereGlowInput,
  exportDataBtn,
  exportWebflowBtn,
  saveStartupBtn,
  clearStartupBtn
} = refs;

function createNucleusGeometry(shape, cornerRadius) {
  if (shape === "cube") return new RoundedBoxGeometry(1.7, 1.7, 1.7, 5, cornerRadius);
  if (shape === "crystal-orb") return new THREE.IcosahedronGeometry(1, 5);
  if (shape === "liquid-core") return new THREE.SphereGeometry(1, 96, 72);
  return new THREE.IcosahedronGeometry(1, 6);
}

const STARTUP_CONFIG_KEY = "shape-create.startup-config.v1";
const DEFAULT_STARTUP_MESH_URL = new URL("../flower.glb", import.meta.url).href;
const DEFAULT_STARTUP_MESH_FILENAME = "flower.glb";
const DEFAULT_STARTUP_SNAPSHOT = {
  shape: {
    name: "custom-mesh",
    scale: 1,
    movementMode: "normal"
  },
  render: {
    externalColor: "#90b2ff",
    internalColor: "#4f6fb6",
    nucleusPreset: "custom",
    nucleusShape: "sphere",
    nucleusCornerRadius: 0.12,
    nucleusSize: 1.1,
    nucleusYOffset: -4.24,
    lightDistance: 6,
    nucleusColor: "#979c98",
    nucleusOpacity: 1,
    nucleusTransmission: 1,
    nucleusThickness: 0,
    nucleusAttenuationColor: "#000000",
    nucleusAttenuationDistance: 19.2,
    nucleusSpecular: 1,
    nucleusSpecularColor: "#00f6ff",
    nucleusClearcoat: 0.86,
    nucleusClearcoatRoughness: 1,
    nucleusIridescence: 1,
    nucleusIor: 2.333,
    nucleusEnvIntensity: 3.2,
    nucleusReflectTint: "#000000",
    nucleusReflectTintMix: 0.1,
    surfaceChroma: 1,
    reflectionStrength: 4,
    nucleusRimStrength: 2.5,
    nucleusRimPower: 8,
    nucleusRimColor: "#000000",
    nucleusNoiseAmount: 0.2,
    nucleusNoiseScale: 1.4,
    nucleusShellMode: false,
    nucleusShellColor: "#9fc6ff",
    nucleusShellThickness: 0.08,
    nucleusShellLayers: 0,
    nucleusPulseAmount: 0,
    nucleusPulseSpeed: 1.2,
    nucleusDistortionAmount: 0,
    nucleusDistortionSpeed: 1.5,
    nucleusBlobAmount: 0.18,
    nucleusBlobScale: 1.7,
    nucleusBlobSpeed: 1.1,
    nucleusGradientTop: "#ffffff",
    nucleusGradientBottom: "#7ea5ff",
    nucleusGradientMix: 0.15,
    nucleusSpinX: 0,
    nucleusSpinY: 0.22,
    nucleusSpinZ: 0,
    nucleusBloomEnabled: false,
    nucleusBloomStrength: 0.7,
    nucleusBloomRadius: 0.35,
    nucleusBloomThreshold: 0.75,
    shadowContrast: 1.71,
    opacity: 0.95
  }
};

function applySnapshotDefaultsToInputs(snapshot) {
  if (!snapshot) return;
  const { shape = {}, render = {} } = snapshot;
  const map = {
    shapeSelect: shape.name,
    shapeScale: shape.scale,
    movementMode: shape.movementMode,
    sphereColor: render.externalColor,
    internalColor: render.internalColor,
    nucleusPreset: render.nucleusPreset,
    nucleusShape: render.nucleusShape,
    nucleusCornerRadius: render.nucleusCornerRadius,
    nucleusSize: render.nucleusSize,
    nucleusYOffset: render.nucleusYOffset,
    lightDistance: render.lightDistance,
    nucleusColor: render.nucleusColor,
    nucleusOpacity: render.nucleusOpacity,
    nucleusTransmission: render.nucleusTransmission,
    nucleusThickness: render.nucleusThickness,
    nucleusAttenuationColor: render.nucleusAttenuationColor,
    nucleusAttenuationDistance: render.nucleusAttenuationDistance,
    nucleusSpecular: render.nucleusSpecular,
    nucleusSpecularColor: render.nucleusSpecularColor,
    nucleusClearcoat: render.nucleusClearcoat,
    nucleusClearcoatRoughness: render.nucleusClearcoatRoughness,
    nucleusIridescence: render.nucleusIridescence,
    nucleusIor: render.nucleusIor,
    nucleusEnvIntensity: render.nucleusEnvIntensity,
    nucleusReflectTint: render.nucleusReflectTint,
    nucleusReflectTintMix: render.nucleusReflectTintMix,
    surfaceChroma: render.surfaceChroma,
    reflectionStrength: render.reflectionStrength,
    nucleusRimStrength: render.nucleusRimStrength,
    nucleusRimPower: render.nucleusRimPower,
    nucleusRimColor: render.nucleusRimColor,
    nucleusNoiseAmount: render.nucleusNoiseAmount,
    nucleusNoiseScale: render.nucleusNoiseScale,
    nucleusShellMode: render.nucleusShellMode,
    nucleusShellColor: render.nucleusShellColor,
    nucleusShellThickness: render.nucleusShellThickness,
    nucleusShellLayers: render.nucleusShellLayers,
    nucleusPulseAmount: render.nucleusPulseAmount,
    nucleusPulseSpeed: render.nucleusPulseSpeed,
    nucleusDistortionAmount: render.nucleusDistortionAmount,
    nucleusDistortionSpeed: render.nucleusDistortionSpeed,
    nucleusBlobAmount: render.nucleusBlobAmount,
    nucleusBlobScale: render.nucleusBlobScale,
    nucleusBlobSpeed: render.nucleusBlobSpeed,
    nucleusGradientTop: render.nucleusGradientTop,
    nucleusGradientBottom: render.nucleusGradientBottom,
    nucleusGradientMix: render.nucleusGradientMix,
    nucleusSpinX: render.nucleusSpinX,
    nucleusSpinY: render.nucleusSpinY,
    nucleusSpinZ: render.nucleusSpinZ,
    nucleusBloomEnabled: render.nucleusBloomEnabled,
    nucleusBloomStrength: render.nucleusBloomStrength,
    nucleusBloomRadius: render.nucleusBloomRadius,
    nucleusBloomThreshold: render.nucleusBloomThreshold,
    shadowContrast: render.shadowContrast,
    sphereOpacity: render.opacity
  };
  for (const [id, value] of Object.entries(map)) {
    if (value === undefined || value === null) continue;
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = !!value;
    else if (el.type !== "file") el.value = String(value);
  }
}

function getPersistableControls() {
  return Array.from(document.querySelectorAll("input[id], select[id]")).filter((el) => {
    if (!el?.id) return false;
    if (el.type === "file") return false;
    if (el.id === "imageInput" || el.id === "meshInput") return false;
    return true;
  });
}

function buildStartupConfig() {
  const inputs = {};
  const controlElements = getPersistableControls();
  for (let i = 0; i < controlElements.length; i++) {
    const el = controlElements[i];
    inputs[el.id] = el.type === "checkbox" ? !!el.checked : String(el.value ?? "");
  }
  const scene = {
    cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
    controlsTarget: [controls.target.x, controls.target.y, controls.target.z],
    cameraZoom: camera.zoom,
    groupRotation: [group.rotation.x, group.rotation.y, group.rotation.z]
  };
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    inputs,
    scene
  };
}

let loadedStartupSceneState = null;

function applyStartupConfigToInputs(config) {
  const inputs = config?.inputs;
  if (!inputs || typeof inputs !== "object") return false;
  for (const [id, value] of Object.entries(inputs)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = !!value;
    else if (el.type !== "file") el.value = String(value ?? "");
  }
  loadedStartupSceneState = config?.scene && typeof config.scene === "object"
    ? config.scene
    : null;
  return true;
}

function loadStartupConfigIntoInputs() {
  try {
    const raw = localStorage.getItem(STARTUP_CONFIG_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return applyStartupConfigToInputs(parsed);
  } catch {
    return false;
  }
}

const loadedUserStartup = loadStartupConfigIntoInputs();
if (!loadedUserStartup) applySnapshotDefaultsToInputs(DEFAULT_STARTUP_SNAPSHOT);

const FIXED_EXTERNAL_SIZE = 1;
const FIXED_INTERNAL_SIZE = 0.9;
const FIXED_INTERNAL_SPEED = 0.8;
const FIXED_SPHERE_GAP = 0.19;
const FIXED_TORNADO_BATCH_RINGS = 3;
const FIXED_TORNADO_BATCH_OFFSET = 0.04;
const FIXED_TORNADO_SKEW = 0;
const FIXED_TORNADO_IMPERFECTION = 1;
const FIXED_MOVEMENT_MODE = "normal";
const FIXED_INTERNAL_MOVEMENT_MODE = "normal";
const FIXED_SURFACE_EXTERNAL_ONLY = false;
const FIXED_FACE_MIN_TRAVEL = 18;
const FIXED_NUCLEUS_SHAPE = "sphere";
const FIXED_NUCLEUS_PRESET = "custom";
const FIXED_NUCLEUS_SIZE = 1.1;

function clearImportedSurface() {
  for (let i = importSurfaceGroup.children.length - 1; i >= 0; i--) {
    const child = importSurfaceGroup.children[i];
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => {
          if (m && m !== importedSurfaceMaterial) m.dispose?.();
        });
      } else if (child.material !== importedSurfaceMaterial) {
        child.material.dispose?.();
      }
    }
    child.geometry?.dispose?.();
    importSurfaceGroup.remove(child);
  }
}

function syncImportedSurfaceMaterials() {
  importSurfaceGroup.traverse((child) => {
    if (!child.isMesh) return;
    if (Array.isArray(child.material)) {
      child.material.forEach((m) => {
        if (m && m !== importedSurfaceMaterial) m.dispose?.();
      });
      child.material = importedSurfaceMaterial;
      return;
    }
    if (child.material !== importedSurfaceMaterial) child.material?.dispose?.();
    child.material = importedSurfaceMaterial;
  });
}

function syncImportedSurfaceVisibility() {
  importSurfaceGroup.visible =
    importedSurfaceVisible &&
    importSurfaceGroup.children.length > 0;
}

function ensureGeometryUvForThicknessMap(geometry) {
  if (!geometry || geometry.getAttribute("uv")) return;
  const pos = geometry.getAttribute("position");
  if (!pos || !pos.count) return;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const size = new THREE.Vector3();
  box.getSize(size);
  const useXZ = size.x >= size.y;
  const min = box.min;
  const sx = Math.max(0.0001, useXZ ? size.x : size.y);
  const sy = Math.max(0.0001, size.z);
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const u = ((useXZ ? px : py) - (useXZ ? min.x : min.y)) / sx;
    const v = (pz - min.z) / sy;
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function buildImportedSurface(root) {
  clearImportedSurface();
  if (!root) {
    syncImportedSurfaceVisibility();
    return;
  }

  root.updateWorldMatrix(true, true);
  const sourceGeometries = [];
  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const clonedGeometry = child.geometry.clone();
    clonedGeometry.applyMatrix4(child.matrixWorld);
    if (!clonedGeometry.getAttribute("normal")) clonedGeometry.computeVertexNormals();
    else clonedGeometry.normalizeNormals();
    sourceGeometries.push(clonedGeometry);
  });

  if (!sourceGeometries.length) {
    syncImportedSurfaceVisibility();
    return;
  }

  let mergedGeometry = null;
  try {
    mergedGeometry = BufferGeometryUtils.mergeGeometries(sourceGeometries, false);
  } catch {
    mergedGeometry = null;
  }
  if (!mergedGeometry) {
    mergedGeometry = sourceGeometries[0];
  } else {
    for (let i = 0; i < sourceGeometries.length; i++) sourceGeometries[i].dispose?.();
  }
  ensureGeometryUvForThicknessMap(mergedGeometry);

  const baseMesh = new THREE.Mesh(markLiquidGeometry(mergedGeometry), importedSurfaceMaterial);
  baseMesh.position.set(0, 0, 0);
  baseMesh.quaternion.identity();
  baseMesh.scale.set(1, 1, 1);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  baseMesh.renderOrder = 40;
  baseMesh.userData.surfaceRole = "base";
  importSurfaceGroup.add(baseMesh);

  syncImportedSurfaceMaterials();
  syncImportedSurfaceVisibility();
}

function markLiquidGeometry(geometry) {
  const pos = geometry?.getAttribute?.("position");
  if (!pos) return geometry;
  geometry.userData.basePositions = new Float32Array(pos.array);
  return geometry;
}

function applyLiquidOrbDeform(mesh, elapsed, layerIndex = -1, layerCount = 0) {
  const geometry = mesh?.geometry;
  const pos = geometry?.getAttribute?.("position");
  const base = geometry?.userData?.basePositions;
  if (!pos || !base) return;

  const shape = mesh?.userData?.shape || nucleusMesh?.userData?.shape || "crystal-orb";
  const isLiquidCore = shape === "liquid-core";
  const blobAmount = Math.max(0, materialControls.nucleusBlobAmount ?? 0);
  const blobScale = Math.max(0.2, materialControls.nucleusBlobScale ?? 1);
  const blobSpeed = Math.max(0, materialControls.nucleusBlobSpeed ?? 1);
  const distAmount = Math.max(0, materialControls.nucleusDistortionAmount ?? 0);
  const distSpeed = Math.max(0, materialControls.nucleusDistortionSpeed ?? 1.5);
  const layerPhase = layerCount > 0 ? (layerIndex + 1) / (layerCount + 1) : 0;
  const timeA = elapsed * (isLiquidCore ? 0.6 + blobSpeed * 0.7 : 0.8 + blobSpeed * 0.9) + layerPhase * 2.1;
  const timeB = elapsed * (isLiquidCore ? 0.9 + blobSpeed * 0.9 : 1.1 + blobSpeed * 1.2) + layerPhase * 3.7;
  const arr = pos.array;

  for (let i = 0; i < arr.length; i += 3) {
    const x = base[i];
    const y = base[i + 1];
    const z = base[i + 2];
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;
    const waveA = Math.sin((nx * 1.7 + ny * 1.2 - nz * 1.1) * blobScale * (isLiquidCore ? 1.08 : 2.8) + timeA * 2.1);
    const waveB = Math.sin((nx * -1.3 + ny * 1.8 + nz * 1.5) * blobScale * (isLiquidCore ? 0.88 : 2.2) - timeB * 1.8);
    const waveC = Math.sin((nx * 2.4 - ny * 1.6 + nz * 0.8) * blobScale * (isLiquidCore ? 0.76 : 1.9) + timeA * 1.3);
    const waveD = Math.sin((nx * 0.8 + ny * 1.1 + nz * 1.4) * blobScale * (isLiquidCore ? 0.7 : 0.95) - timeA * 0.9);
    const waveE = Math.sin((nx * 1.1 - ny * 0.7 + nz * 0.9) * blobScale * 0.62 + timeB * 0.6);
    const blob = isLiquidCore
      ? (waveA * 0.3 + waveB * 0.24 + waveC * 0.19 + waveD * 0.16 + waveE * 0.11) * blobAmount * 1.05
      : (waveA * 0.5 + waveB * 0.32 + waveC * 0.18) * blobAmount;
    const drift = Math.sin(timeB + ny * (isLiquidCore ? 2.1 : 3.4)) * distAmount * (isLiquidCore ? 0.1 : 0.18);
    const radius = 1 + blob + drift;
    arr[i] = nx * radius;
    arr[i + 1] = ny * radius;
    arr[i + 2] = nz * radius;
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function makeNoiseTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeThicknessTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  const cx = size * 0.5;
  const cy = size * 0.5;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy) / maxR;
      const radialCore = 1 - Math.min(1, r);
      const layerA = Math.sin((x / size) * Math.PI * 6.3) * 0.5 + 0.5;
      const layerB = Math.cos((y / size) * Math.PI * 4.7) * 0.5 + 0.5;
      const layerC = Math.sin(((x + y) / size) * Math.PI * 8.1) * 0.5 + 0.5;
      const grain = (Math.random() * 2 - 1) * 0.1;
      const v = THREE.MathUtils.clamp(
        0.1 + radialCore * 0.84 + layerA * 0.14 + layerB * 0.11 + layerC * 0.08 + grain,
        0.02,
        1
      );
      const c = Math.round(v * 255);
      img.data[i] = c;
      img.data[i + 1] = c;
      img.data[i + 2] = c;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0xd6d6d6, 16, 44);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.001, 220);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  Number(nucleusBloomStrengthInput?.value ?? 0.7),
  Number(nucleusBloomRadiusInput?.value ?? 0.35),
  Number(nucleusBloomThresholdInput?.value ?? 0.75)
);
composer.addPass(bloomPass);
composer.setSize(window.innerWidth, window.innerHeight);
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const chromeEnvRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
const chromeEnvMap = chromeEnvRT.texture;
scene.environment = chromeEnvMap;
const nucleusDynamicEnvRT = new THREE.WebGLCubeRenderTarget(256, {
  type: THREE.HalfFloatType,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
  colorSpace: THREE.SRGBColorSpace
});
const nucleusCubeCamera = new THREE.CubeCamera(0.1, 180, nucleusDynamicEnvRT);
scene.add(nucleusCubeCamera);
const importedDynamicEnvRT = new THREE.WebGLCubeRenderTarget(256, {
  type: THREE.HalfFloatType,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
  colorSpace: THREE.SRGBColorSpace
});
const importedCubeCamera = new THREE.CubeCamera(0.1, 180, importedDynamicEnvRT);
scene.add(importedCubeCamera);
let importedEnvFrame = 0;
const importedEnvBox = new THREE.Box3();
const importedEnvCenter = new THREE.Vector3();
let customReflectionEnvMap = null;
let customReflectionTexture = null;
let customReflectionEnvRT = null;
const DEFAULT_REFLECTION_IMAGE_URL = new URL("../citrus_orchard_road_puresky_1k.exr", import.meta.url).href;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1.2;
controls.maxDistance = 35;
controls.target.set(0, 0, 0);

const topLight = new THREE.SpotLight(0xffffff, 4.1, 0, Math.PI * 0.24, 0.42, 1.35);
topLight.position.set(4.2, 17.5, 8.3);
topLight.target.position.set(0, 0, 0);
topLight.castShadow = true;
topLight.shadow.mapSize.set(2048, 2048);
topLight.shadow.bias = -0.00008;
topLight.shadow.normalBias = 0.016;
topLight.shadow.radius = 5;
topLight.shadow.camera.near = 0.5;
topLight.shadow.camera.far = 80;
scene.add(topLight);
scene.add(topLight.target);
const fillLight = new THREE.HemisphereLight(0xe8f3ff, 0x2a3546, 0.52);
scene.add(fillLight);
const rimLight = new THREE.PointLight(0xaec6ff, 0.42, 36, 2);
rimLight.position.set(-4.5, 7.8, -8.4);
scene.add(rimLight);
const reflectionSceneryGroup = new THREE.Group();
scene.add(reflectionSceneryGroup);
{
  const domeGeo = new THREE.SphereGeometry(90, 64, 48);
  const domeMat = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color("#88b7ff") },
      uMid: { value: new THREE.Color("#d8ecff") },
      uBottom: { value: new THREE.Color("#17302a") },
      uTime: { value: 0 }
    },
    vertexShader: `
varying vec3 vWPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: `
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uBottom;
uniform float uTime;
varying vec3 vWPos;
void main() {
  vec3 d = normalize(vWPos);
  float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 sky = mix(uBottom, uMid, smoothstep(0.0, 0.45, h));
  sky = mix(sky, uTop, smoothstep(0.45, 1.0, h));
  float bands = sin((d.x + d.z) * 18.0 + uTime * 0.08) * 0.5 + 0.5;
  float cloud = smoothstep(0.65, 0.95, bands) * smoothstep(0.2, 0.9, h) * 0.12;
  gl_FragColor = vec4(sky + cloud, 1.0);
}`,
    side: THREE.BackSide,
    depthWrite: false
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.frustumCulled = false;
  reflectionSceneryGroup.add(domeMesh);
  reflectionSceneryGroup.userData.domeMaterial = domeMat;

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(35, 72),
    new THREE.MeshStandardMaterial({
      color: "#2a473a",
      roughness: 0.96,
      metalness: 0.0
    })
  );
  ground.rotation.x = -Math.PI * 0.5;
  ground.position.y = -10;
  reflectionSceneryGroup.add(ground);

  const cardColors = ["#8dc5ff", "#ffd59e", "#96f2c8", "#b9a8ff", "#7ab6ff", "#ffefb0"];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(14 + (i % 2) * 6, 8 + (i % 3) * 2),
      new THREE.MeshBasicMaterial({
        color: cardColors[i],
        transparent: true,
        opacity: 0.22 + (i % 3) * 0.08,
        side: THREE.DoubleSide
      })
    );
    card.position.set(Math.cos(a) * 24, -1 + (i % 3) * 2.2, Math.sin(a) * 24);
    card.lookAt(0, 0, 0);
    reflectionSceneryGroup.add(card);
  }
}
// Keep dome/scenery hidden from direct view; used only for reflection capture.
reflectionSceneryGroup.visible = false;

const group = new THREE.Group();
group.position.set(0, 0, 0);
scene.add(group);
function makeRotationTestLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "900 180px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0,0,0,0.92)";
  ctx.fillText(text, canvas.width * 0.5, canvas.height * 0.5);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    alphaTest: 0.08,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(18, 4.8), material);
  plane.position.set(0, 0, -13);
  plane.rotation.set(0, 0, 0);
  plane.renderOrder = -200;
  return plane;
}
const rotationTestLabel = makeRotationTestLabel("ROTATION TEST");
if (rotationTestLabel) scene.add(rotationTestLabel);
const importSurfaceGroup = new THREE.Group();
group.add(importSurfaceGroup);
const contactShadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.ShadowMaterial({ opacity: 0 })
);
contactShadowPlane.rotation.x = -Math.PI * 0.5;
contactShadowPlane.position.set(0, -6.5, 0);
contactShadowPlane.receiveShadow = false;
contactShadowPlane.visible = false;
contactShadowPlane.material.depthWrite = false;
contactShadowPlane.frustumCulled = false;
// Keep disabled: user requested no floor shadow and this can cause depth slicing artifacts.
// scene.add(contactShadowPlane);
const contactShadowBounds = new THREE.Box3();
const contactShadowCenter = new THREE.Vector3();
const contactShadowSize = new THREE.Vector3();
let contactShadowFrame = 0;

let externalCount = 0;
let internalCount = 0;
let sphereCount = Math.max(0, externalCount + internalCount);
const baseShapeRadius = 5.7;
let shapeScale = Number(shapeScaleInput?.value) || 1;
let surfaceExternalOnly = FIXED_SURFACE_EXTERNAL_ONLY;
let particlesVisible = false;
let importedSurfaceVisible = true;
if (showImportedSurfaceInput) showImportedSurfaceInput.checked = true;

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
const externalParticleBasicMaterial = new THREE.MeshBasicMaterial({
  color: 0x90b2ff,
  transparent: true,
  opacity: 0.95
});
const internalParticleBasicMaterial = new THREE.MeshBasicMaterial({
  color: 0x4f6fb6,
  transparent: true,
  opacity: 0.95
});
const nucleusMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xa8d8ff,
  roughness: 0.08,
  metalness: 0.92,
  clearcoat: 1.0,
  clearcoatRoughness: 0.06,
  reflectivity: 1.0,
  ior: 2.2,
  iridescence: 0.65,
  iridescenceIOR: 1.35,
  iridescenceThicknessRange: [140, 420],
  emissive: 0x000000,
  emissiveIntensity: 0.02,
  transparent: true,
  opacity: 0.95
});
const nucleusBasicMaterial = new THREE.MeshBasicMaterial({
  color: 0xa8d8ff,
  transparent: true,
  opacity: 0.95
});
const nucleusShellMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x9fc6ff,
  roughness: 0.38,
  metalness: 0.05,
  transmission: 0.78,
  thickness: 0.2,
  transparent: true,
  opacity: 0.32
});
const importedThicknessTexture = makeThicknessTexture(512);
const importedSurfaceMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xa8d8ff,
  roughness: 0.03,
  metalness: 0.0,
  clearcoat: 0.5,
  clearcoatRoughness: 0.3,
  transmission: 0.95,
  thickness: 3.0,
  attenuationColor: new THREE.Color(0xa8d8ff),
  attenuationDistance: 10.0,
  ior: 1.65,
  iridescence: 0.0,
  specularIntensity: 1.3,
  specularColor: new THREE.Color(0xffffff),
  emissive: 0x000000,
  emissiveIntensity: 0,
  transparent: true,
  opacity: 1.0,
  side: THREE.DoubleSide,
  depthWrite: true,
  depthTest: true,
  alphaHash: false,
  thicknessMap: importedThicknessTexture
});
const nucleusRimMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(nucleusRimColorInput?.value || "#cfe3ff") },
    uPower: { value: Number(nucleusRimPowerInput?.value ?? 2.6) },
    uStrength: { value: Number(nucleusRimStrengthInput?.value ?? 0.35) }
  },
  vertexShader: `
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
  fragmentShader: `
uniform vec3 uColor;
uniform float uPower;
uniform float uStrength;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  vec3 vDir = normalize(cameraPosition - vWorldPos);
  float fres = pow(1.0 - max(0.0, dot(normalize(vWorldNormal), vDir)), uPower);
  float a = clamp(fres * uStrength, 0.0, 1.0);
  gl_FragColor = vec4(uColor, a);
}`,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
});
const nucleusGradientMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTop: { value: new THREE.Color(nucleusGradientTopInput?.value || "#ffffff") },
    uBottom: { value: new THREE.Color(nucleusGradientBottomInput?.value || "#7ea5ff") },
    uMix: { value: Number(nucleusGradientMixInput?.value ?? 0.15) }
  },
  vertexShader: `
varying float vY;
void main() {
  vY = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
  fragmentShader: `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform float uMix;
varying float vY;
void main() {
  float t = smoothstep(-0.85, 0.85, vY);
  vec3 col = mix(uBottom, uTop, t);
  gl_FragColor = vec4(col, clamp(uMix, 0.0, 1.0) * 0.5);
}`,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide
});
let nucleusNoiseTexture = null;
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
const nucleusShadowUniforms = {
  uSharedLightDir: sharedShadowLightDir,
  uSharedCenter: sharedShadowCenter,
  uSharedShadowStrength: { value: 0.5 },
  uSharedShadowSoftness: { value: 0.2 }
};
const importedShadowUniforms = {
  uSharedLightDir: sharedShadowLightDir,
  uSharedCenter: sharedShadowCenter,
  uSharedShadowStrength: { value: 0.22 },
  uSharedShadowSoftness: { value: 0.3 }
};
nucleusMaterial.envMap = chromeEnvMap;
nucleusMaterial.envMapIntensity = 3.0;
nucleusShellMaterial.envMap = chromeEnvMap;
nucleusShellMaterial.envMapIntensity = 2.4;
importedSurfaceMaterial.envMap = chromeEnvMap;
importedSurfaceMaterial.envMapIntensity = 2.8;

// Initialize imported surface color from nucleus color input
if (nucleusColorInput?.value) {
  importedSurfaceMaterial.color.setStyle(nucleusColorInput.value);
  importedSurfaceMaterial.attenuationColor.setStyle(nucleusColorInput.value);
}

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
enableSharedShadow(nucleusMaterial, nucleusShadowUniforms);
enableSharedShadow(importedSurfaceMaterial, importedShadowUniforms);

const materialControls = {
  color: "#90b2ff",
  internalColor: "#4f6fb6",
  nucleusShape: FIXED_NUCLEUS_SHAPE,
  nucleusPreset: FIXED_NUCLEUS_PRESET,
  nucleusSize: FIXED_NUCLEUS_SIZE,
  nucleusCornerRadius: Number(nucleusCornerRadiusInput?.value ?? 0.12),
  nucleusYOffset: Number(nucleusYOffsetInput?.value ?? 0),
  lightDistance: Number(lightDistanceInput?.value ?? 1),
  nucleusColor: nucleusColorInput?.value || "#a8d8ff",
  nucleusOpacity: Number(nucleusOpacityInput?.value ?? 0.95),
  nucleusGlare: Number(nucleusGlareInput?.value ?? 0.5),
  nucleusMatte: Number(nucleusMatteInput?.value ?? 0.35),
  nucleusGlow: Number(nucleusGlowInput?.value ?? 0.45),
  nucleusTransmission: Number(nucleusTransmissionInput?.value ?? 0.18),
  nucleusThickness: Number(nucleusThicknessInput?.value ?? 1.2),
  nucleusAttenuationColor: nucleusAttenuationColorInput?.value || "#d8ecff",
  nucleusAttenuationDistance: Number(nucleusAttenuationDistanceInput?.value ?? 4.0),
  nucleusSpecular: Number(nucleusSpecularInput?.value ?? 1.0),
  nucleusSpecularColor: nucleusSpecularColorInput?.value || "#ffffff",
  nucleusClearcoat: Number(nucleusClearcoatInput?.value ?? 1.0),
  nucleusClearcoatRoughness: Number(nucleusClearcoatRoughnessInput?.value ?? 0.08),
  nucleusIridescence: Number(nucleusIridescenceInput?.value ?? 0.65),
  nucleusIor: Number(nucleusIorInput?.value ?? 2.2),
  nucleusEnvIntensity: Number(nucleusEnvIntensityInput?.value ?? 3.2),
  nucleusReflectTint: nucleusReflectTintInput?.value || "#a8d8ff",
  nucleusReflectTintMix: Number(nucleusReflectTintMixInput?.value ?? 0),
  surfaceChroma: Number(surfaceChromaInput?.value ?? 0),
  reflectionStrength: Number(reflectionStrengthInput?.value ?? 1.8),
  nucleusRimStrength: Number(nucleusRimStrengthInput?.value ?? 0.35),
  nucleusRimPower: Number(nucleusRimPowerInput?.value ?? 2.6),
  nucleusRimColor: nucleusRimColorInput?.value || "#cfe3ff",
  nucleusNoiseAmount: Number(nucleusNoiseAmountInput?.value ?? 0.2),
  nucleusNoiseScale: Number(nucleusNoiseScaleInput?.value ?? 1.4),
  nucleusShellMode: nucleusShellModeInput?.checked ?? false,
  nucleusShellColor: nucleusShellColorInput?.value || "#9fc6ff",
  nucleusShellThickness: Number(nucleusShellThicknessInput?.value ?? 0.08),
  nucleusShellLayers: Number(nucleusShellLayersInput?.value ?? 0),
  nucleusPulseAmount: Number(nucleusPulseAmountInput?.value ?? 0.0),
  nucleusPulseSpeed: Number(nucleusPulseSpeedInput?.value ?? 1.2),
  nucleusDistortionAmount: Number(nucleusDistortionAmountInput?.value ?? 0.0),
  nucleusDistortionSpeed: Number(nucleusDistortionSpeedInput?.value ?? 1.5),
  nucleusBlobAmount: Number(nucleusBlobAmountInput?.value ?? 0.18),
  nucleusBlobScale: Number(nucleusBlobScaleInput?.value ?? 1.7),
  nucleusBlobSpeed: Number(nucleusBlobSpeedInput?.value ?? 1.1),
  nucleusGradientTop: nucleusGradientTopInput?.value || "#ffffff",
  nucleusGradientBottom: nucleusGradientBottomInput?.value || "#7ea5ff",
  nucleusGradientMix: Number(nucleusGradientMixInput?.value ?? 0.15),
  nucleusSpinX: Number(nucleusSpinXInput?.value ?? 0),
  nucleusSpinY: Number(nucleusSpinYInput?.value ?? 0.22),
  nucleusSpinZ: Number(nucleusSpinZInput?.value ?? 0),
  nucleusBloomEnabled: nucleusBloomEnabledInput?.checked ?? false,
  nucleusBloomStrength: Number(nucleusBloomStrengthInput?.value ?? 0.7),
  nucleusBloomRadius: Number(nucleusBloomRadiusInput?.value ?? 0.35),
  nucleusBloomThreshold: Number(nucleusBloomThresholdInput?.value ?? 0.75),
  shadowContrast: Number(shadowContrastInput?.value ?? 1),
  opacity: 0.95,
  glare: 0.45,
  matte: 0.35,
  internalMatte: 0.45,
  glow: 0.35
};
let particleLightingEnabled = particleLightingInput?.checked ?? true;

function getExternalRenderMaterial() {
  return particleLightingEnabled ? externalParticleMaterial : externalParticleBasicMaterial;
}

function getInternalRenderMaterial() {
  return particleLightingEnabled ? internalParticleMaterial : internalParticleBasicMaterial;
}

function getNucleusRenderMaterial() {
  return particleLightingEnabled ? nucleusMaterial : nucleusBasicMaterial;
}

function applyParticleLightingMode(skipStatus = false) {
  particleLightingEnabled = particleLightingInput?.checked ?? true;
  if (externalParticleMesh) externalParticleMesh.material = getExternalRenderMaterial();
  if (internalParticleMesh) internalParticleMesh.material = getInternalRenderMaterial();
  if (nucleusMesh) nucleusMesh.material = getNucleusRenderMaterial();
  syncImportedSurfaceMaterials();
  if (!skipStatus) {
    setStatus(particleLightingEnabled ? "Particle lighting enabled." : "Particle lighting disabled (unlit particles).");
  }
}

function syncParticleVisibility() {
  if (externalParticleMesh) externalParticleMesh.visible = particlesVisible;
  if (internalParticleMesh) internalParticleMesh.visible = particlesVisible;
}

function syncNucleusMesh() {
  const desiredShape = materialControls.nucleusShape === "cube"
    ? "cube"
    : materialControls.nucleusShape === "crystal-orb"
      ? "crystal-orb"
      : materialControls.nucleusShape === "liquid-core"
        ? "liquid-core"
      : "sphere";
  const currentShape = nucleusMesh?.userData?.shape;
  const cornerRadius = THREE.MathUtils.clamp(materialControls.nucleusCornerRadius ?? 0.12, 0, 0.8);
  const currentRadius = nucleusMesh?.userData?.cornerRadius ?? 0;
  const desiredShellLayers = materialControls.nucleusShellMode
    ? Math.max(0, Math.min(20, Math.floor(materialControls.nucleusShellLayers ?? 0)))
    : 0;
  const shellLayerChanged = nucleusShellMeshes.length !== desiredShellLayers;
  const shapeChanged = !nucleusMesh || currentShape !== desiredShape;
  const radiusChanged = desiredShape === "cube" && Math.abs(currentRadius - cornerRadius) > 0.0001;
  if (!nucleusMesh || currentShape !== desiredShape || radiusChanged) {
    if (nucleusMesh) {
      group.remove(nucleusMesh);
      nucleusMesh.geometry?.dispose?.();
      nucleusMesh = null;
    }
    if (nucleusShellMeshes.length) {
      for (let i = 0; i < nucleusShellMeshes.length; i++) {
        const m = nucleusShellMeshes[i];
        group.remove(m);
        m.geometry?.dispose?.();
      }
      nucleusShellMeshes = [];
    }
    if (nucleusRimMesh) {
      group.remove(nucleusRimMesh);
      nucleusRimMesh.geometry?.dispose?.();
      nucleusRimMesh = null;
    }
    if (nucleusGradientMesh) {
      group.remove(nucleusGradientMesh);
      nucleusGradientMesh.geometry?.dispose?.();
      nucleusGradientMesh = null;
    }
  }
  if (!nucleusMesh || shapeChanged || radiusChanged || shellLayerChanged) {
    if (nucleusMesh) {
      group.remove(nucleusMesh);
      nucleusMesh.geometry?.dispose?.();
      nucleusMesh = null;
    }
    if (nucleusShellMeshes.length) {
      for (let i = 0; i < nucleusShellMeshes.length; i++) {
        const m = nucleusShellMeshes[i];
        group.remove(m);
        m.geometry?.dispose?.();
      }
      nucleusShellMeshes = [];
    }
    if (nucleusRimMesh) {
      group.remove(nucleusRimMesh);
      nucleusRimMesh.geometry?.dispose?.();
      nucleusRimMesh = null;
    }
    if (nucleusGradientMesh) {
      group.remove(nucleusGradientMesh);
      nucleusGradientMesh.geometry?.dispose?.();
      nucleusGradientMesh = null;
    }
    const nucleusGeometry = markLiquidGeometry(createNucleusGeometry(desiredShape, cornerRadius));
    nucleusMesh = new THREE.Mesh(nucleusGeometry, getNucleusRenderMaterial());
    nucleusMesh.castShadow = true;
    nucleusMesh.receiveShadow = false;
    nucleusMesh.userData.shape = desiredShape;
    nucleusMesh.userData.cornerRadius = cornerRadius;
    group.add(nucleusMesh);

    for (let i = 0; i < desiredShellLayers; i++) {
      const shell = new THREE.Mesh(markLiquidGeometry(createNucleusGeometry(desiredShape, cornerRadius)), nucleusShellMaterial);
      shell.castShadow = false;
      shell.receiveShadow = false;
      shell.userData.shellIndex = i;
      shell.userData.shape = desiredShape;
      group.add(shell);
      nucleusShellMeshes.push(shell);
    }

    nucleusRimMesh = new THREE.Mesh(markLiquidGeometry(createNucleusGeometry(desiredShape, cornerRadius)), nucleusRimMaterial);
    nucleusRimMesh.castShadow = false;
    nucleusRimMesh.receiveShadow = false;
    group.add(nucleusRimMesh);

    nucleusGradientMesh = new THREE.Mesh(markLiquidGeometry(createNucleusGeometry(desiredShape, cornerRadius)), nucleusGradientMaterial);
    nucleusGradientMesh.castShadow = false;
    nucleusGradientMesh.receiveShadow = false;
    group.add(nucleusGradientMesh);
  }
  nucleusMesh.material = getNucleusRenderMaterial();
  nucleusMesh.visible = nucleusVisibleOnStartup;
  nucleusMesh.renderOrder = 20;
  nucleusMesh.position.set(0, materialControls.nucleusYOffset, 0);
  importSurfaceGroup.position.y = materialControls.nucleusYOffset;
  nucleusMesh.scale.setScalar(Math.max(0.05, materialControls.nucleusSize));
  if (nucleusShellMeshes.length) {
    const layerCount = Math.max(1, nucleusShellMeshes.length);
    for (let i = 0; i < nucleusShellMeshes.length; i++) {
      const shell = nucleusShellMeshes[i];
      const t = (i + 1) / (layerCount + 1);
      const layerShrink = Math.max(0.08, 1 - materialControls.nucleusShellThickness * (i + 1));
      shell.visible = nucleusMesh.visible;
      shell.renderOrder = 10 + i;
      shell.position.copy(nucleusMesh.position);
      shell.quaternion.copy(nucleusMesh.quaternion);
      shell.scale.copy(nucleusMesh.scale).multiplyScalar(Math.min(layerShrink, 1 - t * 0.04));
    }
  }
  if (nucleusRimMesh) {
    nucleusRimMesh.visible = nucleusMesh.visible && materialControls.nucleusRimStrength > 0.001;
    nucleusRimMesh.renderOrder = 30;
    nucleusRimMesh.position.copy(nucleusMesh.position);
    nucleusRimMesh.quaternion.copy(nucleusMesh.quaternion);
    nucleusRimMesh.scale.copy(nucleusMesh.scale).multiplyScalar(1.01);
  }
  if (nucleusGradientMesh) {
    const supportsGradientOverlay = materialControls.nucleusShape === "cube";
    nucleusGradientMesh.visible =
      nucleusMesh.visible &&
      supportsGradientOverlay &&
      materialControls.nucleusGradientMix > 0.001;
    nucleusGradientMesh.renderOrder = 31;
    nucleusGradientMesh.position.copy(nucleusMesh.position);
    nucleusGradientMesh.quaternion.copy(nucleusMesh.quaternion);
    nucleusGradientMesh.scale.copy(nucleusMesh.scale).multiplyScalar(1.005);
  }
  if (customMeshSurfaceRoot) buildImportedSurface(customMeshSurfaceRoot);
  updateOrbitFocus();
}

function forceApplyNucleusYOffset() {
  const y = Number(nucleusYOffsetInput?.value ?? materialControls.nucleusYOffset ?? 0);
  if (!Number.isFinite(y)) return;
  materialControls.nucleusYOffset = y;
  if (nucleusMesh) nucleusMesh.position.set(0, y, 0);
  importSurfaceGroup.position.y = y;
  if (nucleusShellMeshes.length) {
    for (let i = 0; i < nucleusShellMeshes.length; i++) {
      nucleusShellMeshes[i].position.y = y;
    }
  }
  if (nucleusRimMesh) nucleusRimMesh.position.y = y;
  if (nucleusGradientMesh) nucleusGradientMesh.position.y = y;
}

function updateOrbitFocus() {
  const hasNucleus = !!(nucleusMesh && nucleusMesh.visible);
  controls.target.set(0, 0, 0);
  const minZoom = hasNucleus
    ? Math.max(0.35, materialControls.nucleusSize * 0.22)
    : 1.2;
  controls.minDistance = minZoom;
}

function updateNucleusDynamicEnv() {
  const nucleusSupportsPanelEnv = materialControls.nucleusShape === "cube";
  if (!particleLightingEnabled || !nucleusMesh || !nucleusMesh.visible || !nucleusSupportsPanelEnv) return;
  nucleusEnvFrame = (nucleusEnvFrame + 1) % 3;
  if (nucleusEnvFrame !== 0) return;
  const wasVisible = nucleusMesh.visible;
  const shellWasVisible = nucleusShellMeshes.map((m) => m.visible);
  const rimWasVisible = nucleusRimMesh?.visible ?? false;
  const gradWasVisible = nucleusGradientMesh?.visible ?? false;
  nucleusMesh.visible = false;
  for (let i = 0; i < nucleusShellMeshes.length; i++) nucleusShellMeshes[i].visible = false;
  if (nucleusRimMesh) nucleusRimMesh.visible = false;
  if (nucleusGradientMesh) nucleusGradientMesh.visible = false;
  nucleusCubeCamera.position.copy(nucleusMesh.getWorldPosition(tempShadowCenter));
  nucleusCubeCamera.update(renderer, scene);
  nucleusMesh.visible = wasVisible;
  for (let i = 0; i < nucleusShellMeshes.length; i++) nucleusShellMeshes[i].visible = shellWasVisible[i] ?? false;
  if (nucleusRimMesh) nucleusRimMesh.visible = rimWasVisible;
  if (nucleusGradientMesh) nucleusGradientMesh.visible = gradWasVisible;
  nucleusMaterial.envMap = nucleusDynamicEnvRT.texture;
  nucleusShellMaterial.envMap = nucleusDynamicEnvRT.texture;
}

function updateImportedSurfaceDynamicEnv() {
  if (customReflectionEnvMap) {
    importedSurfaceMaterial.envMap = customReflectionEnvMap;
    return;
  }
  if (!importSurfaceGroup.visible || !importSurfaceGroup.children.length) return;
  importedEnvFrame = (importedEnvFrame + 1) % 4;
  if (importedEnvFrame !== 0) return;
  importedEnvBox.setFromObject(importSurfaceGroup);
  if (importedEnvBox.isEmpty()) return;
  importedEnvBox.getCenter(importedEnvCenter);
  const wasVisible = importSurfaceGroup.visible;
  const sceneryWasVisible = reflectionSceneryGroup.visible;
  importSurfaceGroup.visible = false;
  reflectionSceneryGroup.visible = true;
  importedCubeCamera.position.copy(importedEnvCenter);
  importedCubeCamera.update(renderer, scene);
  importSurfaceGroup.visible = wasVisible;
  reflectionSceneryGroup.visible = sceneryWasVisible;
  importedSurfaceMaterial.envMap = importedDynamicEnvRT.texture;
}

function loadReflectionImageEnv(url, label = "Reflection image", revokeAfterLoad = false) {
  if (!url) return;
  const loader = new THREE.TextureLoader();
  loader.load(
    url,
    (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const envRT = pmremGenerator.fromEquirectangular(tex);
      customReflectionTexture?.dispose?.();
      customReflectionEnvRT?.dispose?.();
      customReflectionTexture = tex;
      customReflectionEnvRT = envRT;
      customReflectionEnvMap = envRT.texture;
      scene.environment = customReflectionEnvMap;
      importedSurfaceMaterial.envMap = customReflectionEnvMap;
      importedSurfaceMaterial.needsUpdate = true;
      setStatus(`${label} applied (hidden, reflections only).`);
      if (revokeAfterLoad) URL.revokeObjectURL(url);
    },
    undefined,
    (err) => {
      console.error(err);
      setStatus("Could not load reflection image.", true);
      if (revokeAfterLoad) URL.revokeObjectURL(url);
    }
  );
}

function applyLoadedReflectionEnvTexture(tex, label, revokeUrl = null) {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const envRT = pmremGenerator.fromEquirectangular(tex);
  customReflectionTexture?.dispose?.();
  customReflectionEnvRT?.dispose?.();
  customReflectionTexture = tex;
  customReflectionEnvRT = envRT;
  customReflectionEnvMap = envRT.texture;
  scene.environment = customReflectionEnvMap;
  importedSurfaceMaterial.envMap = customReflectionEnvMap;
  importedSurfaceMaterial.needsUpdate = true;
  setStatus(`${label} (hidden, reflections only).`);
  if (revokeUrl) URL.revokeObjectURL(revokeUrl);
}

function loadReflectionImageEnvFromFile(file) {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  const lowerName = String(file.name || "").toLowerCase();
  const isExr = lowerName.endsWith(".exr");
  const isHdr = lowerName.endsWith(".hdr");
  if (!isExr && !isHdr) {
    loadReflectionImageEnv(objectUrl, `Reflection image applied: ${file.name}`, true);
    return;
  }

  const highRangeLoader = isHdr ? new RGBELoader() : new EXRLoader();
  highRangeLoader.load(
    objectUrl,
    (tex) => applyLoadedReflectionEnvTexture(tex, `Reflection ${isHdr ? "HDR" : "EXR"} applied: ${file.name}`, objectUrl),
    undefined,
    (err) => {
      console.error(err);
      setStatus(`Could not load reflection ${isHdr ? "HDR" : "EXR"}.`, true);
      URL.revokeObjectURL(objectUrl);
    }
  );
}

function loadReflectionImageEnvFromUrl(url, label = "Reflection image") {
  const lower = String(url || "").toLowerCase();
  if (lower.endsWith(".exr") || lower.endsWith(".hdr")) {
    return new Promise((resolve) => {
      const highRangeLoader = lower.endsWith(".hdr") ? new RGBELoader() : new EXRLoader();
      highRangeLoader.load(
        url,
        (tex) => {
          applyLoadedReflectionEnvTexture(tex, `${label} applied`);
          resolve(true);
        },
        undefined,
        (err) => {
          console.error(err);
          setStatus(`Could not load ${label.toLowerCase()}.`, true);
          resolve(false);
        }
      );
    });
  }
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        const envRT = pmremGenerator.fromEquirectangular(tex);
        customReflectionTexture?.dispose?.();
        customReflectionEnvRT?.dispose?.();
        customReflectionTexture = tex;
        customReflectionEnvRT = envRT;
        customReflectionEnvMap = envRT.texture;
        scene.environment = customReflectionEnvMap;
        importedSurfaceMaterial.envMap = customReflectionEnvMap;
        importedSurfaceMaterial.needsUpdate = true;
        setStatus(`${label} applied (hidden, reflections only).`);
        resolve(true);
      },
      undefined,
      (err) => {
        console.error(err);
        setStatus(`Could not load ${label.toLowerCase()}.`, true);
        resolve(false);
      }
    );
  });
}

async function loadCustomMeshFromFile(file, statusPrefix = "Mesh loaded") {
  if (!file) return false;
  customMeshFile = file;
  setStatus("Loading mesh shape...");
  try {
    const asset = await buildMeshAssetFromFile(file, sphereCount, baseShapeRadius);
    customMeshPoints = asset.points;
    customMeshSurfaceRoot = asset.root;
    importedSurfaceVisible = true;
    if (showImportedSurfaceInput) showImportedSurfaceInput.checked = true;
    buildImportedSurface(customMeshSurfaceRoot);
    applyMaterialControls();
    customMeshOption.disabled = false;
    shapeSelect.value = "custom-mesh";
    applyPresetFromSelect();
    setStatus(`${statusPrefix}: ${file.name}`);
    return true;
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Could not build shape from that mesh.", true);
    return false;
  }
}

async function loadCustomMeshFromUrl(url, filename = DEFAULT_STARTUP_MESH_FILENAME, statusPrefix = "Startup mesh loaded") {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || "model/gltf-binary" });
    return await loadCustomMeshFromFile(file, statusPrefix);
  } catch (err) {
    console.error(err);
    setStatus(`Could not load startup mesh (${filename}).`, true);
    return false;
  }
}

const motionControls = {
  travelSpeed: Number(travelSpeedInput?.value ?? 8)
};

function readMotionControls() {
  motionControls.travelSpeed = Number(travelSpeedInput?.value ?? motionControls.travelSpeed);
}

function applyMaterialControls() {
  const internalDetails = internalDetailShadingInput?.checked ?? true;
  const sphereShadowsEnabled = (sphereShadowsInput?.checked ?? true) && particleLightingEnabled;
  const shadowContrast = THREE.MathUtils.clamp(materialControls.shadowContrast ?? 1, 0, 2.5);
  contactShadowPlane.material.opacity = 0;
  const nucleusTransmission = THREE.MathUtils.clamp(materialControls.nucleusTransmission ?? 0.18, 0, 1);
  const nucleusTintMix = THREE.MathUtils.clamp(materialControls.nucleusReflectTintMix ?? 0, 0, 1);
  const finalNucleusColor = new THREE.Color(materialControls.nucleusColor);
  finalNucleusColor.lerp(new THREE.Color(materialControls.nucleusReflectTint), nucleusTintMix * (0.35 + nucleusTransmission * 0.65));
  externalParticleMaterial.color.set(materialControls.color);
  internalParticleMaterial.color.set(materialControls.internalColor);
  nucleusMaterial.color.copy(finalNucleusColor);
  externalParticleBasicMaterial.color.set(materialControls.color);
  internalParticleBasicMaterial.color.set(materialControls.internalColor);
  nucleusBasicMaterial.color.copy(finalNucleusColor);
  externalParticleMaterial.transparent = materialControls.opacity < 0.999;
  internalParticleMaterial.transparent = materialControls.opacity < 0.999;
  nucleusMaterial.transparent = materialControls.nucleusOpacity < 0.999;
  externalParticleBasicMaterial.transparent = materialControls.opacity < 0.999;
  internalParticleBasicMaterial.transparent = materialControls.opacity < 0.999;
  nucleusBasicMaterial.transparent = materialControls.nucleusOpacity < 0.999;
  externalParticleMaterial.opacity = materialControls.opacity;
  internalParticleMaterial.opacity = materialControls.opacity;
  nucleusMaterial.opacity = materialControls.nucleusOpacity;
  externalParticleBasicMaterial.opacity = materialControls.opacity;
  internalParticleBasicMaterial.opacity = materialControls.opacity;
  nucleusBasicMaterial.opacity = materialControls.nucleusOpacity;
  const extBaseMetalness = 0.06 + materialControls.glare * 0.45;
  const extBaseRoughness = 0.92 - materialControls.glare * 0.55;
  const extMatte = Math.max(0, Math.min(1, materialControls.matte));
  externalParticleMaterial.metalness = extBaseMetalness * (1 - extMatte);
  externalParticleMaterial.roughness = extBaseRoughness * (1 - extMatte) + 1.0 * extMatte;
  externalParticleMaterial.emissive.set(0x050505);
  externalParticleMaterial.emissiveIntensity = 0.04 + materialControls.glow * 0.14;
  externalShadowUniforms.uSharedShadowStrength.value = sphereShadowsEnabled ? 0.5 * shadowContrast : 0.0;
  externalShadowUniforms.uSharedShadowSoftness.value = 0.2;
  const chromeGlare = Math.max(0, Math.min(1, materialControls.nucleusGlare));
  const nucleusMatte = Math.max(0, Math.min(1, materialControls.nucleusMatte));
  const cubePlasticBias = materialControls.nucleusShape === "cube" ? 1 : 0;
  const nucleusSupportsPanelEnv = materialControls.nucleusShape === "cube";
  const roundNucleusLayers = materialControls.nucleusShape !== "cube";
  const roundGlassShape = materialControls.nucleusShape === "sphere" ||
    materialControls.nucleusShape === "crystal-orb" ||
    materialControls.nucleusShape === "liquid-core";
  const mattePower = nucleusMatte * nucleusMatte;
  const opacityGlassBoost = THREE.MathUtils.clamp((1 - materialControls.nucleusOpacity) * 1.8, 0, 1);
  const effectiveTransmission = THREE.MathUtils.clamp(
    Math.max(nucleusTransmission, opacityGlassBoost),
    0,
    1
  );
  nucleusMaterial.metalness = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(0.82, 0.95, chromeGlare) *
      (1 - effectiveTransmission * 0.96) *
      (1 - mattePower * 0.92 - cubePlasticBias * mattePower * 0.06),
    0,
    1
  );
  nucleusMaterial.roughness = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(0.02, 0.82, nucleusMatte) * THREE.MathUtils.lerp(1.0, 0.72, chromeGlare),
    0,
    1
  );
  nucleusMaterial.transmission = THREE.MathUtils.clamp(
    effectiveTransmission * (1 - mattePower * (0.82 + cubePlasticBias * 0.1)),
    0,
    1
  );
  nucleusMaterial.thickness = Math.max(
    0,
    (materialControls.nucleusThickness ?? 1.2) * (1 + mattePower * (0.9 + cubePlasticBias * 0.2))
  );
  if (roundGlassShape) {
    nucleusMaterial.thickness = Math.min(nucleusMaterial.thickness, 0.9);
  }
  nucleusMaterial.attenuationColor.set(materialControls.nucleusAttenuationColor || "#d8ecff");
  nucleusMaterial.attenuationDistance = Math.max(0.1, materialControls.nucleusAttenuationDistance ?? 4.0);
  nucleusMaterial.specularIntensity = THREE.MathUtils.clamp(materialControls.nucleusSpecular ?? 1.0, 0, 1);
  nucleusMaterial.specularColor.set(materialControls.nucleusSpecularColor || "#ffffff");
  nucleusMaterial.clearcoat = THREE.MathUtils.clamp((materialControls.nucleusClearcoat ?? 1.0) * (1 - mattePower * 0.75), 0, 1);
  nucleusMaterial.clearcoatRoughness = THREE.MathUtils.clamp(
    (materialControls.nucleusClearcoatRoughness ?? 0.08) * THREE.MathUtils.lerp(1.0, 2.8, nucleusMatte),
    0,
    1
  );
  nucleusMaterial.envMap = nucleusSupportsPanelEnv ? chromeEnvMap : null;
  nucleusMaterial.envMapIntensity = nucleusSupportsPanelEnv
    ? Math.max(0, materialControls.nucleusEnvIntensity ?? 3.2) *
      THREE.MathUtils.lerp(0.75, 1.15, chromeGlare) *
      (1 - mattePower * 0.55)
    : 0;
  nucleusMaterial.iridescence = THREE.MathUtils.clamp((materialControls.nucleusIridescence ?? 0.65) * (1 - mattePower * 0.85), 0, 1);
  nucleusMaterial.iridescenceIOR = THREE.MathUtils.clamp(THREE.MathUtils.lerp(1.2, 1.6, chromeGlare), 1, 2.333);
  nucleusMaterial.ior = THREE.MathUtils.clamp(materialControls.nucleusIor ?? 2.2, 1, 2.333);
  nucleusMaterial.emissive.set(0xffffff);
  nucleusMaterial.emissiveIntensity = 0.02 + materialControls.nucleusGlow * 0.07;
  nucleusMaterial.side = roundGlassShape
    ? THREE.FrontSide
    : materialControls.nucleusOpacity < 0.999
      ? THREE.DoubleSide
      : THREE.FrontSide;
  nucleusMaterial.depthWrite = roundGlassShape
    ? false
    : materialControls.nucleusOpacity >= 0.999;
  nucleusMaterial.forceSinglePass = roundGlassShape || materialControls.nucleusOpacity < 0.999;
  const nucleusSupportsSharedShadow = materialControls.nucleusShape === "cube";
  nucleusShadowUniforms.uSharedShadowStrength.value =
    sphereShadowsEnabled && nucleusSupportsSharedShadow ? 0.2 * shadowContrast : 0.0;
  nucleusShadowUniforms.uSharedShadowSoftness.value = 0.28;
  if (!nucleusNoiseTexture) nucleusNoiseTexture = makeNoiseTexture(256);
  const noiseAmount = Math.max(0, materialControls.nucleusNoiseAmount ?? 0);
  const noiseScale = Math.max(0.2, materialControls.nucleusNoiseScale ?? 1.4);
  nucleusNoiseTexture.repeat.set(noiseScale, noiseScale);
  nucleusNoiseTexture.needsUpdate = true;
  const supportsUvNoise = materialControls.nucleusShape === "cube";
  if (noiseAmount > 0.0001 && supportsUvNoise) {
    nucleusMaterial.bumpMap = nucleusNoiseTexture;
    nucleusMaterial.bumpScale = noiseAmount * 0.22;
    nucleusMaterial.roughnessMap = nucleusNoiseTexture;
  } else {
    nucleusMaterial.bumpMap = null;
    nucleusMaterial.bumpScale = 0;
    nucleusMaterial.roughnessMap = null;
  }
  nucleusShellMaterial.color.set(materialControls.nucleusShellColor || "#9fc6ff");
  nucleusShellMaterial.transparent = true;
  nucleusShellMaterial.opacity = roundNucleusLayers
    ? THREE.MathUtils.clamp(materialControls.nucleusOpacity * 0.18, 0.02, 0.18)
    : THREE.MathUtils.clamp(materialControls.nucleusOpacity * 0.55, 0.05, 0.75);
  nucleusShellMaterial.transmission = roundNucleusLayers
    ? 0
    : THREE.MathUtils.clamp(nucleusMaterial.transmission * 0.85 + 0.08, 0, 1);
  nucleusShellMaterial.thickness = Math.max(0.01, (materialControls.nucleusShellThickness ?? 0.08) * 2.8);
  nucleusShellMaterial.roughness = THREE.MathUtils.clamp(nucleusMaterial.roughness * 0.75 + 0.08, 0, 1);
  nucleusShellMaterial.metalness = THREE.MathUtils.clamp(nucleusMaterial.metalness * 0.35, 0, 1);
  nucleusShellMaterial.envMap = nucleusSupportsPanelEnv ? chromeEnvMap : null;
  nucleusShellMaterial.envMapIntensity = nucleusSupportsPanelEnv
    ? Math.max(0.2, nucleusMaterial.envMapIntensity * 0.85)
    : 0;
  nucleusShellMaterial.depthWrite = false;
  nucleusShellMaterial.forceSinglePass = true;
  nucleusShellMaterial.side = roundNucleusLayers ? THREE.FrontSide : THREE.DoubleSide;
  if (roundGlassShape) nucleusShellMaterial.thickness = Math.min(nucleusShellMaterial.thickness, 0.16);
  nucleusRimMaterial.uniforms.uColor.value.set(materialControls.nucleusRimColor || "#cfe3ff");
  const rimPowerRaw = THREE.MathUtils.clamp(materialControls.nucleusRimPower ?? 2.6, 0.5, 8.0);
  const rimPowerNorm = (rimPowerRaw - 0.5) / 7.5;
  const rimPowerMapped = THREE.MathUtils.lerp(0.2, 11.5, Math.pow(rimPowerNorm, 1.15));
  const rimStrengthRaw = Math.max(0, materialControls.nucleusRimStrength ?? 0.35);
  const rimStrengthMapped = rimStrengthRaw * THREE.MathUtils.lerp(1.35, 0.9, rimPowerNorm);
  nucleusRimMaterial.uniforms.uPower.value = rimPowerMapped;
  nucleusRimMaterial.uniforms.uStrength.value = rimStrengthMapped;
  nucleusGradientMaterial.uniforms.uTop.value.set(materialControls.nucleusGradientTop || "#ffffff");
  nucleusGradientMaterial.uniforms.uBottom.value.set(materialControls.nucleusGradientBottom || "#7ea5ff");
  nucleusGradientMaterial.uniforms.uMix.value = Math.max(0, Math.min(1, materialControls.nucleusGradientMix ?? 0.15));
  bloomPass.strength = Math.max(0, materialControls.nucleusBloomStrength ?? 0.7);
  bloomPass.radius = Math.max(0, Math.min(1, materialControls.nucleusBloomRadius ?? 0.35));
  bloomPass.threshold = Math.max(0, Math.min(1, materialControls.nucleusBloomThreshold ?? 0.75));
  bloomPass.enabled = !!materialControls.nucleusBloomEnabled;

  if (internalDetails) {
    const intBaseMetalness = 0.06 + materialControls.glare * 0.45;
    const intBaseRoughness = 0.92 - materialControls.glare * 0.55;
    const intMatte = Math.max(0, Math.min(1, materialControls.internalMatte));
    internalParticleMaterial.metalness = intBaseMetalness * (1 - intMatte);
    internalParticleMaterial.roughness = intBaseRoughness * (1 - intMatte) + 1.0 * intMatte;
    internalParticleMaterial.emissive.set(0x050505);
    internalParticleMaterial.emissiveIntensity = 0.04 + materialControls.glow * 0.14;
    internalShadowUniforms.uSharedShadowStrength.value = sphereShadowsEnabled ? 0.5 * shadowContrast : 0.0;
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
  nucleusMaterial.needsUpdate = true;
  nucleusShellMaterial.needsUpdate = true;
  nucleusRimMaterial.needsUpdate = true;
  nucleusGradientMaterial.needsUpdate = true;
  externalParticleBasicMaterial.needsUpdate = true;
  internalParticleBasicMaterial.needsUpdate = true;
  nucleusBasicMaterial.needsUpdate = true;

  // Imported surface: physically-plausible glass settings.
  const surfaceChroma = THREE.MathUtils.clamp(materialControls.surfaceChroma ?? 0, 0, 1);
  const importedOpacity = THREE.MathUtils.clamp(materialControls.nucleusOpacity ?? 1, 0.2, 1);
  const requestedTransmission = THREE.MathUtils.clamp(materialControls.nucleusTransmission ?? 1, 0, 1);
  const glassVisibility = THREE.MathUtils.smoothstep(importedOpacity, 0.86, 1.0);
  const depthTransmissionCut = THREE.MathUtils.clamp((materialControls.nucleusThickness ?? 1.2) * 0.035, 0, 0.2);
  const physicalTransmission = requestedTransmission * glassVisibility * (1 - depthTransmissionCut);
  const importedThickness = THREE.MathUtils.clamp(materialControls.nucleusThickness ?? 1.2, 0.1, 6.0);
  const importedIor = THREE.MathUtils.clamp(materialControls.nucleusIor ?? 1.52, 1.45, 1.7);
  const microRoughness = THREE.MathUtils.clamp((materialControls.nucleusNoiseAmount ?? 0) * 0.03, 0, 0.04);
  const baseRoughness = THREE.MathUtils.lerp(0.008, 0.09, nucleusMatte);
  const roughnessFromThickness = THREE.MathUtils.clamp(importedThickness * 0.007, 0, 0.03);
  const glassRoughness = THREE.MathUtils.clamp(
    baseRoughness + microRoughness + roughnessFromThickness,
    0.006,
    0.12
  );

  // Keep color control visibly responsive while preserving a glassy highlight lift.
  importedSurfaceMaterial.color.copy(finalNucleusColor).lerp(new THREE.Color("#f6fbff"), 0.22);
  importedSurfaceMaterial.opacity = importedOpacity;
  importedSurfaceMaterial.transmission = physicalTransmission;
  importedSurfaceMaterial.roughness = glassRoughness;
  importedSurfaceMaterial.metalness = 0;
  importedSurfaceMaterial.ior = importedIor;
  const depthDetailBoost = THREE.MathUtils.clamp(
    0.82 + importedThickness * 0.2 + (materialControls.nucleusNoiseAmount ?? 0) * 0.22,
    0.9,
    2.15
  );
  importedSurfaceMaterial.thickness = THREE.MathUtils.clamp(importedThickness * depthDetailBoost, 0.2, 8.5);
  const thicknessUvScale = THREE.MathUtils.clamp((materialControls.nucleusNoiseScale ?? 1.4) * 0.95, 0.6, 4.8);
  importedThicknessTexture.repeat.set(thicknessUvScale, thicknessUvScale);
  importedThicknessTexture.needsUpdate = true;
  importedSurfaceMaterial.thicknessMap = importedThicknessTexture;
  const chromaTint = new THREE.Color(finalNucleusColor);
  chromaTint.offsetHSL(0.06 * surfaceChroma, 0.2 * surfaceChroma, 0.04 * surfaceChroma);
  importedSurfaceMaterial.attenuationColor.copy(finalNucleusColor).lerp(new THREE.Color("#ffffff"), 0.22 - surfaceChroma * 0.08);
  importedSurfaceMaterial.attenuationDistance = THREE.MathUtils.clamp(
    (materialControls.nucleusAttenuationDistance ?? 4.0) / (0.45 + importedSurfaceMaterial.thickness * 0.36),
    0.14,
    8.5
  );
  importedSurfaceMaterial.specularIntensity = THREE.MathUtils.clamp((materialControls.nucleusSpecular ?? 1.0) * 1.15, 1.0, 1.35);
  importedSurfaceMaterial.specularColor
    .set(materialControls.nucleusSpecularColor || "#ffffff")
    .lerp(finalNucleusColor, 0.3 + surfaceChroma * 0.25);
  importedSurfaceMaterial.clearcoat = THREE.MathUtils.clamp((materialControls.nucleusClearcoat ?? 0.4) * 0.45, 0.06, 0.42);
  importedSurfaceMaterial.clearcoatRoughness = THREE.MathUtils.clamp(
    0.045 + (materialControls.nucleusClearcoatRoughness ?? 0.08) * 0.15,
    0.035,
    0.16
  );
  importedSurfaceMaterial.iridescence = THREE.MathUtils.clamp(surfaceChroma * 0.42, 0, 0.42);
  importedSurfaceMaterial.iridescenceIOR = THREE.MathUtils.clamp(THREE.MathUtils.lerp(1.3, 1.75, surfaceChroma), 1.3, 1.9);
  importedSurfaceMaterial.iridescenceThicknessRange = [
    Math.round(120 + surfaceChroma * 120),
    Math.round(220 + surfaceChroma * 920)
  ];
  if (!nucleusNoiseTexture) nucleusNoiseTexture = makeNoiseTexture(256);
  nucleusNoiseTexture.repeat.set(
    Math.max(0.8, materialControls.nucleusNoiseScale ?? 1.4),
    Math.max(0.8, materialControls.nucleusNoiseScale ?? 1.4)
  );
  importedSurfaceMaterial.bumpMap = nucleusNoiseTexture;
  importedSurfaceMaterial.bumpScale = microRoughness * 0.25;
  importedSurfaceMaterial.roughnessMap = nucleusNoiseTexture;
  const reflectionStrength = THREE.MathUtils.clamp(materialControls.reflectionStrength ?? 1.8, 0, 4);
  const customReflectionBoost = customReflectionEnvMap ? 1.45 : 1.0;
  importedSurfaceMaterial.envMap = customReflectionEnvMap || importedSurfaceMaterial.envMap || chromeEnvMap;
  importedSurfaceMaterial.envMapIntensity = THREE.MathUtils.clamp(
    (materialControls.nucleusEnvIntensity ?? 3.2) *
      (0.62 + physicalTransmission * 0.36 - glassRoughness * 0.45 + surfaceChroma * 0.15) *
      reflectionStrength *
      customReflectionBoost,
    0.8,
    6.2
  );
  importedSurfaceMaterial.emissive.set(0x000000);
  importedSurfaceMaterial.emissiveIntensity = 0;
  importedSurfaceMaterial.alphaHash = false;
  importedSurfaceMaterial.alphaTest = 0;
  importedSurfaceMaterial.transparent = importedOpacity < 0.999;
  importedSurfaceMaterial.side = THREE.FrontSide;
  importedSurfaceMaterial.shadowSide = THREE.FrontSide;
  importedSurfaceMaterial.depthWrite = importedOpacity >= 0.999;
  importedSurfaceMaterial.forceSinglePass = false;
  importedSurfaceMaterial.depthTest = true;
  importedShadowUniforms.uSharedShadowStrength.value = sphereShadowsEnabled ? 0.18 * shadowContrast : 0.0;
  importedShadowUniforms.uSharedShadowSoftness.value = 0.34;
  importedSurfaceMaterial.needsUpdate = true;
  syncImportedSurfaceMaterials();
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
let oneWayOrbitBandMetrics = [];
let oneWayOrbitBandArcData = [];
let oneWayOrbitBandYCenters = [];
let oneWayOrbitYMin = 0;
let oneWayOrbitYMax = 1;
let faceHorizontalOrbitBandArcData = [];
let internalOrbitMetrics = { circumference: 1 };
let internalOrbitArcData = { cumulative: [0, 1], total: 1 };
let tornadoBaseCircumference = 1;
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
let nucleusMesh = null;
let nucleusShellMeshes = [];
let nucleusRimMesh = null;
let nucleusGradientMesh = null;
let nucleusEnvFrame = 0;
const nucleusVisibleOnStartup = false;
let movementMode = FIXED_MOVEMENT_MODE;
let internalMovementMode = FIXED_INTERNAL_MOVEMENT_MODE;
let oneWayDirection = "right";
let collisionEnabled = collisionEnabledInput?.checked ?? true;
let faceMinTravel = FIXED_FACE_MIN_TRAVEL;
let forceAllSurfacePoints = false;
const radialDirs = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0)
];

function randomParticleMotion(p) {
  const internalMul = p.isInternal ? FIXED_INTERNAL_SPEED : 1;
  p.pathSpeed = (0.08 + motionControls.travelSpeed * 0.018) * internalMul;
  p.followRate = p.isInternal ? 9.8 : 8.8;
  p.turnTimer = 0.16;
}

function computeOrbitMetrics(indices, points) {
  if (!indices || indices.length < 2) return { circumference: 1 };
  let circumference = 0;
  for (let i = 0; i < indices.length; i++) {
    const a = points[indices[i]];
    const b = points[indices[(i + 1) % indices.length]];
    circumference += a.distanceTo(b);
  }
  return { circumference: Math.max(0.0001, circumference) };
}

function buildOrbitArcData(indices, points) {
  if (!indices || !indices.length) return { cumulative: [0, 1], total: 1 };
  if (indices.length === 1) return { cumulative: [0, 1], total: 1 };
  const cumulative = new Array(indices.length + 1).fill(0);
  let total = 0;
  for (let i = 0; i < indices.length; i++) {
    const a = points[indices[i]];
    const b = points[indices[(i + 1) % indices.length]];
    total += a.distanceTo(b);
    cumulative[i + 1] = total;
  }
  if (total < 0.0001) {
    return { cumulative: [0, 1], total: 1 };
  }
  return { cumulative, total };
}

function sampleBandByPhase(band, arcData, phase, outPos) {
  if (!band || !band.length) return { currentIndex: 0, nextIndex: 0, slot: 0 };
  if (band.length === 1) {
    outPos.copy(currentShapePoints[band[0]]);
    return { currentIndex: band[0], nextIndex: band[0], slot: 0 };
  }

  const normalizedPhase = ((phase % 1) + 1) % 1;
  const total = Math.max(0.0001, arcData?.total || 1);
  const cumulative = arcData?.cumulative || [0, total];
  const dist = normalizedPhase * total;

  let lo = 0;
  let hi = band.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid + 1] <= dist) lo = mid + 1;
    else hi = mid - 1;
  }
  const slot = Math.max(0, Math.min(band.length - 1, lo));
  const segStart = cumulative[slot] ?? 0;
  const segEnd = cumulative[slot + 1] ?? total;
  const segLen = Math.max(0.000001, segEnd - segStart);
  const frac = (dist - segStart) / segLen;

  const currentIndex = band[slot];
  const nextIndex = band[(slot + 1) % band.length];
  outPos.copy(currentShapePoints[currentIndex]).lerp(currentShapePoints[nextIndex], frac);
  return { currentIndex, nextIndex, slot };
}

function rebuildTornadoMetrics(points) {
  oneWayOrbitBandMetrics = oneWayOrbitBands.map((band) => computeOrbitMetrics(band, points));
  oneWayOrbitBandArcData = oneWayOrbitBands.map((band) => buildOrbitArcData(band, points));
  oneWayOrbitBandYCenters = oneWayOrbitBands.map((band) => {
    if (!band || !band.length) return 0;
    let sumY = 0;
    for (let i = 0; i < band.length; i++) sumY += points[band[i]].y;
    return sumY / band.length;
  });
  if (oneWayOrbitBandYCenters.length) {
    oneWayOrbitYMin = Math.min(...oneWayOrbitBandYCenters);
    oneWayOrbitYMax = Math.max(...oneWayOrbitBandYCenters);
  } else {
    oneWayOrbitYMin = 0;
    oneWayOrbitYMax = 1;
  }
  faceHorizontalOrbitBandArcData = faceHorizontalOrbitBands.map((band) => buildOrbitArcData(band, points));
  internalOrbitMetrics = computeOrbitMetrics(internalOrbitIndices, points);
  internalOrbitArcData = buildOrbitArcData(internalOrbitIndices, points);
  const samples = [];
  for (let i = 0; i < oneWayOrbitBandMetrics.length; i++) {
    const c = oneWayOrbitBandMetrics[i]?.circumference || 0;
    if (c > 0.0001) samples.push(c);
  }
  for (let i = 0; i < faceHorizontalOrbitBandArcData.length; i++) {
    const c = faceHorizontalOrbitBandArcData[i]?.total || 0;
    if (c > 0.0001) samples.push(c);
  }
  if ((internalOrbitMetrics?.circumference || 0) > 0.0001) {
    samples.push(internalOrbitMetrics.circumference);
  }
  if (!samples.length) {
    tornadoBaseCircumference = 1;
    return;
  }
  samples.sort((a, b) => a - b);
  tornadoBaseCircumference = samples[(samples.length / 2) | 0];
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

function fract(v) {
  return v - Math.floor(v);
}

function hash2(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function noise2D(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash2(x0, y0);
  const b = hash2(x1, y0);
  const c = hash2(x0, y1);
  const d = hash2(x1, y1);
  const ab = a + (b - a) * sx;
  const cd = c + (d - c) * sx;
  return ab + (cd - ab) * sy;
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
    const scale = p.isInternal ? FIXED_INTERNAL_SIZE : FIXED_EXTERNAL_SIZE;
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
    getExternalRenderMaterial(),
    Math.max(1, externalCount)
  );
  internalParticleMesh = new THREE.InstancedMesh(
    particleGeometry,
    getInternalRenderMaterial(),
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
  syncParticleVisibility();

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
      tornadoPhaseJitter: 0.92 + Math.random() * 0.16,
      tornadoBowAmp: 0.02 + Math.random() * 0.05,
      tornadoShearAmp: 0.01 + Math.random() * 0.035,
      tornadoSpikeAmp: 0.015 + Math.random() * 0.06,
      tornadoFreq: 0.7 + Math.random() * 1.4,
      tornadoSpikeRate: 1.1 + Math.random() * 1.7,
      tornadoPhaseOffset: Math.random() * Math.PI * 2,
      tornadoSpikePhase: Math.random() * Math.PI * 2,
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
    oneWayOrbitBandMetrics = [];
    oneWayOrbitBandArcData = [];
    faceHorizontalOrbitBandArcData = [];
    internalOrbitMetrics = { circumference: 1 };
    internalOrbitArcData = { cumulative: [0, 1], total: 1 };
    tornadoBaseCircumference = 1;
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
  rebuildTornadoMetrics(points);
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
  return;
}

function chooseNextIndexNormal(p) {
  const neighbors = shapeNeighbors[p.currentIndex];
  if (!neighbors || neighbors.length === 0) return p.currentIndex;

  const jitter = 0;
  const branchChance = 0.0;
  const reverseChance = 0.0;
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

function applyBasePoints(basePoints, forceSurface = false) {
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
let customMeshSurfaceRoot = null;
let resampleRequestId = 0;

function applyPresetFromSelect() {
  const selected = shapeSelect.value;
  syncImportedSurfaceVisibility();

  if (selected === "custom-image") {
    if (!customImagePoints) {
      setStatus("Upload an image first, then choose Custom Image.", true);
      return;
    }
    applyBasePoints(customImagePoints, false);
    setStatus("Applied custom image shape.");
    return;
  }

  if (selected === "custom-mesh") {
    if (!customMeshPoints) {
      setStatus("Upload a mesh first, then choose Custom Mesh.", true);
      return;
    }
    applyBasePoints(customMeshPoints, true);
    syncImportedSurfaceVisibility();
    setStatus("Applied custom mesh shape.");
    return;
  }

  applyBasePoints(buildPresetShapePoints(selected, sphereCount, baseShapeRadius), false);
  syncImportedSurfaceVisibility();
  setStatus(`Applied preset: ${selected}.`);
}

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
  await loadCustomMeshFromFile(file, "Mesh loaded");
});

reflectionImageBtn?.addEventListener("click", () => {
  reflectionImageInput?.click();
});

reflectionImageInput?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  loadReflectionImageEnvFromFile(file);
});

function setControlValue(input, value) {
  if (!input) return;
  if (input.type === "checkbox") input.checked = !!value;
  else input.value = String(value);
}

function applyNucleusPreset(name) {
  const preset = String(name || "custom");
  materialControls.nucleusPreset = preset;
  if (preset === "custom") return;
  const map = {
    chrome: {
      nucleusGlare: 0.95,
      nucleusMatte: 0.08,
      nucleusTransmission: 0.12,
      nucleusThickness: 1.5,
      nucleusIridescence: 0.45,
      nucleusEnvIntensity: 4.6,
      nucleusReflectTintMix: 0.08,
      nucleusNoiseAmount: 0.08,
      nucleusRimStrength: 0.22,
      nucleusGradientMix: 0.05
    },
    plastic: {
      nucleusGlare: 0.35,
      nucleusMatte: 0.9,
      nucleusTransmission: 0.03,
      nucleusThickness: 2.4,
      nucleusIridescence: 0.02,
      nucleusEnvIntensity: 1.2,
      nucleusReflectTintMix: 0.2,
      nucleusNoiseAmount: 0.5,
      nucleusRimStrength: 0.4,
      nucleusGradientMix: 0.18
    },
    glass: {
      nucleusGlare: 0.92,
      nucleusMatte: 0.08,
      nucleusTransmission: 0.95,
      nucleusThickness: 2.1,
      nucleusIridescence: 0.22,
      nucleusEnvIntensity: 3.8,
      nucleusReflectTintMix: 0.03,
      nucleusNoiseAmount: 0.02,
      nucleusRimStrength: 0.75,
      nucleusGradientMix: 0.08
    },
    frosted: {
      nucleusGlare: 0.55,
      nucleusMatte: 0.82,
      nucleusTransmission: 0.78,
      nucleusThickness: 2.8,
      nucleusIridescence: 0.05,
      nucleusEnvIntensity: 1.8,
      nucleusReflectTintMix: 0.12,
      nucleusNoiseAmount: 0.65,
      nucleusNoiseScale: 3.4,
      nucleusRimStrength: 0.5,
      nucleusGradientMix: 0.14
    },
    holographic: {
      nucleusGlare: 1.0,
      nucleusMatte: 0.18,
      nucleusTransmission: 0.5,
      nucleusThickness: 1.7,
      nucleusIridescence: 1.0,
      nucleusEnvIntensity: 4.8,
      nucleusReflectTintMix: 0.4,
      nucleusNoiseAmount: 0.15,
      nucleusRimStrength: 1.1,
      nucleusRimPower: 3.5,
      nucleusGradientMix: 0.35
    }
  }[preset];
  if (!map) return;
  Object.assign(materialControls, map);
  setControlValue(nucleusGlareInput, materialControls.nucleusGlare);
  setControlValue(nucleusMatteInput, materialControls.nucleusMatte);
  setControlValue(nucleusTransmissionInput, materialControls.nucleusTransmission);
  setControlValue(nucleusThicknessInput, materialControls.nucleusThickness);
  setControlValue(nucleusIridescenceInput, materialControls.nucleusIridescence);
  setControlValue(nucleusEnvIntensityInput, materialControls.nucleusEnvIntensity);
  setControlValue(nucleusReflectTintMixInput, materialControls.nucleusReflectTintMix);
  setControlValue(nucleusNoiseAmountInput, materialControls.nucleusNoiseAmount);
  setControlValue(nucleusNoiseScaleInput, materialControls.nucleusNoiseScale);
  setControlValue(nucleusRimStrengthInput, materialControls.nucleusRimStrength);
  setControlValue(nucleusRimPowerInput, materialControls.nucleusRimPower);
  setControlValue(nucleusGradientMixInput, materialControls.nucleusGradientMix);
  setControlValue(nucleusBlobAmountInput, materialControls.nucleusBlobAmount);
  setControlValue(nucleusBlobScaleInput, materialControls.nucleusBlobScale);
  setControlValue(nucleusBlobSpeedInput, materialControls.nucleusBlobSpeed);
  applyMaterialControls();
}

function markNucleusPresetCustom() {
  if (materialControls.nucleusPreset !== "custom") {
    materialControls.nucleusPreset = "custom";
  }
}

shapeSelect.addEventListener("change", applyPresetFromSelect);

sphereColorInput.addEventListener("input", (e) => {
  materialControls.color = e.target.value;
  applyMaterialControls();
});
showImportedSurfaceInput?.addEventListener("change", (e) => {
  importedSurfaceVisible = e.target.checked;
  syncImportedSurfaceVisibility();
  setStatus(importedSurfaceVisible ? "Imported surface visible." : "Imported surface hidden.");
});

internalColorInput?.addEventListener("input", (e) => {
  materialControls.internalColor = e.target.value;
  applyMaterialControls();
});
nucleusCornerRadiusInput?.addEventListener("input", (e) => {
  materialControls.nucleusCornerRadius = Number(e.target.value);
  markNucleusPresetCustom();
  syncNucleusMesh();
});
nucleusYOffsetInput?.addEventListener("input", (e) => {
  materialControls.nucleusYOffset = Number(e.target.value);
  markNucleusPresetCustom();
  if (nucleusMesh) nucleusMesh.position.y = materialControls.nucleusYOffset;
  importSurfaceGroup.position.y = materialControls.nucleusYOffset;
});
lightDistanceInput?.addEventListener("input", (e) => {
  materialControls.lightDistance = Number(e.target.value);
  setStatus(`Light distance: ${materialControls.lightDistance.toFixed(2)}`);
});
nucleusColorInput?.addEventListener("input", (e) => {
  materialControls.nucleusColor = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusOpacityInput?.addEventListener("input", (e) => {
  materialControls.nucleusOpacity = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusGlareInput?.addEventListener("input", (e) => {
  materialControls.nucleusGlare = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusMatteInput?.addEventListener("input", (e) => {
  materialControls.nucleusMatte = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusGlowInput?.addEventListener("input", (e) => {
  materialControls.nucleusGlow = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusTransmissionInput?.addEventListener("input", (e) => {
  materialControls.nucleusTransmission = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusThicknessInput?.addEventListener("input", (e) => {
  materialControls.nucleusThickness = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusAttenuationColorInput?.addEventListener("input", (e) => {
  materialControls.nucleusAttenuationColor = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusAttenuationDistanceInput?.addEventListener("input", (e) => {
  materialControls.nucleusAttenuationDistance = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusSpecularInput?.addEventListener("input", (e) => {
  materialControls.nucleusSpecular = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusSpecularColorInput?.addEventListener("input", (e) => {
  materialControls.nucleusSpecularColor = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusClearcoatInput?.addEventListener("input", (e) => {
  materialControls.nucleusClearcoat = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusClearcoatRoughnessInput?.addEventListener("input", (e) => {
  materialControls.nucleusClearcoatRoughness = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusIridescenceInput?.addEventListener("input", (e) => {
  materialControls.nucleusIridescence = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusIorInput?.addEventListener("input", (e) => {
  materialControls.nucleusIor = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusEnvIntensityInput?.addEventListener("input", (e) => {
  materialControls.nucleusEnvIntensity = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusReflectTintInput?.addEventListener("input", (e) => {
  materialControls.nucleusReflectTint = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusReflectTintMixInput?.addEventListener("input", (e) => {
  materialControls.nucleusReflectTintMix = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
surfaceChromaInput?.addEventListener("input", (e) => {
  materialControls.surfaceChroma = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
reflectionStrengthInput?.addEventListener("input", (e) => {
  materialControls.reflectionStrength = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusRimStrengthInput?.addEventListener("input", (e) => {
  materialControls.nucleusRimStrength = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusRimPowerInput?.addEventListener("input", (e) => {
  materialControls.nucleusRimPower = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusRimColorInput?.addEventListener("input", (e) => {
  materialControls.nucleusRimColor = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusNoiseAmountInput?.addEventListener("input", (e) => {
  materialControls.nucleusNoiseAmount = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusNoiseScaleInput?.addEventListener("input", (e) => {
  materialControls.nucleusNoiseScale = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusShellModeInput?.addEventListener("change", (e) => {
  materialControls.nucleusShellMode = e.target.checked;
  markNucleusPresetCustom();
  syncNucleusMesh();
});
nucleusShellColorInput?.addEventListener("input", (e) => {
  materialControls.nucleusShellColor = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusShellThicknessInput?.addEventListener("input", (e) => {
  materialControls.nucleusShellThickness = Number(e.target.value);
  markNucleusPresetCustom();
  syncNucleusMesh();
});
nucleusShellLayersInput?.addEventListener("input", (e) => {
  materialControls.nucleusShellLayers = Number(e.target.value);
  markNucleusPresetCustom();
  syncNucleusMesh();
});
nucleusPulseAmountInput?.addEventListener("input", (e) => {
  materialControls.nucleusPulseAmount = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusPulseSpeedInput?.addEventListener("input", (e) => {
  materialControls.nucleusPulseSpeed = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusDistortionAmountInput?.addEventListener("input", (e) => {
  materialControls.nucleusDistortionAmount = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusDistortionSpeedInput?.addEventListener("input", (e) => {
  materialControls.nucleusDistortionSpeed = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusBlobAmountInput?.addEventListener("input", (e) => {
  materialControls.nucleusBlobAmount = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusBlobScaleInput?.addEventListener("input", (e) => {
  materialControls.nucleusBlobScale = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusBlobSpeedInput?.addEventListener("input", (e) => {
  materialControls.nucleusBlobSpeed = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusGradientTopInput?.addEventListener("input", (e) => {
  materialControls.nucleusGradientTop = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusGradientBottomInput?.addEventListener("input", (e) => {
  materialControls.nucleusGradientBottom = e.target.value;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusGradientMixInput?.addEventListener("input", (e) => {
  materialControls.nucleusGradientMix = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusSpinXInput?.addEventListener("input", (e) => {
  materialControls.nucleusSpinX = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusSpinYInput?.addEventListener("input", (e) => {
  materialControls.nucleusSpinY = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusSpinZInput?.addEventListener("input", (e) => {
  materialControls.nucleusSpinZ = Number(e.target.value);
  markNucleusPresetCustom();
});
nucleusBloomEnabledInput?.addEventListener("change", (e) => {
  materialControls.nucleusBloomEnabled = e.target.checked;
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusBloomStrengthInput?.addEventListener("input", (e) => {
  materialControls.nucleusBloomStrength = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusBloomRadiusInput?.addEventListener("input", (e) => {
  materialControls.nucleusBloomRadius = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
nucleusBloomThresholdInput?.addEventListener("input", (e) => {
  materialControls.nucleusBloomThreshold = Number(e.target.value);
  markNucleusPresetCustom();
  applyMaterialControls();
});
internalDetailShadingInput?.addEventListener("change", applyMaterialControls);
particleLightingInput?.addEventListener("change", () => {
  applyParticleLightingMode();
  applyMaterialControls();
});
sphereShadowsInput?.addEventListener("change", applyMaterialControls);
shadowContrastInput?.addEventListener("input", (e) => {
  materialControls.shadowContrast = Number(e.target.value);
  applyMaterialControls();
});

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

  // Fallback for exports when runtime particle arrays are empty.
  // This keeps CodePen/Webflow previews visible by sampling current shape points.
  if (external.length === 0 && internal.length === 0 && currentShapePoints.length > 0) {
    const maxExportPoints = 2800;
    const step = Math.max(1, Math.ceil(currentShapePoints.length / maxExportPoints));
    for (let i = 0; i < currentShapePoints.length; i += step) {
      const p = currentShapePoints[i];
      external.push([round4(p.x), round4(p.y), round4(p.z)]);
    }
  }
  if (external.length === 0 && internal.length === 0 && customMeshPoints?.length) {
    const maxExportPoints = 2800;
    const step = Math.max(1, Math.ceil(customMeshPoints.length / maxExportPoints));
    for (let i = 0; i < customMeshPoints.length; i += step) {
      const p = customMeshPoints[i];
      external.push([round4(p.x), round4(p.y), round4(p.z)]);
    }
  }
  if (external.length === 0 && internal.length === 0 && customImagePoints?.length) {
    const maxExportPoints = 2800;
    const step = Math.max(1, Math.ceil(customImagePoints.length / maxExportPoints));
    for (let i = 0; i < customImagePoints.length; i += step) {
      const p = customImagePoints[i];
      external.push([round4(p.x), round4(p.y), round4(p.z)]);
    }
  }
  if (external.length === 0 && internal.length === 0) {
    const n = 1200;
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const t = i * ga;
      external.push([round4(Math.cos(t) * r * 4.2), round4(y * 4.2), round4(Math.sin(t) * r * 4.2)]);
    }
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
      externalSize: round4(FIXED_EXTERNAL_SIZE),
      internalSize: round4(FIXED_INTERNAL_SIZE),
      externalColor: materialControls.color,
      internalColor: materialControls.internalColor,
      nucleusPreset: materialControls.nucleusPreset || "custom",
      nucleusShape: materialControls.nucleusShape,
      nucleusCornerRadius: round4(materialControls.nucleusCornerRadius ?? 0),
      nucleusSize: round4(materialControls.nucleusSize),
      nucleusYOffset: round4(materialControls.nucleusYOffset),
      lightDistance: round4(materialControls.lightDistance ?? 1),
      nucleusColor: materialControls.nucleusColor,
      nucleusOpacity: round4(materialControls.nucleusOpacity),
      nucleusTransmission: round4(materialControls.nucleusTransmission ?? 0),
      nucleusThickness: round4(materialControls.nucleusThickness ?? 0),
      nucleusAttenuationColor: materialControls.nucleusAttenuationColor || "#d8ecff",
      nucleusAttenuationDistance: round4(materialControls.nucleusAttenuationDistance ?? 0),
      nucleusSpecular: round4(materialControls.nucleusSpecular ?? 0),
      nucleusSpecularColor: materialControls.nucleusSpecularColor || "#ffffff",
      nucleusClearcoat: round4(materialControls.nucleusClearcoat ?? 0),
      nucleusClearcoatRoughness: round4(materialControls.nucleusClearcoatRoughness ?? 0),
      nucleusIridescence: round4(materialControls.nucleusIridescence ?? 0),
      nucleusIor: round4(materialControls.nucleusIor ?? 1),
      nucleusEnvIntensity: round4(materialControls.nucleusEnvIntensity ?? 0),
      nucleusReflectTint: materialControls.nucleusReflectTint || "#a8d8ff",
      nucleusReflectTintMix: round4(materialControls.nucleusReflectTintMix ?? 0),
      surfaceChroma: round4(materialControls.surfaceChroma ?? 0),
      reflectionStrength: round4(materialControls.reflectionStrength ?? 1.8),
      nucleusRimStrength: round4(materialControls.nucleusRimStrength ?? 0),
      nucleusRimPower: round4(materialControls.nucleusRimPower ?? 0),
      nucleusRimColor: materialControls.nucleusRimColor || "#cfe3ff",
      nucleusNoiseAmount: round4(materialControls.nucleusNoiseAmount ?? 0),
      nucleusNoiseScale: round4(materialControls.nucleusNoiseScale ?? 0),
      nucleusShellMode: !!materialControls.nucleusShellMode,
      nucleusShellColor: materialControls.nucleusShellColor || "#9fc6ff",
      nucleusShellThickness: round4(materialControls.nucleusShellThickness ?? 0),
      nucleusShellLayers: round4(materialControls.nucleusShellLayers ?? 0),
      nucleusPulseAmount: round4(materialControls.nucleusPulseAmount ?? 0),
      nucleusPulseSpeed: round4(materialControls.nucleusPulseSpeed ?? 0),
      nucleusDistortionAmount: round4(materialControls.nucleusDistortionAmount ?? 0),
      nucleusDistortionSpeed: round4(materialControls.nucleusDistortionSpeed ?? 0),
      nucleusBlobAmount: round4(materialControls.nucleusBlobAmount ?? 0),
      nucleusBlobScale: round4(materialControls.nucleusBlobScale ?? 0),
      nucleusBlobSpeed: round4(materialControls.nucleusBlobSpeed ?? 0),
      nucleusGradientTop: materialControls.nucleusGradientTop || "#ffffff",
      nucleusGradientBottom: materialControls.nucleusGradientBottom || "#7ea5ff",
      nucleusGradientMix: round4(materialControls.nucleusGradientMix ?? 0),
      nucleusSpinX: round4(materialControls.nucleusSpinX ?? 0),
      nucleusSpinY: round4(materialControls.nucleusSpinY ?? 0),
      nucleusSpinZ: round4(materialControls.nucleusSpinZ ?? 0),
      nucleusBloomEnabled: !!materialControls.nucleusBloomEnabled,
      nucleusBloomStrength: round4(materialControls.nucleusBloomStrength ?? 0),
      nucleusBloomRadius: round4(materialControls.nucleusBloomRadius ?? 0),
      nucleusBloomThreshold: round4(materialControls.nucleusBloomThreshold ?? 0),
      shadowContrast: round4(materialControls.shadowContrast ?? 1),
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
  <script>
  (() => {
    const payload = ${payloadText};
    function ensureContainer() {
      let el = document.getElementById("shape-object");
      if (!el) {
        el = document.createElement("div");
        el.id = "shape-object";
        el.style.width = "100vw";
        el.style.height = "100vh";
        el.style.margin = "0";
        document.body.style.margin = "0";
        document.body.appendChild(el);
      }
      return el;
    }

    function start() {
      const container = ensureContainer();
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.001, 220);
      camera.position.set(0, 0, 18);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      renderer.toneMapping = THREE.ACESFilmicToneMapping || THREE.NoToneMapping;
      renderer.toneMappingExposure = 1.04;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      const lightDistance = Math.max(0.4, Math.min(6, Number(payload.render.lightDistance ?? 1)));
      const topLight = new THREE.SpotLight(0xffffff, 4.1, 0, Math.PI * 0.24, 0.42, 1.35);
      topLight.position.set(4.2, 17.5, 8.3);
      topLight.target.position.set(0, 0, 0);
      topLight.castShadow = true;
      topLight.shadow.mapSize.set(1024, 1024);
      topLight.shadow.bias = -0.00008;
      topLight.shadow.normalBias = 0.016;
      topLight.shadow.radius = 5;
      topLight.shadow.camera.near = 0.5;
      topLight.shadow.camera.far = 80;
      scene.add(topLight);
      scene.add(topLight.target);
      scene.add(new THREE.HemisphereLight(0xe8f3ff, 0x2a3546, 0.52));
      const rimLight = new THREE.PointLight(0xaec6ff, 0.42, 36, 2);
      rimLight.position.set(-4.5, 7.8, -8.4);
      scene.add(rimLight);

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
        mesh.castShadow = true;
        mesh.receiveShadow = false;
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
        const nearMix = 1 - ((lightDistance - 0.4) / (6 - 0.4));
        topLight.position.set(
          THREE.MathUtils.lerp(9.2, 1.8, nearMix),
          6.8 + 7.6 * lightDistance,
          5.0 + 5.8 * lightDistance
        );
        topLight.intensity = THREE.MathUtils.lerp(1.1, 3.8, nearMix);
        topLight.penumbra = THREE.MathUtils.lerp(0.3, 0.55, nearMix);
        topLight.angle = THREE.MathUtils.lerp(Math.PI * 0.2, Math.PI * 0.28, nearMix);
        topLight.target.position.set(0, Number(payload.render.nucleusYOffset || 0), 0);
        rimLight.position.set(-4.4 - 1.2 * lightDistance, 6.4, -7.1 - 0.9 * lightDistance);

        group.rotation.y = s * 0.16;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }

    function loadThreeAndStart() {
      if (window.THREE) {
        try { start(); } catch (err) { console.error("Shape embed failed:", err); }
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js";
      script.onload = () => {
        try { start(); } catch (err) { console.error("Shape embed failed:", err); }
      };
      script.onerror = () => console.error("Could not load three.js.");
      document.head.appendChild(script);
    }

    loadThreeAndStart();
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
saveStartupBtn?.addEventListener("click", () => {
  try {
    localStorage.setItem(STARTUP_CONFIG_KEY, JSON.stringify(buildStartupConfig()));
    setStatus("Saved current settings as startup defaults.");
  } catch (err) {
    console.error(err);
    setStatus("Could not save startup defaults.", true);
  }
});
clearStartupBtn?.addEventListener("click", () => {
  localStorage.removeItem(STARTUP_CONFIG_KEY);
  setStatus("Cleared startup defaults.");
});

function retuneAllParticles() {
  readMotionControls();
  for (let i = 0; i < particles.length; i++) {
    randomParticleMotion(particles[i]);
  }
}

travelSpeedInput?.addEventListener("input", retuneAllParticles);
collisionEnabledInput?.addEventListener("change", () => {
  collisionEnabled = collisionEnabledInput.checked;
  setStatus(collisionEnabled ? "Collision enabled." : "Collision disabled.");
});
shapeScaleInput?.addEventListener("input", () => {
  shapeScale = Number(shapeScaleInput.value) || 1;
  applyPresetFromSelect();
  setStatus(`Shape scale: ${shapeScale.toFixed(2)}x`);
});

const clock = new THREE.Clock();
const tempPointA = new THREE.Vector3();
const tempPointB = new THREE.Vector3();
const tempPointC = new THREE.Vector3();
const tempShadowCenter = new THREE.Vector3();
const tempLabelDir = new THREE.Vector3();
const axisX = new THREE.Vector3(1, 0, 0);
const axisY = new THREE.Vector3(0, 1, 0);
const axisZ = new THREE.Vector3(0, 0, 1);
const tempSeparate = new THREE.Vector3();
const tempClampOffset = new THREE.Vector3();
const separationGrid = new Map();
const autoRotateStepQ = new THREE.Quaternion();

function enforceParticleSeparation(dt = 1, strength = 1) {
  const minParticleDistance = Math.max(0.02, FIXED_SPHERE_GAP);
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

function updateContactShadowPlane() {
  if (!contactShadowPlane.visible || contactShadowPlane.material.opacity <= 0) return;
  contactShadowFrame = (contactShadowFrame + 1) % 6;
  if (contactShadowFrame !== 0) return;
  contactShadowBounds.setFromObject(group);
  if (contactShadowBounds.isEmpty()) return;
  contactShadowBounds.getCenter(contactShadowCenter);
  contactShadowBounds.getSize(contactShadowSize);
  const halfSpan = Math.max(contactShadowSize.x, contactShadowSize.z) * 0.5;
  const planeSize = THREE.MathUtils.clamp(halfSpan * 2.2, 8, 34);
  contactShadowPlane.scale.set(planeSize, planeSize, 1);
  contactShadowPlane.position.set(
    contactShadowCenter.x,
    contactShadowBounds.min.y - 0.04,
    contactShadowCenter.z
  );
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;
  const maxOutlineOffset = 0.34;
  const faceOneWayActive = movementMode === "face-one-way" && surfaceExternalOnly;
  const oneWayBandIds = faceOneWayActive ? faceHorizontalOrbitBandIds : oneWayOrbitBandIds;
  const oneWayBands = faceOneWayActive ? faceHorizontalOrbitBands : oneWayOrbitBands;
  const oneWayLikeMode =
    movementMode === "one-way" || movementMode === "tornado" || faceOneWayActive;
  const tornadoDirectionSign = 1;
  const oneWayFlowSpeedBase = 0.45 + motionControls.travelSpeed * 0.02;
  // Keep tornado speed in world-units/sec stable across particle-count changes.
  const tornadoLinearSpeedTarget = 0.36 + motionControls.travelSpeed * 0.055;
  const tornadoPhaseSpeed = tornadoLinearSpeedTarget / Math.max(0.0001, tornadoBaseCircumference);
  const oneWayFlowSpeed =
    movementMode === "tornado"
      ? tornadoPhaseSpeed
      : faceOneWayActive
        ? (0.05 + motionControls.travelSpeed * 0.008)
      : oneWayFlowSpeedBase;
  if (oneWayLikeMode) {
    if (movementMode === "tornado" || faceOneWayActive) {
      oneWayGlobalCursor = (elapsed * oneWayFlowSpeed) % 1000000;
    } else {
      oneWayGlobalCursor = (oneWayGlobalCursor + oneWayFlowSpeed * dt) % 1000000;
    }
  }
  group.getWorldPosition(tempShadowCenter);
  if (rotationTestLabel) {
    tempLabelDir.copy(tempShadowCenter).sub(camera.position).normalize();
    rotationTestLabel.position.copy(tempShadowCenter).addScaledVector(tempLabelDir, 9.5);
  }
  sharedShadowCenter.value.copy(tempShadowCenter);
  sharedShadowLightDir.value.copy(topLight.position).sub(tempShadowCenter).normalize();

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
            const bandArcData = faceOneWayActive && !p.isInternal
              ? (faceHorizontalOrbitBandArcData[p.oneWayLane] || { cumulative: [0, 1], total: 1 })
              : (p.isInternal
                ? (internalOrbitArcData || { cumulative: [0, 1], total: 1 })
                : (oneWayOrbitBandArcData[p.oneWayLane] || { cumulative: [0, 1], total: 1 }));
            const bandCircumference = Math.max(0.0001, bandArcData.total || tornadoBaseCircumference);
            const normalizedBandFactor = tornadoBaseCircumference / Math.max(0.0001, bandCircumference);
            let phaseOffset = 0;
            if (movementMode === "tornado" && !faceOneWayActive && !p.isInternal) {
              const batchSize = Math.max(1, Math.floor(FIXED_TORNADO_BATCH_RINGS));
              const batchId = Math.floor((p.oneWayLane || 0) / batchSize);
              phaseOffset += batchId * FIXED_TORNADO_BATCH_OFFSET;

              const yCenter = oneWayOrbitBandYCenters[p.oneWayLane] ?? 0;
              const ySpan = Math.max(0.0001, oneWayOrbitYMax - oneWayOrbitYMin);
              const yNorm = (yCenter - oneWayOrbitYMin) / ySpan;
              phaseOffset += (yNorm - 0.5) * FIXED_TORNADO_SKEW;
            }
            const signedPhase =
              basePhase +
              oneWayGlobalCursor * normalizedBandFactor * tornadoDirectionSign +
              phaseOffset;
            const loopPhase = ((signedPhase % 1) + 1) % 1;
            const sampled = sampleBandByPhase(band, bandArcData, loopPhase, p.anchor);
            p.oneWaySlot = sampled.slot;
            p.currentIndex = sampled.currentIndex;
            p.nextIndex = sampled.nextIndex;

            if (movementMode === "tornado" && !faceOneWayActive && !p.isInternal) {
              // Organic clustered dents/spikes so tornado surface is imperfect, not patterned.
              const ySpan = Math.max(0.0001, oneWayOrbitYMax - oneWayOrbitYMin);
              const yNorm = ((oneWayOrbitBandYCenters[p.oneWayLane] ?? 0) - oneWayOrbitYMin) / ySpan;
              const laneSeed = hash2((p.oneWayLane || 0) * 0.731, 11.913);

              const macro = noise2D(
                loopPhase * 3.2 + elapsed * (0.05 + p.tornadoFreq * 0.035) + laneSeed * 2.7,
                yNorm * 2.4 + elapsed * 0.03
              );
              const medium = noise2D(
                loopPhase * 6.9 - elapsed * (0.12 + p.tornadoFreq * 0.05) + laneSeed * 5.1,
                yNorm * 5.2 + laneSeed * 3.7
              );
              const spikeField = noise2D(
                loopPhase * 11.3 + elapsed * (0.22 + p.tornadoSpikeRate * 0.04) + laneSeed * 13.4,
                yNorm * 8.6 - elapsed * 0.13
              );
              const spikeSign = noise2D(
                loopPhase * 4.1 - elapsed * 0.09 + laneSeed * 7.7,
                yNorm * 3.1 + laneSeed * 2.2
              ) > 0.5 ? 1 : -1;

              const macroSigned = (macro - 0.5) * 2;
              const mediumSigned = (medium - 0.5) * 2;
              const spike = Math.max(0, (spikeField - 0.78) / 0.22);
              const imperfection = Math.max(0, FIXED_TORNADO_IMPERFECTION);
              const dentAmount =
                (macroSigned * (0.06 + p.tornadoBowAmp * 0.9) +
                mediumSigned * (0.02 + p.tornadoShearAmp * 0.55) +
                spikeSign * spike * (0.045 + p.tornadoSpikeAmp * 0.8)) * imperfection;

              tempPointA.copy(p.anchor);
              if (tempPointA.lengthSq() > 0.000001) {
                tempPointA.normalize();
                p.anchor.addScaledVector(tempPointA, THREE.MathUtils.clamp(dentAmount, -0.34, 0.34));
              }
            }
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
          const internalMul = p.isInternal ? FIXED_INTERNAL_SPEED : 1;
          p.pathSpeed = (0.08 + motionControls.travelSpeed * 0.018) * internalMul;
          p.turnTimer = 0.16;
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
      const baseFollow = p.isInternal ? 18 : 14;
      p.pos.lerp(p.anchor, Math.min(1, baseFollow * dt));
    } else {
      const recoveryScale = p.isInternal ? 1.15 : 1;
      p.pos.lerp(p.anchor, Math.min(1, p.followRate * recoveryScale * dt));
    }

  }

  if (nucleusMesh && nucleusMesh.visible) {
    tempPointA.set(0, materialControls.nucleusYOffset, 0);
    nucleusMesh.position.lerp(tempPointA, Math.min(1, dt * 8.0));
    if (Math.abs(nucleusMesh.position.y - tempPointA.y) < 0.0005) {
      nucleusMesh.position.y = tempPointA.y;
    }
    const pulseAmount = Math.max(0, materialControls.nucleusPulseAmount ?? 0);
    const pulseSpeed = Math.max(0, materialControls.nucleusPulseSpeed ?? 1.2);
    const pulse = 1 + pulseAmount * Math.sin(elapsed * pulseSpeed * Math.PI * 2);
    const distAmount = Math.max(0, materialControls.nucleusDistortionAmount ?? 0);
    const distSpeed = Math.max(0, materialControls.nucleusDistortionSpeed ?? 1.5);
    const wobX = 1 + distAmount * 0.42 * Math.sin(elapsed * distSpeed * 1.27 + 0.3);
    const wobY = 1 + distAmount * 0.42 * Math.sin(elapsed * distSpeed * 0.91 + 1.7);
    const wobZ = 1 + distAmount * 0.42 * Math.sin(elapsed * distSpeed * 1.53 + 3.1);
    const baseScale = Math.max(0.05, materialControls.nucleusSize) * pulse;
    nucleusMesh.scale.set(baseScale * wobX, baseScale * wobY, baseScale * wobZ);
    if (nucleusMesh.userData.shape === "crystal-orb" || nucleusMesh.userData.shape === "liquid-core") {
      applyLiquidOrbDeform(nucleusMesh, elapsed, -1, nucleusShellMeshes.length);
    }
    const spinX = nucleusSpinXInput ? (materialControls.nucleusSpinX ?? 0) : 0;
    const spinY = nucleusSpinYInput ? (materialControls.nucleusSpinY ?? 0) : 0;
    const spinZ = nucleusSpinZInput ? (materialControls.nucleusSpinZ ?? 0) : 0;
    nucleusMesh.rotation.x += spinX * dt;
    nucleusMesh.rotation.y += spinY * dt;
    nucleusMesh.rotation.z += spinZ * dt;
    if (nucleusShellMeshes.length) {
      const layerCount = Math.max(1, nucleusShellMeshes.length);
      for (let i = 0; i < nucleusShellMeshes.length; i++) {
        const shell = nucleusShellMeshes[i];
        const t = (i + 1) / (layerCount + 1);
        const layerShrink = Math.max(0.08, 1 - materialControls.nucleusShellThickness * (i + 1));
        shell.visible = nucleusMesh.visible;
        shell.position.copy(nucleusMesh.position);
        shell.quaternion.copy(nucleusMesh.quaternion);
        shell.scale.copy(nucleusMesh.scale).multiplyScalar(Math.min(layerShrink, 1 - t * 0.04));
        if (
          shell.userData.shape === "crystal-orb" ||
          shell.userData.shape === "liquid-core" ||
          nucleusMesh.userData.shape === "crystal-orb" ||
          nucleusMesh.userData.shape === "liquid-core"
        ) {
          applyLiquidOrbDeform(shell, elapsed, i, layerCount);
        }
      }
    }
    if (nucleusRimMesh) {
      nucleusRimMesh.visible = nucleusMesh.visible && materialControls.nucleusRimStrength > 0.001;
      nucleusRimMesh.position.copy(nucleusMesh.position);
      nucleusRimMesh.quaternion.copy(nucleusMesh.quaternion);
      nucleusRimMesh.scale.copy(nucleusMesh.scale).multiplyScalar(1.01);
      if (nucleusMesh.userData.shape === "crystal-orb" || nucleusMesh.userData.shape === "liquid-core") {
        applyLiquidOrbDeform(nucleusRimMesh, elapsed, -1, nucleusShellMeshes.length);
      }
    }
    if (nucleusGradientMesh) {
      const supportsGradientOverlay = materialControls.nucleusShape === "cube";
      nucleusGradientMesh.visible =
        nucleusMesh.visible &&
        supportsGradientOverlay &&
        materialControls.nucleusGradientMix > 0.001;
      nucleusGradientMesh.position.copy(nucleusMesh.position);
      nucleusGradientMesh.quaternion.copy(nucleusMesh.quaternion);
      nucleusGradientMesh.scale.copy(nucleusMesh.scale).multiplyScalar(1.005);
      if (nucleusMesh.userData.shape === "crystal-orb" || nucleusMesh.userData.shape === "liquid-core") {
        applyLiquidOrbDeform(nucleusGradientMesh, elapsed, -1, nucleusShellMeshes.length);
      }
    }
  }

  const importedOrbStyleActive =
    materialControls.nucleusShape === "crystal-orb" ||
    materialControls.nucleusShape === "liquid-core";
  if (importedOrbStyleActive && importSurfaceGroup.visible && importSurfaceGroup.children.length) {
    importSurfaceGroup.traverse((child) => {
      if (!child.isMesh || !child.geometry?.userData?.basePositions) return;
      applyLiquidOrbDeform(child, elapsed);
    });
  }

  if (collisionEnabled && movementMode !== "static-detail") {
    const sepStrength = movementMode === "tornado"
      ? THREE.MathUtils.clamp(0.28 * Math.sqrt(900 / Math.max(200, externalCount)), 0.12, 0.32)
      : oneWayLikeMode
        ? 0.55
        : 0.9;
    enforceParticleSeparation(dt, sepStrength);
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    // Keep particle close to its path anchor so it doesn't spread beyond shape outline.
    tempClampOffset.copy(p.pos).sub(p.anchor);
    const offsetLen = tempClampOffset.length();
    const dynamicOffset =
      movementMode === "face-cover"
        ? 0.02
        : movementMode === "static-detail"
          ? 0.015
          : movementMode === "tornado"
            ? 0.045
            : movementMode === "one-way"
              ? 0.045
          : maxOutlineOffset;
    if (offsetLen > dynamicOffset) {
      p.pos.copy(p.anchor).addScaledVector(tempClampOffset, dynamicOffset / offsetLen);
    }
  }

  const t = clock.elapsedTime;
  const lightTargetY = materialControls.nucleusYOffset || 0;
  const lightDistance = THREE.MathUtils.clamp(materialControls.lightDistance ?? 1, 0.4, 6);
  const lightNearMix = 1 - ((lightDistance - 0.4) / (6 - 0.4));
  // Key spotlight: distance now changes both incidence angle and subject brightness.
  topLight.position.set(
    THREE.MathUtils.lerp(9.2, 1.8, lightNearMix),
    6.8 + 7.6 * lightDistance,
    5.0 + 5.8 * lightDistance
  );
  topLight.intensity = THREE.MathUtils.lerp(1.1, 3.8, lightNearMix);
  topLight.penumbra = THREE.MathUtils.lerp(0.3, 0.55, lightNearMix);
  topLight.angle = THREE.MathUtils.lerp(Math.PI * 0.2, Math.PI * 0.28, lightNearMix);
  topLight.target.position.set(0, lightTargetY, 0);
  rimLight.position.set(
    -4.4 - 1.2 * lightDistance,
    6.4,
    -7.1 - 0.9 * lightDistance
  );
  if (reflectionSceneryGroup.userData?.domeMaterial?.uniforms?.uTime) {
    reflectionSceneryGroup.userData.domeMaterial.uniforms.uTime.value = t;
  }
  reflectionSceneryGroup.rotation.y = 0;
  reflectionSceneryGroup.position.y = 0;
  writeInstances(t);

  autoRotateStepQ.setFromAxisAngle(axisY, dt * 0.16);
  group.quaternion.multiply(autoRotateStepQ);
  group.position.set(0, 0, 0);
  updateContactShadowPlane();
  updateNucleusDynamicEnv();
  updateImportedSurfaceDynamicEnv();

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}

function applyLoadedStartupSceneState() {
  const sceneState = loadedStartupSceneState;
  if (!sceneState || typeof sceneState !== "object") return;
  const camPos = Array.isArray(sceneState.cameraPosition) ? sceneState.cameraPosition : null;
  if (camPos && camPos.length === 3 && camPos.every((n) => Number.isFinite(Number(n)))) {
    camera.position.set(Number(camPos[0]), Number(camPos[1]), Number(camPos[2]));
  }
  const target = Array.isArray(sceneState.controlsTarget) ? sceneState.controlsTarget : null;
  if (target && target.length === 3 && target.every((n) => Number.isFinite(Number(n)))) {
    controls.target.set(Number(target[0]), Number(target[1]), Number(target[2]));
  }
  const zoom = Number(sceneState.cameraZoom);
  if (Number.isFinite(zoom) && zoom > 0) {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }
  const rot = Array.isArray(sceneState.groupRotation) ? sceneState.groupRotation : null;
  if (rot && rot.length === 3 && rot.every((n) => Number.isFinite(Number(n)))) {
    group.rotation.set(Number(rot[0]), Number(rot[1]), Number(rot[2]));
  }
  forceApplyNucleusYOffset();
  controls.update();
}

rebuildSpheres(sphereCount);
applyMaterialControls();
updateNucleusControlSections(materialControls.nucleusShape);

async function bootScene() {
  let startupReflectionLoaded = await loadReflectionImageEnvFromUrl(DEFAULT_REFLECTION_IMAGE_URL, "Startup reflection");
  if (!startupReflectionLoaded) {
    startupReflectionLoaded = await loadReflectionImageEnvFromUrl("./citrus_orchard_road_puresky_1k.exr", "Startup reflection");
  }
  let startupMeshLoaded = await loadCustomMeshFromUrl(
    DEFAULT_STARTUP_MESH_URL,
    DEFAULT_STARTUP_MESH_FILENAME,
    "Startup mesh loaded"
  );
  if (!startupMeshLoaded) {
    startupMeshLoaded = await loadCustomMeshFromUrl("./flower.glb", DEFAULT_STARTUP_MESH_FILENAME, "Startup mesh loaded");
  }
  if (!startupMeshLoaded && shapeSelect.value === "custom-mesh") {
    shapeSelect.value = "sphere";
  }
  applyPresetFromSelect();
  forceApplyNucleusYOffset();
  applyLoadedStartupSceneState();
  forceApplyNucleusYOffset();
  if (startupReflectionLoaded && startupMeshLoaded) {
    setStatus("Startup assets loaded (EXR + flower), scene state restored.");
  } else if (startupReflectionLoaded) {
    setStatus("Startup reflection loaded; startup mesh failed.");
  } else if (startupMeshLoaded) {
    setStatus("Startup mesh loaded; startup reflection failed.");
  }
  animate();
}

bootScene();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});
