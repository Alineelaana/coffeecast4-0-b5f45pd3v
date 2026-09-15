import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, Youtube, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EpisodioRecord } from '@/types/database'

interface EpisodesCarouselProps {
  episodios: EpisodioRecord[]
  onSelectEpisode: (ep: EpisodioRecord) => void
}

export const EpisodesCarousel: React.FC<EpisodesCarouselProps> = ({
  episodios,
  onSelectEpisode,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [hasMovedSignificantly, setHasMovedSignificantly] = useState(false)

  // Verifica se pode rolar para esquerda e direita
  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    // Tolerância de 4px para arredondamentos em telas de alta densidade
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    checkScrollability()
    el.addEventListener('scroll', checkScrollability, { passive: true })
    window.addEventListener('resize', checkScrollability)

    return () => {
      el.removeEventListener('scroll', checkScrollability)
      window.removeEventListener('resize', checkScrollability)
    }
  }, [checkScrollability, episodios])

  // Rolar suavemente com as setas
  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (!el) return

    // Rola aproximadamente a largura de um card ou cerca de 340px
    const cardWidth = 320
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  // Suporte a Drag com mouse no desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current
    if (!el) return
    setIsDragging(true)
    setStartX(e.pageX - el.offsetLeft)
    setScrollLeftState(el.scrollLeft)
    setHasMovedSignificantly(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const el = scrollContainerRef.current
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - startX) * 1.3 // Multiplicador para sensação fluida
    if (Math.abs(walk) > 5) {
      setHasMovedSignificantly(true)
    }
    el.scrollLeft = scrollLeftState - walk
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
    setTimeout(() => {
      setHasMovedSignificantly(false)
    }, 50)
  }

  if (!episodios || episodios.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-vinho-dark/60 border border-dourado/20 max-w-xl mx-auto">
        <p className="text-marfim/70 text-sm">
          Nenhum episódio cadastrado no momento. Novos episódios estarão disponíveis em breve!
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Botões de seta posicionados nas laterais */}
      <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
        <div className="flex items-center gap-2 text-xs text-marfim/70 font-light">
          <Sparkles className="w-3.5 h-3.5 text-dourado" />
          <span>Arraste para os lados ou use as setas para navegar</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Episódios anteriores"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
              canScrollLeft
                ? 'bg-vinho-dark border-dourado/60 text-dourado hover:bg-dourado hover:text-vinho hover:scale-105 shadow-md active:scale-95'
                : 'bg-vinho-dark/40 border-white/10 text-marfim/30 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Próximos episódios"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
              canScrollRight
                ? 'bg-vinho-dark border-dourado/60 text-dourado hover:bg-dourado hover:text-vinho hover:scale-105 shadow-md active:scale-95'
                : 'bg-vinho-dark/40 border-white/10 text-marfim/30 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Faixa carrossel horizontal de cards compactos */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-dourado/30 scrollbar-track-transparent select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory scroll-smooth`}
        style={{
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {episodios.map((ep) => (
          <div
            key={ep.id}
            className="flex-shrink-0 w-[260px] sm:w-[290px] md:w-[320px] snap-start bg-gradient-to-b from-vinho-dark via-vinho to-vinho-dark border border-dourado/35 hover:border-dourado rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Brilho decorativo no canto superior do card */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-dourado/10 rounded-full blur-xl group-hover:bg-dourado/20 transition-all pointer-events-none" />

            {/* Cabeçalho do Card: Número do episódio e Canal */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="bg-dourado/20 text-dourado text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border border-dourado/40 inline-flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-dourado" />
                  Episódio #{ep.numero}
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] text-marfim/60 font-medium">
                  <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  YouTube
                </span>
              </div>

              {/* Título com limite equilibrado para manter altura compacta e harmoniosa */}
              <h3
                className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-dourado-light transition-colors leading-snug line-clamp-3 min-h-[4.2rem]"
                title={ep.titulo}
              >
                {ep.titulo}
              </h3>
            </div>

            {/* Rodapé do Card: Botão de ação oficial */}
            <div className="pt-4 border-t border-white/10 mt-3 relative z-10">
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (!hasMovedSignificantly) {
                    onSelectEpisode(ep)
                  }
                }}
                className="w-full bg-dourado hover:bg-dourado-dark text-vinho font-bold py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-vinho" />
                Clique aqui para assistir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
