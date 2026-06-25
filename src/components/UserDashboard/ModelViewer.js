// src/components/UserDashboard/ModelViewerBabylon.jsx
import React, {
  useState, useEffect, useRef, useCallback,
  forwardRef, useImperativeHandle
} from 'react';
import * as BABYLON from '@babylonjs/core';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import { OBJFileLoader } from '@babylonjs/loaders/OBJ';
import {
  Engine, Scene, SceneLoader, ArcRotateCamera, HemisphericLight,
  DirectionalLight, MeshBuilder, StandardMaterial, PBRMaterial,
  Color3, Vector3, ShadowGenerator, Texture
} from '@babylonjs/core';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ============ ENREGISTRER LES LOADERS BABYLON ============
// IMPORTANT: Appeler registerBuiltInLoaders() avant tout chargement
// et s'assurer que l'appel est fait une seule fois
registerBuiltInLoaders();
console.log('✅ Babylon.js loaders registered');

// Ne pas avaler silencieusement les erreurs de matériaux OBJ/MTL :
// utile pour diagnostiquer les textures manquantes sur les fichiers .obj
OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;

// ============ PARAMÈTRES DE LA VUE PAR DÉFAUT ============
// Plus le multiplicateur est grand, plus le modèle apparaît petit/éloigné
// au chargement initial (l'utilisateur peut ensuite zoomer lui-même).
const DEFAULT_FIT_MULTIPLIER = 4;
const MIN_DEFAULT_DISTANCE = 5;

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

  dispose() {
    this.files.clear();
    this.filenames.clear();
    this.filenamesLower.clear();
    this.filenamesNormalized.clear();
  }
}

// ============ FONCTIONS DE CHARGEMENT DES TEXTURES ============

async function applyZipTexturesToSceneBabylon(scene, virtualFS, abortSignal) {
  if (!scene || abortSignal?.aborted) {
    console.warn("Application des textures annulée");
    return 0;
  }

  const materials = scene.materials;
  let texturesLoaded = 0;

  const availableTextures = [];
  for (const [path] of virtualFS.files) {
    const filename = path.split('/').pop();
    availableTextures.push({
      fullPath: path,
      filename: filename,
      nameWithoutExt: filename.split('.').slice(0, -1).join('.').toLowerCase(),
      ext: filename.split('.').pop().toLowerCase()
    });
  }

  console.log('📁 Textures disponibles:', availableTextures.map(t => t.filename));

  for (const material of materials) {
    if (abortSignal?.aborted) break;

    if (!material || (!(material instanceof StandardMaterial) && !(material instanceof PBRMaterial))) continue;

    const textureProps = [
      { prop: 'diffuseTexture', keywords: ['diffuse', 'albedo', 'color', 'col', 'basecolor'] },
      { prop: 'ambientTexture', keywords: ['ambient', 'ao', 'occlusion'] },
      { prop: 'specularTexture', keywords: ['specular', 'spec'] },
      { prop: 'emissiveTexture', keywords: ['emissive', 'emission', 'emit'] },
      { prop: 'bumpTexture', keywords: ['bump', 'height', 'disp'] },
      { prop: 'normalTexture', keywords: ['normal', 'nor'] },
      { prop: 'roughnessTexture', keywords: ['roughness', 'rough', 'rgh'] },
      { prop: 'metallicTexture', keywords: ['metallic', 'metal'] },
      { prop: 'opacityTexture', keywords: ['opacity', 'alpha', 'mask'] },
    ];

    for (const { prop, keywords } of textureProps) {
      if (abortSignal?.aborted) break;

      const texture = material[prop];
      if (!texture || !texture.name) continue;

      const textureName = texture.name;
      const filename = textureName.split('/').pop();
      const nameWithoutExt = filename.split('.').slice(0, -1).join('.').toLowerCase();

      console.log(`🔍 Recherche texture pour ${prop}: ${filename}`);

      let entry = virtualFS.findFile(textureName) || virtualFS.findFile(filename);

      if (!entry) {
        for (const tex of availableTextures) {
          if (tex.nameWithoutExt === nameWithoutExt) {
            entry = virtualFS.findFile(tex.fullPath);
            if (entry) {
              console.log(`✅ Trouvé par nom sans extension: ${tex.filename}`);
              break;
            }
          }
        }
      }

      if (!entry) {
        for (const keyword of keywords) {
          for (const tex of availableTextures) {
            if (tex.nameWithoutExt.includes(keyword) || keyword.includes(tex.nameWithoutExt)) {
              entry = virtualFS.findFile(tex.fullPath);
              if (entry) {
                console.log(`✅ Trouvé par mot-clé "${keyword}": ${tex.filename}`);
                break;
              }
            }
          }
          if (entry) break;
        }
      }

      if (!entry) {
        console.warn(`❌ Texture non trouvée: ${filename}`);
        continue;
      }

      try {
        const blob = await entry.async('blob');
        const url = URL.createObjectURL(blob);

        const newTexture = new Texture(url, scene);

        if (texture.uScale) newTexture.uScale = texture.uScale;
        if (texture.vScale) newTexture.vScale = texture.vScale;
        if (texture.uOffset) newTexture.uOffset = texture.uOffset;
        if (texture.vOffset) newTexture.vOffset = texture.vOffset;
        if (texture.wrapU !== undefined) newTexture.wrapU = texture.wrapU;
        if (texture.wrapV !== undefined) newTexture.wrapV = texture.wrapV;

        material[prop] = newTexture;
        material.markAsDirty();
        texturesLoaded++;
        console.log(`✅ Texture chargée: ${filename} -> ${prop}`);

      } catch (error) {
        console.warn(`⚠️ Erreur chargement texture ${filename}:`, error);
      }
    }
  }

  console.log(`✅ ${texturesLoaded} textures chargées`);
  return texturesLoaded;
}

function getSceneBoundingInfo(scene) {
  const meshes = scene.meshes.filter(m => m.isPickable && m.getClassName() !== 'Ground' && m.getClassName() !== 'Grid');
  if (meshes.length === 0) return null;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  meshes.forEach(mesh => {
    const boundingInfo = mesh.getBoundingInfo();
    if (boundingInfo) {
      const min = boundingInfo.minimum;
      const max = boundingInfo.maximum;
      if (min) {
        minX = Math.min(minX, min.x);
        minY = Math.min(minY, min.y);
        minZ = Math.min(minZ, min.z);
      }
      if (max) {
        maxX = Math.max(maxX, max.x);
        maxY = Math.max(maxY, max.y);
        maxZ = Math.max(maxZ, max.z);
      }
    }
  });

  if (minX === Infinity) return null;

  const center = new Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  );

  const radius = Math.max(
    (maxX - minX) / 2,
    (maxY - minY) / 2,
    (maxZ - minZ) / 2
  );

  return {
    boundingSphere: { center, radius },
    min: new Vector3(minX, minY, minZ),
    max: new Vector3(maxX, maxY, maxZ)
  };
}

// ============ CADRAGE DE LA CAMÉRA SUR LE MODÈLE ============
// Centre le modèle et règle une distance de départ plus grande (vue "petite"
// et centrée), pour laisser à l'utilisateur la liberté de zoomer ensuite.
// Mémorise aussi cette vue dans defaultViewRef pour le bouton "Reset".
function frameCameraOnScene(scene, camera, defaultViewRef) {
  const boundingInfo = getSceneBoundingInfo(scene);
  if (!boundingInfo || !camera) {
    console.warn('⚠️ Aucune bounding box trouvée — la caméra garde sa position par défaut.');
    return;
  }

  const center = boundingInfo.boundingSphere.center;
  const radius = boundingInfo.boundingSphere.radius || 1;
  const distance = Math.max(radius * DEFAULT_FIT_MULTIPLIER, MIN_DEFAULT_DISTANCE);

  camera.target = center;
  camera.radius = distance;
  camera.alpha = -Math.PI / 4;
  camera.beta = Math.PI / 3;
  camera.lowerRadiusLimit = Math.max(radius * 0.1, 0.05);
  camera.upperRadiusLimit = distance * 8;

  if (defaultViewRef) {
    defaultViewRef.current = {
      target: center.clone(),
      radius: distance,
      alpha: camera.alpha,
      beta: camera.beta,
    };
  }

  console.log('📷 Caméra cadrée (vue par défaut centrée et éloignée):', {
    target: center,
    radius: distance,
  });
}

// ============ HELPERS D'ANIMATION CAMÉRA ============
function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  let a = angle % twoPi;
  if (a > Math.PI) a -= twoPi;
  if (a < -Math.PI) a += twoPi;
  return a;
}

// Trouve la cible équivalente la plus proche de "current" pour éviter
// qu'une rotation animée ne fasse "le tour complet" inutilement.
function shortestAngleTarget(current, target) {
  const twoPi = Math.PI * 2;
  let delta = (target - current) % twoPi;
  if (delta > Math.PI) delta -= twoPi;
  if (delta < -Math.PI) delta += twoPi;
  return current + delta;
}

function animateCameraProperty(camera, property, toValue, frameRate = 60, durationFrames = 30) {
  if (!camera || !camera.getScene) return;
  const scene = camera.getScene();
  // On retire une éventuelle animation en cours sur la même propriété
  // pour éviter les conflits si l'utilisateur clique vite plusieurs fois.
  const existing = scene.getAnimatableByTarget ? scene.getAnimatableByTarget(camera) : null;
  if (existing) {
    existing.stop(`cam_${property}`);
  }
  BABYLON.Animation.CreateAndStartAnimation(
    `cam_${property}`,
    camera,
    property,
    frameRate,
    durationFrames,
    camera[property],
    toValue,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
}

// ============ BABYLON MODEL LOADER ============
const BabylonModelLoader = forwardRef(function BabylonModelLoader(
  { assetId, token, fileName, assetExt, onLoad, onError, selectedZipFile },
  ref
) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const loadAttemptedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const defaultViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // API impérative exposée au composant parent pour piloter la caméra
  // depuis les boutons (Face/Arrière/Gauche/Droite/Haut/Bas, zoom, reset).
  useImperativeHandle(ref, () => ({
    setView: (viewName) => {
      const camera = cameraRef.current;
      if (!camera) return;

      const defaults = defaultViewRef.current;
      const radius = defaults?.radius ?? camera.radius;

      let targetAlphaRaw = camera.alpha;
      let targetBeta = camera.beta;

      switch (viewName) {
        case 'front':
          targetAlphaRaw = -Math.PI / 2;
          targetBeta = Math.PI / 2;
          break;
        case 'back':
          targetAlphaRaw = Math.PI / 2;
          targetBeta = Math.PI / 2;
          break;
        case 'left':
          targetAlphaRaw = Math.PI;
          targetBeta = Math.PI / 2;
          break;
        case 'right':
          targetAlphaRaw = 0;
          targetBeta = Math.PI / 2;
          break;
        case 'top':
          targetBeta = 0.0001;
          break;
        case 'bottom':
          targetBeta = Math.PI - 0.0001;
          break;
        default:
          return;
      }

      const currentAlpha = normalizeAngle(camera.alpha);
      const targetAlpha = shortestAngleTarget(currentAlpha, targetAlphaRaw);

      animateCameraProperty(camera, 'alpha', targetAlpha);
      animateCameraProperty(camera, 'beta', targetBeta);
      animateCameraProperty(camera, 'radius', radius);
    },

    zoomIn: () => {
      const camera = cameraRef.current;
      if (!camera) return;
      const lower = camera.lowerRadiusLimit ?? 0.05;
      const upper = camera.upperRadiusLimit ?? camera.radius;
      const newRadius = BABYLON.Scalar.Clamp(camera.radius * 0.7, lower, upper);
      animateCameraProperty(camera, 'radius', newRadius);
    },

    zoomOut: () => {
      const camera = cameraRef.current;
      if (!camera) return;
      const lower = camera.lowerRadiusLimit ?? 0.05;
      const upper = camera.upperRadiusLimit ?? camera.radius * 1.4;
      const newRadius = BABYLON.Scalar.Clamp(camera.radius * 1.4, lower, upper);
      animateCameraProperty(camera, 'radius', newRadius);
    },

    resetView: () => {
      const camera = cameraRef.current;
      const defaults = defaultViewRef.current;
      if (!camera || !defaults) return;

      camera.target = defaults.target.clone();
      const currentAlpha = normalizeAngle(camera.alpha);
      const targetAlpha = shortestAngleTarget(currentAlpha, defaults.alpha);

      animateCameraProperty(camera, 'alpha', targetAlpha);
      animateCameraProperty(camera, 'beta', defaults.beta);
      animateCameraProperty(camera, 'radius', defaults.radius);
    },
  }), []);

  // Initialiser le moteur et la scène
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let isMounted = true;
    let engine = null;
    let scene = null;
    let animationId = null;

    const initScene = async () => {
      try {
        // Créer le moteur Babylon
        engine = new Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
          antialiasing: true,
        });
        engineRef.current = engine;

        // Créer la scène
        scene = new Scene(engine);
        sceneRef.current = scene;

         scene.clearColor = new Color3(0.9, 0.9, 0.9); // RGB (230, 230, 230)

        // Configurer la caméra
        const camera = new ArcRotateCamera(
          "camera",
          -Math.PI / 4,
          Math.PI / 3,
          10,
          new Vector3(0, 0, 0),
          scene
        );
        camera.attachControl(canvas, true);
        camera.wheelPrecision = 50;
        camera.minZ = 0.1;
        camera.maxZ = 1000;
        cameraRef.current = camera;

        // Lumières
        const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
        hemiLight.intensity = 0.8;

        const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), scene);
        dirLight.intensity = 1.2;
        dirLight.position = new Vector3(5, 5, 5);

        const shadowGenerator = new ShadowGenerator(1024, dirLight);

        // Grille
        const grid = MeshBuilder.CreateGround("grid", { width: 10, height: 10, subdivisions: 20 }, scene);
        const gridMat = new StandardMaterial("gridMat", scene);
        gridMat.alpha = 0.3;
        grid.material = gridMat;
        grid.position.y = -1.5;

        setIsReady(true);

        // Démarrer le rendu
        const renderLoop = () => {
          if (scene && engine && isMounted && !abortController.signal.aborted) {
            scene.render();
            animationId = requestAnimationFrame(renderLoop);
          }
        };
        renderLoop();

        // Redimensionnement
        const handleResize = () => {
          if (engine && isMounted && !abortController.signal.aborted) {
            engine.resize();
          }
        };
        window.addEventListener('resize', handleResize);

        // Nettoyage
        return () => {
          isMounted = false;
          abortController.abort();
          if (animationId) cancelAnimationFrame(animationId);
          window.removeEventListener('resize', handleResize);
          if (engine) {
            engine.dispose();
          }
          if (scene) {
            scene.dispose();
          }
        };

      } catch (err) {
        console.error('Erreur initialisation Babylon:', err);
        onError?.(err);
      }
    };

    initScene();

  }, []);

  // Charger le modèle une fois que la scène est prête
  useEffect(() => {
    if (!isReady || !sceneRef.current || !canvasRef.current) return;

    const abortController = abortControllerRef.current;
    let isMounted = true;
    let scene = sceneRef.current;
    let camera = cameraRef.current;

    const loadModel = async () => {
      if (!scene || loadAttemptedRef.current) return;
      loadAttemptedRef.current = true;

      try {
        if (abortController?.signal.aborted || !isMounted) {
          console.warn("Chargement annulé");
          return;
        }

        // Télécharger le fichier
        const url = `${API_BASE_URL}/assets/${assetId}/download`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();

        if (abortController?.signal.aborted || !isMounted) {
          console.warn("Chargement annulé après téléchargement.");
          return;
        }

        let ext = '';
        if (assetExt) ext = assetExt.toLowerCase().replace(/^\./, '');
        if (!ext && fileName && fileName.includes('.')) {
          ext = fileName.split('.').pop()?.toLowerCase() || '';
        }

        // === SUPPORT ZIP ===
        if (ext === 'zip') {
          try {
            const zip = await JSZip.loadAsync(blob);

            if (abortController?.signal.aborted || !isMounted) {
              console.warn("Chargement annulé après extraction ZIP.");
              return;
            }

            const virtualFS = new VirtualFileSystem();
            zip.forEach((relativePath, file) => {
              if (!file.dir) {
                virtualFS.addFile(relativePath, file);
              }
            });

            console.log('📁 Fichiers dans le ZIP:');
            const allFiles = virtualFS.getAllFiles();
            allFiles.forEach(path => console.log(`  - ${path}`));

            const files = [];
            zip.forEach((relativePath, file) => {
              if (!file.dir) {
                const filename = relativePath.split('/').pop();
                const extFile = filename.split('.').pop().toLowerCase();
                files.push({
                  filename: filename,
                  path: relativePath,
                  extension: extFile,
                  file: file
                });
              }
            });

            let selectedFile = null;
            if (selectedZipFile) {
              selectedFile = files.find(f => f.filename === selectedZipFile.filename);
            }

            if (!selectedFile) {
              const priority = ['glb', 'gltf', 'fbx', 'obj'];
              for (const extType of priority) {
                const found = files.find(f => f.extension === extType);
                if (found) {
                  selectedFile = found;
                  break;
                }
              }
            }

            if (selectedFile) {
              const fileData = await selectedFile.file.async('arraybuffer');
              const fileBlob = new Blob([fileData]);
              const fileUrl = URL.createObjectURL(fileBlob);

              if (abortController?.signal.aborted || !isMounted) {
                console.warn("Chargement annulé avant chargement du modèle.");
                URL.revokeObjectURL(fileUrl);
                return;
              }

              console.log(`🔄 Chargement du modèle: ${selectedFile.filename}`);

              // pluginExtension est le 5e paramètre de LoadAssetContainerAsync
              // (rootUrl, sceneFilename, scene, onProgress, pluginExtension),
              // sous forme de string avec le point (ex: '.fbx').
              const pluginExt = '.' + (selectedFile.extension || 'fbx');

              const result = await SceneLoader.LoadAssetContainerAsync(
                "",
                fileUrl,
                scene,
                (progress) => {
                  if (progress.total && isMounted && !abortController?.signal.aborted) {
                    const pct = ((progress.loaded / progress.total) * 100).toFixed(2);
                    console.log(`Chargement: ${pct}%`);
                  }
                },
                pluginExt
              );

              if (abortController?.signal.aborted || !isMounted) {
                console.warn("Chargement annulé après chargement du modèle.");
                URL.revokeObjectURL(fileUrl);
                return;
              }

              result.addAllToScene();

              // Debug : confirmer que des meshes ont bien été ajoutés à la scène
              console.log(
                '🧩 Meshes après chargement:',
                scene.meshes.length,
                scene.meshes.map(m => m.name)
              );

              console.log('🔄 Application des textures...');

              await applyZipTexturesToSceneBabylon(scene, virtualFS, abortController?.signal);

              if (abortController?.signal.aborted || !isMounted) {
                console.warn("Chargement annulé après application des textures.");
                URL.revokeObjectURL(fileUrl);
                return;
              }

              frameCameraOnScene(scene, camera, defaultViewRef);

              if (isMounted && !abortController?.signal.aborted) {
                onLoad?.();
              }

              URL.revokeObjectURL(fileUrl);
            } else {
              if (isMounted && !abortController?.signal.aborted) {
                onError?.(new Error('Aucun fichier modèle trouvé dans le ZIP'));
              }
            }
            return;
          } catch (zipError) {
            console.error('Erreur chargement ZIP:', zipError);
            if (isMounted && !abortController?.signal.aborted) {
              onError?.(zipError);
            }
            return;
          }
        }

        // === AUTRES FORMATS (fichier direct, hors ZIP) ===
        console.log(`🔄 Chargement du fichier: ${fileName}`);
        const fileUrl = URL.createObjectURL(blob);

        if (abortController?.signal.aborted || !isMounted) {
          console.warn("Chargement annulé avant chargement du modèle.");
          URL.revokeObjectURL(fileUrl);
          return;
        }

        // Même correctif ici : pluginExtension en 5e position, avec le point.
        const pluginExt = '.' + (ext || 'fbx');

        const result = await SceneLoader.LoadAssetContainerAsync(
          "",
          fileUrl,
          scene,
          (progress) => {
            if (progress.total && isMounted && !abortController?.signal.aborted) {
              const pct = ((progress.loaded / progress.total) * 100).toFixed(2);
              console.log(`Chargement: ${pct}%`);
            }
          },
          pluginExt
        );

        if (abortController?.signal.aborted || !isMounted) {
          console.warn("Chargement annulé après chargement du modèle.");
          URL.revokeObjectURL(fileUrl);
          return;
        }

        result.addAllToScene();

        // Debug : confirmer que des meshes ont bien été ajoutés à la scène
        console.log(
          '🧩 Meshes après chargement:',
          scene.meshes.length,
          scene.meshes.map(m => m.name)
        );

        frameCameraOnScene(scene, camera, defaultViewRef);

        if (isMounted && !abortController?.signal.aborted) {
          onLoad?.();
        }

        URL.revokeObjectURL(fileUrl);

      } catch (err) {
        console.error('Erreur chargement:', err);
        if (isMounted && !abortController?.signal.aborted) {
          onError?.(err);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [isReady, assetId, token, fileName, assetExt, selectedZipFile, onLoad, onError]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: '#1a1a1a'
      }}
    />
  );
});

// ============ BOUTON DE CONTRÔLE CAMÉRA (UI) ============
function CameraControlButton({ onClick, title, children, primary }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 40,
        height: 36,
        background: primary ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)',
        border: primary ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = primary ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.18)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = primary ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'; }}
    >
      {children}
    </button>
  );
}

function CameraControlsPanel({ viewerRef, visible }) {
  if (!visible) return null;

  const call = (method, ...args) => viewerRef.current?.[method]?.(...args);

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 15,
      userSelect: 'none',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
        VUE CAMÉRA
      </div>

      {/* Vues orthogonales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <CameraControlButton title="Face" onClick={() => call('setView', 'front')}>Face</CameraControlButton>
        <CameraControlButton title="Arrière" onClick={() => call('setView', 'back')}>Arr.</CameraControlButton>
        <CameraControlButton title="Dessus" onClick={() => call('setView', 'top')}>⬆ Haut</CameraControlButton>
        <CameraControlButton title="Gauche" onClick={() => call('setView', 'left')}>Gauche</CameraControlButton>
        <CameraControlButton title="Droite" onClick={() => call('setView', 'right')}>Droite</CameraControlButton>
        <CameraControlButton title="Dessous" onClick={() => call('setView', 'bottom')}>⬇ Bas</CameraControlButton>
      </div>

      {/* Zoom + reset */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <CameraControlButton title="Zoom -" onClick={() => call('zoomOut')}>−</CameraControlButton>
        <CameraControlButton title="Recentrer la vue" primary onClick={() => call('resetView')}>⌂</CameraControlButton>
        <CameraControlButton title="Zoom +" onClick={() => call('zoomIn')}>+</CameraControlButton>
      </div>
    </div>
  );
}

// ============ COMPOSANT PRINCIPAL ============
export default function ModelViewerBabylon({ assetId, assetName, token, assetExt, assetData, onClose, selectedZipFile }) {
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [assetInfo, setAssetInfo] = useState(assetData || null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const viewerRef = useRef(null);

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
  };

  const handleModelError = (err) => {
    console.error('Model error:', err);
    setError(err.message || 'Erreur de chargement du modèle');
    setLoading(false);
  };

  const shouldLoadModel = !loading && fileName && fileName !== '';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '16px 24px',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff' }}>
            {assetExt?.toLowerCase() === 'zip' ? '📦 Modèle ZIP' : 'Visualisation 3D (Babylon.js)'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            {assetInfo?.title || assetName || 'Modèle 3D'}
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#fff',
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

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative', background: '#1a1a1a' }}>
          <BabylonModelLoader
            key={assetId + (selectedZipFile?.filename || '')}
            ref={viewerRef}
            assetId={assetId}
            token={token}
            fileName={fileName}
            assetExt={assetExt}
            onLoad={handleModelLoad}
            onError={handleModelError}
            selectedZipFile={selectedZipFile}
          />

          {/* Panneau de contrôle caméra : visible une fois le modèle chargé */}
          <CameraControlsPanel viewerRef={viewerRef} visible={modelLoaded && !error} />

          {/* Overlay de chargement */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.8)',
              padding: '20px 30px',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              zIndex: 10
            }}>
              <div style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(231, 235, 241, 0.3)',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: 12,
                margin: '0 auto 12px auto'
              }} />
              <p style={{ margin: 0 }}>Chargement du modèle...</p>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#ef4444',
              background: 'rgba(0,0,0,0.9)',
              padding: '32px',
              borderRadius: 16,
              maxWidth: '90%',
              zIndex: 20
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ marginTop: 12 }}>Erreur: {error}</p>
              <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                Vérifiez que le fichier contient un modèle 3D valide.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={() => window.location.reload()}
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
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: 'white',
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
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
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
            <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Informations</h4>
            <div style={{ height: 2, width: 40, background: '#3B82F6', marginBottom: 20 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>NOM</label>
              <div style={{ fontSize: 14, color: '#fff', wordBreak: 'break-word', fontWeight: 500 }}>
                {assetInfo?.title || assetInfo?.name || assetName || 'Sans titre'}
              </div>
            </div>

            {assetInfo?.description && (
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>DESCRIPTION</label>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  {assetInfo.description}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>FORMAT</label>
              <div style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500 }}>
                {assetExt?.toUpperCase() || '3D Model'}
                {assetExt?.toLowerCase() === 'zip' && ' 📦'}
              </div>
            </div>

            {assetInfo?.file_size && (
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>TAILLE</label>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  {(assetInfo.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            )}

            {assetInfo?.created_at && (
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>DATE D'AJOUT</label>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  {new Date(assetInfo.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}

            {assetInfo?.visibility && (
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 5 }}>VISIBILITÉ</label>
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