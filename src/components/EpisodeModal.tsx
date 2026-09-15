import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ExternalLink, Youtube, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EpisodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episode: {
    numero: number
    titulo: string
    youtube_url: string
  } | null
}

export const EpisodeModal: React.FC<EpisodeModalProps> = ({ open, onOpenChange, episode }) => {
  if (!episode) return null

  const validUrl = episode.youtube_url?.trim()
    ? episode.youtube_url.trim().startsWith('http://') ||
      episode.youtube_url.trim().startsWith('https://')
      ? episode.youtube_url.trim()
      : `https://${episode.youtube_url.trim()}`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-lg bg-vinho-dark border-2 border-dourado/60 text-marfim p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative mx-auto">
        {/* Elementos sutis decorativos de fundo na paleta */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-dourado/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-rose-brand/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-5 sm:space-y-6">
          <DialogHeader className="space-y-2.5 sm:space-y-3 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-dourado uppercase tracking-wider bg-dourado/15 border border-dourado/30 px-3 py-0.5 sm:py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Episódio #{episode.numero}
              </div>
              <span className="text-[11px] text-marfim/60 font-medium">CoffeeCast 4.0</span>
            </div>

            <DialogTitle className="font-serif text-lg sm:text-2xl text-white font-bold leading-snug">
              {episode.titulo}
            </DialogTitle>

            <DialogDescription className="text-marfim/70 text-xs sm:text-sm sr-only">
              Informações sobre onde assistir ao episódio no YouTube
            </DialogDescription>
          </DialogHeader>

          {/* Card explicativo com identidade vinho, dourado e marfim */}
          <div className="bg-vinho/70 border border-dourado/30 rounded-2xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4 shadow-inner">
            <div className="w-13 h-13 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-tr from-dourado/30 via-dourado/10 to-transparent border border-dourado/40 flex items-center justify-center text-dourado shadow-md">
              <Youtube className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF0000]" />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h4 className="font-serif text-base sm:text-lg font-bold text-white flex items-center justify-center gap-2">
                <span>Este episódio é assistido no YouTube</span>
                <span className="text-base sm:text-lg">🎬</span>
              </h4>
              <p className="text-xs sm:text-sm text-marfim/85 leading-relaxed font-light max-w-sm mx-auto">
                Para proporcionar a melhor experiência audiovisual e permitir que você comente e
                interaja, nossos episódios completos são transmitidos em nosso canal oficial no
                YouTube.
              </p>
            </div>
          </div>

          {/* Ações: Link nativo em âncora <a> com target="_blank" para compatibilidade total */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-1 relative z-20">
            {validUrl ? (
              <a
                href={validUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 bg-dourado hover:bg-dourado-dark text-vinho font-bold py-3 min-h-[46px] text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] no-underline cursor-pointer"
              >
                <Youtube className="w-4 h-4 fill-[#FF0000] text-transparent shrink-0" />
                <span>Assistir no YouTube</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            ) : (
              <Button
                type="button"
                disabled
                className="w-full sm:flex-1 bg-dourado/50 text-vinho/70 font-bold py-3 min-h-[46px] text-sm rounded-xl cursor-not-allowed"
              >
                <Youtube className="w-4 h-4 fill-[#FF0000] text-transparent shrink-0" />
                <span>Link indisponível</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto border-dourado/30 hover:border-dourado bg-white/5 hover:bg-white/10 text-marfim text-xs sm:text-sm font-medium py-3 min-h-[46px] px-5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              <X className="w-4 h-4 mr-1.5 shrink-0" />
              Fechar
            </Button>
          </div>

          <p className="text-center text-[10px] sm:text-[11px] text-marfim/50 italic">
            O vídeo será aberto em uma nova aba com total segurança.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
