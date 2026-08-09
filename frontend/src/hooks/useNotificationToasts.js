import { useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { fetchNotifications } from '../api/notifications'

const POLL_INTERVAL = 15000 // 15s

export function useNotificationToasts() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState([])
  const seenIds = useRef(new Set())
  const initialized = useRef(false)

  const poll = useCallback(async () => {
    try {
      const data = await fetchNotifications({ is_read: false, page_size: 20 })
      const results = data.results ?? data ?? []
      setItems(results)
      setUnreadCount(data.unread_count ?? results.length)

      // Premier chargement : on mémorise l'existant sans toaster
      // (sinon on spam l'utilisateur avec tout son historique non-lu à l'ouverture)
      if (!initialized.current) {
        results.forEach((n) => seenIds.current.add(n.id))
        initialized.current = true
        return
      }

      const nouvelles = results.filter((n) => !seenIds.current.has(n.id))
      nouvelles.forEach((n) => {
        seenIds.current.add(n.id)
        toast(n.title, {
          icon: '🔔',
          duration: 6000,
        })
      })
    } catch {
      // silencieux
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [poll])

  return { unreadCount, items, refresh: poll }
}