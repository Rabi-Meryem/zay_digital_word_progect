// src/pages/supervisor/SupervisorNewTicketPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Création d'un ticket par le SUPERVISEUR (/supervisor/tickets/nouveau).
//
// Le ticket est désormais créé au nom du CLIENT sélectionné (client_id),
// et non plus au nom du superviseur. Voir backend/tickets/views.py
// (TicketListCreateView.post) et backend/tickets/serializers.py
// (TicketCreateSerializer.client_id).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Paperclip, X, Send, Sparkles, User as UserIcon, Search } from 'lucide-react'
import { createTicket } from '../../api/tickets'
import { searchClients } from '../../api/users'

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
  clientId: z
    .number({ invalid_type_error: 'Sélectionne le client concerné par ce ticket.' })
    .int()
    .positive('Sélectionne le client concerné par ce ticket.'),
})

const CAS_USAGE = [
  'Incident remonté par téléphone ou en réunion',
  'Demande interne à tracer dans le portail',
  'Panne détectée par la supervision avant tout signalement client',
]

function SupervisorNewTicketPage() {
  const navigate = useNavigate()
  const [fichiers, setFichiers] = useState([])
  const [envoi, setEnvoi] = useState(false)

  // ── Recherche / sélection du client ──
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState([])
  const [chargementClients, setChargementClients] = useState(false)
  const [clientChoisi, setClientChoisi] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ticketSchema) })

  const description = watch('description') ?? ''

  // Recherche des clients avec un léger debounce
  useEffect(() => {
    if (!recherche.trim()) {
      setResultats([])
      return
    }
    const timer = setTimeout(async () => {
      setChargementClients(true)
      try {
        const data = await searchClients(recherche.trim())
        setResultats(data)
      } catch (error) {
        toast.error('Impossible de charger la liste des clients.')
      } finally {
        setChargementClients(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [recherche])

  const choisirClient = useCallback(
    (client) => {
      setClientChoisi(client)
      setValue('clientId', client.id, { shouldValidate: true })
      setRecherche('')
      setResultats([])
    },
    [setValue]
  )

  const retirerClient = () => {
    setClientChoisi(null)
    setValue('clientId', undefined, { shouldValidate: true })
  }

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

  const retirerFichier = (index) => setFichiers((f) => f.filter((_, i) => i !== index))

  const onSubmit = async (values) => {
    setEnvoi(true)
    try {
      const ticket = await createTicket({
        title: values.title,
        description: values.description,
        clientId: values.clientId,
        files: fichiers,
      })

      if (ticket.attachments_rejected?.length) {
        ticket.attachments_rejected.forEach((r) => toast.error(`${r.file} : ${r.reason}`))
      }

      toast.success(`Ticket ${ticket.ticket_number} créé pour ${clientChoisi?.full_name}.`)
      navigate('/supervisor/affectation')
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.title?.[0] ||
          error.response?.data?.description?.[0] ||
          error.response?.data?.client_id?.[0] ||
          'Impossible de créer le ticket.'
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="max-w-6xl">
      <button
        type="button"
        onClick={() => navigate('/supervisor/affectation')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
      >
        <ArrowLeft size={16} />
        Retour à l&apos;affectation
      </button>

      <h1 className="text-lg font-semibold text-slate-800">Nouveau ticket</h1>
      <p className="text-xs text-slate-400 mt-0.5 mb-4">
        Ouvrir un ticket pour le compte d&apos;un client — il rejoint la file d&apos;affectation
        normale et suit les mêmes règles SLA.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">
          {/* ── Sélection du client ── */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Client concerné
            </label>

            {clientChoisi ? (
              <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  <UserIcon size={15} className="text-slate-400" />
                  {clientChoisi.full_name}
                  <span className="text-xs text-slate-400">({clientChoisi.email})</span>
                </span>
                <button
                  type="button"
                  onClick={retirerClient}
                  className="text-slate-400 hover:text-danger"
                  aria-label="Changer de client"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher un client par nom ou email…"
                  className="w-full text-sm border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
                {(resultats.length > 0 || chargementClients) && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {chargementClients && (
                      <p className="text-xs text-slate-400 px-3 py-2">Recherche…</p>
                    )}
                    {!chargementClients &&
                      resultats.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => choisirClient(c)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex flex-col"
                        >
                          <span className="text-slate-700">{c.full_name}</span>
                          <span className="text-xs text-slate-400">{c.email}</span>
                        </button>
                      ))}
                    {!chargementClients && resultats.length === 0 && (
                      <p className="text-xs text-slate-400 px-3 py-2">Aucun client trouvé.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* champ caché contrôlé pour la validation zod */}
            <Controller
              name="clientId"
              control={control}
              defaultValue={undefined}
              render={() => <input type="hidden" {...register('clientId', { valueAsNumber: true })} />}
            />
            {errors.clientId && (
              <p className="text-xs text-danger mt-1">{errors.clientId.message}</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Objet de la demande
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              placeholder="Ex : Coupure du serveur de facturation signalée par téléphone"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
            {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Description détaillée
            </label>
            <textarea
              id="description"
              rows={9}
              {...register('description')}
              placeholder="Contexte, symptômes constatés, périmètre impacté, vérifications déjà faites…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-y"
            />
            <div className="flex items-start justify-between gap-3 mt-1">
              {errors.description ? (
                <p className="text-xs text-danger">{errors.description.message}</p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-slate-400 shrink-0">
                {description.length} caractères
              </span>
            </div>
          </div>

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
              {MAX_FICHIERS} fichiers max, {TAILLE_MAX_MO} Mo chacun.
            </p>
          </div>

          <div className="flex gap-2 pb-6">
            <button
              type="button"
              onClick={() => navigate('/supervisor/affectation')}
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
              {envoi ? 'Envoi…' : 'Créer le ticket'}
            </button>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-600 mb-2">Quand ouvrir un ticket ici :</p>
            <ul className="space-y-1">
              {CAS_USAGE.map((c) => (
                <li key={c} className="text-xs text-slate-500 flex gap-1.5">
                  <span className="text-slate-300">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2.5 bg-primary/5 border border-primary/10 rounded-lg p-3">
            <Sparkles size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11px] text-slate-600 leading-snug">
              <span className="font-medium text-slate-800">Criticité automatique.</span> Le ticket est
              créé en priorité Moyenne puis reclassé par le module IA. Tu pourras l&apos;ajuster
              toi-même depuis « Criticité des tickets ».
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupervisorNewTicketPage