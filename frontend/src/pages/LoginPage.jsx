import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { login } from '../store/authSlice'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise.")
    .email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
})

function LoginPage() {
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const status = useSelector((state) => state.auth.status)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values) => {
    const result = await dispatch(login(values))
    if (login.fulfilled.match(result)) {
      toast.success('Connexion réussie.')
      navigate('/dashboard')
    } else {
      toast.error(result.payload || 'Échec de la connexion.')
    }
  }

  const notAvailableYet = () =>
    toast('Fonctionnalité pas encore disponible côté serveur.', { icon: 'ℹ️' })

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* En-tête ZAY */}
        <div className="bg-primary text-primary-foreground text-center py-7 px-6">
          <h1 className="text-xl font-semibold tracking-wide">ZAY Digital World</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Portail de support client
          </p>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Créer un compte
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Adresse email
                </label>
                <input
                  id="email"
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

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full rounded-lg border px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
                      errors.password ? 'border-danger' : 'border-slate-300'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={
                      showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-danger text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  'Connexion...'
                ) : (
                  <>
                    Se connecter <LogIn size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={notAvailableYet}
                className="w-full text-center text-sm text-secondary hover:underline"
              >
                Mot de passe oublié ?
              </button>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                ou
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="w-full border border-primary text-primary rounded-lg py-2.5 text-sm font-medium hover:bg-primary/5 transition"
              >
                Créer mon compte
              </button>
            </form>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-slate-600">
                La création de compte se fait actuellement par un administrateur
                (aucune route API publique d'inscription n'est exposée pour le moment).
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-secondary text-sm hover:underline"
              >
                ← Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
