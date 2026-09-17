import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { formatDateBR } from '@/lib/formatters'
import type { ContatoRecord } from '@/types/database'
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
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  ExternalLink,
  Bot,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminContatosScreen() {
  const [contatos, setContatos] = useState<ContatoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroOrigem, setFiltroOrigem] = useState<string>('todas')
  const [buscaTexto, setBuscaTexto] = useState<string>('')

  const [selectedContato, setSelectedContato] = useState<ContatoRecord | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const loadContatos = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('contatos').getFullList<ContatoRecord>({
        sort: '-created',
      })
      setContatos(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar contatos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContatos()
  }, [])

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'novo' | 'visualizado' | 'contatado',
  ) => {
    try {
      await pb.collection('contatos').update(id, { status: newStatus })
      toast.success(`Status atualizado para "${newStatus}"!`)
      setContatos((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)))
      if (selectedContato && selectedContato.id === id) {
        setSelectedContato((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar status.')
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir a proposta de "${nome}"?`)) return

    try {
      await pb.collection('contatos').delete(id)
      toast.success('Contato excluído!')
      setContatos((prev) => prev.filter((c) => c.id !== id))
      if (detailsOpen && selectedContato?.id === id) {
        setDetailsOpen(false)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir contato.')
    }
  }

  const handleOpenDetails = (c: ContatoRecord) => {
    setSelectedContato(c)
    setDetailsOpen(true)
    if (c.status === 'novo') {
      handleUpdateStatus(c.id, 'visualizado')
    }
  }

  const isNineOrigin = (c: ContatoRecord) => {
    return Boolean(
      (c.origem && c.origem.toLowerCase().includes('nine')) ||
      (c.como_nos_conheceu && c.como_nos_conheceu.toLowerCase().includes('nine')) ||
      c.conversation_id,
    )
  }

  const countNine = contatos.filter(isNineOrigin).length
  const countForm = contatos.length - countNine

  const filtered = contatos.filter((c) => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) {
      return false
    }

    if (filtroOrigem === 'nine' && !isNineOrigin(c)) {
      return false
    }
    if (filtroOrigem === 'site' && isNineOrigin(c)) {
      return false
    }

    if (buscaTexto.trim()) {
      const q = buscaTexto.toLowerCase().trim()
      const matchName = (c.nome_completo || '').toLowerCase().includes(q)
      const matchEmail = (c.email || '').toLowerCase().includes(q)
      const matchPhone = (c.telefone || c.whatsapp || '').includes(q)
      const matchMotivo = (c.motivo || '').toLowerCase().includes(q)
      const matchOrigin = (c.origem || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchPhone && !matchMotivo && !matchOrigin) {
        return false
      }
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-vinho">Contatos e Leads Comerciais</h2>
          <p className="text-xs text-vinho/70">
            Acompanhe e gerencie todos os leads do podcast — formulário do site e visitantes
            identificados pela Nine no chat.
          </p>
        </div>

        {/* Filtros rápidos combinados */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Origem */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-vinho/10 shadow-xs">
            <button
              type="button"
              onClick={() => setFiltroOrigem('todas')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroOrigem === 'todas' ? 'bg-vinho text-white' : 'text-vinho/70 hover:bg-vinho/5'
              }`}
            >
              Todas Origens ({contatos.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroOrigem('nine')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroOrigem === 'nine'
                  ? 'bg-[#D4AF37] text-vinho font-bold shadow-xs'
                  : 'text-dourado-dark hover:bg-[#D4AF37]/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Nine Chat ({countNine})
            </button>
            <button
              type="button"
              onClick={() => setFiltroOrigem('site')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroOrigem === 'site' ? 'bg-vinho text-white' : 'text-vinho/70 hover:bg-vinho/5'
              }`}
            >
              Formulário Site ({countForm})
            </button>
          </div>

          {/* Filtro por status */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-vinho/10 shadow-xs">
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroStatus === 'todos' ? 'bg-vinho text-white' : 'text-vinho/70 hover:bg-vinho/5'
              }`}
            >
              Status: Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('novo')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroStatus === 'novo'
                  ? 'bg-amber-600 text-white'
                  : 'text-vinho/70 hover:bg-vinho/5'
              }`}
            >
              Novos ({contatos.filter((c) => c.status === 'novo').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('visualizado')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroStatus === 'visualizado'
                  ? 'bg-vinho-light text-white'
                  : 'text-vinho/70 hover:bg-vinho/5'
              }`}
            >
              Visualizados
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('contatado')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroStatus === 'contatado'
                  ? 'bg-emerald-700 text-white'
                  : 'text-vinho/70 hover:bg-vinho/5'
              }`}
            >
              Contatados
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa de Leads */}
      <div className="bg-white p-3 rounded-2xl border border-vinho/10 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-vinho/50 shrink-0" />
        <input
          type="text"
          value={buscaTexto}
          onChange={(e) => setBuscaTexto(e.target.value)}
          placeholder="Buscar por nome, e-mail, telefone/WhatsApp ou palavras do contato..."
          className="flex-1 text-xs text-vinho placeholder:text-vinho/40 bg-transparent focus:outline-none"
        />
        {buscaTexto && (
          <button
            type="button"
            onClick={() => setBuscaTexto('')}
            className="text-xs text-vinho/50 hover:text-vinho px-2 py-0.5 rounded-md hover:bg-vinho/5"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Carregando contatos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Nenhuma proposta encontrada para o filtro selecionado.
          </div>
        ) : (
          filtered.map((item) => {
            const isNine = isNineOrigin(item)
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-vinho">{item.nome_completo}</h3>
                      {isNine && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] text-[#4B1E3F] border border-[#D4AF37]">
                          <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                          Nine
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-vinho/70">
                      {item.profissao ? (
                        `${item.profissao} ${item.idade ? `(${item.idade} anos)` : ''}`
                      ) : (
                        <span className="italic">Usuário Prata · Chat da Nine</span>
                      )}
                    </p>
                    <p className="text-xs text-vinho/80 font-medium">
                      {item.whatsapp || item.telefone || item.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetails(item)}
                      className="h-9 w-9 p-0 text-vinho/70 hover:text-vinho min-h-[36px]"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.nome_completo)}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                      title="Excluir proposta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-vinho/5 text-xs">
                  <Select
                    value={item.status}
                    onValueChange={(val: 'novo' | 'visualizado' | 'contatado') =>
                      handleUpdateStatus(item.id, val)
                    }
                  >
                    <SelectTrigger
                      className={`h-8 min-h-[36px] w-32 text-xs font-semibold rounded-lg px-2.5 ${
                        item.status === 'novo'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : item.status === 'contatado'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-vinho/10 text-vinho border-vinho/20'
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="visualizado">Visualizado</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-[11px] text-vinho/60">{formatDateBR(item.created)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando contatos...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-vinho/60">
            Nenhuma proposta encontrada para o filtro selecionado.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-marfim">
              <TableRow className="border-b border-vinho/10">
                <TableHead className="font-bold text-vinho text-xs">Candidata / Nome</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Profissão / Idade</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Instagram</TableHead>
                <TableHead className="font-bold text-vinho text-xs">WhatsApp / Telefone</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Status</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Data</TableHead>
                <TableHead className="w-24 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {filtered.map((item) => {
                const isNine = isNineOrigin(item)
                return (
                  <TableRow key={item.id} className="hover:bg-vinho/5">
                    <TableCell className="text-xs font-bold text-vinho">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.nome_completo}</span>
                        {isNine && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] text-[#4B1E3F] border border-[#D4AF37] shadow-2xs"
                            title="Lead captado pela Nine no Chat"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                            Nine · Chat
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] font-normal text-vinho/60">
                        {item.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-vinho/80">
                      {item.profissao ? (
                        <>
                          {item.profissao} {item.idade ? `(${item.idade} anos)` : ''}
                        </>
                      ) : (
                        <span className="text-vinho/40 italic">Usuário Prata (Chat)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-dourado-dark">
                      {item.instagram || <span className="text-vinho/30">-</span>}
                    </TableCell>
                    <TableCell className="text-xs text-vinho/80 font-medium">
                      {item.whatsapp || item.telefone || '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(val: 'novo' | 'visualizado' | 'contatado') =>
                          handleUpdateStatus(item.id, val)
                        }
                      >
                        <SelectTrigger
                          className={`h-7 text-[11px] font-semibold border-none rounded-md px-2 ${
                            item.status === 'novo'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'contatado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-vinho/10 text-vinho'
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="visualizado">Visualizado</SelectItem>
                          <SelectItem value="contatado">Contatado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-[11px] text-vinho/60 whitespace-nowrap">
                      {formatDateBR(item.created)}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetails(item)}
                        className="h-8 w-8 p-0 text-vinho/70 hover:text-vinho hover:bg-vinho/10"
                        title="Ver detalhes completos do lead"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.nome_completo)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir proposta"
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

      {/* Modal de Detalhes com todas as informações cadastradas */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[94vw] max-w-xl max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-8 rounded-2xl">
          {selectedContato && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="font-serif text-2xl font-bold text-vinho">
                    {selectedContato.nome_completo}
                  </DialogTitle>
                  <Badge
                    className={`${
                      selectedContato.status === 'novo'
                        ? 'bg-amber-100 text-amber-800'
                        : selectedContato.status === 'contatado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-vinho/10 text-vinho'
                    }`}
                  >
                    {selectedContato.status.toUpperCase()}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Informações Pessoais & Contato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-vinho/10 text-xs">
                <div>
                  <span className="text-vinho/60 font-semibold block">Origem do Lead:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isNineOrigin(selectedContato) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF8F5] text-[#4B1E3F] border border-[#D4AF37]">
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        {selectedContato.origem || 'Nine — Chat do Site'}
                      </span>
                    ) : (
                      <span className="font-bold text-vinho">
                        {selectedContato.origem || 'Formulário do Site'}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-vinho/60 font-semibold block">Como nos Conheceu:</span>
                  <span className="font-bold text-vinho">
                    {selectedContato.como_nos_conheceu || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-vinho/60 font-semibold block">Profissão / Atuação:</span>
                  <span className="font-bold text-vinho">
                    {selectedContato.profissao || 'Não informada (Lead Chat)'}
                  </span>
                </div>

                <div>
                  <span className="text-vinho/60 font-semibold block">Idade:</span>
                  <span className="font-bold text-vinho">
                    {selectedContato.idade ? `${selectedContato.idade} anos` : 'Não informada'}
                  </span>
                </div>

                <div>
                  <span className="text-vinho/60 font-semibold block">Instagram:</span>
                  <span className="font-bold text-dourado-dark break-all">
                    {selectedContato.instagram || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-vinho/60 font-semibold block">E-mail:</span>
                  <a
                    href={`mailto:${selectedContato.email}`}
                    className="font-bold text-vinho hover:underline flex items-center gap-1 break-all"
                  >
                    <Mail className="w-3 h-3 text-dourado shrink-0" />
                    {selectedContato.email}
                  </a>
                </div>

                <div>
                  <span className="text-vinho/60 font-semibold block">WhatsApp / Telefone:</span>
                  {selectedContato.whatsapp || selectedContato.telefone ? (
                    <a
                      href={`https://wa.me/55${(selectedContato.whatsapp || selectedContato.telefone || '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                      {selectedContato.whatsapp || selectedContato.telefone}
                    </a>
                  ) : (
                    <span className="text-vinho/40">Não informado</span>
                  )}
                </div>

                <div>
                  <span className="text-vinho/60 font-semibold block">
                    Data do Cadastro / Captação:
                  </span>
                  <span className="font-bold text-vinho">
                    {formatDateBR(selectedContato.created)}
                  </span>
                </div>
              </div>

              {/* Se tiver conversa linkada com a Nine */}
              {selectedContato.conversation_id && (
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#D4AF37]/50 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <div>
                      <p className="font-bold text-[#4B1E3F]">
                        Conversa registrada na central da Nine
                      </p>
                      <p className="text-[11px] text-[#4B1E3F]/70">
                        ID: {selectedContato.conversation_id}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/admin/nine"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4B1E3F] hover:underline hover:text-[#D4AF37]"
                  >
                    <span>Ver no Painel da Nine</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Texto com o motivo e história ou histórico */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-vinho uppercase tracking-wider block">
                  {isNineOrigin(selectedContato)
                    ? 'Resumo / Mensagem Inicial no Chat:'
                    : '"O que te levou a ter interesse em participar do nosso podcast?"'}
                </span>
                <div className="p-4 rounded-xl bg-white border border-vinho/10 text-xs sm:text-sm text-vinho/85 leading-relaxed whitespace-pre-line italic">
                  "{selectedContato.motivo || 'Nenhuma mensagem registrada.'}"
                </div>
              </div>

              {/* Ações de Contato Rápido */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select
                    value={selectedContato.status}
                    onValueChange={(val: 'novo' | 'visualizado' | 'contatado') =>
                      handleUpdateStatus(selectedContato.id, val)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-36 h-10 min-h-[44px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="visualizado">Visualizado</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(selectedContato.whatsapp || selectedContato.telefone) && (
                  <a
                    href={`https://wa.me/55${(selectedContato.whatsapp || selectedContato.telefone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button className="w-full min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm">
                      <MessageSquare className="w-4 h-4" />
                      Iniciar conversa no WhatsApp
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
