// src/components/roteiros/DivulgacaoInteligente.tsx
// "DIVULGAÇÃO INTELIGENTE COM IA" — integrada à tela de Roteiros (CoffeeCast 4.0).
// Reutiliza o MESMO serviço do Estúdio Criativo IA (src/services/estudio.ts → hook
// backend /backend/v1/estudio/divulgacao, ChatGPT gpt-4.1 via segredo GCHAT_GPT).
// Nada é simulado: se a IA não responder, o painel informa a pendência.
// Persistência: campos divulgacao_ia / divulgacao_gerada_em / divulgacao_historico
// da coleção roteiros_convidados (o título original do roteiro NUNCA é sobrescrito).

import { useEffect, useMemo, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { gerarDivulgacao, type DivulgacaoDados } from '@/services/estudio'
import type { RoteiroConvidadoRecord } from '@/types/database'
import EstudioGeradorCapas from '@/components/estudio/EstudioGeradorCapas'

const SLOGAN = 'Mais que conversas, histórias que transformam.'

interface Props {
  roteiro: RoteiroConvidadoRecord
  /** Esconde o cabeçalho próprio quando embutido no fluxo "Preparar Episódio com IA". */
  compacto?: boolean
  /** Notifica a tela de Roteiros quando um material é salvo no registro (para sincronizar listas). */
  onRoteiroAtualizado?: (r: RoteiroConvidadoRecord) => void
}

type CampoRede = 'instagram' | 'whatsapp' | 'stories' | 'reels' | 'lancamento' | 'agradecimento'

const REDES: { campo: CampoRede; rotulo: string }[] = [
  { campo: 'instagram', rotulo: 'Instagram (legenda)' },
  { campo: 'whatsapp', rotulo: 'WhatsApp' },
  { campo: 'stories', rotulo: 'Stories' },
  { campo: 'reels', rotulo: 'Reels / Shorts' },
  { campo: 'lancamento', rotulo: 'Lançamento do episódio' },
  { campo: 'agradecimento', rotulo: 'Agradecimento ao convidado' },
]

interface DivulgacaoSalva {
  titulo_divulgacao?: string
  titulo_thumbnail?: string
  descricao?: string
  tags?: string
  hashtags?: string
  redes?: Partial<Record<CampoRede, string>>
  atualizada_em?: string
}

function roteiroJson(roteiro: RoteiroConvidadoRecord | null | undefined): DivulgacaoSalva {
  if (!roteiro) return {}
  const raw = (roteiro as unknown as Record<string, unknown>).divulgacao_ia
  if (!raw) return {}
  try {
    return typeof raw === 'string' ? (JSON.parse(raw) as DivulgacaoSalva) : (raw as DivulgacaoSalva)
  } catch {
    return {}
  }
}

export default function DivulgacaoInteligente({ roteiro, compacto, onRoteiroAtualizado }: Props) {
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState('')
  const [dadosIA, setDadosIA] = useState<DivulgacaoDados | null>(null)
  const [salvo, setSalvo] = useState<DivulgacaoSalva>({})
  const [tituloSel, setTituloSel] = useState('')
  const [thumbSel, setThumbSel] = useState('')
  const [edicoes, setEdicoes] = useState<Partial<Record<string, string>>>({})
  const [capaAberta, setCapaAberta] = useState(false)

  // Restaura materiais já salvos neste roteiro (blindagem: roteiro pode chegar nulo
  // enquanto o painel troca de registro — nunca ler propriedades de null aqui)
  useEffect(() => {
    if (!roteiro) return
    const prev = roteiroJson(roteiro)
    setSalvo(prev)
    setTituloSel(prev.titulo_divulgacao || '')
    setThumbSel(prev.titulo_thumbnail || '')
    setEdicoes({})
    setDadosIA(null)
  }, [roteiro?.id])

  const textoRede = (campo: CampoRede): string => edicoes[campo] ?? salvo.redes?.[campo] ?? ''

  const textoCampo = (campo: 'descricao' | 'tags'): string => edicoes[campo] ?? salvo[campo] ?? ''

  async function copiar(texto: string, rotulo: string) {
    if (!texto) return
    try {
      await navigator.clipboard.writeText(texto)
      toast.success(`${rotulo} copiado!`)
    } catch {
      toast.error('Não foi possível copiar — selecione e copie manualmente.')
    }
  }

  async function gerar() {
    setGerando(true)
    try {
      const res = await gerarDivulgacao({
        roteiro_id: roteiro.id,
        titulo_episodio:
          ((roteiro as unknown as Record<string, unknown>).roteiro_conjunto_titulo as string) ||
          roteiro.tema_enfatizar ||
          roteiro.nome,
        subtitulo:
          ((roteiro as unknown as Record<string, unknown>).subtitulo_episodio as string) || '',
        roteiro_texto: (roteiro.roteiro_final_texto || '').slice(0, 12000),
        convidados: [
          {
            nome: roteiro.nome,
            empresa: roteiro.tem_empresa ? roteiro.nome_empresa : '',
            biografia: roteiro.biografia || '',
            tema: roteiro.tema_enfatizar || '',
          },
        ],
        observacoes: [
          roteiro.tem_tema_sensivel && roteiro.tema_sensivel_detalhes
            ? `Temas a EVITAR (definidos pelo convidado — nunca sugerir): ${roteiro.tema_sensivel_detalhes}`
            : '',
          `Slogan oficial que DEVE constar na descrição: "${SLOGAN}"`,
          'NUNCA mencionar temporada ("Quarta Temporada", "4ª Temporada" etc.) — o nome oficial é CoffeeCast 4.0.',
        ]
          .filter(Boolean)
          .join(' '),
        modo: 'completo',
      })
      if (!res.sucesso || !res.dados) {
        toast.error(
          res.chatgptAtivo
            ? res.mensagem || 'A IA não respondeu agora. Tente novamente em instantes.'
            : 'ChatGPT (GCHAT_GPT) não configurado no backend — a divulgação não foi gerada (nada foi simulado).',
        )
        return
      }
      setDadosIA(res.dados)
      if (!tituloSel)
        setTituloSel(res.dados.gancho?.titulo_youtube || res.dados.titulos?.[0]?.titulo || '')
      if (!thumbSel)
        setThumbSel(res.dados.gancho?.texto_thumbnail || res.dados.thumbnails?.[0]?.titulo || '')
      toast.success('Divulgação gerada! Revise, edite, copie ou salve cada material.')
    } catch (err) {
      console.error('[DivulgacaoInteligente] erro ao gerar:', err)
      toast.error('Erro ao chamar a IA de divulgação. Tente novamente em instantes.')
    } finally {
      setGerando(false)
    }
  }

  /** Persiste no roteiro (divulgacao_ia + divulgacao_gerada_em + histórico de versões). */
  async function salvarNoRoteiro(parcial: Partial<DivulgacaoSalva>, rotulo: string) {
    if (!roteiro) return
    setSalvando(rotulo)
    try {
      const atual: DivulgacaoSalva = {
        ...salvo,
        ...parcial,
        atualizada_em: new Date().toISOString(),
      }
      const historicoRaw = (roteiro as unknown as Record<string, unknown>).divulgacao_historico
      let historico: unknown[] = []
      try {
        historico = Array.isArray(historicoRaw)
          ? historicoRaw
          : typeof historicoRaw === 'string' && historicoRaw
            ? (JSON.parse(historicoRaw) as unknown[])
            : []
      } catch {
        historico = []
      }
      const usuario = pb.authStore.record?.email || 'desconhecido'
      await pb.collection('roteiros_convidados').update(roteiro.id, {
        divulgacao_ia: atual,
        divulgacao_gerada_em: new Date().toISOString(),
        divulgacao_historico: [
          ...historico.slice(-19),
          {
            em: new Date().toISOString(),
            usuario,
            item: rotulo,
            origem: 'Divulgação Inteligente (Roteiros)',
          },
        ],
      })
      setSalvo(atual)
      toast.success('Salvo no registro do roteiro!', {
        description: 'Histórico de versionamento preservado (divulgacao_historico).',
      })
    } catch (err) {
      console.error('[DivulgacaoInteligente] erro ao salvar:', err)
      toast.error('Erro ao salvar no roteiro. Verifique suas permissões.')
    } finally {
      setSalvando('')
    }
  }

  function usarTitulo(titulo: string) {
    setTituloSel(titulo)
    void salvarNoRoteiro({ titulo_divulgacao: titulo }, 'titulo_divulgacao')
  }

  function usarThumbnail(titulo: string) {
    setThumbSel(titulo)
    void salvarNoRoteiro({ titulo_thumbnail: titulo }, 'titulo_thumbnail')
  }

  const descricaoFinal = useMemo(() => {
    const base = edicoes.descricao ?? salvo.descricao ?? dadosIA?.descricao ?? ''
    if (!base) return ''
    return base.includes(SLOGAN) ? base : `${base}\n\n${SLOGAN}`
  }, [edicoes.descricao, salvo.descricao, dadosIA])

  const tituloEpisodio = tituloSel || roteiro.tema_enfatizar || roteiro.nome

  return (
    <Card className="border-[#C9971F]/40 bg-gradient-to-b from-[#FBF6EC] to-white shadow-md">
      <CardContent className="space-y-4 p-5">
        {!compacto && (
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h3 className="font-serif text-lg font-bold text-[#4B1E3F] break-words">
                ✨ DIVULGAÇÃO INTELIGENTE COM IA
              </h3>
              <p className="text-xs text-muted-foreground max-w-2xl">
                A IA analisa o roteiro e a ficha real do convidado (sem inventar dados) e produz
                títulos, descrição, tags, hashtags e textos para redes sociais — cada material
                editável, copiável e salvável no registro do episódio.
              </p>
            </div>
            <Button
              className="bg-[#4B1E3F] text-white hover:bg-[#5d2650] font-bold"
              onClick={gerar}
              disabled={gerando}
            >
              {gerando ? (
                <>
                  <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analisando o roteiro…
                </>
              ) : (
                <>🤖 GERAR DIVULGAÇÃO COM IA</>
              )}
            </Button>
          </div>
        )}

        {compacto && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Etapa 2 — Divulgação Inteligente: gere e aprove os materiais do episódio.
            </p>
            <Button
              className="bg-[#4B1E3F] text-white hover:bg-[#5d2650] font-bold"
              onClick={gerar}
              disabled={gerando}
            >
              {gerando ? 'Analisando o roteiro…' : '🤖 GERAR DIVULGAÇÃO COM IA'}
            </Button>
          </div>
        )}

        {salvo.atualizada_em && !dadosIA && (
          <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Materiais salvos neste roteiro (atualizados em{' '}
            {new Date(salvo.atualizada_em).toLocaleString('pt-BR')}). Gere novamente para novas
            opções — o que já foi aprovado permanece editável abaixo.
          </p>
        )}

        {(dadosIA || salvo.descricao || salvo.redes) && (
          <Tabs defaultValue="analise">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-white border border-[#C9971F]/30">
              <TabsTrigger value="analise" className="text-xs">
                Análise
              </TabsTrigger>
              <TabsTrigger value="titulos" className="text-xs">
                Títulos
              </TabsTrigger>
              <TabsTrigger value="seo" className="text-xs">
                Descrição e SEO
              </TabsTrigger>
              <TabsTrigger value="redes" className="text-xs">
                Redes Sociais
              </TabsTrigger>
              <TabsTrigger value="capa" className="text-xs">
                Capa com IA
              </TabsTrigger>
              <TabsTrigger value="kit" className="text-xs">
                Kit Completo
              </TabsTrigger>
            </TabsList>

            {/* 1 — ANÁLISE DO EPISÓDIO */}
            <TabsContent value="analise" className="space-y-3">
              {dadosIA?.analise ? (
                <div className="rounded-lg border bg-white/80 p-4 text-sm space-y-1.5">
                  <p className="font-semibold text-[#4B1E3F]">🔎 Análise do Episódio</p>
                  <p>
                    <strong>Tema principal:</strong> {dadosIA.analise.tema_principal || '—'}
                  </p>
                  {dadosIA.gancho?.gancho_emocional && (
                    <p>
                      <strong>Gancho emocional:</strong> {dadosIA.gancho.gancho_emocional}
                    </p>
                  )}
                  {dadosIA.gancho?.gancho_informativo && (
                    <p>
                      <strong>Gancho informativo:</strong> {dadosIA.gancho.gancho_informativo}
                    </p>
                  )}
                  {dadosIA.gancho?.gancho_curiosidade && (
                    <p>
                      <strong>Curiosidade:</strong> {dadosIA.gancho.gancho_curiosidade}
                    </p>
                  )}
                  {dadosIA.analise.publico_alvo && (
                    <p>
                      <strong>Público-alvo:</strong> {dadosIA.analise.publico_alvo}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Clique em <strong>GERAR DIVULGAÇÃO COM IA</strong> para ver a análise (tema
                  principal e ganchos emocional, informativo e de curiosidade).
                </p>
              )}
              {dadosIA?.frases && dadosIA.frases.length > 0 && (
                <div className="rounded-lg border bg-white p-3 text-sm">
                  <p className="font-semibold text-[#4B1E3F] text-xs mb-1">Frases de impacto</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-xs text-muted-foreground">
                    {dadosIA.frases.map((f, i) => (
                      <li key={i}>
                        <strong>{f.categoria}:</strong> {f.frase}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            {/* 2 — TÍTULOS */}
            <TabsContent value="titulos" className="space-y-3">
              <div className="space-y-2">
                {(dadosIA?.titulos || []).map((t, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 text-sm ${tituloSel === t.titulo ? 'border-[#C9971F] bg-[#FBF3DF]' : 'bg-white'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{t.estilo}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {t.titulo.length} caracteres
                      </span>
                    </div>
                    <p className="mt-1 font-medium">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground">{t.justificativa}</p>
                    {t.palavras_chave?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        🔑 {t.palavras_chave.join(' · ')}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => usarTitulo(t.titulo)}>
                        ✔ USAR ESTE TÍTULO
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copiar(t.titulo, 'Título')}>
                        Copiar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="h-9 text-sm flex-1 min-w-0 w-full sm:w-auto sm:min-w-64"
                  value={tituloSel}
                  onChange={(e) => setTituloSel(e.target.value)}
                  placeholder="Título de divulgação (editável)"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    salvarNoRoteiro({ titulo_divulgacao: tituloSel }, 'titulo_divulgacao')
                  }
                  disabled={salvando === 'titulo_divulgacao'}
                >
                  💾 Salvar título
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                O título escolhido é salvo como <strong>título de divulgação</strong> — o título
                original do roteiro não é substituído.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#C9971F]/20">
                <p className="text-xs font-bold text-[#4B1E3F]">Títulos curtos para thumbnail</p>
                <div className="grid gap-2 md:grid-cols-3">
                  {(dadosIA?.thumbnails || []).map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`rounded-lg border p-3 text-center text-sm ${thumbSel === t.titulo ? 'border-[#C9971F] bg-[#FBF3DF]' : 'bg-white'}`}
                      onClick={() => usarThumbnail(t.titulo)}
                    >
                      <span className="font-serif text-base font-bold">{t.titulo}</span>
                      {t.razao && (
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {t.razao}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="h-9 text-sm flex-1 min-w-0 w-full sm:w-auto sm:min-w-64"
                    value={thumbSel}
                    maxLength={40}
                    onChange={(e) => setThumbSel(e.target.value)}
                    placeholder="Texto da capa (editável)"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      salvarNoRoteiro({ titulo_thumbnail: thumbSel }, 'titulo_thumbnail')
                    }
                    disabled={salvando === 'titulo_thumbnail'}
                  >
                    💾 Salvar texto da capa
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* 3 — DESCRIÇÃO E SEO */}
            <TabsContent value="seo" className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#4B1E3F]">Descrição profissional (YouTube)</p>
                <Textarea
                  className="min-h-40 bg-white text-sm"
                  value={descricaoFinal}
                  onChange={(e) => setEdicoes((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder={`Descrição do episódio — o slogan "${SLOGAN}" é incluído automaticamente.`}
                />
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copiar(descricaoFinal, 'Descrição')}
                  >
                    📋 Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => salvarNoRoteiro({ descricao: descricaoFinal }, 'descricao')}
                    disabled={salvando === 'descricao'}
                  >
                    💾 Salvar no roteiro
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#4B1E3F]">Tags (separadas por vírgulas)</p>
                <Textarea
                  className="min-h-20 bg-white text-sm"
                  value={edicoes.tags ?? salvo.tags ?? dadosIA?.tags ?? ''}
                  onChange={(e) => setEdicoes((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3…"
                />
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copiar(edicoes.tags ?? salvo.tags ?? dadosIA?.tags ?? '', 'Tags')
                    }
                  >
                    📋 COPIAR TODAS AS TAGS
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      salvarNoRoteiro(
                        { tags: edicoes.tags ?? salvo.tags ?? dadosIA?.tags ?? '' },
                        'tags',
                      )
                    }
                    disabled={salvando === 'tags'}
                  >
                    💾 Salvar
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border bg-white p-3">
                <p className="text-xs font-bold text-[#4B1E3F]">Hashtags (área separada)</p>
                <Textarea
                  className="min-h-16 bg-white text-sm"
                  value={edicoes.hashtags ?? salvo.hashtags ?? dadosIA?.hashtags ?? ''}
                  onChange={(e) => setEdicoes((p) => ({ ...p, hashtags: e.target.value }))}
                  placeholder="#hashtag1 #hashtag2"
                />
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copiar(
                        edicoes.hashtags ?? salvo.hashtags ?? dadosIA?.hashtags ?? '',
                        'Hashtags',
                      )
                    }
                  >
                    📋 Copiar hashtags
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      salvarNoRoteiro(
                        { hashtags: edicoes.hashtags ?? salvo.hashtags ?? dadosIA?.hashtags ?? '' },
                        'hashtags',
                      )
                    }
                    disabled={salvando === 'hashtags'}
                  >
                    💾 Salvar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* 4 — REDES SOCIAIS */}
            <TabsContent value="redes" className="space-y-4">
              {REDES.map(({ campo, rotulo }) => (
                <div key={campo} className="space-y-1.5">
                  <p className="text-xs font-bold text-[#4B1E3F]">{rotulo}</p>
                  <Textarea
                    className="min-h-20 bg-white text-sm"
                    value={textoRede(campo)}
                    onChange={(e) => setEdicoes((p) => ({ ...p, [campo]: e.target.value }))}
                    placeholder={`${rotulo} — gere a divulgação para preencher.`}
                  />
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copiar(textoRede(campo), rotulo)}
                    >
                      📋 Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        salvarNoRoteiro(
                          { redes: { ...salvo.redes, [campo]: textoRede(campo) } },
                          campo,
                        )
                      }
                      disabled={salvando === campo}
                    >
                      {salvando === campo ? 'Salvando…' : '💾 Salvar'}
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* 5 — CAPA COM IA (reutiliza o Gerador do Estúdio Criativo — sem duplicação) */}
            <TabsContent value="capa" className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Abre o Gerador de Capas do Estúdio Criativo IA com o episódio, o título escolhido e
                as fotografias/logomarcas ORIGINAIS do convidado (a IA nunca recria rostos ou
                marcas). A capa gerada pode ser salva como oficial do episódio.
              </p>
              <Button
                className="bg-[#4B1E3F] text-white hover:bg-[#5d2650] font-bold"
                onClick={() => setCapaAberta(true)}
              >
                🎨 CRIAR CAPA DO EPISÓDIO COM IA
              </Button>
              <Dialog open={capaAberta} onOpenChange={setCapaAberta}>
                <DialogContent className="max-w-5xl max-h-[92dvh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-lg">
                      Capa do episódio — Estúdio Criativo IA
                    </DialogTitle>
                  </DialogHeader>
                  <EstudioGeradorCapas
                    preset={{
                      episodio: {
                        id: roteiro.id,
                        titulo:
                          tituloEpisodio ||
                          roteiro.tema_enfatizar ||
                          roteiro.nome ||
                          `Roteiro ${roteiro.id.slice(0, 6)}`,
                        convidado: roteiro.nome,
                        empresa: roteiro.tem_empresa ? String(roteiro.nome_empresa || '') : '',
                        convidados: [
                          {
                            nome: roteiro.nome,
                            nomeExibicao: String(
                              (roteiro as unknown as Record<string, unknown>)
                                .empresa_cargo_personalizado || '',
                            ),
                            empresa: roteiro.tem_empresa ? String(roteiro.nome_empresa || '') : '',
                            foto: roteiro.foto ? pb.files.getURL(roteiro, roteiro.foto) : '',
                            logo: roteiro.logomarca
                              ? pb.files.getURL(roteiro, roteiro.logomarca)
                              : '',
                            ordem: 0,
                          },
                        ],
                      },
                      tituloCapa: tituloEpisodio,
                      tituloThumbnail: thumbSel,
                    }}
                  />
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* 6 — KIT COMPLETO */}
            <TabsContent value="kit" className="space-y-2">
              <div className="rounded-lg border-2 border-[#C9971F]/50 bg-[#FBF3DF]/60 p-4 space-y-2">
                <h4 className="font-serif font-semibold text-[#4B1E3F]">
                  🎁 Kit completo de divulgação
                </h4>
                <p className="text-xs text-muted-foreground">
                  Produz de uma vez: análise, 3 títulos YouTube, 3 títulos de thumbnail, descrição
                  com slogan, tags, hashtags, frases de impacto e os 6 textos de redes sociais. Cada
                  item continua editável, copiável e salvável individualmente.
                </p>
                <Button
                  className="bg-[#4B1E3F] text-white hover:bg-[#5d2650] font-bold"
                  onClick={gerar}
                  disabled={gerando}
                >
                  {gerando ? 'Preparando kit completo…' : '🎁 GERAR KIT COMPLETO DE DIVULGAÇÃO'}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  A geração textual não consome API de imagem — a capa é composta pelo motor gráfico
                  real, sem recriar rostos ou logomarcas.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
