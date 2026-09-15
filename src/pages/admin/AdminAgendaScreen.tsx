import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { formatDateBR } from '@/lib/formatters'
import type { AgendaRecord, HorasCompradasRecord } from '@/types/database'
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
  User,
  Building,
  Award,
  Upload,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function AdminAgendaScreen() {
  const [agendamentos, setAgendamentos] = useState<AgendaRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Saldo de horas disponíveis para feedback visual
  const [saldoDisponivel, setSaldoDisponivel] = useState<number | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AgendaRecord | null>(null)

  // Form states
  const [titulo, setTitulo] = useState('')
  const [roteiro, setRoteiro] = useState('')
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [dataGravacao, setDataGravacao] = useState('')
  const [dataPostagem, setDataPostagem] = useState('')
  const [temConvidado, setTemConvidado] = useState(false)
  const [nomeConvidado, setNomeConvidado] = useState('')
  const [biografiaConvidado, setBiografiaConvidado] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [patrocinado, setPatrocinado] = useState(false)
  const [patrocinadores, setPatrocinadores] = useState('')
  const [horasUtilizadas, setHorasUtilizadas] = useState('1')
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
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
    const today = new Date().toISOString().split('T')[0]
    setTitulo('')
    setRoteiro('')
    setDataAgendamento(today)
    setDataGravacao(today)
    setDataPostagem('')
    setTemConvidado(false)
    setNomeConvidado('')
    setBiografiaConvidado('')
    setEmpresa('')
    setPatrocinado(false)
    setPatrocinadores('')
    setHorasUtilizadas('1')
    setImageFiles(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: AgendaRecord) => {
    setEditingItem(item)
    setTitulo(item.titulo)
    setRoteiro(item.roteiro || '')
    setDataAgendamento(item.data_agendamento ? item.data_agendamento.split('T')[0] : '')
    setDataGravacao(item.data_gravacao ? item.data_gravacao.split('T')[0] : '')
    setDataPostagem(item.data_postagem ? item.data_postagem.split('T')[0] : '')
    setTemConvidado(Boolean(item.tem_convidado))
    setNomeConvidado(item.nome_convidado || '')
    setBiografiaConvidado(item.biografia_convidado || '')
    setEmpresa(item.empresa || '')
    setPatrocinado(Boolean(item.patrocinado))
    setPatrocinadores(item.patrocinadores || '')
    setHorasUtilizadas(
      item.horas_utilizadas !== undefined && item.horas_utilizadas !== null
        ? String(item.horas_utilizadas)
        : '1',
    )
    setImageFiles(null)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const parsedHoras = parseFloat(horasUtilizadas.replace(',', '.')) || 0

      const formData = new FormData()
      formData.append('titulo', titulo.trim())
      formData.append('roteiro', roteiro.trim())
      formData.append('data_agendamento', dataAgendamento)
      formData.append('data_gravacao', dataGravacao)
      if (dataPostagem) formData.append('data_postagem', dataPostagem)
      formData.append('tem_convidado', String(temConvidado))
      if (temConvidado) {
        formData.append('nome_convidado', nomeConvidado.trim())
        formData.append('biografia_convidado', biografiaConvidado.trim())
        formData.append('empresa', empresa.trim())
      }
      formData.append('patrocinado', String(patrocinado))
      if (patrocinado) {
        formData.append('patrocinadores', patrocinadores.trim())
      }
      formData.append('horas_utilizadas', String(parsedHoras))

      if (imageFiles) {
        // Enviar até 6 imagens conforme o briefing
        const count = Math.min(imageFiles.length, 6)
        for (let i = 0; i < count; i++) {
          formData.append('imagens', imageFiles[i])
        }
      }

      if (editingItem) {
        await pb.collection('agenda').update(editingItem.id, formData)
        toast.success('Agendamento atualizado com sucesso!')
      } else {
        await pb.collection('agenda').create(formData)
        toast.success('Novo episódio agendado com sucesso!')
      }

      setModalOpen(false)
      loadAgenda()
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
      await pb.collection('agenda').delete(id)
      toast.success('Agendamento removido e horas estornadas ao banco de horas!')
      loadAgenda()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir agendamento.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-vinho">Agenda & Planejamento</h2>
          <p className="text-xs text-vinho/70">
            Cronograma de gravações, roteiros, convidados, patrocinadores e sincronização com o
            banco de horas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {saldoDisponivel !== null && (
            <Link
              to="/admin/horas"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-vinho/15 hover:border-dourado text-vinho shadow-2xs transition-all"
              title="Ver detalhes no Controle de Horas"
            >
              <Clock className="w-3.5 h-3.5 text-dourado-dark" />
              <span>
                Banco de Horas: <strong className="text-dourado-dark">{saldoDisponivel}h</strong>{' '}
                disponíveis
              </span>
            </Link>
          )}

          <Button
            onClick={handleOpenCreate}
            className="bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-5 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-dourado" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando agenda...</div>
        ) : agendamentos.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-vinho/70 font-medium">Nenhum agendamento marcado.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm">
              Agendar primeira gravação
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
              {agendamentos.map((item) => (
                <TableRow key={item.id} className="hover:bg-vinho/5">
                  <TableCell className="text-xs font-bold text-vinho max-w-xs">
                    {item.titulo}
                    {item.roteiro && (
                      <span className="block text-[11px] font-normal text-vinho/65 line-clamp-1 mt-0.5">
                        Roteiro: {item.roteiro}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-dourado-dark">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDateBR(item.data_gravacao)}
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
                          <span className="text-[10px] text-vinho/60 block">{item.empresa}</span>
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

      {/* Modal de Agendamento Completo */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-marfim border-2 border-dourado/50 text-vinho max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

            {/* Upload de até 6 imagens */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">
                Imagens do Agendamento (Fotos do convidado, logo da empresa, marcas)
              </Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImageFiles(e.target.files)}
                className="bg-white border-vinho/20 text-xs"
              />
              <p className="text-[10px] text-vinho/60">
                Você pode anexar até 6 imagens ao mesmo agendamento.
              </p>
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
                {saving ? 'Gravando...' : 'Salvar Agendamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
