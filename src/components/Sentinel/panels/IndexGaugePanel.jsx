import { Gauge } from "lucide-react";
import { META } from "../constants";
import GaugeCard from "./GaugeCard";

export default function IndexGaugePanel({ data }) {
  const history = data?.history || [];
  const last = history[history.length - 1];

  if (!last) return null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-800">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Gauge size={16} className="text-emerald-400" />
          Index Gauges — Latest Reading
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Snapshot du {last.date} · la position de l'aiguille reflète où se situe
          la valeur dans la plage physique naturelle de chaque indice.
        </p>
      </div>
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.keys(META).map(idx => (
          <GaugeCard
            key={idx}
            idx={idx}
            value={last[idx]?.value}
            raw={last[idx]?.raw}
            tier={last[idx]?.tier}
          />
        ))}
      </div>
    </div>
  );
}