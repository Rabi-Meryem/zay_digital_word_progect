import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, UserPlus, Shield, KeyRound, Ban, RotateCcw, X, Pencil } from 'lucide-react'
import {
  listUsers, createUser, updateUser, deactivateUser, activateUser, resetUserPassword,
} from '../api/adminUsersService'
import { rolesApi } from "../api/adminApi";

// ─────────────────────────────────────────────────────────────────────────────
// Console de gestion des comptes — ADMIN (maquette Écran 3.2).
// L'admin crée / modifie (nom, email, téléphone, rôle, plan) / réinitialise le
// mot de passe (sur demande via « mot de passe oublié », circuit séparé) /
// désactive / réactive les comptes.
// Routes réelles : UserListCreateView, UserDetailView, activate, reset-password.
//
// Le plan (Essentiel/Standard/Premium) n'a de sens que pour un compte CLIENT —
// il détermine les délais SLA appliqués à ses tickets (voir sla/services.py).
//
// La recherche peut être pré-remplie via l'URL (?search=email) — utilisé
// quand on arrive depuis une notification « Demande de réinitialisation de
// mot de passe » (voir NotificationsPanel.jsx).
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_LABELS = {
  ESSENTIEL: 'Essentiel',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
}

// Jeu de démonstration si le backend n'est pas joignable (navigable sans serveur).
const DEMO = [
  { id: 1, first_name: 'Ahmed', last_name: 'Karimi', email: 'ahmed@zay.ma', phone: '', role: { name: 'AGENT' }, plan: null, is_active: true },
  { id: 2, first_name: 'Fatima', last_name: 'Rabi', email: 'fatima@zay.ma', phone: '', role: { name: 'AGENT' }, plan: null, is_active: true },
  { id: 3, first_name: 'Karim', last_name: 'Said', email: 'karim@zay.ma', phone: '', role: { name: 'SUPERVISOR' }, plan: null, is_active: true },
  { id: 4, first_name: 'Meryem', last_name: 'Rabi', email: 'meryem@societex.ma', phone: '', role: { name: 'CLIENT' }, plan: 'PREMIUM', is_active: true },
  { id: 5, first_name: 'Sara', last_name: 'B.', email: 'sara@zay.ma', phone: '', role: { name: 'AGENT' }, plan: null, is_active: false },
]

function AdminUsersPage() {
  const [searchParams] = useSearchParams()

  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  // Pré-rempli depuis l'URL si on arrive via une notification (?search=email)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [showCreate, setShowCreate] = useState(false)
  const [editModal, setEditModal] = useState(null)   // user en cours de modification complète
  const [pwdModal, setPwdModal] = useState(null)     // user en cours de reset mdp
  const [roleOptions, setRoleOptions] = useState([])

  useEffect(() => {
    rolesApi.list().then(res => setRoleOptions(res.data))
  }, [])

  // Si le paramètre d'URL change après le montage (navigation depuis une
  // autre notification pendant que la page est déjà ouverte), on resynchronise.
  useEffect(() => {
    const fromUrl = searchParams.get('search')
    if (fromUrl && fromUrl !== search) {
      setSearch(fromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const load = useCallback(() => {
    listUsers({ role: roleFilter || undefined, search: search || undefined })
      .then((data) => setUsers(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setUsers(DEMO.filter((u) =>
        (!roleFilter || u.role.name === roleFilter) &&
        (!search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
      )))
  }, [roleFilter, search])

  useEffect(() => { load() }, [load])

  const onDeactivate = async (u) => {
    try { await deactivateUser(u.id); toast.success(`${u.first_name} désactivé.`) }
    catch { toast.success(`${u.first_name} désactivé (simulation).`) }
    load()
  }
  const onActivate = async (u) => {
    try { await activateUser(u.id); toast.success(`${u.first_name} réactivé.`) }
    catch { toast.success(`${u.first_name} réactivé (simulation).`) }
    load()
  }

  const roleLabel = (name) =>
    roleOptions.find((r) => r.name === name)?.label ?? name

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Gestion des utilisateurs</h1>
          <p className="text-xs text-slate-400">Créer, modifier, réinitialiser le mot de passe, activer / désactiver</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90">
          <UserPlus size={15} /> Nouvel utilisateur
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Tous les rôles</option>
          {roleOptions.map((r) => <option key={r.name} value={r.name}>{r.label ?? r.name}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Utilisateur</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rôle</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun utilisateur.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-700">{u.first_name} {u.last_name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">{roleLabel(u.role?.name)}</td>
                <td className="px-4 py-3 text-slate-500">
                  {u.role?.name === 'CLIENT' ? (PLAN_LABELS[u.plan] ?? u.plan ?? '—') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {u.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEditModal(u)} title="Modifier"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"><Pencil size={15} /></button>
                    <button type="button" onClick={() => setPwdModal(u)} title="Réinitialiser le mot de passe"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"><KeyRound size={15} /></button>
                    {u.is_active ? (
                      <button type="button" onClick={() => onDeactivate(u)} title="Désactiver"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Ban size={15} /></button>
                    ) : (
                      <button type="button" onClick={() => onActivate(u)} title="Réactiver"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><RotateCcw size={15} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateModal roleOptions={roleOptions} onClose={() => setShowCreate(false)} onDone={load} />}
      {editModal && <EditModal user={editModal} roleOptions={roleOptions} onClose={() => setEditModal(null)} onDone={load} />}
      {pwdModal && <PwdModal user={pwdModal} onClose={() => setPwdModal(null)} />}
    </div>
  )
}

function Overlay({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Création d'un nouvel utilisateur
// ─────────────────────────────────────────────────────────────────────────────
function CreateModal({ onClose, onDone, roleOptions }) {
  const [f, setF] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    role_id: 1, password: '', plan: 'ESSENTIEL',
  })

  const selectedRoleName = roleOptions.find((r) => r.id === f.role_id)?.name
  const isClient = selectedRoleName === 'CLIENT'

  const submit = async () => {
    if (!f.first_name || !f.last_name || !f.email || !f.password) {
      toast.error('Champs obligatoires manquants.')
      return
    }
    const { plan, ...rest } = f
    const payload = isClient ? { ...rest, plan } : rest

    try { await createUser(payload); toast.success('Compte créé.') }
    catch { toast.success('Compte créé (simulation).') }
    onDone(); onClose()
  }

  return (
    <Overlay title="Nouvel utilisateur" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Prénom" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Nom" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Téléphone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

        <select value={f.role_id} onChange={(e) => setF({ ...f, role_id: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          {roleOptions.map((r) => <option key={r.id} value={r.id}>{r.label ?? r.name}</option>)}
        </select>

        {isClient && (
          <select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="ESSENTIEL">Essentiel</option>
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
          </select>
        )}

        <input type="password" placeholder="Mot de passe initial" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <button type="button" onClick={submit} className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90">Créer le compte</button>
      </div>
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modification complète d'un utilisateur existant
// (nom, email, téléphone, rôle, plan — le mot de passe reste sur un circuit séparé)
// ─────────────────────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onDone, roleOptions }) {
  const [f, setF] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone ?? '',
    role_id: roleOptions.find((r) => r.name === user.role?.name)?.id,
    plan: user.plan ?? 'ESSENTIEL',
  })

  const selectedRoleName = roleOptions.find((r) => r.id === f.role_id)?.name
  const isClient = selectedRoleName === 'CLIENT'

  const submit = async () => {
    if (!f.first_name || !f.last_name || !f.email) {
      toast.error('Champs obligatoires manquants.')
      return
    }
    const { plan, ...rest } = f
    const payload = isClient ? { ...rest, plan } : rest

    try { await updateUser(user.id, payload); toast.success('Compte modifié.') }
    catch { toast.success('Compte modifié (simulation).') }
    onDone(); onClose()
  }

  return (
    <Overlay title={`Modifier — ${user.first_name} ${user.last_name}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Prénom" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Nom" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Téléphone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

        <select value={f.role_id} onChange={(e) => setF({ ...f, role_id: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          {roleOptions.map((r) => <option key={r.id} value={r.id}>{r.label ?? r.name}</option>)}
        </select>

        {isClient && (
          <select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="ESSENTIEL">Essentiel</option>
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
          </select>
        )}

        <p className="text-xs text-slate-400">
          Le mot de passe se réinitialise séparément (icône clé dans le tableau).
        </p>

        <button type="button" onClick={submit} className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90">
          Enregistrer
        </button>
      </div>
    </Overlay>
  )
}

function PwdModal({ user, onClose }) {
  const [p, setP] = useState({ new_password: '', confirm_password: '' })
  const submit = async () => {
    if (p.new_password.length < 8) { toast.error('8 caractères minimum.'); return }
    if (p.new_password !== p.confirm_password) { toast.error('Les mots de passe ne correspondent pas.'); return }
    try { await resetUserPassword(user.id, p); toast.success('Mot de passe réinitialisé.') }
    catch { toast.success('Mot de passe réinitialisé (simulation).') }
    onClose()
  }
  return (
    <Overlay title={`Mot de passe — ${user.first_name} ${user.last_name}`} onClose={onClose}>
      <p className="text-xs text-slate-400 mb-3">À faire sur demande de l'utilisateur (« mot de passe oublié »).</p>
      <input type="password" placeholder="Nouveau mot de passe" value={p.new_password} onChange={(e) => setP({ ...p, new_password: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2" />
      <input type="password" placeholder="Confirmer" value={p.confirm_password} onChange={(e) => setP({ ...p, confirm_password: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" />
      <button type="button" onClick={submit} className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90">Réinitialiser</button>
    </Overlay>
  )
}

export default AdminUsersPage