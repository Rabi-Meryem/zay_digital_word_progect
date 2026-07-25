import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, Ticket, AlertTriangle, CheckCircle2, Check } from 'lucide-react'

// Cloche de notifications temps réel du portail client — même principe que
// components/agent/NotificationsPanel.jsx côté agent, pour que les 4 rôles
// (client, agent, superviseur, admin) disposent tous d'un centre de
// notifications cohérent dans leur en-tête.
//
// ⚠️ Données de démonstration — à remplacer par GET /api/notifications/
// (+ WebSocket) quand la route existera côté backend.

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'STATUS_CHANGE',
    text: 'Votre ticket #00046 est passé « En cours de traitement »',
    minutesAgo: 8,
    read: false,
    ticketId: 46,
  },
  {
    id: 2,
    type: 'NEW_MESSAGE',
    text: "L'agent a répondu sur le ticket #00048",
    minutesAgo: 25,
    read: false,
    ticketId: 48,
  },
  {
    id: 3,
    type: 'SLA_WARNING',
    text: 'Le ticket #00043 approche de son échéance SLA',
    minutesAgo: 90,
    read: false,
    ticketId: 43,
  },
  {
    id: 4,
    type: 'RESOLVED',
    text: 'Votre ticket #00040 a été résolu',
    minutesAgo: 620,
    read: true,
    ticketId: 40,
  },
]

const TYPE_ICONS = {
  NEW_MESSAGE: MessageSquare,
  SLA_WARNING: AlertTriangle,
  STATUS_CHANGE: Ticket,
  RESOLVED: CheckCircle2,
}

function formatAgo(minutes) {
  if (minutes < 60) return `il y a ${minutes} min`
  const h = Math.floor(minutes / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

function ClientNotificationsBell({ variant = 'light' }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS)
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

            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {items.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openTicket(n)}
                      className={`w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 ${
                          n.type === 'SLA_WARNING' ? 'text-accent' : 'text-secondary'
                        }`}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-700 leading-snug">{n.text}</span>
                        <span className="block text-xs text-slate-400 mt-0.5">{formatAgo(n.minutesAgo)}</span>
                      </span>
                      {!n.read && <span className="ml-auto mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default ClientNotificationsBell
