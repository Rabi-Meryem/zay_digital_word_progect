import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'

// Cloche de notifications temps réel du portail client.
//
// ⚠️ En attente de GET /api/notifications/ (+ WebSocket) côté backend.
// Tant que cette route n'existe pas, la cloche reste vide plutôt que
// d'afficher de fausses notifications pointant vers des tickets qui
// n'existent pas réellement.

function ClientNotificationsBell({ variant = 'light' }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const navigate = useNavigate()

  const unreadCount = items.filter((n) => !n.read).length
  const bellColor = variant === 'dark' ? 'text-white/90 hover:text-white' : 'text-slate-500 hover:text-slate-700'

  const openTicket = (notification) => {
    setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
    setOpen(false)
    navigate(`/tickets/${notification.ticketId}`)
  }

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative ${bellColor}`}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer les notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-secondary hover:underline"
                >
                  <Check size={13} />
                  Tout marquer lu
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Aucune notification pour le moment.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openTicket(n)}
                      className={`w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-700 leading-snug">{n.text}</span>
                      </span>
                      {!n.read && <span className="ml-auto mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ClientNotificationsBell
