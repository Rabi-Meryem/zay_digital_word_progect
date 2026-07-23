// src/pages/admin/AdminSlaPage.jsx
import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import PriorityBadge from "../../components/admin/PriorityBadge";
import { toast } from "../../components/admin/toast";
import { slaApi } from "../../api/adminApi";

const PLANS = [
  ["ESSENTIEL", "Essentiel"],
  ["STANDARD", "Standard"],
  ["PREMIUM", "Premium"],
];
const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function AdminSlaPage() {
  const [rules, setRules] = useState([]);
  const [plan, setPlan] = useState("ESSENTIEL");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    slaApi.rules()
      .then((res) => setRules(res.data.sort((a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))))
      .catch(() => toast.error("Impossible de charger les règles SLA."))
      .finally(() => setLoading(false));
  };

  const updateField = (id, field, value) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const save = (rule) => {
    if (rule.resolution_hours <= 0) return toast.error("Le délai de correction doit être > 0.");
    setSavingId(rule.id);
    slaApi.updateRule(rule.id, {
      response_hours: Number(rule.response_hours),
      diagnostic_hours: rule.diagnostic_hours ? Number(rule.diagnostic_hours) : null,
      resolution_hours: Number(rule.resolution_hours),
      warning_percentage: Number(rule.warning_percentage),
      active: rule.active,
    })
      .then(() => toast.success(`Règle ${rule.priority} (${rule.plan}) mise à jour.`))
      .catch((err) => toast.error(err?.response?.data?.detail || "Échec de la mise à jour."))
      .finally(() => setSavingId(null));
  };

  const visibleRules = rules.filter((r) => r.plan === plan);

  if (loading) return <div className="p-8 text-slate-400">Chargement…</div>;

  return (
    <>
      <AdminPageHeader title="Règles SLA" subtitle="Délais par plan et par priorité (cf. contrat client)" />
      <div className="p-8 space-y-4">
        <div className="flex gap-2">
          {PLANS.map(([key, label]) => (
            <button key={key} onClick={() => setPlan(key)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                plan === key ? "bg-[#2D6A9F] text-white" : "bg-white border border-slate-300 text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {visibleRules.map((rule) => (
            <div key={rule.id} className="border border-slate-200 bg-white rounded-xl p-4 space-y-3">
              <PriorityBadge value={rule.priority} />
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  Réponse (h)
                  <input type="number" step="0.5" min={0} className="w-20 border rounded px-2 py-1"
                    value={rule.response_hours}
                    onChange={(e) => updateField(rule.id, "response_hours", e.target.value)} />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  Diagnostic (h)
                  <input type="number" step="0.5" min={0} className="w-20 border rounded px-2 py-1"
                    value={rule.diagnostic_hours ?? ""} placeholder="—"
                    onChange={(e) => updateField(rule.id, "diagnostic_hours", e.target.value)} />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  Correction (h)
                  <input type="number" step="0.5" min={0.5} className="w-20 border rounded px-2 py-1"
                    value={rule.resolution_hours}
                    onChange={(e) => updateField(rule.id, "resolution_hours", e.target.value)} />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  Seuil alerte (%)
                  <input type="number" min={1} max={100} className="w-16 border rounded px-2 py-1"
                    value={rule.warning_percentage}
                    onChange={(e) => updateField(rule.id, "warning_percentage", e.target.value)} />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={rule.active}
                    onChange={(e) => updateField(rule.id, "active", e.target.checked)} />
                  Active
                </label>
                <button onClick={() => save(rule)} disabled={savingId === rule.id}
                  className="ml-auto bg-black text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {savingId === rule.id ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}