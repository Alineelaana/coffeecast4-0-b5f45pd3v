import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Quote, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getFileUrl } from '@/lib/formatters'
import type { DepoimentoRecord } from '@/types/database'

interface TestimonialsCarouselProps {
  depoimentos: DepoimentoRecord[]
  fallbackPhotos?: string[]
}

const defaultFallbackPhotos = [
  'https://img.usecurling.com/ppl/256?gender=female&seed=201',
  'https://img.usecurling.com/ppl/256?gender=female&seed=202',
  'https://img.usecurling.com/ppl/256?gender=female&seed=203',
  'https://img.usecurling.com/ppl/256?gender=female&seed=204',
]

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  depoimentos,
  fallbackPhotos = defaultFallbackPhotos,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isScrollable, setIsScrollable] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)

  // Verifica se o carrossel tem conteúdo além da largura visível e as direções possíveis de rolagem
  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const hasOverflow = scrollWidth > clientWidth + 4
    setIsScrollable(hasOverflow)

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
  }, [checkScrollability, depoimentos])

  // Rolar suavemente com as setas
  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (!el) return

    // Rola aproximadamente a largura de um card (320px) mais o gap (20px)
    const cardWidth = 340
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
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const el = scrollContainerRef.current
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - startX) * 1.3
    el.scrollLeft = scrollLeftState - walk
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  if (!depoimentos || depoimentos.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-marfim border border-vinho/15 max-w-xl mx-auto shadow-sm">
        <p className="text-vinho/70 text-sm">
          Ainda não temos depoimentos cadastrados. Em breve novas experiências serão compartilhadas
          aqui!
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Controles superiores: dica de rolagem e botões de seta vinho/dourado */}
      <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
        <div className="flex items-center gap-2 text-xs text-vinho/70 font-light">
          <Sparkles className="w-3.5 h-3.5 text-dourado-dark" />
          <span>Arraste para os lados ou use as setas para ler mais depoimentos</span>
        </div>

        {/* Setas só são exibidas ativamente quando o conteúdo excede o container ou para manter a interface consistente */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Depoimentos anteriores"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
              canScrollLeft
                ? 'bg-vinho-dark border-dourado/60 text-dourado hover:bg-dourado hover:text-vinho hover:scale-105 shadow-md active:scale-95'
                : 'bg-vinho-dark/10 border-vinho/10 text-vinho/25 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Próximos depoimentos"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
              canScrollRight
                ? 'bg-vinho-dark border-dourado/60 text-dourado hover:bg-dourado hover:text-vinho hover:scale-105 shadow-md active:scale-95'
                : 'bg-vinho-dark/10 border-vinho/10 text-vinho/25 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Faixa carrossel horizontal de cards de depoimentos */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory scroll-smooth ${
          !isScrollable ? 'md:justify-center' : ''
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {depoimentos.map((dep, index) => {
          const photoUrl = dep.foto
            ? getFileUrl(dep, dep.foto)
            : fallbackPhotos[index % fallbackPhotos.length]

          const isHighlight = Boolean(dep.de_nossa_autoridade)

          return (
            <div
              key={dep.id || index}
              className={`flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px] snap-start rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-lg transition-all duration-300 relative group hover:-translate-y-1 ${
                isHighlight
                  ? 'bg-rose-brand/35 border-2 border-dourado'
                  : 'bg-marfim border border-vinho/15 hover:border-dourado/60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Quote className="w-7 h-7 text-dourado opacity-85 group-hover:scale-110 transition-transform" />
                  {isHighlight && (
                    <Badge className="bg-vinho text-dourado text-[10px] font-bold tracking-wide shadow-sm">
                      Visão da Equipe CoffeeCast
                    </Badge>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-vinho/85 italic leading-relaxed line-clamp-6">
                  "{dep.texto}"
                </p>
              </div>

              <div className="pt-4 border-t border-vinho/10 flex items-center gap-3">
                <img
                  src={photoUrl}
                  alt={dep.nome}
                  className="w-11 h-11 rounded-full object-cover border-2 border-dourado shadow-sm flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold text-sm text-vinho truncate">{dep.nome}</h4>
                  <span className="text-[11px] text-vinho/60 block truncate">
                    {isHighlight ? 'Convidada Homenageada' : 'Convidada do Podcast'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
