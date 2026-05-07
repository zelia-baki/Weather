import React, { useState } from 'react';
import { Download, FileText, X, Printer } from 'lucide-react';

const ExportButtons = ({ farmName, timeSeries, stats, detailedStats, farmGeolocation, chartRef }) => {

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // ─── Utilitaire CSV ───────────────────────────────────────────
  const downloadCSV = (filename, rows) => {
    const csv = rows.map(r => r.map(cell =>
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Export CSV ───────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!timeSeries || !farmName) return;
    const safeDate = new Date().toISOString().split('T')[0];

    if (stats) {
      downloadCSV(`WBII_${farmName}_summary_${safeDate}.csv`, [
        ['Metric', 'Value'],
        ['Farm', farmName],
        ['Export date', safeDate],
        ['Average WBII', stats.avgWBII],
        ['Max WBII', stats.maxWBII],
        ['High risk days (>40)', stats.highRiskDays],
        ['Critical days (>60)', stats.criticalDays],
      ]);
    }

    setTimeout(() => {
      downloadCSV(`WBII_${farmName}_daily_${safeDate}.csv`, [
        ['Date', 'WBII', 'Temp Min (°C)', 'Temp Max (°C)', 'Temp Avg (°C)',
          'Precipitation (mm)', 'Heat Stress', 'Water Stress', 'Risk Level', 'Is Forecast'],
        ...timeSeries.map(d => [
          d.date, d.wbii, d.tempMin, d.tempMax, d.tempAvg,
          d.precipitation, d.tempStress, d.waterStress, d.riskLevel,
          d.isForecast ? 'Yes' : 'No'
        ])
      ]);
    }, 300);

    if (detailedStats) {
      setTimeout(() => {
        downloadCSV(`WBII_${farmName}_weather_${safeDate}.csv`, [
          ['Category', 'Days', 'Days/Month'],
          ['Heavy Rain (>10mm)', detailedStats.heavyRainDays, detailedStats.heavyRainPerMonth],
          ['Moderate Rain (5-10mm)', detailedStats.moderateRainDays, detailedStats.moderateRainPerMonth],
          ['Light Rain (1-5mm)', detailedStats.lightRainDays, detailedStats.lightRainPerMonth],
          ['Dry Days (<1mm)', detailedStats.droughtDays, detailedStats.droughtPerMonth],
          ['Hot Days (>29°C)', detailedStats.hotDays, detailedStats.hotDaysPerMonth],
          ['Extreme Heat (>35°C)', detailedStats.veryHotDays, detailedStats.veryHotDaysPerMonth],
          ['Cool Days (<20°C)', detailedStats.coldDays, detailedStats.coldDaysPerMonth],
          ['Extreme Cold (<15°C)', detailedStats.veryColdDays, detailedStats.veryColdDaysPerMonth],
          [],
          ['Summary', 'Value', ''],
          ['Total precipitation (mm)', detailedStats.totalPrecip, ''],
          ['Daily avg precipitation (mm)', detailedStats.avgPrecip, ''],
          ['Max precipitation (mm)', detailedStats.maxPrecip, ''],
          ['Average temperature (°C)', detailedStats.avgTemp, ''],
          ['Max temperature (°C)', detailedStats.maxTemp, ''],
          ['Min temperature (°C)', detailedStats.minTemp, ''],
        ]);
      }, 600);
    }
  };

  // ─── Capture du graphique via html2canvas ─────────────────────
  const captureChart = async () => {
    if (!chartRef?.current) return null;
    try {
      // html2canvas est chargé globalement (déjà installé)
      const html2canvas = window.html2canvas || (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // haute résolution
        useCORS: true,
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Chart capture failed:', err);
      return null;
    }
  };

  // ─── Génération du contenu HTML du PDF ───────────────────────
  const buildPDFContent = (chartImageBase64) => {
    const exportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const tableRows = (timeSeries || []).slice(0, 100).map(d => {
      const riskBg = d.wbii > 60 ? '#fde8e8' : d.wbii > 40 ? '#fff3e0' : d.wbii > 20 ? '#fffde7' : '#e8f5e9';
      const riskColor = d.wbii > 60 ? '#c62828' : d.wbii > 40 ? '#e65100' : d.wbii > 20 ? '#f9a825' : '#2e7d32';
      return `
        <tr>
          <td>${d.date}${d.isForecast ? ' <span style="font-size:10px;color:#1565c0;background:#e3f2fd;padding:1px 5px;border-radius:3px;">forecast</span>' : ''}</td>
          <td style="text-align:center;background:${riskBg};color:${riskColor};font-weight:600;">${d.wbii}</td>
          <td style="text-align:center;">${d.tempMin}° / ${d.tempMax}°</td>
          <td style="text-align:center;">${d.tempAvg}°C</td>
          <td style="text-align:center;">${d.precipitation} mm</td>
          <td style="text-align:center;">${d.tempStress}</td>
          <td style="text-align:center;">${d.waterStress}</td>
          <td style="text-align:center;color:${riskColor};font-weight:600;">${d.riskLevel}</td>
        </tr>`;
    }).join('');

    const statsBlock = stats ? `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Average WBII</div><div class="stat-value">${stats.avgWBII}</div></div>
        <div class="stat-card"><div class="stat-label">Maximum WBII</div><div class="stat-value" style="color:#c62828;">${stats.maxWBII}</div></div>
        <div class="stat-card"><div class="stat-label">High risk days</div><div class="stat-value" style="color:#e65100;">${stats.highRiskDays}</div></div>
        <div class="stat-card critical"><div class="stat-label">Critical days</div><div class="stat-value" style="color:#c62828;">${stats.criticalDays}</div></div>
      </div>` : '';

    const weatherBlock = detailedStats ? `
      <h2 class="section-title">Weather event summary</h2>
      <div class="two-col">
        <div>
          <h3 class="sub-title">Precipitation</h3>
          <table class="mini-table">
            <tr><th>Type</th><th>Days</th><th>Days / month</th></tr>
            <tr><td>Heavy rain (&gt;10 mm)</td><td>${detailedStats.heavyRainDays}</td><td>${detailedStats.heavyRainPerMonth}</td></tr>
            <tr><td>Moderate rain (5–10 mm)</td><td>${detailedStats.moderateRainDays}</td><td>${detailedStats.moderateRainPerMonth}</td></tr>
            <tr><td>Light rain (1–5 mm)</td><td>${detailedStats.lightRainDays}</td><td>${detailedStats.lightRainPerMonth}</td></tr>
            <tr><td>Dry days (&lt;1 mm)</td><td>${detailedStats.droughtDays}</td><td>${detailedStats.droughtPerMonth}</td></tr>
          </table>
          <p class="mini-summary">
            Total: <strong>${detailedStats.totalPrecip} mm</strong> &nbsp;|&nbsp;
            Daily avg: <strong>${detailedStats.avgPrecip} mm</strong> &nbsp;|&nbsp;
            Max: <strong>${detailedStats.maxPrecip} mm</strong>
          </p>
        </div>
        <div>
          <h3 class="sub-title">Temperature</h3>
          <table class="mini-table">
            <tr><th>Type</th><th>Days</th><th>Days / month</th></tr>
            <tr><td>Extreme heat (&gt;35°C)</td><td>${detailedStats.veryHotDays}</td><td>${detailedStats.veryHotDaysPerMonth}</td></tr>
            <tr><td>Hot days (&gt;29°C)</td><td>${detailedStats.hotDays}</td><td>${detailedStats.hotDaysPerMonth}</td></tr>
            <tr><td>Cool days (&lt;20°C)</td><td>${detailedStats.coldDays}</td><td>${detailedStats.coldDaysPerMonth}</td></tr>
            <tr><td>Extreme cold (&lt;15°C)</td><td>${detailedStats.veryColdDays}</td><td>${detailedStats.veryColdDaysPerMonth}</td></tr>
          </table>
          <p class="mini-summary">
            Avg temp: <strong>${detailedStats.avgTemp}°C</strong> &nbsp;|&nbsp;
            Max: <strong>${detailedStats.maxTemp}°C</strong> &nbsp;|&nbsp;
            Min: <strong>${detailedStats.minTemp}°C</strong>
          </p>
        </div>
      </div>` : '';

    const noteBlock = noteText.trim() ? `
      <div class="note-box">
        <div class="note-label">Notes</div>
        <div class="note-content">${noteText.trim().replace(/\n/g, '<br/>')}</div>
      </div>` : '';

    // Bloc graphique : image capturée OU message de fallback
    const chartBlock = chartImageBase64 ? `
      <h2 class="section-title">WBII Time Series Chart</h2>
      <div class="chart-container">
        <img src="${chartImageBase64}" alt="WBII Chart" style="width:100%;border-radius:8px;border:1px solid #e0e0e0;" />
        <p style="font-size:10px;color:#888;margin-top:6px;text-align:center;">
          WBII Index · Temperature Stress · Moisture Stress · Precipitation — Last 3 months + 10-day forecast
        </p>
      </div>` : `
      <h2 class="section-title">WBII Time Series Chart</h2>
      <div style="background:#f5f5f5;border:1px dashed #ccc;border-radius:8px;padding:20px;text-align:center;color:#888;font-size:12px;margin-bottom:20px;">
        Chart could not be captured. Please ensure the chart is visible on screen before exporting.
      </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>WBII Report – ${farmName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; background: #fff; padding: 32px 40px; }
  
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #5c35d4; padding-bottom: 14px; margin-bottom: 20px; }
  .header-left h1 { font-size: 20px; font-weight: 700; color: #3d2a9e; }
  .header-left p { font-size: 11px; color: #666; margin-top: 3px; }
  .header-right { text-align: right; font-size: 11px; color: #555; }
  .header-right strong { color: #222; }

  .farm-card { background: #f5f3ff; border-left: 4px solid #7c55e8; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; }
  .farm-card h2 { font-size: 15px; font-weight: 700; color: #3d2a9e; margin-bottom: 4px; }
  .farm-card p { font-size: 11px; color: #555; }

  .section-title { font-size: 13px; font-weight: 700; color: #3d2a9e; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat-card { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px 12px; text-align: center; }
  .stat-card.critical { border-color: #ffcdd2; background: #fff8f8; }
  .stat-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
  .stat-value { font-size: 22px; font-weight: 700; color: #222; }

  .chart-container { margin-bottom: 20px; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .sub-title { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
  .mini-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .mini-table th { background: #ede9ff; color: #3d2a9e; font-weight: 600; padding: 5px 8px; text-align: left; }
  .mini-table td { padding: 4px 8px; border-bottom: 1px solid #f0f0f0; }
  .mini-table tr:last-child td { border-bottom: none; }
  .mini-summary { font-size: 10px; color: #666; margin-top: 6px; }

  .daily-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
  .daily-table th { background: #ede9ff; color: #3d2a9e; font-weight: 600; padding: 6px 8px; text-align: left; border-bottom: 2px solid #c4b5fd; }
  .daily-table td { padding: 4px 8px; border-bottom: 1px solid #f0f0f0; }
  .daily-table tr:hover td { background: #fafafa; }

  .note-box { background: #fffde7; border: 1px solid #f9e04b; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px; }
  .note-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #b8860b; margin-bottom: 6px; }
  .note-content { font-size: 12px; color: #444; line-height: 1.6; }

  .footer { font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px; }

  @page { margin: 1.5cm; size: A4 portrait; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <h1>WBII Report</h1>
      <p>Weather-Based Impact Index – Agricultural Risk Analysis</p>
    </div>
    <div class="header-right">
      <p>Export date: <strong>${exportDate}</strong></p>
      <p>Period: <strong>Last 3 months + 10-day forecast</strong></p>
    </div>
  </div>

  <div class="farm-card">
    <h2>${farmName}</h2>
    ${farmGeolocation ? `<p>Coordinates: ${farmGeolocation}</p>` : ''}
  </div>

  ${noteBlock}

  <div class="section-title">Summary statistics</div>
  ${statsBlock}

  ${chartBlock}

  ${weatherBlock}

  <div class="section-title">Daily WBII data${timeSeries && timeSeries.length > 100 ? ' (first 100 days)' : ''}</div>
  <table class="daily-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>WBII</th>
        <th>Temp min/max</th>
        <th>Temp avg</th>
        <th>Rainfall</th>
        <th>Heat stress</th>
        <th>Water stress</th>
        <th>Risk level</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">Generated by WBII Dashboard &nbsp;·&nbsp; ${farmName} &nbsp;·&nbsp; ${exportDate}</div>

</body>
</html>`;
  };

  // ─── Export PDF via nouvelle fenêtre + print ──────────────────
  const handleExportPDF = async () => {
    setIsCapturing(true);
    let chartImageBase64 = null;

    try {
      chartImageBase64 = await captureChart();
    } catch (e) {
      console.warn('Could not capture chart:', e);
    }

    setIsCapturing(false);

    const html = buildPDFContent(chartImageBase64);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow pop-ups to export the PDF.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      setTimeout(() => {
        win.print();
      }, 400);
    };
    setShowNoteModal(false);
  };

  const isDisabled = !timeSeries || !farmName;

  return (
    <>
      {/* Boutons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={handleExportCSV}
          disabled={isDisabled}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#EEEDFE', color: '#3C3489', border: '1px solid #AFA9EC' }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>

        <button
          onClick={() => !isDisabled && setShowNoteModal(true)}
          disabled={isDisabled}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#f5f3ff', color: '#534AB7', border: '1px solid #CECBF6' }}
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Modal pour les notes */}
      {showNoteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={(e) => e.target === e.currentTarget && setShowNoteModal(false)}
        >
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, width: 480,
            maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#3d2a9e', margin: 0 }}>Export PDF</h2>
                <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{farmName}</p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Note textarea */}
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Add a note <span style={{ fontWeight: 400, color: '#aaa' }}>(optional – will appear in the PDF)</span>
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Inspection planned for next week. Irrigation system operational. Crop: maize, planted Jan 15."
              rows={5}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #d0c8f8', fontSize: 13, color: '#333',
                resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                lineHeight: 1.6
              }}
              onFocus={(e) => e.target.style.borderColor = '#7c55e8'}
              onBlur={(e) => e.target.style.borderColor = '#d0c8f8'}
            />
            <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
              {noteText.length} characters
            </p>

            {/* What's included */}
            <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '10px 14px', margin: '14px 0', fontSize: 11, color: '#534AB7' }}>
              <strong>PDF will include:</strong> farm name & coordinates · summary stats · <strong>WBII chart</strong> · weather events · full daily data table
            </div>

            {/* Boutons modal */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNoteModal(false)}
                disabled={isCapturing}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #ddd',
                  background: '#fafafa', color: '#555', fontSize: 13, cursor: 'pointer', fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isCapturing}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: isCapturing ? '#9c7fd4' : '#5c35d4',
                  color: '#fff', fontSize: 13, cursor: isCapturing ? 'wait' : 'pointer',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.2s'
                }}
              >
                <Printer size={14} />
                {isCapturing ? 'Capturing chart...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButtons;