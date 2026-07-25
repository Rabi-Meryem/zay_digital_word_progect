import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchSlaRules, updateSlaRule } from '../../../api/sla'

const PRIORITY_LABELS = {
  CRITICAL: { label: 'P1 — Critique', color: 'bg-red-100 text-red-700 border-red-300' },
  HIGH:     { label: 'P2 — Haute',    color: 'bg-orange-100 text-orange-700 border-orange-300' },
  MEDIUM:   { label: 'P3 — Moyenne',  color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  LOW:      { label: 'P4 — Faible',   color: 'bg-green-100 text-green-700 border-green-300' },
}
const ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function SlaConfigPage() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => { loadRules() }, [])

  async function loadRules() {
    try {
      setLoading(true)
      const data = await fetchSlaRules()
      setRules([...data].sort((a, b) => ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority)))
    } catch {
      toast.error("Impossible de charger les règles SLA.")
    } finally {
      setLoading(false)
    }
  }

  function updateField(id, field, value) {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)))
  }

  async function saveRule(rule) {
    if (rule.resolution_hours <= 0) return toast.error('Le délai doit être > 0.')
    if (rule.warning_percentage <= 0 || rule.warning_percentage > 100)
      return toast.error("Le seuil d'alerte doit être entre 1 et 100 %.")

    try {
      setSavingId(rule.id)
      await updateSlaRule(rule.id, {
        resolution_hours: Number(rule.resolution_hours),
        warning_percentage: Number(rule.warning_percentage),
        active: rule.active,
      })
      toast.success(`Règle ${PRIORITY_LABELS[rule.priority].label} mise à jour.`)
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Échec de la mise à jour.'
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Chargement des règles SLA...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Configuration des SLA</h1>
      <p className="text-gray-500 mb-6">
        Définis le délai maximal de résolution et le seuil d'alerte pour chaque priorité.
        Appliqué immédiatement à tous les nouveaux tickets créés.
      </p>

      <div className="space-y-4">
        {rules.map(rule => (
          <div key={rule.id}
            className={`border rounded-xl p-4 flex flex-wrap items-center gap-4 ${PRIORITY_LABELS[rule.priority].color}`}>
            <span className="font-semibold w-40">{PRIORITY_LABELS[rule.priority].label}</span>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              Délai (h)
              <input type="number" min={1} className="w-20 border rounded px-2 py-1 text-black"
                value={rule.resolution_hours}
                onChange={e => updateField(rule.id, 'resolution_hours', e.target.value)} />
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              Seuil alerte (%)
              <input type="number" min={1} max={100} className="w-16 border rounded px-2 py-1 text-black"
                value={rule.warning_percentage}
                onChange={e => updateField(rule.id, 'warning_percentage', e.target.value)} />
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={rule.active}
                onChange={e => updateField(rule.id, 'active', e.target.checked)} />
              Active
            </label>

            <button onClick={() => saveRule(rule)} disabled={savingId === rule.id}
              className="ml-auto bg-black text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {savingId === rule.id ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}