import { META, INDEX_RANGE } from "../constants";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

export default function GaugeCard({ idx, value, tier, raw }) {
  const meta = META[idx];
  const [min, max] = INDEX_RANGE[idx] || [-1, 1];
  const hasValue = value != null;
  const clamped = hasValue ? Math.max(min, Math.min(max, value)) : min;
  const fraction = hasValue ? (clamped - min) / (max - min) : 0;

  const cx = 100, cy = 100, r = 80;
  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - fraction);

  const needleAngle = 180 - fraction * 180; // 180° = min (gauche), 0° = max (droite)
  const needleTip = polarToCartesian(cx, cy, r - 18, needleAngle);

  const color = tier?.color || meta.color;
  const { Icon } = meta;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-1 self-start">
        <Icon size={14} style={{ color: meta.color }} />
        <span className="text-xs font-bold text-slate-300">{meta.label}</span>
      </div>

      <svg viewBox="0 0 200 115" className="w-full max-w-[180px]">
        {/* Piste de fond */}
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 180 100`}
          fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round"
        />
        {/* Arc de valeur */}
        {hasValue && (
          <path
            d={`M 20 100 A ${r} ${r} 0 0 1 180 100`}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
          />
        )}
        {/* Aiguille */}
        {hasValue && (
          <line
            x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y}
            stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round"
            style={{ transition: "all 0.6s ease" }}
          />
        )}
        <circle cx={cx} cy={cy} r="6" fill="#f1f5f9" />

        {/* Repères min / max */}
        <text x="20" y="112" fontSize="9" fill="#64748b" textAnchor="middle">{min}</text>
        <text x="180" y="112" fontSize="9" fill="#64748b" textAnchor="middle">{max}</text>
      </svg>

      <div className="text-center -mt-2">
        <p className="text-xl font-black" style={{ color }}>
          {hasValue ? value.toFixed(4) : "—"}
        </p>
        {tier && (
          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: color + "22", color, border: `1px solid ${color}44` }}>
            {tier.label}
          </span>
        )}
        {raw != null && raw !== value && (
          <p className="text-[10px] text-orange-400 font-mono mt-1">raw: {raw.toFixed(4)}</p>
        )}
      </div>
    </div>
  );
}