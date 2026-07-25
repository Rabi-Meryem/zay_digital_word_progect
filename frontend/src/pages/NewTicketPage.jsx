import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Paperclip, X, Send, Sparkles } from 'lucide-react'
import { BLOCS } from '../data/modules'
import { addMockTicket } from '../data/mockTickets'

// Écran de création d'un ticket (/tickets/nouveau).
//
// La criticité n'est pas demandée au client : elle est déterminée par le module
// IA à partir de la description et du module concerné (voir les champs
// priority / ai_priority / ai_confidence du modèle Ticket). Le formulaire est
// donc conçu pour obtenir une description exploitable par le classifieur.
//
// ⚠️ La création est locale (voir addMockTicket dans mockTickets.js).
// TODO API : POST /api/tickets/ avec { title, description, module_concerne, source: 'WEB' }
// → le backend renvoie le ticket créé avec ticket_number, priority, ai_priority,
//   ai_confidence et sla_deadline.

const MAX_FICHIERS = 3
const TAILLE_MAX_MO = 5

const ticketSchema = z.object({
  title: z
    .string()
    .min(5, 'Le titre doit faire au moins 5 caractères.')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères.'),
  module_concerne: z.string().min(1, 'Sélectionne le module concerné.'),
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

    // TODO API : remplacer par un POST multipart vers /api/tickets/
    // (les pièces jointes alimentent le modèle TicketAttachment).
    await new Promise((resolve) => setTimeout(resolve, 500))

    const ticket = addMockTicket(values)
    setEnvoi(false)
    toast.success(`Ticket ${ticket.ticket_number} créé.`)
    navigate(`/tickets/${ticket.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Colonne principale — formulaire */}
          <div className="lg:col-span-2 space-y-4">
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

            {/* Module concerné */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <label htmlFor="module_concerne" className="block text-sm font-medium text-slate-700 mb-1">
                Module concerné
              </label>
              <select
                id="module_concerne"
                {...register('module_concerne')}
                defaultValue=""
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="" disabled>
                  Sélectionner un module…
                </option>
                {BLOCS.map((bloc) => (
                  <optgroup key={bloc.cle} label={bloc.label}>
                    {bloc.modules.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.module_concerne && (
                <p className="text-xs text-danger mt-1">{errors.module_concerne.message}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1.5">
                Le module permet d'orienter ta demande vers l'agent référent du bloc fonctionnel.
              </p>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description détaillée
              </label>
              <textarea
                id="description"
                rows={9}
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

          {/* Colonne latérale — aide à la rédaction + note criticité, toujours visible sur desktop */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-600 mb-2">
                Pour un traitement plus rapide, pense à préciser :
              </p>
              <ul className="space-y-1">
                {AIDE.map((a) => (
                  <li key={a} className="text-xs text-slate-500 flex gap-1.5">
                    <span className="text-slate-300">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2.5 bg-primary/5 border border-primary/10 rounded-lg p-3">
              <Sparkles size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[11px] text-slate-600 leading-snug">
                <span className="font-medium text-slate-800">Criticité automatique.</span> Tu n'as pas à
                évaluer l'urgence toi-même : elle est déterminée à partir de ta description et du module
                concerné, puis vérifiée par l'agent. Plus ta description est précise, plus le délai de
                traitement annoncé sera juste.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NewTicketPage
