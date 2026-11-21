// src/components/roteiros/DivulgacaoInteligente.tsx
// FUNCIONALIDADE 2 — "DIVULGAÇÃO INTELIGENTE COM IA" integrada à tela de Roteiros existente.
// Reutiliza o MESMO agente (CoffeeCast Creative AI) e os MESMOS serviços do Estúdio Criativo IA.
// Nada é simulado: se o ChatGPT (GCHAT_GPT) não responder, o painel informa a pendência.

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { pb } from '@/lib/pocketbase/client'
import {
  EstudioService,
  gerarDivulgacaoIA,
  type DivulgacaoDados,
} from '@/services/estudio'
import { comporCapa, baixarDataUrl, RESOLUCOES, type EstudioCapaInput, type EstudioConvidado } from '@/lib/estudioMotor'

export interface DivulgacaoRoteiroDados {
  episodioId?: string
  numero?: string | number
  titulo: string
  convidados: string[]
  biografia?: string
  empresas?: string
  trajetoria?: string
  tema?: string
  perguntas?: string[]
  respostasFicha?: string
  objetivo?: string
  mensagens?: string
  textoRoteiro?: string
  convidadosEstudio?: EstudioConvidado[]
}

interface Props {
  dados: DivulgacaoRoteiroDados
  roteiroId?: string
  aberto: boolean
  onFechar: () => void
}

type SecaoKey =
  | 'titulos'
  | 'thumbnails'
  | 'descricao'
  | 'tags'
  | 'frases'
  | 'instagram'
  | 'whatsapp'
  | 'stories'
  | 'reels'
  | 'lancamento'
  | 'agradecimento'

const ROTULOS: Record<SecaoKey, string> = {
  titulos: '1️⃣ Títulos sugeridos pela IA (YouTube)',
  thumbnails: '2️⃣ Título da thumbnail (capa)',
  descricao: '3️⃣ Descrição do episódio',
  tags: '4️⃣ Tags e palavras-chave',
  frases: '5️⃣ Frases de impacto',
  instagram: '6️⃣ Divulgação — Instagram (legenda)',
  whatsapp: '6️⃣ Divulgação — WhatsApp',
  stories: '6️⃣ Divulgação — Stories',
  reels: '6️⃣ Divulgação — Reels e Shorts',
  lancamento: '6️⃣ Divulgação — Lançamento',
  agradecimento: '6️⃣ Divulgação — Agradecimento ao convidado',
}

const TONS = ['Profissional', 'Emocional', 'Inspirador', 'Descontraído', 'Institucional']

export default function DivulgacaoInteligente({ dados, roteiroId, aberto, onFechar }: Props) {
  const { toast } = useToast()
  const [gerando, setGerando] = useState(false)
  const [gerado, setGerado] = useState(false)
  const [erro, setErro] = useState('')
  const [dadosIA, setDadosIA] = useState<DivulgacaoDados | null>(null)
  const [tituloSelecionado, setTituloSelecionado] = useState('')
  const [thumbnailSel, setThumbnailSel] = useState('')
  const [edicoes, setEdicoes] = useState<Partial<Record<SecaoKey, string>>>({})
  const [salvando, setSalvando] = useState<string | null>(null)
  const [ton, setTon] = useState('Profissional')
  const [capaDataUrl, setCapaDataUrl] = useState('')
  const [capaGerando, setCapaGerando] = useState(false)
  const [estudioAberto, setEstudioAberto] = useState(false)

  const textoSecao = (k: SecaoKey): string => {
    if (!dadosIA) return ''
    if (k === 'descricao') return edicoes.descricao ?? dadosIA.descricao || ''
    if (k === 'tags') return edicoes.tags ?? dadosIA.tags.join(', ')
    if (k === 'frases') return edicoes.frases ?? dadosIA.frases.join('\n')
    return edicoes[k] ?? (dadosIA[k as 'instagram' | 'whatsapp' | 'stories' | 'reels' | 'lancamento' | 'agradecimento'] as string) || ''
  }

  function setEdicao(k: SecaoKey, v: string) {
    setEdicoes((prev) => ({ ...prev, [k]: v }))
  }

  async function gerar() {
    setGerando(true)
    setErro('')
    try {
      const res = await gerarDivulgacaoIA(
        {
          numero: dados.numero,
          titulo: dados.titulo,
          convidados: dados.convidados,
          biografia: dados.biografia || '',
          empresas: dados.empresas || '',
          trajetoria: dados.trajetoria || '',
          tema: dados.tema || '',
          perguntas: dados.perguntas || [],
          respostas_ficha: dados.respostasFicha || '',
          objetivo: dados.objetivo || '',
          mensagens: dados.mensagens || '',
          texto_roteiro: (dados.textoRoteiro || '').slice(0, 12000),
          ton,
        },
        'completo',
      )
      if (!res.sucesso || !res.dados) {
        setErro(res.mensagem || 'A IA não respondeu agora. Tente novamente em instantes.')
        toast({
          title: res.chatgptAtivo ? 'IA indisponível' : 'ChatGPT (GCHAT_GPT) não configurado',
          description: res.mensagem || 'A divulgação não foi gerada — nada foi simulado.',
          variant: 'destructive',
        })
        return
      }
      setDadosIA(res.dados)
      setTituloSelecionado(res.dados.titulos[0]?.titulo || '')
      setThumbnailSel(res.dados.titulos_thumbnail[0]?.titulo || '')
      setGerado(true)
      toast({ title: 'Divulgação gerada!', description: 'Revise, edite, copie ou salve cada material.' })
    } catch (err) {
      setErro(String(err))
    } finally {
      setGerando(false)
    }
  }

  async function copiar(texto: string, rotulo: string) {
    if (!texto) return
    try {
      await navigator.clipboard.writeText(texto)
      toast({ title: `${rotulo} copiado!` })
    } catch (_) {
      toast({ title: 'Não foi possível copiar', description: 'Selecione e copie manualmente.', variant: 'destructive' })
    }
  }

  async function salvarSecao(k: SecaoKey, valor: string) {
    if (!dados.episodioId) {
      toast({ title: 'Este roteiro não está vinculado a um episódio', description: 'Salve o roteiro/episódio primeiro.', variant: 'destructive' })
      return
    }
    setSalvando(k)
    try {
      const campo =
        k === 'descricao'
          ? 'divulgacao_descricao'
          : k === 'tags'
            ? 'divulgacao_tags'
            : k === 'frases'
              ? 'divulgacao_frases'
              : `divulgacao_${k}`
      await pb.collection('episodios').update(dados.episodioId, {
        [campo]: valor,
        divulgacao_atualizada_em: new Date().toISOString(),
        divulgacao_usuario: pb.authStore.record?.email || '',
      })
      toast({ title: 'Salvo no episódio!', description: ROTULOS[k] })
    } catch (err) {
      toast({ title: 'Erro ao salvar no episódio', description: String(err), variant: 'destructive' })
    } finally {
      setSalvando(null)
    }
  }

  async function salvarTituloDivulgacao(titulo: string, thumbnail: boolean) {
    if (!dados.episodioId) {
      toast({ title: 'Roteiro sem episódio vinculado', variant: 'destructive' })
      return
    }
    try {
      await pb.collection('episodios').update(dados.episodioId, {
        [thumbnail ? 'divulgacao_titulo_thumbnail' : 'divulgacao_titulo']: titulo,
      })
      toast({
        title: thumbnail ? 'Título da thumbnail salvo' : 'Título de divulgação salvo!',
        description: thumbnail
          ? 'Ele será usado automaticamente no Estúdio Criativo.'
          : 'O título original do roteiro foi preservado.',
      })
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: String(err), variant: 'destructive' })
    }
  }

  // ---------- capa integrada (MESMO serviço/motor do Estúdio — sem duplicação) ----------
  async function gerarCapaEpisodio() {
    setCapaGerando(true)
    try {
      const input: EstudioCapaInput = {
        episodioTitulo: dados.titulo,
        tituloCapa: thumbnailSel || tituloSelecionado || dados.titulo,
        tituloThumbnail: thumbnailSel,
        convidados: dados.convidadosEstudio || dados.convidados.map((n, i) => ({ nome: n, ordem: i })),
        templateNome: 'CoffeeCast 4.0 — Premium Dourado',
      }
      const res = await comporCapa(input, 'base')
      setCapaDataUrl(res.dataUrl)
      toast({ title: 'Capa composta!', description: 'Baixe em PNG/JPG/Full HD/4K ou salve como capa oficial.' })
    } catch (err) {
      toast({ title: 'Erro ao compor capa', description: String(err), variant: 'destructive' })
    } finally {
      setCapaGerando(false)
    }
  }

  async function baixarCapa(resolucao: 'youtube_hd' | 'full_hd' | 'tv_4k', formato: 'png' | 'jpg') {
    if (!capaDataUrl) return
    try {
      const input: EstudioCapaInput = {
        episodioTitulo: dados.titulo,
        tituloCapa: thumbnailSel || tituloSelecionado || dados.titulo,
        tituloThumbnail: thumbnailSel,
        convidados: dados.convidadosEstudio || dados.convidados.map((n, i) => ({ nome: n, ordem: i })),
      }
      const { exportarCapa } = await import('@/lib/estudioMotor')
      const res = await exportarCapa(input, resolucao, formato)
      baixarDataUrl(res.dataUrl, res.nome)
upar ao exportar.',
      })
    } catch (err) {
      toast({ title: 'Erro no download', description: String(err), variant: 'destructive' })
    }
  }

  async function salvarCapaOficial() {
    if (!capaDataUrl) return
    if (!dados.episodioId) {
      toast({ title: 'Roteiro sem episódio vinculado', variant: 'destructive' })
      return
    }
    try {
      const blob = await (await fetch(capaDataUrl)).blob()
      const rec = await EstudioService.capas.criar({
        episodio_id: dados.episodioId,
        roteiro_id: roteiroId || '',
        titulo: thumbnailSel || tituloSelecionado || dados.titulo,
        titulo_thumbnail: thumbnailSel,
        template_nome: 'CoffeeCast 4.0 — Premium Dourado',
        convidados: (dados.convidadosEstudio || []) as unknown as Record<string, unknown>[],
        resolucao: '1280x720',
        status: 'oficial',
        oficial: true,
        usuario: pb.authStore.record?.email || '',
        dados_ia: { origem: 'divulgacao_roteiros', titulo_youtube: tituloSelecionado },
      })
      await EstudioService.capas.enviarArquivo(
        rec.id,
        blob,
        `capa-coffeecast-${dados.episodioId.slice(0, 8)}.png`,
      )
      toast({ title: 'Capa oficial vinculada ao episódio!', description: 'Histórico preservado na Biblioteca Criativa.' })
    } catch (err) {
      toast({ title: 'Erro ao salvar capa', description: String(err), variant: 'destructive' })
    }
  }

  function abrirNoEstudio() {
    // dispara evento global consumido pela navegação administrativa
    window.dispatchEvent(
      new CustomEvent('coffeecast:abrir-estudio', {
        detail: {
          episodioId: dados.episodioId || null,
          tituloCapa: thumbnailSel || tituloSelecionado || dados.titulo,
          tituloThumbnail: thumbnailSel,
        },
      }),
    )
    setEstudioAberto(true)
    toast({ title: 'Abrindo no Estúdio Criativo…', description: 'Os dados do episódio foram carregados automaticamente.' })
  }

  function usarGancho() {
    if (!dadosIA?.gancho) return
    const t = dadosIA.titulos.find((x) => x.titulo === dadosIA.gancho?.sugestao_titulo_youtube)
    if (t) setTituloSelecionado(t.titulo)
    if (dadosIA.gancho.sugestao_texto_thumbnail) setThumbnailSel(dadosIA.gancho.sugestao_texto_thumbnail)
    toast({ title: 'Gancho aplicado!', description: 'Título e thumbnail atualizados com a sugestão da IA.' })
  }

  const itensKit: SecaoKey[] = ['descricao', 'tags', 'frases', 'instagram', 'whatsapp', 'stories', 'reels', 'lancamento', 'agradecimento']
  const resumoKit = useMemo(() => {
    if (!dadosIA) return []
    return itensKit.filter((k) => textoSecao(k).trim().length > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIA, edicoes])

  if (!aberto) return null

  return (
    <Card className="border-[#C9971F]/40 bg-gradient-to-b from-[#FBF6EC] to-white shadow-md">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#4B1E3F]">
              ✨ DIVULGAÇÃO INTELIGENTE COM IA
            </h3>
            <p className="text-xs text-muted-foreground">
              Análise automática do roteiro: tema, diferenciais, público, mensagens e palavras-chave — sem inventar
              fatos. Agente único compartilhado com o Estúdio Criativo IA.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={ton}
              onValueChange={setTon}
            />
            <Button
              className="bg-[#4B1E3F] text-white hover:bg-[#5d2650]"
              onClick={gerar}
              disabled={gerando}
            >
              {gerando ? 'Analisando o roteiro…' : '🤖 GERAR DIVULGAÇÃO COM IA'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onFechar}>
              ✕
            </Button>
          </div>
        </div>

        {erro && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{erro}</div>
        )}

        {!gerado && !gerando && !erro && (
          <p className="text-sm text-muted-foreground">
            Clique em <strong>GERAR DIVULGAÇÃO COM IA</strong> para analisar este roteiro e produzir títulos,
            descrição, tags, hashtags, frases de impacto e textos para redes sociais — cada material editável e
            salvável separadamente.
          </p>
        )}

        {dadosIA && (
          <div className="space-y-5">
            {/* Análise estratégica */}
            <div className="rounded-lg border bg-white/70 p-4 text-sm">
              <p className="font-semibold text-[#4B1E3F]">🔎 Análise estratégica do episódio</p>
              <p className="mt-1 text-muted-foreground">{dadosIA.analise}</p>
              {dadosIA.gancho && (
                <div className="mt-2 rounded border border-[#C9971F]/30 bg-[#FBF3DF] p-2 text-xs">
                  <p className="font-semibold">🎯 Gancho do episódio</p>
                  <p>Principal: {dadosIA.gancho.tema_principal}</p>
                  <p>Diferencial: {dadosIA.gancho.diferencial}</p>
                  <p>Gancho emocional: {dadosIA.gancho.gancho_emocional}</p>
                  <p>Gancho informativo: {dadosIA.gancho.gancho_informativo}</p>
                  <p>Curiosidade: {dadosIA.gancho.gancho_curiosidade}</p>
                  <p>
                    Sugestão YouTube: <strong>{dadosIA.gancho.sugestao_titulo_youtube}</strong>
                  </p>
                  <p>
                    Texto de capa: <strong>{dadosIA.gancho.sugestao_texto_thumbnail}</strong>
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={usarGancho}>
                    ✔ USAR GANCHO SUGERIDO
                  </Button>
                </div>
              )}
            </div>

            {/* 1 — Títulos */}
            <section className="space-y-2">
              <h4 className="font-serif font-semibold">{ROTULOS.titulos}</h4>
              {dadosIA.titulos.map((t, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-sm ${tituloSelecionado === t.titulo ? 'border-[#C9971F] bg-[#FBF3DF]' : 'bg-white'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{t.estilo}</Badge>
                    <span className="text-xs text-muted-foreground">{t.titulo.length} caracteres</span>
                  </div>
                  <p className="mt-1 font-medium">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">{t.justificativa}</p>
                  {t.palavras_chave.length > 0 && (
                    <p className="text-xs text-muted-foreground">🔑 {t.palavras_chave.join(' · ')}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setTituloSelecionado(t.titulo); void salvarTituloDivulgacao(t.titulo, false) }}>
                      ✔ USAR ESTE TÍTULO
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copiar(t.titulo, 'Título')}>
                      Copiar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={gerar} disabled={gerando}>
                      ↻ Gerar mais opções
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input className="h-8 text-sm" value={tituloSelecionado} onChange={(e) => setTituloSelecionado(e.target.value)} placeholder="Título selecionado (editável)" />
                <Button size="sm" variant="outline" onClick={() => salvarTituloDivulgacao(tituloSelecionado, false)}>
                  💾 Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O título selecionado é salvo como <strong>título de divulgação</strong> — o título original do roteiro
                não é substituído.
              </p>
            </section>

            {/* 2 — Thumbnails */}
            <section className="space-y-2">
              <h4 className="font-serif font-semibold">{ROTULOS.thumbnails}</h4>
              <div className="grid gap-2 md:grid-cols-3">
                {dadosIA.titulos_thumbnail.map((t, i) => (
                  <button
                    key={i}
                    className={`rounded-lg border p-3 text-center text-sm ${thumbnailSel === t.titulo ? 'border-[#C9971F] bg-[#FBF3DF]' : 'bg-white'}`}
                    onClick={() => { setThumbnailSel(t.titulo); void salvarTituloDivulgacao(t.titulo, true) }}
                  >
                    <span className="font-serif text-base font-bold">{t.titulo}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t.impacto} · {t.caracteres} caracteres
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input className="h-8 text-sm" value={thumbnailSel} onChange={(e) => setThumbnailSel(e.target.value)} placeholder="Texto da capa (editável)" maxLength={40} />
                <Button size="sm" variant="outline" onClick={() => salvarTituloDivulgacao(thumbnailSel, true)}>
                  💾 Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O texto escolhido vai automaticamente ao Estúdio Criativo ao criar a capa.
              </p>
            </section>

            {/* 3–6 — textos editáveis */}
            {itensKit.map((k) => (
              <section key={k} className="space-y-2">
                <h4 className="font-serif font-semibold">{ROTULOS[k]}</h4>
                {k === 'tags' && dadosIA.hashtags.length > 0 && (
                  <div className="rounded-lg border bg-white p-3 text-sm">
                    <p className="text-xs font-semibold text-muted-foreground">Hashtags (área separada)</p>
                    <p className="mt-1 text-[#4B1E3F]">{dadosIA.hashtags.join(' ')}</p>
                    <Button size="sm" variant="ghost" className="mt-1" onClick={() => copiar(dadosIA.hashtags.join(' '), 'Hashtags')}>
                      Copiar hashtags
                    </Button>
                  </div>
                )}
                <Textarea
                  className="min-h-24 bg-white text-sm"
                  value={textoSecao(k)}
                  onChange={(e) => setEdicao(k, e.target.value)}
                  placeholder={`${ROTULOS[k]} — aparecerá aqui após a geração.`}
                />
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => copiar(textoSecao(k), ROTULOS[k])}>
                    📋 Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => salvarSecao(k, textoSecao(k))} disabled={salvando === k || !dados.episodioId}>
                    {salvando === k ? 'Salvando…' : '💾 Salvar no episódio'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={gerar} disabled={gerando}>
                    ↻ Regenerar
                  </Button>
                </div>
              </section>
            ))}

            {/* 7–8 — capa do episódio integrada */}
            <section className="space-y-3 rounded-lg border border-[#4B1E3F]/20 bg-white p-4">
              <h4 className="font-serif font-semibold">7️⃣ Capa do episódio — Estúdio Criativo IA</h4>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-[#4B1E3F] text-white hover:bg-[#5d2650]" onClick={gerarCapaEpisodio} disabled={capaGerando}>
                  {capaGerando ? 'Compondo…' : '🎨 CRIAR CAPA DO EPISÓDIO COM IA'}
                </Button>
                <Button variant="outline" onClick={abrirNoEstudio} disabled={estudioAberto && false}>
                  ↗ ABRIR NO ESTÚDIO CRIATIVO
                </Button>
              </div>
              {capaDataUrl && (
                <>
                  <img src={capaDataUrl} alt="Prévia da capa" className="w-full rounded-lg border" />
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => baixarCapa('youtube_hd', 'png')}>⬇ PNG</Button>
                    <Button size="sm" variant="outline" onClick={() => baixarCapa('youtube_hd', 'jpg')}>⬇ JPG</Button>
                    <Button size="sm" variant="outline" onClick={() => baixarCapa('full_hd', 'jpg')}>⬇ FULL HD</Button>
                    <Button size="sm" variant="outline" onClick={() => baixarCapa('tv_4k', 'jpg')}>⬇ 4K</Button>
                    <Button size="sm" variant="outline" onClick={gerarCapaEpisodio} disabled={capaGerando}>↻ GERAR NOVA VERSÃO</Button>
                    <Button size="sm" className="bg-[#C9971F] text-white hover:bg-[#a87f18]" onClick={salvarCapaOficial}>
                      ★ SALVAR COMO CAPA OFICIAL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "Salvar como capa oficial" vincula ao episódio preservando o histórico na Biblioteca Criativa.
                    Resoluções: {RESOLUCOES.youtube_hd.w}×{RESOLUCOES.youtube_hd.h} · {RESOLUCOES.full_hd.w}×{RESOLUCOES.full_hd.h} · {RESOLUCOES.tv_4k.w}×{RESOLUCOES.tv_4k.h}.
                  </p>
                </>
              )}
            </section>

            {/* 9 — kit completo */}
            <section className="space-y-2 rounded-lg border-2 border-[#C9971F]/50 bg-[#FBF3DF]/60 p-4">
              <h4 className="font-serif font-semibold text-[#4B1E3F]">9️⃣ Kit completo de divulgação</h4>
              <p className="text-xs text-muted-foreground">
                Materiais apresentados separadamente — cada item é aprovável/editável/regenerável/copiável/salvável,
                sem regerar o kit todo.
              </p>
              <div className="flex flex-wrap gap-1">
                {resumoKit.map((k) => (
                  <Badge key={k} variant="secondary">✔ {ROTULOS[k]}</Badge>
                ))}
              </div>
              <Button
                className="bg-[#4B1E3F] text-white hover:bg-[#5d2650]"
                onClick={gerar}
                disabled={gerando}
              >
                {gerando ? 'Preparando kit completo…' : '🎁 GERAR KIT COMPLETO DE DIVULGAÇÃO'}
              </Button>
              <p className="text-xs text-muted-foreground">
                A geração textual não consome API de imagem. A capa é composta pelo motor gráfico — a geração de
                imagem só ocorre quando você pede explicitamente (consumo confirmado).
              </p>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
