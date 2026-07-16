import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck, X } from 'lucide-react'

// « Mot de passe oublié ? » — Écran 1.1.
// ⚠️ Le backend n'expose pas encore de réinitialisation en libre-service
// (seul l'admin peut réinitialiser via POST /api/users/:id/reset-password/).
// Ce formulaire valide l'email et simule l'envoi : il suffira de brancher
// l'appel API (ex: POST /api/auth/password-reset/) dans onSubmit le moment venu.

const schema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise.")
    .email('Adresse email invalide.'),
})

function ForgotPasswordModal({ onClose }) {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  // Message volontairement neutre : on ne révèle jamais si un compte existe
  // ou non pour une adresse donnée (bonne pratique de sécurité).
  const onSubmit = () => setSent(true)

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
                Saisis l'adresse email de ton compte.
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
              Si un compte existe avec l'adresse{' '}
              <span className="font-medium">{getValues('email')}</span>, un lien de
              réinitialisation vient d'être envoyé.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Pense à vérifier le dossier spam. (Simulation — en attente de l'API.)
            </p>
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
                className="flex-1 text-sm font-medium bg-primary text-primary-foreground rounded-lg py-2 hover:bg-primary/90 transition"
              >
                Envoyer le lien
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordModal
