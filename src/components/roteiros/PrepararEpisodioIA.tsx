// src/components/roteiros/PrepararEpisodioIA.tsx
// Botão de destaque "PREPARAR EPISÓDIO COM IA" da tela de Roteiros.
// Fluxo em 3 etapas: (1) Preparação do Roteiro — Nine analisa os dados do convidado vindos
// do formulário público /roteiro (biografia, empresa, tema prioritário, temas a evitar —
// NUNCA inventa dados); (2) Divulgação Inteligente (seção A, componente real);
// (3) Criação da Capa (Estúdio Criativo, com fotografia e logomarcas ORIGINAIS do convidado).

import { useMemo, useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { RoteiroConvidadoRecord } from '@/types/database'
import { DivulgacaoInteligente } from '@/components/roteiros/DivulgacaoInteligente'
import { gerarSugestaoRoteiroIA } from '@/components/roteiros/prepararEpisodioIA'
import type { DivulgacaoRoteiroDados } from '@/components/roteiros/DivulgacaoInteligente'
import { Coffee, Loader2, ShieldCheck, Sparkles, Wand2 } from 'lucide-react'

type Etapa = 0 | 1 | 2

const ETAPAS: { id: Etapa; titulo: string; desc: string }[] = [
  {
    id: 0,
    titulo: 'Preparação do Roteiro',
    desc: 'A Nine analisa os dados reais do convidado (bio, empresa, temas) e sugere ajustes para revisão.',
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

export function PrepararEpisodioIA({ open, onOpenChange, roteiro, onRoteiroAtualizado }: Props) {
  const { toast } = useToast()
  const [etapa, setEtapa] = useState<Etapa>(0)
  const [sugestao, setSugestao] = useState('')
  const [gerando, setGerando] = useState(false)

  const reset = () => {
    setEtapa(0)
    setSugestao('')
    setGerando(false)
  }

  const handleAbrir = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const convidado = useMemo(() => roteiro, [roteiro])

  const temasEvitar = useMemo(() => {
    if (!convidado) return [] as string[]
    const cru =
      (convidado.tema_evitar && String(convidado.tema_evitar)) ||
      (convidado.tema_evitar_extra && String(convidado.tema_evitar_extra)) ||
      ''
    return cru
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }, [convidado])

  const gerarPreparacao = async () => {
    if (!convidado) return
    setGerando(true)
    try {
      const res = await gerarSugestaoRoteiroIA(convidado)
      setSugestao(res.texto)
      toast.success(
        'Análise da Nine concluída — revise as sugestões antes de aplicar ao roteiro final.',
      )
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Não foi possível preparar a análise agora. Tente novamente.',
      )
    } finally {
      setGerando(false)
    }
  }

  const divulgacaoInicial: DivulgacaoRoteiroDados | null = useMemo(() => {
    if (!convidado) return null
    return {
      roteiroId: convidado.id,
      nome: convidado.nome,
      empresa: convidado.tem_empresa ? convidado.nome_empresa || '' : '',
      tema: convidado.tema_enfatizar || '',
      roteiroTexto: convidado.roteiro_final_texto || '',
    }
  }, [convidado])

  if (!roteiro) return null

  return (
    <Dialog open={open} onOpenChange={handleAbrir}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] bg-marfim border-2 border-dourado rounded-3xl p-5 sm:p-7 flex flex-col">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="font-serif text-xl sm:text-2xl text-vinho flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-dourado-dark" />
            Preparar Episódio com IA
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-xs text-vinho/70">
              Fluxo guiado em 3 etapas — Preparação do Roteiro, Divulgação Inteligente e Criação da
              Capa. Nenhum dado do convidado é inventado e nenhum roteiro aprovado é substituído
              automaticamente.
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de etapas */}
        <div className="mt-1 space-y-2">
          <Progress value={((etapa + 1) / 3) * 100} className="h-1.5 bg-vinho/10" />
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
                    ? 'border-dourado bg-white shadow-sm'
                    : 'border-vinho/15 bg-white/60 hover:bg-white',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                      etapa === e.id ? 'bg-vinho text-dourado' : 'bg-vinho/15 text-vinho',
                    )}
                  >
                    {e.id + 1}
                  </span>
                  <span className="text-[11px] font-bold text-vinho truncate">{e.titulo}</span>
                </div>
                <p className="text-[10px] text-vinho/60 mt-1 line-clamp-2">{e.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[52vh] pr-2 mt-4">
          {/* ETAPA 1 — Preparação do Roteiro */}
          {etapa === 0 && convidado && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-vinho/10 p-4 space-y-2 shadow-2xs">
                <h4 className="text-xs font-bold text-vinho flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-dourado-dark" /> Dados do convidado (formulário
                  público /roteiro)
                </h4>
                <div className="text-[11px] text-vinho/80 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <p>
                    <strong>Nome:</strong> {convidado.nome}
                  </p>
                  <p>
                    <strong>Empresa:</strong>{' '}
                    {convidado.tem_empresa ? convidado.nome_empresa || '—' : '—'}
                  </p>
                  <p className="sm:col-span-2">
                    <strong>Tema prioritário:</strong> {convidado.tema_enfatizar || 'não informado'}
                  </p>
                  {convidado.biografia && (
                    <p className="sm:col-span-2 line-clamp-4">
                      <strong>Biografia:</strong> {convidado.biografia}
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
                  As sugestões da Nine são <strong>somente para revisão</strong> — nada substitui o
                  roteiro aprovado. Temas marcados pelo convidado como "evitar" nunca são sugeridos.
                </p>
              </div>

              <Button
                type="button"
                disabled={gerando}
                onClick={gerarPreparacao}
                className="w-full bg-vinho hover:bg-vinho-light text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2"
              >
                {gerando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-dourado" /> A Nine está analisando
                    os dados do convidado...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-dourado" /> Analisar dados e sugerir estrutura
                    de roteiro
                  </>
                )}
              </Button>

              {sugestao && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-dourado/20 text-vinho border border-dourado/40 text-[10px]">
                      Sugestão da Nine (editável)
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px] border-vinho/20 text-vinho hover:bg-vinho/10"
                        onClick={() => {
                          navigator.clipboard.writeText(sugestao)
                          toast.success('Sugestão copiada.')
                        }}
                      >
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        onClick={() => {
                          if (onRoteiroAtualizado && convidado) {
                            onRoteiroAtualizado({
                              ...convidado,
                              roteiro_sugerido_nine: sugestao,
                            })
                          }
                          toast.success('Sugestão registrada para revisão no editor.')
                        }}
                      >
                        Guardar para revisão
                      </Button>
                    </div>
                  </div>
                  <textarea
                    rows={10}
                    value={sugestao}
                    onChange={(e) => setSugestao(e.target.value)}
                    className="w-full bg-white border border-vinho/20 rounded-2xl p-3.5 text-xs text-vinho focus:ring-2 focus:ring-dourado font-sans leading-relaxed"
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  disabled={!sugestao}
                  onClick={() => setEtapa(1)}
                  className="bg-dourado-dark hover:bg-dourado text-white font-bold rounded-xl h-10 px-5 text-xs"
                >
                  Avançar para Divulgação →
                </Button>
              </div>
            </div>
          )}

          {/* ETAPA 2 — Divulgação Inteligente (seção real, mesma da tela) */}
          {etapa === 1 && divulgacaoInicial && (
            <DivulgacaoInteligente
              roteiro={divulgacaoInicial}
              onRoteiroAtualizado={onRoteiroAtualizado}
              compacto
            />
          )}

          {/* ETAPA 3 — Criação da Capa (Estúdio Criativo real) */}
          {etapa === 2 && divulgacaoInicial && (
            <DivulgacaoInteligente
              roteiro={divulgacaoInicial}
              onRoteiroAtualizado={onRoteiroAtualizado}
              compacto
              focoCapa
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
