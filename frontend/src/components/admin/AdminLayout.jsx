// src/components/admin/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LogOut } from "lucide-react";
import { logout } from "../../store/authSlice";
import { ADMIN_NAV } from "../../utils/adminConstants";
import AdminNotificationsBell from "./AdminNotificationsBell";


export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#1E3A5F] text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-bold leading-tight">ZAY Digital World</div>
          <div className="text-xs text-white/60">Administration</div>
        </div>
        <nav className="flex-1 py-3">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `block px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#2D6A9F] text-white font-medium"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div className="text-xs">
              <div className="font-medium">Admin</div>
              <div className="text-white/50">Administrateur</div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await dispatch(logout());
              navigate("/login");
            }}
            title="Se déconnecter"
            className="text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <h1 className="text-xl font-bold text-[#1E3A5F]">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        <AdminNotificationsBell />
      </div>
    </div>
  );
}