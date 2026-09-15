import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { CoffeeCastLogo } from './CoffeeCastLogo'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface MembersAreaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MembersAreaModal: React.FC<MembersAreaModalProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await login(email, password)
    setLoading(false)

    if (res.success) {
      toast.success('Acesso à Área de Membros liberado!')
      onOpenChange(false)
      navigate('/membros')
    } else {
      setError(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha de membro.')
    }
  }

  const handleGoToMembers = () => {
    onOpenChange(false)
    navigate('/membros')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-marfim border-2 border-dourado/60 text-vinho shadow-2xl p-6 sm:p-8 rounded-2xl">
        <DialogHeader className="text-center sm:text-center space-y-3">
          <div className="mx-auto flex justify-center">
            <CoffeeCastLogo className="w-14 h-14" variant="dark" />
          </div>
          <DialogTitle className="font-serif text-2xl font-bold text-vinho">
            Área de Membros CoffeeCast 4.0
          </DialogTitle>
          <DialogDescription className="text-xs text-vinho/70">
            Acesso para categorias Master, Gerencial, Ouro e Prata.
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="py-4 text-center space-y-4">
            <div className="p-3 bg-dourado/15 border border-dourado/40 rounded-xl text-xs text-vinho font-medium">
              Você já está autenticado como <strong>{user.name || user.email}</strong> (Categoria:{' '}
              <span className="uppercase font-bold text-dourado-dark">{user.role}</span>).
            </div>
            <Button
              onClick={handleGoToMembers}
              className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-2.5 rounded-xl shadow-md text-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-dourado" />
              Acessar Área de Membros Agora
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="bg-rose-brand/60 border border-rose-brand p-3 rounded-lg flex items-start gap-2.5 text-xs text-vinho/80">
              <Sparkles className="w-4 h-4 text-dourado shrink-0 mt-0.5" />
              <span>
                Usuários das categorias <strong>Ouro</strong>, <strong>Prata</strong>,{' '}
                <strong>Gerencial</strong> e <strong>Master</strong> possuem acesso exclusivo aos
                episódios e materiais da comunidade.
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="member-email" className="text-xs font-semibold text-vinho">
                E-mail de Membro
              </Label>
              <Input
                id="member-email"
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-pass" className="text-xs font-semibold text-vinho">
                Senha de Acesso
              </Label>
              <div className="relative">
                <Input
                  id="member-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm pr-10"
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
              className="w-full bg-vinho hover:bg-vinho-light text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4 text-dourado" />
              {loading ? 'Entrando...' : 'Entrar na Área de Membros'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
