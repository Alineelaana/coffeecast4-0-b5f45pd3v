import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useStorefront } from '@/context/StorefrontContext'
import { AuditoriaService } from '@/services/auditoria'
import type {
  AuditoriaEventoRecord,
  AuditoriaRegraRecord,
  AuditoriaAlertaRecord,
  AuditoriaFiltros,
  AlertaStatus,
  AlertaPrioridade,
  AuditoriaTipoAcao,
} from '@/types/database'
import {
  Shield,
  Activity,
  AlertTriangle,
  Sliders,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Users,
  Store,
  Laptop,
  Smartphone,
  Calendar,
  ChevronRight,
  ChevronLeft,
  FileText,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Check,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

export default function AdminAuditoriaScreen() {
  const { user, isMaster, role, hasAuditoriaPermission } = useAuth()
  const { activeStore } = useStorefront()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tabs disponíveis: dashboard, registros, monitoramento, regras, alertas
  const initialTab = searchParams.get('tab') || 'dashboard'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Subpermissões granulares
  const canViewDashboard = isMaster || hasAuditoriaPermission('ver_dashboard')
  const canViewRegistros = isMaster || hasAuditoriaPermission('ver_registros')
  const canViewAlertas = isMaster || hasAuditoriaPermission('ver_alertas')
  const canCriarRegras = isMaster || hasAuditoriaPermission('criar_regras')
  const canExportar = isMaster || hasAuditoriaPermission('exportar')

  // Estados de dados
  const [eventos, setEventos] = useState<AuditoriaEventoRecord[]>([])
  const [regras, setRegras] = useState<AuditoriaRegraRecord[]>([])
  const [alertas, setAlertas] = useState<AuditoriaAlertaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEventos, setTotalEventos] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filtros avançados combináveis
  const [filtroPeriodo, setFiltroPeriodo] = useState<
    'todos' | 'hoje' | '7dias' | '30dias' | 'custom'
  >('todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroTipoAcao, setFiltroTipoAcao] = useState<string>('todos')
  const [filtroResultado, setFiltroResultado] = useState<string>('todos')
  const [filtroRole, setFiltroRole] = useState<string>('todos')
  const [filtroSuspeito, setFiltroSuspeito] = useState(false)
  const [filtroArea, setFiltroArea] = useState('todos')
  const [filtroUsuario, setFiltroUsuario] = useState('todos')
  const [busca, setBusca] = useState(searchParams.get('busca') || '')

  // Modal de Detalhes do Evento com Diff Antes/Depois
  const [detalheModalOpen, setDetalheModalOpen] = useState(false)
  const [eventoSelecionado, setEventoSelecionado] = useState<AuditoriaEventoRecord | null>(null)

  // Modal de Criação / Edição de Regra
  const [regraModalOpen, setRegraModalOpen] = useState(false)
  const [regraEditando, setRegraEditando] = useState<Partial<AuditoriaRegraRecord> | null>(null)
  const [savingRegra, setSavingRegra] = useState(false)

  // Modal de Resolução de Alerta
  const [alertaModalOpen, setAlertaModalOpen] = useState(false)
  const [alertaSelecionado, setAlertaSelecionado] = useState<AuditoriaAlertaRecord | null>(null)
  const [novoStatusAlerta, setNovoStatusAlerta] = useState<AlertaStatus>('em_analise')
  const [observacaoAlerta, setObservacaoAlerta] = useState('')
  const [updatingAlerta, setUpdatingAlerta] = useState(false)

  // Histórico de status por usuário selecionado
  const [usuarioStatusSelecionado, setUsuarioStatusSelecionado] = useState<string>('todos')
  const [periodoStatusInicio, setPeriodoStatusInicio] = useState<string>('')
  const [periodoStatusFim, setPeriodoStatusFim] = useState<string>('')
  const [loadingStatusReport, setLoadingStatusReport] = useState<boolean>(false)
  const [statusReport, setStatusReport] = useState<{
    eventos: AuditoriaEventoRecord[]
    tempoOnlineSegundos: number
    tempoOfflineSegundos: number
    tempoPausaSegundos: number
    totalSegundos: number
    percentualOnline: number
    percentualOffline: number
    percentualPausa: number
  } | null>(null)

  const carregarRelatorioStatus = async (uid: string, inicio?: string, fim?: string) => {
    setLoadingStatusReport(true)
    try {
      const report = await AuditoriaService.obterHistoricoStatusUsuario(uid, inicio, fim)
      setStatusReport(report)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao calcular histórico de status.')
    } finally {
      setLoadingStatusReport(false)
    }
  }

  // Carregar dados de acordo com os filtros
  const carregarDados = async () => {
    setLoading(true)
    try {
      // Período
      let finalInicio = dataInicio
      let finalFim = dataFim
      const now = new Date()

      if (filtroPeriodo === 'hoje') {
        finalInicio = now.toISOString().slice(0, 10)
        finalFim = now.toISOString().slice(0, 10)
      } else if (filtroPeriodo === '7dias') {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        finalInicio = d.toISOString().slice(0, 10)
        finalFim = now.toISOString().slice(0, 10)
      } else if (filtroPeriodo === '30dias') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        finalInicio = d.toISOString().slice(0, 10)
        finalFim = now.toISOString().slice(0, 10)
      }

      const filtros: AuditoriaFiltros = {
        dataInicio: finalInicio || undefined,
        dataFim: finalFim || undefined,
        tipoAcao: filtroTipoAcao,
        resultado: filtroResultado,
        role: filtroRole,
        suspeito: filtroSuspeito,
        busca: busca.trim() || undefined,
        usuarioId: filtroUsuario !== 'todos' ? filtroUsuario : undefined,
      }

      const [resEventos, resRegras, resAlertas] = await Promise.all([
        AuditoriaService.listarEventos(filtros, page, 50),
        AuditoriaService.listarRegras(),
        AuditoriaService.listarAlertas(),
      ])

      setEventos(resEventos.items)
      setTotalEventos(resEventos.totalItems)
      setTotalPages(resEventos.totalPages)
      setRegras(resRegras)
      setAlertas(resAlertas)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados da auditoria.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [
    page,
    filtroPeriodo,
    dataInicio,
    dataFim,
    filtroTipoAcao,
    filtroResultado,
    filtroRole,
    filtroSuspeito,
    filtroUsuario,
  ])

  useEffect(() => {
    if (activeTab === 'monitoramento') {
      carregarRelatorioStatus(usuarioStatusSelecionado, periodoStatusInicio, periodoStatusFim)
    }
  }, [activeTab, usuarioStatusSelecionado, periodoStatusInicio, periodoStatusFim])

  // Tratar busca por ID vinda da URL
  useEffect(() => {
    const buscaParam = searchParams.get('busca')
    if (buscaParam) {
      setBusca(buscaParam)
      setActiveTab('registros')
    }
  }, [searchParams])

  // Ações de Regras
  const handleOpenNovaRegra = () => {
    setRegraEditando({
      nome: '',
      descricao: '',
      evento_monitorado: 'todos',
      palavra_chave: '',
      prioridade: 'alta',
      criterio_disparo: 'imediato',
      ativo: true,
      niveis_monitorados: ['adm', 'gerencial', 'ouro', 'prata', 'master'],
    })
    setRegraModalOpen(true)
  }

  const handleSalvarRegra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regraEditando || !regraEditando.nome) {
      toast.error('O nome da regra é obrigatório.')
      return
    }

    setSavingRegra(true)
    try {
      await AuditoriaService.salvarRegra({
        ...regraEditando,
        criado_por: user?.name || user?.email || 'Administrador',
      })
      toast.success('Regra de monitoramento salva com sucesso!')
      setRegraModalOpen(false)
      const r = await AuditoriaService.listarRegras()
      setRegras(r)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar regra.')
    } finally {
      setSavingRegra(false)
    }
  }

  const handleExcluirRegra = async (id: string, nome: string) => {
    if (!isMaster) {
      toast.error('Apenas o Superadministrador Master pode excluir regras de auditoria.')
      return
    }
    if (!window.confirm(`Deseja realmente excluir a regra "${nome}"?`)) return
    try {
      await AuditoriaService.excluirRegra(id)
      toast.success('Regra removida com sucesso.')
      setRegras((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir regra.')
    }
  }

  // Ações de Alertas
  const handleOpenAlerta = (alerta: AuditoriaAlertaRecord) => {
    setAlertaSelecionado(alerta)
    setNovoStatusAlerta(alerta.status === 'novo' ? 'em_analise' : alerta.status)
    setObservacaoAlerta('')
    setAlertaModalOpen(true)
  }

  const handleSalvarStatusAlerta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertaSelecionado) return

    setUpdatingAlerta(true)
    try {
      await AuditoriaService.atualizarStatusAlerta(
        alertaSelecionado.id,
        novoStatusAlerta,
        observacaoAlerta.trim() || undefined,
      )
      toast.success('Status do alerta atualizado!')
      setAlertaModalOpen(false)
      const att = await AuditoriaService.listarAlertas()
      setAlertas(att)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar alerta.')
    } finally {
      setUpdatingAlerta(false)
    }
  }

  // Exportar CSV
  const handleExportar = () => {
    if (!canExportar) {
      toast.error('Você não possui permissão para exportar relatórios de auditoria.')
      return
    }
    AuditoriaService.exportarCSV(eventos)
    toast.success('Relatório CSV de auditoria exportado com sucesso!')
  }

  // Métricas do Dashboard de Auditoria
  const metricas = useMemo(() => {
    const total = eventos.length
    const exclusoes = eventos.filter((e) => e.tipo_acao === 'exclusao').length
    const alteracoes = eventos.filter(
      (e) =>
        e.tipo_acao === 'edicao' ||
        e.tipo_acao === 'alteracao_permissao' ||
        e.tipo_acao === 'movimentacao_financeira',
    ).length
    const falhasLogin = eventos.filter((e) => e.tipo_acao === 'falha_login').length
    const bloqueios = eventos.filter(
      (e) => e.resultado === 'bloqueio' || e.tipo_acao === 'bloqueio_acesso',
    ).length
    const suspeitos = eventos.filter((e) => e.suspeito).length

    const alertasNovos = alertas.filter((a) => a.status === 'novo').length
    const alertasCriticos = alertas.filter(
      (a) => a.prioridade === 'critica' && a.status !== 'resolvido',
    ).length

    // Atividades por usuário
    const porUsuario: Record<
      string,
      { nome: string; email: string; role: string; count: number; suspeitas: number }
    > = {}
    eventos.forEach((e) => {
      const chave = e.usuario_email || e.usuario_nome || 'Sistema'
      if (!porUsuario[chave]) {
        porUsuario[chave] = {
          nome: e.usuario_nome || chave,
          email: e.usuario_email || chave,
          role: e.usuario_role || 'sistema',
          count: 0,
          suspeitas: 0,
        }
      }
      porUsuario[chave].count++
      if (e.suspeito || e.resultado === 'bloqueio') {
        porUsuario[chave].suspeitas++
      }
    })

    // Áreas mais alteradas
    const porArea: Record<string, number> = {}
    eventos.forEach((e) => {
      const area = e.area_sistema || 'Geral'
      porArea[area] = (porArea[area] || 0) + 1
    })

    return {
      total,
      exclusoes,
      alteracoes,
      falhasLogin,
      bloqueios,
      suspeitos,
      alertasNovos,
      alertasCriticos,
      topUsuarios: Object.values(porUsuario).sort((a, b) => b.count - a.count),
      topAreas: Object.entries(porArea).sort((a, b) => b[1] - a[1]),
    }
  }, [eventos, alertas])

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA AUDITORIA */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-vinho/10 flex items-center justify-center text-vinho">
              <Activity className="w-5 h-5 text-dourado-dark" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-vinho tracking-tight">
              Auditoria do Sistema
            </h1>
            <Badge className="bg-dourado text-vinho font-bold text-[10px] uppercase tracking-wider">
              {isMaster ? 'Master Soberano' : 'ADM Autorizado'}
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Imutável & Protegido
            </Badge>
          </div>
          <p className="text-xs text-vinho/70 max-w-3xl">
            Rastreamento integral de ações: quem fez, o que fez, quando fez, IP, navegador,
            dispositivo e comparativo antes/depois. Histórico protegido contra edição ou exclusão.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={loading}
            className="text-xs border-vinho/20 text-vinho hover:bg-vinho/5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {canExportar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportar}
              className="text-xs border-dourado/40 text-vinho hover:bg-dourado/10 h-9 font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-dourado-dark" />
              Exportar CSV
            </Button>
          )}

          {canCriarRegras && (
            <Button
              type="button"
              size="sm"
              onClick={handleOpenNovaRegra}
              className="text-xs bg-vinho hover:bg-vinho-light text-white font-semibold h-9 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 text-dourado" />
              Nova Regra
            </Button>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-marfim border border-vinho/15 p-1 rounded-2xl flex flex-wrap h-auto gap-1">
          {canViewDashboard && (
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-vinho data-[state=active]:text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Dashboard
            </TabsTrigger>
          )}

          {canViewRegistros && (
            <TabsTrigger
              value="registros"
              className="data-[state=active]:bg-vinho data-[state=active]:text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-all"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Registros de Atividades ({totalEventos})
            </TabsTrigger>
          )}

          <TabsTrigger
            value="monitoramento"
            className="data-[state=active]:bg-vinho data-[state=active]:text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-all"
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Monitoramento de Usuários
          </TabsTrigger>

          {canCriarRegras && (
            <TabsTrigger
              value="regras"
              className="data-[state=active]:bg-vinho data-[state=active]:text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-all"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              Regras de Monitoramento ({regras.length})
            </TabsTrigger>
          )}

          {canViewAlertas && (
            <TabsTrigger
              value="alertas"
              className="data-[state=active]:bg-vinho data-[state=active]:text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-all relative"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Central de Alertas
              {metricas.alertasNovos > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                  {metricas.alertasNovos}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ========================================================
            ABA 1: DASHBOARD DE AUDITORIA
        ======================================================== */}
        {canViewDashboard && (
          <TabsContent value="dashboard" className="space-y-6">
            {/* CARDS INDICADORES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-vinho/10 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-vinho/60 block">Total Ações</span>
                <span className="text-2xl font-serif font-bold text-vinho">{metricas.total}</span>
                <span className="text-[10px] text-emerald-600 block">Últimos eventos</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-vinho/10 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-rose-700 block">Exclusões</span>
                <span className="text-2xl font-serif font-bold text-rose-700">
                  {metricas.exclusoes}
                </span>
                <span className="text-[10px] text-rose-600/80 block">Gravadas permanente</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-vinho/10 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-amber-700 block">Alterações</span>
                <span className="text-2xl font-serif font-bold text-amber-700">
                  {metricas.alteracoes}
                </span>
                <span className="text-[10px] text-amber-600/80 block">Com diff antes/depois</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-vinho/10 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-vinho/60 block">Falhas de Login</span>
                <span className="text-2xl font-serif font-bold text-vinho">
                  {metricas.falhasLogin}
                </span>
                <span className="text-[10px] text-vinho/50 block">Tentativas incorretas</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-vinho/10 shadow-sm space-y-1">
                <span className="text-[11px] font-medium text-purple-700 block">
                  Bloqueios de Acesso
                </span>
                <span className="text-2xl font-serif font-bold text-purple-700">
                  {metricas.bloqueios}
                </span>
                <span className="text-[10px] text-purple-600 block">
                  Tentativas não autorizadas
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-300 bg-rose-50/40 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-rose-800 block">Alertas Abertos</span>
                <span className="text-2xl font-serif font-bold text-rose-800">
                  {metricas.alertasNovos}
                </span>
                <span className="text-[10px] text-rose-600 font-semibold block">
                  {metricas.alertasCriticos} crítico(s)
                </span>
              </div>
            </div>

            {/* GRÁFICOS / VISÕES DETALHADAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usuários mais ativos & comportamento */}
              <div className="bg-white p-5 rounded-2xl border border-vinho/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
                  <h3 className="font-serif font-bold text-vinho text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-dourado-dark" />
                    Atividade por Usuário
                  </h3>
                  <span className="text-[11px] text-vinho/50">Volume de ações e suspeitas</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {metricas.topUsuarios.length === 0 ? (
                    <p className="text-xs text-vinho/50 italic py-6 text-center">
                      Nenhum evento registrado ainda.
                    </p>
                  ) : (
                    metricas.topUsuarios.slice(0, 8).map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-vinho/5 border border-vinho/5 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-[10px] shrink-0 uppercase">
                            {u.nome.slice(0, 2)}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-vinho truncate">{u.nome}</p>
                            <p className="text-[10px] text-vinho/60 font-mono truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className="bg-vinho/10 text-vinho text-[9px] uppercase font-bold">
                            {u.role}
                          </Badge>
                          <span className="font-bold text-vinho text-xs">{u.count} ações</span>
                          {u.suspeitas > 0 && (
                            <Badge className="bg-rose-100 text-rose-800 border border-rose-300 text-[9px]">
                              {u.suspeitas} suspeita(s)
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Áreas mais alteradas do sistema */}
              <div className="bg-white p-5 rounded-2xl border border-vinho/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
                  <h3 className="font-serif font-bold text-vinho text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-dourado-dark" />
                    Áreas Mais Acessadas / Alteradas
                  </h3>
                  <span className="text-[11px] text-vinho/50">Distribuição no sistema</span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {metricas.topAreas.length === 0 ? (
                    <p className="text-xs text-vinho/50 italic py-6 text-center">
                      Nenhuma atividade registrada ainda.
                    </p>
                  ) : (
                    metricas.topAreas.map(([area, qtd], idx) => {
                      const perc = Math.round((qtd / Math.max(1, metricas.total)) * 100)
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-vinho">{area}</span>
                            <span className="text-vinho/60 text-[11px]">
                              {qtd} ações ({perc}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-vinho/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-vinho rounded-full"
                              style={{ width: `${Math.min(100, perc)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* ========================================================
            ABA 2: REGISTROS DE ATIVIDADES (AUDIT LOG COM DIFF)
        ======================================================== */}
        {canViewRegistros && (
          <TabsContent value="registros" className="space-y-4">
            {/* BARRA DE FILTROS AVANÇADOS E COMBINÁVEIS */}
            <div className="bg-white p-4 rounded-2xl border border-vinho/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-vinho/10 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-vinho">
                  <Filter className="w-4 h-4 text-dourado-dark" />
                  <span>Filtros Avançados de Auditoria</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroPeriodo('todos')
                    setDataInicio('')
                    setDataFim('')
                    setFiltroTipoAcao('todos')
                    setFiltroResultado('todos')
                    setFiltroRole('todos')
                    setFiltroSuspeito(false)
                    setFiltroUsuario('todos')
                    setBusca('')
                  }}
                  className="text-[11px] text-dourado-dark hover:underline font-semibold"
                >
                  Limpar todos os filtros
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                {/* Período */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-vinho/70 font-semibold">Período</Label>
                  <Select value={filtroPeriodo} onValueChange={(val: any) => setFiltroPeriodo(val)}>
                    <SelectTrigger className="h-8 text-xs bg-marfim/30 border-vinho/15">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todo o Histórico</SelectItem>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                      <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                      <SelectItem value="custom">Data Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Ação */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-vinho/70 font-semibold">Tipo de Ação</Label>
                  <Select value={filtroTipoAcao} onValueChange={setFiltroTipoAcao}>
                    <SelectTrigger className="h-8 text-xs bg-marfim/30 border-vinho/15">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as ações</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="falha_login">Falha de Login</SelectItem>
                      <SelectItem value="criacao">Criação</SelectItem>
                      <SelectItem value="edicao">Edição</SelectItem>
                      <SelectItem value="exclusao">Exclusão (Crítica)</SelectItem>
                      <SelectItem value="alteracao_permissao">Alteração Permissão</SelectItem>
                      <SelectItem value="movimentacao_financeira">Financeiro</SelectItem>
                      <SelectItem value="chat">Chat / Conversa</SelectItem>
                      <SelectItem value="alteracao_status">Alteração de status</SelectItem>
                      <SelectItem value="bloqueio_acesso">Bloqueio / Não Autorizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resultado */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-vinho/70 font-semibold">Resultado</Label>
                  <Select value={filtroResultado} onValueChange={setFiltroResultado}>
                    <SelectTrigger className="h-8 text-xs bg-marfim/30 border-vinho/15">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="sucesso">Sucesso</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                      <SelectItem value="bloqueio">Bloqueio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cargo / Nível */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-vinho/70 font-semibold">Nível de Acesso</Label>
                  <Select value={filtroRole} onValueChange={setFiltroRole}>
                    <SelectTrigger className="h-8 text-xs bg-marfim/30 border-vinho/15">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os níveis</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="adm">ADM</SelectItem>
                      <SelectItem value="gerencial">Gerencial</SelectItem>
                      <SelectItem value="ouro">Ouro</SelectItem>
                      <SelectItem value="prata">Prata</SelectItem>
                      <SelectItem value="sistema">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Busca em texto livre */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[10px] text-vinho/70 font-semibold">
                    Palavra-Chave / Busca Livre
                  </Label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Busca por nome, email, descrição, IP..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && carregarDados()}
                      className="h-8 text-xs bg-marfim/30 border-vinho/15"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={carregarDados}
                      className="h-8 px-2.5 bg-vinho text-white"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Linha extra para filtro de Suspeitos e Datas customizadas */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-vinho/5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={filtroSuspeito}
                    onChange={(e) => setFiltroSuspeito(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  Filtrar apenas Ações Suspeitas
                </label>

                {filtroPeriodo === 'custom' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-vinho/70 text-[11px]">De:</span>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="h-7 text-xs w-36 bg-white"
                    />
                    <span className="text-vinho/70 text-[11px]">Até:</span>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="h-7 text-xs w-36 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* TABELA DE EVENTOS */}
            <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-xs text-vinho/60 space-y-2">
                  <div className="w-8 h-8 border-3 border-dourado border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Consultando registros imutáveis de auditoria...</p>
                </div>
              ) : eventos.length === 0 ? (
                <div className="py-16 text-center text-xs text-vinho/60 space-y-2">
                  <Activity className="w-10 h-10 text-vinho/20 mx-auto" />
                  <p className="font-semibold text-vinho">Nenhum evento encontrado.</p>
                  <p className="text-[11px] text-vinho/50">Tente relaxar os filtros aplicados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-marfim border-b border-vinho/10 text-vinho uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5 font-bold">Data & Hora</th>
                        <th className="py-3 px-3.5 font-bold">Usuário / Nível</th>
                        <th className="py-3 px-3.5 font-bold">Ação & Área</th>
                        <th className="py-3 px-3.5 font-bold">Descrição da Ação</th>
                        <th className="py-3 px-3.5 font-bold">IP & Dispositivo</th>
                        <th className="py-3 px-3.5 font-bold">Resultado</th>
                        <th className="py-3 px-3.5 font-bold text-right">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vinho/5">
                      {eventos.map((evt) => {
                        const isExclusao = evt.tipo_acao === 'exclusao'
                        const isBloqueio = evt.resultado === 'bloqueio'
                        const isSuspeito = Boolean(evt.suspeito)
                        const hasDiff = Boolean(evt.diff_antes || evt.diff_depois)

                        return (
                          <tr
                            key={evt.id}
                            className={`hover:bg-vinho/5 transition-colors cursor-pointer ${
                              isSuspeito ? 'bg-rose-50/50' : isExclusao ? 'bg-amber-50/30' : ''
                            }`}
                            onClick={() => {
                              setEventoSelecionado(evt)
                              setDetalheModalOpen(true)
                            }}
                          >
                            <td className="py-3 px-3.5 text-vinho whitespace-nowrap">
                              <span className="font-bold block text-xs">
                                {new Date(evt.created).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                              <span className="text-[10px] text-vinho/60 block">
                                {new Date(evt.created).toLocaleDateString('pt-BR')}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 text-vinho">
                              <div className="font-bold text-xs truncate max-w-[140px]">
                                {evt.usuario_nome || 'Sistema'}
                              </div>
                              <div className="text-[10px] text-vinho/60 font-mono truncate max-w-[140px]">
                                {evt.usuario_email || '—'}
                              </div>
                              {evt.usuario_role && (
                                <Badge className="bg-vinho/10 text-vinho text-[9px] uppercase font-bold mt-0.5">
                                  {evt.usuario_role}
                                </Badge>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-vinho whitespace-nowrap">
                              <Badge
                                className={`text-[10px] font-bold uppercase ${
                                  isExclusao
                                    ? 'bg-rose-600 text-white'
                                    : evt.tipo_acao === 'falha_login'
                                      ? 'bg-amber-600 text-white'
                                      : evt.tipo_acao === 'login'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-vinho text-white'
                                }`}
                              >
                                {evt.tipo_acao.replace('_', ' ')}
                              </Badge>
                              <span className="block text-[11px] text-vinho/70 mt-0.5">
                                {evt.area_sistema}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 text-vinho max-w-xs">
                              <p className="line-clamp-2 text-xs font-medium">{evt.descricao}</p>
                              {evt.registro_afetado && (
                                <span className="text-[10px] text-vinho/50 font-mono">
                                  Ref: {evt.registro_afetado}
                                </span>
                              )}
                              {hasDiff && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-dourado-dark bg-dourado/10 px-1.5 py-0.2 rounded mt-1 ml-1">
                                  Antes / Depois disponível
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-vinho whitespace-nowrap">
                              <span className="font-mono text-xs block">{evt.ip || '—'}</span>
                              <span className="text-[10px] text-vinho/60 flex items-center gap-1">
                                {evt.dispositivo === 'Mobile' ? (
                                  <Smartphone className="w-3 h-3 text-vinho/50" />
                                ) : (
                                  <Laptop className="w-3 h-3 text-vinho/50" />
                                )}
                                {evt.dispositivo || 'Desktop'} · {evt.navegador || 'Web'}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {evt.resultado === 'sucesso' && (
                                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-semibold">
                                  Sucesso
                                </Badge>
                              )}
                              {evt.resultado === 'erro' && (
                                <Badge className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-semibold">
                                  Erro
                                </Badge>
                              )}
                              {evt.resultado === 'bloqueio' && (
                                <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-semibold">
                                  Bloqueio
                                </Badge>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEventoSelecionado(evt)
                                  setDetalheModalOpen(true)
                                }}
                                className="h-7 text-xs text-vinho hover:bg-vinho/10"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1 text-dourado-dark" />
                                Detalhes
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PAGINAÇÃO */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-vinho/10 bg-marfim/30 text-xs">
                  <span className="text-vinho/70">
                    Página {page} de {totalPages} ({totalEventos} eventos)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-7 px-2.5 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="h-7 px-2.5 text-xs"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* ========================================================
            ABA 3: MONITORAMENTO DE USUÁRIOS
        ======================================================== */}
        <TabsContent value="monitoramento" className="space-y-6">
          {/* SEÇÃO NOVO: MONITORAMENTO DE TEMPO E STATUS DO USUÁRIO */}
          <div className="bg-gradient-to-r from-vinho via-[#3d1332] to-[#240b1e] p-5 sm:p-6 rounded-3xl text-white shadow-md space-y-4 border border-dourado/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dourado/30 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-dourado" />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                    Histórico & Tempo Acumulado de Status (Chat & Sessão)
                  </h3>
                  <Badge className="bg-dourado text-vinho font-black text-[10px] px-2 py-0.5 rounded-full">
                    Auditoria de Presença
                  </Badge>
                </div>
                <p className="text-xs text-marfim/80">
                  Consulte o tempo total acumulado em <strong>Online</strong>,{' '}
                  <strong>Offline</strong> e <strong>Em pausa</strong> (com motivos), somatório com
                  percentuais e histórico completo de transições.
                </p>
              </div>

              {/* FILTRO DE USUÁRIO E PERÍODO */}
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={usuarioStatusSelecionado}
                  onValueChange={(val) => {
                    setUsuarioStatusSelecionado(val)
                    carregarRelatorioStatus(val, periodoStatusInicio, periodoStatusFim)
                  }}
                >
                  <SelectTrigger className="h-9 w-48 text-xs bg-white text-vinho border-dourado font-semibold rounded-xl">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Usuários</SelectItem>
                    {metricas.topUsuarios.map((u, i) => (
                      <SelectItem key={i} value={u.email}>
                        {u.nome} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 text-xs">
                  <Input
                    type="date"
                    value={periodoStatusInicio}
                    onChange={(e) => setPeriodoStatusInicio(e.target.value)}
                    className="h-9 w-32 bg-white text-vinho text-xs rounded-xl"
                    title="Data de Início"
                  />
                  <span className="text-marfim/70 text-xs">até</span>
                  <Input
                    type="date"
                    value={periodoStatusFim}
                    onChange={(e) => setPeriodoStatusFim(e.target.value)}
                    className="h-9 w-32 bg-white text-vinho text-xs rounded-xl"
                    title="Data de Fim"
                  />
                  {(periodoStatusInicio || periodoStatusFim) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPeriodoStatusInicio('')
                        setPeriodoStatusFim('')
                      }}
                      className="h-9 px-2 text-dourado hover:text-white hover:bg-white/10 text-xs"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* CARDS DE TEMPO ACUMULADO */}
            {loadingStatusReport ? (
              <div className="py-8 text-center text-xs text-marfim/70 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-dourado" />
                <span>Calculando tempos acumulados de presença...</span>
              </div>
            ) : statusReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* ONLINE */}
                  <div className="bg-white/10 backdrop-blur-md border border-emerald-400/40 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-300/30" />
                        Online
                      </span>
                      <span className="text-white font-bold">{statusReport.percentualOnline}%</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-black text-white">
                      {Math.floor(statusReport.tempoOnlineSegundos / 3600)}h{' '}
                      {Math.floor((statusReport.tempoOnlineSegundos % 3600) / 60)}m
                    </div>
                    <p className="text-[10px] text-marfim/70">
                      {statusReport.tempoOnlineSegundos}s acumulados em atividade
                    </p>
                  </div>

                  {/* EM PAUSA */}
                  <div className="bg-white/10 backdrop-blur-md border border-amber-400/40 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-300/30 animate-pulse" />
                        Em pausa
                      </span>
                      <span className="text-white font-bold">{statusReport.percentualPausa}%</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-black text-white">
                      {Math.floor(statusReport.tempoPausaSegundos / 3600)}h{' '}
                      {Math.floor((statusReport.tempoPausaSegundos % 3600) / 60)}m
                    </div>
                    <p className="text-[10px] text-marfim/70">
                      Almoço, Reunião, Intervalo, Atendimento
                    </p>
                  </div>

                  {/* OFFLINE */}
                  <div className="bg-white/10 backdrop-blur-md border border-slate-400/40 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-300/30" />
                        Offline
                      </span>
                      <span className="text-white font-bold">
                        {statusReport.percentualOffline}%
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-black text-white">
                      {Math.floor(statusReport.tempoOfflineSegundos / 3600)}h{' '}
                      {Math.floor((statusReport.tempoOfflineSegundos % 3600) / 60)}m
                    </div>
                    <p className="text-[10px] text-marfim/70">Desconectado ou sem sessão ativa</p>
                  </div>

                  {/* TOTAL DE TRANSIÇÕES */}
                  <div className="bg-white/10 backdrop-blur-md border border-dourado/40 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-dourado font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        Transições Registradas
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-serif font-black text-white">
                      {statusReport.eventos.length}
                    </div>
                    <p className="text-[10px] text-marfim/70">
                      Eventos imutáveis com IP, dispositivo e motivo
                    </p>
                  </div>
                </div>

                {/* BARRA DE PROGRESSO PERCENTUAL CONSOLIDADA */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-marfim/80">
                    <span>Distribuição percentual do tempo no período:</span>
                    <span>
                      {statusReport.percentualOnline}% Online · {statusReport.percentualPausa}% Em
                      pausa · {statusReport.percentualOffline}% Offline
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${statusReport.percentualOnline}%` }}
                      className="bg-emerald-400 h-full transition-all"
                      title={`Online: ${statusReport.percentualOnline}%`}
                    />
                    <div
                      style={{ width: `${statusReport.percentualPausa}%` }}
                      className="bg-amber-400 h-full transition-all"
                      title={`Em pausa: ${statusReport.percentualPausa}%`}
                    />
                    <div
                      style={{ width: `${statusReport.percentualOffline}%` }}
                      className="bg-slate-400 h-full transition-all"
                      title={`Offline: ${statusReport.percentualOffline}%`}
                    />
                  </div>
                </div>

                {/* TABELA DE ÚLTIMAS TRANSIÇÕES DO USUÁRIO */}
                {statusReport.eventos.length > 0 && (
                  <div className="bg-white/95 text-vinho rounded-2xl p-4 space-y-2 border border-dourado/40 shadow-inner">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-vinho flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-dourado-dark" />
                      Histórico Recente de Mudanças de Status
                    </h4>
                    <div className="max-h-56 overflow-y-auto divide-y divide-vinho/10 text-xs">
                      {statusReport.eventos.slice(0, 8).map((evt) => {
                        const diffDepois = evt.diff_depois as any
                        const diffAntes = evt.diff_antes as any
                        const duracao =
                          diffDepois?.duracao_status_anterior_segundos ||
                          evt.metadata?.duracao_segundos ||
                          0
                        return (
                          <div
                            key={evt.id}
                            className="py-2 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-vinho truncate">{evt.descricao}</p>
                              <p className="text-[10px] text-vinho/60 font-mono">
                                {new Date(evt.created).toLocaleString('pt-BR')} ·{' '}
                                {evt.dispositivo || 'Desktop'} · IP: {evt.ip || '—'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {duracao > 0 && (
                                <Badge className="bg-vinho/10 text-vinho text-[9px] font-bold">
                                  {Math.round(duracao / 60)} min no status anterior
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-vinho/10 shadow-sm space-y-4">
            <div>
              <h3 className="font-serif font-bold text-vinho text-base">
                Painel Individual de Atividade por Usuário
              </h3>
              <p className="text-xs text-vinho/70">
                Acompanhe o comportamento de cada operador: quantidade de ações, exclusões,
                alterações, tentativas bloqueadas, erros, IPs e dispositivos mais utilizados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metricas.topUsuarios.map((userItem, idx) => {
                // Ações deste usuário
                const userEventos = eventos.filter(
                  (e) => e.usuario_email === userItem.email || e.usuario_nome === userItem.nome,
                )
                const ultimoEvento = userEventos[0]
                const totalExclusoes = userEventos.filter((e) => e.tipo_acao === 'exclusao').length
                const totalEdicoes = userEventos.filter((e) => e.tipo_acao === 'edicao').length
                const totalBloqueios = userEventos.filter((e) => e.resultado === 'bloqueio').length

                // IPs únicos utilizados
                const ips = Array.from(new Set(userEventos.map((e) => e.ip).filter(Boolean)))
                const devices = Array.from(
                  new Set(userEventos.map((e) => e.dispositivo).filter(Boolean)),
                )

                return (
                  <div
                    key={idx}
                    className="bg-marfim/30 rounded-2xl border border-vinho/10 p-4 space-y-3 hover:border-dourado/40 transition-colors shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-vinho text-dourado font-bold flex items-center justify-center text-xs uppercase shadow-xs">
                          {userItem.nome.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-vinho text-xs truncate">{userItem.nome}</h4>
                          <p className="text-[11px] text-vinho/60 font-mono truncate">
                            {userItem.email}
                          </p>
                          <Badge className="bg-vinho/10 text-vinho text-[9px] uppercase font-bold mt-0.5">
                            {userItem.role}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-vinho/10 text-center">
                      <div className="bg-white p-2 rounded-xl border border-vinho/5">
                        <span className="text-[9px] text-vinho/60 block">Ações</span>
                        <span className="font-bold text-vinho text-sm">{userEventos.length}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-vinho/5">
                        <span className="text-[9px] text-amber-700 block">Edições</span>
                        <span className="font-bold text-amber-700 text-sm">{totalEdicoes}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-vinho/5">
                        <span className="text-[9px] text-rose-700 block">Exclusões</span>
                        <span className="font-bold text-rose-700 text-sm">{totalExclusoes}</span>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-1 pt-1 text-vinho/70">
                      <div className="flex justify-between">
                        <span>Último Acesso:</span>
                        <span className="font-mono text-vinho font-semibold">
                          {ultimoEvento
                            ? new Date(ultimoEvento.created).toLocaleString('pt-BR')
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tentativas Bloqueadas:</span>
                        <span
                          className={`font-semibold ${totalBloqueios > 0 ? 'text-rose-600' : 'text-vinho'}`}
                        >
                          {totalBloqueios}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dispositivos:</span>
                        <span className="text-vinho font-medium">
                          {devices.join(', ') || 'Desktop'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>IPs Identificados:</span>
                        <span className="font-mono text-[10px] text-vinho truncate max-w-[140px]">
                          {ips.slice(0, 2).join(', ') || '—'}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFiltroUsuario(userItem.email)
                        setBusca(userItem.email)
                        setActiveTab('registros')
                      }}
                      className="w-full text-xs text-vinho border-vinho/20 hover:bg-vinho/5 h-8 font-semibold mt-2"
                    >
                      <Filter className="w-3 h-3 mr-1.5 text-dourado-dark" />
                      Investigar histórico deste usuário
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            ABA 4: REGRAS DE MONITORAMENTO
        ======================================================== */}
        {canCriarRegras && (
          <TabsContent value="regras" className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-vinho/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-vinho/10 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-vinho text-base">
                    Regras de Alerta Personalizadas
                  </h3>
                  <p className="text-xs text-vinho/70">
                    O sistema avalia cada ação em segundo plano e dispara alertas imediatos conforme
                    estas regras ativas.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleOpenNovaRegra}
                  className="bg-vinho hover:bg-vinho-light text-white text-xs font-semibold h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-dourado" />
                  Criar Regra
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {regras.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-vinho/10 bg-marfim/30 space-y-3 relative hover:border-dourado/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-vinho text-sm">{r.nome}</h4>
                          <Badge
                            className={`text-[9px] uppercase font-bold ${
                              r.prioridade === 'critica'
                                ? 'bg-rose-600 text-white'
                                : r.prioridade === 'alta'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-vinho/80 text-white'
                            }`}
                          >
                            {r.prioridade}
                          </Badge>
                        </div>
                        <p className="text-xs text-vinho/70">{r.descricao || 'Sem descrição'}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        {isMaster && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExcluirRegra(r.id, r.nome)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            title="Excluir regra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-vinho/5">
                      <div>
                        <span className="text-vinho/50 block text-[10px]">Evento Monitorado:</span>
                        <span className="font-semibold text-vinho">
                          {r.evento_monitorado.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-vinho/50 block text-[10px]">
                          Expressão / Palavra:
                        </span>
                        <span className="font-mono text-vinho font-semibold">
                          {r.palavra_chave ? `"${r.palavra_chave}"` : 'Qualquer'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[10px] text-vinho/50">
                        Disparo: <strong>{r.criterio_disparo || 'Imediato'}</strong>
                      </span>
                      <Badge
                        className={`text-[10px] font-semibold ${
                          r.ativo
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                        }`}
                      >
                        {r.ativo ? 'Ativa' : 'Desativada'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* ========================================================
            ABA 5: CENTRAL DE ALERTAS
        ======================================================== */}
        {canViewAlertas && (
          <TabsContent value="alertas" className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-vinho/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-vinho/10 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-vinho text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Central de Notificações de Alertas
                  </h3>
                  <p className="text-xs text-vinho/70">
                    Ocorrências críticas disparadas automaticamente com controle de status e
                    histórico de resolução.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {alertas.length === 0 ? (
                  <div className="py-16 text-center text-xs text-vinho/60 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-bold text-vinho">Nenhum alerta pendente no momento.</p>
                    <p className="text-[11px] text-vinho/50">
                      Todas as regras estão em conformidade.
                    </p>
                  </div>
                ) : (
                  alertas.map((al) => {
                    const isCritico = al.prioridade === 'critica'
                    const isResolvido = al.status === 'resolvido'

                    return (
                      <div
                        key={al.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isResolvido
                            ? 'bg-zinc-50/60 border-zinc-200 opacity-80'
                            : isCritico
                              ? 'bg-rose-50/70 border-rose-300'
                              : 'bg-amber-50/60 border-amber-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={`text-[9px] uppercase font-bold ${
                                  al.prioridade === 'critica'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-600 text-white'
                                }`}
                              >
                                {al.prioridade}
                              </Badge>

                              <Badge
                                className={`text-[10px] font-bold uppercase ${
                                  al.status === 'novo'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : al.status === 'visualizado'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : al.status === 'em_analise'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                Status: {al.status.replace('_', ' ')}
                              </Badge>

                              <span className="text-[11px] font-mono text-vinho/60">
                                {new Date(al.created).toLocaleString('pt-BR')}
                              </span>
                            </div>

                            <h4 className="font-bold text-vinho text-sm">{al.regra_nome}</h4>
                            <p className="text-xs text-vinho/80">{al.motivo}</p>
                            {al.detalhes && (
                              <p className="text-[11px] text-vinho/60 italic font-mono">
                                Detalhes: {al.detalhes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleOpenAlerta(al)}
                              className="text-xs bg-vinho hover:bg-vinho-light text-white h-8"
                            >
                              Gerenciar Alerta
                            </Button>
                          </div>
                        </div>

                        {/* Histórico de quem visualizou e resolveu */}
                        <div className="flex items-center justify-between text-[11px] text-vinho/70 pt-2 border-t border-vinho/10 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            {al.usuario_envolvido_nome && (
                              <span>
                                Usuário: <strong>{al.usuario_envolvido_nome}</strong>
                              </span>
                            )}
                            {al.visualizado_por_nome && (
                              <span>
                                Visualizado por: <strong>{al.visualizado_por_nome}</strong>
                              </span>
                            )}
                            {al.resolvido_por_nome && (
                              <span className="text-emerald-700 font-semibold">
                                Resolvido por: {al.resolvido_por_nome}
                              </span>
                            )}
                          </div>

                          {al.link_relacionado && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setActiveTab('registros')
                                if (al.evento_id) setBusca(al.evento_id)
                              }}
                              className="text-dourado-dark text-xs p-0 h-auto flex items-center gap-1 font-semibold"
                            >
                              Ver registro relacionado
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ========================================================
          MODAL: DETALHES DO EVENTO & DIFF ANTES / DEPOIS
      ======================================================== */}
      <Dialog open={detalheModalOpen} onOpenChange={setDetalheModalOpen}>
        <DialogContent className="w-[94vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-5 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho flex items-center gap-2">
              <FileText className="w-5 h-5 text-dourado-dark" />
              Detalhamento da Ação de Auditoria
            </DialogTitle>
          </DialogHeader>

          {eventoSelecionado && (
            <div className="space-y-4 pt-2">
              {/* Metadados do Evento */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-3.5 rounded-xl border border-vinho/10 text-xs">
                <div>
                  <span className="text-[10px] text-vinho/50 block">ID do Evento:</span>
                  <span className="font-mono text-vinho font-bold">{eventoSelecionado.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Data e Hora:</span>
                  <span className="font-semibold text-vinho">
                    {new Date(eventoSelecionado.created).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Tipo de Ação:</span>
                  <Badge className="bg-vinho text-white text-[9px] uppercase font-bold">
                    {eventoSelecionado.tipo_acao}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Usuário Responsável:</span>
                  <span className="font-bold text-vinho">
                    {eventoSelecionado.usuario_nome || 'Sistema'}
                  </span>
                  <span className="block text-[10px] text-vinho/60 font-mono">
                    {eventoSelecionado.usuario_email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Área do Sistema:</span>
                  <span className="font-semibold text-vinho">{eventoSelecionado.area_sistema}</span>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Resultado:</span>
                  <span className="font-bold uppercase text-xs">{eventoSelecionado.resultado}</span>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Endereço IP:</span>
                  <span className="font-mono text-vinho font-semibold">
                    {eventoSelecionado.ip || 'Não capturado'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Dispositivo / Navegador:</span>
                  <span className="text-vinho font-medium">
                    {eventoSelecionado.dispositivo || 'Desktop'} ·{' '}
                    {eventoSelecionado.navegador || 'Web'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-vinho/50 block">Loja Vinculada:</span>
                  <span className="text-vinho font-medium">
                    {eventoSelecionado.loja_nome || 'Geral / Plataforma'}
                  </span>
                </div>
              </div>

              {/* Descrição Completa */}
              <div className="bg-white p-3.5 rounded-xl border border-vinho/10 space-y-1">
                <span className="text-xs font-bold text-vinho block">Descrição da Ação:</span>
                <p className="text-xs text-vinho/80 leading-relaxed font-mono bg-marfim/30 p-2.5 rounded-lg border border-vinho/5">
                  {eventoSelecionado.descricao}
                </p>
              </div>

              {/* COMPARATIVO ANTES E DEPOIS (DIFF) */}
              {(eventoSelecionado.diff_antes || eventoSelecionado.diff_depois) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-vinho flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-dourado-dark" />
                      Auditoria de Modificações (Diff Antes e Depois):
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* ANTES */}
                    <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between border-b border-rose-200 pb-1">
                        <span className="font-bold text-rose-900 text-xs">
                          {eventoSelecionado.tipo_acao === 'exclusao'
                            ? 'Dados do Registro Excluído:'
                            : 'Valor Anterior (Antes):'}
                        </span>
                        <Badge className="bg-rose-200 text-rose-900 text-[9px]">ORIGINAL</Badge>
                      </div>
                      <pre className="text-[11px] font-mono text-rose-950 bg-white/80 p-2 rounded border border-rose-200/60 overflow-x-auto max-h-56">
                        {eventoSelecionado.diff_antes
                          ? JSON.stringify(eventoSelecionado.diff_antes, null, 2)
                          : 'Nenhum dado anterior (criação direta)'}
                      </pre>
                    </div>

                    {/* DEPOIS */}
                    <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
                        <span className="font-bold text-emerald-900 text-xs">
                          {eventoSelecionado.tipo_acao === 'exclusao'
                            ? 'Situação Atual:'
                            : 'Novo Valor (Depois):'}
                        </span>
                        <Badge className="bg-emerald-200 text-emerald-900 text-[9px]">NOVO</Badge>
                      </div>
                      <pre className="text-[11px] font-mono text-emerald-950 bg-white/80 p-2 rounded border border-emerald-200/60 overflow-x-auto max-h-56">
                        {eventoSelecionado.diff_depois
                          ? JSON.stringify(eventoSelecionado.diff_depois, null, 2)
                          : eventoSelecionado.tipo_acao === 'exclusao'
                            ? 'REGISTRO EXCLUÍDO DEFINITIVAMENTE'
                            : 'Sem alterações adicionais'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetalheModalOpen(false)
                    if (eventoSelecionado.usuario_email) {
                      setFiltroUsuario(eventoSelecionado.usuario_email)
                      setBusca(eventoSelecionado.usuario_email)
                    }
                  }}
                  className="text-xs text-vinho border-vinho/20"
                >
                  Ver todos os eventos deste usuário
                </Button>

                <Button
                  type="button"
                  onClick={() => setDetalheModalOpen(false)}
                  className="bg-vinho hover:bg-vinho-light text-white text-xs font-semibold px-4"
                >
                  Fechar Detalhes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: CRIAÇÃO / EDIÇÃO DE REGRA DE MONITORAMENTO
      ======================================================== */}
      <Dialog open={regraModalOpen} onOpenChange={setRegraModalOpen}>
        <DialogContent className="w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-5 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho flex items-center gap-2">
              <Sliders className="w-5 h-5 text-dourado-dark" />
              Configurar Regra de Alerta de Auditoria
            </DialogTitle>
          </DialogHeader>

          {regraEditando && (
            <form onSubmit={handleSalvarRegra} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-vinho">Nome da Regra *</Label>
                <Input
                  required
                  placeholder="Ex.: Alerta de Menção a Aline Lana"
                  value={regraEditando.nome || ''}
                  onChange={(e) =>
                    setRegraEditando((p) => (p ? { ...p, nome: e.target.value } : null))
                  }
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-vinho">Descrição do Monitoramento</Label>
                <Input
                  placeholder="Explicação do critério e motivo do disparo"
                  value={regraEditando.descricao || ''}
                  onChange={(e) =>
                    setRegraEditando((p) => (p ? { ...p, descricao: e.target.value } : null))
                  }
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-vinho">Evento Monitorado *</Label>
                  <Select
                    value={regraEditando.evento_monitorado || 'todos'}
                    onValueChange={(val) =>
                      setRegraEditando((p) => (p ? { ...p, evento_monitorado: val } : null))
                    }
                  >
                    <SelectTrigger className="bg-white border-vinho/20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Qualquer Evento</SelectItem>
                      <SelectItem value="exclusao">Exclusão de Registros</SelectItem>
                      <SelectItem value="financeiro">Valores Financeiros</SelectItem>
                      <SelectItem value="alteracao_permissao">Alteração de Permissões</SelectItem>
                      <SelectItem value="chat">Conversas / Chat</SelectItem>
                      <SelectItem value="falha_login">Múltiplas Falhas de Login</SelectItem>
                      <SelectItem value="bloqueio_acesso">Tentativas Não Autorizadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-vinho">Prioridade do Alerta</Label>
                  <Select
                    value={regraEditando.prioridade || 'alta'}
                    onValueChange={(val: any) =>
                      setRegraEditando((p) => (p ? { ...p, prioridade: val } : null))
                    }
                  >
                    <SelectTrigger className="bg-white border-vinho/20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica (Urgente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-vinho">
                  Palavra ou Expressão Monitorada (Opcional)
                </Label>
                <Input
                  placeholder='Ex.: "Aline Lana", "Pix", "Excluir"'
                  value={regraEditando.palavra_chave || ''}
                  onChange={(e) =>
                    setRegraEditando((p) => (p ? { ...p, palavra_chave: e.target.value } : null))
                  }
                  className="bg-white border-vinho/20 text-xs"
                />
                <span className="text-[10px] text-vinho/50">
                  Dispara quando a palavra exata for encontrada em descrições, chats ou diffs.
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-vinho/10">
                <div>
                  <span className="font-bold text-vinho block text-xs">Status da Regra</span>
                  <span className="text-[10px] text-vinho/60">
                    Regras ativas analisam eventos em tempo real
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-vinho">
                  <input
                    type="checkbox"
                    checked={regraEditando.ativo !== false}
                    onChange={(e) =>
                      setRegraEditando((p) => (p ? { ...p, ativo: e.target.checked } : null))
                    }
                    className="rounded text-vinho focus:ring-dourado"
                  />
                  Ativa
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegraModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingRegra}
                  className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-4"
                >
                  {savingRegra ? 'Salvando...' : 'Salvar Regra'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: GERENCIAR STATUS DE ALERTA
      ======================================================== */}
      <Dialog open={alertaModalOpen} onOpenChange={setAlertaModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-5 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Atualizar Ocorrência de Alerta
            </DialogTitle>
          </DialogHeader>

          {alertaSelecionado && (
            <form onSubmit={handleSalvarStatusAlerta} className="space-y-4 pt-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-vinho/10 space-y-1">
                <span className="text-[10px] text-vinho/50 block">Regra Disparada:</span>
                <span className="font-bold text-vinho text-xs block">
                  {alertaSelecionado.regra_nome}
                </span>
                <p className="text-[11px] text-vinho/70">{alertaSelecionado.motivo}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-vinho">Novo Status do Alerta</Label>
                <Select
                  value={novoStatusAlerta}
                  onValueChange={(val: AlertaStatus) => setNovoStatusAlerta(val)}
                >
                  <SelectTrigger className="bg-white border-vinho/20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visualizado">Visualizado</SelectItem>
                    <SelectItem value="em_analise">Em Análise pela Equipe</SelectItem>
                    <SelectItem value="resolvido">Resolvido / Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-vinho">
                  Parecer / Observação da Resolução
                </Label>
                <Input
                  placeholder="Ex.: Verificado com a coordenação, alteração autorizada..."
                  value={observacaoAlerta}
                  onChange={(e) => setObservacaoAlerta(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAlertaModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updatingAlerta}
                  className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-4"
                >
                  {updatingAlerta ? 'Gravando...' : 'Gravar Histórico'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
