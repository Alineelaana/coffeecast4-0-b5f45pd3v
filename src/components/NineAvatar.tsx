import React, { useState } from 'react'
import { NINE_AVATAR_SRC } from '@/assets/nineAvatar'
import { cn } from '@/lib/utils'

interface NineAvatarProps {
  className?: string
  sizeClassName?: string
  alt?: string
}

export const NineAvatar: React.FC<NineAvatarProps> = ({
  className,
  sizeClassName = 'w-10 h-10',
  alt = 'Nine · Assistente Virtual CoffeeCast 4.0',
}) => {
  const [hasError, setHasError] = useState(false)

  if (hasError || !NINE_AVATAR_SRC) {
    // Fallback de avatar elegante na identidade da marca (círculo dourado, iniciais "N" em vinho sobre marfim)
    return (
      <div
        className={cn(
          'relative rounded-full shrink-0 flex items-center justify-center font-serif font-bold select-none border-2 border-[#D4AF37] bg-[#FAF8F5] text-[#4B1E3F] shadow-sm',
          sizeClassName,
          className,
        )}
        title={alt}
        aria-label={alt}
      >
        <span className="leading-none text-base sm:text-lg tracking-tight">N</span>
        <span
          className="absolute -bottom-0.5 -right-0.5 text-[9px] leading-none"
          role="img"
          aria-label="Café"
        >
          ☕
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative rounded-full shrink-0 p-[2px] bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] shadow-sm overflow-hidden flex items-center justify-center',
        sizeClassName,
        className,
      )}
      title={alt}
    >
      <img
        src={NINE_AVATAR_SRC}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover rounded-full"
        loading="lazy"
      />
    </div>
  )
}

export default NineAvatar
