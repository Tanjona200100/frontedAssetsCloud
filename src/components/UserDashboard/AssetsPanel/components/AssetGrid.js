// src/components/UserDashboard/components/AssetGrid.jsx

import React, { useRef } from 'react';
import AssetCard from './AssetCard';

export default function AssetGrid({
  assets,
  downloadingId,
  onOpenPreview,
  onDownload,
  onEdit,
  onDelete,
  canDelete,
  canEdit,
  hoveredAssetId,
  setHoveredAssetId
}) {
  const videoRefs = useRef({});

  if (assets.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
        <div>Aucun asset trouvé</div>
      </div>
    );
  }

  return (
    <div className="assets-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      padding: '18px'
    }}>
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          isHovered={hoveredAssetId === asset.id}
          onHover={(id) => setHoveredAssetId(id)}
          onLeave={() => setHoveredAssetId(null)}
          onOpenPreview={onOpenPreview}
          onDownload={onDownload}
          onEdit={onEdit}
          onDelete={onDelete}
          downloadingId={downloadingId}
          canDelete={canDelete(asset)}
          canEdit={canEdit(asset)}
          videoRefs={videoRefs}
        />
      ))}
    </div>
  );
}