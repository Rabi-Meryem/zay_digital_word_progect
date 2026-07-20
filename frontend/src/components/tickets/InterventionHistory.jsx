import { useState } from 'react'
import { MOCK_INTERVENTIONS } from '../../data/mockClientActivity'

// Historique complet des interventions sur un ticket.
// Objectif : transparence totale, pour réduire les relances du client.
//
// TODO API : GET /api/tickets/{id}/timeline/

const FILTRES = [
  { cle: 'tous', label: 'Tout' },
  { cle: 'agent', label: 'Support' },
  { cle: 'client', label: 'Mes actions' },
  { cle: 'systeme', label: 'Système' },
]

const COULEUR = {
  client: 'bg-slate-400',
  agent: 'bg-success',
  ia: 'bg-primary',
  systeme: 'bg-danger',
}

const AUTEUR = {
  client: 'Vous',
  agent: 'Support',
  ia: 'IA',
  systeme: 'Système',
}

function InterventionHistory({ ticketId }) {
  const [filtre, setFiltre] = useState('tous')
  const interventions = MOCK_INTERVENTIONS[ticketId] ?? []

  const visibles = interventions.filter((i) => {
    if (filtre === 'tous') return true
    if (filtre === 'systeme') return i.type === 'systeme' || i.type === 'ia'
    return i.type === filtre
  })

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Historique des interventions</h2>
        <div className="flex gap-1">
          {FILTRES.map((f) => (
            <button
              key={f.cle}
              type="button"
              onClick={() => setFiltre(f.cle)}
              className={`text-[11px] px-2 py-1 rounded-full transition-colors ${
                filtre === f.cle
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">
          Aucune intervention enregistrée pour ce filtre.
        </p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium w-12">Heure</th>
              <th className="pb-2 font-medium">Action</th>
              <th className="pb-2 font-medium w-16 text-right">Auteur</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((i, idx) => (
              <tr key={idx} className="border-b border-slate-50 last:border-0">
                <td className="py-2 text-slate-400 align-top">{i.heure}</td>
                <td className="py-2 align-top">
                  <span className="flex items-start gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${COULEUR[i.type] ?? 'bg-slate-300'}`}
                      aria-hidden="true"
                    />
                    <span className="text-slate-700 leading-snug">{i.libelle}</span>
                  </span>
                </td>
                <td className="py-2 text-right text-slate-400 align-top">{AUTEUR[i.type] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default InterventionHistory
