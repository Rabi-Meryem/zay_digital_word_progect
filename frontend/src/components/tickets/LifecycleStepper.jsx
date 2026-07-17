import { Check } from 'lucide-react'
import { etapesDuTicket } from '../../utils/lifecycle'

// Suivi en temps réel du cycle de vie du ticket, affiché sur /tickets/:id.
// Créé → Pris en charge → Analyse → Solution → Validation → Résolu → Fermé

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function LifecycleStepper({ ticket = {} }) {
  const etapes = etapesDuTicket(ticket)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-4">Suivi de votre demande</h2>

      <ol>
        {etapes.map((e, i) => {
          const dernier = i === etapes.length - 1
          const faite = e.etat === 'faite'
          const courante = e.etat === 'courante'

          return (
            <li key={e.cle} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    faite
                      ? 'bg-success text-white'
                      : courante
                      ? 'bg-secondary text-white ring-4 ring-secondary/15'
                      : 'bg-slate-200'
                  }`}
                  aria-hidden="true"
                >
                  {faite && <Check size={10} strokeWidth={3} />}
                </span>
                {!dernier && (
                  <span className={`w-0.5 flex-1 min-h-[24px] ${faite ? 'bg-success/40' : 'bg-slate-200'}`} />
                )}
              </div>

              <div className={dernier ? '' : 'pb-4'}>
                <p
                  className={`text-xs leading-none ${
                    courante
                      ? 'font-semibold text-secondary'
                      : faite
                      ? 'font-medium text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {e.label}
                  {courante && <span className="ml-2 font-normal text-[11px] text-slate-400">en cours</span>}
                </p>
                {e.date && <p className="text-[11px] text-slate-400 mt-1">{formatDate(e.date)}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default LifecycleStepper
