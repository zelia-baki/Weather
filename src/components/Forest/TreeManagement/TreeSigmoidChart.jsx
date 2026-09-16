// components/TreeManagement/TreeSigmoidChart.jsx
// Shared sigmoid growth-curve chart for a single tree — used by CO2ReportModal.jsx
// (forest CO2 report, growth_params already in the API response) and by
// TreeList.jsx (Tree Manager, growth_params fetched separately by species).
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot,
} from 'recharts';
import { X, TrendingUp } from 'lucide-react';
import { buildSigmoidCurve, sigmoidCumulativeCO2 } from './utils/treeCO2Calc';

const TreeSigmoidChart = ({ tree, onClose }) => {
  const growthParams = tree.growth_params;
  const ageYears = tree.age_years ?? 0;
  const maxAge = Math.max((growthParams?.t_half || 10) * 2, ageYears + 5);
  const curve = buildSigmoidCurve(growthParams, maxAge);
  const currentCo2Kg = growthParams ? sigmoidCumulativeCO2(ageYears, growthParams) : 0;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Sigmoid growth curve — {tree.name || `#${tree.tree_id}`} ({tree.species || 'unknown species'})
        </h3>
        <button onClick={onClose} className="text-orange-400 hover:text-orange-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      {!growthParams ? (
        <p className="text-sm text-orange-700 py-6 text-center">
          No growth model available for this tree (missing species or age data).
        </p>
      ) : (
        <>
          <div className="h-64 bg-white rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age (years)', position: 'insideBottom', offset: -3, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'CO2 (kg)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v.toFixed(2)} kg`, 'Predicted CO2']} labelFormatter={(v) => `Age ${v} yr`} />
                <Line type="monotone" dataKey="co2Kg" stroke="#f97316" strokeWidth={2} dot={false} />
                <ReferenceDot x={+ageYears.toFixed(2)} y={+currentCo2Kg.toFixed(3)} r={5} fill="#dc2626" stroke="white" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-orange-700 mt-2">
            Species growth model: km={growthParams.km}, t_half={growthParams.t_half}yr, mmax={growthParams.mmax}kg.
            Red dot marks this tree&apos;s current age ({ageYears.toFixed(1)} yr).
          </p>
        </>
      )}
    </div>
  );
};

export default TreeSigmoidChart;
