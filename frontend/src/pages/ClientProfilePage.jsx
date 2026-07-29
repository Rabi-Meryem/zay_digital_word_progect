import ClientHeader from '../components/layout/ClientHeader'
import ProfilePanel from '../components/profile/ProfilePanel'

// Route : /profil — espace client, rendu à l'intérieur de ClientLayout
// (sidebar persistante) — pas de header propre ici.
function ClientProfilePage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-4">Mon profil</h1>
      <ProfilePanel />
    </div>
  )
}

export default ClientProfilePage
