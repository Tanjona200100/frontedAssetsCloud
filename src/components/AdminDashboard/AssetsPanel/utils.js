// components/AdminDashboard/AssetsPanel/utils.js

import { SUPPORTED_3D_FORMATS } from './constants';

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const is3DModel = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  
  return SUPPORTED_3D_FORMATS.includes(ext) || 
         fileType === '3d_model' ||
         fileType === '3d' ||
         fileType === 'model' ||
         SUPPORTED_3D_FORMATS.some(format => name?.endsWith(`.${format}`));
};

export const isVideoFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  
  return fileType === 'video' ||
         fileType === 'mp4' ||
         fileType === 'video/mp4' ||
         ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv'].includes(ext) ||
         name?.endsWith('.mp4') ||
         name?.endsWith('.webm') ||
         name?.endsWith('.mov') ||
         name?.endsWith('.avi');
};

export const isImageFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  
  return fileType === 'image' ||
         fileType === 'image/png' ||
         fileType === 'image/jpeg' ||
         fileType === 'image/webp' ||
         ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'ico'].includes(ext) ||
         name?.endsWith('.jpg') ||
         name?.endsWith('.jpeg') ||
         name?.endsWith('.png') ||
         name?.endsWith('.webp') ||
         name?.endsWith('.gif');
};

export const isZipFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const fileType = asset.file_type?.toLowerCase();
  const name = asset.name?.toLowerCase();
  
  return ext === 'zip' || 
         fileType === 'zip' || 
         fileType === 'archive' ||
         name?.endsWith('.zip') ||
         name?.endsWith('.rar') ||
         name?.endsWith('.7z');
};

export const isTextureFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const name = asset.name?.toLowerCase();
  
  const textureExtensions = [
    'jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 
    'dds', 'exr', 'hdr', 'gif', 'psd', 'ai', 'svg',
    'raw', 'r3d', 'arw', 'cr2', 'cr3', 'nef', 'pef'
  ];
  
  return textureExtensions.includes(ext) || 
         name?.includes('texture') || 
         name?.includes('normal') || 
         name?.includes('rough') ||
         name?.includes('metal') ||
         name?.includes('ao') ||
         name?.includes('diffuse') ||
         name?.includes('albedo');
};

export const isMaterialFile = (asset) => {
  const ext = asset.ext?.toLowerCase().replace(/^\./, '');
  const name = asset.name?.toLowerCase();
  const materialExtensions = ['mtl', 'mat'];
  return materialExtensions.includes(ext) || 
         name?.includes('material') || 
         name?.includes('mtl');
};

export const getMediaContent = (asset) => {
  if (isVideoFile(asset)) {
    return { type: 'video', url: asset.video_url || asset.file_url || asset.capture_url };
  }
  if (isImageFile(asset)) {
    return { type: 'image', url: asset.image_url || asset.file_url || asset.capture_url };
  }
  return { type: 'none', url: null };
};

export const getFileCategory = (asset) => {
  if (isZipFile(asset)) return 'archive';
  if (isVideoFile(asset)) return 'video';
  if (isImageFile(asset)) return 'image';
  if (is3DModel(asset)) return '3d_model';
  if (isTextureFile(asset)) return 'texture';
  if (isMaterialFile(asset)) return 'material';
  return 'other';
};

export const getFileIcon = (asset) => {
  const category = getFileCategory(asset);
  switch (category) {
    case 'archive': return '📦';
    case 'video': return '🎬';
    case 'image': return '🖼️';
    case '3d_model': return '🎮';
    case 'texture': return '🖼️';
    case 'material': return '📄';
    default: return '📄';
  }
};

export const getFileColor = (asset) => {
  const category = getFileCategory(asset);
  switch (category) {
    case 'archive': return '#f59e0b';
    case 'video': return '#8B5CF6';
    case 'image': return '#3B82F6';
    case '3d_model': return '#10b981';
    case 'texture': return '#3B82F6';
    case 'material': return '#8B5CF6';
    default: return '#666';
  }
};