import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { getFileUrl, parseInstagramHandle, formatDateBR } from '@/lib/formatters'
import type {
  DepoimentoRecord,
  DepoimentoConvidadoRecord,
  DepoimentoConvidadoStatus,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Edit2,
  Trash2,
  Video,
  ExternalLink,
  CheckCircle,
  EyeOff,
  Inbox,
  Clock,
  Building,
  Eye,
  Instagram,
  Copy,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

export default function AdminDepoimentosScreen() {
  const { isMaster, isGerencial } = useAuth()
  const [activeTab, setActiveTab] = useState<'publicados' | 'recebidos'>('publicados')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedRoteiroLink, setCopiedRoteiroLink] = useState(false)
  const [copiedConvidadoLink, setCopiedConvidadoLink] = useState(false)

  const publicTestimonialUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/depoimento` : '/depoimento'
  const publicRoteiroUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/roteiro` : '/roteiro'
  const publicConvidadoUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/convidado` : '/convidado'

  const handleCopyRoteiroLink = async () => {
    try {
      await navigator.clipboard.writeText(publicRoteiroUrl)
      setCopiedRoteiroLink(true)
      toast.success('Link do formulário de roteiro copiado com sucesso!')
      setTimeout(() => setCopiedRoteiroLink(false), 3000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
      toast.error('Não foi possível copiar automaticamente. Selecione e copie o link.')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicTestimonialUrl)
      setCopiedLink(true)
      toast.success('Link do formulário copiado com sucesso! Pronto para enviar ao convidado.')
      setTimeout(() => setCopiedLink(false), 3000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
      toast.error('Não foi possível copiar automaticamente. Selecione e copie o link.')
    }
  }

  const handleCopyConvidadoLink = async () => {
    try {
      await navigator.clipboard.writeText(publicConvidadoUrl)
      setCopiedConvidadoLink(true)
      toast.success('Link da Área do Convidado copiado com sucesso!')
      setTimeout(() => setCopiedConvidadoLink(false), 3000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
      toast.error('Não foi possível copiar automaticamente. Selecione e copie o link.')
    }
  }

  // Depoimentos publicados (coleção 'depoimentos')
  const [depoimentos, setDepoimentos] = useState<DepoimentoRecord[]>([])
  const [loadingDepoimentos, setLoadingDepoimentos] = useState(true)

  // Depoimentos recebidos do site (coleção 'depoimentos_convidados')
  const [recebidos, setRecebidos] = useState<DepoimentoConvidadoRecord[]>([])
  const [loadingRecebidos, setLoadingRecebidos] = useState(true)
  const [filtroStatusRecebidos, setFiltroStatusRecebidos] = useState<string>('todos')

  // Modal para criar/editar depoimento publicado
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DepoimentoRecord | null>(null)
  const [nome, setNome] = useState('')
  const [texto, setTexto] = useState('')
  const [deNossaAutoridade, setDeNossaAutoridade] = useState(false)
  const [ordem, setOrdem] = useState('1')
  const [instagram, setInstagram] = useState('')
  const [linkEpisodio, setLinkEpisodio] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Modal de detalhes para depoimento recebido
  const [selectedRecebido, setSelectedRecebido] = useState<DepoimentoConvidadoRecord | null>(null)
  const [modalRecebidoOpen, setModalRecebidoOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Controle de linhas expandidas para "Ler mais / Ler menos"
  const [expandedTextIds, setExpandedTextIds] = useState<Record<string, boolean>>({})

  const toggleExpandText = (id: string) => {
    setExpandedTextIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Carregar depoimentos oficiais do site
  const loadDepoimentos = async () => {
    try {
      setLoadingDepoimentos(true)
      const list = await pb.collection('depoimentos').getFullList<DepoimentoRecord>({
        sort: 'ordem',
      })
      setDepoimentos(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar depoimentos.')
    } finally {
      setLoadingDepoimentos(false)
    }
  }

  // Carregar depoimentos recebidos pelo formulário público
  const loadRecebidos = async () => {
    try {
      setLoadingRecebidos(true)
      const list = await pb
        .collection('depoimentos_convidados')
        .getFullList<DepoimentoConvidadoRecord>({
          sort: '-created',
        })
      setRecebidos(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar depoimentos recebidos do site.')
    } finally {
      setLoadingRecebidos(false)
    }
  }

  useEffect(() => {
    loadDepoimentos()
    loadRecebidos()
  }, [])

  // Inscrições Realtime para atualização automática
  useEffect(() => {
    let unsubRecebidos: (() => void) | undefined
    let unsubDepoimentos: (() => void) | undefined

    pb.collection('depoimentos_convidados')
      .subscribe('*', () => {
        loadRecebidos()
      })
      .then((unsub) => {
        unsubRecebidos = unsub
      })
      .catch(() => {})

    pb.collection('depoimentos')
      .subscribe('*', () => {
        loadDepoimentos()
      })
      .then((unsub) => {
        unsubDepoimentos = unsub
      })
      .catch(() => {})

    return () => {
      if (unsubRecebidos) unsubRecebidos()
      if (unsubDepoimentos) unsubDepoimentos()
    }
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setNome('')
    setTexto('')
    setDeNossaAutoridade(false)
    setOrdem(String(depoimentos.length + 1))
    setInstagram('')
    setLinkEpisodio('')
    setFotoFile(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: DepoimentoRecord) => {
    setEditingItem(item)
    setNome(item.nome || '')
    setTexto(item.texto || '')
    setDeNossaAutoridade(Boolean(item.de_nossa_autoridade))
    setOrdem(item.ordem !== undefined && item.ordem !== null ? String(item.ordem) : '1')
    setInstagram(item.instagram || '')
    setLinkEpisodio(item.link_episodio || '')
    setFotoFile(null)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const parsedInsta = parseInstagramHandle(instagram)
      const cleanedInsta = parsedInsta ? parsedInsta.username : instagram.trim()

      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('texto', texto.trim())
      formData.append('de_nossa_autoridade', String(deNossaAutoridade))
      formData.append('ordem', ordem)
      formData.append('instagram', cleanedInsta)
      formData.append('link_episodio', linkEpisodio.trim())
      if (fotoFile) {
        formData.append('foto', fotoFile)
      }

      if (editingItem) {
        await pb.collection('depoimentos').update(editingItem.id, formData)
        toast.success('Depoimento atualizado com sucesso!')
      } else {
        await pb.collection('depoimentos').create(formData)
        toast.success('Depoimento criado com sucesso!')
      }

      setModalOpen(false)
      loadDepoimentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar depoimento.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o depoimento de "${name}"?`)) return

    try {
      await pb.collection('depoimentos').delete(id)
      toast.success('Depoimento removido com sucesso!')
      loadDepoimentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir depoimento.')
    }
  }

  // APROVAR E PUBLICAR NO SITE
  const handleAprovarEPublicar = async (item: DepoimentoConvidadoRecord) => {
    try {
      setActionLoading(true)

      // 1. Atualizar status para 'aprovada' e visualizado na coleção de recebidos
      await pb.collection('depoimentos_convidados').update(item.id, {
        status: 'aprovada',
        visualizado: true,
      })

      // 2. Criar ou verificar se já existe na coleção de depoimentos públicos
      // Se tiver foto, busca o blob para clonar no registro público de depoimentos
      const formData = new FormData()
      formData.append('nome', item.nome)
      formData.append('texto', item.texto)
      formData.append('de_nossa_autoridade', 'false')
      formData.append('ordem', String(depoimentos.length + 1))
      formData.append('instagram', item.instagram || '')

      if (item.foto) {
        try {
          const fileUrl = getFileUrl(item, item.foto)
          const res = await fetch(fileUrl)
          if (res.ok) {
            const blob = await res.blob()
            const filename = item.foto.split('/').pop() || 'foto-convidado.jpg'
            formData.append('foto', blob, filename)
          }
        } catch (fetchErr) {
          console.warn(
            'Não foi possível clonar foto do convidado para depoimento público:',
            fetchErr,
          )
        }
      }

      await pb.collection('depoimentos').create(formData)

      toast.success(`Depoimento de "${item.nome}" aprovado e publicado com sucesso no site!`)
      setModalRecebidoOpen(false)
      loadRecebidos()
      loadDepoimentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao aprovar e publicar depoimento.')
    } finally {
      setActionLoading(false)
    }
  }

  // MANTER OCULTA (fica apenas no admin)
  const handleManterOculta = async (item: DepoimentoConvidadoRecord) => {
    try {
      setActionLoading(true)
      await pb.collection('depoimentos_convidados').update(item.id, {
        status: 'oculta',
        visualizado: true,
      })
      toast.info(
        `Depoimento de "${item.nome}" mantido oculto (visível apenas no painel administrativo).`,
      )
      setModalRecebidoOpen(false)
      loadRecebidos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao ocultar depoimento.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRecebido = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o depoimento recebido de "${name}"?`))
      return
    try {
      await pb.collection('depoimentos_convidados').delete(id)
      toast.success('Envio excluído com sucesso!')
      if (modalRecebidoOpen && selectedRecebido?.id === id) {
        setModalRecebidoOpen(false)
      }
      loadRecebidos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir envio.')
    }
  }

  const handleOpenRecebidoDetails = async (item: DepoimentoConvidadoRecord) => {
    setSelectedRecebido(item)
    setModalRecebidoOpen(true)
    if (!item.visualizado) {
      try {
        await pb.collection('depoimentos_convidados').update(item.id, { visualizado: true })
        setRecebidos((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, visualizado: true } : r)),
        )
      } catch (e) {
        console.error(e)
      }
    }
  }

  const countPendentes = recebidos.filter((r) => r.status === 'pendente').length

  const filteredRecebidos = recebidos.filter((item) => {
    if (filtroStatusRecebidos === 'todos') return true
    return item.status === filtroStatusRecebidos
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Depoimentos & Experiências
          </h2>
          <p className="text-xs text-vinho/70">
            Gerencie os depoimentos exibidos no site e modere os novos envios feitos pelos
            convidados.
          </p>
        </div>

        {activeTab === 'publicados' && (
          <Button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-dourado shrink-0" />
            Novo Depoimento
          </Button>
        )}
      </div>

      {/* Card de Divulgação: Copiar Link do Formulário para Convidados e Portal do Convidado */}
      <div className="bg-gradient-to-r from-vinho via-[#4B1E3F] to-[#36142d] text-marfim rounded-2xl p-4 sm:p-5 border-2 border-dourado/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-dourado/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-[11px] font-bold">
                <Share2 className="w-3 h-3 text-dourado" />
                Divulgue o formulário & Área do Convidado
              </span>
              <span className="text-[11px] text-marfim/70">
                Páginas públicas sem exigência de login
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white">
              Links públicos para enviar ao convidado
            </h3>
            <p className="text-xs text-marfim/80 leading-relaxed font-light">
              Envie o link direto do depoimento ou o portal completo da Área do Convidado (onde ele
              escolhe preencher o depoimento ou acessar futuras etapas do episódio). Nenhum exige
              cadastro ou senha.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
            {/* Linha 1: Link Direto /roteiro */}
            <div className="bg-black/30 border border-dourado/40 rounded-xl p-3 flex flex-col justify-between gap-2.5">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dourado">
                    Link Direto: Roteiro do EP
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-semibold">
                    Novo
                  </span>
                </div>
                <div className="text-xs font-mono text-dourado-light truncate select-all">
                  {publicRoteiroUrl}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={handleCopyRoteiroLink}
                  className="flex-1 bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-xl px-3 py-2 min-h-[38px] shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {copiedRoteiroLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar link</span>
                    </>
                  )}
                </Button>

                <a
                  href={publicRoteiroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-marfim hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 min-h-[38px] transition-colors cursor-pointer"
                  title="Abrir página do roteiro em nova aba"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3.5 h-3.5 text-dourado" />
                </a>
              </div>
            </div>

            {/* Linha 2: Link Direto /depoimento */}
            <div className="bg-black/30 border border-dourado/30 rounded-xl p-3 flex flex-col justify-between gap-2.5">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dourado">
                    Link Direto: Depoimento
                  </span>
                </div>
                <div className="text-xs font-mono text-dourado-light truncate select-all">
                  {publicTestimonialUrl}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-xl px-3 py-2 min-h-[38px] shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar link</span>
                    </>
                  )}
                </Button>

                <a
                  href={publicTestimonialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-marfim hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 min-h-[38px] transition-colors cursor-pointer"
                  title="Abrir página do depoimento em nova aba"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3.5 h-3.5 text-dourado" />
                </a>
              </div>
            </div>

            {/* Linha 3: Portal /convidado */}
            <div className="bg-black/30 border border-dourado/30 rounded-xl p-3 flex flex-col justify-between gap-2.5">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dourado">
                    Portal: Área do Convidado
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-semibold">
                    2 Opções
                  </span>
                </div>
                <div className="text-xs font-mono text-dourado-light truncate select-all">
                  {publicConvidadoUrl}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={handleCopyConvidadoLink}
                  className="flex-1 bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-xl px-3 py-2 min-h-[38px] shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {copiedConvidadoLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar link</span>
                    </>
                  )}
                </Button>

                <a
                  href={publicConvidadoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-marfim hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 min-h-[38px] transition-colors cursor-pointer"
                  title="Abrir Área do Convidado em nova aba"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3.5 h-3.5 text-dourado" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Publicados no Site / Recebidos do Site */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'publicados' | 'recebidos')}
      >
        <TabsList className="bg-white border border-vinho/15 p-1 rounded-2xl w-full sm:w-auto h-auto flex flex-wrap">
          <TabsTrigger
            value="publicados"
            className="data-[state=active]:bg-vinho data-[state=active]:text-white rounded-xl text-xs font-semibold py-2 px-4 transition-all"
          >
            Publicados no Site ({depoimentos.length})
          </TabsTrigger>
          <TabsTrigger
            value="recebidos"
            className="data-[state=active]:bg-vinho data-[state=active]:text-white rounded-xl text-xs font-semibold py-2 px-4 transition-all flex items-center gap-2"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Recebidos do Site</span>
            {countPendentes > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {countPendentes} novo{countPendentes > 1 ? 's' : ''}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: DEPOIMENTOS PUBLICADOS NO SITE */}
        <TabsContent value="publicados" className="space-y-4 pt-2">
          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {loadingDepoimentos ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
                Carregando depoimentos...
              </div>
            ) : depoimentos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-3">
                <p className="text-sm text-vinho/70 font-medium">Nenhum depoimento cadastrado.</p>
                <Button
                  onClick={handleOpenCreate}
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
                >
                  Adicionar primeiro depoimento
                </Button>
              </div>
            ) : (
              depoimentos.map((item) => {
                const photoUrl = item.foto ? getFileUrl(item, item.foto, '100x100') : ''
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={item.nome}
                            className="w-12 h-12 rounded-full object-cover border-2 border-dourado shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-sm shrink-0">
                            {item.nome.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-dourado/20 text-vinho px-1.5 py-0.5 rounded">
                              #{item.ordem || '-'}
                            </span>
                            <h3 className="text-sm font-bold text-vinho">{item.nome}</h3>
                          </div>
                          {item.instagram && (
                            <p className="text-xs text-dourado-dark font-medium mt-0.5">
                              {item.instagram.startsWith('@')
                                ? item.instagram
                                : `@${item.instagram}`}
                            </p>
                          )}
                          {item.link_episodio && (
                            <p className="text-[11px] text-vinho/70 flex items-center gap-1 mt-0.5">
                              <Video className="w-3 h-3 text-red-600 shrink-0" />
                              <span>Episódio vinculado</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-9 w-9 p-0 text-vinho/70 hover:text-vinho min-h-[36px]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.nome)}
                          className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.de_nossa_autoridade ? (
                        <Badge className="bg-vinho text-dourado text-[10px] font-semibold">
                          Visão da Produção
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-vinho border-vinho/20">
                          Depoimento do Convidado
                        </Badge>
                      )}
                    </div>

                    <div className="bg-marfim/60 p-3 rounded-xl border border-vinho/10 space-y-1.5">
                      <p
                        className={`text-xs text-vinho/75 italic leading-relaxed ${
                          expandedTextIds[item.id] ? 'whitespace-pre-line' : 'line-clamp-3'
                        }`}
                      >
                        "{item.texto}"
                      </p>
                      {(item.texto || '').length > 120 && (
                        <button
                          type="button"
                          onClick={() => toggleExpandText(item.id)}
                          className="text-[11px] font-bold text-vinho hover:text-dourado-dark transition-colors cursor-pointer"
                        >
                          {expandedTextIds[item.id] ? 'Ler menos' : 'Ler mais'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
            {loadingDepoimentos ? (
              <div className="py-16 text-center text-xs text-vinho/60">
                Carregando depoimentos...
              </div>
            ) : depoimentos.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm text-vinho/70 font-medium">Nenhum depoimento cadastrado.</p>
                <Button onClick={handleOpenCreate} variant="outline" size="sm">
                  Adicionar primeiro depoimento
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-marfim">
                  <TableRow className="border-b border-vinho/10">
                    <TableHead className="w-16 font-bold text-vinho text-xs">Ordem</TableHead>
                    <TableHead className="w-20 font-bold text-vinho text-xs">Foto</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Nome</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Instagram (@)</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">
                      Episódio (YouTube)
                    </TableHead>
                    <TableHead className="font-bold text-vinho text-xs">
                      Tipo de Depoimento
                    </TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Depoimento</TableHead>
                    <TableHead className="w-28 text-right font-bold text-vinho text-xs">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-vinho/5">
                  {depoimentos.map((item) => {
                    const photoUrl = item.foto ? getFileUrl(item, item.foto, '100x100') : ''
                    return (
                      <TableRow key={item.id} className="hover:bg-vinho/5">
                        <TableCell className="font-bold text-vinho text-xs">
                          #{item.ordem || '-'}
                        </TableCell>
                        <TableCell>
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={item.nome}
                              className="w-10 h-10 rounded-full object-cover border border-dourado"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-xs">
                              {item.nome.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-vinho">{item.nome}</TableCell>
                        <TableCell className="text-xs text-vinho/80">
                          {item.instagram ? (
                            <span className="font-medium text-vinho bg-vinho/5 px-2 py-0.5 rounded border border-vinho/10">
                              {item.instagram.startsWith('@')
                                ? item.instagram
                                : `@${item.instagram}`}
                            </span>
                          ) : (
                            <span className="text-vinho/40 italic">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-vinho/80">
                          {item.link_episodio ? (
                            <a
                              href={item.link_episodio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-vinho hover:text-dourado-dark hover:underline bg-vinho/5 px-2 py-0.5 rounded border border-vinho/10"
                              title={item.link_episodio}
                            >
                              <Video className="w-3 h-3 text-red-600 shrink-0" />
                              <span>Assistir</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-vinho/40 italic">Não vinculado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.de_nossa_autoridade ? (
                            <Badge className="bg-vinho text-dourado text-[10px] font-semibold">
                              Visão da Produção
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-vinho border-vinho/20"
                            >
                              Depoimento do Convidado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-vinho/75 max-w-md">
                          <p
                            className={`italic leading-relaxed ${
                              expandedTextIds[item.id] ? 'whitespace-pre-line' : 'line-clamp-2'
                            }`}
                          >
                            "{item.texto}"
                          </p>
                          {(item.texto || '').length > 100 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandText(item.id)}
                              className="text-[10px] font-bold text-vinho hover:text-dourado-dark transition-colors cursor-pointer mt-0.5 inline-block"
                            >
                              {expandedTextIds[item.id] ? 'Ler menos' : 'Ler mais'}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 p-0 text-vinho/70 hover:text-vinho hover:bg-vinho/10"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.nome)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ABA 2: RECEBIDOS DO SITE (FORMULÁRIO PÚBLICO) */}
        <TabsContent value="recebidos" className="space-y-4 pt-2">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-vinho/10 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setFiltroStatusRecebidos('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatusRecebidos === 'todos'
                    ? 'bg-vinho text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Todos ({recebidos.length})
              </button>
              <button
                onClick={() => setFiltroStatusRecebidos('pendente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatusRecebidos === 'pendente'
                    ? 'bg-amber-600 text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Pendentes ({countPendentes})
              </button>
              <button
                onClick={() => setFiltroStatusRecebidos('aprovada')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatusRecebidos === 'aprovada'
                    ? 'bg-emerald-700 text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Aprovadas ({recebidos.filter((r) => r.status === 'aprovada').length})
              </button>
              <button
                onClick={() => setFiltroStatusRecebidos('oculta')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatusRecebidos === 'oculta'
                    ? 'bg-gray-700 text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Ocultas ({recebidos.filter((r) => r.status === 'oculta').length})
              </button>
            </div>

            <span className="text-[11px] text-vinho/60">
              {filteredRecebidos.length} envio{filteredRecebidos.length === 1 ? '' : 's'} encontrado
              {filteredRecebidos.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Listagem de Depoimentos Recebidos - Mobile Cards */}
          <div className="block md:hidden space-y-3">
            {loadingRecebidos ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
                Carregando envios...
              </div>
            ) : filteredRecebidos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
                Nenhum depoimento encontrado para este filtro.
              </div>
            ) : (
              filteredRecebidos.map((item) => {
                const photoUrl = item.foto ? getFileUrl(item, item.foto, '120x120') : ''
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={item.nome}
                            className="w-12 h-12 rounded-full object-cover border-2 border-dourado shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-sm shrink-0">
                            {item.nome.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-vinho">{item.nome}</h3>
                          {item.empresa && (
                            <p className="text-[11px] text-vinho/70 flex items-center gap-1">
                              <Building className="w-3 h-3 text-dourado shrink-0" />
                              <span>{item.empresa}</span>
                            </p>
                          )}
                          <p className="text-xs text-dourado-dark font-medium">
                            {item.instagram.startsWith('@') ? item.instagram : `@${item.instagram}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRecebidoDetails(item)}
                          className="h-9 w-9 p-0 text-vinho/70 hover:text-vinho min-h-[36px]"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecebido(item.id, item.nome)}
                          className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {item.status === 'pendente' && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                            Pendente
                          </Badge>
                        )}
                        {item.status === 'aprovada' && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                            Aprovada & Publicada
                          </Badge>
                        )}
                        {item.status === 'oculta' && (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-[10px]">
                            Oculta
                          </Badge>
                        )}

                        <span className="text-[10px] text-vinho/60">
                          {item.autoriza_publicacao ? '✓ Autoriza' : '✗ Não autoriza'}
                        </span>
                      </div>

                      <span className="text-[11px] text-vinho/60">
                        {formatDateBR(item.created)}
                      </span>
                    </div>

                    <div className="bg-marfim/60 p-3 rounded-xl border border-vinho/10 space-y-1.5">
                      <p
                        className={`text-xs text-vinho/75 italic leading-relaxed ${
                          expandedTextIds[`rec_${item.id}`] ? 'whitespace-pre-line' : 'line-clamp-3'
                        }`}
                      >
                        "{item.texto}"
                      </p>
                      {(item.texto || '').length > 120 && (
                        <button
                          type="button"
                          onClick={() => toggleExpandText(`rec_${item.id}`)}
                          className="text-[11px] font-bold text-vinho hover:text-dourado-dark transition-colors cursor-pointer"
                        >
                          {expandedTextIds[`rec_${item.id}`] ? 'Ler menos' : 'Ler mais'}
                        </button>
                      )}
                    </div>

                    {/* Botões rápidos de aprovação no card mobile */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-vinho/5">
                      <Button
                        size="sm"
                        disabled={actionLoading || item.status === 'aprovada'}
                        onClick={() => handleAprovarEPublicar(item)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] h-9 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Aprovar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading || item.status === 'oculta'}
                        onClick={() => handleManterOculta(item)}
                        className="border-vinho/20 text-vinho text-[11px] h-9 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar</span>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Listagem Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
            {loadingRecebidos ? (
              <div className="py-16 text-center text-xs text-vinho/60">Carregando envios...</div>
            ) : filteredRecebidos.length === 0 ? (
              <div className="py-16 text-center text-xs text-vinho/60">
                Nenhum depoimento encontrado para o filtro selecionado.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-marfim">
                  <TableRow className="border-b border-vinho/10">
                    <TableHead className="w-16 font-bold text-vinho text-xs">Foto</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">
                      Convidado / Empresa
                    </TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Instagram (@)</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Autorização</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Status</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Data</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Depoimento</TableHead>
                    <TableHead className="w-48 text-right font-bold text-vinho text-xs">
                      Ações de Moderação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-vinho/5">
                  {filteredRecebidos.map((item) => {
                    const photoUrl = item.foto ? getFileUrl(item, item.foto, '100x100') : ''
                    return (
                      <TableRow key={item.id} className="hover:bg-vinho/5">
                        <TableCell>
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={item.nome}
                              className="w-10 h-10 rounded-full object-cover border border-dourado cursor-pointer"
                              onClick={() => handleOpenRecebidoDetails(item)}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-xs">
                              {item.nome.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-vinho">
                          {item.nome}
                          {item.empresa && (
                            <span className="block text-[11px] font-normal text-vinho/70">
                              {item.empresa}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-dourado-dark">
                          {item.instagram.startsWith('@') ? item.instagram : `@${item.instagram}`}
                        </TableCell>
                        <TableCell>
                          {item.autoriza_publicacao ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Autorizada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Apenas Feedback
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.status === 'pendente' && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                              Pendente
                            </Badge>
                          )}
                          {item.status === 'aprovada' && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                              Aprovada
                            </Badge>
                          )}
                          {item.status === 'oculta' && (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-300 text-[10px]">
                              Oculta
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] text-vinho/60 whitespace-nowrap">
                          {formatDateBR(item.created)}
                        </TableCell>
                        <TableCell className="text-xs text-vinho/75 max-w-xs">
                          <p
                            className={`italic leading-relaxed ${
                              expandedTextIds[`rec_${item.id}`]
                                ? 'whitespace-pre-line'
                                : 'line-clamp-2'
                            }`}
                          >
                            "{item.texto}"
                          </p>
                          {(item.texto || '').length > 80 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandText(`rec_${item.id}`)}
                              className="text-[10px] font-bold text-vinho hover:text-dourado-dark transition-colors cursor-pointer mt-0.5 inline-block"
                            >
                              {expandedTextIds[`rec_${item.id}`] ? 'Ler menos' : 'Ler mais'}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRecebidoDetails(item)}
                            className="h-8 w-8 p-0 text-vinho/70 hover:text-vinho"
                            title="Ver detalhes completos"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            disabled={actionLoading || item.status === 'aprovada'}
                            onClick={() => handleAprovarEPublicar(item)}
                            className="h-7 px-2.5 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                            title="Aprovar e publicar no site"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprovar
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading || item.status === 'oculta'}
                            onClick={() => handleManterOculta(item)}
                            className="h-7 px-2.5 text-[11px] border-vinho/20 text-vinho hover:bg-vinho/5 rounded-lg"
                            title="Manter oculta (apenas no painel)"
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            Ocultar
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecebido(item.id, item.nome)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Excluir envio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Formulário Criar / Editar Depoimento Publicado */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Depoimento' : 'Novo Depoimento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="dep-nome" className="text-xs font-semibold text-vinho">
                Nome do Convidado ou Entrevistado *
              </Label>
              <Input
                id="dep-nome"
                required
                placeholder="Ex.: Juliana Martins"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-ordem" className="text-xs font-semibold text-vinho">
                Ordem de Exibição
              </Label>
              <Input
                id="dep-ordem"
                type="number"
                min="1"
                max="50"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-instagram" className="text-xs font-semibold text-vinho">
                Instagram (@) <span className="text-vinho/60 font-normal">(opcional)</span>
              </Label>
              <Input
                id="dep-instagram"
                placeholder="Ex.: @convidado ou instagram.com/convidado"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
              <p className="text-[10px] text-vinho/60">
                Aceita @usuario, usuario ou URL completa. Será exibido no card do convidado se
                informado.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-link-episodio" className="text-xs font-semibold text-vinho">
                Link do episódio (YouTube){' '}
                <span className="text-vinho/60 font-normal">(opcional)</span>
              </Label>
              <Input
                id="dep-link-episodio"
                type="url"
                placeholder="Ex.: https://youtu.be/... ou https://www.youtube.com/watch?v=..."
                value={linkEpisodio}
                onChange={(e) => setLinkEpisodio(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
              <p className="text-[10px] text-vinho/60">
                Opcional. Se informado, exibirá o botão "Clique e assista ao episódio completo" no
                card do depoimento na página inicial.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-vinho/15">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-vinho cursor-pointer">
                  Depoimento de Nossa Autoria
                </Label>
                <p className="text-[10px] text-vinho/65">
                  Marque caso seja um depoimento da equipe sobre como foi entrevistar essa pessoa.
                </p>
              </div>
              <Switch checked={deNossaAutoridade} onCheckedChange={setDeNossaAutoridade} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-texto" className="text-xs font-semibold text-vinho">
                Texto do Depoimento *
              </Label>
              <Textarea
                id="dep-texto"
                required
                rows={4}
                placeholder="Descreva a experiência, sensações e impacto da participação..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-vinho">
                  Foto do Convidado {editingItem ? '(Opcional)' : ''}
                </Label>
                {editingItem && (
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Deixe vazio para manter a foto atual
                  </span>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                className="bg-white border-vinho/20 text-xs"
              />
              {editingItem && editingItem.foto && !fotoFile && (
                <p className="text-[11px] text-vinho/65">Foto atual preservada no registro.</p>
              )}
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
                {saving ? 'Salvando...' : 'Salvar Depoimento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Detalhes do Depoimento Recebido do Formulário Público */}
      <Dialog open={modalRecebidoOpen} onOpenChange={setModalRecebidoOpen}>
        <DialogContent className="w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-7 rounded-2xl">
          {selectedRecebido && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedRecebido.foto ? (
                      <img
                        src={getFileUrl(selectedRecebido, selectedRecebido.foto)}
                        alt={selectedRecebido.nome}
                        className="w-14 h-14 rounded-full object-cover border-2 border-dourado shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-base">
                        {selectedRecebido.nome.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-vinho">
                        {selectedRecebido.nome}
                      </DialogTitle>
                      {selectedRecebido.empresa && (
                        <p className="text-xs text-vinho/70 font-medium">
                          {selectedRecebido.empresa}
                        </p>
                      )}
                      <p className="text-xs text-dourado-dark font-semibold">
                        {selectedRecebido.instagram.startsWith('@')
                          ? selectedRecebido.instagram
                          : `@${selectedRecebido.instagram}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    {selectedRecebido.status === 'pendente' && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                        Pendente
                      </Badge>
                    )}
                    {selectedRecebido.status === 'aprovada' && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        Aprovada
                      </Badge>
                    )}
                    {selectedRecebido.status === 'oculta' && (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-300">Oculta</Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Informações detalhadas */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-vinho/10 text-xs">
                <div>
                  <span className="text-vinho/60 font-semibold block">Data do Envio:</span>
                  <span className="font-bold text-vinho">
                    {formatDateBR(selectedRecebido.created)}
                  </span>
                </div>
                <div>
                  <span className="text-vinho/60 font-semibold block">Autorização no Site:</span>
                  <span
                    className={`font-bold ${
                      selectedRecebido.autoriza_publicacao ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    {selectedRecebido.autoriza_publicacao
                      ? 'SIM (autorizado)'
                      : 'NÃO (apenas interno)'}
                  </span>
                </div>
              </div>

              {/* Texto do Depoimento */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-vinho uppercase tracking-wider block">
                  Depoimento sobre a Experiência
                </Label>
                <div className="p-4 rounded-xl bg-white border border-vinho/10 text-xs sm:text-sm text-vinho/85 leading-relaxed whitespace-pre-line italic">
                  "{selectedRecebido.texto}"
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-vinho/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRecebido(selectedRecebido.id, selectedRecebido.nome)}
                  className="border-red-200 text-red-600 hover:bg-red-50 text-xs min-h-[44px]"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Excluir Envio
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading || selectedRecebido.status === 'oculta'}
                    onClick={() => handleManterOculta(selectedRecebido)}
                    className="border-vinho/20 text-vinho hover:bg-vinho/10 text-xs min-h-[44px] flex-1 sm:flex-none"
                  >
                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                    Manter Oculta
                  </Button>

                  <Button
                    size="sm"
                    disabled={actionLoading || selectedRecebido.status === 'aprovada'}
                    onClick={() => handleAprovarEPublicar(selectedRecebido)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs min-h-[44px] flex-1 sm:flex-none"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Aprovar e Publicar no Site
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
