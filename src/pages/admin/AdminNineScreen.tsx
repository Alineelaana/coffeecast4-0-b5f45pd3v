import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Sparkles,
  Bot,
  User,
  Send,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Headphones,
  Play,
  Pause,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Filter,
  Check,
  X,
  FileQuestion,
  Building2,
  Compass,
  Sliders,
  Database,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'
import { NineAvatar } from '@/components/NineAvatar'
import { useAuth } from '@/context/AuthContext'
import {
  NineConfigRecord,
  NineConversaRecord,
  NineMensagemRecord,
  NineModoAtendimento,
  NineConhecimentoRecord,
  NineConhecimentoTipo,
} from '@/types/database'
import { toast } from 'sonner'
import { formatDateBR } from '@/lib/formatters'
import { ChatStickerMessage } from '@/components/chat/ChatStickerMessage'
import { isStickerMessage, getStickerPreviewLabel } from '@/components/chat/stickers'

export default function AdminNineScreen() {
  const { user } = useAuth()

  // Tab atual: 'conversas' | 'conhecimento' | 'treinamento'
  const [activeTab, setActiveTab] = useState<'conversas' | 'conhecimento' | 'treinamento'>(
    'conversas',
  )

  // ==========================================
  // ESTADO: CONFIGURAÇÃO / TREINAMENTO (PROMPT)
  // ==========================================
  const [configId, setConfigId] = useState<string>('')
  const [atendimentoAutomatico, setAtendimentoAutomatico] = useState<boolean>(true)
  const [promptSistema, setPromptSistema] = useState<string>('')
  const [promptLivre, setPromptLivre] = useState<string>('')
  const [observacoes, setObservacoes] = useState<string>('')
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true)
  const [savingConfig, setSavingConfig] = useState<boolean>(false)
  const [savingPromptLivre, setSavingPromptLivre] = useState<boolean>(false)

  // ==========================================
  // ESTADO: CONVERSAS & ATENDIMENTO
  // ==========================================
  const [conversas, setConversas] = useState<NineConversaRecord[]>([])
  const [loadingConversas, setLoadingConversas] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filtroModo, setFiltroModo] = useState<string>('todos')

  // Conversa Selecionada
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<NineMensagemRecord[]>([])
  const [loadingMensagens, setLoadingMensagens] = useState<boolean>(false)
  const [humanReplyInput, setHumanReplyInput] = useState<string>('')
  const [sendingReply, setSendingReply] = useState<boolean>(false)
  const [togglingMode, setTogglingMode] = useState<boolean>(false)

  // ==========================================
  // ESTADO: BASE DE CONHECIMENTO DA NINE (CRUD)
  // ==========================================
  const [conhecimentos, setConhecimentos] = useState<NineConhecimentoRecord[]>([])
  const [loadingConhecimentos, setLoadingConhecimentos] = useState<boolean>(true)
  const [searchConhecimento, setSearchConhecimento] = useState<string>('')
  const [filtroTipoConhecimento, setFiltroTipoConhecimento] = useState<string>('todos')
  const [filtroCategoriaConhecimento, setFiltroCategoriaConhecimento] = useState<string>('todas')

  // Modal de Criação / Edição de Conhecimento
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [savingConhecimento, setSavingConhecimento] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<NineConhecimentoRecord | null>(null)
  const [formTipo, setFormTipo] = useState<NineConhecimentoTipo>('faq')
  const [formTitulo, setFormTitulo] = useState<string>('')
  const [formConteudo, setFormConteudo] = useState<string>('')
  const [formCategoria, setFormCategoria] = useState<string>('')
  const [formAtivo, setFormAtivo] = useState<boolean>(true)
  const [formOrdem, setFormOrdem] = useState<number>(0)

  // Modal de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [itemToDelete, setItemToDelete] = useState<NineConhecimentoRecord | null>(null)
  const [deletingConhecimento, setDeletingConhecimento] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Carregar Configuração da Nine (Prompt e Chave de Atendimento)
  const fetchConfig = async () => {
    setLoadingConfig(true)
    try {
      const records = await pb.collection('nine_config').getFullList<NineConfigRecord>({
        filter: 'chave = "global"',
      })

      if (records.length > 0) {
        const cfg = records[0]
        setConfigId(cfg.id)
        setAtendimentoAutomatico(cfg.atendimento_automatico ?? true)
        setPromptSistema(cfg.prompt_sistema || '')
        setPromptLivre(cfg.prompt_livre || '')
        setObservacoes(cfg.observacoes || '')
      }
    } catch (err) {
      console.error('Erro ao buscar configuração da Nine:', err)
      toast.error('Não foi possível carregar o treinamento da Nine.')
    } finally {
      setLoadingConfig(false)
    }
  }

  // Salvar Configuração / Prompt de Personalidade via Endpoint Dedicado ou Fallback direto
  const handleSaveConfig = async () => {
    if (!promptSistema.trim()) {
      toast.error('O prompt de personalidade e regras da Nine não pode ficar vazio.')
      return
    }

    setSavingConfig(true)
    const promptTrimmed = promptSistema.trim()
    const obsTrimmed = observacoes.trim()

    // Helper para extrair mensagem amigável e detalhada de erro do PocketBase ou API
    const parseDetailedError = (errorObj: any): string => {
      if (!errorObj) return 'Falha ao salvar o prompt de treinamento da Nine.'
      // Se tiver data.data ou response.data (validações por campo do PocketBase)
      const errData = errorObj.data?.data || errorObj.response?.data || errorObj.data || {}
      if (typeof errData === 'object' && Object.keys(errData).length > 0) {
        const fieldMsgs: string[] = []
        for (const [field, fieldErr] of Object.entries(errData)) {
          const msg =
            typeof fieldErr === 'object' && fieldErr !== null && 'message' in (fieldErr as any)
              ? (fieldErr as any).message
              : String(fieldErr)
          const fieldNamesMap: Record<string, string> = {
            prompt_sistema: 'Prompt do sistema',
            prompt_livre: 'Prompt livre da Base de Conhecimento',
            atendimento_automatico: 'Atendimento automático',
            observacoes: 'Observações',
            chave: 'Identificador',
            base_conhecimento: 'Base de conhecimento',
          }
          const label = fieldNamesMap[field] || field
          fieldMsgs.push(`${label}: ${msg}`)
        }
        if (fieldMsgs.length > 0) {
          return fieldMsgs.join(' | ')
        }
      }
      return (
        errorObj.message ||
        errorObj.error ||
        (typeof errorObj === 'string'
          ? errorObj
          : 'Falha ao salvar o prompt de treinamento da Nine.')
      )
    }

    try {
      // 1. Caminho Oficial Principal: Endpoint administrativo dedicado (/backend/v1/nine/admin/config)
      // Preserva validação de cargo (Master/Gerencial) e sincronização com o agente nativo 'nine-chat'
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const token = pb.authStore.token

      if (!token) {
        toast.error('Sessão expirada. Faça login novamente para salvar o treinamento da Nine.')
        return
      }

      let saveError: string | null = null
      let successData: any = null

      try {
        const res = await fetch(`${baseUrl}/backend/v1/nine/admin/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          body: JSON.stringify({
            atendimento_automatico: atendimentoAutomatico,
            prompt_sistema: promptTrimmed,
            observacoes: obsTrimmed,
          }),
        })

        if (res.ok) {
          successData = await res.json().catch(() => ({}))
        } else {
          const errPayload = await res.json().catch(() => ({}))
          saveError =
            errPayload?.error ||
            errPayload?.message ||
            (res.status === 403
              ? 'Permissão negada. Apenas administradores Master e Gerencial podem salvar o treinamento.'
              : `Erro ${res.status} ao salvar no servidor.`)
        }
      } catch (fetchErr: any) {
        saveError = fetchErr?.message || 'Falha de comunicação com o servidor.'
      }

      // Se o endpoint salvou com sucesso
      if (successData) {
        if (successData.record?.id) {
          setConfigId(successData.record.id)
        }
        if (successData.record?.prompt_sistema !== undefined) {
          setPromptSistema(successData.record.prompt_sistema)
        }
        if (successData.record?.prompt_livre !== undefined) {
          setPromptLivre(successData.record.prompt_livre)
        }
        if (successData.record?.atendimento_automatico !== undefined) {
          setAtendimentoAutomatico(successData.record.atendimento_automatico)
        }
        if (successData.record?.observacoes !== undefined) {
          setObservacoes(successData.record.observacoes)
        }
        toast.success(
          successData.message ||
            'Prompt de treinamento da Nine salvo e sincronizado com o agente nativo!',
        )
        return
      }

      // 2. Se o endpoint falhou, tentar fallback no banco direto via SDK do PocketBase
      console.warn(
        'Endpoint oficial falhou (' +
          saveError +
          '), tentando gravação direta na coleção nine_config...',
      )
      const payload: Record<string, any> = {
        atendimento_automatico: atendimentoAutomatico,
        prompt_sistema: promptTrimmed,
        observacoes: obsTrimmed,
      }

      let updatedRecord: any = null
      try {
        if (configId) {
          updatedRecord = await pb.collection('nine_config').update(configId, payload)
        } else {
          const existing = await pb
            .collection('nine_config')
            .getFirstListItem('chave="global"')
            .catch(() => null)
          if (existing) {
            setConfigId(existing.id)
            updatedRecord = await pb.collection('nine_config').update(existing.id, payload)
          } else {
            updatedRecord = await pb.collection('nine_config').create({
              chave: 'global',
              ...payload,
            })
            setConfigId(updatedRecord.id)
          }
        }

        if (updatedRecord) {
          if (updatedRecord.id) setConfigId(updatedRecord.id)
          if (updatedRecord.prompt_sistema !== undefined)
            setPromptSistema(updatedRecord.prompt_sistema)
          if (updatedRecord.prompt_livre !== undefined) setPromptLivre(updatedRecord.prompt_livre)
          if (updatedRecord.atendimento_automatico !== undefined)
            setAtendimentoAutomatico(updatedRecord.atendimento_automatico)
          if (updatedRecord.observacoes !== undefined) setObservacoes(updatedRecord.observacoes)
        }

        toast.success('Prompt de treinamento da Nine salvo com sucesso no banco!')
      } catch (directDbErr: any) {
        console.error('Falha tanto no endpoint quanto na gravação direta:', directDbErr)
        const detailedMsg = parseDetailedError(directDbErr)
        const finalMsg = saveError ? `${saveError} (${detailedMsg})` : detailedMsg
        toast.error(`Falha ao salvar: ${finalMsg}`)
      }
    } catch (unexpectedErr: any) {
      console.error('Erro inesperado ao salvar treinamento da Nine:', unexpectedErr)
      const userFriendlyMessage = parseDetailedError(unexpectedErr)
      toast.error(`Falha ao salvar: ${userFriendlyMessage}`)
    } finally {
      setSavingConfig(false)
    }
  }

  // Salvar Prompt Livre da Base de Conhecimento
  const handleSavePromptLivre = async () => {
    setSavingPromptLivre(true)
    const livreTrimmed = promptLivre.trim()

    // Helper para extrair mensagem amigável e detalhada de erro do PocketBase ou API
    const parseDetailedError = (errorObj: any): string => {
      if (!errorObj) return 'Falha ao salvar o prompt livre da Base de Conhecimento.'
      const errData = errorObj.data?.data || errorObj.response?.data || errorObj.data || {}
      if (typeof errData === 'object' && Object.keys(errData).length > 0) {
        const fieldMsgs: string[] = []
        for (const [field, fieldErr] of Object.entries(errData)) {
          const msg =
            typeof fieldErr === 'object' && fieldErr !== null && 'message' in (fieldErr as any)
              ? (fieldErr as any).message
              : String(fieldErr)
          const fieldNamesMap: Record<string, string> = {
            prompt_livre: 'Prompt livre da Base de Conhecimento',
            prompt_sistema: 'Prompt do sistema',
            atendimento_automatico: 'Atendimento automático',
            observacoes: 'Observações',
          }
          const label = fieldNamesMap[field] || field
          fieldMsgs.push(`${label}: ${msg}`)
        }
        if (fieldMsgs.length > 0) return fieldMsgs.join(' | ')
      }
      return (
        errorObj.message ||
        errorObj.error ||
        (typeof errorObj === 'string'
          ? errorObj
          : 'Falha ao salvar o prompt livre da Base de Conhecimento.')
      )
    }

    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const token = pb.authStore.token

      if (!token) {
        toast.error('Sessão expirada. Faça login novamente para salvar.')
        return
      }

      let saveError: string | null = null
      let successData: any = null

      try {
        const res = await fetch(`${baseUrl}/backend/v1/nine/admin/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          body: JSON.stringify({
            prompt_livre: livreTrimmed,
          }),
        })

        if (res.ok) {
          successData = await res.json().catch(() => ({}))
        } else {
          const errPayload = await res.json().catch(() => ({}))
          saveError =
            errPayload?.error ||
            errPayload?.message ||
            (res.status === 403
              ? 'Permissão negada. Apenas administradores Master e Gerencial podem salvar.'
              : `Erro ${res.status} ao salvar no servidor.`)
        }
      } catch (fetchErr: any) {
        saveError = fetchErr?.message || 'Falha de comunicação com o servidor.'
      }

      if (successData) {
        if (successData.record?.id) setConfigId(successData.record.id)
        if (successData.record?.prompt_livre !== undefined) {
          setPromptLivre(successData.record.prompt_livre)
        }
        toast.success(
          livreTrimmed
            ? 'Prompt livre da Base de Conhecimento salvo com sucesso e ativo para a Nine!'
            : 'Prompt livre limpo com sucesso.',
        )
        return
      }

      // Fallback direto via SDK
      console.warn('Endpoint oficial falhou (' + saveError + '), tentando gravação direta...')
      let updatedRecord: any = null
      if (configId) {
        updatedRecord = await pb.collection('nine_config').update(configId, {
          prompt_livre: livreTrimmed,
        })
      } else {
        const existing = await pb
          .collection('nine_config')
          .getFirstListItem('chave="global"')
          .catch(() => null)
        if (existing) {
          setConfigId(existing.id)
          updatedRecord = await pb.collection('nine_config').update(existing.id, {
            prompt_livre: livreTrimmed,
          })
        } else {
          updatedRecord = await pb.collection('nine_config').create({
            chave: 'global',
            prompt_livre: livreTrimmed,
          })
          setConfigId(updatedRecord.id)
        }
      }

      if (updatedRecord && updatedRecord.prompt_livre !== undefined) {
        setPromptLivre(updatedRecord.prompt_livre)
      }

      toast.success(
        livreTrimmed
          ? 'Prompt livre da Base de Conhecimento salvo com sucesso no banco!'
          : 'Prompt livre limpo com sucesso.',
      )
    } catch (err: any) {
      console.error('Erro ao salvar prompt livre:', err)
      const msg = parseDetailedError(err)
      toast.error(`Falha ao salvar prompt livre: ${msg}`)
    } finally {
      setSavingPromptLivre(false)
    }
  }

  // Alternar Atendimento Automático Rápido
  const handleToggleAutoService = async (checked: boolean) => {
    setAtendimentoAutomatico(checked)
    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const token = pb.authStore.token
      let ok = false

      try {
        const res = await fetch(`${baseUrl}/backend/v1/nine/admin/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: token } : {}),
          },
          body: JSON.stringify({
            atendimento_automatico: checked,
            prompt_sistema: promptSistema.trim() || 'Nine Assistente Virtual',
            observacoes: observacoes.trim(),
          }),
        })
        if (res.ok) {
          ok = true
        }
      } catch {
        ok = false
      }

      if (!ok) {
        if (configId) {
          await pb.collection('nine_config').update(configId, {
            atendimento_automatico: checked,
          })
        } else {
          const existing = await pb
            .collection('nine_config')
            .getFirstListItem('chave="global"')
            .catch(() => null)
          if (existing) {
            setConfigId(existing.id)
            await pb.collection('nine_config').update(existing.id, {
              atendimento_automatico: checked,
            })
          }
        }
      }

      toast.success(
        checked
          ? 'Atendimento automático da Nine ATIVADO em tempo real.'
          : 'Atendimento automático da Nine DESLIGADO. As conversas agora aguardam revisão humana.',
      )
    } catch (err: any) {
      console.error('Erro ao atualizar modo de atendimento geral:', err)
      toast.error(
        'Falha ao alternar atendimento automático: ' + (err?.message || 'erro inesperado'),
      )
      setAtendimentoAutomatico(!checked)
    }
  }

  // Carregar Conversas
  const fetchConversas = async () => {
    setLoadingConversas(true)
    try {
      const records = await pb.collection('nine_conversas').getFullList<NineConversaRecord>({
        sort: '-data_ultima_mensagem,-created',
      })
      setConversas(records)

      if (selectedConversationId) {
        const stillExists = records.find((c) => c.conversation_id === selectedConversationId)
        if (!stillExists && records.length > 0) {
          setSelectedConversationId(records[0].conversation_id)
        }
      } else if (records.length > 0) {
        setSelectedConversationId(records[0].conversation_id)
      }
    } catch (err) {
      console.error('Erro ao buscar conversas da Nine:', err)
      toast.error('Não foi possível carregar a lista de conversas.')
    } finally {
      setLoadingConversas(false)
    }
  }

  // Carregar Mensagens da Conversa Selecionada
  const fetchMensagens = async (convId: string) => {
    setLoadingMensagens(true)
    try {
      const records = await pb.collection('nine_mensagens').getFullList<NineMensagemRecord>({
        filter: `conversation_id = "${convId}"`,
        sort: 'created',
      })
      setMensagens(records)
      setTimeout(scrollToBottom, 80)
    } catch (err) {
      console.error('Erro ao buscar mensagens da conversa:', err)
    } finally {
      setLoadingMensagens(false)
    }
  }

  // Carregar Itens da Base de Conhecimento
  const fetchConhecimentos = async () => {
    setLoadingConhecimentos(true)
    try {
      const records = await pb.collection('nine_conhecimento').getFullList<NineConhecimentoRecord>({
        sort: 'ordem,-created',
      })
      setConhecimentos(records)
    } catch (err) {
      console.error('Erro ao buscar base de conhecimento da Nine:', err)
      toast.error('Não foi possível carregar as entradas da base de conhecimento.')
    } finally {
      setLoadingConhecimentos(false)
    }
  }

  // Initial Load
  useEffect(() => {
    fetchConfig()
    fetchConversas()
    fetchConhecimentos()
  }, [])

  // Atualizar mensagens quando conversa selecionada mudar
  useEffect(() => {
    if (selectedConversationId) {
      fetchMensagens(selectedConversationId)
    } else {
      setMensagens([])
    }
  }, [selectedConversationId])

  // Polling para novas mensagens na conversa aberta e novas conversas
  useEffect(() => {
    const interval = setInterval(() => {
      pb.collection('nine_conversas')
        .getFullList<NineConversaRecord>({
          sort: '-data_ultima_mensagem,-created',
        })
        .then((records) => {
          setConversas(records)
        })
        .catch(() => {})

      if (selectedConversationId) {
        pb.collection('nine_mensagens')
          .getFullList<NineMensagemRecord>({
            filter: `conversation_id = "${selectedConversationId}"`,
            sort: 'created',
          })
          .then((msgs) => {
            setMensagens(msgs)
          })
          .catch(() => {})
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [selectedConversationId])

  // Conversa ativa selecionada
  const activeConversation = useMemo(() => {
    return conversas.find((c) => c.conversation_id === selectedConversationId) || null
  }, [conversas, selectedConversationId])

  // Enviar Resposta Humana
  const handleSendHumanReply = async () => {
    if (!humanReplyInput.trim() || !selectedConversationId || sendingReply) return

    setSendingReply(true)
    const textToSend = humanReplyInput.trim()

    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const res = await fetch(`${baseUrl}/backend/v1/nine/admin/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          conversation_id: selectedConversationId,
          message: textToSend,
        }),
      })

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}))
        throw new Error(errPayload.error || 'Erro ao enviar resposta')
      }

      setHumanReplyInput('')
      toast.success('Resposta humana enviada ao visitante!')
      await fetchMensagens(selectedConversationId)
      await fetchConversas()
    } catch (err: any) {
      console.error('Erro ao enviar resposta humana:', err)
      toast.error(err.message || 'Falha ao enviar resposta humana.')
    } finally {
      setSendingReply(false)
    }
  }

  // Alternar modo de atendimento da conversa atual
  const handleToggleConversationMode = async (targetMode: NineModoAtendimento) => {
    if (!selectedConversationId || togglingMode) return

    setTogglingMode(true)
    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const res = await fetch(`${baseUrl}/backend/v1/nine/admin/toggle-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          conversation_id: selectedConversationId,
          modo_atendimento: targetMode,
        }),
      })

      if (!res.ok) {
        throw new Error('Falha na resposta do servidor.')
      }

      const modoDesc =
        targetMode === 'automatico'
          ? 'Nine reassumiu o atendimento automático desta conversa.'
          : 'Modo humano ativado! A Nine NÃO responderá automaticamente nesta conversa.'

      toast.success(modoDesc)
      await fetchConversas()
    } catch (err) {
      console.error('Erro ao alternar modo de atendimento da conversa:', err)
      toast.error('Não foi possível alterar o modo desta conversa.')
    } finally {
      setTogglingMode(false)
    }
  }

  // ==========================================
  // OPERAÇÕES DO CRUD DE BASE DE CONHECIMENTO
  // ==========================================
  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormTipo('faq')
    setFormTitulo('')
    setFormConteudo('')
    setFormCategoria('Episódios')
    setFormAtivo(true)
    setFormOrdem(conhecimentos.length + 1)
    setModalOpen(true)
  }

  const handleOpenEditModal = (item: NineConhecimentoRecord) => {
    setEditingItem(item)
    setFormTipo(item.tipo || 'faq')
    setFormTitulo(item.titulo || '')
    setFormConteudo(item.conteudo || '')
    setFormCategoria(item.categoria || '')
    setFormAtivo(item.ativo !== false)
    setFormOrdem(item.ordem !== undefined && item.ordem !== null ? item.ordem : 0)
    setModalOpen(true)
  }

  const handleSaveConhecimento = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formTitulo.trim()) {
      toast.error('Informe o título ou pergunta.')
      return
    }
    if (!formConteudo.trim()) {
      toast.error('Informe o conteúdo ou resposta.')
      return
    }

    setSavingConhecimento(true)
    try {
      const payload = {
        tipo: formTipo,
        titulo: formTitulo.trim(),
        conteudo: formConteudo.trim(),
        categoria: formCategoria.trim() || undefined,
        ativo: formAtivo,
        ordem: Number(formOrdem) || 0,
      }

      if (editingItem) {
        await pb.collection('nine_conhecimento').update(editingItem.id, payload)
        toast.success('Entrada atualizada com sucesso na base da Nine!')
      } else {
        await pb.collection('nine_conhecimento').create(payload)
        toast.success('Nova entrada adicionada à base de conhecimento da Nine!')
      }

      setModalOpen(false)
      fetchConhecimentos()
    } catch (err) {
      console.error('Erro ao salvar entrada de conhecimento:', err)
      toast.error('Falha ao salvar a entrada na base de conhecimento.')
    } finally {
      setSavingConhecimento(false)
    }
  }

  const handleToggleAtivoConhecimento = async (item: NineConhecimentoRecord) => {
    try {
      const updated = !item.ativo
      await pb.collection('nine_conhecimento').update(item.id, { ativo: updated })
      setConhecimentos((prev) => prev.map((c) => (c.id === item.id ? { ...c, ativo: updated } : c)))
      toast.success(
        updated
          ? `"${item.titulo}" agora está ATIVA para a Nine.`
          : `"${item.titulo}" foi DESATIVADA e a Nine não a usará.`,
      )
    } catch (err) {
      console.error('Erro ao alternar status do conhecimento:', err)
      toast.error('Não foi possível alterar o status.')
    }
  }

  const handleConfirmDeleteConhecimento = async () => {
    if (!itemToDelete) return
    setDeletingConhecimento(true)
    try {
      await pb.collection('nine_conhecimento').delete(itemToDelete.id)
      toast.success('Entrada excluída com sucesso.')
      setDeleteModalOpen(false)
      setItemToDelete(null)
      fetchConhecimentos()
    } catch (err) {
      console.error('Erro ao excluir conhecimento:', err)
      toast.error('Falha ao excluir a entrada.')
    } finally {
      setDeletingConhecimento(false)
    }
  }

  // Filtragem das conversas
  const filteredConversas = useMemo(() => {
    return conversas.filter((conv) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        (conv.visitante_nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.ultima_mensagem || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.conversation_id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesModo = filtroModo === 'todos' || conv.modo_atendimento === filtroModo

      return matchesSearch && matchesModo
    })
  }, [conversas, searchQuery, filtroModo])

  // Categorias únicas existentes na base de conhecimento
  const categoriasConhecimento = useMemo(() => {
    const set = new Set<string>()
    conhecimentos.forEach((c) => {
      if (c.categoria && c.categoria.trim()) {
        set.add(c.categoria.trim())
      }
    })
    return Array.from(set)
  }, [conhecimentos])

  // Filtragem da Base de Conhecimento
  const filteredConhecimentos = useMemo(() => {
    return conhecimentos.filter((item) => {
      const q = searchConhecimento.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        item.titulo.toLowerCase().includes(q) ||
        item.conteudo.toLowerCase().includes(q) ||
        (item.categoria || '').toLowerCase().includes(q)

      const matchesTipo = filtroTipoConhecimento === 'todos' || item.tipo === filtroTipoConhecimento

      const matchesCat =
        filtroCategoriaConhecimento === 'todas' || item.categoria === filtroCategoriaConhecimento

      return matchesSearch && matchesTipo && matchesCat
    })
  }, [conhecimentos, searchConhecimento, filtroTipoConhecimento, filtroCategoriaConhecimento])

  // Contadores
  const countAguardando = useMemo(() => {
    return conversas.filter((c) => c.modo_atendimento === 'aguardando_humano').length
  }, [conversas])

  const countHumanoAtivo = useMemo(() => {
    return conversas.filter((c) => c.modo_atendimento === 'humano_respondendo').length
  }, [conversas])

  const countAutomatico = useMemo(() => {
    return conversas.filter((c) => c.modo_atendimento === 'automatico').length
  }, [conversas])

  const countAtivosConhecimento = useMemo(() => {
    return conhecimentos.filter((c) => c.ativo).length
  }, [conhecimentos])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da Área */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-vinho/10 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative">
            <NineAvatar sizeClassName="w-14 h-14" alt="Nine Assistente Virtual" />
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                atendimentoAutomatico ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              title={
                atendimentoAutomatico ? 'Nine Online no Automático' : 'Revisão Humana Requerida'
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-bold text-2xl text-vinho">
                Nine · Assistente Virtual
              </h2>
              <Badge className="bg-vinho text-dourado border border-dourado/40 text-xs px-2.5 py-0.5 font-bold">
                IA Oficial CoffeeCast 4.0
              </Badge>
              {atendimentoAutomatico ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Atendimento Automático Ativo
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Modo Humano Exclusivo
                </Badge>
              )}
            </div>
            <p className="text-xs text-vinho/70 mt-1">
              Gerencie a base de conhecimento dinâmica, personalize o tom de voz e regras no
              treinamento e acompanhe os atendimentos em tempo real.
            </p>
          </div>
        </div>

        {/* Chave Rápida de Atendimento Automático Geral */}
        <div className="flex items-center gap-3 bg-[#FAF8F5] px-4 py-3 rounded-xl border border-vinho/15 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-vinho">Atendimento Automático</p>
            <p className="text-[10px] text-vinho/60">
              {atendimentoAutomatico ? 'Nine responde sozinha' : 'Aguardar equipe'}
            </p>
          </div>
          <Switch
            checked={atendimentoAutomatico}
            onCheckedChange={handleToggleAutoService}
            className="data-[state=checked]:bg-emerald-600"
          />
        </div>
      </div>

      {/* Tabs Principais: Conversas, Base de Conhecimento e Treinamento */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'conversas' | 'conhecimento' | 'treinamento')}
        className="w-full space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vinho/15 pb-2">
          <TabsList className="bg-[#FAF8F5] border border-vinho/15 p-1 rounded-xl">
            <TabsTrigger
              value="conversas"
              className="flex items-center gap-2 data-[state=active]:bg-vinho data-[state=active]:text-white font-semibold rounded-lg text-xs px-4 py-2"
            >
              <MessageSquare className="w-4 h-4 text-dourado" />
              <span>Conversas & Atendimento</span>
              {countAguardando > 0 && (
                <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0 rounded-full animate-pulse ml-1">
                  {countAguardando}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="conhecimento"
              className="flex items-center gap-2 data-[state=active]:bg-vinho data-[state=active]:text-white font-semibold rounded-lg text-xs px-4 py-2"
            >
              <BookOpen className="w-4 h-4 text-dourado" />
              <span>Base de Conhecimento da Nine</span>
              <Badge className="bg-dourado/30 text-vinho font-bold text-[10px] px-1.5 py-0 rounded-full ml-1">
                {countAtivosConhecimento}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="treinamento"
              className="flex items-center gap-2 data-[state=active]:bg-vinho data-[state=active]:text-white font-semibold rounded-lg text-xs px-4 py-2"
            >
              <Sparkles className="w-4 h-4 text-dourado" />
              <span>Personalidade & Regras</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-xs text-vinho/70">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchConversas()
                if (selectedConversationId) fetchMensagens(selectedConversationId)
                fetchConfig()
                fetchConhecimentos()
              }}
              className="h-8 text-xs border-vinho/20 hover:border-dourado hover:bg-vinho hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-dourado" />
              Atualizar Tudo
            </Button>
          </div>
        </div>

        {/* =========================================================================
            ABA 1: CONVERSAS & CAIXA DE ENTRADA
           ========================================================================= */}
        <TabsContent value="conversas" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] max-h-[85vh]">
            {/* Coluna Esquerda: Lista de Conversas (4 colunas no lg) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-vinho/10 shadow-xs flex flex-col overflow-hidden">
              {/* Barra de Filtros e Busca */}
              <div className="p-3.5 border-b border-vinho/10 space-y-2 bg-[#FAF8F5]/60">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vinho/40" />
                  <Input
                    placeholder="Buscar conversa ou mensagem..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-white border-vinho/20 rounded-xl focus:border-dourado"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFiltroModo('todos')}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      filtroModo === 'todos'
                        ? 'bg-vinho text-white'
                        : 'bg-white text-vinho/70 border border-vinho/15 hover:bg-vinho/5'
                    }`}
                  >
                    Todas ({conversas.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroModo('aguardando_humano')}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                      filtroModo === 'aguardando_humano'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Aguardando ({countAguardando})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroModo('humano_respondendo')}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                      filtroModo === 'humano_respondendo'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <Headphones className="w-3 h-3 text-blue-500" />
                    Humano ({countHumanoAtivo})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroModo('automatico')}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                      filtroModo === 'automatico'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <Bot className="w-3 h-3 text-emerald-500" />
                    Nine ({countAutomatico})
                  </button>
                </div>
              </div>

              {/* Lista com scroll */}
              <div className="flex-1 overflow-y-auto divide-y divide-vinho/5">
                {loadingConversas ? (
                  <div className="p-8 text-center text-vinho/60 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-dourado" />
                    Carregando conversas...
                  </div>
                ) : filteredConversas.length === 0 ? (
                  <div className="p-8 text-center text-vinho/60 text-xs">
                    <MessageSquare className="w-8 h-8 text-vinho/20 mx-auto mb-2" />
                    Nenhuma conversa encontrada neste filtro.
                  </div>
                ) : (
                  filteredConversas.map((conv) => {
                    const isSelected = conv.conversation_id === selectedConversationId
                    const isAguardando = conv.modo_atendimento === 'aguardando_humano'
                    const isHumano = conv.modo_atendimento === 'humano_respondendo'

                    return (
                      <div
                        key={conv.id || conv.conversation_id}
                        onClick={() => setSelectedConversationId(conv.conversation_id)}
                        className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                          isSelected
                            ? 'bg-vinho/5 border-dourado'
                            : 'hover:bg-vinho/[0.02] border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center shrink-0 text-xs uppercase">
                              {(conv.visitante_nome || 'V').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-vinho truncate">
                                {conv.visitante_nome || 'Visitante'}
                              </p>
                              <p className="text-[10px] text-vinho/50 truncate">
                                ID: {conv.conversation_id.slice(-8)}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] text-vinho/50 shrink-0">
                            {conv.data_ultima_mensagem
                              ? new Date(conv.data_ultima_mensagem).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>

                        {/* Prévia da última mensagem */}
                        <p className="text-xs text-vinho/80 line-clamp-2 mt-2 leading-snug">
                          {conv.ultimo_remetente === 'visitante' && (
                            <span className="font-semibold text-vinho">Visitante: </span>
                          )}
                          {conv.ultimo_remetente === 'nine' && (
                            <span className="font-semibold text-dourado-dark">Nine: </span>
                          )}
                          {conv.ultimo_remetente === 'humano' && (
                            <span className="font-semibold text-blue-700">Equipe: </span>
                          )}
                          {conv.ultima_mensagem
                            ? getStickerPreviewLabel(conv.ultima_mensagem)
                            : 'Conversa iniciada'}
                        </p>

                        {/* Badges de Modo */}
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          {isAguardando ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-2 py-0 flex items-center gap-1 font-bold animate-pulse">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Aguardando Humano
                            </Badge>
                          ) : isHumano ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] px-2 py-0 flex items-center gap-1 font-semibold">
                              <Headphones className="w-3 h-3 text-blue-600" />
                              Humano Respondendo
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] px-2 py-0 flex items-center gap-1 font-semibold">
                              <Bot className="w-3 h-3 text-emerald-600" />
                              Automático (Nine)
                            </Badge>
                          )}

                          <span className="text-[10px] text-vinho/50">
                            {conv.total_mensagens || 1} msg(s)
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Coluna Direita: Conversa Selecionada & Controles de Atendimento (8 colunas no lg) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-vinho/10 shadow-xs flex flex-col overflow-hidden">
              {activeConversation ? (
                <>
                  {/* Topo do Chat Selecionado */}
                  <div className="p-4 bg-[#FAF8F5] border-b border-vinho/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vinho text-marfim flex items-center justify-center font-bold text-sm">
                        {(activeConversation.visitante_nome || 'V').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-vinho">
                            {activeConversation.visitante_nome || 'Visitante do Site'}
                          </h3>
                          <Badge variant="outline" className="text-[10px] text-vinho/60 font-mono">
                            {activeConversation.conversation_id}
                          </Badge>
                        </div>
                        <p className="text-xs text-vinho/60">
                          Iniciado em {formatDateBR(activeConversation.created)}
                          {activeConversation.atendente_humano_nome && (
                            <span className="text-blue-700 ml-1 font-medium">
                              · Atendido por: {activeConversation.atendente_humano_nome}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* BOTÕES DE CONTROLE: INTERROMPER NINE / ASSUMIR HUMANO / RETOMAR AUTOMÁTICO */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activeConversation.modo_atendimento === 'automatico' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={togglingMode}
                          onClick={() => handleToggleConversationMode('humano_respondendo')}
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                          title="Interrompe respostas da Nine e coloca o atendimento em modo humano"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Interromper Nine (Assumir Humano)</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={togglingMode}
                          onClick={() => handleToggleConversationMode('automatico')}
                          className="h-8 text-xs border-emerald-500 text-emerald-800 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-semibold flex items-center gap-1.5"
                          title="Permite que a Nine volte a responder automaticamente às perguntas do visitante"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Reativar Modo Automático (Nine)</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Faixa de Aviso de Modo */}
                  <div
                    className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
                      activeConversation.modo_atendimento === 'automatico'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : activeConversation.modo_atendimento === 'aguardando_humano'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {activeConversation.modo_atendimento === 'automatico' ? (
                        <>
                          <Bot className="w-4 h-4 text-emerald-600" />
                          <span>Nine está respondendo automaticamente a este visitante.</span>
                        </>
                      ) : activeConversation.modo_atendimento === 'aguardando_humano' ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>
                            Esta conversa está aguardando resposta de um agente humano da equipe.
                          </span>
                        </>
                      ) : (
                        <>
                          <Headphones className="w-4 h-4 text-blue-600" />
                          <span>
                            Modo humano ativo. As respostas automáticas da Nine estão interrompidas.
                          </span>
                        </>
                      )}
                    </div>

                    <span className="text-[11px] opacity-75">
                      Atualizações sincronizadas em tempo real
                    </span>
                  </div>

                  {/* Histórico Completo de Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-[#FAF8F5]/50 to-white">
                    {loadingMensagens ? (
                      <div className="p-8 text-center text-xs text-vinho/60">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-dourado" />
                        Carregando histórico completo...
                      </div>
                    ) : mensagens.length === 0 ? (
                      <div className="p-8 text-center text-xs text-vinho/60">
                        Nenhuma mensagem encontrada nesta conversa.
                      </div>
                    ) : (
                      mensagens.map((msg) => {
                        const isVisitante = msg.remetente === 'visitante'
                        const isNine = msg.remetente === 'nine'
                        const isHumano = msg.remetente === 'humano'

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isVisitante ? 'items-start mr-auto' : 'items-end ml-auto'
                            } max-w-[85%]`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-vinho/60">
                              {isVisitante && (
                                <>
                                  <User className="w-3 h-3 text-vinho/60" />
                                  <span className="font-semibold text-vinho">
                                    {msg.remetente_nome || 'Visitante'}
                                  </span>
                                </>
                              )}
                              {isNine && (
                                <>
                                  <Bot className="w-3 h-3 text-dourado-dark" />
                                  <span className="font-semibold text-dourado-dark">Nine (IA)</span>
                                </>
                              )}
                              {isHumano && (
                                <>
                                  <Headphones className="w-3 h-3 text-blue-600" />
                                  <span className="font-semibold text-blue-700">
                                    {msg.remetente_nome || 'Equipe CoffeeCast'}
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span>
                                {msg.created
                                  ? new Date(msg.created).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                            </div>

                            <div
                              className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs break-words ${
                                isStickerMessage(msg.conteudo)
                                  ? 'bg-transparent shadow-none p-1'
                                  : isVisitante
                                    ? 'bg-[#F4EFEA] text-[#4B1E3F] rounded-tl-xs border border-vinho/10'
                                    : isNine
                                      ? 'bg-white text-vinho rounded-tr-xs border border-[#D4AF37]/50 shadow-sm'
                                      : 'bg-blue-600 text-white rounded-tr-xs border border-blue-700 shadow-sm'
                              }`}
                            >
                              {isStickerMessage(msg.conteudo) ? (
                                <ChatStickerMessage content={msg.conteudo} size={84} />
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Área de Resposta do Agente Humano */}
                  <div className="p-3.5 bg-white border-t border-vinho/10 shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendHumanReply()
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-vinho/60">
                        <span className="font-medium flex items-center gap-1 text-blue-800">
                          <Headphones className="w-3 h-3 text-blue-600" />
                          Responder como {user?.name || 'Equipe CoffeeCast'} (Modo Humano):
                        </span>
                        <span>O visitante verá esta mensagem no balão do site</span>
                      </div>

                      <div className="flex items-end gap-2">
                        <Textarea
                          value={humanReplyInput}
                          onChange={(e) => setHumanReplyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendHumanReply()
                            }
                          }}
                          placeholder="Digite a resposta que será enviada direto ao visitante no site..."
                          rows={2}
                          className="flex-1 text-xs resize-none bg-[#FAF8F5] border-vinho/20 focus:border-dourado rounded-xl"
                        />

                        <Button
                          type="submit"
                          disabled={!humanReplyInput.trim() || sendingReply}
                          className="h-14 px-5 bg-vinho text-white hover:bg-vinho-light font-semibold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                        >
                          {sendingReply ? (
                            <Loader2 className="w-4 h-4 animate-spin text-dourado" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-dourado" />
                              <span>Enviar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-vinho/50">
                  <MessageSquare className="w-12 h-12 text-vinho/20 mb-3" />
                  <h4 className="font-serif font-bold text-lg text-vinho">
                    Nenhuma conversa selecionada
                  </h4>
                  <p className="text-xs max-w-sm mt-1">
                    Escolha uma conversa na lista à esquerda para ver o histórico e assumir o
                    atendimento humano.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* =========================================================================
            ABA 2: BASE DE CONHECIMENTO DA NINE (CRUD DINÂMICO)
           ========================================================================= */}
        <TabsContent value="conhecimento" className="mt-0 space-y-6">
          {/* Card de Informação sobre Conexão em Tempo Real */}
          <div className="bg-[#FAF8F5] border border-vinho/15 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-vinho text-dourado flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-vinho flex items-center gap-2">
                  <span>Base Dinâmica de Conhecimento da Nine</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    Sincronização em Tempo Real
                  </Badge>
                </h3>
                <p className="text-xs text-vinho/70 mt-0.5 leading-relaxed">
                  Adicione perguntas frequentes, informações institucionais, orientações e utilize o
                  novo espaço de <strong>Prompt Livre</strong> abaixo para instruções contextuais
                  adicionais. A Nine consulta toda esta base e as tabelas de{' '}
                  <strong>episódios</strong>, <strong>integrantes</strong> e <strong>agenda</strong>{' '}
                  automaticamente a cada resposta.
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenCreateModal}
              className="bg-vinho text-white hover:bg-vinho-light font-bold text-xs h-10 px-5 rounded-xl flex items-center gap-2 shadow-sm shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 text-dourado" />
              <span>Adicionar Informação</span>
            </Button>
          </div>

          {/* =========================================================================
              ESPAÇO DE PROMPT LIVRE DA BASE DE CONHECIMENTO
             ========================================================================= */}
          <Card className="border-vinho/15 shadow-xs overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-[#FAF8F5] via-marfim to-[#FAF8F5] border-b border-vinho/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-vinho/10 text-vinho flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-dourado" />
                    </div>
                    <CardTitle className="font-serif font-bold text-base text-vinho flex items-center gap-2">
                      <span>Espaço para Prompt Livre da Base de Conhecimento</span>
                      <Badge className="bg-dourado/20 text-vinho border border-dourado/40 text-[10px] font-semibold">
                        Instruções Extras
                      </Badge>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-vinho/70">
                    Insira aqui um prompt adicional livre com instruções, direcionamentos, novidades
                    ou informações complementares para a Nine. Este campo é consultado no contexto
                    de cada resposta do chat, permanecendo totalmente separado do Prompt Master de
                    Personalidade.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[11px] text-vinho/70 border-vinho/20 bg-white"
                  >
                    {promptLivre.length.toLocaleString('pt-BR')} / 100.000 caracteres
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-vinho flex items-center justify-between">
                  <span>Conteúdo do Prompt Livre:</span>
                  <span className="text-[11px] text-vinho/50 font-normal">
                    Pode ficar em branco se não houver instruções extras no momento
                  </span>
                </label>
                <Textarea
                  value={promptLivre}
                  onChange={(e) => setPromptLivre(e.target.value)}
                  maxLength={100000}
                  rows={8}
                  disabled={loadingConfig}
                  placeholder="Cole ou digite aqui seu prompt adicional livre (ex: novos avisos, regras pontuais de campanhas, instruções de atendimento específicas de feiras ou eventos, etc.)..."
                  className="font-mono text-xs leading-relaxed bg-[#FAF8F5] border-vinho/20 focus:border-dourado rounded-xl resize-y"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-vinho/10 text-xs">
                <p className="text-vinho/60 text-[11px]">
                  💡 <strong>Dica:</strong> Este texto entra como bloco oficial no contexto
                  inteligente da Nine junto com os episódios e a lista de perguntas abaixo.
                </p>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {promptLivre.trim().length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPromptLivre('')}
                      disabled={savingPromptLivre || loadingConfig}
                      className="text-xs h-9 border-vinho/20 text-vinho hover:bg-vinho/5"
                    >
                      Limpar
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleSavePromptLivre}
                    disabled={savingPromptLivre || loadingConfig}
                    className="h-9 px-5 bg-vinho text-white hover:bg-vinho-light font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs active:scale-95 transition-all"
                  >
                    {savingPromptLivre ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-dourado" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-dourado" />
                    )}
                    <span>Salvar Prompt Livre</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros e Busca */}
          <div className="bg-white p-4 rounded-2xl border border-vinho/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vinho/40" />
              <Input
                placeholder="Buscar por título, conteúdo ou categoria..."
                value={searchConhecimento}
                onChange={(e) => setSearchConhecimento(e.target.value)}
                className="pl-9 h-9 text-xs bg-[#FAF8F5] border-vinho/20 rounded-xl focus:border-dourado"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Filtro por Tipo */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-vinho/10">
                <button
                  type="button"
                  onClick={() => setFiltroTipoConhecimento('todos')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filtroTipoConhecimento === 'todos'
                      ? 'bg-vinho text-white font-bold'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  Todos ({conhecimentos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipoConhecimento('faq')}
                  className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                    filtroTipoConhecimento === 'faq'
                      ? 'bg-vinho text-white font-bold'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  <FileQuestion className="w-3.5 h-3.5 text-dourado" />
                  FAQ
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipoConhecimento('institucional')}
                  className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                    filtroTipoConhecimento === 'institucional'
                      ? 'bg-vinho text-white font-bold'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-dourado" />
                  Institucional
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipoConhecimento('orientacao')}
                  className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                    filtroTipoConhecimento === 'orientacao'
                      ? 'bg-vinho text-white font-bold'
                      : 'text-vinho/70 hover:bg-vinho/5'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-dourado" />
                  Orientação
                </button>
              </div>

              {/* Filtro por Categoria se houver mais de uma */}
              {categoriasConhecimento.length > 0 && (
                <select
                  value={filtroCategoriaConhecimento}
                  onChange={(e) => setFiltroCategoriaConhecimento(e.target.value)}
                  className="h-9 px-3 text-xs bg-[#FAF8F5] border border-vinho/20 rounded-xl text-vinho focus:outline-none focus:border-dourado"
                >
                  <option value="todas">Todas as Categorias</option>
                  {categoriasConhecimento.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Grid de Cards de Conhecimento */}
          {loadingConhecimentos ? (
            <div className="bg-white p-12 rounded-2xl border border-vinho/10 text-center text-xs text-vinho/60">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-dourado" />
              Carregando base de conhecimento da Nine...
            </div>
          ) : filteredConhecimentos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-vinho/10 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-vinho/20 mx-auto" />
              <h4 className="font-serif font-bold text-lg text-vinho">
                Nenhuma entrada de conhecimento encontrada
              </h4>
              <p className="text-xs text-vinho/60 max-w-md mx-auto">
                {searchConhecimento || filtroTipoConhecimento !== 'todos'
                  ? 'Tente ajustar os filtros ou termo de busca acima.'
                  : 'Comece adicionando perguntas, respostas ou orientações para a Nine.'}
              </p>
              <Button
                onClick={handleOpenCreateModal}
                className="bg-vinho text-white hover:bg-vinho-light font-semibold text-xs h-9 px-4 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1 text-dourado" />
                Criar Primeira Entrada
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredConhecimentos.map((item) => {
                const isFaq = item.tipo === 'faq'
                const isInstitucional = item.tipo === 'institucional'
                const isOrientacao = item.tipo === 'orientacao'

                return (
                  <Card
                    key={item.id}
                    className={`border transition-all duration-200 flex flex-col justify-between ${
                      item.ativo
                        ? 'border-vinho/15 bg-white shadow-xs hover:shadow-md hover:border-dourado/60'
                        : 'border-dashed border-vinho/20 bg-[#FAF8F5]/50 opacity-60'
                    }`}
                  >
                    <CardHeader className="pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isFaq && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold flex items-center gap-1">
                              <FileQuestion className="w-3 h-3 text-purple-600" />
                              Pergunta & Resposta
                            </Badge>
                          )}
                          {isInstitucional && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-blue-600" />
                              Institucional
                            </Badge>
                          )}
                          {isOrientacao && (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold flex items-center gap-1">
                              <Compass className="w-3 h-3 text-amber-700" />
                              Orientação
                            </Badge>
                          )}

                          {item.categoria && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-vinho/70 border-vinho/20"
                            >
                              {item.categoria}
                            </Badge>
                          )}
                        </div>

                        {/* Switch de Ativo / Inativo */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-vinho/60">
                            {item.ativo ? 'Ativo' : 'Pausado'}
                          </span>
                          <Switch
                            checked={item.ativo}
                            onCheckedChange={() => handleToggleAtivoConhecimento(item)}
                            className="data-[state=checked]:bg-emerald-600 scale-90"
                            title={
                              item.ativo
                                ? 'Entrada disponível para a Nine consultar'
                                : 'Entrada desativada (Nine não responderá com base nela)'
                            }
                          />
                        </div>
                      </div>

                      <CardTitle className="font-serif font-bold text-base text-vinho leading-snug line-clamp-2">
                        {item.titulo}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pb-3 flex-1">
                      <p className="text-xs text-vinho/80 whitespace-pre-wrap leading-relaxed line-clamp-5">
                        {item.conteudo}
                      </p>
                    </CardContent>

                    <div className="p-4 pt-2 border-t border-vinho/10 flex items-center justify-between text-xs text-vinho/50 bg-[#FAF8F5]/40 rounded-b-xl">
                      <span>Ordem: {item.ordem ?? 0}</span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(item)}
                          className="h-8 w-8 p-0 text-vinho hover:text-dourado-dark hover:bg-vinho/5 rounded-lg"
                          title="Editar informação"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setItemToDelete(item)
                            setDeleteModalOpen(true)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Excluir informação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            ABA 3: TREINAMENTO (PERSONALIDADE, COMPORTAMENTO E REGRAS)
           ========================================================================= */}
        <TabsContent value="treinamento" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1 & 2: Formulário de Personalidade & Regras */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-vinho/10 shadow-xs">
                <CardHeader className="bg-[#FAF8F5]/60 border-b border-vinho/10 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif text-lg text-vinho flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-dourado" />
                        Personalidade, Comportamento e Regras da Nine
                      </CardTitle>
                      <CardDescription className="text-xs text-vinho/60 mt-0.5">
                        Defina o tom de voz acolhedor, etiqueta, conduta e as regras de ouro. As
                        informações dinâmicas (episódios, convidados, links e agenda) são
                        consultadas automaticamente no banco de dados.
                      </CardDescription>
                    </div>

                    <Badge className="bg-vinho/10 text-vinho border border-vinho/20 text-xs font-semibold">
                      Prompt de Sistema
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Banner Explicativo da Separação Prompt vs Base de Conhecimento */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">
                        Base de Conhecimento Dinâmica Separada com Sucesso:
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Você não precisa mais colar episódios ou datas neste campo! Use a nova aba{' '}
                        <strong>"Base de Conhecimento da Nine"</strong> para adicionar e editar
                        perguntas, respostas e orientações. Episódios e integrantes cadastrados no
                        painel entram automaticamente na conversa da Nine.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-vinho flex items-center justify-between">
                      <span>Prompt de Personalidade e Regras (System Prompt):</span>
                      <span className="text-[11px] text-vinho/50 font-normal">
                        Dica: conversa natural entre humanos, acolhimento à mesa de café e âncora
                        estrita ☕
                      </span>
                    </label>
                    <Textarea
                      value={promptSistema}
                      onChange={(e) => setPromptSistema(e.target.value)}
                      rows={16}
                      disabled={loadingConfig}
                      placeholder="Ex: IDENTIDADE E PROPÓSITO: Você é Nine, a assistente virtual oficial do CoffeeCast 4.0..."
                      className="font-mono text-xs leading-relaxed bg-[#FAF8F5] border-vinho/20 focus:border-dourado rounded-xl resize-y"
                    />
                  </div>

                  {/* Observações Internas */}
                  <div className="space-y-1.5 pt-2 border-t border-vinho/10">
                    <label className="text-xs font-bold text-vinho">
                      Notas Internas da Equipe (opcional):
                    </label>
                    <Input
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      disabled={loadingConfig}
                      placeholder="Ex: Treinamento revisado por Aline Lana em Setembro de 2026."
                      className="text-xs bg-[#FAF8F5] border-vinho/20 focus:border-dourado rounded-xl"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchConfig}
                      disabled={loadingConfig || savingConfig}
                      className="text-xs h-10 border-vinho/20"
                    >
                      Descartar Alterações
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSaveConfig}
                      disabled={savingConfig || loadingConfig}
                      className="text-xs h-10 px-6 bg-vinho text-white hover:bg-vinho-light font-bold flex items-center gap-2 rounded-xl shadow-md active:scale-95"
                    >
                      {savingConfig ? (
                        <Loader2 className="w-4 h-4 animate-spin text-dourado" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-dourado" />
                      )}
                      <span>Salvar Personalidade & Regras</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna 3: Painel Lateral com Dicas e Status */}
            <div className="space-y-6">
              {/* Card de Status da Nine */}
              <Card className="border-vinho/10 shadow-xs bg-[#FAF8F5]">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-base text-vinho flex items-center gap-2">
                    <Bot className="w-4 h-4 text-dourado" />
                    Status Operacional da Nine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs text-vinho/80">
                  <div className="flex items-center justify-between pb-2 border-b border-vinho/10">
                    <span>Agente Conectado:</span>
                    <span className="font-semibold text-vinho">nine-chat (Nativo)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-vinho/10">
                    <span>Atendimento Automático:</span>
                    <Badge
                      className={
                        atendimentoAutomatico
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }
                    >
                      {atendimentoAutomatico ? 'Ativo' : 'Desligado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-vinho/10">
                    <span>Base de Conhecimento:</span>
                    <span className="font-semibold text-vinho">
                      {countAtivosConhecimento} entradas ativas
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-vinho/10">
                    <span>Consulta ao Banco em Tempo Real:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Episódios, Integrantes e Agenda
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fallback Inteligente:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Ativado ($ai.chat)
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Guia Rápido de Boas Práticas */}
              <Card className="border-vinho/10 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-base text-vinho flex items-center gap-2">
                    <Compass className="w-4 h-4 text-dourado" />
                    Como Funciona o Conhecimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-vinho/80 leading-relaxed">
                  <p>
                    <strong className="text-vinho">1. Conversa Natural e Humana:</strong> A Nine
                    responde sempre como num papo espontâneo entre duas pessoas tomando café, em 1ª
                    pessoa, variando palavras e sem listar tudo de uma vez.
                  </p>
                  <p>
                    <strong className="text-vinho">2. Dados que mudam = Banco de Dados:</strong>{' '}
                    Lançou um novo episódio na aba Episódios? A Nine já saberá o título e link
                    imediatamente.
                  </p>
                  <p>
                    <strong className="text-vinho">3. Âncora de Conhecimento:</strong> A Nine nunca
                    inventa dados. Se a informação não estiver na base ou banco, orienta com
                    simpatia para falar com Aline Lana pelo WhatsApp (31) 99129-7619.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          MODAL: ADICIONAR OU EDITAR ENTRADA DE CONHECIMENTO
         ========================================================================= */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[620px] bg-white border-vinho/20 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-xl text-vinho flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-dourado" />
              <span>
                {editingItem
                  ? 'Editar Informação da Base de Conhecimento'
                  : 'Adicionar Nova Informação para a Nine'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-vinho/70">
              Cadastre perguntas e respostas, informações institucionais ou novas diretrizes. A Nine
              terá acesso imediato.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveConhecimento} className="space-y-4 py-2">
            {/* Tipo da Entrada */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vinho">Tipo da Entrada *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormTipo('faq')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    formTipo === 'faq'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                      : 'border-vinho/15 hover:bg-vinho/5 text-vinho/70'
                  }`}
                >
                  <FileQuestion className="w-4 h-4 text-purple-600" />
                  <span>Pergunta & Resposta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormTipo('institucional')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    formTipo === 'institucional'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                      : 'border-vinho/15 hover:bg-vinho/5 text-vinho/70'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Institucional</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormTipo('orientacao')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    formTipo === 'orientacao'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                      : 'border-vinho/15 hover:bg-vinho/5 text-vinho/70'
                  }`}
                >
                  <Compass className="w-4 h-4 text-amber-700" />
                  <span>Orientação</span>
                </button>
              </div>
            </div>

            {/* Título / Pergunta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vinho">
                {formTipo === 'faq' ? 'Pergunta do Visitante *' : 'Título da Informação *'}
              </label>
              <Input
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder={
                  formTipo === 'faq'
                    ? 'Ex: Novos episódios saem que dia e horário?'
                    : 'Ex: Local de gravação e estrutura do estúdio'
                }
                className="text-xs bg-[#FAF8F5] border-vinho/20 rounded-xl focus:border-dourado"
                required
              />
            </div>

            {/* Conteúdo / Resposta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vinho">
                {formTipo === 'faq'
                  ? 'Resposta Oficial que a Nine deve dar *'
                  : 'Conteúdo detalhado da Informação *'}
              </label>
              <Textarea
                value={formConteudo}
                onChange={(e) => setFormConteudo(e.target.value)}
                rows={5}
                placeholder={
                  formTipo === 'faq'
                    ? 'Ex: Os episódios do CoffeeCast 4.0 são lançados todos os sábados às 10h no canal oficial do YouTube.'
                    : 'Ex: Detalhes, regras, links ou orientações que a Nine deve conhecer...'
                }
                className="text-xs bg-[#FAF8F5] border-vinho/20 rounded-xl focus:border-dourado resize-y leading-relaxed"
                required
              />
            </div>

            {/* Categoria e Ordem */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-vinho">Categoria / Tag</label>
                <Input
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  placeholder="Ex: Episódios, Gravação, Patrocínio, Links..."
                  className="text-xs bg-[#FAF8F5] border-vinho/20 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-vinho">Ordem de Prioridade</label>
                <Input
                  type="number"
                  min={0}
                  value={formOrdem}
                  onChange={(e) => setFormOrdem(Number(e.target.value))}
                  className="text-xs bg-[#FAF8F5] border-vinho/20 rounded-xl"
                />
              </div>
            </div>

            {/* Ativo */}
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-vinho/15">
              <div>
                <p className="text-xs font-bold text-vinho">Disponível para a Nine</p>
                <p className="text-[11px] text-vinho/60">
                  Se desativada, a Nine não utilizará esta informação ao responder.
                </p>
              </div>
              <Switch
                checked={formAtivo}
                onCheckedChange={setFormAtivo}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs border-vinho/20"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingConhecimento}
                className="text-xs bg-vinho text-white hover:bg-vinho-light font-bold px-5 rounded-xl flex items-center gap-2"
              >
                {savingConhecimento ? (
                  <Loader2 className="w-4 h-4 animate-spin text-dourado" />
                ) : (
                  <Check className="w-4 h-4 text-dourado" />
                )}
                <span>{editingItem ? 'Salvar Alterações' : 'Adicionar à Nine'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: CONFIRMAR EXCLUSÃO DE CONHECIMENTO
         ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border-vinho/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-lg text-vinho flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Excluir Entrada</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-vinho/70">
              Tem certeza de que deseja excluir permanentemente esta informação da base de
              conhecimento da Nine?
            </DialogDescription>
          </DialogHeader>

          {itemToDelete && (
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-vinho/10 my-2">
              <p className="text-xs font-bold text-vinho">{itemToDelete.titulo}</p>
              <p className="text-[11px] text-vinho/60 line-clamp-2 mt-1">{itemToDelete.conteudo}</p>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setItemToDelete(null)
              }}
              className="text-xs border-vinho/20"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deletingConhecimento}
              onClick={handleConfirmDeleteConhecimento}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-4 rounded-xl flex items-center gap-1.5"
            >
              {deletingConhecimento ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Confirmar Exclusão</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
