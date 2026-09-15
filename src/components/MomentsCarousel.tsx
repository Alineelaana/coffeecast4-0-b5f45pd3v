import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { getFileUrl } from '@/lib/formatters'
import type { MomentoRecord } from '@/types/database'

interface MomentsCarouselProps {
  momentos: MomentoRecord[]
}

const fallbackImages = [
  {
    url: 'https://img.usecurling.com/p/800/600?q=women%20podcast%20studio&color=wine',
    legenda: 'Bastidores da gravação no nosso estúdio com muito afeto e café quentinho.',
  },
  {
    url: 'https://img.usecurling.com/p/800/600?q=women%20coffee%20laughing&color=gold',
    legenda: 'Aquele momento descontraído antes de ligar os microfones.',
  },
  {
    url: 'https://img.usecurling.com/p/800/600?q=podcast%20interview%20women&color=maroon',
    legenda: 'Histórias reais que emocionam e transformam cada participante.',
  },
  {
    url: 'https://img.usecurling.com/p/800/600?q=coffee%20cup%20microphone&color=brown',
    legenda: 'O cafezinho especial que nunca esfria na nossa mesa.',
  },
  {
    url: 'https://img.usecurling.com/p/800/600?q=female%20leaders%20talking&color=purple',
    legenda: 'Conexão e parceria entre mulheres que sonham alto.',
  },
]

export const MomentsCarousel: React.FC<MomentsCarouselProps> = ({ momentos }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Lista normalizada
  const slides =
    momentos.length > 0
      ? momentos.map((m) => ({
          url: m.imagem ? getFileUrl(m, m.imagem) : fallbackImages[0].url,
          legenda: m.legenda || 'Momento especial do CoffeeCast 4.0',
        }))
      : fallbackImages

  // Avanço automático a cada 3 segundos (exigência estrita do usuário)
  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 3000)

    return () => clearInterval(timer)
  }, [slides.length])

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-3xl border border-dourado/50 shadow-[0_12px_40px_rgba(212,175,55,0.15)] bg-gradient-to-b from-[#3d1733] via-[#36142d] to-[#2a0e23] group">
      {/* Container de visualização com altura/proporção otimizada para fotos inteiras */}
      <div className="relative w-full h-[360px] sm:h-[460px] md:h-[540px] lg:h-[580px] overflow-hidden flex items-center justify-center">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Fundo suave com efeito blur da própria foto para harmonia visual */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                  src={slide.url}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover scale-110 blur-2xl opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#36142d]/70 via-[#36142d]/40 to-[#220c1c]/90" />
              </div>

              {/* Área da foto principal: exibida INTEIRA com object-contain, cantos arredondados e borda/sombra dourada */}
              <div className="relative z-10 flex-1 w-full flex items-center justify-center p-3 sm:p-5 pb-16 md:pb-20">
                <div className="relative max-h-full max-w-full flex items-center justify-center rounded-2xl overflow-hidden border border-dourado/40 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.18)] bg-black/30">
                  <img
                    src={slide.url}
                    alt={slide.legenda}
                    className="max-h-[280px] sm:max-h-[370px] md:max-h-[440px] lg:max-h-[470px] w-auto max-w-full object-contain rounded-2xl select-none"
                    loading="eager"
                  />
                </div>
              </div>

              {/* Barra inferior elegante com legenda e badge de momento */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-t from-[#220c1c]/95 via-[#2a0e23]/80 to-transparent z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-[11px] sm:text-xs font-semibold backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 text-dourado" />
                    <span>
                      Nossos Momentos — Foto {index + 1} de {slides.length}
                    </span>
                  </div>
                  {slide.legenda && slide.legenda.trim() !== '' && (
                    <p className="font-serif text-sm sm:text-base md:text-lg text-white font-medium drop-shadow leading-snug line-clamp-2">
                      {slide.legenda}
                    </p>
                  )}
                </div>

                {/* Indicadores de paginação */}
                {slides.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        aria-label={`Ir para foto ${i + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === currentIndex
                            ? 'w-6 bg-dourado shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                            : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Botões de navegação lateral (setas) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Momento anterior"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-vinho/80 border border-dourado/60 text-marfim flex items-center justify-center opacity-85 hover:opacity-100 hover:bg-vinho hover:scale-110 active:scale-95 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.4)] backdrop-blur-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-dourado" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Próximo momento"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-vinho/80 border border-dourado/60 text-marfim flex items-center justify-center opacity-85 hover:opacity-100 hover:bg-vinho hover:scale-110 active:scale-95 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.4)] backdrop-blur-sm cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-dourado" />
          </button>
        </>
      )}
    </div>
  )
}
