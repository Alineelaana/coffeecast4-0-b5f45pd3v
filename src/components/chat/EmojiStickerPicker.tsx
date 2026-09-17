import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Smile, Sticker as StickerIcon, Search, X, Clock, Sparkles } from 'lucide-react'
import { EMOJI_CATEGORIES, getRecentEmojis, saveRecentEmoji, EmojiItem } from './emojis'
import { COFFEECAST_STICKERS, StickerDefinition } from './stickers'

export interface EmojiStickerPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectEmoji: (emoji: string) => void
  onSelectSticker: (stickerId: string) => void
  className?: string
  /**
   * Alinhamento horizontal do painel (left ou right). Padrão 'left'.
   */
  align?: 'left' | 'right'
}

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  onSelectSticker,
  className = '',
  align = 'left',
}) => {
  const [activeTab, setActiveTab] = useState<'emojis' | 'stickers'>('emojis')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])

  const panelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Carregar recentes ao abrir
  useEffect(() => {
    if (isOpen) {
      setRecentEmojis(getRecentEmojis())
    }
  }, [isOpen])

  // Fechar ao clicar fora ou apertar ESC
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Filtragem de emojis por busca em português e categoria
  const filteredEmojiCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return EMOJI_CATEGORIES.map((cat) => {
      if (selectedCategory !== 'todos' && cat.id !== selectedCategory) {
        return { ...cat, emojis: [] }
      }

      if (!term) return cat

      const matchedEmojis = cat.emojis.filter((item: EmojiItem) => {
        if (item.name.toLowerCase().includes(term)) return true
        return item.keywords.some((k) => k.toLowerCase().includes(term))
      })

      return {
        ...cat,
        emojis: matchedEmojis,
      }
    }).filter((cat) => cat.emojis.length > 0)
  }, [searchTerm, selectedCategory])

  // Filtragem de figurinhas por busca
  const filteredStickers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return COFFEECAST_STICKERS

    return COFFEECAST_STICKERS.filter((s: StickerDefinition) => {
      if (s.name.toLowerCase().includes(term)) return true
      return s.keywords.some((k) => k.toLowerCase().includes(term))
    })
  }, [searchTerm])

  const handleEmojiClick = (emoji: string) => {
    const updated = saveRecentEmoji(emoji)
    setRecentEmojis(updated)
    onSelectEmoji(emoji)
  }

  const handleStickerClick = (stickerId: string) => {
    onSelectSticker(stickerId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Seletor de Emojis e Figurinhas"
      className={`absolute bottom-full mb-2 z-50 w-[310px] sm:w-[350px] max-w-[calc(100vw-24px)] bg-[#FAF8F5] border-2 border-[#D4AF37] rounded-3xl shadow-[0_16px_40px_rgba(75,30,63,0.28)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 font-sans ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${className}`}
      style={{ height: '360px' }}
    >
      {/* CABEÇALHO DO PAINEL COM ABAS E BOTÃO FECHAR */}
      <div className="bg-[#4B1E3F] px-3 py-2 border-b border-[#D4AF37]/40 flex items-center justify-between gap-2 shrink-0">
        {/* Abas Emojis vs Stickers */}
        <div className="flex items-center gap-1 bg-[#34112C] p-1 rounded-xl border border-[#D4AF37]/30">
          <button
            type="button"
            onClick={() => {
              setActiveTab('emojis')
              setSearchTerm('')
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'emojis'
                ? 'bg-[#D4AF37] text-[#4B1E3F] shadow-xs'
                : 'text-[#FAF8F5]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('stickers')
              setSearchTerm('')
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stickers'
                ? 'bg-[#D4AF37] text-[#4B1E3F] shadow-xs'
                : 'text-[#FAF8F5]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <StickerIcon className="w-3.5 h-3.5" />
            <span>Figurinhas</span>
          </button>
        </div>

        {/* Botão fechar painel */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar seletor"
          className="p-1.5 rounded-lg text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CAMPO DE BUSCA EM PORTUGUÊS */}
      <div className="p-2.5 bg-[#FAF8F5] border-b border-[#4B1E3F]/10 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#4B1E3F]/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'emojis'
                ? 'Buscar emoji (ex: cafe, amor, sorriso)...'
                : 'Buscar figurinha (ex: cafe, brinde, kkk)...'
            }
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#4B1E3F]/20 rounded-xl text-[#4B1E3F] placeholder:text-[#4B1E3F]/45 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4B1E3F]/40 hover:text-[#4B1E3F]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO ROLÁVEL */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-gradient-to-b from-[#FAF8F5] to-white/70">
        {activeTab === 'emojis' ? (
          <>
            {/* FILEIRA DE RECENTES (Se não estiver buscando) */}
            {!searchTerm && recentEmojis.length > 0 && selectedCategory === 'todos' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4B1E3F]/70 uppercase tracking-wider">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>Usados Recentemente</span>
                </div>
                <div className="grid grid-cols-8 gap-1 p-1.5 bg-white/80 border border-[#D4AF37]/30 rounded-2xl shadow-2xs">
                  {recentEmojis.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-[#F4EFEA] hover:scale-125 active:scale-95 transition-transform"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORIAS COM EMOJIS */}
            {filteredEmojiCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#4B1E3F]/60">
                Nenhum emoji encontrado para "{searchTerm}".
              </div>
            ) : (
              filteredEmojiCategories.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4B1E3F]/70 uppercase tracking-wider sticky top-0 bg-[#FAF8F5]/95 py-0.5 backdrop-blur-xs">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {cat.emojis.map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => handleEmojiClick(item.emoji)}
                        title={item.name}
                        aria-label={item.name}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white hover:shadow-xs hover:scale-125 active:scale-95 transition-transform"
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          /* ABA DE FIGURINHAS (STICKERS) */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#4B1E3F]/70 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Figurinhas Exclusivas CoffeeCast 4.0
              </span>
              <span className="text-[9px] font-normal lowercase text-[#D4AF37]">
                envio em 1 toque
              </span>
            </div>

            {filteredStickers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#4B1E3F]/60">
                Nenhuma figurinha encontrada para "{searchTerm}".
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {filteredStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => handleStickerClick(sticker.id)}
                    className="group flex flex-col items-center justify-between p-2 rounded-2xl bg-white border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                    title={`Enviar figurinha: ${sticker.name}`}
                  >
                    <div className="w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-110">
                      {sticker.svg({ size: 64 })}
                    </div>
                    <span className="text-[10px] font-bold text-[#4B1E3F] text-center truncate w-full mt-1 group-hover:text-[#D4AF37]">
                      {sticker.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BARRA INFERIOR DE CATEGORIAS (Apenas se estiver na aba de emojis e sem busca) */}
      {activeTab === 'emojis' && !searchTerm && (
        <div className="bg-[#FAF8F5] px-2 py-1.5 border-t border-[#4B1E3F]/10 flex items-center justify-around shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('todos')}
            className={`p-1 rounded-lg text-xs transition-colors ${
              selectedCategory === 'todos'
                ? 'bg-[#4B1E3F] text-white font-bold'
                : 'text-[#4B1E3F]/60 hover:bg-[#4B1E3F]/10'
            }`}
            title="Todos os emojis"
          >
            Todos
          </button>
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-1 rounded-lg text-sm transition-transform ${
                selectedCategory === cat.id
                  ? 'bg-[#4B1E3F] text-white scale-110 shadow-xs'
                  : 'hover:bg-[#4B1E3F]/10 opacity-70 hover:opacity-100'
              }`}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmojiStickerPicker
