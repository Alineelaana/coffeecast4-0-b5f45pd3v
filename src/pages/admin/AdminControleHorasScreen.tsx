import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type { HorasCompradasRecord, AgendaRecord } from '@/types/database'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  ShoppingBag,
  TrendingDown,
  AlertCircle,
  Hourglass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function AdminControleHorasScreen() {
  const [compras, setCompras] = useState<HorasCompradasRecord[]>([])
  const [agendamentos, setAgendamentos] = useState<AgendaRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtro na listagem de compras
  const [filtroSituacao, setFiltroSituacao] = useState<'todas' | 'paga' | 'em_aberto'>('todas')

  // Modal de cadastro/edição de horas compradas
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HorasCompradasRecord | null>(null)

  // Campos do formulário
  const [dataCompra, setDataCompra] = useState('')
  const [quantidadeHoras, setQuantidadeHoras] = useState('')
  const [descricao, setDescricao] = useState('')
  const [situacao, setSituacao] = useState<'paga' | 'em_aberto'>('paga')
  const [valor, setValor] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)

  // Carregar dados de compras e da agenda
  const fetchData = async () => {
    try {
      setLoading(true)
      const [comprasList, agendaList] = await Promise.all([
        pb.collection('horas_compradas').getFullList<HorasCompradasRecord>({
          sort: '-data',
        }),
        pb.collection('agenda').getFullList<AgendaRecord>({
          sort: '-data_gravacao',
        }),
      ])
      setCompras(comprasList)
      setAgendamentos(agendaList)
    } catch (err) {
      console.error('Erro ao carregar controle de horas:', err)
      toast.error('Erro ao carregar dados do banco de horas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Cálculos de Horas
  // Horas Compradas Totais
  const totalHorasCompradas = compras.reduce((acc, c) => acc + (Number(c.quantidade_horas) || 0), 0)

  // Horas Pagas x Em Aberto
  const horasPagas = compras
    .filter((c) => c.situacao === 'paga')
    .reduce((acc, c) => acc + (Number(c.quantidade_horas) || 0), 0)

  const horasEmAberto = compras
    .filter((c) => c.situacao === 'em_aberto')
    .reduce((acc, c) => acc + (Number(c.quantidade_horas) || 0), 0)

  // Horas Gastas nos Agendamentos da Agenda
  const totalHorasGastas = agendamentos.reduce(
    (acc, a) => acc + (Number(a.horas_utilizadas) || 0),
    0,
  )

  // Saldo Restante (Horas Compradas - Horas Gastas)
  const saldoHorasRestantes = totalHorasCompradas - totalHorasGastas

  // Agendamentos que consumiram horas (ou todos com horas_utilizadas > 0)
  const consumosAgenda = agendamentos.filter((a) => (Number(a.horas_utilizadas) || 0) > 0)

  // Abrir Modal de Criação
  const handleOpenCreate = () => {
    setEditingItem(null)
    setDataCompra(new Date().toISOString().split('T')[0])
    setQuantidadeHoras('')
    setDescricao('')
    setSituacao('paga')
    setValor('')
    setObservacoes('')
    setModalOpen(true)
  }

  // Abrir Modal de Edição
  const handleOpenEdit = (item: HorasCompradasRecord) => {
    setEditingItem(item)
    setDataCompra(item.data ? item.data.split('T')[0] : '')
    setQuantidadeHoras(String(item.quantidade_horas))
    setDescricao(item.descricao)
    setSituacao(item.situacao)
    setValor(item.valor ? String(item.valor) : '')
    setObservacoes(item.observacoes || '')
    setModalOpen(true)
  }

  // Salvar registro de horas compradas
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const qtd = parseFloat(quantidadeHoras.replace(',', '.'))
      if (isNaN(qtd) || qtd <= 0) {
        toast.error('Informe uma quantidade de horas válida maior que zero.')
        setSaving(false)
        return
      }

      let valNum: number | undefined
      if (valor.trim()) {
        valNum = parseFloat(valor.replace(',', '.'))
      }

      const payload: Partial<HorasCompradasRecord> = {
        data: dataCompra,
        quantidade_horas: qtd,
        descricao: descricao.trim(),
        situacao,
        valor: valNum,
        observacoes: observacoes.trim(),
      }

      if (editingItem) {
        await pb.collection('horas_compradas').update(editingItem.id, payload)
        toast.success('Registro de horas atualizado com sucesso!')
      } else {
        await pb.collection('horas_compradas').create(payload)
        toast.success('Horas cadastradas com sucesso!')
      }

      setModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar horas no banco de dados.')
    } finally {
      setSaving(false)
    }
  }

  // Excluir registro de horas compradas
  const handleDelete = async (id: string, desc: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o registro "${desc}"?`)) return

    try {
      await pb.collection('horas_compradas').delete(id)
      toast.success('Horas removidas do banco!')
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir registro de horas.')
    }
  }

  // Alternar situação rápida (paga / em aberto)
  const handleToggleSituacao = async (item: HorasCompradasRecord) => {
    const nova = item.situacao === 'paga' ? 'em_aberto' : 'paga'
    try {
      await pb.collection('horas_compradas').update(item.id, { situacao: nova })
      toast.success(`Situação atualizada para "${nova === 'paga' ? 'Paga' : 'Em Aberto'}"!`)
      setCompras((prev) => prev.map((c) => (c.id === item.id ? { ...c, situacao: nova } : c)))
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar status do pacote de horas.')
    }
  }

  // Compras filtradas
  const comprasFiltradas = compras.filter((c) => {
    if (filtroSituacao === 'todas') return true
    return c.situacao === filtroSituacao
  })

  // Percentual de consumo do banco de horas
  const percentualConsumido =
    totalHorasCompradas > 0
      ? Math.min(100, Math.round((totalHorasGastas / totalHorasCompradas) * 100))
      : 0

  return (
    <div className="space-y-8">
      {/* Topo da Tela com Título e Ação Principal */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl sm:text-3xl font-bold text-vinho">
              Controle de Horas
            </h2>
            <Badge className="bg-dourado/20 text-dourado-dark border border-dourado/40 text-[10px] font-bold">
              Estúdio & Agenda
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-vinho/70 mt-1">
            Gestão do banco de horas contratadas no estúdio e sincronização automática com os
            agendamentos.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-dourado shrink-0" />
          Cadastrar Horas Compradas
        </Button>
      </div>

      {/* DASHBOARD PRINCIPAL: CARDS COM SALDO EM DESTAQUE DOURADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Horas Compradas (Totais) */}
        <div className="bg-white border border-vinho/15 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-vinho/60">
                Horas Compradas
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-vinho">
                {totalHorasCompradas.toFixed(1).replace('.0', '')}{' '}
                <span className="text-base font-semibold text-vinho/60 font-sans">horas</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-vinho/10 text-vinho flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6 text-vinho" />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-vinho/10 flex items-center justify-between text-xs text-vinho/70">
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {horasPagas}h pagas
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {horasEmAberto}h em aberto
            </span>
          </div>
        </div>

        {/* Card 2: Horas Gastas (Debitado da Agenda) */}
        <div className="bg-white border border-vinho/15 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-vinho/60">
                Horas Gastas na Agenda
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-rose-700">
                {totalHorasGastas.toFixed(1).replace('.0', '')}{' '}
                <span className="text-base font-semibold text-rose-600/70 font-sans">horas</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-vinho/10 flex items-center justify-between text-xs text-vinho/70">
            <span>{consumosAgenda.length} gravações com horas</span>
            <span className="font-semibold text-rose-700">{percentualConsumido}% do total</span>
          </div>
        </div>

        {/* Card 3: DESTAQUE DOURADO - Horas Restantes (Saldo do Estúdio) */}
        <div className="bg-gradient-to-br from-vinho via-vinho to-vinho-dark border-2 border-dourado text-marfim rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-dourado/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dourado/25 border border-dourado/40 text-dourado-light text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-dourado" />
                Saldo Disponível
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-dourado drop-shadow-sm mt-1">
                {saldoHorasRestantes.toFixed(1).replace('.0', '')}{' '}
                <span className="text-base font-semibold text-marfim/80 font-sans">horas</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-dourado/20 border border-dourado/40 text-dourado flex items-center justify-center shrink-0 shadow-inner">
              <Clock className="w-6 h-6 text-dourado" />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 relative z-10">
            {saldoHorasRestantes < 0 ? (
              <p className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Saldo negativo! Necessário adquirir novo pacote.
              </p>
            ) : saldoHorasRestantes <= 2 ? (
              <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                <Hourglass className="w-4 h-4 shrink-0" />
                Atenção: Saldo de horas baixo para as próximas gravações.
              </p>
            ) : (
              <p className="text-xs text-marfim/80 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-dourado shrink-0" />
                Saldo positivo e disponível para uso no estúdio.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Progresso Visual de Horas */}
      <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-dourado" />
            <h4 className="font-serif text-sm font-bold text-vinho">
              Evolução e Consumo do Banco de Horas
            </h4>
          </div>
          <span className="text-xs font-semibold text-vinho/70">
            {totalHorasGastas}h consumidas de {totalHorasCompradas}h totais ({percentualConsumido}%)
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-3.5 bg-vinho/5 rounded-full overflow-hidden p-0.5 border border-vinho/10 flex">
          <div
            className="h-full bg-gradient-to-r from-vinho via-rose-600 to-rose-700 rounded-full transition-all duration-500"
            style={{ width: `${percentualConsumido}%` }}
            title={`Horas consumidas: ${totalHorasGastas}h`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-vinho/60 pt-1">
          <span>0h</span>
          <span className="font-medium text-vinho">
            Saldo livre: <strong className="text-dourado-dark">{saldoHorasRestantes}h</strong>
          </span>
          <span>{totalHorasCompradas}h Contratadas</span>
        </div>
      </div>

      {/* ABAS: HISTÓRICO DE COMPRAS vs. CONSUMO PELA AGENDA */}
      <Tabs defaultValue="compras" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vinho/10 pb-2">
          <TabsList className="bg-marfim border border-vinho/15 p-1 rounded-xl">
            <TabsTrigger
              value="compras"
              className="text-xs font-bold data-[state=active]:bg-vinho data-[state=active]:text-white rounded-lg px-4"
            >
              Horas Compradas / Pagas ({compras.length})
            </TabsTrigger>
            <TabsTrigger
              value="consumo"
              className="text-xs font-bold data-[state=active]:bg-vinho data-[state=active]:text-white rounded-lg px-4"
            >
              Consumo pela Agenda ({consumosAgenda.length})
            </TabsTrigger>
          </TabsList>

          <Link
            to="/admin/agenda"
            className="inline-flex items-center gap-1.5 text-xs text-vinho/80 hover:text-vinho font-semibold hover:underline"
          >
            <span>Ir para Agenda de Gravação</span>
            <ArrowRight className="w-3.5 h-3.5 text-dourado-dark" />
          </Link>
        </div>

        {/* ABA 1: HORAS COMPRADAS (CRUD) */}
        <TabsContent value="compras" className="space-y-4 m-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-vinho/10">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-vinho">Filtrar:</span>
              <Select
                value={filtroSituacao}
                onValueChange={(val: 'todas' | 'paga' | 'em_aberto') => setFiltroSituacao(val)}
              >
                <SelectTrigger className="h-9 min-h-[36px] w-36 text-xs bg-marfim border-vinho/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas ({compras.length})</SelectItem>
                  <SelectItem value="paga">Pagas</SelectItem>
                  <SelectItem value="em_aberto">Em Aberto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-vinho/60">
              Exibindo <strong>{comprasFiltradas.length}</strong> registro(s)
            </span>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
                Carregando histórico de horas...
              </div>
            ) : comprasFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-3">
                <Clock className="w-10 h-10 text-vinho/30 mx-auto" />
                <p className="text-sm font-medium text-vinho/70">
                  Nenhum registro de horas comprado encontrado.
                </p>
                <Button
                  onClick={handleOpenCreate}
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
                >
                  Cadastrar primeiro pacote de horas
                </Button>
              </div>
            ) : (
              comprasFiltradas.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-vinho">{item.descricao}</h4>
                      <span className="text-xs text-vinho/60">{formatDateBR(item.data)}</span>
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
                      <span className="text-[10px] text-vinho/60 block">Horas Adquiridas</span>
                      <span className="font-bold text-vinho bg-vinho/10 px-2.5 py-0.5 rounded-full border border-vinho/15 text-xs inline-block mt-0.5">
                        +{item.quantidade_horas}h
                      </span>
                    </div>

                    {item.valor && (
                      <div>
                        <span className="text-[10px] text-vinho/60 block">Valor</span>
                        <span className="font-bold text-vinho text-xs">
                          {formatCurrencyBRL(item.valor)}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => handleToggleSituacao(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold min-h-[36px] transition-all ${
                        item.situacao === 'paga'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title="Clique para alternar situação"
                    >
                      {item.situacao === 'paga' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Paga
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          Em Aberto
                        </>
                      )}
                    </button>
                  </div>

                  {item.observacoes && (
                    <p className="text-xs text-vinho/70 bg-marfim/60 p-2.5 rounded-xl border border-vinho/10 leading-relaxed">
                      {item.observacoes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-vinho/60">
                Carregando histórico de horas...
              </div>
            ) : comprasFiltradas.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Clock className="w-10 h-10 text-vinho/30 mx-auto" />
                <p className="text-sm font-medium text-vinho/70">
                  Nenhum registro de horas comprado encontrado.
                </p>
                <Button onClick={handleOpenCreate} variant="outline" size="sm">
                  Cadastrar primeiro pacote de horas
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-marfim">
                  <TableRow className="border-b border-vinho/10">
                    <TableHead className="font-bold text-vinho text-xs">Data</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">
                      Descrição / Pacote
                    </TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Horas Adquiridas</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Valor (R$)</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Situação</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Observações</TableHead>
                    <TableHead className="w-24 text-right font-bold text-vinho text-xs">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-vinho/5">
                  {comprasFiltradas.map((item) => (
                    <TableRow key={item.id} className="hover:bg-vinho/5">
                      <TableCell className="text-xs font-semibold text-vinho">
                        {formatDateBR(item.data)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-vinho max-w-xs">
                        {item.descricao}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold text-vinho bg-vinho/10 px-2.5 py-1 rounded-full border border-vinho/15">
                          +{item.quantidade_horas}h
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-vinho">
                        {item.valor ? formatCurrencyBRL(item.valor) : '-'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleSituacao(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            item.situacao === 'paga'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Clique para alternar situação (paga / em aberto)"
                        >
                          {item.situacao === 'paga' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Paga
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Em Aberto
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-vinho/70 max-w-xs truncate">
                        {item.observacoes || '-'}
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
        </TabsContent>

        {/* ABA 2: CONSUMOS ORIGINADOS DA AGENDA (SINCRONIZADO) */}
        <TabsContent value="consumo" className="space-y-4 m-0">
          <div className="bg-marfim border border-vinho/15 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-vinho/80">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-dourado-dark shrink-0" />
              <span>
                As horas abaixo foram definidas nos agendamentos da Agenda de Gravação e são
                automaticamente debitadas do seu banco de horas.
              </span>
            </div>
            <Link
              to="/admin/agenda"
              className="text-xs font-bold text-vinho hover:text-dourado-dark underline shrink-0"
            >
              Editar Agendamentos
            </Link>
          </div>

          {/* Mobile Consumo Cards */}
          <div className="block md:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
                Carregando consumos da agenda...
              </div>
            ) : consumosAgenda.length === 0 ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-3">
                <CalendarDays className="w-10 h-10 text-vinho/30 mx-auto" />
                <p className="text-sm font-medium text-vinho/70">
                  Nenhum episódio da agenda possui horas registradas ainda.
                </p>
                <Link to="/admin/agenda">
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    Ir para Agenda e definir horas nos episódios
                  </Button>
                </Link>
              </div>
            ) : (
              consumosAgenda.map((ag) => (
                <div
                  key={ag.id}
                  className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-vinho">{ag.titulo}</h4>
                      <span className="text-xs text-dourado-dark font-medium">
                        Gravação: {formatDateBR(ag.data_gravacao)}
                      </span>
                    </div>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 text-xs shrink-0">
                      -{ag.horas_utilizadas}h
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-vinho/5 text-xs">
                    <span className="text-vinho/70">
                      {ag.tem_convidado && ag.nome_convidado ? ag.nome_convidado : 'Sem convidado'}
                    </span>
                    <Link
                      to="/admin/agenda"
                      className="inline-flex items-center gap-1 font-semibold text-vinho hover:text-dourado-dark"
                    >
                      <span>Ver na Agenda</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Consumo Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-vinho/60">
                Carregando consumos da agenda...
              </div>
            ) : consumosAgenda.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CalendarDays className="w-10 h-10 text-vinho/30 mx-auto" />
                <p className="text-sm font-medium text-vinho/70">
                  Nenhum episódio da agenda possui horas registradas ainda.
                </p>
                <Link to="/admin/agenda">
                  <Button variant="outline" size="sm">
                    Ir para Agenda e definir horas nos episódios
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-marfim">
                  <TableRow className="border-b border-vinho/10">
                    <TableHead className="font-bold text-vinho text-xs">Data da Gravação</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Episódio / Pauta</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Convidado(a)</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Horas Debitadas</TableHead>
                    <TableHead className="w-28 text-right font-bold text-vinho text-xs">
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-vinho/5">
                  {consumosAgenda.map((ag) => (
                    <TableRow key={ag.id} className="hover:bg-vinho/5">
                      <TableCell className="text-xs font-semibold text-dourado-dark">
                        {formatDateBR(ag.data_gravacao)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-vinho max-w-sm">
                        {ag.titulo}
                        {ag.roteiro && (
                          <span className="block text-[10px] font-normal text-vinho/60 line-clamp-1 mt-0.5">
                            {ag.roteiro}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-vinho">
                        {ag.tem_convidado && ag.nome_convidado ? (
                          <span className="font-medium">{ag.nome_convidado}</span>
                        ) : (
                          <span className="text-vinho/40 italic">Sem convidado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          -{ag.horas_utilizadas}h
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to="/admin/agenda"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-vinho hover:text-dourado-dark hover:underline"
                        >
                          <span>Ver na Agenda</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL DE CADASTRO / EDIÇÃO DE HORAS COMPRADAS */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Horas Compradas' : 'Cadastrar Pacote de Horas'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="hc-desc" className="text-xs font-semibold text-vinho">
                Descrição do Pacote / Contrato *
              </Label>
              <Input
                id="hc-desc"
                required
                placeholder="Ex.: Pacote Mensal de Estúdio - 10 Horas"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hc-horas" className="text-xs font-semibold text-vinho">
                  Quantidade de Horas *
                </Label>
                <Input
                  id="hc-horas"
                  required
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="Ex.: 10"
                  value={quantidadeHoras}
                  onChange={(e) => setQuantidadeHoras(e.target.value)}
                  className="bg-white border-vinho/20 text-sm font-bold text-vinho"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hc-data" className="text-xs font-semibold text-vinho">
                  Data da Compra *
                </Label>
                <Input
                  id="hc-data"
                  type="date"
                  required
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  className="bg-white border-vinho/20 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hc-valor" className="text-xs font-semibold text-vinho">
                  Valor Pago (R$) <span className="text-vinho/60 font-normal">(opcional)</span>
                </Label>
                <Input
                  id="hc-valor"
                  placeholder="Ex.: 1500,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="bg-white border-vinho/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Situação *</Label>
                <Select
                  value={situacao}
                  onValueChange={(val: 'paga' | 'em_aberto') => setSituacao(val)}
                >
                  <SelectTrigger className="bg-white border-vinho/20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="em_aberto">Em Aberto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hc-obs" className="text-xs font-semibold text-vinho">
                Observações Adicionais
              </Label>
              <Textarea
                id="hc-obs"
                rows={3}
                placeholder="Ex.: Contrato com estúdio Áudio 4.0, validade de 90 dias, inclui técnico de som..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
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
                {saving ? 'Gravando...' : 'Salvar Pacote'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
