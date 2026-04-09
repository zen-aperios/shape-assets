import * as THREE from "three";
import { OrbitControls } from "../../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "../../node_modules/three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "../../node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "../../node_modules/three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js";
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
  externalCountInput,
  internalCountInput,
  shapeScaleInput,
  surfaceExternalOnlyInput,
  faceMinTravelInput,
  movementModeInput,
  internalMovementInput,
  gridEnabledInput,
  collisionEnabledInput,
  travelSpeedInput,
  turbulenceInput,
  turbulenceRippleInput,
  rippleCountInput,
  rippleSizeInput,
  tornadoBatchRingsInput,
  tornadoBatchOffsetInput,
  tornadoSkewInput,
  tornadoImperfectionInput,
  externalSizeInput,
  internalSpeedInput,
  internalSizeInput,
  innerWarpInput,
  sphereGapInput,
  cursorSizeInput,
  cursorForceInput,
  cursorLinkDistanceInput,
  cursorLineColorInput,
  gridColorInput,
  showParticlesInput,
  showImportedSurfaceInput,
  sphereColorInput,
  internalColorInput,
  nucleusShapeInput,
  nucleusPresetInput,
  nucleusSizeInput,
  nucleusCornerRadiusInput,
  nucleusYOffsetInput,
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
  sphereOpacityInput,
  sphereGlareInput,
  sphereMatteInput,
  internalMatteInput,
  sphereGlowInput,
  exportDataBtn,
  exportWebflowBtn
} = refs;

function createNucleusGeometry(shape, cornerRadius) {
  if (shape === "cube") return new RoundedBoxGeometry(1.7, 1.7, 1.7, 5, cornerRadius);
  if (shape === "crystal-orb") return new THREE.IcosahedronGeometry(1, 5);
  if (shape === "liquid-core") return new THREE.SphereGeometry(1, 96, 72);
  return new THREE.IcosahedronGeometry(1, 6);
}

function clearImportedSurface() {
  for (let i = importSurfaceGroup.children.length - 1; i >= 0; i--) {
    const child = importSurfaceGroup.children[i];
    child.geometry?.dispose?.();
    importSurfaceGroup.remove(child);
  }
}

function syncImportedSurfaceMaterials() {
  const baseMaterial = nucleusMaterial;
  const applySourceMaterial = (mesh, source, forceDoubleSide = false) => {
    const current = mesh.material;
    const sameType = current && current.constructor === source.constructor;
    if (!sameType) {
      current?.dispose?.();
      mesh.material = source.clone();
    } else {
      mesh.material.copy(source);
    }
    if (forceDoubleSide) mesh.material.side = THREE.DoubleSide;
    mesh.material.needsUpdate = true;
  };
  importSurfaceGroup.traverse((child) => {
    if (!child.isMesh) return;
    applySourceMaterial(child, baseMaterial, true);
  });
}

function syncImportedSurfaceVisibility() {
  importSurfaceGroup.visible =
    importedSurfaceVisible &&
    importSurfaceGroup.children.length > 0;
}

function buildImportedSurface(root) {
  clearImportedSurface();
  if (!root) {
    syncImportedSurfaceVisibility();
    return;
  }

  root.updateWorldMatrix(true, true);
  const meshPos = new THREE.Vector3();
  const meshQuat = new THREE.Quaternion();
  const meshScale = new THREE.Vector3();
  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    child.matrixWorld.decompose(meshPos, meshQuat, meshScale);
    const baseMesh = new THREE.Mesh(markLiquidGeometry(child.geometry.clone()), nucleusMaterial.clone());
    baseMesh.material.side = THREE.DoubleSide;
    baseMesh.position.copy(meshPos);
    baseMesh.quaternion.copy(meshQuat);
    baseMesh.scale.copy(meshScale);
    baseMesh.castShadow = false;
    baseMesh.receiveShadow = false;
    baseMesh.userData.surfaceRole = "base";
    importSurfaceGroup.add(baseMesh);

  });

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

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0xd6d6d6, 16, 44);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 160);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
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
const nucleusDynamicEnvRT = new THREE.WebGLCubeRenderTarget(256, {
  type: THREE.HalfFloatType,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
  colorSpace: THREE.SRGBColorSpace
});
const nucleusCubeCamera = new THREE.CubeCamera(0.1, 180, nucleusDynamicEnvRT);
scene.add(nucleusCubeCamera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1.2;
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
const importSurfaceGroup = new THREE.Group();
group.add(importSurfaceGroup);
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

const initialExternalCount = Number(externalCountInput?.value);
const initialInternalCount = Number(internalCountInput?.value);
let externalCount = Number.isFinite(initialExternalCount) ? Math.max(0, initialExternalCount) : 0;
let internalCount = Number.isFinite(initialInternalCount) ? Math.max(0, initialInternalCount) : 0;
let sphereCount = Math.max(0, externalCount + internalCount);
const baseShapeRadius = 5.7;
let shapeScale = Number(shapeScaleInput?.value) || 1;
let surfaceExternalOnly = surfaceExternalOnlyInput?.checked ?? false;
let particlesVisible = showParticlesInput?.checked ?? false;
let importedSurfaceVisible = showImportedSurfaceInput?.checked ?? true;

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
  color: 0xffffff,
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
  color: 0xffffff,
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
nucleusMaterial.envMap = chromeEnvMap;
nucleusMaterial.envMapIntensity = 3.0;
nucleusShellMaterial.envMap = chromeEnvMap;
nucleusShellMaterial.envMapIntensity = 2.4;

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

const materialControls = {
  color: "#90b2ff",
  internalColor: "#4f6fb6",
  nucleusShape: nucleusShapeInput?.value || "sphere",
  nucleusPreset: nucleusPresetInput?.value || "custom",
  nucleusSize: Number(nucleusSizeInput?.value ?? 1.1),
  nucleusCornerRadius: Number(nucleusCornerRadiusInput?.value ?? 0.12),
  nucleusYOffset: Number(nucleusYOffsetInput?.value ?? 0),
  nucleusColor: nucleusColorInput?.value || "#ffffff",
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
    nucleusMesh.castShadow = false;
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

const motionControls = {
  travelSpeed: Number(travelSpeedInput?.value ?? 8),
  turbulence: Number(turbulenceInput?.value ?? 0),
  turbulenceRipple: Number(turbulenceRippleInput?.value ?? 0),
  rippleCount: Number(rippleCountInput?.value ?? 4),
  rippleSize: Number(rippleSizeInput?.value ?? 1),
  externalSize: Number(externalSizeInput?.value ?? 1),
  internalSpeed: Number(internalSpeedInput?.value ?? 0.8),
  internalSize: Number(internalSizeInput?.value ?? 0.9),
  innerWarp: Number(innerWarpInput?.value ?? 0),
  sphereGap: Number(sphereGapInput?.value ?? 0.19),
  cursorSize: Number(cursorSizeInput?.value ?? 4.0),
  cursorForce: Number(cursorForceInput?.value ?? 2.4),
  cursorLinkDistance: Number(cursorLinkDistanceInput?.value ?? 2.8),
  tornadoBatchRings: Number(tornadoBatchRingsInput?.value ?? 3),
  tornadoBatchOffset: Number(tornadoBatchOffsetInput?.value ?? 0.04),
  tornadoSkew: Number(tornadoSkewInput?.value ?? 0),
  tornadoImperfection: Number(tornadoImperfectionInput?.value ?? 1)
};

function readMotionControls() {
  motionControls.travelSpeed = Number(travelSpeedInput?.value ?? motionControls.travelSpeed);
  motionControls.turbulence = Number(turbulenceInput?.value ?? motionControls.turbulence);
  motionControls.turbulenceRipple = Number(turbulenceRippleInput?.value ?? motionControls.turbulenceRipple);
  motionControls.rippleCount = Number(rippleCountInput?.value ?? motionControls.rippleCount);
  motionControls.rippleSize = Number(rippleSizeInput?.value ?? motionControls.rippleSize);
  motionControls.externalSize = Number(externalSizeInput?.value ?? motionControls.externalSize);
  motionControls.internalSpeed = Number(internalSpeedInput?.value ?? motionControls.internalSpeed);
  motionControls.internalSize = Number(internalSizeInput?.value ?? motionControls.internalSize);
  motionControls.innerWarp = Number(innerWarpInput?.value ?? motionControls.innerWarp);
  motionControls.sphereGap = Number(sphereGapInput?.value ?? motionControls.sphereGap);
  motionControls.cursorSize = Number(cursorSizeInput?.value ?? motionControls.cursorSize);
  motionControls.cursorForce = Number(cursorForceInput?.value ?? motionControls.cursorForce);
  motionControls.cursorLinkDistance = Number(cursorLinkDistanceInput?.value ?? motionControls.cursorLinkDistance);
  motionControls.tornadoBatchRings = Number(tornadoBatchRingsInput?.value ?? motionControls.tornadoBatchRings);
  motionControls.tornadoBatchOffset = Number(tornadoBatchOffsetInput?.value ?? motionControls.tornadoBatchOffset);
  motionControls.tornadoSkew = Number(tornadoSkewInput?.value ?? motionControls.tornadoSkew);
  motionControls.tornadoImperfection = Number(tornadoImperfectionInput?.value ?? motionControls.tornadoImperfection);
}

function applyMaterialControls() {
  const internalDetails = internalDetailShadingInput?.checked ?? true;
  const sphereShadowsEnabled = (sphereShadowsInput?.checked ?? true) && particleLightingEnabled;
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
  externalShadowUniforms.uSharedShadowStrength.value = sphereShadowsEnabled ? 0.5 : 0.0;
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
    sphereShadowsEnabled && nucleusSupportsSharedShadow ? 0.2 : 0.0;
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
  nucleusRimMaterial.uniforms.uPower.value = Math.max(0.5, materialControls.nucleusRimPower ?? 2.6);
  nucleusRimMaterial.uniforms.uStrength.value = Math.max(0, materialControls.nucleusRimStrength ?? 0.35);
  nucleusGradientMaterial.uniforms.uTop.value.set(materialControls.nucleusGradientTop || "#ffffff");
  nucleusGradientMaterial.uniforms.uBottom.value.set(materialControls.nucleusGradientBottom || "#7ea5ff");
  nucleusGradientMaterial.uniforms.uMix.value = Math.max(0, Math.min(1, materialControls.nucleusGradientMix ?? 0.15));
  bloomPass.strength = Math.max(0, materialControls.nucleusBloomStrength ?? 0.7);
  bloomPass.radius = Math.max(0, Math.min(1, materialControls.nucleusBloomRadius ?? 0.35));
  bloomPass.threshold = Math.max(0, Math.min(1, materialControls.nucleusBloomThreshold ?? 0.75));
  bloomPass.enabled = !!materialControls.nucleusBloomEnabled;
  syncImportedSurfaceMaterials();

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
  nucleusMaterial.needsUpdate = true;
  nucleusShellMaterial.needsUpdate = true;
  nucleusRimMaterial.needsUpdate = true;
  nucleusGradientMaterial.needsUpdate = true;
  externalParticleBasicMaterial.needsUpdate = true;
  internalParticleBasicMaterial.needsUpdate = true;
  nucleusBasicMaterial.needsUpdate = true;
  rimLight.intensity = 1.1 + materialControls.glow * 0.9;
  syncNucleusMesh();
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

function seedUnitVector(seedA, seedB) {
  const x = hash2(seedA + 13.17, seedB + 3.91) * 2 - 1;
  const y = hash2(seedA + 29.53, seedB + 11.47) * 2 - 1;
  const z = hash2(seedA + 47.21, seedB + 19.33) * 2 - 1;
  tempPointC.set(x, y, z);
  if (tempPointC.lengthSq() < 0.000001) return tempPointC.set(0, 1, 0);
  return tempPointC.normalize();
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
      turbulenceSeedA: Math.random() * 100,
      turbulenceSeedB: Math.random() * 100,
      turbulenceSeedC: Math.random() * 100,
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
    syncImportedSurfaceVisibility();
    setStatus("Applied custom mesh shape.");
    return;
  }

  applyBasePoints(buildPresetShapePoints(selected, sphereCount, baseShapeRadius), false, false);
  syncImportedSurfaceVisibility();
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
const pointerPrevNdc = new THREE.Vector2(99, 99);
let cursorActive = false;
let pointerMotionEnergy = 0;

function updatePointer(clientX, clientY) {
  const nx = (clientX / window.innerWidth) * 2 - 1;
  const ny = -(clientY / window.innerHeight) * 2 + 1;
  if (Math.abs(pointerPrevNdc.x) <= 1.5 && Math.abs(pointerPrevNdc.y) <= 1.5) {
    const dx = nx - pointerPrevNdc.x;
    const dy = ny - pointerPrevNdc.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    pointerMotionEnergy = Math.max(pointerMotionEnergy * 0.55, Math.min(1, speed * 24));
  }
  pointerNdc.set(nx, ny);
  pointerPrevNdc.set(nx, ny);
  cursorActive = true;
}

window.addEventListener("pointermove", (e) => updatePointer(e.clientX, e.clientY));
window.addEventListener("mousemove", (e) => updatePointer(e.clientX, e.clientY));
window.addEventListener("pointerleave", () => {
  pointerNdc.set(99, 99);
  pointerPrevNdc.set(99, 99);
  pointerMotionEnergy = 0;
  cursorActive = false;
});
window.addEventListener("mouseleave", () => {
  pointerNdc.set(99, 99);
  pointerPrevNdc.set(99, 99);
  pointerMotionEnergy = 0;
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
    const asset = await buildMeshAssetFromFile(file, sphereCount, baseShapeRadius);
    customMeshPoints = asset.points;
    customMeshSurfaceRoot = asset.root;
    buildImportedSurface(customMeshSurfaceRoot);
    customMeshOption.disabled = false;
    shapeSelect.value = "custom-mesh";
    applyPresetFromSelect();
    setStatus(`Mesh loaded: ${file.name}`);
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Could not build shape from that mesh.", true);
  }
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
    setControlValue(nucleusPresetInput, "custom");
  }
}

shapeSelect.addEventListener("change", applyPresetFromSelect);

sphereColorInput.addEventListener("input", (e) => {
  materialControls.color = e.target.value;
  applyMaterialControls();
});
showParticlesInput?.addEventListener("change", (e) => {
  particlesVisible = e.target.checked;
  syncParticleVisibility();
  setStatus(particlesVisible ? "Particles visible." : "Particles hidden.");
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
nucleusPresetInput?.addEventListener("change", (e) => {
  applyNucleusPreset(e.target.value || "custom");
});
nucleusShapeInput?.addEventListener("change", (e) => {
  materialControls.nucleusShape = e.target.value || "sphere";
  updateNucleusControlSections(materialControls.nucleusShape);
  markNucleusPresetCustom();
  syncNucleusMesh();
  applyMaterialControls();
});
nucleusSizeInput?.addEventListener("input", (e) => {
  materialControls.nucleusSize = Number(e.target.value);
  markNucleusPresetCustom();
  syncNucleusMesh();
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
  if (currentShapePoints.length) rebuildTornadoMetrics(currentShapePoints);
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
      nucleusPreset: materialControls.nucleusPreset || "custom",
      nucleusShape: materialControls.nucleusShape,
      nucleusCornerRadius: round4(materialControls.nucleusCornerRadius ?? 0),
      nucleusSize: round4(materialControls.nucleusSize),
      nucleusYOffset: round4(materialControls.nucleusYOffset),
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
      innerWarp: round4(motionControls.innerWarp ?? 0),
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
turbulenceInput?.addEventListener("input", readMotionControls);
turbulenceRippleInput?.addEventListener("input", readMotionControls);
rippleCountInput?.addEventListener("input", readMotionControls);
rippleSizeInput?.addEventListener("input", readMotionControls);
tornadoBatchRingsInput?.addEventListener("input", readMotionControls);
tornadoBatchOffsetInput?.addEventListener("input", readMotionControls);
tornadoSkewInput?.addEventListener("input", readMotionControls);
tornadoImperfectionInput?.addEventListener("input", readMotionControls);
externalSizeInput?.addEventListener("input", readMotionControls);
internalSpeedInput?.addEventListener("input", retuneAllParticles);
internalSizeInput?.addEventListener("input", readMotionControls);
innerWarpInput?.addEventListener("input", readMotionControls);
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
  const elapsed = clock.elapsedTime;
  const hasCursor2D = cursorActive && Math.abs(pointerNdc.x) <= 1.2 && Math.abs(pointerNdc.y) <= 1.2;
  pointerMotionEnergy = Math.max(0, pointerMotionEnergy - dt * 3.2);
  const cursorRepelGate = hasCursor2D
    ? THREE.MathUtils.smoothstep(pointerMotionEnergy, 0.02, 0.22)
    : 0;
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
  sharedShadowCenter.value.copy(tempShadowCenter);
  sharedShadowLightDir.value.copy(topLight.position).sub(tempShadowCenter).normalize();

  if (hasCursor2D) {
    tempCamRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    tempCamUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  }

  const applyCursorDisplacement = (p) => {
    if (!hasCursor2D || cursorRepelGate <= 0.0001) return;
    tempProjected.copy(p.pos).project(camera);
    const dx = tempProjected.x - pointerNdc.x;
    const dy = tempProjected.y - pointerNdc.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= repelRadiusNdc) return;
    const falloff = 1 - d / repelRadiusNdc;
    p.cursorTear = Math.max(p.cursorTear, Math.min(1.8, falloff * 1.8));
    if (d > 0.0001) {
      const nx = dx / d;
      const ny = dy / d;
      tempWorldPush.copy(tempCamRight).multiplyScalar(nx).addScaledVector(tempCamUp, ny);
    } else {
      tempWorldPush.copy(tempCamRight);
    }
    const cursorScale = p.isInternal ? 0.95 : 1.7;
    p.pos.addScaledVector(tempWorldPush, falloff * falloff * repelStrength * cursorScale * cursorRepelGate);
  };

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
      applyCursorDisplacement(p);
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
              const batchSize = Math.max(1, Math.floor(motionControls.tornadoBatchRings || 1));
              const batchId = Math.floor((p.oneWayLane || 0) / batchSize);
              phaseOffset += batchId * (motionControls.tornadoBatchOffset || 0);

              const yCenter = oneWayOrbitBandYCenters[p.oneWayLane] ?? 0;
              const ySpan = Math.max(0.0001, oneWayOrbitYMax - oneWayOrbitYMin);
              const yNorm = (yCenter - oneWayOrbitYMin) / ySpan;
              phaseOffset += (yNorm - 0.5) * (motionControls.tornadoSkew || 0);
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
              const imperfection = Math.max(0, motionControls.tornadoImperfection ?? 1);
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
          const internalMul = p.isInternal ? motionControls.internalSpeed : 1;
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

    if (motionControls.turbulence > 0.0001 || motionControls.turbulenceRipple > 0.0001) {
      // Area-based radial ripples only: avoids local directional jitter/clumping.
      tempPointB.copy(p.anchor);
      if (tempPointB.lengthSq() > 0.000001) {
        tempPointA.copy(tempPointB).normalize(); // radial dir
        tempPointB.normalize(); // normalized surface direction for ripple distance checks

        const layerMul = p.isInternal ? 0.8 : 1;
        const modeMul = movementMode === "tornado" ? 1.4 : 1;
        const randomRippleCount = Math.max(0, Math.min(24, Math.floor(motionControls.rippleCount || 0)));
        const randomRippleSize = Math.max(0.2, motionControls.rippleSize || 1);
        const lifeRate = 0.14 + motionControls.turbulenceRipple * 0.06 + motionControls.turbulence * 0.02;
        const lifeCursor = elapsed * lifeRate;
        const baseRadius = 0.2 + randomRippleSize * 0.32;
        const cosRadius = Math.cos(baseRadius);
        let rippleDisp = 0;

        for (let k = 0; k < randomRippleCount; k++) {
          const life = lifeCursor + k * 0.618;
          const epoch = Math.floor(life);
          const lifeT = life - epoch;
          const envelope = Math.sin(lifeT * Math.PI) ** 2; // appear -> peak -> return

          tempSeparate.copy(seedUnitVector(epoch * 37.71 + k * 11.13, k * 5.77 + 2.31));
          const dot = THREE.MathUtils.clamp(tempPointB.dot(tempSeparate), -1, 1);
          if (dot <= cosRadius) continue;

          const proximity = (dot - cosRadius) / Math.max(0.00001, 1 - cosRadius);
          const edge = proximity * proximity * (3 - 2 * proximity);
          const sign = hash2(epoch * 91.73 + k * 4.17, 6.13) > 0.5 ? 1 : -1;

          const waveCycles = 1.8 + randomRippleSize * 1.4;
          const wavePhase = (1 - proximity) * Math.PI * waveCycles - lifeT * Math.PI * 2.2;
          rippleDisp += sign * Math.sin(wavePhase) * edge * envelope;
        }

        const amp =
          (motionControls.turbulence * 0.018 + motionControls.turbulenceRipple * 0.016) *
          modeMul *
          layerMul;
        p.anchor.addScaledVector(tempPointA, THREE.MathUtils.clamp(rippleDisp * amp, -0.42, 0.42));
      }
    }
    if (p.isInternal && motionControls.innerWarp > 0.0001) {
      tempPointB.copy(p.anchor);
      if (tempPointB.lengthSq() > 0.000001) {
        tempPointA.copy(tempPointB).normalize();
        const noiseX = tempPointB.x * 0.72 + p.turbulenceSeedA * 6.1;
        const noiseY = tempPointB.y * 0.72 + p.turbulenceSeedB * 6.1;
        const noiseZ = tempPointB.z * 0.72 + p.turbulenceSeedC * 6.1;
        const phase = elapsed * (0.42 + motionControls.travelSpeed * 0.015);
        const waveA = noise2D(noiseX + phase * 0.95, noiseY - phase * 0.7);
        const waveB = noise2D(noiseZ - phase * 0.72, noiseX + phase * 0.66);
        const signedWarp = ((waveA - 0.5) * 2) * 0.62 + ((waveB - 0.5) * 2) * 0.38;
        const depthMul = 0.35 + (1 - p.internalDepth) * 0.95;
        const warpAmp = motionControls.innerWarp * 0.11 * depthMul;
        p.anchor.addScaledVector(tempPointA, THREE.MathUtils.clamp(signedWarp * warpAmp, -0.38, 0.38));
      }
    }

    if ((movementMode === "tornado" || faceOneWayActive) && particleOneWayMode) {
      // Preserve phase lock, but use the same cursor-tear recovery path as other modes.
      if (p.cursorTear > 0.01) {
        const recoveryScale = p.isInternal ? 0.55 : 0.16;
        p.pos.lerp(p.anchor, Math.min(1, p.followRate * recoveryScale * dt));
      } else {
        const baseFollow = p.isInternal ? 18 : 14;
        p.pos.lerp(p.anchor, Math.min(1, baseFollow * dt));
      }
    } else {
      const recoveryScale = p.cursorTear > 0.01
        ? (p.isInternal ? 0.55 : 0.16)
        : (p.isInternal ? 1.15 : 1);
      p.pos.lerp(p.anchor, Math.min(1, p.followRate * recoveryScale * dt));
    }
    p.cursorTear = Math.max(0, p.cursorTear - dt * (p.isInternal ? 0.92 : 0.38));

    applyCursorDisplacement(p);

  }

  if (nucleusMesh && nucleusMesh.visible) {
    tempPointA.set(0, materialControls.nucleusYOffset, 0);
    nucleusMesh.position.lerp(tempPointA, Math.min(1, dt * 4.6));
    if (hasCursor2D && cursorRepelGate > 0.0001) {
      tempProjected.copy(nucleusMesh.position).project(camera);
      const dx = tempProjected.x - pointerNdc.x;
      const dy = tempProjected.y - pointerNdc.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const nucleusRepelRadius = 0.11 + motionControls.cursorSize * 0.07;
      if (d < nucleusRepelRadius) {
        const falloff = 1 - d / nucleusRepelRadius;
        if (d > 0.0001) {
          const nx = dx / d;
          const ny = dy / d;
          tempWorldPush.copy(tempCamRight).multiplyScalar(nx).addScaledVector(tempCamUp, ny);
        } else {
          tempWorldPush.copy(tempCamRight);
        }
        const nucleusRepelStrength = (0.22 + motionControls.cursorForce * 0.075) * (materialControls.nucleusSize * 0.35);
        nucleusMesh.position.addScaledVector(tempWorldPush, falloff * falloff * nucleusRepelStrength * cursorRepelGate);
      }
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
    const spinX = materialControls.nucleusSpinX ?? 0;
    const spinY = materialControls.nucleusSpinY ?? 0;
    const spinZ = materialControls.nucleusSpinZ ?? 0;
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
        ? 0.02 + p.cursorTear * 0.04
        : movementMode === "static-detail"
          ? 0.015 + p.cursorTear * 0.22
          : movementMode === "tornado"
            ? 0.045 + p.cursorTear * 0.32
            : movementMode === "one-way"
              ? 0.045 + p.cursorTear * 0.3
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
  updateNucleusDynamicEnv();

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}

rebuildSpheres(sphereCount);
applyMaterialControls();
updateNucleusControlSections(materialControls.nucleusShape);
applyPresetFromSelect();
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});
