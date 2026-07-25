// src/pages/admin/AdminAiPage.jsx  — Écran 3.5 (100% cliquable)
// Deux onglets (Classification automatique / Suivi des prédictions), révision
// manuelle de la priorité retenue (aiApi.overrided -> PATCH ticket.priority).

import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import PriorityBadge from "../../components/admin/PriorityBadge";
import { toast } from "../../components/admin/toast";
import { aiApi } from "../../api/adminApi";
import { mockAiPredictions } from "../../api/adminMocks";
import { PRIORITY_LABELS } from "../../utils/adminConstants";

export default function AdminAiPage() {
  const [data, setData] = useState(mockAiPredictions);
  const [tab, setTab] = useState("classification");

  useEffect(() => {
    aiApi.predictions({ has_ai: true }).then((res) => {
      const items = (res.data.results || res.data).map((t) => ({
        ticket_number: t.ticket_number,
        ai_priority: t.ai_priority,
        ai_confidence: Math.round((t.ai_confidence || 0) * (t.ai_confidence <= 1 ? 100 : 1)),
        priority: t.priority,
        revised: t.priority !== t.ai_priority,
        id: t.id,
      }));
      const moyenne = items.length
        ? Math.round(items.reduce((s, i) => s + i.ai_confidence, 0) / items.length) : 0;
      setData({ moyenne_confiance: moyenne, items });
    }).catch(() => {});
  }, []);

  const override = (ticket, priority) => {
    setData((d) => ({
      ...d,
      items: d.items.map((t) =>
        t.ticket_number === ticket.ticket_number
          ? { ...t, priority, revised: priority !== t.ai_priority } : t),
    }));
    if (ticket.id) aiApi.overrided(ticket.id, priority).catch(() => {});
    toast.success(`Priorité retenue : ${PRIORITY_LABELS[priority]}`);
  };

  return (
    <>
      <AdminPageHeader
        title="Module IA — Classification automatique"
        subtitle="Priorité prédite et score de confiance (ai_priority / ai_confidence)"
      />
      <div className="p-8 space-y-6">
        {/* Onglets */}
        <div className="flex gap-1 border-b border-slate-200">
          {[
            { k: "classification", l: "Classification automatique" },
            { k: "suivi", l: "Suivi des prédictions" },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`px-4 py-2 text-sm -mb-px border-b-2 ${
                tab === t.k ? "border-[#2D6A9F] text-[#2D6A9F] font-medium" : "border-transparent text-slate-500"}`}>
              {t.l}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 inline-block">
          <div className="text-xs uppercase tracking-wide text-slate-500">Confiance moyenne des prédictions</div>
          <div className="text-3xl font-bold text-[#1E3A5F] mt-1">{data.moyenne_confiance} %</div>
          <div className="text-xs text-slate-400">sur les 30 derniers jours</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-2.5 font-medium">Ticket</th>
                <th className="px-5 py-2.5 font-medium">Priorité IA</th>
                <th className="px-5 py-2.5 font-medium">Confiance</th>
                <th className="px-5 py-2.5 font-medium">Priorité retenue</th>
                {tab === "suivi" && <th className="px-5 py-2.5 font-medium text-right">Réviser</th>}
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.ticket_number} className="border-t border-slate-100">
                  <td className="px-5 py-2.5 font-mono text-slate-700">{t.ticket_number}</td>
                  <td className="px-5 py-2.5"><PriorityBadge value={t.ai_priority} showRaw /></td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded bg-slate-200 overflow-hidden">
                        <div className={`h-full ${
                          t.ai_confidence >= 90 ? "bg-green-500" : t.ai_confidence >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${t.ai_confidence}%` }} />
                      </div>
                      <span className="text-slate-600">{t.ai_confidence} %</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <PriorityBadge value={t.priority} showRaw />
                    {t.revised && <span className="ml-2 text-xs text-slate-400">(révisée)</span>}
                  </td>
                  {tab === "suivi" && (
                    <td className="px-5 py-2.5 text-right">
                      <select value={t.priority} onChange={(e) => override(t, e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 text-xs">
                        {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 max-w-2xl">
          Le seuil de confiance déclenchant le repli sur le LLM (Mistral 7B) est calibré empiriquement (~90 %).
          En dessous, la prédiction est signalée pour révision manuelle dans l'onglet « Suivi des prédictions ».
        </p>
      </div>
    </>
  );
}
