// Gráfico "Visualizações por período" — série temporal das visualizações somadas
// de todos os episódios (ou de um episódio específico), alimentada pela coleção
// episodio_visualizacoes (um registro por visualização, criado pelo hook de backend).
//
// - Seletor de episódio: "Todos os episódios" (padrão) ou um episódio específico,
//   com a mesma etiqueta da tabela de Episódios ("#N — título").
// - Seletor de período: 7 / 30 / 90 dias (padrão 30).
// - Seletor de granularidade: Dia / Semana / Mês (padrão Dia).
// - Dias/linhas do período sem visualizações aparecem como ZERO (série contínua) —
//   inclusive quando o episódio escolhido não teve nenhuma no período.
// - Estado vazio: a coleção nasce vazia — o histórico por período começa a valer a
//   partir da publicação desta versão (o acumulado antigo não tem datas).
// - Permissão: mesma matriz do card "Estatísticas de Visualização" — só renderiza com
//   hasScreenPermission('episodios') (Master/Gerencial sempre; ADM com a tela liberada).
// - Mobile: ResponsiveContainer 100% de largura, altura fixa — não corta nem estoura.

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import pb from '@/lib/pocketbase/client'
import type { EpisodioRecord, EpisodioVisualizacaoRecord } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { BarChart3, CalendarDays, Clapperboard } from 'lucide-react'

const VINHO = '#4B1E3F'
const DOURADO = '#D4AF37'

type Periodo = 7 | 30 | 90
type Granularidade = 'dia' | 'semana' | 'mes'
type EpisodioSelecionado = 'todos' | string

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 7, rotulo: '7 dias' },
  { valor: 30, rotulo: '30 dias' },
  { valor: 90, rotulo: '90 dias' },
]

const GRANULARIDADES: { valor: Granularidade; rotulo: string }[] = [
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
]

const paraYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Chave de agrupamento (semana começa na segunda-feira)
const chaveBucket = (d: Date, g: Granularidade) => {
  if (g === 'dia') return paraYmd(d)
  if (g === 'mes') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const segunda = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
  return paraYmd(segunda)
}

const rotuloBucket = (chave: string, g: Granularidade) => {
  const [y, m, d] = chave.split('-').map(Number)
  if (g === 'mes') {
    return new Date(y, m - 1, 1)
      .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('.', '')
  }
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

export default function GraficoVisualizacoesPeriodo() {
  const { hasScreenPermission } = useAuth()
  const autorizado = useMemo(() => {
    try {
      return hasScreenPermission('episodios')
    } catch {
      return false
    }
  }, [hasScreenPermission])

  const [periodo, setPeriodo] = useState<Periodo>(30)
  const [granularidade, setGranularidade] = useState<Granularidade>('dia')
  const [episodioSelecionado, setEpisodioSelecionado] = useState<EpisodioSelecionado>('todos')
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [eventos, setEventos] = useState<EpisodioVisualizacaoRecord[]>([])
  const [episodios, setEpisodios] = useState<EpisodioRecord[]>([])

  useEffect(() => {
    if (!autorizado) return

    async function carregar() {
      setCarregando(true)
      setFalhou(false)
      try {
        const inicio = new Date()
        inicio.setHours(0, 0, 0, 0)
        inicio.setDate(inicio.getDate() - (periodo - 1))
        const inicioIso = inicio.toISOString()
        const [lista, listaEpisodios] = await Promise.all([
          pb.collection('episodio_visualizacoes').getFullList<EpisodioVisualizacaoRecord>({
            filter: `created >= "${inicioIso}"`,
            fields: 'id,created,episodio',
          }),
          // Lista para o dropdown de episódios (etiqueta igual à tabela: "#N — título")
          pb.collection('episodios').getFullList<EpisodioRecord>({
            sort: 'numero',
            fields: 'id,numero,titulo',
          }),
        ])
        setEventos(lista)
        setEpisodios(listaEpisodios)
      } catch {
        setFalhou(true)
        setEventos([])
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [autorizado, periodo])

  // Série temporal: buckets do período inteiro com zeros onde não houve visualização
  const serie = useMemo(() => {
    const buckets = new Map<string, number>()
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - (periodo - 1))

    const passos =
      granularidade === 'dia'
        ? periodo
        : granularidade === 'semana'
          ? Math.ceil(periodo / 7) + 1
          : Math.ceil(periodo / 30) + 1

    const cursor = new Date(inicio)
    for (let i = 0; i <= passos; i++) {
      buckets.set(chaveBucket(cursor, granularidade), 0)
      if (granularidade === 'dia') cursor.setDate(cursor.getDate() + 1)
      else if (granularidade === 'semana') cursor.setDate(cursor.getDate() + 7)
      else cursor.setMonth(cursor.getMonth() + 1)
    }

    eventos.forEach((ev) => {
      if (episodioSelecionado !== 'todos' && ev.episodio !== episodioSelecionado) return
      const d = new Date(ev.created)
      if (isNaN(d.getTime())) return
      if (d < inicio) return
      const chave = chaveBucket(d, granularidade)
      buckets.set(chave, (buckets.get(chave) || 0) + 1)
    })

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([chave, valor]) => ({
        periodo: rotuloBucket(chave, granularidade),
        visualizacoes: valor,
      }))
  }, [eventos, periodo, granularidade, episodioSelecionado])

  if (!autorizado) return null

  const totalPeriodo = serie.reduce((acc, p) => acc + p.visualizacoes, 0)
  const temDados = totalPeriodo > 0
  const episodioEscolhido =
    episodioSelecionado !== 'todos'
      ? episodios.find((e) => e.id === episodioSelecionado)
      : undefined
  const rotuloEpisodio = episodioEscolhido
    ? `#${episodioEscolhido.numero} — ${episodioEscolhido.titulo}`
    : 'Todos os episódios'

  return (
    <div className="bg-marfim/60 border border-vinho/10 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Título + seletor de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-serif text-sm sm:text-base font-bold text-vinho flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-dourado" />
            Visualizações por período
          </h4>
          <p className="text-[11px] text-vinho/60 mt-0.5 break-words">
            {temDados
              ? `${rotuloEpisodio} • Últimos ${periodo} dias • ${totalPeriodo.toLocaleString('pt-BR')} ${
                  totalPeriodo === 1 ? 'visualização' : 'visualizações'
                }`
              : 'Série temporal das páginas dos episódios'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setPeriodo(p.valor)}
              className={`px-3 py-1.5 min-h-[32px] rounded-full text-[11px] font-semibold border transition-colors ${
                periodo === p.valor
                  ? 'bg-vinho text-marfim border-vinho'
                  : 'bg-white text-vinho/70 border-vinho/15 hover:border-dourado hover:text-vinho'
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Seletores: episódio + granularidade */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clapperboard className="w-3.5 h-3.5 text-vinho/40 shrink-0" />
          <select
            value={episodioSelecionado}
            onChange={(e) => setEpisodioSelecionado(e.target.value)}
            aria-label="Filtrar por episódio"
            className="min-h-[28px] max-w-full sm:max-w-[260px] rounded-full border border-vinho/15 bg-white px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-vinho focus:outline-none focus:ring-2 focus:ring-dourado/50 truncate"
          >
            <option value="todos">Todos os episódios</option>
            {episodios.map((ep) => (
              <option key={ep.id} value={ep.id}>
                #{ep.numero} — {ep.titulo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <CalendarDays className="w-3.5 h-3.5 text-vinho/40 shrink-0" />
          <div className="flex gap-1.5">
            {GRANULARIDADES.map((g) => (
              <button
                key={g.valor}
                type="button"
                onClick={() => setGranularidade(g.valor)}
                className={`px-2.5 py-1 min-h-[28px] rounded-full text-[10px] font-semibold border transition-colors ${
                  granularidade === g.valor
                    ? 'bg-dourado/20 text-vinho border-dourado'
                    : 'bg-white text-vinho/50 border-vinho/10 hover:border-dourado/50'
                }`}
              >
                {g.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-vinho/60">
          Carregando gráfico...
        </div>
      ) : falhou ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-vinho/60">
          Não foi possível carregar o gráfico agora. Tente novamente mais tarde.
        </div>
      ) : (
        <div className="w-full">
          {!temDados && (
            <p className="text-[11px] text-vinho/60 text-center mb-2 border border-dashed border-vinho/15 rounded-xl bg-white/50 px-4 py-2">
              Nenhuma visualização no período selecionado
              {episodioSelecionado !== 'todos' ? ' para este episódio' : ''}. O histórico por
              período começa a valer a partir da publicação desta versão — o acumulado antigo dos
              episódios não tem datas.
            </p>
          )}
          {/* A série nunca fica vazia: dias do período sem visualização são ZERO, */}
          {/* inclusive com episódio específico escolhido — gráfico sempre desenhado. */}
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVizPeriodo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VINHO} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={VINHO} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={VINHO}
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="periodo"
                tick={{ fontSize: 10, fill: VINHO, fillOpacity: 0.6 }}
                tickLine={false}
                axisLine={{ stroke: VINHO, strokeOpacity: 0.15 }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: VINHO, fillOpacity: 0.6 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                formatter={(valor: number) => [
                  `${valor} ${valor === 1 ? 'visualização' : 'visualizações'}`,
                  'Período',
                ]}
                labelStyle={{ color: VINHO, fontWeight: 700, fontSize: 12 }}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${VINHO}22`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="visualizacoes"
                stroke={VINHO}
                strokeWidth={2}
                fill="url(#gradVizPeriodo)"
                dot={{ r: 2.5, fill: DOURADO, stroke: VINHO, strokeWidth: 1 }}
                activeDot={{ r: 4.5, fill: DOURADO, stroke: VINHO, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
