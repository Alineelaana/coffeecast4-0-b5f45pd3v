import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import type { UserRecord, UserRole } from '@/types/database'
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
import { Plus, Shield, Trash2, UserPlus, Edit3, Key, CheckCircle2, XCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function AdminUsuariosScreen() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de Criação
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('prata')
  const [saving, setSaving] = useState(false)

  // Modal de Edição Completa
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('prata')
  const [editAtivo, setEditAtivo] = useState(true)
  const [editPassword, setEditPassword] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
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
    loadUsers()
  }, [])

  const handleOpenCreate = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('prata')
    setModalOpen(true)
  }

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user)
    setEditName(user.name || '')
    setEditEmail(user.email || '')
    setEditRole(user.role || 'prata')
    setEditAtivo(user.ativo !== false)
    setEditPassword('')
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setSavingEdit(true)
    try {
      if (!editName.trim()) {
        toast.error('O nome não pode estar em branco.')
        setSavingEdit(false)
        return
      }

      if (!editEmail.trim()) {
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

      // Envia atualização para o endpoint administrativo seguro
      const res = await pb.send('/backend/v1/admin/users/update', {
        method: 'POST',
        body: {
          id: editingUser.id,
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          ativo: editAtivo,
          password: editPassword.trim() || undefined,
        },
      })

      if (res?.error) {
        throw new Error(res.error)
      }

      toast.success('Informações do usuário atualizadas com sucesso!')
      setEditModalOpen(false)
      loadUsers()
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

      await pb.collection('users').create({
        email: email.trim(),
        password: password.trim(),
        passwordConfirm: password.trim(),
        name: name.trim(),
        role,
        ativo: true,
      })

      toast.success('Novo usuário administrador cadastrado!')
      setModalOpen(false)
      loadUsers()
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
      toast.success(`Nível de permissão atualizado para ${newRole.toUpperCase()}!`)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar permissão.')
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
      loadUsers()
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

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Carregando usuários...
          </div>
        ) : (
          users.map((u) => {
            const isSuperAdmin = u.email === 'alineelaana@gmail.com'
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-vinho">{u.name || 'Usuário'}</span>
                      {isSuperAdmin && (
                        <Badge className="bg-dourado text-vinho text-[9px] font-bold">MASTER</Badge>
                      )}
                    </div>
                    <p className="text-xs text-vinho/60 font-mono">{u.email}</p>
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
                <TableHead className="font-bold text-vinho text-xs">Nível de Permissão</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Status</TableHead>
                <TableHead className="w-36 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {users.map((u) => {
                const isSuperAdmin = u.email === 'alineelaana@gmail.com'
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
                      <span className="block text-[11px] font-normal text-vinho/60">{u.email}</span>
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
                • <strong>Master:</strong> Acesso total ao site, administração e membros.
                <br />• <strong>Gerencial:</strong> Acesso a membros e admin operacional (Visão
                Geral, Contatos, Financeiro, Banco de Horas, Agenda e Convites).
                <br />• <strong>Ouro & Prata:</strong> Acesso restrito à Área de Membros.
              </p>{' '}
            </div>

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
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-dourado-dark" />
                  <Label htmlFor="edit-pass" className="text-xs font-bold text-vinho">
                    Alterar Senha (Opcional)
                  </Label>
                </div>
                <Input
                  id="edit-pass"
                  type="password"
                  placeholder="Deixe em branco para manter a senha atual"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="bg-white border-vinho/20 text-sm"
                />
                <p className="text-[10px] text-vinho/70">
                  Ao digitar uma nova senha (mínimo de 8 caracteres), ela será atualizada
                  imediatamente no sistema.
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
