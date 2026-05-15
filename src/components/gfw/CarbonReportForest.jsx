/**
 * CarbonReportForest.jsx  (FOREST)  —  v3
 * ─────────────────────────────────────────────────────────────────────────
 * - Correctif couleurs : IsolatedLight neutralise les surcharges du Layout
 * - Header : parrotlogo.svg | titre | logo.jpg (Agriyields)
 * - PDF : generatePDF → Playwright backend (pdfUtils.js v3)
 * - Nom fichier : Carbon_Forest_Report_<forestId>.pdf
 */

import React, { useRef, useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { useLocation } from 'react-router-dom';
import * as turf from '@turf/turf';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Loading from '../main/Loading.jsx';
import CarbonForestPDF from './pdf/CarbonForestPDF.jsx';
import { generatePDF }  from '../Guest/utils/pdfUtils.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MAPBOX_TOKEN = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

const buildMapboxUrl = (coords, w = 700) => {
  const g = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: { stroke: '#00FF00', 'stroke-width': 4, 'stroke-opacity': 1,
        fill: '#00FF00', 'fill-opacity': 0.2 },
    }],
  };
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/geojson(${encodeURIComponent(JSON.stringify(g))})/auto/${w}x420?access_token=${MAPBOX_TOKEN}`;
};

// ── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}
    fill="none" viewBox="0 0 24 24">
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path   style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// ── Isolation du thème global ─────────────────────────────────────────────────
// Le Layout de l'app injecte des couleurs semi-transparentes (dark theme)
// qui surchargent les textes. Ces règles les neutralisent complètement.
const IsolatedLight = ({ children }) => (
  <>
    <style>{`
      .cr-forest-isolated,
      .cr-forest-isolated * {
        color-scheme: light !important;
        -webkit-text-fill-color: initial !important;
      }
      .cr-forest-isolated          { color: #1a1a1a; background: #fff; }
      .cr-forest-isolated th       { color: #fff !important; }
      .cr-forest-isolated .badge-w { color: #fff !important; }
    `}</style>
    <div className="cr-forest-isolated">{children}</div>
  </>
);

// ── Constantes ────────────────────────────────────────────────────────────────
const G      = '#15803d';
const LGRAY  = '#f9fafb';
const BORDER = '#dcfce7';

const Section = ({ title, children }) => (
  <div style={{ borderLeft: `4px solid ${G}`, paddingLeft: 16, marginBottom: 24 }}>
    <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.05em', color: G, marginBottom: 12 }}>
      {title}
    </h2>
    {children}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
const CarbonReportForest = () => {
  const [forestInfo,         setForestInfo]         = useState(null);
  const [geoData,            setGeoData]            = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [isDownloading,      setIsDownloading]      = useState(false);
  const [areaInSquareMeters, setAreaInSquareMeters] = useState(null);
  const [areaInHectares,     setAreaInHectares]     = useState(null);

  const pdfRef   = useRef();
  const location = useLocation();
  const forestId = location.state?.forestId || 1;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const go = async () => {
      try {
        const res = await axiosInstance.get(`/api/gfw/forest/${forestId}/CarbonReport`);
        if (res.data.error) { setError(res.data.error); return; }
        setForestInfo(res.data.forest_info);
        const report = res.data.report || [];
        setGeoData(report);
        if (report[0]?.coordinates?.[0]) {
          const m2 = turf.area({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [report[0].coordinates[0]] },
          });
          setAreaInSquareMeters(m2);
          setAreaInHectares(m2 / 10000);
        }
      } catch { setError('Failed to fetch forest carbon report.'); }
      finally  { setLoading(false); }
    };
    go();
  }, [forestId]);

  // ── Carbon values ─────────────────────────────────────────────────────────
  const grossEmissions = geoData?.[0]?.data_fields?.gfw_forest_carbon_gross_emissions__Mg_CO2e ?? 0;
  const grossRemovals  = geoData?.[1]?.data_fields?.gfw_forest_carbon_gross_removals__Mg_CO2e  ?? 0;
  const netFlux        = geoData?.[2]?.data_fields?.gfw_forest_carbon_net_flux__Mg_CO2e        ?? 0;
  const seqBelow       = geoData?.[3]?.data_fields?.gfw_reforestable_extent_belowground_carbon_potential_sequestration__Mg_C ?? 0;
  const seqAbove       = geoData?.[4]?.data_fields?.gfw_reforestable_extent_aboveground_carbon_potential_sequestration__Mg_C ?? 0;
  const netPositive    = parseFloat(netFlux) >= 0;

  const pieData = {
    labels: ['Gross Emissions', 'Gross Removals', 'Net Flux', 'Sequestration'],
    datasets: [{
      data: [Math.abs(grossEmissions), Math.abs(grossRemovals), Math.abs(netFlux), Math.abs(seqBelow)],
      backgroundColor: ['#e53935', '#43a047', '#fb8c00', '#00acc1'],
      borderWidth: 2, borderColor: '#fff',
    }],
  };

  const coordinates = geoData?.[0]?.coordinates?.[0];
  const mapUrl      = coordinates ? buildMapboxUrl(coordinates) : null;
  const mapUrlPDF   = coordinates ? buildMapboxUrl(coordinates, 700) : null;

  // ── PDF via Playwright backend ────────────────────────────────────────────
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await generatePDF(pdfRef, `Carbon_Forest_Report_${forestId}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return <Loading />;
  if (error)   return <p style={{ color: '#dc2626', padding: 24 }}>{error}</p>;

  // ── Cell styles ──────────────────────────────────────────────────────────
  const td0 = { padding: '6px 12px', background: '#f0fdf4', fontWeight: 600,
    width: '35%', borderBottom: `1px solid ${BORDER}`, color: '#1a1a1a', fontSize: 13 };
  const td1 = { padding: '6px 12px', borderBottom: `1px solid ${BORDER}`,
    color: '#1a1a1a', fontSize: 13 };

  return (
    <IsolatedLight>
      {/* ════════════════════════════════════════════════════════════════════
          VUE ÉCRAN
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '16px 32px' }}>

        {/* ── Header : parrotlogo | titre | logo ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `4px solid ${G}`, paddingBottom: 16, marginBottom: 24,
        }}>
          <img
            src="/parrotlogo.svg"
            alt="Parrot"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#111827', margin: 0 }}>
              Carbon Emissions Assessment
            </h1>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              Regulation (EU) 2023/1115 — Forest
            </p>
          </div>
          <img
            src="/logo.jpg"
            alt="Agriyields"
            style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8 }}
          />
        </div>

        {/* ── Forest info ── */}
        {forestInfo && (
          <Section title="Forest Information">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Forest Name',  forestInfo.name],
                  ['Tree Type',    forestInfo.tree_type    ?? 'N/A'],
                  ['Date Created', forestInfo.date_created ?? 'N/A'],
                  ['Last Updated', forestInfo.date_updated ?? 'N/A'],
                  ...(areaInHectares ? [[
                    'Project Area',
                    `${areaInSquareMeters?.toFixed(2)} m²  (${areaInHectares?.toFixed(2)} ha)`,
                  ]] : []),
                ].map(([l, v], i) => (
                  <tr key={i}><td style={td0}>{l}</td><td style={td1}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* ── Carbon table ── */}
        <Section title="Carbon Assessment Summary">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: G }}>
                <th style={{ textAlign: 'left', padding: '8px 16px', color: '#fff', fontWeight: 600 }}>
                  Category
                </th>
                <th style={{ textAlign: 'left', padding: '8px 16px', color: '#fff', fontWeight: 600 }}>
                  Value (Mg CO₂e)
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Carbon Gross Emissions',             grossEmissions, '#e53935'],
                ['Carbon Gross Absorption (Removals)', grossRemovals,  '#43a047'],
                ['Carbon Net Emissions',               netFlux,        netPositive ? '#e53935' : '#43a047'],
              ].map(([label, val, color], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? LGRAY : '#fff' }}>
                  <td style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}`, color: '#1a1a1a' }}>
                    {label}
                  </td>
                  <td style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}` }}>
                    <span className="badge-w" style={{
                      background: color, color: '#fff',
                      padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: 12,
                    }}>
                      {Number(val).toFixed(4)}
                    </span>
                  </td>
                </tr>
              ))}
              {[
                ['Carbon Sequestration Potential (Belowground)', `${Number(seqBelow).toFixed(4)} Mg C`],
                ['Carbon Sequestration Potential (Aboveground)', `${Number(seqAbove).toFixed(4)} Mg C`],
              ].map(([label, val], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? LGRAY : '#fff' }}>
                  <td style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}`, color: '#1a1a1a' }}>
                    {label}
                  </td>
                  <td style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}`, color: '#1a1a1a' }}>
                    {val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ── Net status badge ── */}
        <div style={{
          borderLeft: `4px solid ${netPositive ? '#ef4444' : G}`,
          background: netPositive ? '#fef2f2' : '#f0fdf4',
          padding: '10px 16px', borderRadius: '0 8px 8px 0', marginBottom: 24,
        }}>
          <p style={{
            fontWeight: 700, fontSize: 13,
            color: netPositive ? '#b91c1c' : G, margin: 0,
          }}>
            {netPositive
              ? '⚠ This forest is a net carbon source.'
              : '✓ This forest is a net carbon sink.'}
          </p>
        </div>

        {/* ── Pie chart ── */}
        <Section title="Carbon Emissions and Sequestration">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 256, height: 256 }}>
              <Pie
                data={pieData}
                options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
              />
            </div>
          </div>
        </Section>

        {/* ── Map ── */}
        {mapUrl && (
          <Section title="Plot Map">
            <img
              src={mapUrl}
              alt="Forest map"
              crossOrigin="anonymous"
              style={{ width: '100%', borderRadius: 8, border: `1px solid ${BORDER}` }}
            />
          </Section>
        )}

        {/* ── Download button ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 48 }}>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 32px', borderRadius: 10, border: 'none',
              background: isDownloading ? '#9ca3af' : G,
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              boxShadow: isDownloading ? 'none' : '0 4px 14px rgba(21,128,61,.35)',
            }}
          >
            {isDownloading && <Spinner />}
            {isDownloading ? 'Generating PDF…' : '⬇ Download PDF Report'}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DIV CACHÉ 794 PX — envoyé au backend Playwright
          Styles 100 % inline → rendu fidèle garanti.
      ════════════════════════════════════════════════════════════════════ */}
      <CarbonForestPDF
        pdfRef             = {pdfRef}
        forestInfo         = {forestInfo}
        geoData            = {geoData}
        mapboxUrl          = {mapUrlPDF}
        areaInHectares     = {areaInHectares}
        areaInSquareMeters = {areaInSquareMeters}
      />
    </IsolatedLight>
  );
};

export default CarbonReportForest;