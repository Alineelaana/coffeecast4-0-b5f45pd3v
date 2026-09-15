import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { extractYouTubeId } from '@/lib/formatters'
import { ExternalLink } from 'lucide-react'

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

  const videoId = extractYouTubeId(episode.youtube_url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-vinho-dark border-2 border-dourado/60 text-marfim p-4 sm:p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-dourado uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-dourado animate-ping" />
            Episódio #{episode.numero}
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl text-white font-bold leading-snug">
            {episode.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-white/10 shadow-inner">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={episode.titulo}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
              <p className="text-sm text-marfim/70">
                O link do vídeo cadastrado está disponível no YouTube:
              </p>
              <a
                href={episode.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-dourado hover:bg-dourado-dark text-vinho font-bold px-4 py-2 rounded-full text-sm transition-all"
              >
                Abrir no YouTube
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-marfim/60">
          <span>CoffeeCast 4.0 — Histórias que transformam</span>
          {episode.youtube_url && (
            <a
              href={episode.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-dourado flex items-center gap-1 transition-colors"
            >
              Assistir direto no YouTube
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
