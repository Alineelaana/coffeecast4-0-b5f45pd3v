import React from 'react'
import officialLogo from '@/assets/design-sem-nome-5dedc.png'

interface HeaderLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

/**
 * Logo oficial do cabeçalho público (Navbar) do CoffeeCast 4.0:
 * - Arte oficial com fundo transparente (PNG)
 * - Xícara dourada com vapor em coração, estrela de 4 pontas
 * - Wordmark "Coffeeecast" em branco com contorno sutil
 * - "4.0" e equalizador de áudio em dourado
 * - Fundo vinho escuro do cabeçalho garante alto contraste e legibilidade
 */
export const HeaderNavbarLogo: React.FC<HeaderLogoProps> = ({
  className = 'h-16 sm:h-20 md:h-24 lg:h-28 w-auto',
  alt = 'CoffeeCast 4.0',
  ...props
}) => {
  return (
    <img
      src={officialLogo}
      alt={alt}
      className={`object-contain drop-shadow-[0_4px_12px_rgba(212,175,55,0.25)] transition-transform duration-200 ${className}`}
      {...props}
    />
  )
}

export default HeaderNavbarLogo
