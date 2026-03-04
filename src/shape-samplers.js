import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/OBJLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/DRACOLoader.js";
import { MeshSurfaceSampler } from "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/math/MeshSurfaceSampler.js";
import * as MeshoptDecoder from "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/meshopt_decoder.module.js";

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomInUnitCircle() {
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random());
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

function fibonacciSpherePoint(i, n, r) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * goldenAngle;
  return new THREE.Vector3(Math.cos(theta) * radius * r, y * r, Math.sin(theta) * radius * r);
}

export function buildHeartShapePoints(count) {
  const points = [];
  while (points.length < count) {
    const x = (Math.random() * 2 - 1) * 1.2;
    const y = (Math.random() * 2 - 1) * 1.2;
    const heartEq = Math.pow(x * x + y * y - 1, 3) - x * x * Math.pow(y, 3);
    if (heartEq <= 0) {
      const depth = (Math.random() * 2 - 1) * 0.5;
      points.push(new THREE.Vector3(x * 4.2, y * 4.6, depth * 3.8));
    }
  }
  return points;
}

export function buildPresetShapePoints(name, count, shapeRadius) {
  const points = [];

  if (name === "heart") return buildHeartShapePoints(count);

  if (name === "sphere") {
    for (let i = 0; i < count; i++) {
      const p = fibonacciSpherePoint(i, count, shapeRadius);
      p.addScaledVector(p.clone().normalize(), randomRange(-0.2, 0.2));
      points.push(p);
    }
    return points;
  }

  if (name === "torus") {
    const R = shapeRadius * 0.75;
    const r = shapeRadius * 0.28;
    for (let i = 0; i < count; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const rr = r + randomRange(-0.12, 0.12);
      const x = (R + rr * Math.cos(v)) * Math.cos(u);
      const y = rr * Math.sin(v);
      const z = (R + rr * Math.cos(v)) * Math.sin(u);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  if (name === "cube") {
    const h = shapeRadius * 0.82;
    for (let i = 0; i < count; i++) {
      const face = (Math.random() * 6) | 0;
      const a = randomRange(-h, h);
      const b = randomRange(-h, h);
      const jitter = randomRange(-0.16, 0.16);
      if (face === 0) points.push(new THREE.Vector3(h + jitter, a, b));
      if (face === 1) points.push(new THREE.Vector3(-h + jitter, a, b));
      if (face === 2) points.push(new THREE.Vector3(a, h + jitter, b));
      if (face === 3) points.push(new THREE.Vector3(a, -h + jitter, b));
      if (face === 4) points.push(new THREE.Vector3(a, b, h + jitter));
      if (face === 5) points.push(new THREE.Vector3(a, b, -h + jitter));
    }
    return points;
  }

  if (name === "cone") {
    const h = shapeRadius * 1.7;
    const r = shapeRadius * 0.8;
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const a = Math.random() * Math.PI * 2;
      const y = -h * 0.5 + t * h;
      const rr = (1 - t) * r + randomRange(-0.08, 0.08);
      points.push(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr));
    }
    return points;
  }

  if (name === "cylinder") {
    const h = shapeRadius * 1.6;
    const r = shapeRadius * 0.62;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const y = randomRange(-h * 0.5, h * 0.5);
      const rr = r + randomRange(-0.12, 0.12);
      points.push(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr));
    }
    return points;
  }

  if (name === "helix") {
    const turns = 5.5;
    const r = shapeRadius * 0.7;
    const h = shapeRadius * 2.0;
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const a = t * Math.PI * 2 * turns;
      const y = -h * 0.5 + t * h;
      const jitter = randomRange(-0.22, 0.22);
      points.push(new THREE.Vector3(Math.cos(a) * (r + jitter), y, Math.sin(a) * (r + jitter)));
    }
    return points;
  }

  if (name === "wave") {
    const span = shapeRadius * 1.8;
    for (let i = 0; i < count; i++) {
      const u = randomRange(-1, 1);
      const v = randomRange(-1, 1);
      const x = u * span;
      const z = v * span;
      const y = Math.sin(u * 5.5) * Math.cos(v * 4.5) * shapeRadius * 0.55 + randomRange(-0.18, 0.18);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  if (name === "flower") {
    const petals = 6;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const petal = Math.abs(Math.sin(a * petals));
      const base = shapeRadius * (0.35 + petal * 0.75);
      const q = randomInUnitCircle();
      const x = Math.cos(a) * base + q.x * 0.3;
      const z = Math.sin(a) * base + q.y * 0.3;
      const y = Math.sin(a * petals * 0.5) * shapeRadius * 0.28 + randomRange(-0.16, 0.16);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  return buildHeartShapePoints(count);
}

export async function buildPointsFromImageUrl(url, targetCount) {
  const img = await new Promise((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("Failed to load image"));
    node.src = url;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const w = 190;
  const h = Math.max(80, Math.round((img.height / img.width) * w));
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(img, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h).data;
  const alphaMask = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      alphaMask[y * w + x] = pixels[idx + 3] / 255;
    }
  }

  const valid = [];
  const edge = [];
  const interior = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = alphaMask[y * w + x];
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / (255 * 3);
      if (a <= 0.22) continue;

      let transparentNeighbors = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
            transparentNeighbors++;
            continue;
          }
          if (alphaMask[ny * w + nx] <= 0.22) transparentNeighbors++;
        }
      }

      const edgeStrength = transparentNeighbors / 8;
      const entry = {
        x,
        y,
        brightness,
        alpha: a,
        edgeStrength,
        weight: 0.2 + a * 0.8 + edgeStrength * 2.6
      };
      valid.push(entry);
      if (edgeStrength > 0.2) edge.push(entry);
      else interior.push(entry);
    }
  }

  if (!valid.length) {
    throw new Error("Image has no visible pixels to build a shape from.");
  }

  const points = [];
  const scale = 8 / Math.max(w, h);
  const edgeMix = 0.68;
  const weightedPick = (list) => {
    let total = 0;
    for (let i = 0; i < list.length; i++) total += list[i].weight;
    let r = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      r -= list[i].weight;
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  };

  for (let i = 0; i < targetCount; i++) {
    const useEdge = edge.length > 0 && Math.random() < edgeMix;
    const source = useEdge ? edge : (interior.length ? interior : valid);
    const px = weightedPick(source);
    const ox = (px.x + (Math.random() * 2 - 1) * 0.3 - w / 2) * scale;
    const oy = (h / 2 - (px.y + (Math.random() * 2 - 1) * 0.3)) * scale;
    const spread = 0.12 + (1 - px.alpha) * 0.14 + px.edgeStrength * 0.05;
    const thickness = 2.2;
    const depth = (px.brightness - 0.5) * thickness + (Math.random() * 2 - 1) * spread;
    points.push(new THREE.Vector3(ox, oy, depth));
  }

  return points;
}

function geometrySurfaceArea(geometry) {
  const geom = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = geom.getAttribute("position");
  if (!pos || pos.count < 3) return 0;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();
  let area = 0;

  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    cross.crossVectors(ab, ac);
    area += 0.5 * cross.length();
  }

  if (geom !== geometry) geom.dispose();
  return area;
}

function buildSamplersFromObject(root) {
  root.updateWorldMatrix(true, true);
  const samplers = [];

  root.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;

    const transformedGeometry = node.geometry.clone();
    transformedGeometry.applyMatrix4(node.matrixWorld);
    if (!transformedGeometry.getAttribute("normal")) transformedGeometry.computeVertexNormals();

    const area = geometrySurfaceArea(transformedGeometry);
    if (area <= 0) {
      transformedGeometry.dispose();
      return;
    }

    const sampleMesh = new THREE.Mesh(transformedGeometry);
    const sampler = new MeshSurfaceSampler(sampleMesh).build();
    samplers.push({ sampler, area, geometry: transformedGeometry });
  });

  return samplers;
}

function samplePointsFromSamplers(samplers, targetCount) {
  const totalArea = samplers.reduce((sum, s) => sum + s.area, 0);
  if (totalArea <= 0) throw new Error("Unable to sample mesh geometry.");

  const points = [];
  const samplePoint = new THREE.Vector3();
  const sampleNormal = new THREE.Vector3();

  for (let i = 0; i < targetCount; i++) {
    let pick = Math.random() * totalArea;
    let chosen = samplers[0];
    for (let j = 0; j < samplers.length; j++) {
      pick -= samplers[j].area;
      if (pick <= 0) {
        chosen = samplers[j];
        break;
      }
    }

    chosen.sampler.sample(samplePoint, sampleNormal);
    // Keep sampled points on the mesh skin (slight noise only),
    // so surface-only movement modes don't get interior points.
    const shellNoise = (Math.random() * 2 - 1) * 0.06;
    samplePoint.addScaledVector(sampleNormal, shellNoise);

    points.push(samplePoint.clone());
  }

  return points;
}

export async function buildPointsFromMeshFile(file, targetCount, shapeRadius) {
  const extension = file.name.toLowerCase().split(".").pop();
  const gltfLoader = new GLTFLoader();
  const objLoader = new OBJLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/libs/draco/");
  gltfLoader.setDRACOLoader(dracoLoader);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  try {
    let root;
    if (extension === "glb" || extension === "gltf") {
      const data =
        extension === "glb"
          ? await file.arrayBuffer()
          : await file.text();
      const gltf = await gltfLoader.parseAsync(data, "");
      root = gltf.scene || gltf.scenes?.[0];
    } else if (extension === "obj") {
      root = objLoader.parse(await file.text());
    } else {
      throw new Error("Unsupported mesh format. Use .glb, .gltf, or .obj.");
    }

    if (!root) {
      throw new Error("Mesh file loaded, but no scene object was found.");
    }

    root.updateWorldMatrix(true, true);
    const initialBox = new THREE.Box3().setFromObject(root);
    const initialCenter = initialBox.getCenter(new THREE.Vector3());
    root.position.sub(initialCenter);

    root.updateWorldMatrix(true, true);
    const centeredBox = new THREE.Box3().setFromObject(root);
    const size = centeredBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetSize = shapeRadius * 2.2;
    const scale = targetSize / maxDim;
    root.scale.multiplyScalar(scale);

    root.updateWorldMatrix(true, true);
    const scaledBox = new THREE.Box3().setFromObject(root);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    root.position.sub(scaledCenter);

    const samplers = buildSamplersFromObject(root);
    if (!samplers.length) {
      throw new Error("No mesh surfaces found in that file.");
    }

    const points = samplePointsFromSamplers(samplers, targetCount);

    for (const item of samplers) {
      item.geometry.dispose();
    }

    return points;
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes("KHR_draco_mesh_compression")) {
      throw new Error("GLB uses Draco compression and could not be decoded.");
    }
    if (msg.includes("EXT_meshopt_compression")) {
      throw new Error("GLB uses Meshopt compression and could not be decoded.");
    }
    throw err;
  } finally {
    dracoLoader.dispose();
  }
}
