import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import { ChatService } from '@/services/chat'
import type {
  ChatConversaRecord,
  ChatMensagemRecord,
  ChatUserItem,
  ChatConversaTipo,
} from '@/types/database'
import {
  UserChatAvatar,
  UserRoleBadge,
  UserStatusIndicator,
} from '@/components/chat/UserChatAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Users,
  Globe2,
  Search,
  Plus,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Sparkles,
  Info,
  Coffee,
  Clock,
  ChevronDown,
  Smile,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDateBR } from '@/lib/formatters'
import { EmojiStickerPicker } from '@/components/chat/EmojiStickerPicker'
import { ChatStickerMessage } from '@/components/chat/ChatStickerMessage'
import {
  isStickerMessage,
  STICKER_PREFIX,
  getStickerPreviewLabel,
} from '@/components/chat/stickers'

interface ConversationWithMeta extends ChatConversaRecord {
  displayName: string
  displayAvatar?: string
  displayRole?: string
  targetUser?: ChatUserItem
  unreadCount: number
  participantsCount?: number
}

export default function ChatScreen() {
  const { user, isMaster, role } = useAuth()
  const [activeTab, setActiveTab] = useState<ChatConversaTipo>('privado')
  const [activeConversation, setActiveConversation] = useState<ConversationWithMeta | null>(null)

  // Listas
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([])
  const [allUsers, setAllUsers] = useState<ChatUserItem[]>([])
  const [messages, setMessages] = useState<ChatMensagemRecord[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  // Mensagem em digitação
  const [inputMessage, setInputMessage] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  // Status do próprio usuário autenticado
  const [myStatus, setMyStatus] = useState<'online' | 'offline' | 'em_pausa'>('online')
  const [myPauseReason, setMyPauseReason] = useState<string>('')
  const [pauseModalOpen, setPauseModalOpen] = useState(false)
  const [selectedPauseOption, setSelectedPauseOption] = useState<
    'Almoço' | 'Reunião' | 'Atendimento' | 'Intervalo' | 'Outro'
  >('Almoço')
  const [customPauseText, setCustomPauseText] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Modais
  const [newPrivateModalOpen, setNewPrivateModalOpen] = useState(false)
  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedGroupUserIds, setSelectedGroupUserIds] = useState<string[]>([])
  const [creatingChat, setCreatingChat] = useState(false)

  // Mobile toggle de histórico vs lista
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Carrega lista de usuários e conversas
  const loadData = async (keepActive = true) => {
    if (!user) return
    try {
      setLoadingList(true)
      const [usersList, geralConv, myConvData] = await Promise.all([
        ChatService.getChatUsers(),
        ChatService.getGeralConversation(),
        ChatService.getMyConversations(user.id),
      ])

      setAllUsers(usersList)
      const userMap = new Map<string, ChatUserItem>()
      usersList.forEach((u) => userMap.set(u.id, u))

      // Processar dados das conversas
      const convList: ConversationWithMeta[] = []

      // 1. Chat Geral sempre presente
      const geralUnread = await ChatService.getUnreadCount(geralConv.id, user.id)
      convList.push({
        ...geralConv,
        displayName: 'Chat Geral CoffeeCast',
        descricao: 'Comunidade geral de membros e equipe',
        unreadCount: geralUnread,
      })

      // 2. Conversas privadas e grupos
      for (const conv of myConvData.conversas) {
        if (conv.tipo === 'geral') continue

        let displayName = conv.nome || 'Conversa'
        let displayAvatar: string | undefined
        let displayRole: string | undefined
        let targetUser: ChatUserItem | undefined

        if (conv.tipo === 'privado' && conv.private_pair) {
          const parts = conv.private_pair.split(':')
          const otherId = parts[0] === user.id ? parts[1] : parts[0]
          targetUser = userMap.get(otherId)
          if (targetUser) {
            displayName = targetUser.name
            displayAvatar = targetUser.avatar
            displayRole = targetUser.role
          }
        }

        const part = myConvData.participacoes.find((p) => p.conversa === conv.id)
        const unread = await ChatService.getUnreadCount(conv.id, user.id, part?.ultima_leitura)

        convList.push({
          ...conv,
          displayName,
          displayAvatar,
          displayRole,
          targetUser,
          unreadCount: unread,
        })
      }

      setConversations(convList)

      // Se mantiver conversa ativa ou seleciona a padrão
      if (keepActive && activeConversation) {
        const found = convList.find((c) => c.id === activeConversation.id)
        if (found) setActiveConversation(found)
      } else if (!activeConversation) {
        // Selecionar primeiro da aba ativa
        const defaultConv =
          activeTab === 'geral'
            ? convList.find((c) => c.tipo === 'geral')
            : convList.find((c) => c.tipo === activeTab) || convList.find((c) => c.tipo === 'geral')
        if (defaultConv) {
          selectConversation(defaultConv)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar conversas do chat:', err)
      toast.error('Erro ao carregar conversas.')
    } finally {
      setLoadingList(false)
    }
  }

  // Carrega mensagens da conversa selecionada
  const loadMessages = async (convId: string) => {
    try {
      setLoadingMessages(true)
      const data = await ChatService.getMessages(convId, 1, 100)
      setMessages(data.items)
      setTimeout(scrollToBottom, 80)
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err)
      toast.error('Erro ao carregar histórico.')
    } finally {
      setLoadingMessages(false)
    }
  }

  const selectConversation = async (conv: ConversationWithMeta) => {
    setActiveConversation(conv)
    setMobileShowChat(true)
    await loadMessages(conv.id)
    if (user) {
      await ChatService.markConversationAsRead(conv.id, user.id)
      // Zera contador local
      setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)))
    }
  }

  // Carrega status atual do usuário logado
  useEffect(() => {
    if (user) {
      const st = (user.status as any) || 'online'
      setMyStatus(st)
      setMyPauseReason(user.pause_reason || '')
    }
  }, [user])

  // Heartbeat automático a cada 60 segundos enquanto a tela de chat estiver ativa
  useEffect(() => {
    if (!user) return
    // Dispara heartbeat inicial
    ChatService.sendHeartbeat()

    const interval = setInterval(() => {
      ChatService.sendHeartbeat()
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  // Troca de status
  const handleSelectStatus = async (newStatus: 'online' | 'offline' | 'em_pausa') => {
    if (newStatus === 'em_pausa') {
      setPauseModalOpen(true)
      return
    }

    try {
      setUpdatingStatus(true)
      await ChatService.updateUserStatus(newStatus)
      setMyStatus(newStatus)
      setMyPauseReason('')
      toast.success(
        `Seu status foi alterado para ${newStatus === 'online' ? 'Online' : 'Offline'}.`,
      )
      loadData(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao alterar status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Confirmar pausa com validação de motivo obrigatório
  const handleConfirmPause = async (e: React.FormEvent) => {
    e.preventDefault()
    let motivoFinal = selectedPauseOption
    if (selectedPauseOption === 'Outro') {
      if (!customPauseText.trim()) {
        toast.error('Ao escolher "Outro", informe a justificativa da pausa.')
        return
      }
      motivoFinal = customPauseText.trim() as any
    }

    try {
      setUpdatingStatus(true)
      await ChatService.updateUserStatus('em_pausa', motivoFinal)
      setMyStatus('em_pausa')
      setMyPauseReason(motivoFinal)
      setPauseModalOpen(false)
      setCustomPauseText('')
      toast.success(`Status alterado para Em pausa: ${motivoFinal}`)
      loadData(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Falha ao colocar em pausa.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [user])

  // Realtime subscriptions para novas mensagens e atualizações de conversas
  useEffect(() => {
    let unsubMsgs: (() => void) | undefined
    let unsubConvs: (() => void) | undefined

    pb.collection('chat_mensagens')
      .subscribe('*', (e) => {
        if (e.action === 'create') {
          const newMsg = e.record as unknown as ChatMensagemRecord
          // Se a mensagem pertence à conversa ativa, carrega ela
          if (activeConversation && newMsg.conversa === activeConversation.id) {
            // Busca a mensagem com expand para ter os dados do remetente
            pb.collection('chat_mensagens')
              .getOne<ChatMensagemRecord>(newMsg.id, { expand: 'remetente' })
              .then((fullMsg) => {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === fullMsg.id)) return prev
                  return [...prev, fullMsg]
                })
                setTimeout(scrollToBottom, 60)
              })
              .catch(() => {
                setMessages((prev) => [...prev, newMsg])
                setTimeout(scrollToBottom, 60)
              })

            // Marca lida se for recebida de outro
            if (user && newMsg.remetente !== user.id) {
              ChatService.markConversationAsRead(activeConversation.id, user.id)
            }
          } else {
            // Notificação leve se for de outra conversa
            if (user && newMsg.remetente !== user.id) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === newMsg.conversa
                    ? {
                        ...c,
                        unreadCount: c.unreadCount + 1,
                        ultima_mensagem: newMsg.texto,
                        ultimo_envio: newMsg.created,
                      }
                    : c,
                ),
              )
            }
          }
        }
      })
      .then((unsub) => {
        unsubMsgs = unsub
      })
      .catch(() => {})

    pb.collection('chat_conversas')
      .subscribe('*', () => {
        loadData(true)
      })
      .then((unsub) => {
        unsubConvs = unsub
      })
      .catch(() => {})

    return () => {
      if (unsubMsgs) unsubMsgs()
      if (unsubConvs) unsubConvs()
    }
  }, [activeConversation, user])

  // Iniciar conversa privada com verificação anti-duplicidade
  const handleStartPrivateChat = async (targetUser: ChatUserItem) => {
    try {
      setCreatingChat(true)
      const res = await ChatService.startPrivateChat(targetUser.id)
      setNewPrivateModalOpen(false)
      if (res.createdNew) {
        toast.success(`Conversa privada com ${targetUser.name} iniciada!`)
      } else {
        toast.info(`Histórico existente com ${targetUser.name} aberto.`)
      }
      await loadData(false)
      // Selecionar essa conversa
      const updatedList = await ChatService.getMyConversations(user!.id)
      const targetConv = updatedList.conversas.find((c) => c.id === res.conversa.id)
      if (targetConv) {
        const withMeta: ConversationWithMeta = {
          ...targetConv,
          displayName: targetUser.name,
          displayAvatar: targetUser.avatar,
          displayRole: targetUser.role,
          targetUser,
          unreadCount: 0,
        }
        selectConversation(withMeta)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao iniciar conversa privada.')
    } finally {
      setCreatingChat(false)
    }
  }

  // Criar grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) {
      toast.error('Informe o nome do grupo.')
      return
    }
    if (selectedGroupUserIds.length === 0) {
      toast.error('Selecione pelo menos um participante para o grupo.')
      return
    }

    try {
      setCreatingChat(true)
      const newGroup = await ChatService.createGroupChat(
        groupName.trim(),
        groupDescription.trim(),
        selectedGroupUserIds,
      )
      toast.success(`Grupo "${groupName}" criado com sucesso!`)
      setNewGroupModalOpen(false)
      setGroupName('')
      setGroupDescription('')
      setSelectedGroupUserIds([])
      await loadData(false)
      setActiveTab('grupo')
      const withMeta: ConversationWithMeta = {
        ...newGroup,
        displayName: newGroup.nome || 'Grupo',
        unreadCount: 0,
      }
      selectConversation(withMeta)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao criar grupo.')
    } finally {
      setCreatingChat(false)
    }
  }

  const handleInsertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      setInputMessage((prev) => prev + emoji)
      return
    }

    const start = el.selectionStart ?? inputMessage.length
    const end = el.selectionEnd ?? inputMessage.length
    const before = inputMessage.substring(0, start)
    const after = inputMessage.substring(end)
    const nextVal = `${before}${emoji}${after}`
    setInputMessage(nextVal)

    setTimeout(() => {
      el.focus()
      const newPos = start + emoji.length
      el.setSelectionRange(newPos, newPos)
    }, 10)
  }

  const handleSendSticker = async (stickerId: string) => {
    setPickerOpen(false)
    if (!activeConversation || !user || sending) return
    const stickerText = `${STICKER_PREFIX}${stickerId}`

    try {
      setSending(true)
      const created = await ChatService.sendMessage(activeConversation.id, user.id, stickerText)
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev
        return [...prev, created]
      })
      setTimeout(scrollToBottom, 60)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar figurinha.')
    } finally {
      setSending(false)
    }
  }

  // Enviar mensagem
  const handleSendMessage = async (textCustom?: string) => {
    const textToSend = (textCustom || inputMessage).trim()
    if (!textToSend || !activeConversation || !user || sending) return
    if (!textCustom) setInputMessage('')
    setSending(true)

    try {
      const created = await ChatService.sendMessage(activeConversation.id, user.id, textToSend)
      // Atualizar lista local caso realtime demore alguns ms
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev
        return [...prev, created]
      })
      setTimeout(scrollToBottom, 60)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar mensagem.')
      if (!textCustom) setInputMessage(textToSend)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Filtra conversas conforme aba ativa
  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'geral') return c.tipo === 'geral'
    if (activeTab === 'privado') return c.tipo === 'privado'
    if (activeTab === 'grupo') return c.tipo === 'grupo'
    return true
  })

  // Contadores para as abas
  const unreadPrivado = conversations
    .filter((c) => c.tipo === 'privado')
    .reduce((acc, c) => acc + c.unreadCount, 0)
  const unreadGeral = conversations
    .filter((c) => c.tipo === 'geral')
    .reduce((acc, c) => acc + c.unreadCount, 0)
  const unreadGrupos = conversations
    .filter((c) => c.tipo === 'grupo')
    .reduce((acc, c) => acc + c.unreadCount, 0)

  // Filtro de usuários no modal de nova conversa
  const eligiblePrivateUsers = allUsers.filter((u) => {
    if (u.id === user?.id) return false
    if (!userSearchTerm.trim()) return true
    const term = userSearchTerm.toLowerCase()
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
  })

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] max-h-[850px] bg-white rounded-3xl border border-vinho/15 shadow-xl overflow-hidden font-sans">
      {/* TOPO DO CHAT COM ABAS E BOTÕES */}
      <div className="bg-gradient-to-r from-vinho via-vinho-dark to-[#34112c] px-4 py-3 sm:px-6 text-white flex flex-wrap items-center justify-between gap-3 border-b border-dourado/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-dourado/20 border border-dourado/50 flex items-center justify-center text-dourado shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-lg sm:text-xl text-white tracking-wide">
                Chat CoffeeCast
              </h1>
              <Badge className="bg-dourado text-vinho font-black text-[10px] px-2 py-0.5 rounded-full">
                4.0
              </Badge>
            </div>
            <p className="text-[11px] text-marfim/75 hidden sm:block">
              Conversas privadas, gerais e grupos integrados com todos os membros
            </p>
          </div>
        </div>

        {/* SELETOR DE STATUS DO USUÁRIO & BOTÕES DE AÇÃO */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* SELETOR DE STATUS DO PRÓPRIO USUÁRIO */}
          <div className="flex items-center bg-white/10 backdrop-blur-md border border-dourado/40 rounded-2xl px-2.5 py-1 text-xs text-white">
            <span className="text-[10px] text-marfim/80 hidden lg:inline mr-2 font-medium">
              Meu Status:
            </span>
            <div className="flex items-center gap-1.5">
              <UserStatusIndicator status={myStatus} pauseReason={myPauseReason} size="md" />
              <Select
                value={myStatus}
                onValueChange={(val: any) => handleSelectStatus(val)}
                disabled={updatingStatus}
              >
                <SelectTrigger className="h-7 text-xs bg-transparent border-0 text-white font-bold hover:bg-white/10 rounded-lg p-1 px-2 focus:ring-0 gap-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-vinho/20 text-vinho text-xs font-semibold">
                  <SelectItem value="online">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </SelectItem>
                  <SelectItem value="em_pausa">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Em pausa (exige motivo)
                    </span>
                  </SelectItem>
                  <SelectItem value="offline">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Offline
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {myStatus === 'em_pausa' && myPauseReason && (
              <span
                onClick={() => setPauseModalOpen(true)}
                className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-300/40 rounded-lg px-2 py-0.5 ml-1.5 truncate max-w-[120px] cursor-pointer hover:bg-amber-400/30"
                title={`Pausa: ${myPauseReason} (clique para alterar)`}
              >
                {myPauseReason}
              </span>
            )}
          </div>

          {activeTab === 'privado' && (
            <Button
              size="sm"
              onClick={() => {
                setUserSearchTerm('')
                setNewPrivateModalOpen(true)
              }}
              className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Conversa</span>
            </Button>
          )}

          {activeTab === 'grupo' && (
            <Button
              size="sm"
              onClick={() => {
                setGroupName('')
                setGroupDescription('')
                setSelectedGroupUserIds([])
                setNewGroupModalOpen(true)
              }}
              className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Grupo</span>
            </Button>
          )}

          {isMaster && (
            <Link to="/admin/chat/gestao">
              <Button
                variant="outline"
                size="sm"
                className="border-dourado/60 text-dourado-light hover:bg-white/10 bg-transparent text-xs rounded-xl px-3 hidden sm:inline-flex items-center gap-1.5"
                title="Acessar Gestão de Conversas exclusiva Master"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-dourado" />
                <span>Gestão Master</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ÁREA PRINCIPAL: LISTA À ESQUERDA + HISTÓRICO À DIREITA */}
      <div className="flex-1 flex min-h-0 relative">
        {/* COLUNA ESQUERDA: LISTA DE CONVERSAS (Estilo mensageiro moderno) */}
        <aside
          className={`${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 flex-col border-r border-vinho/10 bg-[#FAF8F5] shrink-0`}
        >
          {/* SELETOR DE ABAS: PRIVADAS | GERAL | GRUPOS */}
          <div className="p-3 border-b border-vinho/10 bg-white/70">
            <div className="grid grid-cols-3 gap-1 bg-vinho/5 p-1 rounded-2xl border border-vinho/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('privado')
                  const firstPriv = conversations.find((c) => c.tipo === 'privado')
                  if (firstPriv) selectConversation(firstPriv)
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                  activeTab === 'privado'
                    ? 'bg-vinho text-white shadow-xs'
                    : 'text-vinho/70 hover:text-vinho hover:bg-white/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Privadas</span>
                {unreadPrivado > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('geral')
                  const geral = conversations.find((c) => c.tipo === 'geral')
                  if (geral) selectConversation(geral)
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                  activeTab === 'geral'
                    ? 'bg-vinho text-white shadow-xs'
                    : 'text-vinho/70 hover:text-vinho hover:bg-white/50'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Geral</span>
                {unreadGeral > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('grupo')
                  const firstGroup = conversations.find((c) => c.tipo === 'grupo')
                  if (firstGroup) selectConversation(firstGroup)
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                  activeTab === 'grupo'
                    ? 'bg-vinho text-white shadow-xs'
                    : 'text-vinho/70 hover:text-vinho hover:bg-white/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Grupos</span>
                {unreadGrupos > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>

          {/* LISTA ROLÁVEL DE CONVERSAS */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-vinho/60 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-dourado-dark" />
                <span>Carregando conversas...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-vinho/10 my-4 text-xs text-vinho/70 space-y-3">
                <div className="w-10 h-10 rounded-full bg-vinho/5 text-vinho mx-auto flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-dourado-dark" />
                </div>
                <p className="font-semibold">
                  {activeTab === 'privado'
                    ? 'Nenhuma conversa privada iniciada ainda.'
                    : activeTab === 'grupo'
                      ? 'Nenhum grupo de conversa cadastrado.'
                      : 'Carregando chat geral...'}
                </p>
                {activeTab === 'privado' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setUserSearchTerm('')
                      setNewPrivateModalOpen(true)
                    }}
                    className="bg-vinho text-white text-xs rounded-xl px-3"
                  >
                    Iniciar Primeira Conversa
                  </Button>
                )}
                {activeTab === 'grupo' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setGroupName('')
                      setGroupDescription('')
                      setSelectedGroupUserIds([])
                      setNewGroupModalOpen(true)
                    }}
                    className="bg-vinho text-white text-xs rounded-xl px-3"
                  >
                    Criar Primeiro Grupo
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-vinho text-white border-vinho shadow-md'
                        : 'bg-white hover:bg-marfim border-vinho/5 text-vinho shadow-2xs'
                    }`}
                  >
                    {/* Avatar da conversa ou usuário */}
                    <div className="relative shrink-0">
                      {conv.tipo === 'geral' ? (
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                            isSelected
                              ? 'bg-dourado text-vinho border-white'
                              : 'bg-vinho text-dourado border-dourado/60'
                          }`}
                        >
                          <Globe2 className="w-6 h-6" />
                        </div>
                      ) : conv.tipo === 'grupo' ? (
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                            isSelected
                              ? 'bg-dourado text-vinho border-white'
                              : 'bg-[#4A154B] text-dourado border-dourado/60'
                          }`}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                      ) : (
                        <UserChatAvatar
                          name={conv.displayName}
                          avatar={conv.displayAvatar}
                          userRecord={conv.targetUser}
                          size="md"
                        />
                      )}

                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}

                      {/* Indicador de status no avatar da conversa privada */}
                      {conv.tipo === 'privado' && conv.targetUser && (
                        <span className="absolute bottom-0 right-0">
                          <UserStatusIndicator
                            status={conv.targetUser.status}
                            pauseReason={conv.targetUser.pause_reason}
                            size="sm"
                          />
                        </span>
                      )}
                    </div>

                    {/* Informações da conversa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-vinho'
                          }`}
                        >
                          {conv.displayName}
                        </span>
                        {conv.ultimo_envio && (
                          <span
                            className={`text-[10px] shrink-0 font-medium ${
                              isSelected ? 'text-dourado-light' : 'text-vinho/50'
                            }`}
                          >
                            {new Date(conv.ultimo_envio).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        {conv.tipo === 'privado' && conv.displayRole && (
                          <UserRoleBadge role={conv.displayRole} size="sm" />
                        )}
                        {conv.tipo === 'privado' && conv.targetUser?.status === 'em_pausa' && (
                          <span
                            className={`text-[9px] px-1 rounded truncate max-w-[90px] font-medium ${
                              isSelected
                                ? 'bg-amber-400 text-vinho font-bold'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Pausa
                          </span>
                        )}
                        {conv.tipo === 'grupo' && (
                          <Badge
                            className={`text-[9px] px-1.5 py-0 rounded ${
                              isSelected
                                ? 'bg-dourado text-vinho font-bold'
                                : 'bg-vinho/10 text-vinho'
                            }`}
                          >
                            Grupo
                          </Badge>
                        )}
                        {conv.tipo === 'geral' && (
                          <Badge
                            className={`text-[9px] px-1.5 py-0 rounded ${
                              isSelected
                                ? 'bg-dourado text-vinho font-bold'
                                : 'bg-vinho/10 text-vinho'
                            }`}
                          >
                            Oficial
                          </Badge>
                        )}

                        <p
                          className={`text-[11px] truncate flex-1 ${
                            isSelected ? 'text-marfim/80' : 'text-vinho/60'
                          }`}
                        >
                          {conv.ultima_mensagem
                            ? getStickerPreviewLabel(conv.ultima_mensagem)
                            : 'Inicie a conversa...'}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* COLUNA DIREITA: HISTÓRICO E ENVIO DE MENSAGENS */}
        <section
          className={`${
            mobileShowChat ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-[#FDFBF7] h-full min-w-0`}
        >
          {activeConversation ? (
            <>
              {/* CABEÇALHO DA CONVERSA ATIVA */}
              <div className="px-4 py-3 bg-white border-b border-vinho/10 flex items-center justify-between gap-3 shadow-2xs shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-2 -ml-2 rounded-xl text-vinho hover:bg-vinho/5 active:scale-95"
                    aria-label="Voltar para a lista de conversas"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    {activeConversation.tipo === 'geral' ? (
                      <div className="w-10 h-10 rounded-full bg-vinho text-dourado flex items-center justify-center border-2 border-dourado">
                        <Globe2 className="w-5 h-5" />
                      </div>
                    ) : activeConversation.tipo === 'grupo' ? (
                      <div className="w-10 h-10 rounded-full bg-[#4A154B] text-dourado flex items-center justify-center border-2 border-dourado">
                        <Users className="w-5 h-5" />
                      </div>
                    ) : (
                      <UserChatAvatar
                        name={activeConversation.displayName}
                        avatar={activeConversation.displayAvatar}
                        userRecord={activeConversation.targetUser}
                        size="md"
                      />
                    )}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-serif font-bold text-sm sm:text-base text-vinho truncate">
                        {activeConversation.displayName}
                      </h2>
                      {activeConversation.tipo === 'privado' && activeConversation.displayRole && (
                        <UserRoleBadge role={activeConversation.displayRole} size="sm" />
                      )}
                      {activeConversation.tipo === 'privado' && activeConversation.targetUser && (
                        <UserStatusIndicator
                          status={activeConversation.targetUser.status}
                          pauseReason={activeConversation.targetUser.pause_reason}
                          showText
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-vinho/60 truncate">
                      {activeConversation.tipo === 'geral'
                        ? 'Todos os usuários cadastrados e ativos no CoffeeCast 4.0'
                        : activeConversation.tipo === 'grupo'
                          ? activeConversation.descricao || 'Grupo fechado de membros'
                          : activeConversation.targetUser?.pause_reason
                            ? `${activeConversation.displayName} / ${activeConversation.displayRole || 'Membro'} / Em pausa — ${activeConversation.targetUser.pause_reason}`
                            : activeConversation.targetUser?.bio ||
                              activeConversation.targetUser?.email ||
                              'Conversa privada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMessages(activeConversation.id)}
                    className="text-xs text-vinho hover:bg-vinho/5 p-2 h-9 w-9 rounded-xl"
                    title="Recarregar histórico"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* ÁREA DE ROLAGEM DE MENSAGENS */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="py-20 text-center text-xs text-vinho/60 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-dourado-dark" />
                    <span>Carregando mensagens do histórico...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center text-xs text-vinho/60 space-y-2">
                    <Sparkles className="w-8 h-8 text-dourado-dark mx-auto" />
                    <p className="font-semibold text-sm text-vinho">Nenhuma mensagem ainda</p>
                    <p>Envie a primeira mensagem para iniciar este diálogo!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = user && msg.remetente === user.id
                    const remetenteInfo = msg.expand?.remetente
                    const remetenteName =
                      remetenteInfo?.name ||
                      (isMine ? user?.name : 'Membro CoffeeCast') ||
                      'Usuário'
                    const remetenteRole = remetenteInfo?.role || (isMine ? role : 'prata')
                    const remetenteAvatar = remetenteInfo?.avatar || (isMine ? user?.avatar : '')

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex items-end gap-2.5 ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* Avatar do remetente (apenas se não for o próprio usuário) */}
                        {!isMine && (
                          <UserChatAvatar
                            name={remetenteName}
                            avatar={remetenteAvatar}
                            userRecord={remetenteInfo}
                            size="sm"
                          />
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-sm space-y-1.5 ${
                            isStickerMessage(msg.texto)
                              ? isMine
                                ? 'bg-transparent shadow-none p-1'
                                : 'bg-transparent shadow-none p-1'
                              : isMine
                                ? 'bg-vinho text-white rounded-br-xs'
                                : 'bg-white text-vinho border border-vinho/10 rounded-bl-xs'
                          }`}
                        >
                          {/* Cabeçalho do balão: nome e selo (apenas se não for sticker) */}
                          {!isStickerMessage(msg.texto) && (
                            <div className="flex items-center justify-between gap-2 border-b pb-1 border-current/15">
                              <span
                                className={`text-[11px] font-bold truncate ${
                                  isMine ? 'text-dourado-light' : 'text-vinho'
                                }`}
                              >
                                {isMine ? 'Você' : remetenteName}
                              </span>
                              <UserRoleBadge role={remetenteRole} size="sm" />
                            </div>
                          )}

                          {/* Conteúdo da mensagem: texto normal ou Figurinha grande */}
                          {isStickerMessage(msg.texto) ? (
                            <div className="flex flex-col items-center">
                              {!isMine && (
                                <span className="text-[10px] font-bold text-vinho/70 mb-1 self-start">
                                  {remetenteName}:
                                </span>
                              )}
                              <ChatStickerMessage content={msg.texto} size={108} />
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {msg.texto}
                            </p>
                          )}

                          {/* Horário */}
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] ${
                              isStickerMessage(msg.texto)
                                ? 'text-vinho/60 pr-1'
                                : isMine
                                  ? 'text-white/60'
                                  : 'text-vinho/50'
                            }`}
                          >
                            <span>
                              {new Date(msg.created).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMine && <CheckCheck className="w-3 h-3 text-dourado" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* CAMPO DE DIGITAÇÃO E ENVIO */}
              <div className="p-3 sm:p-4 bg-white border-t border-vinho/10 shrink-0 relative">
                <div className="relative max-w-5xl mx-auto">
                  {/* Popover de Emojis e Figurinhas */}
                  <EmojiStickerPicker
                    isOpen={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    onSelectEmoji={handleInsertEmoji}
                    onSelectSticker={handleSendSticker}
                    align="left"
                  />

                  <div className="flex items-end gap-2">
                    {/* Botão de Emojis e Figurinhas à esquerda do campo (estilo WhatsApp) */}
                    <button
                      type="button"
                      onClick={() => setPickerOpen((prev) => !prev)}
                      aria-label={pickerOpen ? 'Fechar emojis' : 'Abrir emojis e figurinhas'}
                      title="Emojis e Figurinhas"
                      className={`min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center shrink-0 border transition-all active:scale-95 ${
                        pickerOpen
                          ? 'bg-vinho text-dourado border-dourado shadow-xs'
                          : 'bg-marfim/70 text-vinho/70 hover:text-vinho hover:bg-marfim border-vinho/15 hover:border-dourado'
                      }`}
                    >
                      <Smile className="w-5 h-5 text-dourado-dark" />
                    </button>

                    <div className="flex-1 relative bg-marfim/70 border border-vinho/15 rounded-2xl focus-within:border-dourado focus-within:ring-1 focus-within:ring-dourado transition-all">
                      <Textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem... (Enter envia, Shift+Enter quebra linha)"
                        rows={1}
                        className="w-full bg-transparent border-0 focus-visible:ring-0 resize-none p-3 text-xs sm:text-sm max-h-32 text-vinho placeholder:text-vinho/45"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || sending}
                      className="min-h-[44px] min-w-[44px] bg-vinho hover:bg-vinho-light text-white rounded-2xl px-4 flex items-center justify-center active:scale-95 transition-all shadow-md shrink-0"
                      title="Enviar mensagem"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-dourado" />
                      ) : (
                        <Send className="w-4 h-4 text-dourado" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-vinho/50 mt-1.5 px-1 max-w-5xl mx-auto">
                  <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
                  <span>Mensagens criptografadas e salvas no sistema</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-vinho/60 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-vinho/10 border border-vinho/20 flex items-center justify-center text-vinho">
                <MessageSquare className="w-8 h-8 text-dourado-dark" />
              </div>
              <h3 className="font-serif font-bold text-lg text-vinho">
                Selecione uma conversa para começar
              </h3>
              <p className="text-xs max-w-md text-vinho/70">
                Escolha uma conversa na lista à esquerda ou inicie um novo bate-papo privado com
                qualquer usuário cadastrado.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* MODAL: NOVA CONVERSA PRIVADA COM ANTI-DUPLICIDADE */}
      <Dialog open={newPrivateModalOpen} onOpenChange={setNewPrivateModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#FAF8F5] border-2 border-dourado/40 rounded-3xl p-6">
          <DialogHeader className="border-b border-vinho/10 pb-3">
            <DialogTitle className="font-serif font-bold text-lg text-vinho flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-dourado-dark" />
              Iniciar Conversa Privada
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-vinho/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Buscar usuário por nome ou e-mail..."
                className="pl-9 bg-white border-vinho/20 text-xs sm:text-sm rounded-xl focus-visible:ring-dourado"
              />
            </div>

            <p className="text-[11px] text-vinho/70">
              Selecione o usuário para abrir o chat. Se já houver conversa anterior, o histórico
              completo será mantido e reaberto automaticamente.
            </p>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {eligiblePrivateUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-vinho/60">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                eligiblePrivateUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={creatingChat}
                    onClick={() => handleStartPrivateChat(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-vinho/5 border border-vinho/10 flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserChatAvatar name={u.name} avatar={u.avatar} userRecord={u} size="sm" />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-vinho truncate group-hover:text-dourado-dark">
                            {u.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-vinho/50 truncate font-mono">{u.email}</p>
                        <div className="mt-0.5">
                          <UserStatusIndicator
                            status={u.status}
                            pauseReason={u.pause_reason}
                            showText
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <UserRoleBadge role={u.role} size="sm" />
                      <Button
                        size="sm"
                        className="h-8 px-2.5 text-[11px] bg-vinho hover:bg-vinho-light text-white rounded-lg shadow-2xs font-semibold"
                      >
                        Conversar
                      </Button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: MOTIVO OBRIGATÓRIO DE PAUSA */}
      <Dialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#FAF8F5] border-2 border-dourado/40 rounded-3xl p-6">
          <DialogHeader className="border-b border-vinho/10 pb-3">
            <DialogTitle className="font-serif font-bold text-lg text-vinho flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" />
              Entrar em Pausa no Chat
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConfirmPause} className="space-y-4 pt-2">
            <p className="text-xs text-vinho/75">
              Ao escolher o status <strong>Em pausa</strong>, é obrigatório informar o motivo para
              que os outros membros e a coordenação saibam sua disponibilidade temporária.
            </p>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-vinho">Selecione o Motivo da Pausa *</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['Almoço', 'Reunião', 'Atendimento', 'Intervalo', 'Outro'] as const).map(
                  (opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedPauseOption(opt)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-left transition-all ${
                        selectedPauseOption === opt
                          ? 'bg-vinho text-white border-vinho shadow-xs'
                          : 'bg-white hover:bg-marfim border-vinho/15 text-vinho'
                      }`}
                    >
                      {opt}
                    </button>
                  ),
                )}
              </div>
            </div>

            {selectedPauseOption === 'Outro' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-vinho">Especifique o Motivo *</Label>
                <Input
                  required
                  value={customPauseText}
                  onChange={(e) => setCustomPauseText(e.target.value)}
                  placeholder="Ex.: Treinamento interno, gravação de áudio..."
                  className="bg-white border-vinho/20 text-xs sm:text-sm rounded-xl focus-visible:ring-dourado"
                />
              </div>
            )}

            <DialogFooter className="pt-2 border-t border-vinho/10 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPauseModalOpen(false)}
                className="text-xs border-vinho/20 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updatingStatus}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl px-4"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Registrando...
                  </>
                ) : (
                  'Confirmar Pausa'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR NOVO GRUPO */}
      <Dialog open={newGroupModalOpen} onOpenChange={setNewGroupModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#FAF8F5] border-2 border-dourado/40 rounded-3xl p-6">
          <DialogHeader className="border-b border-vinho/10 pb-3">
            <DialogTitle className="font-serif font-bold text-lg text-vinho flex items-center gap-2">
              <Users className="w-5 h-5 text-dourado-dark" />
              Criar Novo Grupo de Conversa
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateGroup} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-vinho">Nome do Grupo *</Label>
              <Input
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex.: Produção Episódio #15, Estratégia VIP, etc."
                className="bg-white border-vinho/20 text-xs sm:text-sm rounded-xl focus-visible:ring-dourado"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-vinho">Descrição (Opcional)</Label>
              <Input
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Objetivo ou tópico do grupo..."
                className="bg-white border-vinho/20 text-xs sm:text-sm rounded-xl focus-visible:ring-dourado"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-vinho">
                  Selecionar Integrantes ({selectedGroupUserIds.length} selecionados) *
                </Label>
                <span className="text-[10px] text-vinho/60">Somente integrantes verão o chat</span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-vinho/15">
                {allUsers
                  .filter((u) => u.id !== user?.id)
                  .map((u) => {
                    const isSelected = selectedGroupUserIds.includes(u.id)
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedGroupUserIds((prev) =>
                            isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id],
                          )
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${
                          isSelected
                            ? 'bg-vinho/10 border-dourado'
                            : 'bg-transparent border-transparent hover:bg-vinho/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-vinho border-vinho text-white' : 'border-vinho/40'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-dourado" />}
                          </div>
                          <UserChatAvatar
                            name={u.name}
                            avatar={u.avatar}
                            userRecord={u as any}
                            size="sm"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-vinho truncate block">
                                {u.name}
                              </span>
                              <UserStatusIndicator
                                status={u.status}
                                pauseReason={u.pause_reason}
                                size="sm"
                              />
                            </div>
                            <span className="text-[10px] text-vinho/50 truncate block">
                              {u.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {u.status === 'em_pausa' && u.pause_reason && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-medium truncate max-w-[100px]">
                              {u.pause_reason}
                            </span>
                          )}
                          <UserRoleBadge role={u.role} size="sm" />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-vinho/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewGroupModalOpen(false)}
                className="text-xs border-vinho/20 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creatingChat || !groupName.trim() || selectedGroupUserIds.length === 0}
                className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold rounded-xl px-4"
              >
                {creatingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-dourado mr-1.5" />
                    Criando Grupo...
                  </>
                ) : (
                  'Criar Grupo'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
