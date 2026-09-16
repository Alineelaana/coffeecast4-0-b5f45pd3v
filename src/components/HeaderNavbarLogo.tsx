import React from 'react'
import officialLogo from '@/assets/whatsapp-image-2026-09-16-at-20.11.11-c31c9.jpeg'

interface HeaderLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

/**
 * Logo oficial do cabeçalho público (Navbar) do CoffeeCast 4.0:
 * - Nova arte oficial de alta resolução enviada pela anfitriã (Aline Lana)
 * - Xícara dourada brilhante com pires, vapor formando coração dourado
 * - Estrela brilhante de 8 pontas no canto superior direito do coração
 * - Wordmark "Coffeeecast" em branco com efeito 3D
 * - "4.0" em dourado grande à direita e equalizador de áudio dourado entre finas linhas horizontais
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
