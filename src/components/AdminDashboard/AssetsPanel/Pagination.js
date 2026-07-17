// components/AdminDashboard/AssetsPanel/Pagination.jsx

import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { ITEMS_PER_PAGE_OPTIONS } from './constants';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage = 15, onLimitChange, isLoading = false }) => {
  const effectiveTotalPages = totalPages > 0 ? totalPages : Math.ceil(totalItems / itemsPerPage);
  
  if (totalItems === 0 || (effectiveTotalPages === 1 && totalItems <= itemsPerPage)) {
    return null;
  }

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= effectiveTotalPages; i++) {
      if (i === 1 || i === effectiveTotalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      flexWrap: 'wrap',
      gap: 12,
      background: 'rgba(0,0,0,0.2)'
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: 'var(--dim)',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {isLoading ? (
          <>
            <span className="spinner-small" style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              border: '2px solid rgba(59,130,246,0.2)',
              borderTop: '2px solid #3B82F6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span>Chargement...</span>
          </>
        ) : (
          <span>{totalItems > 0 ? `${startItem}–${endItem} / ${totalItems}` : '0 fichier'}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            background: currentPage === 1 || isLoading ? 'transparent' : 'rgba(255,255,255,0.05)',
            color: currentPage === 1 || isLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
            cursor: currentPage === 1 || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          <MdChevronLeft size={18} />
        </button>

        {getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12
            }}>
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => !isLoading && onPageChange(page)}
              disabled={isLoading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: page === currentPage ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: page === currentPage ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: page === currentPage ? '#3B82F6' : 'rgba(255,255,255,0.6)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: page === currentPage ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            background: currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 'transparent' : 'rgba(255,255,255,0.05)',
            color: currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
            cursor: currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          <MdChevronRight size={18} />
        </button>
      </div>

      {onLimitChange && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{
            fontSize: 10,
            color: 'var(--dim)'
          }}>
            Par page:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value);
              onLimitChange(newLimit);
            }}
            disabled={isLoading}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 4,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {ITEMS_PER_PAGE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;