import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import LoginPage from './pages/LoginPage'
import ClientLayout from './components/layout/ClientLayout'
import ClientOverviewPage from './pages/ClientOverviewPage'
import ClientTicketsPage from './pages/ClientTicketsPage'
import NewTicketPage from './pages/NewTicketPage'
import ClientProfilePage from './pages/ClientProfilePage'
import AgentLayout from './components/layout/AgentLayout'
import AgentDashboardPage from './pages/AgentDashboardPage'
import AgentTicketPage from './pages/AgentTicketPage'
import AgentChatPage from './pages/AgentChatPage'
import AgentMessagesPage from './pages/AgentMessagesPage'
import AgentProfilePage from './pages/AgentProfilePage'
import AgentStatsPage from './pages/AgentStatsPage'
import SupervisorDashboardPage from './pages/supervisor/SupervisorDashboardPage'
import SupervisorProfilePage from './pages/SupervisorProfilePage'
import TicketDetailPage from './pages/TicketDetailPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { fetchMe } from './store/authSlice'
import { getAccessToken } from './api/tokenStorage'
import { adminRoutes } from './routes/adminRoutes'

function App() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {
    if (getAccessToken() && !user) {
      dispatch(fetchMe())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Portail client — sidebar persistante (ClientLayout + <Outlet />) */}
      <Route
        element={
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ClientOverviewPage />} />
        <Route path="/tickets" element={<ClientTicketsPage />} />
        <Route path="/tickets/nouveau" element={<NewTicketPage />} />
        <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="/profil" element={<ClientProfilePage />} />
      </Route>

      <Route
        path="/agent"
        element={
          <ProtectedRoute>
            <AgentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="tickets/:ticketId" element={<AgentTicketPage />} />
        <Route path="tickets/:ticketId/messages" element={<AgentChatPage />} />
        <Route path="messages" element={<AgentMessagesPage />} />
        <Route path="profil" element={<AgentProfilePage />} />
        <Route path="stats" element={<AgentStatsPage />} />
      </Route>

      <Route
        path="/supervisor/dashboard"
        element={
          <ProtectedRoute>
            <SupervisorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/supervisor/profil" element={<ProtectedRoute><SupervisorProfilePage /></ProtectedRoute>} />

      {adminRoutes}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App