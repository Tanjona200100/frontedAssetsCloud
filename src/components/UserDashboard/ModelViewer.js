// src/components/UserDashboard/ModelViewerThree.jsx
// Version complète avec correction de l'erreur Button

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ============ PARAMÈTRES DE CAMÉRA ============
const DEFAULT_CAMERA_PADDING = 3.5;
const MIN_CAMERA_DISTANCE = 3;
const MAX_CAMERA_DISTANCE = 50;

// ============ SYSTÈME DE FICHIERS VIRTUEL ============
class VirtualFileSystem {
  constructor() {
    this.files = new Map();
    this.filenames = new Map();
    this.filenamesLower = new Map();
    this.filenamesNormalized = new Map();
  }

  addFile(path, data) {
    this.files.set(path, data);
    const filename = path.split('/').pop();

    if (!this.filenames.has(filename)) {
      this.filenames.set(filename, []);
    }
    this.filenames.get(filename).push({ path, data });

    const filenameLower = filename.toLowerCase();
    if (!this.filenamesLower.has(filenameLower)) {
      this.filenamesLower.set(filenameLower, []);
    }
    this.filenamesLower.get(filenameLower).push({ path, data });

    const normalized = filenameLower.replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
    if (!this.filenamesNormalized.has(normalized)) {
      this.filenamesNormalized.set(normalized, []);
    }
    this.filenamesNormalized.get(normalized).push({ path, data });
  }

  findFile(path) {
    if (!path) return null;

    let cleanPath = path.replace(/^\.\//, '').replace(/^\/+/, '').trim();

    if (this.files.has(cleanPath)) return this.files.get(cleanPath);
    if (this.files.has(path)) return this.files.get(path);

    const filename = cleanPath.split('/').pop();
    if (!filename) return null;

    const filenameLower = filename.toLowerCase();
    const normalized = filenameLower.replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.').toLowerCase();

    if (this.filenamesLower.has(filenameLower)) {
      const matches = this.filenamesLower.get(filenameLower);
      if (matches.length > 0) return matches[0].data;
    }

    if (this.filenamesNormalized.has(normalized)) {
      const matches = this.filenamesNormalized.get(normalized);
      if (matches.length > 0) return matches[0].data;
    }

    for (const [key, value] of this.files) {
      const keyFilename = key.split('/').pop();
      const keyNameWithoutExt = keyFilename.split('.').slice(0, -1).join('.').toLowerCase();
      if (keyNameWithoutExt === nameWithoutExt) return value;
    }

    for (const [key, value] of this.files) {
      const keyFilename = key.split('/').pop().toLowerCase();
      if (keyFilename.includes(filenameLower) || filenameLower.includes(keyFilename)) {
        return value;
      }
    }

    const parts = filenameLower.split(/[_.-]/);
    for (const part of parts) {
      if (part.length > 2) {
        for (const [key, value] of this.files) {
          const keyFilename = key.split('/').pop().toLowerCase();
          if (keyFilename.includes(part)) {
            return value;
          }
        }
      }
    }

    return null;
  }

  getAllFiles() {
    return Array.from(this.files.keys());
  }

  getTextureFiles() {
    const textureExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tga', 'tif', 'tiff', 'dds'];
    const textureFiles = [];
    for (const [path, data] of this.files) {
      const filename = path.split('/').pop();
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      if (textureExtensions.includes(ext)) {
        textureFiles.push({ path, filename, ext, data });
      }
    }
    return textureFiles;
  }

  async getTextureBlob(path) {
    const entry = this.findFile(path);
    if (!entry) return null;
    try {
      const blob = await entry.async('blob');
      return blob;
    } catch (error) {
      console.warn(`Erreur chargement texture ${path}:`, error);
      return null;
    }
  }

  dispose() {
    this.files.clear();
    this.filenames.clear();
    this.filenamesLower.clear();
    this.filenamesNormalized.clear();
  }
}

// ============ FONCTIONS ============

function calculateModelStats(model) {
  let vertices = 0;
  let triangles = 0;
  let meshes = 0;
  const materials = new Set();
  const textures = new Set();

  model.traverse((child) => {
    if (child.isMesh) {
      meshes++;
      const geom = child.geometry;
      if (geom && geom.attributes && geom.attributes.position) {
        vertices += geom.attributes.position.count;
      }
      if (geom && geom.index) {
        triangles += geom.index.count / 3;
      } else if (geom && geom.attributes && geom.attributes.position) {
        triangles += geom.attributes.position.count / 3;
      }

      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if (mat && mat.isMaterial) {
            materials.add(mat.name || 'Material');
            const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'displacementMap', 'specularMap'];
            textureProps.forEach(prop => {
              if (mat[prop] && mat[prop].isTexture && mat[prop].image) {
                textures.add(mat[prop].name || 'Texture');
              }
            });
          }
        });
      }
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  return {
    vertices: Math.round(vertices),
    triangles: Math.round(triangles),
    meshes,
    materials: materials.size,
    textures: textures.size,
    dimensions: {
      width: size.x,
      height: size.y,
      depth: size.z
    },
    center: [center.x, center.y, center.z]
  };
}

function fitCameraToModel(camera, controls, model, padding = DEFAULT_CAMERA_PADDING) {
  if (!model || !camera || !controls) return;

  try {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    let distance = Math.max(maxDim * padding, MIN_CAMERA_DISTANCE);
    
    if (distance > MAX_CAMERA_DISTANCE) {
      distance = MAX_CAMERA_DISTANCE;
    }

    const position = new THREE.Vector3(
      center.x + distance * 0.7,
      center.y + distance * 0.5,
      center.z + distance * 0.9
    );
    
    camera.position.copy(position);
    camera.lookAt(center);

    controls.target.copy(center);
    controls.update();

    controls.minDistance = Math.max(maxDim * 0.1, 0.1);
    controls.maxDistance = Math.max(distance * 8, 20);

    return { distance, center, size };
  } catch (error) {
    console.warn('Erreur ajustement caméra:', error);
    return null;
  }
}

// ============ VALIDATION DES MATÉRIAUX ============

function isValidMaterial(material) {
  if (!material) return false;
  if (!material.isMaterial) return false;
  if (material.type === 'undefined' || material.type === 'null') return false;
  return true;
}

function isValidTexture(texture) {
  if (!texture) return false;
  if (!texture.isTexture) return false;
  if (!texture.image) return false;
  if (!texture.image.width || !texture.image.height) return false;
  return true;
}

// ============ TOKENISATION ET DICTIONNAIRE DE SYNONYMES ============

// Découpe un nom de fichier (sans extension) en tokens exploitables
function tokenizeFilename(filename) {
  const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
  return nameWithoutExt
    .toLowerCase()
    .split(/[_\-.\s]+/)
    .filter(t => t.length > 0);
}

// Dictionnaire de synonymes par type de texture PBR
// Chaque type a une liste de tokens "forts" (match exact = fiable)
const TEXTURE_TYPE_SYNONYMS = {
  map:          ['basecolor', 'diffuse', 'albedo', 'color', 'col', 'base', 'diff', 'bc', 'alb'],
  normalMap:    ['normal', 'nor', 'nrm', 'bump', 'nml', 'norm'],
  roughnessMap: ['roughness', 'rough', 'rgh', 'rough_', 'rgn'],
  metalnessMap: ['metallic', 'metal', 'met', 'metalness', 'mtl'],
  emissiveMap:  ['emissive', 'emission', 'emit', 'glow', 'ems'],
  alphaMap:     ['alpha', 'opacity', 'opac', 'mask', 'transparency'],
  aoMap:        ['ao', 'ambient', 'occlusion', 'occ', 'ambientocclusion'],
};

// Types de textures "packées" fréquentes (ORM = Occlusion/Roughness/Metalness)
// Un seul fichier peut légitimement remplir plusieurs canaux
const PACKED_TEXTURE_HINTS = ['orm', 'rma', 'mra', 'arm', 'packed', 'mixmap'];

function isPackedTexture(filename) {
  const f = filename.toLowerCase();
  return PACKED_TEXTURE_HINTS.some(hint => f.includes(hint));
}

// Score un fichier texture pour un type donné, en tenant compte
// de TOUS les tokens du nom de fichier (pas seulement un substring)
function scoreTextureForType(filename, contextTokens, type) {
  const fileTokens = tokenizeFilename(filename);
  const synonyms = TEXTURE_TYPE_SYNONYMS[type] || [];

  let score = 0;

  // Match exact d'un token complet = score fort (évite les faux positifs)
  if (fileTokens.some(t => synonyms.includes(t))) {
    score += 10;
  } else if (fileTokens.some(ft => synonyms.some(s => ft.includes(s) || s.includes(ft)))) {
    // Match partiel (substring dans un sens ou l'autre) = score plus faible
    score += 3;
  }

  if (score === 0) return 0;

  // Bonus si le nom du matériau/mesh apparaît aussi dans le nom du fichier
  if (contextTokens.length > 0 && fileTokens.some(ft => contextTokens.includes(ft))) {
    score += 5;
  }

  return score;
}

// Résout l'assignation textures <-> types pour UN matériau donné.
// Approche globale : on score tous les couples (texture, type) puis on
// assigne dans l'ordre décroissant de score, en évitant les conflits.
function resolveTextureAssignment(availableTextures, contextTokens, usedTextures, isPhong) {
  const types = Object.keys(TEXTURE_TYPE_SYNONYMS);
  if (isPhong) types.push('specularMap'); // specular n'est pas dans le dict standard
  if (isPhong && !TEXTURE_TYPE_SYNONYMS.specularMap) {
    TEXTURE_TYPE_SYNONYMS.specularMap = ['specular', 'spec', 'roughness', 'rough'];
  }

  const candidates = [];

  for (const tex of availableTextures) {
    if (usedTextures.has(tex.path)) continue; // déjà consommée par un autre matériau

    for (const type of types) {
      const score = scoreTextureForType(tex.filename, contextTokens, type);
      if (score > 0) {
        candidates.push({ tex, type, score, packed: isPackedTexture(tex.filename) });
      }
    }
  }

  // Trie par score décroissant : les meilleurs matchs sont assignés en premier
  candidates.sort((a, b) => b.score - a.score);

  const assigned = {};
  const filesLockedForThisMaterial = new Set();
  const typesFilled = new Set();

  for (const { tex, type, score, packed } of candidates) {
    if (typesFilled.has(type)) continue;

    // Une texture "packée" (ORM etc.) ou à score faible (<5) peut être
    // réutilisée pour un autre canal du MÊME matériau sans être verrouillée.
    const alreadyLockedElsewhere = filesLockedForThisMaterial.has(tex.path) && !packed;
    if (alreadyLockedElsewhere) continue;

    assigned[type] = tex;
    typesFilled.add(type);

    // On ne verrouille définitivement (pour les autres matériaux) que si
    // le match est fiable ET que ce n'est pas un fichier packé partagé.
    if (score >= 5 && !packed) {
      filesLockedForThisMaterial.add(tex.path);
    }
  }

  return assigned;
}

// ============ CHARGEMENT DES TEXTURES DEPUIS LE VFS (VERSION CORRIGÉE) ============

async function applyZipTexturesToThree(model, virtualFS) {
  if (!model || !virtualFS) return 0;

  let texturesLoaded = 0;
  const availableTextures = virtualFS.getTextureFiles();

  console.log('🔍 ===== TEXTURES DISPONIBLES =====');
  availableTextures.forEach((t, index) => console.log(`  ${index + 1}. ${t.filename}`));
  console.log('===================================\n');

  const usedTextures = new Set();
  const textureCache = new Map(); // path -> THREE.Texture (évite de recharger 2x le même fichier packé)

  // Charge une texture depuis le VFS et retourne l'objet THREE.Texture (avec cache)
  const loadTexture = async (entry) => {
    if (textureCache.has(entry.path)) {
      return textureCache.get(entry.path);
    }

    const blob = await virtualFS.getTextureBlob(entry.path);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    try {
      const textureLoader = new THREE.TextureLoader();
      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(url, resolve, undefined, reject);
      });
      textureCache.set(entry.path, texture);
      return texture;
    } catch (error) {
      console.warn(`  ❌ Erreur chargement texture ${entry.filename}:`, error);
      return null;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  // === RASSEMBLER MATÉRIAU + MESHES QUI L'UTILISENT ===
  const materialEntries = [];
  const materialIndex = new Map();

  model.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(mat => {
        if (!materialIndex.has(mat)) {
          materialIndex.set(mat, materialEntries.length);
          materialEntries.push({ material: mat, meshes: [] });
        }
        materialEntries[materialIndex.get(mat)].meshes.push(child);
      });
    }
  });

  console.log(`🔍 Traitement de ${materialEntries.length} matériaux\n`);

  for (const { material, meshes } of materialEntries) {
    if (!material) continue;

    const isPhong = material.type === 'MeshPhongMaterial';
    let targetMaterial = material;

    console.log(`📦 ===== MATÉRIAU: ${material.name || 'sans nom'} (${material.type}) =====`);
    console.log(`  - meshes utilisant ce matériau: ${meshes.map(m => m.name || '(sans nom)').join(', ')}`);

    // === CONVERSION PHONG → STANDARD SI NÉCESSAIRE ===
    if (isPhong) {
      console.log(`🔄 Conversion de MeshPhongMaterial en MeshStandardMaterial`);

      targetMaterial = new THREE.MeshStandardMaterial();
      targetMaterial.color.copy(material.color);
      if (material.map) targetMaterial.map = material.map;
      if (material.emissive) targetMaterial.emissive.copy(material.emissive);
      targetMaterial.emissiveIntensity = material.emissiveIntensity || 0;
      targetMaterial.opacity = material.opacity ?? 1;
      targetMaterial.transparent = material.transparent || false;
      targetMaterial.side = material.side || THREE.FrontSide;
      targetMaterial.name = material.name || '';

      if (material.specular) {
        const specularIntensity = material.specular.r;
        targetMaterial.metalness = 0.0;
        targetMaterial.roughness = Math.max(0.1, 1 - Math.min(specularIntensity * 0.8, 0.9));
      }
      if (material.shininess !== undefined) {
        targetMaterial.roughness = Math.max(0.1, 1 - Math.min(material.shininess / 100, 0.9));
      }
      if (material.specularMap) {
        targetMaterial.roughnessMap = material.specularMap;
      }
      if (material.bumpMap) {
        targetMaterial.normalMap = material.bumpMap;
        if (material.bumpScale !== undefined) {
          targetMaterial.normalScale = new THREE.Vector2(material.bumpScale, material.bumpScale);
        }
      }

      console.log(`  ✅ Matériau converti en MeshStandardMaterial`);
    }

    // === CONTEXTE DE NOM POUR LE MATCHING (tokenisé) ===
    const materialName = targetMaterial.name || material.name || '';
    const meshNames = meshes.map(m => m.name).filter(Boolean);
    const contextTokens = [materialName, ...meshNames]
      .filter(Boolean)
      .flatMap(n => tokenizeFilename(n));

    console.log(`  - tokens de contexte: [${contextTokens.join(', ') || 'aucun'}]`);

    // === RÉSOLUTION GLOBALE DES TEXTURES POUR CE MATÉRIAU ===
    const assignment = resolveTextureAssignment(
      availableTextures,
      contextTokens,
      usedTextures,
      isPhong
    );

    const pendingMaps = {};

    for (const [prop, match] of Object.entries(assignment)) {
      // Ne pas écraser une texture déjà définie nativement (GLB/MTL)
      if (targetMaterial[prop] && targetMaterial[prop].isTexture) {
        console.log(`    ⏭️ ${prop} déjà défini, ignoré`);
        continue;
      }

      const texture = await loadTexture(match);
      if (texture) {
        pendingMaps[prop] = texture;
        texturesLoaded++;
        usedTextures.add(match.path);
        console.log(`  ✅ Texture assignée: ${match.filename} -> ${prop}`);
      } else {
        console.log(`  ❌ Échec chargement pour ${prop} (${match.filename})`);
      }
    }

    if (Object.keys(pendingMaps).length === 0) {
      console.log(`  ⚠️ Aucune texture trouvée pour ce matériau`);
    }

    // Applique toutes les maps résolues en une seule fois
    Object.assign(targetMaterial, pendingMaps);
    targetMaterial.needsUpdate = true;

    // === ASSIGNER LE MATÉRIAU AUX MESHES ===
    // Un clone par mesh évite le crash "refreshUniformsCommon" quand un même
    // matériau est partagé entre meshes ayant des attributs de géométrie
    // différents (skinning, vertex colors, UV2, etc.)
    if (meshes.length === 1) {
      meshes[0].material = targetMaterial;
    } else {
      meshes.forEach(mesh => {
        mesh.material = targetMaterial.clone();
      });
    }

    console.log('');
  }

  console.log(`✅ ${texturesLoaded} textures chargées au total`);
  return texturesLoaded;
}

// ============ CHARGEMENT DU MODÈLE AVEC VFS ============

async function loadModelFromZip(zipFile, virtualFS, selectedFile) {
  let modelFile = selectedFile;
  let modelFormat = null;

  if (!modelFile) {
    const priority = ['glb', 'gltf', 'fbx', 'obj', 'stl'];
    for (const ext of priority) {
      const found = Object.keys(zipFile.files).find(f => 
        f.toLowerCase().endsWith(`.${ext}`) && !zipFile.files[f].dir
      );
      if (found) {
        modelFile = found;
        modelFormat = ext;
        break;
      }
    }
  } else {
    const ext = modelFile.filename.split('.').pop()?.toLowerCase() || '';
    modelFormat = ext;
    modelFile = modelFile.path;
  }

  if (!modelFile) {
    throw new Error('Aucun fichier modèle trouvé dans le ZIP');
  }

  console.log(`📦 Fichier modèle trouvé: ${modelFile} (${modelFormat})`);

  const fileData = await zipFile.files[modelFile].async('arraybuffer');
  const fileBlob = new Blob([fileData]);
  const fileUrl = URL.createObjectURL(fileBlob);

  try {
    let model;

    switch (modelFormat?.toLowerCase()) {
      case 'glb':
      case 'gltf': {
        const loader = new GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
          loader.load(fileUrl, resolve, undefined, reject);
        });
        model = gltf.scene;
        if (gltf.animations && gltf.animations.length > 0) {
          model.userData.animations = gltf.animations;
        }
        break;
      }

      case 'fbx': {
        const loader = new FBXLoader();
        model = await new Promise((resolve, reject) => {
          loader.load(fileUrl, resolve, undefined, reject);
        });
        break;
      }

      case 'obj': {
        const mtlFiles = Object.keys(zipFile.files).filter(f => 
          f.toLowerCase().endsWith('.mtl') && !zipFile.files[f].dir
        );

        if (mtlFiles.length > 0) {
          const mtlData = await zipFile.files[mtlFiles[0]].async('string');
          const mtlUrl = URL.createObjectURL(new Blob([mtlData]));
          
          const mtlLoader = new MTLLoader();
          const materials = await new Promise((resolve, reject) => {
            mtlLoader.load(mtlUrl, resolve, undefined, reject);
          });
          
          const objLoader = new OBJLoader();
          objLoader.setMaterials(materials);
          
          model = await new Promise((resolve, reject) => {
            objLoader.load(fileUrl, resolve, undefined, reject);
          });
          
          URL.revokeObjectURL(mtlUrl);
        } else {
          const objLoader = new OBJLoader();
          model = await new Promise((resolve, reject) => {
            objLoader.load(fileUrl, resolve, undefined, reject);
          });
        }
        break;
      }

      case 'stl': {
        const loader = new STLLoader();
        const geometry = await new Promise((resolve, reject) => {
          loader.load(fileUrl, resolve, undefined, reject);
        });
        const mesh = new THREE.Mesh(geometry);
        mesh.geometry.computeVertexNormals();
        const group = new THREE.Group();
        group.add(mesh);
        model = group;
        break;
      }

      default:
        throw new Error(`Format non supporté: ${modelFormat}`);
    }

    URL.revokeObjectURL(fileUrl);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    return { model, format: modelFormat };

  } catch (error) {
    URL.revokeObjectURL(fileUrl);
    throw error;
  }
}

// ============ COMPOSANT D'ANIMATION ============

function AnimationController({ model, onAnimationChange }) {
  const [animations, setAnimations] = useState([]);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mixerRef = useRef(null);

  useEffect(() => {
    if (!model) return;

    let anims = [];
    if (model.userData.animations) {
      anims = model.userData.animations;
    } else {
      model.traverse((child) => {
        if (child.animations && child.animations.length > 0) {
          anims = child.animations;
        }
      });
    }

    setAnimations(anims);
    if (anims.length > 0) {
      setCurrentAnimation(anims[0]);
      onAnimationChange?.(anims[0]);
    }
  }, [model, onAnimationChange]);

  const playAnimation = (animation) => {
    if (!model) return;

    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }

    if (!animation) {
      setIsPlaying(false);
      setCurrentAnimation(null);
      return;
    }

    mixerRef.current = new THREE.AnimationMixer(model);
    const action = mixerRef.current.clipAction(animation);
    action.play();
    setCurrentAnimation(animation);
    setIsPlaying(true);
    onAnimationChange?.(animation);
  };

  useFrame((state, delta) => {
    if (mixerRef.current && isPlaying) {
      mixerRef.current.update(delta);
    }
  });

  if (animations.length === 0) return null;

  // Utilisation de Html pour les boutons d'animation (CORRECTION)
  return (
    <Html position={[0, 0, 0]} center>
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        padding: '8px 12px',
        borderRadius: 8,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: 8,
        zIndex: 10,
        whiteSpace: 'nowrap'
      }}>
        {animations.map((anim, index) => (
          <button
            key={index}
            onClick={() => playAnimation(anim)}
            style={{
              padding: '4px 12px',
              background: currentAnimation === anim && isPlaying ? '#3B82F6' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11,
              transition: 'all 0.2s'
            }}
          >
            {anim.name || `Anim ${index + 1}`}
          </button>
        ))}
        {isPlaying && (
          <button
            onClick={() => playAnimation(null)}
            style={{
              padding: '4px 12px',
              background: 'rgba(239,68,68,0.3)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11
            }}
          >
            ⏹ Stop
          </button>
        )}
      </div>
    </Html>
  );
}

// ============ COMPOSANT DE FALLBACK ============

function WebGLErrorFallback({ error, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      background: '#f0f0f0',
      color: '#333',
      padding: '40px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h3 style={{ margin: '0 0 8px' }}>Erreur de rendu 3D</h3>
      <p style={{ color: '#666', maxWidth: 400, margin: '0 0 20px' }}>
        {error || 'Impossible d\'initialiser le contexte WebGL. Vérifiez que votre navigateur supporte WebGL.'}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '10px 24px',
          background: '#3B82F6',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500
        }}
      >
        🔄 Réessayer
      </button>
    </div>
  );
}

// ============ NETTOYAGE DES OBJETS THREE ============

function disposeThreeObject(obj) {
  if (!obj) return;
  
  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if (mat && mat.isMaterial) {
            const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'displacementMap', 'specularMap'];
            textureProps.forEach(prop => {
              if (mat[prop] && mat[prop].isTexture) {
                mat[prop].dispose();
              }
            });
            mat.dispose();
          }
        });
      }
    }
  });
}

// ============ COMPOSANT MODÈLE 3D ============

const ThreeModelLoader = forwardRef(function ThreeModelLoader(
  { assetId, token, fileName, assetExt, onLoad, onError, selectedZipFile },
  ref
) {
  const [model, setModel] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const [webGLError, setWebGLError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const virtualFSRef = useRef(null);
  const [downloadError, setDownloadError] = useState(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useImperativeHandle(ref, () => ({
    setView: (viewName) => {
      if (!controlsRef.current || !modelRef.current || !cameraRef.current) return;

      try {
        const box = new THREE.Box3().setFromObject(modelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = Math.max(maxDim * 2.5, MIN_CAMERA_DISTANCE);

        let position;
        switch (viewName) {
          case 'front':
            position = [center.x, center.y, center.z + distance];
            break;
          case 'back':
            position = [center.x, center.y, center.z - distance];
            break;
          case 'left':
            position = [center.x - distance, center.y, center.z];
            break;
          case 'right':
            position = [center.x + distance, center.y, center.z];
            break;
          case 'top':
            position = [center.x, center.y + distance, center.z + 0.01];
            break;
          case 'bottom':
            position = [center.x, center.y - distance, center.z + 0.01];
            break;
          default:
            return;
        }

        controlsRef.current.target.copy(center);
        cameraRef.current.position.set(position[0], position[1], position[2]);
        cameraRef.current.lookAt(center);
        controlsRef.current.update();
      } catch (error) {
        console.warn('Erreur setView:', error);
      }
    },

    zoomIn: () => {
      if (!controlsRef.current || !cameraRef.current) return;
      try {
        const currentPos = cameraRef.current.position.clone();
        const target = controlsRef.current.target.clone();
        const direction = currentPos.clone().sub(target).normalize();
        const newPos = currentPos.clone().sub(direction.multiplyScalar(currentPos.distanceTo(target) * 0.15));
        cameraRef.current.position.copy(newPos);
        controlsRef.current.update();
      } catch (error) {
        console.warn('Erreur zoomIn:', error);
      }
    },

    zoomOut: () => {
      if (!controlsRef.current || !cameraRef.current) return;
      try {
        const currentPos = cameraRef.current.position.clone();
        const target = controlsRef.current.target.clone();
        const direction = currentPos.clone().sub(target).normalize();
        const newPos = currentPos.clone().add(direction.multiplyScalar(currentPos.distanceTo(target) * 0.15));
        cameraRef.current.position.copy(newPos);
        controlsRef.current.update();
      } catch (error) {
        console.warn('Erreur zoomOut:', error);
      }
    },

    resetView: () => {
      if (!controlsRef.current || !modelRef.current || !cameraRef.current) return;
      fitCameraToModel(cameraRef.current, controlsRef.current, modelRef.current, DEFAULT_CAMERA_PADDING);
    },
  }), []);

  const handleModelLoaded = useCallback((modelData, texturesLoaded = 0) => {
    try {
      setModel(modelData);
      modelRef.current = modelData;
      setIsLoaded(true);
      
      const modelStats = calculateModelStats(modelData);
      setStats(modelStats);

      console.log(`📊 Statistiques du modèle:`, modelStats);
      console.log(`🖼️ ${texturesLoaded} textures appliquées`);

      setTimeout(() => {
        try {
          if (cameraRef.current && controlsRef.current && modelData) {
            fitCameraToModel(cameraRef.current, controlsRef.current, modelData, DEFAULT_CAMERA_PADDING);
          }
        } catch (error) {
          console.warn('Erreur ajustement caméra:', error);
        }
      }, 100);

      onLoad?.();
    } catch (error) {
      console.error('Erreur handleModelLoaded:', error);
      setWebGLError(error.message);
      onError?.(error);
    }
  }, [onLoad, onError]);

  const handleWebGLError = useCallback((error) => {
    console.error('WebGL Error:', error);
    setWebGLError(error.message || 'Erreur de rendu 3D');
    setIsLoading(false);
    onError?.(error);
  }, [onError]);

  const downloadAsset = useCallback(async (assetId, token, retries = 3) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const url = `${API_BASE_URL}/assets/${assetId}/download?nocache=${timestamp}_${random}`;
        console.log(`🔄 Tentative ${attempt}/${retries}: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'If-None-Match': '',
            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
          },
          signal: AbortSignal.timeout(30000)
        });

        if (response.status === 304) {
          console.warn(`⚠️ 304 Not Modified, nouvelle tentative...`);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Le fichier téléchargé est vide');
        }

        console.log(`✅ Téléchargement réussi (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
        return blob;

      } catch (error) {
        lastError = error;
        console.warn(`❌ Tentative ${attempt} échouée:`, error.message);
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          console.log(`Nouvelle tentative dans ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Échec du téléchargement après plusieurs tentatives');
  }, []);

  const handleRetry = useCallback(() => {
    if (modelRef.current) {
      disposeThreeObject(modelRef.current);
      modelRef.current = null;
    }
    setModel(null);
    setStats(null);
    setIsLoaded(false);
    setWebGLError(null);
    setDownloadError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!assetId || !token) {
      setDownloadError('ID d\'asset ou token manquant');
      return;
    }

    const loadModel = async () => {
      setIsLoading(true);
      setLoadingProgress(0);
      setWebGLError(null);
      setDownloadError(null);

      try {
        const blob = await downloadAsset(assetId, token);

        let ext = '';
        if (assetExt) ext = assetExt.toLowerCase().replace(/^\./, '');
        if (!ext && fileName && fileName.includes('.')) {
          ext = fileName.split('.').pop()?.toLowerCase() || '';
        }

        if (ext === 'zip') {
          try {
            console.log('📦 Décompression du ZIP...');
            const zipFile = await JSZip.loadAsync(blob);
            
            const virtualFS = new VirtualFileSystem();
            zipFile.forEach((relativePath, file) => {
              if (!file.dir) {
                virtualFS.addFile(relativePath, file);
              }
            });
            virtualFSRef.current = virtualFS;

            console.log('📁 Fichiers dans le ZIP:');
            const allFiles = virtualFS.getAllFiles();
            allFiles.forEach(path => console.log(`  - ${path}`));

            let selectedFile = null;
            if (selectedZipFile) {
              selectedFile = virtualFS.files.has(selectedZipFile.path) ? selectedZipFile : null;
            }

            const { model: modelData, format } = await loadModelFromZip(zipFile, virtualFS, selectedFile);

            const texturesLoaded = await applyZipTexturesToThree(modelData, virtualFS);

            handleModelLoaded(modelData, texturesLoaded);

          } catch (zipError) {
            console.error('Erreur extraction ZIP:', zipError);
            setDownloadError(`Erreur ZIP: ${zipError.message}`);
            handleWebGLError(zipError);
          }
          setIsLoading(false);
          return;
        }

        console.log(`🔄 Chargement du fichier: ${fileName}`);
        const fileUrl = URL.createObjectURL(blob);

        try {
          let modelData;

          switch (ext) {
            case 'glb':
            case 'gltf': {
              const loader = new GLTFLoader();
              const gltf = await new Promise((resolve, reject) => {
                loader.load(fileUrl, resolve, (xhr) => {
                  if (xhr.total) {
                    setLoadingProgress((xhr.loaded / xhr.total) * 100);
                  }
                }, reject);
              });
              modelData = gltf.scene;
              if (gltf.animations && gltf.animations.length > 0) {
                modelData.userData.animations = gltf.animations;
              }
              break;
            }

            case 'fbx': {
              const loader = new FBXLoader();
              modelData = await new Promise((resolve, reject) => {
                loader.load(fileUrl, resolve, (xhr) => {
                  if (xhr.total) {
                    setLoadingProgress((xhr.loaded / xhr.total) * 100);
                  }
                }, reject);
              });
              break;
            }

            case 'obj': {
              const loader = new OBJLoader();
              modelData = await new Promise((resolve, reject) => {
                loader.load(fileUrl, resolve, (xhr) => {
                  if (xhr.total) {
                    setLoadingProgress((xhr.loaded / xhr.total) * 100);
                  }
                }, reject);
              });
              break;
            }

            case 'stl': {
              const loader = new STLLoader();
              const geometry = await new Promise((resolve, reject) => {
                loader.load(fileUrl, resolve, (xhr) => {
                  if (xhr.total) {
                    setLoadingProgress((xhr.loaded / xhr.total) * 100);
                  }
                }, reject);
              });
              const mesh = new THREE.Mesh(geometry);
              mesh.geometry.computeVertexNormals();
              const group = new THREE.Group();
              group.add(mesh);
              modelData = group;
              break;
            }

            default:
              throw new Error(`Format non supporté: ${ext}`);
          }

          const box = new THREE.Box3().setFromObject(modelData);
          const center = box.getCenter(new THREE.Vector3());
          modelData.position.sub(center);

          handleModelLoaded(modelData);

        } catch (loadError) {
          console.error('Erreur chargement:', loadError);
          setDownloadError(`Erreur chargement: ${loadError.message}`);
          handleWebGLError(loadError);
        } finally {
          URL.revokeObjectURL(fileUrl);
        }

        setIsLoading(false);

      } catch (err) {
        console.error('Erreur téléchargement:', err);
        setDownloadError(err.message || 'Erreur de téléchargement du fichier');
        setIsLoading(false);
        onError?.(err);
      }
    };

    loadModel();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (virtualFSRef.current) {
        virtualFSRef.current.dispose();
      }
      if (modelRef.current) {
        disposeThreeObject(modelRef.current);
        modelRef.current = null;
      }
    };
  }, [assetId, token, fileName, assetExt, selectedZipFile, handleModelLoaded, handleWebGLError, downloadAsset]);

  if (webGLError || downloadError) {
    return <WebGLErrorFallback error={downloadError || webGLError} onRetry={handleRetry} />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#f0f0f0' }}>
      <Canvas
        key={`canvas-${retryCount}`}
        camera={{ position: [8, 6, 10], fov: 45 }}
        style={{ 
          background: '#f0f0f0',
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        onCreated={({ camera, scene, gl }) => {
          cameraRef.current = camera;
          scene.background = new THREE.Color('#f0f0f0');
          gl.setClearColor('#f0f0f0');
          setCanvasReady(true);
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          handleWebGLError(error);
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "default",
          stencil: false,
          depth: true,
          failIfMajorPerformanceCaveat: false,
          clearColor: '#f0f0f0'
        }}
        frameloop="demand"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 5, -10]} intensity={0.5} />
        <hemisphereLight intensity={0.4} color="#ffffff" groundColor="#e0e0e0" />

        <Environment preset="apartment" background={false} />

        <Suspense fallback={null}>
          {model && <primitive object={model} />}
        </Suspense>

        {model && <AnimationController model={model} />}

        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          enableRotate
          minDistance={0.5}
          maxDistance={100}
          zoomSpeed={1.2}
          rotateSpeed={0.8}
          makeDefault
        />
      </Canvas>

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#333',
          textAlign: 'center',
          zIndex: 5,
          background: 'rgba(255,255,255,0.9)',
          padding: '20px 30px',
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(0,0,0,0.1)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px'
          }} />
          <div style={{ color: '#666' }}>Chargement... {Math.round(loadingProgress)}%</div>
        </div>
      )}

      {isLoaded && stats && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(0,0,0,0.75)',
          padding: '8px 12px',
          borderRadius: 8,
          color: '#fff',
          fontSize: 11,
          fontFamily: 'monospace',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 5
        }}>
          <div>Sommets: {stats.vertices.toLocaleString()}</div>
          <div>Triangles: {stats.triangles.toLocaleString()}</div>
          <div>Matériaux: {stats.materials}</div>
          <div>Textures: {stats.textures}</div>
          <div style={{ color: '#3B82F6', fontSize: 10 }}>
            {stats.dimensions.width.toFixed(2)} × {stats.dimensions.height.toFixed(2)} × {stats.dimensions.depth.toFixed(2)}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

// ============ COMPOSANT DE CONTRÔLES CAMÉRA (CORRIGÉ) ============

function CameraControlsPanel({ viewerRef, visible }) {
  if (!visible) return null;

  const call = (method, ...args) => viewerRef.current?.[method]?.(...args);

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: 12,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 15,
      userSelect: 'none',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: 10, color: 'rgb(255, 255, 255)', letterSpacing: 0.5 }}>
        VUE CAMÉRA
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <button onClick={() => call('setView', 'front')} style={buttonStyleLight}>Face</button>
        <button onClick={() => call('setView', 'back')} style={buttonStyleLight}>Arr.</button>
        <button onClick={() => call('setView', 'top')} style={buttonStyleLight}>Haut</button>
        <button onClick={() => call('setView', 'left')} style={buttonStyleLight}>Gauche</button>
        <button onClick={() => call('setView', 'right')} style={buttonStyleLight}>Droite</button>
        <button onClick={() => call('setView', 'bottom')} style={buttonStyleLight}>Bas</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button onClick={() => call('zoomOut')} style={{ ...buttonStyleLight, flex: 1 }}>−</button>
        <button onClick={() => call('resetView')} style={{ ...buttonStyleLight, background: 'rgba(59,130,246,0.15)', flex: 1 }}>⌂</button>
        <button onClick={() => call('zoomIn')} style={{ ...buttonStyleLight, flex: 1 }}>+</button>
      </div>
    </div>
  );
}

const buttonStyleLight = {
  width: 40,
  height: 36,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
};

// ============ COMPOSANT PRINCIPAL ============

export default function ModelViewerThree({ 
  assetId, 
  assetName, 
  token, 
  assetExt, 
  assetData, 
  onClose, 
  selectedZipFile 
}) {
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [assetInfo, setAssetInfo] = useState(assetData || null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const viewerRef = useRef(null);
  const [webGLError, setWebGLError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    const fetchAssetInfo = async () => {
      if (assetData) {
        setFileName(assetData.name || assetData.title || `model.${assetExt}`);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const asset = data.data || data;
          setAssetInfo(asset);
          const foundName = asset.name || asset.filename || asset.title;
          if (foundName) {
            setFileName(foundName);
          } else if (assetExt) {
            setFileName(`model.${assetExt.replace(/^\./, '')}`);
          }
        } else if (assetExt) {
          setFileName(`model.${assetExt.replace(/^\./, '')}`);
        }
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (assetId && token) {
      fetchAssetInfo();
    }
  }, [assetId, token, assetExt, assetData]);

  const handleModelLoad = () => {
    console.log('✅ Modèle chargé avec succès');
    setModelLoaded(true);
    setLoading(false);
    setWebGLError(null);
    setDownloadError(null);
  };

  const handleModelError = (err) => {
    console.error('Model error:', err);
    if (err.message?.includes('WebGL')) {
      setWebGLError(err.message);
    } else if (err.message?.includes('HTTP') || err.message?.includes('fetch')) {
      setDownloadError(err.message);
    }
    setError(err.message || 'Erreur de chargement du modèle');
    setLoading(false);
  };

  const handleRetry = () => {
    setError(null);
    setWebGLError(null);
    setDownloadError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000000',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff' }}>
            {assetExt?.toLowerCase() === 'zip' ? '📦 Modèle ZIP' : 'Visualisation 3D'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(241, 235, 235, 0.6)' }}>
            {assetInfo?.title || assetName || 'Modèle 3D'}
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgb(255, 255, 255)',
          border: 'none',
          color: '#ff0000',
          fontSize: 24,
          cursor: 'pointer',
          width: 40,
          height: 40,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          ×
        </button>
      </div>

      {/* Viewer */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative', background: '#f0f0f0' }}>
          <ThreeModelLoader
            key={assetId + (selectedZipFile?.filename || '') + retryCount}
            ref={viewerRef}
            assetId={assetId}
            token={token}
            fileName={fileName}
            assetExt={assetExt}
            onLoad={handleModelLoad}
            onError={handleModelError}
            selectedZipFile={selectedZipFile}
          />

          <CameraControlsPanel viewerRef={viewerRef} visible={modelLoaded && !error && !webGLError && !downloadError} />

          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#333',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.9)',
              padding: '20px 30px',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(0,0,0,0.1)',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px auto'
              }} />
              <p style={{ margin: 0, color: '#666' }}>Chargement du modèle...</p>
            </div>
          )}

          {(error || webGLError || downloadError) && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#dc2626',
              background: 'rgba(255,255,255,0.95)',
              padding: '32px',
              borderRadius: 16,
              maxWidth: '90%',
              zIndex: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ marginTop: 12, color: '#333' }}>Erreur: {error || webGLError || downloadError}</p>
              <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                {downloadError ? 'Problème de téléchargement du fichier. Vérifiez votre connexion réseau.' :
                 webGLError ? 'Problème de rendu 3D. Vérifiez que WebGL est activé.' : 
                 'Vérifiez que le fichier contient un modèle 3D valide.'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={handleRetry}
                  style={{
                    padding: '10px 20px',
                    background: '#3B82F6',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Réessayer
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    color: '#333',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Fermer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panneau d'informations */}
        <div style={{
          flex: 3,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 1,
          minWidth: '200px',
          maxWidth: '400px'
        }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#ffffff' }}>Informations</h4>
            <div style={{ height: 2, width: 40, background: '#3B82F6', marginBottom: 20 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgb(255, 255, 255)', display: 'block', marginBottom: 5 }}>NOM</label>
              <div style={{ fontSize: 14, color: '#d6d5d5', wordBreak: 'break-word', fontWeight: 500 }}>
                {assetInfo?.title || assetInfo?.name || assetName || 'Sans titre'}
              </div>
            </div>

            {assetInfo?.description && (
              <div>
                <label style={{ fontSize: 11, color: 'rgb(255, 255, 255)', display: 'block', marginBottom: 5 }}>DESCRIPTION</label>
                <div style={{ fontSize: 13, color: 'rgb(255, 255, 255)', lineHeight: 1.5 }}>
                  {assetInfo.description}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 11, color: 'rgb(255, 255, 255)', display: 'block', marginBottom: 5 }}>FORMAT</label>
              <div style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500 }}>
                {assetExt?.toUpperCase() || '3D Model'}
                {assetExt?.toLowerCase() === 'zip' && ' 📦'}
              </div>
            </div>

            {assetInfo?.file_size && (
              <div>
                <label style={{ fontSize: 11, color: 'rgb(255, 255, 255)', display: 'block', marginBottom: 5 }}>TAILLE</label>
                <div style={{ fontSize: 13, color: 'rgb(255, 255, 255)' }}>
                  {(assetInfo.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            )}

            {assetInfo?.created_at && (
              <div>
                <label style={{ fontSize: 11, color: 'rgb(255, 255, 255)', display: 'block', marginBottom: 5 }}>DATE D'AJOUT</label>
                <div style={{ fontSize: 13, color: 'rgb(255, 255, 255)' }}>
                  {new Date(assetInfo.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}

            {assetInfo?.visibility && (
              <div>
                <label style={{ fontSize: 11, color: 'rgb(255, 255, 255)', display: 'block', marginBottom: 5 }}>VISIBILITÉ</label>
                <div style={{
                  fontSize: 13,
                  color: assetInfo.visibility === 'public' ? '#10b981' : '#f59e0b',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>{assetInfo.visibility === 'public' ? '🌍' : '🔒'}</span>
                  <span>{assetInfo.visibility === 'public' ? 'Public' : 'Privé'}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API_BASE_URL}/assets/${assetId}/download`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (err) {
                  console.error('Download error:', err);
                  setError('Erreur téléchargement');
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              📥 Télécharger le modèle
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}