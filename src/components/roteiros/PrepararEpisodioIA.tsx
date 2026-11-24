// src/components/roteiros/PrepararEpisodioIA.tsx
// Painel "PREPARAR EPISÓDIO COM IA" da tela de Roteiros — fluxo guiado em 3 etapas.
// Etapa 1: a Nine analisa os dados reais do convidado (ficha do formulário /roteiro) e sugere
//          uma estrutura de roteiro — SOMENTE PARA REVISÃO, nunca substituindo o roteiro aprovado.
// Etapa 2: Divulgação Inteligente (componente real, compartilhado com a tela — sem duplicação).
// Etapa 3: Criação da Capa via Estúdio Criativo IA (fotografia e logomarcas ORIGINAIS preservadas).
// API real usada: src/services/estudio.ts (gerarDivulgacao / montarContextoRoteiro via hook
// /backend/v1/estudio/*, segredo GCHAT_GPT). Cliente PocketBase: default export apenas.

import { useEffect, useMemo, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { RoteiroConvidadoRecord } from '@/types/database'
import DivulgacaoInteligente from '@/components/roteiros/DivulgacaoInteligente'
import { gerarDivulgacao, type DivulgacaoDados } from '@/services/estudio'
import { Coffee, Loader2, ShieldAlert, ShieldCheck, Sparkles, Wand2 } from 'lucide-react'

type Etapa = 0 | 1 | 2

const ETAPAS: { id: Etapa; titulo: string; desc: string }[] = [
  {
    id: 0,
    titulo: 'Preparação do Roteiro',
    desc: 'A IA analisa os dados reais do convidado (bio, empresa, temas) e sugere ajustes para revisão.',
  },
  {
    id: 1,
    titulo: 'Divulgação Inteligente',
    desc: 'Títulos, descrição, tags, hashtags e redes sociais gerados e vinculados ao episódio.',
  },
  {
    id: 2,
    titulo: 'Criação da Capa',
    desc: 'Estúdio Criativo com fotografia e logomarcas ORIGINAIS do convidado (arquivos preservados).',
  },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  roteiro: RoteiroConvidadoRecord | null
  onRoteiroAtualizado?: (r: RoteiroConvidadoRecord) => void
}

export default function PrepararEpisodioIA({
  open,
  onOpenChange,
  roteiro,
  onRoteiroAtualizado,
}: Props) {
  const [etapa, setEtapa] = useState<Etapa>(0)
  const [sugestao, setSugestao] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erroAnalise, setErroAnalise] = useState('')
  // Mobile (leiaute tipo App): ao surgir um erro, o banner é rolado para o MEIO da
  // área visível do modal — nunca fica atrás do header sticky do painel (~96px).
  const erroRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!erroAnalise || !erroRef.current) return
    const t = window.setTimeout(() => {
      erroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => window.clearTimeout(t)
  }, [erroAnalise])

  const reset = () => {
    setEtapa(0)
    setSugestao('')
    setGerando(false)
    setErroAnalise('')
  }

  const handleAbrir = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const temasEvitar = useMemo(() => {
    // Blindagem: este componente fica montado na tela de Roteiros mesmo sem
    // roteiro selecionado (roteiro === null) — ler campos de null aqui derrubava
    // a tela inteira ("Cannot read properties of null (reading 'tema_sensivel_detalhes')").
    if (!roteiro) return []
    const cru =
      (typeof roteiro.tema_sensivel_detalhes === 'string' && roteiro.tema_sensivel_detalhes) || ''
    return cru
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }, [roteiro])

  /** Etapa 1 — análise dos dados reais via serviço do Estúdio (hook /estudio/divulgacao). */
  const gerarPreparacao = async () => {
    if (!roteiro) return
    setGerando(true)
    setErroAnalise('')
    try {
      const res = await gerarDivulgacao({
        roteiro_id: roteiro.id,
        titulo_episodio: roteiro.tema_enfatizar || roteiro.nome,
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
          'Sugira a ESTRUTURA do roteiro (apresentação, blocos, encerramento) para REVISÃO — nunca substitua o roteiro aprovado.',
          'NUNCA mencionar temporada ("Quarta Temporada", "4ª Temporada" etc.) — o nome oficial é CoffeeCast 4.0.',
        ]
          .filter(Boolean)
          .join(' '),
        modo: 'gancho',
      })
      if (!res.sucesso || !res.dados) {
        const msgFalha = res.chatgptAtivo
          ? res.mensagem || 'A IA não respondeu agora. Tente novamente em instantes.'
          : 'ChatGPT (GCHAT_GPT) não configurado no backend — nada foi simulado.'
        setErroAnalise(msgFalha)
        toast.error(msgFalha)
        return
      }
      const d: DivulgacaoDados = res.dados
      // Blindagem dupla: o hook novo aninha os ganchos em d.gancho; versões antigas da
      // produção devolviam as chaves no topo de d (sucesso true com campos vazios aqui).
      const ganchosTopo = d as unknown as Record<string, unknown>
      const g = {
        gancho_emocional:
          d.gancho?.gancho_emocional || (ganchosTopo.gancho_emocional as string) || '',
        gancho_informativo:
          d.gancho?.gancho_informativo || (ganchosTopo.gancho_informativo as string) || '',
        gancho_curiosidade:
          d.gancho?.gancho_curiosidade || (ganchosTopo.gancho_curiosidade as string) || '',
      }
      const partes = [
        g.gancho_emocional ? `GANCHO EMOCIONAL\n${g.gancho_emocional}` : '',
        g.gancho_informativo ? `\nGANCHO INFORMATIVO\n${g.gancho_informativo}` : '',
        g.gancho_curiosidade ? `\nCURIOSIDADE\n${g.gancho_curiosidade}` : '',
        d.descricao ? `\nSUGESTÃO DE ESTRUTURA / ABERTURA\n${d.descricao}` : '',
        d.frases?.length
          ? `\nFRASES DE IMPACTO\n${d.frases.map((f) => `• ${f.categoria}: ${f.frase}`).join('\n')}`
          : '',
      ].filter(Boolean)
      if (partes.length === 0) {
        // Nunca genérico demais: se o hook explicou a causa, mostrar a causa real.
        const msgVazia =
          res.mensagem ||
          'A IA respondeu, mas nenhuma sugestão utilizável foi extraída. Tente gerar novamente em instantes.'
        setErroAnalise(msgVazia)
        toast.error(msgVazia)
        return
      }
      setSugestao(partes.join('\n'))
      toast.success('Análise concluída — revise as sugestões antes de aplicar ao roteiro final.')
    } catch (e) {
      console.error('[PrepararEpisodioIA] erro na análise:', e)
      const msgErro =
        e instanceof Error
          ? e.message
          : 'Não foi possível preparar a análise agora. Tente novamente.'
      setErroAnalise(msgErro)
      toast.error(msgErro)
    } finally {
      setGerando(false)
    }
  }

  /** Guarda a sugestão em roteiro_sugerido_nine (revisável no editor) — sem tocar no aprovado. */
  const guardarParaRevisao = async () => {
    if (!roteiro || !sugestao) return
    try {
      await pb.collection('roteiros_convidados').update(roteiro.id, {
        roteiro_sugerido_nine: sugestao,
      })
      onRoteiroAtualizado?.({
        ...roteiro,
        roteiro_sugerido_nine: sugestao,
      } as RoteiroConvidadoRecord)
      toast.success('Sugestão registrada para revisão no editor (roteiro aprovado preservado).')
    } catch (err) {
      console.error('[PrepararEpisodioIA] erro ao guardar sugestão:', err)
      toast.error('Não foi possível guardar a sugestão. Verifique suas permissões.')
    }
  }

  if (!roteiro) return null

  return (
    <Dialog open={open} onOpenChange={handleAbrir}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[92dvh] bg-[#FBF6EC] border-2 border-[#C9971F] rounded-3xl p-4 sm:p-7 flex flex-col">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="font-serif text-xl sm:text-2xl text-[#4B1E3F] flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-[#8a6d1c]" />
            Preparar Episódio com IA
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-xs text-[#4B1E3F]/70">
              Fluxo guiado em 3 etapas — Preparação do Roteiro, Divulgação Inteligente e Criação da
              Capa. Nenhum dado do convidado é inventado e nenhum roteiro aprovado é substituído
              automaticamente.
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de etapas */}
        <div className="mt-1 space-y-2">
          <Progress value={((etapa + 1) / 3) * 100} className="h-1.5" />
          <div className="grid grid-cols-3 gap-2">
            {ETAPAS.map((e) => (
              <button
                key={e.id}
                type="button"
                disabled={e.id > etapa}
                onClick={() => setEtapa(e.id)}
                className={cn(
                  'text-left rounded-xl border px-3 py-2 transition-all disabled:opacity-50',
                  etapa === e.id
                    ? 'border-[#C9971F] bg-white shadow-sm'
                    : 'border-[#4B1E3F]/15 bg-white/60 hover:bg-white',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                      etapa === e.id
                        ? 'bg-[#4B1E3F] text-[#F5E9D7]'
                        : 'bg-[#4B1E3F]/15 text-[#4B1E3F]',
                    )}
                  >
                    {e.id + 1}
                  </span>
                  <span className="text-[11px] font-bold text-[#4B1E3F] leading-tight break-words whitespace-normal">
                    {e.titulo}
                  </span>
                </div>
                <p className="text-[10px] text-[#4B1E3F]/60 mt-1 line-clamp-2">{e.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-full pr-2 mt-4">
          {/* ETAPA 1 — Preparação do Roteiro */}
          {etapa === 0 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#4B1E3F]/10 p-4 space-y-2">
                <h4 className="text-xs font-bold text-[#4B1E3F] flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#8a6d1c]" /> Dados do convidado (formulário
                  público /roteiro)
                </h4>
                <div className="text-[11px] text-[#4B1E3F]/80 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <p>
                    <strong>Nome:</strong> {roteiro.nome}
                  </p>
                  <p>
                    <strong>Empresa:</strong>{' '}
                    {roteiro.tem_empresa ? roteiro.nome_empresa || '—' : '—'}
                  </p>
                  <p className="sm:col-span-2">
                    <strong>Tema prioritário:</strong> {roteiro.tema_enfatizar || 'não informado'}
                  </p>
                  {roteiro.biografia && (
                    <p className="sm:col-span-2 line-clamp-4">
                      <strong>Biografia:</strong> {roteiro.biografia}
                    </p>
                  )}
                  {temasEvitar.length > 0 && (
                    <p className="sm:col-span-2">
                      <strong>Temas a evitar:</strong> {temasEvitar.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800">
                  As sugestões são <strong>somente para revisão</strong> — nada substitui o roteiro
                  aprovado. Temas marcados pelo convidado como "evitar" nunca são sugeridos.
                </p>
              </div>

              {erroAnalise && (
                <div
                  ref={erroRef}
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 ring-2 ring-red-300/60 break-words"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    <p className="text-[11px] font-bold text-red-800">
                      A análise não foi concluída
                    </p>
                    <p className="text-[11px] text-red-700 break-words">{erroAnalise}</p>
                  </div>
                </div>
              )}

              <Button
                type="button"
                disabled={gerando}
                onClick={gerarPreparacao}
                className="w-full bg-[#4B1E3F] hover:bg-[#5d2650] text-white font-bold rounded-xl h-11 whitespace-normal text-center leading-tight px-3"
              >
                {gerando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> A IA está analisando os dados do
                    convidado...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Analisar dados e sugerir estrutura de roteiro
                  </>
                )}
              </Button>

              {sugestao && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[#C9971F]/20 text-[#4B1E3F] border border-[#C9971F]/40 text-[10px]">
                      Sugestão da IA (editável)
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px]"
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(sugestao)
                            .then(() => toast.success('Sugestão copiada.'))
                            .catch(() => toast.error('Não foi possível copiar.'))
                        }}
                      >
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        onClick={guardarParaRevisao}
                      >
                        Guardar para revisão
                      </Button>
                    </div>
                  </div>
                  <textarea
                    rows={10}
                    value={sugestao}
                    onChange={(e) => setSugestao(e.target.value)}
                    className="w-full bg-white border border-[#4B1E3F]/20 rounded-2xl p-3.5 text-xs text-[#4B1E3F] focus:ring-2 focus:ring-[#C9971F] font-sans leading-relaxed"
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  disabled={!sugestao}
                  onClick={() => setEtapa(1)}
                  className="bg-[#C9971F] hover:bg-[#b8891b] text-white font-bold rounded-xl h-10 px-5 text-xs"
                >
                  Avançar para Divulgação →
                </Button>
              </div>
            </div>
          )}

          {/* ETAPA 2 — Divulgação Inteligente (mesmo componente da tela — sem duplicação) */}
          {etapa === 1 && <DivulgacaoInteligente roteiro={roteiro} compacto />}

          {/* ETAPA 3 — Criação da Capa (Estúdio Criativo real) */}
          {etapa === 2 && <DivulgacaoInteligente roteiro={roteiro} compacto />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
