import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import LoginPage from './pages/LoginPage'
import ClientDashboardPage from './pages/ClientDashboardPage'
import AgentDashboardPage from './pages/AgentDashboardPage'
import AgentTicketPage from './pages/AgentTicketPage'
import AgentChatPage from './pages/AgentChatPage'
import AgentMessagesPage from './pages/AgentMessagesPage'
import SupervisorDashboardPage from './pages/supervisor/SupervisorDashboardPage'
import TicketDetailPage from './pages/TicketDetailPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { fetchMe } from './store/authSlice'
import { getAccessToken } from './api/tokenStorage'
import SupervisorProfilePage from './pages/SupervisorProfilePage'

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
            <ClientDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/dashboard"
        element={
          <ProtectedRoute>
            <AgentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/tickets/:ticketId"
        element={
          <ProtectedRoute>
            <AgentTicketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/tickets/:ticketId/messages"
        element={
          <ProtectedRoute>
            <AgentChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/dashboard"
        element={
          <ProtectedRoute>
            <SupervisorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/messages"
        element={
          <ProtectedRoute>
            <AgentMessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:ticketId"
        element={
          <ProtectedRoute>
            <TicketDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/supervisor/profil" element={<ProtectedRoute><SupervisorProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
