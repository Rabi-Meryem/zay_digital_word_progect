// src/pages/admin/AdminOverviewPage.jsx  — Écran 3.1
// Vue d'ensemble sécurité & activité système. Alimenté par logsApi.stats()
// (LogStatsView). Les 3 règles de détection d'anomalies (brute force par IP,
// compte ciblé, heure inhabituelle) sont côté backend ; on affiche leur résultat.

import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import { logsApi } from "../../api/adminApi";
import { mockLogStats } from "../../api/adminMocks";

function KpiCard({ value, label, tone = "navy" }) {
  const tones = {
    navy: "text-[#1E3A5F]",
    warn: "text-orange-600",
    danger: "text-red-600",
  };
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className={`text-3xl font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(mockLogStats);

  useEffect(() => {
    logsApi
      .stats()
      .then((res) => setStats(res.data))
      .catch(() => {}); // TODO API: garde le mock si l'endpoint est indispo
  }, []);

  return (
    <>
      <AdminPageHeader
        title="Vue d'ensemble"
        subtitle="Sécurité & activité système — aujourd'hui"
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard value={stats.connexions_aujourdhui} label="Connexions aujourd'hui" />
          <KpiCard value={stats.echecs_aujourdhui} label="Échecs aujourd'hui" tone="warn" />
          <KpiCard value={stats.alertes_securite} label="Alertes sécurité" tone="danger" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top IP suspectes */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-[#1E3A5F]">
              Top IP suspectes (24h)
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-2 font-medium">Adresse IP</th>
                  <th className="px-5 py-2 font-medium text-right">Échecs</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_ips.map((row) => (
                  <tr key={row.ip} className="border-b border-slate-50">
                    <td className="px-5 py-2 font-mono text-slate-700">{row.ip}</td>
                    <td className="px-5 py-2 text-right font-semibold text-red-600">
                      {row.echecs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dernières alertes */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-[#1E3A5F]">
              Dernières alertes sécurité
            </div>
            <ul className="divide-y divide-slate-50">
              {stats.dernieres_alertes.map((a, i) => (
                <li key={i} className="px-5 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">{a.description}</span>
                    <span className="text-slate-400 shrink-0 ml-3">{a.heure}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">{a.ip}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
