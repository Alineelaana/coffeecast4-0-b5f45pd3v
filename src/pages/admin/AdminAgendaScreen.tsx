import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  formatDateBR,
  formatDateTimeBR,
  extractTimeHHmm,
  composeDateTimeISO,
  getFileUrl,
  toInputDate,
} from '@/lib/formatters'
import type { AgendaRecord, HorasCompradasRecord } from '@/types/database'
import { AuditoriaService } from '@/services/auditoria'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit2,
  Trash2,
  CalendarDays,
  Clock,
  ImageIcon,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  ListFilter,
  History,
  CalendarCheck2,
  CalendarRange,
  List,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AgendaCalendarView } from '@/components/admin/AgendaCalendarView'

function RoteiroExpandivel({
  roteiro,
  variant = 'card',
}: {
  roteiro?: string
  variant?: 'card' | 'table'
}) {
  const [expanded, setExpanded] = useState(false)
  const [canClamp, setCanClamp] = useState(false)
  const textRef = React.useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return

    const checkOverflow = () => {
      if (!expanded) {
        // Tolerância de 1px para subpixel rendering
        const isOverflowing = el.scrollHeight > el.clientHeight + 1
        setCanClamp(isOverflowing)
      }
    }

    const rafId = requestAnimationFrame(checkOverflow)
    window.addEventListener('resize', checkOverflow)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [roteiro, expanded])

  if (!roteiro || !roteiro.trim()) return null

  if (variant === 'table') {
    return (
      <div className="mt-1">
        <p
          ref={textRef}
          className={`text-[11px] font-normal text-vinho/75 leading-relaxed break-words whitespace-pre-wrap ${
            expanded ? '' : 'line-clamp-3'
          }`}
        >
          <strong className="text-vinho font-semibold">Roteiro:</strong> {roteiro}
        </p>
        {(canClamp || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="mt-1 inline-flex items-center gap-1 font-serif text-[11px] font-semibold text-vinho hover:text-dourado-dark transition-colors duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-dourado rounded-sm py-0.5 group/btn"
          >
            <span>{expanded ? 'Ler menos' : 'Ler mais'}</span>
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-dourado group-hover/btn:text-dourado-dark transition-transform" />
            ) : (
              <ChevronDown className="w-3 h-3 text-dourado group-hover/btn:text-dourado-dark transition-transform" />
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-marfim/60 p-2.5 rounded-xl border border-vinho/10">
      <p
        ref={textRef}
        className={`text-xs text-vinho/75 leading-relaxed break-words whitespace-pre-wrap ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        <strong className="text-vinho font-semibold">Roteiro:</strong> {roteiro}
      </p>
      {(canClamp || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-1.5 inline-flex items-center gap-1 font-serif text-xs font-semibold text-vinho hover:text-dourado-dark transition-colors duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-dourado rounded-sm py-0.5 group/btn"
        >
          <span>{expanded ? 'Ler menos' : 'Ler mais'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-dourado group-hover/btn:text-dourado-dark transition-transform" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-dourado group-hover/btn:text-dourado-dark transition-transform" />
          )}
        </button>
      )}
    </div>
  )
}

export default function AdminAgendaScreen() {
  const [agendamentos, setAgendamentos] = useState<AgendaRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros solicitados pela Aline:
  // "calendario" (visão padrão), "passada", "futura", "periodo", "todos" (lista completa)
  const [activeFilter, setActiveFilter] = useState<
    'calendario' | 'passada' | 'futura' | 'periodo' | 'todos'
  >('calendario')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)

  // Normaliza hoje no formato local YYYY-MM-DD
  const todayYmd = React.useMemo(() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // Lista filtrada pelos modos: Passada, Futura, Período ou Todos
  const filteredAgendamentos = React.useMemo(() => {
    if (activeFilter === 'passada') {
      // Data anterior à data de hoje no navegador
      return agendamentos.filter((item) => {
        const ymd = toInputDate(item.data_gravacao)
        return ymd ? ymd < todayYmd : false
      })
    }

    if (activeFilter === 'futura') {
      // Data de hoje em diante no navegador
      return agendamentos.filter((item) => {
        const ymd = toInputDate(item.data_gravacao)
        return ymd ? ymd >= todayYmd : false
      })
    }

    if (activeFilter === 'periodo') {
      return agendamentos.filter((item) => {
        const ymd = toInputDate(item.data_gravacao)
        if (!ymd) return false
        if (dataInicio && ymd < dataInicio) return false
        if (dataFim && ymd > dataFim) return false
        return true
      })
    }

    // Para 'calendario' e 'todos', retorna a lista completa
    return agendamentos
  }, [agendamentos, activeFilter, todayYmd, dataInicio, dataFim])

  // Saldo de horas disponíveis para feedback visual
  const [saldoDisponivel, setSaldoDisponivel] = useState<number | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AgendaRecord | null>(null)

  // Form states
  const [titulo, setTitulo] = useState('')
  const [roteiro, setRoteiro] = useState('')
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [dataGravacao, setDataGravacao] = useState('')
  const [horaGravacao, setHoraGravacao] = useState('')
  const [dataPostagem, setDataPostagem] = useState('')
  const [temConvidado, setTemConvidado] = useState(false)
  const [nomeConvidado, setNomeConvidado] = useState('')
  const [biografiaConvidado, setBiografiaConvidado] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [patrocinado, setPatrocinado] = useState(false)
  const [patrocinadores, setPatrocinadores] = useState('')
  const [horasUtilizadas, setHorasUtilizadas] = useState('1')
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const loadAgenda = async () => {
    try {
      setLoading(true)
      const [list, horasCompradasList] = await Promise.all([
        pb.collection('agenda').getFullList<AgendaRecord>({
          sort: 'data_gravacao',
        }),
        pb
          .collection('horas_compradas')
          .getFullList<HorasCompradasRecord>()
          .catch(() => [] as HorasCompradasRecord[]),
      ])
      setAgendamentos(list)

      // Calcula saldo atual
      const totalCompradas = (horasCompradasList as HorasCompradasRecord[]).reduce(
        (acc: number, c: HorasCompradasRecord) => acc + (Number(c.quantidade_horas) || 0),
        0,
      )
      const totalGastas = list.reduce(
        (acc: number, a: AgendaRecord) => acc + (Number(a.horas_utilizadas) || 0),
        0,
      )
      setSaldoDisponivel(totalCompradas - totalGastas)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar agenda.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgenda()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    const today = toInputDate(new Date().toISOString())
    setTitulo('')
    setRoteiro('')
    setDataAgendamento(today)
    setDataGravacao(today)
    setHoraGravacao('')
    setDataPostagem('')
    setTemConvidado(false)
    setNomeConvidado('')
    setBiografiaConvidado('')
    setEmpresa('')
    setPatrocinado(false)
    setPatrocinadores('')
    setHorasUtilizadas('1')
    setImageFiles(null)
    setExistingImages([])
    setImagesToDelete([])
    setModalOpen(true)
  }

  const handleOpenEdit = (item: AgendaRecord) => {
    setEditingItem(item)
    setTitulo(item.titulo || '')
    setRoteiro(item.roteiro || '')
    setDataAgendamento(toInputDate(item.data_agendamento))
    setDataGravacao(toInputDate(item.data_gravacao))
    setHoraGravacao(extractTimeHHmm(item.data_gravacao))
    setDataPostagem(toInputDate(item.data_postagem))
    setTemConvidado(Boolean(item.tem_convidado))
    setNomeConvidado(item.nome_convidado || '')
    setBiografiaConvidado(item.biografia_convidado || '')
    setEmpresa(item.empresa || '')
    setPatrocinado(Boolean(item.patrocinado))
    setPatrocinadores(item.patrocinadores || '')
    setHorasUtilizadas(
      item.horas_utilizadas !== undefined && item.horas_utilizadas !== null
        ? String(item.horas_utilizadas)
        : '0',
    )
    const imgs = Array.isArray(item.imagens) ? item.imagens : item.imagens ? [item.imagens] : []
    setExistingImages(imgs)
    setImagesToDelete([])
    setImageFiles(null)
    setModalOpen(true)
  }

  const handleRemoveExistingImage = (fileName: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== fileName))
    setImagesToDelete((prev) => (prev.includes(fileName) ? prev : [...prev, fileName]))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const parsedHoras = parseFloat(horasUtilizadas.replace(',', '.')) || 0

      const formData = new FormData()
      formData.append('titulo', titulo.trim())
      formData.append('roteiro', roteiro.trim())

      // Formata as datas: data_agendamento e data_postagem usam YYYY-MM-DD
      // data_gravacao compõe com horário se informado (ISO com fuso de Brasília)
      const formattedDataAgendamento = toInputDate(dataAgendamento)
      const formattedDataGravacao = composeDateTimeISO(dataGravacao, horaGravacao)
      const formattedDataPostagem = toInputDate(dataPostagem)

      formData.append('data_agendamento', formattedDataAgendamento)
      formData.append('data_gravacao', formattedDataGravacao)
      if (formattedDataPostagem) {
        formData.append('data_postagem', formattedDataPostagem)
      } else if (editingItem) {
        // Permite limpar data_postagem se o usuário apagou
        formData.append('data_postagem', '')
      }

      formData.append('tem_convidado', String(temConvidado))
      formData.append('nome_convidado', temConvidado ? nomeConvidado.trim() : '')
      formData.append('biografia_convidado', temConvidado ? biografiaConvidado.trim() : '')
      formData.append('empresa', temConvidado ? empresa.trim() : '')

      formData.append('patrocinado', String(patrocinado))
      formData.append('patrocinadores', patrocinado ? patrocinadores.trim() : '')

      formData.append('horas_utilizadas', String(parsedHoras))

      // Informa remoção de imagens existentes caso o usuário tenha excluído alguma
      for (const imgName of imagesToDelete) {
        formData.append('imagens-', imgName)
      }

      // Adiciona novos arquivos de imagem (respeitando limite de 6 totais)
      if (imageFiles && imageFiles.length > 0) {
        const remainingSlots = Math.max(0, 6 - existingImages.length)
        const count = Math.min(imageFiles.length, remainingSlots)
        for (let i = 0; i < count; i++) {
          formData.append('imagens', imageFiles[i])
        }
      }

      if (editingItem) {
        const antigo = { ...editingItem }
        const updated = await pb.collection('agenda').update(editingItem.id, formData)

        const horaTexto = horaGravacao ? ` às ${horaGravacao}` : ''
        AuditoriaService.registrarEvento({
          tipo_acao: 'edicao',
          area_sistema: 'Agenda de Gravação',
          descricao: `Agendamento "${titulo.trim()}" atualizado para ${formatDateBR(dataGravacao)}${horaTexto}`,
          registro_afetado: editingItem.id,
          tabela_afetada: 'agenda',
          diff_antes: antigo,
          diff_depois: updated,
        })

        toast.success('Agendamento atualizado com sucesso!')
      } else {
        const created = await pb.collection('agenda').create(formData)

        const horaTexto = horaGravacao ? ` às ${horaGravacao}` : ''
        AuditoriaService.registrarEvento({
          tipo_acao: 'criacao',
          area_sistema: 'Agenda de Gravação',
          descricao: `Novo agendamento criado: "${titulo.trim()}" para ${formatDateBR(dataGravacao)}${horaTexto}`,
          registro_afetado: created.id,
          tabela_afetada: 'agenda',
          diff_depois: created,
        })

        toast.success('Novo episódio agendado com sucesso!')
      }

      setModalOpen(false)
      await loadAgenda()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar agendamento na agenda.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, tit: string) => {
    if (
      !window.confirm(
        `Deseja realmente remover o agendamento de "${tit}"? As horas vinculadas serão devolvidas ao banco de horas.`,
      )
    )
      return

    try {
      const itemExcluido = agendamentos.find((a) => a.id === id)
      await pb.collection('agenda').delete(id)

      AuditoriaService.registrarEvento({
        tipo_acao: 'exclusao',
        area_sistema: 'Agenda de Gravação',
        descricao: `Agendamento "${tit}" removido da agenda`,
        registro_afetado: id,
        tabela_afetada: 'agenda',
        diff_antes: (itemExcluido as unknown as Record<string, unknown>) || null,
      })

      toast.success('Agendamento removido e horas estornadas ao banco de horas!')
      loadAgenda()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir agendamento.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Agenda & Planejamento
          </h2>
          <p className="text-xs text-vinho/70">
            Cronograma de gravações, roteiros, convidados, patrocinadores e sincronização com o
            banco de horas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {saldoDisponivel !== null && (
            <Link
              to="/admin/horas"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-xl sm:rounded-full text-xs font-semibold bg-white border border-vinho/15 hover:border-dourado text-vinho shadow-2xs transition-all w-full sm:w-auto"
              title="Ver detalhes no Controle de Horas"
            >
              <Clock className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
              <span>
                Banco de Horas: <strong className="text-dourado-dark">{saldoDisponivel}h</strong>{' '}
                disponíveis
              </span>
            </Link>
          )}

          <Button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-dourado shrink-0" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Barra de Filtros & Modos de Visualização (Calendário como padrão) */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <span className="text-xs font-semibold text-vinho/60 hidden sm:inline mr-1 flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5 text-dourado-dark" /> Filtrar:
            </span>

            {/* 1. Visão Padrão: Mostrar no Calendário */}
            <Button
              type="button"
              variant={activeFilter === 'calendario' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('calendario')}
              className={`rounded-xl text-xs h-9 px-3 gap-1.5 transition-all shrink-0 ${
                activeFilter === 'calendario'
                  ? 'bg-vinho text-white font-bold shadow-xs hover:bg-vinho-light'
                  : 'border-vinho/15 text-vinho hover:bg-vinho/5'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-dourado" />
              <span>Mostrar no Calendário</span>
            </Button>

            {/* 2. Agenda Futura */}
            <Button
              type="button"
              variant={activeFilter === 'futura' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('futura')}
              className={`rounded-xl text-xs h-9 px-3 gap-1.5 transition-all shrink-0 ${
                activeFilter === 'futura'
                  ? 'bg-vinho text-white font-bold shadow-xs hover:bg-vinho-light'
                  : 'border-vinho/15 text-vinho hover:bg-vinho/5'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agenda Futura</span>
            </Button>

            {/* 3. Agenda Passada */}
            <Button
              type="button"
              variant={activeFilter === 'passada' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('passada')}
              className={`rounded-xl text-xs h-9 px-3 gap-1.5 transition-all shrink-0 ${
                activeFilter === 'passada'
                  ? 'bg-vinho text-white font-bold shadow-xs hover:bg-vinho-light'
                  : 'border-vinho/15 text-vinho hover:bg-vinho/5'
              }`}
            >
              <History className="w-3.5 h-3.5 text-rose-300" />
              <span>Agenda Passada</span>
            </Button>

            {/* 4. Selecionar Período */}
            <Button
              type="button"
              variant={activeFilter === 'periodo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('periodo')}
              className={`rounded-xl text-xs h-9 px-3 gap-1.5 transition-all shrink-0 ${
                activeFilter === 'periodo'
                  ? 'bg-vinho text-white font-bold shadow-xs hover:bg-vinho-light'
                  : 'border-vinho/15 text-vinho hover:bg-vinho/5'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 text-dourado" />
              <span>Selecionar Período</span>
            </Button>

            {/* 5. Todos os episódios */}
            <Button
              type="button"
              variant={activeFilter === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('todos')}
              className={`rounded-xl text-xs h-9 px-3 gap-1.5 transition-all shrink-0 ${
                activeFilter === 'todos'
                  ? 'bg-vinho text-white font-bold shadow-xs hover:bg-vinho-light'
                  : 'border-vinho/15 text-vinho hover:bg-vinho/5'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Todos ({agendamentos.length})</span>
            </Button>
          </div>

          <div className="text-xs text-vinho/70 font-medium self-end lg:self-center">
            {activeFilter === 'calendario' ? (
              <span>Exibindo visão interativa de calendário</span>
            ) : (
              <span>
                Mostrando <strong>{filteredAgendamentos.length}</strong> de {agendamentos.length}{' '}
                episódios
              </span>
            )}
          </div>
        </div>

        {/* Campos de Início e Fim para Selecionar Período */}
        {activeFilter === 'periodo' && (
          <div className="p-3 bg-marfim rounded-xl border border-vinho/15 space-y-2 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="filtro-data-inicio"
                  className="text-[11px] font-semibold text-vinho"
                >
                  Data de Início:
                </Label>
                <Input
                  id="filtro-data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-white border-vinho/20 text-xs h-9"
                />
              </div>

              <div className="flex-1 space-y-1">
                <Label htmlFor="filtro-data-fim" className="text-[11px] font-semibold text-vinho">
                  Data de Fim:
                </Label>
                <Input
                  id="filtro-data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-white border-vinho/20 text-xs h-9"
                />
              </div>

              {(dataInicio || dataFim) && (
                <div className="sm:self-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDataInicio('')
                      setDataFim('')
                    }}
                    className="text-xs text-vinho/70 hover:text-vinho h-9"
                  >
                    Limpar Período
                  </Button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-vinho/60">
              O filtro por período considera a data de gravação do episódio dentro do intervalo
              escolhido.
            </p>
          </div>
        )}
      </div>

      {/* 1. MODO CALENDÁRIO (Visão padrão solicitada) */}
      {activeFilter === 'calendario' && (
        <div className="space-y-4">
          <AgendaCalendarView
            agendamentos={agendamentos}
            selectedDate={selectedCalendarDate}
            onSelectDate={setSelectedCalendarDate}
            onEditItem={handleOpenEdit}
            onDeleteItem={handleDelete}
          />
        </div>
      )}

      {/* 2. MODO LISTA / TABELA (Para Agenda Passada, Agenda Futura, Selecionar Período e Todos) */}
      {activeFilter !== 'calendario' && (
        <div className="space-y-6">
          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
                Carregando agenda...
              </div>
            ) : agendamentos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-3">
                <p className="text-sm text-vinho/70 font-medium">Nenhum agendamento marcado.</p>
                <Button
                  onClick={handleOpenCreate}
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
                >
                  Agendar primeira gravação
                </Button>
              </div>
            ) : filteredAgendamentos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-2">
                <p className="text-sm text-vinho/70 font-medium">
                  Nenhum episódio encontrado para este filtro.
                </p>
                <Button
                  onClick={() => {
                    setActiveFilter('calendario')
                    setDataInicio('')
                    setDataFim('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Voltar ao Calendário
                </Button>
              </div>
            ) : (
              filteredAgendamentos.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-vinho">{item.titulo}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-dourado-dark">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        <span>Gravação: {formatDateTimeBR(item.data_gravacao)}</span>
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
                        onClick={() => handleDelete(item.id, item.titulo)}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-vinho/5">
                    <div>
                      <span className="text-[10px] text-vinho/60 block">Débito no Banco</span>
                      {item.horas_utilizadas ? (
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-flex items-center gap-1 text-[11px] mt-0.5">
                          <Clock className="w-3 h-3" />
                          {item.horas_utilizadas}h
                        </span>
                      ) : (
                        <span className="text-vinho/40 italic text-[11px]">0h (isento)</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-vinho/60 block">Convidado(a)</span>
                      <span className="font-medium text-vinho truncate block">
                        {item.tem_convidado ? item.nome_convidado || 'A definir' : 'Sem convidado'}
                      </span>
                    </div>
                  </div>

                  <RoteiroExpandivel roteiro={item.roteiro} variant="card" />

                  {item.patrocinado && (
                    <div className="pt-1">
                      <Badge className="bg-vinho text-dourado text-[10px] font-semibold">
                        Patrocínio: {item.patrocinadores || 'Confirmado'}
                      </Badge>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-vinho/60">Carregando agenda...</div>
            ) : agendamentos.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm text-vinho/70 font-medium">Nenhum agendamento marcado.</p>
                <Button onClick={handleOpenCreate} variant="outline" size="sm">
                  Agendar primeira gravação
                </Button>
              </div>
            ) : filteredAgendamentos.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm text-vinho/70 font-medium">
                  Nenhum episódio encontrado para este filtro.
                </p>
                <Button
                  onClick={() => {
                    setActiveFilter('calendario')
                    setDataInicio('')
                    setDataFim('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  Voltar ao Calendário
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-marfim">
                  <TableRow className="border-b border-vinho/10">
                    <TableHead className="font-bold text-vinho text-xs">Título / Roteiro</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Gravação</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Horas a Utilizar</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Postagem</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Convidado(a)</TableHead>
                    <TableHead className="font-bold text-vinho text-xs">Patrocínio</TableHead>
                    <TableHead className="w-24 text-right font-bold text-vinho text-xs">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-vinho/5">
                  {filteredAgendamentos.map((item) => (
                    <TableRow key={item.id} className="hover:bg-vinho/5">
                      <TableCell className="text-xs font-bold text-vinho max-w-xs align-top">
                        <div>{item.titulo}</div>
                        <RoteiroExpandivel roteiro={item.roteiro} variant="table" />
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-dourado-dark">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDateTimeBR(item.data_gravacao)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.horas_utilizadas ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.horas_utilizadas}h debitada(s)
                          </span>
                        ) : (
                          <span className="text-vinho/40 italic text-[11px]">0h (isento)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-vinho/75">
                        {formatDateBR(item.data_postagem)}
                      </TableCell>
                      <TableCell className="text-xs text-vinho">
                        {item.tem_convidado ? (
                          <div>
                            <span className="font-bold block">{item.nome_convidado}</span>
                            {item.empresa && (
                              <span className="text-[10px] text-vinho/60 block">
                                {item.empresa}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-vinho/40 italic">Sem convidado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.patrocinado ? (
                          <Badge className="bg-vinho text-dourado text-[10px] font-semibold">
                            {item.patrocinadores || 'Patrocinado'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-vinho/40">Não</span>
                        )}
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
                          onClick={() => handleDelete(item.id, item.titulo)}
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
        </div>
      )}

      {/* Modal de Agendamento Completo */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-2xl bg-marfim border-2 border-dourado/50 text-vinho max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Agendamento' : 'Novo Agendamento de Episódio'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ag-titulo" className="text-xs font-semibold text-vinho">
                Nome / Título Provisório do Episódio *
              </Label>
              <Input
                id="ag-titulo"
                required
                placeholder="Ex.: Episódio sobre Liderança Feminina e Resiliência"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ag-data-ag" className="text-xs font-semibold text-vinho">
                  Data Agendamento *
                </Label>
                <Input
                  id="ag-data-ag"
                  type="date"
                  required
                  value={dataAgendamento}
                  onChange={(e) => setDataAgendamento(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ag-data-grav" className="text-xs font-semibold text-vinho">
                  Data Gravação *
                </Label>
                <Input
                  id="ag-data-grav"
                  type="date"
                  required
                  value={dataGravacao}
                  onChange={(e) => setDataGravacao(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="ag-hora-grav"
                  className="text-xs font-semibold text-vinho flex items-center justify-between"
                >
                  <span>Hora da Gravação</span>
                  <span className="text-[10px] text-vinho/50 font-normal">Opcional</span>
                </Label>
                <div className="relative">
                  <Input
                    id="ag-hora-grav"
                    type="time"
                    value={horaGravacao}
                    onChange={(e) => setHoraGravacao(e.target.value)}
                    className="bg-white border-vinho/20 text-xs"
                    title="Defina o horário da gravação (ex.: 14:00). Deixe em branco se for gravação o dia todo."
                  />
                  {horaGravacao && (
                    <button
                      type="button"
                      onClick={() => setHoraGravacao('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-vinho/40 hover:text-vinho text-[10px] px-1"
                      title="Limpar hora (dia inteiro)"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="ag-horas"
                  className="text-xs font-semibold text-vinho flex items-center justify-between"
                >
                  <span>Horas a Utilizar *</span>
                </Label>
                <Input
                  id="ag-horas"
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="Ex.: 1"
                  value={horasUtilizadas}
                  onChange={(e) => setHorasUtilizadas(e.target.value)}
                  className="bg-white border-vinho/20 text-xs font-bold text-vinho"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ag-data-post" className="text-xs font-semibold text-vinho">
                  Prev. Postagem
                </Label>
                <Input
                  id="ag-data-post"
                  type="date"
                  value={dataPostagem}
                  onChange={(e) => setDataPostagem(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>
            </div>

            {/* Aviso de débito no Banco de Horas */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Ao salvar, <strong>{horasUtilizadas || 0} hora(s)</strong> serão debitadas no{' '}
                  <strong>Controle de Horas</strong> do estúdio.
                </span>
              </div>
              {saldoDisponivel !== null && (
                <span className="font-semibold text-amber-800 text-[11px] shrink-0">
                  Saldo Atual: {saldoDisponivel}h
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ag-roteiro" className="text-xs font-semibold text-vinho">
                Roteiro do Episódio (Campo livre de anotações)
              </Label>
              <Textarea
                id="ag-roteiro"
                rows={3}
                placeholder="Insira tópicos da pauta, blocos de conversa, perguntas principais..."
                value={roteiro}
                onChange={(e) => setRoteiro(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            {/* Seção do Convidado */}
            <div className="p-4 rounded-xl bg-white border border-vinho/15 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-vinho">Haverá Convidado(a)?</Label>
                  <p className="text-[10px] text-vinho/60">
                    Ative para cadastrar os dados do entrevistado(a) e da sua empresa.
                  </p>
                </div>
                <Switch checked={temConvidado} onCheckedChange={setTemConvidado} />
              </div>

              {temConvidado && (
                <div className="space-y-3 pt-2 border-t border-vinho/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-vinho">Nome do Convidado</Label>
                      <Input
                        placeholder="Ex.: Dra. Gabriela Fontes"
                        value={nomeConvidado}
                        onChange={(e) => setNomeConvidado(e.target.value)}
                        className="bg-marfim border-vinho/20 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-vinho">Nome da Empresa</Label>
                      <Input
                        placeholder="Ex.: Instituto Renascer"
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        className="bg-marfim border-vinho/20 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-vinho">Biografia do Convidado</Label>
                    <Textarea
                      rows={2}
                      placeholder="Resumo profissional e realizações..."
                      value={biografiaConvidado}
                      onChange={(e) => setBiografiaConvidado(e.target.value)}
                      className="bg-marfim border-vinho/20 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Seção de Patrocinador */}
            <div className="p-4 rounded-xl bg-white border border-vinho/15 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-vinho">Episódio Patrocinado?</Label>
                  <p className="text-[10px] text-vinho/60">
                    Indicação se o episódio conta com cotas de patrocínio comercial.
                  </p>
                </div>
                <Switch checked={patrocinado} onCheckedChange={setPatrocinado} />
              </div>

              {patrocinado && (
                <div className="pt-2 border-t border-vinho/10 space-y-1">
                  <Label className="text-xs font-medium text-vinho">Nome dos Patrocinadores</Label>
                  <Input
                    placeholder="Ex.: Cafés Mantiqueira & Flor de Lis Joias"
                    value={patrocinadores}
                    onChange={(e) => setPatrocinadores(e.target.value)}
                    className="bg-marfim border-vinho/20 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Imagens do Agendamento: galeria existente + upload */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-vinho/15">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-vinho flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-dourado-dark" />
                  <span>Imagens do Agendamento</span>
                </Label>
                <span className="text-[10px] text-vinho/60">
                  {existingImages.length} salva(s) / até 6 no total
                </span>
              </div>

              {/* Exibição das imagens já salvas no registro */}
              {editingItem && existingImages.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-vinho/60 block">
                    Fotos já anexadas ao agendamento:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {existingImages.map((fileName) => {
                      const imgUrl = getFileUrl(editingItem, fileName, '200x200')
                      const fullUrl = getFileUrl(editingItem, fileName)
                      return (
                        <div
                          key={fileName}
                          className="relative group rounded-lg overflow-hidden border border-vinho/15 bg-marfim aspect-video flex items-center justify-center"
                        >
                          <img
                            src={imgUrl}
                            alt="Anexo do agendamento"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-vinho/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-full bg-white/90 text-vinho hover:bg-white text-xs shadow-xs"
                              title="Abrir imagem original"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(fileName)}
                              className="p-1 rounded-full bg-red-600 text-white hover:bg-red-700 text-xs shadow-xs"
                              title="Remover imagem"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Upload de novas imagens */}
              <div className="space-y-1 pt-1">
                <Label htmlFor="ag-upload-imgs" className="text-[11px] font-medium text-vinho/80">
                  {existingImages.length > 0
                    ? 'Adicionar novas fotos (Fotos do convidado, logo da empresa, marcas):'
                    : 'Fotos do convidado, logo da empresa, marcas e materiais:'}
                </Label>
                <Input
                  id="ag-upload-imgs"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImageFiles(e.target.files)}
                  className="bg-marfim border-vinho/20 text-xs"
                />
                <p className="text-[10px] text-vinho/60">
                  Você pode anexar até 6 imagens por episódio (fotos de palco, patrocinadores, etc).
                </p>
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
                {saving ? 'Gravando...' : 'Salvar Agendamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
