import ClientHeader from '../components/layout/ClientHeader'
import ProfilePanel from '../components/profile/ProfilePanel'

// Route : /profil  — espace client.
function ClientProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader />
      <main className="p-4 sm:p-6">
        <h1 className="text-lg font-semibold text-slate-800 mb-4">Mon profil</h1>
        <ProfilePanel />
      </main>
    </div>
  )
}

export default ClientProfilePage
