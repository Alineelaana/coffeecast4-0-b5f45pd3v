import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { getFileUrl, parseInstagramHandle } from '@/lib/formatters'
import type { DepoimentoRecord } from '@/types/database'
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDepoimentosScreen() {
  const [depoimentos, setDepoimentos] = useState<DepoimentoRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DepoimentoRecord | null>(null)

  const [nome, setNome] = useState('')
  const [texto, setTexto] = useState('')
  const [deNossaAutoridade, setDeNossaAutoridade] = useState(false)
  const [ordem, setOrdem] = useState('1')
  const [instagram, setInstagram] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const loadDepoimentos = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('depoimentos').getFullList<DepoimentoRecord>({
        sort: 'ordem',
      })
      setDepoimentos(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar depoimentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepoimentos()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setNome('')
    setTexto('')
    setDeNossaAutoridade(false)
    setOrdem(String(depoimentos.length + 1))
    setInstagram('')
    setFotoFile(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: DepoimentoRecord) => {
    setEditingItem(item)
    setNome(item.nome)
    setTexto(item.texto)
    setDeNossaAutoridade(Boolean(item.de_nossa_autoridade))
    setOrdem(String(item.ordem || 1))
    setInstagram(item.instagram || '')
    setFotoFile(null)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Trata instagram com parseInstagramHandle se preenchido
      const parsedInsta = parseInstagramHandle(instagram)
      const cleanedInsta = parsedInsta ? parsedInsta.username : instagram.trim()

      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('texto', texto.trim())
      formData.append('de_nossa_autoridade', String(deNossaAutoridade))
      formData.append('ordem', ordem)
      formData.append('instagram', cleanedInsta)
      if (fotoFile) {
        formData.append('foto', fotoFile)
      }

      if (editingItem) {
        await pb.collection('depoimentos').update(editingItem.id, formData)
        toast.success('Depoimento atualizado com sucesso!')
      } else {
        await pb.collection('depoimentos').create(formData)
        toast.success('Depoimento criado com sucesso!')
      }

      setModalOpen(false)
      loadDepoimentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar depoimento.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o depoimento de "${name}"?`)) return

    try {
      await pb.collection('depoimentos').delete(id)
      toast.success('Depoimento removido com sucesso!')
      loadDepoimentos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir depoimento.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-vinho">Feedbacks & Depoimentos</h2>
          <p className="text-xs text-vinho/70">
            Gerencie depoimentos de convidados ou relatos da equipe sobre a experiência da
            entrevista.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-5 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4 text-dourado" />
          Novo Depoimento
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-vinho/60">Carregando depoimentos...</div>
        ) : depoimentos.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-vinho/70 font-medium">Nenhum depoimento cadastrado.</p>
            <Button onClick={handleOpenCreate} variant="outline" size="sm">
              Adicionar primeiro depoimento
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
                <TableHead className="font-bold text-vinho text-xs">Tipo de Depoimento</TableHead>
                <TableHead className="font-bold text-vinho text-xs">Depoimento</TableHead>
                <TableHead className="w-28 text-right font-bold text-vinho text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-vinho/5">
              {depoimentos.map((item) => {
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
                    <TableCell>
                      {item.de_nossa_autoridade ? (
                        <Badge className="bg-vinho text-dourado text-[10px] font-semibold">
                          Visão da Produção
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-vinho border-vinho/20">
                          Depoimento do Convidado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-vinho/75 max-w-md italic line-clamp-2">
                      "{item.texto}"
                    </TableCell>
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
        <DialogContent className="max-w-md bg-marfim border-2 border-dourado/50 text-vinho">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Depoimento' : 'Novo Depoimento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="dep-nome" className="text-xs font-semibold text-vinho">
                Nome do Convidado ou Entrevistado *
              </Label>
              <Input
                id="dep-nome"
                required
                placeholder="Ex.: Juliana Martins"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-ordem" className="text-xs font-semibold text-vinho">
                Ordem
              </Label>
              <Input
                id="dep-ordem"
                type="number"
                min="1"
                max="50"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-instagram" className="text-xs font-semibold text-vinho">
                Instagram (@) <span className="text-vinho/60 font-normal">(opcional)</span>
              </Label>
              <Input
                id="dep-instagram"
                placeholder="Ex.: @convidado ou instagram.com/convidado"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
              <p className="text-[10px] text-vinho/60">
                Aceita @usuario, usuario ou URL completa. Será exibido no card do convidado se
                informado.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-vinho/15">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-vinho cursor-pointer">
                  Depoimento de Nossa Autoria
                </Label>
                <p className="text-[10px] text-vinho/65">
                  Marque caso seja um depoimento da equipe sobre como foi entrevistar essa pessoa.
                </p>
              </div>
              <Switch checked={deNossaAutoridade} onCheckedChange={setDeNossaAutoridade} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-texto" className="text-xs font-semibold text-vinho">
                Texto do Depoimento *
              </Label>
              <Textarea
                id="dep-texto"
                required
                rows={4}
                placeholder="Descreva a experiência, sensações e impacto da participação..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">Foto do Convidado</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                className="bg-white border-vinho/20 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-5"
              >
                {saving ? 'Salvando...' : 'Salvar Depoimento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
