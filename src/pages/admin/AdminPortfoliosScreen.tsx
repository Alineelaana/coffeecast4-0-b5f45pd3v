import React, { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { getFileUrl, formatDateTimeBR } from '@/lib/formatters'
import type { PortfolioRecord } from '@/types/database'
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
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Download, Trash2, FolderOpen, FileWarning } from 'lucide-react'
import { toast } from 'sonner'

// Tamanho máximo do arquivo PDF em bytes (25 MB — o mesmo limite definido na collection "portfolios")
const TAMANHO_MAXIMO_PDF = 25 * 1024 * 1024

function formatarTamanho(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function AdminPortfoliosScreen() {
  const { user } = useAuth()
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [nomeDocumento, setNomeDocumento] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [baixandoId, setBaixandoId] = useState<string | null>(null)

  const loadPortfolios = useCallback(async () => {
    try {
      setLoading(true)
      const list = await pb.collection('portfolios').getFullList<PortfolioRecord>({
        sort: '-created',
        expand: 'enviado_por',
      })
      setPortfolios(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar a lista de portfólios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPortfolios()
  }, [loadPortfolios])

  const openModal = () => {
    setNomeDocumento('')
    setArquivo(null)
    setModalOpen(true)
  }

  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selecionado = e.target.files?.[0] || null
    if (selecionado && selecionado.type !== 'application/pdf') {
      toast.error('Formato inválido: apenas arquivos em PDF são aceitos.')
      e.target.value = ''
      setArquivo(null)
      return
    }
    setArquivo(selecionado)
  }

  const handleImportar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!arquivo) {
      toast.error('Selecione um arquivo PDF para importar.')
      return
    }
    if (arquivo.type !== 'application/pdf') {
      toast.error('Formato inválido: apenas arquivos em PDF são aceitos.')
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_PDF) {
      toast.error('Arquivo muito grande: o limite é de 25 MB por portfólio.')
      return
    }
    const nomeFinal = nomeDocumento.trim()
    if (nomeFinal.length < 2) {
      toast.error(
        'Informe o nome do documento (mínimo de 2 caracteres) para salvar com o nome certo.',
      )
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('nome', nomeFinal)
      formData.append('arquivo', arquivo)
      formData.append('tamanho', String(arquivo.size))
      if (user?.id) {
        formData.append('enviado_por', user.id)
      }
      await pb.collection('portfolios').create(formData)
      toast.success('Portfólio importado e salvo com sucesso!')
      setModalOpen(false)
      loadPortfolios()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao importar o portfólio. Verifique o arquivo e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (item: PortfolioRecord) => {
    if (!item.arquivo) {
      toast.error('Este portfólio não possui arquivo anexado.')
      return
    }
    setBaixandoId(item.id)
    try {
      const url = getFileUrl(item, item.arquivo)
      const resposta = await fetch(url)
      if (!resposta.ok) throw new Error(`Falha ao baixar (HTTP ${resposta.status})`)
      const blob = await resposta.blob()
      const urlBlob = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = urlBlob
      link.download = `${item.nome || 'portfolio'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(urlBlob)
      toast.success('Download iniciado!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao baixar o portfólio. Tente novamente.')
    } finally {
      setBaixandoId(null)
    }
  }

  const handleExcluir = async (item: PortfolioRecord) => {
    if (
      !window.confirm(
        `Excluir definitivamente o portfólio "${item.nome}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }
    try {
      await pb.collection('portfolios').delete(item.id)
      toast.success('Portfólio excluído!')
      loadPortfolios()
    } catch (err) {
      console.error(err)
      toast.error('Apenas o Master pode excluir portfólios.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">Portfolios</h2>
          <p className="text-xs text-vinho/70">
            Repositório de portfólios em PDF da equipe: importe com o nome certo do documento e
            baixe quando precisar.
          </p>
        </div>
        <Button
          onClick={openModal}
          className="w-full sm:w-auto bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-xl sm:rounded-full px-5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <Upload className="w-4 h-4 text-dourado shrink-0" />
          Importar Portfólio (PDF)
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-vinho/60">Carregando portfólios...</div>
      ) : portfolios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-vinho/10 p-12 text-center space-y-3">
          <FolderOpen className="w-12 h-12 text-vinho/30 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-vinho">
            Nenhum portfólio guardado ainda
          </h3>
          <p className="text-xs text-vinho/60 max-w-sm mx-auto">
            Importe o primeiro PDF: escolha o arquivo, dê o nome do documento e ele fica disponível
            para toda a equipe administrativa baixar a qualquer momento.
          </p>
          <Button onClick={openModal} size="sm" className="bg-vinho text-white text-xs">
            Importar primeiro portfólio
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-vinho/10 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-vinho/5 hover:bg-vinho/5">
                <TableHead className="text-[11px] font-bold text-vinho/80">
                  Nome do documento
                </TableHead>
                <TableHead className="text-[11px] font-bold text-vinho/80 hidden md:table-cell">
                  Arquivo original
                </TableHead>
                <TableHead className="text-[11px] font-bold text-vinho/80 hidden lg:table-cell">
                  Enviado por
                </TableHead>
                <TableHead className="text-[11px] font-bold text-vinho/80 hidden lg:table-cell">
                  Tamanho
                </TableHead>
                <TableHead className="text-[11px] font-bold text-vinho/80">Enviado em</TableHead>
                <TableHead className="text-[11px] font-bold text-vinho/80 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolios.map((item) => {
                const enviadoPorNome = (item.expand?.enviado_por?.name as string | undefined) || '—'
                return (
                  <TableRow key={item.id} className="border-vinho/10">
                    <TableCell className="text-xs font-semibold text-vinho max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-dourado-dark shrink-0" />
                        <span className="truncate" title={item.nome}>
                          {item.nome}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-vinho/60 hidden md:table-cell">
                      <span className="font-mono truncate block max-w-[180px]" title={item.arquivo}>
                        {item.arquivo || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px] text-vinho/70 hidden lg:table-cell">
                      {enviadoPorNome}
                    </TableCell>
                    <TableCell className="text-[11px] text-vinho/70 hidden lg:table-cell">
                      {formatarTamanho(item.tamanho)}
                    </TableCell>
                    <TableCell className="text-[11px] text-vinho/70">
                      {formatDateTimeBR(item.created)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(item)}
                          disabled={baixandoId === item.id}
                          className="h-7 px-2 text-xs text-vinho/70 hover:text-vinho hover:bg-vinho/10 flex items-center gap-1"
                          title="Baixar PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-dourado-dark" />
                          <span>{baixandoId === item.id ? 'Baixando...' : 'Baixar'}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(item)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Excluir portfólio (somente Master)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[94vw] max-w-md max-h-[90vh] overflow-y-auto bg-marfim border-2 border-dourado/50 text-vinho p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              Importar Portfólio em PDF
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleImportar} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">Arquivo PDF *</Label>
              <Input
                type="file"
                accept="application/pdf,.pdf"
                required
                onChange={handleSelecionarArquivo}
                className="bg-white border-vinho/20 text-xs"
              />
              {arquivo && (
                <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {arquivo.name} ({formatarTamanho(arquivo.size)})
                </p>
              )}
              <p className="text-[10px] text-vinho/60 flex items-center gap-1">
                <FileWarning className="w-3 h-3" />
                Aceito apenas PDF, até 25 MB.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portfolio-nome" className="text-xs font-semibold text-vinho">
                Nome do documento *
              </Label>
              <Input
                id="portfolio-nome"
                placeholder="Ex.: Portfólio CoffeeCast 2026 — Mídia Kit"
                value={nomeDocumento}
                onChange={(e) => setNomeDocumento(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
                maxLength={200}
              />
              <p className="text-[10px] text-vinho/60">
                O nome digitado é como o portfólio aparece na lista e como o arquivo é baixado.
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
                {saving ? 'Salvando...' : 'Salvar Portfólio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
