import React, { useMemo } from 'react'
import { toInputDate, formatDateBR } from '@/lib/formatters'
import type { AgendaRecord } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  Send,
  User,
  Clock,
  Sparkles,
  Info,
  Edit2,
  Trash2,
} from 'lucide-react'

export type AgendaEventType =
  | 'gravacao-passada'
  | 'postagem-passada'
  | 'gravacao-futura'
  | 'postagem-futura'

export interface AgendaEventItem {
  id: string
  agendaId: string
  tipo: AgendaEventType
  dataIso: string
  dataYmd: string
  titulo: string
  horasUtilizadas?: number
  nomeConvidado?: string
  empresa?: string
  patrocinado?: boolean
  patrocinadores?: string
  roteiro?: string
  record: AgendaRecord
}

interface AgendaCalendarViewProps {
  agendamentos: AgendaRecord[]
  selectedDate: string | null
  onSelectDate: (dateYmd: string | null) => void
  onEditItem?: (item: AgendaRecord) => void
  onDeleteItem?: (id: string, titulo: string) => void
}

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

// Normaliza objeto Date local para string YYYY-MM-DD sem distorção de fuso
function formatLocalYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AgendaCalendarView({
  agendamentos,
  selectedDate,
  onSelectDate,
  onEditItem,
  onDeleteItem,
}: AgendaCalendarViewProps) {
  // Data de "hoje" no navegador do usuário
  const todayYmd = useMemo(() => formatLocalYMD(new Date()), [])

  // Inicializa o mês/ano exibido no calendário com o mês atual do usuário
  const [currentMonthDate, setCurrentMonthDate] = React.useState<Date>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Agrupa eventos por data YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, AgendaEventItem[]>()

    agendamentos.forEach((item) => {
      // 1. Data de Gravação
      if (item.data_gravacao) {
        const ymd = toInputDate(item.data_gravacao)
        if (ymd) {
          const isPast = ymd < todayYmd
          const tipo: AgendaEventType = isPast ? 'gravacao-passada' : 'gravacao-futura'
          const eventItem: AgendaEventItem = {
            id: `${item.id}-gravacao`,
            agendaId: item.id,
            tipo,
            dataIso: item.data_gravacao,
            dataYmd: ymd,
            titulo: item.titulo,
            horasUtilizadas: item.horas_utilizadas,
            nomeConvidado: item.nome_convidado,
            empresa: item.empresa,
            patrocinado: item.patrocinado,
            patrocinadores: item.patrocinadores,
            roteiro: item.roteiro,
            record: item,
          }
          const list = map.get(ymd) || []
          list.push(eventItem)
          map.set(ymd, list)
        }
      }

      // 2. Data Prevista de Postagem
      if (item.data_postagem) {
        const ymd = toInputDate(item.data_postagem)
        if (ymd) {
          const isPast = ymd < todayYmd
          const tipo: AgendaEventType = isPast ? 'postagem-passada' : 'postagem-futura'
          const eventItem: AgendaEventItem = {
            id: `${item.id}-postagem`,
            agendaId: item.id,
            tipo,
            dataIso: item.data_postagem,
            dataYmd: ymd,
            titulo: item.titulo,
            horasUtilizadas: item.horas_utilizadas,
            nomeConvidado: item.nome_convidado,
            empresa: item.empresa,
            patrocinado: item.patrocinado,
            patrocinadores: item.patrocinadores,
            roteiro: item.roteiro,
            record: item,
          }
          const list = map.get(ymd) || []
          list.push(eventItem)
          map.set(ymd, list)
        }
      }
    })

    return map
  }, [agendamentos, todayYmd])

  // Navegação de mês
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleGoToday = () => {
    const d = new Date()
    setCurrentMonthDate(new Date(d.getFullYear(), d.getMonth(), 1))
    onSelectDate(todayYmd)
  }

  // Gera a grade do mês (dias do mês anterior, dias do mês vigente, dias do mês seguinte)
  const calendarCells = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()

    const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Dom, 6 = Sáb
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
    const totalDaysPrevMonth = new Date(year, month, 0).getDate()

    const cells: Array<{
      dateYmd: string
      dayNumber: number
      isCurrentMonth: boolean
      isToday: boolean
      events: AgendaEventItem[]
    }> = []

    // Dias do mês anterior para completar a primeira semana
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = totalDaysPrevMonth - i
      const prevDate = new Date(year, month - 1, dayNum)
      const ymd = formatLocalYMD(prevDate)
      cells.push({
        dateYmd: ymd,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: ymd === todayYmd,
        events: eventsByDate.get(ymd) || [],
      })
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(year, month, d)
      const ymd = formatLocalYMD(curDate)
      cells.push({
        dateYmd: ymd,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: ymd === todayYmd,
        events: eventsByDate.get(ymd) || [],
      })
    }

    // Dias do próximo mês para fechar semanas completas (múltiplo de 7, máx 35 ou 42)
    const remaining = 7 - (cells.length % 7)
    if (remaining < 7) {
      for (let nextDay = 1; nextDay <= remaining; nextDay++) {
        const nextDate = new Date(year, month + 1, nextDay)
        const ymd = formatLocalYMD(nextDate)
        cells.push({
          dateYmd: ymd,
          dayNumber: nextDay,
          isCurrentMonth: false,
          isToday: ymd === todayYmd,
          events: eventsByDate.get(ymd) || [],
        })
      }
    }

    return cells
  }, [currentMonthDate, todayYmd, eventsByDate])

  // Eventos do dia selecionado
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    return eventsByDate.get(selectedDate) || []
  }, [selectedDate, eventsByDate])

  // Contadores para o mês corrente
  const monthStats = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    let gravacoesPassadas = 0
    let postagensPassadas = 0
    let gravacoesFuturas = 0
    let postagensFuturas = 0

    eventsByDate.forEach((events, ymd) => {
      const [y, m] = ymd.split('-').map(Number)
      if (y === year && m === month + 1) {
        events.forEach((ev) => {
          if (ev.tipo === 'gravacao-passada') gravacoesPassadas++
          if (ev.tipo === 'postagem-passada') postagensPassadas++
          if (ev.tipo === 'gravacao-futura') gravacoesFuturas++
          if (ev.tipo === 'postagem-futura') postagensFuturas++
        })
      }
    })

    return {
      gravacoesPassadas,
      postagensPassadas,
      gravacoesFuturas,
      postagensFuturas,
      total: gravacoesPassadas + postagensPassadas + gravacoesFuturas + postagensFuturas,
    }
  }, [currentMonthDate, eventsByDate])

  return (
    <div className="space-y-4">
      {/* Barra de Controles do Calendário */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Mês e Navegação */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                aria-label="Mês anterior"
                className="h-9 w-9 p-0 rounded-xl border-vinho/15 hover:bg-vinho/5 text-vinho"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                aria-label="Próximo mês"
                className="h-9 w-9 p-0 rounded-xl border-vinho/15 hover:bg-vinho/5 text-vinho"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center sm:text-left">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-vinho capitalize">
                {MESES[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
              </h3>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToday}
              className="text-xs h-9 px-3 rounded-xl border-vinho/15 hover:bg-vinho/5 text-vinho font-medium shrink-0"
            >
              Hoje
            </Button>
          </div>

          {/* Resumo do mês */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-vinho/60 text-[11px] whitespace-nowrap hidden sm:inline">
              Neste mês:
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#4b1e3f] text-white shadow-2xs shrink-0"
              title="Gravações já realizadas neste mês"
            >
              <Video className="w-3 h-3 text-[#d4af37]" />
              <span>{monthStats.gravacoesPassadas} gravadas</span>
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#8a5b13] text-amber-50 shadow-2xs shrink-0"
              title="Postagens já concluídas neste mês"
            >
              <Send className="w-3 h-3 text-amber-200" />
              <span>{monthStats.postagensPassadas} postadas</span>
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1b4d3e] text-emerald-50 shadow-2xs shrink-0"
              title="Gravações futuras agendadas para este mês"
            >
              <Video className="w-3 h-3 text-emerald-200" />
              <span>{monthStats.gravacoesFuturas} a gravar</span>
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#a24857] text-rose-50 shadow-2xs shrink-0"
              title="Postagens futuras previstas para este mês"
            >
              <Send className="w-3 h-3 text-rose-200" />
              <span>{monthStats.postagensFuturas} a postar</span>
            </span>
          </div>
        </div>

        {/* Legenda Explicativa Oficial CoffeeCast 4.0 */}
        <div className="mt-3 pt-3 border-t border-vinho/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="text-vinho/70 font-semibold text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-dourado-dark" /> Legenda:
            </span>

            {/* 1. Gravação Passada */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4b1e3f] ring-2 ring-[#4b1e3f]/20 shrink-0" />
              <span className="text-vinho font-medium text-[11px]">
                Teve Gravação <span className="text-vinho/60 font-normal">(passado • Vinho)</span>
              </span>
            </div>

            {/* 2. Postagem Passada */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8a5b13] ring-2 ring-[#8a5b13]/20 shrink-0" />
              <span className="text-vinho font-medium text-[11px]">
                Teve Postagem <span className="text-vinho/60 font-normal">(passado • Dourado)</span>
              </span>
            </div>

            {/* 3. Gravação Futura */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b4d3e] ring-2 ring-[#1b4d3e]/20 shrink-0" />
              <span className="text-vinho font-medium text-[11px]">
                Teremos Gravação{' '}
                <span className="text-vinho/60 font-normal">(futuro • Esmeralda)</span>
              </span>
            </div>

            {/* 4. Postagem Futura */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a24857] ring-2 ring-[#a24857]/20 shrink-0" />
              <span className="text-vinho font-medium text-[11px]">
                Prev. Postagem{' '}
                <span className="text-vinho/60 font-normal">(futuro • Rosé Nobre)</span>
              </span>
            </div>

            {/* Dica */}
            <span className="text-[11px] text-vinho/50 sm:ml-auto hidden md:inline-flex items-center gap-1">
              <Info className="w-3 h-3" /> Clique no dia para ver os episódios correspondentes
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal do Calendário */}
      <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-hidden">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 bg-marfim border-b border-vinho/10 text-center">
          {DIAS_DA_SEMANA.map((dia, idx) => (
            <div
              key={dia}
              className={`py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                idx === 0 || idx === 6 ? 'text-vinho/50' : 'text-vinho'
              }`}
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Células de Dias */}
        <div className="grid grid-cols-7 divide-x divide-y divide-vinho/10">
          {calendarCells.map((cell) => {
            const hasEvents = cell.events.length > 0
            const isSelected = selectedDate === cell.dateYmd

            // Contadores por tipo no dia
            const gravPass = cell.events.filter((e) => e.tipo === 'gravacao-passada')
            const postPass = cell.events.filter((e) => e.tipo === 'postagem-passada')
            const gravFut = cell.events.filter((e) => e.tipo === 'gravacao-futura')
            const postFut = cell.events.filter((e) => e.tipo === 'postagem-futura')

            return (
              <button
                key={cell.dateYmd}
                type="button"
                onClick={() => onSelectDate(cell.dateYmd)}
                className={`relative min-h-[64px] sm:min-h-[92px] p-1 sm:p-2 text-left transition-all flex flex-col justify-between group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dourado ${
                  !cell.isCurrentMonth
                    ? 'bg-marfim/30 text-vinho/35 hover:bg-marfim/60'
                    : 'bg-white text-vinho hover:bg-vinho/5'
                } ${isSelected ? 'ring-2 ring-inset ring-vinho bg-marfim/80 shadow-inner' : ''}`}
              >
                {/* Cabeçalho do dia: número e indicador de hoje */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-semibold inline-flex items-center justify-center rounded-full w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      cell.isToday
                        ? 'bg-vinho text-white font-bold ring-2 ring-dourado shadow-xs'
                        : isSelected
                          ? 'bg-dourado text-vinho font-bold'
                          : !cell.isCurrentMonth
                            ? 'text-vinho/40'
                            : 'text-vinho group-hover:text-vinho-dark'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.isToday && (
                    <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-dourado-dark px-1 bg-dourado/10 rounded-sm">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Marcadores / badges de eventos no dia */}
                {hasEvents ? (
                  <div className="w-full mt-1 space-y-0.5 sm:space-y-1">
                    {/* Versão Compacta Mobile (Pontos coloridos e contador) */}
                    <div className="flex sm:hidden flex-wrap items-center gap-1">
                      {gravPass.length > 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#4b1e3f]"
                          title={`${gravPass.length} gravação passada`}
                        />
                      )}
                      {postPass.length > 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#8a5b13]"
                          title={`${postPass.length} postagem passada`}
                        />
                      )}
                      {gravFut.length > 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#1b4d3e]"
                          title={`${gravFut.length} gravação futura`}
                        />
                      )}
                      {postFut.length > 0 && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#a24857]"
                          title={`${postFut.length} postagem futura`}
                        />
                      )}
                      <span className="text-[10px] font-bold text-vinho/80">
                        {cell.events.length}
                      </span>
                    </div>

                    {/* Versão Desktop (Pills descritivas com título truncado) */}
                    <div className="hidden sm:block space-y-0.5 max-h-[58px] overflow-hidden">
                      {gravPass.slice(0, 1).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#4b1e3f] text-white flex items-center gap-1 shadow-2xs"
                          title={`Gravação realizada: ${ev.titulo}`}
                        >
                          <Video className="w-2.5 h-2.5 text-[#d4af37] shrink-0" />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      ))}

                      {postPass.slice(0, 1).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#8a5b13] text-amber-50 flex items-center gap-1 shadow-2xs"
                          title={`Postagem realizada: ${ev.titulo}`}
                        >
                          <Send className="w-2.5 h-2.5 text-amber-200 shrink-0" />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      ))}

                      {gravFut.slice(0, 1).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#1b4d3e] text-emerald-50 flex items-center gap-1 shadow-2xs"
                          title={`Gravação futura: ${ev.titulo}`}
                        >
                          <Video className="w-2.5 h-2.5 text-emerald-200 shrink-0" />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      ))}

                      {postFut.slice(0, 1).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#a24857] text-rose-50 flex items-center gap-1 shadow-2xs"
                          title={`Prev. de postagem: ${ev.titulo}`}
                        >
                          <Send className="w-2.5 h-2.5 text-rose-200 shrink-0" />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      ))}

                      {cell.events.length > 2 && (
                        <span className="text-[9px] font-bold text-vinho/70 pl-0.5 block">
                          +{cell.events.length - 2} evento(s)
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-4 sm:h-6" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Painel de Detalhes do Dia Selecionado */}
      {selectedDate && (
        <div className="bg-marfim rounded-2xl border-2 border-dourado/40 p-4 sm:p-5 shadow-xs transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-vinho/15">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-vinho text-dourado">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif text-base sm:text-lg font-bold text-vinho">
                  Agendamentos para {formatDateBR(selectedDate)}
                </h4>
                <p className="text-xs text-vinho/70">
                  {selectedDayEvents.length === 0
                    ? 'Nenhum agendamento neste dia específico.'
                    : `${selectedDayEvents.length} atividade(s) encontrada(s) nesta data.`}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectDate(null)}
              className="text-xs rounded-xl border-vinho/20 text-vinho hover:bg-vinho/5"
            >
              Fechar Detalhes do Dia
            </Button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-vinho/60">
              Nenhuma gravação ou postagem agendada para o dia {formatDateBR(selectedDate)}.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDayEvents.map((ev) => {
                const isGravacao = ev.tipo === 'gravacao-passada' || ev.tipo === 'gravacao-futura'
                const isPassado = ev.tipo === 'gravacao-passada' || ev.tipo === 'postagem-passada'

                let badgeColor = 'bg-[#4b1e3f] text-white'
                let badgeLabel = 'Gravação Concluída'
                if (ev.tipo === 'postagem-passada') {
                  badgeColor = 'bg-[#8a5b13] text-amber-50'
                  badgeLabel = 'Postagem Concluída'
                } else if (ev.tipo === 'gravacao-futura') {
                  badgeColor = 'bg-[#1b4d3e] text-emerald-50'
                  badgeLabel = 'Gravação Futura'
                } else if (ev.tipo === 'postagem-futura') {
                  badgeColor = 'bg-[#a24857] text-rose-50'
                  badgeLabel = 'Postagem Prevista'
                }

                return (
                  <div
                    key={ev.id}
                    className="bg-white rounded-xl border border-vinho/15 p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeColor}`}
                        >
                          {isGravacao ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>{badgeLabel}</span>
                        </span>

                        <span className="text-[11px] font-semibold text-vinho/60">
                          {isPassado ? 'Passado' : 'A realizar'}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs sm:text-sm text-vinho leading-snug">
                        {ev.titulo}
                      </h5>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-vinho/5">
                        <div>
                          <span className="text-[10px] text-vinho/60 block">Gravação</span>
                          <span className="font-medium text-vinho">
                            {formatDateBR(ev.record.data_gravacao)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-vinho/60 block">Prev. Postagem</span>
                          <span className="font-medium text-vinho">
                            {formatDateBR(ev.record.data_postagem)}
                          </span>
                        </div>
                      </div>

                      {ev.record.tem_convidado && (
                        <div className="text-xs flex items-center gap-1.5 text-vinho/80 bg-marfim p-2 rounded-lg">
                          <User className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
                          <span className="truncate">
                            <strong>{ev.record.nome_convidado}</strong>
                            {ev.record.empresa ? ` (${ev.record.empresa})` : ''}
                          </span>
                        </div>
                      )}

                      {ev.record.horas_utilizadas ? (
                        <div className="text-xs flex items-center gap-1.5 text-rose-700">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            <strong>{ev.record.horas_utilizadas}h</strong> debitada(s) no banco de
                            horas
                          </span>
                        </div>
                      ) : null}

                      {ev.record.patrocinado && (
                        <Badge className="bg-vinho text-dourado text-[10px] font-semibold">
                          Patrocínio: {ev.record.patrocinadores || 'Confirmado'}
                        </Badge>
                      )}
                    </div>

                    {(onEditItem || onDeleteItem) && (
                      <div className="pt-2 border-t border-vinho/10 flex items-center justify-end gap-1">
                        {onEditItem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditItem(ev.record)}
                            className="h-8 px-2.5 text-xs text-vinho hover:bg-vinho/10 gap-1 rounded-lg"
                          >
                            <Edit2 className="w-3 h-3" /> Editar
                          </Button>
                        )}
                        {onDeleteItem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteItem(ev.agendaId, ev.titulo)}
                            className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 gap-1 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
