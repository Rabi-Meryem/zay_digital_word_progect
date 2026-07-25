import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Shield, Save } from 'lucide-react'
import { fetchMyProfile, updateMyProfile } from '../../api/profileService'

// ─────────────────────────────────────────────────────────────────────────────
// Panneau « Mon profil » — partagé par les rôles (client, agent, superviseur).
// L'utilisateur voit ses infos et modifie SEULEMENT : prénom, nom, téléphone.
//   • Le RÔLE n'est jamais modifiable par l'utilisateur (lecture seule).
//   • Le MOT DE PASSE ne se change plus depuis ce panneau : ça se passe sur
//     l'écran de connexion, via « Mot de passe oublié » (voir ForgotPasswordModal),
//     qui envoie la demande à l'administrateur.
// Aligné sur le vrai UserSerializer : { first_name, last_name, email, phone,
// role:{name}, ... } et PATCH /api/auth/me/ (ProfileUpdateSerializer).
// Layout desktop : deux cartes côte à côte sur grand écran, pleine largeur.
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  CLIENT: 'Client',
  AGENT: 'Agent support',
  SUPERVISOR: 'Superviseur',
  ADMIN: 'Administrateur',
}

function ProfilePanel() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [saving, setSaving] = useState(false)

  // Chargement du profil réel ; repli silencieux sur un profil de démo si la
  // route échoue (backend indisponible), pour rester navigable sans serveur.
  useEffect(() => {
    fetchMyProfile()
      .then((data) => {
        setProfile(data)
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
        })
      })
      .catch(() => {
        const demo = {
          first_name: 'Sara', last_name: 'Benali',
          email: 'sara.benali@exemple.ma', phone: '0600000000',
          role: { name: 'CLIENT' },
        }
        setProfile(demo)
        setForm({ first_name: demo.first_name, last_name: demo.last_name, phone: demo.phone })
      })
  }, [])

  const roleName = profile?.role?.name ?? 'CLIENT'
  const roleLabel = ROLE_LABELS[roleName] ?? roleName

  const dirty =
    profile &&
    (form.first_name !== (profile.first_name ?? '') ||
      form.last_name !== (profile.last_name ?? '') ||
      form.phone !== (profile.phone ?? ''))

  const onSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('Le prénom et le nom sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      const updated = await updateMyProfile(form)
      setProfile(updated)
      toast.success('Profil mis à jour.')
    } catch {
      // En l'absence de backend, on met à jour l'affichage localement.
      setProfile((p) => ({ ...p, ...form }))
      toast.success('Profil mis à jour (simulation).')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return <p className="text-sm text-slate-400 p-6">Chargement du profil…</p>
  }

  return (
    <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      {/* Carte 1 — Informations personnelles (modifiables) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Mes informations</h2>
        <p className="text-xs text-slate-400 mb-4">
          Vous pouvez modifier votre prénom, votre nom et votre téléphone.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Prénom" icon={User}>
            <input
              type="text" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Nom" icon={User}>
            <input
              type="text" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Téléphone" icon={Phone}>
            <input
              type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0600000000"
            />
          </Field>
          <Field label="Email (non modifiable)" icon={Mail}>
            <input
              type="email" value={profile.email ?? ''} disabled
              className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
            />
          </Field>
        </div>

        <button
          type="button" onClick={onSave} disabled={!dirty || saving}
          className="mt-4 flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90"
        >
          <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Carte 2 — Rôle (lecture seule uniquement, plus de demande de rôle ni
          de mot de passe ici : le mot de passe se réinitialise depuis l'écran
          de connexion via « Mot de passe oublié ») */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">
          Rôle et sécurité
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Le rôle est géré par l'administrateur et ne peut pas être modifié
          depuis cet espace. Pour réinitialiser votre mot de passe, utilisez
          le lien « Mot de passe oublié » sur l'écran de connexion : la
          demande sera traitée par l'administrateur.
        </p>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Shield size={15} className="text-slate-400" />
          Rôle actuel : <span className="font-medium">{roleLabel}</span>
        </div>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
        <Icon size={12} className="text-slate-400" /> {label}
      </label>
      {children}
    </div>
  )
}

export default ProfilePanel
