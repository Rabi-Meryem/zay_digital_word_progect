import ProfilePanel from '../components/profile/ProfilePanel'

// Route : /agent/profil
function AgentProfilePage() {
  return (
    <div className="bg-slate-50 min-h-full">
      <main className="p-4 sm:p-6">
        <h1 className="text-lg font-semibold text-slate-800 mb-4">Mon profil</h1>
        <ProfilePanel />
      </main>
    </div>
  )
}

export default AgentProfilePage
