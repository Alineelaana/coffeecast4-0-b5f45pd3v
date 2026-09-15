import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, Youtube, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { openExternalUrl } from '@/lib/openUrl'
import type { EpisodioRecord } from '@/types/database'

interface EpisodesCarouselProps {
  episodios: EpisodioRecord[]
  onSelectEpisode?: (ep: EpisodioRecord) => void
}

export const EpisodesCarousel: React.FC<EpisodesCarouselProps> = ({
  episodios,
  onSelectEpisode,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startScrollLeftRef = useRef(0)
  const dragDistanceRef = useRef(0)
  const isClickPreventedRef = useRef(false)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchDistanceRef = useRef(0)

  // Tolerância de movimento (em px) para distinguir clique de arraste/drag
  const DRAG_THRESHOLD = 8

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
    // Apenas botão principal (esquerdo) inicia drag
    if (e.button !== 0) return
    const el = scrollContainerRef.current
    if (!el) return
    setIsDragging(true)
    isDraggingRef.current = true
    dragDistanceRef.current = 0
    isClickPreventedRef.current = false
    startXRef.current = e.pageX - el.offsetLeft
    startScrollLeftRef.current = el.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    const el = scrollContainerRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const diff = x - startXRef.current
    dragDistanceRef.current = Math.abs(diff)
    if (dragDistanceRef.current > DRAG_THRESHOLD) {
      isClickPreventedRef.current = true
      // Previne seleção indesejada apenas quando é arrasto real
      e.preventDefault()
    }
    el.scrollLeft = startScrollLeftRef.current - diff * 1.3
  }

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      setIsDragging(false)
      isDraggingRef.current = false
      if (dragDistanceRef.current > DRAG_THRESHOLD) {
        isClickPreventedRef.current = true
        setTimeout(() => {
          isClickPreventedRef.current = false
          dragDistanceRef.current = 0
        }, 120)
      } else {
        isClickPreventedRef.current = false
        dragDistanceRef.current = 0
      }
    }
  }

  // Detecção de touch para mobile: calcula apenas deslocamento horizontal para swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchDistanceRef.current = 0
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX
      touchStartYRef.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && e.touches.length > 0) {
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = Math.abs(currentX - touchStartXRef.current)
      const diffY =
        touchStartYRef.current !== null ? Math.abs(currentY - touchStartYRef.current) : 0

      // Se o movimento for predominantemente horizontal, registra como swipe no carrossel
      if (diffX > diffY) {
        touchDistanceRef.current = diffX
      }
    }
  }

  const handleTouchEnd = () => {
    touchStartXRef.current = null
    touchStartYRef.current = null
    // Mantém touchDistanceRef por uma fração de tempo para o onClick checar se foi swipe
    setTimeout(() => {
      touchDistanceRef.current = 0
    }, 120)
  }

  // Abre o link do YouTube diretamente contornando bloqueios de iframe/pop-up
  const openEpisodeDirectly = (ep: EpisodioRecord, e?: React.MouseEvent | React.KeyboardEvent) => {
    const rawUrl = ep.youtube_url?.trim()
    if (!rawUrl) {
      // Caso não tenha URL cadastrada, ainda permite callback alternativo se fornecido
      if (onSelectEpisode) {
        onSelectEpisode(ep)
      }
      return
    }

    const normalizedUrl =
      rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`

    openExternalUrl(normalizedUrl, e?.nativeEvent || e)
    if (onSelectEpisode) {
      onSelectEpisode(ep)
    }
  }

  // Handler seguro de clique para card ou botão
  const handleEpisodeClick = (ep: EpisodioRecord, e: React.MouseEvent) => {
    // Se o usuário estava arrastando o carrossel, ignora o clique
    if (
      isClickPreventedRef.current ||
      dragDistanceRef.current > DRAG_THRESHOLD ||
      touchDistanceRef.current > DRAG_THRESHOLD
    ) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    openEpisodeDirectly(ep, e)
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
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Faixa carrossel horizontal de cards compactos com suporte a swipe nativo e fluido */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex gap-3.5 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {episodios.map((ep) => (
          <div
            key={ep.id}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              handleEpisodeClick(ep, e)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openEpisodeDirectly(ep, e)
              }
            }}
            aria-label={`Episódio #${ep.numero}: ${ep.titulo}. Clique para assistir diretamente no YouTube.`}
            className="flex-shrink-0 w-[240px] xs:w-[260px] sm:w-[290px] md:w-[320px] snap-start bg-gradient-to-b from-vinho-dark via-vinho to-vinho-dark border border-dourado/35 hover:border-dourado rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dourado"
          >
            {/* Brilho decorativo no canto superior do card */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-dourado/10 rounded-full blur-xl group-hover:bg-dourado/20 transition-all pointer-events-none" />

            {/* Cabeçalho do Card: Número do episódio e Canal */}
            <div className="space-y-2.5 sm:space-y-3 relative z-10 pointer-events-none">
              <div className="flex items-center justify-between">
                <span className="bg-dourado/20 text-dourado text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full border border-dourado/40 inline-flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-dourado" />
                  Episódio #{ep.numero}
                </span>

                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-marfim/60 font-medium">
                  <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  YouTube
                </span>
              </div>

              {/* Título com limite equilibrado para manter altura compacta e harmoniosa */}
              <h3
                className="font-serif text-sm sm:text-lg font-bold text-white group-hover:text-dourado-light transition-colors leading-snug line-clamp-3 min-h-[3.6rem] sm:min-h-[4.2rem]"
                title={ep.titulo}
              >
                {ep.titulo}
              </h3>
            </div>

            {/* Rodapé do Card: Botão de ação oficial com área de toque mínima confortável */}
            <div className="pt-3 sm:pt-4 border-t border-white/10 mt-3 relative z-10">
              <Button
                type="button"
                onClick={(e) => {
                  // Previne bolha para evitar clique duplo com o container do card
                  e.stopPropagation()
                  handleEpisodeClick(ep, e)
                }}
                className="w-full bg-dourado hover:bg-dourado-dark text-vinho font-bold py-2.5 sm:py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-vinho shrink-0" />
                Clique aqui para assistir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
