function el(id) {
  return document.getElementById(id);
}

export const refs = {
  container: el("app"),
  shapeSelect: el("shapeSelect"),
  imageInput: el("imageInput"),
  meshInput: el("meshInput"),
  reflectionImageBtn: el("reflectionImageBtn"),
  reflectionImageInput: el("reflectionImageInput"),
  shapeScaleInput: el("shapeScale"),
  collisionEnabledInput: el("collisionEnabled"),
  travelSpeedInput: el("travelSpeed"),
  creatureSelectInput: el("creatureSelect"),
  movementProfileInput: el("movementProfile"),
  showImportedSurfaceInput: el("showImportedSurface"),
  whaleScaleInput: el("whaleScale"),
  whaleStartXInput: el("whaleStartX"),
  whaleStartYInput: el("whaleStartY"),
  whaleStartZInput: el("whaleStartZ"),
  whaleRotationXInput: el("whaleRotationX"),
  whaleRotationYInput: el("whaleRotationY"),
  whaleRotationZInput: el("whaleRotationZ"),
  sceneBackgroundColorInput: el("sceneBackgroundColor"),
  particleReturnSpeedInput: el("particleReturnSpeed"),
  particleFallStrengthInput: el("particleFallStrength"),
  particleSprayGravityInput: el("particleSprayGravity"),
  particleSprayHeightInput: el("particleSprayHeight"),
  particlePierceReachInput: el("particlePierceReach"),
  particleCoreTightnessInput: el("particleCoreTightness"),
  particleColorInput: el("particleColor"),
  particleShapeInput: el("particleShape"),
  particleThicknessInput: el("particleThickness"),
  waveAmplitudeInput: el("waveAmplitude"),
  waveSpeedInput: el("waveSpeed"),
  waveAggressionInput: el("waveAggression"),
  pierceRippleLeadInput: el("pierceRippleLead"),
  pierceRippleStrengthInput: el("pierceRippleStrength"),
  pierceRippleWidthInput: el("pierceRippleWidth"),
  pierceRippleSpeedInput: el("pierceRippleSpeed"),
  pierceStartInput: el("pierceStart"),
  tipBiasInput: el("tipBias"),
  sphereColorInput: el("sphereColor"),
  internalColorInput: el("internalColor"),
  nucleusCornerRadiusInput: el("nucleusCornerRadius"),
  nucleusYOffsetInput: el("nucleusYOffset"),
  lightDistanceInput: el("lightDistance"),
  nucleusColorInput: el("nucleusColor"),
  nucleusOpacityInput: el("nucleusOpacity"),
  nucleusGlareInput: el("nucleusGlare"),
  nucleusMatteInput: el("nucleusMatte"),
  nucleusGlowInput: el("nucleusGlow"),
  nucleusTransmissionInput: el("nucleusTransmission"),
  nucleusThicknessInput: el("nucleusThickness"),
  nucleusAttenuationColorInput: el("nucleusAttenuationColor"),
  nucleusAttenuationDistanceInput: el("nucleusAttenuationDistance"),
  nucleusSpecularInput: el("nucleusSpecular"),
  nucleusSpecularColorInput: el("nucleusSpecularColor"),
  nucleusClearcoatInput: el("nucleusClearcoat"),
  nucleusClearcoatRoughnessInput: el("nucleusClearcoatRoughness"),
  nucleusIridescenceInput: el("nucleusIridescence"),
  nucleusIorInput: el("nucleusIor"),
  nucleusEnvIntensityInput: el("nucleusEnvIntensity"),
  nucleusReflectTintInput: el("nucleusReflectTint"),
  nucleusReflectTintMixInput: el("nucleusReflectTintMix"),
  surfaceChromaInput: el("surfaceChroma"),
  reflectionStrengthInput: el("reflectionStrength"),
  nucleusRimStrengthInput: el("nucleusRimStrength"),
  nucleusRimPowerInput: el("nucleusRimPower"),
  nucleusRimColorInput: el("nucleusRimColor"),
  nucleusNoiseAmountInput: el("nucleusNoiseAmount"),
  nucleusNoiseScaleInput: el("nucleusNoiseScale"),
  nucleusShellModeInput: el("nucleusShellMode"),
  nucleusShellColorInput: el("nucleusShellColor"),
  nucleusShellThicknessInput: el("nucleusShellThickness"),
  nucleusShellLayersInput: el("nucleusShellLayers"),
  nucleusPulseAmountInput: el("nucleusPulseAmount"),
  nucleusPulseSpeedInput: el("nucleusPulseSpeed"),
  nucleusDistortionAmountInput: el("nucleusDistortionAmount"),
  nucleusDistortionSpeedInput: el("nucleusDistortionSpeed"),
  nucleusBlobAmountInput: el("nucleusBlobAmount"),
  nucleusBlobScaleInput: el("nucleusBlobScale"),
  nucleusBlobSpeedInput: el("nucleusBlobSpeed"),
  nucleusGradientTopInput: el("nucleusGradientTop"),
  nucleusGradientBottomInput: el("nucleusGradientBottom"),
  nucleusGradientMixInput: el("nucleusGradientMix"),
  nucleusSpinXInput: el("nucleusSpinX"),
  nucleusSpinYInput: el("nucleusSpinY"),
  nucleusSpinZInput: el("nucleusSpinZ"),
  nucleusBloomEnabledInput: el("nucleusBloomEnabled"),
  nucleusBloomStrengthInput: el("nucleusBloomStrength"),
  nucleusBloomRadiusInput: el("nucleusBloomRadius"),
  nucleusBloomThresholdInput: el("nucleusBloomThreshold"),
  internalDetailShadingInput: el("internalDetailShading"),
  particleLightingInput: el("particleLighting"),
  sphereShadowsInput: el("sphereShadows"),
  shadowContrastInput: el("shadowContrast"),
  sphereOpacityInput: el("sphereOpacity"),
  sphereGlareInput: el("sphereGlare"),
  sphereMatteInput: el("sphereMatte"),
  internalMatteInput: el("internalMatte"),
  sphereGlowInput: el("sphereGlow"),
  exportDataBtn: el("exportDataBtn"),
  exportConfigBtn: el("exportConfigBtn"),
  exportWebflowBtn: el("exportWebflowBtn"),
  saveStartupBtn: el("saveStartupBtn"),
  clearStartupBtn: el("clearStartupBtn"),
  statusLine: el("statusLine")
};

export const customImageOption = refs.shapeSelect?.querySelector('option[value="custom-image"]');
export const customMeshOption = refs.shapeSelect?.querySelector('option[value="custom-mesh"]');

export function setStatus(message, isError = false) {
  refs.statusLine.textContent = message;
  refs.statusLine.classList.toggle("error", isError);
}

function matchesShapeScope(scope, shape) {
  if (!scope || scope === "all") return true;
  if (scope === "round") return shape !== "cube";
  if (scope === "orb") return shape === "crystal-orb" || shape === "liquid-core";
  return scope.split(/\s+/).includes(shape);
}

export function updateNucleusControlSections(shape) {
  const currentShape = shape || "sphere";
  const nodes = document.querySelectorAll("[data-shape-controls]");
  for (const node of nodes) {
    const visible = matchesShapeScope(node.dataset.shapeControls, currentShape);
    node.classList.toggle("control-hidden", !visible);
  }
}
