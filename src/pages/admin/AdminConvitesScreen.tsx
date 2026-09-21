import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import pb from '@/lib/pocketbase/client'
import { formatDateBR, getFileUrl, toInputDate } from '@/lib/formatters'
import type { ConviteRecord, ConteudoSiteRecord } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
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
  MapPin,
  ExternalLink,
  Save,
  SlidersHorizontal,
} from 'lucide-react'
import {
  renderInviteToCanvas,
  downloadCanvasAsJpeg,
  createCircularGuestPhotoDataUrl,
  downloadInvitePdf,
  buildInvitePdfFileName,
} from '@/lib/inviteExporter'
import { AuditoriaService } from '@/services/auditoria'
import officialLogoImg from '@/assets/sem-nome-1350-x-1080-px-1-01237.png'
import { toast } from 'sonner'

export default function AdminConvitesScreen() {
  const { role, isMaster, hasScreenPermission } = useAuth()
  const canEditDefaults = isMaster || (role === 'adm' && hasScreenPermission('convites'))

  const [convites, setConvites] = useState<ConviteRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Valores padrão globais para novos convites (Endereço & Localização)
  const [defaultEndereco, setDefaultEndereco] = useState('')
  const [defaultLocalizacao, setDefaultLocalizacao] = useState('')
  const [defaultEnderecoId, setDefaultEnderecoId] = useState<string | null>(null)
  const [defaultLocalizacaoId, setDefaultLocalizacaoId] = useState<string | null>(null)

  // Valores padrão globais para novos convites (Textos de Apresentação por Gênero)
  const [defaultTextoConvidado, setDefaultTextoConvidado] = useState('')
  const [defaultTextoConvidada, setDefaultTextoConvidada] = useState('')
  const [defaultTextoConvidadoId, setDefaultTextoConvidadoId] = useState<string | null>(null)
  const [defaultTextoConvidadaId, setDefaultTextoConvidadaId] = useState<string | null>(null)
  const [savingTextDefaults, setSavingTextDefaults] = useState(false)

  const [savingDefaults, setSavingDefaults] = useState(false)
  const [loadingDefaults, setLoadingDefaults] = useState(true)

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
  const [enderecoGravacao, setEnderecoGravacao] = useState('')
  const [linkLocalizacao, setLinkLocalizacao] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Previews locais das imagens selecionadas ou já salvas
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string>('')
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('')

  // PNG pré-recortado circular com fundo transparente para uso no Preview em tela e no Portal de Impressão A5 (PDF)
  // Isso blinda a exibição em visualizadores de PDF mobile e WhatsApp contra falhas de border-radius/clip-path do CSS
  const [circularGuestPhotoUrl, setCircularGuestPhotoUrl] = useState<string>('')
  const [processingCircularPhoto, setProcessingCircularPhoto] = useState(false)

  const [saving, setSaving] = useState(false)
  const [exportingJpegId, setExportingJpegId] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const invitePrintRef = useRef<HTMLDivElement>(null)

  const loadDefaults = async () => {
    try {
      setLoadingDefaults(true)
      const records = await pb.collection('conteudo_site').getFullList<ConteudoSiteRecord>({
        filter:
          'chave = "convites_padrao_endereco" || chave = "convites_padrao_localizacao" || chave = "convites_padrao_texto_convidado" || chave = "convites_padrao_texto_convidada"',
      })
      const endRec = records.find((r) => r.chave === 'convites_padrao_endereco')
      const locRec = records.find((r) => r.chave === 'convites_padrao_localizacao')
      const txtConvidadoRec = records.find((r) => r.chave === 'convites_padrao_texto_convidado')
      const txtConvidadaRec = records.find((r) => r.chave === 'convites_padrao_texto_convidada')

      if (endRec) {
        setDefaultEndereco(endRec.valor || '')
        setDefaultEnderecoId(endRec.id)
      }
      if (locRec) {
        setDefaultLocalizacao(locRec.valor || '')
        setDefaultLocalizacaoId(locRec.id)
      }
      if (txtConvidadoRec) {
        setDefaultTextoConvidado(txtConvidadoRec.valor || '')
        setDefaultTextoConvidadoId(txtConvidadoRec.id)
      }
      if (txtConvidadaRec) {
        setDefaultTextoConvidada(txtConvidadaRec.valor || '')
        setDefaultTextoConvidadaId(txtConvidadaRec.id)
      }
    } catch (err) {
      console.error('Erro ao carregar valores padrão de convites:', err)
    } finally {
      setLoadingDefaults(false)
    }
  }

  const handleSaveDefaults = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canEditDefaults) {
      toast.error('Você não tem permissão para alterar as configurações padrão.')
      return
    }

    try {
      setSavingDefaults(true)
      const trimmedEnd = defaultEndereco.trim()
      const trimmedLoc = defaultLocalizacao.trim()

      if (defaultEnderecoId) {
        await pb.collection('conteudo_site').update(defaultEnderecoId, { valor: trimmedEnd })
      } else {
        const created = await pb.collection('conteudo_site').create<ConteudoSiteRecord>({
          chave: 'convites_padrao_endereco',
          valor: trimmedEnd,
        })
        setDefaultEnderecoId(created.id)
      }

      if (defaultLocalizacaoId) {
        await pb.collection('conteudo_site').update(defaultLocalizacaoId, { valor: trimmedLoc })
      } else {
        const created = await pb.collection('conteudo_site').create<ConteudoSiteRecord>({
          chave: 'convites_padrao_localizacao',
          valor: trimmedLoc,
        })
        setDefaultLocalizacaoId(created.id)
      }

      toast.success('Endereço e localização padrão salvos com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar padrões de convites:', err)
      toast.error('Erro ao salvar endereço e localização padrão.')
    } finally {
      setSavingDefaults(false)
    }
  }

  const handleSaveTextDefaults = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canEditDefaults) {
      toast.error('Você não tem permissão para alterar as configurações padrão.')
      return
    }

    try {
      setSavingTextDefaults(true)
      // Preserva quebras de linha e espaçamentos internos intactos
      const valConvidado = defaultTextoConvidado.replace(/^\s+|\s+$/g, '')
      const valConvidada = defaultTextoConvidada.replace(/^\s+|\s+$/g, '')

      if (defaultTextoConvidadoId) {
        await pb
          .collection('conteudo_site')
          .update(defaultTextoConvidadoId, { valor: valConvidado })
      } else {
        const created = await pb.collection('conteudo_site').create<ConteudoSiteRecord>({
          chave: 'convites_padrao_texto_convidado',
          valor: valConvidado,
        })
        setDefaultTextoConvidadoId(created.id)
      }

      if (defaultTextoConvidadaId) {
        await pb
          .collection('conteudo_site')
          .update(defaultTextoConvidadaId, { valor: valConvidada })
      } else {
        const created = await pb.collection('conteudo_site').create<ConteudoSiteRecord>({
          chave: 'convites_padrao_texto_convidada',
          valor: valConvidada,
        })
        setDefaultTextoConvidadaId(created.id)
      }

      toast.success('Textos de apresentação padrão salvos com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar textos padrão de convites:', err)
      toast.error('Erro ao salvar textos de apresentação padrão.')
    } finally {
      setSavingTextDefaults(false)
    }
  }

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
    loadDefaults()
  }, [])

  // Limpa URLs de objeto para evitar memory leaks
  useEffect(() => {
    return () => {
      if (fotoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(fotoPreviewUrl)
      if (logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [fotoPreviewUrl, logoPreviewUrl])

  // Sempre que o convite em preview mudar (ou for aberto), gera o PNG circular pré-recortado
  useEffect(() => {
    let isMounted = true
    if (!previewConvite) {
      setCircularGuestPhotoUrl('')
      return
    }

    const rawUrl = previewConvite.foto_convidado
      ? getFileUrl(previewConvite, previewConvite.foto_convidado)
      : 'https://img.usecurling.com/ppl/256?gender=female'

    setProcessingCircularPhoto(true)
    createCircularGuestPhotoDataUrl(rawUrl, 512)
      .then((dataUrl) => {
        if (isMounted) {
          setCircularGuestPhotoUrl(dataUrl || rawUrl)
        }
      })
      .catch((err) => {
        console.warn('Erro ao processar foto circular do convidado:', err)
        if (isMounted) {
          setCircularGuestPhotoUrl(rawUrl)
        }
      })
      .finally(() => {
        if (isMounted) {
          setProcessingCircularPhoto(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [previewConvite])

  const handleOpenCreate = () => {
    const initialGender: 'convidado' | 'convidada' = 'convidada'
    setEditingConvite(null)
    setNome('')
    setTipoConvidado(initialGender)
    setDataGravacao(toInputDate(new Date().toISOString()))
    setHorario('14:00')

    const defaultTxt =
      (initialGender === 'convidada' ? defaultTextoConvidada : defaultTextoConvidado) ||
      'É com grande alegria e honra que convidamos você para compartilhar sua trajetória inspiradora no CoffeeCast 4.0. Preparamos uma mesa com afeto, respeito e cafés especiais para dar voz à sua história que transforma vidas.'
    setApresentacao(defaultTxt)

    // Pré-preenche novos convites com os valores padrão globais cadastrados
    setEnderecoGravacao(defaultEndereco || '')
    setLinkLocalizacao(defaultLocalizacao || '')
    setFotoFile(null)
    setLogoFile(null)
    setFotoPreviewUrl('')
    setLogoPreviewUrl('')
    setModalOpen(true)
  }

  const handleGenderChange = (novoGenero: 'convidado' | 'convidada') => {
    setTipoConvidado(novoGenero)

    // Se estiver criando um novo convite (não editando um existente), atualiza o texto de apresentação com o padrão do gênero
    if (!editingConvite) {
      const currentTextoPadraoConvidado =
        defaultTextoConvidado ||
        'É com grande alegria e honra que convidamos você para compartilhar sua trajetória inspiradora no CoffeeCast 4.0. Preparamos uma mesa com afeto, respeito e cafés especiais para dar voz à sua história que transforma vidas.'
      const currentTextoPadraoConvidada =
        defaultTextoConvidada ||
        'É com grande alegria e honra que convidamos você para compartilhar sua trajetória inspiradora no CoffeeCast 4.0. Preparamos uma mesa com afeto, respeito e cafés especiais para dar voz à sua história que transforma vidas.'

      const textoAtualTrim = apresentacao.trim()
      // Se o campo estiver vazio ou for exatamente o padrão do gênero anterior, atualiza para o novo padrão
      const isConvidadoPattern = textoAtualTrim === currentTextoPadraoConvidado.trim()
      const isConvidadaPattern = textoAtualTrim === currentTextoPadraoConvidada.trim()

      if (!textoAtualTrim || isConvidadoPattern || isConvidadaPattern) {
        setApresentacao(
          novoGenero === 'convidada' ? currentTextoPadraoConvidada : currentTextoPadraoConvidado,
        )
      }
    }
  }

  const handleOpenEdit = (convite: ConviteRecord) => {
    setEditingConvite(convite)
    setNome(convite.nome || '')
    setTipoConvidado(convite.tipo_convidado === 'convidado' ? 'convidado' : 'convidada')
    setDataGravacao(toInputDate(convite.data_gravacao) || toInputDate(new Date().toISOString()))
    setHorario(convite.horario || '14:00')
    setApresentacao(convite.apresentacao || '')
    setEnderecoGravacao(convite.endereco_gravacao || '')
    setLinkLocalizacao(convite.link_localizacao || '')
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
      formData.append('data_gravacao', toInputDate(dataGravacao))
      formData.append('horario', horario.trim())
      // Salva o texto cru de apresentação preservando quebras de linha (\n) e espaçamentos
      formData.append('apresentacao', apresentacao.trim())
      formData.append('endereco_gravacao', enderecoGravacao.trim())
      formData.append('link_localizacao', linkLocalizacao.trim())

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

  /**
   * Gerar e baixar PDF do Convite em formato oficial A5 (148 x 210 mm)
   * Abre em janela dedicada com fallback automático e registro na Auditoria.
   */
  const handleGeneratePdf = async (convite: ConviteRecord) => {
    try {
      setGeneratingPdf(true)
      toast.loading('Gerando PDF oficial do convite (formato A5)...', { id: 'pdf-convite-toast' })

      // Se a foto circular ainda estiver sendo processada em segundo plano, aguarda até 1s
      let guestPhotoPng = circularGuestPhotoUrl
      if (!guestPhotoPng || processingCircularPhoto) {
        const rawPhotoUrl = convite.foto_convidado
          ? getFileUrl(convite, convite.foto_convidado)
          : 'https://img.usecurling.com/ppl/256?gender=female'
        try {
          guestPhotoPng = await createCircularGuestPhotoDataUrl(rawPhotoUrl, 512)
        } catch (e) {
          console.warn('Fallback foto convidado:', e)
          guestPhotoPng = rawPhotoUrl
        }
      }

      // Preparar logo da empresa se houver
      let companyLogoDataUrl: string | undefined = undefined
      if (convite.logomarca_empresa) {
        companyLogoDataUrl = getFileUrl(convite, convite.logomarca_empresa)
      }

      const fileName = buildInvitePdfFileName(convite.nome)

      try {
        await downloadInvitePdf({
          nome: convite.nome,
          tipoConvidado: convite.tipo_convidado,
          dataGravacao: formatDateBR(convite.data_gravacao),
          horario: convite.horario,
          apresentacao: convite.apresentacao,
          enderecoGravacao: convite.endereco_gravacao,
          linkLocalizacao: convite.link_localizacao,
          guestPhotoDataUrl: guestPhotoPng,
          companyLogoDataUrl,
        })
      } catch (winErr: unknown) {
        console.warn(
          'Janela dedicada bloqueada ou com falha, acionando fallback window.print:',
          winErr,
        )
        // Fallback robusto no mesmo DOM
        window.print()
      }

      // Registrar auditoria de emissão/download do PDF
      AuditoriaService.registrarEvento({
        tipo_acao: 'download',
        area_sistema: 'Convites',
        descricao: `Geração do arquivo PDF do convite oficial de "${convite.nome}" (${fileName}).`,
        registro_afetado: convite.id,
        tabela_afetada: 'convites',
        resultado: 'sucesso',
        metadata: {
          convidado_nome: convite.nome,
          tipo_convidado: convite.tipo_convidado,
          data_gravacao: convite.data_gravacao,
          nome_arquivo: fileName,
        },
      }).catch((auditErr) => {
        console.warn('[AdminConvitesScreen] Falha ao registrar auditoria de convite:', auditErr)
      })

      toast.success('Diálogo de PDF/impressão aberto com sucesso!', { id: 'pdf-convite-toast' })
    } catch (err: unknown) {
      console.error('Erro ao gerar PDF do convite:', err)
      const msg =
        err &&
        typeof err === 'object' &&
        'message' in err &&
        String((err as { message: string }).message).includes('bloquead')
          ? 'Não foi possível abrir o PDF — verifique o bloqueador de pop-ups do navegador e tente novamente.'
          : 'Não foi possível gerar o PDF — tente novamente ou baixe como JPEG.'
      toast.error(msg, { id: 'pdf-convite-toast' })
    } finally {
      setGeneratingPdf(false)
    }
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
        enderecoGravacao: convite.endereco_gravacao,
        linkLocalizacao: convite.link_localizacao,
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Gerador de Convites Premium
          </h2>
          <p className="text-xs text-vinho/70">
            Crie, edite e baixe convites sofisticados em PDF ou imagem JPEG na identidade oficial do
            CoffeeCast 4.0.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4 text-dourado shrink-0" />
          Gerar Novo Convite
        </Button>
      </div>

      {/* Card Discreto de Configuração: Endereço e Localização Padrão para Novos Convites */}
      <div className="bg-white rounded-2xl border border-vinho/10 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 border-b border-vinho/10">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-vinho/5 border border-dourado/30 flex items-center justify-center shrink-0 text-vinho mt-0.5">
              <MapPin className="w-4 h-4 text-dourado" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-vinho">
                  Endereço e Localização Padrão
                </h3>
                <span className="text-[10px] bg-dourado/20 text-vinho font-semibold px-2 py-0.5 rounded-full border border-dourado/30">
                  Novos Convites
                </span>
              </div>
              <p className="text-xs text-vinho/70 mt-0.5">
                Defina o endereço físico e o link do Google Maps que já virão preenchidos ao criar
                novos convites. É sempre possível editar livremente em cada convite individual.
              </p>
            </div>
          </div>

          {canEditDefaults && (
            <Button
              type="button"
              onClick={() => handleSaveDefaults()}
              disabled={savingDefaults || loadingDefaults}
              size="sm"
              className="bg-vinho hover:bg-vinho-light text-white text-xs font-semibold px-4 min-h-[38px] rounded-xl flex items-center gap-1.5 self-end md:self-auto shrink-0 shadow-xs"
            >
              {savingDefaults ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-dourado" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-dourado" />
                  <span>Salvar Padrão</span>
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5">
          <div className="space-y-1.5">
            <Label
              htmlFor="default-endereco"
              className="text-xs font-semibold text-vinho flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-dourado" />
              Endereço da gravação padrão:
            </Label>
            <Input
              id="default-endereco"
              disabled={!canEditDefaults || loadingDefaults}
              placeholder="Ex.: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
              value={defaultEndereco}
              onChange={(e) => setDefaultEndereco(e.target.value)}
              className="bg-marfim/30 border-vinho/20 text-xs focus-visible:ring-dourado"
            />
            <p className="text-[10px] text-vinho/60">
              Texto que virá pré-preenchido no campo de endereço de novos convites.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="default-localizacao"
                className="text-xs font-semibold text-vinho flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-dourado" />
                Localização padrão (link Google Maps):
              </Label>
              {defaultLocalizacao.trim() && (
                <a
                  href={defaultLocalizacao.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-vinho hover:text-dourado-dark underline transition-colors"
                  title="Testar link do Google Maps"
                >
                  <span>Testar link</span>
                  <ExternalLink className="w-3 h-3 text-dourado" />
                </a>
              )}
            </div>
            <Input
              id="default-localizacao"
              type="url"
              disabled={!canEditDefaults || loadingDefaults}
              placeholder="Ex.: https://maps.app.goo.gl/..."
              value={defaultLocalizacao}
              onChange={(e) => setDefaultLocalizacao(e.target.value)}
              className="bg-marfim/30 border-vinho/20 text-xs focus-visible:ring-dourado"
            />
            <p className="text-[10px] text-vinho/60">
              URL do Google Maps que virá pré-preenchida e ficará interativa no PDF.
            </p>
          </div>
        </div>
      </div>

      {/* Card de Configuração: Texto de Apresentação Padrão por Gênero para Novos Convites */}
      <div className="bg-white rounded-2xl border border-vinho/10 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 border-b border-vinho/10">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-vinho/5 border border-dourado/30 flex items-center justify-center shrink-0 text-vinho mt-0.5">
              <Sparkles className="w-4 h-4 text-dourado" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-vinho">
                  Texto de Apresentação Padrão
                </h3>
                <span className="text-[10px] bg-dourado/20 text-vinho font-semibold px-2 py-0.5 rounded-full border border-dourado/30">
                  Por Gênero
                </span>
              </div>
              <p className="text-xs text-vinho/70 mt-0.5">
                Defina o texto padrão de apresentação e boas-vindas para{' '}
                <strong>Convidado (homem)</strong> e para <strong>Convidada (mulher)</strong>. Ao
                gerar um novo convite, o campo será preenchido automaticamente de acordo com o
                gênero selecionado, permanecendo totalmente editável antes de salvar.
              </p>
            </div>
          </div>

          {canEditDefaults && (
            <Button
              type="button"
              onClick={() => handleSaveTextDefaults()}
              disabled={savingTextDefaults || loadingDefaults}
              size="sm"
              className="bg-vinho hover:bg-vinho-light text-white text-xs font-semibold px-4 min-h-[38px] rounded-xl flex items-center gap-1.5 self-end md:self-auto shrink-0 shadow-xs"
            >
              {savingTextDefaults ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-dourado" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-dourado" />
                  <span>Salvar Padrão</span>
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="default-texto-convidado"
                className="text-xs font-semibold text-vinho flex items-center gap-1.5"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-vinho inline-block" />
                Padrão para Convidado (homem):
              </Label>
              <span className="text-[10px] text-vinho/60 font-medium">Convidado de Honra</span>
            </div>
            <Textarea
              id="default-texto-convidado"
              rows={4}
              disabled={!canEditDefaults || loadingDefaults}
              placeholder="Digite o texto de apresentação padrão para convidados homens..."
              value={defaultTextoConvidado}
              onChange={(e) => setDefaultTextoConvidado(e.target.value)}
              className="bg-marfim/30 border-vinho/20 text-xs focus-visible:ring-dourado resize-y"
            />
            <p className="text-[10px] text-vinho/60">
              Texto que virá pré-preenchido ao selecionar "Convidado (de Honra)".
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="default-texto-convidada"
                className="text-xs font-semibold text-vinho flex items-center gap-1.5"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-dourado inline-block" />
                Padrão para Convidada (mulher):
              </Label>
              <span className="text-[10px] text-vinho/60 font-medium">Convidada de Honra</span>
            </div>
            <Textarea
              id="default-texto-convidada"
              rows={4}
              disabled={!canEditDefaults || loadingDefaults}
              placeholder="Digite o texto de apresentação padrão para convidadas mulheres..."
              value={defaultTextoConvidada}
              onChange={(e) => setDefaultTextoConvidada(e.target.value)}
              className="bg-marfim/30 border-vinho/20 text-xs focus-visible:ring-dourado resize-y"
            />
            <p className="text-[10px] text-vinho/60">
              Texto que virá pré-preenchido ao selecionar "Convidada (de Honra)".
            </p>
          </div>
        </div>
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
                      <Calendar className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
                      <span>Data: {formatDateBR(item.data_gravacao)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
                      <span>Horário: {item.horario}</span>
                    </div>
                    {item.endereco_gravacao && (
                      <div className="pt-1 border-t border-vinho/10 text-[11px] text-vinho/80 line-clamp-1">
                        <span className="font-semibold text-vinho">Endereço da gravação:</span>{' '}
                        {item.endereco_gravacao}
                      </div>
                    )}
                    {item.link_localizacao && (
                      <div className="text-[11px]">
                        <span className="font-semibold text-vinho">Localização:</span>{' '}
                        <a
                          href={item.link_localizacao}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vinho font-medium underline hover:text-dourado-dark break-all"
                        >
                          Ver no Google Maps
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-vinho/75 italic line-clamp-3 whitespace-pre-line">
                    "{item.apresentacao}"
                  </p>
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
        <DialogContent className="w-[94vw] max-w-md bg-marfim border-2 border-dourado/50 text-vinho max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-dourado shrink-0" />
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
                  onClick={() => handleGenderChange('convidada')}
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
                  onClick={() => handleGenderChange('convidado')}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="conv-apres" className="text-xs font-semibold text-vinho">
                  Texto de Apresentação / Mensagem de Boas-Vindas *
                </Label>
                <span className="text-[10px] text-vinho/60 font-medium">
                  Preserva quebras de linha e espaçamentos
                </span>
              </div>
              <Textarea
                id="conv-apres"
                required
                rows={4}
                value={apresentacao}
                onChange={(e) => setApresentacao(e.target.value)}
                className="bg-white border-vinho/20 text-xs whitespace-pre-wrap resize-y font-normal"
                placeholder="Digite a mensagem de boas-vindas..."
              />
            </div>

            {/* Endereço da gravação */}
            <div className="space-y-1.5">
              <Label htmlFor="conv-endereco" className="text-xs font-semibold text-vinho">
                Endereço da gravação:
              </Label>
              <Input
                id="conv-endereco"
                placeholder="Ex.: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                value={enderecoGravacao}
                onChange={(e) => setEnderecoGravacao(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
              <p className="text-[10px] text-vinho/60">
                Campo de texto livre com o endereço onde será gravado o episódio (opcional).
              </p>
            </div>

            {/* Localização (Link Google Maps) */}
            <div className="space-y-1.5">
              <Label htmlFor="conv-localizacao" className="text-xs font-semibold text-vinho">
                Localização
              </Label>
              <Input
                id="conv-localizacao"
                type="url"
                placeholder="Ex.: https://maps.app.goo.gl/... ou https://google.com/maps/..."
                value={linkLocalizacao}
                onChange={(e) => setLinkLocalizacao(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
              <p className="text-[10px] text-vinho/60">
                Link do Google Maps para a localização. Ficará clicável no PDF do convite
                (opcional).
              </p>
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-vinho/10">
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
                className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-5 flex items-center justify-center gap-2"
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
        <DialogContent className="w-[94vw] max-w-2xl bg-marfim border-2 border-dourado text-vinho p-0 overflow-hidden max-h-[92vh] flex flex-col mx-auto rounded-2xl">
          {previewConvite && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Barra Superior de Ações com Baixar JPEG, Imprimir PDF e Editar */}
              <div className="print-hide p-3 sm:p-4 bg-white border-b border-vinho/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 shrink-0">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-xs font-bold text-vinho truncate">
                    Convite Gráfico Oficial
                  </span>
                  <span className="text-[10px] bg-dourado/20 text-vinho font-bold px-2 py-0.5 rounded-full border border-dourado/40 shrink-0">
                    A5 • {previewConvite.tipo_convidado === 'convidado' ? 'Convidado' : 'Convidada'}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  {/* Botão Editar direto do Preview */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewOpen(false)
                      handleOpenEdit(previewConvite)
                    }}
                    className="border-vinho/20 text-vinho hover:bg-vinho/5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-2 min-h-[44px] sm:min-h-[36px] rounded-xl sm:rounded-full flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
                    <span>Editar</span>
                  </Button>
                  {/* Botão Baixar JPEG */}
                  <Button
                    onClick={() => handleDownloadJpeg(previewConvite)}
                    disabled={exportingJpegId === previewConvite.id}
                    className="bg-dourado hover:bg-dourado-dark text-vinho font-bold text-[11px] sm:text-xs px-2 sm:px-3.5 py-2 min-h-[44px] sm:min-h-[36px] rounded-xl sm:rounded-full flex items-center justify-center gap-1 shadow-xs transition-colors active:scale-95"
                  >
                    {exportingJpegId === previewConvite.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-vinho shrink-0" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-vinho shrink-0" />
                    )}
                    <span>JPEG</span>
                  </Button>
                  {/* Botão Imprimir / Salvar PDF */}
                  <Button
                    onClick={() => handleGeneratePdf(previewConvite)}
                    disabled={generatingPdf}
                    title="Gerar e salvar PDF oficial em formato A5 (148 x 210 mm) fiel ao preview"
                    className="bg-vinho hover:bg-vinho-light text-white text-[11px] sm:text-xs font-bold px-2 sm:px-3.5 py-2 min-h-[44px] sm:min-h-[36px] rounded-xl sm:rounded-full flex items-center justify-center gap-1 shadow-xs active:scale-95"
                  >
                    {generatingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-dourado shrink-0" />
                    ) : (
                      <Printer className="w-3.5 h-3.5 text-dourado shrink-0" />
                    )}
                    <span>Gerar PDF</span>
                  </Button>{' '}
                </div>
              </div>

              {/* CONTEÚDO DO CONVITE NA TELA (DESIGN OFICIAL VINHO & DOURADO) */}
              <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-marfim/50">
                <div
                  ref={invitePrintRef}
                  className="max-w-xl mx-auto p-4 sm:p-10 bg-gradient-to-b from-[#4B1E3F] via-[#36142D] to-[#4B1E3F] text-marfim space-y-4 sm:space-y-8 relative overflow-hidden rounded-2xl shadow-2xl border-2 border-dourado/40"
                >
                  {/* Borda decorativa dourada dupla */}
                  <div className="absolute inset-3 border-2 border-dourado/50 rounded-2xl pointer-events-none" />
                  <div className="absolute inset-5 border border-dourado/20 rounded-xl pointer-events-none" />

                  {/* Cabeçalho do Convite: Logo discreta no topo e subtítulo dourado */}
                  <div className="text-center space-y-1.5 relative z-10">
                    <div className="flex justify-center">
                      <img
                        src={officialLogoImg}
                        alt="CoffeeCast 4.0"
                        className="w-28 sm:w-36 max-w-full h-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] opacity-95 transition-opacity"
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-dourado-light font-bold">
                      Convite Oficial de Participação
                    </p>
                  </div>

                  {/* Card Central com Foto em Grande Destaque (Protagonista), Logo da Empresa e Apresentação */}
                  <div className="bg-[#2A0F23]/85 border border-dourado/40 rounded-2xl p-5 sm:p-7 space-y-5 relative z-10 text-center shadow-2xl backdrop-blur-sm">
                    {/* Logomarca da empresa no topo do card (se existir) */}
                    {previewConvite.logomarca_empresa && (
                      <div className="flex justify-end -mb-4">
                        <img
                          src={getFileUrl(previewConvite, previewConvite.logomarca_empresa)}
                          alt="Empresa Convidada"
                          className="h-10 max-w-[120px] object-contain rounded-lg bg-white p-1 border border-dourado/40 shadow-xs"
                        />
                      </div>
                    )}

                    {/* Foto da pessoa convidada como protagonista visual com medalhão de bordas duplas douradas e sombra nobre */}
                    <div className="flex justify-center pt-2 pb-1 px-4">
                      <div className="relative group shrink-0" style={{ overflow: 'visible' }}>
                        {/* Halo dourado sutil de fundo para enaltecer a foto com folga para não ser clipado */}
                        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-dourado/35 via-dourado-light/20 to-dourado/35 blur-md pointer-events-none" />

                        {/* Moldura externa circular perfeita 1:1 */}
                        <div className="relative w-36 h-36 sm:w-44 sm:h-44 aspect-square p-1 rounded-full bg-gradient-to-b from-[#FFF2B2] via-[#D4AF37] to-[#B38612] shadow-[0_12px_32px_rgba(0,0,0,0.7)] flex items-center justify-center shrink-0">
                          {/* Anel escuro intermediário */}
                          <div className="w-full h-full aspect-square p-1 rounded-full bg-[#2A0F23] flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={
                                circularGuestPhotoUrl ||
                                (previewConvite.foto_convidado
                                  ? getFileUrl(previewConvite, previewConvite.foto_convidado)
                                  : 'https://img.usecurling.com/ppl/256?gender=female')
                              }
                              alt={previewConvite.nome}
                              className="w-full h-full aspect-square rounded-full object-cover [object-position:50%_18%] border-2 border-dourado/70 shadow-inner block shrink-0"
                            />
                          </div>
                        </div>

                        {/* Estrela dourada brilhante sem caixa/fundo escuro quadrado */}
                        <div className="absolute -bottom-1 -right-1 pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] filter z-10">
                          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-dourado-light animate-pulse fill-dourado/40" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] sm:text-xs text-dourado-light uppercase font-bold tracking-[0.2em]">
                        {previewConvite.tipo_convidado === 'convidado'
                          ? 'Convidado de Honra'
                          : previewConvite.tipo_convidado === 'convidada'
                            ? 'Convidada de Honra'
                            : 'Convidado(a) de Honra'}
                      </span>
                      <h4 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                        {previewConvite.nome}
                      </h4>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-dourado/80" />
                        <div className="w-1.5 h-1.5 rounded-full bg-dourado" />
                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-dourado/80" />
                      </div>
                    </div>

                    {/* Texto de apresentação com quebras de linha e espaçamentos fiéis */}
                    <p
                      className={`text-marfim/90 font-light italic max-w-lg mx-auto whitespace-pre-wrap break-words leading-relaxed text-center ${
                        (previewConvite.apresentacao || '').length > 320
                          ? 'text-[11px] sm:text-xs leading-normal'
                          : (previewConvite.apresentacao || '').length > 200
                            ? 'text-xs sm:text-[13px] leading-relaxed'
                            : 'text-xs sm:text-sm leading-relaxed'
                      }`}
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
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

                    {/* Endereço da gravação e Localização (Google Maps) */}
                    {(Boolean(previewConvite.endereco_gravacao?.trim()) ||
                      Boolean(previewConvite.link_localizacao?.trim())) && (
                      <div className="bg-vinho/80 p-3 sm:p-4 rounded-xl border border-dourado/30 text-center space-y-2.5 text-xs">
                        {previewConvite.endereco_gravacao?.trim() && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-dourado uppercase font-bold tracking-wider block text-center">
                              Endereço da gravação:
                            </span>
                            <p className="text-sm text-white font-normal leading-relaxed text-center max-w-md mx-auto">
                              {previewConvite.endereco_gravacao}
                            </p>
                          </div>
                        )}

                        {previewConvite.link_localizacao?.trim() && (
                          <div
                            className={`space-y-1.5 flex flex-col items-center justify-center ${
                              previewConvite.endereco_gravacao?.trim()
                                ? 'pt-2 border-t border-dourado/20'
                                : ''
                            }`}
                          >
                            <span className="text-[10px] text-dourado uppercase font-bold tracking-wider block text-center">
                              Localização
                            </span>
                            <a
                              href={previewConvite.link_localizacao}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-dourado/20 hover:bg-dourado/30 border border-dourado text-dourado-light hover:text-white font-semibold text-xs transition-colors shadow-xs"
                            >
                              <span>📍 Ver no Google Maps</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
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
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              colorAdjust: 'exact',
            }}
          >
            {/* Bordas decorativas douradas */}
            <div
              style={{
                position: 'absolute',
                top: '3.5mm',
                left: '3.5mm',
                right: '3.5mm',
                bottom: '3.5mm',
                border: '1.6px solid rgba(212, 175, 55, 0.65)',
                borderRadius: '8mm',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '5.5mm',
                left: '5.5mm',
                right: '5.5mm',
                bottom: '5.5mm',
                border: '0.8px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '6mm',
                pointerEvents: 'none',
              }}
            />

            {/* Cabeçalho do Convite: Logo discreta no topo e subtítulo dourado */}
            <div
              style={{
                textAlign: 'center',
                position: 'relative',
                zIndex: 10,
                marginTop: '1mm',
                marginBottom: '1mm',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8mm' }}>
                <img
                  src={officialLogoImg}
                  alt="CoffeeCast 4.0"
                  style={{
                    width: '32mm',
                    maxHeight: '14mm',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))',
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: '7.5pt',
                  textTransform: 'uppercase',
                  letterSpacing: '2.5px',
                  color: '#F3E5AB',
                  fontWeight: 700,
                  margin: '0.5mm 0 0 0',
                }}
              >
                Convite Oficial de Participação
              </p>
            </div>

            {/* Card Central com Foto em Grande Destaque (Protagonista), Logo da Empresa e Apresentação */}
            <div
              style={{
                backgroundColor: 'rgba(42, 15, 35, 0.88)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                borderRadius: '6mm',
                padding: '4mm 4.5mm',
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
                margin: '1mm 0',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              {/* Logomarca da empresa no topo direito */}
              {previewConvite.logomarca_empresa && (
                <div
                  style={{
                    position: 'absolute',
                    top: '3mm',
                    right: '3.5mm',
                    zIndex: 20,
                  }}
                >
                  <img
                    src={getFileUrl(previewConvite, previewConvite.logomarca_empresa)}
                    alt="Empresa Convidada"
                    style={{
                      height: '8.5mm',
                      maxWidth: '26mm',
                      objectFit: 'contain',
                      borderRadius: '2mm',
                      backgroundColor: '#FFFFFF',
                      padding: '0.8mm',
                      border: '0.8px solid rgba(212, 175, 55, 0.5)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              )}

              {/* Foto da pessoa convidada como protagonista visual com medalhão de bordas duplas douradas e proporção 1:1 sem corte */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '2mm',
                  paddingTop: '1mm',
                  overflow: 'visible',
                }}
              >
                <div
                  className="invite-photo-wrapper"
                  style={{
                    position: 'relative',
                    width: '44mm',
                    height: '44mm',
                    minWidth: '44mm',
                    minHeight: '44mm',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible',
                    flexShrink: 0,
                  }}
                >
                  {/* Contêiner de moldura externa e anéis dourados com proporção circular perfeita */}
                  <div
                    className="invite-photo-container"
                    style={{
                      position: 'relative',
                      width: '40mm',
                      height: '40mm',
                      minWidth: '40mm',
                      minHeight: '40mm',
                      maxWidth: '40mm',
                      maxHeight: '40mm',
                      aspectRatio: '1 / 1',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFF2B2 0%, #D4AF37 50%, #B38612 100%)',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
                      padding: '1.2mm',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      flexShrink: 0,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    }}
                  >
                    <div
                      className="invite-photo-inner"
                      style={{
                        width: '100%',
                        height: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        backgroundColor: '#2A0F23',
                        padding: '1mm',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact',
                      }}
                    >
                      {/* A foto é inserida como um PNG DataURL pré-recortado no canvas (transparente por fora).
                          Dessa forma, mesmo que o leitor de PDF do celular ou WhatsApp ignore border-radius/clip-path,
                          a imagem já é fisicamente redonda e nunca vaza para fora do círculo nem desconfigura. */}
                      <img
                        className="invite-photo-img"
                        src={
                          circularGuestPhotoUrl ||
                          (previewConvite.foto_convidado
                            ? getFileUrl(previewConvite, previewConvite.foto_convidado)
                            : 'https://img.usecurling.com/ppl/256?gender=female')
                        }
                        alt={previewConvite.nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          objectPosition: '50% 18%',
                          border: '1.2px solid rgba(212, 175, 55, 0.85)',
                          display: 'block',
                          boxSizing: 'border-box',
                          flexShrink: 0,
                          backgroundColor: 'transparent',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        }}
                      />
                    </div>
                  </div>

                  {/* Estrela dourada no canto inferior direito do medalhão sem fundo/caixa quadrada */}
                  <div
                    className="invite-photo-star"
                    style={{
                      position: 'absolute',
                      bottom: '0.8mm',
                      right: '0.8mm',
                      backgroundColor: 'transparent',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))',
                      zIndex: 10,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    }}
                  >
                    <Sparkles
                      style={{
                        width: '5.2mm',
                        height: '5.2mm',
                        color: '#FFF2B2',
                        fill: 'rgba(212, 175, 55, 0.35)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rótulo de Convidado/Convidada e Nome */}
              <div style={{ marginBottom: '1.2mm' }}>
                <span
                  style={{
                    fontSize: '7.5pt',
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
                    fontSize: '17pt',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    margin: '0.8mm 0 0 0',
                    lineHeight: 1.15,
                    letterSpacing: '-0.2px',
                  }}
                >
                  {previewConvite.nome}
                </h2>
              </div>

              {/* Linha separadora dourada */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2mm',
                  margin: '1.5mm auto',
                  maxWidth: '40mm',
                }}
              >
                <div
                  style={{ height: '1px', flex: 1, backgroundColor: 'rgba(212, 175, 55, 0.8)' }}
                />
                <div
                  style={{
                    width: '1.6mm',
                    height: '1.6mm',
                    borderRadius: '50%',
                    backgroundColor: '#D4AF37',
                  }}
                />
                <div
                  style={{ height: '1px', flex: 1, backgroundColor: 'rgba(212, 175, 55, 0.8)' }}
                />
              </div>

              {/* Texto de apresentação com quebras de linha e espaçamentos fiéis no PDF A5 */}
              {(() => {
                const textLen = (previewConvite.apresentacao || '').length
                const lineCount = (previewConvite.apresentacao || '').split('\n').length
                // Tipografia proporcional adaptativa para garantir que não estoure a página A5
                let fontSize = '8.8pt'
                let lineHeight = 1.35
                let marginY = '2mm auto 3mm auto'
                if (textLen > 400 || lineCount > 7) {
                  fontSize = '6.8pt'
                  lineHeight = 1.2
                  marginY = '1mm auto 1.5mm auto'
                } else if (textLen > 280 || lineCount > 5) {
                  fontSize = '7.5pt'
                  lineHeight = 1.25
                  marginY = '1.2mm auto 2mm auto'
                } else if (textLen > 180 || lineCount > 3) {
                  fontSize = '8.2pt'
                  lineHeight = 1.3
                  marginY = '1.5mm auto 2.5mm auto'
                }

                return (
                  <p
                    className="invite-presentation-text"
                    style={{
                      fontSize,
                      lineHeight,
                      color: 'rgba(250, 248, 245, 0.95)',
                      fontWeight: 300,
                      fontStyle: 'italic',
                      margin: marginY,
                      maxWidth: '116mm',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      textAlign: 'center',
                    }}
                  >
                    "{previewConvite.apresentacao}"
                  </p>
                )
              })()}

              {/* Informações de Gravação */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2.5mm',
                  paddingTop: '2.5mm',
                  borderTop: '0.8px solid rgba(212, 175, 55, 0.35)',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(75, 30, 63, 0.75)',
                    padding: '2mm 2.5mm',
                    borderRadius: '2.5mm',
                    border: '0.8px solid rgba(212, 175, 55, 0.25)',
                    textAlign: 'center',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  <span
                    style={{
                      fontSize: '6.5pt',
                      color: '#D4AF37',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '0.6mm',
                    }}
                  >
                    Data da Gravação
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '9.5pt',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      display: 'block',
                    }}
                  >
                    {formatDateBR(previewConvite.data_gravacao)}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(75, 30, 63, 0.75)',
                    padding: '2mm 2.5mm',
                    borderRadius: '2.5mm',
                    border: '0.8px solid rgba(212, 175, 55, 0.25)',
                    textAlign: 'center',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  <span
                    style={{
                      fontSize: '6.5pt',
                      color: '#D4AF37',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '0.6mm',
                    }}
                  >
                    Horário Marcado
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '9.5pt',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      display: 'block',
                    }}
                  >
                    {previewConvite.horario}
                  </span>
                </div>
              </div>

              {/* Endereço da gravação e Localização no PDF de Impressão (A5) */}
              {(Boolean(previewConvite.endereco_gravacao?.trim()) ||
                Boolean(previewConvite.link_localizacao?.trim())) && (
                <div
                  style={{
                    marginTop: '2.5mm',
                    backgroundColor: 'rgba(75, 30, 63, 0.85)',
                    padding: '2.5mm 3mm',
                    borderRadius: '2.5mm',
                    border: '0.8px solid rgba(212, 175, 55, 0.35)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  {previewConvite.endereco_gravacao?.trim() && (
                    <div
                      style={{
                        marginBottom: previewConvite.link_localizacao?.trim() ? '1.8mm' : 0,
                        textAlign: 'center',
                        width: '100%',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '6.5pt',
                          color: '#D4AF37',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          display: 'block',
                          marginBottom: '0.6mm',
                          textAlign: 'center',
                        }}
                      >
                        Endereço da gravação:
                      </span>
                      <span
                        style={{
                          fontSize: '8pt',
                          color: '#FFFFFF',
                          lineHeight: 1.3,
                          display: 'block',
                          textAlign: 'center',
                        }}
                      >
                        {previewConvite.endereco_gravacao}
                      </span>
                    </div>
                  )}

                  {previewConvite.link_localizacao?.trim() && (
                    <div
                      style={{
                        paddingTop: previewConvite.endereco_gravacao?.trim() ? '1.8mm' : 0,
                        borderTop: previewConvite.endereco_gravacao?.trim()
                          ? '0.6px solid rgba(212, 175, 55, 0.25)'
                          : 'none',
                        textAlign: 'center',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '6.5pt',
                          color: '#D4AF37',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          display: 'block',
                          marginBottom: '1mm',
                          textAlign: 'center',
                        }}
                      >
                        Localização
                      </span>
                      <a
                        href={previewConvite.link_localizacao}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1.4mm 4mm',
                          backgroundColor: 'rgba(212, 175, 55, 0.22)',
                          border: '0.9px solid #D4AF37',
                          borderRadius: '2mm',
                          color: '#FFF2B2',
                          fontSize: '7.5pt',
                          fontWeight: 700,
                          textDecoration: 'none',
                          letterSpacing: '0.4px',
                          margin: '0 auto',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        }}
                      >
                        📍 Ver no Google Maps
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rodapé do Convite */}
            <div
              style={{
                textAlign: 'center',
                position: 'relative',
                zIndex: 10,
                marginBottom: '1.5mm',
                marginTop: '1mm',
              }}
            >
              <p
                style={{
                  fontSize: '8.5pt',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  color: '#F3E5AB',
                  margin: '0 0 1mm 0',
                }}
              >
                "Aqui o café pode até esfriar, mas o papo nunca! ☕️"
              </p>
              <p
                style={{
                  fontSize: '7pt',
                  color: 'rgba(250, 248, 245, 0.7)',
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
