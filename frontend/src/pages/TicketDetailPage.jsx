import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Star } from 'lucide-react'
import { MOCK_TICKETS } from '../data/mockTickets'
import PriorityBadge from '../components/tickets/PriorityBadge'
import StatusBadge from '../components/tickets/StatusBadge'
import LifecycleStepper from '../components/tickets/LifecycleStepper'
import InterventionHistory from '../components/tickets/InterventionHistory'

// ⚠️ Données de démonstration (voir mockTickets.js) — l'envoi de message et
// l'évaluation ne persistent qu'en mémoire locale, en l'absence d'API
// messages_app / tickets côté backend pour le moment.

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

function TicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const ticket = MOCK_TICKETS.find((t) => String(t.id) === ticketId)

  const [messages, setMessages] = useState(ticket?.messages ?? [])
  const [draft, setDraft] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [evaluationSent, setEvaluationSent] = useState(false)
  const [onglet, setOnglet] = useState('conversation')

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-500">
        <p>Ticket introuvable.</p>
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="text-secondary text-sm hover:underline"
        >
          ← Retour à mes tickets
        </button>
      </div>
    )
  }

  const isResolved = RESOLVED_STATUSES.includes(ticket.current_status)

  const sendMessage = () => {
    if (!draft.trim()) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), author: 'client', text: draft.trim(), sentAt: new Date().toISOString() },
    ])
    setDraft('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="text-slate-500 hover:text-slate-700 shrink-0"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            Ticket #{ticket.ticket_number.split('-').pop()} · {ticket.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.current_status} />
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-2xl mx-auto flex gap-1">
          {[
            { cle: 'conversation', label: 'Conversation' },
            { cle: 'suivi', label: 'Suivi de la demande' },
          ].map((o) => (
            <button
              key={o.cle}
              type="button"
              onClick={() => setOnglet(o.cle)}
              className={`text-sm px-3 py-2.5 border-b-2 transition-colors ${
                onglet === o.cle
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {onglet === 'suivi' && (
        <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 overflow-y-auto">
          <LifecycleStepper ticket={ticket} />
          <InterventionHistory ticketId={ticket.id} />
        </div>
      )}

      <div
        className={`flex-1 max-w-2xl w-full mx-auto p-4 space-y-3 overflow-y-auto ${
          onglet === 'conversation' ? '' : 'hidden'
        }`}
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Aucun message pour ce ticket.</p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.author === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                m.author === 'client'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {m.text}
              <p
                className={`text-[10px] mt-1 ${
                  m.author === 'client' ? 'text-primary-foreground/70' : 'text-slate-400'
                }`}
              >
                {new Date(m.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isResolved && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
            <p className="text-sm font-medium text-slate-800 mb-2">Évaluer la résolution</p>
            {ticket.rating || evaluationSent ? (
              <p className="text-sm text-slate-500">Merci, ton évaluation a bien été enregistrée.</p>
            ) : (
              <>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    >
                      <Star size={20} className={n <= rating ? 'fill-accent text-accent' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Commentaire (optionnel)"
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
                <button
                  type="button"
                  disabled={rating === 0}
                  onClick={() => setEvaluationSent(true)}
                  className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
                >
                  Soumettre l'évaluation
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!isResolved && onglet === 'conversation' && (
        <div className="border-t border-slate-200 bg-white p-3 flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Écrire un message... (Entrée pour envoyer)"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
          <button
            type="button"
            onClick={sendMessage}
            className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:bg-primary/90 transition"
            aria-label="Envoyer"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketDetailPage
