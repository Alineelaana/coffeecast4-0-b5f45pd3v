import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { getFileUrl } from '@/lib/formatters'
import type { MomentoRecord } from '@/types/database'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, ArrowUp, ArrowDown, Camera, Edit } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminMomentosScreen() {
  const [momentos, setMomentos] = useState<MomentoRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MomentoRecord | null>(null)
  const [legenda, setLegenda] = useState('')
  const [ordem, setOrdem] = useState('1')
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const loadMomentos = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('momentos').getFullList<MomentoRecord>({
        sort: 'ordem',
      })
      setMomentos(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar momentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMomentos()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setLegenda('')
    setOrdem(String(momentos.length + 1))
    setImagemFile(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: MomentoRecord) => {
    setEditingItem(item)
    setLegenda(item.legenda || '')
    setOrdem(item.ordem !== undefined && item.ordem !== null ? String(item.ordem) : '1')
    setImagemFile(null)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem && !imagemFile) {
      toast.error('Selecione uma imagem para o carrossel.')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('legenda', legenda.trim())
      formData.append('ordem', String(parseInt(ordem, 10) || 1))
      if (imagemFile) {
        formData.append('imagem', imagemFile)
      }

      if (editingItem) {
        await pb.collection('momentos').update(editingItem.id, formData)
        toast.success('Momento atualizado com sucesso!')
      } else {
        await pb.collection('momentos').create(formData)
        toast.success('Momento adicionado com sucesso!')
      }
      setModalOpen(false)
      loadMomentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar momento.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta foto do carrossel?')) return

    try {
      await pb.collection('momentos').delete(id)
      toast.success('Foto removida!')
      loadMomentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir momento.')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= momentos.length) return

    const current = momentos[index]
    const target = momentos[targetIndex]

    try {
      const currentOrdem = current.ordem || index + 1
      const targetOrdem = target.ordem || targetIndex + 1

      await pb.collection('momentos').update(current.id, { ordem: targetOrdem })
      await pb.collection('momentos').update(target.id, { ordem: currentOrdem })
      loadMomentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao reordenar momento.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">Nossos Momentos</h2>
          <p className="text-xs text-vinho/70">
            Adicione fotos e legendas para o carrossel da página inicial (que gira a cada 3
            segundos).
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-dourado shrink-0" />
          Adicionar Foto ao Carrossel
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-vinho/60">Carregando momentos...</div>
      ) : momentos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-vinho/10 p-12 text-center space-y-3">
          <Camera className="w-12 h-12 text-vinho/30 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-vinho">Nenhuma foto adicionada ainda</h3>
          <p className="text-xs text-vinho/60 max-w-sm mx-auto">
            Cadastre os registros de gravações, risadas, cafés e bastidores.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="bg-vinho text-white text-xs">
            Adicionar primeira foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {momentos.map((item, index) => {
            const photoUrl = item.imagem ? getFileUrl(item, item.imagem) : ''
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-vinho/10 overflow-hidden shadow-sm flex flex-col justify-between group"
              >
                <div className="relative aspect-video bg-vinho/5 overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.legenda || 'Momento'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-vinho/40">
                      Sem imagem
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-vinho/80 text-dourado text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                    Ordem #{item.ordem || index + 1}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-vinho/80 line-clamp-3">
                    {item.legenda || <span className="italic text-vinho/40">Sem legenda</span>}
                  </p>

                  <div className="pt-3 border-t border-vinho/5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        className="h-7 w-7 p-0 text-vinho/60 hover:text-vinho disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === momentos.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        className="h-7 w-7 p-0 text-vinho/60 hover:text-vinho disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="h-7 px-2 text-xs text-vinho/70 hover:text-vinho hover:bg-vinho/10 flex items-center gap-1"
                        title="Editar momento"
                      >
                        <Edit className="w-3.5 h-3.5 text-dourado-dark" />
                        <span>Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Foto dos Momentos' : 'Adicionar Foto aos Momentos'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-vinho">
                  Arquivo da Imagem {editingItem ? '(Opcional)' : '*'}
                </Label>
                {editingItem && (
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Deixe vazio para manter a foto atual
                  </span>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                required={!editingItem}
                onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                className="bg-white border-vinho/20 text-xs"
              />
              {editingItem && editingItem.imagem && !imagemFile && (
                <p className="text-[11px] text-vinho/65">
                  Foto atual preservada:{' '}
                  <code className="text-vinho font-mono">{editingItem.imagem}</code>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mom-ordem" className="text-xs font-semibold text-vinho">
                Ordem no Carrossel
              </Label>
              <Input
                id="mom-ordem"
                type="number"
                min="1"
                max="50"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mom-legenda" className="text-xs font-semibold text-vinho">
                Legenda da Foto
              </Label>
              <Input
                id="mom-legenda"
                placeholder="Ex.: Bastidores com café quentinho antes de gravar"
                value={legenda}
                onChange={(e) => setLegenda(e.target.value)}
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
                {saving ? 'Enviando...' : 'Salvar no Carrossel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
