import React from 'react'
import bannerImg from '@/assets/whatsapp-image-2026-09-14-at-22.43.57-19091.jpeg'

interface HeaderBannerProps {
  onWatchEpisodes?: () => void
}

/**
 * Banner oficial do cabeçalho do CoffeeCast 4.0
 * Mostra a imagem de forma integral e fluida, sem texto sobreposto ou elementos que compitam com a arte.
 * Inclui área clicável invisível e acessível exatamente sobre o botão "ASSISTA NOSSOS EPISÓDIOS" presente na imagem.
 */
export const HeaderBanner: React.FC<HeaderBannerProps> = ({ onWatchEpisodes }) => {
  const handleScrollToEpisodes = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onWatchEpisodes) {
      onWatchEpisodes()
      return
    }
    const target = document.getElementById('episodios')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="inicio"
      aria-label="Banner Oficial CoffeeCast 4.0"
      className="relative w-full bg-[#1b0816] overflow-hidden select-none pt-16 sm:pt-20 md:pt-24 lg:pt-26 xl:pt-28"
    >
      {' '}
      {/*
        Container responsivo com proporção natural do banner (1600x600 = 8:3 = 2.666:1).
        A imagem é renderizada de forma integral e fluida (w-full h-auto), garantindo que
        nenhuma parte seja cortada ou distorcida em nenhuma largura de tela.
      */}
      <div className="relative w-full max-w-[2400px] mx-auto">
        <div className="relative w-full aspect-[1600/600]">
          <img
            src={bannerImg}
            alt="CoffeeCast 4.0 - Mais que conversas, histórias que transformam. Pessoas reais, ideias que inspiram, conversas que deixam marcas."
            className="w-full h-full object-contain object-center block"
            loading="eager"
            fetchPriority="high"
          />

          {/*
            Área clicável 100% invisível sobre o botão "ASSISTA NOSSOS EPISÓDIOS" desenhado na arte.
            Posição percentual na imagem de 1600x600:
            - Left: ~7.3%
            - Top: ~63%
            - Width: ~20.5%
            - Height: ~12.5%
            Nenhum elemento visual, texto ou borda é renderizado por cima, respeitando a instrução:
            "sem nada escrito em cima do banner, mantenha apenas a imagem".
          */}
          <a
            href="#episodios"
            onClick={handleScrollToEpisodes}
            aria-label="Assistir aos episódios do CoffeeCast 4.0"
            className="absolute left-[7.2%] top-[62.5%] w-[20.8%] h-[12.8%] rounded-full cursor-pointer opacity-0 focus:opacity-100 focus:ring-2 focus:ring-dourado transition-opacity z-20"
            title="Assistir aos nossos episódios"
          >
            <span className="sr-only">Assista nossos episódios</span>
          </a>
        </div>
      </div>
    </section>
  )
}
