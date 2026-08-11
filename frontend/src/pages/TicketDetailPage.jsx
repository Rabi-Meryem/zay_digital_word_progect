import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

import PriorityBadge from '../components/tickets/PriorityBadge'
import StatusBadge from '../components/tickets/StatusBadge'
import LifecycleStepper from '../components/tickets/LifecycleStepper'

import {
  fetchTicket,
  fetchAttachments,
  rateTicket,
  closeTicket,
} from '../api/tickets'

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

// Extensions considérées comme des images pour la preview en modale.
const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|svg)$/i

function TicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  // Pièces jointes : lecture seule ici. L'ajout se fait uniquement à la
  // création du ticket (NewTicketPage).
  const [attachments, setAttachments] = useState([])
  const [previewFile, setPreviewFile] = useState(null)

  // Onglet actif : informations du ticket (par défaut) ou suivi de la demande.
  // La messagerie a été retirée : aucun backend `messages_app` ne l'expose.
  const [onglet, setOnglet] = useState('infos')

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [evaluationSent, setEvaluationSent] = useState(false)
  const [clotureEnCours, setClotureEnCours] = useState(false)

  useEffect(() => {
    loadTicket()
  }, [ticketId])

  const loadTicket = async () => {
    try {
      setLoading(true)

      const ticketData = await fetchTicket(ticketId)
      setTicket(ticketData)

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

  // Clôture par le client : disponible une fois le ticket résolu et évalué.
  const submitCloture = async () => {
    setClotureEnCours(true)
    try {
      await closeTicket(ticket.id)
      toast.success('Ticket clôturé.')
      loadTicket()
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Impossible de clôturer le ticket.'
      )
    } finally {
      setClotureEnCours(false)
    }
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
        error.response?.data?.detail || "Impossible d'envoyer l'évaluation."
      )
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
  const isClosed = ticket.current_status === 'CLOSED'
  const evaluationFaite = Boolean(ticket.rating) || evaluationSent

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

      {/* Onglets Informations / Suivi de la demande */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-2xl mx-auto flex gap-1">
          {[
            { cle: 'infos', label: 'Informations' },
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

      {/* Onglet : Suivi de la demande */}
      {onglet === 'suivi' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-4 overflow-y-auto">
          <LifecycleStepper ticket={ticket} />

          {/* Pièces jointes en lecture seule (ajoutées à la création du ticket) */}
          {attachments.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-800 mb-3">
                Pièces jointes
              </p>

              <div className="space-y-2">
                {attachments.map((file) => {
                  const isImage = IMAGE_EXTENSION_REGEX.test(file.original_name)
                  return (
                    <div
                      key={file.id}
                      className="border rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">{file.original_name}</p>
                        <p className="text-xs text-slate-500">
                          {(file.file_size / 1024).toFixed(1)} Ko
                        </p>
                      </div>

                      {file.file_url && (
                        <div className="flex items-center gap-3 shrink-0">
                          {isImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewFile(file)}
                              className="text-secondary text-sm hover:underline"
                            >
                              Voir
                            </button>
                          )}
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-secondary text-sm hover:underline"
                          >
                            Télécharger
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onglet : Informations du ticket */}
      {onglet === 'infos' && (
        <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-slate-800">
              Détail de la demande
            </p>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                Objet
              </p>
              <p className="text-sm text-slate-700">{ticket.title}</p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                Description
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {ticket.description || '—'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                  Référence
                </p>
                <p className="text-sm font-mono text-slate-600">
                  {ticket.ticket_number}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                  Créé le
                </p>
                <p className="text-sm text-slate-600">
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString('fr-FR')
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Évaluation puis clôture — visibles une fois le ticket résolu */}
          {isResolved && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-800 mb-2">
                Évaluer la résolution
              </p>

              {evaluationFaite ? (
                <>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={18}
                        className={
                          n <= rating ? 'fill-accent text-accent' : 'text-slate-200'
                        }
                      />
                    ))}
                  </div>

                  <p className="text-sm text-slate-500">
                    Merci, ton évaluation a bien été enregistrée.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)}>
                        <Star
                          size={20}
                          className={
                            n <= rating ? 'fill-accent text-accent' : 'text-slate-300'
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
                    Soumettre l&apos;évaluation
                  </button>
                </>
              )}

              {/* Clôture : proposée après l'évaluation, tant que le ticket
                  n'est pas déjà clôturé. */}
              {evaluationFaite && !isClosed && (
                <div className="border-t border-slate-100 mt-4 pt-4">
                  <p className="text-sm text-slate-600 mb-2">
                    Si la solution vous convient, vous pouvez clôturer ce ticket.
                    Cette action est définitive.
                  </p>

                  <button
                    type="button"
                    onClick={submitCloture}
                    disabled={clotureEnCours}
                    className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
                  >
                    <CheckCircle2 size={15} />
                    {clotureEnCours ? 'Clôture…' : 'Marquer comme fermé'}
                  </button>
                </div>
              )}

              {isClosed && (
                <div className="border-t border-slate-100 mt-4 pt-4 flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  Ticket clôturé.
                </div>
              )}
            </div>
          )}
        </div>
      )}



      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="max-w-3xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white truncate">{previewFile.original_name}</p>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="text-white text-sm hover:opacity-70"
              >
                Fermer ✕
              </button>
            </div>
            <img
              src={previewFile.file_url}
              alt={previewFile.original_name}
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg bg-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketDetailPage