// src/components/admin/NineOnlineChat.tsx
// Nine Online — assistente virtual do PAINEL ADMINISTRATIVO (CoffeeCast 4.0).
// Botão redondo fixo na lateral direita + painel de chat deslizante.
//
// - Só é renderizado dentro do AdminLayout (nunca no site público).
// - Foto de perfil: a MESMA imagem da Nine do site público (src/assets/nineAvatar.ts).
// - Backend: agente NATIVO Skip Cloud "nine-online" via hook
//   pocketbase/hooks/nine_online_agent.js (POST /backend/v1/nine-online/chat),
//   que injeta as permissões de tela do usuário logado na conversa.
// - Somente consulta: a Nine Online não cria/edita/exclui registros.

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, BookOpen } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { NINE_AVATAR_SRC } from '@/assets/nineAvatar'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import NineOnlineLogicaTela from '@/components/admin/NineOnlineLogicaTela'

interface NineOnlineMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MENSAGEM_BOAS_VINDAS =
  'Olá! ☕ Eu sou a Nine Online, assistente virtual do painel CoffeeCast 4.0. Posso consultar episódios, gravações da agenda, leads, contatos, convidados, roteiros, tarefas de retorno e portfolios — sempre conforme as permissões do seu perfil. Como posso ajudar?'

function agoraHora(): string {
  try {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch (_) {
    return ''
  }
}

export const NineOnlineChat: React.FC = () => {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<NineOnlineMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversationIdRef = useRef<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mantém a rolagem no fim conforme as mensagens chegam.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending, open])

  // Foca o input ao abrir o painel.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(t)
    }
  }, [open])

  const enviar = useCallback(async () => {
    const texto = input.trim()
    if (!texto || sending) return

    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: texto }])
    setSending(true)

    try {
      const res = await pb.send('/backend/v1/nine-online/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: texto,
          conversation_id: conversationIdRef.current || undefined,
        }),
      })
      const data = res as { content?: string; conversation_id?: string; error?: string }
      if (data && data.error) throw new Error(data.error)
      if (data && data.conversation_id) conversationIdRef.current = data.conversation_id
      const resposta = (data && data.content) || ''
      setMessages((prev) => [
        ...prev,
        {
          id: `nine-${Date.now()}`,
          role: 'assistant',
          content:
            resposta || 'Não consegui obter uma resposta agora — tente novamente em instantes 💛',
        },
      ])
    } catch (err: unknown) {
      const msg =
        (err && typeof err === 'object' && 'message' in err && String((err as Error).message)) ||
        'Falha ao falar com a Nine Online — verifique sua conexão e tente novamente.'
      setError(msg)
      toast({
        title: 'Nine Online',
        description: 'Não consegui responder agora — tente novamente em instantes.',
        variant: 'destructive',
      })
      // Devolve o texto ao campo para não perder o que a pessoa digitou.
      setInput(texto)
      setMessages((prev) => prev.filter((m) => m.id !== `user-${Date.now()}`))
    } finally {
      setSending(false)
    }
  }, [input, sending, toast])

  const onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault()
      enviar()
    }
  }

  return (
    <>
      {/* BOTÃO FLUTUANTE — lateral direita, discreto, toque >= 44px no celular.
          z-40: fica sobre o conteúdo normal, mas ABAIXO do drawer/gaveta (z-50),
          de modais e do cabeçalho móvel (z-40 com painel fechado ele fica abaixo
          dos elementos de navegação críticos graças à posição na borda direita). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar chat com a Nine Online' : 'Falar com a Nine Online'}
        title={open ? 'Fechar chat da Nine Online' : 'Falar com a Nine Online'}
        className={cn(
          'fixed z-40 right-3 sm:right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] md:bottom-5',
          'group flex items-center justify-center rounded-full',
          'w-11 h-11 sm:w-14 sm:h-14 p-0',
          'bg-gradient-to-tr from-[#4B1E3F] to-[#6B2A57] ring-2 ring-[#D4AF37]/80',
          'shadow-[0_8px_24px_rgba(75,30,63,0.45)]',
          'transition-all duration-200 hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]',
        )}
      >
        <img
          src={NINE_AVATAR_SRC}
          alt="Nine Online — Assistente Virtual do Painel CoffeeCast 4.0"
          className="w-full h-full object-cover rounded-full pointer-events-none select-none"
          loading="lazy"
        />
        <span className="pointer-events-none absolute right-full mr-3 hidden md:block whitespace-nowrap rounded-lg bg-vinho text-marfim text-xs font-medium px-3 py-1.5 shadow-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 border border-dourado/50">
          Falar com a Nine Online
        </span>
        {open && (
          <span className="absolute inset-0 rounded-full bg-vinho/80 flex items-center justify-center">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-dourado stroke-[2.5]" />
          </span>
        )}
      </button>

      {/* PAINEL DE CHAT — desliza pela lateral direita. No celular ocupa a
          largura da tela respeitando o cabeçalho móvel do painel (~96px com
          logo h-16 + py-3 + safe-area-inset, ver AdminLayoutLogicaTela.tsx). */}
      <div
        aria-hidden={!open}
        className={cn(
          'fixed z-40 top-0 bottom-0 right-0 w-full sm:w-[408px]',
          'bg-marfim border-l-2 border-dourado/60 shadow-[0_0_48px_rgba(75,30,63,0.35)]',
          'flex flex-col transform transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none',
        )}
        role="dialog"
        aria-label="Chat com a Nine Online"
      >
        {/* Cabeçalho do painel — mesmo padrão de altura do cabeçalho móvel do painel */}
        <div
          className="bg-vinho text-white border-b-2 border-dourado flex items-center gap-3 px-3 sm:px-4 shrink-0"
          style={{
            paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
            paddingBottom: '0.75rem',
          }}
        >
          <img
            src={NINE_AVATAR_SRC}
            alt="Nine Online"
            className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-full ring-2 ring-dourado/80 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-base sm:text-lg leading-tight text-white truncate">
              Nine Online
            </p>
            <p className="text-[11px] sm:text-xs text-dourado-light leading-tight truncate">
              Assistente virtual do painel · somente consulta
            </p>
          </div>
          <NineOnlineLogicaTela>
            <button
              type="button"
              aria-label="Lógica da Tela — Nine Online"
              title="Lógica da Tela — Nine Online"
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-vinho-light text-dourado hover:bg-vinho-light/80 active:scale-95 transition-all shrink-0"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </NineOnlineLogicaTela>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar chat"
            title="Fechar chat"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-vinho-light text-marfim hover:bg-vinho-light/80 active:scale-95 transition-all shrink-0"
          >
            <X className="w-5 h-5 text-dourado stroke-[2.5]" />
          </button>
        </div>

        {/* Histórico de mensagens */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-vinho/10 text-vinho text-sm px-3.5 py-2.5 shadow-sm">
              <p className="whitespace-pre-wrap break-words">{MENSAGEM_BOAS_VINDAS}</p>
            </div>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl text-sm px-3.5 py-2.5 shadow-sm',
                  m.role === 'user'
                    ? 'rounded-tr-sm bg-vinho text-marfim'
                    : 'rounded-tl-sm bg-white border border-vinho/10 text-vinho',
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p
                  className={cn(
                    'mt-1 text-[10px] opacity-60',
                    m.role === 'user' ? 'text-marfim/70 text-right' : 'text-vinho/50',
                  )}
                >
                  {agoraHora()}
                </p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-vinho/10 text-vinho text-sm px-3.5 py-2.5 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-dourado" />
                <span className="text-xs text-muted-foreground">
                  Nine Online consultando o sistema…
                </span>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 text-red-800 text-sm px-3.5 py-2.5 flex items-start gap-2"
            >
              <span aria-hidden>⚠️</span>
              <span className="break-words">{error}</span>
            </div>
          )}
        </div>

        {/* Entrada de mensagem */}
        <div
          className="border-t border-dourado/40 bg-white px-3 sm:px-4 py-3 shrink-0"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={sending}
              maxLength={1500}
              placeholder="Pergunte à Nine Online…"
              aria-label="Mensagem para a Nine Online"
              className="flex-1 min-h-[44px] rounded-xl border border-vinho/20 bg-marfim/60 px-3.5 text-sm text-vinho placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-dourado/60 focus:border-dourado disabled:opacity-60"
            />
            <button
              type="button"
              onClick={enviar}
              disabled={sending || !input.trim()}
              aria-label="Enviar mensagem"
              title="Enviar mensagem"
              className="min-w-[44px] min-h-[44px] w-11 h-11 shrink-0 rounded-xl bg-vinho text-dourado hover:bg-vinho-light active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
            Consulta os dados do sistema conforme as permissões do seu perfil · não altera registros
          </p>
        </div>
      </div>
    </>
  )
}

export default NineOnlineChat
