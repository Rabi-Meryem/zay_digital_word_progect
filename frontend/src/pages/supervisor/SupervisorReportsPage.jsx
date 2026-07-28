import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Download } from 'lucide-react'
import { fetchAgents } from '../../api/supervisor'
import { downloadReport } from '../../api/reports'
import SupervisorNotificationsBell from '../../components/layout/SupervisorNotificationsBell'
import { TopBar, Card, PRIORITIES, STATUSES } from '../../components/supervisor/SupervisorUI'

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
]

function SupervisorReportsPage() {
  const [fmt, setFmt] = useState('pdf')
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [priority, setPriority] = useState('')
  const [ticketStatus, setTicketStatus] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchAgents().then(setAgents).catch(() => {})
  }, [])

  async function handleGenerate() {
    try {
      setDownloading(true)
      await downloadReport(fmt, {
        agent_id: agentId || undefined,
        priority: priority || undefined,
        status: ticketStatus || undefined,
      })
      toast.success('Rapport généré.')
    } catch {
      toast.error('Échec de la génération du rapport.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <TopBar
        title="Rapports & exports"
        desc="Générer un rapport de performance filtré au format PDF ou Excel"
      >
        <SupervisorNotificationsBell />
      </TopBar>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Paramètres du rapport">
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Agent</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
              >
                <option value="">Tous les agents</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>{a.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
              >
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Statut</label>
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
              >
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Format d'export">
          <div className="flex gap-2 mb-5">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFmt(f.value)}
                className={`flex-1 border rounded-xl py-3 flex flex-col items-center gap-1.5 text-xs font-medium ${
                  fmt === f.value ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-200 text-slate-600'
                }`}
              >
                <FileText size={20} />{f.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Le rapport inclut la synthèse des KPIs, la performance par agent et le détail
            des tickets escaladés, sur le périmètre filtré à gauche.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium mt-4 hover:bg-primary/90 disabled:opacity-50"
          >
            <Download size={15} /> {downloading ? 'Génération...' : 'Générer le rapport'}
          </button>
        </Card>
      </div>
    </>
  )
}

export default SupervisorReportsPage
