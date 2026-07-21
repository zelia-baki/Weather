import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function OutOfBoundsAlert({ items }) {
  const [open, setOpen] = useState(true);
  if (!items?.length || !open) return null;
  return (
    <div className="rounded-xl border border-orange-700/50 bg-orange-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-orange-300 font-semibold text-sm">
              {items.length} out-of-bounds value{items.length > 1 ? 's' : ''} detected
            </p>
            <p className="text-orange-500 text-xs mt-0.5 mb-2">
              These raw Sentinel values exceeded [-1, 1] and were clamped to the valid physical range.
              Likely cause: cached data from before the clamp fix, or cloud-edge pixels.
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((it, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5
                             rounded-full bg-orange-900/40 border border-orange-700/50 text-orange-300">
                  <span className="font-bold uppercase text-orange-400">{it.index}</span>
                  <span className="text-orange-500">@{it.date}</span>
                  <span className="text-white font-bold">raw={it.raw}</span>
                  <span className="text-orange-500">→{it.clamped_to}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)}
          className="text-orange-600 hover:text-orange-400 text-xs flex-shrink-0">✕</button>
      </div>
    </div>
  );
}