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
          <stop offset="0%" stopColor={secondaryGold} />
          <stop offset="50%" stopColor={primaryGold} />
          <stop offset="100%" stopColor="#9C7311" />
        </linearGradient>
        <linearGradient id={`roseGrad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={roseAccent} />
        </linearGradient>
      </defs>

      {/* Círculo de fundo suave */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.6"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill={variant === 'dark' ? '#FAF8F5' : '#36142D'}
        opacity="0.15"
      />

      {/* Estrela brilhante superior */}
      <path
        d="M50 12 L52 18 L58 20 L52 22 L50 28 L48 22 L42 20 L48 18 Z"
        fill={`url(#goldGrad-${variant})`}
      />
      {/* Estrela pequena lateral direita */}
      <path
        d="M68 24 L69.2 27 L72.5 28 L69.2 29 L68 32 L66.8 29 L63.5 28 L66.8 27 Z"
        fill={primaryGold}
        opacity="0.8"
      />

      {/* Vapor estilizado em forma de coração */}
      <path
        d="M44 32 C41 28, 35 29, 35 34 C35 39, 44 44, 50 48 C56 44, 65 39, 65 34 C65 29, 59 28, 56 32 C54 34, 51 36, 50 37 C49 36, 46 34, 44 32 Z"
        fill="none"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pires da xícara */}
      <path
        d="M24 76 C24 76, 32 80, 50 80 C68 80, 76 76, 76 76"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Xícara elegante */}
      <path
        d="M28 50 C28 66, 36 74, 50 74 C64 74, 72 66, 72 50 Z"
        fill={variant === 'dark' ? '#4B1E3F' : '#3F1735'}
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="2.5"
      />

      {/* Friso dourado na borda superior da xícara */}
      <ellipse
        cx="50"
        cy="50"
        rx="22"
        ry="3.5"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="2"
        fill="none"
      />

      {/* Asa da xícara */}
      <path
        d="M71 53 C78 53, 82 58, 80 64 C78 69, 73 70, 68 67"
        fill="none"
        stroke={`url(#goldGrad-${variant})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Friso decorativo sutil dentro da xícara */}
      <path
        d="M38 58 C42 62, 58 62, 62 58"
        stroke={secondaryGold}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
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
