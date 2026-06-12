// src/components/UserDashboard/ModelViewer.jsx
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

function ModelLoader({ assetId, token, fileName, assetExt, onLoad, onError }) {
  const [model, setModel] = useState(null);
  const loadAttemptedRef = useRef(false);
  
  const stableOnLoad = useCallback(() => onLoad?.(), [onLoad]);
  const stableOnError = useCallback((err) => onError?.(err), [onError]);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;
    
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
                  child.material.roughness = child.material.roughness || 0.3;
                  child.material.metalness = child.material.metalness || 0.1;
                }
              }
            });
            
            const box = new THREE.Box3().setFromObject(scene);
            const center = box.getCenter(new THREE.Vector3());
            scene.position.sub(center);

const size = box.getSize(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);

// Calcul du scale - version simplifiée pour très petit
let scale;
if (maxDim > 0) {
  scale = 1.2 / maxDim;  // Facteur 1.2 = très petit
  // Limiter pour éviter les extrêmes
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
    };
  }, [assetId, token, fileName, assetExt, stableOnLoad, stableOnError]);
  
  if (!model) return null;
  return <primitive object={model} scale={1} />;
}

export default function ModelViewer({ assetId, assetName, token, assetExt, assetData, onClose }) {
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [assetInfo, setAssetInfo] = useState(assetData || null);

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
      {/* Header avec effet flou */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #f1f1f1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff' }}>Visualisation 3D</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#fff' }}>
            {assetInfo?.title || assetName || 'Modèle 3D'}
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(0,0,0,0.05)',
          border: 'none',
          color: '#f1f1f1',
          fontSize: 24,
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: 8,
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}>
          ×
        </button>
      </div>
      
      {/* Contenu principal avec effet portrait */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Zone 3D - 70% */}
        <div style={{ flex: 7, position: 'relative', zIndex: 1 }}>
          {!error ? (
            <Canvas 
              shadows 
              style={{ background: '#e5e5e5' }} 
              onCreated={({ gl, camera }) => {
                gl.shadowMap.type = THREE.PCFShadowMap;
                gl.setClearColor(0xe5e5e5, 1);
                // Ajuster la position de la caméra pour un meilleur cadrage par défaut
                camera.position.set(1, 1.5, 4);
                camera.lookAt(0, 0, 0);
              }}
            >
              <PerspectiveCamera 
                makeDefault 
                position={[2, 1.5, 3]} 
                fov={45} 
              />
              
              {/* Lumières adaptées */}
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
                    key={assetId}
                    assetId={assetId}
                    token={token}
                    fileName={fileName}
                    assetExt={assetExt}
                    onLoad={() => console.log('Modèle chargé')}
                    onError={handleModelError}
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
              borderRadius: 16
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ marginTop: 12 }}>Erreur: {error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', background: '#3B82F6', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer' }}>
                Réessayer
              </button>
            </div>
          )}
        </div>
        
        {/* Panneau d'informations - 30% avec effet flou */}
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