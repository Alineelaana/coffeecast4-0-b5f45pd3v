import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import pb from '@/lib/pocketbase/client'
import { formatDateBR, getFileUrl } from '@/lib/formatters'
import type { ConviteRecord } from '@/types/database'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Printer,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Edit,
  Download,
  Image as ImageIcon,
  Loader2,
  Eye,
  Check,
} from 'lucide-react'
import { CoffeeCastLogo } from '@/components/CoffeeCastLogo'
import { renderInviteToCanvas, downloadCanvasAsJpeg } from '@/lib/inviteExporter'
import { toast } from 'sonner'

export default function AdminConvitesScreen() {
  const [convites, setConvites] = useState<ConviteRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Controle de modal de formulário (criação e edição)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConvite, setEditingConvite] = useState<ConviteRecord | null>(null)

  // Controle de modal de preview
  const [previewConvite, setPreviewConvite] = useState<ConviteRecord | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Estados dos campos do formulário
  const [nome, setNome] = useState('')
  const [tipoConvidado, setTipoConvidado] = useState<'convidado' | 'convidada'>('convidada')
  const [dataGravacao, setDataGravacao] = useState('')
  const [horario, setHorario] = useState('14:00')
  const [apresentacao, setApresentacao] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Previews locais das imagens selecionadas ou já salvas
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string>('')
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('')

  const [saving, setSaving] = useState(false)
  const [exportingJpegId, setExportingJpegId] = useState<string | null>(null)

  const invitePrintRef = useRef<HTMLDivElement>(null)

  const loadConvites = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('convites').getFullList<ConviteRecord>({
        sort: '-created',
      })
      setConvites(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar convites.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConvites()
  }, [])

  // Limpa URLs de objeto para evitar memory leaks
  useEffect(() => {
    return () => {
      if (fotoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(fotoPreviewUrl)
      if (logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [fotoPreviewUrl, logoPreviewUrl])

  const handleOpenCreate = () => {
    setEditingConvite(null)
    setNome('')
    setTipoConvidado('convidada')
    setDataGravacao(new Date().toISOString().split('T')[0])
    setHorario('14:00')
    setApresentacao(
      'É com grande alegria e honra que convidamos você para compartilhar sua trajetória inspiradora no CoffeeCast 4.0. Preparamos uma mesa com afeto, respeito e cafés especiais para dar voz à sua história que transforma.',
    )
    setFotoFile(null)
    setLogoFile(null)
    setFotoPreviewUrl('')
    setLogoPreviewUrl('')
    setModalOpen(true)
  }

  const handleOpenEdit = (convite: ConviteRecord) => {
    setEditingConvite(convite)
    setNome(convite.nome || '')
    setTipoConvidado(convite.tipo_convidado === 'convidado' ? 'convidado' : 'convidada')
    // data_gravacao pode vir no formato "2026-09-15 00:00:00.000Z" ou "2026-09-15"
    const rawDate = convite.data_gravacao ? convite.data_gravacao.split('T')[0].split(' ')[0] : ''
    setDataGravacao(rawDate || new Date().toISOString().split('T')[0])
    setHorario(convite.horario || '14:00')
    setApresentacao(convite.apresentacao || '')
    setFotoFile(null)
    setLogoFile(null)

    if (convite.foto_convidado) {
      setFotoPreviewUrl(getFileUrl(convite, convite.foto_convidado))
    } else {
      setFotoPreviewUrl('')
    }

    if (convite.logomarca_empresa) {
      setLogoPreviewUrl(getFileUrl(convite, convite.logomarca_empresa))
    } else {
      setLogoPreviewUrl('')
    }

    setModalOpen(true)
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFotoFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setFotoPreviewUrl(url)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setLogoFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreviewUrl(url)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('tipo_convidado', tipoConvidado)
      formData.append('data_gravacao', dataGravacao)
      formData.append('horario', horario.trim())
      formData.append('apresentacao', apresentacao.trim())

      if (fotoFile) {
        formData.append('foto_convidado', fotoFile)
      }
      if (logoFile) {
        formData.append('logomarca_empresa', logoFile)
      }

      let updatedRecord: ConviteRecord

      if (editingConvite) {
        // Atualiza convite existente
        updatedRecord = await pb
          .collection('convites')
          .update<ConviteRecord>(editingConvite.id, formData)
        toast.success('Convite atualizado com sucesso!')

        // Se o convite editado estava em preview, atualiza o preview com os novos dados
        if (previewConvite && previewConvite.id === editingConvite.id) {
          setPreviewConvite(updatedRecord)
        }
      } else {
        // Criação de novo convite
        updatedRecord = await pb.collection('convites').create<ConviteRecord>(formData)
        toast.success('Convite gerado com sucesso!')
      }

      setModalOpen(false)
      loadConvites()
    } catch (err) {
      console.error(err)
      toast.error(
        editingConvite ? 'Erro ao salvar alterações no convite.' : 'Erro ao cadastrar convite.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Deseja remover o convite para "${name}"?`)) return

    try {
      await pb.collection('convites').delete(id)
      toast.success('Convite removido!')
      if (previewConvite && previewConvite.id === id) {
        setPreviewOpen(false)
        setPreviewConvite(null)
      }
      loadConvites()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir convite.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  /**
   * Baixar como JPEG em alta resolução
   */
  const handleDownloadJpeg = async (convite: ConviteRecord) => {
    try {
      setExportingJpegId(convite.id)
      toast.loading('Gerando imagem JPEG em alta resolução...', { id: 'jpeg-toast' })

      const guestPhotoUrl = convite.foto_convidado
        ? getFileUrl(convite, convite.foto_convidado)
        : 'https://img.usecurling.com/ppl/256?gender=female'
      const companyLogoUrl = convite.logomarca_empresa
        ? getFileUrl(convite, convite.logomarca_empresa)
        : undefined

      const canvas = await renderInviteToCanvas({
        nome: convite.nome,
        tipoConvidado: convite.tipo_convidado,
        dataGravacao: formatDateBR(convite.data_gravacao),
        horario: convite.horario,
        apresentacao: convite.apresentacao,
        guestPhotoUrl,
        companyLogoUrl,
      })

      const safeName = convite.nome
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
      const fileName = `convite_coffeecast_${safeName}.jpg`

      downloadCanvasAsJpeg(canvas, fileName)
      toast.success('Convite baixado como imagem JPEG com sucesso!', { id: 'jpeg-toast' })
    } catch (err) {
      console.error('Erro ao exportar convite em JPEG:', err)
      toast.error('Falha ao gerar JPEG do convite. Tente novamente.', { id: 'jpeg-toast' })
    } finally {
      setExportingJpegId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Título e Ações Principais */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-vinho">Gerador de Convites Premium</h2>
          <p className="text-xs text-vinho/70">
            Crie, edite e baixe convites sofisticados em PDF ou imagem JPEG na identidade oficial do
            CoffeeCast 4.0.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-5 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4 text-dourado" />
          Gerar Novo Convite
        </Button>
      </div>

      {/* Grid de Convites */}
      {loading ? (
        <div className="py-16 text-center text-xs text-vinho/60 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-dourado" />
          <span>Carregando convites...</span>
        </div>
      ) : convites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-vinho/10 p-12 text-center space-y-3">
          <Sparkles className="w-12 h-12 text-dourado mx-auto" />
          <h3 className="font-serif text-lg font-bold text-vinho">Nenhum convite emitido</h3>
          <p className="text-xs text-vinho/60 max-w-sm mx-auto">
            Gere convites oficiais personalizados para seus convidados com foto, marca e texto de
            boas-vindas.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="bg-vinho text-white text-xs">
            Gerar primeiro convite
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {convites.map((item) => {
            const guestPhoto = item.foto_convidado
              ? getFileUrl(item, item.foto_convidado, '200x200')
              : 'https://img.usecurling.com/ppl/256?gender=female'
            const companyLogo = item.logomarca_empresa
              ? getFileUrl(item, item.logomarca_empresa, '200x200')
              : ''
            const isDownloadingThis = exportingJpegId === item.id

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-vinho/10 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-dourado transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={guestPhoto}
                        alt={item.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-dourado"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-base text-vinho">{item.nome}</h4>
                        <span className="text-[11px] font-medium text-vinho/70">
                          {item.tipo_convidado === 'convidado'
                            ? 'Convidado de Honra'
                            : 'Convidada de Honra'}
                        </span>
                      </div>
                    </div>

                    {companyLogo && (
                      <img
                        src={companyLogo}
                        alt="Empresa"
                        className="w-10 h-10 object-contain rounded-md border border-vinho/10 p-1 bg-white"
                      />
                    )}
                  </div>

                  <div className="bg-marfim p-3 rounded-xl border border-vinho/5 space-y-1 text-xs text-vinho">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-dourado-dark" />
                      <span>Data: {formatDateBR(item.data_gravacao)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-dourado-dark" />
                      <span>Horário: {item.horario}</span>
                    </div>
                  </div>

                  <p className="text-xs text-vinho/75 italic line-clamp-3">"{item.apresentacao}"</p>
                </div>

                {/* Ações do Card */}
                <div className="pt-3 border-t border-vinho/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setPreviewConvite(item)
                        setPreviewOpen(true)
                      }}
                      className="flex-1 bg-vinho hover:bg-vinho-light text-white text-xs rounded-full px-3 py-1.5 flex items-center justify-center gap-1.5 shadow-xs"
                      title="Abrir pré-visualização e imprimir em PDF"
                    >
                      <Eye className="w-3.5 h-3.5 text-dourado" />
                      <span>Ver & PDF</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isDownloadingThis}
                      onClick={() => handleDownloadJpeg(item)}
                      className="border-dourado/60 text-vinho hover:bg-dourado/10 text-xs rounded-full px-3 py-1.5 flex items-center justify-center gap-1.5 font-medium"
                      title="Baixar imagem JPEG em alta qualidade"
                    >
                      {isDownloadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-dourado" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-dourado" />
                      )}
                      <span>JPEG</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(item)}
                      className="text-xs text-vinho/80 hover:text-vinho hover:bg-vinho/5 flex items-center gap-1.5 h-8 px-2 rounded-lg font-medium"
                    >
                      <Edit className="w-3.5 h-3.5 text-dourado-dark" />
                      Editar Convite
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.nome)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      title="Excluir convite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Convite */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-marfim border-2 border-dourado/50 text-vinho max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-dourado" />
              {editingConvite ? 'Editar Convite Oficial' : 'Gerar Novo Convite Oficial'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="conv-nome" className="text-xs font-semibold text-vinho">
                Nome da Pessoa Convidada *
              </Label>
              <Input
                id="conv-nome"
                required
                placeholder="Ex.: Dra. Gabriela Fontes"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            {/* Opção de gênero: Convidado ou Convidada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">
                Tratamento no Convite Oficial *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoConvidado('convidada')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    tipoConvidado === 'convidada'
                      ? 'bg-vinho text-white border-vinho shadow-xs'
                      : 'bg-white text-vinho/80 border-vinho/20 hover:border-dourado'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tipoConvidado === 'convidada' ? 'bg-dourado' : 'border border-vinho/40'
                    }`}
                  />
                  <span>Convidada (de Honra)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoConvidado('convidado')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    tipoConvidado === 'convidado'
                      ? 'bg-vinho text-white border-vinho shadow-xs'
                      : 'bg-white text-vinho/80 border-vinho/20 hover:border-dourado'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tipoConvidado === 'convidado' ? 'bg-dourado' : 'border border-vinho/40'
                    }`}
                  />
                  <span>Convidado (de Honra)</span>
                </button>
              </div>
              <p className="text-[10px] text-vinho/60">
                Define se o convite exibirá "Convidada de Honra" ou "Convidado de Honra" no PDF,
                JPEG e tela.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="conv-data" className="text-xs font-semibold text-vinho">
                  Data da Gravação *
                </Label>
                <Input
                  id="conv-data"
                  type="date"
                  required
                  value={dataGravacao}
                  onChange={(e) => setDataGravacao(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-hora" className="text-xs font-semibold text-vinho">
                  Horário da Gravação *
                </Label>
                <Input
                  id="conv-hora"
                  required
                  placeholder="Ex.: 14:00"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conv-apres" className="text-xs font-semibold text-vinho">
                Texto de Apresentação / Mensagem de Boas-Vindas *
              </Label>
              <Textarea
                id="conv-apres"
                required
                rows={3}
                value={apresentacao}
                onChange={(e) => setApresentacao(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
            </div>

            {/* Foto do Convidado */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-vinho">Foto do Convidado(a)</Label>
                {fotoPreviewUrl && (
                  <span className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Foto anexada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {fotoPreviewUrl ? (
                  <img
                    src={fotoPreviewUrl}
                    alt="Preview Convidado"
                    className="w-12 h-12 rounded-full object-cover border-2 border-dourado shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-vinho/10 border border-vinho/20 flex items-center justify-center shrink-0 text-vinho/40">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="bg-white border-vinho/20 text-xs cursor-pointer"
                  />
                  {editingConvite && !fotoFile && (
                    <p className="text-[10px] text-vinho/60 mt-1">
                      Mantenha em branco para preservar a foto atual cadastrada.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Logomarca da Empresa */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-vinho">
                  Logomarca da Empresa (Opcional)
                </Label>
                {logoPreviewUrl && (
                  <span className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Logo anexada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt="Preview Empresa"
                    className="w-12 h-12 rounded-lg object-contain border border-vinho/20 bg-white p-1 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-vinho/10 border border-vinho/20 flex items-center justify-center shrink-0 text-vinho/40">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="bg-white border-vinho/20 text-xs cursor-pointer"
                  />
                  {editingConvite && !logoFile && (
                    <p className="text-[10px] text-vinho/60 mt-1">
                      Mantenha em branco para preservar a logomarca atual.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-vinho/10">
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
                className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-5 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : editingConvite ? (
                  'Salvar Alterações'
                ) : (
                  'Gerar Convite'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview e Exportações (PDF & JPEG) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl bg-marfim border-2 border-dourado text-vinho p-0 overflow-hidden max-h-[92vh] flex flex-col">
          {previewConvite && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Barra Superior de Ações com Baixar JPEG, Imprimir PDF e Editar */}
              <div className="print-hide p-4 bg-white border-b border-vinho/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-vinho">
                    Visualização do Convite Gráfico
                  </span>
                  <span className="text-[10px] bg-dourado/20 text-vinho font-bold px-2 py-0.5 rounded-full border border-dourado/40">
                    A5 Oficial •{' '}
                    {previewConvite.tipo_convidado === 'convidado' ? 'Convidado' : 'Convidada'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Botão Editar direto do Preview */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewOpen(false)
                      handleOpenEdit(previewConvite)
                    }}
                    className="border-vinho/20 text-vinho hover:bg-vinho/5 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5 text-dourado-dark" />
                    Editar Dados
                  </Button>

                  {/* Botão Baixar JPEG */}
                  <Button
                    onClick={() => handleDownloadJpeg(previewConvite)}
                    disabled={exportingJpegId === previewConvite.id}
                    className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    {exportingJpegId === previewConvite.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-vinho" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-vinho" />
                    )}
                    Baixar como JPEG
                  </Button>

                  {/* Botão Imprimir / Salvar PDF */}
                  <Button
                    onClick={handlePrint}
                    className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-dourado" />
                    Imprimir / PDF
                  </Button>
                </div>
              </div>

              {/* CONTEÚDO DO CONVITE NA TELA (DESIGN OFICIAL VINHO & DOURADO) */}
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-marfim/50">
                <div
                  ref={invitePrintRef}
                  className="max-w-xl mx-auto p-6 sm:p-10 bg-gradient-to-b from-[#4B1E3F] via-[#36142D] to-[#4B1E3F] text-marfim space-y-6 sm:space-y-8 relative overflow-hidden rounded-2xl shadow-2xl border-2 border-dourado/40"
                >
                  {/* Borda decorativa dourada dupla */}
                  <div className="absolute inset-3 border-2 border-dourado/50 rounded-2xl pointer-events-none" />
                  <div className="absolute inset-5 border border-dourado/20 rounded-xl pointer-events-none" />

                  {/* Cabeçalho do Convite */}
                  <div className="text-center space-y-2 relative z-10">
                    <div className="flex justify-center mb-1">
                      <CoffeeCastLogo className="w-16 h-16" variant="gold" />
                    </div>
                    <h3 className="font-serif font-black text-2xl sm:text-3xl tracking-wide text-white">
                      CoffeeCast <span className="text-dourado">4.0</span>
                    </h3>
                    <p className="text-[11px] uppercase tracking-widest text-dourado-light font-bold">
                      Convite Oficial de Participação
                    </p>
                  </div>

                  {/* Card Central com Foto, Logo da Empresa e Apresentação */}
                  <div className="bg-[#2A0F23]/80 border border-dourado/40 rounded-2xl p-5 sm:p-7 space-y-5 relative z-10 text-center shadow-xl backdrop-blur-sm">
                    {/* Logomarca da empresa no topo do card (se existir) */}
                    {previewConvite.logomarca_empresa && (
                      <div className="flex justify-end -mb-3">
                        <img
                          src={getFileUrl(previewConvite, previewConvite.logomarca_empresa)}
                          alt="Empresa Convidada"
                          className="h-10 max-w-[120px] object-contain rounded-lg bg-white p-1 border border-dourado/40 shadow-xs"
                        />
                      </div>
                    )}

                    {/* Foto da convidada com moldura dourada */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <img
                          src={
                            previewConvite.foto_convidado
                              ? getFileUrl(previewConvite, previewConvite.foto_convidado)
                              : 'https://img.usecurling.com/ppl/256?gender=female'
                          }
                          alt={previewConvite.nome}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-dourado shadow-2xl"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-vinho p-1.5 rounded-full border border-dourado">
                          <Sparkles className="w-4 h-4 text-dourado" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-dourado-light uppercase font-semibold tracking-wider">
                        {previewConvite.tipo_convidado === 'convidado'
                          ? 'Convidado de Honra'
                          : previewConvite.tipo_convidado === 'convidada'
                            ? 'Convidada de Honra'
                            : 'Convidado(a) de Honra'}
                      </span>
                      <h4 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                        {previewConvite.nome}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-marfim/90 leading-relaxed font-light italic max-w-lg mx-auto">
                      "{previewConvite.apresentacao}"
                    </p>

                    {/* Informações de Gravação */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-dourado/30 text-xs">
                      <div className="bg-vinho/70 p-3 rounded-xl border border-dourado/20">
                        <span className="text-[10px] text-dourado uppercase font-bold block mb-1">
                          Data da Gravação
                        </span>
                        <span className="font-serif text-sm font-bold text-white">
                          {formatDateBR(previewConvite.data_gravacao)}
                        </span>
                      </div>

                      <div className="bg-vinho/70 p-3 rounded-xl border border-dourado/20">
                        <span className="text-[10px] text-dourado uppercase font-bold block mb-1">
                          Horário Marcado
                        </span>
                        <span className="font-serif text-sm font-bold text-white">
                          {previewConvite.horario}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Convite */}
                  <div className="relative z-10 text-center space-y-1.5 pt-2">
                    <p className="text-xs text-dourado-light italic">
                      "Aqui o café pode até esfriar, mas o papo nunca! ☕️"
                    </p>
                    <p className="text-[10px] text-marfim/60 uppercase tracking-wider font-semibold">
                      Equipe CoffeeCast 4.0 • Aline Lana
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PORTAL EXCLUSIVO DE IMPRESSÃO EM FORMATO A5 PERFEITO (148mm x 210mm)
          Injetado diretamente no document.body para ficar completamente fora
          de qualquer transform, translate, scale ou overflow do Dialog */}
      {previewConvite &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="printable-invite-portal"
            style={{
              width: '148mm',
              height: '210mm',
              maxWidth: '148mm',
              maxHeight: '210mm',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#4B1E3F',
              background:
                'linear-gradient(180deg, #4B1E3F 0%, #36142D 35%, #2A0F23 70%, #4B1E3F 100%)',
              color: '#FAF8F5',
              padding: '8mm',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {/* Bordas decorativas douradas */}
            <div
              style={{
                position: 'absolute',
                top: '4mm',
                left: '4mm',
                right: '4mm',
                bottom: '4mm',
                border: '1.5px solid rgba(212, 175, 55, 0.65)',
                borderRadius: '8mm',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '6mm',
                left: '6mm',
                right: '6mm',
                bottom: '6mm',
                border: '0.8px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '6mm',
                pointerEvents: 'none',
              }}
            />

            {/* Cabeçalho do Convite */}
            <div
              style={{ textAlign: 'center', position: 'relative', zIndex: 10, marginTop: '2mm' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2mm' }}>
                <CoffeeCastLogo className="w-14 h-14" variant="gold" />
              </div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 900,
                  fontSize: '22pt',
                  lineHeight: 1.1,
                  margin: 0,
                  color: '#FFFFFF',
                  letterSpacing: '0.5px',
                }}
              >
                CoffeeCast <span style={{ color: '#D4AF37' }}>4.0</span>
              </h1>
              <p
                style={{
                  fontSize: '8pt',
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  color: '#F3E5AB',
                  fontWeight: 700,
                  margin: '3mm 0 0 0',
                }}
              >
                Convite Oficial de Participação
              </p>
            </div>

            {/* Card Central com Foto, Logo da Empresa e Apresentação */}
            <div
              style={{
                backgroundColor: 'rgba(42, 15, 35, 0.88)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '6mm',
                padding: '5mm',
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
                margin: '2mm 0',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Logomarca da empresa no topo direito */}
              {previewConvite.logomarca_empresa && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4mm',
                    right: '4mm',
                    zIndex: 20,
                  }}
                >
                  <img
                    src={getFileUrl(previewConvite, previewConvite.logomarca_empresa)}
                    alt="Empresa Convidada"
                    style={{
                      height: '9mm',
                      maxWidth: '28mm',
                      objectFit: 'contain',
                      borderRadius: '2mm',
                      backgroundColor: '#FFFFFF',
                      padding: '1mm',
                      border: '0.8px solid rgba(212, 175, 55, 0.5)',
                    }}
                  />
                </div>
              )}

              {/* Foto da convidada com moldura dourada */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3mm' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={
                      previewConvite.foto_convidado
                        ? getFileUrl(previewConvite, previewConvite.foto_convidado)
                        : 'https://img.usecurling.com/ppl/256?gender=female'
                    }
                    alt={previewConvite.nome}
                    style={{
                      width: '26mm',
                      height: '26mm',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2.5px solid #D4AF37',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-1mm',
                      right: '-1mm',
                      backgroundColor: '#4B1E3F',
                      padding: '1.2mm',
                      borderRadius: '50%',
                      border: '1px solid #D4AF37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles style={{ width: '3.5mm', height: '3.5mm', color: '#D4AF37' }} />
                  </div>
                </div>
              </div>

              {/* Rótulo de Convidado/Convidada */}
              <div style={{ marginBottom: '2mm' }}>
                <span
                  style={{
                    fontSize: '8pt',
                    color: '#F3E5AB',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    display: 'block',
                  }}
                >
                  {previewConvite.tipo_convidado === 'convidado'
                    ? 'Convidado de Honra'
                    : previewConvite.tipo_convidado === 'convidada'
                      ? 'Convidada de Honra'
                      : 'Convidado(a) de Honra'}
                </span>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '18pt',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: '1.5mm 0 0 0',
                    lineHeight: 1.2,
                  }}
                >
                  {previewConvite.nome}
                </h2>
              </div>

              {/* Linha separadora dourada */}
              <div
                style={{
                  width: '30mm',
                  height: '1px',
                  backgroundColor: '#D4AF37',
                  margin: '2.5mm auto',
                  opacity: 0.7,
                }}
              />

              {/* Texto de apresentação */}
              <p
                style={{
                  fontSize: '9.5pt',
                  color: 'rgba(250, 248, 245, 0.95)',
                  lineHeight: 1.45,
                  fontWeight: 300,
                  fontStyle: 'italic',
                  margin: '3mm auto 4mm auto',
                  maxWidth: '110mm',
                }}
              >
                "{previewConvite.apresentacao}"
              </p>

              {/* Informações de Gravação */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '3mm',
                  paddingTop: '3mm',
                  borderTop: '0.8px solid rgba(212, 175, 55, 0.35)',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(75, 30, 63, 0.8)',
                    padding: '2.5mm 3mm',
                    borderRadius: '3mm',
                    border: '0.8px solid rgba(212, 175, 55, 0.3)',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '7pt',
                      color: '#D4AF37',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '1mm',
                    }}
                  >
                    Data da Gravação
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '10.5pt',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    {formatDateBR(previewConvite.data_gravacao)}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(75, 30, 63, 0.8)',
                    padding: '2.5mm 3mm',
                    borderRadius: '3mm',
                    border: '0.8px solid rgba(212, 175, 55, 0.3)',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '7pt',
                      color: '#D4AF37',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '1mm',
                    }}
                  >
                    Horário Marcado
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '10.5pt',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    {previewConvite.horario}
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé do Convite */}
            <div
              style={{
                textAlign: 'center',
                position: 'relative',
                zIndex: 10,
                marginBottom: '2mm',
              }}
            >
              <p
                style={{
                  fontSize: '9pt',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  color: '#F3E5AB',
                  margin: '0 0 1.5mm 0',
                }}
              >
                "Aqui o café pode até esfriar, mas o papo nunca! ☕️"
              </p>
              <p
                style={{
                  fontSize: '7.5pt',
                  color: 'rgba(250, 248, 245, 0.65)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Equipe CoffeeCast 4.0 • Aline Lana
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
