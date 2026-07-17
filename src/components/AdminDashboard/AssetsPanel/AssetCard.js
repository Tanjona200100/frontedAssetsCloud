// components/AdminDashboard/AssetsPanel/AssetCard.jsx

import { useState, useRef } from 'react';
import { 
  LiaEyeSolid, 
  LiaDownloadSolid, 
  LiaTrashAltSolid, 
  LiaUserSolid, 
  LiaExpandSolid,
  LiaFolderOpenSolid,
  LiaFileSolid,
  LiaFileVideoSolid,
  LiaFileImageSolid,
  LiaFileArchiveSolid,
  LiaCubeSolid
} from 'react-icons/lia';
import { 
  PiCubeLight, 
  PiFileZip, 
  PiFile, 
  PiImage, 
  PiVideo, 
  PiFolderOpen 
} from 'react-icons/pi';
import { 
  FaRegFile, 
  FaFile, 
  FaFileArchive, 
  FaFileVideo, 
  FaFileImage,
  FaCube 
} from 'react-icons/fa6';
import { 
  MdVisibility, 
  MdPublic, 
  MdLock, 
  MdGroup,
  MdImage,
  MdVideocam,
  MdFolder,
  MdFilePresent,
  MdFolderOpen
} from 'react-icons/md';
import { 
  HiOutlineFolder, 
  HiOutlineCube, 
  HiOutlineDocument,
  HiOutlinePhotograph,
  HiOutlineVideoCamera
} from 'react-icons/hi';
import { 
  BsFileZip, 
  BsFileImage, 
  BsFileEarmark,
  BsBox,
  BsEye
} from 'react-icons/bs';
import { 
  formatFileSize, 
  formatDate, 
  is3DModel, 
  isVideoFile, 
  isImageFile, 
  isZipFile, 
  isTextureFile, 
  isMaterialFile,
  getFileCategory,
  getFileIcon,
  getFileColor,
  getMediaContent
} from './utils';
import { API_BASE_URL } from './constants';

const AssetCard = ({ 
  asset, 
  isHovered, 
  onHover, 
  onView, 
  onDownload, 
  onDelete,
  isDownloading,
  isDeleting,
  videoRefs 
}) => {
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
    const videoElement = videoRefs.current?.[assetId];
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

  // Fonction pour obtenir l'icône du type de fichier
  const getTypeIcon = () => {
    if (isZIP) return <BsFileZip size={24} style={{ color: '#f59e0b' }} />;
    if (isVideo) return <FaFileVideo size={24} style={{ color: '#8B5CF6' }} />;
    if (isImage) return <FaFileImage size={24} style={{ color: '#3B82F6' }} />;
    if (is3D) return <PiCubeLight size={24} style={{ color: '#10b981' }} />;
    if (isTexture) return <BsFileImage size={24} style={{ color: '#3B82F6' }} />;
    if (isMaterial) return <FaFile size={24} style={{ color: '#8B5CF6' }} />;
    return <BsFileEarmark size={24} style={{ color: '#666' }} />;
  };

  // Fonction pour obtenir le badge de type
  const getTypeBadge = () => {
    if (isZIP) return { icon: <PiFileZip size={12} />, label: 'ZIP', color: '#f59e0b' };
    if (isVideo) return { icon: <PiVideo size={12} />, label: 'VIDÉO', color: '#8B5CF6' };
    if (isImage) return { icon: <PiImage size={12} />, label: 'IMAGE', color: '#3B82F6' };
    if (is3D) return { icon: <PiCubeLight size={12} />, label: '3D', color: '#10b981' };
    if (isTexture) return { icon: <PiImage size={12} />, label: 'TEXTURE', color: '#3B82F6' };
    if (isMaterial) return { icon: <FaFile size={12} />, label: 'MATÉRIAU', color: '#8B5CF6' };
    return { icon: <FaFile size={12} />, label: 'FICHIER', color: '#666' };
  };

  const typeBadge = getTypeBadge();

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
        onHover(null);
        if (isVideo) {
          handleVideoHover(asset.id, false);
        }
      }}
    >
      {/* Zone de preview */}
      <div
        onClick={() => onView(asset)}
        style={{
          height: 200,
          background: 'rgba(0,0,0,.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
      >
        {/* VIDÉO */}
        {isVideo && mediaUrl && (
          <>
            <video
              ref={el => { if (videoRefs.current) videoRefs.current[asset.id] = el; }}
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
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,.7)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 11,
              color: '#8B5CF6',
              border: '1px solid rgba(139,92,246,.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 2,
              pointerEvents: 'none'
            }}>
              <MdVideocam size={12} /> VIDÉO
            </div>
            {isHovered && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,.8)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                color: '#fff',
                whiteSpace: 'nowrap',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <BsEye size={12} style={{ marginRight: 4 }} /> Lecture en cours
              </div>
            )}
            <div style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
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

        {/* IMAGE */}
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
              <MdImage size={64} style={{ color: '#3B82F6', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: '#3B82F6' }}>Image</div>
            </div>
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,.7)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 11,
              color: '#3B82F6',
              border: '1px solid rgba(59,130,246,.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 2,
              pointerEvents: 'none'
            }}>
              <MdImage size={12} /> IMAGE
            </div>
            <div style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
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

        {/* ZIP */}
        {isZIP && !isVideo && !isImage && (
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
                <PiFileZip size={64} style={{ color: '#f59e0b', marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: '#f59e0b' }}>Archive 3D</div>
                <div style={{ fontSize: 10, color: '#666' }}>Contient un modèle 3D</div>
              </div>
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(0,0,0,.7)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 11,
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                zIndex: 2
              }}>
                <PiFileZip size={12} /> ZIP
              </div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#10b981',
                  whiteSpace: 'nowrap',
                  zIndex: 2
                }}>
                  <MdFolderOpen size={14} style={{ marginRight: 4 }} /> Explorer le contenu
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <PiFileZip size={64} style={{ color: '#f59e0b', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: '#f59e0b' }}>Archive 3D</div>
              <div style={{ fontSize: 10, color: '#666' }}>Contient un modèle 3D</div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#10b981',
                  whiteSpace: 'nowrap',
                  zIndex: 2
                }}>
                  <MdFolderOpen size={14} style={{ marginRight: 4 }} /> Explorer le contenu
                </div>
              )}
            </div>
          )
        )}

        {/* MODÈLES 3D */}
        {is3D && !isVideo && !isImage && !isZIP && (
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
                <HiOutlineCube size={64} style={{ color: '#3b82f6', marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: '#3b82f6' }}>Modèle 3D</div>
              </div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#10b981',
                  whiteSpace: 'nowrap',
                  zIndex: 2
                }}>
                  <BsEye size={12} style={{ marginRight: 4 }} /> Cliquer pour visualiser
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <HiOutlineCube size={64} style={{ color: '#3b82f6', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: '#3b82f6' }}>
                Modèle 3D
                {asset.ext && (
                  <span style={{ fontSize: 10, display: 'block', color: '#666' }}>
                    {asset.ext.toUpperCase()}
                  </span>
                )}
              </div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,.8)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#10b981',
                  whiteSpace: 'nowrap'
                }}>
                  <BsEye size={12} style={{ marginRight: 4 }} /> Cliquer pour visualiser
                </div>
              )}
            </div>
          )
        )}

        {/* TEXTURES */}
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
              <HiOutlinePhotograph size={64} style={{ color: '#3B82F6', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: '#3B82F6' }}>Texture</div>
            </div>
          )
        )}

        {/* MATÉRIAUX */}
        {isMaterial && !isVideo && !isImage && !is3D && !isZIP && (
          <div style={{ textAlign: 'center' }}>
            <HiOutlineDocument size={64} style={{ color: '#8B5CF6', marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: '#8B5CF6' }}>Matériau</div>
          </div>
        )}

        {/* AUTRES FICHIERS */}
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
            <div style={{ fontSize: 64, opacity: 0.5 }}>
              <BsFileEarmark size={64} style={{ color: '#666' }} />
            </div>
          )
        )}
      </div>

      {/* Informations */}
      <div style={{ padding: '14px' }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: 'white' }}>
          {asset.title || asset.name}
        </div>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
          {formatFileSize(asset.file_size || asset.size)} • {formatDate(asset.created_at)}
        </div>
        {asset.description && (
          <div style={{
            fontSize: 11,
            color: '#888',
            marginBottom: 10,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {asset.description}
          </div>
        )}
        
        <div style={{ fontSize: 10, marginBottom: 10, color: getFileColor(asset), display: 'flex', alignItems: 'center', gap: 4 }}>
          {getTypeIcon()} 
          <span>
            {fileCategory === '3d_model' ? 'Modèle 3D' : 
             fileCategory === 'archive' ? 'Archive 3D' :
             fileCategory === 'video' ? 'Vidéo' :
             fileCategory === 'image' ? 'Image' :
             fileCategory === 'texture' ? 'Texture' :
             fileCategory === 'material' ? 'Matériau' : 'Fichier'}
          </span>
          {fileCategory === '3d_model' && asset.ext && (
            <span style={{ fontSize: 9, color: '#666', marginLeft: 4 }}>
              ({asset.ext.toUpperCase()})
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          marginBottom: 8
        }}>
          {asset.category_name && (
            <span style={{
              fontSize: 9,
              background: 'rgba(59,130,246,.15)',
              color: '#3B82F6',
              padding: '2px 8px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <MdFolder size={10} /> {asset.category_name}
            </span>
          )}
          {asset.project_name && (
            <span style={{
              fontSize: 9,
              background: 'rgba(16,185,129,.15)',
              color: '#10B981',
              padding: '2px 8px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <HiOutlineFolder size={10} /> {asset.project_name}
            </span>
          )}
          {asset.first_name && (
            <span style={{
              fontSize: 9,
              background: 'rgba(139,92,246,.15)',
              color: '#8B5CF6',
              padding: '2px 8px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <LiaUserSolid size={10} />
              {asset.first_name} {asset.last_name || ''}
            </span>
          )}
          {isZIP && (
            <span style={{
              fontSize: 9,
              background: 'rgba(245,158,11,.15)',
              color: '#f59e0b',
              padding: '2px 8px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <PiFileZip size={10} /> ZIP
            </span>
          )}
          {isVideo && (
            <span style={{
              fontSize: 9,
              background: 'rgba(139,92,246,.15)',
              color: '#8B5CF6',
              padding: '2px 8px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <MdVideocam size={10} /> Vidéo
            </span>
          )}
          {isImage && !isTexture && (
            <span style={{
              fontSize: 9,
              background: 'rgba(59,130,246,.15)',
              color: '#3B82F6',
              padding: '2px 8px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <MdImage size={10} /> Image
            </span>
          )}
          <span style={{
            fontSize: 9,
            background: asset.visibility === 'public' ? 'rgba(16,185,129,.15)' : asset.visibility === 'team' ? 'rgba(59,130,246,.15)' : 'rgba(239,68,68,.15)',
            color: asset.visibility === 'public' ? '#10B981' : asset.visibility === 'team' ? '#3B82F6' : '#EF4444',
            padding: '2px 8px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            {asset.visibility === 'public' ? <MdPublic size={10} /> :
              asset.visibility === 'team' ? <MdGroup size={10} /> : <MdLock size={10} />}
            {asset.visibility === 'public' ? 'Public' :
              asset.visibility === 'team' ? 'Team' : 'Privé'}
          </span>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 8,
          borderTop: '1px solid rgba(255,255,255,.06)',
          paddingTop: 12,
          marginTop: 4
        }}>
          <button
            onClick={() => onView(asset)}
            style={{
              flex: 1,
              background: is3D || isZIP || isVideo || isImage ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.05)',
              border: 'none',
              padding: '7px',
              borderRadius: 6,
              color: is3D || isZIP || isVideo || isImage ? '#3B82F6' : '#666',
              cursor: is3D || isZIP || isVideo || isImage ? 'pointer' : 'default',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
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
            <LiaEyeSolid size={14} />
            {isZIP ? <> Explorer</> : 
             isVideo ? <><MdVideocam size={14} /> Lire</> : 
             isImage ? <><MdImage size={14} /> Voir</> : 
             is3D ? <> 3D Viewer</> : 'Preview'}
          </button>
          <button
            onClick={() => onDownload(asset)}
            disabled={isDownloading}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,.05)',
              border: 'none',
              padding: '7px 12px',
              borderRadius: 6,
              color: isDownloading ? '#666' : '#888',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) e.currentTarget.style.background = 'rgba(255,255,255,.1)';
            }}
            onMouseLeave={(e) => {
              if (!isDownloading) e.currentTarget.style.background = 'rgba(255,255,255,.05)';
            }}
            title="Télécharger"
          >
            {isDownloading ? (
              <span style={{ fontSize: '10px' }}>...</span>
            ) : (
              <LiaDownloadSolid size={14} />
            )}
          </button>

          <button
            onClick={() => onDelete(asset)}
            disabled={isDeleting}
            style={{
              flex: 1,
              background: 'rgba(220,38,38,.1)',
              border: 'none',
              padding: '7px 12px',
              borderRadius: 6,
              color: isDeleting ? '#666' : '#ef4444',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.background = 'rgba(220,38,38,.2)';
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.background = 'rgba(220,38,38,.1)';
            }}
            title="Supprimer"
          >
            {isDeleting ? (
              <span style={{ fontSize: '10px' }}>...</span>
            ) : (
              <LiaTrashAltSolid size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;