import React from 'react'
import { Link } from 'react-router-dom'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ExternalLink, Youtube, Sparkles, X, Music2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatExternalUrl } from '@/lib/openUrl'
import { getCapaIaUrl } from '@/services/openaiCapa'

interface EpisodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episode: {
    id?: string
    numero: number
    titulo: string
    youtube_url: string
    capa_ia?: string
    link_spotify?: string
    link_youtube?: string
    collectionId?: string
    collectionName?: string
  } | null
}

export const EpisodeModal: React.FC<EpisodeModalProps> = ({ open, onOpenChange, episode }) => {
  if (!episode) return null

  const validUrl = episode.youtube_url?.trim() ? formatExternalUrl(episode.youtube_url) : ''
  // Links opcionais dedicados de Spotify e YouTube exibidos como botões adicionais no modal
  const validSpotifyUrl = episode.link_spotify?.trim()
    ? formatExternalUrl(episode.link_spotify)
    : ''
  const validLinkYoutubeUrl = episode.link_youtube?.trim()
    ? formatExternalUrl(episode.link_youtube)
    : ''
  // Capa gerada por IA (ChatGPT) — exibida quando o episódio já a possui; sem capa, mantém o layout clássico
  const capaIaUrl = getCapaIaUrl(episode)

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

          {/* Capa gerada com IA (ChatGPT) — imagem de arte do episódio */}
          {capaIaUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-dourado/40 shadow-lg">
              <img
                src={capaIaUrl}
                alt={`Capa do episódio #${episode.numero} — ${episode.titulo}`}
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-2 right-2 inline-flex items-center gap-1.5 bg-vinho-dark/80 border border-dourado/50 text-dourado text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-1">
                <Sparkles className="w-3 h-3" />
                Capa com IA
              </div>
            </div>
          )}

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

          {/* Ações: Link inteligente nativo com abertura garantida em nova aba */}
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

          {/* Botões dedicados de Spotify e YouTube — só aparecem quando o episódio tem o link */}
          {(validSpotifyUrl || validLinkYoutubeUrl) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative z-20">
              {validSpotifyUrl && (
                <a
                  href={validSpotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-[#0b2e17] font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] no-underline cursor-pointer"
                >
                  <Music2 className="w-4 h-4 shrink-0" />
                  <span>Ouvir no Spotify</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              )}
              {validLinkYoutubeUrl && (
                <a
                  href={validLinkYoutubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] py-3 rounded-xl bg-[#FF0000] hover:bg-[#e60000] text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] no-underline cursor-pointer"
                >
                  <Youtube className="w-4 h-4 fill-white text-transparent shrink-0" />
                  <span>Assistir no YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Link para a página individual do episódio (mesma aba) */}
          <Link
            to={`/episodio/${episode.id ?? ''}`}
            className="w-full min-h-[44px] py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dourado/40 hover:border-dourado text-marfim font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] no-underline cursor-pointer relative z-20"
            onClick={() => onOpenChange(false)}
          >
            <Sparkles className="w-4 h-4 text-dourado shrink-0" />
            <span>Ver episódio completo</span>
            <ArrowRight className="w-4 h-4 text-dourado shrink-0" />
          </Link>

          <p className="text-center text-[10px] sm:text-[11px] text-marfim/50 italic">
            O conteúdo será aberto em uma nova aba com total segurança.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
