import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type { EpisodioRecord, ContatoRecord, TransacaoRecord, AgendaRecord } from '@/types/database'
import {
  Tv,
  Inbox,
  AlertCircle,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalEpisodios: 0,
    contatosNovos: 0,
    transacoesAbertas: 0,
    agendaProxima: 0,
  })

  const [proximasGravacoes, setProximasGravacoes] = useState<AgendaRecord[]>([])
  const [ultimosContatos, setUltimosContatos] = useState<ContatoRecord[]>([])
  const [transacoesPorTipo, setTransacoesPorTipo] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      try {
        const [epList, contatosList, transacoesList, agendaList] = await Promise.all([
          pb.collection('episodios').getFullList<EpisodioRecord>(),
          pb.collection('contatos').getFullList<ContatoRecord>({ sort: '-created' }),
          pb.collection('transacoes').getFullList<TransacaoRecord>(),
          pb.collection('agenda').getFullList<AgendaRecord>({ sort: 'data_gravacao' }),
        ])

        const contNovos = contatosList.filter((c) => c.status === 'novo').length
        const transAbertas = transacoesList.filter((t) => t.situacao === 'em_aberto').length

        setStats({
          totalEpisodios: epList.length,
          contatosNovos: contNovos,
          transacoesAbertas: transAbertas,
          agendaProxima: agendaList.length,
        })

        setProximasGravacoes(agendaList.slice(0, 5))
        setUltimosContatos(contatosList.slice(0, 5))

        // Agrupamento por tipo de transação
        const tipoMap: Record<string, number> = {
          gravacao: 0,
          edicao: 0,
          equipamento: 0,
          marketing: 0,
          outros: 0,
        }
        transacoesList.forEach((t) => {
          if (tipoMap[t.tipo] !== undefined) {
            tipoMap[t.tipo] += t.valor || 0
          } else {
            tipoMap.outros += t.valor || 0
          }
        })
        setTransacoesPorTipo(tipoMap)
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const tipoColors: Record<string, string> = {
    gravacao: '#4B1E3F', // Vinho
    edicao: '#D4AF37', // Dourado
    equipamento: '#5F2650', // Vinho Claro
    marketing: '#C88E9B', // Rosé
    outros: '#853C73', // Púrpura suave
  }

  const tipoLabels: Record<string, string> = {
    gravacao: 'Gravação em Estúdio',
    edicao: 'Edição de Vídeo/Áudio',
    equipamento: 'Equipamentos',
    marketing: 'Marketing & Divulgação',
    outros: 'Outros Custos',
  }

  const totalGastosGeral = Object.values(transacoesPorTipo).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Mensagem de Boas-vindas */}
      <div className="bg-gradient-to-r from-vinho via-vinho-dark to-vinho text-marfim p-6 sm:p-8 rounded-3xl border-2 border-dourado/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dourado/20 text-dourado text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CoffeeCast 4.0 em Produção</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Painel Geral de Gestão
          </h2>
          <p className="text-xs sm:text-sm text-marfim/80 max-w-xl">
            Acompanhe episódios publicados, novas propostas de convidados, finanças do estúdio e o
            cronograma das próximas gravações.
          </p>
        </div>

        <Link to="/admin/agenda" className="shrink-0">
          <button className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg transition-all flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Ver Agenda Completa
          </button>
        </Link>
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total de Episódios */}
        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm hover:border-dourado transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Episódios no Ar
            </p>
            <h3 className="font-serif text-3xl font-black text-vinho mt-1">
              {loading ? '-' : stats.totalEpisodios}
            </h3>
            <span className="text-[11px] text-dourado-dark font-medium mt-1 inline-block">
              Temporada Oficial
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-vinho/10 text-vinho flex items-center justify-center">
            <Tv className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Contatos Novos */}
        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm hover:border-dourado transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Contatos Novos
            </p>
            <h3 className="font-serif text-3xl font-black text-vinho mt-1">
              {loading ? '-' : stats.contatosNovos}
            </h3>
            <span className="text-[11px] text-amber-600 font-medium mt-1 inline-block">
              Aguardando contato
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Despesas em Aberto */}
        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm hover:border-dourado transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Gastos em Aberto
            </p>
            <h3 className="font-serif text-3xl font-black text-rose-700 mt-1">
              {loading ? '-' : stats.transacoesAbertas}
            </h3>
            <span className="text-[11px] text-rose-600 font-medium mt-1 inline-block">
              Despesas a quitar
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Gravações Agendadas */}
        <div className="bg-white border border-vinho/10 rounded-2xl p-5 shadow-sm hover:border-dourado transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-vinho/60 uppercase tracking-wider">
              Gravações na Agenda
            </p>
            <h3 className="font-serif text-3xl font-black text-vinho mt-1">
              {loading ? '-' : stats.agendaProxima}
            </h3>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
              Cronograma ativo
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Gastos + Resumo Financeiro */}
      <div className="bg-white border border-vinho/10 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vinho/10 pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-vinho flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-dourado" />
              Distribuição de Gastos do CoffeeCast 4.0
            </h3>
            <p className="text-xs text-vinho/65">Valores acumulados por categoria de produção</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-vinho/60 block">Total Mapeado</span>
            <span className="font-serif text-xl font-black text-vinho">
              {formatCurrencyBRL(totalGastosGeral)}
            </span>
          </div>
        </div>

        {/* Barras coloridas customizadas */}
        <div className="space-y-4">
          {Object.entries(transacoesPorTipo).map(([tipo, val]) => {
            const pct = totalGastosGeral > 0 ? (val / totalGastosGeral) * 100 : 0
            const color = tipoColors[tipo] || '#4B1E3F'

            return (
              <div key={tipo} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-vinho">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    {tipoLabels[tipo] || tipo}
                  </span>
                  <span className="font-bold">
                    {formatCurrencyBRL(val)} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-vinho/5 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Duas Colunas: Próximas Gravações & Últimos Contatos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas Gravações */}
        <div className="bg-white border border-vinho/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
            <h3 className="font-serif text-lg font-bold text-vinho">Próximas Gravações</h3>
            <Link
              to="/admin/agenda"
              className="text-xs text-dourado-dark hover:underline flex items-center gap-1 font-semibold"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {proximasGravacoes.length === 0 ? (
            <p className="text-xs text-vinho/60 py-6 text-center">
              Nenhuma gravação agendada no momento.
            </p>
          ) : (
            <div className="divide-y divide-vinho/5 space-y-3">
              {proximasGravacoes.map((ag) => (
                <div key={ag.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-vinho">{ag.titulo}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-dourado/60 text-dourado-dark font-medium"
                    >
                      {formatDateBR(ag.data_gravacao)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-vinho/70">
                    {ag.tem_convidado
                      ? `Convidado(a): ${ag.nome_convidado || 'A definir'}`
                      : 'Episódio sem convidado externo'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos Contatos Recebidos */}
        <div className="bg-white border border-vinho/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vinho/10 pb-3">
            <h3 className="font-serif text-lg font-bold text-vinho">Últimas Propostas Recebidas</h3>
            <Link
              to="/admin/contatos"
              className="text-xs text-dourado-dark hover:underline flex items-center gap-1 font-semibold"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {ultimosContatos.length === 0 ? (
            <p className="text-xs text-vinho/60 py-6 text-center">
              Nenhum contato recebido recentemente.
            </p>
          ) : (
            <div className="divide-y divide-vinho/5 space-y-3">
              {ultimosContatos.map((c) => (
                <div key={c.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-vinho truncate">{c.nome_completo}</h4>
                    <p className="text-[11px] text-vinho/65 truncate">
                      {c.profissao} • {c.instagram}
                    </p>
                  </div>

                  <Badge
                    className={`text-[10px] shrink-0 ${
                      c.status === 'novo'
                        ? 'bg-amber-100 text-amber-800'
                        : c.status === 'contatado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-vinho/10 text-vinho'
                    }`}
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
