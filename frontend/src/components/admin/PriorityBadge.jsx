// src/components/admin/PriorityBadge.jsx
import { PRIORITY_LABELS, PRIORITY_BADGE } from "../../utils/adminConstants";

export default function PriorityBadge({ value, showRaw = false }) {
  // Ticket pas encore classifié par le superviseur ou l'IA.
  if (!value) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-400">
        Non classé
      </span>
    );
  }

  const cls = PRIORITY_BADGE[value] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {showRaw ? value : PRIORITY_LABELS[value] || value}
    </span>
  );
}
