// src/components/UserDashboard/components/ZipContentPopup.jsx

import React from 'react';
import { SUPPORTED_3D_FORMATS } from '../assets/constants';

export default function ZipContentPopup({ files, onClose, onSelectFile }) {
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
      'blend': '🎮', 'stl': '🎮', 'ply': '🎮', 'dae': '🎮',
      '3ds': '🎮', 'usd': '🎮', 'usdz': '🎮', 'usda': '🎮',
      'mtl': '📄', 'mat': '📄',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'webp': '🖼️',
      'tga': '🖼️', 'bmp': '🖼️', 'tiff': '🖼️', 'dds': '🖼️',
      'exr': '🖼️', 'hdr': '🖼️',
      'txt': '📝', 'json': '📋', 'xml': '📋'
    };
    return iconMap[ext] || '📄';
  };

  const getFileColor = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const modelExts = ['glb', 'gltf', 'obj', 'fbx', 'blend', 'stl', 'ply', 'dae', '3ds', 'usd', 'usdz'];
    const textureExts = ['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp', 'tiff', 'dds', 'exr', 'hdr'];
    
    if (modelExts.includes(ext)) return '#10b981';
    if (textureExts.includes(ext)) return '#3B82F6';
    if (ext === 'mtl' || ext === 'mat') return '#8B5CF6';
    return '#666';
  };

  const isModelFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return SUPPORTED_3D_FORMATS.includes(ext);
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
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
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
            💡 Cliquez sur un fichier modèle 3D pour le visualiser
          </span>
          <button onClick={onClose} style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}