import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import PriorityBadge from '../components/tickets/PriorityBadge'
import { fetchTicket } from '../api/tickets'

// Écran 2.3 — Fil de discussion côté support (chat technique).
// ⚠️ L'envoi n'ajoute le message qu'en mémoire locale : l'API messages_app
// et le temps réel (WebSocket) ne sont pas encore branchés côté backend.

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function AgentChatPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchTicket(ticketId)
        setTicket(data)
        setMessages(data.messages ?? [])
      } catch (error) {
        toast.error(
          error.response?.data?.detail || 'Impossible de charger le ticket.'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ticketId])

  // Descend automatiquement vers le dernier message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
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

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), author: 'AGENT', text, at: new Date().toISOString() },
    ])
    setDraft('')
  }

  return (
    <div className="bg-slate-50 min-h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 pb-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/agent/tickets/${ticket.id}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Retour au ticket
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-slate-800 truncate">
            Messagerie — Ticket #{shortNumber}
          </h1>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      {/* ── Fil de messages ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">
              Aucun message pour l'instant — écris au client pour démarrer l'échange.
            </p>
          )}

          {messages.map((message) => {
            const isAgent = message.author === 'AGENT'
            return (
              <div key={message.id} className={isAgent ? 'pr-10' : 'pl-10'}>
                <p
                  className={`text-xs text-slate-400 mb-1 ${
                    isAgent ? 'text-left' : 'text-right'
                  }`}
                >
                  {isAgent
                    ? `Vous · ${fmtTime(message.at)}`
                    : `Client · ${fmtTime(message.at)}`}
                </p>
                <div
                  className={`inline-block max-w-full rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isAgent
                      ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                      : 'bg-success text-white rounded-tr-sm float-right'
                  }`}
                >
                  {message.text}
                </div>
                <div className="clear-both" />
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Zone de saisie ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Écrire au client…"
            aria-label="Écrire au client"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Envoyer"
          >
            <Send size={15} />
          </button>
        </div>
      </footer>
    </div>
  )
}

export default AgentChatPage