import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import { notificationsApi } from "../../api/adminApi";

function Toggle({ active, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
        active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
      {active ? "Actif" : "Inactif"}
    </button>
  );
}

const STATUS_BADGE = {
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PENDING: "bg-slate-100 text-slate-500",
};

export default function AdminNotificationsPage() {
  const [types, setTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      notificationsApi.types(),
      notificationsApi.channels(),
      notificationsApi.history(),
    ])
      .then(([t, c, h]) => {
        setTypes(t.data);
        setChannels(c.data);
        setHistory(h.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const flip = (type, field) => {
    setTypes((prev) => prev.map((t) => (t.id === type.id ? { ...t, [field]: !t[field] } : t)));
    const channel = field === "email_enabled" ? "email" : "in_app";
    notificationsApi.toggle(type.id, channel, !type[field]).catch(() => load());
  };

  const canauxActifs = channels.filter((c) => c.active).length;

  if (loading) return <div className="p-8 text-slate-400">Chargement…</div>;

  return (
    <>
      <AdminPageHeader title="Notifications système" subtitle={`${canauxActifs} canaux actifs`} />
      <div className="p-8 space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-2.5 font-medium">Type de notification</th>
                <th className="px-5 py-2.5 font-medium text-center">Email</th>
                <th className="px-5 py-2.5 font-medium text-center">In-App</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-5 py-2.5 text-slate-700">{t.description || t.name}</td>
                  <td className="px-5 py-2.5 text-center">
                    <Toggle active={t.email_enabled} onClick={() => flip(t, "email_enabled")} />
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <Toggle active={t.in_app_enabled} onClick={() => flip(t, "in_app_enabled")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 font-semibold text-[#1E3A5F]">
            Historique d'envoi récent
          </div>
          <ul className="divide-y divide-slate-50">
            {history.map((h) => (
              <li key={h.id} className="px-5 py-2.5 text-sm text-slate-600">
                <span className="font-mono text-slate-400 mr-2">
                  {new Date(h.created_at).toLocaleString("fr-FR")}
                </span>
                {h.notification_title} → {h.recipient} ({h.channel_name})
              </li>
            ))}
            {!history.length && <li className="px-5 py-8 text-center text-slate-400">Aucun envoi récent</li>}
          </ul>
        </div>
      </div>
    </>
  );
}