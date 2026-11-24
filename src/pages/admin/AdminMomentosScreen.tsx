// src/pages/admin/AdminMomentosScreen.tsx
// Cadastro dos "Nossos Momentos" (fotos do podcast).
// Uploads são otimizados no cliente (src/lib/imagemOptimizer.ts):
// imagens maiores que ~1600px de largura são redimensionadas e comprimidas
// (JPEG ~80%) antes do envio, para a home carregar rápido no 4G.

import React, { useState, useRef, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { formatDateBR } from '@/lib/formatters'
import { otimizarImagem } from '@/lib/imagemOptimizer'
import type { MomentoRecord } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getFileUrl } from '@/lib/formatters'

export default function AdminMomentosScreen() {
  const [momentos, setMomentos] = useState<MomentoRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [infoOtimizacao, setInfoOtimizacao] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const lista = await pb.collection('momentos').getFullList<MomentoRecord>({
        sort: '-created',
        $autoCancel: false,
      } as any)
      setMomentos(lista)
    } catch (err: any) {
      toast.error('Erro ao carregar os momentos: ' + (err?.message || 'erro inesperado'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrirNovo = () => {
    setEditandoId(null)
    setTitulo('')
    setData('')
    setArquivo(null)
    setPreviewUrl('')
    setInfoOtimizacao(null)
    setDialogAberto(true)
  }

  const abrirEdicao = (m: MomentoRecord) => {
    setEditandoId(m.id)
    setTitulo(m.titulo || '')
    setData(formatDateBR(m.data))
    setArquivo(null)
    setPreviewUrl(m.imagem ? getFileUrl(m, m.imagem, '600x0') : '')
    setInfoOtimizacao(null)
    setDialogAberto(true)
  }

  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivo(file)
    setPreviewUrl(URL.createObjectURL(file))
    setInfoOtimizacao(null)
    try {
      const { file: otimizada, info } = await otimizarImagem(file)
      setArquivo(otimizada)
      setPreviewUrl(URL.createObjectURL(otimizada))
      setInfoOtimizacao(info)
    } catch {
      // Mantém o original se a otimização falhar (ex.: HEIC não suportado)
      setArquivo(file)
    }
  }

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      toast.error('Informe o título do momento.')
      return
    }
    if (!editandoId && !arquivo) {
      toast.error('Selecione uma imagem para o momento.')
      return
    }
    setSalvando(true)
    try {
      const formData = new FormData()
      formData.append('titulo', titulo.trim())
      if (data) formData.append('data', data)
      if (arquivo) formData.append('imagem', arquivo)
      if (editandoId) {
        await pb.collection('momentos').update(editandoId, formData)
        toast.success('Momento atualizado com sucesso.')
      } else {
        await pb.collection('momentos').create(formData)
        toast.success('Momento cadastrado com sucesso.')
      }
      setDialogAberto(false)
      carregar()
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err?.message || 'erro inesperado'))
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Excluir este momento? Esta ação não pode ser desfeita.')) return
    setExcluindo(id)
    try {
      await pb.collection('momentos').delete(id)
      toast.success('Momento excluído.')
      carregar()
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + (err?.message || 'erro inesperado'))
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">Nossos Momentos</h2>
          <p className="text-xs text-vinho/70">
            Fotos publicadas na home. Imagens maiores que 1600px são redimensionadas e comprimidas
            automaticamente no envio — mais rapidez no celular, sem mudar o visual.
          </p>
        </div>
        <Button
          onClick={abrirNovo}
          className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-dourado" />
          Novo Momento
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-vinho/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-marfim/60">
                <TableHead className="text-vinho font-bold text-[11px]">Imagem</TableHead>
                <TableHead className="text-vinho font-bold text-[11px]">Título</TableHead>
                <TableHead className="text-vinho font-bold text-[11px] hidden md:table-cell">
                  Data
                </TableHead>
                <TableHead className="text-vinho font-bold text-[11px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-dourado mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              {!carregando && momentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-vinho/60 py-8">
                    Nenhum momento cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
              {momentos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="py-3">
                    {m.imagem ? (
                      <img
                        src={getFileUrl(m, m.imagem, '100x100')}
                        alt={m.titulo}
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-lg object-cover border border-vinho/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-vinho/10 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-vinho/40" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-vinho">
                    {m.titulo || '(sem título)'}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-vinho/70 hidden md:table-cell">
                    {formatDateBR(m.data)}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirEdicao(m)}
                        className="h-8 w-8 p-0 border-vinho/20 text-vinho"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExcluir(m.id)}
                        disabled={excluindo === m.id}
                        className="h-8 w-8 p-0 border-vinho/20 text-vinho hover:bg-rose-brand/10"
                      >
                        {excluindo === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg bg-marfim">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-vinho">
              {editandoId ? 'Editar Momento' : 'Novo Momento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-vinho">Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Gravação com convidada especial"
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-vinho">Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-vinho">Imagem</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelecionarArquivo}
              />
              <div className="flex items-center gap-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    className="w-20 h-20 rounded-xl object-cover border border-vinho/15"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-vinho/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-vinho/40" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-vinho/25 text-vinho text-xs font-bold"
                >
                  Escolher imagem
                </Button>
              </div>
              {infoOtimizacao && (
                <div className="flex items-center gap-1.5 text-[11px] text-dourado-dark">
                  <Sparkles className="w-3.5 h-3.5" />
                  {infoOtimizacao}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              className="bg-vinho hover:bg-vinho-light text-white"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
