import React, { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, KeyRound, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import officialLogo from '@/assets/sem-nome-1350-x-1080-px-1-c4c50.png'

interface RedefinirSenhaObrigatoriaScreenProps {
  onSuccess?: () => void
}

export const RedefinirSenhaObrigatoriaScreen: React.FC<RedefinirSenhaObrigatoriaScreenProps> = ({
  onSuccess,
}) => {
  const { user, marcarSenhaRedefinida, logout } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    const senha = novaSenha.trim()
    const confirmacao = confirmarNovaSenha.trim()

    if (!senha) {
      setErro('Por favor, informe a Nova senha.')
      return
    }

    if (senha.length < 8) {
      setErro('A nova senha deve conter no mínimo 8 caracteres.')
      return
    }

    // Validação estrita: se as duas senhas são idênticas antes de permitir a confirmação
    if (senha !== confirmacao) {
      setErro(
        'A nova senha e a confirmação não coincidem. Digite senhas idênticas nos dois campos.',
      )
      return
    }

    setSalvando(true)
    try {
      // 1. Tenta chamar o endpoint seguro do backend dedicado à redefinição obrigatória
      let sucesso = false
      try {
        const res = await pb.send<{ success: boolean; message?: string }>(
          '/backend/v1/auth/redefinir-senha-obrigatoria',
          {
            method: 'POST',
            body: {
              novaSenha: senha,
              confirmarNovaSenha: confirmacao,
            },
          },
        )
        if (res?.success) {
          sucesso = true
        }
      } catch (endpointErr) {
        console.warn('Fallback para atualização direta do usuário autenticado:', endpointErr)
      }

      // 2. Se o endpoint retornar erro ou não estiver disponível, tenta atualizar diretamente o próprio usuário autenticado
      if (!sucesso && user?.id) {
        await pb.collection('users').update(user.id, {
          password: senha,
          passwordConfirm: confirmacao,
          forcar_troca_senha: false,
        })

        // Registrar auditoria
        try {
          const { AuditoriaService } = await import('@/services/auditoria')
          await AuditoriaService.registrarEvento({
            tipo_acao: 'alteracao_senha',
            area_sistema: 'Autenticação / Segurança',
            descricao: `Nova senha obrigatória definida com sucesso por ${user.name || user.email}`,
            usuario_id: user.id,
            usuario_email: user.email,
            usuario_nome: user.name || user.email,
            usuario_role: user.role,
            resultado: 'sucesso',
          })
        } catch {
          /* ignore */
        }
      }

      toast.success('Nova senha cadastrada com sucesso!')
      marcarSenhaRedefinida()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.data?.message ||
        err?.message ||
        'Não foi possível salvar a nova senha. Verifique se atende aos critérios mínimos de 8 caracteres.'
      setErro(msg)
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-vinho-dark/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      {/* Luzes decorativas ao fundo */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-dourado/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-brand/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-marfim text-vinho rounded-3xl border-2 border-dourado/60 shadow-2xl p-6 sm:p-10 z-10 space-y-6">
        {/* Cabeçalho com Logo Oficial */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <div className="relative w-full max-w-xs bg-vinho-dark/95 px-6 py-4 rounded-2xl border border-dourado/50 shadow-lg flex items-center justify-center">
              <img
                src={officialLogo}
                alt="CoffeeCast 4.0"
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_4px_12px_rgba(212,175,55,0.3)]"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            Redefinição Obrigatória de Acesso
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-vinho tracking-tight">
            Criar Nova Senha
          </h2>

          <p className="text-xs text-vinho/75 leading-relaxed">
            Olá, <strong>{user?.name || user?.email}</strong>! A administração solicitou a criação
            de uma <strong>nova senha pessoal</strong> para dar continuidade ao seu acesso ao
            sistema.
          </p>
        </div>

        {/* Mensagem de Erro com Alerta */}
        {erro && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{erro}</span>
          </div>
        )}

        <form onSubmit={handleConfirmar} className="space-y-4">
          {/* Campo Nova Senha */}
          <div className="space-y-1.5">
            <Label
              htmlFor="nova-senha"
              className="text-xs font-bold text-vinho flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-dourado-dark" />
              Nova senha *
            </Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={showNovaSenha ? 'text' : 'password'}
                required
                placeholder="Digite sua nova senha (mínimo 8 dígitos)"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vinho/60 hover:text-vinho p-1 rounded-md transition-colors"
                aria-label={showNovaSenha ? 'Ocultar nova senha' : 'Exibir nova senha'}
                title={showNovaSenha ? 'Ocultar nova senha' : 'Exibir nova senha'}
              >
                {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campo Confirmar Nova Senha */}
          <div className="space-y-1.5">
            <Label
              htmlFor="confirmar-nova-senha"
              className="text-xs font-bold text-vinho flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-dourado-dark" />
              Confirmar nova senha *
            </Label>
            <div className="relative">
              <Input
                id="confirmar-nova-senha"
                type={showConfirmarSenha ? 'text' : 'password'}
                required
                placeholder="Repita a nova senha exatamente igual"
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm rounded-xl py-2.5 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vinho/60 hover:text-vinho p-1 rounded-md transition-colors"
                aria-label={
                  showConfirmarSenha
                    ? 'Ocultar confirmação da senha'
                    : 'Exibir confirmação da senha'
                }
                title={
                  showConfirmarSenha
                    ? 'Ocultar confirmação da senha'
                    : 'Exibir confirmação da senha'
                }
              >
                {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {novaSenha && confirmarNovaSenha && (
              <div className="pt-1">
                {novaSenha === confirmarNovaSenha ? (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    As duas senhas são idênticas!
                  </p>
                ) : (
                  <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    As duas senhas ainda estão diferentes.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-3 bg-dourado/10 border border-dourado/30 rounded-xl text-[11px] text-vinho/80 space-y-1">
            <p className="font-semibold text-vinho">Dicas para uma senha forte:</p>
            <ul className="list-disc list-inside space-y-0.5 text-vinho/70">
              <li>Mínimo de 8 caracteres (letras, números e símbolos).</li>
              <li>Não compartilhe sua senha com outras pessoas.</li>
              <li>Após confirmar, esta tela não voltará a ser exibida.</li>
            </ul>
          </div>

          {/* Botão Confirmar */}
          <Button
            type="submit"
            disabled={salvando}
            className="w-full bg-vinho hover:bg-vinho-light text-white font-bold py-3 text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {salvando ? (
              <span>Salvando nova senha...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-dourado" />
                Confirmar
              </>
            )}
          </Button>

          {/* Opção para sair da conta se não quiser trocar agora */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={logout}
              className="text-xs text-vinho/60 hover:text-vinho underline underline-offset-4 transition-colors"
            >
              Cancelar e sair da conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default RedefinirSenhaObrigatoriaScreen
