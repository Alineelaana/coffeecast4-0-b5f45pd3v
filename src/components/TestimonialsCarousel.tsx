import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Sparkles,
  Instagram,
  Play,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getFileUrl, parseInstagramHandle } from '@/lib/formatters'
import { formatExternalUrl } from '@/lib/openUrl'
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

  // Estado para armazenar quais cards estão expandidos no próprio card
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  // Estado para abrir modal elegante de leitura completa
  const [modalDepoimento, setModalDepoimento] = useState<{
    dep: DepoimentoRecord
    photoUrl: string
    isHighlight: boolean
    parsedInsta: { username: string; url: string } | null
  } | null>(null)

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

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
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Faixa carrossel horizontal de cards de depoimentos com suporte a swipe fluido touch-pan-x */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex gap-3.5 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain ${
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

          const parsedInsta = dep.instagram ? parseInstagramHandle(dep.instagram) : null

          return (
            <div
              key={dep.id || index}
              className={`flex-shrink-0 w-[270px] xs:w-[290px] sm:w-[340px] md:w-[370px] snap-start rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 sm:space-y-5 shadow-sm hover:shadow-xl transition-all duration-300 relative group hover:-translate-y-1.5 ${
                isHighlight
                  ? 'bg-rose-brand/35 border-2 border-dourado'
                  : 'bg-marfim border border-vinho/15 hover:border-dourado/60'
              }`}
            >
              {/* Cabeçalho do Convidado: Foto enaltecida (maior), nome em destaque e @ do Instagram */}
              <div className="flex items-center gap-3 sm:gap-3.5 pb-3.5 sm:pb-4 border-b border-vinho/10">
                <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full p-0.5 bg-gradient-to-tr from-dourado via-dourado-light to-dourado-dark shadow-md ring-2 ring-dourado/40">
                    <img
                      src={photoUrl}
                      alt={dep.nome}
                      className="w-full h-full rounded-full object-cover border-2 border-white shadow-inner bg-vinho/5"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold text-sm sm:text-lg text-vinho leading-tight group-hover:text-dourado-dark transition-colors">
                    {dep.nome}
                  </h4>

                  <span className="text-[10px] sm:text-[11px] text-vinho/65 font-medium block mt-0.5">
                    {dep.tipo_convidado === 'convidado'
                      ? isHighlight
                        ? 'Convidado Homenageado'
                        : 'Convidado do Podcast'
                      : isHighlight
                        ? 'Convidada Homenageada'
                        : 'Convidada do Podcast'}
                  </span>

                  {parsedInsta && (
                    <div className="mt-1.5">
                      <a
                        href={parsedInsta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Instagram de ${dep.nome}: ${parsedInsta.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-dourado-dark hover:text-vinho bg-white/80 hover:bg-white px-2 py-0.5 rounded-full border border-dourado/30 transition-all shadow-2xs group/insta min-h-[28px]"
                      >
                        <Instagram className="w-3 h-3 text-dourado group-hover/insta:text-dourado-dark shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-[150px]">
                          {parsedInsta.username}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Conteúdo do depoimento */}
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                {(() => {
                  const cardKey = dep.id || String(index)
                  const isExpanded = Boolean(expandedCards[cardKey])
                  const isLong = (dep.texto || '').length > 180

                  return (
                    <div className="space-y-1.5">
                      <p
                        className={`text-xs sm:text-sm text-vinho/85 italic leading-relaxed transition-all duration-300 ${
                          isExpanded ? 'whitespace-pre-line' : 'line-clamp-6'
                        }`}
                      >
                        "{dep.texto}"
                      </p>

                      {isLong && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(cardKey, e)}
                            className="inline-flex items-center gap-1 font-serif text-[11px] sm:text-xs font-bold text-vinho hover:text-dourado-dark transition-colors cursor-pointer py-0.5 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-dourado rounded-sm"
                          >
                            <span>{isExpanded ? 'Ler menos' : 'Ler mais'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-dourado" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-dourado" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setModalDepoimento({
                                dep,
                                photoUrl,
                                isHighlight,
                                parsedInsta,
                              })
                            }}
                            title="Ler em tela cheia"
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-vinho/60 hover:text-vinho transition-colors cursor-pointer ml-auto hover:underline"
                          >
                            <Maximize2 className="w-3 h-3 text-dourado" />
                            <span>Ver completo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })()}

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-dourado opacity-80 group-hover:scale-110 transition-transform" />
                    {isHighlight && (
                      <Badge className="bg-vinho text-dourado text-[9px] sm:text-[10px] font-bold tracking-wide shadow-sm">
                        Visão da Equipe CoffeeCast
                      </Badge>
                    )}
                  </div>

                  {dep.link_episodio && dep.link_episodio.trim() && (
                    <div className="pt-1 w-full">
                      <a
                        href={formatExternalUrl(dep.link_episodio)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Assistir episódio completo de ${dep.nome} no YouTube`}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-full text-xs font-semibold text-vinho bg-linear-to-r from-dourado/20 via-dourado/30 to-dourado/20 hover:from-dourado/35 hover:to-dourado/45 border border-dourado/50 hover:border-dourado text-vinho hover:text-vinho-dark active:scale-95 shadow-xs transition-all duration-200 no-underline min-h-[44px] group/episode cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-vinho fill-vinho/80 group-hover/episode:scale-110 transition-transform shrink-0" />
                        <span className="text-center font-medium">
                          Clique e assista ao episódio completo
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal elegante para leitura completa do depoimento */}
      <Dialog
        open={Boolean(modalDepoimento)}
        onOpenChange={(open) => {
          if (!open) setModalDepoimento(null)
        }}
      >
        <DialogContent className="w-[94vw] max-w-lg max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/60 text-vinho p-5 sm:p-7 rounded-2xl shadow-2xl">
          {modalDepoimento && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-full p-0.5 bg-linear-to-tr from-dourado via-dourado-light to-dourado-dark shadow-md shrink-0 ring-2 ring-dourado/40">
                    <img
                      src={modalDepoimento.photoUrl}
                      alt={modalDepoimento.dep.nome}
                      className="w-full h-full rounded-full object-cover border-2 border-white shadow-inner bg-vinho/5"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-vinho">
                      {modalDepoimento.dep.nome}
                    </DialogTitle>
                    <span className="text-xs text-vinho/65 font-medium block mt-0.5">
                      {modalDepoimento.dep.tipo_convidado === 'convidado'
                        ? modalDepoimento.isHighlight
                          ? 'Convidado Homenageado (Visão da Equipe)'
                          : 'Convidado do Podcast'
                        : modalDepoimento.isHighlight
                          ? 'Convidada Homenageada (Visão da Equipe)'
                          : 'Convidada do Podcast'}
                    </span>
                    {modalDepoimento.parsedInsta && (
                      <a
                        href={modalDepoimento.parsedInsta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-dourado-dark hover:text-vinho transition-colors mt-1"
                      >
                        <Instagram className="w-3.5 h-3.5 text-dourado shrink-0" />
                        <span>{modalDepoimento.parsedInsta.username}</span>
                      </a>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Corpo completo do depoimento */}
              <div className="relative bg-white/80 p-5 rounded-2xl border border-vinho/10 shadow-xs">
                <Quote className="w-8 h-8 text-dourado/40 absolute top-3 right-3 pointer-events-none" />
                <p className="text-sm sm:text-base text-vinho/90 italic leading-relaxed whitespace-pre-line font-serif">
                  "{modalDepoimento.dep.texto}"
                </p>
              </div>

              {/* Botão de assistir ao episódio se disponível */}
              {modalDepoimento.dep.link_episodio && modalDepoimento.dep.link_episodio.trim() && (
                <div className="pt-1">
                  <a
                    href={formatExternalUrl(modalDepoimento.dep.link_episodio)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full text-xs sm:text-sm font-semibold text-vinho bg-linear-to-r from-dourado/25 via-dourado/35 to-dourado/25 hover:from-dourado/40 hover:to-dourado/50 border border-dourado hover:border-dourado-dark transition-all duration-200 no-underline shadow-sm min-h-[46px]"
                  >
                    <Play className="w-4 h-4 text-vinho fill-vinho/80" />
                    <span>Assistir ao episódio completo no YouTube</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
