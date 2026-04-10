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
const EMBED_BOOTSTRAP = globalThis.__SHAPE_VIEWER_EMBED__ || null;
const DEFAULT_STARTUP_MESH_URL = new URL("../flower.glb", import.meta.url).href;
const DEFAULT_STARTUP_MESH_FILENAME = "flower.glb";
const EXPORT_DEFAULT_MESH_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@main/flower.glb";
const EXPORT_DEFAULT_ENV_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@main/citrus_orchard_road_puresky_1k.exr";
const EXPORT_RUNTIME_STYLES_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@4005330/styles.css";
const EXPORT_RUNTIME_MAIN_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@4005330/src/main.js";
const EMBED_STARTUP_MESH_URL = EMBED_BOOTSTRAP?.assets?.meshUrl || null;
const EMBED_STARTUP_ENV_URL = EMBED_BOOTSTRAP?.assets?.envUrl || null;
const DEFAULT_STARTUP_SNAPSHOT = {
  shape: {
    name: "custom-mesh",
    scale: 1
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

const loadedEmbeddedStartup =
  EMBED_BOOTSTRAP?.startupConfig &&
  typeof EMBED_BOOTSTRAP.startupConfig === "object"
    ? applyStartupConfigToInputs(EMBED_BOOTSTRAP.startupConfig)
    : false;
const loadedUserStartup = loadedEmbeddedStartup || loadStartupConfigIntoInputs();
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

const sphereCount = 0;
const baseShapeRadius = 5.7;
let shapeScale = Number(shapeScaleInput?.value) || 1;
let importedSurfaceVisible = true;
if (showImportedSurfaceInput) showImportedSurfaceInput.checked = true;

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

function getNucleusRenderMaterial() {
  return nucleusMaterial;
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
  if (!nucleusMesh || !nucleusMesh.visible || !nucleusSupportsPanelEnv) return;
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

function applyMaterialControls() {
  const sphereShadowsEnabled = sphereShadowsInput?.checked ?? true;
  const shadowContrast = THREE.MathUtils.clamp(materialControls.shadowContrast ?? 1, 0, 2.5);
  contactShadowPlane.material.opacity = 0;
  const nucleusTransmission = THREE.MathUtils.clamp(materialControls.nucleusTransmission ?? 0.18, 0, 1);
  const nucleusTintMix = THREE.MathUtils.clamp(materialControls.nucleusReflectTintMix ?? 0, 0, 1);
  const finalNucleusColor = new THREE.Color(materialControls.nucleusColor);
  finalNucleusColor.lerp(new THREE.Color(materialControls.nucleusReflectTint), nucleusTintMix * (0.35 + nucleusTransmission * 0.65));
  nucleusMaterial.color.copy(finalNucleusColor);
  nucleusBasicMaterial.color.copy(finalNucleusColor);
  nucleusMaterial.transparent = materialControls.nucleusOpacity < 0.999;
  nucleusBasicMaterial.transparent = materialControls.nucleusOpacity < 0.999;
  nucleusMaterial.opacity = materialControls.nucleusOpacity;
  nucleusBasicMaterial.opacity = materialControls.nucleusOpacity;
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
  nucleusMaterial.needsUpdate = true;
  nucleusShellMaterial.needsUpdate = true;
  nucleusRimMaterial.needsUpdate = true;
  nucleusGradientMaterial.needsUpdate = true;
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

let nucleusMesh = null;
let nucleusShellMeshes = [];
let nucleusRimMesh = null;
let nucleusGradientMesh = null;
let nucleusEnvFrame = 0;
const nucleusVisibleOnStartup = false;
function applyBasePoints(basePoints) {
  if (!basePoints.length) return;

  const min = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  const max = new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  for (let i = 0; i < basePoints.length; i++) {
    min.min(basePoints[i]);
    max.max(basePoints[i]);
  }
  const center = min.clone().add(max).multiplyScalar(0.5);

  const normalizedPoints = basePoints.map((p) => p.clone().sub(center));

  let maxLen = 0;
  for (let i = 0; i < normalizedPoints.length; i++) {
    maxLen = Math.max(maxLen, normalizedPoints[i].length());
  }
  if (maxLen > 0.0001) {
    const scale = (baseShapeRadius * shapeScale * 0.95) / maxLen;
    for (let i = 0; i < normalizedPoints.length; i++) {
      normalizedPoints[i].multiplyScalar(scale);
    }
  }
  group.position.set(0, 0, 0);
  controls.target.set(0, 0, 0);
}

let customImagePoints = null;
let customMeshPoints = null;
let customImageFile = null;
let customMeshFile = null;
let customMeshSurfaceRoot = null;

function applyPresetFromSelect() {
  const selected = shapeSelect.value;
  syncImportedSurfaceVisibility();

  if (selected === "custom-image") {
    if (!customImagePoints) {
      setStatus("Upload an image first, then choose Custom Image.", true);
      return;
    }
    applyBasePoints(customImagePoints);
    setStatus("Applied custom image shape.");
    return;
  }

  if (selected === "custom-mesh") {
    if (!customMeshPoints) {
      setStatus("Upload a mesh first, then choose Custom Mesh.", true);
      return;
    }
    applyBasePoints(customMeshPoints);
    syncImportedSurfaceVisibility();
    setStatus("Applied custom mesh shape.");
    return;
  }

  applyBasePoints(buildPresetShapePoints(selected, sphereCount, baseShapeRadius));
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

function round4(n) {
  return Number(n.toFixed(4));
}

function buildExportSnapshot() {
  const external = [];
  const internal = [];

  const viewportWidth = Math.max(
    1,
    Math.round(renderer?.domElement?.clientWidth || container?.clientWidth || window.innerWidth || 1)
  );
  const viewportHeight = Math.max(
    1,
    Math.round(renderer?.domElement?.clientHeight || container?.clientHeight || window.innerHeight || 1)
  );

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    assets: {
      meshUrl: EXPORT_DEFAULT_MESH_URL,
      envUrl: EXPORT_DEFAULT_ENV_URL
    },
    shape: {
      name: shapeSelect?.value || "custom",
      scale: round4(shapeScale)
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
    scene: {
      cameraPosition: [round4(camera.position.x), round4(camera.position.y), round4(camera.position.z)],
      controlsTarget: [round4(controls.target.x), round4(controls.target.y), round4(controls.target.z)],
      cameraZoom: round4(camera.zoom),
      groupRotation: [round4(group.rotation.x), round4(group.rotation.y), round4(group.rotation.z)]
    },
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
      pixelRatio: round4(Math.min(window.devicePixelRatio || 1, 1.5)),
      lockSize: true
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

function buildWebflowEmbedHtml(payload, startupConfig) {
  const bootstrapText = JSON.stringify({
    startupConfig,
    assets: {
      meshUrl: payload?.assets?.meshUrl || EXPORT_DEFAULT_MESH_URL,
      envUrl: payload?.assets?.envUrl || EXPORT_DEFAULT_ENV_URL
    }
  });
  return `<link rel="stylesheet" href="${EXPORT_RUNTIME_STYLES_URL}">
<style>
html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent !important;
}
#app {
  width: 100%;
  height: 100%;
}
.hud {
  display: none !important;
}
</style>
<div id="app"></div>
<div class="hud">
  <div><b>Shape Viewer</b></div>
  <div class="controls">
    <select id="shapeSelect">
      <option value="heart">Heart</option>
      <option value="sphere">Sphere</option>
      <option value="torus">Torus</option>
      <option value="cube">Cube</option>
      <option value="cone">Cone</option>
      <option value="cylinder">Cylinder</option>
      <option value="helix">Helix</option>
      <option value="wave">Wave</option>
      <option value="flower">Flower</option>
      <option value="custom-image" disabled>Custom Image</option>
      <option value="custom-mesh" disabled>Custom Mesh</option>
    </select>
    <input id="imageInput" type="file" accept="image/*" />
    <input id="meshInput" type="file" accept=".glb,.gltf,.obj,model/gltf-binary,model/gltf+json" />
    <button id="reflectionImageBtn" type="button">Reflection Image</button>
    <input id="reflectionImageInput" type="file" accept=".exr,.hdr,image/*" style="display:none" />
    <button id="exportDataBtn" type="button">Export JSON</button>
    <button id="exportWebflowBtn" type="button">Export Webflow HTML</button>
    <button id="saveStartupBtn" type="button">Save Startup</button>
    <button id="clearStartupBtn" type="button">Clear Startup</button>
  </div>
  <div class="panel">
    <input id="shapeScale" type="hidden" value="1" />
    <label for="showImportedSurface">Show Imported Surface</label>
    <input id="showImportedSurface" type="checkbox" checked />
    <input id="sphereColor" type="hidden" value="#90b2ff" />
    <input id="internalColor" type="hidden" value="#4f6fb6" />
    <label for="nucleusCornerRadius">Nucleus Corner Radius</label>
    <input id="nucleusCornerRadius" type="range" min="0" max="0.8" step="0.005" value="0.12" />
    <label for="nucleusYOffset">Nucleus Y Offset</label>
    <input id="nucleusYOffset" type="range" min="-6" max="6" step="0.01" value="0" />
    <label for="lightDistance">Light Distance</label>
    <input id="lightDistance" type="range" min="0.4" max="6" step="0.01" value="1" />
    <label for="nucleusColor">Nucleus Color</label>
    <input id="nucleusColor" type="color" value="#a8d8ff" />
    <label for="nucleusOpacity">Nucleus Opacity</label>
    <input id="nucleusOpacity" type="range" min="0.05" max="1" step="0.01" value="0.95" />
    <label for="nucleusGlare">Nucleus Glare</label>
    <input id="nucleusGlare" type="range" min="0" max="1" step="0.01" value="0.5" />
    <label for="nucleusMatte">Nucleus Matte</label>
    <input id="nucleusMatte" type="range" min="0" max="1" step="0.01" value="0.35" />
    <label for="nucleusGlow">Nucleus Glow</label>
    <input id="nucleusGlow" type="range" min="0" max="2" step="0.01" value="0.45" />
    <label for="nucleusTransmission">Nucleus Transmission</label>
    <input id="nucleusTransmission" type="range" min="0" max="1" step="0.01" value="0.18" />
    <label for="nucleusThickness">Nucleus Thickness</label>
    <input id="nucleusThickness" type="range" min="0" max="6" step="0.01" value="1.2" />
    <label for="nucleusAttenuationColor">Nucleus Atten Color</label>
    <input id="nucleusAttenuationColor" type="color" value="#d8ecff" />
    <label for="nucleusAttenuationDistance">Nucleus Atten Dist</label>
    <input id="nucleusAttenuationDistance" type="range" min="0.1" max="20" step="0.1" value="4.0" />
    <label for="nucleusSpecular">Nucleus Specular</label>
    <input id="nucleusSpecular" type="range" min="0" max="1" step="0.01" value="1.0" />
    <label for="nucleusSpecularColor">Nucleus Spec Color</label>
    <input id="nucleusSpecularColor" type="color" value="#ffffff" />
    <label for="nucleusClearcoat">Nucleus Clearcoat</label>
    <input id="nucleusClearcoat" type="range" min="0" max="1" step="0.01" value="1.0" />
    <label for="nucleusClearcoatRoughness">Nucleus Coat Rough</label>
    <input id="nucleusClearcoatRoughness" type="range" min="0" max="1" step="0.01" value="0.08" />
    <label for="nucleusIridescence">Nucleus Iridescence</label>
    <input id="nucleusIridescence" type="range" min="0" max="1" step="0.01" value="0.65" />
    <label for="nucleusIor">Nucleus IOR</label>
    <input id="nucleusIor" type="range" min="1" max="2.333" step="0.001" value="2.2" />
    <label for="nucleusEnvIntensity">Nucleus Env Intensity</label>
    <input id="nucleusEnvIntensity" type="range" min="0" max="8" step="0.01" value="3.2" />
    <label for="nucleusReflectTint">Nucleus Reflect Tint</label>
    <input id="nucleusReflectTint" type="color" value="#a8d8ff" />
    <label for="nucleusReflectTintMix">Nucleus Tint Mix</label>
    <input id="nucleusReflectTintMix" type="range" min="0" max="1" step="0.01" value="0" />
    <label for="surfaceChroma">Surface Chroma</label>
    <input id="surfaceChroma" type="range" min="0" max="1" step="0.01" value="0" />
    <label for="reflectionStrength">Reflection Strength</label>
    <input id="reflectionStrength" type="range" min="0" max="4" step="0.01" value="1.8" />
    <label for="nucleusRimStrength">Nucleus Rim Strength</label>
    <input id="nucleusRimStrength" type="range" min="0" max="2.5" step="0.01" value="0.35" />
    <label for="nucleusRimPower">Nucleus Rim Power</label>
    <input id="nucleusRimPower" type="range" min="0.5" max="8" step="0.01" value="2.6" />
    <label for="nucleusRimColor">Nucleus Rim Color</label>
    <input id="nucleusRimColor" type="color" value="#cfe3ff" />
    <label for="nucleusNoiseAmount">Nucleus Noise Amount</label>
    <input id="nucleusNoiseAmount" type="range" min="0" max="2" step="0.01" value="0.2" />
    <label for="nucleusNoiseScale">Nucleus Noise Scale</label>
    <input id="nucleusNoiseScale" type="range" min="0.2" max="8" step="0.01" value="1.4" />
    <input id="nucleusShellMode" type="checkbox" />
    <input id="nucleusShellColor" type="hidden" value="#9fc6ff" />
    <input id="nucleusShellThickness" type="hidden" value="0.08" />
    <input id="nucleusShellLayers" type="hidden" value="0" />
    <input id="nucleusPulseAmount" type="hidden" value="0" />
    <input id="nucleusPulseSpeed" type="hidden" value="1.2" />
    <input id="nucleusDistortionAmount" type="hidden" value="0" />
    <input id="nucleusDistortionSpeed" type="hidden" value="1.5" />
    <input id="nucleusBlobAmount" type="hidden" value="0.18" />
    <input id="nucleusBlobScale" type="hidden" value="1.7" />
    <input id="nucleusBlobSpeed" type="hidden" value="1.1" />
    <input id="nucleusGradientTop" type="hidden" value="#ffffff" />
    <input id="nucleusGradientBottom" type="hidden" value="#7ea5ff" />
    <input id="nucleusGradientMix" type="hidden" value="0.15" />
    <input id="nucleusSpinX" type="hidden" value="0" />
    <input id="nucleusSpinY" type="hidden" value="0.22" />
    <input id="nucleusSpinZ" type="hidden" value="0" />
    <input id="nucleusBloomEnabled" type="checkbox" />
    <input id="nucleusBloomStrength" type="hidden" value="0.7" />
    <input id="nucleusBloomRadius" type="hidden" value="0.35" />
    <input id="nucleusBloomThreshold" type="hidden" value="0.75" />
    <input id="internalDetailShading" type="hidden" value="true" />
    <input id="particleLighting" type="hidden" value="true" />
    <input id="sphereShadows" type="hidden" value="true" />
    <label for="shadowContrast">Shadow Contrast</label>
    <input id="shadowContrast" type="range" min="0" max="2.5" step="0.01" value="1" />
    <input id="sphereOpacity" type="hidden" value="0.95" />
    <input id="sphereGlare" type="hidden" value="0.45" />
    <input id="sphereMatte" type="hidden" value="0.35" />
    <input id="internalMatte" type="hidden" value="0.45" />
    <input id="sphereGlow" type="hidden" value="0.35" />
  </div>
  <div id="statusLine" class="status"></div>
</div>
<script>
window.__SHAPE_VIEWER_EMBED__ = ${bootstrapText};
</script>
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.161.0/build/three.module.js",
    "three/examples/jsm/": "https://unpkg.com/three@0.161.0/examples/jsm/"
  }
}
</script>
<script type="module" src="${EXPORT_RUNTIME_MAIN_URL}"></script>`;
}

function exportSnapshotJson() {
  const payload = buildExportSnapshot();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadTextFile(`shape-object-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");
  setStatus("Exported shape snapshot JSON.");
}

function exportWebflowEmbed() {
  const payload = buildExportSnapshot();
  const startupConfig = buildStartupConfig();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const html = buildWebflowEmbedHtml(payload, startupConfig);
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
const autoRotateStepQ = new THREE.Quaternion();

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
  group.getWorldPosition(tempShadowCenter);
  if (rotationTestLabel) {
    tempLabelDir.copy(tempShadowCenter).sub(camera.position).normalize();
    rotationTestLabel.position.copy(tempShadowCenter).addScaledVector(tempLabelDir, 9.5);
  }
  sharedShadowCenter.value.copy(tempShadowCenter);
  sharedShadowLightDir.value.copy(topLight.position).sub(tempShadowCenter).normalize();

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

applyMaterialControls();
updateNucleusControlSections(materialControls.nucleusShape);

async function bootScene() {
  const startupEnvUrl = EMBED_STARTUP_ENV_URL || DEFAULT_REFLECTION_IMAGE_URL;
  const startupMeshUrl = EMBED_STARTUP_MESH_URL || DEFAULT_STARTUP_MESH_URL;
  let startupReflectionLoaded = await loadReflectionImageEnvFromUrl(startupEnvUrl, "Startup reflection");
  if (!startupReflectionLoaded) {
    startupReflectionLoaded = await loadReflectionImageEnvFromUrl("./citrus_orchard_road_puresky_1k.exr", "Startup reflection");
  }
  let startupMeshLoaded = await loadCustomMeshFromUrl(
    startupMeshUrl,
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
