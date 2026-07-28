import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react'
import PriorityBadge from '../../components/tickets/PriorityBadge'
import SlaBar from '../../components/tickets/SlaBar'
import { getSlaInfo } from '../../utils/sla'
import { fetchSlaTickets, fetchSupervisorKpis } from '../../api/supervisor'
import SupervisorNotificationsBell from '../../components/layout/SupervisorNotificationsBell'
import ReassignModal from '../../components/supervisor/ReassignModal'
import TicketThreadModal from '../../components/supervisor/TicketThreadModal'
import { TopBar, MiniStat, Avatar, COLORS } from '../../components/supervisor/SupervisorUI'

// Affectation des tickets — le superviseur attribue chaque ticket à un agent.
// Les tickets sont triés par urgence SLA : les plus proches de l'échéance
// remontent en premier.

function SupervisorAssignmentPage() {
  const [filter, setFilter] = useState('all')
  const [rows, setRows] = useState([])
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reassign, setReassign] = useState(null)
  const [thread, setThread] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([fetchSlaTickets(filter), fetchSupervisorKpis()])
      .then(([tickets, k]) => {
        setRows(
          tickets
            .map((t) => ({ ...t, info: getSlaInfo(t.createdAt, t.slaDeadline, t.priority) }))
            .sort((a, b) => a.info.remainingMs - b.info.remainingMs)
        )
        setKpis(k)
      })
      .catch(() => toast.error("Impossible de charger les tickets."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const CHIPS = [
    { key: 'all', label: 'Tous' },
    { key: 'bad', label: 'SLA dépassé' },
    { key: 'risk', label: 'À risque' },
  ]

  if (loading || !kpis) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>

  return (
    <>
      <TopBar
        title="Affectation des tickets"
        desc="Attribuer chaque ticket à un agent · tri par urgence SLA"
      >
        <SupervisorNotificationsBell />
      </TopBar>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <MiniStat
          Icon={AlertTriangle}
          tint={{ bg: 'rgba(192,57,43,.10)', fg: COLORS.danger }}
          value={kpis.slaBreached ?? 0}
          valueColor={COLORS.danger}
          label="SLA dépassé"
        />
        <MiniStat
          Icon={CheckCircle2}
          tint={{ bg: 'rgba(39,174,96,.12)', fg: COLORS.success }}
          value={`${kpis.slaCompliance ?? 0}%`}
          valueColor={COLORS.success}
          label="Conformité globale"
        />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={`text-sm px-4 py-1.5 rounded-full border ${
              filter === c.key ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-slate-400 py-10 text-center">Aucun ticket pour ce filtre.</p>
      )}

      {rows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Priorité</th>
                  <th className="px-4 py-3 w-1/4">SLA</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.number} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-sm">{t.number}</p>
                      <p className="text-xs text-slate-400">{t.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.client}</td>
                    <td className="px-4 py-3">
                      {t.agent ? (
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                          <Avatar initials={t.agent.initials} color={COLORS.secondary} size={26} />
                          {t.agent.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Non affecté</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3">
                      <SlaBar createdAt={t.createdAt} slaDeadline={t.slaDeadline} priority={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {t.id && (
                          <button
                            type="button"
                            onClick={() => setThread(t.id)}
                            className="text-slate-400 hover:text-slate-600 p-1.5"
                            aria-label="Voir les échanges"
                            title="Voir les échanges client / agent"
                          >
                            <MessageSquare size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReassign({
                            id: t.id, number: t.number, title: t.title,
                            isEscalation: false, dejaAffecte: Boolean(t.agent),
                          })}
                          className="text-xs font-medium bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-primary/90 whitespace-nowrap"
                        >
                          {t.agent ? 'Réaffecter' : 'Affecter'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reassign && (
        <ReassignModal ticket={reassign} onClose={() => setReassign(null)} onDone={load} />
      )}
      {thread && <TicketThreadModal ticketId={thread} onClose={() => setThread(null)} />}
    </>
  )
}

export default SupervisorAssignmentPage
