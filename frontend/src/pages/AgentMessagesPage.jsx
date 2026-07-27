// Entrée « Messages » de la barre latérale : conversations en cours de l'agent.
// ⚠️ En attente de GET /api/messages/ côté backend. Tant que la route n'existe
// pas, la page reste vide plutôt que d'afficher des tickets inexistants.

function AgentMessagesPage() {
  const conversations = []

  return (
    <div className="bg-slate-50 min-h-full">
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-slate-800">Messages</h1>
          <p className="text-sm text-slate-400">{conversations.length} conversations</p>
        </div>

        <p className="text-center text-sm text-slate-400 py-10">
          Aucune conversation en cours.
        </p>
      </main>
    </div>
  )
}

export default AgentMessagesPage