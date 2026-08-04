import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck, X, Loader2 } from 'lucide-react'
import { requestPasswordReset, ROUTE_ABSENTE } from '../../api/passwordResetService'

// « Mot de passe oublié ? » — Écran 1.1.
//
// Parcours métier : le client, l'agent ou le superviseur saisit son adresse ;
// la demande est transmise à l'administrateur, qui réinitialise le mot de passe
// depuis l'écran 3.2 (Gestion des utilisateurs). L'administrateur est donc le
// seul à pouvoir fixer un nouveau mot de passe — c'est ce que le backend
// autorise aujourd'hui (POST /api/users/<id>/reset-password/, IsAdminRole).
//
// Le message affiché reste volontairement neutre : on ne révèle jamais si un
// compte existe pour une adresse donnée.

const schema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise.")
    .email('Adresse email invalide.'),
})

function ForgotPasswordModal({ onClose }) {
  const [sent, setSent] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [routeAbsente, setRouteAbsente] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    setEnvoi(true)
    try {
      const res = await requestPasswordReset(values.email)
      if (!res.transmis && res.raison === ROUTE_ABSENTE) {
        setRouteAbsente(true)
        if (import.meta.env.DEV) {
          console.warn(
            '[ZAY] POST /api/auth/password-reset-request/ absente — appliquer le patch backend ' +
              '(backend_patch/users/views_password_request.py + 1 ligne dans users/urls.py).'
          )
        }
      }
    } catch {
      // Erreur réseau ou serveur : on n'en dit pas plus à l'utilisateur.
      if (import.meta.env.DEV) {
        console.warn('[ZAY] Demande de réinitialisation : erreur serveur.')
      }
    } finally {
      setEnvoi(false)
      setSent(true) // message neutre dans tous les cas
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Réinitialiser le mot de passe"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 cursor-default"
      />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Réinitialiser le mot de passe</h2>
            {!sent && (
              <p className="text-xs text-slate-500 mt-0.5">
                Saisis l&apos;adresse email de ton compte.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-6 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success mb-3">
              <MailCheck size={20} />
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">
              Si un compte existe avec l&apos;adresse{' '}
              <span className="font-medium">{getValues('email')}</span>, ta demande a été transmise à
              l&apos;administrateur. Il te communiquera un nouveau mot de passe.
            </p>
            {routeAbsente && import.meta.env.DEV && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 mt-3 text-left">
                Développement : la route{' '}
                <span className="font-mono">/api/auth/password-reset-request/</span> n&apos;existe pas
                encore côté backend — appliquer le patch fourni.
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-5 py-4 space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Adresse email
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="prenom.nom@zay.ma"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
                  errors.email ? 'border-danger' : 'border-slate-300'
                }`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              La réinitialisation est effectuée par l&apos;administrateur : ta demande lui est
              transmise et enregistrée dans le journal d&apos;audit.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm text-slate-600 border border-slate-200 rounded-lg py-2 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={envoi}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg py-2 hover:bg-primary/90 transition disabled:opacity-50"
              >
                {envoi && <Loader2 size={14} className="animate-spin" />}
                {envoi ? 'Envoi…' : 'Envoyer ma demande'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordModal
