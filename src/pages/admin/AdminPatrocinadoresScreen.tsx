import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { getFileUrl, formatCurrencyBRL } from '@/lib/formatters'
import type { EpisodioRecord } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Handshake,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Film,
  PackageCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

// FEATURE 2 — Módulo Patrocinadores/Parceiros (CRM de patrocínio do CoffeeCast 4.0)
// Collection "patrocinadores" criada pela migration 1753000100018.
// Regras de API: list/view/create/update = master/adm/gerencial; delete = master/adm.

export interface PatrocinadorRecord {
  id: string
  empresa: string
  segmento?: string
  website?: string
  instagram?: string
  logo?: string
  contato_nome?: string
  contato_cargo?: string
  contato_email?: string
  contato_telefone?: string
  modalidade?: 'cota_master' | 'cota_episodio' | 'permuta' | 'apoio' | 'outro'
  valor_contrato?: number
  contrapartidas?: string
  status: 'prospect' | 'em_negociacao' | 'ativo' | 'pausado' | 'encerrado'
  episodios?: string[]
  materiais?: string[]
  entregas?: string
  pendencias?: string
  observacoes?: string
  created?: string
  updated?: string
  expand?: { episodios?: EpisodioRecord[] }
}

const ROTULO_MODALIDADE: Record<string, string> = {
  cota_master: 'Cota Master',
  cota_episodio: 'Cota por Episódio',
  permuta: 'Permuta',
  apoio: 'Apoio',
  outro: 'Outro',
}

const ROTULO_STATUS: Record<string, string> = {
  prospect: 'Prospect',
  em_negociacao: 'Em Negociação',
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
}

const CORES_STATUS: Record<string, string> = {
  prospect: 'bg-marfim text-vinho border-vinho/20',
  em_negociacao: 'bg-amber-50 text-amber-800 border-amber-300',
  ativo: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  pausado: 'bg-orange-50 text-orange-800 border-orange-300',
  encerrado: 'bg-vinho/10 text-vinho/70 border-vinho/20',
}

const emptyForm = {
  empresa: '',
  segmento: '',
  website: '',
  instagram: '',
  contato_nome: '',
  contato_cargo: '',
  contato_email: '',
  contato_telefone: '',
  modalidade: 'outro',
  valor_contrato: '',
  contrapartidas: '',
  status: 'prospect',
  episodios: [] as string[],
  entregas: '',
  pendencias: '',
  observacoes: '',
}

export default function AdminPatrocinadoresScreen() {
  const [patrocinadores, setPatrocinadores] = useState<PatrocinadorRecord[]>([])
  const [episodios, setEpisodios] = useState<EpisodioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const [dialogAberto, setDialogAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [logoArquivo, setLogoArquivo] = useState<File | null>(null)
  const [materiaisArquivos, setMateriaisArquivos] = useState<FileList | null>(null)

  const [excluirAlvo, setExcluirAlvo] = useState<PatrocinadorRecord | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [patroList, epiList] = await Promise.all([
        pb.collection('patrocinadores').getFullList<PatrocinadorRecord>({
          sort: '-created',
          expand: 'episodios',
        }),
        pb.collection('episodios').getFullList<EpisodioRecord>({ sort: '-numero' }),
      ])
      setPatrocinadores(patroList)
      setEpisodios(epiList)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar patrocinadores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return patrocinadores.filter((p) => {
      const okStatus = filtroStatus === 'todos' || p.status === filtroStatus
      const okBusca =
        !q ||
        (p.empresa || '').toLowerCase().includes(q) ||
        (p.segmento || '').toLowerCase().includes(q) ||
        (p.contato_nome || '').toLowerCase().includes(q)
      return okStatus && okBusca
    })
  }, [patrocinadores, busca, filtroStatus])

  const totais = useMemo(
    () => ({
      ativos: patrocinadores.filter((p) => p.status === 'ativo').length,
      negociacao: patrocinadores.filter((p) => p.status === 'em_negociacao').length,
      comPendencias: patrocinadores.filter(
        (p) => p.status === 'ativo' && (p.pendencias || '').trim() !== '',
      ).length,
      receitaAtiva: patrocinadores
        .filter((p) => p.status === 'ativo')
        .reduce((soma, p) => soma + (Number(p.valor_contrato) || 0), 0),
    }),
    [patrocinadores],
  )

  const abrirNovo = () => {
    setEditandoId(null)
    setForm({ ...emptyForm })
    setLogoArquivo(null)
    setMateriaisArquivos(null)
    setDialogAberto(true)
  }

  const abrirEdicao = (p: PatrocinadorRecord) => {
    setEditandoId(p.id)
    setForm({
      empresa: p.empresa || '',
      segmento: p.segmento || '',
      website: p.website || '',
      instagram: p.instagram || '',
      contato_nome: p.contato_nome || '',
      contato_cargo: p.contato_cargo || '',
      contato_email: p.contato_email || '',
      contato_telefone: p.contato_telefone || '',
      modalidade: p.modalidade || 'outro',
      valor_contrato: p.valor_contrato != null ? String(p.valor_contrato) : '',
      contrapartidas: p.contrapartidas || '',
      status: p.status || 'prospect',
      episodios: p.episodios || [],
      entregas: p.entregas || '',
      pendencias: p.pendencias || '',
      observacoes: p.observacoes || '',
    })
    setLogoArquivo(null)
    setMateriaisArquivos(null)
    setDialogAberto(true)
  }

  const toggleEpisodio = (id: string) => {
    setForm((f) => ({
      ...f,
      episodios: f.episodios.includes(id)
        ? f.episodios.filter((e) => e !== id)
        : [...f.episodios, id],
    }))
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.empresa.trim()) {
      toast.error('Informe o nome da empresa.')
      return
    }
    setSalvando(true)
    try {
      const payload: Record<string, unknown> = {
        empresa: form.empresa.trim(),
        segmento: form.segmento.trim(),
        website: form.website.trim() || undefined,
        instagram: form.instagram.trim(),
        contato_nome: form.contato_nome.trim(),
        contato_cargo: form.contato_cargo.trim(),
        contato_email: form.contato_email.trim() || undefined,
        contato_telefone: form.contato_telefone.trim(),
        modalidade: form.modalidade,
        valor_contrato: form.valor_contrato ? Number(form.valor_contrato) : 0,
        contrapartidas: form.contrapartidas.trim(),
        status: form.status,
        episodios: form.episodios,
        entregas: form.entregas.trim(),
        pendencias: form.pendencias.trim(),
        observacoes: form.observacoes.trim(),
      }

      let patroId = editandoId
      if (editandoId) {
        await pb.collection('patrocinadores').update(editandoId, payload)
      } else {
        const rec = await pb.collection('patrocinadores').create(payload)
        patroId = rec.id
      }

      // Uploads após create/update (logo e materiais publicitários)
      if (patroId && (logoArquivo || (materiaisArquivos && materiaisArquivos.length > 0))) {
        const fd = new FormData()
        if (logoArquivo) fd.append('logo', logoArquivo)
        if (materiaisArquivos) {
          Array.from(materiaisArquivos).forEach((arq) => fd.append('materiais', arq))
        }
        await pb.collection('patrocinadores').update(patroId, fd)
      }

      toast.success(editandoId ? 'Patrocinador atualizado!' : 'Patrocinador cadastrado!')
      setDialogAberto(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar patrocinador.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async () => {
    if (!excluirAlvo) return
    setExcluindo(true)
    try {
      await pb.collection('patrocinadores').delete(excluirAlvo.id)
      toast.success('Patrocinador excluído.')
      setExcluirAlvo(null)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir (exclusão permitida apenas para master/adm).')
    } finally {
      setExcluindo(false)
    }
  }

  const urlInstagram = (handle: string) => {
    const limpo = (handle || '').replace(/^@/, '').trim()
    return limpo ? `https://instagram.com/${limpo}` : ''
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho flex items-center gap-2">
            <Handshake className="w-6 h-6 text-dourado-dark" />
            Patrocinadores &amp; Parceiros
          </h2>
          <p className="text-xs text-vinho/70">
            CRM de patrocínio: empresas, contrapartidas acordadas, episódios vinculados, entregas e
            pendências.
          </p>
        </div>
        <Button
          onClick={abrirNovo}
          className="bg-vinho hover:bg-vinho/90 text-white rounded-xl min-h-[44px] font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Patrocinador
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            rotulo: 'Ativos',
            valor: totais.ativos,
            icone: <Handshake className="w-4 h-4 text-dourado" />,
          },
          {
            rotulo: 'Em Negociação',
            valor: totais.negociacao,
            icone: <PackageCheck className="w-4 h-4 text-dourado" />,
          },
          {
            rotulo: 'Com Pendências',
            valor: totais.comPendencias,
            icone: <AlertTriangle className="w-4 h-4 text-dourado" />,
          },
          {
            rotulo: 'Receita Ativa',
            valor: formatCurrencyBRL(totais.receitaAtiva),
            icone: <Film className="w-4 h-4 text-dourado" />,
          },
        ].map((c) => (
          <div key={c.rotulo} className="bg-white rounded-2xl border border-vinho/10 shadow-xs p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-vinho/70">
                {c.rotulo}
              </span>
              {c.icone}
            </div>
            <p className="text-2xl font-serif font-bold text-vinho mt-2">{c.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-vinho/10 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vinho/40" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por empresa, segmento ou contato..."
            className="pl-9 bg-marfim border-vinho/20 text-sm"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-48 bg-marfim border-vinho/20 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
              <SelectItem key={valor} value={valor}>
                {rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-vinho/60">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Carregando patrocinadores...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-vinho/20 p-10 text-center">
          <Handshake className="w-10 h-10 text-vinho/30 mx-auto mb-3" />
          <p className="font-serif font-bold text-vinho">Nenhum patrocinador encontrado</p>
          <p className="text-xs text-vinho/60 mt-1">
            Cadastre a primeira empresa parceira para acompanhar cotas e entregas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtrados.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-vinho/10 shadow-sm p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {p.logo ? (
                    <img
                      src={getFileUrl(p, p.logo, '100x100')}
                      alt={p.empresa}
                      className="w-12 h-12 rounded-xl object-contain border border-vinho/10 bg-marfim"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-vinho/10 flex items-center justify-center">
                      <Handshake className="w-6 h-6 text-vinho/50" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-vinho truncate">{p.empresa}</p>
                    <p className="text-xs text-vinho/60 truncate">
                      {p.segmento || 'Segmento não informado'}
                      {p.contato_nome ? ` • ${p.contato_nome}` : ''}
                    </p>
                  </div>
                </div>
                <Badge className={`${CORES_STATUS[p.status] || ''} text-[10px] font-bold shrink-0`}>
                  {ROTULO_STATUS[p.status] || p.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {p.modalidade && (
                  <Badge className="bg-dourado/20 text-vinho border border-dourado/40 font-semibold">
                    {ROTULO_MODALIDADE[p.modalidade] || p.modalidade}
                  </Badge>
                )}
                {!!Number(p.valor_contrato) && (
                  <Badge className="bg-vinho/5 text-vinho border border-vinho/15 font-semibold">
                    {formatCurrencyBRL(Number(p.valor_contrato))}
                  </Badge>
                )}
                {(p.episodios?.length || 0) > 0 && (
                  <Badge className="bg-marfim text-vinho border border-vinho/15 font-semibold">
                    <Film className="w-3 h-3 mr-1 text-dourado-dark" />
                    {p.episodios!.length} episódio{p.episodios!.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {(p.pendencias || '').trim() !== '' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] text-amber-800">
                  <span className="font-bold">Pendências:</span> {p.pendencias}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-vinho/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => abrirEdicao(p)}
                  className="text-vinho hover:bg-vinho/5 min-h-[36px]"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExcluirAlvo(p)}
                  className="text-red-600 hover:bg-red-50 min-h-[36px]"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Excluir
                </Button>
                {urlInstagram(p.instagram || '') && (
                  <a
                    href={urlInstagram(p.instagram!)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-dourado-dark hover:underline font-semibold"
                  >
                    @{(p.instagram || '').replace(/^@/, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Cadastro/Edição */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-vinho flex items-center gap-2">
              <Handshake className="w-5 h-5 text-dourado-dark" />
              {editandoId ? 'Editar Patrocinador' : 'Novo Patrocinador'}
            </DialogTitle>
            <DialogDescription>
              Dados comerciais, contrapartidas acordadas e acompanhamento de entregas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Empresa *</Label>
                <Input
                  required
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Segmento</Label>
                <Input
                  value={form.segmento}
                  onChange={(e) => setForm({ ...form, segmento: e.target.value })}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Website</Label>
                <Input
                  type="url"
                  placeholder="https://"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Instagram</Label>
                <Input
                  placeholder="@empresa"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-vinho/10 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-vinho/70 mb-3">
                Contato Comercial
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-vinho">Nome</Label>
                  <Input
                    value={form.contato_nome}
                    onChange={(e) => setForm({ ...form, contato_nome: e.target.value })}
                    className="bg-marfim border-vinho/20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-vinho">Cargo</Label>
                  <Input
                    value={form.contato_cargo}
                    onChange={(e) => setForm({ ...form, contato_cargo: e.target.value })}
                    className="bg-marfim border-vinho/20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-vinho">E-mail</Label>
                  <Input
                    type="email"
                    value={form.contato_email}
                    onChange={(e) => setForm({ ...form, contato_email: e.target.value })}
                    className="bg-marfim border-vinho/20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-vinho">Telefone / WhatsApp</Label>
                  <Input
                    value={form.contato_telefone}
                    onChange={(e) => setForm({ ...form, contato_telefone: e.target.value })}
                    className="bg-marfim border-vinho/20 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-vinho/10 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-vinho/70 mb-3">
                Parceria
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-vinho">Modalidade</Label>
                  <Select
                    value={form.modalidade}
                    onValueChange={(v) => setForm({ ...form, modalidade: v })}
                  >
                    <SelectTrigger className="bg-marfim border-vinho/20 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROTULO_MODALIDADE).map(([valor, rotulo]) => (
                        <SelectItem key={valor} value={valor}>
                          {rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-vinho">Valor do Contrato (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valor_contrato}
                    onChange={(e) => setForm({ ...form, valor_contrato: e.target.value })}
                    className="bg-marfim border-vinho/20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-vinho">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger className="bg-marfim border-vinho/20 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
                        <SelectItem key={valor} value={valor}>
                          {rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold text-vinho">
                    Contrapartidas acordadas
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Ex.: 2 menções por episódio, banner no site, post conjunto no Instagram..."
                    value={form.contrapartidas}
                    onChange={(e) => setForm({ ...form, contrapartidas: e.target.value })}
                    className="bg-marfim border-vinho/20 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-vinho/10 pt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-vinho/70">
                Episódios vinculados
              </p>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-vinho/15 bg-marfim p-2 space-y-1">
                {episodios.length === 0 ? (
                  <p className="text-xs text-vinho/50 p-2">Nenhum episódio cadastrado.</p>
                ) : (
                  episodios.map((ep) => (
                    <label
                      key={ep.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-vinho/5 cursor-pointer text-sm text-vinho"
                    >
                      <input
                        type="checkbox"
                        checked={form.episodios.includes(ep.id)}
                        onChange={() => toggleEpisodio(ep.id)}
                        className="accent-[#722F37]"
                      />
                      <span className="truncate">
                        Ep. {ep.numero} — {ep.titulo}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-vinho/10 pt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-vinho/70">
                Acompanhamento
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Entregas realizadas</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex.: banner publicado no site (10/03); menção no Ep. 42..."
                  value={form.entregas}
                  onChange={(e) => setForm({ ...form, entregas: e.target.value })}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Pendências</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex.: post no Instagram agendado para a próxima semana"
                  value={form.pendencias}
                  onChange={(e) => setForm({ ...form, pendencias: e.target.value })}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Observações</Label>
                <Textarea
                  rows={2}
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-vinho/10 pt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">Logo (PNG/JPG/WebP/SVG)</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setLogoArquivo(e.target.files?.[0] || null)}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-vinho">
                  Materiais publicitários (até 10 arquivos)
                </Label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setMateriaisArquivos(e.target.files || null)}
                  className="bg-marfim border-vinho/20 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogAberto(false)}
                className="border-vinho/20 text-vinho min-h-[44px]"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-vinho hover:bg-vinho/90 text-white min-h-[44px] font-semibold"
              >
                {salvando ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                {editandoId ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Exclusão */}
      <Dialog open={!!excluirAlvo} onOpenChange={(aberto) => !aberto && setExcluirAlvo(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-vinho">Excluir patrocinador</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{excluirAlvo?.empresa}</strong>? Esta ação não
              pode ser desfeita. A exclusão é permitida apenas para os perfis master e adm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setExcluirAlvo(null)}
              className="border-vinho/20 text-vinho min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExcluir}
              disabled={excluindo}
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px] font-semibold"
            >
              {excluindo ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-[11px] text-vinho/50 text-center">
        Área restrita a perfis master, adm e gerencial.{' '}
        <Link to="/admin" className="underline hover:text-vinho/70">
          Voltar ao painel
        </Link>
      </p>
    </div>
  )
}
