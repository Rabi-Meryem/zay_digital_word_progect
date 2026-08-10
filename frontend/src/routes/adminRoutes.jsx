// src/routes/adminRoutes.jsx
// Sous-arbre de routes de l'espace administrateur.

import { Navigate, Route } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout";
import AdminOverviewPage from "../pages/admin/AdminOverviewPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminSlaPage from "../pages/admin/AdminSlaPage";
import AdminEscalationsPage from "../pages/admin/AdminEscalationsPage";
import AdminAiPage from "../pages/admin/AdminAiPage";
import AdminNotificationsPage from "../pages/admin/AdminNotificationsPage";
import AdminIntegrationsPage from "../pages/admin/AdminIntegrationsPage";
import AdminProfilePage from "../pages/AdminProfilePage";

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminOverviewPage />} />
    <Route path="utilisateurs" element={<AdminUsersPage />} />
    <Route path="sla" element={<AdminSlaPage />} />
    <Route path="escalades" element={<AdminEscalationsPage />} />
    <Route path="ia" element={<AdminAiPage />} />
    <Route path="notifications" element={<AdminNotificationsPage />} />
    <Route path="integrations" element={<AdminIntegrationsPage />} />
    {/* Ancienne page « Logs & audit » supprimée : les logs sont désormais
        affichés dans l'écran Intégrations (« Logs système & audit de sécurité »). */}
    <Route path="audit" element={<Navigate to="/admin/integrations" replace />} />
    <Route path="profil" element={<AdminProfilePage />} />
  </Route>
);