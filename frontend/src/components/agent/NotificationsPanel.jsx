import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MessageSquare, Ticket, AlertTriangle, Check } from 'lucide-react'

// Notifications de démonstration — les types reprennent ceux insérés par
// seed_data (NotificationType) : NEW_MESSAGE, SLA_WARNING, TICKET_ASSIGNED…
// À remplacer par GET /api/notifications/ (+ WebSocket) quand la route existera.

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'NEW_MESSAGE',
    text: 'Nouveau message de Meryem Rabi — ticket #00046',
    minutesAgo: 3,
    read: false,
    ticketId: 146,
  },
  {
    id: 2,
    type: 'SLA_WARNING',
    text: 'SLA à 80 % — ticket #00045 (1h 10min restantes)',
    minutesAgo: 12,
    read: false,
    ticketId: 145,
  },
  {
    id: 3,
    type: 'TICKET_ASSIGNED',
    text: 'Le ticket #00048 vous a été assigné',
    minutesAgo: 140,
    read: false,
    ticketId: 148,
  },
  {
    id: 4,
    type: 'TICKET_ASSIGNED',
    text: 'Le ticket #00043 vous a été assigné',
    minutesAgo: 360,
    read: true,
    ticketId: 143,
  },
]

const TYPE_ICONS = {
  NEW_MESSAGE: MessageSquare,
  SLA_WARNING: AlertTriangle,
  TICKET_ASSIGNED: Ticket,
}

function formatAgo(minutes) {
  if (minutes < 60) return `il y a ${minutes} min`
  const h = Math.floor(minutes / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS)
  const navigate = useNavigate()

  const unreadCount = items.filter((n) => !n.read).length

  const openTicket = (notification) => {
    setItems((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
    setOpen(false)
    navigate(`/agent/tickets/${notification.ticketId}`)
  }

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-slate-500 hover:text-slate-700"
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
          {/* Clic à l'extérieur → fermeture */}
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
                        <span className="block text-sm text-slate-700 leading-snug">
                          {n.text}
                        </span>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          {formatAgo(n.minutesAgo)}
                        </span>
                      </span>
                      {!n.read && (
                        <span className="ml-auto mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />
                      )}
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

export default NotificationsPanel
