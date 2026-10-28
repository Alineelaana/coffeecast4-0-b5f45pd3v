import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import { AuditoriaService } from '@/services/auditoria'
import {
  downloadRelatorioEngajamentoPdf,
  RelatorioPdfData,
} from '@/lib/relatorioEngajamentoPdfExporter'
import { formatDateBR } from '@/lib/formatters'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  RefreshCw,
  Inbox,
  MessageSquareQuote,
  FileText,
  Activity,
  Tv,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import type {
  ContatoRecord,
  DepoimentoConvidadoRecord,
  RoteiroConvidadoRecord,
  EpisodioRecord,
  AuditoriaEventoRecord,
} from '@/types/database'

type PeriodoOpcao = '7dias' | '30dias' | '90dias' | 'custom'

interface DateRange {
  start: Date
  end: Date
  prevStart: Date
  prevEnd: Date
  rotulo: string
}

export default function AdminRelatoriosScreen() {
  const { user, isMaster } = useAuth()

  // Estados de filtro de período
  const [periodo, setPeriodo] = useState<PeriodoOpcao>('30dias')
  const [dataInicioCustom, setDataInicioCustom] = useState<string>('')
  const [dataFimCustom, setDataFimCustom] = useState<string>('')

  // Estados de dados carregados
  const [loading, setLoading] = useState(true)
  const [exportingPdf, setExportingPdf] = useState(false)

  const [contatos, setContatos] = useState<ContatoRecord[]>([])
  const [depoimentos, setDepoimentos] = useState<DepoimentoConvidadoRecord[]>([])
  const [roteiros, setRoteiros] = useState<RoteiroConvidadoRecord[]>([])
  const [episodios, setEpisodios] = useState<EpisodioRecord[]>([])
  const [eventosAuditoria, setEventosAuditoria] = useState<AuditoriaEventoRecord[]>([])

  // Registrar acesso da tela na Auditoria apenas 1 vez ao montar
  useEffect(() => {
    AuditoriaService.registrarEvento({
      area_sistema: 'Relatórios de Engajamento',
      tipo_acao: 'outro',
      descricao: 'Acesso à tela de Relatórios de Engajamento do painel administrativo',
      resultado: 'sucesso',
      metadata: { tela: 'relatorios' },
    })
  }, [])

  // Carrega coleções do banco PocketBase
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)

      const [contatosRes, depoimentosRes, roteirosRes, episodiosRes, auditoriaRes] =
        await Promise.all([
          pb
            .collection('contatos')
            .getFullList<ContatoRecord>({ sort: '-created' })
            .catch((err) => {
              console.warn('Erro ao buscar contatos:', err)
              return []
            }),
          pb
            .collection('depoimentos_convidados')
            .getFullList<DepoimentoConvidadoRecord>({ sort: '-created' })
            .catch((err) => {
              console.warn('Erro ao buscar depoimentos_convidados:', err)
              return []
            }),
          pb
            .collection('roteiros_convidados')
            .getFullList<RoteiroConvidadoRecord>({ sort: '-created' })
            .catch((err) => {
              console.warn('Erro ao buscar roteiros_convidados:', err)
              return []
            }),
          pb
            .collection('episodios')
            .getFullList<EpisodioRecord>({ sort: '-numero' })
            .catch((err) => {
              console.warn('Erro ao buscar episodios:', err)
              return []
            }),
          pb
            .collection('auditoria_eventos')
            .getList<AuditoriaEventoRecord>(1, 1000, { sort: '-created' })
            .then((r) => r.items)
            .catch((err) => {
              console.warn('Erro ao buscar auditoria_eventos:', err)
              return []
            }),
        ])

      setContatos(contatosRes)
      setDepoimentos(depoimentosRes)
      setRoteiros(roteirosRes)
      setEpisodios(episodiosRes)
      setEventosAuditoria(auditoriaRes)
    } catch (err) {
      console.error('Falha geral ao carregar dados do relatório:', err)
      toast.error('Erro ao carregar dados do relatório de engajamento.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Cálculo do Range de Datas Atual e Período Anterior Equivalente
  const range: DateRange = useMemo(() => {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    let rotulo = 'Últimos 30 dias'

    if (periodo === '7dias') {
      start.setDate(start.getDate() - 6)
      rotulo = 'Últimos 7 dias'
    } else if (periodo === '30dias') {
      start.setDate(start.getDate() - 29)
      rotulo = 'Últimos 30 dias'
    } else if (periodo === '90dias') {
      start.setDate(start.getDate() - 89)
      rotulo = 'Últimos 90 dias'
    } else if (periodo === 'custom') {
      if (dataInicioCustom) {
        const [anoI, mesI, diaI] = dataInicioCustom.split('-').map(Number)
        start = new Date(anoI, mesI - 1, diaI, 0, 0, 0, 0)
      } else {
        start.setDate(start.getDate() - 29)
      }

      if (dataFimCustom) {
        const [anoF, mesF, diaF] = dataFimCustom.split('-').map(Number)
        end.setFullYear(anoF, mesF - 1, diaF)
        end.setHours(23, 59, 59, 999)
      }

      rotulo = `Personalizado (${formatDateBR(start.toISOString())} a ${formatDateBR(end.toISOString())})`
    }

    // Período anterior equivalente: mesma duração imediatamente antes de 'start'
    const durationMs = end.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - durationMs)

    return {
      start,
      end,
      prevStart,
      prevEnd,
      rotulo,
    }
  }, [periodo, dataInicioCustom, dataFimCustom])

  // Função utilitária para verificar se dataISO pertence ao intervalo
  const inRange = (dataISO: string | undefined | null, s: Date, e: Date) => {
    if (!dataISO) return false
    const d = new Date(dataISO).getTime()
    return d >= s.getTime() && d <= e.getTime()
  }

  // Agregações e Cálculos no Período Selecionado vs Período Anterior
  const metricas = useMemo(() => {
    // 1. Contatos
    const contatosAtual = contatos.filter((c) => inRange(c.created, range.start, range.end))
    const contatosPrev = contatos.filter((c) => inRange(c.created, range.prevStart, range.prevEnd))

    // 2. Depoimentos
    const depoimentosAtual = depoimentos.filter((d) => inRange(d.created, range.start, range.end))
    const depoimentosPrev = depoimentos.filter((d) =>
      inRange(d.created, range.prevStart, range.prevEnd),
    )

    // 3. Roteiros respondidos
    const roteirosAtual = roteiros.filter((r) => inRange(r.created, range.start, range.end))
    const roteirosPrev = roteiros.filter((r) => inRange(r.created, range.prevStart, range.prevEnd))

    // 4. Acessos ao painel (tipo_acao == 'login')
    const loginsAtual = eventosAuditoria.filter(
      (ev) => ev.tipo_acao === 'login' && inRange(ev.created, range.start, range.end),
    )
    const loginsPrev = eventosAuditoria.filter(
      (ev) => ev.tipo_acao === 'login' && inRange(ev.created, range.prevStart, range.prevEnd),
    )

    // 5. Episódios publicados no período (usa data_publicacao_programada ou created)
    const episodiosAtual = episodios.filter((ep) => {
      const epDate = ep.data_publicacao_programada || ep.created
      return inRange(epDate, range.start, range.end)
    })
    const episodiosPrev = episodios.filter((ep) => {
      const epDate = ep.data_publicacao_programada || ep.created
      return inRange(epDate, range.prevStart, range.prevEnd)
    })

    // Função de variação percentual
    const calcVar = (curr: number, prev: number) => {
      if (prev === 0) {
        return curr > 0 ? 100 : 0
      }
      return ((curr - prev) / prev) * 100
    }

    // 6. Evolução temporal de contatos no período (agrupado por dia se <= 30 dias, por semana se > 30 dias)
    const diffDays = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 3600 * 24))
    const evolucaoMap: Record<string, number> = {}

    if (diffDays <= 31) {
      // Por dia
      const cursor = new Date(range.start)
      while (cursor <= range.end) {
        const diaKey = cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        evolucaoMap[diaKey] = 0
        cursor.setDate(cursor.getDate() + 1)
      }
      contatosAtual.forEach((c) => {
        const d = new Date(c.created)
        const diaKey = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        if (evolucaoMap[diaKey] !== undefined) {
          evolucaoMap[diaKey]++
        }
      })
    } else {
      // Por semana
      contatosAtual.forEach((c) => {
        const d = new Date(c.created)
        const weekNum = Math.ceil((d.getTime() - range.start.getTime()) / (1000 * 3600 * 24 * 7))
        const semKey = `Semana ${Math.max(1, weekNum)}`
        evolucaoMap[semKey] = (evolucaoMap[semKey] || 0) + 1
      })
    }

    const evolucaoContatos = Object.entries(evolucaoMap).map(([label, valor]) => ({
      label,
      valor,
    }))

    // 7. Ranking das telas mais acessadas no período (Auditoria: area_sistema)
    const eventosNoPeriodo = eventosAuditoria.filter((ev) =>
      inRange(ev.created, range.start, range.end),
    )
    const telasCount: Record<string, number> = {}
    eventosNoPeriodo.forEach((ev) => {
      let area = ev.area_sistema?.trim() || 'Painel Geral'
      if (area === 'Geral' || area === 'outro') area = 'Navegação Geral'
      telasCount[area] = (telasCount[area] || 0) + 1
    })
    const rankingTelas = Object.entries(telasCount)
      .map(([label, valor]) => ({ label, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 7)

    // 8. Ranking dos usuários do painel com mais acessos no período (logins)
    const userLoginsCount: Record<string, { nome: string; email: string; valor: number }> = {}
    loginsAtual.forEach((ev) => {
      const email = ev.usuario_email?.trim() || 'desconhecido'
      const nome = ev.usuario_nome?.trim() || email
      if (!userLoginsCount[email]) {
        userLoginsCount[email] = { nome, email, valor: 0 }
      }
      userLoginsCount[email].valor++
    })
    const rankingUsuarios = Object.values(userLoginsCount)
      .map((u) => ({
        label: u.nome,
        sublabel: u.email,
        valor: u.valor,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)

    // 9. Distribuição dos roteiros por status (Rascunho / Em Revisão / Aprovado)
    let rascunhoCount = 0
    let emRevisaoCount = 0
    let aprovadoCount = 0

    roteirosAtual.forEach((r) => {
      const st = r.status_aprovacao || 'rascunho'
      if (st === 'aprovado') aprovadoCount++
      else if (st === 'em_revisao') emRevisaoCount++
      else rascunhoCount++
    })

    const distribuicaoRoteiros = [
      { label: 'Aprovados', valor: aprovadoCount, cor: '#059669' },
      { label: 'Em Revisão', valor: emRevisaoCount, cor: '#D4AF37' },
      { label: 'Rascunho / Pendente', valor: rascunhoCount, cor: '#4B1E3F' },
    ]

    return {
      totais: {
        contatos: contatosAtual.length,
        contatosVar: calcVar(contatosAtual.length, contatosPrev.length),
        depoimentos: depoimentosAtual.length,
        depoimentosVar: calcVar(depoimentosAtual.length, depoimentosPrev.length),
        roteiros: roteirosAtual.length,
        roteirosVar: calcVar(roteirosAtual.length, roteirosPrev.length),
        acessos: loginsAtual.length,
        acessosVar: calcVar(loginsAtual.length, loginsPrev.length),
        episodios: episodiosAtual.length,
        episodiosVar: calcVar(episodiosAtual.length, episodiosPrev.length),
      },
      evolucaoContatos,
      rankingTelas,
      rankingUsuarios,
      distribuicaoRoteiros,
      episodiosAtual,
      totalRoteirosStatus: rascunhoCount + emRevisaoCount + aprovadoCount,
    }
  }, [contatos, depoimentos, roteiros, episodios, eventosAuditoria, range])

  // Dispara exportação do relatório em PDF
  const handleExportarPdf = async () => {
    try {
      setExportingPdf(true)
      const pdfPayload: RelatorioPdfData = {
        periodoRotulo: range.rotulo,
        dataInicioFormatada: formatDateBR(range.start.toISOString()),
        dataFimFormatada: formatDateBR(range.end.toISOString()),
        geradoPorNome: user?.name || user?.email || 'Administrador CoffeeCast',
        geradoPorEmail: user?.email || '',
        totais: metricas.totais,
        evolucaoContatos: metricas.evolucaoContatos,
        telasMaisAcessadas: metricas.rankingTelas,
        usuariosMaisAcessos: metricas.rankingUsuarios,
        distribuicaoRoteiros: metricas.distribuicaoRoteiros,
        episodiosPublicados: metricas.episodiosAtual.map((ep) => ({
          numero: ep.numero,
          titulo: ep.titulo,
          dataPublicacao: formatDateBR(ep.data_publicacao_programada || ep.created),
          status: ep.status || 'publicado',
        })),
      }

      await downloadRelatorioEngajamentoPdf(pdfPayload)
      toast.success('Documento de impressão/PDF gerado com sucesso!')

      // Registrar auditoria da exportação
      AuditoriaService.registrarEvento({
        area_sistema: 'Relatórios de Engajamento',
        tipo_acao: 'download',
        descricao: `Exportação de Relatório de Engajamento em PDF (${range.rotulo})`,
        resultado: 'sucesso',
        metadata: { periodo: range.rotulo },
      })
    } catch (err) {
      console.error('Erro ao gerar PDF do relatório:', err)
      toast.error('Não foi possível gerar o PDF. Verifique se pop-ups estão permitidos.')
    } finally {
      setExportingPdf(false)
    }
  }

  // Componente visual de Variação Percentual
  const renderVariacao = (varPct: number) => {
    if (isNaN(varPct) || !isFinite(varPct)) {
      return (
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
          <Minus className="w-3 h-3" /> Sem base anterior
        </span>
      )
    }
    if (varPct > 0) {
      return (
        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> +{varPct.toFixed(1)}%
          <span className="text-[10px] text-vinho/60 font-normal ml-0.5">vs anterior</span>
        </span>
      )
    }
    if (varPct < 0) {
      return (
        <span className="text-[11px] text-rose-700 font-bold flex items-center gap-0.5">
          <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" /> {varPct.toFixed(1)}%
          <span className="text-[10px] text-vinho/60 font-normal ml-0.5">vs anterior</span>
        </span>
      )
    }
    return (
      <span className="text-[11px] text-vinho/60 font-medium flex items-center gap-1">
        <Minus className="w-3 h-3 text-vinho/40" /> Estável (0%)
      </span>
    )
  }

  const maxContatos = Math.max(1, ...metricas.evolucaoContatos.map((i) => i.valor))
  const maxTelas = Math.max(1, ...metricas.rankingTelas.map((i) => i.valor))
  const maxUsuarios = Math.max(1, ...metricas.rankingUsuarios.map((i) => i.valor))

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* CABEÇALHO DA TELA */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-vinho/10 flex items-center justify-center text-vinho">
              <BarChart3 className="w-5 h-5 text-dourado-dark" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-vinho tracking-tight">
              Relatórios de Engajamento
            </h1>
            <Badge className="bg-dourado text-vinho font-bold text-[10px] uppercase tracking-wider">
              {isMaster ? 'Master Soberano' : 'Painel de Controle'}
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Dados Reais Verificados
            </Badge>
          </div>
          <p className="text-xs text-vinho/70 max-w-2xl leading-relaxed">
            Consolidação de audiência, leads recebidos, depoimentos, roteiros respondidos por
            convidados e acessos ao painel extraídos da auditoria oficial.
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

          <Button
            type="button"
            size="sm"
            onClick={handleExportarPdf}
            disabled={exportingPdf || loading}
            className="text-xs bg-vinho hover:bg-vinho-light text-white font-bold h-9 px-4 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-dourado" />
            {exportingPdf ? 'Gerando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* BARRA DE FILTRO DE PERÍODO */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-vinho">
            <Calendar className="w-4 h-4 text-dourado-dark" />
            <span>Filtro de Período do Relatório:</span>
            <span className="font-semibold text-vinho/80 bg-vinho/5 px-2.5 py-1 rounded-lg">
              {range.rotulo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant={periodo === '7dias' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo('7dias')}
              className={`text-xs h-8 ${
                periodo === '7dias'
                  ? 'bg-vinho text-white hover:bg-vinho-light font-bold'
                  : 'text-vinho border-vinho/20 hover:bg-vinho/5'
              }`}
            >
              Últimos 7 dias
            </Button>

            <Button
              type="button"
              variant={periodo === '30dias' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo('30dias')}
              className={`text-xs h-8 ${
                periodo === '30dias'
                  ? 'bg-vinho text-white hover:bg-vinho-light font-bold'
                  : 'text-vinho border-vinho/20 hover:bg-vinho/5'
              }`}
            >
              Últimos 30 dias
            </Button>

            <Button
              type="button"
              variant={periodo === '90dias' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo('90dias')}
              className={`text-xs h-8 ${
                periodo === '90dias'
                  ? 'bg-vinho text-white hover:bg-vinho-light font-bold'
                  : 'text-vinho border-vinho/20 hover:bg-vinho/5'
              }`}
            >
              Últimos 90 dias
            </Button>

            <Button
              type="button"
              variant={periodo === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo('custom')}
              className={`text-xs h-8 ${
                periodo === 'custom'
                  ? 'bg-vinho text-white hover:bg-vinho-light font-bold'
                  : 'text-vinho border-vinho/20 hover:bg-vinho/5'
              }`}
            >
              Personalizado
            </Button>
          </div>
        </div>

        {/* Seletores de Data Personalizada */}
        {periodo === 'custom' && (
          <div className="pt-3 border-t border-vinho/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="data-inicio" className="text-xs font-semibold text-vinho">
                Data Inicial:
              </Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicioCustom}
                onChange={(e) => setDataInicioCustom(e.target.value)}
                className="h-9 text-xs border-vinho/20 bg-marfim/30"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="data-fim" className="text-xs font-semibold text-vinho">
                Data Final:
              </Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFimCustom}
                onChange={(e) => setDataFimCustom(e.target.value)}
                className="h-9 text-xs border-vinho/20 bg-marfim/30"
              />
            </div>

            <div className="text-[11px] text-vinho/60 pb-1">
              Intervalo aplicado em tempo real aos contatos, depoimentos, roteiros e auditoria.
            </div>
          </div>
        )}
      </div>

      {/* CARDS DE RESUMO COM VARIAÇÃO PERCENTUAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Contatos / Leads */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-vinho/70 uppercase tracking-wide">
              Novos Contatos
            </span>
            <div className="w-8 h-8 rounded-lg bg-vinho/10 text-vinho flex items-center justify-center">
              <Inbox className="w-4 h-4 text-dourado-dark" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-extrabold text-vinho">
              {metricas.totais.contatos}
            </div>
            <div className="mt-1">{renderVariacao(metricas.totais.contatosVar)}</div>
          </div>
        </div>

        {/* Depoimentos */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-vinho/70 uppercase tracking-wide">
              Depoimentos
            </span>
            <div className="w-8 h-8 rounded-lg bg-vinho/10 text-vinho flex items-center justify-center">
              <MessageSquareQuote className="w-4 h-4 text-dourado-dark" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-extrabold text-vinho">
              {metricas.totais.depoimentos}
            </div>
            <div className="mt-1">{renderVariacao(metricas.totais.depoimentosVar)}</div>
          </div>
        </div>

        {/* Roteiros */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-vinho/70 uppercase tracking-wide">
              Roteiros Respondidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-vinho/10 text-vinho flex items-center justify-center">
              <FileText className="w-4 h-4 text-dourado-dark" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-extrabold text-vinho">
              {metricas.totais.roteiros}
            </div>
            <div className="mt-1">{renderVariacao(metricas.totais.roteirosVar)}</div>
          </div>
        </div>

        {/* Acessos ao Painel (Auditoria) */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-vinho/70 uppercase tracking-wide">
              Acessos ao Painel
            </span>
            <div className="w-8 h-8 rounded-lg bg-vinho/10 text-vinho flex items-center justify-center">
              <Activity className="w-4 h-4 text-dourado-dark" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-extrabold text-vinho">
              {metricas.totais.acessos}
            </div>
            <div className="mt-1">{renderVariacao(metricas.totais.acessosVar)}</div>
          </div>
        </div>

        {/* Episódios Publicados */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-vinho/70 uppercase tracking-wide">
              Episódios no Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-vinho/10 text-vinho flex items-center justify-center">
              <Tv className="w-4 h-4 text-dourado-dark" />
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl font-extrabold text-vinho">
              {metricas.totais.episodios}
            </div>
            <div className="mt-1">{renderVariacao(metricas.totais.episodiosVar)}</div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS PARTE 1: EVOLUÇÃO DE CONTATOS & TELAS MAIS ACESSADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Contatos */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                Evolução de Novos Contatos & Leads
              </h3>
              <p className="text-xs text-vinho/65">
                Distribuição no período ({metricas.totais.contatos} recebidos)
              </p>
            </div>
            <span className="text-xs font-bold text-dourado-dark bg-dourado/10 px-2.5 py-1 rounded-full">
              Formulário & Nine
            </span>
          </div>

          {metricas.evolucaoContatos.length === 0 || metricas.totais.contatos === 0 ? (
            <div className="py-12 text-center text-xs text-vinho/60 italic bg-marfim/40 rounded-xl border border-dashed border-vinho/15">
              Nenhum contato ou lead recebido neste período.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {metricas.evolucaoContatos.map((item, idx) => {
                const pct = (item.valor / maxContatos) * 100
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-vinho">
                      <span className="truncate">{item.label}</span>
                      <span className="font-bold shrink-0">{item.valor} lead(s)</span>
                    </div>
                    <div className="w-full bg-vinho/5 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-vinho to-dourado"
                        style={{ width: `${Math.max(item.valor > 0 ? 5 : 0, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ranking de Telas Mais Acessadas (Auditoria) */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                Telas Mais Acessadas do Painel
              </h3>
              <p className="text-xs text-vinho/65">Agregação dos registros oficiais da Auditoria</p>
            </div>
            <span className="text-xs font-bold text-vinho bg-vinho/10 px-2.5 py-1 rounded-full">
              Auditoria Ativa
            </span>
          </div>

          {metricas.rankingTelas.length === 0 ? (
            <div className="py-12 text-center text-xs text-vinho/60 italic bg-marfim/40 rounded-xl border border-dashed border-vinho/15">
              Nenhum registro de acesso nesta janela de tempo.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {metricas.rankingTelas.map((item, idx) => {
                const pct = (item.valor / maxTelas) * 100
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-vinho">
                      <span className="truncate flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-vinho/10 text-vinho text-[10px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="font-bold shrink-0">{item.valor} ação(ões)</span>
                    </div>
                    <div className="w-full bg-vinho/5 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-vinho"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICOS PARTE 2: RANKING DE USUÁRIOS & DISTRIBUIÇÃO DOS ROTEIROS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Usuários com Mais Acessos (Logins) */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                Usuários com Mais Acessos ao Painel
              </h3>
              <p className="text-xs text-vinho/65">Contagem de logins efetuados no período</p>
            </div>
            <Users className="w-4 h-4 text-dourado-dark" />
          </div>

          {metricas.rankingUsuarios.length === 0 ? (
            <div className="py-12 text-center text-xs text-vinho/60 italic bg-marfim/40 rounded-xl border border-dashed border-vinho/15">
              Nenhum login registrado neste período.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {metricas.rankingUsuarios.map((userItem, idx) => {
                const pct = (userItem.valor / maxUsuarios) * 100
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-vinho">
                      <span className="truncate flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-dourado/20 text-dourado-dark text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">
                          <strong>{userItem.label}</strong>{' '}
                          <span className="text-[11px] text-vinho/60">({userItem.sublabel})</span>
                        </span>
                      </span>
                      <span className="font-bold shrink-0">{userItem.valor} login(s)</span>
                    </div>
                    <div className="w-full bg-vinho/5 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-dourado to-amber-600"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Distribuição dos Roteiros por Status */}
        <div className="bg-white rounded-2xl border border-vinho/10 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
                Distribuição dos Roteiros por Status
              </h3>
              <p className="text-xs text-vinho/65">
                Total de {metricas.totalRoteirosStatus} roteiro(s) no período
              </p>
            </div>
            <FileText className="w-4 h-4 text-dourado-dark" />
          </div>

          {metricas.totalRoteirosStatus === 0 ? (
            <div className="py-12 text-center text-xs text-vinho/60 italic bg-marfim/40 rounded-xl border border-dashed border-vinho/15">
              Nenhum roteiro cadastrado neste período.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {metricas.distribuicaoRoteiros.map((st, idx) => {
                const pct =
                  metricas.totalRoteirosStatus > 0
                    ? (st.valor / metricas.totalRoteirosStatus) * 100
                    : 0
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-vinho">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: st.cor }}
                        />
                        <span>{st.label}</span>
                      </span>
                      <span className="font-bold">
                        {st.valor}{' '}
                        <span className="text-vinho/60 font-normal">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-vinho/5 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: st.cor,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* TABELA DE EPISÓDIOS NO PERÍODO */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-vinho">
              Episódios Publicados no Período
            </h3>
            <p className="text-xs text-vinho/65">
              Catálogo de episódios gravados e veiculados no canal
            </p>
          </div>
          <Badge className="bg-vinho text-white font-bold text-xs">
            {metricas.episodiosAtual.length} episódio(s)
          </Badge>
        </div>

        {metricas.episodiosAtual.length === 0 ? (
          <div className="py-10 text-center text-xs text-vinho/60 italic bg-marfim/40 rounded-xl border border-dashed border-vinho/15">
            Nenhum episódio publicado ou programado neste período.
          </div>
        ) : (
          <div className="rounded-xl border border-vinho/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-vinho/5 text-vinho text-xs">
                <TableRow>
                  <TableHead className="w-20 font-bold text-vinho">EP #</TableHead>
                  <TableHead className="font-bold text-vinho">Título do Episódio</TableHead>
                  <TableHead className="w-44 font-bold text-vinho">Data de Lançamento</TableHead>
                  <TableHead className="w-32 font-bold text-vinho">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {metricas.episodiosAtual.map((ep) => {
                  const epDate = ep.data_publicacao_programada || ep.created
                  const isProgramado = ep.status === 'programado'
                  return (
                    <TableRow key={ep.id} className="hover:bg-vinho/5">
                      <TableCell className="font-bold text-vinho">EP#{ep.numero}</TableCell>
                      <TableCell className="font-medium text-vinho">{ep.titulo}</TableCell>
                      <TableCell className="text-vinho/80">{formatDateBR(epDate)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] font-bold ${
                            isProgramado
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isProgramado ? 'Programado' : 'Publicado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
