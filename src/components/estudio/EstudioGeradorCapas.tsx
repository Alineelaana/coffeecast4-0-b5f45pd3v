// src/components/estudio/EstudioGeradorCapas.tsx
// Aba 1 do Estúdio Criativo IA — Gerador de Capas (CoffeeCast 4.0)
// Motor gráfico real (src/lib/estudioMotor.ts) + Template Mestre Oficial "Premium Dourado".
// Preservação de fotografias/logomarcas: a IA NUNCA recria rostos ou marcas — são composição real.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { pb } from '@/lib/pocketbase/client'
import {
  comporCapa,
  exportarCapa,
  baixarDataUrl,
  dataUrlParaBlob,
  nomeArquivoCapa,
  templateMestrePremiumDourado,
  ESTILOS_TEMPLATE,
  RESOLUCOES,
  type EstudioCapaInput,
  type EstudioConvidado,
  type ResolucaoId,
} from '@/lib/estudioMotor'
import { EstudioService, type CapaTemplateRecord, urlArquivoCapa } from '@/services/estudio'

interface EpisodioOpcao {
  id: string
  titulo: string
  numero?: string | number
  convidados: EstudioConvidado[]
}

interface Props {
  preset?: {
    episodio?: EpisodioOpcao | null
    tituloCapa?: string
    tituloThumbnail?: string
    templateId?: string
  } | null
}

type EpisodioRaw = Record<string, unknown>

function urlArquivo(record: unknown, campo: string): string {
  try {
    return pb.files.getURL(record as Record<string, unknown>, campo)
  } catch (_) {
    return ''
  }
}

export default function EstudioGeradorCapas({ preset }: Props) {
  const { toast } = useToast()
  const [episodios, setEpisodios] = useState<EpisodioOpcao[]>([])
  const [templates, setTemplates] = useState<CapaTemplateRecord[]>([])
  const [buscaEpisodio, setBuscaEpisodio] = useState('')
  const [episodioSel, setEpisodioSel] = useState<EpisodioOpcao | null>(null)
  const [semEpisodio, setSemEpisodio] = useState(false)
  const [templateSel, setTemplateSel] = useState<string>('')
  const [tituloCapa, setTituloCapa] = useState('')
  const [tituloThumbnail, setTituloThumbnail] = useState('')
  const [orientacoes, setOrientacoes] = useState('')
  const [convidados, setConvidados] = useState<EstudioConvidado[]>([])
  const [gerando, setGerando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [capaGerada, setCapaGerada] = useState<string>('')
  const [salvando, setSalvando] = useState(false)
  const previewRef = useRef<HTMLImageElement>(null)
  const inputFotosRef = useRef<HTMLInputElement>(null)
  const inputLogosRef = useRef<HTMLInputElement>(null)
  const convidadoFotoIdx = useRef<number | null>(null)

  // ---------- carregamento inicial ----------
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const eps = await pb.collection('episodios').getList(1, 80, { sort: '-created' })
        const itens = eps.items as unknown as EpisodioRaw[]
        const mapeados: EpisodioOpcao[] = await Promise.all(
          itens.map(async (e) => {
            const convidados = await carregarConvidadosDoEpisodio(String(e.id))
            return {
              id: String(e.id),
              titulo: String(
                e.titulo || e.titulo_episodio || `Episódio ${String(e.id).slice(0, 6)}`,
              ),
              numero: e.numero as string | number | undefined,
              convidados,
            }
          }),
        )
        if (!vivo) return
        setEpisodios(mapeados)
      } catch (_) {
        /* episódios indisponíveis — usuário pode criar capa sem episódio */
      }
      try {
        const tpl = await EstudioService.templates.listar(['status = "ativo"'])
        if (!vivo) return
        setTemplates(tpl.items)
        const mestre = tpl.items.find((t) => t.mestre && t.bloqueado)
        setTemplateSel(mestre ? mestre.id : tpl.items[0]?.id || '')
      } catch (_) {
        if (!vivo) return
        setTemplateSel('')
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  // preset vindo da Divulgação Inteligente (Roteiros) ou do botão "Abrir no Estúdio"
  useEffect(() => {
    if (!preset) return
    if (preset.episodio) {
      setEpisodioSel(preset.episodio)
      setSemEpisodio(false)
      setConvidados(preset.episodio.convidados || [])
    }
    if (preset.tituloCapa) setTituloCapa(preset.tituloCapa)
    if (preset.tituloThumbnail) setTituloThumbnail(preset.tituloThumbnail)
  }, [preset])

  // ---------- helpers ----------
  async function carregarConvidadosDoEpisodio(epId: string): Promise<EstudioConvidado[]> {
    try {
      const res = await pb.collection('roteiros_convidados').getList(1, 20, {
        filter: `episodio_id = "${epId}"`,
        sort: 'created',
      })
      return (res.items as unknown as Record<string, unknown>[]).map((f) => ({
        nome: String(f.nome_convidado || f.nome || ''),
        nomeExibicao: String(f.nome_exibicao || ''),
        empresa: String(f.empresa || f.projeto || ''),
        foto: f.foto_convidado
          ? urlArquivo(f, 'foto_convidado')
          : f.foto
            ? urlArquivo(f, 'foto')
            : '',
        logo: f.logo_convidado
          ? urlArquivo(f, 'logo_convidado')
          : f.logo
            ? urlArquivo(f, 'logo')
            : '',
        ordem: Number(f.ordem || 0),
      }))
    } catch (_) {
      return []
    }
  }

  function selecionarEpisodio(id: string) {
    if (id === '__sem__') {
      setSemEpisodio(true)
      setEpisodioSel(null)
      setConvidados([])
      return
    }
    setSemEpisodio(false)
    const ep = episodios.find((e) => e.id === id) || null
    setEpisodioSel(ep)
    setConvidados(ep ? ep.convidados.map((c) => ({ ...c })) : [])
    if (ep && !tituloCapa) setTituloCapa(ep.titulo)
  }

  function adicionarConvidado() {
    setConvidados((prev) => [
      ...prev,
      { nome: '', nomeExibicao: '', empresa: '', foto: '', logo: '', ordem: prev.length },
    ])
  }

  function atualizarConvidado(i: number, campo: keyof EstudioConvidado, valor: string) {
    setConvidados((prev) => prev.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c)))
  }

  function removerConvidado(i: number) {
    setConvidados((prev) => prev.filter((_, idx) => idx !== i))
  }

  function moverConvidado(i: number, dir: -1 | 1) {
    setConvidados((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const copia = [...prev]
      ;[copia[i], copia[j]] = [copia[j], copia[i]]
      return copia
    })
  }

  function processarArquivos(
    arquivos: FileList | null,
    alvo: 'foto' | 'logo',
    indiceConvidado: number | null,
  ) {
    if (!arquivos || !arquivos.length) return
    const novos = Array.from(arquivos).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type),
    )
    if (!novos.length) {
      toast({
        title: 'Formato inválido',
        description: 'Use JPG, PNG ou WEBP.',
        variant: 'destructive',
      })
      return
    }
    novos.forEach((f, k) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = String(reader.result)
        if (alvo === 'foto' && indiceConvidado !== null) {
          atualizarConvidado(indiceConvidado, 'foto', dataUrl)
        } else if (alvo === 'logo' && indiceConvidado !== null) {
          atualizarConvidado(indiceConvidado, 'logo', dataUrl)
        } else if (alvo === 'foto') {
          setConvidados((prev) => {
            const copia = [...prev]
            const idx = convidadoFotoIdx.current
            if (idx !== null && copia[idx]) {
              copia[idx] = { ...copia[idx], foto: dataUrl }
            } else if (copia[k]) {
              copia[k] = { ...copia[k], foto: dataUrl }
            } else {
              copia.push({ nome: '', foto: dataUrl, logo: '', ordem: copia.length })
            }
            return copia
          })
        } else {
          setConvidados((prev) => {
            const copia = [...prev]
            if (copia[k]) copia[k] = { ...copia[k], logo: dataUrl }
            else copia.push({ nome: '', foto: '', logo: dataUrl, ordem: copia.length })
            return copia
          })
        }
      }
      reader.readAsDataURL(f)
    })
  }

  const podeGerar = useMemo(
    () =>
      !gerando &&
      (tituloCapa.trim() ||
        tituloThumbnail.trim() ||
        episodioSel ||
        convidados.some((c) => c.nome)),
    [gerando, tituloCapa, tituloThumbnail, episodioSel, convidados],
  )

  // ---------- geração da capa (motor gráfico real; sem chamada de API de imagem) ----------
  async function gerarCapa() {
    if (!podeGerar) return
    setGerando(true)
    try {
      const templateSelRec = templates.find((t) => t.id === templateSel)
      const input: EstudioCapaInput = {
        episodioTitulo: episodioSel?.titulo || '',
        tituloCapa: tituloCapa.trim() || tituloThumbnail.trim(),
        tituloThumbnail: tituloThumbnail.trim(),
        convidados: convidados.filter((c) => c.nome || c.foto || c.logo),
        templateNome: templateSelRec?.nome || 'CoffeeCast 4.0 — Premium Dourado',
        templateJson:
          templateSelRec?.template_json &&
          (templateSelRec.template_json as { camadas?: unknown[] }).camadas
            ? (templateSelRec.template_json as EstudioCapaInput['templateJson'])
            : null,
        orientacoes: orientacoes,
      }
      const res = await comporCapa(input, 'base')
      setCapaGerada(res.dataUrl)
      if (res.avisos.length) {
        toast({ title: 'Capa gerada com avisos', description: res.avisos.join(' ') })
      } else {
        toast({
          title: 'Capa gerada!',
          description: 'Revise a prévia e faça o download ou salve no episódio.',
        })
      }
    } catch (err) {
      toast({
        title: 'Erro ao gerar capa',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerando(false)
    }
  }

  // ---------- exportações ----------
  async function baixar(resolucao: ResolucaoId, formato: 'png' | 'jpg') {
    if (!capaGerada) return
    setExportando(true)
    try {
      const templateSelRec = templates.find((t) => t.id === templateSel)
      const input: EstudioCapaInput = {
        episodioTitulo: episodioSel?.titulo || '',
        tituloCapa: tituloCapa.trim() || tituloThumbnail.trim(),
        tituloThumbnail: tituloThumbnail.trim(),
        convidados: convidados.filter((c) => c.nome || c.foto || c.logo),
        templateJson:
          templateSelRec?.template_json &&
          (templateSelRec.template_json as { camadas?: unknown[] }).camadas
            ? (templateSelRec.template_json as EstudioCapaInput['templateJson'])
            : null,
      }
      const res = await exportarCapa(input, resolucao, formato)
      baixarDataUrl(res.dataUrl, res.nome)
      if (res.redimensionado) {
        toast({
          title: 'Download iniciado',
          description: `A imagem foi redimensionada para ${RESOLUCOES[resolucao].w}×${RESOLUCOES[resolucao].h}.`,
        })
      } else {
        toast({ title: 'Download iniciado', description: res.nome })
      }
    } catch (err) {
      toast({ title: 'Erro no download', description: String(err), variant: 'destructive' })
    } finally {
      setExportando(false)
    }
  }

  function baixarZip() {
    if (!capaGerada) return
    toast({
      title: 'Baixando resoluções',
      description: 'Os arquivos PNG/JPG nas 3 resoluções serão baixados em sequência.',
    })
    ;(async () => {
      await baixar('youtube_hd', 'png')
      await baixar('full_hd', 'jpg')
      await baixar('tv_4k', 'jpg')
    })()
  }

  // ---------- salvar no episódio (histórico/versão) ----------
  async function salvarCapa(status: 'rascunho' | 'oficial') {
    if (!capaGerada) return
    setSalvando(true)
    try {
      const blob = dataUrlParaBlob(capaGerada)
      const nome = nomeArquivoCapa(tituloCapa || episodioSel?.titulo || 'capa', 'png')
      const rec = await EstudioService.capas.criar({
        episodio_id: semEpisodio ? '' : episodioSel?.id || '',
        roteiro_id: '',
        titulo: tituloCapa.trim() || tituloThumbnail.trim(),
        titulo_thumbnail: tituloThumbnail.trim(),
        template_id: templateSel || '',
        template_nome:
          templates.find((t) => t.id === templateSel)?.nome || 'CoffeeCast 4.0 — Premium Dourado',
        convidados: convidados as unknown as Record<string, unknown>[],
        resolucao: '1280x720',
        status,
        oficial: status === 'oficial',
        usuario: pb.authStore.record?.email || '',
        dados_ia: { orientacoes, origem: 'estudio' },
      })
      await EstudioService.capas.enviarArquivo(rec.id, blob, nome)
      toast({
        title: status === 'oficial' ? 'Capa oficial salva!' : 'Rascunho salvo!',
        description: 'A capa está na Biblioteca Criativa (Minhas Capas) com histórico de versão.',
      })
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: String(err), variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const epFiltrados = episodios.filter((e) =>
    buscaEpisodio.trim() ? e.titulo.toLowerCase().includes(buscaEpisodio.toLowerCase()) : true,
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      {/* Coluna esquerda: configuração */}
      <div className="space-y-5">
        <Card className="border-0 shadow-md">
          <CardContent className="space-y-4 p-5">
            <div>
              <Label className="text-sm font-semibold">Episódio</Label>
              <Select
                value={semEpisodio ? '__sem__' : episodioSel?.id || ''}
                onValueChange={selecionarEpisodio}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o episódio…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__sem__">➕ Criar capa sem episódio</SelectItem>
                  {epFiltrados.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                placeholder="🔍 Buscar episódio por título…"
                value={buscaEpisodio}
                onChange={(ev) => setBuscaEpisodio(ev.target.value)}
              />
              {episodioSel && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {episodioSel.convidados.length} convidado(s) carregado(s) com fotos, empresas e
                  logomarcas do episódio.
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-semibold">Template</Label>
              <Select value={templateSel} onValueChange={setTemplateSel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                      {t.mestre ? ' ★ (Mestre Oficial)' : ''}
                      {t.bloqueado ? ' 🔒' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                O Template Mestre Oficial <strong>CoffeeCast 4.0 — Premium Dourado</strong> é o
                padrão; elementos bloqueados preservam a identidade visual.
              </p>
            </div>

            <div>
              <Label htmlFor="titulo-capa" className="text-sm font-semibold">
                Título da capa
              </Label>
              <Input
                id="titulo-capa"
                className="mt-1"
                placeholder="Ex.: HISTÓRIAS QUE INSPIRAM"
                value={tituloCapa}
                onChange={(ev) => setTituloCapa(ev.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Quebras, tamanho e alinhamento são ajustados automaticamente pelo motor gráfico.
              </p>
            </div>

            <div>
              <Label htmlFor="titulo-thumb" className="text-sm font-semibold">
                Título da thumbnail (opcional)
              </Label>
              <Input
                id="titulo-thumb"
                className="mt-1"
                maxLength={40}
                placeholder="Ex.: ALÉM DO COMPORTAMENTO"
                value={tituloThumbnail}
                onChange={(ev) => setTituloThumbnail(ev.target.value)}
              />
            </div>

            {/* Convidados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Convidados da capa</Label>
                <Button type="button" size="sm" variant="outline" onClick={adicionarConvidado}>
                  + Adicionar convidado
                </Button>
              </div>
              {convidados.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum convidado. Capas sem episódio podem incluir convidados manualmente.
                </p>
              )}
              {convidados.map((c, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                    <Input
                      className="h-8 text-sm"
                      placeholder="Nome completo"
                      value={c.nome}
                      onChange={(ev) => atualizarConvidado(i, 'nome', ev.target.value)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => moverConvidado(i, -1)}
                      title="Mover para cima"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => moverConvidado(i, 1)}
                      title="Mover para baixo"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removerConvidado(i)}
                      title="Remover"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder="Nome de exibição (placa)"
                      value={c.nomeExibicao || ''}
                      onChange={(ev) => atualizarConvidado(i, 'nomeExibicao', ev.target.value)}
                    />
                    <Input
                      className="h-8 text-sm"
                      placeholder="Empresa / projeto"
                      value={c.empresa || ''}
                      onChange={(ev) => atualizarConvidado(i, 'empresa', ev.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        convidadoFotoIdx.current = i
                        inputFotosRef.current?.click()
                      }}
                    >
                      📷 {c.foto ? 'Substituir fotografia' : 'Enviar fotografia'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        convidadoFotoIdx.current = i
                        inputLogosRef.current?.click()
                      }}
                    >
                      🏷️ {c.logo ? 'Substituir logomarca' : 'Enviar logomarca'}
                    </Button>
                    {c.foto && (
                      <img
                        src={c.foto}
                        alt={c.nome}
                        className="h-10 w-10 rounded-full object-cover border"
                      />
                    )}
                    {c.logo && (
                      <img
                        src={c.logo}
                        alt="logo"
                        className="h-10 w-10 rounded border bg-white object-contain p-0.5"
                      />
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Upload múltiplo: JPG/JPEG/PNG/WEBP. Fotografias e logomarcas ORIGINAIS são
                preservadas — a IA nunca recria rostos ou marcas.
              </p>
              <input
                ref={inputFotosRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(ev) => {
                  processarArquivos(ev.target.files, 'foto', convidadoFotoIdx.current)
                  ev.target.value = ''
                }}
              />
              <input
                ref={inputLogosRef}
                type="file"
                accept="image/png,image/webp,image/jpeg,image/svg+xml"
                multiple
                className="hidden"
                onChange={(ev) => {
                  processarArquivos(ev.target.files, 'logo', convidadoFotoIdx.current)
                  ev.target.value = ''
                }}
              />
            </div>

            <div>
              <Label htmlFor="orientacoes" className="text-sm font-semibold">
                Orientações para a IA
              </Label>
              <Textarea
                id="orientacoes"
                className="mt-1 min-h-20"
                placeholder={
                  'Ex.: "Deixe o título maior", "Coloque dois convidados lado a lado", "Reduza a logomarca"…'
                }
                value={orientacoes}
                onChange={(ev) => setOrientacoes(ev.target.value)}
              />
            </div>

            <Button
              type="button"
              disabled={!podeGerar}
              onClick={gerarCapa}
              className="w-full bg-[#4B1E3F] text-white hover:bg-[#5d2650]"
            >
              {gerando ? 'Compondo capa…' : '✨ GERAR CAPA COM IA'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              O motor gráfico compõe a capa real com foto/logo/texto sobre o template — sem consumo
              de API de imagem para ajustes de título, foto ou logo.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coluna direita: prévia + exportação */}
      <div className="space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold">Prévia da capa</h3>
              <Badge
                variant="outline"
                className="bg-[#4B1E3F]/5 text-[#4B1E3F] border-[#4B1E3F]/30"
              >
                Premium Dourado
              </Badge>
            </div>
            <div className="overflow-hidden rounded-lg border bg-muted/40">
              {capaGerada ? (
                <img
                  ref={previewRef}
                  src={capaGerada}
                  alt="Prévia da capa gerada"
                  className="w-full"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-center text-xs text-muted-foreground p-6">
                  A prévia aparecerá aqui após clicar em <strong>&nbsp;GERAR CAPA COM IA</strong>.
                </div>
              )}
            </div>
            {capaGerada && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={exportando}
                    onClick={() => baixar('youtube_hd', 'png')}
                  >
                    ⬇ BAIXAR PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={exportando}
                    onClick={() => baixar('youtube_hd', 'jpg')}
                  >
                    ⬇ BAIXAR JPG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={exportando}
                    onClick={() => baixar('full_hd', 'jpg')}
                  >
                    ⬇ YOUTUBE/FULL HD
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={exportando}
                    onClick={() => baixar('tv_4k', 'jpg')}
                  >
                    ⬇ TV 4K
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={exportando}
                  onClick={baixarZip}
                >
                  ⬇ BAIXAR TODAS AS RESOLUÇÕES (conjunto)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={salvando}
                    onClick={() => salvarCapa('rascunho')}
                  >
                    💾 Salvar rascunho
                  </Button>
                  <Button
                    size="sm"
                    disabled={salvando}
                    className="bg-[#4B1E3F] text-white hover:bg-[#5d2650]"
                    onClick={() => salvarCapa('oficial')}
                  >
                    ★ Salvar como capa oficial
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Capas salvas ficam na <strong>Biblioteca Criativa</strong> com histórico de
                  versões e vínculo ao episódio{' '}
                  {episodioSel ? `#${episodioSel.id.slice(0, 6)}` : '(sem episódio)'}.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">Resoluções de exportação</p>
            <p>
              YouTube HD: {RESOLUCOES.youtube_hd.w}×{RESOLUCOES.youtube_hd.h} · TV Full HD:{' '}
              {RESOLUCOES.full_hd.w}×{RESOLUCOES.full_hd.h} · TV 4K: {RESOLUCOES.tv_4k.w}×
              {RESOLUCOES.tv_4k.h}
            </p>
            <p>
              Templates da biblioteca: {templates.length} · Estilos disponíveis:{' '}
              {ESTILOS_TEMPLATE.slice(0, 4).join(', ')}…
            </p>
            <p>
              Template Mestre bloqueado:{' '}
              {templates.some((t) => t.mestre && t.bloqueado) ? '🔒 protegido' : 'a cadastrar'}
            </p>
            <p className="pt-1">
              Elementos oficiais preservados: cabeçalho, xícara, slogan, rodapés e proporções —{' '}
              {urlArquivoCapa ? 'fotos/logos em qualidade original.' : ''}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
