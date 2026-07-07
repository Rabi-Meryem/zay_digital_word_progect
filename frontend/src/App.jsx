import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { fetchMe } from './store/authSlice'
import { getAccessToken } from './api/tokenStorage'

function App() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  // Après un rechargement de page, le token reste dans localStorage mais le
  // profil (nom, rôle...) a été perdu en mémoire : on le recharge une fois.
  useEffect(() => {
    if (getAccessToken() && !user) {
      dispatch(fetchMe())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
