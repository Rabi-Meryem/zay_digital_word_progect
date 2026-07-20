import { useState } from 'react'
import { ArrowUpRight, AlertTriangle, X } from 'lucide-react'
import { escalateTicket } from '../../api/tickets'

// Écran 2.4 — Fenêtre contextuelle d'escalade institutionnelle.
// Côté backend, le modèle Escalation attend { escalation_type: 'MANUAL',
// reason: texte libre } : les 4 motifs ci-dessous + le contexte saisi
// alimenteront ce champ "reason" quand la route POST existera.

const REASONS = [
  { key: 'HORS_COMPETENCES', title: 'Hors compétences', subtitle: 'Nécessite expertise niveau 2' },
  { key: 'CLIENT_INSATISFAIT', title: 'Client insatisfait', subtitle: 'Situation conflictuelle' },
  { key: 'ACCES_REQUIS', title: 'Accès requis', subtitle: 'Besoin droits admin' },
  { key: 'RISQUE_SLA', title: 'Risque SLA', subtitle: 'Délai en danger' },
]

function EscalationModal({ ticket, onClose, onConfirm }) {
  const [reason, setReason] = useState(null)
  const [context, setContext] = useState('')

  const shortNumber = ticket.ticket_number.split('-').pop()

 
const confirm = async () => {
  if (!reason) return
  const reasonLabel  = REASONS.find((r) => r.key === reason)?.title
  // On combine la raison choisie + le contexte écrit → champ "reason" du backend
  const fullReason   = `${reasonLabel} — ${context.trim()}`

  try {
    await escalateTicket(ticket.id, fullReason)
    onConfirm({ reason, reasonLabel, context: context.trim() })
  } catch (error) {
    console.error('Erreur escalade:', error)
    // Afficher l'erreur à l'utilisateur si besoin
  }
}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Escalader le ticket ${shortNumber}`}
    >
      {/* Fond assombri — cliquer dessus ferme la fenêtre */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 cursor-default"
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-danger">
              <ArrowUpRight size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-800">
                Escalader le ticket #{shortNumber}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Le ticket sera transmis au superviseur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Raison de l'escalade</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASONS.map((r) => {
                const selected = reason === r.key
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setReason(r.key)}
                    className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      selected
                        ? 'border-danger bg-danger/5'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${selected ? 'text-danger' : 'text-slate-700'}`}>
                      {r.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.subtitle}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="escalation-context" className="text-sm font-medium text-slate-700 block mb-1.5">
              Contexte pour le superviseur
            </label>
            <textarea
              id="escalation-context"
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ce que tu as déjà essayé, ce dont tu as besoin…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-accent/10 border border-accent/30 px-3 py-2.5">
            <AlertTriangle size={15} className="text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-accent">
              Le superviseur sera notifié immédiatement par email et sur la plateforme.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm text-slate-600 border border-slate-200 rounded-lg py-2 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!reason}
            onClick={confirm}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-danger text-white rounded-lg py-2 hover:bg-danger/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight size={15} />
            Confirmer l'escalade
          </button>
        </div>
      </div>
    </div>
  )
}

export default EscalationModal
