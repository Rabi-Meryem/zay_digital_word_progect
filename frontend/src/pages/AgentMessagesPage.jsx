import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { MOCK_AGENT_TICKETS } from '../data/mockAgentTickets'

// Entrée « Messages » de la barre latérale : toutes les conversations en cours
// de l'agent, triées du message le plus récent au plus ancien.
// ⚠️ Données de démonstration (mockAgentTickets.js) — à remplacer par
// GET /api/messages/ quand la route existera.

function fmtAgo(iso) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}

// Avatar neutre basé sur le n° de ticket (l'agent ne voit pas le client).
function ticketInitials(ticket) {
  return `T${ticket.ticket_number.split('-').pop().slice(-2)}`
}

function AgentMessagesPage() {
  const navigate = useNavigate()

  const conversations = useMemo(
    () =>
      MOCK_AGENT_TICKETS.filter((t) => t.messages.length > 0)
        .map((t) => ({ ticket: t, lastMessage: t.messages[t.messages.length - 1] }))
        .sort((a, b) => new Date(b.lastMessage.at) - new Date(a.lastMessage.at)),
    []
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/agent/dashboard')}
            className="opacity-80 hover:opacity-100"
            aria-label="Retour à la console"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="font-semibold text-sm sm:text-base">Messages</p>
            <p className="text-xs text-primary-foreground/70">
              {conversations.length} conversations
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-2 pb-6">
        {conversations.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">
            Aucune conversation en cours.
          </p>
        ) : (
          conversations.map(({ ticket, lastMessage }) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => navigate(`/agent/tickets/${ticket.id}/messages`)}
              className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 text-left hover:border-secondary/40 transition-colors"
            >
              <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                {ticketInitials(ticket)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    Ticket #{ticket.ticket_number.split('-').pop()}
                    <span className="text-xs font-normal text-slate-400">
                      {' '}· {ticket.title}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {fmtAgo(lastMessage.at)}
                  </span>
                </span>
                <span className="block text-xs text-slate-500 truncate mt-0.5">
                  {lastMessage.author === 'AGENT' ? 'Vous : ' : ''}
                  {lastMessage.text}
                </span>
              </span>
              {ticket.unread_messages > 0 ? (
                <span className="text-xs font-semibold bg-secondary text-white rounded-full px-1.5 py-0.5 min-w-5 text-center shrink-0">
                  {ticket.unread_messages}
                </span>
              ) : (
                <ChevronRight size={16} className="text-slate-300 shrink-0" />
              )}
            </button>
          ))
        )}
      </main>
    </div>
  )
}

export default AgentMessagesPage
