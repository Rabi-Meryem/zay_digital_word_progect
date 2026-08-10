import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Flame, Check, X, MessageSquare } from 'lucide-react'
import PriorityBadge from '../../components/tickets/PriorityBadge'
import { fetchSlaTickets, fetchAgents } from '../../api/supervisor'
import { setPriorityAndAssign } from '../../api/tickets'
import { initialsFromName, agentColor } from '../../utils/agentDisplay'
import SupervisorNotificationsBell from '../../components/layout/SupervisorNotificationsBell'
import TicketThreadModal from '../../components/supervisor/TicketThreadModal'
import { TopBar, Card, Avatar } from '../../components/supervisor/SupervisorUI'

// Criticité des tickets — le superviseur fixe (ou corrige) la priorité d'un
// ticket, et peut l'affecter à un agent dans la foulée.
// Route backend : POST /api/tickets/{id}/set-priority/ { priority, agent_id }

const NIVEAUX = [
  { value: 'CRITICAL', label: 'Critique', desc: 'Blocage total · traitement immédiat', degrade: 'from-rose-500 to-red-600' },
  { value: 'HIGH', label: 'Haute', desc: 'Impact fort sur l\'activité', degrade: 'from-amber-400 to-orange-500' },
  { value: 'MEDIUM', label: 'Moyenne', desc: 'Gêne modérée · contournement possible', degrade: 'from-blue-500 to-indigo-600' },
  { value: 'LOW', label: 'Basse', desc: 'Demande sans urgence', degrade: 'from-slate-400 to-slate-500' },
]

function CriticalityModal({ ticket, agents, onClose, onDone }) {
  const [priority, setPriority] = useState(ticket.priority ?? '')
  const [agentIdx, setAgentIdx] = useState(null)
  const [saving, setSaving] = useState(false)

  async function confirm() {
    if (!priority) return toast.error('Choisis un niveau de criticité.')
    if (!ticket.id) {
      toast.error('Ticket introuvable (id manquant).')
      return
    }
    try {
      setSaving(true)
      const agentId = agentIdx == null ? undefined : agents[agentIdx].agent_id
      await setPriorityAndAssign(ticket.id, priority, agentId)
      toast.success('Criticité enregistrée.')
      if (onDone) onDone()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex gap-2.5">
            <Flame size={19} className="text-accent mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Définir la criticité · {ticket.number}</p>
              <p className="text-xs text-slate-500 mt-0.5">{ticket.title}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Niveau de criticité</p>
            <div className="grid grid-cols-2 gap-2">
              {NIVEAUX.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setPriority(n.value)}
                  className={`text-left rounded-xl p-3 border-2 transition-colors ${
                    priority === n.value ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <span className={`block rounded-lg p-2.5 text-white bg-gradient-to-br ${n.degrade}`}>
                    <span className="block text-sm font-bold">{n.label}</span>
                    <span className="block text-[11px] text-white/85 leading-tight mt-0.5">{n.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Affecter à un agent <span className="font-normal text-slate-400">(optionnel)</span>
            </p>
            {agents.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun agent disponible.</p>
            ) : (
              <div className="space-y-2">
                {agents.map((a, i) => (
                  <button
                    key={a.agent_id}
                    type="button"
                    onClick={() => setAgentIdx(agentIdx === i ? null : i)}
                    className={`w-full text-left border rounded-xl px-3.5 py-2.5 flex items-center gap-3 ${
                      agentIdx === i ? 'border-secondary bg-secondary/5' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Avatar initials={initialsFromName(a.full_name)} color={agentColor(a.agent_id)} size={26} />
                    <span className="flex-1 text-sm font-semibold text-slate-700">{a.full_name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {a.workload} tickets
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Check size={15} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SupervisorCriticalityPage() {
  const [rows, setRows] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [thread, setThread] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([fetchSlaTickets('all'), fetchAgents()])
      .then(([tickets, list]) => {
        setRows(tickets)
        setAgents(list)
      })
      .catch(() => toast.error('Impossible de charger les tickets.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>

  return (
    <>
      <TopBar
        title="Criticité des tickets"
        desc="Définir ou corriger le niveau de criticité attribué à chaque ticket"
      >
        <SupervisorNotificationsBell />
      </TopBar>

      <Card
        title="Comment la criticité est déterminée"
        hint="la valeur fixée ici remplace celle proposée automatiquement"
        className="mb-4"
      >
        <p className="text-xs text-slate-500 leading-relaxed">
          Chaque ticket reçoit une criticité au moment de sa création. Le superviseur
          reste décisionnaire : la valeur définie sur cet écran fait foi et recalcule
          le délai SLA applicable au ticket.
        </p>
      </Card>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">Aucun ticket à qualifier.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Criticité actuelle</th>
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
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {t.agent ? t.agent.name : <span className="text-xs text-slate-400">Non affecté</span>}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
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
                          onClick={() => setEditing(t)}
                          className="flex items-center gap-1.5 text-xs font-medium bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-primary/90 whitespace-nowrap"
                        >
                          <Flame size={13} /> Définir
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

      {editing && (
        <CriticalityModal
          ticket={editing}
          agents={agents}
          onClose={() => setEditing(null)}
          onDone={load}
        />
      )}
      {thread && <TicketThreadModal ticketId={thread} onClose={() => setThread(null)} />}
    </>
  )
}

export default SupervisorCriticalityPage
