/**
 * ReportPDFHeader.jsx
 * ──────────────────────────────────────────────────────────────────────────
 * Header fixe pour tous les rapports PDF Agriyields.
 * Reproduit exactement la structure des PDFs reçus :
 *   [logo perroquet]   TITRE   [logo Agriyields]
 *   ──────── ligne verte ────────
 *   sous-titre centré
 */

import React from 'react';

const ReportPDFHeader = ({ title, subtitle }) => (
  <div style={{
    width: '100%',
    paddingBottom: '16px',
    marginBottom: '24px',
    borderBottom: '3px solid #2d7a2d',
  }}>
    {/* Ligne logo + titre */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '6px',
    }}>
      {/* Logo perroquet */}
      <img
        src="/logo.jpg"
        alt="Agriyields"
        style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '50%', border: '2px solid #e8f5e9' }}
        crossOrigin="anonymous"
      />

      {/* Titre */}
      <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
        <div style={{
          fontSize: '22px',
          fontWeight: '800',
          color: '#1a1a1a',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '4px',
            fontStyle: 'italic',
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Logo Agriyields texte */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: '#2d7a2d',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: '18px' }}>🌿</span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#2d7a2d', letterSpacing: '0.5px' }}>
          Agriyields
        </span>
      </div>
    </div>
  </div>
);

export default ReportPDFHeader;
