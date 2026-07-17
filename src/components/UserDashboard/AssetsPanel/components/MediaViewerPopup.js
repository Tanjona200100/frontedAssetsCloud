// src/components/UserDashboard/components/MediaViewerPopup.jsx

import React, { useState, useEffect, useRef } from 'react';
import { LiaExpandSolid, LiaCompressSolid } from 'react-icons/lia';
import { formatSize } from '../assets/utils';

export default function MediaViewerPopup({ asset, mediaUrl, mediaType, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);

  const toggleFullscreen = () => {
    const element = videoRef.current || document.querySelector('.media-viewer-content');
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen?.() || element.webkitRequestFullscreen?.() || element.msRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.msExitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="media-viewer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="media-viewer-content"
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <span style={{ fontSize: 20 }}>
              {mediaType === 'video' ? '🎬' : '🖼️'}
            </span>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: 14,
                color: '#fff',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {asset.title || asset.name}
              </div>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {formatSize(asset.file_size || asset.size)} • {mediaType === 'video' ? 'Vidéo' : 'Image'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: 36,
                height: 36,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <LiaCompressSolid /> : <LiaExpandSolid />}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: 36,
                height: 36,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              title="Fermer"
            >
              ×
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          minHeight: 0,
          position: 'relative'
        }}>
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              controls
              autoPlay
              playsInline
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px',
                background: '#000'
              }}
              onError={(e) => {
                console.error('Erreur lecture vidéo:', e);
              }}
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt={asset.title || asset.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                background: '#000'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div style="text-align:center;color:#666;">
                    <div style="font-size:48px;margin-bottom:12px;">🖼️</div>
                    <div>Impossible de charger l'image</div>
                  </div>
                `;
              }}
            />
          )}
        </div>

        <div style={{
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.6)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)'
        }}>
          <div>
            {mediaType === 'video' ? '▶️ Lecture en cours' : '👁️ Visualisation'}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>⌘ + F: Plein écran</span>
            <span>ESC: Fermer</span>
          </div>
        </div>
      </div>
    </div>
  );
}