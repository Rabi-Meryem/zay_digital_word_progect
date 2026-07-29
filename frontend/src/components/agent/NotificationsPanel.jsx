import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bell, MessageSquare, Ticket, AlertTriangle, CheckCircle2, Check } from 'lucide-react'
import { fetchNotifications, markNotificationRead, markAllRead as markAllReadApi } from '../../api/notifications'

const TYPE_ICONS = {
  TICKET_ASSIGNED: Ticket,
  SLA_WARNING: AlertTriangle,
  NEW_MESSAGE: MessageSquare,
  TICKET_RESOLVED: CheckCircle2,
  TICKET_CLOSED: CheckCircle2,
}

function formatAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const h = Math.floor(minutes / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  const load = useCallback(() => {
    fetchNotifications()
      .then((data) => {
        setItems(data.results ?? [])
        setUnreadCount(data.unread_count ?? 0)
      })
      .catch(() => toast.error("Impossible de charger les notifications."))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // rafraîchi toutes les 30s
    return () => clearInterval(interval)
  }, [load])

  const openTicket = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id)
        setItems((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // pas bloquant pour la navigation
      }
    }
    setOpen(false)
    if (notification.ticket_id) {
      navigate(`/agent/tickets/${notification.ticket_id}`)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllReadApi()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      toast.error("Échec du marquage global.")
    }
  }

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
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-secondary hover:underline"
                >
                  <Check size={13} />
                  Tout marquer lu
                </button>
              )}
            </div>

            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune notification.
                </li>
              ) : (
                items.map((n) => {
                  const Icon = TYPE_ICONS[n.notification_type] ?? Bell
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openTicket(n)}
                        className={`w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 ${
                          n.is_read ? 'opacity-60' : ''
                        }`}
                      >
                        <span
                          className={`mt-0.5 shrink-0 ${
                            n.notification_type === 'SLA_WARNING' ? 'text-accent' : 'text-secondary'
                          }`}
                        >
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm text-slate-700 leading-snug">
                            {n.title}
                            {n.ticket_number ? ` — ${n.ticket_number}` : ''}
                          </span>
                          <span className="block text-xs text-slate-400 mt-0.5">
                            {formatAgo(n.created_at)}
                          </span>
                        </span>
                        {!n.is_read && (
                          <span className="ml-auto mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationsPanel