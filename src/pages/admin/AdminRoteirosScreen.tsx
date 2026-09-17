import React, { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { getFileUrl, formatDateBR } from '@/lib/formatters'
import type { RoteiroConvidadoRecord, RoteiroConvidadoStatus } from '@/types/database'
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Sparkles,
  Bot,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Eye,
  CheckCircle2,
  Archive,
  Download,
  Upload,
  Heart,
  Coffee,
  AlertTriangle,
  Building,
  User,
  Users,
  ShieldCheck,
  Save,
  Trash2,
  RefreshCw,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

export default function AdminRoteirosScreen() {
  const { isMaster, isGerencial } = useAuth()
  const [roteiros, setRoteiros] = useState<RoteiroConvidadoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'roteiros' | 'assistente'>('roteiros')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Copiar links
  const [copiedRoteiroLink, setCopiedRoteiroLink] = useState(false)
  const publicRoteiroUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/roteiro` : '/roteiro'

  const handleCopyRoteiroLink = async () => {
    try {
      await navigator.clipboard.writeText(publicRoteiroUrl)
      setCopiedRoteiroLink(true)
      toast.success('Link do formulário copiado com sucesso!')
      setTimeout(() => setCopiedRoteiroLink(false), 3000)
    } catch {
      toast.error('Erro ao copiar link.')
    }
  }

  // Modal de Detalhes
  const [selectedRoteiro, setSelectedRoteiro] = useState<RoteiroConvidadoRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Edição do roteiro pronto (texto e arquivo)
  const [roteiroTexto, setRoteiroTexto] = useState('')
  const [roteiroArquivo, setRoteiroArquivo] = useState<File | null>(null)
  const [savingRoteiro, setSavingRoteiro] = useState(false)
  const fileUploadRef = useRef<HTMLInputElement>(null)

  // Assistente de IA
  const [aiSelectedId, setAiSelectedId] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResultado, setAiResultado] = useState<string>('')
  const [aiAgenteUsado, setAiAgenteUsado] = useState<string>('')
  const [aiSavingToGuest, setAiSavingToGuest] = useState(false)

  const loadRoteiros = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('roteiros_convidados').getFullList<RoteiroConvidadoRecord>({
        sort: '-created',
      })
      setRoteiros(list)

      // Se houver um selecionado, sincronizar dados atualizados
      if (selectedRoteiro) {
        const updated = list.find((r) => r.id === selectedRoteiro.id)
        if (updated) {
          setSelectedRoteiro(updated)
          setRoteiroTexto(updated.roteiro_final_texto || '')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar roteiros dos convidados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoteiros()
  }, [])

  // Inscrição Realtime
  useEffect(() => {
    let unsub: (() => void) | undefined
    pb.collection('roteiros_convidados')
      .subscribe('*', () => {
        loadRoteiros()
      })
      .then((fn) => {
        unsub = fn
      })
      .catch(() => {})

    return () => {
      if (unsub) unsub()
    }
  }, [])

  const handleOpenDetails = async (item: RoteiroConvidadoRecord) => {
    setSelectedRoteiro(item)
    setRoteiroTexto(item.roteiro_final_texto || '')
    setRoteiroArquivo(null)
    setModalOpen(true)

    // Se ainda não estiver visualizado, marcar como visualizado
    if (!item.visualizado) {
      try {
        await pb.collection('roteiros_convidados').update(item.id, { visualizado: true })
        setRoteiros((prev) => prev.map((r) => (r.id === item.id ? { ...r, visualizado: true } : r)))
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleMudarStatus = async (
    id: string,
    novoStatus: RoteiroConvidadoStatus,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation()
    try {
      setActionLoading(true)
      await pb.collection('roteiros_convidados').update(id, {
        status: novoStatus,
        visualizado: true,
      })
      toast.success(
        novoStatus === 'lida'
          ? 'Roteiro marcado como lido!'
          : novoStatus === 'arquivada'
            ? 'Roteiro arquivado com sucesso!'
            : 'Status atualizado para pendente.',
      )
      loadRoteiros()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar status do roteiro.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSalvarRoteiroPronto = async () => {
    if (!selectedRoteiro) return
    try {
      setSavingRoteiro(true)
      const formData = new FormData()
      formData.append('roteiro_final_texto', roteiroTexto)
      if (roteiroArquivo) {
        formData.append('roteiro_final_arquivo', roteiroArquivo)
      }

      await pb.collection('roteiros_convidados').update(selectedRoteiro.id, formData)
      toast.success('Roteiro final do episódio salvo com sucesso no registro!')
      setRoteiroArquivo(null)
      loadRoteiros()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar roteiro.')
    } finally {
      setSavingRoteiro(false)
    }
  }

  const handleDelete = async (id: string, nome: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!window.confirm(`Tem certeza que deseja excluir o roteiro de "${nome}"?`)) return

    try {
      await pb.collection('roteiros_convidados').delete(id)
      toast.success('Roteiro excluído com sucesso!')
      if (modalOpen && selectedRoteiro?.id === id) {
        setModalOpen(false)
      }
      loadRoteiros()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir roteiro.')
    }
  }

  // Gerar roteiro com Assistente IA
  const handleGerarComIA = async (overrideId?: string) => {
    const targetId = overrideId || aiSelectedId
    if (!targetId) {
      toast.error('Selecione um convidado para gerar a sugestão de roteiro.')
      return
    }

    try {
      setAiLoading(true)
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/roteiro-assistente`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({ roteiro_id: targetId }),
        },
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar sugestão com IA')
      }

      setAiResultado(data.roteiroSugerido)
      setAiAgenteUsado(data.agenteUsado)
      toast.success('Sugestão de roteiro gerada com sucesso pela IA do CoffeeCast 4.0!')
    } catch (err: unknown) {
      console.error(err)
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Erro ao gerar roteiro com IA.'
      toast.error(msg)
    } finally {
      setAiLoading(false)
    }
  }

  // Salvar resultado da IA diretamente no registro do convidado
  const handleSalvarAiNoRegistro = async () => {
    const targetId = aiSelectedId || selectedRoteiro?.id
    if (!targetId || !aiResultado) return

    try {
      setAiSavingToGuest(true)
      await pb.collection('roteiros_convidados').update(targetId, {
        roteiro_final_texto: aiResultado,
      })
      toast.success('Sugestão de roteiro salva no registro do convidado com sucesso!')
      loadRoteiros()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar sugestão no registro.')
    } finally {
      setAiSavingToGuest(false)
    }
  }

  const countPendentes = roteiros.filter((r) => r.status === 'pendente').length
  const countLidas = roteiros.filter((r) => r.status === 'lida').length
  const countArquivadas = roteiros.filter((r) => r.status === 'arquivada').length

  const filteredRoteiros = roteiros.filter((item) => {
    if (filtroStatus === 'todos') return true
    return item.status === filtroStatus
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
              Roteiros e Apresentações
            </h2>
            {countPendentes > 0 && (
              <Badge className="bg-amber-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                {countPendentes} novo{countPendentes > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-vinho/70 mt-0.5">
            Gerencie os roteiros e pautas preenchidos pelos convidados, anexe o roteiro pronto e
            conte com o Assistente IA do CoffeeCast 4.0.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleCopyRoteiroLink}
            variant="outline"
            className="border-vinho/20 text-vinho hover:bg-vinho hover:text-white text-xs font-semibold rounded-xl min-h-[44px] flex items-center gap-2"
          >
            {copiedRoteiroLink ? (
              <>
                <Check className="w-4 h-4 stroke-[3] text-dourado" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-dourado-dark" />
                <span>Copiar Link do Formulário</span>
              </>
            )}
          </Button>

          <a
            href={publicRoteiroUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-vinho hover:bg-vinho/10 border border-vinho/20 min-h-[44px] transition-colors"
            title="Abrir formulário de roteiro em nova aba"
          >
            <span>Abrir Página</span>
            <ExternalLink className="w-3.5 h-3.5 text-dourado-dark" />
          </a>
        </div>
      </div>

      {/* Card de Divulgação do Link */}
      <div className="bg-gradient-to-r from-vinho via-[#4B1E3F] to-[#36142d] text-marfim rounded-2xl p-4 sm:p-5 border-2 border-dourado/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-dourado/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-[11px] font-bold">
                <Share2 className="w-3 h-3 text-dourado" />
                Link público para o convidado
              </span>
              <span className="text-[11px] text-marfim/70">Sem login ou senha</span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white">
              Envie o link de preparação para a convidada ou convidado
            </h3>
            <p className="text-xs text-marfim/80 leading-relaxed font-light">
              Ele preenche nome, família, empresa, tema preferido, temas sensíveis e envia a foto
              para divulgação oficial.
            </p>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2 bg-black/30 border border-dourado/30 rounded-xl p-2 shrink-0">
            <span className="text-xs font-mono text-dourado-light px-2 truncate max-w-[200px] sm:max-w-[280px]">
              {publicRoteiroUrl}
            </span>
            <Button
              type="button"
              onClick={handleCopyRoteiroLink}
              size="sm"
              className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs rounded-lg px-3 min-h-[36px]"
            >
              {copiedRoteiroLink ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs: Roteiros Enviados / Assistente IA */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'roteiros' | 'assistente')}
      >
        <TabsList className="bg-white border border-vinho/15 p-1 rounded-2xl w-full sm:w-auto h-auto flex flex-wrap">
          <TabsTrigger
            value="roteiros"
            className="data-[state=active]:bg-vinho data-[state=active]:text-white rounded-xl text-xs font-semibold py-2 px-4 transition-all flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-dourado" />
            <span>Roteiros Enviados ({roteiros.length})</span>
            {countPendentes > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {countPendentes} novo{countPendentes > 1 ? 's' : ''}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="assistente"
            className="data-[state=active]:bg-vinho data-[state=active]:text-white rounded-xl text-xs font-semibold py-2 px-4 transition-all flex items-center gap-2"
          >
            <Bot className="w-3.5 h-3.5 text-dourado" />
            <span>Assistente IA do Roteirista</span>
            <Sparkles className="w-3 h-3 text-dourado" />
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: LISTAGEM DE ROTEIROS */}
        <TabsContent value="roteiros" className="space-y-4 pt-2">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-vinho/10 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setFiltroStatus('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatus === 'todos'
                    ? 'bg-vinho text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Todos ({roteiros.length})
              </button>
              <button
                onClick={() => setFiltroStatus('pendente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatus === 'pendente'
                    ? 'bg-amber-600 text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Pendentes ({countPendentes})
              </button>
              <button
                onClick={() => setFiltroStatus('lida')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatus === 'lida'
                    ? 'bg-emerald-700 text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Lidos ({countLidas})
              </button>
              <button
                onClick={() => setFiltroStatus('arquivada')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroStatus === 'arquivada'
                    ? 'bg-slate-600 text-white'
                    : 'text-vinho/70 hover:bg-vinho/5'
                }`}
              >
                Arquivados ({countArquivadas})
              </button>
            </div>
          </div>

          {/* Cards Mobile */}
          <div className="block md:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
                Carregando roteiros...
              </div>
            ) : filteredRoteiros.length === 0 ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-vinho/40 mx-auto" />
                <p className="text-sm font-bold text-vinho">Nenhum roteiro encontrado</p>
                <p className="text-xs text-vinho/60">
                  Envie o link do formulário para os seus convidados.
                </p>
              </div>
            ) : (
              filteredRoteiros.map((item) => {
                const photoUrl = item.foto ? getFileUrl(item, item.foto, '100x100') : ''
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDetails(item)}
                    className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3 cursor-pointer hover:border-dourado/60 transition-all"
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
                          <h4 className="font-bold text-sm text-vinho">{item.nome}</h4>
                          <p className="text-[11px] text-vinho/70">
                            {item.tem_empresa && item.nome_empresa
                              ? item.nome_empresa
                              : item.estado_civil}
                          </p>
                          <span className="text-[10px] text-vinho/50 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDateBR(item.created)}
                          </span>
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] font-bold ${
                          item.status === 'pendente'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : item.status === 'lida'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {item.status === 'pendente'
                          ? 'Pendente'
                          : item.status === 'lida'
                            ? 'Lida'
                            : 'Arquivada'}
                      </Badge>
                    </div>

                    {item.tema_enfatizar && (
                      <p className="text-xs text-vinho/80 bg-marfim/60 p-2.5 rounded-xl border border-vinho/10 line-clamp-2 italic">
                        Tema: "{item.tema_enfatizar}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-vinho/5">
                      <span className="text-[11px] text-dourado-dark font-medium flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Ver respostas completas
                      </span>

                      {item.roteiro_final_texto && (
                        <Badge className="bg-dourado/20 text-vinho border border-dourado/40 text-[9px]">
                          Roteiro Pronto Anexado
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Tabela Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-vinho/60">Carregando roteiros...</div>
            ) : filteredRoteiros.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <FileText className="w-10 h-10 text-vinho/30 mx-auto" />
                <h3 className="text-sm font-bold text-vinho">Nenhum roteiro encontrado</h3>
                <p className="text-xs text-vinho/60">
                  Divulgue o link público para as convidadas e convidados preencherem.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-marfim">
                  <TableRow className="border-b border-vinho/10">
                    <TableHead className="w-16 font-bold text-vinho text-xs">Foto</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Convidado(a)</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Data de Envio</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">
                      Empresa / Negócio
                    </TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Tema Desejado</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Roteiro Final</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Status</TableHead>
                    <TableHead className="w-36 text-right font-bold text-vinho text-xs">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-vinho/5">
                  {filteredRoteiros.map((item) => {
                    const photoUrl = item.foto ? getFileUrl(item, item.foto, '100x100') : ''
                    return (
                      <TableRow
                        key={item.id}
                        onClick={() => handleOpenDetails(item)}
                        className="hover:bg-vinho/5 cursor-pointer"
                      >
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
                        <TableCell>
                          <div className="font-bold text-xs text-vinho">{item.nome}</div>
                          <div className="text-[11px] text-vinho/60">{item.estado_civil}</div>
                        </TableCell>
                        <TableCell className="text-xs text-vinho/80 whitespace-nowrap">
                          {formatDateBR(item.created)}
                        </TableCell>
                        <TableCell className="text-xs text-vinho/80">
                          {item.tem_empresa && item.nome_empresa ? (
                            <span className="font-medium text-vinho bg-vinho/5 px-2 py-0.5 rounded border border-vinho/10">
                              {item.nome_empresa}
                            </span>
                          ) : (
                            <span className="text-vinho/40 italic">Não tem</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-vinho/80 max-w-xs truncate">
                          {item.tema_enfatizar || (
                            <span className="text-vinho/40 italic">Geral</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.roteiro_final_texto || item.roteiro_final_arquivo ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                              Pronto
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-vinho/50 italic">Pendente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-bold ${
                              item.status === 'pendente'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : item.status === 'lida'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {item.status === 'pendente'
                              ? 'Pendente'
                              : item.status === 'lida'
                                ? 'Lida'
                                : 'Arquivada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {item.status !== 'lida' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => handleMudarStatus(item.id, 'lida', e)}
                                className="h-8 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                                title="Marcar como lida"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {item.status !== 'arquivada' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => handleMudarStatus(item.id, 'arquivada', e)}
                                className="h-8 px-2 text-xs text-slate-600 hover:bg-slate-100"
                                title="Arquivar"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleDelete(item.id, item.nome, e)}
                              className="h-8 px-2 text-xs text-red-600 hover:bg-red-50"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ABA 2: ASSISTENTE IA NATIVO */}
        <TabsContent value="assistente" className="space-y-5 pt-2">
          <div className="bg-white rounded-3xl border-2 border-dourado/50 p-6 sm:p-8 shadow-md relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-vinho/10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dourado/15 border border-dourado/40 text-vinho text-xs font-semibold">
                  <Bot className="w-4 h-4 text-dourado" />
                  <span>Agente Inteligente do CoffeeCast 4.0</span>
                  <Sparkles className="w-3 h-3 text-dourado" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
                  Assistente de Roteiro & Apresentação com IA
                </h3>
                <p className="text-xs sm:text-sm text-vinho/70 max-w-2xl">
                  Selecione um convidado que enviou suas respostas. O agente analisará a biografia,
                  família, empresa, tema preferido e respeitará rigorosamente temas sensíveis a
                  evitar, gerando uma bio de apresentação e um roteiro completo em blocos de
                  perguntas.
                </p>
              </div>
            </div>

            {/* Seleção do Convidado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="ai-guest-select" className="text-xs font-bold text-vinho">
                  Selecione o(a) Convidado(a) *
                </Label>
                <select
                  id="ai-guest-select"
                  value={aiSelectedId}
                  onChange={(e) => {
                    setAiSelectedId(e.target.value)
                    setAiResultado('')
                  }}
                  className="w-full bg-marfim/50 border border-vinho/20 focus:ring-2 focus:ring-dourado text-sm rounded-xl px-3 py-2.5 min-h-[44px] text-vinho"
                >
                  <option value="">Selecione um convidado da lista...</option>
                  {roteiros.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome} — {formatDateBR(r.created)}{' '}
                      {r.tem_empresa ? `(${r.nome_empresa})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => handleGerarComIA()}
                  disabled={!aiSelectedId || aiLoading}
                  className="w-full bg-vinho hover:bg-vinho-light text-white font-bold text-xs sm:text-sm py-2.5 min-h-[44px] rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-dourado" />
                      <span>Gerando Roteiro com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-dourado" />
                      <span>Gerar sugestão de roteiro com IA</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Caixa de Resultado Editável */}
            {aiResultado && (
              <div className="mt-6 pt-6 border-t border-vinho/10 space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-vinho uppercase tracking-wider">
                      Sugestão Gerada pelo Assistente
                    </span>
                    {aiAgenteUsado && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                        {aiAgenteUsado === 'native-agent'
                          ? 'Agente Nativo Ativo'
                          : 'Modelo Fast Ativo'}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(aiResultado)
                        toast.success('Roteiro copiado para a área de transferência!')
                      }}
                      className="text-xs h-9 border-vinho/20 text-vinho hover:bg-vinho/10"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1 text-dourado-dark" />
                      Copiar Texto
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSalvarAiNoRegistro}
                      disabled={aiSavingToGuest}
                      className="text-xs h-9 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      {aiSavingToGuest ? 'Salvando...' : 'Salvar no Registro do Convidado'}
                    </Button>
                  </div>
                </div>

                <Textarea
                  rows={16}
                  value={aiResultado}
                  onChange={(e) => setAiResultado(e.target.value)}
                  className="bg-marfim/60 border-vinho/20 focus-visible:ring-dourado font-mono text-xs sm:text-sm rounded-2xl p-4 leading-relaxed text-vinho shadow-inner"
                />
                <p className="text-[11px] text-vinho/60 italic">
                  Você pode editar o texto acima à vontade antes de salvá-lo ou copiá-lo para a
                  produção.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL DE DETALHES DO ROTEIRO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado p-6 sm:p-8 rounded-3xl">
          {selectedRoteiro && (
            <div className="space-y-6">
              <DialogHeader className="border-b border-vinho/15 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedRoteiro.foto ? (
                      <img
                        src={getFileUrl(selectedRoteiro, selectedRoteiro.foto, '120x120')}
                        alt={selectedRoteiro.nome}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-dourado shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-vinho text-dourado font-bold flex items-center justify-center text-lg">
                        {selectedRoteiro.nome.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-vinho">
                        {selectedRoteiro.nome}
                      </DialogTitle>
                      <p className="text-xs text-vinho/70">
                        Enviado em {formatDateBR(selectedRoteiro.created)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs font-bold px-3 py-1 ${
                        selectedRoteiro.status === 'pendente'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : selectedRoteiro.status === 'lida'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {selectedRoteiro.status === 'pendente'
                        ? 'Pendente'
                        : selectedRoteiro.status === 'lida'
                          ? 'Lida'
                          : 'Arquivada'}
                    </Badge>

                    {selectedRoteiro.status !== 'lida' && (
                      <Button
                        size="sm"
                        onClick={() => handleMudarStatus(selectedRoteiro.id, 'lida')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl h-9"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Marcar Lida
                      </Button>
                    )}

                    {selectedRoteiro.status !== 'arquivada' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMudarStatus(selectedRoteiro.id, 'arquivada')}
                        className="border-vinho/20 text-vinho hover:bg-vinho/10 text-xs font-bold rounded-xl h-9"
                      >
                        <Archive className="w-3.5 h-3.5 mr-1" /> Arquivar
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* GRID DE RESPOSTAS COMPLETAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados Pessoais */}
                <div className="bg-white p-4 rounded-2xl border border-vinho/10 space-y-2 shadow-2xs">
                  <h4 className="font-serif font-bold text-sm text-vinho flex items-center gap-2 border-b border-vinho/10 pb-1.5">
                    <User className="w-4 h-4 text-dourado" /> Dados Pessoais
                  </h4>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong className="text-vinho">Data de Nascimento:</strong>{' '}
                      <span className="text-vinho/80">{selectedRoteiro.data_nascimento}</span>
                    </p>
                    <p>
                      <strong className="text-vinho">Estado Civil:</strong>{' '}
                      <span className="text-vinho/80">{selectedRoteiro.estado_civil}</span>
                    </p>
                    <p>
                      <strong className="text-vinho">Cônjuge:</strong>{' '}
                      <span className="text-vinho/80">
                        {selectedRoteiro.tem_conjuge && selectedRoteiro.nome_conjuge
                          ? `Sim — ${selectedRoteiro.nome_conjuge}`
                          : 'Não tem / Não informado'}
                      </span>
                    </p>
                    <p>
                      <strong className="text-vinho">Filhos:</strong>{' '}
                      <span className="text-vinho/80">
                        {selectedRoteiro.tem_filhos
                          ? `Sim (${selectedRoteiro.quantidade_filhos} filhos: ${selectedRoteiro.nomes_filhos})`
                          : 'Não tem filhos'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Empresa & Negócio */}
                <div className="bg-white p-4 rounded-2xl border border-vinho/10 space-y-2 shadow-2xs">
                  <h4 className="font-serif font-bold text-sm text-vinho flex items-center gap-2 border-b border-vinho/10 pb-1.5">
                    <Building className="w-4 h-4 text-dourado" /> Empresa & Negócio
                  </h4>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong className="text-vinho">Possui empresa?</strong>{' '}
                      <span className="text-vinho/80">
                        {selectedRoteiro.tem_empresa ? 'Sim' : 'Não'}
                      </span>
                    </p>
                    {selectedRoteiro.tem_empresa && (
                      <>
                        <p>
                          <strong className="text-vinho">Nome da Empresa:</strong>{' '}
                          <span className="text-vinho/80">{selectedRoteiro.nome_empresa}</span>
                        </p>
                        {selectedRoteiro.sobre_empresa && (
                          <p className="text-vinho/75 italic bg-marfim/60 p-2 rounded-lg border border-vinho/5">
                            "{selectedRoteiro.sobre_empresa}"
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Temas da Entrevista */}
                <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-vinho/10 space-y-3 shadow-2xs">
                  <h4 className="font-serif font-bold text-sm text-vinho flex items-center gap-2 border-b border-vinho/10 pb-1.5">
                    <FileText className="w-4 h-4 text-dourado" /> Temas e Preferências para a
                    Entrevista
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-vinho block mb-0.5">
                        Tema mais desejado para enfatizar:
                      </strong>
                      <p className="text-vinho/85 bg-marfim/60 p-2.5 rounded-xl border border-vinho/10">
                        {selectedRoteiro.tema_enfatizar || 'Não especificado (aberto à condução)'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <strong className="text-vinho">Temas sensíveis a EVITAR:</strong>
                      </div>
                      {selectedRoteiro.tem_tema_sensivel &&
                      selectedRoteiro.tema_sensivel_detalhes ? (
                        <p className="text-red-900 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                          ATENÇÃO PRODUÇÃO: "{selectedRoteiro.tema_sensivel_detalhes}"
                        </p>
                      ) : (
                        <p className="text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[11px]">
                          Nenhum tema sensível declarado (conversa livre).
                        </p>
                      )}
                    </div>

                    {selectedRoteiro.biografia && (
                      <div>
                        <strong className="text-vinho block mb-0.5">
                          Biografia / Trajetória enviada:
                        </strong>
                        <p className="text-vinho/80 bg-marfim/60 p-3 rounded-xl border border-vinho/10 leading-relaxed whitespace-pre-wrap">
                          {selectedRoteiro.biografia}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arquivos e Fotos */}
                <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-vinho/10 space-y-3 shadow-2xs">
                  <h4 className="font-serif font-bold text-sm text-vinho flex items-center gap-2 border-b border-vinho/10 pb-1.5">
                    <Upload className="w-4 h-4 text-dourado" /> Fotos, Logomarca & Autorização
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Foto Convidado */}
                    <div className="space-y-1.5 text-center sm:text-left">
                      <span className="text-[11px] font-bold text-vinho block">
                        Foto Oficial do Convidado
                      </span>
                      {selectedRoteiro.foto ? (
                        <div>
                          <a
                            href={getFileUrl(selectedRoteiro, selectedRoteiro.foto)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getFileUrl(selectedRoteiro, selectedRoteiro.foto, '300x300')}
                              alt={selectedRoteiro.nome}
                              className="w-32 h-32 rounded-2xl object-cover border-2 border-dourado shadow-sm hover:scale-102 transition-transform"
                            />
                          </a>
                          <a
                            href={getFileUrl(selectedRoteiro, selectedRoteiro.foto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-dourado-dark hover:underline flex items-center gap-1 mt-1 font-semibold"
                          >
                            <Download className="w-3 h-3" /> Baixar em Alta Resolução
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-vinho/50">Não enviada</span>
                      )}
                    </div>

                    {/* Logomarca */}
                    <div className="space-y-1.5 text-center sm:text-left">
                      <span className="text-[11px] font-bold text-vinho block">
                        Logomarca da Empresa
                      </span>
                      {selectedRoteiro.logomarca ? (
                        <div>
                          <a
                            href={getFileUrl(selectedRoteiro, selectedRoteiro.logomarca)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getFileUrl(
                                selectedRoteiro,
                                selectedRoteiro.logomarca,
                                '300x300',
                              )}
                              alt="Logomarca"
                              className="w-32 h-32 rounded-2xl object-contain p-2 bg-marfim/50 border border-vinho/20 shadow-sm hover:scale-102 transition-transform"
                            />
                          </a>
                          <a
                            href={getFileUrl(selectedRoteiro, selectedRoteiro.logomarca)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-dourado-dark hover:underline flex items-center gap-1 mt-1 font-semibold"
                          >
                            <Download className="w-3 h-3" /> Baixar Logomarca
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-vinho/40 italic">Sem logomarca</span>
                      )}
                    </div>

                    {/* Autorização */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-vinho block">
                        Direito de Imagem
                      </span>
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          <span>Autorização Confirmada</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          O(A) convidado(a) concordou com o uso da sua imagem nas redes sociais e
                          YouTube do CoffeeCast 4.0.
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          setModalOpen(false)
                          setActiveTab('assistente')
                          setAiSelectedId(selectedRoteiro.id)
                          handleGerarComIA(selectedRoteiro.id)
                        }}
                        className="w-full bg-vinho hover:bg-vinho-light text-white font-bold text-xs rounded-xl h-10 flex items-center justify-center gap-1.5 shadow-sm mt-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-dourado" />
                        <span>Gerar Roteiro com IA</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* BLOCO: ANEXAR / ESCREVER ROTEIRO PRONTO DO EPISÓDIO */}
                <div className="md:col-span-2 bg-gradient-to-b from-white to-marfim/80 p-5 rounded-3xl border-2 border-dourado/60 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-vinho/10 pb-2">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-bold text-base text-vinho flex items-center gap-2">
                        <FileText className="w-4 h-4 text-dourado" /> Roteiro Final do Episódio
                        (Aline Lana & Produção)
                      </h4>
                      <p className="text-[11px] text-vinho/70">
                        Escreva ou anexe aqui o roteiro pronto alinhado para a gravação no estúdio.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={handleSalvarRoteiroPronto}
                      disabled={savingRoteiro}
                      className="bg-vinho hover:bg-vinho-light text-white font-bold text-xs rounded-xl min-h-[38px] px-4"
                    >
                      <Save className="w-3.5 h-3.5 mr-1 text-dourado" />
                      {savingRoteiro ? 'Salvando...' : 'Salvar Roteiro'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rot-final-texto" className="text-xs font-bold text-vinho">
                      Texto do Roteiro / Pauta Estruturada
                    </Label>
                    <Textarea
                      id="rot-final-texto"
                      rows={8}
                      placeholder="Cole ou redija o roteiro aqui (Apresentação, Bloco 1, Bloco 2, Bloco 3, encerramento...)"
                      value={roteiroTexto}
                      onChange={(e) => setRoteiroTexto(e.target.value)}
                      className="bg-white border-vinho/20 text-xs sm:text-sm rounded-xl p-3 leading-relaxed"
                    />
                  </div>

                  {/* Anexo de Arquivo (PDF / DOCX) */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-bold text-vinho block">
                      Anexo do Roteiro (PDF ou DOCX opcional)
                    </Label>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-vinho/15">
                      <div className="text-xs text-vinho/80 min-w-0">
                        {selectedRoteiro.roteiro_final_arquivo ? (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-dourado-dark shrink-0" />
                            <span className="font-semibold truncate">
                              Arquivo salvo no registro
                            </span>
                            <a
                              href={getFileUrl(
                                selectedRoteiro,
                                selectedRoteiro.roteiro_final_arquivo,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-dourado-dark hover:underline flex items-center gap-1 font-bold ml-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Baixar
                            </a>
                          </div>
                        ) : (
                          <span className="text-vinho/50 italic">
                            Nenhum arquivo anexado ainda.
                          </span>
                        )}
                        {roteiroArquivo && (
                          <p className="text-emerald-700 font-bold mt-1 text-[11px]">
                            Novo arquivo selecionado para envio: {roteiroArquivo.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <input
                          ref={fileUploadRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => setRoteiroArquivo(e.target.files?.[0] || null)}
                          className="hidden"
                          id="upload-roteiro-arquivo"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileUploadRef.current?.click()}
                          className="border-vinho/30 text-vinho hover:bg-vinho/10 text-xs rounded-xl"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1 text-dourado" />
                          {roteiroArquivo || selectedRoteiro.roteiro_final_arquivo
                            ? 'Substituir Arquivo'
                            : 'Anexar PDF / DOCX'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
