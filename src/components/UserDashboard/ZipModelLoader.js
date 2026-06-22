// src/components/UserDashboard/ZipModelLoader.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

class ZipModelLoader {
  constructor() {
    this.loaders = {
      glb: new GLTFLoader(),
      gltf: new GLTFLoader(),
      obj: new OBJLoader(),
      fbx: new FBXLoader()
    };
    this.mtlLoader = new MTLLoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Charge un modèle 3D depuis un fichier ZIP
   */
  async loadModelFromZip(zipFile) {
    try {
      // 1. Lire le ZIP
      const zip = await JSZip.loadAsync(zipFile);
      
      // 2. Analyser la structure
      const structure = this.analyzeZipStructure(zip);
      
      // 3. Trouver le fichier principal
      const mainFile = this.findMainModelFile(structure);
      if (!mainFile) {
        throw new Error('Aucun fichier modèle 3D trouvé dans le ZIP');
      }

      // 4. Créer un système de fichiers virtuel pour les textures
      const virtualFS = this.createVirtualFS(zip, structure);

      // 5. Charger le modèle avec les textures
      const model = await this.loadModelWithTextures(
        mainFile,
        zip,
        structure,
        virtualFS
      );

      return {
        scene: model.scene || model,
        textures: structure.textures,
        materials: structure.materials,
        mainFile: mainFile.filename,
        structure: structure
      };
    } catch (error) {
      console.error('Erreur chargement ZIP:', error);
      throw error;
    }
  }

  /**
   * Analyse la structure du ZIP
   */
  analyzeZipStructure(zip) {
    const structure = {
      models: [],
      textures: [],
      materials: [],
      others: [],
      folders: new Set()
    };

    zip.forEach((relativePath, file) => {
      const pathParts = relativePath.split('/');
      const filename = pathParts[pathParts.length - 1];
      const ext = filename.split('.').pop().toLowerCase();
      const folder = pathParts.slice(0, -1).join('/');

      // Ajouter le dossier
      if (folder) {
        structure.folders.add(folder);
      }

      const fileInfo = {
        filename: filename,
        path: relativePath,
        folder: folder,
        extension: ext,
        file: file
      };

      // Classifier le fichier
      if (['glb', 'gltf'].includes(ext)) {
        structure.models.push({ ...fileInfo, type: 'gltf' });
      } else if (['obj'].includes(ext)) {
        structure.models.push({ ...fileInfo, type: 'obj' });
      } else if (['fbx'].includes(ext)) {
        structure.models.push({ ...fileInfo, type: 'fbx' });
      } else if (['mtl'].includes(ext)) {
        structure.materials.push(fileInfo);
      } else if (['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 'dds'].includes(ext)) {
        structure.textures.push(fileInfo);
      } else {
        structure.others.push(fileInfo);
      }
    });

    return structure;
  }

  /**
   * Trouve le fichier modèle principal
   */
  findMainModelFile(structure) {
    if (structure.models.length === 0) return null;
    if (structure.models.length === 1) return structure.models[0];

    // Priorité : GLB > GLTF > OBJ > FBX
    const priority = ['glb', 'gltf', 'obj', 'fbx'];
    for (const type of priority) {
      const found = structure.models.find(m => m.extension === type);
      if (found) return found;
    }

    // Si plusieurs, prendre le plus grand
    return structure.models.reduce((a, b) => 
      (a.file._data.uncompressedSize > b.file._data.uncompressedSize) ? a : b
    );
  }

  /**
   * Crée un système de fichiers virtuel pour les textures
   */
  createVirtualFS(zip, structure) {
    const fs = {
      files: new Map(),
      folders: new Set()
    };

    // Ajouter toutes les textures
    structure.textures.forEach(texture => {
      fs.files.set(texture.path, texture.file);
      if (texture.folder) {
        fs.folders.add(texture.folder);
      }
    });

    // Ajouter les matériaux
    structure.materials.forEach(material => {
      fs.files.set(material.path, material.file);
      if (material.folder) {
        fs.folders.add(material.folder);
      }
    });

    return fs;
  }

  /**
   * Charge le modèle avec ses textures
   */
  async loadModelWithTextures(mainFile, zip, structure, virtualFS) {
    const ext = mainFile.extension;
    const loader = this.loaders[ext];

    if (!loader) {
      throw new Error(`Format non supporté: ${ext}`);
    }

    // Extraire le contenu du fichier
    const content = await mainFile.file.async('arraybuffer');
    const blob = new Blob([content]);
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      // Pour OBJ avec MTL
      if (ext === 'obj') {
        this.loadObjWithMTL(mainFile, structure, virtualFS, url, resolve, reject);
        return;
      }

      // Pour GLTF/GLB avec textures externes
      if (ext === 'gltf' || ext === 'glb') {
        this.loadGLTFWithTextures(mainFile, structure, virtualFS, url, resolve, reject);
        return;
      }

      // Pour FBX
      if (ext === 'fbx') {
        this.loadFBXWithTextures(mainFile, structure, virtualFS, url, resolve, reject);
        return;
      }

      // Chargeur standard
      loader.load(
        url,
        (model) => resolve(model),
        (error) => reject(error)
      );
    });
  }

  /**
   * Charge un modèle OBJ avec son fichier MTL
   */
  async loadObjWithMTL(mainFile, structure, virtualFS, url, resolve, reject) {
    const objLoader = this.loaders.obj;
    const mtlLoader = this.mtlLoader;

    // Trouver le fichier MTL associé
    const mtlFile = structure.materials.find(m => 
      m.filename === mainFile.filename.replace('.obj', '.mtl')
    );

    if (mtlFile) {
      try {
        // Extraire et charger le MTL
        const mtlContent = await mtlFile.file.async('text');
        const mtlData = mtlLoader.parse(mtlContent, '');

        // Créer un convertisseur de textures pour le chemin virtuel
        const textureConverter = (url) => {
          // Chercher dans le ZIP
          const texturePath = url.replace(/^\.\//, '');
          const textureFile = virtualFS.files.get(texturePath);
          
          if (textureFile) {
            // Créer un blob URL pour la texture
            return textureFile.async('blob').then(blob => {
              const objectUrl = URL.createObjectURL(blob);
              return this.textureLoader.load(objectUrl);
            });
          }
          return null;
        };

        // Charger OBJ avec MTL
        objLoader.load(
          url,
          (object) => resolve(object),
          (error) => reject(error)
        );
      } catch (error) {
        console.error('Erreur chargement MTL:', error);
        // Fallback: charger sans textures
        objLoader.load(url, resolve, reject);
      }
    } else {
      // Charger sans MTL
      objLoader.load(url, resolve, reject);
    }
  }

  /**
   * Charge un modèle GLTF avec textures externes
   */
  async loadGLTFWithTextures(mainFile, structure, virtualFS, url, resolve, reject) {
    const loader = this.loaders.gltf;

    // Créer un gestionnaire de texteures personnalisé
    const textureHandler = {
      loadTexture: (texturePath) => {
        // Chercher dans le ZIP
        const normalizedPath = texturePath.replace(/^\.\//, '');
        const textureFile = virtualFS.files.get(normalizedPath);
        
        if (textureFile) {
          return textureFile.async('blob').then(blob => {
            const objectUrl = URL.createObjectURL(blob);
            return this.textureLoader.load(objectUrl);
          });
        }
        return null;
      }
    };

    loader.load(
      url,
      (gltf) => {
        // Traiter les textures du GLTF
        const scene = gltf.scene;
        this.processGLTFTextures(scene, virtualFS);
        resolve(gltf);
      },
      (error) => reject(error)
    );
  }

  /**
   * Charge un modèle FBX avec textures externes
   */
  async loadFBXWithTextures(mainFile, structure, virtualFS, url, resolve, reject) {
    const loader = this.loaders.fbx;

    loader.load(
      url,
      (object) => {
        // Traiter les textures du FBX
        this.processFBXTextures(object, virtualFS);
        resolve(object);
      },
      (error) => reject(error)
    );
  }

  /**
   * Traite les textures d'un modèle GLTF
   */
  processGLTFTextures(scene, virtualFS) {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          // Vérifier les textures du matériau
          Object.keys(material).forEach(key => {
            if (material[key] && material[key].isTexture) {
              // Chercher la texture dans le ZIP
              const textureUrl = material[key].image?.src || material[key].image?.url;
              if (textureUrl) {
                const textureFile = virtualFS.files.get(textureUrl);
                if (textureFile) {
                  textureFile.async('blob').then(blob => {
                    const objectUrl = URL.createObjectURL(blob);
                    const texture = new THREE.TextureLoader().load(objectUrl);
                    material[key] = texture;
                  });
                }
              }
            }
          });
        });
      }
    });
  }

  /**
   * Traite les textures d'un modèle FBX
   */
  processFBXTextures(object, virtualFS) {
    object.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          // Vérifier les textures du matériau
          if (material.map && material.map.image) {
            const textureUrl = material.map.image.src || material.map.image.url;
            if (textureUrl) {
              const textureFile = virtualFS.files.get(textureUrl);
              if (textureFile) {
                textureFile.async('blob').then(blob => {
                  const objectUrl = URL.createObjectURL(blob);
                  const texture = new THREE.TextureLoader().load(objectUrl);
                  material.map = texture;
                  material.needsUpdate = true;
                });
              }
            }
          }
        });
      }
    });
  }
}

export default ZipModelLoader;