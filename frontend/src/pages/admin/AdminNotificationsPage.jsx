// src/pages/admin/AdminNotificationsPage.jsx  — Écran 3.6
// Centre de notifications système. Basé sur NotificationType, NotificationChannel
// (Email / In-App) et NotificationHistory. Active/désactive chaque canal par type
// d'événement et consulte l'historique réel des envois.

import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import { notificationsApi } from "../../api/adminApi";
import { mockNotifications } from "../../api/adminMocks";

function Toggle({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
        active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {active ? "Actif" : "Inactif"}
    </button>
  );
}

export default function AdminNotificationsPage() {
  const [data, setData] = useState(mockNotifications);

  useEffect(() => {
    Promise.all([notificationsApi.types(), notificationsApi.history()])
      .then(([types, history]) =>
        setData({
          canaux_actifs: 2,
          types: types.data.results || types.data,
          historique: history.data.results || history.data,
        })
      )
      .catch(() => {});
  }, []);

  const flip = (typeId, channel) => {
    setData((prev) => ({
      ...prev,
      types: prev.types.map((t) =>
        t.id === typeId ? { ...t, [channel]: !t[channel] } : t
      ),
    }));
    const type = data.types.find((t) => t.id === typeId);
    if (type) notificationsApi.toggle(typeId, channel, !type[channel]).catch(() => {});
  };

  return (
    <>
      <AdminPageHeader
        title="Notifications système"
        subtitle={`${data.canaux_actifs} canaux actifs`}
      />
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
              {data.types.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-5 py-2.5 text-slate-700">{t.label}</td>
                  <td className="px-5 py-2.5 text-center">
                    <Toggle active={t.email} onClick={() => flip(t.id, "email")} />
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <Toggle active={t.in_app} onClick={() => flip(t.id, "in_app")} />
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
            {data.historique.map((h, i) => (
              <li key={i} className="px-5 py-2.5 text-sm text-slate-600">
                <span className="font-mono text-slate-400 mr-2">{h.heure}</span>
                {h.texte}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
