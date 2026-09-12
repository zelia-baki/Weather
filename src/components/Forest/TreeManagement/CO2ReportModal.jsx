// components/TreeManagement/CO2ReportModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Leaf, Download, Loader2, TrendingUp } from 'lucide-react';
import { treeService } from './services/treeService';
import TreeSigmoidChart from './TreeSigmoidChart';

const CO2ReportModal = ({ forestId, forestName, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true); setError(null); setSelectedTree(null);
    try {
      const { data } = await treeService.getCO2Report(forestId);
      setReport(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load CO2 report');
    } finally {
      setLoading(false);
    }
  }, [forestId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const response = await treeService.exportCO2Pdf(forestId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tree_CO2_Report_${forestId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  const totals = report?.totals || {};
  const trees = report?.trees || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Leaf className="w-7 h-7 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">CO2 Sequestration Report</h2>
              <p className="text-sm text-gray-500">{forestName || `Forest #${forestId}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
            </div>
          )}
          {error && <p className="text-red-600 text-center py-8">{error}</p>}

          {report && !error && (
            <>
              {/* Totaux */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-green-600 font-semibold uppercase">Trees</p>
                  <p className="text-2xl font-bold text-green-800">{totals.tree_count ?? '—'}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-blue-600 font-semibold uppercase">CO2 Total</p>
                  <p className="text-xl font-bold text-blue-800">
                    {totals.total_co2_sequestered_kg?.toFixed(1) ?? '—'} <span className="text-xs">kg</span>
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-purple-600 font-semibold uppercase">CO2/yr (avg)</p>
                  <p className="text-xl font-bold text-purple-800">
                    {totals.total_co2_annual_avg_kg?.toFixed(1) ?? '—'} <span className="text-xs">kg</span>
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-orange-600 font-semibold uppercase">CO2/yr (sigmoid)</p>
                  <p className="text-xl font-bold text-orange-800">
                    {totals.total_co2_annual_sigmoid_kg?.toFixed(1) ?? '—'} <span className="text-xs">kg</span>
                  </p>
                </div>
              </div>

              {selectedTree && (
                <TreeSigmoidChart tree={selectedTree} onClose={() => setSelectedTree(null)} />
              )}

              {/* Détail */}
              {trees.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs uppercase text-gray-500">
                        <th className="px-4 py-2">Tree</th>
                        <th className="px-4 py-2">Species</th>
                        <th className="px-4 py-2 text-center">Age (yr)</th>
                        <th className="px-4 py-2 text-center">CO2 Total (kg)</th>
                        <th className="px-4 py-2 text-center">CO2/yr avg</th>
                        <th className="px-4 py-2 text-center">CO2/yr sigmoid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trees.map((t) => (
                        <tr
                          key={t.tree_id}
                          onClick={() => setSelectedTree(t)}
                          title="Click to see this tree's sigmoid growth curve"
                          className={`border-t border-gray-100 hover:bg-orange-50 cursor-pointer ${selectedTree?.tree_id === t.tree_id ? 'bg-orange-50' : ''}`}
                        >
                          <td className="px-4 py-2 text-gray-800 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                            {t.name || `#${t.tree_id}`}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{t.species || '—'}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{t.age_years?.toFixed(1)}</td>
                          <td className="px-4 py-2 text-center font-semibold text-green-700">
                            {t.co2_sequestered_kg?.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-700">{t.co2_annual_avg_kg?.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center text-gray-700">
                            {t.co2_annual_rate_sigmoid_kg?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">No trees found for this forest.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Close
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting || !report}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
                       hover:bg-green-700 disabled:opacity-50 transition"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CO2ReportModal;