import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { formatCurrencyBRL, formatDateBR, toInputDate } from '@/lib/formatters'
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
  TrendingUp,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function AdminFinanceiroScreen() {
  const [transacoes, setTransacoes] = useState<TransacaoRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroMovimentacao, setFiltroMovimentacao] = useState<string>('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TransacaoRecord | null>(null)

  const [descricao, setDescricao] = useState('')
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'receita' | 'despesa'>('despesa')
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
    setTipoMovimentacao('despesa')
    setTipo('gravacao')
    setValor('')
    setDataVencimento(toInputDate(new Date().toISOString()))
    setSituacao('em_aberto')
    setModalOpen(true)
  }

  const handleOpenEdit = (t: TransacaoRecord) => {
    setEditingItem(t)
    setDescricao(t.descricao)
    setTipoMovimentacao(t.tipo_movimentacao || 'despesa')
    setTipo(t.tipo)
    setValor(String(t.valor))
    setDataVencimento(toInputDate(t.data_vencimento))
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

      const payload: Partial<TransacaoRecord> = {
        descricao: descricao.trim(),
        tipo,
        valor: valNum,
        data_vencimento: toInputDate(dataVencimento),
        situacao,
        tipo_movimentacao: tipoMovimentacao,
        origem: editingItem?.origem || 'manual',
      }

      if (editingItem) {
        await pb.collection('transacoes').update(editingItem.id, payload)
        toast.success(
          tipoMovimentacao === 'receita' ? 'Receita atualizada!' : 'Despesa atualizada!',
        )
      } else {
        await pb.collection('transacoes').create(payload)
        toast.success(
          tipoMovimentacao === 'receita' ? 'Receita cadastrada!' : 'Despesa cadastrada!',
        )
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
    if (filtroMovimentacao !== 'todos') {
      const mov = item.tipo_movimentacao || 'despesa'
      if (mov !== filtroMovimentacao) return false
    }
    return true
  })

  // Agregações financeiras completas
  const totalReceitas = transacoes
    .filter((t) => t.tipo_movimentacao === 'receita')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0)

  const totalDespesas = transacoes
    .filter((t) => (t.tipo_movimentacao || 'despesa') === 'despesa')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0)

  const saldoLiquido = totalReceitas - totalDespesas

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
    <div className="space-y-5 sm:space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">Painel Financeiro</h2>
          <p className="text-xs text-vinho/70">
            Controle de custos de produção, edição, estúdio e saldo atual
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-dourado shrink-0" />
          Novo Lançamento
        </Button>
      </div>

      {/* Gráfico Visual de Gastos por Categoria (Barras Responsivas sem cortar legendas) */}
      <div className="bg-white border border-vinho/10 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-vinho/10 pb-3">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
              Distribuição Financeira por Categoria
            </h3>
            <p className="text-xs text-vinho/65">Visualização de custos acumulados do projeto</p>
          </div>
          <span className="text-xs font-bold text-vinho">
            Total: {formatCurrencyBRL(totalQuitado + totalAberto)}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {Object.entries(tipoLabels).map(([key, label]) => {
            const val = transacoes
              .filter((t) => t.tipo === key)
              .reduce((acc, curr) => acc + (curr.valor || 0), 0)
            const totalGeral = totalQuitado + totalAberto
            const pct = totalGeral > 0 ? (val / totalGeral) * 100 : 0
            const colorsMap: Record<string, string> = {
              gravacao: '#4B1E3F',
              edicao: '#D4AF37',
              equipamento: '#5F2650',
              marketing: '#C88E9B',
              outros: '#853C73',
            }
            const barColor = colorsMap[key] || '#4B1E3F'

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-vinho gap-2">
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="font-bold shrink-0">
                    {formatCurrencyBRL(val)}{' '}
                    <span className="text-vinho/60 font-normal">({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-vinho/5 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Cards de Resumo Integrados: Receitas (Horas/Entradas), Despesas e Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Receitas (Entradas / Pacotes de Horas) */}
        <div className="bg-white border border-emerald-500/20 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              Total Receitas
            </p>
            <h3 className="font-serif text-2xl font-black text-emerald-700 mt-1">
              {formatCurrencyBRL(totalReceitas)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">
              Controle de Horas & Entradas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Despesas (Saídas de Custos) */}
        <div className="bg-white border border-rose-500/20 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              Total Despesas
            </p>
            <h3 className="font-serif text-2xl font-black text-rose-700 mt-1">
              {formatCurrencyBRL(totalDespesas)}
            </h3>
            <span className="text-[11px] text-rose-600 font-medium">
              Custos de Produção & Edição
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Líquido */}
        <div
          className={`rounded-2xl p-5 shadow-sm flex items-center justify-between border-2 ${
            saldoLiquido >= 0
              ? 'bg-gradient-to-br from-vinho via-vinho to-vinho-dark border-dourado text-white'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                saldoLiquido >= 0 ? 'text-dourado-light' : 'text-rose-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Saldo Líquido
            </p>
            <h3
              className={`font-serif text-2xl font-black mt-1 ${
                saldoLiquido >= 0 ? 'text-dourado' : 'text-rose-700'
              }`}
            >
              {formatCurrencyBRL(saldoLiquido)}
            </h3>
            <span
              className={`text-[11px] font-medium ${
                saldoLiquido >= 0 ? 'text-white/80' : 'text-rose-600'
              }`}
            >
              Receitas menos despesas
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              saldoLiquido >= 0 ? 'bg-dourado/20 text-dourado' : 'bg-rose-100 text-rose-700'
            }`}
          >
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Situação: Quitado vs Em Aberto */}
        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Status Pagamentos
            </p>
            <div className="mt-1 space-y-0.5">
              <span className="text-xs font-bold text-emerald-700 block">
                Quitado: {formatCurrencyBRL(totalQuitado)}
              </span>
              <span className="text-xs font-bold text-rose-600 block">
                Aberto: {formatCurrencyBRL(totalAberto)}
              </span>
            </div>
            <span className="text-[11px] text-vinho/60 font-medium">Controle de liquidação</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-vinho/10 text-vinho flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-vinho/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dourado-dark shrink-0" />
          <span className="text-xs font-bold text-vinho">Filtrar Lançamentos:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs flex-1 sm:flex-none">
            <span className="text-vinho/70 shrink-0">Fluxo:</span>
            <Select value={filtroMovimentacao} onValueChange={setFiltroMovimentacao}>
              <SelectTrigger className="h-9 sm:h-8 w-full sm:w-36 text-xs bg-marfim border-vinho/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Fluxos</SelectItem>
                <SelectItem value="receita">Receitas (Entradas)</SelectItem>
                <SelectItem value="despesa">Despesas (Saídas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs flex-1 sm:flex-none">
            <span className="text-vinho/70 shrink-0">Situação:</span>
            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="h-9 sm:h-8 w-full sm:w-32 text-xs bg-marfim border-vinho/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="em_aberto">Em Aberto</SelectItem>
                <SelectItem value="quitado">Quitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs flex-1 sm:flex-none">
            <span className="text-vinho/70 shrink-0">Categoria:</span>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-9 sm:h-8 w-full sm:w-44 text-xs bg-marfim border-vinho/15">
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

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Carregando finanças...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Nenhum lançamento financeiro encontrado.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-vinho leading-tight">{item.descricao}</h4>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <Badge
                      className={`text-[9px] font-bold ${
                        item.tipo_movimentacao === 'receita'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {item.tipo_movimentacao === 'receita' ? '+ Receita' : '- Despesa'}
                    </Badge>
                    {item.origem === 'horas_compradas' && (
                      <Link to="/admin/horas">
                        <Badge className="bg-dourado/20 text-dourado-dark border-dourado/40 text-[9px] font-bold cursor-pointer hover:bg-dourado/30">
                          Controle de Horas
                        </Badge>
                      </Link>
                    )}
                    <Badge variant="outline" className="text-[10px] border-vinho/20 text-vinho">
                      {tipoLabels[item.tipo] || item.tipo}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                    onClick={() => handleDelete(item.id, item.descricao)}
                    className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-vinho/5">
                <div>
                  <span className="text-[10px] text-vinho/60 block">Valor</span>
                  <span className="font-serif font-black text-sm text-vinho">
                    {formatCurrencyBRL(item.valor)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-vinho/60 block">Vencimento</span>
                  <span className="text-xs text-vinho font-medium">
                    {formatDateBR(item.data_vencimento)}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleSituacao(item)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold min-h-[36px] transition-all ${
                    item.situacao === 'quitado'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                  title="Clique para alternar situação"
                >
                  {item.situacao === 'quitado' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Quitado
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      Em Aberto
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
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
                    <div>{item.descricao}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        className={`text-[9px] font-bold ${
                          item.tipo_movimentacao === 'receita'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {item.tipo_movimentacao === 'receita' ? '+ Receita' : '- Despesa'}
                      </Badge>
                      {item.origem === 'horas_compradas' && (
                        <Link to="/admin/horas">
                          <Badge className="bg-dourado/20 text-dourado-dark border border-dourado/40 text-[9px] font-bold cursor-pointer hover:bg-dourado/30">
                            Origem: Controle de Horas
                          </Badge>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-vinho/20 text-vinho">
                      {tipoLabels[item.tipo] || item.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-xs font-black ${
                      item.tipo_movimentacao === 'receita' ? 'text-emerald-700' : 'text-vinho'
                    }`}
                  >
                    {item.tipo_movimentacao === 'receita' ? '+' : '-'}{' '}
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
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem
                ? editingItem.tipo_movimentacao === 'receita'
                  ? 'Editar Receita'
                  : 'Editar Despesa'
                : 'Cadastrar Movimentação Financeira'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">Tipo de Movimentação *</Label>
              <Select
                value={tipoMovimentacao}
                onValueChange={(val: 'receita' | 'despesa') => setTipoMovimentacao(val)}
              >
                <SelectTrigger className="bg-white border-vinho/20 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa (Saída de Caixa / Custo)</SelectItem>
                  <SelectItem value="receita">Receita (Entrada / Compra de Horas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-desc" className="text-xs font-semibold text-vinho">
                Descrição da Movimentação *
              </Label>
              <Input
                id="t-desc"
                required
                placeholder="Ex.: Pacote de horas de estúdio, edição ou equipamento..."
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                {saving ? 'Salvando...' : 'Salvar Movimentação'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
