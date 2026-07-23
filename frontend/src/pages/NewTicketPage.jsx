import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Paperclip, X, Send, Sparkles } from 'lucide-react'
import ClientHeader from '../components/layout/ClientHeader'
import { createTicket } from '../api/tickets'

const MAX_FICHIERS = 3
const TAILLE_MAX_MO = 5

const ticketSchema = z.object({
  title: z
    .string()
    .min(5, 'Le titre doit faire au moins 5 caractères.')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères.'),
  description: z
    .string()
    .min(30, 'Décris le problème en 30 caractères minimum pour permettre une analyse fiable.'),
})

const AIDE = [
  'Ce qui se passe, et depuis quand',
  'Le message d\'erreur exact, si tu en as un',
  'Ce que tu faisais juste avant',
  'Ce que tu as déjà essayé',
]

function NewTicketPage() {
  const navigate = useNavigate()
  const [fichiers, setFichiers] = useState([])
  const [envoi, setEnvoi] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ticketSchema) })

  const description = watch('description') ?? ''

  const ajouterFichiers = (e) => {
    const nouveaux = Array.from(e.target.files ?? [])
    const trop = nouveaux.find((f) => f.size > TAILLE_MAX_MO * 1024 * 1024)
    if (trop) {
      toast.error(`${trop.name} dépasse ${TAILLE_MAX_MO} Mo.`)
      return
    }
    if (fichiers.length + nouveaux.length > MAX_FICHIERS) {
      toast.error(`${MAX_FICHIERS} pièces jointes au maximum.`)
      return
    }
    setFichiers((f) => [...f, ...nouveaux])
    e.target.value = ''
  }

  const retirerFichier = (index) => {
    setFichiers((f) => f.filter((_, i) => i !== index))
  }

  const onSubmit = async (values) => {
    setEnvoi(true)
    try {
      const ticket = await createTicket({
        title: values.title,
        description: values.description,
        files: fichiers,
      })

      if (ticket.attachments_rejected?.length) {
        ticket.attachments_rejected.forEach((r) =>
          toast.error(`${r.file} : ${r.reason}`)
        )
      }

      toast.success(`Ticket ${ticket.ticket_number} créé.`)
      navigate(`/tickets/${ticket.id}`)
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.title?.[0] ||
        error.response?.data?.description?.[0] ||
        "Impossible de créer le ticket."
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader />

      <main className="max-w-2xl mx-auto p-4">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft size={16} />
          Retour à mes tickets
        </button>

        <h1 className="text-lg font-semibold text-slate-800">Nouveau ticket</h1>
        <p className="text-xs text-slate-400 mt-0.5 mb-4">
          Décris ta demande : elle sera analysée puis transmise à l'agent compétent.
        </p>

        <div className="space-y-4">
          {/* Titre */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Objet de la demande
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              placeholder="Ex : L'application ne démarre plus depuis ce matin"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
            {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description détaillée
            </label>
            <textarea
              id="description"
              rows={7}
              {...register('description')}
              placeholder="Décris le problème le plus précisément possible…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-y"
            />
            <div className="flex items-start justify-between gap-3 mt-1">
              {errors.description ? (
                <p className="text-xs text-danger">{errors.description.message}</p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-slate-400 shrink-0">{description.length} caractères</span>
            </div>

            <div className="mt-3 bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] font-medium text-slate-600 mb-1.5">
                Pour un traitement plus rapide, pense à préciser :
              </p>
              <ul className="space-y-0.5">
                {AIDE.map((a) => (
                  <li key={a} className="text-[11px] text-slate-500 flex gap-1.5">
                    <span className="text-slate-300">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pièces jointes */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Pièces jointes <span className="font-normal text-slate-400">(facultatif)</span>
            </p>

            {fichiers.length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {fichiers.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="truncate text-slate-600">{f.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400">{(f.size / 1024).toFixed(0)} Ko</span>
                      <button
                        type="button"
                        onClick={() => retirerFichier(i)}
                        className="text-slate-400 hover:text-danger"
                        aria-label={`Retirer ${f.name}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {fichiers.length < MAX_FICHIERS && (
              <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer hover:underline w-fit">
                <Paperclip size={14} />
                Ajouter un fichier
                <input type="file" multiple onChange={ajouterFichiers} className="hidden" />
              </label>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              Capture d'écran ou fichier de log — {MAX_FICHIERS} fichiers max, {TAILLE_MAX_MO} Mo chacun.
            </p>
          </div>

          {/* Note sur la criticité */}
          <div className="flex gap-2.5 bg-primary/5 border border-primary/10 rounded-lg p-3">
            <Sparkles size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11px] text-slate-600 leading-snug">
              <span className="font-medium text-slate-800">Criticité automatique.</span> Tu n'as pas à
              évaluer l'urgence toi-même : elle est déterminée à partir de ta description et du module
              concerné, puis vérifiée par l'agent. Plus ta description est précise, plus le délai de
              traitement annoncé sera juste.
            </p>
          </div>

          <div className="flex gap-2 pb-6">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="text-sm font-medium border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={envoi}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-50"
            >
              <Send size={15} />
              {envoi ? 'Envoi…' : 'Envoyer ma demande'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NewTicketPage