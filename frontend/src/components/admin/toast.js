// src/components/admin/toast.js
// Notification légère, sans dépendance et compatible Vite/ESM.
// Fournit un retour visuel pour chaque action. Si tu préfères réutiliser
// react-hot-toast (déjà dans le portail), remplace les appels par ceux de la lib.

function domToast(message, type = "success") {
  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${type === "error" ? "#dc2626" : "#1E3A5F"};color:#fff;
    padding:10px 18px;border-radius:8px;font-size:14px;z-index:9999;
    box-shadow:0 4px 12px rgba(0,0,0,.2);opacity:0;transition:opacity .2s`;
  document.body.appendChild(el);
  requestAnimationFrame(() => (el.style.opacity = "1"));
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 250);
  }, 2200);
}

export const toast = {
  success: (m) => domToast(m, "success"),
  error: (m) => domToast(m, "error"),
  info: (m) => domToast(m, "success"),
};
