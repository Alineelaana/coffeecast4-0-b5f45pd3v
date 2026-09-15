import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type { TransacaoRecord } from '@/types/database'
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
  Edit2,
  Trash2,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminFinanceiroScreen() {
  const [transacoes, setTransacoes] = useState<TransacaoRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TransacaoRecord | null>(null)

  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<'gravacao' | 'edicao' | 'equipamento' | 'marketing' | 'outros'>(
    'gravacao',
  )
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [situacao, setSituacao] = useState<'quitado' | 'em_aberto'>('em_aberto')
  const [saving, setSaving] = useState(false)

  const loadTransacoes = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('transacoes').getFullList<TransacaoRecord>({
        sort: '-data_vencimento',
      })
      setTransacoes(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar registros financeiros.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransacoes()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setDescricao('')
    setTipo('gravacao')
    setValor('')
    setDataVencimento(new Date().toISOString().split('T')[0])
    setSituacao('em_aberto')
    setModalOpen(true)
  }

  const handleOpenEdit = (t: TransacaoRecord) => {
    setEditingItem(t)
    setDescricao(t.descricao)
    setTipo(t.tipo)
    setValor(String(t.valor))
    setDataVencimento(t.data_vencimento ? t.data_vencimento.split('T')[0] : '')
    setSituacao(t.situacao)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const valNum = parseFloat(valor.replace(',', '.'))
      if (isNaN(valNum) || valNum <= 0) {
        toast.error('Informe um valor monetário válido.')
        setSaving(false)
        return
      }

      const payload = {
        descricao: descricao.trim(),
        tipo,
        valor: valNum,
        data_vencimento: dataVencimento,
        situacao,
      }

      if (editingItem) {
        await pb.collection('transacoes').update(editingItem.id, payload)
        toast.success('Despesa atualizada!')
      } else {
        await pb.collection('transacoes').create(payload)
        toast.success('Despesa cadastrada!')
      }

      setModalOpen(false)
      loadTransacoes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar despesa.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, desc: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o gasto "${desc}"?`)) return

    try {
      await pb.collection('transacoes').delete(id)
      toast.success('Gasto excluído com sucesso!')
      loadTransacoes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir registro.')
    }
  }

  const handleToggleSituacao = async (t: TransacaoRecord) => {
    const novaSituacao = t.situacao === 'quitado' ? 'em_aberto' : 'quitado'
    try {
      await pb.collection('transacoes').update(t.id, { situacao: novaSituacao })
      toast.success(
        `Situação alterada para "${novaSituacao === 'quitado' ? 'Quitado' : 'Em aberto'}"!`,
      )
      setTransacoes((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, situacao: novaSituacao } : item)),
      )
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar status da despesa.')
    }
  }

  // Filtragem
  const filtered = transacoes.filter((item) => {
    if (filtroSituacao !== 'todos' && item.situacao !== filtroSituacao) return false
    if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false
    return true
  })

  // Totais
  const totalQuitado = transacoes
    .filter((t) => t.situacao === 'quitado')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0)

  const totalAberto = transacoes
    .filter((t) => t.situacao === 'em_aberto')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0)

  const tipoLabels: Record<string, string> = {
    gravacao: 'Horas de Gravação',
    edicao: 'Edição de Áudio/Vídeo',
    equipamento: 'Equipamentos',
    marketing: 'Marketing',
    outros: 'Outros',
  }

  return (
    <div className="space-y-6">
      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-vinho">Gestão Financeira</h2>
          <p className="text-xs text-vinho/70">
            Controle de despesas, custos de estúdio, edição e cronograma de pagamentos.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-5 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4 text-dourado" />
          Cadastrar Despesa
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Total em Aberto
            </p>
            <h3 className="font-serif text-2xl font-black text-rose-700 mt-1">
              {formatCurrencyBRL(totalAberto)}
            </h3>
            <span className="text-[11px] text-rose-600 font-medium">A pagar nos vencimentos</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Total Quitado
            </p>
            <h3 className="font-serif text-2xl font-black text-emerald-700 mt-1">
              {formatCurrencyBRL(totalQuitado)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">Pagamentos liquidados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Volume Total de Gastos
            </p>
            <h3 className="font-serif text-2xl font-black text-vinho mt-1">
              {formatCurrencyBRL(totalQuitado + totalAberto)}
            </h3>
            <span className="text-[11px] text-vinho/60 font-medium">Total orçado</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-vinho/10 text-vinho flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-vinho/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dourado-dark" />
          <span className="text-xs font-bold text-vinho">Filtrar Lançamentos:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-vinho/70">Situação:</span>
            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="h-8 w-32 text-xs bg-marfim border-vinho/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="em_aberto">Em Aberto</SelectItem>
                <SelectItem value="quitado">Quitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-vinho/70">Categoria:</span>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-8 w-44 text-xs bg-marfim border-vinho/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Categorias</SelectItem>
                <SelectItem value="gravacao">Horas de Gravação</SelectItem>
                <SelectItem value="edicao">Edição</SelectItem>
                <SelectItem value="equipamento">Equipamentos</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando finanças...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-vinho/60">
            Nenhum lançamento financeiro encontrado.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-marfim">
              <TableRow className="border-b border-vinho/10">
                <TableHead className="font-bold text-vinho text-xs">Descrição do Gasto</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Categoria</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Valor</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Vencimento</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Situação</TableHead>
                <TableHead className="w-24 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-vinho/5">
                  <TableCell className="text-xs font-bold text-vinho max-w-sm">
                    {item.descricao}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-vinho/20 text-vinho">
                      {tipoLabels[item.tipo] || item.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-vinho">
                    {formatCurrencyBRL(item.valor)}
                  </TableCell>
                  <TableCell className="text-xs text-vinho/70">
                    {formatDateBR(item.data_vencimento)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleSituacao(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        item.situacao === 'quitado'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                      title="Clique para alternar situação"
                    >
                      {item.situacao === 'quitado' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Quitado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Em Aberto
                        </>
                      )}
                    </button>
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
                      onClick={() => handleDelete(item.id, item.descricao)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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

      {/* Modal de Criação / Edição de Transação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-marfim border-2 border-dourado/50 text-vinho">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-desc" className="text-xs font-semibold text-vinho">
                Descrição do Gasto *
              </Label>
              <Input
                id="t-desc"
                required
                placeholder="Ex.: Pagamento de horas de gravação - Estúdio Áudio 4.0"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Categoria *</Label>
                <Select
                  value={tipo}
                  onValueChange={(
                    val: 'gravacao' | 'edicao' | 'equipamento' | 'marketing' | 'outros',
                  ) => setTipo(val)}
                >
                  <SelectTrigger className="bg-white border-vinho/20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gravacao">Horas de Gravação</SelectItem>
                    <SelectItem value="edicao">Edição Áudio/Vídeo</SelectItem>
                    <SelectItem value="equipamento">Equipamentos</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="outros">Outros Custos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-val" className="text-xs font-semibold text-vinho">
                  Valor (R$) *
                </Label>
                <Input
                  id="t-val"
                  required
                  placeholder="Ex.: 650,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="bg-white border-vinho/20 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-venc" className="text-xs font-semibold text-vinho">
                  Data de Vencimento *
                </Label>
                <Input
                  id="t-venc"
                  type="date"
                  required
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="bg-white border-vinho/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Situação *</Label>
                <Select
                  value={situacao}
                  onValueChange={(val: 'quitado' | 'em_aberto') => setSituacao(val)}
                >
                  <SelectTrigger className="bg-white border-vinho/20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_aberto">Em Aberto</SelectItem>
                    <SelectItem value="quitado">Quitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-5"
              >
                {saving ? 'Salvando...' : 'Salvar Despesa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
