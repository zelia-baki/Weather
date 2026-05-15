/**
 * EudrComplianceTable.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Table de conformité EUDR avec STYLES INLINE uniquement.
 * html2canvas ne lit pas les classes Tailwind/CSS externes —
 * tout doit être en style inline pour que le PDF soit fidèle.
 *
 * Props :
 *   areaInSquareMeters  number
 *   areaInHectares      number
 *   raddAlertsArea      number
 *   treeCoverLossArea   number
 *   isJrcGlobalForestCover  string
 *   complianceStatus    { status, description }
 *   protectedStatus     { counts, percentages }
 *   indigenousStatus    string
 *   coverExtentDecileData  { nonZeroCount, percentageCoverExtent, valueCountArray }
 *   tscDriverDriver     { mostCommonValue, frequencyCounts }
 *   wriTropicalTreeCoverAvg  number
 */

import React from 'react';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  green:     '#2d7a2d',
  greenLight:'#e8f5e9',
  greenBorder:'#a5d6a7',
  gray:      '#f5f5f5',
  border:    '#d0e8d0',
  text:      '#1a1a1a',
  muted:     '#555555',
  red:       '#c62828',
  orange:    '#e65100',
};

// ── Driver lookup ─────────────────────────────────────────────────────────────
const DRIVER_MAP = {
  1: 'Commodity driven deforestation',
  2: 'Shifting Agriculture',
  3: 'Forestry',
  4: 'Wildfire',
  5: 'Urbanization',
};

const getDriver = (v) => DRIVER_MAP[v] || (v ? String(v) : 'Unknown');

// ── Protected area label ──────────────────────────────────────────────────────
const getProtectedLabel = (key) => ({
  '0':       'Not in WDPA protected area',
  '1':       'In WDPA protected area',
  '2':       'In IUCN vulnerable area',
  'No Data': 'No data available',
}[key] ?? `Category ${key}`);

// ── Compliance colours ────────────────────────────────────────────────────────
const complianceStyle = (status) => {
  if (status === '100% Compliant')  return { color: '#1b5e20', background: '#e8f5e9' };
  if (status === 'Likely Compliant')return { color: '#e65100', background: '#fff3e0' };
  if (status === 'Not Compliant')   return { color: '#b71c1c', background: '#ffebee' };
  return { color: C.muted, background: C.gray };
};

// ── Base cell styles ──────────────────────────────────────────────────────────
const TH = {
  padding: '9px 14px',
  background: C.green,
  color: '#fff',
  fontWeight: '700',
  fontSize: '11px',
  textAlign: 'left',
  letterSpacing: '0.3px',
};

const TD_LABEL = {
  padding: '8px 14px',
  background: C.greenLight,
  fontWeight: '600',
  fontSize: '11px',
  color: C.text,
  width: '38%',
  borderBottom: `1px solid ${C.border}`,
  verticalAlign: 'top',
};

const TD_VALUE = {
  padding: '8px 14px',
  fontSize: '11px',
  color: C.text,
  borderBottom: `1px solid ${C.border}`,
  verticalAlign: 'top',
  lineHeight: '1.5',
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ text, color = '#fff', bg = C.green }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 9px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '700',
    color,
    background: bg,
  }}>
    {text}
  </span>
);

// ── Component ─────────────────────────────────────────────────────────────────
const EudrComplianceTable = ({
  areaInSquareMeters,
  areaInHectares,
  raddAlertsArea       = 0,
  treeCoverLossArea    = 0,
  isJrcGlobalForestCover,
  complianceStatus     = {},
  protectedStatus      = {},
  indigenousStatus,
  coverExtentDecileData = {},
  tscDriverDriver      = {},
  wriTropicalTreeCoverAvg = 0,
}) => {
  const lossRatio = (treeCoverLossArea && areaInHectares && areaInHectares > 0)
    ? ((treeCoverLossArea / areaInHectares) * 100).toFixed(2)
    : '0.00';

  const compStyle   = complianceStyle(complianceStatus.status);
  const forestDetected = isJrcGlobalForestCover?.toLowerCase().includes('detected');
  const protectedEntries = protectedStatus?.percentages
    ? Object.entries(protectedStatus.percentages)
    : [];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${C.border}` }}>
      <thead>
        <tr>
          <th style={TH}>Metric</th>
          <th style={{ ...TH, width: '62%' }}>Value / Assessment</th>
        </tr>
      </thead>
      <tbody>

        {/* Project Area */}
        <tr>
          <td style={TD_LABEL}>Project Area</td>
          <td style={TD_VALUE}>
            {areaInHectares
              ? <><strong>{areaInHectares.toFixed(2)} ha</strong>  ({areaInSquareMeters?.toFixed(0)} m²)</>
              : 'Not available'}
          </td>
        </tr>

        {/* Deforestation Risk */}
        <tr>
          <td style={TD_LABEL}>Country Deforestation Risk</td>
          <td style={TD_VALUE}>
            <Badge text="STANDARD" bg={C.green} />
            <span style={{ marginLeft: '8px', color: C.muted }}>
              Tree loss ratio: <strong>{lossRatio}%</strong>
            </span>
          </td>
        </tr>

        {/* RADD Alert */}
        <tr>
          <td style={TD_LABEL}>RADD Alert</td>
          <td style={{ ...TD_VALUE, color: raddAlertsArea === 0 ? '#1b5e20' : C.red, fontWeight: '600' }}>
            {raddAlertsArea === 0
              ? '0 ha — No RADD alert detected ✓'
              : `${raddAlertsArea} ha — Alert detected ⚠`}
          </td>
        </tr>

        {/* Tree Cover Loss */}
        <tr>
          <td style={TD_LABEL}>Tree Cover Loss (since 2020)</td>
          <td style={{ ...TD_VALUE, color: treeCoverLossArea === 0 ? '#1b5e20' : C.red, fontWeight: '600' }}>
            {treeCoverLossArea === 0
              ? '0 ha — No tree cover loss detected ✓'
              : `${treeCoverLossArea} ha of tree cover loss detected ⚠`}
          </td>
        </tr>

        {/* Forest Cover JRC */}
        <tr>
          <td style={TD_LABEL}>Forest Cover (JRC 2020)</td>
          <td style={{ ...TD_VALUE, color: forestDetected ? C.orange : '#1b5e20', fontWeight: '600' }}>
            {isJrcGlobalForestCover || 'No data available'}
          </td>
        </tr>

        {/* EUDR Compliance */}
        <tr>
          <td style={TD_LABEL}>EUDR Compliance Assessment</td>
          <td style={{ ...TD_VALUE, background: compStyle.background }}>
            <div style={{ fontWeight: '800', fontSize: '12px', color: compStyle.color, marginBottom: '4px' }}>
              {complianceStatus.status || 'Assessment Pending'}
            </div>
            {complianceStatus.description && (
              <div style={{ fontSize: '10px', color: C.muted, lineHeight: '1.4' }}>
                {complianceStatus.description}
              </div>
            )}
          </td>
        </tr>

        {/* Protected Area */}
        <tr>
          <td style={TD_LABEL}>Protected Area Status</td>
          <td style={TD_VALUE}>
            {protectedEntries.length > 0
              ? protectedEntries.map(([key, pct]) => (
                  <div key={key} style={{ marginBottom: '2px' }}>
                    {getProtectedLabel(key)}: <strong>{pct}</strong>
                  </div>
                ))
              : 'No protected area data available'}
          </td>
        </tr>

        {/* Tree Cover Extent */}
        <tr>
          <td style={TD_LABEL}>Tree Cover Extent</td>
          <td style={TD_VALUE}>
            <div>Coverage: <strong>{coverExtentDecileData.percentageCoverExtent?.toFixed(2) || 0}%</strong></div>
            <div>Non-zero points: <strong>{coverExtentDecileData.nonZeroCount || 0}</strong></div>
            {coverExtentDecileData.valueCountArray?.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: '10px', color: C.muted }}>
                {coverExtentDecileData.valueCountArray
                  .filter(i => i.count > 0)
                  .map((item, i) => (
                    <span key={i} style={{ marginRight: '8px' }}>
                      Decile {item.value}: {item.count}
                    </span>
                  ))}
              </div>
            )}
          </td>
        </tr>

        {/* Deforestation Drivers */}
        <tr>
          <td style={TD_LABEL}>Primary Deforestation Driver</td>
          <td style={TD_VALUE}>
            <strong>{getDriver(tscDriverDriver?.mostCommonValue)}</strong>
            {tscDriverDriver?.frequencyCounts && Object.keys(tscDriverDriver.frequencyCounts).length > 1 && (
              <div style={{ fontSize: '10px', color: C.muted, marginTop: '3px' }}>
                {Object.entries(tscDriverDriver.frequencyCounts).map(([k, v]) => (
                  <span key={k} style={{ marginRight: '8px' }}>{getDriver(k)}: {v}</span>
                ))}
              </div>
            )}
          </td>
        </tr>

        {/* Average Tree Cover */}
        <tr>
          <td style={TD_LABEL}>Average Tree Cover</td>
          <td style={TD_VALUE}>
            <strong>{wriTropicalTreeCoverAvg?.toFixed(1) || 0}%</strong>
          </td>
        </tr>

        {/* Indigenous Lands */}
        <tr>
          <td style={{ ...TD_LABEL, borderBottom: 'none' }}>Indigenous & Community Lands</td>
          <td style={{ ...TD_VALUE, borderBottom: 'none' }}>
            {indigenousStatus || 'No data available'}
          </td>
        </tr>

      </tbody>
    </table>
  );
};

export default EudrComplianceTable;
