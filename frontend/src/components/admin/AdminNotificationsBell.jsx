import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import {
  fetchNotifications,
  markNotificationRead,
  markAllRead as apiMarkAllRead,
} from '../../api/notifications'

// Cloche du portail administrateur — GET /api/notifications/
// Même principe que les cloches client et agent.

function formatAgo(iso) {
  if (!iso) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `il y a ${minutes} min`
  const h = Math.floor(minutes / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

function AdminNotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])

  useEffect(() => {
    fetchNotifications()
      .then((data) => setItems(data.results ?? data ?? []))
      .catch(() => setItems([]))
  }, [])

  const isRead = (n) => n.is_read ?? n.read ?? false
  const getText = (n) => n.message ?? n.text ?? n.title ?? ''
  const getDate = (n) => n.created_at ?? n.createdAt ?? null

  const unreadCount = items.filter((n) => !isRead(n)).length

  const markOne = async (notification) => {
    setItems((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true, read: true } : n))
    )
    try {
      await markNotificationRead(notification.id)
    } catch {
      // silencieux : l'affichage local est déjà à jour
    }
  }

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read: true })))
    try {
      await apiMarkAllRead()
    } catch {
      // silencieux
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
        <Bell size={19} />
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

            {items.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Aucune notification pour le moment.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {items.map((n) => {
                  const lu = isRead(n)
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => markOne(n)}
                        className={`w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 ${
                          lu ? 'opacity-60' : ''
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm text-slate-700 leading-snug">{getText(n)}</span>
                          <span className="block text-xs text-slate-400 mt-0.5">{formatAgo(getDate(n))}</span>
                        </span>
                        {!lu && (
                          <span className="ml-auto mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminNotificationsBell
