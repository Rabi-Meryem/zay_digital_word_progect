import AgentStatsPanel from '../components/agent/AgentStatsPanel'

// Route : /agent/stats
function AgentStatsPage() {
  return (
    <div className="bg-slate-50 min-h-full">
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">
        <h1 className="text-lg font-semibold text-slate-800 mb-4">Mes statistiques</h1>
        <AgentStatsPanel />
      </main>
    </div>
  )
}

export default AgentStatsPage
