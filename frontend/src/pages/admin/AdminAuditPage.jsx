import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import { toast } from "../../components/admin/toast";
import { exportToCsv } from "../../utils/exportCsv";
import { logsApi } from "../../api/adminApi";

const ACTION_TYPES = [
  ["", "Toutes les actions"],
  ["LOGIN", "Connexion"], ["LOGIN_FAILED", "Échec de connexion"],
  ["LOGOUT", "Déconnexion"], ["CREATE", "Création"], ["UPDATE", "Modification"],
  ["DELETE", "Suppression"], ["ASSIGN", "Affectation"], ["ESCALATE", "Escalade"],
  ["EMAIL_SENT", "Email envoyé"], ["EMAIL_FAILED", "Échec email"],
  ["SECURITY_ALERT", "Alerte sécurité"],
];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [suspectsOnly, setSuspectsOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => load(), 300); // debounce sur la recherche
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspectsOnly, search, actionType]);

  const load = () => {
    setLoading(true);
    logsApi
      .list({
        is_suspicious: suspectsOnly || undefined,
        search: search || undefined,
        action_type: actionType || undefined,
        page_size: 200,
      })
      .then((res) => setLogs(res.data.results || []))
      .then(() => setTotal(res => res)) // no-op, total géré séparément si besoin
      .catch(() => toast.error("Impossible de charger les logs."))
      .finally(() => setLoading(false));
  };

  const doExport = () => {
    if (!logs.length) { toast.error("Rien à exporter"); return; }
    exportToCsv(
      `audit_zay_${new Date().toISOString().slice(0, 10)}.csv`,
      logs.map((l) => ({
        date_heure: l.created_at,
        utilisateur: l.user_full_name,
        email: l.user_email,
        action: l.action_label,
        cible: l.target_model ? `${l.target_model} #${l.target_id ?? ""}` : "—",
        description: l.description,
        ip: l.ip_address,
        suspect: l.is_suspicious ? "Oui" : "Non",
      }))
    );
    toast.success(`${logs.length} lignes exportées`);
  };

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
          <select value={actionType} onChange={(e) => setActionType(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm">
            {ACTION_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Chargement…</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className={`border-t border-slate-100 ${l.is_suspicious ? "bg-red-50/40" : ""}`}>
                  <td className="px-5 py-2.5 font-mono text-slate-500">
                    {new Date(l.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-2.5 text-slate-700">{l.user_full_name}</td>
                  <td className="px-5 py-2.5 text-slate-600">{l.action_label}</td>
                  <td className="px-5 py-2.5 text-slate-500">
                    {l.target_model ? `${l.target_model} #${l.target_id ?? ""}` : "—"}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      l.is_suspicious ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {l.is_suspicious ? "Suspect" : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && !logs.length && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Aucune entrée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}