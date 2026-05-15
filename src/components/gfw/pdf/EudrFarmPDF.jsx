/**
 * EudrFarmPDF.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Template PDF CACHÉ pour le rapport EUDR d'une FERME.
 * Largeur fixe 794 px = A4 @ 96 dpi → PDF identique quel que soit l'écran.
 *
 * ⚠ Tous les styles sont INLINE — html2canvas ignore les feuilles CSS externes
 *   et les classes Tailwind non purgées.
 *
 * Props :
 *   pdfRef      React.RefObject   ref pour html2canvas
 *   farmInfo    object            infos ferme (farm_id, name, subcounty…)
 *   reportData  object            données calculées par EudrReportSection
 *                                 + geoData brut
 *   mapboxUrl   string|null       URL image statique Mapbox 700px
 */

import React from 'react';
import ReportPDFHeader from './ReportPDFHeader';
import EudrComplianceTable from './EudrComplianceTable';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  green:      '#2d7a2d',
  greenLight: '#e8f5e9',
  greenBorder:'#a5d6a7',
  border:     '#d0e8d0',
  gray:       '#f5f5f5',
  text:       '#1a1a1a',
  muted:      '#666666',
};

// ── Styles communs ────────────────────────────────────────────────────────────
const SECTION = {
  borderLeft: `4px solid ${C.green}`,
  paddingLeft: '14px',
  marginBottom: '18px',
};

const SECTION_TITLE = {
  fontSize: '12px',
  fontWeight: '700',
  color: C.green,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
};

const BODY_TEXT = {
  fontSize: '11px',
  color: C.text,
  lineHeight: '1.55',
  margin: '0',
};

// ── Sections textuelles EUDR ──────────────────────────────────────────────────
const EUDR_ARTICLES = [
  {
    num: 1,
    title: 'RADD Alert (EUDR Article 2)',
    text:  'Applicable to most parts of Uganda, only parts of Lake Albert region neighbouring DRC Congo.',
  },
  {
    num: 2,
    title: 'Tree Cover Loss (EUDR, Article 2)',
    text:  'Area in which tree loss was identified since December 2020. Zero = Plot/Farm is fully compliant. Non-Zero = Plot/Farm likely non-compliant with EUDR Law.',
  },
  {
    num: 3,
    title: 'Forest Cover (EUDR, Article 2)',
    text:  'EU Joint Research Centre Geostore for checking existence of forest cover as of 2020. None detected = fully compliant. Forest detected = requires careful assessment.',
  },
  {
    num: 4,
    title: 'Tree Cover Extent (EUDR, Article 2)',
    text:  'Analysis of tree cover expressed in deciles (0–100) to evaluate forest coverage within the farm boundary.',
  },
  {
    num: 5,
    title: 'Tree Cover Loss Drivers (EUDR Article 10)',
    text:  'Identifies the primary causes of deforestation or forest degradation within and around the plot.',
  },
  {
    num: 6,
    title: 'Protected Area (EUDR Article 10)',
    text:  'Indicates if the plot is located within a gazetted protected area such as a national park, wetland, or game reserve.',
  },
  {
    num: 7,
    title: 'Indigenous and Community Lands (EUDR Article 10)',
    text:  'Determines whether the land overlaps with recognized indigenous or community land under the Landmark database.',
  },
];

// ── Compliance badge colours ──────────────────────────────────────────────────
const getComplianceTheme = (status) => {
  if (status === '100% Compliant')  return { bg: '#e8f5e9', color: '#1b5e20', icon: '✓' };
  if (status === 'Likely Compliant')return { bg: '#fff3e0', color: '#e65100', icon: '⚠' };
  if (status === 'Not Compliant')   return { bg: '#ffebee', color: '#b71c1c', icon: '✗' };
  return { bg: C.gray, color: C.muted, icon: '?' };
};

// ── Farm info row helper ──────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <tr>
    <td style={{
      padding: '6px 12px',
      background: C.greenLight,
      fontWeight: '600',
      fontSize: '11px',
      width: '30%',
      borderBottom: `1px solid ${C.border}`,
    }}>
      {label}
    </td>
    <td style={{
      padding: '6px 12px',
      fontSize: '11px',
      color: C.text,
      borderBottom: `1px solid ${C.border}`,
    }}>
      {value || 'N/A'}
    </td>
  </tr>
);

// ── Component ─────────────────────────────────────────────────────────────────
const EudrFarmPDF = ({ pdfRef, farmInfo, reportData, mapboxUrl }) => {
  // Extraire toutes les données calculées
  const {
    areaInSquareMeters,
    areaInHectares,
    raddAlertsArea        = 0,
    treeCoverLossArea     = 0,
    isJrcGlobalForestCover,
    complianceStatus      = {},
    protectedStatus       = {},
    indigenousStatus,
    coverExtentDecileData = {},
    tscDriverDriver       = {},
    wriTropicalTreeCoverAvg = 0,
    geoData               = {},
  } = reportData || {};

  const today = new Date().toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const compliance = getComplianceTheme(complianceStatus.status);

  return (
    <div
      ref={pdfRef}
      style={{
        position  : 'fixed',
        left      : '-9999px',
        top       : '0',
        visibility: 'hidden',
        width     : '794px',
        minHeight : '1123px',
        background: '#ffffff',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color     : C.text,
        padding   : '40px 48px',
        boxSizing : 'border-box',
      }}
    >
      {/* ── HEADER ── */}
      <ReportPDFHeader
        title="EUDR Compliance Report"
        subtitle={`Generated on ${today}  •  Regulation (EU) 2023/1115`}
      />

      {/* ── FARM INFO ── */}
      {farmInfo && (
        <div style={{ ...SECTION, marginBottom: '22px' }}>
          <div style={SECTION_TITLE}>Farm Information</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              <InfoRow label="Farm ID"     value={farmInfo.farm_id} />
              <InfoRow label="Owner"       value={farmInfo.name} />
              <InfoRow
                label="Location"
                value={[farmInfo.subcounty, farmInfo.district_name].filter(Boolean).join(', ')}
              />
              {farmInfo.geolocation && (
                <InfoRow label="GPS" value={farmInfo.geolocation} />
              )}
              {farmInfo.crops?.length > 0 && (
                <>
                  <InfoRow label="Primary Crop" value={farmInfo.crops[0].crop} />
                  <InfoRow label="Land Type"    value={farmInfo.crops[0].land_type} />
                </>
              )}
              {areaInHectares && (
                <InfoRow
                  label="Farm Area"
                  value={`${areaInHectares.toFixed(2)} ha  (${areaInSquareMeters?.toFixed(0)} m²)`}
                />
              )}
              <InfoRow label="Report Date" value={today} />
            </tbody>
          </table>
        </div>
      )}

      {/* ── COMPLIANCE BADGE ── */}
      <div style={{
        background  : compliance.bg,
        borderRadius: '8px',
        padding     : '14px 18px',
        marginBottom: '22px',
        display     : 'flex',
        alignItems  : 'center',
        gap         : '18px',
        border      : `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: '28px', fontWeight: '900', color: compliance.color }}>
          {compliance.icon}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: compliance.color, marginBottom: '4px' }}>
            {complianceStatus.status || 'Assessment Pending'}
          </div>
          {complianceStatus.description && (
            <div style={{ fontSize: '10px', color: C.muted, lineHeight: '1.4' }}>
              {complianceStatus.description}
            </div>
          )}
        </div>
      </div>

      {/* ── EUDR ARTICLE SECTIONS ── */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{
          fontSize: '13px', fontWeight: '700', color: C.text,
          marginBottom: '12px', paddingBottom: '6px',
          borderBottom: `2px solid ${C.green}`,
        }}>
          Regulatory Framework Summary
        </div>
        {EUDR_ARTICLES.map((a) => (
          <div key={a.num} style={{ ...SECTION, marginBottom: '10px' }}>
            <div style={SECTION_TITLE}>{a.num}. {a.title}</div>
            <p style={BODY_TEXT}>{a.text}</p>
          </div>
        ))}
      </div>

      {/* ── PAGE BREAK ── */}
      <div style={{ pageBreakAfter: 'always', height: '1px' }} />

      {/* ── COMPLIANCE TABLE ── */}
      <div style={{ ...SECTION, marginBottom: '24px' }}>
        <div style={SECTION_TITLE}>Summary Compliance Table</div>
        <EudrComplianceTable
          areaInSquareMeters    = {areaInSquareMeters}
          areaInHectares        = {areaInHectares}
          raddAlertsArea        = {raddAlertsArea}
          treeCoverLossArea     = {treeCoverLossArea}
          isJrcGlobalForestCover= {isJrcGlobalForestCover}
          complianceStatus      = {complianceStatus}
          protectedStatus       = {protectedStatus}
          indigenousStatus      = {indigenousStatus}
          coverExtentDecileData = {coverExtentDecileData}
          tscDriverDriver       = {tscDriverDriver}
          wriTropicalTreeCoverAvg={wriTropicalTreeCoverAvg}
        />
      </div>

      {/* ── RISK ASSESSMENT ── */}
      <div style={{ ...SECTION, marginBottom: '24px' }}>
        <div style={SECTION_TITLE}>Risk Assessment Breakdown</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 20px',
          fontSize: '11px',
        }}>
          {[
            ['Farm Area',               areaInHectares ? `${areaInHectares.toFixed(2)} ha` : 'N/A'],
            ['Tree Cover Loss',         `${treeCoverLossArea} ha`],
            ['Average Tree Cover',      `${wriTropicalTreeCoverAvg?.toFixed(1) || 0}%`],
            ['RADD Alerts',             `${raddAlertsArea} ha`],
            ['Deforestation Driver',    tscDriverDriver?.mostCommonValue || 'Unknown'],
            ['Compliance Status',       complianceStatus.status || 'Pending'],
          ].map(([label, val], i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              borderBottom: `1px solid ${C.border}`,
              padding: '5px 0',
            }}>
              <span style={{ color: C.muted }}>{label}</span>
              <span style={{
                fontWeight: '700',
                color: label === 'Compliance Status' ? compliance.color : C.text,
              }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAP ── */}
      {mapboxUrl && (
        <div style={{ ...SECTION, marginBottom: '24px' }}>
          <div style={SECTION_TITLE}>Plot Map — Satellite View</div>
          <img
            src={mapboxUrl}
            alt="Farm satellite map"
            crossOrigin="anonymous"
            style={{
              width       : '100%',
              borderRadius: '8px',
              border      : `2px solid ${C.border}`,
              display     : 'block',
            }}
          />
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{
        marginTop  : '32px',
        paddingTop : '12px',
        borderTop  : `1px solid ${C.border}`,
        textAlign  : 'center',
        fontSize   : '10px',
        color      : '#999',
      }}>
        © 2025 Agriyields  •  Contact: nkusu@agriyields.com  •  Regulation (EU) 2023/1115
      </div>
    </div>
  );
};

export default EudrFarmPDF;
