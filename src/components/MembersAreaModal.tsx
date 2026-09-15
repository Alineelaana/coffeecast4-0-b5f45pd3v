import React, { useState } from 'react'
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
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react'
import { CoffeeCastLogo } from './CoffeeCastLogo'

interface MembersAreaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MembersAreaModal: React.FC<MembersAreaModalProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleReset = () => {
    setSubmitted(false)
    setEmail('')
    setPassword('')
    onOpenChange(false)
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
            Acesso exclusivo para convidados, patrocinadores e comunidade VIP.
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="bg-rose-brand/60 border border-rose-brand p-3 rounded-lg flex items-start gap-2.5 text-xs text-vinho/80">
              <Sparkles className="w-4 h-4 text-dourado shrink-0 mt-0.5" />
              <span>
                Nesta primeira fase, a plataforma de membros está em fase de ativação. Faça o
                pré-login ou cadastre seu e-mail para receber acesso antecipado aos episódios
                exclusivos.
              </span>
            </div>

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
              <Input
                id="member-pass"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-vinho hover:bg-vinho-light text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4 text-dourado" />
              Entrar na Área de Membros
            </Button>
          </form>
        ) : (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 bg-dourado/20 text-dourado-dark rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-dourado" />
            </div>
            <h4 className="font-serif font-bold text-lg text-vinho">Bem-vinda à comunidade!</h4>
            <p className="text-xs text-vinho/75 leading-relaxed">
              Registramos sua solicitação de acesso para <strong>{email}</strong>. Nossa equipe
              liberará as gravações e bastidores do CoffeeCast 4.0 em breve!
            </p>
            <Button
              onClick={handleReset}
              className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs px-6 rounded-full"
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
