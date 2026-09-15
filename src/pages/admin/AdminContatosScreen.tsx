import React, { useState, useEffect } from 'react'
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
import { Eye, Trash2, Mail, Phone, MessageSquare, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminContatosScreen() {
  const [contatos, setContatos] = useState<ContatoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

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

  const filtered = contatos.filter((c) => {
    if (filtroStatus === 'todos') return true
    return c.status === filtroStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-vinho">Propostas de Participação</h2>
          <p className="text-xs text-vinho/70">
            Acompanhe e gerencie as pessoas que preencheram o formulário de interesse no site.
          </p>
        </div>

        {/* Filtro por status */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-vinho/10 shadow-xs">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtroStatus === 'todos' ? 'bg-vinho text-white' : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Todos ({contatos.length})
          </button>
          <button
            onClick={() => setFiltroStatus('novo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtroStatus === 'novo' ? 'bg-amber-600 text-white' : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Novos ({contatos.filter((c) => c.status === 'novo').length})
          </button>
          <button
            onClick={() => setFiltroStatus('visualizado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtroStatus === 'visualizado'
                ? 'bg-vinho-light text-white'
                : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Visualizados
          </button>
          <button
            onClick={() => setFiltroStatus('contatado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtroStatus === 'contatado'
                ? 'bg-emerald-700 text-white'
                : 'text-vinho/70 hover:bg-vinho/5'
            }`}
          >
            Contatados
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-hidden">
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
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-vinho/5">
                  <TableCell className="text-xs font-bold text-vinho">
                    {item.nome_completo}
                    <span className="block text-[11px] font-normal text-vinho/60">
                      {item.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-vinho/80">
                    {item.profissao} ({item.idade} anos)
                  </TableCell>
                  <TableCell className="text-xs font-medium text-dourado-dark">
                    {item.instagram}
                  </TableCell>
                  <TableCell className="text-xs text-vinho/80">
                    {item.whatsapp || item.telefone}
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
                  <TableCell className="text-[11px] text-vinho/60">
                    {formatDateBR(item.created)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetails(item)}
                      className="h-8 w-8 p-0 text-vinho/70 hover:text-vinho hover:bg-vinho/10"
                      title="Ver detalhes da resposta"
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Detalhes com todas as informações cadastradas */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xl bg-marfim border-2 border-dourado/50 text-vinho p-6 sm:p-8">
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
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-vinho/10 text-xs">
                <div>
                  <span className="text-vinho/60 font-semibold block">Profissão:</span>
                  <span className="font-bold text-vinho">{selectedContato.profissao}</span>
                </div>
                <div>
                  <span className="text-vinho/60 font-semibold block">Idade:</span>
                  <span className="font-bold text-vinho">{selectedContato.idade} anos</span>
                </div>
                <div>
                  <span className="text-vinho/60 font-semibold block">Instagram:</span>
                  <span className="font-bold text-dourado-dark">{selectedContato.instagram}</span>
                </div>
                <div>
                  <span className="text-vinho/60 font-semibold block">Como nos Conheceu:</span>
                  <span className="font-bold text-vinho">{selectedContato.como_nos_conheceu}</span>
                </div>
                <div>
                  <span className="text-vinho/60 font-semibold block">E-mail:</span>
                  <a
                    href={`mailto:${selectedContato.email}`}
                    className="font-bold text-vinho hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-dourado" />
                    {selectedContato.email}
                  </a>
                </div>
                <div>
                  <span className="text-vinho/60 font-semibold block">WhatsApp:</span>
                  <a
                    href={`https://wa.me/55${selectedContato.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    {selectedContato.whatsapp}
                  </a>
                </div>
              </div>

              {/* Texto com o motivo e história */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-vinho uppercase tracking-wider block">
                  "O que te levou a ter interesse em participar do nosso podcast?"
                </span>
                <div className="p-4 rounded-xl bg-white border border-vinho/10 text-xs sm:text-sm text-vinho/85 leading-relaxed whitespace-pre-line italic">
                  "{selectedContato.motivo}"
                </div>
              </div>

              {/* Ações de Contato Rápido */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedContato.status}
                    onValueChange={(val: 'novo' | 'visualizado' | 'contatado') =>
                      handleUpdateStatus(selectedContato.id, val)
                    }
                  >
                    <SelectTrigger className="w-36 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="visualizado">Visualizado</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <a
                  href={`https://wa.me/55${selectedContato.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Iniciar conversa no WhatsApp
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
