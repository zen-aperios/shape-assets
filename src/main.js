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
  creatureSelectInput,
  movementProfileInput,
  showImportedSurfaceInput,
  whaleScaleInput,
  whaleStartXInput,
  whaleStartYInput,
  whaleStartZInput,
  whaleRotationXInput,
  whaleRotationYInput,
  whaleRotationZInput,
  sceneBackgroundColorInput,
  particleReturnSpeedInput,
  particleFallStrengthInput,
  particleSprayGravityInput,
  particleSprayHeightInput,
  particlePierceReachInput,
  particleCoreTightnessInput,
  particleColorInput,
  particleShapeInput,
  particleThicknessInput,
  waveAmplitudeInput,
  waveSpeedInput,
  waveAggressionInput,
  pierceRippleLeadInput,
  pierceRippleStrengthInput,
  pierceRippleWidthInput,
  pierceRippleSpeedInput,
  pierceStartInput,
  tipBiasInput,
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
  exportConfigBtn,
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
const DEFAULT_STARTUP_MESH_URL = new URL("../whale.glb", import.meta.url).href;
const DEFAULT_STARTUP_MESH_FILENAME = "whale.glb";
const DEFAULT_DOLPHIN_MESH_URL = new URL("../dolphin.glb", import.meta.url).href;
const DEFAULT_DOLPHIN_MESH_FILENAME = "dolphin.glb";
const EXPORT_DEFAULT_MESH_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@main/whale.glb";
const EXPORT_DEFAULT_ENV_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@main/citrus_orchard_road_puresky_1k.exr";
const EXPORT_RUNTIME_STYLES_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@4005330/styles.css";
const EXPORT_RUNTIME_MAIN_URL = "https://cdn.jsdelivr.net/gh/zen-aperios/shape-assets@4005330/src/main.js";
const EMBED_STARTUP_MESH_URL = EMBED_BOOTSTRAP?.assets?.meshUrl || null;
const EMBED_STARTUP_ENV_URL = EMBED_BOOTSTRAP?.assets?.envUrl || null;
const CREATURE_ASSETS = {
  whale: {
    label: "Whale",
    url: DEFAULT_STARTUP_MESH_URL,
    filename: DEFAULT_STARTUP_MESH_FILENAME
  },
  dolphin: {
    label: "Dolphin",
    url: DEFAULT_DOLPHIN_MESH_URL,
    filename: DEFAULT_DOLPHIN_MESH_FILENAME
  }
};
const MOVEMENT_PROFILES = {
  "whale-breach": {
    label: "Whale Breach",
    cycleSeconds: 6.2,
    ascentSplit: 0.52,
    ascentPow: 0.72,
    descentPow: 1.28,
    forcePow: 1.35,
    breachHeight: 4.7,
    ascentBoost: 1.35,
    surfaceClearance: 1.15,
    reentryMaxDepth: 1.2,
    reentryStart: 0.72,
    reentryEnd: 0.98,
    descentStart: 0.38,
    descentEnd: 0.8,
    descentTargetScale: 0.61,
    descentRotXDeg: -57,
    descentRotYDeg: 51,
    descentRotZDeg: -67,
    arcDistance: 0,
    arcTravelStart: 0.12,
    arcTravelEnd: 0.86,
    arcForwardSign: 1,
    arcLateralAmount: 0.24,
    piercePhaseEnd: 0.58
  },
  "dolphin-arc": {
    label: "Dolphin Arc",
    cycleSeconds: 4.6,
    ascentSplit: 0.44,
    ascentPow: 0.62,
    descentPow: 1.42,
    forcePow: 1.08,
    breachHeight: 5.4,
    ascentBoost: 1.6,
    surfaceClearance: 1.35,
    reentryMaxDepth: 1.5,
    reentryStart: 0.68,
    reentryEnd: 0.95,
    descentStart: 0.3,
    descentEnd: 0.9,
    descentTargetScale: 0.74,
    descentRotXDeg: -76,
    descentRotYDeg: 24,
    descentRotZDeg: -18,
    arcDistance: 3.4,
    arcTravelStart: 0.08,
    arcTravelEnd: 0.92,
    arcForwardSign: -1,
    arcLateralAmount: 0.2,
    piercePhaseEnd: 0.5
  }
};
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
    creatureType: "whale",
    movementProfile: "linked",
    nucleusYOffset: -4.24,
    whaleScale: 1,
    whaleStartX: 0,
    whaleStartY: -11,
    whaleStartZ: 0,
    whaleRotationX: -57,
    whaleRotationY: 0,
    whaleRotationZ: 0,
    sceneBackgroundColor: "#feffff",
    particleReturnSpeed: 0.1,
    particleFallStrength: 2.5,
    particleSprayGravity: 8.8,
    particleSprayHeight: 2.5,
    particlePierceReach: 1.23,
    particleCoreTightness: 0.4,
    particleColor: "#e3f6ff",
    particleShape: "cube",
    particleThickness: 1,
    waveAmplitude: 3,
    waveSpeed: 1.55,
    waveAggression: 3,
    pierceRippleLead: 0.35,
    pierceRippleStrength: 1,
    pierceRippleWidth: 1,
    pierceRippleSpeed: 1,
    pierceStart: 1.08,
    tipBias: 1.4,
    lightDistance: 6,
    nucleusColor: "#e5f5f2",
    nucleusOpacity: 1,
    nucleusGlare: 0.97,
    nucleusMatte: 0,
    nucleusGlow: 1.68,
    nucleusTransmission: 1,
    nucleusThickness: 6,
    nucleusAttenuationColor: "#000000",
    nucleusAttenuationDistance: 19.2,
    nucleusSpecular: 1,
    nucleusSpecularColor: "#00d2f7",
    nucleusClearcoat: 1,
    nucleusClearcoatRoughness: 1,
    nucleusIridescence: 1,
    nucleusIor: 2.333,
    nucleusEnvIntensity: 3.2,
    nucleusReflectTint: "#00e0ff",
    nucleusReflectTintMix: 0.49,
    surfaceChroma: 1,
    reflectionStrength: 3.85,
    nucleusRimStrength: 2.5,
    nucleusRimPower: 8,
    nucleusRimColor: "#00fbf8",
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
const DEFAULT_STARTUP_SCENE_STATE = {
  cameraPosition: [15.303946293255809, -3.7515814655347155, -0.691258884914884],
  controlsTarget: [0, 0, 0],
  cameraZoom: 1,
  groupRotation: [0, 0, 0]
};
const CAPSULE_COUNT_X = 180;
const CAPSULE_COUNT_Z = 120;
const CAPSULE_SPACING = 0.272;
const CAPSULE_COUNT = CAPSULE_COUNT_X * CAPSULE_COUNT_Z;
const BREACH_CYCLE_SECONDS = 6.2;
const BREACH_HEIGHT = 4.7;
const BREACH_ASCENT_BOOST = 1.35;
const BREACH_SURFACE_CLEARANCE = 1.15;
const BREACH_REENTRY_MAX_DEPTH = 1.2;
const DESCENT_TARGET_SCALE = 0.61;
const DESCENT_TARGET_ROT_X_DEG = -57;
const DESCENT_TARGET_ROT_Y_DEG = 51;
const DESCENT_TARGET_ROT_Z_DEG = -67;
const LANDING_SCATTER_COUNT = 14;
const WHALE_CONTACT_PROBE_COUNT = 11;
const WHALE_PRECONTACT_MARGIN = 1.08;
const RIPPLE_MAX_COUNT = 18;
const RIPPLE_LIFETIME = 2.6;
const RIPPLE_EXPANSION_SPEED = 4.2;
const SPRAY_PARTICLE_COUNT = 420;
const SPRAY_GRAVITY = 24.0;
const SURFACE_BASE_Y = -1.1;

function buildCapsuleField() {
  const points = [];
  const halfX = ((CAPSULE_COUNT_X - 1) * CAPSULE_SPACING) / 2;
  const halfZ = ((CAPSULE_COUNT_Z - 1) * CAPSULE_SPACING) / 2;

  for (let ix = 0; ix < CAPSULE_COUNT_X; ix++) {
    for (let iz = 0; iz < CAPSULE_COUNT_Z; iz++) {
      const rowOffset = iz % 2 === 0 ? CAPSULE_SPACING * 0.5 : 0;
      const jitterScale = CAPSULE_SPACING * 0.42;
      const lowFreq =
        Math.sin(ix * 0.33) * 0.22 +
        Math.cos(iz * 0.27) * 0.18 +
        Math.sin((ix + iz) * 0.11) * 0.14;
      const x = ix * CAPSULE_SPACING - halfX + rowOffset + (Math.random() * 2 - 1) * jitterScale + lowFreq * 0.08;
      const z = iz * CAPSULE_SPACING - halfZ + (Math.random() * 2 - 1) * jitterScale + lowFreq * 0.1;
      const radial = Math.sqrt(x * x + z * z);
      points.push({
        x,
        z,
        radial,
        waveOffset: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.18 + 0.06,
        scale: 0.5 + Math.random() * 1.15,
        cluster: 0.7 + Math.random() * 0.9 + Math.max(0, lowFreq) * 0.45
      });
    }
  }

  return points;
}

function smoothPulse(t) {
  return 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);
}

function rebuildWhaleContactProbesFromBox(box) {
  whaleContactProbes.length = 0;
  if (!box || box.isEmpty()) return;

  const min = box.min;
  const max = box.max;
  const size = tempPointA.subVectors(max, min);
  if (size.lengthSq() <= 0.000001) return;

  const addProbe = (x, y, z, weight = 1, role = "body") => {
    whaleContactProbes.push({
      local: new THREE.Vector3(x, y, z),
      world: new THREE.Vector3(),
      prevWorld: new THREE.Vector3(),
      prevSignedDistance: null,
      cooldown: 0,
      weight,
      role
    });
  };

  const floorY = min.y + size.y * 0.12;
  for (let i = 0; i < WHALE_CONTACT_PROBE_COUNT; i++) {
    const t = i / Math.max(1, WHALE_CONTACT_PROBE_COUNT - 1);
    const bodyBias = Math.sin(t * Math.PI);
    const x = THREE.MathUtils.lerp(min.x + size.x * 0.08, max.x - size.x * 0.1, t);
    const y = floorY + size.y * (0.06 + bodyBias * 0.08);
    const sideWidth = size.z * (0.05 + bodyBias * 0.18);
    const noseBias = Math.pow(t, 1.9);
    const weight = 0.78 + bodyBias * 0.82 + noseBias * 0.95;

    addProbe(x, y, 0, weight, t > 0.78 ? "front" : "body");
    if (sideWidth > size.z * 0.08 && i > 0 && i < WHALE_CONTACT_PROBE_COUNT - 1) {
      addProbe(x, y + size.y * 0.015, sideWidth, weight * 0.85, "side");
      addProbe(x, y + size.y * 0.015, -sideWidth, weight * 0.85, "side");
    }
  }

  const tipX = max.x + size.x * 0.04;
  const tipY = min.y + size.y * 0.22;
  addProbe(tipX, tipY, 0, 3.85, "tip");
  addProbe(max.x + size.x * 0.015, tipY - size.y * 0.035, size.z * 0.05, 2.6, "tip");
  addProbe(max.x + size.x * 0.015, tipY - size.y * 0.035, -size.z * 0.05, 2.6, "tip");
  const noseX = max.x - size.x * 0.002;
  const noseY = min.y + size.y * 0.18;
  addProbe(noseX, noseY, 0, 3.25, "nose");
  addProbe(max.x - size.x * 0.02, noseY + size.y * 0.06, size.z * 0.082, 2.35, "nose");
  addProbe(max.x - size.x * 0.02, noseY + size.y * 0.06, -size.z * 0.082, 2.35, "nose");
  addProbe(max.x - size.x * 0.06, min.y + size.y * 0.19, 0, 2.4, "front");
  addProbe(min.x + size.x * 0.56, min.y + size.y * 0.1, 0, 1.85, "belly");
  addProbe(min.x + size.x * 0.68, min.y + size.y * 0.105, 0, 1.65, "belly");

  for (let i = 0; i < whaleContactProbes.length; i++) {
    const probe = whaleContactProbes[i];
    probe.world.copy(probe.local);
    probe.prevWorld.copy(probe.local);
  }
}

function emitRipple(x, z, strength, elapsed, options = {}) {
  return;
}

function updateActiveRipples(elapsed) {
  for (let i = activeRipples.length - 1; i >= 0; i--) {
    const ripple = activeRipples[i];
    if (elapsed - ripple.startTime > ripple.life) activeRipples.splice(i, 1);
  }
}

function emitSprayBurst(origin, forward, lateral, upwardSpeed, spread, count, strength) {
  const sprayHeight = Math.max(0.4, materialControls.particleSprayHeight ?? 1.15);
  for (let i = 0; i < count; i++) {
    const particle = sprayParticleState[nextSprayParticleIndex];
    nextSprayParticleIndex = (nextSprayParticleIndex + 1) % SPRAY_PARTICLE_COUNT;
    const lofted = Math.random() < 0.18;
    const distanceSprout = Math.random() < 0.16;
    const lateralMix = (Math.random() * 2 - 1) * spread;
    const forwardMix = distanceSprout
      ? 1.7 + Math.random() * 1.8
      : lofted
        ? 0.65 + Math.random() * 0.9
        : 1.1 + Math.random() * 1.45;
    const upwardMix = upwardSpeed * (
      distanceSprout
        ? (0.9 + Math.random() * 0.5) * sprayHeight
        : lofted
          ? (0.8 + Math.random() * 0.45) * sprayHeight
          : (0.24 + Math.random() * 0.34) * THREE.MathUtils.lerp(0.92, 1.18, Math.min(1, sprayHeight - 0.4))
    );
    particle.active = true;
    particle.position.copy(origin);
    particle.position.x += lateral.x * lateralMix * 0.22;
    particle.position.z += lateral.z * lateralMix * 0.22;
    particle.position.y += Math.random() * 0.12;
    particle.velocity.copy(forward).multiplyScalar(forwardMix * strength);
    particle.velocity.addScaledVector(lateral, lateralMix * (distanceSprout ? 1.8 : lofted ? 0.95 : 1.45));
    particle.velocity.y = upwardMix;
    particle.initialVelocityY = upwardMix;
    particle.life = 0;
    particle.maxLife = distanceSprout
      ? 1.1 + Math.random() * 0.6
      : lofted
        ? 0.62 + Math.random() * 0.34
        : 0.26 + Math.random() * 0.22;
    particle.scale = (distanceSprout ? 0.045 : lofted ? 0.05 : 0.04) + Math.random() * 0.07 + strength * 0.008;
    particle.spin = Math.random() * Math.PI * 2;
    particle.spinSpeed = (Math.random() * 2 - 1) * (
      distanceSprout
        ? 3.5 + strength * 1.8
        : lofted
          ? 4 + strength * 2.4
          : 6 + strength * 3.2
    );
  }
}

function updateSprayParticles(dt, surfaceY) {
  const sprayGravity = Math.max(0, materialControls.particleSprayGravity ?? SPRAY_GRAVITY);
  for (let i = 0; i < sprayParticleState.length; i++) {
    const particle = sprayParticleState[i];
    if (!particle.active) {
      sprayDummy.position.set(0, -999, 0);
      sprayDummy.scale.setScalar(0.0001);
      sprayDummy.updateMatrix();
      sprayParticles.setMatrixAt(i, sprayDummy.matrix);
      continue;
    }

    particle.life += dt;
    const ageMix = Math.min(1, particle.life / particle.maxLife);
    const releaseMix = Math.min(1, ageMix * 1.6);
    particle.velocity.y *= 1 - Math.min(0.3, dt * (1.8 + releaseMix * 7.2));
    particle.velocity.y -= sprayGravity * dt;
    particle.velocity.multiplyScalar(1 - Math.min(0.28, dt * (1.2 + ageMix * 1.8)));
    particle.position.addScaledVector(particle.velocity, dt);
    particle.spin += particle.spinSpeed * dt;

    const impactSurfaceY = surfaceY + SURFACE_BASE_Y + 0.05;
    if (particle.position.y <= impactSurfaceY || particle.life >= 2.6) {
      particle.active = false;
      sprayDummy.position.set(0, -999, 0);
      sprayDummy.scale.setScalar(0.0001);
      sprayDummy.updateMatrix();
      sprayParticles.setMatrixAt(i, sprayDummy.matrix);
      continue;
    }

    const shrink = 1 - Math.pow(ageMix, 1.25);
    sprayDummy.position.copy(particle.position);
    sprayDummy.rotation.set(particle.spin, particle.spin * 0.6, particle.spin * 0.35);
    sprayDummy.scale.setScalar(particle.scale * shrink);
    sprayDummy.updateMatrix();
    sprayParticles.setMatrixAt(i, sprayDummy.matrix);
  }

  sprayParticles.instanceMatrix.needsUpdate = true;
}

function updateWhaleWaterContactRipples(
  surfaceY,
  dt,
  elapsed,
  landingImpact,
  breachPhase,
  breachCycle,
  piercePhaseEnd = 0.58
) {
  if (!importSurfaceGroup.visible || !whaleContactProbes.length) return;
  const piercePhaseActive = breachPhase <= THREE.MathUtils.clamp(piercePhaseEnd, 0.2, 0.85);
  const pierceAvailable = activePierceCycle !== breachCycle;
  const pierceRippleLead = THREE.MathUtils.clamp(materialControls.pierceRippleLead ?? 0.18, 0, 0.6);
  const pierceRippleStrength = Math.max(0, materialControls.pierceRippleStrength ?? 1);
  const pierceRippleWidth = Math.max(0.4, materialControls.pierceRippleWidth ?? 1);
  const pierceRippleSpeed = Math.max(0.4, materialControls.pierceRippleSpeed ?? 1);
  tempPointB.set(1, 0, 0).applyEuler(importSurfaceGroup.rotation).setY(0);
  if (tempPointB.lengthSq() < 0.0001) tempPointB.set(1, 0, 0);
  else tempPointB.normalize();
  tempPointC.set(-tempPointB.z, 0, tempPointB.x);

  for (let i = 0; i < whaleContactProbes.length; i++) {
    const probe = whaleContactProbes[i];
    probe.cooldown = Math.max(0, probe.cooldown - dt);
    probe.world.copy(probe.local);
    importSurfaceGroup.localToWorld(probe.world);
    const signedDistance = probe.world.y - surfaceY;
    const probeVelocityY = dt > 0.000001 ? (probe.world.y - probe.prevWorld.y) / dt : 0;
    const downwardSpeed = Math.max(0, -probeVelocityY);
    const pierceStart = THREE.MathUtils.clamp(materialControls.pierceStart ?? WHALE_PRECONTACT_MARGIN, 0.4, 1.8);
    const tipBias = THREE.MathUtils.clamp(materialControls.tipBias ?? 1.4, 0.7, 2.2);
    const precontactMargin =
      probe.role === "tip" ? pierceStart * tipBias :
      probe.role === "nose" ? pierceStart * THREE.MathUtils.lerp(0.95, 1.15, Math.min(1, (tipBias - 0.7) / 1.5)) :
      probe.role === "front" ? pierceStart * 0.92 :
      probe.role === "belly" ? pierceStart * 0.42 :
      0.08;
    const wasAboveWater = probe.prevSignedDistance !== null && probe.prevSignedDistance > precontactMargin * 0.12;
    const isSubmerged = signedDistance <= -0.03;
    const isPrecontact =
      signedDistance <= precontactMargin &&
      probe.prevSignedDistance !== null &&
      probe.prevSignedDistance > signedDistance;
    const tipApproachTrigger =
      probe.role === "tip" &&
      probe.prevSignedDistance !== null &&
      signedDistance <= precontactMargin * 0.9 &&
      probe.prevSignedDistance > signedDistance &&
      downwardSpeed > 0.02;
    const isContacting = isSubmerged || isPrecontact;

    if (
      piercePhaseActive &&
      pierceAvailable &&
      probe.cooldown <= 0 &&
      (
        (wasAboveWater && isContacting && downwardSpeed > (probe.role === "tip" ? 0.08 : 0.16)) ||
        tipApproachTrigger
      )
    ) {
      activePierceCycle = breachCycle;
      const contactDepth = isSubmerged ? -signedDistance : Math.max(0, precontactMargin - signedDistance);
      const depthBoost = THREE.MathUtils.clamp(contactDepth * (isSubmerged ? 0.75 : 0.52), 0, 0.55);
      const noseBoost =
        probe.role === "tip" ? 1.9 :
        probe.role === "nose" ? 1.45 :
        probe.role === "front" ? 1.18 :
        probe.role === "belly" ? 1.12 :
        1.0;
      const strength = THREE.MathUtils.clamp(
        (downwardSpeed * 0.075 + depthBoost + landingImpact * 0.32) * probe.weight * noseBoost,
        0.14,
        2.4
      ) * pierceRippleStrength;
      emitRipple(probe.world.x, probe.world.z, strength, elapsed, {
        life: 1.05,
        width: THREE.MathUtils.lerp(0.95, 1.95, Math.min(1, probe.weight / 1.9)) * pierceRippleWidth,
        wavelength: THREE.MathUtils.lerp(1.0, 1.65, Math.min(1, probe.weight / 1.9)),
        speed: THREE.MathUtils.lerp(3.2, 4.4, Math.min(1, downwardSpeed * 0.12)) * pierceRippleSpeed,
        push: (0.18 + probe.weight * 0.08) * THREE.MathUtils.lerp(0.7, 1.25, Math.min(1, pierceRippleStrength / 2.5)),
        ageOffset: (probe.role === "tip" ? 0.3 : probe.role === "nose" ? 0.24 : 0.18) + pierceRippleLead
      });
      const sprayStrength =
        strength * (probe.role === "tip" ? 1.08 : probe.role === "nose" ? 0.92 : probe.role === "front" ? 0.72 : 0.48);
      const sprayCount =
        probe.role === "tip" ? 34 :
        probe.role === "nose" ? 28 :
        probe.role === "front" ? 20 :
        probe.role === "belly" ? 14 :
        10;
      emitSprayBurst(
        probe.world,
        tempPointB,
        tempPointC,
        (probe.role === "tip" ? 4.8 : probe.role === "nose" ? 4.2 : probe.role === "front" ? 3.6 : 3.2) + downwardSpeed * 0.24,
        probe.role === "tip" ? 3.5 : probe.role === "nose" ? 3.1 : probe.role === "front" ? 2.35 : 1.85,
        sprayCount,
        (probe.role === "tip" ? 3.15 : probe.role === "nose" ? 2.8 : probe.role === "front" ? 2.5 : 2.3) + sprayStrength * 0.7
      );
      probe.cooldown = probe.role === "tip" ? 0.06 : isSubmerged ? 0.16 : 0.1;
    }

    probe.prevSignedDistance = signedDistance;
    probe.prevWorld.copy(probe.world);
  }
}

function applySnapshotDefaultsToInputs(snapshot) {
  if (!snapshot) return;
  const { shape = {}, render = {} } = snapshot;
  const map = {
    shapeSelect: shape.name,
    shapeScale: shape.scale,
    creatureSelect: render.creatureType,
    movementProfile: render.movementProfile,
    sphereColor: render.externalColor,
    internalColor: render.internalColor,
    nucleusPreset: render.nucleusPreset,
    nucleusShape: render.nucleusShape,
    nucleusCornerRadius: render.nucleusCornerRadius,
    nucleusSize: render.nucleusSize,
    nucleusYOffset: render.nucleusYOffset,
    whaleScale: render.whaleScale,
    whaleStartX: render.whaleStartX,
    whaleStartY: render.whaleStartY,
    whaleStartZ: render.whaleStartZ,
    whaleRotationX: render.whaleRotationX,
    whaleRotationY: render.whaleRotationY,
    whaleRotationZ: render.whaleRotationZ,
    sceneBackgroundColor: render.sceneBackgroundColor,
    particleReturnSpeed: render.particleReturnSpeed,
    particleFallStrength: render.particleFallStrength,
    particleSprayGravity: render.particleSprayGravity,
    particleSprayHeight: render.particleSprayHeight,
    particlePierceReach: render.particlePierceReach,
    particleCoreTightness: render.particleCoreTightness,
    particleColor: render.particleColor,
    particleShape: render.particleShape,
    particleThickness: render.particleThickness,
    waveAmplitude: render.waveAmplitude,
    waveSpeed: render.waveSpeed,
    waveAggression: render.waveAggression,
    pierceRippleLead: render.pierceRippleLead,
    pierceRippleStrength: render.pierceRippleStrength,
    pierceRippleWidth: render.pierceRippleWidth,
    pierceRippleSpeed: render.pierceRippleSpeed,
    pierceStart: render.pierceStart,
    tipBias: render.tipBias,
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
if (!loadedUserStartup) {
  applySnapshotDefaultsToInputs(DEFAULT_STARTUP_SNAPSHOT);
  loadedStartupSceneState = DEFAULT_STARTUP_SCENE_STATE;
}

const FIXED_EXTERNAL_SIZE = 1;
const FIXED_INTERNAL_SIZE = 0.9;
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
  whaleContactProbes.length = 0;
  activeRipples.length = 0;
  for (let i = 0; i < sprayParticleState.length; i++) sprayParticleState[i].active = false;
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
  mergedGeometry.computeBoundingBox();
  if (mergedGeometry.boundingBox) rebuildWhaleContactProbesFromBox(mergedGeometry.boundingBox);

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
const capsuleField = buildCapsuleField();
const capsuleFloorGroup = new THREE.Group();
group.add(capsuleFloorGroup);
const PARTICLE_GEOMETRIES = {
  pill: new THREE.CapsuleGeometry(0.08, 0.3, 6, 10),
  sphere: new THREE.SphereGeometry(0.13, 14, 10),
  cube: new THREE.BoxGeometry(0.22, 0.22, 0.22),
  "square-edge": new THREE.BoxGeometry(0.18, 0.42, 0.18)
};
const capsuleMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#e5f2ff"),
  emissive: new THREE.Color("#82cfff"),
  emissiveIntensity: 0.14,
  roughness: 0.22,
  metalness: 0.05,
  clearcoat: 0.6,
  clearcoatRoughness: 0.2
});
const capsules = new THREE.InstancedMesh(PARTICLE_GEOMETRIES.pill, capsuleMaterial, CAPSULE_COUNT);
capsules.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
capsuleFloorGroup.add(capsules);
const capsuleDummy = new THREE.Object3D();
const capsuleSmoothX = new Float32Array(CAPSULE_COUNT);
const capsuleSmoothY = new Float32Array(CAPSULE_COUNT);
const capsuleSmoothZ = new Float32Array(CAPSULE_COUNT);
const capsuleFallVelocityY = new Float32Array(CAPSULE_COUNT);
let capsuleSmoothReady = false;
const whaleSurfaceLocal = new THREE.Vector3();
const sprayGeometry = new THREE.IcosahedronGeometry(0.08, 1);
const sprayMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#e9f6ff"),
  emissive: new THREE.Color("#9bd7ff"),
  emissiveIntensity: 0.22,
  roughness: 0.2,
  metalness: 0.0,
  clearcoat: 0.34,
  transparent: true,
  opacity: 0.96
});
const sprayParticles = new THREE.InstancedMesh(sprayGeometry, sprayMaterial, SPRAY_PARTICLE_COUNT);
sprayParticles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
sprayParticles.count = SPRAY_PARTICLE_COUNT;
group.add(sprayParticles);
const sprayParticleState = Array.from({ length: SPRAY_PARTICLE_COUNT }, () => ({
  active: false,
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  initialVelocityY: 0,
  life: 0,
  maxLife: 1,
  scale: 0.1,
  spin: Math.random() * Math.PI * 2,
  spinSpeed: (Math.random() * 2 - 1) * 6
}));
let nextSprayParticleIndex = 0;
const sprayDummy = new THREE.Object3D();
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
const rotationTestLabel = null;
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
let importedSurfaceBaseOpacity = importedSurfaceMaterial.opacity;
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
  creatureType: creatureSelectInput?.value || "whale",
  movementProfile: movementProfileInput?.value || "linked",
  nucleusCornerRadius: Number(nucleusCornerRadiusInput?.value ?? 0.12),
  nucleusYOffset: Number(nucleusYOffsetInput?.value ?? 0),
  whaleScale: Number(whaleScaleInput?.value ?? 1),
  whaleStartX: Number(whaleStartXInput?.value ?? 0),
  whaleStartY: Number(whaleStartYInput?.value ?? -11),
  whaleStartZ: Number(whaleStartZInput?.value ?? 0),
  whaleRotationX: Number(whaleRotationXInput?.value ?? 0),
  whaleRotationY: Number(whaleRotationYInput?.value ?? 0),
  whaleRotationZ: Number(whaleRotationZInput?.value ?? 0),
  sceneBackgroundColor: sceneBackgroundColorInput?.value || "#101824",
  particleReturnSpeed: Number(particleReturnSpeedInput?.value ?? 0.65),
  particleFallStrength: Number(particleFallStrengthInput?.value ?? 1.15),
  particleSprayGravity: Number(particleSprayGravityInput?.value ?? 24),
  particleSprayHeight: Number(particleSprayHeightInput?.value ?? 1.15),
  particlePierceReach: Number(particlePierceReachInput?.value ?? 1.25),
  particleCoreTightness: Number(particleCoreTightnessInput?.value ?? 1.2),
  particleColor: particleColorInput?.value || "#e5f2ff",
  particleShape: particleShapeInput?.value || "pill",
  particleThickness: Number(particleThicknessInput?.value ?? 1),
  waveAmplitude: Number(waveAmplitudeInput?.value ?? 1),
  waveSpeed: Number(waveSpeedInput?.value ?? 1),
  waveAggression: Number(waveAggressionInput?.value ?? 1),
  pierceRippleLead: Number(pierceRippleLeadInput?.value ?? 0.18),
  pierceRippleStrength: Number(pierceRippleStrengthInput?.value ?? 1),
  pierceRippleWidth: Number(pierceRippleWidthInput?.value ?? 1),
  pierceRippleSpeed: Number(pierceRippleSpeedInput?.value ?? 1),
  pierceStart: Number(pierceStartInput?.value ?? WHALE_PRECONTACT_MARGIN),
  tipBias: Number(tipBiasInput?.value ?? 1.4),
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
  importSurfaceGroup.position.y = materialControls.nucleusYOffset + (materialControls.whaleStartY ?? -11);
  capsuleFloorGroup.position.y = materialControls.nucleusYOffset;
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
  importSurfaceGroup.position.y = y + (materialControls.whaleStartY ?? -11);
  capsuleFloorGroup.position.y = y;
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

function getCreatureType(value) {
  return value === "dolphin" ? "dolphin" : "whale";
}

function getCreatureAsset(creatureType) {
  return CREATURE_ASSETS[getCreatureType(creatureType)] || CREATURE_ASSETS.whale;
}

function getResolvedMovementProfileKey() {
  const selected = materialControls.movementProfile || "linked";
  if (selected === "linked") {
    return getCreatureType(materialControls.creatureType) === "dolphin"
      ? "dolphin-arc"
      : "whale-breach";
  }
  return MOVEMENT_PROFILES[selected] ? selected : "whale-breach";
}

function getActiveMovementProfile() {
  const key = getResolvedMovementProfileKey();
  return MOVEMENT_PROFILES[key] || MOVEMENT_PROFILES["whale-breach"];
}

let creatureLoadToken = 0;
async function loadCreatureMesh(creatureType, statusPrefix) {
  const normalized = getCreatureType(creatureType);
  const asset = getCreatureAsset(normalized);
  const token = ++creatureLoadToken;
  const loaded = await loadCustomMeshFromUrl(
    asset.url,
    asset.filename,
    statusPrefix || `${asset.label} loaded`
  );
  if (token !== creatureLoadToken) return false;
  if (!loaded) return false;
  materialControls.creatureType = normalized;
  if (normalized === "dolphin") {
    const minScale = Number(whaleScaleInput?.min ?? 0.35);
    materialControls.whaleScale = minScale;
    setControlValue(whaleScaleInput, minScale);
  }
  if (creatureSelectInput && creatureSelectInput.value !== normalized) {
    creatureSelectInput.value = normalized;
  }
  return true;
}

function applyMaterialControls() {
  const sphereShadowsEnabled = sphereShadowsInput?.checked ?? true;
  const shadowContrast = THREE.MathUtils.clamp(materialControls.shadowContrast ?? 1, 0, 2.5);
  scene.background = new THREE.Color(materialControls.sceneBackgroundColor || "#101824");
  renderer.setClearColor(materialControls.sceneBackgroundColor || "#101824", 1);
  const particleColor = new THREE.Color(materialControls.particleColor || "#e5f2ff");
  const particleShape = materialControls.particleShape || "pill";
  const particleEmissive = particleColor.clone().lerp(new THREE.Color("#82cfff"), 0.38);
  const targetParticleGeometry = PARTICLE_GEOMETRIES[particleShape] || PARTICLE_GEOMETRIES.pill;
  if (capsules.geometry !== targetParticleGeometry) capsules.geometry = targetParticleGeometry;
  capsuleMaterial.color.copy(particleColor);
  capsuleMaterial.emissive.copy(particleEmissive);
  sprayMaterial.color.copy(particleColor).lerp(new THREE.Color("#ffffff"), 0.16);
  sprayMaterial.emissive.copy(particleEmissive);
  capsuleMaterial.needsUpdate = true;
  sprayMaterial.needsUpdate = true;
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
  importedSurfaceBaseOpacity = importedOpacity;
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
creatureSelectInput?.addEventListener("change", async (e) => {
  const requestedType = getCreatureType(e.target.value);
  materialControls.creatureType = requestedType;
  const loaded = await loadCreatureMesh(requestedType, `${getCreatureAsset(requestedType).label} loaded`);
  if (loaded) {
    setStatus(
      materialControls.movementProfile === "linked"
        ? `${getCreatureAsset(requestedType).label} loaded (${getActiveMovementProfile().label} motion).`
        : `${getCreatureAsset(requestedType).label} loaded.`
    );
  } else {
    setStatus(`Could not load ${requestedType} mesh.`, true);
  }
});
movementProfileInput?.addEventListener("change", (e) => {
  materialControls.movementProfile = e.target.value || "linked";
  setStatus(`Movement profile: ${getActiveMovementProfile().label}`);
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
  importSurfaceGroup.position.y = materialControls.nucleusYOffset + (materialControls.whaleStartY ?? -11);
  capsuleFloorGroup.position.y = materialControls.nucleusYOffset;
});
whaleScaleInput?.addEventListener("input", (e) => {
  materialControls.whaleScale = Number(e.target.value);
  setStatus(`Animal size: ${materialControls.whaleScale.toFixed(2)}x`);
});
whaleStartXInput?.addEventListener("input", (e) => {
  materialControls.whaleStartX = Number(e.target.value);
});
whaleStartYInput?.addEventListener("input", (e) => {
  materialControls.whaleStartY = Number(e.target.value);
  importSurfaceGroup.position.y = (materialControls.nucleusYOffset ?? 0) + materialControls.whaleStartY;
});
whaleStartZInput?.addEventListener("input", (e) => {
  materialControls.whaleStartZ = Number(e.target.value);
});
whaleRotationXInput?.addEventListener("input", (e) => {
  materialControls.whaleRotationX = Number(e.target.value);
});
whaleRotationYInput?.addEventListener("input", (e) => {
  materialControls.whaleRotationY = Number(e.target.value);
});
whaleRotationZInput?.addEventListener("input", (e) => {
  materialControls.whaleRotationZ = Number(e.target.value);
});
particleReturnSpeedInput?.addEventListener("input", (e) => {
  materialControls.particleReturnSpeed = Number(e.target.value);
  setStatus(`Particle return speed: ${materialControls.particleReturnSpeed.toFixed(2)}`);
});
particleFallStrengthInput?.addEventListener("input", (e) => {
  materialControls.particleFallStrength = Number(e.target.value);
  setStatus(`Particle fall strength: ${materialControls.particleFallStrength.toFixed(2)}`);
});
particleSprayGravityInput?.addEventListener("input", (e) => {
  materialControls.particleSprayGravity = Number(e.target.value);
  setStatus(`Spray gravity: ${materialControls.particleSprayGravity.toFixed(1)}`);
});
particleSprayHeightInput?.addEventListener("input", (e) => {
  materialControls.particleSprayHeight = Number(e.target.value);
  setStatus(`Spray height: ${materialControls.particleSprayHeight.toFixed(2)}`);
});
particlePierceReachInput?.addEventListener("input", (e) => {
  materialControls.particlePierceReach = Number(e.target.value);
  setStatus(`Pierce reach: ${materialControls.particlePierceReach.toFixed(2)}`);
});
particleCoreTightnessInput?.addEventListener("input", (e) => {
  materialControls.particleCoreTightness = Number(e.target.value);
  setStatus(`Pierce tightness: ${materialControls.particleCoreTightness.toFixed(2)}`);
});
particleColorInput?.addEventListener("input", (e) => {
  materialControls.particleColor = e.target.value;
  applyMaterialControls();
});
particleShapeInput?.addEventListener("input", (e) => {
  materialControls.particleShape = e.target.value;
  setStatus(`Particle shape: ${materialControls.particleShape}`);
  applyMaterialControls();
});
sceneBackgroundColorInput?.addEventListener("input", (e) => {
  materialControls.sceneBackgroundColor = e.target.value;
  setStatus(`Scene background: ${materialControls.sceneBackgroundColor}`);
  applyMaterialControls();
});
particleThicknessInput?.addEventListener("input", (e) => {
  materialControls.particleThickness = Number(e.target.value);
  setStatus(`Particle thickness: ${materialControls.particleThickness.toFixed(2)}`);
});
waveAmplitudeInput?.addEventListener("input", (e) => {
  materialControls.waveAmplitude = Number(e.target.value);
  setStatus(`Wave amplitude: ${materialControls.waveAmplitude.toFixed(2)}`);
});
waveSpeedInput?.addEventListener("input", (e) => {
  materialControls.waveSpeed = Number(e.target.value);
  setStatus(`Wave speed: ${materialControls.waveSpeed.toFixed(2)}`);
});
waveAggressionInput?.addEventListener("input", (e) => {
  materialControls.waveAggression = Number(e.target.value);
  setStatus(`Wave aggression: ${materialControls.waveAggression.toFixed(2)}`);
});
pierceRippleLeadInput?.addEventListener("input", (e) => {
  materialControls.pierceRippleLead = Number(e.target.value);
  setStatus(`Pierce ripple lead: ${materialControls.pierceRippleLead.toFixed(2)}`);
});
pierceRippleStrengthInput?.addEventListener("input", (e) => {
  materialControls.pierceRippleStrength = Number(e.target.value);
  setStatus(`Pierce ripple strength: ${materialControls.pierceRippleStrength.toFixed(2)}`);
});
pierceRippleWidthInput?.addEventListener("input", (e) => {
  materialControls.pierceRippleWidth = Number(e.target.value);
  setStatus(`Pierce ripple width: ${materialControls.pierceRippleWidth.toFixed(2)}`);
});
pierceRippleSpeedInput?.addEventListener("input", (e) => {
  materialControls.pierceRippleSpeed = Number(e.target.value);
  setStatus(`Pierce ripple speed: ${materialControls.pierceRippleSpeed.toFixed(2)}`);
});
pierceStartInput?.addEventListener("input", (e) => {
  materialControls.pierceStart = Number(e.target.value);
  setStatus(`Pierce start: ${materialControls.pierceStart.toFixed(2)}`);
});
tipBiasInput?.addEventListener("input", (e) => {
  materialControls.tipBias = Number(e.target.value);
  setStatus(`Tip bias: ${materialControls.tipBias.toFixed(2)}`);
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
      creatureType: getCreatureType(materialControls.creatureType),
      movementProfile: materialControls.movementProfile || "linked",
      nucleusYOffset: round4(materialControls.nucleusYOffset),
      whaleScale: round4(materialControls.whaleScale ?? 1),
      whaleStartX: round4(materialControls.whaleStartX ?? 0),
      whaleStartY: round4(materialControls.whaleStartY ?? -11),
      whaleStartZ: round4(materialControls.whaleStartZ ?? 0),
      whaleRotationX: round4(materialControls.whaleRotationX ?? 0),
      whaleRotationY: round4(materialControls.whaleRotationY ?? 0),
      whaleRotationZ: round4(materialControls.whaleRotationZ ?? 0),
      sceneBackgroundColor: materialControls.sceneBackgroundColor || "#101824",
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
      particleReturnSpeed: round4(materialControls.particleReturnSpeed ?? 0.65),
      particleFallStrength: round4(materialControls.particleFallStrength ?? 1.15),
      particleSprayGravity: round4(materialControls.particleSprayGravity ?? 24),
      particleSprayHeight: round4(materialControls.particleSprayHeight ?? 1.15),
      particlePierceReach: round4(materialControls.particlePierceReach ?? 1.25),
      particleCoreTightness: round4(materialControls.particleCoreTightness ?? 1.2),
      particleColor: materialControls.particleColor || "#e5f2ff",
      particleShape: materialControls.particleShape || "pill",
      particleThickness: round4(materialControls.particleThickness ?? 1),
      waveAmplitude: round4(materialControls.waveAmplitude ?? 1),
      waveSpeed: round4(materialControls.waveSpeed ?? 1),
      waveAggression: round4(materialControls.waveAggression ?? 1),
      pierceRippleLead: round4(materialControls.pierceRippleLead ?? 0.18),
      pierceRippleStrength: round4(materialControls.pierceRippleStrength ?? 1),
      pierceRippleWidth: round4(materialControls.pierceRippleWidth ?? 1),
      pierceRippleSpeed: round4(materialControls.pierceRippleSpeed ?? 1),
      pierceStart: round4(materialControls.pierceStart ?? WHALE_PRECONTACT_MARGIN),
      tipBias: round4(materialControls.tipBias ?? 1.4),
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
    }
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
    <button id="exportConfigBtn" type="button">Export Config</button>
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
    <label for="whaleScale">Animal Size</label>
    <input id="whaleScale" type="range" min="0.35" max="2.8" step="0.01" value="1" />
    <label for="whaleStartX">Animal Start X</label>
    <input id="whaleStartX" type="range" min="-6" max="6" step="0.01" value="0" />
    <label for="whaleStartY">Animal Start Y</label>
    <input id="whaleStartY" type="range" min="-16" max="2" step="0.01" value="-11" />
    <label for="whaleStartZ">Animal Start Z</label>
    <input id="whaleStartZ" type="range" min="-6" max="6" step="0.01" value="0" />
    <label for="whaleRotationX">Animal Rotation X</label>
    <input id="whaleRotationX" type="range" min="-180" max="180" step="1" value="-57" />
    <label for="whaleRotationY">Animal Rotation Y</label>
    <input id="whaleRotationY" type="range" min="-180" max="180" step="1" value="0" />
    <label for="whaleRotationZ">Animal Rotation Z</label>
    <input id="whaleRotationZ" type="range" min="-180" max="180" step="1" value="0" />
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

function exportConfigJson() {
  const payload = buildStartupConfig();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadTextFile(`whale-scene-config-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");
  setStatus("Exported config JSON.");
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
exportConfigBtn?.addEventListener("click", exportConfigJson);
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
const whalePrevSurfaceLocal = new THREE.Vector3();
const whaleVelocityLocal = new THREE.Vector3();
const whaleForwardLocal = new THREE.Vector3(1, 0, 0);
const whaleRightLocal = new THREE.Vector3(0, 0, 1);
const whaleFlowLocal = new THREE.Vector3(1, 0, 0);
const whaleContactProbes = [];
const activeRipples = [];
let landingScatterCycle = -1;
let activePierceCycle = -1;
const landingScatter = [];

function refreshLandingScatter() {
  landingScatter.length = 0;
  for (let i = 0; i < LANDING_SCATTER_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const orbit = 0.2 + Math.random() * 1.6;
    landingScatter.push({
      ox: Math.cos(angle) * orbit,
      oz: Math.sin(angle) * orbit,
      radius: 0.45 + Math.random() * 1.2,
      strength: 0.4 + Math.random() * 0.8,
      swirl: Math.random() * Math.PI * 2
    });
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
  const movementProfile = getActiveMovementProfile();
  const breachCycleSeconds = Math.max(0.1, movementProfile.cycleSeconds || 6.2);
  updateActiveRipples(elapsed);
  const breachCycle = Math.floor(elapsed / breachCycleSeconds);
  if (breachCycle !== landingScatterCycle) {
    landingScatterCycle = breachCycle;
    refreshLandingScatter();
  }
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
  const ascentSplit = THREE.MathUtils.clamp(movementProfile.ascentSplit ?? 0.52, 0.2, 0.8);
  const descentSpan = Math.max(0.0001, 1 - ascentSplit);
  const breachPhase = (elapsed % breachCycleSeconds) / breachCycleSeconds;
  const ascentPhase = Math.pow(
    THREE.MathUtils.clamp(breachPhase / ascentSplit, 0, 1),
    Math.max(0.2, movementProfile.ascentPow ?? 0.72)
  );
  const descentPhase = Math.pow(
    THREE.MathUtils.clamp((breachPhase - ascentSplit) / descentSpan, 0, 1),
    Math.max(0.2, movementProfile.descentPow ?? 1.28)
  );
  const breachPulse = breachPhase <= ascentSplit
    ? Math.sin(ascentPhase * Math.PI * 0.5)
    : Math.cos(descentPhase * Math.PI * 0.5);
  const breachForce = Math.pow(breachPulse, Math.max(0.4, movementProfile.forcePow ?? 1.35));
  const whaleStartY = materialControls.whaleStartY ?? -11;
  const surfaceY = (materialControls.nucleusYOffset ?? 0) - 0.25;
  const breachHeight =
    (movementProfile.breachHeight ?? 4.7) +
    Math.max(0, surfaceY - whaleStartY) +
    (movementProfile.surfaceClearance ?? 1.15) +
    (movementProfile.ascentBoost ?? 1.35);
  let breachLift = whaleStartY + breachPulse * breachHeight;
  const reentryDepthMix = THREE.MathUtils.smoothstep(
    breachPhase,
    THREE.MathUtils.clamp(movementProfile.reentryStart ?? 0.72, 0, 1),
    THREE.MathUtils.clamp(movementProfile.reentryEnd ?? 0.98, 0, 1)
  );
  const minLandingY = surfaceY - Math.max(0.1, movementProfile.reentryMaxDepth ?? 1.2);
  breachLift = Math.max(breachLift, THREE.MathUtils.lerp(whaleStartY, minLandingY, reentryDepthMix));
  const whaleRotX = THREE.MathUtils.degToRad(materialControls.whaleRotationX ?? 0);
  const whaleRotY = THREE.MathUtils.degToRad(materialControls.whaleRotationY ?? 0);
  const whaleRotZ = THREE.MathUtils.degToRad(materialControls.whaleRotationZ ?? 0);
  const whaleScale = THREE.MathUtils.clamp(materialControls.whaleScale ?? 1, 0.2, 4.0);
  const descentMix = THREE.MathUtils.smoothstep(
    breachPhase,
    THREE.MathUtils.clamp(movementProfile.descentStart ?? 0.38, 0, 1),
    THREE.MathUtils.clamp(movementProfile.descentEnd ?? 0.8, 0, 1)
  );
  const waveAmplitude = Math.max(0, materialControls.waveAmplitude ?? 1);
  const waveSpeed = Math.max(0.1, materialControls.waveSpeed ?? 1);
  const waveAggression = Math.max(0, materialControls.waveAggression ?? 1);
  const surfaceInfluence = THREE.MathUtils.smoothstep(
    (materialControls.nucleusYOffset ?? 0) + breachLift,
    surfaceY - 1.8,
    surfaceY + 0.45
  );
  const landingBurst = 0;
  const descentTargetRotX = THREE.MathUtils.degToRad(movementProfile.descentRotXDeg ?? DESCENT_TARGET_ROT_X_DEG);
  const descentTargetRotY = THREE.MathUtils.degToRad(movementProfile.descentRotYDeg ?? DESCENT_TARGET_ROT_Y_DEG);
  const descentTargetRotZ = THREE.MathUtils.degToRad(movementProfile.descentRotZDeg ?? DESCENT_TARGET_ROT_Z_DEG);
  const animatedWhaleRotX = THREE.MathUtils.lerp(whaleRotX, descentTargetRotX, descentMix);
  const animatedWhaleRotY = THREE.MathUtils.lerp(whaleRotY, descentTargetRotY, descentMix);
  const animatedWhaleRotZ = THREE.MathUtils.lerp(whaleRotZ, descentTargetRotZ, descentMix);
  const animatedWhaleScale = THREE.MathUtils.lerp(
    whaleScale,
    THREE.MathUtils.clamp(movementProfile.descentTargetScale ?? DESCENT_TARGET_SCALE, 0.2, 2.6),
    descentMix
  );
  const arcDistance = Math.max(0, movementProfile.arcDistance ?? 0);
  const arcTravelStart = THREE.MathUtils.clamp(movementProfile.arcTravelStart ?? 0.12, 0, 0.95);
  const arcTravelEnd = THREE.MathUtils.clamp(movementProfile.arcTravelEnd ?? 0.88, arcTravelStart + 0.01, 1);
  const arcProgress = THREE.MathUtils.smoothstep(breachPhase, arcTravelStart, arcTravelEnd);
  const arcForwardSign = movementProfile.arcForwardSign ?? 1;
  const arcLateralAmount = movementProfile.arcLateralAmount ?? 0.24;
  const baseForwardX = Math.cos(whaleRotY);
  const baseForwardZ = Math.sin(whaleRotY);
  const baseRightX = -baseForwardZ;
  const baseRightZ = baseForwardX;
  const arcForwardDistance = arcDistance * arcProgress * arcForwardSign;
  const arcLateralDistance = arcDistance * arcLateralAmount * Math.sin(breachPhase * Math.PI * 2);
  const arcOffsetX = baseForwardX * arcForwardDistance + baseRightX * arcLateralDistance;
  const arcOffsetZ = baseForwardZ * arcForwardDistance + baseRightZ * arcLateralDistance;
  const gracefulFallMix = THREE.MathUtils.smoothstep(breachPhase, 0.42, 0.82);
  const endCalmMix = THREE.MathUtils.smoothstep(breachPhase, 0.78, 0.98);
  updateSprayParticles(dt, materialControls.nucleusYOffset ?? 0);
  importSurfaceGroup.position.set(
    (materialControls.whaleStartX ?? 0) + arcOffsetX,
    (materialControls.nucleusYOffset ?? 0) + breachLift,
    (materialControls.whaleStartZ ?? 0) + arcOffsetZ
  );
  importSurfaceGroup.rotation.set(animatedWhaleRotX, animatedWhaleRotY, animatedWhaleRotZ);
  importSurfaceGroup.scale.setScalar(animatedWhaleScale);
  whaleVelocityLocal.copy(importSurfaceGroup.position).sub(whalePrevSurfaceLocal);
  if (dt > 0.000001) whaleVelocityLocal.multiplyScalar(1 / dt);
  const whaleSpeed = whaleVelocityLocal.length();
  const descendingSpeed = Math.max(0, -whaleVelocityLocal.y);
  const landingImpact = THREE.MathUtils.clamp(descendingSpeed * 0.34, 0, 2.2) * landingBurst;
  if (whaleSpeed > 0.0001) {
    whaleFlowLocal.copy(whaleVelocityLocal).multiplyScalar(1 / whaleSpeed);
  } else {
    whaleFlowLocal.set(Math.cos(whaleRotY), 0, Math.sin(whaleRotY));
  }
  whaleForwardLocal.set(1, 0, 0).applyEuler(importSurfaceGroup.rotation).setY(0);
  if (whaleForwardLocal.lengthSq() < 0.0001) whaleForwardLocal.copy(whaleFlowLocal);
  else whaleForwardLocal.normalize();
  whaleRightLocal.set(-whaleForwardLocal.z, 0, whaleForwardLocal.x);
  if (importedOrbStyleActive && importSurfaceGroup.visible && importSurfaceGroup.children.length) {
    importSurfaceGroup.traverse((child) => {
      if (!child.isMesh || !child.geometry?.userData?.basePositions) return;
      applyLiquidOrbDeform(child, elapsed);
    });
  }
  updateWhaleWaterContactRipples(
    surfaceY,
    dt,
    elapsed,
    landingImpact,
    breachPhase,
    breachCycle,
    movementProfile.piercePhaseEnd
  );
  if (breachPhase > 0.5 && activeRipples.length) activeRipples.length = 0;
  whaleSurfaceLocal.copy(importSurfaceGroup.position);
  const whaleDepthBelowSurface = Math.max(0, surfaceY - whaleSurfaceLocal.y);
  const nearSurfaceMix = 1 - THREE.MathUtils.smoothstep(whaleDepthBelowSurface, 0.08, 1.45);
  const underSurfaceRelease = 1 - THREE.MathUtils.smoothstep(whaleDepthBelowSurface, 0.24, 1.55);
  const whaleRespawnHidden = breachPhase > 0.82 && whaleDepthBelowSurface > 1.2;
  importSurfaceGroup.visible = importedSurfaceVisible && !whaleRespawnHidden && importSurfaceGroup.children.length > 0;
  importedSurfaceMaterial.opacity = importedSurfaceBaseOpacity;
  importedSurfaceMaterial.transparent = importedSurfaceMaterial.opacity < 0.999;
  importedSurfaceMaterial.depthWrite = importedSurfaceMaterial.opacity >= 0.999;
  const particleReturnSpeed = Math.max(0.1, materialControls.particleReturnSpeed ?? 0.65);
  const particleFallStrength = Math.max(0, materialControls.particleFallStrength ?? 1.15);
  const particlePierceReach = Math.max(0.4, materialControls.particlePierceReach ?? 1.25);
  const particleCoreTightness = Math.max(0.4, materialControls.particleCoreTightness ?? 1.2);
  const pierceEnergyMix = 1 - THREE.MathUtils.smoothstep(breachPhase, 0.54, 0.72);
  const rippleAfterMix = 1 - THREE.MathUtils.smoothstep(breachPhase, 0.5, 0.6);
  const landingSoftMix = 1 - THREE.MathUtils.smoothstep(breachPhase, 0.58, 0.86);
  for (let i = 0; i < capsuleField.length; i++) {
    const point = capsuleField[i];
    const swell =
      (
        Math.sin(point.x * 0.58 + elapsed * 1.7 * waveSpeed + point.waveOffset) * 0.22 +
        Math.cos(point.z * 0.46 + elapsed * 1.15 * waveSpeed + point.waveOffset) * 0.18 +
        Math.sin(point.radial * 0.45 - elapsed * 0.9 * waveSpeed) * 0.08
      ) * waveAmplitude;
    const chop =
      (
        Math.sin((point.x + point.z) * 0.24 - elapsed * 2.3 * waveSpeed + point.waveOffset * 0.7) * 0.08 +
        Math.sin(point.x * 0.92 - elapsed * 1.45 * waveSpeed + point.waveOffset * 1.6) * 0.05 +
        Math.cos(point.z * 0.88 + elapsed * 1.2 * waveSpeed - point.waveOffset * 0.9) * 0.04
      ) * waveAmplitude * (0.72 + waveAggression * 0.48);
    const naturalNoise =
      (
        Math.sin(point.x * 0.18 + point.z * 0.11 + point.waveOffset * 0.6) * 0.06 * point.cluster +
        Math.cos(point.z * 0.16 - elapsed * 0.55 * waveSpeed + point.waveOffset) * 0.03
      ) * THREE.MathUtils.lerp(0.65, 1.45, Math.min(1, waveAggression / 3));
    const offsetX = point.x - whaleSurfaceLocal.x;
    const offsetZ = point.z - whaleSurfaceLocal.z;
    const distance = Math.sqrt(offsetX * offsetX + offsetZ * offsetZ);
    const waterBreakForce = breachForce * surfaceInfluence * nearSurfaceMix;
    const pushRadius = (1.9 + waterBreakForce * 4.8) * particlePierceReach;
    const pushEnvelope = Math.max(0, 1 - distance / pushRadius);
    const tightRadius = Math.max(0.35, pushRadius * THREE.MathUtils.lerp(0.92, 0.42, Math.min(1, (particleCoreTightness - 0.4) / 2.1)));
    const tightEnvelope = Math.max(0, 1 - distance / tightRadius);
    const coreBoost = Math.pow(tightEnvelope, THREE.MathUtils.lerp(1.15, 2.2, Math.min(1, (particleCoreTightness - 0.4) / 2.1)));
    const pushStrength =
      Math.pow(pushEnvelope, THREE.MathUtils.lerp(1.2, 2.35, Math.min(1, (particleCoreTightness - 0.4) / 2.1))) *
      waterBreakForce *
      (1 + coreBoost * (0.55 + waveAggression * 0.35));
    const dirX = distance > 0.0001 ? offsetX / distance : Math.cos(point.waveOffset);
    const dirZ = distance > 0.0001 ? offsetZ / distance : Math.sin(point.waveOffset);
    const along = offsetX * whaleForwardLocal.x + offsetZ * whaleForwardLocal.z;
    const across = offsetX * whaleRightLocal.x + offsetZ * whaleRightLocal.z;
    const bodyLength = 2.6 + animatedWhaleScale * 1.8;
    const bodyWidth = 1.1 + animatedWhaleScale * 0.9;
    const avoidCore =
      Math.max(0, 1 - Math.abs(along) / bodyLength) *
      Math.max(0, 1 - Math.abs(across) / bodyWidth);
    const speedBoost = Math.min(2.2, whaleSpeed * 0.18);
    const avoidStrength = whaleDepthBelowSurface > 0.02
      ? 0
      : Math.pow(avoidCore, 1.65) *
        (0.12 + waterBreakForce * 2.3 + speedBoost * 0.05) *
        underSurfaceRelease;
    const awaySign = across >= 0 ? 1 : -1;
    const awayX = whaleRightLocal.x * awaySign * 0.68 + dirX * 0.32;
    const awayZ = whaleRightLocal.z * awaySign * 0.68 + dirZ * 0.32;
    const splashLift =
      pushStrength *
      (0.92 + (1 - Math.abs(breachPhase - 0.55)) * 1.45) *
      pierceEnergyMix *
      landingSoftMix *
      (1 - endCalmMix * 0.55);
    const outward = pushStrength * (0.8 + breachPhase * 2.45) * nearSurfaceMix * pierceEnergyMix * landingSoftMix;
    const wakeRear = Math.max(0, -along);
    const wakeCore =
      Math.max(0, 1 - wakeRear / (5.4 + animatedWhaleScale * 2.1)) *
      Math.max(0, 1 - Math.abs(across) / (2.5 + animatedWhaleScale * 1.3));
    const wakePull = wakeCore * (0.03 + waterBreakForce * 0.18 + speedBoost * 0.012) * nearSurfaceMix * landingSoftMix;
    const wakeSwirl =
      Math.sin(elapsed * 2.1 + along * 0.85 + point.waveOffset) *
      wakeCore *
      (0.02 + waterBreakForce * 0.11) *
      nearSurfaceMix *
      landingSoftMix *
      (1 - endCalmMix * 0.8);
    const tailWake = wakeCore * waterBreakForce * 0.85 * nearSurfaceMix * landingSoftMix * (1 - endCalmMix * 0.7);
    const landingPushX = 0;
    const landingPushZ = 0;
    const landingLift = 0;
    let ripplePushX = 0;
    let ripplePushZ = 0;
    let rippleLift = 0;
    for (let j = 0; j < activeRipples.length; j++) {
      const ripple = activeRipples[j];
      const rippleAge = elapsed - ripple.startTime;
      if (rippleAge < 0 || rippleAge > ripple.life) continue;
      const ageMix = rippleAge / ripple.life;
      const radius = rippleAge * ripple.speed;
      const dx = point.x - ripple.x;
      const dz = point.z - ripple.z;
      const rippleDistance = Math.sqrt(dx * dx + dz * dz);
      const radialX = rippleDistance > 0.0001 ? dx / rippleDistance : Math.cos(point.waveOffset);
      const radialZ = rippleDistance > 0.0001 ? dz / rippleDistance : Math.sin(point.waveOffset);
      const rippleReach = Math.max(ripple.width * 2.6, radius + ripple.width * 4.8);
      const bodyEnvelope = Math.max(0, 1 - rippleDistance / rippleReach);
      if (bodyEnvelope <= 0) continue;
      const envelope =
        Math.pow(bodyEnvelope, 1.45) *
        Math.pow(1 - ageMix, 1.2) *
        rippleAfterMix *
        (1 - endCalmMix * 0.65);
      if (envelope <= 0.0001) continue;
      const innerLift = Math.sin((1 - ageMix) * Math.PI * 0.85) * envelope * ripple.strength * 0.32;
      rippleLift += innerLift;
      const ripplePush = envelope * ripple.strength * ripple.push * 0.9;
      ripplePushX += radialX * ripplePush;
      ripplePushZ += radialZ * ripplePush;
      const sprayEnvelope = Math.max(0, 1 - rippleDistance / (rippleReach * 1.12));
      const sprayPush = Math.pow(sprayEnvelope, 1.4) * ripple.strength * ripple.push * 0.42;
      ripplePushX += radialX * sprayPush;
      ripplePushZ += radialZ * sprayPush;
      rippleLift += sprayEnvelope * ripple.strength * 0.08;
    }
    const targetX =
      point.x +
      Math.sin(elapsed * point.drift + point.z) * 0.05 +
      dirX * outward +
      awayX * avoidStrength +
      whaleFlowLocal.x * wakePull +
      whaleRightLocal.x * wakeSwirl -
      tailWake * 0.05 +
      ripplePushX +
      landingPushX;
    const targetY =
      -1.1 +
      swell +
      chop +
      naturalNoise +
      splashLift * 1.9 +
      tailWake * 0.45 +
      wakeCore * speedBoost * 0.04 +
      rippleLift +
      landingBurst * 0.22 +
      landingLift;
    const baseSurfaceY = -1.1 + swell + chop + naturalNoise;
    const currentLift = Math.max(0, capsuleSmoothReady ? capsuleSmoothY[i] - baseSurfaceY : 0);
    const targetLift = Math.max(0, targetY - baseSurfaceY);
    const settlingActive = gracefulFallMix > 0.001 || whaleDepthBelowSurface > 0.02;
    if (settlingActive && currentLift > 0.001) {
      capsuleFallVelocityY[i] += dt * (0.16 + gracefulFallMix * 0.85 + whaleDepthBelowSurface * 0.22) * particleFallStrength;
      capsuleFallVelocityY[i] *= 1 - Math.min(0.12, dt * 0.9);
    } else {
      capsuleFallVelocityY[i] *= Math.max(0, 1 - dt * 8.0);
    }
    const settleDown =
      currentLift *
      (1 - underSurfaceRelease) *
      (0.045 + endCalmMix * 0.045 + (1 - landingSoftMix) * 0.02) *
      particleFallStrength;
    const descentBleed = THREE.MathUtils.lerp(targetLift, Math.min(targetLift, currentLift), 0.45);
    const gracefulLift = THREE.MathUtils.lerp(
      targetLift,
      descentBleed * (1 - gracefulFallMix) + currentLift * (1 - gracefulFallMix * 0.82),
      gracefulFallMix
    );
    const gracefulFall =
      currentLift *
      gracefulFallMix *
      (0.012 + descendingSpeed * 0.004 + whaleDepthBelowSurface * 0.006) *
      particleFallStrength;
    const gravityFall = capsuleFallVelocityY[i] * Math.min(currentLift, 1.8);
    const settledTargetY = Math.max(
      baseSurfaceY - 0.04,
      baseSurfaceY + Math.max(0, gracefulLift - settleDown - gracefulFall - gravityFall)
    );
    const targetZ =
      point.z +
      Math.cos(elapsed * point.drift + point.x) * 0.05 +
      dirZ * outward +
      awayZ * avoidStrength +
      whaleFlowLocal.z * wakePull +
      whaleRightLocal.z * wakeSwirl +
      ripplePushZ +
      landingPushZ;
    if (!capsuleSmoothReady) {
      capsuleSmoothX[i] = targetX;
      capsuleSmoothY[i] = settledTargetY;
      capsuleSmoothZ[i] = targetZ;
      capsuleFallVelocityY[i] = 0;
    }
    const returnDamp =
      (THREE.MathUtils.lerp(8.0, 15.0, landingBurst) +
      (1 - underSurfaceRelease) * 7.0 +
      gracefulFallMix * 1.35 +
      endCalmMix * 2.5) * particleReturnSpeed;
    const blend = 1 - Math.exp(-dt * returnDamp);
    capsuleSmoothX[i] += (targetX - capsuleSmoothX[i]) * blend;
    capsuleSmoothY[i] += (settledTargetY - capsuleSmoothY[i]) * blend;
    capsuleSmoothZ[i] += (targetZ - capsuleSmoothZ[i]) * blend;
    if (capsuleSmoothY[i] <= baseSurfaceY + 0.01) capsuleFallVelocityY[i] = 0;
    capsuleDummy.position.set(capsuleSmoothX[i], capsuleSmoothY[i], capsuleSmoothZ[i]);
    capsuleDummy.rotation.set(
      Math.PI * 0.5 + Math.sin(elapsed * 0.8 + point.waveOffset) * 0.12 + splashLift * 0.42 + rippleLift * 0.14,
      Math.PI * 0.25 + point.waveOffset * 0.35 + Math.sin(elapsed * 0.18 + point.x * 0.08) * 0.16 + pushStrength * 0.85 + ripplePushX * 0.08,
      Math.PI * 0.18 + Math.cos(elapsed * 0.95 + point.waveOffset) * 0.1 + dirZ * pushStrength * 0.32 + ripplePushZ * 0.08
    );
    const thicknessScale = Math.max(0.4, materialControls.particleThickness ?? 1);
    const scale =
      0.56 +
      point.scale * 0.2 +
      point.cluster * 0.08 +
      Math.max(swell + chop + naturalNoise, -0.08) * 0.16 +
      splashLift * 0.14 +
      Math.abs(rippleLift) * 0.06;
    capsuleDummy.scale.set(scale * thicknessScale, scale, scale * thicknessScale);
    capsuleDummy.updateMatrix();
    capsules.setMatrixAt(i, capsuleDummy.matrix);
  }
  if (!capsuleSmoothReady) capsuleSmoothReady = true;
  capsules.instanceMatrix.needsUpdate = true;
  whalePrevSurfaceLocal.copy(importSurfaceGroup.position);

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
  group.rotation.set(0, 0, 0);
  forceApplyNucleusYOffset();
  controls.update();
}

applyMaterialControls();
updateNucleusControlSections(materialControls.nucleusShape);

async function bootScene() {
  const startupEnvUrl = EMBED_STARTUP_ENV_URL || DEFAULT_REFLECTION_IMAGE_URL;
  const startupCreature = getCreatureType(creatureSelectInput?.value || materialControls.creatureType || "whale");
  const startupCreatureAsset = getCreatureAsset(startupCreature);
  const startupMeshUrl = EMBED_STARTUP_MESH_URL || startupCreatureAsset.url;
  const startupMeshFilename = EMBED_STARTUP_MESH_URL ? DEFAULT_STARTUP_MESH_FILENAME : startupCreatureAsset.filename;
  let startupReflectionLoaded = await loadReflectionImageEnvFromUrl(startupEnvUrl, "Startup reflection");
  if (!startupReflectionLoaded) {
    startupReflectionLoaded = await loadReflectionImageEnvFromUrl("./citrus_orchard_road_puresky_1k.exr", "Startup reflection");
  }
  let startupMeshLoaded = await loadCustomMeshFromUrl(
    startupMeshUrl,
    startupMeshFilename,
    "Startup mesh loaded"
  );
  if (!startupMeshLoaded) {
    startupMeshLoaded = await loadCustomMeshFromUrl("./whale.glb", DEFAULT_STARTUP_MESH_FILENAME, "Startup mesh loaded");
  }
  if (!startupMeshLoaded && startupCreature === "dolphin") {
    startupMeshLoaded = await loadCustomMeshFromUrl("./dolphin.glb", DEFAULT_DOLPHIN_MESH_FILENAME, "Startup mesh loaded");
  }
  if (!startupMeshLoaded && shapeSelect.value === "custom-mesh") {
    shapeSelect.value = "sphere";
  } else if (startupMeshLoaded) {
    materialControls.creatureType = startupCreature;
    if (startupCreature === "dolphin") {
      const minScale = Number(whaleScaleInput?.min ?? 0.35);
      materialControls.whaleScale = minScale;
      setControlValue(whaleScaleInput, minScale);
    }
    if (creatureSelectInput) creatureSelectInput.value = startupCreature;
  }
  applyPresetFromSelect();
  forceApplyNucleusYOffset();
  applyLoadedStartupSceneState();
  forceApplyNucleusYOffset();
  if (startupReflectionLoaded && startupMeshLoaded) {
    setStatus(`Startup assets loaded (EXR + ${getCreatureAsset(materialControls.creatureType).label.toLowerCase()}), scene state restored.`);
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
