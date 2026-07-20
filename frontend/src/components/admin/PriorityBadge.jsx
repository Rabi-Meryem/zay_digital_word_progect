// src/components/admin/PriorityBadge.jsx
import { PRIORITY_LABELS, PRIORITY_BADGE } from "../../utils/adminConstants";

export default function PriorityBadge({ value, showRaw = false }) {
  const cls = PRIORITY_BADGE[value] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {showRaw ? value : PRIORITY_LABELS[value] || value}
    </span>
  );
}
