// src/components/UserDashboard/ModelViewer.jsx
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import * as THREE from 'three';
import JSZip from 'jszip';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

// ============ SYSTÈME DE FICHIERS VIRTUEL AVEC RECHERCHE AVANCÉE ============
class VirtualFileSystem {
  constructor() {
    this.files = new Map();
    this.textureCache = new Map();
    this.filenames = new Map(); // Index par nom de fichier
  }

  addFile(path, data) {
    this.files.set(path, data);
    // Indexer par nom de fichier (sans le chemin)
    const filename = path.split('/').pop();
    if (!this.filenames.has(filename)) {
      this.filenames.set(filename, []);
    }
    this.filenames.get(filename).push({ path, data });
  }

  getFile(path) {
    return this.files.get(path);
  }

  hasFile(path) {
    return this.files.has(path);
  }

  // Recherche avancée d'un fichier par chemin ou nom
  findFile(path) {
    // Nettoyer le chemin
    let cleanPath = path.replace(/^\.\//, '').replace(/^\/+/, '').trim();
    
    // 1. Chercher par chemin exact
    if (this.files.has(cleanPath)) {
      return this.files.get(cleanPath);
    }
    
    // 2. Chercher par chemin original
    if (this.files.has(path)) {
      return this.files.get(path);
    }
    
    // 3. Chercher par nom de fichier (prendre le premier trouvé)
    const filename = cleanPath.split('/').pop();
    if (this.filenames.has(filename)) {
      const matches = this.filenames.get(filename);
      if (matches.length > 0) {
        return matches[0].data;
      }
    }
    
    // 4. Chercher par nom de fichier sans extension
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    for (const [key, value] of this.files) {
      const keyFilename = key.split('/').pop();
      const keyNameWithoutExt = keyFilename.split('.').slice(0, -1).join('.');
      if (keyNameWithoutExt === nameWithoutExt) {
        return value;
      }
    }
    
    // 5. Chercher partiellement (contient le nom)
    for (const [key, value] of this.files) {
      if (key.toLowerCase().includes(filename.toLowerCase())) {
        return value;
      }
    }
    
    return null;
  }

  async getTextureUrl(path, zip) {
    const fileData = this.findFile(path);
    
    if (fileData) {
      try {
        const blob = await fileData.async('blob');
        const url = URL.createObjectURL(blob);
        // Ajouter à l'index des URLs de texture
        const cleanPath = path.replace(/^\.\//, '').replace(/^\/+/, '').trim();
        this.textureCache.set(cleanPath, url);
        return url;
      } catch (error) {
        console.error(`Erreur chargement texture ${path}:`, error);
        return null;
      }
    }
    
    console.warn(`Texture non trouvée: ${path}`);
    return null;
  }

  // Créer un texture loader personnalisé pour FBX
  createTextureLoaderForFBX(zip) {
    const self = this;
    
    return {
      load: async (url, onLoad, onError) => {
        try {
          // Nettoyer l'URL
          const cleanUrl = url.replace(/^\.\//, '').replace(/^\/+/, '').trim();
          
          // Chercher la texture
          const textureUrl = await self.getTextureUrl(cleanUrl, zip);
          
          if (textureUrl) {
            const loader = new THREE.TextureLoader();
            loader.load(textureUrl, (texture) => {
              if (onLoad) onLoad(texture);
            }, undefined, (error) => {
              console.error(`Erreur chargement texture ${cleanUrl}:`, error);
              if (onError) onError(error);
            });
          } else {
            // Essayer de trouver par nom de fichier uniquement
            const filename = cleanUrl.split('/').pop();
            for (const [key, value] of self.files) {
              const keyFilename = key.split('/').pop();
              if (keyFilename === filename) {
                const blob = await value.async('blob');
                const objectUrl = URL.createObjectURL(blob);
                const loader = new THREE.TextureLoader();
                loader.load(objectUrl, (texture) => {
                  if (onLoad) onLoad(texture);
                }, undefined, (error) => {
                  if (onError) onError(error);
                });
                return;
              }
            }
            
            if (onError) onError(new Error(`Texture introuvable: ${url}`));
          }
        } catch (error) {
          if (onError) onError(error);
        }
      }
    };
  }

  // Nettoyer les URLs créées
  dispose() {
    for (const [key, url] of this.textureCache) {
      URL.revokeObjectURL(url);
    }
    this.textureCache.clear();
  }
}

// ============ ZIP CONTENT POPUP ============
function ZipContentPopup({ files, onClose, onSelectFile }) {
  const groupedFiles = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Racine';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {});

  const sortedFolders = Object.keys(groupedFiles).sort();

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      'glb': '🎮', 'gltf': '🎮', 'obj': '🎮', 'fbx': '🎮',
      'mtl': '📄', 'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️',
      'webp': '🖼️', 'tga': '🖼️', 'bmp': '🖼️', 'tiff': '🖼️',
      'dds': '🖼️', 'txt': '📝', 'json': '📋', 'xml': '📋'
    };
    return iconMap[ext] || '📄';
  };

  const getFileColor = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const modelExts = ['glb', 'gltf', 'obj', 'fbx'];
    const textureExts = ['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 'dds'];
    
    if (modelExts.includes(ext)) return '#10b981';
    if (textureExts.includes(ext)) return '#3B82F6';
    if (ext === 'mtl') return '#8B5CF6';
    return '#666';
  };

  const isModelFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['glb', 'gltf', 'obj', 'fbx'].includes(ext);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: '#0a0f1a',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        width: '90%',
        maxWidth: 800,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 18 }}>
              📦 Contenu du ZIP
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {files.length} fichier(s) trouvé(s)
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

        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {sortedFolders.map((folder) => (
            <div key={folder} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12,
                color: '#3B82F6',
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>📁</span>
                <span>{folder}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  ({groupedFiles[folder].length} fichier(s))
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 6
              }}>
                {groupedFiles[folder].map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 6,
                      cursor: isModelFile(file.filename) ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      border: '1px solid transparent'
                    }}
                    onClick={() => {
                      if (isModelFile(file.filename)) {
                        onSelectFile(file);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (isModelFile(file.filename)) {
                        e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{getFileIcon(file.filename)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.filename}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <span style={{ color: getFileColor(file.filename) }}>
                          {file.extension.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        {isModelFile(file.filename) && (
                          <span style={{ color: '#10b981', fontSize: 9 }}>
                            🎯 Cliquer pour visualiser
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            💡 Cliquez sur un fichier modèle (.glb, .gltf, .obj, .fbx) pour le visualiser
          </span>
          <button onClick={onClose} style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12
          }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ CHARGEMENT DES MODÈLES AVEC TEXTURES ============
function ModelLoader({ assetId, token, fileName, assetExt, onLoad, onError, onZipContent, selectedZipFile }) {
  const [model, setModel] = useState(null);
  const loadAttemptedRef = useRef(false);
  const virtualFSRef = useRef(null);
  const textureUrlsRef = useRef([]);
  
  const stableOnLoad = useCallback(() => onLoad?.(), [onLoad]);
  const stableOnError = useCallback((err) => onError?.(err), [onError]);
  const stableOnZipContent = useCallback((files) => onZipContent?.(files), [onZipContent]);

  // Fonction pour charger les textures d'un modèle FBX
  const loadFBXWithTextures = (scene, virtualFS, zip) => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          // Pour chaque propriété de texture du matériau
          const textureProps = ['map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'normalMap', 'roughnessMap', 'metalnessMap'];
          
          textureProps.forEach(prop => {
            if (material[prop] && material[prop].image) {
              const textureUrl = material[prop].image.src || material[prop].image.url;
              if (textureUrl) {
                // Nettoyer l'URL
                const cleanUrl = textureUrl.replace(/^\.\//, '').replace(/^\/+/, '').trim();
                const filename = cleanUrl.split('/').pop();
                
                // Chercher la texture dans le ZIP
                let found = false;
                for (const [path, file] of virtualFS.files) {
                  const pathFilename = path.split('/').pop();
                  // Comparer les noms de fichiers (insensible à la casse)
                  if (pathFilename.toLowerCase() === filename.toLowerCase()) {
                    found = true;
                    file.async('blob').then(blob => {
                      const objectUrl = URL.createObjectURL(blob);
                      textureUrlsRef.current.push(objectUrl);
                      const textureLoader = new THREE.TextureLoader();
                      textureLoader.load(objectUrl, (texture) => {
                        material[prop] = texture;
                        material.needsUpdate = true;
                      });
                    });
                    break;
                  }
                }
                
                // Si non trouvé, essayer une recherche plus flexible
                if (!found) {
                  for (const [path, file] of virtualFS.files) {
                    const pathFilename = path.split('/').pop();
                    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
                    const pathNameWithoutExt = pathFilename.split('.').slice(0, -1).join('.');
                    if (pathNameWithoutExt.toLowerCase() === nameWithoutExt.toLowerCase()) {
                      found = true;
                      file.async('blob').then(blob => {
                        const objectUrl = URL.createObjectURL(blob);
                        textureUrlsRef.current.push(objectUrl);
                        const textureLoader = new THREE.TextureLoader();
                        textureLoader.load(objectUrl, (texture) => {
                          material[prop] = texture;
                          material.needsUpdate = true;
                        });
                      });
                      break;
                    }
                  }
                }
                
                if (!found) {
                  console.warn(`Texture non trouvée: ${filename}`);
                }
              }
            }
          });
        });
      }
    });
  };

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;
    let virtualFS = null;
    
    const loadModel = async () => {
      if (!fileName || fileName === '') {
        stableOnError(new Error('Nom de fichier non disponible'));
        return;
      }
      
      if (loadAttemptedRef.current) return;
      loadAttemptedRef.current = true;
      
      try {
        const url = `${API_BASE_URL}/assets/${assetId}/download`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        
        let ext = '';
        if (assetExt) ext = assetExt.toLowerCase().replace(/^\./, '');
        if (!ext && fileName && fileName.includes('.')) {
          ext = fileName.split('.').pop()?.toLowerCase() || '';
        }
        
        // === SUPPORT ZIP AVEC TEXTURES ===
        if (ext === 'zip') {
          try {
            const zip = await JSZip.loadAsync(blob);
            
            // Créer le système de fichiers virtuel
            virtualFS = new VirtualFileSystem();
            zip.forEach((relativePath, file) => {
              if (!file.dir) {
                virtualFS.addFile(relativePath, file);
              }
            });
            virtualFSRef.current = virtualFS;
            
            // Analyser le contenu pour la popup
            const files = [];
            zip.forEach((relativePath, file) => {
              if (!file.dir) {
                const pathParts = relativePath.split('/');
                const filename = pathParts[pathParts.length - 1];
                const extFile = filename.split('.').pop().toLowerCase();
                const folder = pathParts.slice(0, -1).join('/');

                files.push({
                  filename: filename,
                  path: relativePath,
                  folder: folder || 'Racine',
                  extension: extFile,
                  size: file._data?.uncompressedSize || 0
                });
              }
            });
            
            // Vérifier si un fichier spécifique est sélectionné
            let selectedFile = null;
            if (selectedZipFile) {
              selectedFile = files.find(f => f.filename === selectedZipFile.filename);
            }
            
            // Si un fichier est sélectionné, le charger
            if (selectedFile) {
              const fileData = await zip.file(selectedFile.path).async('arraybuffer');
              const fileBlob = new Blob([fileData]);
              const fileUrl = URL.createObjectURL(fileBlob);
              
              const fileExt = selectedFile.extension;
              
              // === CHARGEMENT FBX AVEC TEXTURES ===
              if (fileExt === 'fbx') {
                const loader = new FBXLoader();
                
                loader.load(
                  fileUrl,
                  (fbxScene) => {
                    // Charger les textures
                    loadFBXWithTextures(fbxScene, virtualFS, zip);
                    
                    // Centrer et mettre à l'échelle
                    const box = new THREE.Box3().setFromObject(fbxScene);
                    const center = box.getCenter(new THREE.Vector3());
                    fbxScene.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);

                    let scale;
                    if (maxDim > 0) {
                      scale = 1.2 / maxDim;
                      scale = Math.min(Math.max(scale, 0.3), 2);
                    }
                    fbxScene.scale.set(scale, scale, scale);
                    
                    if (isMounted) {
                      setModel(fbxScene);
                      stableOnLoad();
                    }
                    URL.revokeObjectURL(fileUrl);
                  },
                  (progress) => {
                    if (progress.lengthComputable) {
                      console.log(`Chargement FBX: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
                    }
                  },
                  (error) => {
                    console.error('Erreur loader FBX:', error);
                    stableOnError(error);
                    URL.revokeObjectURL(fileUrl);
                  }
                );
                return;
              }
              
              // === CHARGEMENT GLTF/GLB AVEC TEXTURES ===
              if (fileExt === 'glb' || fileExt === 'gltf') {
                const loader = new GLTFLoader();
                
                loader.load(
                  fileUrl,
                  (gltf) => {
                    const scene = gltf.scene;
                    
                    // Traiter les textures du GLTF
                    scene.traverse((child) => {
                      if (child.isMesh && child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(material => {
                          const textureProps = ['map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'normalMap', 'roughnessMap', 'metalnessMap'];
                          
                          textureProps.forEach(prop => {
                            if (material[prop] && material[prop].image) {
                              const textureUrl = material[prop].image.src || material[prop].image.url;
                              if (textureUrl) {
                                const filename = textureUrl.split('/').pop();
                                for (const [path, file] of virtualFS.files) {
                                  if (path.endsWith(filename)) {
                                    file.async('blob').then(blob => {
                                      const objectUrl = URL.createObjectURL(blob);
                                      textureUrlsRef.current.push(objectUrl);
                                      const textureLoader = new THREE.TextureLoader();
                                      textureLoader.load(objectUrl, (texture) => {
                                        material[prop] = texture;
                                        material.needsUpdate = true;
                                      });
                                    });
                                    break;
                                  }
                                }
                              }
                            }
                          });
                        });
                      }
                    });
                    
                    // Centrer et mettre à l'échelle
                    const box = new THREE.Box3().setFromObject(scene);
                    const center = box.getCenter(new THREE.Vector3());
                    scene.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);

                    let scale;
                    if (maxDim > 0) {
                      scale = 1.2 / maxDim;
                      scale = Math.min(Math.max(scale, 0.3), 2);
                    }
                    scene.scale.set(scale, scale, scale);
                    
                    if (isMounted) {
                      setModel(scene);
                      stableOnLoad();
                    }
                    URL.revokeObjectURL(fileUrl);
                  },
                  (progress) => {
                    if (progress.lengthComputable) {
                      console.log(`Chargement GLTF: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
                    }
                  },
                  (error) => {
                    console.error('Erreur loader GLTF:', error);
                    stableOnError(error);
                    URL.revokeObjectURL(fileUrl);
                  }
                );
                return;
              }
              
              // === CHARGEMENT OBJ AVEC TEXTURES ===
              if (fileExt === 'obj') {
                const loader = new OBJLoader();
                
                // Chercher le fichier MTL
                const mtlFile = files.find(f => f.filename === selectedFile.filename.replace('.obj', '.mtl'));
                
                if (mtlFile) {
                  try {
                    const mtlData = await zip.file(mtlFile.path).async('text');
                    const mtlLoader = new MTLLoader();
                    const mtl = mtlLoader.parse(mtlData, '');
                    
                    // Charger les textures du MTL
                    if (mtl.materials) {
                      Object.values(mtl.materials).forEach(material => {
                        const textureProps = ['map', 'bumpMap', 'normalMap', 'specularMap'];
                        textureProps.forEach(prop => {
                          if (material[prop]) {
                            const texturePath = material[prop].src || material[prop].url;
                            if (texturePath) {
                              const filename = texturePath.split('/').pop();
                              for (const [path, file] of virtualFS.files) {
                                if (path.endsWith(filename)) {
                                  file.async('blob').then(blob => {
                                    const objectUrl = URL.createObjectURL(blob);
                                    textureUrlsRef.current.push(objectUrl);
                                    const textureLoader = new THREE.TextureLoader();
                                    textureLoader.load(objectUrl, (texture) => {
                                      material[prop] = texture;
                                      material.needsUpdate = true;
                                    });
                                  });
                                  break;
                                }
                              }
                            }
                          }
                        });
                      });
                    }
                  } catch (error) {
                    console.warn('Erreur chargement MTL:', error);
                  }
                }
                
                loader.load(
                  fileUrl,
                  (objScene) => {
                    // Centrer et mettre à l'échelle
                    const box = new THREE.Box3().setFromObject(objScene);
                    const center = box.getCenter(new THREE.Vector3());
                    objScene.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);

                    let scale;
                    if (maxDim > 0) {
                      scale = 1.2 / maxDim;
                      scale = Math.min(Math.max(scale, 0.3), 2);
                    }
                    objScene.scale.set(scale, scale, scale);
                    
                    if (isMounted) {
                      setModel(objScene);
                      stableOnLoad();
                    }
                    URL.revokeObjectURL(fileUrl);
                  },
                  (progress) => {
                    if (progress.lengthComputable) {
                      console.log(`Chargement OBJ: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
                    }
                  },
                  (error) => {
                    console.error('Erreur loader OBJ:', error);
                    stableOnError(error);
                    URL.revokeObjectURL(fileUrl);
                  }
                );
                return;
              }
            } else {
              // Afficher la liste des fichiers
              stableOnZipContent(files);
            }
            return;
          } catch (zipError) {
            console.error('Erreur chargement ZIP:', zipError);
            stableOnError(new Error(`Erreur ZIP: ${zipError.message}`));
            return;
          }
        }
        // === FIN SUPPORT ZIP ===
        
        // === AUTRES FORMATS ===
        if (!ext) {
          const arrayBuffer = await blob.slice(0, 20).arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const hex = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
          const text = Array.from(uint8Array).map(b => String.fromCharCode(b)).join('');
          
          if (hex.startsWith('676C5446')) ext = 'glb';
          else if (text.startsWith('o ') || text.startsWith('v ')) ext = 'obj';
          else if (hex.startsWith('4B617941')) ext = 'fbx';
          else if (text.startsWith('{') && text.includes('asset')) ext = 'gltf';
        }
        
        if (!ext) throw new Error('Format non supporté');
        
        objectUrl = URL.createObjectURL(blob);
        
        let loader;
        switch (ext) {
          case 'glb': case 'gltf': loader = new GLTFLoader(); break;
          case 'obj': loader = new OBJLoader(); break;
          case 'fbx': loader = new FBXLoader(); break;
          default: throw new Error(`Format non supporté: ${ext}`);
        }
        
        loader.load(
          objectUrl,
          (loadedModel) => {
            const scene = loadedModel.scene || loadedModel;
            
            scene.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (!child.material) {
                  child.material = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.3, metalness: 0.1 });
                } else if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      mat.roughness = mat.roughness || 0.3;
                      mat.metalness = mat.metalness || 0.1;
                    });
                  } else {
                    child.material.roughness = child.material.roughness || 0.3;
                    child.material.metalness = child.material.metalness || 0.1;
                  }
                }
              }
            });
            
            const box = new THREE.Box3().setFromObject(scene);
            const center = box.getCenter(new THREE.Vector3());
            scene.position.sub(center);

            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            let scale;
            if (maxDim > 0) {
              scale = 1.2 / maxDim;
              scale = Math.min(Math.max(scale, 0.3), 2);
            }
            scene.scale.set(scale, scale, scale);
            
            if (isMounted) {
              setModel(scene);
              stableOnLoad();
            }
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          },
          (progress) => {
            if (progress.lengthComputable) {
              console.log(`Chargement: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
            }
          },
          (error) => {
            console.error('Erreur loader:', error);
            stableOnError(error);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          }
        );
      } catch (err) {
        console.error('Erreur:', err);
        stableOnError(err);
      }
    };
    
    if (assetId && token && fileName && fileName !== '') {
      loadModel();
    }
    
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (virtualFS) {
        virtualFS.dispose();
      }
      // Nettoyer les URLs de textures
      textureUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      textureUrlsRef.current = [];
    };
  }, [assetId, token, fileName, assetExt, stableOnLoad, stableOnError, stableOnZipContent, selectedZipFile]);
  
  if (!model) return null;
  return <primitive object={model} scale={1} />;
}

// ============ COMPOSANT PRINCIPAL ============
export default function ModelViewer({ assetId, assetName, token, assetExt, assetData, onClose, selectedZipFile }) {
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [assetInfo, setAssetInfo] = useState(assetData || null);
  const [showZipPopup, setShowZipPopup] = useState(false);
  const [zipFiles, setZipFiles] = useState([]);
  const [currentSelectedZipFile, setCurrentSelectedZipFile] = useState(selectedZipFile || null);

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

  const handleModelError = (err) => {
    console.error('Model error:', err);
    setError(err.message);
  };

  const handleZipContent = useCallback((files) => {
    setZipFiles(files);
    setShowZipPopup(true);
  }, []);

  const handleSelectZipFile = useCallback((file) => {
    setCurrentSelectedZipFile(file);
    setShowZipPopup(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }, []);

  const shouldLoadModel = !loading && fileName && fileName !== '';

  if (showZipPopup) {
    return (
      <ZipContentPopup 
        files={zipFiles} 
        onClose={() => {
          setShowZipPopup(false);
          if (!currentSelectedZipFile) {
            onClose();
          }
        }}
        onSelectFile={handleSelectZipFile}
      />
    );
  }

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
            {assetExt?.toLowerCase() === 'zip' ? '📦 Modèle ZIP' : 'Visualisation 3D'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            {currentSelectedZipFile ? `${assetInfo?.title || assetName} → ${currentSelectedZipFile.filename}` : (assetInfo?.title || assetName || 'Modèle 3D')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {assetExt?.toLowerCase() === 'zip' && (
            <button 
              onClick={() => setShowZipPopup(true)}
              style={{
                background: 'rgba(245,158,11,0.2)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
                padding: '6px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              📂 Voir les fichiers
            </button>
          )}
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
      </div>
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 7, position: 'relative', zIndex: 1 }}>
          {!error ? (
            <Canvas 
              shadows 
              style={{ background: '#e5e5e5' }} 
              onCreated={({ gl, camera }) => {
                gl.shadowMap.type = THREE.PCFShadowMap;
                gl.setClearColor(0xe5e5e5, 1);
                camera.position.set(1, 1.5, 4);
                camera.lookAt(0, 0, 0);
              }}
            >
              <PerspectiveCamera 
                makeDefault 
                position={[2, 1.5, 3]} 
                fov={45} 
              />
              
              <ambientLight intensity={0.8} />
              <directionalLight 
                position={[5, 5, 5]} 
                intensity={1.2} 
                castShadow 
                shadow-mapSize={[1024, 1024]} 
              />
              <pointLight position={[-3, 2, 4]} intensity={0.6} color="#88aaff" />
              <pointLight position={[3, 1, -2]} intensity={0.4} color="#ffaa88" />
              <spotLight position={[0, 5, 0]} intensity={0.4} />
              <pointLight position={[0, -2, 0]} intensity={0.3} color="#ffffff" />
              
              <Suspense fallback={
                <Html center>
                  <div style={{ 
                    color: '#333', 
                    textAlign: 'center', 
                    background: 'rgba(255,255,255,0.9)', 
                    padding: '20px 30px', 
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ width: 40, height: 40, border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <p>{loading ? 'Récupération...' : 'Chargement du modèle...'}</p>
                  </div>
                </Html>
              }>
                {shouldLoadModel && (
                  <ModelLoader
                    key={assetId + (currentSelectedZipFile?.filename || '')}
                    assetId={assetId}
                    token={token}
                    fileName={fileName}
                    assetExt={assetExt}
                    onLoad={() => console.log('Modèle chargé')}
                    onError={handleModelError}
                    onZipContent={handleZipContent}
                    selectedZipFile={currentSelectedZipFile}
                  />
                )}
              </Suspense>
              
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                zoomSpeed={1.2}
                rotateSpeed={1}
                panSpeed={0.8}
                target={[0, 0, 0]}
              />
              
              <Environment preset="studio" />
            </Canvas>
          ) : (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#ef4444',
              background: 'rgba(255,255,255,0.9)',
              padding: '24px',
              borderRadius: 16,
              maxWidth: '90%'
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ marginTop: 12 }}>Erreur: {error}</p>
              {assetExt?.toLowerCase() === 'zip' && (
                <button 
                  onClick={() => setShowZipPopup(true)}
                  style={{ 
                    marginTop: 12, 
                    padding: '8px 16px', 
                    background: '#f59e0b', 
                    border: 'none', 
                    borderRadius: 6, 
                    color: 'white', 
                    cursor: 'pointer' 
                  }}
                >
                  📂 Voir les fichiers du ZIP
                </button>
              )}
              <button 
                onClick={() => window.location.reload()} 
                style={{ 
                  marginTop: 12, 
                  padding: '8px 16px', 
                  background: '#3B82F6', 
                  border: 'none', 
                  borderRadius: 6, 
                  color: 'white', 
                  cursor: 'pointer',
                  marginLeft: 8
                }}
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
        
        <div style={{ 
          flex: 3, 
          background: 'rgba(44, 41, 41, 0.1)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.5)',
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 1
        }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Informations</h4>
            <div style={{ height: 2, width: 40, background: '#3B82F6', marginBottom: 20 }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#f1f1f1', display: 'block', marginBottom: 5 }}>NOM</label>
              <div style={{ fontSize: 14, color: '#999', wordBreak: 'break-word', fontWeight: 500 }}>
                {assetInfo?.title || assetInfo?.name || assetName || 'Sans titre'}
              </div>
            </div>
            
            {currentSelectedZipFile && (
              <div>
                <label style={{ fontSize: 11, color: '#10b981', display: 'block', marginBottom: 5 }}>FICHIER CHARGÉ</label>
                <div style={{ fontSize: 13, color: '#10b981', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {currentSelectedZipFile.filename}
                </div>
              </div>
            )}
            
            {assetInfo?.description && (
              <div>
                <label style={{ fontSize: 11, color: '#f1f1f1', display: 'block', marginBottom: 5 }}>DESCRIPTION</label>
                <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
                  {assetInfo.description}
                </div>
              </div>
            )}
            
            <div>
              <label style={{ fontSize: 11, color: '#f1f1f1', display: 'block', marginBottom: 5 }}>FORMAT</label>
              <div style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500 }}>
                {assetExt?.toUpperCase() || '3D Model'}
                {assetExt?.toLowerCase() === 'zip' && ' 📦'}
              </div>
            </div>
            
            {assetInfo?.file_size && (
              <div>
                <label style={{ fontSize: 11, color: '#f1f1f1', display: 'block', marginBottom: 5 }}>TAILLE</label>
                <div style={{ fontSize: 13, color: '#999' }}>
                  {(assetInfo.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            )}
            
            {assetInfo?.created_at && (
              <div>
                <label style={{ fontSize: 11, color: '#f1f1f1', display: 'block', marginBottom: 5 }}>DATE D'AJOUT</label>
                <div style={{ fontSize: 13, color: '#999' }}>
                  {new Date(assetInfo.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}
            
            {assetInfo?.visibility && (
              <div>
                <label style={{ fontSize: 11, color: '#f1f1f1', display: 'block', marginBottom: 5 }}>VISIBILITÉ</label>
                <div style={{ fontSize: 13, color: assetInfo.visibility === 'public' ? '#10b981' : '#f59e0b', fontWeight: 500 }}>
                  {assetInfo.visibility === 'public' ? '🌍 Public' : '🔒 Privé'}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assetExt?.toLowerCase() === 'zip' && (
              <button 
                onClick={() => setShowZipPopup(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(245,158,11,0.2)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8,
                  color: '#f59e0b',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
              >
                📂 Explorer le contenu du ZIP
              </button>
            )}
            
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
                background: '#3B82F6',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#3B82F6';
                e.target.style.transform = 'translateY(0)';
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