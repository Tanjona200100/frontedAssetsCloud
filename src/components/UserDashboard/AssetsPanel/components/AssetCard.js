// src/components/UserDashboard/components/AssetCard.jsx

import React from 'react';
import { 
  LiaEyeSolid, 
  LiaDownloadSolid, 
  LiaTrashAltSolid, 
  LiaEditSolid, 
  LiaExpandSolid,
  LiaFolderOpenSolid,
  LiaPlayCircleSolid,
  LiaImageSolid,
  LiaCubeSolid,
  LiaFileArchiveSolid,
  LiaFileSolid,
  LiaLockSolid,
  LiaGlobeSolid,
  LiaTagSolid
} from 'react-icons/lia';
import { PiCubeLight } from 'react-icons/pi';
import { FaRegFile } from 'react-icons/fa6';
import { API_BASE_URL } from '../assets/constants';
import { 
  is3DModel, isZipFile, isVideoFile, isImageFile, 
  isTextureFile, isMaterialFile, getFileCategory, 
  getFileIcon, getFileColor, getMediaContent,
  formatSize, formatDate 
} from '../assets/utils';

export default function AssetCard({
  asset,
  isHovered,
  onHover,
  onLeave,
  onOpenPreview,
  onDownload,
  onEdit,
  onDelete,
  downloadingId,
  canDelete,
  canEdit,
  videoRefs
}) {
  const is3D = is3DModel(asset);
  const isZIP = isZipFile(asset);
  const isVideo = isVideoFile(asset);
  const isImage = isImageFile(asset);
  const isTexture = isTextureFile(asset);
  const isMaterial = isMaterialFile(asset);
  const fileCategory = getFileCategory(asset);

  const mediaContent = getMediaContent(asset);
  const mediaUrl = mediaContent.url ? `${API_BASE_URL.replace('/api', '')}${mediaContent.url}` : null;
  const isMedia = mediaContent.type !== 'none' && mediaUrl;

  const handleVideoHover = (assetId, isHovering) => {
    const videoElement = videoRefs.current[assetId];
    if (videoElement) {
      if (isHovering) {
        videoElement.play().catch(err => {
          console.warn('La lecture automatique a été bloquée:', err);
        });
      } else {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
    }
  };

  return (
    <div
      style={{
        background: 'rgba(0,0,0,.3)',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${isHovered ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.06)'}`,
        transition: 'transform 0.2s, border-color 0.2s',
        transform: isHovered ? 'translateY(-4px)' : 'none'
      }}
      onMouseEnter={() => {
        onHover(asset.id);
        if (isVideo) {
          handleVideoHover(asset.id, true);
        }
      }}
      onMouseLeave={() => {
        onLeave();
        if (isVideo) {
          handleVideoHover(asset.id, false);
        }
      }}
    >
      <div
        onClick={() => onOpenPreview(asset)}
        style={{
          height: 180,
          background: 'rgba(0,0,0,.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
      >
        {isVideo && mediaUrl && (
          <>
            <video
              ref={el => { videoRefs.current[asset.id] = el; }}
              src={mediaUrl}
              muted
              loop
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,.7)',
              backdropFilter: 'blur(4px)',
              padding: '3px 8px',
              borderRadius: 10,
              fontSize: 10,
              color: '#8B5CF6',
              border: '1px solid rgba(139,92,246,.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 2,
              pointerEvents: 'none'
            }}>
              <LiaPlayCircleSolid size={10} /> VIDÉO
            </div>
            {isHovered && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,.8)',
                padding: '4px 12px',
                borderRadius: 16,
                fontSize: 10,
                color: '#fff',
                whiteSpace: 'nowrap',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <LiaPlayCircleSolid size={10} style={{ marginRight: 4 }} /> Lecture en cours
              </div>
            )}
            <div style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: 'rgba(0,0,0,.7)',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              zIndex: 2,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <LiaExpandSolid size={12} /> Agrandir
            </div>
          </>
        )}

        {isImage && mediaUrl && (
          <>
            <img
              src={mediaUrl}
              alt={`Aperçu de ${asset.title || asset.name}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                const fallback = parent.querySelector('.image-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="image-fallback" style={{ display: 'none', textAlign: 'center' }}>
              <LiaImageSolid size={48} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: '#3B82F6' }}>Image</div>
            </div>
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,.7)',
              backdropFilter: 'blur(4px)',
              padding: '3px 8px',
              borderRadius: 10,
              fontSize: 10,
              color: '#3B82F6',
              border: '1px solid rgba(59,130,246,.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 2,
              pointerEvents: 'none'
            }}>
              <LiaImageSolid size={10} /> IMAGE
            </div>
            <div style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: 'rgba(0,0,0,.7)',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              zIndex: 2,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <LiaExpandSolid size={12} /> Agrandir
            </div>
          </>
        )}

        {is3D && !isVideo && !isImage && (
          asset.capture_url ? (
            <>
              <img
                src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                alt={`Aperçu de ${asset.title || asset.name}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.querySelector('.default-3d-preview').style.display = 'flex';
                }}
              />
              <div className="default-3d-preview" style={{ display: 'none', textAlign: 'center' }}>
                <PiCubeLight size={48} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 11, color: '#3b82f6' }}>Modèle 3D</div>
              </div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 10,
                  color: '#10b981',
                  whiteSpace: 'nowrap',
                  zIndex: 2
                }}>
                  <LiaEyeSolid size={10} style={{ marginRight: 4 }} /> Visualiser
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <PiCubeLight size={48} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: '#3b82f6' }}>
                Modèle 3D
                {asset.ext && (
                  <span style={{ fontSize: 9, display: 'block', color: '#666' }}>
                    {asset.ext.toUpperCase()}
                  </span>
                )}
              </div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 10,
                  color: '#10b981',
                  whiteSpace: 'nowrap'
                }}>
                  <LiaEyeSolid size={10} style={{ marginRight: 4 }} /> Visualiser
                </div>
              )}
            </div>
          )
        )}

        {isZIP && (
          asset.capture_url ? (
            <>
              <img
                src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
                alt={`Aperçu de ${asset.title || asset.name}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.querySelector('.default-zip-preview').style.display = 'flex';
                }}
              />
              <div className="default-zip-preview" style={{ display: 'none', textAlign: 'center' }}>
                <LiaFileArchiveSolid size={48} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 11, color: '#f59e0b' }}>Archive 3D</div>
              </div>
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,.7)',
                backdropFilter: 'blur(4px)',
                padding: '3px 8px',
                borderRadius: 10,
                fontSize: 10,
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                zIndex: 2
              }}>
                <LiaFileArchiveSolid size={10} /> ZIP
              </div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 10,
                  color: '#10b981',
                  whiteSpace: 'nowrap',
                  zIndex: 2
                }}>
                  <LiaFolderOpenSolid size={10} style={{ marginRight: 4 }} /> Explorer
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <LiaFileArchiveSolid size={48} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: '#f59e0b' }}>Archive 3D</div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 10,
                  color: '#10b981',
                  whiteSpace: 'nowrap',
                  zIndex: 2
                }}>
                  <LiaFolderOpenSolid size={10} style={{ marginRight: 4 }} /> Explorer
                </div>
              )}
            </div>
          )
        )}

        {isTexture && !isVideo && !isImage && !is3D && !isZIP && (
          asset.capture_url ? (
            <img
              src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
              alt={`Aperçu de ${asset.title || asset.name}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <LiaImageSolid size={48} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: '#3B82F6' }}>Texture</div>
            </div>
          )
        )}

        {isMaterial && !isVideo && !isImage && !is3D && !isZIP && (
          <div style={{ textAlign: 'center' }}>
            <LiaFileSolid size={48} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 11, color: '#8B5CF6' }}>Matériau</div>
          </div>
        )}

        {!isVideo && !isImage && !is3D && !isZIP && !isTexture && !isMaterial && (
          asset.capture_url ? (
            <img
              src={`${API_BASE_URL.replace('/api', '')}${asset.capture_url}`}
              alt={`Aperçu de ${asset.title || asset.name}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          ) : (
            <FaRegFile size={48} opacity={0.5} />
          )
        )}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 2, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.title || asset.name}
        </div>
        <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>
          {formatSize(asset.file_size || asset.size)} • {formatDate(asset.created_at)}
        </div>
        
        <div style={{ fontSize: 9, marginBottom: 6, color: getFileColor(asset) }}>
          {getFileIcon(asset)} {fileCategory === '3d_model' ? 'Modèle 3D' : 
             fileCategory === 'archive' ? 'Archive 3D' :
             fileCategory === 'video' ? 'Vidéo' :
             fileCategory === 'image' ? 'Image' :
             fileCategory === 'texture' ? 'Texture' :
             fileCategory === 'material' ? 'Matériau' : 'Fichier'}
        </div>

        <div style={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          marginBottom: 6
        }}>
          <span style={{
            fontSize: 8,
            background: asset.visibility === 'public' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
            color: asset.visibility === 'public' ? '#10B981' : '#EF4444',
            padding: '1px 6px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 3
          }}>
            {asset.visibility === 'public' ? <LiaGlobeSolid size={8} /> : <LiaLockSolid size={8} />}
            {asset.visibility === 'public' ? 'Public' : 'Privé'}
          </span>
          {isZIP && (
            <span style={{
              fontSize: 8,
              background: 'rgba(245,158,11,.15)',
              color: '#f59e0b',
              padding: '1px 6px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              <LiaFileArchiveSolid size={8} /> ZIP
            </span>
          )}
          {is3D && !isZIP && (
            <span style={{
              fontSize: 8,
              background: 'rgba(16,185,129,.15)',
              color: '#10b981',
              padding: '1px 6px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              <LiaCubeSolid size={8} /> 3D
            </span>
          )}
          {isVideo && (
            <span style={{
              fontSize: 8,
              background: 'rgba(139,92,246,.15)',
              color: '#8B5CF6',
              padding: '1px 6px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              <LiaPlayCircleSolid size={8} /> Vidéo
            </span>
          )}
          {isImage && !isTexture && (
            <span style={{
              fontSize: 8,
              background: 'rgba(59,130,246,.15)',
              color: '#3B82F6',
              padding: '1px 6px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              <LiaImageSolid size={8} /> Image
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 4,
          borderTop: '1px solid rgba(255,255,255,.06)',
          paddingTop: 6
        }}>
          <button
            onClick={() => onOpenPreview(asset)}
            style={{
              flex: 1,
              background: is3D || isZIP || isVideo || isImage ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.05)',
              border: 'none',
              padding: '4px 6px',
              borderRadius: 4,
              color: is3D || isZIP || isVideo || isImage ? '#3B82F6' : '#666',
              cursor: is3D || isZIP || isVideo || isImage ? 'pointer' : 'default',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'background 0.2s',
              opacity: is3D || isZIP || isVideo || isImage ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (is3D || isZIP || isVideo || isImage) {
                e.currentTarget.style.background = 'rgba(59,130,246,.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (is3D || isZIP || isVideo || isImage) {
                e.currentTarget.style.background = 'rgba(59,130,246,.15)';
              }
            }}
          >
            <LiaEyeSolid size={12} />
          </button>
          <button
            onClick={() => onDownload(asset)}
            disabled={downloadingId === asset.id}
            style={{
              flex: 1,
              background: downloadingId === asset.id ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.05)',
              border: 'none',
              padding: '4px 6px',
              borderRadius: 4,
              color: downloadingId === asset.id ? '#3B82F6' : '#888',
              cursor: downloadingId === asset.id ? 'wait' : 'pointer',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (downloadingId !== asset.id) {
                e.currentTarget.style.background = 'rgba(255,255,255,.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (downloadingId !== asset.id) {
                e.currentTarget.style.background = 'rgba(255,255,255,.05)';
              }
            }}
            title={downloadingId === asset.id ? 'Téléchargement en cours...' : 'Télécharger'}
          >
            {downloadingId === asset.id ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="spinner" style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  border: '2px solid #3B82F6',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              </span>
            ) : (
              <LiaDownloadSolid size={12} />
            )}
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(asset)}
              style={{
                flex: 1,
                background: 'rgba(59,130,246,.1)',
                border: 'none',
                padding: '4px 6px',
                borderRadius: 4,
                color: '#3B82F6',
                cursor: 'pointer',
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,.1)'}
              title="Modifier"
            >
              <LiaEditSolid size={12} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(asset)}
              style={{
                flex: 1,
                background: 'rgba(220,38,38,.1)',
                border: 'none',
                padding: '4px 6px',
                borderRadius: 4,
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,38,38,.1)'}
              title="Supprimer"
            >
              <LiaTrashAltSolid size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}