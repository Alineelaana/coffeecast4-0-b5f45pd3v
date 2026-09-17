import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import { getFileUrl } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CoffeeCastLogo } from '@/components/CoffeeCastLogo'
import {
  User,
  Camera,
  Trash2,
  Lock,
  KeyRound,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  FileText,
  Save,
  Crown,
  Award,
  ExternalLink,
  RefreshCw,
  LogOut,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

export default function PerfilScreen() {
  const { user, role, isMaster, isAdm, isGerencial, isMembro, refreshUser, logout } = useAuth()
  const navigate = useNavigate()

  // Estados dos dados do perfil
  const [name, setName] = useState('')
  const [telefone, setTelefone] = useState('')
  const [bio, setBio] = useState('')

  // Estados do avatar e upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de alteração de senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Estados de feedback de carregamento
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Popula os campos com os dados atuais do usuário (regra de ouro: nunca apagar dados existentes)
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setTelefone(user.telefone || '')
      setBio(user.bio || '')

      if (user.avatar) {
        const url = getFileUrl(user, user.avatar)
        setAvatarPreview(url)
      } else {
        setAvatarPreview(null)
      }
      setAvatarFile(null)
      setRemoveAvatarRequested(false)
    }
  }, [user])

  // Processamento do arquivo de imagem do avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (JPEG, PNG, WebP).')
      return
    }

    // Validação de tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.')
      return
    }

    setAvatarFile(file)
    setRemoveAvatarRequested(false)

    // Pré-visualização imediata
    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove a foto de perfil selecionada ou existente
  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatarRequested(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.info(
      'Foto removida da pré-visualização. Clique em "Salvar Dados Pessoais" para confirmar.',
    )
  }

  // Salvar Informações do Perfil (Nome, Telefone, Bio e Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('O nome completo não pode estar em branco.')
      return
    }

    setSavingProfile(true)
    try {
      // 1. Se houver upload de avatar ou solicitação de remoção, atualizamos diretamente na coleção via FormData
      if (avatarFile || removeAvatarRequested) {
        const formData = new FormData()
        formData.append('name', trimmedName)
        formData.append('telefone', telefone.trim())
        formData.append('bio', bio.trim())

        if (avatarFile) {
          formData.append('avatar', avatarFile)
        } else if (removeAvatarRequested) {
          formData.append('avatar', '')
        }

        await pb.collection('users').update(user.id, formData)
      } else {
        // Se não houver alteração de arquivo, usamos o endpoint seguro ou SDK direto
        // O SDK direto com authStore ativo já atende a regra de update do próprio usuário
        await pb.collection('users').update(user.id, {
          name: trimmedName,
          telefone: telefone.trim(),
          bio: bio.trim(),
        })
      }

      await refreshUser()
      setAvatarFile(null)
      setRemoveAvatarRequested(false)
      toast.success('Perfil atualizado com sucesso!')
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err)
      const errorMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Erro ao salvar alterações no perfil.'
      toast.error(errorMsg)
    } finally {
      setSavingProfile(false)
    }
  }

  // Alterar Senha (valida senha atual, nova senha e confirmação)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!currentPassword) {
      toast.error('Informe sua senha atual.')
      return
    }

    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    setSavingPassword(true)
    try {
      // 1. Valida a senha atual via authWithPassword primeiro no front
      try {
        await pb.collection('users').authWithPassword(user.email, currentPassword)
      } catch (authErr) {
        toast.error('Senha atual incorreta.')
        setSavingPassword(false)
        return
      }

      // 2. Com a senha atual validada, atualiza via endpoint seguro /backend/v1/user/profile/update
      // ou direto via SDK users.update com oldPassword/password/passwordConfirm
      const res = await pb.send<{ success: boolean; message?: string; error?: string }>(
        '/backend/v1/user/profile/update',
        {
          method: 'POST',
          body: {
            currentPassword,
            newPassword,
            confirmPassword,
          },
        },
      )

      if (res?.error) {
        throw new Error(res.error)
      }

      toast.success(res?.message || 'Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await refreshUser()
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err)
      const msg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Não foi possível alterar sua senha. Verifique os dados informados.'
      toast.error(msg)
    } finally {
      setSavingPassword(false)
    }
  }

  // Informações de exibição do cargo/categoria
  const roleConfig = {
    master: {
      label: 'Superadministrador Master',
      badgeColor: 'bg-dourado text-vinho border-dourado-dark font-black',
      icon: ShieldCheck,
      description: 'Acesso total e soberano ao Painel Administrativo e à Área de Membros.',
    },
    adm: {
      label: 'Administrador (ADM)',
      badgeColor: 'bg-dourado-dark text-white border-dourado font-bold',
      icon: Shield,
      description: 'Acesso às telas e lojas autorizadas pelo Superadministrador Master.',
    },
    gerencial: {
      label: 'Categoria Gerencial',
      badgeColor: 'bg-vinho text-dourado-light border-dourado/40 font-bold',
      icon: Award,
      description: 'Acesso à Área de Membros e ao painel operacional de produção.',
    },
    ouro: {
      label: 'Membro Categoria Ouro',
      badgeColor: 'bg-amber-400/20 text-amber-900 border-amber-400/50 font-bold',
      icon: Crown,
      description: 'Acesso exclusivo de membro Ouro: conteúdos VIP, gravações e acervo completo.',
    },
    prata: {
      label: 'Membro Categoria Prata',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300 font-bold',
      icon: Sparkles,
      description: 'Acesso de membro Prata: acervo oficial e episódios liberados.',
    },
  }[role || 'prata'] || {
    label: 'Membro Oficial',
    badgeColor: 'bg-vinho/10 text-vinho border-vinho/20 font-bold',
    icon: Sparkles,
    description: 'Acesso aos recursos oficiais CoffeeCast 4.0.',
  }

  const RoleIcon = roleConfig.icon

  // Iniciais do usuário para o avatar padrão caso não tenha foto
  const getInitials = (fullName?: string) => {
    if (!fullName) return 'CC'
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-vinho font-sans flex flex-col">
      {/* CABEÇALHO ELEGANTE COFFEECAST */}
      <header className="bg-vinho text-white border-b-2 border-dourado shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
              <CoffeeCastLogo className="w-8 h-8 sm:w-9 sm:h-9" variant="gold" />
              <div>
                <span className="font-serif font-black text-base sm:text-lg text-white leading-none block">
                  CoffeeCast <span className="text-dourado">4.0</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-dourado-light font-medium">
                  Perfil do Usuário
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Atalho para o Painel Admin se tiver permissão */}
            {(isMaster || isAdm || isGerencial) && (
              <Link to="/admin">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-dourado/60 text-dourado-light hover:bg-vinho-light bg-transparent text-xs rounded-full px-3 hidden sm:inline-flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-dourado" />
                  Painel Admin
                </Button>
              </Link>
            )}

            {/* Atalho para o Chat Oficial */}
            <Link to="/chat">
              <Button
                size="sm"
                className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-full px-3.5 shadow-sm inline-flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-vinho" />
                Chat
              </Button>
            </Link>

            {/* Atalho para Área de Membros */}
            <Link to="/membros">
              <Button
                size="sm"
                variant="outline"
                className="border-dourado/60 text-dourado-light hover:bg-vinho-light bg-transparent text-xs rounded-full px-3 hidden sm:inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-dourado" />
                Área de Membros
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="text-xs border-white/20 text-marfim hover:bg-white/10 bg-transparent rounded-full px-2.5 sm:px-3"
              title="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1 text-dourado" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* BANNER DE IDENTIDADE DO PERFIL */}
      <section className="bg-gradient-to-r from-vinho-dark via-vinho to-[#36142d] text-white py-8 sm:py-10 px-4 sm:px-6 lg:px-8 border-b border-dourado/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-dourado/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-dourado/15 border border-dourado/40 px-3 py-1 rounded-full text-xs font-semibold text-dourado-light">
              <RoleIcon className="w-3.5 h-3.5 text-dourado" />
              <span>{roleConfig.label}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-white">
              Meu Perfil & Configurações
            </h1>
            <p className="text-xs sm:text-sm text-marfim/80 max-w-xl leading-relaxed">
              Gerencie suas informações pessoais, personalize sua foto de perfil e mantenha sua
              senha atualizada e segura.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link to={isMaster || isAdm || isGerencial ? '/admin' : '/membros'}>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 bg-white/5 rounded-full text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: CARDS DE AVATAR, DADOS E SENHA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* COLUNA ESQUERDA: CARD DO AVATAR & RESUMO DO USUÁRIO */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-vinho/10 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              {/* ÁREA DO AVATAR COM FOTO OU INICIAIS */}
              <div className="relative group">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-dourado shadow-xl bg-gradient-to-br from-vinho via-vinho-dark to-[#2c0e25] flex items-center justify-center relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={name || 'Foto de Perfil'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-dourado font-serif font-black text-4xl tracking-wider select-none">
                      {getInitials(name || user?.name)}
                    </div>
                  )}

                  {/* Overlay interativo para trocar foto */}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer rounded-full"
                    title="Clique para alterar a foto de perfil"
                  >
                    <Camera className="w-6 h-6 text-dourado mb-1" />
                    <span>Alterar Foto</span>
                  </label>
                </div>

                {/* Botão flutuante de câmera para dispositivos touch/mobile */}
                <label
                  htmlFor="avatar-upload"
                  className="md:hidden absolute bottom-1 right-1 w-10 h-10 rounded-full bg-dourado text-vinho flex items-center justify-center shadow-lg border-2 border-white cursor-pointer active:scale-95"
                  title="Alterar foto de perfil"
                  aria-label="Alterar foto de perfil"
                >
                  <Camera className="w-5 h-5 fill-vinho" />
                </label>
              </div>

              {/* Input oculto para seleção da imagem */}
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Botões de Ação do Avatar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs border-vinho/20 text-vinho hover:bg-vinho/5 rounded-full px-3.5 flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-dourado-dark" />
                  Escolher Foto
                </Button>

                {(avatarPreview || user?.avatar) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-2.5 flex items-center gap-1"
                    title="Remover foto de perfil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </Button>
                )}
              </div>

              {avatarFile && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2 rounded-xl flex items-center gap-1.5 text-left">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Nova foto selecionada! Clique no botão salvar abaixo para gravar.</span>
                </div>
              )}

              {/* Informações Resumidas do Perfil */}
              <div className="w-full pt-4 border-t border-vinho/10 space-y-2">
                <h3 className="font-serif font-bold text-lg text-vinho truncate">
                  {name || user?.name || 'Membro CoffeeCast'}
                </h3>

                <div className="flex items-center justify-center gap-1.5">
                  <Badge
                    className={`text-xs px-2.5 py-0.5 rounded-full border ${roleConfig.badgeColor}`}
                  >
                    {roleConfig.label}
                  </Badge>
                </div>

                <p className="text-xs text-vinho/60 font-mono truncate">{user?.email}</p>

                {telefone && (
                  <p className="text-xs text-vinho/75 flex items-center justify-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-dourado-dark" />
                    {telefone}
                  </p>
                )}
              </div>

              {/* Card de Regra de Segurança */}
              <div className="w-full text-left bg-marfim/80 border border-vinho/10 p-3.5 rounded-2xl text-[11px] text-vinho/75 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-vinho text-xs">
                  <ShieldCheck className="w-4 h-4 text-dourado-dark" />
                  <span>Privacidade e Segurança</span>
                </div>
                <p>
                  Você só pode visualizar e editar as suas próprias informações. Seu nível de
                  permissão é controlado pela curadoria do podcast.
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIOS DE DADOS PESSOAIS E SENHA */}
          <div className="lg:col-span-2 space-y-8">
            {/* FORMULÁRIO 1: MAIS INFORMAÇÕES SOBRE O USUÁRIO */}
            <div className="bg-white rounded-3xl border border-vinho/10 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-vinho/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-dourado-dark uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>Informações Pessoais</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho mt-1">
                  Dados do Perfil
                </h2>
                <p className="text-xs text-vinho/70 mt-1">
                  Seus dados principais usados na Área de Membros e na identificação interna do
                  podcast. Edições preservam campos não modificados.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* E-mail (Somente leitura para segurança da conta) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="perfil-email"
                      className="text-xs font-bold text-vinho flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-dourado-dark" />
                      E-mail da Conta (Identificador)
                    </Label>
                    <span className="text-[10px] text-vinho/50 font-medium">Somente Leitura</span>
                  </div>
                  <Input
                    id="perfil-email"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="bg-marfim/60 border-vinho/15 text-vinho font-mono text-xs sm:text-sm cursor-not-allowed opacity-80"
                  />
                  <p className="text-[10px] text-vinho/60">
                    O e-mail é a chave de acesso da sua conta e não pode ser alterado por este
                    formulário.
                  </p>
                </div>

                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="perfil-nome"
                    className="text-xs font-bold text-vinho flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-dourado-dark" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="perfil-nome"
                    required
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm"
                  />
                </div>

                {/* Telefone / WhatsApp */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="perfil-telefone"
                    className="text-xs font-bold text-vinho flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-dourado-dark" />
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    id="perfil-telefone"
                    type="tel"
                    placeholder="(31) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm"
                  />
                  <p className="text-[10px] text-vinho/60">
                    Usado para contato direto da produção, confirmações e avisos de episódios.
                  </p>
                </div>

                {/* Bio / Apresentação ("Sobre mim") */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="perfil-bio"
                    className="text-xs font-bold text-vinho flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-dourado-dark" />
                    Sobre Mim (Apresentação / Bio)
                  </Label>
                  <Textarea
                    id="perfil-bio"
                    rows={4}
                    placeholder="Conte um pouco sobre sua trajetória, área de atuação ou empresa..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm leading-relaxed"
                  />
                  <p className="text-[10px] text-vinho/60">
                    Breve descrição exibida no seu perfil comunitário da Área de Membros.
                  </p>
                </div>

                {/* Nível de Acesso (Informativo, não editável por segurança) */}
                <div className="p-4 bg-marfim rounded-2xl border border-vinho/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-vinho block">
                      Categoria de Acesso Atual
                    </span>
                    <span className="text-[11px] text-vinho/70">{roleConfig.description}</span>
                  </div>
                  <Badge
                    className={`self-start sm:self-auto text-xs px-3 py-1 rounded-full border ${roleConfig.badgeColor}`}
                  >
                    {roleConfig.label}
                  </Badge>
                </div>

                {/* Botão de Salvar Perfil */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="min-h-[44px] bg-vinho hover:bg-vinho-light text-white font-bold text-xs rounded-xl px-6 shadow-md flex items-center gap-2 active:scale-95 transition-all"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-dourado" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-dourado" />
                        Salvar Dados Pessoais
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* FORMULÁRIO 2: ALTERAR SENHA */}
            <div className="bg-white rounded-3xl border border-vinho/10 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-vinho/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-dourado-dark uppercase tracking-wider">
                  <KeyRound className="w-4 h-4" />
                  <span>Segurança da Conta</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho mt-1">
                  Alterar Senha
                </h2>
                <p className="text-xs text-vinho/70 mt-1">
                  Para alterar sua senha, confirme sua senha atual e digite a nova senha desejada
                  (mínimo de 8 caracteres).
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Senha Atual */}
                <div className="space-y-1.5">
                  <Label htmlFor="perfil-current-pass" className="text-xs font-bold text-vinho">
                    Senha Atual *
                  </Label>
                  <div className="relative">
                    <Input
                      id="perfil-current-pass"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      placeholder="Sua senha atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-vinho/60 hover:text-vinho p-1"
                      aria-label={showCurrentPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nova Senha */}
                  <div className="space-y-1.5">
                    <Label htmlFor="perfil-new-pass" className="text-xs font-bold text-vinho">
                      Nova Senha *
                    </Label>
                    <div className="relative">
                      <Input
                        id="perfil-new-pass"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-vinho/60 hover:text-vinho p-1"
                        aria-label={showNewPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="space-y-1.5">
                    <Label htmlFor="perfil-confirm-pass" className="text-xs font-bold text-vinho">
                      Confirmar Nova Senha *
                    </Label>
                    <div className="relative">
                      <Input
                        id="perfil-confirm-pass"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white border-vinho/20 focus-visible:ring-dourado text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-vinho/60 hover:text-vinho p-1"
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    As senhas não coincidem.
                  </p>
                )}

                {newPassword && newPassword.length < 8 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    A nova senha deve ter pelo menos 8 caracteres.
                  </p>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="min-h-[44px] bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-xl px-6 shadow-md flex items-center gap-2 active:scale-95 transition-all"
                  >
                    {savingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-vinho" />
                        Atualizando Senha...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-vinho" />
                        Atualizar Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* RODAPÉ DO PERFIL */}
      <footer className="bg-vinho-dark text-marfim/70 text-xs py-6 border-t border-dourado/30 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© 2026 CoffeeCast 4.0 — Todos os direitos reservados. Perfil do Usuário.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/politica/privacidade" className="hover:text-dourado">
              Privacidade
            </Link>
            <Link to="/politica/termos" className="hover:text-dourado">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
