import { AlertTriangle } from "lucide-react";
import { META } from "../constants";
import TierBadge from "./TierBadge";

export default function IndexCard({ idx, data, active, onClick }) {
  const meta = META[idx];
  const { Icon } = meta;
  const history = data?.history || [];
  const last = history[history.length - 1];
  const val = last?.[idx]?.value;
  const tier = last?.[idx]?.tier;
  const rawVal = last?.[idx]?.raw;
  const forecast = data?.forecast?.[idx]?.[0];

  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition-all duration-200 w-full
        ${active
          ? 'border-2 shadow-lg scale-[1.02]'
          : 'border border-slate-700 bg-slate-900 hover:border-slate-500'}`}
      style={active ? {
        borderColor: meta.color,
        background: meta.color + '18',
        boxShadow: `0 0 20px ${meta.color}30`,
      } : {}}>

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={18} style={{ color: meta.color }} />
          <div>
            <p className="font-bold text-white text-sm">{meta.label}</p>
            <p className="text-xs text-slate-500 leading-tight">{meta.full}</p>
          </div>
        </div>
        {tier && <TierBadge tier={tier} />}
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Current</p>
          <p className="text-2xl font-black" style={{ color: meta.color }}>
            {val != null ? val.toFixed(4) : '—'}
          </p>
          {rawVal != null && rawVal !== val && (
            <p className="text-xs text-orange-400 font-mono mt-0.5 flex items-center gap-1">
              <AlertTriangle size={10} />
              raw: {rawVal.toFixed(4)}
            </p>
          )}
        </div>
        {forecast && (
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Next Qtr</p>
            <p className="text-lg font-bold text-slate-300">{forecast.value.toFixed(4)}</p>
            <TierBadge tier={forecast.tier} />
          </div>
        )}
      </div>
    </button>
  );
}