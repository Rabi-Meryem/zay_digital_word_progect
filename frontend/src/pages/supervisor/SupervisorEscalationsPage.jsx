import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowLeftRight, User, MessageSquare } from 'lucide-react'
import PriorityBadge from '../../components/tickets/PriorityBadge'
import StatusBadge from '../../components/tickets/StatusBadge'
import SlaBar from '../../components/tickets/SlaBar'
import { initialsFromName, agentColor } from '../../utils/agentDisplay'
import {
  fetchEscalations, takeEscalation, sendBackEscalation,
} from '../../api/supervisor'
import SupervisorNotificationsBell from '../../components/layout/SupervisorNotificationsBell'
import ReassignModal from '../../components/supervisor/ReassignModal'
import TicketThreadModal from '../../components/supervisor/TicketThreadModal'
import { TopBar, Avatar } from '../../components/supervisor/SupervisorUI'

function SupervisorEscalationsPage() {
  const [filter, setFilter] = useState('all')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [reassign, setReassign] = useState(null)
  const [thread, setThread] = useState(null)

  const load = () => {
    setLoading(true)
    fetchEscalations(filter)
      .then(setList)
      .catch(() => toast.error("Impossible de charger les escalades."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const nPending = list.filter((e) => !e.resolved).length
  const nTaken = list.filter((e) => e.resolved).length

  const CHIPS = [
    { key: 'all', label: `Toutes (${list.length})` },
    { key: 'pending', label: `En attente (${nPending})` },
    { key: 'taken', label: `Prises en charge (${nTaken})` },
  ]

  async function handleTake(id) {
    try {
      await takeEscalation(id)
      toast.success('Escalade prise en charge.')
      load()
    } catch {
      toast.error('Échec de la prise en charge.')
    }
  }

  async function handleSendBack(id) {
    try {
      await sendBackEscalation(id)
      toast.success("Ticket renvoyé à l'agent.")
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'action.")
    }
  }

  if (loading) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>

  return (
    <>
      <TopBar title="Escalades reçues" desc="Tickets transmis par les agents · à qualifier et affecter">
        <SupervisorNotificationsBell />
      </TopBar>

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

      {list.length === 0 && (
        <p className="text-sm text-slate-400 py-10 text-center">Aucune escalade pour ce filtre.</p>
      )}

      <div className="space-y-3.5">
        {list.map((e) => {
          const border =
            e.priority === 'CRITICAL' ? 'border-l-danger'
              : e.priority === 'HIGH' ? 'border-l-accent'
                : 'border-l-slate-200'
          return (
            <div key={e.id} className={`bg-white border border-slate-200 border-l-[3px] ${border} rounded-xl p-4`}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">
                    {e.ticket_number} · {new Date(e.escalation_date).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="font-semibold text-slate-800 mt-0.5">{e.ticket_title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <User size={12} />{e.client_name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <PriorityBadge priority={e.priority} />
                  {e.resolved
                    ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success whitespace-nowrap">Pris en charge</span>
                    : <StatusBadge status="ESCALATED" />}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-3">
                {e.escalated_by && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Avatar initials={initialsFromName(e.escalated_by.full_name)} color={agentColor(e.escalated_by.id)} size={22} />
                    Escaladé par {e.escalated_by.full_name}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white ${
                  e.escalation_type === 'AUTO' ? 'text-danger border-danger/40' : 'text-secondary border-secondary/40'
                }`}>
                  {e.escalation_type === 'AUTO' ? 'Automatique · Risque SLA' : 'Manuelle'}
                </span>
              </div>

              <div className="mt-3">
                <SlaBar createdAt={e.ticket_created_at} slaDeadline={e.sla_deadline} priority={e.priority} />
              </div>

              <p className="mt-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600 italic leading-relaxed">
                « {e.reason} »
              </p>

              <div className="flex gap-2 mt-3 flex-wrap">
                {!e.resolved ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTake(e.id)}
                      className="text-xs font-medium bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary/90"
                    >
                      Prendre en charge
                    </button>
                    <button
                      type="button"
                      onClick={() => setReassign({ id: e.id, number: e.ticket_number, title: e.ticket_title, isEscalation: true, dejaAffecte: true })}
                      className="flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"
                    >
                      <ArrowLeftRight size={14} /> Réaffecter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendBack(e.id)}
                      className="text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"
                    >
                      Renvoyer à l'agent
                    </button>
                  </>
                ) : null}

                {e.ticket_id && (
                  <button
                    type="button"
                    onClick={() => setThread(e.ticket_id)}
                    className="flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <MessageSquare size={14} /> Ouvrir la fiche
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {reassign && (
        <ReassignModal ticket={reassign} onClose={() => setReassign(null)} onDone={load} />
      )}
      {thread && <TicketThreadModal ticketId={thread} onClose={() => setThread(null)} />}
    </>
  )
}

export default SupervisorEscalationsPage
