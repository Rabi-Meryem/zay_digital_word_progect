import ProfilePanel from '../components/profile/ProfilePanel'

// Route : /supervisor/profil — rendue à l'intérieur de SupervisorLayout
// (sidebar persistante) — pas de header propre ici.

function SupervisorProfilePage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800 mb-4">Mon profil</h1>
      <ProfilePanel />
    </div>
  )
}

export default SupervisorProfilePage
