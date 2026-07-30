import { Check } from 'lucide-react'
import { etapesDuTicket } from '../../utils/lifecycle'

// Suivi en temps réel du cycle de vie du ticket, affiché sur /tickets/:id.
// Créé → Pris en charge → Analyse → Solution → Validation → Résolu → Fermé
//
// Deux rendus : vertical sur mobile/tablette, horizontal à partir de lg.

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Pastille({ faite, courante }) {
  return (
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        faite
          ? 'bg-success text-white'
          : courante
          ? 'bg-secondary text-white ring-4 ring-secondary/15'
          : 'bg-slate-200'
      }`}
      aria-hidden="true"
    >
      {faite && <Check size={12} strokeWidth={3} />}
    </span>
  )
}

function LifecycleStepper({ ticket = {} }) {
  const etapes = etapesDuTicket(ticket)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 lg:px-10 lg:py-8">
      <h2 className="text-base font-semibold text-slate-800 mb-6 lg:mb-10">
        Suivi de votre demande
      </h2>

      {/* ---------- Vertical : mobile / tablette ---------- */}
      <ol className="lg:hidden">
        {etapes.map((e, i) => {
          const dernier = i === etapes.length - 1
          const faite = e.etat === 'faite'
          const courante = e.etat === 'courante'

          return (
            <li key={e.cle} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <Pastille faite={faite} courante={courante} />
                {!dernier && (
                  <span
                    className={`w-0.5 flex-1 min-h-[36px] ${
                      faite ? 'bg-success/40' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>

              <div className={dernier ? 'pt-0.5' : 'pt-0.5 pb-7'}>
                <p
                  className={`text-sm leading-tight ${
                    courante
                      ? 'font-semibold text-secondary'
                      : faite
                      ? 'font-medium text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {e.label}
                  {courante && (
                    <span className="ml-2 font-normal text-xs text-slate-400">en cours</span>
                  )}
                </p>
                {e.date && (
                  <p className="text-xs text-slate-400 mt-1.5">{formatDate(e.date)}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {/* ---------- Horizontal : à partir de lg ----------
          Colonnes de largeur égale (flex-1). Chaque trait est positionné en
          absolu du centre de l'étape précédente au centre de l'étape courante,
          ce qui garantit qu'aucun segment n'est tronqué. */}
      <ol className="hidden lg:flex items-start">
        {etapes.map((e, i) => {
          const faite = e.etat === 'faite'
          const courante = e.etat === 'courante'
          const precedenteFaite = i > 0 && etapes[i - 1].etat === 'faite'

          return (
            <li key={e.cle} className="relative flex-1 flex flex-col items-center">
              {i > 0 && (
                <span
                  className={`absolute top-[10px] left-[-50%] right-1/2 h-0.5 -translate-y-1/2 ${
                    precedenteFaite ? 'bg-success/40' : 'bg-slate-200'
                  }`}
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10">
                <Pastille faite={faite} courante={courante} />
              </div>

              <div className="mt-3 px-2 text-center">
                <p
                  className={`text-sm leading-snug ${
                    courante
                      ? 'font-semibold text-secondary'
                      : faite
                      ? 'font-medium text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {e.label}
                </p>
                {courante && <p className="text-xs text-slate-400 mt-1">en cours</p>}
                {e.date && <p className="text-xs text-slate-400 mt-1">{formatDate(e.date)}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default LifecycleStepper