import React from 'react'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  variant?: 'light' | 'dark' | 'gold'
  showSubtitle?: boolean
  showWordmark?: boolean
}

/**
 * Logomarca Oficial do CoffeeCast 4.0
 * Xícara com acabamento dourado/rosé, vapor em formato de coração e estrelas cintilantes.
 * Tipografia elegante serifada no espírito da marca.
 */
export const CoffeeCastLogo: React.FC<LogoProps> = ({
  className = 'w-10 h-10',
  variant = 'gold',
  ...props
}) => {
  const primaryGold = variant === 'dark' ? '#4B1E3F' : '#D4AF37'
  const secondaryGold = variant === 'dark' ? '#6B2C5B' : '#F3E5AB'
  const roseAccent = variant === 'dark' ? '#853C73' : '#E8C5C8'

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`goldGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="35%" stopColor="#F5D061" />
          <stop offset="70%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B38612" />
        </linearGradient>
        <linearGradient id={`cupFillGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          {variant === 'dark' ? (
            <>
              <stop offset="0%" stopColor="#5F2650" />
              <stop offset="100%" stopColor="#4B1E3F" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#5A1A3B" />
              <stop offset="50%" stopColor="#3F122B" />
              <stop offset="100%" stopColor="#250B1B" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`roseGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={roseAccent} />
        </linearGradient>
        <filter id={`goldGlow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#D4AF37" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Círculo de fundo com brilho sutil */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="1.75"
        strokeDasharray="3 3"
        opacity="0.85"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill={variant === 'dark' ? '#FAF8F5' : '#36142D'}
        opacity="0.25"
      />

      {/* Estrela brilhante superior */}
      <path
        d="M50 11 L52.2 17.5 L59 20 L52.2 22.5 L50 29 L47.8 22.5 L41 20 L47.8 17.5 Z"
        fill={`url(#goldGrad-${variant})`}
        filter={`url(#goldGlow-${variant})`}
      />
      {/* Estrela pequena lateral direita */}
      <path
        d="M68 23 L69.4 26.5 L73 28 L69.4 29.5 L68 33 L66.6 29.5 L63 28 L66.6 26.5 Z"
        fill={`url(#goldGrad-${variant})`}
        opacity="0.95"
      />

      {/* Vapor estilizado em forma de coração - dourado vibrante e nítido */}
      <path
        d="M44 32 C41 28, 35 29, 35 34 C35 39, 44 44, 50 48 C56 44, 65 39, 65 34 C65 29, 59 28, 56 32 C54 34, 51 36, 50 37 C49 36, 46 34, 44 32 Z"
        fill="none"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#goldGlow-${variant})`}
      />

      {/* Pires da xícara - traço dourado marcante com destaque */}
      <path
        d="M23 76 C23 76, 32 81, 50 81 C68 81, 77 76, 77 76"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M32 78 C36 80, 44 80.8, 50 80.8 C56 80.8, 64 80, 68 78"
        stroke="#FFF2B2"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Xícara elegante - bojo com contraste bem definido sobre o fundo */}
      <path
        d="M27 49 C27 66, 35 75, 50 75 C65 75, 73 66, 73 49 Z"
        fill={`url(#cupFillGrad-${variant})`}
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="2.8"
      />

      {/* Friso dourado na borda superior da xícara */}
      <ellipse
        cx="50"
        cy="49"
        rx="23"
        ry="4"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="2.5"
        fill="none"
      />
      <ellipse
        cx="50"
        cy="49"
        rx="21.5"
        ry="2.8"
        stroke="#FFF2B2"
        strokeWidth="1"
        fill="none"
        opacity="0.75"
      />

      {/* Asa da xícara - contorno dourado forte e visível */}
      <path
        d="M72 52 C80 52, 84 57, 82 64 C80 69.5, 74 71, 69 68"
        fill="none"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M73 54 C78 54, 80.5 57.5, 79.5 62"
        fill="none"
        stroke="#FFF2B2"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Friso decorativo luminoso dentro da xícara */}
      <path
        d="M37 57 C41 62, 59 62, 63 57"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  )
}

/**
 * Componente completo com Logo + Wordmark CoffeeCast 4.0
 */
export const CoffeeCastBrand: React.FC<{
  className?: string
  variant?: 'light' | 'dark' | 'gold'
  direction?: 'horizontal' | 'vertical'
  iconSize?: string
  showTagline?: boolean
}> = ({
  className = '',
  variant = 'light',
  direction = 'horizontal',
  iconSize = 'w-10 h-10',
  showTagline = true,
}) => {
  const isLight = variant === 'light'
  const textColor = isLight ? 'text-white' : 'text-vinho'
  const accentColor = isLight ? 'text-dourado-light' : 'text-vinho-light'

  return (
    <div
      className={`inline-flex ${
        direction === 'vertical' ? 'flex-col items-center text-center' : 'items-center gap-3'
      } ${className}`}
    >
      <div className="relative shrink-0">
        <CoffeeCastLogo className={iconSize} variant={isLight ? 'gold' : 'dark'} />
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-serif tracking-wide font-bold text-lg md:text-xl ${textColor}`}>
            CoffeeCast
          </span>
          <span className="font-serif font-black text-sm md:text-base text-dourado">4.0</span>
        </div>
        {showTagline && (
          <span
            className={`text-[10px] md:text-[11px] tracking-wider uppercase font-medium ${accentColor} opacity-90`}
          >
            Histórias que transformam
          </span>
        )}
      </div>
    </div>
  )
}

export default CoffeeCastLogo
