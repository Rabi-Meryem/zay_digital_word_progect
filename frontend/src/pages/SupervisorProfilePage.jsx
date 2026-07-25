import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ProfilePanel from '../components/profile/ProfilePanel'

// Route : /supervisor/profil
function SupervisorProfilePage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-4 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/supervisor/dashboard')}
          className="opacity-80 hover:opacity-100" aria-label="Retour">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="font-semibold text-sm">ZAY Digital World</p>
          <p className="text-xs text-primary-foreground/70">Mon profil · Console Superviseur</p>
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <ProfilePanel />
      </main>
    </div>
  )
}

export default SupervisorProfilePage
