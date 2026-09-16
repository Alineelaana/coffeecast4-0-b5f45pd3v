import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import officialLogo from '@/assets/design-sem-nome-5dedc.png'

export default function ResetPasswordScreen() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token de recuperação ausente ou inválido. Solicite um novo link de redefinição.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Token de recuperação não encontrado.')
      return
    }

    if (password.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('A confirmação da senha não coincide com a nova senha.')
      return
    }

    setLoading(true)

    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      toast.success('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.')
    } catch (err: unknown) {
      console.error(err)
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Não foi possível redefinir sua senha. O link pode ter expirado ou ser inválido.'
      setError(msg)
      toast.error('Falha ao redefinir senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vinho-dark flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Luzes de fundo decorativas */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-dourado/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de retorno */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-marfim/80 hover:text-white transition-colors bg-vinho/80 hover:bg-vinho border border-white/10 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-dourado" />
          Voltar ao login
        </Link>
      </div>

      <div className="w-full max-w-md bg-marfim text-vinho rounded-3xl border-2 border-dourado/60 shadow-2xl p-8 sm:p-10 relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="relative group w-full flex justify-center">
              <div className="absolute -inset-2 bg-gradient-to-r from-dourado/50 via-amber-300/40 to-dourado/50 rounded-3xl blur-md transition-all group-hover:blur-lg" />
              <div className="relative w-full max-w-xs bg-vinho-dark/95 px-6 sm:px-8 py-5 sm:py-6 rounded-3xl border-2 border-dourado/60 shadow-2xl flex items-center justify-center">
                <img
                  src={officialLogo}
                  alt="Logo Oficial CoffeeCast 4.0"
                  className="h-28 sm:h-36 md:h-40 w-auto max-w-full object-contain mx-auto drop-shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-vinho">Redefinir Senha</h1>
          <p className="text-xs text-vinho/70">
            Crie uma nova senha segura para o seu acesso ao CoffeeCast 4.0.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-vinho">
                Senha atualizada com sucesso!
              </h3>
              <p className="text-xs text-vinho/70">
                Sua credencial foi alterada. Você já pode acessar o Painel Administrativo.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-3 text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-dourado" />
              Ir para o Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold text-vinho">
                Nova Senha (mínimo 8 caracteres)
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vinho/60 hover:text-vinho p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-semibold text-vinho">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vinho/60 hover:text-vinho p-1"
                  aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Exibir confirmação'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-3 text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Atualizando senha...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-dourado" />
                  Salvar Nova Senha
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
