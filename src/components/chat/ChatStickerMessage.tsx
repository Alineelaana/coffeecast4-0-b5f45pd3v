import React from 'react'
import { isStickerMessage, extractStickerId, getStickerById } from './stickers'

interface ChatStickerMessageProps {
  content: string
  className?: string
  size?: number
  alt?: string
}

export const ChatStickerMessage: React.FC<ChatStickerMessageProps> = ({
  content,
  className = '',
  size = 96,
  alt,
}) => {
  if (!isStickerMessage(content)) {
    return <span className={className}>{content}</span>
  }

  const stickerId = extractStickerId(content)
  const sticker = getStickerById(stickerId)

  if (!sticker) {
    return (
      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-vinho/5 text-vinho text-xs">
        <span>☕</span>
        <span className="italic font-serif">[Figurinha CoffeeCast]</span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-1 select-none transition-transform hover:scale-105 ${className}`}
      title={alt || sticker.name}
      aria-label={alt || `Figurinha ${sticker.name}`}
    >
      <div className="filter drop-shadow-[0_4px_12px_rgba(75,30,63,0.18)]">
        {sticker.svg({ size })}
      </div>
      <span className="sr-only">{sticker.name}</span>
    </div>
  )
}

export default ChatStickerMessage
