import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Star } from 'lucide-react'
import toast from 'react-hot-toast'

import PriorityBadge from '../components/tickets/PriorityBadge'
import StatusBadge from '../components/tickets/StatusBadge'

import {
  fetchTicket,
  fetchAttachments,
  uploadAttachment,
  rateTicket,
} from '../api/tickets'

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

function TicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attachments, setAttachments] = useState([])

  // Partie messages (reste locale tant que le backend n'existe pas)
  const [messages, setMessages] = useState([])

  const [draft, setDraft] = useState('')

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [evaluationSent, setEvaluationSent] = useState(false)

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadTicket()
  }, [ticketId])

  const loadTicket = async () => {
    try {
      setLoading(true)

      const ticketData = await fetchTicket(ticketId)
      setTicket(ticketData)

      setMessages(ticketData.messages ?? [])

      if (ticketData.rating) {
        setRating(ticketData.rating.rating)
        setComment(ticketData.rating.comment ?? '')
        setEvaluationSent(true)
      }

      try {
        const attachmentData = await fetchAttachments(ticketId)
        setAttachments(attachmentData.attachments ?? [])
      } catch {
        setAttachments([])
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Impossible de charger le ticket.'
      )
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = () => {
    if (!draft.trim()) return

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: 'client',
        text: draft.trim(),
        sentAt: new Date().toISOString(),
      },
    ])

    setDraft('')
  }

  const submitRating = async () => {
    if (!rating) return

    try {
      await rateTicket(ticket.id, rating, comment)

      toast.success('Évaluation enregistrée.')

      setEvaluationSent(true)

      loadTicket()
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Impossible d'envoyer l'évaluation."
      )
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files[0]

    if (!file) return

    try {
      setUploading(true)

      await uploadAttachment(ticket.id, file)

      toast.success('Pièce jointe envoyée.')

      const attachmentData = await fetchAttachments(ticket.id)

      setAttachments(attachmentData.attachments ?? [])
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Impossible d'envoyer la pièce jointe."
      )
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

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
          onClick={() => navigate('/dashboard')}
          className="text-secondary text-sm hover:underline"
        >
          ← Retour à mes tickets
        </button>
      </div>
    )
  }

  const isResolved = RESOLVED_STATUSES.includes(ticket.current_status)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
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

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-3 overflow-y-auto">
              {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">
            Aucun message pour ce ticket.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.author === 'client' ? 'justify-end' : 'justify-start'
            }`}
          >
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
                  m.author === 'client'
                    ? 'text-primary-foreground/70'
                    : 'text-slate-400'
                }`}
              >
                {new Date(m.sentAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Pièces jointes */}

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-800">
              Pièces jointes
            </p>

            <label className="cursor-pointer text-sm bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition">
              {uploading ? 'Upload...' : 'Ajouter'}

              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {attachments.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aucune pièce jointe.
            </p>
          ) : (
            <div className="space-y-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {file.original_name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {(file.file_size / 1024).toFixed(1)} Ko
                    </p>
                  </div>

                  {file.file_url && (
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary text-sm hover:underline"
                    >
                      Télécharger
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isResolved && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
            <p className="text-sm font-medium text-slate-800 mb-2">
              Évaluer la résolution
            </p>

            {ticket.rating || evaluationSent ? (
              <p className="text-sm text-slate-500">
                Merci, ton évaluation a bien été enregistrée.
              </p>
            ) : (
              <>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                    >
                      <Star
                        size={20}
                        className={
                          n <= rating
                            ? 'fill-accent text-accent'
                            : 'text-slate-300'
                        }
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Commentaire (optionnel)"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />

                <button
                  type="button"
                  disabled={!rating}
                  onClick={submitRating}
                  className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
                >
                  Soumettre l'évaluation
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!isResolved && (
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
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketDetailPage