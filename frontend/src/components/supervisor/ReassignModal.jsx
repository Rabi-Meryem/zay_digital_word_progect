import { useEffect, useState } from 'react'
import { ArrowLeftRight, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchAgents, reassignEscalation, reassignTicket } from '../../api/supervisor'
import { initialsFromName, agentColor } from '../../utils/agentDisplay'
import { Avatar } from './SupervisorUI'

// Modale d'affectation d'un ticket à un agent.
// `ticket.isEscalation` distingue une escalade (route escalations) d'un
// ticket standard (route tickets/{id}/assign/).

function ReassignModal({ ticket, onClose, onDone }) {
  const [agents, setAgents] = useState([])
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const titre = ticket.dejaAffecte ? 'Réaffecter' : 'Affecter'

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(() => toast.error("Impossible de charger les agents."))
  }, [])

  async function confirm() {
    if (selected == null) return toast.error('Sélectionne un agent.')
    if (!ticket.id) {
      toast.error("Impossible d'affecter : ticket introuvable (id manquant).")
      return
    }
    try {
      setSaving(true)
      if (ticket.isEscalation) {
        await reassignEscalation(ticket.id, agents[selected].agent_id, note)
      } else {
        await reassignTicket(ticket.id, agents[selected].agent_id, note)
      }
      toast.success('Ticket affecté.')
      if (onDone) onDone()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'affectation.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex gap-2.5">
            <ArrowLeftRight size={19} className="text-secondary mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                {titre} le ticket {ticket.number}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{ticket.title}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Affecter à</p>
            {agents.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun agent disponible.</p>
            ) : (
              <div className="space-y-2">
                {agents.map((a, i) => (
                  <button
                    key={a.agent_id}
                    type="button"
                    onClick={() => setSelected(i)}
                    className={`w-full text-left border rounded-xl px-3.5 py-3 flex items-center gap-3 ${
                      selected === i ? 'border-secondary bg-secondary/5' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Avatar initials={initialsFromName(a.full_name)} color={agentColor(a.agent_id)} size={28} />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-700">{a.full_name}</span>
                      <span className="block text-xs text-slate-500">
                        {a.status === 'AVAILABLE' ? 'Disponible' : a.status}
                      </span>
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {a.workload} tickets
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Note pour l'agent (optionnel)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Consignes, contexte, priorité de traitement…"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>
        </div>

        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Check size={15} /> {saving ? 'Enregistrement...' : `Confirmer l'affectation`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReassignModal
