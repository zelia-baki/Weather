/**
 * CarbonFarmPDF.jsx
 * ──────────────────────────────────────────────────────────────────────────
 * Template PDF pour le Carbon Report d'une FERME.
 * Ce composant est CACHÉ à l'écran (left: -9999px).
 * Largeur fixe 794 px = A4 @ 96 dpi → PDF toujours identique quel que soit l'écran.
 *
 * Différences farm vs forest :
 *  - entityLabel  : "Farm"
 *  - info affichée: farm_id, name, geolocation, crops
 *  - pas de tree_type
 */

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ReportPDFHeader from './ReportPDFHeader';

ChartJS.register(ArcElement, Tooltip, Legend);

// ── Palette couleurs ─────────────────────────────────────────────────────────
const GREEN  = '#2d7a2d';
const LGRAY  = '#f5f5f5';
const BORDER = '#d0e8d0';
const TEXT   = '#1a1a1a';
const MUTED  = '#555';

// ── Helpers styles ────────────────────────────────────────────────────────────
const sectionBox = {
  borderLeft: `4px solid ${GREEN}`,
  paddingLeft: '12px',
  marginBottom: '20px',
};

const sectionTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: GREEN,
  marginBottom: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12px',
};

const thStyle = {
  background: GREEN,
  color: '#fff',
  padding: '7px 12px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '11px',
};

const tdStyle = {
  padding: '7px 12px',
  borderBottom: `1px solid ${BORDER}`,
  color: TEXT,
  fontSize: '12px',
  verticalAlign: 'top',
};

const tdAlt = { ...tdStyle, background: LGRAY };

const badge = (color, bg) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '700',
  color,
  background: bg,
});

// ── Composant ────────────────────────────────────────────────────────────────
const CarbonFarmPDF = ({ pdfRef, farmInfo, geoData, mapboxUrl, areaInHectares, areaInSquareMeters }) => {
  if (!geoData || !Array.isArray(geoData)) return null;

  const grossEmissions  = geoData[0]?.data_fields?.gfw_forest_carbon_gross_emissions__Mg_CO2e  ?? 0;
  const grossRemovals   = geoData[1]?.data_fields?.gfw_forest_carbon_gross_removals__Mg_CO2e   ?? 0;
  const netFlux         = geoData[2]?.data_fields?.gfw_forest_carbon_net_flux__Mg_CO2e         ?? 0;
  const seqBelow        = geoData[3]?.data_fields?.gfw_reforestable_extent_belowground_carbon_potential_sequestration__Mg_C ?? 0;
  const seqAbove        = geoData[4]?.data_fields?.gfw_reforestable_extent_aboveground_carbon_potential_sequestration__Mg_C ?? 0;
  const coordinates     = geoData[0]?.coordinates?.[0];

  const netPositive = parseFloat(netFlux) >= 0;

  const pieData = {
    labels: ['Gross Emissions', 'Gross Removals', 'Net Flux', 'Sequestration'],
    datasets: [{
      data: [
        Math.abs(grossEmissions),
        Math.abs(grossRemovals),
        Math.abs(netFlux),
        Math.abs(seqBelow),
      ],
      backgroundColor : ['#e53935', '#43a047', '#fb8c00', '#00acc1'],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  const pieOptions = {
    responsive: false,
    animation: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { font: { size: 10 }, boxWidth: 14, padding: 10 },
      },
    },
  };

  const today = new Date().toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    /* ── Div caché, 794 px fixe ── */
    <div
      ref={pdfRef}
      style={{
        position   : 'fixed',
        left       : '-9999px',
        top        : '0',
        visibility : 'hidden',
        width      : '794px',
        minHeight  : '1123px',
        background : '#ffffff',
        fontFamily : "'Segoe UI', Arial, sans-serif",
        color      : TEXT,
        padding    : '40px 48px',
        boxSizing  : 'border-box',
      }}
    >
      {/* ── HEADER ── */}
      <ReportPDFHeader
        title="Carbon Emissions Assessment"
        subtitle={`Generated on ${today}  •  Regulation (EU) 2023/1115`}
      />

      {/* ── INFO FERME ── */}
      {farmInfo && (
        <div style={{ ...sectionBox, marginBottom: '24px' }}>
          <div style={sectionTitle}>Farm Information</div>
          <table style={table}>
            <tbody>
              <tr>
                <td style={tdAlt}><strong>Farm ID</strong></td>
                <td style={tdStyle}>{farmInfo.farm_id}</td>
                <td style={tdAlt}><strong>Owner</strong></td>
                <td style={tdStyle}>{farmInfo.name}</td>
              </tr>
              <tr>
                <td style={tdAlt}><strong>Geolocation</strong></td>
                <td style={tdStyle} colSpan={3}>{farmInfo.geolocation}</td>
              </tr>
              {farmInfo.crops?.length > 0 && (
                <tr>
                  <td style={tdAlt}><strong>Primary Crop</strong></td>
                  <td style={tdStyle}>{farmInfo.crops[0].crop}</td>
                  <td style={tdAlt}><strong>Land Type</strong></td>
                  <td style={tdStyle}>{farmInfo.crops[0].land_type}</td>
                </tr>
              )}
              {areaInHectares && (
                <tr>
                  <td style={tdAlt}><strong>Project Area</strong></td>
                  <td style={tdStyle} colSpan={3}>
                    {areaInSquareMeters?.toFixed(2)} m²  ({areaInHectares?.toFixed(2)} ha)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CARBON ASSESSMENT SUMMARY TABLE ── */}
      <div style={sectionBox}>
        <div style={sectionTitle}>Carbon Assessment Summary</div>
        <table style={table}>
          <thead>
            <tr>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Value (Mg CO₂e)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdAlt}>Carbon Gross Emissions</td>
              <td style={tdStyle}>
                <span style={badge('#fff', '#e53935')}>{Number(grossEmissions).toFixed(4)}</span>
              </td>
            </tr>
            <tr>
              <td style={tdAlt}>Carbon Gross Absorption (Removals)</td>
              <td style={tdStyle}>
                <span style={badge('#fff', '#43a047')}>{Number(grossRemovals).toFixed(4)}</span>
              </td>
            </tr>
            <tr>
              <td style={tdAlt}>Carbon Net Emissions</td>
              <td style={tdStyle}>
                <span style={badge('#fff', netPositive ? '#e53935' : '#43a047')}>
                  {Number(netFlux).toFixed(4)}
                </span>
              </td>
            </tr>
            <tr>
              <td style={tdAlt}>Carbon Sequestration Potential (Belowground)</td>
              <td style={tdStyle}>{Number(seqBelow).toFixed(4)} Mg C</td>
            </tr>
            <tr>
              <td style={tdAlt}>Carbon Sequestration Potential (Aboveground)</td>
              <td style={tdStyle}>{Number(seqAbove).toFixed(4)} Mg C</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PIE CHART + INTERPRÉTATION ── */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', margin: '24px 0' }}>
        <div style={{ flex: '0 0 auto' }}>
          <Pie data={pieData} options={pieOptions} width={260} height={220} />
        </div>
        <div style={{
          flex: 1,
          background: LGRAY,
          borderRadius: '8px',
          padding: '16px',
          fontSize: '12px',
          lineHeight: 1.7,
          color: MUTED,
        }}>
          <div style={{ fontWeight: '700', color: TEXT, marginBottom: '8px', fontSize: '13px' }}>
            Carbon Balance Interpretation
          </div>
          <p>
            <strong>Gross Emissions</strong> represent carbon released through land-use change and disturbances.
          </p>
          <p>
            <strong>Gross Removals</strong> represent carbon absorbed by forest growth and regeneration.
          </p>
          <p>
            <strong>Net Flux</strong> is the balance: a negative value indicates the area is a net carbon
            <span style={{ color: '#43a047', fontWeight: 700 }}> sink</span>; positive indicates a net
            <span style={{ color: '#e53935', fontWeight: 700 }}> source</span>.
          </p>
          <p style={{ marginTop: '8px', padding: '8px', background: netPositive ? '#fce4e4' : '#e8f5e9', borderRadius: '6px', fontWeight: '700', color: netPositive ? '#c62828' : '#2e7d32' }}>
            Status: {netPositive ? '⚠ Net Carbon Source' : '✓ Net Carbon Sink'}
          </p>
        </div>
      </div>

      {/* ── MAP ── */}
      {mapboxUrl && (
        <div style={{ ...sectionBox, marginTop: '8px' }}>
          <div style={sectionTitle}>Plot Map</div>
          <img
            src={mapboxUrl}
            alt="Farm map"
            crossOrigin="anonymous"
            style={{
              width: '100%',
              borderRadius: '8px',
              border: `2px solid ${BORDER}`,
              display: 'block',
            }}
          />
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: '32px',
        paddingTop: '12px',
        borderTop: `1px solid ${BORDER}`,
        textAlign: 'center',
        fontSize: '10px',
        color: '#999',
      }}>
        © 2025 Agriyields. Contact: nkusu@agriyields.com
      </div>
    </div>
  );
};

export default CarbonFarmPDF;
