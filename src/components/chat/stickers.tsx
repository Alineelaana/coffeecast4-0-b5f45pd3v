import React from 'react'

export interface StickerDefinition {
  id: string
  name: string
  category: 'coffeecast' | 'expressoes'
  keywords: string[]
  svg: (props: { className?: string; size?: number }) => React.ReactElement
}

/**
 * Paleta do CoffeeCast 4.0:
 * Vinho escuro/principal: #4B1E3F
 * Vinho profundo: #34112C
 * Dourado principal: #D4AF37
 * Dourado claro: #F3E5AB
 * Marfim / Creme: #FAF8F5
 * Branco suave: #FFFFFF
 */

export const COFFEECAST_STICKERS: StickerDefinition[] = [
  {
    id: 'cafe-coracao',
    name: 'Café com Amor',
    category: 'coffeecast',
    keywords: ['cafe', 'xicara', 'amor', 'coracao', 'vapor', 'coffeecast'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="cupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4B1E3F" />
            <stop offset="100%" stopColor="#34112C" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3E5AB" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#AA820A" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#34112C" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* Pires */}
        <ellipse
          cx="60"
          cy="100"
          rx="46"
          ry="10"
          fill="#FAF8F5"
          stroke="url(#goldGrad)"
          strokeWidth="3"
          filter="url(#shadow)"
        />
        <ellipse cx="60" cy="100" rx="36" ry="6" fill="#F3E5AB" opacity="0.4" />
        {/* Asa da xícara */}
        <path
          d="M78 54 C98 54 100 82 78 84"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Corpo da xícara */}
        <path
          d="M26 48 L32 86 C33 93 45 96 60 96 C75 96 87 93 88 86 L94 48 Z"
          fill="url(#cupGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="3.5"
          filter="url(#shadow)"
        />
        {/* Detalhe dourado na xícara */}
        <path
          d="M38 68 Q60 76 82 68"
          stroke="url(#goldGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        {/* Café líquido */}
        <ellipse
          cx="60"
          cy="48"
          rx="34"
          ry="8"
          fill="#2A0820"
          stroke="url(#goldGrad)"
          strokeWidth="2"
        />
        <ellipse cx="60" cy="48" rx="26" ry="5" fill="#3D1230" />
        {/* Vapor em formato de coração */}
        <path
          d="M60 32 C58 26 50 20 44 26 C38 32 46 38 60 44 C74 38 82 32 76 26 C70 20 62 26 60 32 Z"
          fill="url(#goldGrad)"
          opacity="0.95"
        />
        {/* Brilho estrela */}
        <path d="M88 28 L90 22 L92 28 L98 30 L92 32 L90 38 L88 32 L82 30 Z" fill="#F3E5AB" />
      </svg>
    ),
  },
  {
    id: 'brinde-canecas',
    name: 'Um Brinde!',
    category: 'coffeecast',
    keywords: ['brinde', 'canecas', 'tim-tim', 'comemorar', 'cafe', 'parceria'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="goldMug" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9F2D6" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#997300" />
          </linearGradient>
          <linearGradient id="vinhoMug" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5E234E" />
            <stop offset="100%" stopColor="#34112C" />
          </linearGradient>
        </defs>
        {/* Faíscas do brinde */}
        <circle cx="60" cy="38" r="4" fill="#D4AF37" />
        <path d="M60 22 L60 32" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M50 28 L56 34" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M70 28 L64 34" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
        {/* Caneca esquerda (Vinho, inclinada para direita) */}
        <g transform="rotate(14 44 72)">
          <rect
            x="22"
            y="52"
            width="28"
            height="38"
            rx="5"
            fill="url(#vinhoMug)"
            stroke="#D4AF37"
            strokeWidth="2.5"
          />
          <path
            d="M22 60 C12 60 12 82 22 82"
            stroke="#D4AF37"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse
            cx="36"
            cy="52"
            rx="14"
            ry="4"
            fill="#2A0820"
            stroke="#D4AF37"
            strokeWidth="1.5"
          />
          <path
            d="M29 68 Q36 72 43 68"
            stroke="#F3E5AB"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        {/* Caneca direita (Dourada, inclinada para esquerda) */}
        <g transform="rotate(-14 76 72)">
          <rect
            x="70"
            y="52"
            width="28"
            height="38"
            rx="5"
            fill="url(#goldMug)"
            stroke="#4B1E3F"
            strokeWidth="2.5"
          />
          <path
            d="M98 60 C108 60 108 82 98 82"
            stroke="#4B1E3F"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse
            cx="84"
            cy="52"
            rx="14"
            ry="4"
            fill="#4B1E3F"
            stroke="#34112C"
            strokeWidth="1.5"
          />
          <path
            d="M77 68 Q84 72 91 68"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        </g>
        {/* Texto "Tim-Tim!" */}
        <rect
          x="34"
          y="98"
          width="52"
          height="18"
          rx="9"
          fill="#4B1E3F"
          stroke="#D4AF37"
          strokeWidth="1.5"
        />
        <text
          x="60"
          y="111"
          textAnchor="middle"
          fill="#FAF8F5"
          fontSize="11"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          TIM-TIM! ☕
        </text>
      </svg>
    ),
  },
  {
    id: 'boa-demais',
    name: 'Boa Demais!',
    category: 'expressoes',
    keywords: ['boa', 'demais', 'aprovado', 'joinha', 'top', 'sucesso'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4B1E3F" />
            <stop offset="100%" stopColor="#2D0D24" />
          </linearGradient>
          <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9F2D6" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#997300" />
          </linearGradient>
        </defs>
        {/* Selo circular de qualidade */}
        <circle
          cx="60"
          cy="54"
          r="42"
          fill="url(#badgeGrad)"
          stroke="url(#goldRing)"
          strokeWidth="4"
        />
        <circle
          cx="60"
          cy="54"
          r="37"
          stroke="#D4AF37"
          strokeWidth="1"
          strokeDasharray="3 3"
          fill="none"
          opacity="0.7"
        />
        {/* Joinha dourado estilizado */}
        <g transform="translate(42, 34) scale(0.9)">
          <path
            d="M8 24 L8 38 C8 40 10 42 12 42 L16 42 L16 24 Z"
            fill="#D4AF37"
            stroke="#F3E5AB"
            strokeWidth="1.5"
          />
          <path
            d="M16 24 C16 20 20 12 24 6 C26 3 30 3 31 6 C32 9 30 16 26 22 L38 22 C41 22 43 24 43 27 C43 29 41 31 39 31 C42 31 44 33 44 35 C44 37 42 39 40 39 C42 39 43 41 43 43 C43 46 40 48 36 48 L22 48 C18 48 16 44 16 40 Z"
            fill="url(#goldRing)"
            stroke="#FAF8F5"
            strokeWidth="1.5"
          />
        </g>
        {/* Faixa inferior */}
        <rect
          x="18"
          y="90"
          width="84"
          height="22"
          rx="11"
          fill="#D4AF37"
          stroke="#4B1E3F"
          strokeWidth="2"
        />
        <text
          x="60"
          y="105"
          textAnchor="middle"
          fill="#4B1E3F"
          fontSize="11"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          BOA DEMAIS! ✨
        </text>
      </svg>
    ),
  },
  {
    id: 'kkk-riso',
    name: 'Gargalhada / KKK',
    category: 'expressoes',
    keywords: ['kkk', 'riso', 'gargalhada', 'engracado', 'haha', 'meme'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="60%" stopColor="#F5D061" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
        {/* Rosto do emoji risonho */}
        <circle cx="60" cy="56" r="42" fill="url(#faceGrad)" stroke="#4B1E3F" strokeWidth="3.5" />
        {/* Olhos fechados rindo (^ ^) */}
        <path
          d="M38 48 Q46 38 52 48"
          stroke="#4B1E3F"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M68 48 Q74 38 82 48"
          stroke="#4B1E3F"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Lágrimas de tanto rir */}
        <path
          d="M30 52 C26 56 26 62 30 64 C34 62 34 56 30 52 Z"
          fill="#60A5FA"
          stroke="#2563EB"
          strokeWidth="1"
        />
        <path
          d="M90 52 C94 56 94 62 90 64 C86 62 86 56 90 52 Z"
          fill="#60A5FA"
          stroke="#2563EB"
          strokeWidth="1"
        />
        {/* Boca aberta rindo */}
        <path
          d="M40 62 Q60 62 80 62 Q80 84 60 84 Q40 84 40 62 Z"
          fill="#4B1E3F"
          stroke="#4B1E3F"
          strokeWidth="2"
        />
        {/* Língua */}
        <path d="M50 74 Q60 86 70 74 Z" fill="#F43F5E" />
        {/* Dentes */}
        <path d="M44 63 Q60 65 76 63" stroke="#FAF8F5" strokeWidth="3" strokeLinecap="round" />
        {/* Balão KKK */}
        <rect
          x="26"
          y="96"
          width="68"
          height="20"
          rx="10"
          fill="#4B1E3F"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        <text
          x="60"
          y="110"
          textAnchor="middle"
          fill="#FAF8F5"
          fontSize="12"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          KKKKK! ☕😂
        </text>
      </svg>
    ),
  },
  {
    id: 'coracao-coffeecast',
    name: 'Coração CoffeeCast',
    category: 'coffeecast',
    keywords: ['coracao', 'amor', 'vinho', 'dourado', 'gratidao', 'carinho'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7A225E" />
            <stop offset="60%" stopColor="#4B1E3F" />
            <stop offset="100%" stopColor="#2A0B22" />
          </linearGradient>
          <linearGradient id="goldH" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#997300" />
          </linearGradient>
        </defs>
        {/* Coração estilizado */}
        <path
          d="M60 98 C30 80 14 62 14 42 C14 26 26 16 40 16 C49 16 56 21 60 27 C64 21 71 16 80 16 C94 16 106 26 106 42 C106 62 90 80 60 98 Z"
          fill="url(#heartGrad)"
          stroke="url(#goldH)"
          strokeWidth="4"
        />
        {/* Grão de café central em dourado */}
        <g transform="translate(50, 42)">
          <ellipse cx="10" cy="14" rx="9" ry="13" fill="url(#goldH)" />
          <path
            d="M10 2 Q6 14 10 26"
            stroke="#4B1E3F"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        {/* Brilhos estelares */}
        <path d="M30 32 L32 26 L34 32 L40 34 L34 36 L32 42 L30 36 L24 34 Z" fill="#FAF8F5" />
        <path d="M88 28 L89 24 L90 28 L94 29 L90 30 L89 34 L88 30 L84 29 Z" fill="#FAF8F5" />
        {/* Texto "COM AMOR" */}
        <rect
          x="25"
          y="96"
          width="70"
          height="18"
          rx="9"
          fill="#D4AF37"
          stroke="#4B1E3F"
          strokeWidth="1.5"
        />
        <text
          x="60"
          y="109"
          textAnchor="middle"
          fill="#4B1E3F"
          fontSize="10"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          COM AMOR 💛
        </text>
      </svg>
    ),
  },
  {
    id: 'nine-aplauso',
    name: 'Show / Aplausos',
    category: 'expressoes',
    keywords: ['palmas', 'aplausos', 'show', 'parabens', 'sucesso', 'arrasou'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="bgShow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4B1E3F" />
            <stop offset="100%" stopColor="#1E0719" />
          </linearGradient>
        </defs>
        {/* Fundo arredondado */}
        <rect
          x="14"
          y="14"
          width="92"
          height="92"
          rx="26"
          fill="url(#bgShow)"
          stroke="#D4AF37"
          strokeWidth="3"
        />
        {/* Mãos aplaudindo */}
        <g transform="translate(32, 26)">
          <path
            d="M12 28 C12 28 14 18 20 14 C26 10 30 14 26 22 L24 26 L30 22 C34 19 38 23 34 28 L28 34 L34 32 C38 30 40 34 36 38 L24 48 C20 52 14 52 10 46 L2 36 C-2 30 4 24 10 30 Z"
            fill="#D4AF37"
            stroke="#FAF8F5"
            strokeWidth="1.5"
          />
          {/* Raios de aplauso */}
          <path d="M6 14 L0 8" stroke="#F3E5AB" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M22 6 L22 0" stroke="#F3E5AB" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 10 L44 4" stroke="#F3E5AB" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M48 24 L56 22" stroke="#F3E5AB" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        {/* Faixa SHOW! */}
        <rect
          x="22"
          y="80"
          width="76"
          height="20"
          rx="10"
          fill="#D4AF37"
          stroke="#FAF8F5"
          strokeWidth="1.5"
        />
        <text
          x="60"
          y="94"
          textAnchor="middle"
          fill="#4B1E3F"
          fontSize="12"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          ARRASOU! 👏
        </text>
      </svg>
    ),
  },
  {
    id: 'cafe-foco',
    name: 'Hora do Café',
    category: 'coffeecast',
    keywords: ['hora', 'cafe', 'foco', 'pausa', 'trabalho', 'recarregar'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAF8F5" />
            <stop offset="100%" stopColor="#F3E5AB" />
          </linearGradient>
        </defs>
        {/* Fundo creme elegante com borda vinho */}
        <circle cx="60" cy="56" r="42" fill="url(#sunGrad)" stroke="#4B1E3F" strokeWidth="3" />
        {/* Caneca grande */}
        <rect
          x="40"
          y="44"
          width="36"
          height="34"
          rx="6"
          fill="#4B1E3F"
          stroke="#D4AF37"
          strokeWidth="2.5"
        />
        <path
          d="M76 50 C86 50 86 66 76 66"
          stroke="#D4AF37"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Letra C estilizada na caneca */}
        <text
          x="58"
          y="66"
          textAnchor="middle"
          fill="#D4AF37"
          fontSize="16"
          fontWeight="900"
          fontFamily="serif"
        >
          C
        </text>
        {/* Vapores ondulados */}
        <path
          d="M48 38 Q52 30 48 24"
          stroke="#D4AF37"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M58 38 Q62 28 58 20"
          stroke="#D4AF37"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M68 38 Q72 30 68 24"
          stroke="#D4AF37"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Faixa inferior */}
        <rect
          x="18"
          y="94"
          width="84"
          height="20"
          rx="10"
          fill="#4B1E3F"
          stroke="#D4AF37"
          strokeWidth="1.5"
        />
        <text
          x="60"
          y="108"
          textAnchor="middle"
          fill="#FAF8F5"
          fontSize="11"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          HORA DO CAFÉ ☕
        </text>
      </svg>
    ),
  },
  {
    id: 'estrela-vip',
    name: 'Estrela / VIP',
    category: 'coffeecast',
    keywords: ['estrela', 'vip', 'brilho', 'especial', 'nota10', 'topo'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8C6700" />
          </linearGradient>
        </defs>
        {/* Estrela dourada gigante */}
        <path
          d="M60 14 L73 44 L105 47 L80 69 L88 100 L60 83 L32 100 L40 69 L15 47 L47 44 Z"
          fill="url(#starGrad)"
          stroke="#4B1E3F"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Óculos escuros na estrela */}
        <g transform="translate(36, 44)">
          <rect
            x="4"
            y="6"
            width="18"
            height="12"
            rx="4"
            fill="#34112C"
            stroke="#FAF8F5"
            strokeWidth="1"
          />
          <rect
            x="26"
            y="6"
            width="18"
            height="12"
            rx="4"
            fill="#34112C"
            stroke="#FAF8F5"
            strokeWidth="1"
          />
          <path d="M22 10 L26 10" stroke="#FAF8F5" strokeWidth="2" />
          {/* Brilhos nos óculos */}
          <path
            d="M6 9 L12 9"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M28 9 L34 9"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
        {/* Sorriso */}
        <path
          d="M52 68 Q60 74 68 68"
          stroke="#4B1E3F"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Faixa VIP */}
        <rect
          x="28"
          y="96"
          width="64"
          height="20"
          rx="10"
          fill="#4B1E3F"
          stroke="#D4AF37"
          strokeWidth="1.5"
        />
        <text
          x="60"
          y="110"
          textAnchor="middle"
          fill="#D4AF37"
          fontSize="11"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          É VIP! ⭐
        </text>
      </svg>
    ),
  },
  {
    id: 'gravando-no-ar',
    name: 'No Ar / Gravando',
    category: 'coffeecast',
    keywords: ['gravando', 'no ar', 'microfone', 'podcast', 'estudio', 'episodio'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9F2D6" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#AA820A" />
          </linearGradient>
        </defs>
        {/* Fundo quadrado estilizado de estúdio */}
        <rect
          x="14"
          y="14"
          width="92"
          height="92"
          rx="22"
          fill="#34112C"
          stroke="#D4AF37"
          strokeWidth="3"
        />
        {/* Luz vermelha "NO AR" */}
        <rect
          x="30"
          y="24"
          width="60"
          height="18"
          rx="9"
          fill="#DC2626"
          stroke="#FAF8F5"
          strokeWidth="1.5"
        />
        <circle cx="39" cy="33" r="3" fill="#FFFFFF" />
        <text
          x="64"
          y="37"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          ● NO AR
        </text>
        {/* Microfone profissional vintage */}
        <g transform="translate(46, 44)">
          <rect
            x="6"
            y="6"
            width="16"
            height="24"
            rx="8"
            fill="url(#micGrad)"
            stroke="#FAF8F5"
            strokeWidth="1.5"
          />
          <path d="M6 16 L22 16" stroke="#34112C" strokeWidth="1.5" />
          <path
            d="M0 16 C0 26 28 26 28 16"
            stroke="#D4AF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M14 26 L14 36" stroke="#D4AF37" strokeWidth="2.5" />
          <rect x="4" y="36" width="20" height="4" rx="2" fill="#FAF8F5" />
        </g>
        {/* Ondas sonoras */}
        <path
          d="M38 56 Q34 62 38 68"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M82 56 Q86 62 82 68"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Texto inferior */}
        <text
          x="60"
          y="100"
          textAnchor="middle"
          fill="#F3E5AB"
          fontSize="10"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          GRAVANDO 🎙️
        </text>
      </svg>
    ),
  },
  {
    id: 'gratidao-cafe',
    name: 'Gratidão / Obrigado',
    category: 'expressoes',
    keywords: ['obrigado', 'gratidao', 'valeu', 'agradecido', 'tmj', 'amizade'],
    svg: ({ className = 'w-24 h-24', size }) => (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="badgeThanks" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5E234E" />
            <stop offset="100%" stopColor="#34112C" />
          </linearGradient>
        </defs>
        {/* Círculo com acabamento dourado */}
        <circle
          cx="60"
          cy="54"
          r="42"
          fill="url(#badgeThanks)"
          stroke="#D4AF37"
          strokeWidth="3.5"
        />
        {/* Mãos postas em agradecimento (Prece / Gratidão) */}
        <g transform="translate(42, 28) scale(0.9)">
          <path
            d="M16 12 C18 6 22 6 24 12 L24 38 L16 38 Z"
            fill="#F3E5AB"
            stroke="#D4AF37"
            strokeWidth="1.5"
          />
          <path
            d="M24 12 C26 6 30 6 32 12 L32 38 L24 38 Z"
            fill="#D4AF37"
            stroke="#FAF8F5"
            strokeWidth="1.5"
          />
          {/* Coração entre as mãos */}
          <path
            d="M24 22 C22 19 19 20 19 23 C19 26 24 30 24 30 C24 30 29 26 29 23 C29 20 26 19 24 22 Z"
            fill="#F43F5E"
          />
        </g>
        {/* Brilhos ao redor */}
        <circle cx="30" cy="46" r="2.5" fill="#D4AF37" />
        <circle cx="90" cy="46" r="2.5" fill="#D4AF37" />
        {/* Faixa GRATIDÃO! */}
        <rect
          x="20"
          y="92"
          width="80"
          height="22"
          rx="11"
          fill="#D4AF37"
          stroke="#4B1E3F"
          strokeWidth="2"
        />
        <text
          x="60"
          y="107"
          textAnchor="middle"
          fill="#4B1E3F"
          fontSize="11"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          GRATIDÃO! 🙏💛
        </text>
      </svg>
    ),
  },
]

export const STICKER_MAP = new Map<string, StickerDefinition>(
  COFFEECAST_STICKERS.map((s) => [s.id, s]),
)

/**
 * Prefixo oficial para armazenamento de sticker em campos de mensagem de texto.
 * Ex: "sticker:cafe-coracao"
 */
export const STICKER_PREFIX = 'sticker:'

export function isStickerMessage(text: string | null | undefined): boolean {
  if (!text) return false
  const trimmed = text.trim()
  return trimmed.startsWith(STICKER_PREFIX) && trimmed.length > STICKER_PREFIX.length
}

export function extractStickerId(text: string): string {
  const trimmed = text.trim()
  return trimmed.replace(STICKER_PREFIX, '').trim()
}

export function getStickerById(stickerId: string): StickerDefinition | undefined {
  return STICKER_MAP.get(stickerId)
}

export function getStickerPreviewLabel(text: string): string {
  if (!isStickerMessage(text)) return text
  const id = extractStickerId(text)
  const found = getStickerById(id)
  return found ? `[Figurinha: ${found.name}]` : '[Figurinha]'
}
