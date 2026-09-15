import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import type { ConteudoSiteRecord } from '@/types/database'
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
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  Share2,
  Save,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { normalizeSocialUrl } from '@/lib/formatters'

export default function AdminConteudoScreen() {
  const [conteudos, setConteudos] = useState<ConteudoSiteRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ConteudoSiteRecord | null>(null)

  const [chave, setChave] = useState('')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  // Estados dedicados aos 4 links sociais
  const [tiktok, setTiktok] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [savingSocials, setSavingSocials] = useState(false)

  const loadConteudos = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('conteudo_site').getFullList<ConteudoSiteRecord>({
        sort: 'chave',
      })
      setConteudos(list)

      // Preenche os campos de redes sociais a partir dos registros existentes
      const map: Record<string, string> = {}
      list.forEach((item) => {
        map[item.chave] = item.valor
      })
      setTiktok(map['social_tiktok'] || '')
      setFacebook(map['social_facebook'] || '')
      setInstagram(map['social_instagram'] || '')
      setLinkedin(map['social_linkedin'] || '')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar textos do site.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConteudos()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setChave('')
    setValor('')
    setModalOpen(true)
  }

  const handleOpenEdit = (c: ConteudoSiteRecord) => {
    setEditingItem(c)
    setChave(c.chave)
    setValor(c.valor)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        chave: chave.trim(),
        valor: valor.trim(),
      }

      if (editingItem) {
        await pb.collection('conteudo_site').update(editingItem.id, payload)
        toast.success('Conteúdo atualizado!')
      } else {
        await pb.collection('conteudo_site').create(payload)
        toast.success('Conteúdo criado!')
      }

      setModalOpen(false)
      loadConteudos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar texto do site.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, k: string) => {
    if (!window.confirm(`Deseja realmente excluir a chave "${k}"?`)) return

    try {
      await pb.collection('conteudo_site').delete(id)
      toast.success('Chave removida!')
      loadConteudos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir item.')
    }
  }

  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSocials(true)

    try {
      const socialConfigs: {
        key: string
        network: 'tiktok' | 'facebook' | 'instagram' | 'linkedin'
        rawValue: string
      }[] = [
        { key: 'social_tiktok', network: 'tiktok', rawValue: tiktok },
        { key: 'social_facebook', network: 'facebook', rawValue: facebook },
        { key: 'social_instagram', network: 'instagram', rawValue: instagram },
        { key: 'social_linkedin', network: 'linkedin', rawValue: linkedin },
      ]

      for (const item of socialConfigs) {
        const normalized = item.rawValue.trim()
          ? normalizeSocialUrl(item.network, item.rawValue)
          : ''
        const existing = conteudos.find((c) => c.chave === item.key)

        if (existing) {
          await pb.collection('conteudo_site').update(existing.id, { valor: normalized })
        } else {
          await pb.collection('conteudo_site').create({ chave: item.key, valor: normalized })
        }
      }

      toast.success('Redes sociais atualizadas com sucesso!')
      await loadConteudos()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar redes sociais.')
    } finally {
      setSavingSocials(false)
    }
  }

  const keyDescriptions: Record<string, string> = {
    missao: 'Texto da Missão exibido na página inicial',
    visao: 'Texto da Visão exibido na página inicial',
    valores: 'Texto dos Valores exibido na página inicial',
    proposito: 'Texto longo do Propósito do CoffeeCast 4.0',
    contato_comercial: 'Nome e telefone comercial de parcerias',
    form_titulo: 'Título do formulário de novos participantes',
    form_sucesso_msg: 'Mensagem exibida após envio com sucesso do formulário',
    rodape_creditos: 'Créditos e CNPJ da mantenedora no rodapé',
    social_tiktok: 'Link ou perfil do TikTok para o rodapé',
    social_facebook: 'Link ou perfil do Facebook para o rodapé',
    social_instagram: 'Link ou perfil do Instagram para o rodapé',
    social_linkedin: 'Link ou perfil do LinkedIn para o rodapé',
  }

  return (
    <div className="space-y-8">
      {/* SEÇÃO DEDICADA: REDES SOCIAIS DO RODAPÉ */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-vinho/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vinho/10 text-vinho flex items-center justify-center">
              <Share2 className="w-5 h-5 text-dourado-dark" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-vinho">Redes Sociais do Rodapé</h2>
              <p className="text-xs text-vinho/70">
                Configure os perfis de TikTok, Facebook, Instagram e LinkedIn que aparecem em
                destaque no rodapé público.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium bg-dourado/15 text-vinho border border-dourado/30 px-3 py-1 rounded-full">
            Normalização automática (URL ou @usuario)
          </span>
        </div>

        <form onSubmit={handleSaveSocials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TikTok */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-marfim/60 border border-vinho/10">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="s-tiktok"
                  className="text-xs font-bold text-vinho flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-vinho" />
                  TikTok
                </Label>
                {tiktok && (
                  <a
                    href={normalizeSocialUrl('tiktok', tiktok)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-dourado-dark hover:underline inline-flex items-center gap-1"
                  >
                    Testar <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                id="s-tiktok"
                placeholder="Ex.: @coffeecast4.0 ou https://tiktok.com/@coffeecast4.0"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
              <p className="text-[10px] text-vinho/60">
                Se deixar em branco, o ícone não será exibido no rodapé.
              </p>
            </div>

            {/* Facebook */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-marfim/60 border border-vinho/10">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="s-facebook"
                  className="text-xs font-bold text-vinho flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-vinho" />
                  Facebook
                </Label>
                {facebook && (
                  <a
                    href={normalizeSocialUrl('facebook', facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-dourado-dark hover:underline inline-flex items-center gap-1"
                  >
                    Testar <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                id="s-facebook"
                placeholder="Ex.: coffeecast4.0 ou https://facebook.com/coffeecast4.0"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
              <p className="text-[10px] text-vinho/60">
                Pode ser o nome da página ou a URL completa.
              </p>
            </div>

            {/* Instagram */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-marfim/60 border border-vinho/10">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="s-instagram"
                  className="text-xs font-bold text-vinho flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-vinho" />
                  Instagram
                </Label>
                {instagram && (
                  <a
                    href={normalizeSocialUrl('instagram', instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-dourado-dark hover:underline inline-flex items-center gap-1"
                  >
                    Testar <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                id="s-instagram"
                placeholder="Ex.: @coffeecast4.0 ou https://instagram.com/coffeecast4.0"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
              <p className="text-[10px] text-vinho/60">Aceita @arroba ou link direto do perfil.</p>
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-marfim/60 border border-vinho/10">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="s-linkedin"
                  className="text-xs font-bold text-vinho flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-vinho" />
                  LinkedIn
                </Label>
                {linkedin && (
                  <a
                    href={normalizeSocialUrl('linkedin', linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-dourado-dark hover:underline inline-flex items-center gap-1"
                  >
                    Testar <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <Input
                id="s-linkedin"
                placeholder="Ex.: coffeecast40 ou https://linkedin.com/company/coffeecast40"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
              <p className="text-[10px] text-vinho/60">
                Página da empresa (company) ou perfil pessoal (in).
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={savingSocials}
              className="bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-6 flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4 text-dourado" />
              {savingSocials ? 'Salvando Redes...' : 'Salvar Redes Sociais'}
            </Button>
          </div>
        </form>
      </div>

      {/* SEÇÃO: DEMAIS CONTEÚDOS TEXTUAIS DO SITE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-vinho">
              Textos Institucionais & Mensagens
            </h2>
            <p className="text-xs text-vinho/70">
              Altere os textos de Missão, Visão, Valores, Propósito, Contato Comercial e Mensagens
              do site.
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-5 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-dourado" />
            Nova Chave de Conteúdo
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-vinho/60">Carregando conteúdos...</div>
          ) : conteudos.length === 0 ? (
            <div className="py-16 text-center text-xs text-vinho/60">
              Nenhum conteúdo textual cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-marfim">
                <TableRow className="border-b border-vinho/10">
                  <TableHead className="w-48 font-bold text-vinho text-xs">Chave</TableHead>
                  <TableHead className="w-64 font-bold text-vinho text-xs">Finalidade</TableHead>
                  <TableHead className="font-bold text-vinho text-xs">Conteúdo Atual</TableHead>
                  <TableHead className="w-24 text-right font-bold text-vinho text-xs">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-vinho/5">
                {conteudos.map((item) => (
                  <TableRow key={item.id} className="hover:bg-vinho/5">
                    <TableCell className="text-xs font-bold text-vinho">
                      <code className="bg-vinho/5 px-2 py-1 rounded text-vinho-light font-mono text-[11px]">
                        {item.chave}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs text-vinho/70">
                      {keyDescriptions[item.chave] || 'Texto personalizado'}
                    </TableCell>
                    <TableCell className="text-xs text-vinho/85 max-w-lg line-clamp-2">
                      {item.valor}
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
                        onClick={() => handleDelete(item.id, item.chave)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-marfim border-2 border-dourado/50 text-vinho">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              {editingItem ? 'Editar Texto' : 'Nova Chave de Texto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-chave" className="text-xs font-semibold text-vinho">
                Nome da Chave *
              </Label>
              <Input
                id="c-chave"
                required
                disabled={Boolean(editingItem)}
                placeholder="Ex.: missao, visao, proposito"
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                className="bg-white border-vinho/20 text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-valor" className="text-xs font-semibold text-vinho">
                Texto / Conteúdo *
              </Label>
              <Textarea
                id="c-valor"
                required
                rows={5}
                placeholder="Digite o conteúdo que será exibido no site..."
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
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
                {saving ? 'Salvando...' : 'Salvar Texto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
