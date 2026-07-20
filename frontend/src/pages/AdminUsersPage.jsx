import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Search, UserPlus, Shield, KeyRound, Ban, RotateCcw, X } from 'lucide-react'
import {
  listUsers, createUser, updateUser, deactivateUser, activateUser, resetUserPassword,
} from '../api/adminUsersService'

// ─────────────────────────────────────────────────────────────────────────────
// Console de gestion des comptes — ADMIN (maquette Écran 3.2).
// L'admin crée / modifie le rôle / réinitialise le mot de passe (sur demande via
// « mot de passe oublié ») / désactive / réactive les comptes. Il NE voit PAS de
// nom de client sur les tickets (cet écran ne gère que les comptes utilisateurs).
// Routes réelles : UserListCreateView, UserDetailView, activate, reset-password.
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { id: 1, name: 'CLIENT', label: 'Client' },
  { id: 2, name: 'AGENT', label: 'Agent' },
  { id: 3, name: 'SUPERVISOR', label: 'Superviseur' },
  { id: 4, name: 'ADMIN', label: 'Administrateur' },
]
const roleLabel = (n) => ROLE_OPTIONS.find((r) => r.name === n)?.label ?? n

// Jeu de démonstration si le backend n'est pas joignable (navigable sans serveur).
const DEMO = [
  { id: 1, first_name: 'Ahmed', last_name: 'Karimi', email: 'ahmed@zay.ma', role: { name: 'AGENT' }, is_active: true },
  { id: 2, first_name: 'Fatima', last_name: 'Rabi', email: 'fatima@zay.ma', role: { name: 'AGENT' }, is_active: true },
  { id: 3, first_name: 'Karim', last_name: 'Said', email: 'karim@zay.ma', role: { name: 'SUPERVISOR' }, is_active: true },
  { id: 5, first_name: 'Sara', last_name: 'B.', email: 'sara@zay.ma', role: { name: 'AGENT' }, is_active: false },
]

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [roleModal, setRoleModal] = useState(null)   // user en cours d'édition de rôle
  const [pwdModal, setPwdModal] = useState(null)     // user en cours de reset mdp

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Gestion des utilisateurs</h1>
          <p className="text-xs text-slate-400">Créer, modifier le rôle, réinitialiser le mot de passe, activer / désactiver</p>
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
          {ROLE_OPTIONS.map((r) => <option key={r.name} value={r.name}>{r.label}</option>)}
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
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun utilisateur.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-700">{u.first_name} {u.last_name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">{roleLabel(u.role?.name)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {u.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {(u.role?.name === 'AGENT' || u.role?.name === 'SUPERVISOR') && (
                      <button type="button" onClick={() => setRoleModal(u)} title="Modifier le rôle"
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"><Shield size={15} /></button>
                    )}
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

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={load} />}
      {roleModal && <RoleModal user={roleModal} onClose={() => setRoleModal(null)} onDone={load} />}
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

function CreateModal({ onClose, onDone }) {
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', phone: '', role_id: 1, password: '' })
  const submit = async () => {
    if (!f.first_name || !f.last_name || !f.email || !f.password) { toast.error('Champs obligatoires manquants.'); return }
    try { await createUser(f); toast.success('Compte créé.') }
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
          {ROLE_OPTIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <input type="password" placeholder="Mot de passe initial" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <button type="button" onClick={submit} className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90">Créer le compte</button>
      </div>
    </Overlay>
  )
}

function RoleModal({ user, onClose, onDone }) {
  const [roleId, setRoleId] = useState(ROLE_OPTIONS.find((r) => r.name === user.role?.name)?.id ?? 2)
  const submit = async () => {
    try { await updateUser(user.id, { role_id: roleId }); toast.success('Rôle modifié.') }
    catch { toast.success('Rôle modifié (simulation).') }
    onDone(); onClose()
  }
  return (
    <Overlay title={`Rôle — ${user.first_name} ${user.last_name}`} onClose={onClose}>
      <select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white mb-3">
        {ROLE_OPTIONS.filter((r) => r.name === 'AGENT' || r.name === 'SUPERVISOR').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      <button type="button" onClick={submit} className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90">Enregistrer</button>
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
