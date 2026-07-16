import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// Pour prévisualiser l'app sans backend qui tourne : ajoute VITE_SKIP_AUTH=true
// dans ton .env local (jamais commité — voir .gitignore). Retire-le une fois
// la connexion réelle disponible.
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true'

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated && !SKIP_AUTH) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute