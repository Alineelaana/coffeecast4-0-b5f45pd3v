import React from 'react'
import officialLogo from '@/assets/chatgpt-image-15-de-set.de-2026-135749-7d01c.png'

interface HeaderLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

/**
 * Logo oficial do cabeçalho público (Navbar) do CoffeeCast 4.0:
 * - Nova arte oficial de alta resolução com fundo transparente
 * - Xícara dourada com vapor em coração, estrela dourada de 4 pontas
 * - Wordmark "Coffeeecast" em branco com contorno elegante
 * - "4.0" e equalizador de áudio em dourado reluzente
 * - Proporção preservada (w-auto object-contain), sem recortar ou distorcer
 */
export const HeaderNavbarLogo: React.FC<HeaderLogoProps> = ({
  className = 'h-12 sm:h-14 md:h-16 lg:h-[4.25rem] xl:h-[4.5rem] w-auto',
  alt = 'CoffeeCast 4.0',
  ...props
}) => {
  return (
    <img
      src={officialLogo}
      alt={alt}
      className={`object-contain drop-shadow-[0_3px_10px_rgba(212,175,55,0.25)] transition-transform duration-200 ${className}`}
      {...props}
    />
  )
}

export default HeaderNavbarLogo
