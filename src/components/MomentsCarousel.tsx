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
    <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-3xl border-2 border-dourado/40 shadow-2xl bg-vinho-dark group">
      {/* Container de visualização */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.legenda}
                className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000"
              />
              {/* Gradiente escuro para legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-vinho-dark/95 via-vinho/40 to-transparent" />

              {/* Legenda do Momento */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-marfim z-20 flex items-end justify-between gap-4">
                <div className="max-w-2xl space-y-1.5 animate-fade-in-up">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dourado/20 border border-dourado/40 text-dourado text-xs font-semibold backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Nossos Momentos — Foto {index + 1} de {slides.length}
                    </span>
                  </div>
                  <p className="font-serif text-lg md:text-2xl font-bold text-white leading-snug drop-shadow-md">
                    {slide.legenda}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botões de navegação lateral */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Momento anterior"
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-vinho/70 border border-dourado/60 text-marfim flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-vinho hover:scale-110 transition-all shadow-lg backdrop-blur-sm"
          >
            <ChevronLeft className="w-6 h-6 text-dourado" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Próximo momento"
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-vinho/70 border border-dourado/60 text-marfim flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-vinho hover:scale-110 transition-all shadow-lg backdrop-blur-sm"
          >
            <ChevronRight className="w-6 h-6 text-dourado" />
          </button>
        </>
      )}

      {/* Indicadores / Pontos de paginação */}
      <div className="absolute bottom-3 md:bottom-4 right-6 z-20 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Ir para momento ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-7 bg-dourado shadow-sm' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
