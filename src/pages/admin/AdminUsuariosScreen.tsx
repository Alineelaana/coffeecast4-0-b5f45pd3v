import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import type {
  UserRecord,
  UserRole,
  AdmPermissions,
  StoreRecord,
  AuditoriaSubPermissions,
} from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Edit3,
  Key,
  CheckCircle2,
  XCircle,
  Store,
  Sliders,
  CheckSquare,
  Square,
  Phone,
  MessageSquare,
  Filter,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// Lista de telas e blocos gerenciáveis do painel com rótulos amigáveis em português
const AVAILABLE_SCREENS = [
  {
    key: 'dashboard',
    label: 'Visão Geral (Dashboard)',
    description: 'Resumo com contadores e métricas do sistema',
    group: 'Operacional',
  },
  {
    key: 'notificacoes',
    label: 'Central de Notificações',
    description: 'Avisos e pendências em tempo real',
    group: 'Operacional',
  },
  {
    key: 'chat',
    label: 'Chat (Membros & Equipe)',
    description: 'Conversas privadas, chat geral e grupos com outros usuários',
    group: 'Operacional',
  },
  {
    key: 'nine',
    label: 'Nine Assistente Virtual',
    description: 'Atendimento inteligente e conversas de visitantes',
    group: 'Operacional',
  },
  {
    key: 'financeiro',
    label: 'Financeiro & Movimentações',
    description: 'Controle de receitas, despesas e fluxo de caixa',
    group: 'Gestão Financeira',
  },
  {
    key: 'horas',
    label: 'Controle de Horas (Banco)',
    description: 'Registro de pacotes de horas e consumo em gravações',
    group: 'Gestão Financeira',
  },
  {
    key: 'agenda',
    label: 'Agenda de Gravação',
    description: 'Calendário de gravações, postagens e estúdio',
    group: 'Produção & Gravações',
  },
  {
    key: 'roteiros',
    label: 'Roteiros e Apresentações',
    description: 'Fichas de convidados e gerador de roteiros com IA',
    group: 'Produção & Gravações',
  },
  {
    key: 'convites',
    label: 'Gerador de Convites',
    description: 'Criação e exportação de convites para convidados',
    group: 'Produção & Gravações',
  },
  {
    key: 'contatos',
    label: 'Contatos & Leads',
    description: 'Mensagens recebidas pelo formulário do site público',
    group: 'Produção & Gravações',
  },
  {
    key: 'episodios',
    label: 'Episódios',
    description: 'Catálogo de episódios gravados do canal',
    group: 'Conteúdo do Site',
  },
  {
    key: 'momentos',
    label: 'Nossos Momentos (Galeria)',
    description: 'Mural de fotos dos bastidores e convidados',
    group: 'Conteúdo do Site',
  },
  {
    key: 'depoimentos',
    label: 'Depoimentos',
    description: 'Avaliações recebidas e exibidas no carrossel',
    group: 'Conteúdo do Site',
  },
  {
    key: 'auditoria',
    label: 'Auditoria do Sistema',
    description: 'Rastreamento de atividades, segurança, regras e central de alertas',
    group: 'Exclusivo / Segurança',
  },
  {
    key: 'storefront',
    label: 'Storefront (Multi-Loja)',
    description: 'Configuração completa da página de loja do cliente',
    group: 'Exclusivo / Loja',
  },
  {
    key: 'conteudo',
    label: 'Editar Site (Textos Centrais)',
    description: 'Edição de chamadas, textos e links institucionais',
    group: 'Exclusivo / Loja',
  },
  {
    key: 'dominio',
    label: 'Área do Domínio (DNS)',
    description: 'Apontamento de domínio próprio e certificados',
    group: 'Exclusivo / Loja',
  },
  {
    key: 'integrantes',
    label: 'Integrantes & Apresentadores',
    description: 'Equipe oficial e apresentadores cadastrados',
    group: 'Exclusivo / Loja',
  },
  {
    key: 'politicas',
    label: 'Políticas do Site (LGPD)',
    description: 'Termos de uso, privacidade e política de cookies',
    group: 'Exclusivo / Loja',
  },
]

export default function AdminUsuariosScreen() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [stores, setStores] = useState<StoreRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de Criação
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('adm')
  const [selectedScreens, setSelectedScreens] = useState<string[]>([
    'dashboard',
    'storefront',
    'episodios',
    'depoimentos',
  ])
  const [allStores, setAllStores] = useState(false)
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([])
  const [auditoriaPerms, setAuditoriaPerms] = useState<AuditoriaSubPermissions>({
    ver_registros: true,
    ver_dashboard: true,
    ver_alertas: true,
    criar_regras: false,
    exportar: false,
  })
  const [saving, setSaving] = useState(false)

  // Filtro de origem da Nine
  const [filtroOrigem, setFiltroOrigem] = useState<'todos' | 'nine' | 'outros'>('todos')
  const [busca, setBusca] = useState('')

  // Modal de Edição Completa
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editOrigem, setEditOrigem] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('adm')
  const [editSelectedScreens, setEditSelectedScreens] = useState<string[]>([])
  const [editAllStores, setEditAllStores] = useState(false)
  const [editSelectedStoreIds, setEditSelectedStoreIds] = useState<string[]>([])
  const [editAuditoriaPerms, setEditAuditoriaPerms] = useState<AuditoriaSubPermissions>({
    ver_registros: true,
    ver_dashboard: true,
    ver_alertas: true,
    criar_regras: false,
    exportar: false,
  })
  const [editAtivo, setEditAtivo] = useState(true)
  const [editPassword, setEditPassword] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const loadUsersAndStores = async () => {
    try {
      setLoading(true)
      // Carregar lojas para o seletor do ADM
      try {
        const storeList = await pb.collection('stores').getFullList<StoreRecord>({
          sort: 'name',
        })
        setStores(storeList)
      } catch (storeErr) {
        console.warn('Erro ao carregar lojas para seleção:', storeErr)
      }

      // Tenta carregar usuários primeiro pelo endpoint administrativo com garantia de dados completos
      try {
        const res = await pb.send<{ success: boolean; items: UserRecord[] }>(
          '/backend/v1/admin/users/list',
          { method: 'GET' },
        )
        if (res?.items && Array.isArray(res.items)) {
          setUsers(res.items)
          return
        }
      } catch (adminListErr) {
        console.warn('Fallback para listagem padrão de users:', adminListErr)
      }

      const list = await pb.collection('users').getFullList<UserRecord>({
        sort: '-created',
      })
      setUsers(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsersAndStores()
  }, [])

  const handleOpenCreate = () => {
    setName('')
    setEmail('')
    setTelefone('')
    setPassword('')
    setRole('adm')
    setSelectedScreens(['dashboard', 'storefront', 'episodios', 'depoimentos'])
    setAllStores(stores.length === 0)
    setSelectedStoreIds(stores.length > 0 ? [stores[0].id] : [])
    setModalOpen(true)
  }

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user)
    setEditName(user.name ?? '')
    setEditEmail(user.email ?? '')
    setEditTelefone(user.telefone ?? '')
    setEditOrigem(user.origem ?? '')
    setEditRole(user.role || 'prata')
    setEditAtivo(user.ativo !== false)

    const perms = user.adm_permissions
    if (perms) {
      setEditSelectedScreens(Array.isArray(perms.allowedScreens) ? perms.allowedScreens : [])
      setEditAllStores(Boolean(perms.allStores))
      setEditSelectedStoreIds(Array.isArray(perms.storeIds) ? perms.storeIds : [])
      setEditAuditoriaPerms({
        ver_registros: perms.auditoria?.ver_registros !== false,
        ver_dashboard: perms.auditoria?.ver_dashboard !== false,
        ver_alertas: perms.auditoria?.ver_alertas !== false,
        criar_regras: Boolean(perms.auditoria?.criar_regras),
        exportar: Boolean(perms.auditoria?.exportar),
      })
    } else {
      setEditSelectedScreens(['dashboard', 'storefront', 'episodios', 'depoimentos'])
      setEditAllStores(stores.length === 0)
      setEditSelectedStoreIds(stores.length > 0 ? [stores[0].id] : [])
      setEditAuditoriaPerms({
        ver_registros: true,
        ver_dashboard: true,
        ver_alertas: true,
        criar_regras: false,
        exportar: false,
      })
    }

    setEditPassword('')
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setSavingEdit(true)
    try {
      const finalName = editName.trim() || editingUser.name || ''
      const finalEmail = (editEmail.trim() || editingUser.email || '').trim()

      if (!finalName) {
        toast.error('O nome não pode estar em branco.')
        setSavingEdit(false)
        return
      }

      if (!finalEmail) {
        toast.error('O e-mail não pode estar em branco.')
        setSavingEdit(false)
        return
      }

      if (editPassword.trim() && editPassword.trim().length < 8) {
        toast.error('A nova senha deve conter no mínimo 8 caracteres.')
        setSavingEdit(false)
        return
      }

      // Se for a conta do Superadmin principal, impedir remoção de privilégios ou inativação
      const isSuperAdminPrincipal = editingUser.email === 'alineelaana@gmail.com'
      if (isSuperAdminPrincipal && editRole !== 'master') {
        toast.error('O Superadministrador Master principal não pode perder o cargo Master.')
        setSavingEdit(false)
        return
      }
      if (isSuperAdminPrincipal && !editAtivo) {
        toast.error('A conta do Superadministrador Master não pode ser desativada.')
        setSavingEdit(false)
        return
      }

      // Monta o payload de adm_permissions caso o cargo seja ADM
      let admPermissionsPayload: AdmPermissions | null = null
      if (editRole === 'adm') {
        admPermissionsPayload = {
          allowedScreens: editSelectedScreens,
          allStores: editAllStores,
          storeIds: editAllStores ? [] : editSelectedStoreIds,
          auditoria: editSelectedScreens.includes('auditoria') ? editAuditoriaPerms : undefined,
        }
      }

      // Envia atualização para o endpoint administrativo seguro
      // Preserva email e demais dados originais caso o usuário não os tenha alterado
      const res = await pb.send('/backend/v1/admin/users/update', {
        method: 'POST',
        body: {
          id: editingUser.id,
          name: finalName,
          email: finalEmail,
          telefone: editTelefone.trim() || undefined,
          origem: editOrigem.trim() || undefined,
          role: editRole || editingUser.role,
          ativo: editAtivo,
          adm_permissions: admPermissionsPayload,
          password: editPassword.trim() || undefined,
        },
      })
      if (res?.error) {
        throw new Error(res.error)
      }

      toast.success('Informações do usuário atualizadas com sucesso!')
      setEditModalOpen(false)
      loadUsersAndStores()
    } catch (err: any) {
      console.error(err)
      const msg = err?.data?.message || err?.message || 'Erro ao atualizar dados do usuário.'
      toast.error(msg)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (password.length < 8) {
        toast.error('A senha deve conter no mínimo 8 caracteres.')
        setSaving(false)
        return
      }

      let admPermissionsPayload: AdmPermissions | null = null
      if (role === 'adm') {
        admPermissionsPayload = {
          allowedScreens: selectedScreens,
          allStores: allStores,
          storeIds: allStores ? [] : selectedStoreIds,
          auditoria: selectedScreens.includes('auditoria') ? auditoriaPerms : undefined,
        }
      }

      await pb.collection('users').create({
        email: email.trim(),
        password: password.trim(),
        passwordConfirm: password.trim(),
        name: name.trim(),
        telefone: telefone.trim() || undefined,
        role,
        adm_permissions: admPermissionsPayload,
        ativo: true,
      })

      toast.success('Novo usuário administrador cadastrado com sucesso!')
      setModalOpen(false)
      loadUsersAndStores()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cadastrar usuário.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await pb.collection('users').update(userId, { role: newRole })
      toast.success(`Nível atualizado para ${newRole.toUpperCase()}!`)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar nível.')
    }
  }

  const toggleScreen = (screenKey: string, isEdit: boolean) => {
    if (isEdit) {
      setEditSelectedScreens((prev) =>
        prev.includes(screenKey) ? prev.filter((k) => k !== screenKey) : [...prev, screenKey],
      )
    } else {
      setSelectedScreens((prev) =>
        prev.includes(screenKey) ? prev.filter((k) => k !== screenKey) : [...prev, screenKey],
      )
    }
  }

  const toggleStore = (storeId: string, isEdit: boolean) => {
    if (isEdit) {
      setEditSelectedStoreIds((prev) =>
        prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId],
      )
    } else {
      setSelectedStoreIds((prev) =>
        prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId],
      )
    }
  }

  const selectAllScreens = (isEdit: boolean) => {
    const allKeys = AVAILABLE_SCREENS.map((s) => s.key)
    if (isEdit) {
      setEditSelectedScreens(allKeys)
    } else {
      setSelectedScreens(allKeys)
    }
  }

  const clearAllScreens = (isEdit: boolean) => {
    if (isEdit) {
      setEditSelectedScreens([])
    } else {
      setSelectedScreens([])
    }
  }

  const handleDelete = async (userId: string, userEmail: string) => {
    if (userEmail === 'alineelaana@gmail.com') {
      toast.error('A conta do Superadministrador Master não pode ser excluída.')
      return
    }

    if (!window.confirm(`Deseja remover o acesso de "${userEmail}"?`)) return

    try {
      await pb.collection('users').delete(userId)
      toast.success('Usuário removido!')
      loadUsersAndStores()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir usuário.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Usuários & Permissões
          </h2>
          <p className="text-xs text-vinho/70">
            Aline Lana (Superadministrador Master) gerencia os acessos para as categorias Gerencial,
            Ouro, Prata e Master.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 flex items-center justify-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-dourado" />
          Novo Usuário
        </Button>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-vinho/10 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Button
            type="button"
            variant={filtroOrigem === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroOrigem('todos')}
            className={
              filtroOrigem === 'todos'
                ? 'bg-vinho text-white text-xs font-semibold'
                : 'text-vinho border-vinho/20 text-xs'
            }
          >
            Todos ({users.length})
          </Button>
          <Button
            type="button"
            variant={filtroOrigem === 'nine' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroOrigem('nine')}
            className={
              filtroOrigem === 'nine'
                ? 'bg-dourado text-vinho font-bold text-xs'
                : 'text-vinho border-dourado/40 text-xs'
            }
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-dourado-dark" />
            Captados pela Nine ({users.filter((u) => u.origem?.includes('Nine')).length})
          </Button>
          <Button
            type="button"
            variant={filtroOrigem === 'outros' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroOrigem('outros')}
            className={
              filtroOrigem === 'outros'
                ? 'bg-vinho text-white text-xs font-semibold'
                : 'text-vinho border-vinho/20 text-xs'
            }
          >
            Outros ({users.filter((u) => !u.origem?.includes('Nine')).length})
          </Button>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="text-xs bg-marfim/40 border-vinho/15 h-9"
          />
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Carregando usuários...
          </div>
        ) : (
          users
            .filter((u) => {
              if (filtroOrigem === 'nine' && !u.origem?.includes('Nine')) return false
              if (filtroOrigem === 'outros' && u.origem?.includes('Nine')) return false
              if (busca.trim()) {
                const b = busca.toLowerCase()
                const matchesName = (u.name || '').toLowerCase().includes(b)
                const matchesEmail = (u.email || '').toLowerCase().includes(b)
                const matchesPhone = (u.telefone || '').toLowerCase().includes(b)
                if (!matchesName && !matchesEmail && !matchesPhone) return false
              }
              return true
            })
            .map((u) => {
              const isSuperAdmin = u.email === 'alineelaana@gmail.com'
              const isNineOrigin = Boolean(u.origem && u.origem.includes('Nine'))
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-vinho">{u.name || 'Usuário'}</span>
                        {isSuperAdmin && (
                          <Badge className="bg-dourado text-vinho text-[9px] font-bold">
                            MASTER
                          </Badge>
                        )}
                        {isNineOrigin && (
                          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-semibold flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 text-amber-700" />
                            Nine · Chat
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-vinho/60 font-mono">{u.email}</p>
                      {u.telefone && (
                        <p className="text-[11px] text-vinho/70 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-dourado-dark" />
                          {u.telefone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="h-8 px-2.5 text-xs text-vinho border-vinho/20 hover:bg-vinho/5 flex items-center gap-1 font-semibold rounded-lg"
                        title="Editar usuário completo"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-dourado-dark" />
                        Editar
                      </Button>
                      {!isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u.id, u.email)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 rounded-lg"
                          title="Remover acesso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-vinho/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-vinho/70 font-medium">Permissão:</span>
                      <Badge className="bg-vinho/10 text-vinho border border-vinho/20 text-[10px] font-bold uppercase">
                        {u.role}
                      </Badge>
                    </div>
                    {u.ativo !== false ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-medium flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando usuários...</div>
        ) : (
          <Table>
            <TableHeader className="bg-marfim">
              <TableRow className="border-b border-vinho/10">
                <TableHead className="font-bold text-vinho text-xs">Nome / E-mail</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Telefone / WhatsApp</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Origem / Captação</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Nível de Permissão</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Status</TableHead>
                <TableHead className="w-36 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {users
                .filter((u) => {
                  if (filtroOrigem === 'nine' && !u.origem?.includes('Nine')) return false
                  if (filtroOrigem === 'outros' && u.origem?.includes('Nine')) return false
                  if (busca.trim()) {
                    const b = busca.toLowerCase()
                    const matchesName = (u.name || '').toLowerCase().includes(b)
                    const matchesEmail = (u.email || '').toLowerCase().includes(b)
                    const matchesPhone = (u.telefone || '').toLowerCase().includes(b)
                    if (!matchesName && !matchesEmail && !matchesPhone) return false
                  }
                  return true
                })
                .map((u) => {
                  const isSuperAdmin = u.email === 'alineelaana@gmail.com'
                  const isNineOrigin = Boolean(u.origem && u.origem.includes('Nine'))
                  return (
                    <TableRow key={u.id} className="hover:bg-vinho/5">
                      <TableCell className="text-xs font-bold text-vinho">
                        <div className="flex items-center gap-2">
                          <span>{u.name || 'Usuário'}</span>
                          {isSuperAdmin && (
                            <Badge className="bg-dourado text-vinho text-[9px] font-bold">
                              MASTER
                            </Badge>
                          )}
                        </div>
                        <span className="block text-[11px] font-normal text-vinho/60">
                          {u.email}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-vinho font-mono">
                        {u.telefone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
                            <span>{u.telefone}</span>
                          </div>
                        ) : (
                          <span className="text-vinho/40 text-[11px]">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-vinho">
                        {isNineOrigin ? (
                          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <MessageSquare className="w-3 h-3 text-amber-700" />
                            <span>Nine · Chat do Site</span>
                          </Badge>
                        ) : u.origem ? (
                          <span className="text-[11px] text-vinho/70">{u.origem}</span>
                        ) : (
                          <span className="text-[11px] text-vinho/40">Painel / Direto</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isSuperAdmin ? (
                          <span className="text-xs font-bold text-dourado-dark flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            Superadministrador
                          </span>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(val: UserRole) => handleUpdateRole(u.id, val)}
                          >
                            <SelectTrigger className="h-7 w-32 text-[11px] font-semibold border-vinho/15">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="adm">ADM (Administrador Custom)</SelectItem>
                              <SelectItem value="gerencial">Gerencial</SelectItem>
                              <SelectItem value="ouro">Ouro</SelectItem>
                              <SelectItem value="prata">Prata</SelectItem>
                              <SelectItem value="master">Master</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      <TableCell>
                        {u.ativo !== false ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-medium inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-7 px-2.5 text-[11px] font-semibold text-vinho border-vinho/20 hover:bg-vinho/10 inline-flex items-center gap-1 rounded-md"
                          title="Editar todas as informações do usuário"
                        >
                          <Edit3 className="w-3 h-3 text-dourado-dark" />
                          Editar
                        </Button>
                        {!isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(u.id, u.email)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                            title="Remover acesso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Criação de Usuário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              Criar Novo Acesso Administrativo
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-name" className="text-xs font-semibold text-vinho">
                Nome Completo *
              </Label>
              <Input
                id="u-name"
                required
                placeholder="Ex.: Mariana Produtora"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email" className="text-xs font-semibold text-vinho">
                E-mail de Login *
              </Label>
              <Input
                id="u-email"
                type="email"
                required
                placeholder="usuario@coffeecast.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-telefone" className="text-xs font-semibold text-vinho">
                Telefone / WhatsApp (Opcional)
              </Label>
              <Input
                id="u-telefone"
                placeholder="(31) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-pass" className="text-xs font-semibold text-vinho">
                Senha Inicial (Mínimo 8 dígitos) *
              </Label>
              <Input
                id="u-pass"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">
                Nível de Permissão Inicial *
              </Label>
              <Select value={role} onValueChange={(val: UserRole) => setRole(val)}>
                <SelectTrigger className="bg-white border-vinho/20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adm">
                    ADM (Permissões granulares de telas e lojas autorizadas)
                  </SelectItem>
                  <SelectItem value="gerencial">
                    Categoria Gerencial (Membros + Contatos, Financeiro, Agenda e Convites)
                  </SelectItem>
                  <SelectItem value="ouro">Categoria Ouro (Apenas Área de Membros)</SelectItem>
                  <SelectItem value="prata">Categoria Prata (Apenas Área de Membros)</SelectItem>
                  <SelectItem value="master">
                    Categoria Master (Superadministrador - Acesso Total)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-vinho/65">
                • <strong>Master:</strong> Acesso total soberano ao sistema.
                <br />• <strong>ADM:</strong> Acesso somente às telas e lojas autorizadas pelo
                Master.
                <br />• <strong>Gerencial:</strong> Acesso a membros e admin operacional.
                <br />• <strong>Ouro & Prata:</strong> Acesso restrito à Área de Membros.
              </p>
            </div>
            {/* SEÇÃO DE PERMISSÕES GRANULARES PARA NOVO ADM */}
            {role === 'adm' && (
              <div className="p-3.5 bg-amber-50/70 border-2 border-dourado/40 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-vinho/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-dourado-dark" />
                    <span className="text-xs font-bold text-vinho">
                      Permissões Granulares do ADM
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => selectAllScreens(false)}
                      className="text-dourado-dark hover:underline font-semibold"
                    >
                      Marcar todas
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => clearAllScreens(false)}
                      className="text-vinho/60 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Vínculo com Loja(s) */}
                <div className="space-y-2 bg-white/80 p-2.5 rounded-xl border border-vinho/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-vinho flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-dourado-dark" />
                      Loja(s) Autorizada(s)
                    </Label>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-vinho cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allStores}
                        onChange={(e) => setAllStores(e.target.checked)}
                        className="rounded text-vinho focus:ring-dourado"
                      />
                      Todas as Lojas
                    </label>
                  </div>

                  {!allStores && (
                    <div className="space-y-1 pt-1">
                      {stores.length === 0 ? (
                        <p className="text-[11px] text-vinho/60 italic">
                          Nenhuma loja cadastrada no Storefront ainda. Crie uma loja no menu
                          Storefront para vincular.
                        </p>
                      ) : (
                        stores.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-vinho/5 cursor-pointer text-xs text-vinho"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStoreIds.includes(s.id)}
                              onChange={() => toggleStore(s.id, false)}
                              className="rounded text-vinho focus:ring-dourado"
                            />
                            <span className="font-medium truncate">{s.name}</span>
                            <span className="text-[10px] text-vinho/50">({s.slug})</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Seleção de Telas / Blocos Autorizados */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-vinho block">
                    Telas & Blocos Autorizados do Master:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {AVAILABLE_SCREENS.map((screen) => {
                      const checked = selectedScreens.includes(screen.key)
                      return (
                        <label
                          key={screen.key}
                          className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? 'bg-vinho-light/10 border-dourado/60 text-vinho font-semibold shadow-2xs'
                              : 'bg-white/60 border-vinho/10 text-vinho/70 hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleScreen(screen.key, false)}
                            className="mt-0.5 rounded text-vinho focus:ring-dourado"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs leading-tight">{screen.label}</p>
                            <p className="text-[10px] text-vinho/50 truncate font-normal">
                              {screen.description}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* SUB-PERMISSÕES GRANULARES DE AUDITORIA */}
                {selectedScreens.includes('auditoria') && (
                  <div className="p-3 bg-white/95 border border-vinho/20 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-dourado-dark" />
                      <span className="text-xs font-bold text-vinho">
                        Funções Permitidas na Auditoria:
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={auditoriaPerms.ver_registros !== false}
                          onChange={(e) =>
                            setAuditoriaPerms((p) => ({ ...p, ver_registros: e.target.checked }))
                          }
                          className="rounded text-vinho focus:ring-dourado"
                        />
                        <span>Ver Registros</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={auditoriaPerms.ver_dashboard !== false}
                          onChange={(e) =>
                            setAuditoriaPerms((p) => ({ ...p, ver_dashboard: e.target.checked }))
                          }
                          className="rounded text-vinho focus:ring-dourado"
                        />
                        <span>Ver Dashboard</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={auditoriaPerms.ver_alertas !== false}
                          onChange={(e) =>
                            setAuditoriaPerms((p) => ({ ...p, ver_alertas: e.target.checked }))
                          }
                          className="rounded text-vinho focus:ring-dourado"
                        />
                        <span>Ver Alertas</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(auditoriaPerms.criar_regras)}
                          onChange={(e) =>
                            setAuditoriaPerms((p) => ({ ...p, criar_regras: e.target.checked }))
                          }
                          className="rounded text-vinho focus:ring-dourado"
                        />
                        <span>Criar Regras</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                        <input
                          type="checkbox"
                          checked={Boolean(auditoriaPerms.exportar)}
                          onChange={(e) =>
                            setAuditoriaPerms((p) => ({ ...p, exportar: e.target.checked }))
                          }
                          className="rounded text-vinho focus:ring-dourado"
                        />
                        <span>Exportar Relatórios (CSV)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}{' '}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-5"
              >
                {saving ? 'Criando...' : 'Liberar Acesso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição Completa de Usuário */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-dourado-dark" />
              Editar Informações do Usuário
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold text-vinho">
                  Nome Completo *
                </Label>
                <Input
                  id="edit-name"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="bg-white border-vinho/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-semibold text-vinho">
                  E-mail de Login *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  required
                  disabled={editingUser.email === 'alineelaana@gmail.com'}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="usuario@coffeecast.com"
                  className="bg-white border-vinho/20 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {editingUser.email === 'alineelaana@gmail.com' && (
                  <p className="text-[10px] text-vinho/60">
                    O e-mail do Superadministrador Master principal não pode ser alterado.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-telefone" className="text-xs font-semibold text-vinho">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="edit-telefone"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  placeholder="(31) 99999-9999"
                  className="bg-white border-vinho/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-origem" className="text-xs font-semibold text-vinho">
                  Origem do Contato / Cadastro
                </Label>
                <Input
                  id="edit-origem"
                  value={editOrigem}
                  onChange={(e) => setEditOrigem(e.target.value)}
                  placeholder="Ex.: Nine — Chat do Site, Painel, etc."
                  className="bg-white border-vinho/20 text-sm"
                />
              </div>

              {/* SEÇÃO DE PERMISSÕES GRANULARES PARA ADM NA EDIÇÃO */}
              {editRole === 'adm' && (
                <div className="p-3.5 bg-amber-50/70 border-2 border-dourado/40 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-vinho/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-dourado-dark" />
                      <span className="text-xs font-bold text-vinho">
                        Permissões Granulares do ADM
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => selectAllScreens(true)}
                        className="text-dourado-dark hover:underline font-semibold"
                      >
                        Marcar todas
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => clearAllScreens(true)}
                        className="text-vinho/60 hover:underline"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  {/* Vínculo com Loja(s) do ADM */}
                  <div className="space-y-2 bg-white/80 p-2.5 rounded-xl border border-vinho/10">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-vinho flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-dourado-dark" />
                        Loja(s) Autorizada(s)
                      </Label>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-vinho cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllStores}
                          onChange={(e) => setEditAllStores(e.target.checked)}
                          className="rounded text-vinho focus:ring-dourado"
                        />
                        Todas as Lojas
                      </label>
                    </div>

                    {!editAllStores && (
                      <div className="space-y-1 pt-1">
                        {stores.length === 0 ? (
                          <p className="text-[11px] text-vinho/60 italic">
                            Nenhuma loja cadastrada no Storefront.
                          </p>
                        ) : (
                          stores.map((s) => (
                            <label
                              key={s.id}
                              className="flex items-center gap-2 p-1.5 rounded hover:bg-vinho/5 cursor-pointer text-xs text-vinho"
                            >
                              <input
                                type="checkbox"
                                checked={editSelectedStoreIds.includes(s.id)}
                                onChange={() => toggleStore(s.id, true)}
                                className="rounded text-vinho focus:ring-dourado"
                              />
                              <span className="font-medium truncate">{s.name}</span>
                              <span className="text-[10px] text-vinho/50">({s.slug})</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Telas e Blocos Autorizados */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-vinho block">
                      Telas & Blocos Autorizados do Master:
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_SCREENS.map((screen) => {
                        const checked = editSelectedScreens.includes(screen.key)
                        return (
                          <label
                            key={screen.key}
                            className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              checked
                                ? 'bg-vinho-light/10 border-dourado/60 text-vinho font-semibold shadow-2xs'
                                : 'bg-white/60 border-vinho/10 text-vinho/70 hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleScreen(screen.key, true)}
                              className="mt-0.5 rounded text-vinho focus:ring-dourado"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-xs leading-tight">{screen.label}</p>
                              <p className="text-[10px] text-vinho/50 truncate font-normal">
                                {screen.description}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sub-permissões Granulares de Auditoria no Modal de Edição */}
                  {editSelectedScreens.includes('auditoria') && (
                    <div className="p-3 bg-white/95 border border-vinho/20 rounded-xl space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-dourado-dark" />
                        <span className="text-xs font-bold text-vinho">
                          Funções Permitidas na Auditoria:
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editAuditoriaPerms.ver_registros !== false}
                            onChange={(e) =>
                              setEditAuditoriaPerms((p) => ({
                                ...p,
                                ver_registros: e.target.checked,
                              }))
                            }
                            className="rounded text-vinho focus:ring-dourado"
                          />
                          <span>Ver Registros</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editAuditoriaPerms.ver_dashboard !== false}
                            onChange={(e) =>
                              setEditAuditoriaPerms((p) => ({
                                ...p,
                                ver_dashboard: e.target.checked,
                              }))
                            }
                            className="rounded text-vinho focus:ring-dourado"
                          />
                          <span>Ver Dashboard</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editAuditoriaPerms.ver_alertas !== false}
                            onChange={(e) =>
                              setEditAuditoriaPerms((p) => ({
                                ...p,
                                ver_alertas: e.target.checked,
                              }))
                            }
                            className="rounded text-vinho focus:ring-dourado"
                          />
                          <span>Ver Alertas</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editAuditoriaPerms.criar_regras)}
                            onChange={(e) =>
                              setEditAuditoriaPerms((p) => ({
                                ...p,
                                criar_regras: e.target.checked,
                              }))
                            }
                            className="rounded text-vinho focus:ring-dourado"
                          />
                          <span>Criar Regras</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                          <input
                            type="checkbox"
                            checked={Boolean(editAuditoriaPerms.exportar)}
                            onChange={(e) =>
                              setEditAuditoriaPerms((p) => ({ ...p, exportar: e.target.checked }))
                            }
                            className="rounded text-vinho focus:ring-dourado"
                          />
                          <span>Exportar Relatórios (CSV)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Nível / Cargo *</Label>
                <Select
                  value={editRole}
                  onValueChange={(val: UserRole) => setEditRole(val)}
                  disabled={editingUser.email === 'alineelaana@gmail.com'}
                >
                  <SelectTrigger className="bg-white border-vinho/20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Master (Superadministrador)</SelectItem>
                    <SelectItem value="adm">ADM (Administrador de Loja / Custom)</SelectItem>
                    <SelectItem value="gerencial">Gerencial (Operacional e Membros)</SelectItem>
                    <SelectItem value="ouro">Ouro (Área de Membros)</SelectItem>
                    <SelectItem value="prata">Prata (Área de Membros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status / Ativo */}
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-vinho/15">
                <div>
                  <Label className="text-xs font-bold text-vinho block">Status da Conta</Label>
                  <p className="text-[11px] text-vinho/60">
                    {editAtivo
                      ? 'Conta ativa e liberada para acessar o sistema'
                      : 'Conta inativa (acesso bloqueado)'}
                  </p>
                </div>
                <Switch
                  checked={editAtivo}
                  disabled={editingUser.email === 'alineelaana@gmail.com'}
                  onCheckedChange={setEditAtivo}
                />
              </div>

              {/* Campo Nova Senha Opcional */}
              <div className="space-y-1.5 p-3 bg-dourado/10 border border-dourado/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-dourado-dark" />
                    <Label htmlFor="edit-pass" className="text-xs font-bold text-vinho">
                      Nova Senha (Opcional)
                    </Label>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Deixe em branco = Mantém a senha atual
                  </span>
                </div>
                <Input
                  id="edit-pass"
                  type="password"
                  placeholder="Deixe vazio para manter a senha já existente"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="bg-white border-vinho/20 text-sm"
                />
                <p className="text-[10px] text-vinho/70">
                  A senha atual NÃO é apagada nem alterada se este campo permanecer vazio. Digite
                  apenas se desejar redefinir (mínimo de 8 caracteres).
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-5"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
