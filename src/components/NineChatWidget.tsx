import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Headphones,
  Bot,
} from 'lucide-react'
import { NineAvatar } from '@/components/NineAvatar'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user' | 'humano'
  senderName?: string
  content: string
  timestamp: string
}

const QUICK_SUGGESTIONS = [
  'O que é o CoffeeCast 4.0?',
  'Quem são as integrantes?',
  'Como participar do podcast?',
  'Quero deixar um depoimento',
  'Onde assistir aos episódios?',
]

const COOKIE_STORAGE_KEY = 'coffeecast_cookies_accepted'
const CHAT_CONVERSATION_KEY = 'coffeecast_nine_conversation_id'

export const NineChatWidget: React.FC = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Olá! Eu sou a Nine, sua assistente virtual do CoffeeCast 4.0. Como posso te ajudar hoje? ☕',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [cookieBannerActive, setCookieBannerActive] = useState(false)
  const [hasUnreadNotice, setHasUnreadNotice] = useState(true)
  const [modoAtendimento, setModoAtendimento] = useState<string>('automatico')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Recupera conversationId persistido no localStorage (se existir)
  useEffect(() => {
    try {
      const savedConvId = localStorage.getItem(CHAT_CONVERSATION_KEY)
      if (savedConvId) {
        setConversationId(savedConvId)
      }
    } catch {
      /* intentionally ignored */
    }
  }, [])

  // Checa se o CookieBanner está presente para ajustar a posição do botão flutuante
  useEffect(() => {
    const checkCookieConsent = () => {
      try {
        const consent = localStorage.getItem(COOKIE_STORAGE_KEY)
        setCookieBannerActive(!consent)
      } catch {
        setCookieBannerActive(false)
      }
    }

    checkCookieConsent()
    const interval = setInterval(checkCookieConsent, 1500)
    return () => clearInterval(interval)
  }, [])

  // Rola mensagens para baixo suavemente
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setHasUnreadNotice(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 200)
    }
  }, [isOpen, messages, isLoading])

  // Polling leve para sincronizar respostas humanas e novas mensagens da conversa quando o chat estiver aberto
  useEffect(() => {
    if (!isOpen || !conversationId) return

    const fetchSyncMessages = async () => {
      try {
        const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
        const res = await fetch(
          `${baseUrl}/backend/v1/nine/chat/messages?conversation_id=${encodeURIComponent(conversationId)}`,
        )
        if (!res.ok) return
        const data = await res.json()

        if (data.modo_atendimento) {
          setModoAtendimento(data.modo_atendimento)
        }

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          const synced: ChatMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            role:
              m.remetente === 'visitante'
                ? 'user'
                : m.remetente === 'humano'
                  ? 'humano'
                  : 'assistant',
            senderName:
              m.remetente_nome || (m.remetente === 'humano' ? 'Equipe CoffeeCast' : 'Nine'),
            content: m.conteudo,
            timestamp: m.created
              ? new Date(m.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
          }))

          setMessages((prev) => {
            // Se o número de mensagens mudou ou há id diferente, atualiza
            if (synced.length !== prev.filter((p) => !p.id.startsWith('welcome')).length) {
              return synced
            }
            return prev
          })
        }
      } catch (err) {
        // silencioso no polling
      }
    }

    fetchSyncMessages()
    const pollInterval = setInterval(fetchSyncMessages, 3500)
    return () => clearInterval(pollInterval)
  }, [isOpen, conversationId])

  // Não renderizar de forma alguma na área administrativa
  if (location.pathname.startsWith('/admin')) {
    return null
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
      const res = await fetch(`${baseUrl}/backend/v1/nine/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      })

      if (!res.ok) {
        throw new Error(`Status ${res.status}`)
      }

      const data = await res.json()
      if (data.conversation_id) {
        setConversationId(data.conversation_id)
        try {
          localStorage.setItem(CHAT_CONVERSATION_KEY, data.conversation_id)
        } catch {
          /* intentionally ignored */
        }
      }

      if (data.modo_atendimento) {
        setModoAtendimento(data.modo_atendimento)
      }

      const replyContent =
        data.content || 'Não consegui responder agora — tente novamente em instantes 💛'

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: data.em_atendimento_humano ? 'humano' : 'assistant',
        senderName: data.em_atendimento_humano ? 'Equipe CoffeeCast' : 'Nine',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.log('Erro ao conversar com a Nine:', err)
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Não consegui responder agora — tente novamente em instantes 💛',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Conversa reiniciada! Como posso te ajudar agora? Fique à vontade para perguntar sobre episódios, integrantes ou como participar! ☕',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setConversationId(null)
    setModoAtendimento('automatico')
    try {
      localStorage.removeItem(CHAT_CONVERSATION_KEY)
    } catch {
      /* intentionally ignored */
    }
  }

  const isHumanoMode =
    modoAtendimento === 'humano_respondendo' || modoAtendimento === 'aguardando_humano'

  return (
    <>
      {/* Botão Flutuante (Launcher) no canto inferior direito */}
      <div
        className={cn(
          'fixed right-4 sm:right-6 z-40 transition-all duration-300 ease-out flex items-center gap-3',
          cookieBannerActive ? 'bottom-28 sm:bottom-28 md:bottom-24' : 'bottom-5 sm:bottom-6',
        )}
      >
        {/* Balãozinho sutil de chamada quando fechado */}
        {!isOpen && hasUnreadNotice && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#FAF8F5] text-[#4B1E3F] text-xs font-semibold py-2 px-3.5 rounded-2xl shadow-[0_4px_20px_rgba(75,30,63,0.18)] border border-[#D4AF37]/50 cursor-pointer animate-in fade-in slide-in-from-right-4 hover:border-[#D4AF37] group transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Fale com a Nine</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Fechar chat com a Nine' : 'Abrir chat com a Nine'}
          className={cn(
            'group relative rounded-full p-[2px] transition-all duration-300 shadow-[0_8px_30px_rgba(75,30,63,0.35)] hover:shadow-[0_12px_40px_rgba(75,30,63,0.45)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/40',
            isOpen
              ? 'bg-[#4B1E3F] border border-[#D4AF37]'
              : 'bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]',
          )}
        >
          {isOpen ? (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#4B1E3F] flex items-center justify-center text-[#D4AF37] transition-transform">
              <X className="w-7 h-7" />
            </div>
          ) : (
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#FAF8F5]">
              <NineAvatar sizeClassName="w-full h-full" alt="Nine · Assistente Virtual" />
              {/* Badge indicadora online */}
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#FAF8F5] shadow-sm" />
            </div>
          )}
        </button>
      </div>

      {/* Janela de Chat */}
      {isOpen && (
        <aside
          role="dialog"
          aria-label="Chat com a Nine"
          className={cn(
            'fixed z-50 transition-all duration-300 ease-out flex flex-col',
            'inset-x-2 bottom-2 top-16 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-24 sm:w-[420px] sm:h-[580px] max-h-[92vh]',
            'bg-[#FAF8F5] border-2 border-[#D4AF37] rounded-3xl shadow-[0_20px_60px_rgba(75,30,63,0.35)] overflow-hidden animate-in fade-in zoom-in-95',
          )}
        >
          {/* Cabeçalho */}
          <div className="bg-[#4B1E3F] text-[#FAF8F5] px-4 sm:px-5 py-3.5 border-b border-[#D4AF37]/40 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <NineAvatar sizeClassName="w-11 h-11" alt="Nine" />
                <span
                  className={cn(
                    'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#4B1E3F]',
                    isHumanoMode ? 'bg-blue-400' : 'bg-emerald-500',
                  )}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#FAF8F5] tracking-wide leading-tight">
                    {isHumanoMode ? 'Atendimento CoffeeCast' : 'Nine'}
                  </h3>
                  <span
                    className={cn(
                      'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border',
                      isHumanoMode
                        ? 'bg-blue-900/60 text-blue-200 border-blue-400/50'
                        : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40',
                    )}
                  >
                    {isHumanoMode ? 'Equipe Ao Vivo' : 'Online'}
                  </span>
                </div>
                <p className="text-xs text-[#FAF8F5]/80 font-light leading-snug">
                  {isHumanoMode
                    ? 'Atendimento com agente da equipe'
                    : 'Assistente Virtual · CoffeeCast 4.0'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reiniciar conversa"
                aria-label="Reiniciar conversa"
                className="p-2 rounded-xl text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-white/10 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Fechar chat"
                aria-label="Fechar chat"
                className="p-2 rounded-xl text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-white/10 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader / Tagline */}
          <div className="bg-[#FAF8F5] px-4 py-1.5 border-b border-[#4B1E3F]/10 flex items-center justify-between text-[11px] text-[#4B1E3F]/75 font-medium shrink-0">
            <span className="flex items-center gap-1">
              ☕ <em>Aqui sempre tem uma boa conversa</em>
            </span>
            <span className="text-[#D4AF37] font-semibold tracking-wider text-[10px] uppercase">
              {isHumanoMode ? 'Suporte Direto' : 'IA Oficial'}
            </span>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#FAF8F5]">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant'
              const isHumano = msg.role === 'humano'
              const isUser = msg.role === 'user'

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-end gap-2.5 max-w-[88%]',
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto',
                  )}
                >
                  {isAssistant && <NineAvatar sizeClassName="w-8 h-8" alt="Nine" />}
                  {isHumano && (
                    <div className="w-8 h-8 rounded-full bg-[#4B1E3F] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs">
                      <Headphones className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all break-words',
                      isUser
                        ? 'bg-[#4B1E3F] text-[#FAF8F5] rounded-br-sm border border-[#4B1E3F]'
                        : isHumano
                          ? 'bg-[#3A1430] text-white rounded-bl-sm border border-[#D4AF37]/60'
                          : 'bg-white text-[#4B1E3F] border border-[#D4AF37]/30 rounded-bl-sm',
                    )}
                  >
                    {isHumano && (
                      <span className="block text-[10px] font-bold text-[#D4AF37] mb-1">
                        {msg.senderName || 'Equipe CoffeeCast'}:
                      </span>
                    )}
                    <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                    <span
                      className={cn(
                        'block text-[10px] mt-1 font-light',
                        isUser
                          ? 'text-[#FAF8F5]/60 text-right'
                          : isHumano
                            ? 'text-white/60 text-left'
                            : 'text-[#4B1E3F]/50 text-left',
                      )}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Indicador de digitando... */}
            {isLoading && (
              <div className="flex items-end gap-2.5 mr-auto max-w-[85%] animate-in fade-in">
                <NineAvatar sizeClassName="w-8 h-8" alt="Nine digitando" />
                <div className="bg-white border border-[#D4AF37]/40 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#4B1E3F]/80">
                    {isHumanoMode ? 'Equipe preparando resposta' : 'Nine está pensando'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4B1E3F] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4B1E3F] animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas (Chips clicáveis) */}
          <div className="bg-[#FAF8F5] px-3 py-2 border-t border-[#4B1E3F]/10 overflow-x-auto shrink-0 flex items-center gap-1.5 no-scrollbar">
            {QUICK_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(sug)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-[#4B1E3F] border border-[#D4AF37]/50 hover:bg-[#4B1E3F] hover:text-[#FAF8F5] hover:border-[#4B1E3F] transition-all active:scale-95 disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Campo de Entrada e Envio */}
          <div className="p-3 bg-[#FAF8F5] border-t border-[#D4AF37]/30 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                maxLength={1500}
                placeholder={
                  isHumanoMode
                    ? 'Envie sua mensagem para a equipe... ☕'
                    : 'Pergunte à Nine sobre o CoffeeCast... ☕'
                }
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-[#4B1E3F]/20 rounded-xl text-[#4B1E3F] placeholder:text-[#4B1E3F]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                aria-label="Enviar mensagem"
                className="w-10 h-10 rounded-xl bg-[#4B1E3F] text-[#FAF8F5] border border-[#D4AF37] flex items-center justify-center shrink-0 hover:bg-[#36142D] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                ) : (
                  <Send className="w-4 h-4 text-[#D4AF37]" />
                )}
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#4B1E3F]/60 px-1">
              <span>
                {isHumanoMode
                  ? 'Atendimento humanizado CoffeeCast'
                  : 'Respostas geradas por IA da Nine'}
              </span>
              <a
                href="https://instagram.com/coffeecast4.0"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#4B1E3F] underline flex items-center gap-0.5"
              >
                <span>@coffeecast4.0</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </aside>
      )}
    </>
  )
}

export default NineChatWidget
