import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  fetchNotifications, markNotificationRead, markAllRead, fetchUnreadCount,
} from '../../api/notifications'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  // Compteur non-lu : chargé au montage + rafraîchi toutes les 30s
  useEffect(() => {
    const load = () => fetchUnreadCount().then((d) => setUnread(d.count ?? d.unread_count ?? 0)).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      fetchNotifications()
        .then(setItems)
        .catch(() => toast.error('Impossible de charger les notifications.'))
        .finally(() => setLoading(false))
    }
  }

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnread((u) => Math.max(0, u - 1))
    } catch {
      toast.error('Échec de la mise à jour.')
    }
  }

  async function handleMarkAll() {
    try {
      await markAllRead()
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch {
      toast.error('Échec de la mise à jour.')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative text-slate-500 hover:text-slate-700"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-danger text-white text-[10px] leading-4 text-center font-semibold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-secondary hover:underline"
              >
                <CheckCheck size={13} /> Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && (
              <p className="text-xs text-slate-400 text-center py-6">Chargement...</p>
            )}
            {!loading && items.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Aucune notification.</p>
            )}
            {!loading && items.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-2.5 border-b border-slate-50 last:border-0 flex items-start gap-2 ${
                  n.read ? '' : 'bg-secondary/5'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="text-slate-400 hover:text-secondary shrink-0"
                    aria-label="Marquer comme lu"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell