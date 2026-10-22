// src/components/admin/RoteiroEditorModal.tsx
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Printer,
  Edit3,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  parseRoteiroTextToStructure,
  formatStructureToRoteiroText,
  cleanMarkdownSyntax,
} from '@/lib/roteiroParser'
import { downloadRoteiroOficialPdf } from '@/lib/roteiroPdfExporter'
import { AuditoriaService } from '@/services/auditoria'
import type {
  RoteiroConvidadoRecord,
  RoteiroEstruturado,
  RoteiroBloco,
  RoteiroBlocoPergunta,
  RoteiroStatusAprovacao,
} from '@/types/database'

interface RoteiroEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roteiro: RoteiroConvidadoRecord | null
  todosRoteiros?: RoteiroConvidadoRecord[]
  onRoteiroSaved?: (roteiroAtualizado: RoteiroConvidadoRecord) => void
}

export function RoteiroEditorModal({
  open,
  onOpenChange,
  roteiro,
  todosRoteiros = [],
  onRoteiroSaved,
}: RoteiroEditorModalProps) {
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [modoVisualizacao, setModoVisualizacao] = useState<'blocos' | 'texto'>('blocos')

  // Estado dos campos editáveis do Roteiro
  const [statusAprovacao, setStatusAprovacao] = useState<RoteiroStatusAprovacao>('rascunho')
  const [tituloEpisodio, setTituloEpisodio] = useState('')
  const [subtituloEpisodio, setSubtituloEpisodio] = useState('')
  const [dataGravacao, setDataGravacao] = useState('')
  const [horarioGravacao, setHorarioGravacao] = useState('')
  const [empresaCargo, setEmpresaCargo] = useState('')
  const [enderecoEstudio, setEnderecoEstudio] = useState('')
  const [linkGps, setLinkGps] = useState('')
  const [textoCompleto, setTextoCompleto] = useState('')
  const [blocos, setBlocos] = useState<RoteiroBloco[]>([])

  // Bloco expandido no editor para ergonomia
  const [blocoExpandidoId, setBlocoExpandidoId] = useState<string | null>(null)

  // Inicializar estado ao abrir ou mudar roteiro
  useEffect(() => {
    if (!roteiro || !open) return

    const statusInicial: RoteiroStatusAprovacao =
      roteiro.status_aprovacao || (roteiro.roteiro_final_texto ? 'em_revisao' : 'rascunho')
    setStatusAprovacao(statusInicial)

    const rawTexto = roteiro.roteiro_final_texto || ''
    const cleanTexto = cleanMarkdownSyntax(rawTexto)
    setTextoCompleto(cleanTexto)

    // Se já tiver roteiro estruturado salvo no registro
    const estSalvo = roteiro.roteiro_estruturado

    if (estSalvo && estSalvo.blocos && estSalvo.blocos.length > 0) {
      setTituloEpisodio(
        roteiro.subtitulo_episodio ||
          estSalvo.tituloEpisodio ||
          roteiro.roteiro_conjunto_titulo ||
          `Episódio Especial — ${roteiro.nome}`,
      )
      setSubtituloEpisodio(estSalvo.subtituloEpisodio || 'O poder de transformar pessoas')
      setDataGravacao(roteiro.data_gravacao || estSalvo.dataGravacaoFormatada || '')
      setHorarioGravacao(roteiro.horario_gravacao || estSalvo.horarioGravacao || '19H')
      setEmpresaCargo(
        roteiro.empresa_cargo_personalizado ||
          estSalvo.empresaCargoRotulo ||
          (roteiro.tem_empresa && roteiro.nome_empresa
            ? `${roteiro.nome_empresa} | ${roteiro.sobre_empresa || ''}`
            : ''),
      )
      setEnderecoEstudio(
        roteiro.endereco_personalizado ||
          estSalvo.enderecoEstudio ||
          'Estúdio Filme | R. Ulisses Sarmento, 24, salas 407 e 408\nPraia do Suá, Vitória - ES | CEP 29052-320',
      )
      setLinkGps(
        roteiro.link_gps_personalizado ||
          estSalvo.linkGps ||
          'https://www.google.com/maps/dir/?api=1&destination=R.+Ulisses+Sarmento,+24,+Praia+do+Su%C3%A1,+Vit%C3%B3ria,+ES',
      )
      setBlocos(estSalvo.blocos)
      if (estSalvo.blocos.length > 0) {
        setBlocoExpandidoId(estSalvo.blocos[0].id)
      }
    } else {
      // Fazer o parse a partir do texto
      const parsed = parseRoteiroTextToStructure(cleanTexto, {
        tituloFallback:
          roteiro.roteiro_conjunto_titulo || `Histórias que Inspiram — ${roteiro.nome}`,
        subtituloFallback: 'O poder de transformar pessoas',
        convidadosRotulo: roteiro.nome,
        empresaCargo:
          roteiro.tem_empresa && roteiro.nome_empresa
            ? `${roteiro.nome_empresa} | ${roteiro.sobre_empresa || ''}`
            : '',
        dataGravacao: roteiro.data_gravacao || '',
        horarioGravacao: roteiro.horario_gravacao || '19H',
        endereco: roteiro.endereco_personalizado,
        linkGps: roteiro.link_gps_personalizado,
      })

      setTituloEpisodio(parsed.tituloEpisodio)
      setSubtituloEpisodio(parsed.subtituloEpisodio)
      setDataGravacao(parsed.dataGravacaoFormatada || '')
      setHorarioGravacao(parsed.horarioGravacao || '19H')
      setEmpresaCargo(parsed.empresaCargoRotulo || '')
      setEnderecoEstudio(parsed.enderecoEstudio || '')
      setLinkGps(parsed.linkGps || '')
      setBlocos(parsed.blocos)
      if (parsed.blocos.length > 0) {
        setBlocoExpandidoId(parsed.blocos[0].id)
      }
    }
  }, [roteiro, open])

  if (!roteiro) return null

  // Convidados envolvidos (caso individual ou conjunto via roteiros_vinculados_ids)
  const idsVinculados = roteiro.roteiros_vinculados_ids || []
  const convidadosAdicionais = todosRoteiros.filter((r) => idsVinculados.includes(r.id))
  const todosConvidadosRoteiro = [roteiro, ...convidadosAdicionais]
  const nomesConvidados = todosConvidadosRoteiro.map((c) => c.nome)

  // Cálculo da duração total
  const duracaoTotalCalculada = blocos.reduce((acc, b) => acc + (Number(b.duracaoMinutos) || 0), 0)

  // Montagem do objeto estruturado completo sincronizado
  const getObjetoEstruturado = (): RoteiroEstruturado => {
    return {
      tituloEpisodio,
      subtituloEpisodio,
      convidadosRotulo: nomesConvidados.join(' & '),
      empresaCargoRotulo: empresaCargo,
      dataGravacaoFormatada: dataGravacao,
      horarioGravacao: horarioGravacao,
      duracaoTotalMinutos: duracaoTotalCalculada + 5,
      duracaoRoteiroMinutos: duracaoTotalCalculada,
      duracaoRespiroMinutos: 5,
      enderecoEstudio,
      linkGps,
      avisoEstacionamento: 'ESTACIONAMENTO PRÓPRIO DISPONÍVEL AOS CONVIDADOS',
      blocos,
    }
  }

  // Manipulação de blocos
  const handleAtualizarBloco = (id: string, updates: Partial<RoteiroBloco>) => {
    setBlocos((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  const handleRemoverBloco = (id: string) => {
    setBlocos((prev) => prev.filter((b) => b.id !== id))
  }

  const handleMoverBloco = (index: number, direcao: 'cima' | 'baixo') => {
    setBlocos((prev) => {
      const novos = [...prev]
      const targetIndex = direcao === 'cima' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= novos.length) return prev
      const temp = novos[index]
      novos[index] = novos[targetIndex]
      novos[targetIndex] = temp
      return novos
    })
  }

  const handleAdicionarBloco = () => {
    const novoNumero = String(blocos.length + 1).padStart(2, '0')
    const novoId = `bloco-${Date.now()}`
    const novoBloco: RoteiroBloco = {
      id: novoId,
      numero: novoNumero,
      titulo: 'Novo Bloco Editorial',
      duracaoMinutos: 8,
      tipo: 'perguntas',
      textoIntro: '',
      perguntas: [
        {
          numero: '01',
          texto: 'Pergunta inicial do bloco...',
          opcional: false,
        },
      ],
    }
    setBlocos((prev) => [...prev, novoBloco])
    setBlocoExpandidoId(novoId)
  }

  // Manipulação de perguntas dentro de um bloco
  const handleAtualizarPergunta = (
    blocoId: string,
    perguntaIndex: number,
    updates: Partial<RoteiroBlocoPergunta>,
  ) => {
    setBlocos((prev) =>
      prev.map((b) => {
        if (b.id !== blocoId || !b.perguntas) return b
        const novasP = [...b.perguntas]
        novasP[perguntaIndex] = { ...novasP[perguntaIndex], ...updates }
        return { ...b, perguntas: novasP }
      }),
    )
  }

  const handleAdicionarPergunta = (blocoId: string, opcional = false) => {
    setBlocos((prev) =>
      prev.map((b) => {
        if (b.id !== blocoId) return b
        const perguntasAtuais = b.perguntas || []
        const proximoNumero = String(perguntasAtuais.length + 1).padStart(2, '0')
        const novaPergunta: RoteiroBlocoPergunta = {
          numero: proximoNumero,
          texto: '',
          opcional,
        }
        return { ...b, perguntas: [...perguntasAtuais, novaPergunta] }
      }),
    )
  }

  const handleRemoverPergunta = (blocoId: string, perguntaIndex: number) => {
    setBlocos((prev) =>
      prev.map((b) => {
        if (b.id !== blocoId || !b.perguntas) return b
        const novasP = b.perguntas.filter((_, idx) => idx !== perguntaIndex)
        return { ...b, perguntas: novasP }
      }),
    )
  }

  // Alternar entre edição de blocos e texto corrido
  const alternarModo = (novoModo: 'blocos' | 'texto') => {
    if (novoModo === 'texto' && modoVisualizacao === 'blocos') {
      const estruturado = getObjetoEstruturado()
      const formatado = formatStructureToRoteiroText(estruturado)
      setTextoCompleto(formatado)
    } else if (novoModo === 'blocos' && modoVisualizacao === 'texto') {
      const parsed = parseRoteiroTextToStructure(textoCompleto, {
        tituloFallback: tituloEpisodio,
        subtituloFallback: subtituloEpisodio,
        convidadosRotulo: nomesConvidados.join(' & '),
        empresaCargo,
        dataGravacao,
        horarioGravacao,
        endereco: enderecoEstudio,
        linkGps,
      })
      setBlocos(parsed.blocos)
    }
    setModoVisualizacao(novoModo)
  }

  // Salvar no backend
  const handleSalvar = async (aprovarDiretamente = false) => {
    setSaving(true)
    try {
      const statusFinal: RoteiroStatusAprovacao = aprovarDiretamente ? 'aprovado' : statusAprovacao

      let textoParaSalvar = textoCompleto
      let estruturadoParaSalvar = getObjetoEstruturado()

      if (modoVisualizacao === 'blocos') {
        textoParaSalvar = formatStructureToRoteiroText(estruturadoParaSalvar)
      } else {
        estruturadoParaSalvar = parseRoteiroTextToStructure(textoCompleto, {
          tituloFallback: tituloEpisodio,
          subtituloFallback: subtituloEpisodio,
          convidadosRotulo: nomesConvidados.join(' & '),
          empresaCargo,
          dataGravacao,
          horarioGravacao,
          endereco: enderecoEstudio,
          linkGps,
        })
      }

      // Enviar ao endpoint seguro do assistente para salvar com auditoria
      const resp = await pb.send('/backend/v1/roteiro-assistente/salvar', {
        method: 'POST',
        body: {
          roteiro_id: roteiro.id,
          roteiro_texto: textoParaSalvar,
          status_aprovacao: statusFinal,
          roteiro_estruturado: estruturadoParaSalvar,
          data_gravacao: dataGravacao,
          horario_gravacao: horarioGravacao,
          subtitulo_episodio: subtituloEpisodio,
          empresa_cargo_personalizado: empresaCargo,
          endereco_personalizado: enderecoEstudio,
          link_gps_personalizado: linkGps,
          roteiro_conjunto_titulo: tituloEpisodio,
        },
      })

      if (!resp || resp.error) {
        throw new Error(resp?.error || 'Erro ao salvar alterações no roteiro')
      }

      // Atualizar o record local
      const recordAtualizado: RoteiroConvidadoRecord = {
        ...roteiro,
        roteiro_final_texto: textoParaSalvar,
        status_aprovacao: statusFinal,
        roteiro_estruturado: estruturadoParaSalvar,
        data_gravacao: dataGravacao,
        horario_gravacao: horarioGravacao,
        subtitulo_episodio: subtituloEpisodio,
        empresa_cargo_personalizado: empresaCargo,
        endereco_personalizado: enderecoEstudio,
        link_gps_personalizado: linkGps,
      }

      setStatusAprovacao(statusFinal)
      if (onRoteiroSaved) {
        onRoteiroSaved(recordAtualizado)
      }

      toast({
        title: aprovarDiretamente ? 'Roteiro Aprovado Oficialmente!' : 'Alterações Salvas!',
        description: aprovarDiretamente
          ? 'O roteiro foi marcado como Aprovado e está pronto para gravação e PDF.'
          : 'O roteiro foi salvo com sucesso e suas edições foram preservadas.',
      })
    } catch (err: unknown) {
      console.error('Erro ao salvar roteiro:', err)
      const msg = err instanceof Error ? err.message : 'Falha ao salvar'
      toast({
        title: 'Erro ao Salvar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Exportar PDF oficial (Botão obrigatório "GERAR PDF DO ROTEIRO")
  const handleGerarPdf = async () => {
    setExportingPdf(true)
    try {
      const estruturado = getObjetoEstruturado()
      const textoFinal =
        modoVisualizacao === 'blocos' ? formatStructureToRoteiroText(estruturado) : textoCompleto

      const convidadosDetalhados = todosConvidadosRoteiro.map((c) => ({
        nome: c.nome,
        empresa: c.tem_empresa && c.nome_empresa ? c.nome_empresa : '',
        fotoUrl: c.foto ? pb.files.getURL(c, c.foto) : undefined,
        logomarcaUrl: c.logomarca ? pb.files.getURL(c, c.logomarca) : undefined,
        temaEnfatizar: c.tema_enfatizar,
      }))

      await downloadRoteiroOficialPdf({
        titulo: tituloEpisodio || roteiro.nome,
        subtitulo: subtituloEpisodio,
        convidadosNomes: nomesConvidados,
        roteiroTexto: textoFinal,
        ehConjunto: todosConvidadosRoteiro.length > 1,
        semConvidados: roteiro.nome.toLowerCase().includes('sem convidado'),
        roteiroEstruturado: estruturado,
        empresaCargo: empresaCargo,
        dataGravacao: dataGravacao,
        horarioGravacao: horarioGravacao,
        enderecoEstudio: enderecoEstudio,
        linkGps: linkGps,
        convidadosDetalhados: convidadosDetalhados,
      })

      toast({
        title: 'PDF Pronto para Impressão!',
        description:
          'A janela oficial de impressão foi aberta com a diagramação do modelo Grazi e Márcio.',
      })
    } catch (err: unknown) {
      console.error('Erro ao gerar PDF do roteiro:', err)
      const msg = err instanceof Error ? err.message : 'Falha ao gerar PDF'
      toast({
        title: 'Erro na Exportação do PDF',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setExportingPdf(false)
    }
  }

  // Regenerar roteiro do zero pela Nine com base nas respostas dos convidados
  const handleRegenerarRoteiroPelaNine = async () => {
    if (!roteiro) return
    setRegenerating(true)
    try {
      const ehConjunto = idsVinculados && idsVinculados.length > 0
      const payloadBody: Record<string, unknown> = {
        roteiro_id: roteiro.id,
      }
      if (ehConjunto) {
        payloadBody.roteiros_vinculados_ids = idsVinculados
      }

      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/roteiro-assistente`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify(payloadBody),
        },
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'A Nine não pôde regenerar o roteiro neste momento.')
      }

      const novoTexto = cleanMarkdownSyntax(data.roteiroSugerido || '')
      setTextoCompleto(novoTexto)

      // Fazer o parse dos novos blocos
      const parsed = parseRoteiroTextToStructure(novoTexto, {
        tituloFallback: tituloEpisodio || roteiro.nome,
        subtituloFallback: subtituloEpisodio || 'O poder de transformar pessoas',
        convidadosRotulo: nomesConvidados.join(' & '),
        empresaCargo,
        dataGravacao,
        horarioGravacao,
        endereco: enderecoEstudio,
        linkGps,
      })

      setTituloEpisodio(parsed.tituloEpisodio)
      setSubtituloEpisodio(parsed.subtituloEpisodio)
      setBlocos(parsed.blocos)
      if (parsed.blocos.length > 0) {
        setBlocoExpandidoId(parsed.blocos[0].id)
      }

      // Salvar imediatamente no backend para persistir a regeneração
      await pb.send('/backend/v1/roteiro-assistente/salvar', {
        method: 'POST',
        body: {
          roteiro_id: roteiro.id,
          roteiro_texto: novoTexto,
          status_aprovacao: statusAprovacao,
          roteiro_estruturado: parsed,
          data_gravacao: dataGravacao,
          horario_gravacao: horarioGravacao,
          subtitulo_episodio: parsed.subtituloEpisodio,
          empresa_cargo_personalizado: empresaCargo,
          endereco_personalizado: enderecoEstudio,
          link_gps_personalizado: linkGps,
          roteiros_vinculados_ids: idsVinculados,
          roteiro_conjunto_titulo: parsed.tituloEpisodio,
        },
      })

      // Registrar auditoria
      AuditoriaService.registrarEvento({
        tipo_acao: 'edicao',
        area_sistema: 'Roteiros & Pautas',
        descricao: `Novo roteiro regenerado do zero pela Nine para "${nomesConvidados.join(' & ')}".`,
        registro_afetado: roteiro.id,
        tabela_afetada: 'roteiros_convidados',
        resultado: 'sucesso',
        metadata: {
          roteiro_id: roteiro.id,
          convidados: nomesConvidados,
          eh_conjunto: ehConjunto,
          tamanho_novo_texto: novoTexto.length,
          agente_usado: data.agenteUsado,
        },
      }).catch((auditErr) => {
        console.warn('[RoteiroEditorModal] Erro ao auditar regeneração:', auditErr)
      })

      const recordAtualizado: RoteiroConvidadoRecord = {
        ...roteiro,
        roteiro_final_texto: novoTexto,
        roteiro_estruturado: parsed,
      }
      if (onRoteiroSaved) {
        onRoteiroSaved(recordAtualizado)
      }

      toast({
        title: 'Novo Roteiro Gerado pela Nine!',
        description:
          'A pauta foi recriada do zero com base nas respostas dos convidados no modelo oficial Grazi e Márcio.',
      })
    } catch (err: unknown) {
      console.error('Erro ao regenerar roteiro:', err)
      const msg = err instanceof Error ? err.message : 'Falha ao regenerar roteiro'
      toast({
        title: 'Erro na Regeneração',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setRegenerating(false)
      setConfirmDialogOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* CABEÇALHO DO MODAL */}
        <DialogHeader className="p-5 border-b bg-card/60 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Edit3 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <span>Editor Editorial do Roteiro</span>
                  <Badge
                    variant={
                      statusAprovacao === 'aprovado'
                        ? 'default'
                        : statusAprovacao === 'em_revisao'
                          ? 'secondary'
                          : 'outline'
                    }
                    className={
                      statusAprovacao === 'aprovado'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                        : statusAprovacao === 'em_revisao'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                          : 'text-muted-foreground'
                    }
                  >
                    {statusAprovacao === 'aprovado'
                      ? '✓ Roteiro Aprovado'
                      : statusAprovacao === 'em_revisao'
                        ? 'Em Revisão Editorial'
                        : 'Rascunho Editorial'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Edição livre de blocos, tempos e perguntas no padrão oficial de Grazi e Márcio
                  (CoffeeCast 4.0).
                </DialogDescription>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO TOPO */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* BOTÃO NOVO: GERAR NOVO ROTEIRO PELA NINE */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={regenerating || saving}
                className="gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold"
                title="Regenera uma nova pauta do zero com a Nine mantendo as respostas dos convidados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>{regenerating ? 'Nine Gerando...' : 'GERAR NOVO ROTEIRO PELA NINE'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSalvar(false)}
                disabled={saving || regenerating}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </Button>

              {statusAprovacao !== 'aprovado' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSalvar(true)}
                  disabled={saving || regenerating}
                  className="gap-1.5 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Aprovar Roteiro</span>
                </Button>
              )}

              {/* BOTÃO OBRIGATÓRIO: "GERAR PDF DO ROTEIRO" */}
              <Button
                size="sm"
                onClick={handleGerarPdf}
                disabled={exportingPdf || regenerating}
                className="gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold shadow-md shadow-amber-900/20"
              >
                <Printer className="w-4 h-4" />
                <span>GERAR PDF DO ROTEIRO</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* BARRA DE METADADOS DINÂMICOS DO EPISÓDIO */}
        <div className="px-5 py-3 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Status:</span>
              <Select
                value={statusAprovacao}
                onValueChange={(val: RoteiroStatusAprovacao) => setStatusAprovacao(val)}
              >
                <SelectTrigger className="h-7 text-xs w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="aprovado">Aprovado Oficial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Duração Prevista: <strong>{duracaoTotalCalculada} min de roteiro</strong> + 5 min
                respiro = <strong>{duracaoTotalCalculada + 5} min</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{blocos.length} blocos editoriais</span>
            </div>
          </div>

          {/* Toggle entre edição de Blocos ou Texto Livre */}
          <div className="flex items-center rounded-lg border bg-background p-0.5">
            <button
              type="button"
              onClick={() => alternarModo('blocos')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                modoVisualizacao === 'blocos'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Edição por Blocos
            </button>
            <button
              type="button"
              onClick={() => alternarModo('texto')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                modoVisualizacao === 'texto'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Texto Livre (Limpo)
            </button>
          </div>
        </div>

        {/* CORPO DE EDIÇÃO COM SCROLL */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SEÇÃO 1: INFORMAÇÕES DA CAPA E GRAVAÇÃO */}
          <div className="p-4 rounded-xl border bg-card/40 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Identidade do Episódio & Gravação (Capa do PDF)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Título Forte do Episódio:
                </label>
                <Input
                  value={tituloEpisodio}
                  onChange={(e) => setTituloEpisodio(e.target.value)}
                  placeholder="Ex: Duas histórias, um propósito"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Subtítulo de Impacto:
                </label>
                <Input
                  value={subtituloEpisodio}
                  onChange={(e) => setSubtituloEpisodio(e.target.value)}
                  placeholder="Ex: O poder de transformar pessoas"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Empresa / Cargo / Atuação:
                </label>
                <Input
                  value={empresaCargo}
                  onChange={(e) => setEmpresaCargo(e.target.value)}
                  placeholder="Ex: ORVEX | Palestras, treinamentos e liderança"
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span>Data da Gravação:</span>
                  </label>
                  <Input
                    value={dataGravacao}
                    onChange={(e) => setDataGravacao(e.target.value)}
                    placeholder="Ex: Sexta-feira, 23/10/2026"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span>Horário:</span>
                  </label>
                  <Input
                    value={horarioGravacao}
                    onChange={(e) => setHorarioGravacao(e.target.value)}
                    placeholder="Ex: 19H"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span>Endereço do Estúdio (Padrão ou Customizado):</span>
                </label>
                <Textarea
                  value={enderecoEstudio}
                  onChange={(e) => setEnderecoEstudio(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                  placeholder="Endereço do estúdio..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  <span>Link da Rota GPS para Convidados:</span>
                </label>
                <Input
                  value={linkGps}
                  onChange={(e) => setLinkGps(e.target.value)}
                  placeholder="https://www.google.com/maps/..."
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* MODO 1: EDIÇÃO ESTRUTURADA DE BLOCOS */}
          {modoVisualizacao === 'blocos' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Estrutura Editorial dos Blocos (60 Minutos)</span>
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdicionarBloco}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Bloco</span>
                </Button>
              </div>

              {blocos.map((bloco, idx) => {
                const isExpanded = blocoExpandidoId === bloco.id

                return (
                  <div
                    key={bloco.id}
                    className="rounded-xl border bg-card shadow-sm transition-all overflow-hidden"
                  >
                    {/* TOPO DO BLOCO */}
                    <div
                      className="p-3.5 bg-muted/30 border-b flex items-center justify-between gap-3 cursor-pointer select-none"
                      onClick={() => setBlocoExpandidoId(isExpanded ? null : bloco.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          {bloco.numero || String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-semibold text-sm truncate">{bloco.titulo}</span>
                        <Badge
                          variant="outline"
                          className="text-xs font-bold text-amber-700 border-amber-300"
                        >
                          {bloco.duracaoMinutos} MINUTOS
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === 0}
                          onClick={() => handleMoverBloco(idx, 'cima')}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={idx === blocos.length - 1}
                          onClick={() => handleMoverBloco(idx, 'baixo')}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoverBloco(bloco.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => setBlocoExpandidoId(isExpanded ? null : bloco.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* CONTEÚDO EXPANDIDO DO BLOCO */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="text-xs font-medium text-foreground mb-1 block">
                              Título do Bloco:
                            </label>
                            <Input
                              value={bloco.titulo}
                              onChange={(e) =>
                                handleAtualizarBloco(bloco.id, {
                                  titulo: e.target.value,
                                })
                              }
                              className="h-8 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground mb-1 block">
                              Duração (Minutos):
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              value={bloco.duracaoMinutos}
                              onChange={(e) =>
                                handleAtualizarBloco(bloco.id, {
                                  duracaoMinutos: parseInt(e.target.value, 10) || 5,
                                })
                              }
                              className="h-8 text-xs font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground mb-1 block">
                              Tipo Editorial:
                            </label>
                            <Select
                              value={bloco.tipo}
                              onValueChange={(
                                val: 'abertura' | 'perguntas' | 'bate_bola' | 'encerramento',
                              ) => handleAtualizarBloco(bloco.id, { tipo: val })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="abertura">Abertura</SelectItem>
                                <SelectItem value="perguntas">Perguntas</SelectItem>
                                <SelectItem value="bate_bola">Bate-Bola</SelectItem>
                                <SelectItem value="encerramento">Encerramento (Legado)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Texto de Introdução / Narração da Abertura */}
                        <div>
                          <label className="text-xs font-medium text-foreground mb-1 block">
                            Texto de Condução / Apresentação (Leitura Natural das Apresentadoras):
                          </label>
                          <Textarea
                            value={bloco.textoIntro || ''}
                            onChange={(e) =>
                              handleAtualizarBloco(bloco.id, {
                                textoIntro: cleanMarkdownSyntax(e.target.value),
                              })
                            }
                            rows={3}
                            className="text-xs leading-relaxed"
                            placeholder="Texto corrido em parágrafos para leitura calorosa na bancada..."
                          />
                        </div>

                        {/* Bloco de Perguntas */}
                        {bloco.tipo === 'perguntas' && (
                          <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                Perguntas Estratégicas ({bloco.perguntas?.length || 0}):
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAdicionarPergunta(bloco.id, false)}
                                  className="h-7 text-xs gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Pergunta</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAdicionarPergunta(bloco.id, true)}
                                  className="h-7 text-xs gap-1 border-amber-300 text-amber-800 dark:text-amber-300"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Pergunta Opcional ("Se houver espaço")</span>
                                </Button>
                              </div>
                            </div>

                            {bloco.perguntas && bloco.perguntas.length > 0 ? (
                              <div className="space-y-2">
                                {bloco.perguntas.map((p, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className={`p-2.5 rounded-lg border text-xs space-y-2 ${
                                      p.opcional
                                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                                        : 'bg-background'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="font-mono font-bold text-amber-600">
                                          {p.numero}.
                                        </span>
                                        {p.opcional ? (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] font-bold text-amber-800 bg-amber-100 border-amber-300"
                                          >
                                            Se houver espaço:
                                          </Badge>
                                        ) : (
                                          <Input
                                            value={p.direcionadaPara || ''}
                                            onChange={(e) =>
                                              handleAtualizarPergunta(bloco.id, pIdx, {
                                                direcionadaPara: e.target.value,
                                              })
                                            }
                                            placeholder="Para quem (ex: Márcio, Grasiele, Ambos)"
                                            className="h-6 text-[11px] w-[180px]"
                                          />
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                        onClick={() => handleRemoverPergunta(bloco.id, pIdx)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>

                                    <Textarea
                                      value={p.texto}
                                      onChange={(e) =>
                                        handleAtualizarPergunta(bloco.id, pIdx, {
                                          texto: cleanMarkdownSyntax(e.target.value),
                                        })
                                      }
                                      rows={2}
                                      className="text-xs resize-none"
                                      placeholder="Pergunta elaborada..."
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic text-center py-2">
                                Nenhuma pergunta neste bloco ainda. Clique acima para adicionar.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bloco de Bate-Bola */}
                        {bloco.tipo === 'bate_bola' && (
                          <div className="space-y-3 pt-2 border-t">
                            <label className="text-xs font-bold text-foreground block">
                              Itens de Resposta Rápida (1 por linha):
                            </label>
                            <Textarea
                              value={(bloco.itensBateBola || []).join('\n')}
                              onChange={(e) =>
                                handleAtualizarBloco(bloco.id, {
                                  itensBateBola: e.target.value
                                    .split('\n')
                                    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
                                    .filter(Boolean),
                                })
                              }
                              rows={5}
                              className="text-xs font-mono"
                              placeholder="• Quem é mais organizado?&#10;• Quem é mais exigente?&#10;• Quem é mais emocional?"
                            />

                            <div>
                              <label className="text-xs font-medium text-foreground mb-1 block">
                                Pergunta Especial Final do Bate-Bola:
                              </label>
                              <Input
                                value={bloco.perguntaEspecialFinal || ''}
                                onChange={(e) =>
                                  handleAtualizarBloco(bloco.id, {
                                    perguntaEspecialFinal: e.target.value,
                                  })
                                }
                                placeholder="Pergunta especial para cada um..."
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* Bloco de Encerramento (Legado) */}
                        {bloco.tipo === 'encerramento' && (
                          <div className="space-y-3 pt-2 border-t">
                            <div>
                              <label className="text-xs font-bold text-foreground mb-1 block">
                                Pergunta Marcante sobre LEGADO:
                              </label>
                              <Textarea
                                value={bloco.perguntaEspecialFinal || ''}
                                onChange={(e) =>
                                  handleAtualizarBloco(bloco.id, {
                                    perguntaEspecialFinal: cleanMarkdownSyntax(e.target.value),
                                  })
                                }
                                rows={2}
                                className="text-xs font-semibold text-amber-900 dark:text-amber-300"
                                placeholder="Pergunta especial de legado..."
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-foreground mb-1 block">
                                Reflexão Final Conectada ao Episódio (Parágrafos de Fechamento):
                              </label>
                              <Textarea
                                value={(bloco.paragrafosEncerramento || []).join('\n\n')}
                                onChange={(e) =>
                                  handleAtualizarBloco(bloco.id, {
                                    paragrafosEncerramento: e.target.value
                                      .split('\n\n')
                                      .map((p) => cleanMarkdownSyntax(p))
                                      .filter(Boolean),
                                  })
                                }
                                rows={4}
                                className="text-xs"
                                placeholder="Parágrafos de reflexão final da bancada..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* MODO 2: TEXTO LIVRE LIMPO */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Editor de Texto Corrido (Livre de Símbolos de Markdown):
                </span>
                <span className="text-xs text-muted-foreground">
                  Ao salvar, o sistema mantém os textos perfeitamente limpos para exportação.
                </span>
              </div>
              <Textarea
                value={textoCompleto}
                onChange={(e) => setTextoCompleto(cleanMarkdownSyntax(e.target.value))}
                rows={20}
                className="font-mono text-xs leading-relaxed p-4 bg-muted/20"
                placeholder="Roteiro em texto limpo..."
              />
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-4 border-t bg-card/60 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-muted-foreground">
            {nomesConvidados.length > 1
              ? `Roteiro Conjunto (${nomesConvidados.join(' & ')})`
              : `Roteiro Individual: ${roteiro.nome}`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={regenerating || saving}
              className="gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-300 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>{regenerating ? 'Nine Gerando...' : 'GERAR NOVO ROTEIRO PELA NINE'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSalvar(false)}
              disabled={saving || regenerating}
              className="gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </Button>
            <Button
              size="sm"
              onClick={handleGerarPdf}
              disabled={exportingPdf || regenerating}
              className="gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>GERAR PDF DO ROTEIRO</span>
            </Button>
          </div>
        </div>

        {/* DIÁLOGO DE CONFIRMAÇÃO DE REGENERAÇÃO */}
        {confirmDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-background border-2 border-amber-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Gerar Novo Roteiro pela Nine?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Aviso de substituição do conteúdo atual
                  </p>
                </div>
              </div>

              <div className="text-xs text-foreground/85 leading-relaxed bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-2">
                <p>
                  Tem certeza de que deseja gerar um <strong>novo roteiro do zero</strong> com a
                  Nine?
                </p>
                <p>
                  O roteiro atual será <strong>substituído</strong> por uma nova versão estruturada
                  a partir das respostas originais dos convidados ({nomesConvidados.join(' & ')}),
                  seguindo o padrão oficial de Grazi e Márcio (sem perguntas de café e com texto
                  100% limpo).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialogOpen(false)}
                  disabled={regenerating}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRegenerarRoteiroPelaNine}
                  disabled={regenerating}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
                >
                  {regenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando Novo Roteiro...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Confirmar e Gerar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
