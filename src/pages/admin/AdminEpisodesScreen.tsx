import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import type { EpisodioRecord } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit2, Trash2, ExternalLink, Play } from 'lucide-react'
import { toast } from 'sonner'
import { extractYouTubeId } from '@/lib/formatters'

export default function AdminEpisodesScreen() {
  const [episodios, setEpisodios] = useState<EpisodioRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEp, setEditingEp] = useState<EpisodioRecord | null>(null)

  const [numero, setNumero] = useState<string>('')
  const [titulo, setTitulo] = useState<string>('')
  const [youtubeUrl, setYoutubeUrl] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const loadEpisodes = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('episodios').getFullList<EpisodioRecord>({
        sort: 'numero',
      })
      setEpisodios(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar episódios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEpisodes()
  }, [])

  const handleOpenCreate = () => {
    setEditingEp(null)
    const nextNum = episodios.length > 0 ? Math.max(...episodios.map((e) => e.numero)) + 1 : 1
    setNumero(String(nextNum))
    setTitulo('')
    setYoutubeUrl('')
    setModalOpen(true)
  }

  const handleOpenEdit = (ep: EpisodioRecord) => {
    setEditingEp(ep)
    setNumero(String(ep.numero))
    setTitulo(ep.titulo)
    setYoutubeUrl(ep.youtube_url || '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const numInt = parseInt(numero, 10)
      if (isNaN(numInt)) {
        toast.error('Informe um número válido para o episódio.')
        setSaving(false)
        return
      }

      const payload = {
        numero: numInt,
        titulo: titulo.trim(),
        youtube_url: youtubeUrl.trim(),
      }

      if (editingEp) {
        await pb.collection('episodios').update(editingEp.id, payload)
        toast.success('Episódio atualizado com sucesso!')
      } else {
        await pb.collection('episodios').create(payload)
        toast.success('Episódio criado com sucesso!')
      }

      setModalOpen(false)
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar episódio.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, tit: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o episódio "${tit}"?`)) return

    try {
      await pb.collection('episodios').delete(id)
      toast.success('Episódio excluído com sucesso!')
      loadEpisodes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir episódio.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Gestão de Episódios
          </h2>
          <p className="text-xs text-vinho/70">
            Cadastre os links do YouTube, numeração e títulos exibidos na página principal.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-dourado shrink-0" />
          Novo Episódio
        </Button>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Carregando episódios...
          </div>
        ) : episodios.length === 0 ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-3">
            <p className="text-sm text-vinho/70 font-medium">Nenhum episódio cadastrado.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="min-h-[44px]">
              Criar primeiro episódio
            </Button>
          </div>
        ) : (
          episodios.map((ep) => (
            <div
              key={ep.id}
              className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-vinho/10 text-vinho font-bold text-xs inline-flex items-center justify-center shrink-0">
                    #{ep.numero}
                  </span>
                  <h3 className="text-xs font-bold text-vinho leading-tight">{ep.titulo}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(ep)}
                    className="h-9 w-9 p-0 text-vinho/70 hover:text-vinho min-h-[36px]"
                    title="Editar episódio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ep.id, ep.titulo)}
                    className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                    title="Excluir episódio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {ep.youtube_url && (
                <div className="pt-2 border-t border-vinho/5">
                  <a
                    href={ep.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-dourado-dark hover:underline truncate max-w-full font-medium"
                  >
                    <Play className="w-3.5 h-3.5 fill-dourado text-dourado shrink-0" />
                    <span className="truncate">{ep.youtube_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando episódios...</div>
        ) : episodios.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-vinho/70 font-medium">Nenhum episódio cadastrado.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm">
              Criar primeiro episódio
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-marfim">
              <TableRow className="border-b border-vinho/10">
                <TableHead className="w-20 font-bold text-vinho text-xs">Nº</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Título do Episódio</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Link YouTube</TableHead>
                <TableHead className="w-28 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {episodios.map((ep) => {
                return (
                  <TableRow key={ep.id} className="hover:bg-vinho/5">
                    <TableCell className="font-bold text-vinho text-xs">
                      <span className="w-7 h-7 rounded-full bg-vinho/10 text-vinho inline-flex items-center justify-center">
                        #{ep.numero}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-vinho max-w-md">
                      {ep.titulo}
                    </TableCell>
                    <TableCell className="text-xs text-vinho/70">
                      {ep.youtube_url ? (
                        <a
                          href={ep.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-dourado-dark hover:underline truncate max-w-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-dourado text-dourado" />
                          <span className="truncate">{ep.youtube_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-vinho/40 italic">Sem link cadastrado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(ep)}
                        className="h-8 w-8 p-0 text-vinho/70 hover:text-vinho hover:bg-vinho/10"
                        title="Editar episódio"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ep.id, ep.titulo)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir episódio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingEp ? 'Editar Episódio' : 'Novo Episódio'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ep-num" className="text-xs font-semibold text-vinho">
                Número do Episódio *
              </Label>
              <Input
                id="ep-num"
                type="number"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-title" className="text-xs font-semibold text-vinho">
                Título do Episódio *
              </Label>
              <Input
                id="ep-title"
                required
                placeholder="Ex.: Recomeços: histórias de quem escolheu começar de novo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-yt" className="text-xs font-semibold text-vinho">
                Link do YouTube (Watch URL ou Shorts) *
              </Label>
              <Input
                id="ep-yt"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-5"
              >
                {saving ? 'Salvando...' : 'Salvar Episódio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
