// src/pages/admin/AdminAuditPage.jsx  — Écran 3.7 (100% cliquable)
// Recherche, filtre "suspects uniquement", filtre par type d'action, et
// bouton Exporter fonctionnel (CSV téléchargé côté navigateur).

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import { toast } from "../../components/admin/toast";
import { exportToCsv } from "../../utils/exportCsv";
import { logsApi } from "../../api/adminApi";
import { mockAuditLog } from "../../api/adminMocks";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState(mockAuditLog);
  const [suspectsOnly, setSuspectsOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    logsApi.list().then((res) => setLogs(res.data.results || res.data)).catch(() => {});
  }, []);

  const filtered = useMemo(
    () => logs.filter((l) => {
      if (suspectsOnly && !l.is_suspicious) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      if (search && !`${l.user} ${l.action} ${l.target}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    }),
    [logs, suspectsOnly, statusFilter, search]
  );

  const doExport = () => {
    if (!filtered.length) { toast.error("Rien à exporter"); return; }
    exportToCsv(
      `audit_zay_${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((l) => ({
        date_heure: l.datetime, utilisateur: l.user, action: l.action,
        cible: l.target, statut: l.status, suspect: l.is_suspicious ? "Oui" : "Non",
      }))
    );
    toast.success(`${filtered.length} lignes exportées`);
  };

  const statuses = [...new Set(logs.map((l) => l.status))];

  return (
    <>
      <AdminPageHeader
        title="Logs & audit"
        subtitle="Traçabilité des actions et anomalies"
        action={
          <button onClick={doExport}
            className="px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50">
            Exporter (CSV)
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex gap-3 items-center flex-wrap">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
            className="flex-1 min-w-[200px] border border-slate-300 rounded px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm">
            <option value="">Tous les statuts</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={suspectsOnly} onChange={(e) => setSuspectsOnly(e.target.checked)} />
            Suspects uniquement
          </label>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-2.5 font-medium">Date / heure</th>
                <th className="px-5 py-2.5 font-medium">Utilisateur</th>
                <th className="px-5 py-2.5 font-medium">Action</th>
                <th className="px-5 py-2.5 font-medium">Cible</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i} className={`border-t border-slate-100 ${l.is_suspicious ? "bg-red-50/40" : ""}`}>
                  <td className="px-5 py-2.5 font-mono text-slate-500">{l.datetime}</td>
                  <td className="px-5 py-2.5 text-slate-700">{l.user}</td>
                  <td className="px-5 py-2.5 text-slate-600">{l.action}</td>
                  <td className="px-5 py-2.5 text-slate-500">{l.target}</td>
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      l.is_suspicious ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="px-5 py-8 text-center text-sm text-slate-400">Aucune entrée</div>}
        </div>
      </div>
    </>
  );
}
