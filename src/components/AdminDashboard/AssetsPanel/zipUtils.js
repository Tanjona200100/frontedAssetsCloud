// components/AdminDashboard/AssetsPanel/zipUtils.js
import JSZip from 'jszip';
import { SUPPORTED_3D_FORMATS } from './constants';

export const extractZipContent = async (blob) => {
  if (!blob || blob.size === 0) {
    throw new Error('Le fichier ZIP est vide');
  }

  try {
    const zip = await JSZip.loadAsync(blob);
    const files = [];
    
    zip.forEach((relativePath, file) => {
      if (!file.dir) {
        const pathParts = relativePath.split('/');
        const filename = pathParts[pathParts.length - 1];
        const ext = filename.split('.').pop().toLowerCase();
        const folder = pathParts.slice(0, -1).join('/');

        files.push({
          filename: filename,
          path: relativePath,
          folder: folder || 'Racine',
          extension: ext,
          size: file._data?.uncompressedSize || 0
        });
      }
    });
    
    if (files.length === 0) {
      throw new Error('Le ZIP ne contient aucun fichier');
    }
    
    return files;
  } catch (error) {
    console.error('Erreur extraction ZIP:', error);
    if (error.message.includes('invalid') || error.message.includes('corrupt')) {
      throw new Error('Le fichier ZIP est corrompu ou invalide');
    }
    throw error;
  }
};

// Nouvelle fonction pour trouver le fichier 3D principal dans un ZIP
export const findMainModelFile = (files) => {
  // Ordre de priorité des formats
  const priorityFormats = ['glb', 'gltf', 'obj', 'fbx', 'stl', 'dae', 'ply', '3ds'];
  
  // Chercher d'abord les formats prioritaires
  for (const format of priorityFormats) {
    const found = files.find(f => f.extension === format);
    if (found) return found;
  }
  
  // Si rien n'est trouvé, prendre le premier fichier 3D
  const modelFiles = files.filter(f => SUPPORTED_3D_FORMATS.includes(f.extension));
  return modelFiles.length > 0 ? modelFiles[0] : null;
};

// Nouvelle fonction pour extraire uniquement les fichiers 3D
export const extractModelFiles = (files) => {
  return files.filter(f => SUPPORTED_3D_FORMATS.includes(f.extension));
};

// Nouvelle fonction pour extraire les textures
export const extractTextureFiles = (files) => {
  const textureExts = ['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 'dds', 'exr', 'hdr'];
  return files.filter(f => textureExts.includes(f.extension));
};

// Nouvelle fonction pour extraire les matériaux
export const extractMaterialFiles = (files) => {
  const materialExts = ['mtl', 'mat'];
  return files.filter(f => materialExts.includes(f.extension));
};

// Nouvelle fonction pour vérifier si un fichier est supporté par Babylon.js
export const isBabylonSupported = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  // Formats supportés par Babylon.js
  const babylonFormats = ['glb', 'gltf', 'obj', 'stl', 'ply', 'babylon'];
  return babylonFormats.includes(ext);
};