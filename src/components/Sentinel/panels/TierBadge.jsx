export default function TierBadge({ tier }) {
  if (!tier) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: tier.bg || tier.color + '22', color: tier.color }}>
      {tier.label}
    </span>
  );
}