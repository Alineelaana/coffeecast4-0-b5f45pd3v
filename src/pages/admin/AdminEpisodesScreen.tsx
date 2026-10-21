import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import type { EpisodioRecord } from '@/types/database'
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
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Play,
  CalendarClock,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { extractYouTubeId } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { AuditoriaService } from '@/services/auditoria'

export default function AdminEpisodesScreen() {
  const { isMaster } = useAuth()
  const [episodios, setEpisodios] = useState<EpisodioRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Modal para criação normal ou edição
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEp, setEditingEp] = useState<EpisodioRecord | null>(null)

  // Modal para "Programar Episódio"
  const [modalProgramarOpen, setModalProgramarOpen] = useState(false)

  // Estados dos formulários
  const [numero, setNumero] = useState<string>('')
  const [titulo, setTitulo] = useState<string>('')
  const [youtubeUrl, setYoutubeUrl] = useState<string>('')
  const [dataProgramada, setDataProgramada] = useState<string>('')
  const [horaProgramada, setHoraProgramada] = useState<string>('10:00')
  const [saving, setSaving] = useState(false)
  const [syncingNow, setSyncingNow] = useState(false)

  const loadEpisodes = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('episodios').getFullList<EpisodioRecord>({
        sort: 'numero',
      })
      setEpisodios(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar episódios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEpisodes()
  }, [])

  // Utilitário para verificar se episódio está programado no futuro
  const isProgramadoFuturo = (ep: EpisodioRecord) => {
    if (ep.status === 'programado' && ep.data_publicacao_programada) {
      const progDate = new Date(ep.data_publicacao_programada)
      const agora = new Date()
      return progDate > agora
    }
    return false
  }

  const formatarDataHoraBR = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const dataFormatada = d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const horaFormatada = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `${dataFormatada} às ${horaFormatada}`
    } catch {
      return dateStr
    }
  }

  // Abertura do modal de Criação Imediata
  const handleOpenCreate = () => {
    setEditingEp(null)
    const nextNum = episodios.length > 0 ? Math.max(...episodios.map((e) => e.numero)) + 1 : 1
    setNumero(String(nextNum))
    setTitulo('')
    setYoutubeUrl('')
    setDataProgramada('')
    setModalOpen(true)
  }

  // Abertura do modal de Programação
  const handleOpenProgramar = () => {
    setEditingEp(null)
    const nextNum = episodios.length > 0 ? Math.max(...episodios.map((e) => e.numero)) + 1 : 1
    setNumero(String(nextNum))
    setTitulo('')
    setYoutubeUrl('')
    // Sugere a data de amanhã às 10:00 (horário padrão dos episódios aos sábados)
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const yyyy = amanha.getFullYear()
    const mm = String(amanha.getMonth() + 1).padStart(2, '0')
    const dd = String(amanha.getDate()).padStart(2, '0')
    setDataProgramada(`${yyyy}-${mm}-${dd}`)
    setHoraProgramada('10:00')
    setModalProgramarOpen(true)
  }

  // Abertura do modal para Edição
  const handleOpenEdit = (ep: EpisodioRecord) => {
    setEditingEp(ep)
    setNumero(ep.numero !== undefined && ep.numero !== null ? String(ep.numero) : '1')
    setTitulo(ep.titulo || '')
    setYoutubeUrl(ep.youtube_url || '')
    if (ep.data_publicacao_programada) {
      try {
        const d = new Date(ep.data_publicacao_programada)
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          const hh = String(d.getHours()).padStart(2, '0')
          const min = String(d.getMinutes()).padStart(2, '0')
          setDataProgramada(`${yyyy}-${mm}-${dd}`)
          setHoraProgramada(`${hh}:${min}`)
        } else {
          setDataProgramada(ep.data_publicacao_programada.split('T')[0].split(' ')[0])
          setHoraProgramada('10:00')
        }
      } catch {
        setDataProgramada(ep.data_publicacao_programada.split('T')[0].split(' ')[0])
        setHoraProgramada('10:00')
      }
    } else {
      setDataProgramada('')
      setHoraProgramada('10:00')
    }

    if (ep.status === 'programado') {
      setModalProgramarOpen(true)
    } else {
      setModalOpen(true)
    }
  }

  // Validação simples da URL do YouTube
  const isValidYouTubeUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return false
    return (
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be') ||
      Boolean(extractYouTubeId(trimmed))
    )
  }

  // Salvar Episódio Normal (Publicação Imediata / Edição)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const numInt = parseInt(numero, 10)
      if (isNaN(numInt) || numInt <= 0) {
        toast.error('Informe um número válido para o episódio.')
        setSaving(false)
        return
      }

      if (!titulo.trim()) {
        toast.error('O título do episódio é obrigatório.')
        setSaving(false)
        return
      }

      if (!isValidYouTubeUrl(youtubeUrl)) {
        toast.error('Informe um link válido do YouTube (watch, share ou shorts).')
        setSaving(false)
        return
      }

      const payload = {
        numero: numInt,
        titulo: titulo.trim(),
        youtube_url: youtubeUrl.trim(),
        status: 'publicado' as const,
        data_publicacao_programada: '',
      }

      if (editingEp) {
        const antigo = { ...editingEp }
        const updated = await pb.collection('episodios').update(editingEp.id, payload)

        // Registrar na auditoria
        AuditoriaService.registrarEvento({
          tipo_acao: 'edicao',
          area_sistema: 'Episódios',
          descricao: `Episódio #${numInt} "${payload.titulo}" editado com sucesso`,
          registro_afetado: editingEp.id,
          tabela_afetada: 'episodios',
          diff_antes: antigo,
          diff_depois: updated,
        })

        toast.success('Episódio atualizado com sucesso!')
      } else {
        const created = await pb.collection('episodios').create(payload)

        // Registrar na auditoria
        AuditoriaService.registrarEvento({
          tipo_acao: 'criacao',
          area_sistema: 'Episódios',
          descricao: `Novo episódio criado: #${numInt} "${payload.titulo}"`,
          registro_afetado: created.id,
          tabela_afetada: 'episodios',
          diff_depois: created,
        })

        toast.success('Episódio criado com sucesso!')
      }

      setModalOpen(false)
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar episódio. Verifique se o número já existe.')
    } finally {
      setSaving(false)
    }
  }

  // Salvar Episódio Programado
  const handleSaveProgramado = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const numInt = parseInt(numero, 10)
      if (isNaN(numInt) || numInt <= 0) {
        toast.error('Informe um número válido para o episódio.')
        setSaving(false)
        return
      }

      if (!titulo.trim()) {
        toast.error('O título do episódio é obrigatório.')
        setSaving(false)
        return
      }

      if (!isValidYouTubeUrl(youtubeUrl)) {
        toast.error('Informe um link válido do YouTube (watch, share ou shorts).')
        setSaving(false)
        return
      }

      if (!dataProgramada) {
        toast.error('Selecione a data para programar a publicação do episódio.')
        setSaving(false)
        return
      }

      const dateParts = dataProgramada.split('-')
      if (dateParts.length !== 3) {
        toast.error('Data inválida.')
        setSaving(false)
        return
      }

      const horaParts = (horaProgramada || '10:00').split(':')
      const horasNum = parseInt(horaParts[0] || '10', 10)
      const minutosNum = parseInt(horaParts[1] || '0', 10)

      const scheduledDateObj = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        isNaN(horasNum) ? 10 : horasNum,
        isNaN(minutosNum) ? 0 : minutosNum,
        0,
      )
      const dataIsoString = scheduledDateObj.toISOString()

      const payload = {
        numero: numInt,
        titulo: titulo.trim(),
        youtube_url: youtubeUrl.trim(),
        status: 'programado' as const,
        data_publicacao_programada: dataIsoString,
      }

      if (editingEp) {
        const antigo = { ...editingEp }
        const updated = await pb.collection('episodios').update(editingEp.id, payload)

        AuditoriaService.registrarEvento({
          tipo_acao: 'edicao',
          area_sistema: 'Episódios',
          descricao: `Episódio programado #${numInt} "${payload.titulo}" atualizado para ${formatarDataHoraBR(dataIsoString)}`,
          registro_afetado: editingEp.id,
          tabela_afetada: 'episodios',
          diff_antes: antigo,
          diff_depois: updated,
        })

        toast.success(
          `Episódio #${numInt} programado com sucesso para ${formatarDataHoraBR(dataIsoString)}!`,
        )
      } else {
        const created = await pb.collection('episodios').create(payload)

        AuditoriaService.registrarEvento({
          tipo_acao: 'criacao',
          area_sistema: 'Episódios',
          descricao: `Episódio #${numInt} "${payload.titulo}" programado para publicação em ${formatarDataHoraBR(dataIsoString)}`,
          registro_afetado: created.id,
          tabela_afetada: 'episodios',
          diff_depois: created,
        })

        toast.success(
          `Episódio #${numInt} programado com sucesso para ${formatarDataHoraBR(dataIsoString)}!`,
        )
      }

      setModalProgramarOpen(false)
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao programar episódio. Verifique se o número já existe.')
    } finally {
      setSaving(false)
    }
  }

  // Cancelar agendamento (transformar em publicado imediatamente ou voltar ao normal)
  const handlePublicarImediatamente = async (ep: EpisodioRecord) => {
    if (!window.confirm(`Deseja publicar o episódio #${ep.numero} "${ep.titulo}" agora no site?`))
      return
    try {
      const antigo = { ...ep }
      const payload = {
        status: 'publicado' as const,
        data_publicacao_programada: '',
      }
      const updated = await pb.collection('episodios').update(ep.id, payload)

      AuditoriaService.registrarEvento({
        tipo_acao: 'edicao',
        area_sistema: 'Episódios',
        descricao: `Programação cancelada e episódio #${ep.numero} publicado imediatamente no site`,
        registro_afetado: ep.id,
        tabela_afetada: 'episodios',
        diff_antes: antigo,
        diff_depois: updated,
      })

      toast.success(`Episódio #${ep.numero} publicado no site com sucesso!`)
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao publicar episódio imediatamente.')
    }
  }

  // Cancelar a programação (desmarcar agendamento mantendo como publicado)
  const handleCancelarProgramacao = async (ep: EpisodioRecord) => {
    if (
      !window.confirm(
        `Tem certeza que deseja cancelar a programação do episódio #${ep.numero}? Ele será publicado no site agora.`,
      )
    )
      return
    try {
      const antigo = { ...ep }
      const payload = {
        status: 'publicado' as const,
        data_publicacao_programada: '',
      }
      const updated = await pb.collection('episodios').update(ep.id, payload)

      AuditoriaService.registrarEvento({
        tipo_acao: 'edicao',
        area_sistema: 'Episódios',
        descricao: `Programação do episódio #${ep.numero} cancelada (convertido em publicado)`,
        registro_afetado: ep.id,
        tabela_afetada: 'episodios',
        diff_antes: antigo,
        diff_depois: updated,
      })

      toast.success(`Programação cancelada. Episódio #${ep.numero} está publicado no site.`)
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cancelar programação do episódio.')
    }
  }

  // Forçar checagem imediata de episódios agendados via endpoint backend
  const handleProcessarAgendadosAgora = async () => {
    try {
      setSyncingNow(true)
      const res = await pb.send('/backend/v1/admin/episodios/processar-agendados', {
        method: 'POST',
      })
      if (res && res.processados > 0) {
        toast.success(`${res.processados} episódio(s) programado(s) publicado(s) automaticamente!`)
      } else {
        toast.info('Verificação concluída. Nenhum episódio pendente com data/hora atingida.')
      }
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao verificar episódios agendados.')
    } finally {
      setSyncingNow(false)
    }
  }

  const handleDelete = async (id: string, tit: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o episódio "${tit}"?`)) return

    try {
      await pb.collection('episodios').delete(id)
      toast.success('Episódio excluído com sucesso!')
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir episódio.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Gestão de Episódios
          </h2>
          <p className="text-xs text-vinho/70">
            Cadastre os links do YouTube, numeração e títulos exibidos na página principal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
          {/* Botão Verificar Agendados (acelerador sob demanda) */}
          <Button
            variant="ghost"
            onClick={handleProcessarAgendadosAgora}
            disabled={syncingNow}
            className="w-full sm:w-auto text-vinho/70 hover:text-vinho hover:bg-vinho/10 font-medium text-xs rounded-xl sm:rounded-full px-3 py-2 min-h-[40px] sm:min-h-0 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Verificar agora se algum episódio atingiu a data/hora programada (o agendador roda automaticamente a cada 5 min)"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-dourado ${syncingNow ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Checar Agendados</span>
          </Button>

          {/* Botão Programar Episódio exatamente ao lado de Novo Episódio */}
          <Button
            onClick={handleOpenProgramar}
            className="w-full sm:w-auto bg-marfim hover:bg-dourado/20 text-vinho border-2 border-dourado hover:border-dourado-dark font-bold text-xs rounded-xl sm:rounded-full px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            title="Programar episódio com data e hora para ir ao site automaticamente"
          >
            <CalendarClock className="w-4 h-4 text-dourado shrink-0" />
            <span>Programar Episódio</span>
          </Button>

          {/* Botão Novo Episódio existente */}
          <Button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-dourado shrink-0" />
            <span>Novo Episódio</span>
          </Button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Carregando episódios...
          </div>
        ) : episodios.length === 0 ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-3">
            <p className="text-sm text-vinho/70 font-medium">Nenhum episódio cadastrado.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="min-h-[44px]">
              Criar primeiro episódio
            </Button>
          </div>
        ) : (
          episodios.map((ep) => (
            <div
              key={ep.id}
              className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-vinho/10 text-vinho font-bold text-xs inline-flex items-center justify-center shrink-0 mt-0.5">
                    #{ep.numero}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs font-bold text-vinho leading-tight break-words">
                      {ep.titulo}
                    </h3>
                    <div>
                      {isProgramadoFuturo(ep) ? (
                        <div className="space-y-1">
                          <Badge className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>
                              Programado para {formatarDataHoraBR(ep.data_publicacao_programada)}
                            </span>
                          </Badge>
                          <span className="text-[10px] text-amber-700 block italic">
                            Oculto no site até o horário programado
                          </span>
                        </div>
                      ) : ep.status === 'programado' ? (
                        <Badge className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Publicado (data/hora atingida)</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-vinho/10 border border-vinho/20 text-vinho text-[10px] font-medium w-fit">
                          Publicado no site
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>{' '}
                <div className="flex items-center gap-1 shrink-0">
                  {isProgramadoFuturo(ep) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelarProgramacao(ep)}
                      className="h-9 px-2 text-amber-800 hover:text-amber-950 hover:bg-amber-100 min-h-[36px] text-[11px] font-semibold flex items-center gap-1"
                      title="Publicar agora e cancelar programação"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Publicar</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(ep)}
                    className="h-9 w-9 p-0 text-vinho/70 hover:text-vinho min-h-[36px]"
                    title={
                      ep.status === 'programado'
                        ? 'Editar programação do episódio'
                        : 'Editar episódio'
                    }
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ep.id, ep.titulo)}
                    className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                    title="Excluir episódio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {ep.youtube_url && (
                <div className="pt-2 border-t border-vinho/5">
                  <a
                    href={ep.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-dourado-dark hover:underline truncate max-w-full font-medium"
                  >
                    <Play className="w-3.5 h-3.5 fill-dourado text-dourado shrink-0" />
                    <span className="truncate">{ep.youtube_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando episódios...</div>
        ) : episodios.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-vinho/70 font-medium">Nenhum episódio cadastrado.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm">
              Criar primeiro episódio
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-marfim">
              <TableRow className="border-b border-vinho/10">
                <TableHead className="w-16 font-bold text-vinho text-xs">Nº</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Título do Episódio</TableHead>
                <TableHead className="w-48 font-bold text-vinho text-xs">
                  Status / Publicação
                </TableHead>
                <TableHead className="font-bold text-vinho text-xs">Link YouTube</TableHead>
                <TableHead className="w-28 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {episodios.map((ep) => {
                return (
                  <TableRow key={ep.id} className="hover:bg-vinho/5">
                    <TableCell className="font-bold text-vinho text-xs">
                      <span className="w-7 h-7 rounded-full bg-vinho/10 text-vinho inline-flex items-center justify-center">
                        #{ep.numero}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-vinho max-w-md">
                      {ep.titulo}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isProgramadoFuturo(ep) ? (
                        <div className="space-y-1">
                          <Badge className="bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5 py-1 px-2.5 w-fit">
                            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>
                              Programado para {formatarDataHoraBR(ep.data_publicacao_programada)}
                            </span>
                          </Badge>
                          <span className="text-[10px] text-amber-700 block italic">
                            Oculto no site até o horário programado
                          </span>
                        </div>
                      ) : ep.status === 'programado' ? (
                        <Badge className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-semibold flex items-center gap-1.5 py-1 px-2.5 w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Publicado (data/hora atingida)</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-vinho/10 border border-vinho/20 text-vinho text-[11px] font-medium py-0.5 px-2 w-fit">
                          Publicado no site
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-vinho/70">
                      {ep.youtube_url ? (
                        <a
                          href={ep.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-dourado-dark hover:underline truncate max-w-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-dourado text-dourado" />
                          <span className="truncate">{ep.youtube_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-vinho/40 italic">Sem link cadastrado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      {isProgramadoFuturo(ep) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelarProgramacao(ep)}
                          className="h-8 px-2 text-amber-800 hover:text-amber-950 hover:bg-amber-100 text-[11px] font-medium"
                          title="Publicar agora no site e cancelar programação futura"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-amber-700" />
                          <span>Publicar agora</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(ep)}
                        className="h-8 w-8 p-0 text-vinho/70 hover:text-vinho hover:bg-vinho/10"
                        title={
                          ep.status === 'programado' ? 'Editar agendamento' : 'Editar episódio'
                        }
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ep.id, ep.titulo)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir episódio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingEp ? 'Editar Episódio' : 'Novo Episódio'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ep-num" className="text-xs font-semibold text-vinho">
                Número do Episódio *
              </Label>
              <Input
                id="ep-num"
                type="number"
                min="1"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-title" className="text-xs font-semibold text-vinho">
                Título do Episódio *
              </Label>
              <Input
                id="ep-title"
                required
                placeholder="Ex.: Recomeços: histórias de quem escolheu começar de novo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-yt" className="text-xs font-semibold text-vinho">
                Link do YouTube (Watch URL ou Shorts) *
              </Label>
              <Input
                id="ep-yt"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
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
                {saving ? 'Salvando...' : 'Salvar Episódio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Programar Episódio (Agendamento de Publicação) */}
      <Dialog open={modalProgramarOpen} onOpenChange={setModalProgramarOpen}>
        <DialogContent className="w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado text-vinho p-4 sm:p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-dourado/20 border border-dourado/40 flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5 text-vinho" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-bold text-vinho">
                  {editingEp ? 'Editar Agendamento do Episódio' : 'Programar Episódio'}
                </DialogTitle>
                <p className="text-xs text-vinho/70">
                  Defina a data futura em que o episódio ficará visível publicamente no site.
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveProgramado} className="space-y-4 pt-3">
            {/* 1. Número do episódio */}
            <div className="space-y-1.5">
              <Label htmlFor="prog-ep-num" className="text-xs font-semibold text-vinho">
                1. Número do episódio *
              </Label>
              <Input
                id="prog-ep-num"
                type="number"
                min="1"
                required
                placeholder="Ex.: 40"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
              />
              <p className="text-[11px] text-vinho/60">Numeração sequencial oficial da gravação.</p>
            </div>

            {/* 2. Título do episódio */}
            <div className="space-y-1.5">
              <Label htmlFor="prog-ep-title" className="text-xs font-semibold text-vinho">
                2. Título do episódio *
              </Label>
              <Input
                id="prog-ep-title"
                required
                placeholder="Ex.: Histórias de Superação & Empreendedorismo Feminino"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
              />
            </div>

            {/* 3. Link do YouTube */}
            <div className="space-y-1.5">
              <Label htmlFor="prog-ep-yt" className="text-xs font-semibold text-vinho">
                3. Link do YouTube *
              </Label>
              <Input
                id="prog-ep-yt"
                required
                placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
              />
              <p className="text-[11px] text-vinho/60">
                Aceita URLs completas do YouTube, formatos curtos (youtu.be) ou YouTube Shorts.
              </p>
            </div>

            {/* 4. Espaço para Data E Hora para programar quando vai para o site */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-vinho flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-dourado-dark" />
                <span>4. Data e hora para programar quando o episódio vai para o site *</span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-vinho/70">Data de publicação:</span>
                  <Input
                    id="prog-ep-date"
                    type="date"
                    required
                    value={dataProgramada}
                    onChange={(e) => setDataProgramada(e.target.value)}
                    className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-vinho/70">
                    Hora de publicação (HH:mm):
                  </span>
                  <Input
                    id="prog-ep-time"
                    type="time"
                    required
                    value={horaProgramada}
                    onChange={(e) => setHoraProgramada(e.target.value)}
                    className="bg-white border-vinho/20 text-sm focus-visible:ring-dourado"
                  />
                </div>
              </div>

              <div className="bg-dourado/10 border border-dourado/30 rounded-xl p-3 text-[11px] text-vinho/80 space-y-1.5">
                <p className="font-semibold text-vinho flex items-center gap-1">
                  <span>⚡ Publicação 100% Automática pelo Backend:</span>
                </p>
                <p>
                  • O episódio fica com status <strong>programado</strong> e permanece oculto no
                  site público.
                </p>
                <p>
                  • Um agendador contínuo no backend (executado a cada 5 minutos) monitora a data e
                  hora configuradas. Assim que o horário chegar, ele{' '}
                  <strong>publica o episódio automaticamente no site</strong>, sem necessidade de
                  intervenção humana.
                </p>
                <p>
                  • Você pode editar ou cancelar a programação a qualquer momento na lista acima.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-vinho/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalProgramarOpen(false)}
                className="w-full sm:w-auto min-h-[44px] text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-6 shadow-sm flex items-center justify-center gap-2"
              >
                <CalendarClock className="w-4 h-4 text-dourado" />
                {saving
                  ? 'Programando...'
                  : editingEp
                    ? 'Salvar Agendamento'
                    : 'Programar Episódio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
