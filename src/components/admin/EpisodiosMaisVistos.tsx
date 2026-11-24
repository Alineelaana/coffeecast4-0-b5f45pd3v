// Estatísticas de visualização por episódio — card do Dashboard.
// Segue a matriz de permissões: só mostra para quem tem acesso à tela "episodios"
// (Master/Gerencial sempre; ADM apenas quando a tela está em allowedScreens).
// Mostra o "Episódio mais visto" + total geral e lista os 3 primeiros.

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { EpisodioRecord } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { Eye, Tv, ArrowRight, Trophy } from 'lucide-react'

export default function EpisodiosMaisVistos({
  episodios,
  loading,
}: {
  episodios: EpisodioRecord[]
  loading: boolean
}) {
  const { hasScreenPermission } = useAuth()
  const autorizado = useMemo(() => {
    try {
      return hasScreenPermission('episodios')
    } catch {
      return false
    }
  }, [hasScreenPermission])

  // Lista ordenada dos mais vistos (empate: maior número primeiro)
  const ranking = useMemo(() => {
    const lista = [...episodios]
    lista.sort((a, b) => {
      const va = typeof a.visualizacoes === 'number' ? a.visualizacoes : 0
      const vb = typeof b.visualizacoes === 'number' ? b.visualizacoes : 0
      if (vb !== va) return vb - va
      return (b.numero || 0) - (a.numero || 0)
    })
    return lista
  }, [episodios])

  const totalGeral = useMemo(
    () =>
      episodios.reduce(
        (acc, ep) => acc + (typeof ep.visualizacoes === 'number' ? ep.visualizacoes : 0),
        0,
      ),
    [episodios],
  )

  if (!autorizado) return null

  const maisVisto = ranking[0]
  const maisVistoViz =
    maisVisto && typeof maisVisto.visualizacoes === 'number' ? maisVisto.visualizacoes : 0

  return (
    <div className="bg-white border border-vinho/10 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-vinho flex items-center gap-2">
            <Eye className="w-5 h-5 text-dourado" />
            Estatísticas de Visualização
          </h3>
          <p className="text-xs text-vinho/65 mt-0.5">
            Páginas públicas dos episódios (/episodio/:id) — contador do site
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[11px] text-vinho/60 uppercase tracking-wider block">
            Total geral
          </span>
          <span className="font-serif text-2xl font-black text-vinho">
            {loading ? '-' : totalGeral.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-vinho/60">Carregando estatísticas...</div>
      ) : ranking.length === 0 ? (
        <div className="py-6 text-center text-xs text-vinho/60">
          Nenhum episódio cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Episódio mais visto */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-vinho to-vinho-dark rounded-2xl p-4 text-marfim shadow-md">
            <div className="w-10 h-10 rounded-xl bg-dourado/20 border border-dourado/40 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-dourado" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-dourado block">
                Episódio mais visto
              </span>
              <p className="text-sm font-bold text-white truncate">
                #{maisVisto.numero} — {maisVisto.titulo}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-serif text-2xl font-black text-dourado">
                {maisVistoViz.toLocaleString('pt-BR')}
              </span>
              <span className="block text-[10px] text-marfim/70">
                {maisVistoViz === 1 ? 'visualização' : 'visualizações'}
              </span>
            </div>
          </div>

          {/* Ranking (3 primeiros, desempate por número) */}
          <div className="divide-y divide-vinho/5 border border-vinho/10 rounded-xl overflow-hidden">
            {ranking.slice(0, 3).map((ep, idx) => {
              const viz = typeof ep.visualizacoes === 'number' ? ep.visualizacoes : 0
              return (
                <div key={ep.id} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                  <span className="text-[11px] font-bold text-vinho/40 w-5 shrink-0">
                    {idx + 1}º
                  </span>
                  <Tv className="w-3.5 h-3.5 text-dourado-dark shrink-0" />
                  <span className="text-xs font-semibold text-vinho truncate flex-1 min-w-0">
                    #{ep.numero} — {ep.titulo}
                  </span>
                  <span className="text-xs font-bold text-vinho/80 shrink-0 inline-flex items-center gap-1">
                    <Eye className="w-3 h-3 text-dourado-dark" />
                    {viz.toLocaleString('pt-BR')}
                  </span>
                </div>
              )
            })}
          </div>

          <Link
            to="/admin/episodios"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-dourado-dark hover:text-vinho transition-colors"
          >
            Ver todos os episódios
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
