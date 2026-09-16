import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  AlertTriangle,
  KeyRound,
  Mail,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import officialLogo from '@/assets/chatgpt-image-15-de-set.de-2026-135749-7d01c.png'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // Estado do fluxo "Esqueci minha senha"
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

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

  const handleOpenForgotModal = () => {
    setForgotEmail(email.trim())
    setForgotSuccess(false)
    setForgotModalOpen(true)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error('Informe seu e-mail de acesso.')
      return
    }

    setForgotLoading(true)

    try {
      // Dispara o fluxo nativo de recuperação de senha do PocketBase (coleção users)
      await pb.collection('users').requestPasswordReset(forgotEmail.trim())
      setForgotSuccess(true)
      // Por segurança, mensagem neutra e amigável confirmando a instrução
      toast.success('Se o e-mail estiver cadastrado, as instruções de redefinição foram enviadas!')
    } catch (err: unknown) {
      console.warn('Recuperação de senha executada:', err)
      // Por segurança, mesmo em caso de erro da API que indique e-mail não existente, não expomos existência
      setForgotSuccess(true)
      toast.success('Se o e-mail estiver cadastrado, as instruções de redefinição foram enviadas!')
    } finally {
      setForgotLoading(false)
    }
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
        <div className="text-center space-y-3">
          {/* Logo Oficial CoffeeCast 4.0 em destaque elegante e ampliado */}
          <div className="flex justify-center mb-2">
            <div className="relative group w-full flex justify-center">
              <div className="absolute -inset-2 bg-gradient-to-r from-dourado/50 via-amber-300/40 to-dourado/50 rounded-3xl blur-md transition-all group-hover:blur-lg" />
              <div className="relative w-full max-w-xs bg-vinho-dark/95 px-6 sm:px-8 py-5 sm:py-6 rounded-3xl border-2 border-dourado/60 shadow-2xl flex items-center justify-center">
                <img
                  src={officialLogo}
                  alt="CoffeeCast 4.0 Logo Oficial"
                  className="h-28 sm:h-36 md:h-40 w-auto max-w-full object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-black text-vinho tracking-tight">
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
              placeholder="seuemail@exemplo.com"
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

          {/* Link para recuperação de senha */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleOpenForgotModal}
              className="inline-flex items-center gap-1.5 text-xs text-vinho/70 hover:text-vinho font-medium underline underline-offset-4 decoration-dourado/60 hover:decoration-dourado transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-dourado" />
              Esqueci minha senha
            </button>
          </div>
        </form>
      </div>

      {/* Modal / Dialog de Recuperação de Senha */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="max-w-md bg-marfim border-2 border-dourado/60 text-vinho shadow-2xl p-6 sm:p-8 rounded-3xl">
          <DialogHeader className="text-center sm:text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-dourado/15 rounded-full flex items-center justify-center text-vinho mb-1 border border-dourado/40">
              <KeyRound className="w-6 h-6 text-dourado-dark" />
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-vinho">
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="text-xs text-vinho/75">
              Digite o e-mail cadastrado na sua conta. Enviaremos um link seguro para você redefinir
              sua senha de acesso.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccess ? (
            <div className="space-y-4 py-3 text-center">
              <div className="mx-auto w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-vinho">Instruções enviadas!</p>
                <p className="text-xs text-vinho/75 leading-relaxed">
                  Se o endereço <strong className="font-mono text-vinho">{forgotEmail}</strong>{' '}
                  constar em nossa base, as instruções com o link de recuperação foram despachadas
                  para sua caixa de entrada.
                </p>
                <p className="text-[11px] text-vinho/60 pt-2">
                  Verifique também a pasta de <em>Spam</em> ou <em>Lixo Eletrônico</em>.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-2.5 text-xs rounded-xl shadow-md"
                >
                  Entendi e Voltar ao Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold text-vinho">
                  E-mail cadastrado
                </Label>
                <div className="relative">
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 pl-9"
                  />
                  <Mail className="w-4 h-4 text-vinho/50 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full sm:w-1/2 text-xs border-vinho/20 text-vinho hover:bg-vinho/5 rounded-xl min-h-[42px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full sm:w-1/2 bg-vinho hover:bg-vinho-light text-white font-bold text-xs rounded-xl shadow-md min-h-[42px] flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 text-dourado" />
                      Enviar Instruções
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
