// src/pages/admin/AdminUsersPage.jsx  — Écran 3.2 (100% cliquable)
// Toutes les actions sont fonctionnelles : création (modale), édition du rôle
// (modale), réinitialisation du mot de passe (confirmation), désactivation /
// réactivation (soft delete), filtres et recherche. Fallback mock optimiste.

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import Modal from "../../components/admin/Modal";
import { toast } from "../../components/admin/toast";
import { usersApi } from "../../api/adminApi";
import { mockUsers } from "../../api/adminMocks";
import { ROLE_LABELS, ROLE_BADGE } from "../../utils/adminConstants";

const CURRENT_ADMIN_ID = 0; // TODO API: id de l'admin connecté (store auth)
const EMPTY_FORM = { full_name: "", email: "", role: "AGENT", password: "" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [selected, setSelected] = useState(mockUsers[0]);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { text, onYes }
  const [form, setForm] = useState(EMPTY_FORM);
  const [newRole, setNewRole] = useState("AGENT");

  useEffect(() => {
    usersApi
      .list()
      .then((res) => {
        const data = res.data.results || res.data;
        setUsers(data);
        if (data.length) setSelected(data[0]);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (roleFilter && u.role !== roleFilter) return false;
        if (statusFilter === "active" && !u.is_active) return false;
        if (statusFilter === "inactive" && u.is_active) return false;
        if (search && !`${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [users, roleFilter, statusFilter, search]
  );

  // --- Actions ---
  const createUser = () => {
    if (!form.full_name || !form.email) {
      toast.error("Nom et email requis");
      return;
    }
    usersApi
      .create(form)
      .then((res) => {
        const created = res.data.id ? res.data : { ...form, id: Date.now(), is_active: true, tickets_lies: 0 };
        setUsers((p) => [created, ...p]);
        toast.success("Utilisateur créé");
      })
      .catch(() => {
        setUsers((p) => [{ ...form, id: Date.now(), is_active: true, tickets_lies: 0 }, ...p]);
        toast.success("Utilisateur créé (mock)");
      })
      .finally(() => {
        setCreateOpen(false);
        setForm(EMPTY_FORM);
      });
  };

  const changeRole = () => {
    usersApi
      .update(selected.id, { role: newRole })
      .catch(() => {})
      .finally(() => {
        setUsers((p) => p.map((u) => (u.id === selected.id ? { ...u, role: newRole } : u)));
        setSelected((s) => ({ ...s, role: newRole }));
        setRoleOpen(false);
        toast.success("Rôle mis à jour");
      });
  };

  const resetPassword = (u) =>
    setConfirm({
      text: `Réinitialiser le mot de passe de ${u.full_name} ? Un email lui sera envoyé.`,
      onYes: () =>
        usersApi
          .resetPassword(u.id)
          .catch(() => {})
          .finally(() => toast.success("Lien de réinitialisation envoyé")),
    });

  const toggleActive = (u) =>
    setConfirm({
      text: u.is_active
        ? `Désactiver le compte de ${u.full_name} ?`
        : `Réactiver le compte de ${u.full_name} ?`,
      onYes: () => {
        const call = u.is_active ? usersApi.remove(u.id) : usersApi.activate(u.id);
        call
          .catch(() => {})
          .finally(() => {
            setUsers((p) => p.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
            setSelected((s) => (s.id === u.id ? { ...s, is_active: !s.is_active } : s));
            toast.success(u.is_active ? "Compte désactivé" : "Compte réactivé");
          });
      },
    });

  return (
    <>
      <AdminPageHeader
        title="Gestion des utilisateurs"
        subtitle="Rôles, statuts et actions administrateur"
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm font-medium hover:bg-[#255a87]"
          >
            + Nouvel utilisateur
          </button>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex gap-3">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm">
            <option value="">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm">
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Désactivé</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-2.5 font-medium">Utilisateur</th>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Rôle</th>
                <th className="px-5 py-2.5 font-medium">Statut</th>
                <th className="px-5 py-2.5 font-medium">Tickets liés</th>
                <th className="px-5 py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} onClick={() => setSelected(u)}
                  className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${
                    selected?.id === u.id ? "bg-blue-50/40" : ""}`}>
                  <td className="px-5 py-2.5 font-medium text-slate-800">{u.full_name}</td>
                  <td className="px-5 py-2.5 text-slate-500">{u.email}</td>
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_BADGE[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      u.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.is_active ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-slate-600">{u.tickets_lies ?? "—"}</td>
                  <td className="px-5 py-2.5 text-right">
                    <button onClick={(e) => { e.stopPropagation(); toggleActive(u); }}
                      disabled={u.id === CURRENT_ADMIN_ID}
                      className="text-[#2D6A9F] hover:underline disabled:opacity-40">
                      {u.is_active ? "Gérer" : "Réactiver"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="font-semibold text-[#1E3A5F]">Fiche utilisateur — {selected.full_name}</div>
            <div className="text-xs text-slate-500 mt-1">
              Rôle : {ROLE_LABELS[selected.role]}
              {selected.created_at && ` · Créé le ${selected.created_at}`}
              {selected.last_login && ` · Dernière connexion : ${selected.last_login}`}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setNewRole(selected.role); setRoleOpen(true); }}
                disabled={selected.id === CURRENT_ADMIN_ID}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40">
                Modifier le rôle
              </button>
              <button onClick={() => resetPassword(selected)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50">
                Réinitialiser le mot de passe
              </button>
              <button onClick={() => toggleActive(selected)}
                disabled={selected.id === CURRENT_ADMIN_ID}
                className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-40">
                {selected.is_active ? "Désactiver le compte" : "Réactiver le compte"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale création */}
      <Modal open={createOpen} title="Nouvel utilisateur" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nom complet</label>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Mot de passe provisoire</label>
            <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={createUser} className="px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm">Créer</button>
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded border border-slate-300 text-sm">Annuler</button>
          </div>
        </div>
      </Modal>

      {/* Modale édition rôle */}
      <Modal open={roleOpen} title={`Modifier le rôle — ${selected?.full_name || ""}`} onClose={() => setRoleOpen(false)}>
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-4">
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={changeRole} className="px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm">Enregistrer</button>
          <button onClick={() => setRoleOpen(false)} className="px-4 py-2 rounded border border-slate-300 text-sm">Annuler</button>
        </div>
      </Modal>

      {/* Confirmation générique */}
      <Modal open={!!confirm} title="Confirmation" onClose={() => setConfirm(null)}>
        <p className="text-sm text-slate-600 mb-4">{confirm?.text}</p>
        <div className="flex gap-2">
          <button onClick={() => { confirm.onYes(); setConfirm(null); }}
            className="px-4 py-2 rounded bg-[#2D6A9F] text-white text-sm">Confirmer</button>
          <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded border border-slate-300 text-sm">Annuler</button>
        </div>
      </Modal>
    </>
  );
}
