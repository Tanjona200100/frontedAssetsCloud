// src/components/UserDashboard/components/Pagination.jsx

import React from 'react';

export default function Pagination({
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex
}) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      borderTop: '1px solid rgba(255,255,255,.06)',
      flexWrap: 'wrap',
      gap: 8
    }}>
      <div style={{ 
        fontFamily: "'JetBrains Mono', monospace", 
        fontSize: 11, 
        color: 'var(--dim)'
      }}>
        {totalItems > 0 ? (
          <>
            {startIndex + 1} – {endIndex} / {totalItems}
            <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              (Page {currentPage}/{totalPages})
            </span>
          </>
        ) : (
          '0 assets'
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,.06)',
            background: 'transparent',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.3 : 0.7,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            transition: 'all 0.2s'
          }}
          title="Première page"
        >
          «
        </button>

        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,.06)',
            background: 'transparent',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.3 : 0.7,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.2s'
          }}
          title="Page précédente"
        >
          ‹
        </button>

        {(() => {
          const pageNumbers = [];
          const maxVisiblePages = 5;
          
          if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
              pageNumbers.push(i);
            }
          } else {
            if (currentPage <= 3) {
              for (let i = 1; i <= 5; i++) {
                pageNumbers.push(i);
              }
              pageNumbers.push('...');
              pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
              pageNumbers.push(1);
              pageNumbers.push('...');
              for (let i = totalPages - 4; i <= totalPages; i++) {
                pageNumbers.push(i);
              }
            } else {
              pageNumbers.push(1);
              pageNumbers.push('...');
              for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pageNumbers.push(i);
              }
              pageNumbers.push('...');
              pageNumbers.push(totalPages);
            }
          }
          return pageNumbers.map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--dim)',
                fontSize: 12
              }}>
                …
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: currentPage === pageNum ? '1px solid rgba(59,130,246,.4)' : '1px solid rgba(255,255,255,.06)',
                  background: currentPage === pageNum ? 'rgba(59,130,246,.15)' : 'transparent',
                  color: currentPage === pageNum ? '#3B82F6' : 'rgba(255,255,255,.7)',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s',
                  fontWeight: currentPage === pageNum ? '600' : '400'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== pageNum) {
                    e.currentTarget.style.background = 'rgba(255,255,255,.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== pageNum) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {pageNum}
              </button>
            )
          ));
        })()}

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,.06)',
            background: 'transparent',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.3 : 0.7,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.2s'
          }}
          title="Page suivante"
        >
          ›
        </button>

        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,.06)',
            background: 'transparent',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.3 : 0.7,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            transition: 'all 0.2s'
          }}
          title="Dernière page"
        >
          »
        </button>

        <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= totalPages) {
                setCurrentPage(val);
              }
            }}
            style={{
              width: 44,
              height: 28,
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,.1)',
              background: 'rgba(0,0,0,.3)',
              color: 'white',
              textAlign: 'center',
              fontSize: 12,
              outline: 'none'
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>/ {totalPages}</span>
        </div>
      </div>
    </div>
  );
}