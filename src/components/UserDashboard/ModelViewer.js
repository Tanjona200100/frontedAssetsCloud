// src/components/UserDashboard/ModelViewer.jsx
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://192.168.2.160:5000/api';

function ModelLoader({ assetId, token, fileName, assetExt, onLoad, onError }) {
  const [model, setModel] = useState(null);
  const loadAttemptedRef = useRef(false);
  
  // Stabilize callbacks to prevent infinite re-renders
  const stableOnLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);
  
  const stableOnError = useCallback((err) => {
    onError?.(err);
  }, [onError]);

  useEffect(() => {
    let isMounted = true;
    
    const loadModel = async () => {
      // Don't attempt to load if fileName is empty or not set
      if (!fileName || fileName === '') {
        console.warn('No fileName provided, skipping load');
        stableOnError(new Error('Nom de fichier non disponible'));
        return;
      }
      
      if (loadAttemptedRef.current) return;
      loadAttemptedRef.current = true;
      
      try {
        console.log('=== DÉBUT CHARGEMENT MODÈLE ===');
        console.log('assetId:', assetId);
        console.log('fileName:', fileName);
        console.log('assetExt:', assetExt);
        
        const url = `${API_BASE_URL}/assets/${assetId}/download`;
        console.log('URL téléchargement:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('Blob reçu, taille:', blob.size, 'bytes');
        
        // DÉTECTION D'EXTENSION AMÉLIORÉE
        let ext = '';
        
        // 1. assetExt prop (most reliable — comes from DB)
        if (!ext && assetExt) {
          ext = assetExt.toLowerCase().replace(/^\./, '');
          console.log('Extension depuis assetExt prop:', ext);
        }
        
        // 2. fileName
        if (!ext && fileName && fileName.includes('.')) {
          ext = fileName.split('.').pop()?.toLowerCase() || '';
          console.log('Extension depuis fileName:', ext);
        }
        
        // 3. Détection par magic bytes (premiers octets du fichier)
        if (!ext) {
          try {
            const arrayBuffer = await blob.slice(0, 20).arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const hex = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            const text = Array.from(uint8Array).map(b => String.fromCharCode(b)).join('');
            console.log('Magic bytes (hex):', hex);
            console.log('Magic bytes (text):', text);
            
            // GLB: 'glTF' en ASCII = 67 6C 54 46
            if (hex.startsWith('676C5446')) {
              ext = 'glb';
              console.log('Détecté GLB par magic bytes');
            }
            // OBJ: commence par 'o ', 'v ', 'f ', '#', 'mtllib'
            else if (text.startsWith('o ') || text.startsWith('v ') || text.startsWith('f ') || text.startsWith('#') || text.startsWith('mtllib')) {
              ext = 'obj';
              console.log('Détecté OBJ par magic bytes');
            }
            // FBX: 'Kay' en ASCII = 4B 61 79
            else if (hex.startsWith('4B617941')) {
              ext = 'fbx';
              console.log('Détecté FBX par magic bytes');
            }
            // GLTF JSON: commence par '{' ou '{"asset"'
            else if (text.startsWith('{') && text.includes('asset')) {
              ext = 'gltf';
              console.log('Détecté GLTF par magic bytes');
            }
          } catch (err) {
            console.warn('Erreur lecture magic bytes:', err);
          }
        }
        
        // 4. Essayer depuis le Content-Type
        if (!ext) {
          const contentType = response.headers.get('content-type');
          console.log('Content-Type:', contentType);
          
          if (contentType) {
            if (contentType.includes('model/gltf-binary')) ext = 'glb';
            else if (contentType.includes('model/gltf+json')) ext = 'gltf';
            else if (contentType.includes('model/gltf')) ext = 'gltf';
            else if (contentType.includes('object/obj')) ext = 'obj';
            else if (contentType.includes('application/octet-stream')) {
              console.warn('Content-Type est application/octet-stream');
            }
          }
        }
        
        console.log('Extension finale détectée:', ext);
        
        // Vérifier si une extension a été trouvée
        if (!ext) {
          throw new Error(`Impossible de déterminer le format du fichier. Formats acceptés: GLB, GLTF, OBJ, FBX`);
        }
        
        const supportedFormats = ['glb', 'gltf', 'obj', 'fbx'];
        if (!supportedFormats.includes(ext)) {
          throw new Error(`Format non supporté: ${ext}. Formats acceptés: GLB, GLTF, OBJ, FBX`);
        }
        
        const objectUrl = URL.createObjectURL(blob);
        console.log('Object URL créé:', objectUrl);
        
        let loader;
        switch (ext) {
          case 'glb':
          case 'gltf':
            loader = new GLTFLoader();
            break;
          case 'obj':
            loader = new OBJLoader();
            break;
          case 'fbx':
            loader = new FBXLoader();
            break;
          default:
            throw new Error(`Format non supporté: ${ext}`);
        }
        
        loader.load(
          objectUrl,
          (loadedModel) => {
            console.log('✅ Modèle chargé avec succès, type:', ext);
            let scene;
            
            if (loadedModel.scene) {
              scene = loadedModel.scene;
            } else if (loadedModel.isGroup || loadedModel.isObject3D) {
              scene = loadedModel;
            } else {
              scene = loadedModel;
            }
            
            // Appliquer des matériaux et ombres
            scene.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (!child.material) {
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0x88aaff,
                    roughness: 0.3,
                    metalness: 0.1
                  });
                } else if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat) {
                      mat.roughness = mat.roughness || 0.3;
                      mat.metalness = mat.metalness || 0.1;
                    }
                  });
                } else if (child.material) {
                  child.material.roughness = child.material.roughness || 0.3;
                  child.material.metalness = child.material.metalness || 0.1;
                }
              }
            });
            
            // Centrer et ajuster l'échelle
            const box = new THREE.Box3().setFromObject(scene);
            const center = box.getCenter(new THREE.Vector3());
            scene.position.sub(center);
            
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 3) {
              scene.scale.set(3/maxDim, 3/maxDim, 3/maxDim);
            } else if (maxDim < 0.5) {
              scene.scale.set(1.5/maxDim, 1.5/maxDim, 1.5/maxDim);
            }
            
            if (isMounted) {
              setModel(scene);
              stableOnLoad();
            }
            URL.revokeObjectURL(objectUrl);
          },
          (progress) => {
            if (progress.lengthComputable) {
              console.log(`Chargement: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`);
            }
          },
          (error) => {
            console.error('❌ Erreur loader:', error);
            stableOnError(new Error(`Erreur chargement: ${error.message || 'Fichier invalide'}`));
            URL.revokeObjectURL(objectUrl);
          }
        );
        
      } catch (err) {
        console.error('❌ Erreur chargement:', err);
        stableOnError(err);
      }
    };
    
    // Only load if we have all required data AND fileName is not empty
    if (assetId && token && fileName && fileName !== '') {
      loadModel();
    }
    
    return () => {
      isMounted = false;
    };
  }, [assetId, token, fileName, assetExt, stableOnLoad, stableOnError]); // Use stable callbacks
  
  if (!model) return null;
  return <primitive object={model} scale={1} />;
}

export default function ModelViewer({ assetId, assetName, token, assetExt, onClose }) {
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [assetInfo, setAssetInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const fetchAssetInfo = async () => {
      try {
        console.log('🔍 Récupération infos asset:', assetId);
        const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const asset = data.data || data;
          console.log('📦 Données asset reçues:', asset);
          
          // Essayer tous les champs possibles pour le nom
          const possibleNames = [
            asset.name,
            asset.filename,
            asset.original_filename,
            asset.file_name,
            asset.title,
            asset.originalName,
            asset.original_name
          ];
          
          const foundName = possibleNames.find(n => n && n.trim());
          console.log('✅ Nom trouvé:', foundName);
          
          if (foundName && foundName.trim()) {
            setFileName(foundName);
          } else if (assetExt && assetExt.trim()) {
            // Fallback: créer un nom avec l'extension
            const cleanExt = assetExt.replace(/^\./, '');
            setFileName(`model.${cleanExt}`);
          } else {
            setFileName('');
            setLoadError('Impossible de déterminer le nom du fichier');
          }
          
          setAssetInfo(asset);
        } else {
          console.error('❌ Erreur API:', response.status);
          if (assetExt && assetExt.trim()) {
            const cleanExt = assetExt.replace(/^\./, '');
            setFileName(`model.${cleanExt}`);
          } else {
            setFileName('');
            setLoadError(`Erreur API: ${response.status}`);
          }
        }
      } catch (err) {
        console.error('❌ Erreur récupération:', err);
        if (assetExt && assetExt.trim()) {
          const cleanExt = assetExt.replace(/^\./, '');
          setFileName(`model.${cleanExt}`);
        } else {
          setFileName('');
          setLoadError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (assetId && token) {
      fetchAssetInfo();
    } else {
      setLoading(false);
      setError('Informations manquantes');
    }
  }, [assetId, token, assetExt]);

  const handleDownload = async () => {
    try {
      const url = `${API_BASE_URL}/assets/${assetId}/download`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = assetName || assetInfo?.title || assetInfo?.name || `asset_${assetId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      setError(`Erreur téléchargement: ${err.message}`);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoadError(null);
    setLoading(true);
    setFileName('');
    // Force re-fetch
    window.location.reload();
  };

  const handleModelError = (err) => {
    console.error('Model loading error:', err);
    setError(err.message);
  };

  // Don't render ModelLoader if fileName is empty
  const shouldLoadModel = !loading && fileName && fileName !== '';

  return (
    <div className="model-viewer-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, color: 'white' }}>Visualisation 3D</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
            {assetName || assetInfo?.title || 'Modèle 3D'}
          </p>
          {fileName && (
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#666', fontFamily: 'monospace' }}>
              📄 {fileName}
            </p>
          )}
          {assetExt && (
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#A78BFA', fontFamily: 'monospace' }}>
              🎨 Extension: {assetExt}
            </p>
          )}
        </div>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: 28,
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: 8
        }}>×</button>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        {!error && !loadError ? (
          <Canvas 
            camera={{ position: [3, 2, 5], fov: 50 }} 
            shadows 
            style={{ background: '#1a1a2e' }}
            onCreated={({ gl }) => {
              gl.setClearColor(new THREE.Color(0x1a1a2e));
              // Éviter l'avertissement PCFSoftShadowMap
              gl.shadowMap.type = THREE.PCFShadowMap;
            }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize-width={1024} 
              shadow-mapSize-height={1024}
            />
            <pointLight position={[-3, 2, 4]} intensity={0.5} color="#88aaff" />
            <pointLight position={[3, 1, -2]} intensity={0.3} color="#ffaa88" />
            <spotLight position={[0, 5, 0]} intensity={0.3} />
            
            <gridHelper args={[10, 20, '#888888', '#444444']} position={[0, -1, 0]} />
            
            <Suspense fallback={
              <Html center>
                <div style={{ color: 'white', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                  <p>{loading ? 'Récupération des informations...' : 'Chargement du modèle 3D...'}</p>
                </div>
              </Html>
            }>
              {shouldLoadModel && (
                <ModelLoader
                  key={`${assetId}-${fileName}`}
                  assetId={assetId}
                  token={token}
                  fileName={fileName}
                  assetExt={assetExt}
                  onLoad={() => console.log('✅ Modèle chargé avec succès')}
                  onError={handleModelError}
                />
              )}
              {!shouldLoadModel && !loading && (
                <Html center>
                  <div style={{ color: '#ef4444', textAlign: 'center' }}>
                    <p>Impossible de charger le modèle</p>
                    <p style={{ fontSize: 12, marginTop: 8 }}>Nom de fichier manquant ou invalide</p>
                  </div>
                </Html>
              )}
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              zoomSpeed={1.2}
              rotateSpeed={1}
              panSpeed={0.8}
            />
            
            <Environment preset="city" />
          </Canvas>
        ) : (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#ef4444',
            maxWidth: '80%'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ marginTop: 12, fontWeight: 'bold' }}>Impossible d'afficher le modèle 3D</p>
            <p style={{ fontSize: 13, marginTop: 8, color: '#888' }}>
              {error || loadError}
            </p>
            <p style={{ fontSize: 12, marginTop: 12, color: '#888' }}>
              💡 <strong>Formats supportés:</strong> GLB, GLTF, OBJ, FBX
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={handleDownload} style={{ padding: '10px 20px', background: '#3B82F6', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
                📥 Télécharger
              </button>
              <button onClick={handleRetry} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
                🔄 Réessayer
              </button>
              <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        )}
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