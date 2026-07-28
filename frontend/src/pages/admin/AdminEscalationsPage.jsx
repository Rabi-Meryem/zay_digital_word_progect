// src/pages/admin/AdminEscalationsPage.jsx  — Écran 3.4 (100% cliquable)
// Filtres, ouverture du détail d'une escalade (modale), résolution.

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import Modal from "../../components/admin/Modal";
import { toast } from "../../components/admin/toast";
import { escalationApi } from "../../api/adminApi";
import { mockEscalations } from "../../api/adminMocks";

const FILTERS = [
  { key: "ALL", label: "Toutes" },
  { key: "AUTO", label: "Automatiques" },
  { key: "MANUAL", label: "Manuelles" },
  { key: "OPEN", label: "Non résolues" },
];

export default function AdminEscalationsPage() {
  const [items, setItems] = useState(mockEscalations);
  const [filter, setFilter] = useState("ALL");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    escalationApi.list().then((res) => setItems(res.data.results || res.data)).catch(() => {});
  }, []);

  const filtered = useMemo(
    () => items.filter((e) => {
      const type = e.escalation_type ?? e.type
      const resolved = e.resolved ?? e.is_resolved
      if (filter === "AUTO") return type === "AUTO"
      if (filter === "MANUAL") return type === "MANUAL"
      if (filter === "OPEN") return !resolved
      return true
    }),
    [items, filter]
  );

  const enCours = items.filter((e) => !(e.resolved ?? e.is_resolved)).length;

  const resolve = (id) =>
    escalationApi.resolve(id).catch(() => {}).finally(() => {
      setItems((p) => p.map((x) => (x.id === id ? { ...x, is_resolved: true } : x)));
      setDetail((d) => (d && d.id === id ? { ...d, is_resolved: true } : d));
      toast.success("Escalade marquée résolue");
    });

  return (
    <>
      <AdminPageHeader title="Escalades" subtitle={`${enCours} en cours`} />
      <div className="p-8 space-y-4">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded text-sm ${
                filter === f.key ? "bg-[#2D6A9F] text-white" : "bg-white border border-slate-300 text-slate-600"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} onClick={() => setDetail(e)}
              className="bg-white rounded-lg border border-slate-200 p-4 cursor-pointer hover:border-[#2D6A9F] transition-colors">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#1E3A5F]">#{e.ticket_number}</div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  (e.resolved ?? e.is_resolved) ? "bg-green-100 text-green-700"
                    : (e.escalation_type ?? e.type) === "AUTO" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {(e.resolved ?? e.is_resolved) ? "RÉSOLUE" : (e.escalation_type ?? e.type) === "AUTO" ? "AUTOMATIQUE" : "MANUELLE"}
                </span>
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {(e.escalation_type ?? e.type) === "AUTO"
                  ? `Escalade automatique (risque SLA) → ${e.to_supervisor}`
                  : `Escaladé par ${e.from_agent} → ${e.to_supervisor} (superviseur)`} · {e.when}
              </div>
              <div className="text-sm text-slate-500 mt-1">Motif : {e.reason}</div>
              {!(e.resolved ?? e.is_resolved) && (
                <button onClick={(ev) => { ev.stopPropagation(); resolve(e.id); }}
                  className="mt-3 text-sm text-[#2D6A9F] hover:underline">
                  Marquer comme résolue
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!detail} title={detail ? `Escalade #${detail.ticket_number}` : ""} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-400">Type : </span>{(detail.escalation_type ?? detail.type) === "AUTO" ? "Automatique" : "Manuelle"}</div>
            {detail.from_agent && <div><span className="text-slate-400">Origine : </span>{detail.from_agent}</div>}
            <div><span className="text-slate-400">Destinataire : </span>{detail.to_supervisor}</div>
            <div><span className="text-slate-400">Quand : </span>{detail.when}</div>
            <div><span className="text-slate-400">Motif : </span>{detail.reason}</div>
            <div><span className="text-slate-400">Statut : </span>{detail.is_resolved ? "Résolue" : "En cours"}</div>
            {!detail.is_resolved && (
              <button onClick={() => resolve(detail.id)}
                className="mt-3 px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm">Marquer comme résolue</button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
