import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, MessageSquare, CheckCircle2, ArrowUpRight, Paperclip,
} from 'lucide-react'
import PriorityBadge from '../components/tickets/PriorityBadge'
import StatusBadge from '../components/tickets/StatusBadge'
import SlaBar from '../components/tickets/SlaBar'
import EscalationModal from '../components/agent/EscalationModal'
import { useEffect, useMemo, useState } from 'react'
import { fetchTicket } from '../api/tickets'

// Écran 2.2 — Fiche de traitement détaillée de l'incident (console agent).
// ⚠️ Le changement de statut / la résolution / l'escalade ne modifient que
// l'état LOCAL de la page (pas d'API tickets encore) — à brancher plus tard
// sur PATCH /api/tickets/:id/ et POST /api/tickets/:id/escalate/.

const PRIORITY_LABELS = { CRITICAL: 'Critique', HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse' }

// Ordre logique du cycle de vie, pour savoir quelles étapes de la timeline
// sont atteintes (WAITING/REOPENED sont des variantes de « en cours »).
const STATUS_RANK = {
  OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, WAITING: 2, REOPENED: 2,
  ESCALATED: 3, RESOLVED: 4, CLOSED: 5,
}

const STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'WAITING', label: 'En attente client' },
  { value: 'ESCALATED', label: 'Escaladé' },
  { value: 'RESOLVED', label: 'Résolu' },
]

const MIN = 60 * 1000

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateTime(iso) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} · ${fmtTime(iso)}`
}

// Reconstruit la timeline (maquette : créé → IA → assigné → en cours → …)
// à partir des champs du ticket et du statut courant.
function buildTimeline(ticket, status) {
  const created = new Date(ticket.created_at).getTime()
  const rank = STATUS_RANK[status] ?? 0
  const steps = [{ label: 'Ticket créé', at: new Date(created) }]

  if (ticket.ai_priority) {
    const confidence = ticket.ai_confidence
      ? ` (confiance ${Math.round(ticket.ai_confidence * 100)} %)`
      : ''
    steps.push({
      label: `IA : classifié ${PRIORITY_LABELS[ticket.ai_priority]}${confidence}`,
      at: new Date(created + 1 * MIN),
    })
  }
  if (rank >= 1) steps.push({ label: 'Assigné à Ahmed Karimi', at: new Date(created + 3 * MIN) })
  if (rank >= 2) steps.push({ label: 'En cours de traitement', at: new Date(created + 30 * MIN) })
  if (status === 'WAITING') steps.push({ label: 'En attente du client', at: new Date() })
  if (status === 'ESCALATED') steps.push({ label: 'Escaladé au superviseur', at: new Date() })
  if (rank >= 4) steps.push({ label: 'Résolu', at: new Date() })

  return steps
}

function AgentTicketPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState(ticket?.current_status ?? 'OPEN')
  const [showEscalation, setShowEscalation] = useState(false)

  const timeline = useMemo(
    () => (ticket ? buildTimeline(ticket, status) : []),
    [ticket, status]
  )

  useEffect(() => {
  loadTicket()
}, [ticketId])

const loadTicket = async () => {
  try {
    setLoading(true)

    const data = await fetchTicket(ticketId)

    setTicket(data)
    setStatus(data.current_status)
  } catch (error) {
    toast.error(
      error.response?.data?.detail ||
      "Impossible de charger le ticket."
    )
  } finally {
    setLoading(false)
  }
}
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Chargement...
    </div>
  )
}

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-500">
        <p>Ticket introuvable.</p>
        <button
          type="button"
          onClick={() => navigate('/agent/dashboard')}
          className="text-secondary text-sm hover:underline"
        >
          ← Retour à la console
        </button>
      </div>
    )
  }

  const shortNumber = ticket.ticket_number.split('-').pop()
  const isResolved = ['RESOLVED', 'CLOSED'].includes(status)

  const changeStatus = (value) => {
    setStatus(value)
    toast.success(
      `Statut mis à jour : ${STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value} (local, en attente de l'API)`
    )
  }

  const confirmEscalation = ({ reasonLabel }) => {
    setShowEscalation(false)
    setStatus('ESCALATED')
    toast.success(`Ticket escaladé au superviseur — motif : ${reasonLabel} (simulation)`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/agent/dashboard')}
            className="opacity-80 hover:opacity-100"
            aria-label="Retour à la console"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">Ticket #{shortNumber}</p>
            <p className="text-xs text-primary-foreground/70 truncate">{ticket.title}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={status} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 grid gap-4 md:grid-cols-[1.6fr_1fr] items-start">
        {/* ── Colonne gauche : diagnostic ─────────────────────────────────── */}
        <div className="space-y-4">
          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
              Informations
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Référence</dt>
                <dd className="font-medium text-slate-700 mt-0.5">
                  {ticket.ticket_number}
                  <span className="block text-xs font-normal text-slate-400">
                    Demandeur anonymisé
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-xs text-slate-400">Créé le</dt>
                <dd className="font-medium text-slate-700 mt-0.5">
                  {fmtDateTime(ticket.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Criticité IA</dt>
                <dd className="mt-0.5">
                  {ticket.ai_priority ? (
                    <span className="inline-flex items-center gap-1.5">
                      <PriorityBadge priority={ticket.ai_priority} />
                      {ticket.ai_confidence && (
                        <span className="text-xs text-slate-400">
                          {Math.round(ticket.ai_confidence * 100)} %
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Description
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>

            {ticket.attachments?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {ticket.attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
                  >
                    <Paperclip size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate flex-1">{file.file_name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        toast("Aperçu de la pièce jointe : pas encore disponible.", { icon: 'ℹ️' })
                      }
                      className="text-xs font-medium text-secondary hover:underline"
                    >
                      Voir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!isResolved && (
            <section className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
                Suivi SLA
              </p>
              <SlaBar
                createdAt={ticket.created_at}
                slaDeadline={ticket.sla_deadline}
                priority={ticket.priority}
              />
            </section>
          )}

          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
              Timeline
            </p>
            <ol className="space-y-3">
              {timeline.map((step, index) => {
                const isLast = index === timeline.length - 1
                return (
                  <li key={step.label} className="flex items-start gap-2.5">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                        isLast ? 'bg-accent' : 'bg-primary'
                      }`}
                    />
                    <div>
                      <p className={`text-sm ${isLast ? 'text-accent font-medium' : 'text-slate-700'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-400">{fmtTime(step.at)}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>

        {/* ── Colonne droite : statut + actions ───────────────────────────── */}
        <div className="space-y-4 md:sticky md:top-6">
          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
              Mettre à jour le statut
            </p>
            <select
              value={STATUS_OPTIONS.some((o) => o.value === status) ? status : ''}
              onChange={(e) => changeStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50"
              aria-label="Statut du ticket"
            >
              {!STATUS_OPTIONS.some((o) => o.value === status) && (
                <option value="" disabled>
                  — Choisir —
                </option>
              )}
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
              Actions
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate(`/agent/tickets/${ticket.id}/messages`)}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg py-2 hover:bg-slate-50"
              >
                <MessageSquare size={15} />
                Messagerie client
                {ticket.unread_messages ? ` (${ticket.unread_messages})` : ''}
              </button>

              <button
                type="button"
                disabled={isResolved}
                onClick={() => changeStatus('RESOLVED')}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-success text-white rounded-lg py-2 hover:bg-success/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={15} />
                Marquer résolu
              </button>

              <button
                type="button"
                disabled={status === 'ESCALATED' || isResolved}
                onClick={() => setShowEscalation(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-danger border border-danger/30 rounded-lg py-2 hover:bg-danger/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpRight size={15} />
                Escalader au superviseur
              </button>
            </div>
          </section>
        </div>
      </main>

      {showEscalation && (
        <EscalationModal
          ticket={ticket}
          onClose={() => setShowEscalation(false)}
          onConfirm={confirmEscalation}
        />
      )}
    </div>
  )
}

export default AgentTicketPage
