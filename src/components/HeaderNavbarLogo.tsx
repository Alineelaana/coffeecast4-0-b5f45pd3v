import React, { useId } from 'react'

interface HeaderLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Logo exclusiva do cabeçalho público (Navbar) do CoffeeCast 4.0:
 * - Xícara, pires, asa, vapor de coração e estrelas em DOURADO (#D4AF37 / #F3E5AB / #AA7C11)
 * - Texto "CoffeeCast" em BRANCO (#FFFFFF)
 * - Texto "4.0" em DOURADO (#D4AF37)
 *
 * Renderizada inline como SVG puro:
 * - Imune a problemas de cache de browser
 * - Cores 100% controladas e visíveis sobre o degradê transparente e o fundo vinho (#36142D)
 * - IDs únicos via useId() para evitar conflitos de gradiente
 */
export const HeaderNavbarLogo: React.FC<HeaderLogoProps> = ({
  className = 'h-9 sm:h-10 md:h-11 w-auto',
  ...props
}) => {
  const rawId = useId()
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const cupGoldId = `navCupGold-${safeId}`
  const bodyGoldId = `navBodyGold-${safeId}`

  return (
    <svg
      viewBox="0 0 380 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CoffeeCast 4.0"
      {...props}
    >
      <defs>
        {/* Gradiente dourado sofisticado oficial (#F3E5AB -> #D4AF37 -> #AA7C11) */}
        <linearGradient id={cupGoldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E5AB" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA7C11" />
        </linearGradient>

        {/* Gradiente luminoso para o bojo da xícara em dourado vivo */}
        <linearGradient id={bodyGoldId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F3E5AB" />
          <stop offset="35%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B38612" />
        </linearGradient>
      </defs>

      {/* ================= SÍMBOLO DA XÍCARA DOURADA ================= */}
      <g transform="translate(0, 0)">
        {/* Círculo pontilhado dourado externo */}
        <circle
          cx="35"
          cy="35"
          r="32"
          stroke={`url(#${cupGoldId})`}
          strokeWidth="1.3"
          strokeDasharray="2.5 2.5"
          opacity="0.85"
        />

        {/* Fundo suave translúcido para garantir legibilidade sobre fundos claros ou escuros */}
        <circle cx="35" cy="35" r="29" fill="#36142D" opacity="0.4" />

        {/* Estrela cintilante superior dourada */}
        <path
          d="M35 8 L36.5 12.5 L41 14 L36.5 15.5 L35 20 L33.5 15.5 L29 14 L33.5 12.5 Z"
          fill={`url(#${cupGoldId})`}
        />

        {/* Estrela cintilante menor lateral direita em dourado suave */}
        <path
          d="M48 16 L49 18.2 L51.5 19 L49 19.8 L48 22 L47 19.8 L44.5 19 L47 18.2 Z"
          fill="#F3E5AB"
        />

        {/* Vapor estilizado em formato de coração em dourado */}
        <path
          d="M30 21 C27.2 17.8, 22.8 18.7, 22.8 22.2 C22.8 25.8, 30 29.8, 35 32.8 C40 29.8, 47.2 25.8, 47.2 22.2 C47.2 18.7, 42.8 17.8, 40 21 C38.4 22.5, 36.3 24.1, 35 24.7 C33.7 24.1, 31.6 22.5, 30 21 Z"
          fill="none"
          stroke={`url(#${cupGoldId})`}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pires da xícara em dourado */}
        <path
          d="M16 54 C16 54, 23 57.5, 35 57.5 C47 57.5, 54 54, 54 54"
          stroke={`url(#${cupGoldId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Corpo da xícara DOURADO */}
        <path
          d="M19 35 C19 47.5, 25.5 53.5, 35 53.5 C44.5 53.5, 51 47.5, 51 35 Z"
          fill={`url(#${bodyGoldId})`}
          stroke="#AA7C11"
          strokeWidth="1"
        />

        {/* Borda superior da xícara dourado/marfim suave */}
        <ellipse
          cx="35"
          cy="35"
          rx="16"
          ry="2.8"
          fill="#F3E5AB"
          stroke="#AA7C11"
          strokeWidth="0.9"
        />

        {/* Asa da xícara em dourado */}
        <path
          d="M50 37.5 C56 37.5, 59.5 41.5, 58 45.8 C56.5 49.5, 52 50.5, 48.5 48"
          fill="none"
          stroke={`url(#${cupGoldId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Friso luminoso sutil no bojo da xícara */}
        <path
          d="M26 42 C30 45, 40 45, 44 42"
          stroke="#FAF8F5"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>

      {/* ================= TIPOGRAFIA DA LOGO ================= */}
      {/* "CoffeeCast" em BRANCO (#FFFFFF) */}
      <text
        x="82"
        y="45"
        fill="#FFFFFF"
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontWeight="700"
        letterSpacing="0.5"
      >
        CoffeeCast
      </text>

      {/* "4.0" em DOURADO (#D4AF37) */}
      <text
        x="254"
        y="45"
        fill={`url(#${cupGoldId})`}
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontWeight="900"
        letterSpacing="0.2"
      >
        4.0
      </text>
    </svg>
  )
}

export default HeaderNavbarLogo
