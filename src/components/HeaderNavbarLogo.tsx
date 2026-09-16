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
  className = 'h-10 sm:h-12 md:h-14 w-auto',
  alt = 'CoffeeCast 4.0',
  ...props
}) => {
  return (
    <img
      src={officialLogo}
      alt={alt}
      className={`object-contain drop-shadow-sm transition-transform duration-200 ${className}`}
      {...props}
    />
  )
}

export default HeaderNavbarLogo
