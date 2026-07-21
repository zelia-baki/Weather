import { useState, useEffect } from "react";
import { DollarSign, Loader2, RefreshCw } from "lucide-react";

export default function LTVPanel({ ltv, onUpdate, ltvLoading, activeIndex = "ndvi" }) {
  const [loan, setLoan] = useState(ltv?.loan_amount_usd || "");
  const [yieldH, setYieldH] = useState(ltv?.yield_t_per_ha || "1.5");
  const [price, setPrice] = useState(ltv?.price_per_t || "500");

  useEffect(() => {
    if (ltv) {
      if (ltv.loan_amount_usd != null) setLoan(ltv.loan_amount_usd);
      if (ltv.yield_t_per_ha != null) setYieldH(ltv.yield_t_per_ha);
      if (ltv.price_per_t != null) setPrice(ltv.price_per_t);
    }
  }, [ltv]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      loan_amount: loan ? parseFloat(loan) : null,
      yield_t_per_ha: yieldH ? parseFloat(yieldH) : 1.5,
      price_per_t: price ? parseFloat(price) : 500,
    });
  };

  const currentIndexData = ltv?.indices?.[activeIndex];
  const factorValue = currentIndexData ? currentIndexData.factor : ltv?.ndvi_factor;
  const adjYield = currentIndexData ? currentIndexData.adjusted_yield_t_ha : ltv?.adjusted_yield_t_ha;
  const cropValue = currentIndexData ? currentIndexData.estimated_crop_value_usd : ltv?.estimated_crop_value_usd;
  const ltvRatio = currentIndexData ? currentIndexData.ltv_ratio_pct : ltv?.ltv_ratio_pct;
  const premium = currentIndexData ? currentIndexData.insurance_premium_pct : ltv?.insurance_premium_pct;
  const idxColor = currentIndexData ? currentIndexData.color : "#10b981";
  const areaHa = ltv?.area_ha;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="text-emerald-500" size={20} />
            Financial Analysis &amp; Agricultural Viability (LTV)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Calculations synchronized with the currently active index: <span className="font-bold uppercase" style={{ color: idxColor }}>{activeIndex}</span>
          </p>
        </div>

        {ltv?.composite && (
          <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2.5 px-4 text-right">
            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">🧮 Global Composite Summary</span>
            <span className="text-sm font-bold text-emerald-200">
              LTV: {ltv.composite.ltv_ratio_pct}% <span className="text-slate-500 font-normal">|</span> Premium: {ltv.composite.insurance_premium_pct}%
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Loan Amount (USD)</label>
            <input
              type="number" value={loan} onChange={(e) => setLoan(e.target.value)}
              placeholder="E.g., 5000"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Yield (t/ha)</label>
            <input
              type="number" step="0.1" value={yieldH} onChange={(e) => setYieldH(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Market Price ($/t)</label>
            <input
              type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit" disabled={ltvLoading}
            className="flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {ltvLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Recalculate
          </button>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Farm Area</span>
          <p className="text-xl font-bold text-slate-200">{areaHa != null ? `${areaHa.toFixed(2)} ha` : "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Prod. Factor ({activeIndex.toUpperCase()})
          </span>
          <p className="text-xl font-bold text-slate-200">{factorValue?.toFixed(4) || "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Adjusted Yield</span>
          <p className="text-xl font-bold text-emerald-400">{adjYield?.toFixed(2) || "—"} t/ha</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Est. Crop Value</span>
          <p className="text-xl font-bold text-amber-500">${cropValue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4" style={{ borderColor: `${idxColor}33` }}>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Loan-to-Value Ratio</span>
          <p className="text-xl font-bold" style={{ color: idxColor }}>{ltvRatio != null ? `${ltvRatio}%` : "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/50 p-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Insurance Premium</span>
          <p className="text-xl font-bold text-cyan-400">{premium?.toFixed(2) || "—"} %</p>
        </div>
      </div>
    </div>
  );
}