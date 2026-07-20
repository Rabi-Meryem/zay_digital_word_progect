import { useState } from 'react'
import toast from 'react-hot-toast'
import { NOTIFICATION_EVENTS } from '../../data/mockClientActivity'

// Ligne 4 (droite) : centre de notifications.
// Le client choisit, pour chaque événement, s'il veut être notifié dans le
// portail, par email, ou les deux.
//
// TODO API : PATCH /api/users/me/preferences/

function Toggle({ actif, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors ${
        actif ? 'bg-success' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-[2px] w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${
          actif ? 'left-[16px]' : 'left-[2px]'
        }`}
      />
    </button>
  )
}

function NotificationCenter() {
  const [prefs, setPrefs] = useState(NOTIFICATION_EVENTS)
  const [modifie, setModifie] = useState(false)

  const basculer = (cle, canal) => {
    setPrefs((p) => p.map((e) => (e.cle === cle ? { ...e, [canal]: !e[canal] } : e)))
    setModifie(true)
  }

  const enregistrer = () => {
    // TODO API : await api.patch('/users/me/preferences/', { notifications: prefs })
    setModifie(false)
    toast.success('Préférences de notification enregistrées')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Centre de notifications</h2>
        <button
          type="button"
          onClick={enregistrer}
          disabled={!modifie}
          className="text-xs font-medium text-primary-foreground bg-primary rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Enregistrer
        </button>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 border-b border-slate-100">
            <th className="text-left pb-2 font-medium">Événement</th>
            <th className="pb-2 font-medium w-14">Portail</th>
            <th className="pb-2 font-medium w-14">Email</th>
          </tr>
        </thead>
        <tbody>
          {prefs.map((e) => (
            <tr key={e.cle} className="border-b border-slate-50 last:border-0">
              <td className="py-2.5 pr-2 text-slate-600 leading-snug">{e.label}</td>
              <td className="py-2.5 text-center">
                <Toggle
                  actif={e.portail}
                  onChange={() => basculer(e.cle, 'portail')}
                  label={`${e.label} — notification portail`}
                />
              </td>
              <td className="py-2.5 text-center">
                <Toggle
                  actif={e.email}
                  onChange={() => basculer(e.cle, 'email')}
                  label={`${e.label} — notification email`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default NotificationCenter
