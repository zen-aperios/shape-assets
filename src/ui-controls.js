function el(id) {
  return document.getElementById(id);
}

export const refs = {
  container: el("app"),
  shapeSelect: el("shapeSelect"),
  imageInput: el("imageInput"),
  meshInput: el("meshInput"),
  externalCountInput: el("externalCount"),
  internalCountInput: el("internalCount"),
  shapeScaleInput: el("shapeScale"),
  surfaceExternalOnlyInput: el("surfaceExternalOnly"),
  faceMinTravelInput: el("faceMinTravel"),
  movementModeInput: el("movementMode"),
  internalMovementInput: el("internalMovement"),
  gridEnabledInput: el("gridEnabled"),
  collisionEnabledInput: el("collisionEnabled"),
  travelSpeedInput: el("travelSpeed"),
  turbulenceInput: el("turbulence"),
  turbulenceRippleInput: el("turbulenceRipple"),
  rippleCountInput: el("rippleCount"),
  rippleSizeInput: el("rippleSize"),
  tornadoBatchRingsInput: el("tornadoBatchRings"),
  tornadoBatchOffsetInput: el("tornadoBatchOffset"),
  tornadoSkewInput: el("tornadoSkew"),
  tornadoImperfectionInput: el("tornadoImperfection"),
  externalSizeInput: el("externalSize"),
  internalSpeedInput: el("internalSpeed"),
  internalSizeInput: el("internalSize"),
  innerWarpInput: el("innerWarp"),
  sphereGapInput: el("sphereGap"),
  cursorSizeInput: el("cursorSize"),
  cursorForceInput: el("cursorForce"),
  cursorLinkDistanceInput: el("cursorLinkDistance"),
  cursorLineColorInput: el("cursorLineColor"),
  gridColorInput: el("gridColor"),
  showParticlesInput: el("showParticles"),
  showImportedSurfaceInput: el("showImportedSurface"),
  sphereColorInput: el("sphereColor"),
  internalColorInput: el("internalColor"),
  nucleusShapeInput: el("nucleusShape"),
  nucleusPresetInput: el("nucleusPreset"),
  nucleusSizeInput: el("nucleusSize"),
  nucleusCornerRadiusInput: el("nucleusCornerRadius"),
  nucleusYOffsetInput: el("nucleusYOffset"),
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
  sphereOpacityInput: el("sphereOpacity"),
  sphereGlareInput: el("sphereGlare"),
  sphereMatteInput: el("sphereMatte"),
  internalMatteInput: el("internalMatte"),
  sphereGlowInput: el("sphereGlow"),
  exportDataBtn: el("exportDataBtn"),
  exportWebflowBtn: el("exportWebflowBtn"),
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
  const currentShape = shape || refs.nucleusShapeInput?.value || "sphere";
  const nodes = document.querySelectorAll("[data-shape-controls]");
  for (const node of nodes) {
    const visible = matchesShapeScope(node.dataset.shapeControls, currentShape);
    node.classList.toggle("control-hidden", !visible);
  }
}
