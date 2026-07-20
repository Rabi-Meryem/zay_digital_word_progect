// src/pages/admin/AdminSlaPage.jsx  — Écran 3.3 (100% cliquable)
// Modifier une règle (modale), créer une règle (modale), activer/désactiver
// chaque règle. TODO API: pas de route GET /api/sla/rules/ -> mock.

import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import PriorityBadge from "../../components/admin/PriorityBadge";
import Modal from "../../components/admin/Modal";
import { toast } from "../../components/admin/toast";
import { slaApi } from "../../api/adminApi";
import { mockSlaRules } from "../../api/adminMocks";
import { PRIORITY_LABELS } from "../../utils/adminConstants";

export default function AdminSlaPage() {
  const [rules, setRules] = useState(mockSlaRules);
  const [editing, setEditing] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ priority: "CRITICAL", resolution_hours: 2, alert_threshold: 80 });

  useEffect(() => {
    slaApi.rules().then((res) => setRules(res.data.results || res.data)).catch(() => {});
  }, []);

  const startEdit = (rule) => {
    setEditing(rule);
    setForm({ ...rule });
  };

  const saveEdit = () => {
    slaApi.updateRule(editing.id, form).catch(() => {}).finally(() => {
      setRules((p) => p.map((r) => (r.id === editing.id ? { ...r, ...form } : r)));
      setEditing(null);
      toast.success("Règle mise à jour");
    });
  };

  const createRule = () => {
    const exists = rules.some((r) => r.priority === form.priority);
    if (exists) { toast.error("Une règle existe déjà pour cette priorité"); return; }
    const newRule = { ...form, id: Date.now(), is_active: true };
    setRules((p) => [...p, newRule]);
    setCreateOpen(false);
    setForm({ priority: "CRITICAL", resolution_hours: 2, alert_threshold: 80 });
    toast.success("Règle créée");
  };

  const toggle = (rule) => {
    setRules((p) => p.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
    slaApi.updateRule(rule.id, { is_active: !rule.is_active }).catch(() => {});
    toast.success(rule.is_active ? "Règle désactivée" : "Règle activée");
  };

  const Fields = () => (
    <>
      <label className="block text-sm text-slate-600 mb-1">Délai maximal de résolution (heures)</label>
      <input type="number" value={form.resolution_hours}
        onChange={(e) => setForm({ ...form, resolution_hours: Number(e.target.value) })}
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-3" />
      <label className="block text-sm text-slate-600 mb-1">Seuil d'alerte préventive (%)</label>
      <input type="number" value={form.alert_threshold}
        onChange={(e) => setForm({ ...form, alert_threshold: Number(e.target.value) })}
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-4" />
    </>
  );

  return (
    <>
      <AdminPageHeader
        title="Règles SLA"
        subtitle="Délai de résolution et seuil d'alerte par priorité"
        action={
          <button onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm font-medium hover:bg-[#255a87]">
            + Nouvelle règle
          </button>
        }
      />
      <div className="p-8">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-2.5 font-medium">Priorité</th>
                <th className="px-5 py-2.5 font-medium">Délai de résolution</th>
                <th className="px-5 py-2.5 font-medium">Seuil d'alerte</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-5 py-2.5"><PriorityBadge value={r.priority} /></td>
                  <td className="px-5 py-2.5 text-slate-700">{r.resolution_hours} h</td>
                  <td className="px-5 py-2.5 text-slate-700">{r.alert_threshold} %</td>
                  <td className="px-5 py-2.5">
                    <button onClick={() => toggle(r)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        r.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.is_active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <button onClick={() => startEdit(r)} className="text-[#2D6A9F] hover:underline">Modifier</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} title={`Modifier — ${editing ? PRIORITY_LABELS[editing.priority] : ""}`} onClose={() => setEditing(null)}>
        <Fields />
        <div className="flex gap-2">
          <button onClick={saveEdit} className="px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm">Enregistrer</button>
          <button onClick={() => setEditing(null)} className="px-4 py-2 rounded border border-slate-300 text-sm">Annuler</button>
        </div>
      </Modal>

      <Modal open={createOpen} title="Nouvelle règle SLA" onClose={() => setCreateOpen(false)}>
        <label className="block text-sm text-slate-600 mb-1">Priorité</label>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-3">
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Fields />
        <div className="flex gap-2">
          <button onClick={createRule} className="px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm">Créer</button>
          <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded border border-slate-300 text-sm">Annuler</button>
        </div>
      </Modal>
    </>
  );
}
