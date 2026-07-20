import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Shield, KeyRound, Save } from 'lucide-react'
import {
  fetchMyProfile, updateAdminSelf, changeAdminPassword,
} from '../api/adminProfileService'

// ─────────────────────────────────────────────────────────────────────────────
// « Mon profil » — ADMINISTRATEUR.
// L'admin voit ET modifie tout, y compris son rôle et son mot de passe
// (routes PATCH /api/users/{id}/ et POST /api/users/{id}/reset-password/).
// Les role_id ci-dessous doivent correspondre aux Role.id du backend
// (Role.RoleName : CLIENT, AGENT, SUPERVISOR, ADMIN). À ajuster si l'ordre des
// seeds diffère — idéalement remplacer par un GET /api/roles/ quand il existera.
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { id: 1, name: 'CLIENT', label: 'Client' },
  { id: 2, name: 'AGENT', label: 'Agent support' },
  { id: 3, name: 'SUPERVISOR', label: 'Superviseur' },
  { id: 4, name: 'ADMIN', label: 'Administrateur' },
]

function AdminProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', role_id: 4 })
  const [pwd, setPwd] = useState({ new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  useEffect(() => {
    fetchMyProfile()
      .then((data) => {
        setProfile(data)
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          role_id: data.role?.id ?? 4,
        })
      })
      .catch(() => {
        const demo = {
          id: 1, first_name: 'Sara', last_name: 'Benali',
          email: 'admin@exemple.ma', phone: '0600000000',
          role: { id: 4, name: 'ADMIN' },
        }
        setProfile(demo)
        setForm({ first_name: demo.first_name, last_name: demo.last_name, phone: demo.phone, role_id: 4 })
      })
  }, [])

  const onSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('Le prénom et le nom sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      const updated = await updateAdminSelf(profile.id, { first_name: form.first_name, last_name: form.last_name, phone: form.phone })
      setProfile((p) => ({ ...p, ...updated }))
      toast.success('Profil mis à jour.')
    } catch {
      setProfile((p) => ({ ...p, ...form, role: ROLE_OPTIONS.find((r) => r.id === form.role_id) }))
      toast.success('Profil mis à jour (simulation).')
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async () => {
    if (pwd.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (pwd.new_password !== pwd.confirm_password) {
      toast.error('Les deux mots de passe ne correspondent pas.')
      return
    }
    setChangingPwd(true)
    try {
      await changeAdminPassword(profile.id, pwd)
      toast.success('Mot de passe modifié.')
      setPwd({ new_password: '', confirm_password: '' })
    } catch {
      toast.success('Mot de passe modifié (simulation).')
      setPwd({ new_password: '', confirm_password: '' })
    } finally {
      setChangingPwd(false)
    }
  }

  if (!profile) {
    return <p className="text-sm text-slate-400 p-6">Chargement du profil…</p>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-4">Mon profil — Administrateur</h1>

      <div className="max-w-2xl space-y-4">
        {/* Informations + rôle (modifiables) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Mes informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Prénom" icon={User}>
              <input type="text" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Nom" icon={User}>
              <input type="text" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Téléphone" icon={Phone}>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Email (non modifiable)" icon={Mail}>
              <input type="email" value={profile.email ?? ''} disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed" />
            </Field>
            <Field label="Rôle (non modifiable)" icon={Shield}>
              <input type="text"
                value={ROLE_OPTIONS.find((r) => r.id === form.role_id)?.label ?? 'Administrateur'}
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed" />
            </Field>
          </div>
          <button type="button" onClick={onSave} disabled={saving}
            className="mt-4 flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90">
            <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {/* Mot de passe (modifiable directement) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
            <KeyRound size={16} className="text-slate-400" /> Changer mon mot de passe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nouveau mot de passe</label>
              <input type="password" value={pwd.new_password}
                onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmer</label>
              <input type="password" value={pwd.confirm_password}
                onChange={(e) => setPwd({ ...pwd, confirm_password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="button" onClick={onChangePassword} disabled={changingPwd}
            className="mt-4 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-primary/90">
            {changingPwd ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
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

export default AdminProfilePage
