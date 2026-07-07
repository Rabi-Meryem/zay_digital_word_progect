import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'

function DashboardPage() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center">
      <h1 className="text-2xl font-semibold text-primary">
        Bienvenue{user?.first_name ? `, ${user.first_name}` : ''}
      </h1>
      <p className="text-slate-500 max-w-sm">
        Page temporaire, le temps que les vrais tableaux de bord (client / agent /
        superviseur / admin) soient développés.
      </p>
      <button
        type="button"
        onClick={() => dispatch(logout())}
        className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition text-sm font-medium"
      >
        Se déconnecter
      </button>
    </div>
  )
}

export default DashboardPage
