import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { getFileUrl } from '@/lib/formatters'
import type { IntegranteRecord } from '@/types/database'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit2, Trash2, Upload, ExternalLink, Video } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminIntegrantesScreen() {
  const [integrantes, setIntegrantes] = useState<IntegranteRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IntegranteRecord | null>(null)

  const [nome, setNome] = useState('')
  const [biografia, setBiografia] = useState('')
  const [ordem, setOrdem] = useState('1')
  const [instagram, setInstagram] = useState('')
  const [linkEpisodio, setLinkEpisodio] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const loadIntegrantes = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('integrantes').getFullList<IntegranteRecord>({
        sort: 'ordem',
      })
      setIntegrantes(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar integrantes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIntegrantes()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setNome('')
    setBiografia('')
    setOrdem(String(integrantes.length + 1))
    setInstagram('')
    setLinkEpisodio('')
    setFotoFile(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: IntegranteRecord) => {
    setEditingItem(item)
    setNome(item.nome || '')
    setBiografia(item.biografia || '')
    setOrdem(item.ordem !== undefined && item.ordem !== null ? String(item.ordem) : '1')
    setInstagram(item.instagram || '')
    setLinkEpisodio(item.link_episodio || '')
    setFotoFile(null)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('biografia', biografia.trim())
      formData.append('ordem', ordem)
      formData.append('instagram', instagram.trim())
      formData.append('link_episodio', linkEpisodio.trim())
      if (fotoFile) {
        formData.append('foto', fotoFile)
      }

      if (editingItem) {
        await pb.collection('integrantes').update(editingItem.id, formData)
        toast.success('Integrante atualizada com sucesso!')
      } else {
        await pb.collection('integrantes').create(formData)
        toast.success('Integrante cadastrada com sucesso!')
      }

      setModalOpen(false)
      loadIntegrantes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar integrante.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover a integrante "${name}"?`)) return

    try {
      await pb.collection('integrantes').delete(id)
      toast.success('Integrante removida com sucesso!')
      loadIntegrantes()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir integrante.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">Equipe Principal</h2>
          <p className="text-xs text-vinho/70">
            Gerencie as quatro vozes à frente do CoffeeCast 4.0 exibidas na seção da página inicial
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-dourado shrink-0" />
          Adicionar Integrante
        </Button>
      </div>
      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center text-xs text-vinho/60">
            Carregando integrantes...
          </div>
        ) : integrantes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-vinho/10 p-8 text-center space-y-3">
            <p className="text-sm text-vinho/70 font-medium">Nenhuma integrante cadastrada.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm" className="min-h-[44px]">
              Adicionar primeira integrante
            </Button>
          </div>
        ) : (
          integrantes.map((item) => {
            const photoUrl = item.foto ? getFileUrl(item, item.foto, '100x100') : ''
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-vinho/10 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={item.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-dourado shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-sm shrink-0">
                        {item.nome.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-dourado/20 text-vinho px-1.5 py-0.5 rounded">
                          #{item.ordem || '-'}
                        </span>
                        <h3 className="text-sm font-bold text-vinho">{item.nome}</h3>
                      </div>
                      {item.instagram && (
                        <p className="text-xs text-dourado-dark font-medium mt-0.5">
                          {item.instagram.startsWith('@') ? item.instagram : `@${item.instagram}`}
                        </p>
                      )}
                      {item.link_episodio && (
                        <p className="text-[11px] text-vinho/70 flex items-center gap-1 mt-0.5">
                          <Video className="w-3 h-3 text-red-600 shrink-0" />
                          <span>Entrevista vinculada</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-9 w-9 p-0 text-vinho/70 hover:text-vinho min-h-[36px]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.nome)}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700 min-h-[36px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {item.biografia && (
                  <p className="text-xs text-vinho/75 bg-marfim/60 p-3 rounded-xl border border-vinho/10 leading-relaxed">
                    {item.biografia}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando integrantes...</div>
        ) : integrantes.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-vinho/70 font-medium">Nenhuma integrante cadastrada.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm">
              Adicionar primeira integrante
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-marfim">
              <TableRow className="border-b border-vinho/10">
                <TableHead className="w-16 font-bold text-vinho text-xs">Ordem</TableHead>
                <TableHead className="w-20 font-bold text-vinho text-xs">Foto</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Nome</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Instagram (@)</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Episódio Entrevista</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Biografia</TableHead>
                <TableHead className="w-28 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>{' '}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {integrantes.map((item) => {
                const photoUrl = item.foto ? getFileUrl(item, item.foto, '100x100') : ''
                return (
                  <TableRow key={item.id} className="hover:bg-vinho/5">
                    <TableCell className="font-bold text-vinho text-xs">
                      #{item.ordem || '-'}
                    </TableCell>
                    <TableCell>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={item.nome}
                          className="w-10 h-10 rounded-full object-cover border border-dourado"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-vinho/10 text-vinho font-bold flex items-center justify-center text-xs">
                          {item.nome.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-vinho">{item.nome}</TableCell>
                    <TableCell className="text-xs text-vinho/80">
                      {item.instagram ? (
                        <span className="font-medium text-vinho bg-vinho/5 px-2 py-0.5 rounded border border-vinho/10">
                          {item.instagram.startsWith('@') ? item.instagram : `@${item.instagram}`}
                        </span>
                      ) : (
                        <span className="text-vinho/40 italic">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-vinho/80">
                      {item.link_episodio ? (
                        <a
                          href={item.link_episodio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-vinho hover:text-dourado-dark hover:underline bg-vinho/5 px-2 py-0.5 rounded border border-vinho/10"
                          title={item.link_episodio}
                        >
                          <Video className="w-3 h-3 text-red-600 shrink-0" />
                          <span>Assistir</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-vinho/40 italic">Não vinculado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-vinho/75 max-w-md line-clamp-2">
                      {item.biografia}
                    </TableCell>{' '}
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 p-0 text-vinho/70 hover:text-vinho hover:bg-vinho/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.nome)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Integrante' : 'Nova Integrante'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="int-nome" className="text-xs font-semibold text-vinho">
                Nome Completo *
              </Label>
              <Input
                id="int-nome"
                required
                placeholder="Ex.: Aline Lana"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="int-ordem" className="text-xs font-semibold text-vinho">
                Ordem de Exibição (1 a 4)
              </Label>
              <Input
                id="int-ordem"
                type="number"
                min="1"
                max="10"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="int-instagram" className="text-xs font-semibold text-vinho">
                Instagram (@)
              </Label>
              <Input
                id="int-instagram"
                placeholder="Ex.: @coffeecast4.0 ou coffeecast4.0"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
              <p className="text-[10px] text-vinho/60">
                Digite o @ do Instagram ou usuário. Ele aparecerá clicável no card do site público.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="int-link-episodio" className="text-xs font-semibold text-vinho">
                Link do episódio de entrevista (YouTube)
              </Label>
              <Input
                id="int-link-episodio"
                type="url"
                placeholder="Ex.: https://youtu.be/... ou https://www.youtube.com/watch?v=..."
                value={linkEpisodio}
                onChange={(e) => setLinkEpisodio(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
              <p className="text-[10px] text-vinho/60">
                Opcional. Se preenchido, a foto no site público se tornará clicável e exibirá um
                botão para conhecer mais sobre a integrante.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="int-bio" className="text-xs font-semibold text-vinho">
                Biografia e Apresentação *
              </Label>
              <Textarea
                id="int-bio"
                required
                rows={4}
                placeholder="Conte sobre o papel e a paixão desta integrante..."
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-vinho">
                  Foto Oficial {editingItem ? '(Opcional)' : ''}
                </Label>
                {editingItem && (
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Deixe em branco para manter a foto atual
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>
              {editingItem && editingItem.foto && !fotoFile && (
                <p className="text-[11px] text-vinho/65">Foto atual preservada no registro.</p>
              )}
              <p className="text-[10px] text-vinho/60">
                Formatos JPG ou PNG (recomendado proporção quadrada ou retrato).
              </p>
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
                {saving ? 'Salvando...' : 'Salvar Integrante'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
