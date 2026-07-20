import { useState } from 'react'
import { FileText, Sheet } from 'lucide-react'
import toast from 'react-hot-toast'

// Ligne 4 (gauche) : export des rapports.
//
// ⚠️ L'export réel sera produit par le backend (GET /api/reports/?format=pdf&periode=...).
// En attendant, le bouton simule l'appel et affiche un retour utilisateur : l'interface
// est complète côté frontend, il ne restera qu'à brancher l'URL.

const PERIODES = [
  { cle: 'mensuel', label: 'Rapport mensuel' },
  { cle: 'trimestriel', label: 'Rapport trimestriel' },
  { cle: 'annuel', label: 'Rapport annuel' },
]

function ReportExport() {
  const [periode, setPeriode] = useState('mensuel')
  const [enCours, setEnCours] = useState(null)

  const exporter = async (format) => {
    setEnCours(format)

    // TODO API : remplacer par
    // const res = await api.get(`/reports/?format=${format}&periode=${periode}`, { responseType: 'blob' })
    // const url = URL.createObjectURL(res.data)
    // const a = document.createElement('a')
    // a.href = url; a.download = `rapport_${periode}.${format}`; a.click()
    // URL.revokeObjectURL(url)
    await new Promise((resolve) => setTimeout(resolve, 600))

    setEnCours(null)
    const libelle = PERIODES.find((p) => p.cle === periode)?.label
    toast.success(`${libelle} — export ${format.toUpperCase()} généré`)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">Export de rapports</h2>

      <label htmlFor="periode-rapport" className="block text-xs text-slate-500 mb-1">
        Période
      </label>
      <select
        id="periode-rapport"
        value={periode}
        onChange={(e) => setPeriode(e.target.value)}
        className="w-full mb-3 text-sm border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
      >
        {PERIODES.map((p) => (
          <option key={p.cle} value={p.cle}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => exporter('pdf')}
          disabled={enCours !== null}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <FileText size={14} />
          {enCours === 'pdf' ? 'Génération…' : 'Export PDF'}
        </button>
        <button
          type="button"
          onClick={() => exporter('xlsx')}
          disabled={enCours !== null}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <Sheet size={14} />
          {enCours === 'xlsx' ? 'Génération…' : 'Export Excel'}
        </button>
      </div>

      <p className="mt-2.5 text-[11px] text-slate-400 leading-snug">
        Le rapport reprend vos KPI, le détail de vos tickets et le respect des SLA sur la période choisie.
      </p>
    </div>
  )
}

export default ReportExport
