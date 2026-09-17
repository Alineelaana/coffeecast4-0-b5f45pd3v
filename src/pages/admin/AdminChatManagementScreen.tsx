import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ChatService } from '@/services/chat'
import type { ChatOverviewItem, ChatMensagemRecord } from '@/types/database'
import { UserChatAvatar, UserRoleBadge } from '@/components/chat/UserChatAvatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ShieldAlert,
  MessageSquare,
  Users,
  Globe2,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDateBR } from '@/lib/formatters'
import { ChatStickerMessage } from '@/components/chat/ChatStickerMessage'
import { isStickerMessage, getStickerPreviewLabel } from '@/components/chat/stickers'

export default function AdminChatManagementScreen() {
  const { isMaster } = useAuth()
  const [conversas, setConversas] = useState<ChatOverviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'privado' | 'geral' | 'grupo'>('todos')

  // Visualização de Mensagens / Auditoria da Conversa
  const [selectedConversa, setSelectedConversa] = useState<ChatOverviewItem | null>(null)
  const [messagesModalOpen, setMessagesModalOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMensagemRecord[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Confirmação de exclusão de conversa
  const [deleteConversaTarget, setDeleteConversaTarget] = useState<ChatOverviewItem | null>(null)
  const [deletingConversa, setDeletingConversa] = useState(false)

  // Confirmação de exclusão de mensagem
  const [deleteMsgTarget, setDeleteMsgTarget] = useState<ChatMensagemRecord | null>(null)
  const [deletingMsg, setDeletingMsg] = useState(false)

  const loadOverview = async () => {
    try {
      setLoading(true)
      const data = await ChatService.getMasterOverview()
      setConversas(data)
    } catch (err: any) {
      console.error('Erro ao carregar gestão de conversas:', err)
      toast.error(err.message || 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  // Abrir histórico completo de uma conversa para auditoria
  const handleOpenConversationAudit = async (conversa: ChatOverviewItem) => {
    setSelectedConversa(conversa)
    setMessagesModalOpen(true)
    try {
      setLoadingMessages(true)
      const data = await ChatService.getMessages(conversa.id, 1, 200)
      setMessages(data.items)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao buscar mensagens desta conversa.')
    } finally {
      setLoadingMessages(false)
    }
  }

  // Exclusão de conversa
  const handleConfirmDeleteConversation = async () => {
    if (!deleteConversaTarget) return
    try {
      setDeletingConversa(true)
      await ChatService.deleteConversation(deleteConversaTarget.id)
      toast.success('Conversa e histórico excluídos permanentemente.')
      setDeleteConversaTarget(null)
      loadOverview()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao excluir conversa.')
    } finally {
      setDeletingConversa(false)
    }
  }

  // Exclusão de mensagem específica
  const handleConfirmDeleteMessage = async () => {
    if (!deleteMsgTarget) return
    try {
      setDeletingMsg(true)
      await ChatService.deleteMessage(deleteMsgTarget.id)
      toast.success('Mensagem excluída com sucesso.')
      setMessages((prev) => prev.filter((m) => m.id !== deleteMsgTarget.id))
      setDeleteMsgTarget(null)
      // Recarregar contadores
      loadOverview()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao excluir mensagem.')
    } finally {
      setDeletingMsg(false)
    }
  }

  if (!isMaster) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-vinho/15 shadow-sm text-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full bg-vinho/10 text-vinho mx-auto flex items-center justify-center font-bold text-lg">
          🔒
        </div>
        <h2 className="text-xl font-serif font-bold text-vinho">Acesso Restrito ao Master</h2>
        <p className="text-sm text-vinho/70">
          A área de Gestão de Conversas é exclusiva para o Superadministrador Master auditar e
          gerenciar diálogos do sistema.
        </p>
      </div>
    )
  }

  // Filtragem
  const filteredConversas = conversas.filter((c) => {
    if (tipoFilter !== 'todos' && c.tipo !== tipoFilter) return false
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const matchesName = c.nome.toLowerCase().includes(term)
    const matchesPart = c.participantes.some((p) => p.name.toLowerCase().includes(term))
    const matchesLastMsg = c.ultima_mensagem?.texto?.toLowerCase().includes(term)
    return matchesName || matchesPart || matchesLastMsg
  })

  // Estatísticas
  const totalGeral = conversas.filter((c) => c.tipo === 'geral').length
  const totalPrivadas = conversas.filter((c) => c.tipo === 'privado').length
  const totalGrupos = conversas.filter((c) => c.tipo === 'grupo').length
  const totalMensagensGlobal = conversas.reduce((acc, c) => acc + c.total_mensagens, 0)

  return (
    <div className="space-y-6 font-sans">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vinho/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-dourado-dark uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Exclusivo Master</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-vinho mt-0.5">
            Gestão de Conversas & Auditoria
          </h1>
          <p className="text-xs sm:text-sm text-vinho/70">
            Painel soberano de consulta, moderação e gerenciamento de todos os chats individuais,
            chat geral e grupos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/chat">
            <Button
              variant="outline"
              size="sm"
              className="border-vinho/20 text-vinho hover:bg-vinho/5 text-xs rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Abrir Chat
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={loadOverview}
            disabled={loading}
            className="bg-vinho hover:bg-vinho-light text-white text-xs rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-vinho/60 text-xs mb-1 font-semibold">
            <span>Total Conversas</span>
            <MessageSquare className="w-4 h-4 text-dourado-dark" />
          </div>
          <p className="font-serif font-black text-2xl text-vinho">{conversas.length}</p>
          <p className="text-[10px] text-vinho/50 mt-1">Registradas no banco</p>
        </div>

        <div className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-vinho/60 text-xs mb-1 font-semibold">
            <span>Privadas</span>
            <Users className="w-4 h-4 text-dourado-dark" />
          </div>
          <p className="font-serif font-black text-2xl text-vinho">{totalPrivadas}</p>
          <p className="text-[10px] text-vinho/50 mt-1">Pares únicos</p>
        </div>

        <div className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-vinho/60 text-xs mb-1 font-semibold">
            <span>Grupos</span>
            <Users className="w-4 h-4 text-dourado-dark" />
          </div>
          <p className="font-serif font-black text-2xl text-vinho">{totalGrupos}</p>
          <p className="text-[10px] text-vinho/50 mt-1">Equipes e membros</p>
        </div>

        <div className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-vinho/60 text-xs mb-1 font-semibold">
            <span>Mensagens</span>
            <Globe2 className="w-4 h-4 text-dourado-dark" />
          </div>
          <p className="font-serif font-black text-2xl text-vinho">{totalMensagensGlobal}</p>
          <p className="text-[10px] text-vinho/50 mt-1">Histórico acumulado</p>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-vinho/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, participante ou texto..."
            className="pl-9 bg-marfim/50 border-vinho/20 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-vinho/60 font-semibold mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Tipo:
          </span>
          {(['todos', 'privado', 'grupo', 'geral'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                tipoFilter === t
                  ? 'bg-vinho text-white shadow-xs'
                  : 'bg-marfim/80 text-vinho/70 hover:bg-vinho/10'
              }`}
            >
              {t === 'todos'
                ? 'Todos'
                : t === 'privado'
                  ? 'Privados'
                  : t === 'grupo'
                    ? 'Grupos'
                    : 'Chat Geral'}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE CONVERSAS */}
      <div className="bg-white rounded-3xl border border-vinho/10 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-marfim/80 border-b border-vinho/10">
            <TableRow>
              <TableHead className="font-serif font-bold text-vinho text-xs">
                Conversa / Tipo
              </TableHead>
              <TableHead className="font-serif font-bold text-vinho text-xs">
                Participantes
              </TableHead>
              <TableHead className="font-serif font-bold text-vinho text-xs text-center">
                Mensagens
              </TableHead>
              <TableHead className="font-serif font-bold text-vinho text-xs">
                Última Mensagem
              </TableHead>
              <TableHead className="font-serif font-bold text-vinho text-xs">Criada em</TableHead>
              <TableHead className="font-serif font-bold text-vinho text-xs text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-vinho/60">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-dourado-dark mb-2" />
                  Carregando conversas do sistema...
                </TableCell>
              </TableRow>
            ) : filteredConversas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-xs text-vinho/60">
                  Nenhuma conversa encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredConversas.map((conv) => (
                <TableRow key={conv.id} className="hover:bg-marfim/40 transition-colors">
                  {/* Nome e Tipo */}
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-vinho/10 text-vinho flex items-center justify-center shrink-0">
                        {conv.tipo === 'geral' ? (
                          <Globe2 className="w-4 h-4 text-dourado-dark" />
                        ) : conv.tipo === 'grupo' ? (
                          <Users className="w-4 h-4 text-vinho" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-dourado-dark" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-[200px]">
                        <span className="font-bold text-xs text-vinho truncate block">
                          {conv.nome}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge
                            className={`text-[9px] px-1.5 py-0 rounded ${
                              conv.tipo === 'geral'
                                ? 'bg-dourado text-vinho font-bold'
                                : conv.tipo === 'grupo'
                                  ? 'bg-[#4A154B] text-white font-bold'
                                  : 'bg-vinho/10 text-vinho'
                            }`}
                          >
                            {conv.tipo === 'geral'
                              ? 'Chat Geral'
                              : conv.tipo === 'grupo'
                                ? 'Grupo'
                                : 'Privado'}
                          </Badge>
                          {conv.descricao && (
                            <span className="text-[10px] text-vinho/50 truncate block">
                              {conv.descricao}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Participantes */}
                  <TableCell className="align-middle">
                    {conv.tipo === 'geral' ? (
                      <span className="text-xs text-vinho/70 italic">
                        Todos os usuários cadastrados
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {conv.participantes.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="inline-flex items-center gap-1 bg-marfim border border-vinho/10 px-2 py-0.5 rounded-lg text-[11px]"
                          >
                            <span className="font-semibold text-vinho truncate max-w-[90px]">
                              {p.name}
                            </span>
                            <UserRoleBadge role={p.role} size="sm" />
                          </div>
                        ))}
                        {conv.participantes.length > 4 && (
                          <span className="text-[10px] text-vinho/50 self-center">
                            +{conv.participantes.length - 4} mais
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Total de Mensagens */}
                  <TableCell className="align-middle text-center">
                    <Badge variant="outline" className="font-mono text-xs font-bold text-vinho">
                      {conv.total_mensagens}
                    </Badge>
                  </TableCell>

                  {/* Última Mensagem */}
                  <TableCell className="align-middle">
                    {conv.ultima_mensagem ? (
                      <div className="max-w-xs">
                        <p className="text-xs text-vinho line-clamp-1 font-medium">
                          {getStickerPreviewLabel(conv.ultima_mensagem.texto)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-vinho/50 mt-0.5">
                          <span>{conv.ultima_mensagem.remetente_nome}</span>
                          <span>•</span>
                          <span>
                            {new Date(conv.ultima_mensagem.data).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-vinho/40 italic">Sem mensagens</span>
                    )}
                  </TableCell>

                  {/* Criada em */}
                  <TableCell className="align-middle text-xs text-vinho/60 whitespace-nowrap">
                    {new Date(conv.created).toLocaleDateString('pt-BR')}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="align-middle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenConversationAudit(conv)}
                        className="h-8 px-2.5 text-xs border-vinho/20 text-vinho hover:bg-vinho/5 rounded-xl flex items-center gap-1"
                        title="Ver histórico completo de mensagens"
                      >
                        <Eye className="w-3.5 h-3.5 text-dourado-dark" />
                        Ver Histórico
                      </Button>

                      {conv.tipo !== 'geral' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConversaTarget(conv)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                          title="Excluir conversa inteira"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL: HISTÓRICO COMPLETO & AUDITORIA DA CONVERSA */}
      <Dialog open={messagesModalOpen} onOpenChange={setMessagesModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-[#FAF8F5] border-2 border-dourado/40 rounded-3xl p-6 max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-vinho/10 pb-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="font-serif font-bold text-lg text-vinho flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-dourado-dark" />
                Histórico: {selectedConversa?.nome}
              </DialogTitle>
              <Badge className="bg-dourado text-vinho font-bold text-[10px]">
                {selectedConversa?.tipo?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-vinho/60 mt-1">
              {selectedConversa?.participantes.map((p) => p.name).join(', ') || 'Chat Oficial'}
            </p>
          </DialogHeader>

          {/* LISTA DE MENSAGENS COM DATA, HORA, AUTOR E BOTÃO DE EXCLUIR */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
            {loadingMessages ? (
              <div className="py-12 text-center text-xs text-vinho/60 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-dourado-dark" />
                Carregando mensagens da conversa...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-xs text-vinho/60">
                Nenhuma mensagem registrada nesta conversa.
              </div>
            ) : (
              messages.map((m) => {
                const rem = m.expand?.remetente
                return (
                  <div
                    key={m.id}
                    className="p-3 bg-white rounded-2xl border border-vinho/10 shadow-2xs flex items-start justify-between gap-3 group hover:border-vinho/30 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <UserChatAvatar
                        name={rem?.name || 'Membro'}
                        avatar={rem?.avatar}
                        userRecord={rem}
                        size="sm"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-vinho">
                            {rem?.name || 'Membro'}
                          </span>
                          <UserRoleBadge role={rem?.role || 'prata'} size="sm" />
                          <span className="text-[10px] text-vinho/50">
                            {new Date(m.created).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                          </span>
                        </div>
                        {isStickerMessage(m.texto) ? (
                          <div className="pt-1 pb-1">
                            <ChatStickerMessage content={m.texto} size={84} />
                          </div>
                        ) : (
                          <p className="text-xs text-vinho/85 whitespace-pre-wrap break-words leading-relaxed">
                            {m.texto}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteMsgTarget(m)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Excluir mensagem (Exclusivo Master)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR EXCLUSÃO DE CONVERSA */}
      <Dialog
        open={Boolean(deleteConversaTarget)}
        onOpenChange={(open) => !open && setDeleteConversaTarget(null)}
      >
        <DialogContent className="sm:max-w-md bg-white border border-red-200 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Excluir Conversa Permanentemente?
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-vinho/80 mt-2 leading-relaxed">
            Tem certeza de que deseja excluir a conversa{' '}
            <strong>"{deleteConversaTarget?.nome}"</strong> e todas as mensagens contidas nela? Esta
            ação é irreversível e removerá o chat para todos os participantes.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConversaTarget(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deletingConversa}
              onClick={handleConfirmDeleteConversation}
              className="text-xs rounded-xl"
            >
              {deletingConversa ? 'Excluindo...' : 'Sim, Excluir Conversa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR EXCLUSÃO DE MENSAGEM */}
      <Dialog
        open={Boolean(deleteMsgTarget)}
        onOpenChange={(open) => !open && setDeleteMsgTarget(null)}
      >
        <DialogContent className="sm:max-w-md bg-white border border-red-200 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Excluir Mensagem?
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-vinho/80 mt-2 leading-relaxed">
            Deseja apagar permanentemente esta mensagem do histórico de auditoria?
          </p>
          <div className="p-3 bg-marfim rounded-xl border border-vinho/10 text-xs italic text-vinho/70 my-2">
            "{deleteMsgTarget?.texto}"
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteMsgTarget(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deletingMsg}
              onClick={handleConfirmDeleteMessage}
              className="text-xs rounded-xl"
            >
              {deletingMsg ? 'Excluindo...' : 'Excluir Mensagem'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
