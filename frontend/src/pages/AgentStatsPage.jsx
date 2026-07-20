import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AgentStatsPanel from '../components/agent/AgentStatsPanel'

// Route : /agent/stats
function AgentStatsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/agent/dashboard')}
          className="opacity-80 hover:opacity-100" aria-label="Retour">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="font-semibold text-sm">ZAY Digital World</p>
          <p className="text-xs text-primary-foreground/70">Mon évolution · Console Agent</p>
        </div>
      </header>
      <main className="p-4 sm:p-6 max-w-4xl">
        <h1 className="text-lg font-semibold text-slate-800 mb-4">Mes statistiques</h1>
        <AgentStatsPanel />
      </main>
    </div>
  )
}

export default AgentStatsPage
