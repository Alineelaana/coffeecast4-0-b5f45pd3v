import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { CoffeeCastLogo } from '@/components/CoffeeCastLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, ArrowLeft, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'message' in location.state) {
      setInfoMessage(String((location.state as { message: string }).message))
    }
  }, [location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await login(email, password)
    setLoading(false)

    if (res.success) {
      const userRole = res.role
      // Redirecionamento condicional de acordo com a categoria:
      // - Ouro e Prata: redirecionados diretamente para a Área de Membros
      // - Master e Gerencial: redirecionados para o Painel Admin
      if (userRole === 'ouro' || userRole === 'prata') {
        toast.info('Login efetuado com sucesso! Redirecionando para a Área de Membros...')
        navigate('/membros')
      } else {
        toast.success('Bem-vindo(a) ao Painel Administrativo!')
        navigate('/admin')
      }
    } else {
      setError(res.error || 'Credenciais inválidas. Verifique os dados informados.')
    }
  }

  // Atalho para preencher a conta Master do usuário
  const fillMasterCredentials = () => {
    setEmail('alineelaana@gmail.com')
    setPassword('alineelaana4')
  }

  return (
    <div className="min-h-screen bg-vinho-dark flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Luzes de fundo decorativas */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-dourado/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de retorno ao site */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-marfim/80 hover:text-white transition-colors bg-vinho/80 hover:bg-vinho border border-white/10 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-dourado" />
          Voltar ao site CoffeeCast
        </Link>
      </div>

      <div className="w-full max-w-md bg-marfim text-vinho rounded-3xl border-2 border-dourado/60 shadow-2xl p-8 sm:p-10 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <CoffeeCastLogo className="w-16 h-16" variant="dark" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-vinho">
            Painel Administrativo
          </h1>
          <p className="text-xs text-vinho/70">
            Acesso restrito para anfitriãs, administradoras e equipe técnica.
          </p>
        </div>

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-vinho">
              E-mail de Acesso
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="alineelaana@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-vinho">
                Senha
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-3 text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-dourado" />
                Entrar no Painel
              </>
            )}
          </Button>
        </form>

        {/* Informações da conta principal Master */}
        <div className="pt-2 border-t border-vinho/10">
          <div className="bg-rose-brand/60 border border-rose-brand p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-vinho font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-dourado" />
                Conta Master (Aline Lana)
              </span>
              <button
                type="button"
                onClick={fillMasterCredentials}
                className="text-[11px] text-dourado-dark hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Preencher
              </button>
            </div>
            <p className="text-[11px] text-vinho/70">
              E-mail: <code>alineelaana@gmail.com</code> <br />
              Senha inicial: <code>alineelaana4</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
