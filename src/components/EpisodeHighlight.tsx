import React, { useState, useEffect } from 'react'
import { Play, Sparkles, Youtube, Radio, Calendar, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatExternalUrl } from '@/lib/openUrl'
import type { EpisodioRecord } from '@/types/database'

interface EpisodeHighlightProps {
  totalCount: number
  periodicidadeTexto: string
  latestEpisode: EpisodioRecord | null
  onWatchEpisode: (ep: EpisodioRecord) => void
}

/**
 * Animated counter that smoothly increments from 0 to target count.
 */
function AnimatedCounter({ target }: { target: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (target <= 0) {
      setDisplayValue(0)
      return
    }

    const duration = 1200 // ms
    const startTime = performance.now()
    const startVal = 0

    let animationFrameId: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic curve for natural feel
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (target - startVal) * easeOut)
      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick)
      } else {
        setDisplayValue(target)
      }
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [target])

  return <span>{displayValue}</span>
}

export const EpisodeHighlight: React.FC<EpisodeHighlightProps> = ({
  totalCount,
  periodicidadeTexto,
  latestEpisode,
  onWatchEpisode,
}) => {
  const periodicidade =
    periodicidadeTexto && periodicidadeTexto.trim()
      ? periodicidadeTexto
      : 'Todo sábado às 10h sai um episódio novo no canal do YouTube!'

  return (
    <div className="w-full relative">
      {/* Card principal com identidade refinada: Vinho escuro, borda dourada, detalhes em marfim */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#38142e] via-[#4b1e3f] to-[#2a0e24] border-2 border-dourado/50 shadow-2xl p-6 sm:p-8 lg:p-10 text-marfim">
        {/* Efeitos de iluminação sutil de fundo */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-dourado/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-rose-brand/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* LADO ESQUERDO / STATS: Contador dinâmico de episódios */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-[11px] sm:text-xs font-semibold uppercase tracking-wider shadow-xs">
              <Radio className="w-3.5 h-3.5 text-dourado animate-pulse" />
              <span>No Ar • Temporada Oficial</span>
            </div>

            <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap justify-center lg:justify-start">
              <span className="font-serif text-5xl sm:text-6xl lg:text-7xl font-extrabold gold-text-gradient drop-shadow-sm tracking-tight leading-none">
                <AnimatedCounter target={totalCount} />
              </span>
              <div className="flex flex-col">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {totalCount === 1 ? 'episódio' : 'episódios'}
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-dourado/90">
                  no ar
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-marfim/80 font-light max-w-sm leading-relaxed">
              Histórias autênticas, cafés especiais e conversas que transformam, disponíveis para
              você maratonar.
            </p>
          </div>

          {/* DIVISOR VERTICAL (DESKTOP) / HORIZONTAL (MOBILE) */}
          <div className="hidden lg:block lg:col-span-1 h-28 border-r border-dourado/25 mx-auto" />
          <div className="block lg:hidden w-full border-t border-dourado/20" />

          {/* LADO DIREITO: Periodicidade + Botão do Último Episódio */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
            {/* Aviso de Periodicidade (editável no admin) */}
            <div className="flex items-start gap-3 bg-white/5 border border-dourado/30 rounded-2xl p-3.5 sm:p-4 w-full backdrop-blur-xs">
              <div className="w-10 h-10 rounded-xl bg-dourado/20 border border-dourado/40 flex items-center justify-center shrink-0 text-dourado">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-dourado block">
                  Periodicidade Oficial
                </span>
                <p className="text-xs sm:text-sm text-white font-medium leading-snug">
                  {periodicidade}
                </p>
              </div>
            </div>

            {/* Destaque do Último Episódio Gravado (com botão inteligente) */}
            {latestEpisode && (
              <div className="w-full space-y-2.5">
                <div className="flex items-center justify-center lg:justify-between gap-2 text-[11px] sm:text-xs text-marfim/70">
                  <span className="inline-flex items-center gap-1.5 font-medium text-dourado-light">
                    <Sparkles className="w-3.5 h-3.5 text-dourado" />
                    Último episódio lançado: <strong>#{latestEpisode.numero}</strong>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-marfim/60">
                    <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    Canal do YouTube
                  </span>
                </div>

                <p
                  className="font-serif text-sm sm:text-base font-bold text-white line-clamp-1 text-center lg:text-left"
                  title={latestEpisode.titulo}
                >
                  {latestEpisode.titulo}
                </p>

                {latestEpisode.youtube_url?.trim() ? (
                  <a
                    href={formatExternalUrl(latestEpisode.youtube_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      onWatchEpisode(latestEpisode)
                    }}
                    className="w-full gold-gradient text-vinho hover:opacity-95 font-bold py-3.5 min-h-[48px] text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] border border-dourado group cursor-pointer no-underline text-center"
                  >
                    <Play className="w-4 h-4 fill-vinho text-vinho shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Clique aqui para assistir nosso novo episódio do canal 🎬</span>
                  </a>
                ) : (
                  <Button
                    type="button"
                    onClick={() => onWatchEpisode(latestEpisode)}
                    className="w-full gold-gradient text-vinho hover:opacity-95 font-bold py-3.5 min-h-[48px] text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] border border-dourado group cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-vinho text-vinho shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Clique aqui para assistir nosso novo episódio do canal 🎬</span>
                  </Button>
                )}
              </div>
            )}

            {!latestEpisode && totalCount === 0 && (
              <div className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-xs text-marfim/70 flex items-center justify-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-dourado" />
                  Novos episódios serão publicados em breve!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default EpisodeHighlight
