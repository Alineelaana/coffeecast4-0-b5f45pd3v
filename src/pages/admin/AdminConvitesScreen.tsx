import React, { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { formatDateBR, getFileUrl } from '@/lib/formatters'
import type { ConviteRecord } from '@/types/database'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Printer, Trash2, Calendar, Clock, Building, Sparkles, Heart } from 'lucide-react'
import { CoffeeCastLogo } from '@/components/CoffeeCastLogo'
import { toast } from 'sonner'

export default function AdminConvitesScreen() {
  const [convites, setConvites] = useState<ConviteRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [previewConvite, setPreviewConvite] = useState<ConviteRecord | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Form states
  const [nome, setNome] = useState('')
  const [dataGravacao, setDataGravacao] = useState('')
  const [horario, setHorario] = useState('14:00')
  const [apresentacao, setApresentacao] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const invitePrintRef = useRef<HTMLDivElement>(null)

  const loadConvites = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('convites').getFullList<ConviteRecord>({
        sort: '-created',
      })
      setConvites(list)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar convites.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConvites()
  }, [])

  const handleOpenCreate = () => {
    setNome('')
    setDataGravacao(new Date().toISOString().split('T')[0])
    setHorario('14:00')
    setApresentacao(
      'É com grande alegria e honra que convidamos você para compartilhar sua trajetória inspiradora no CoffeeCast 4.0. Preparamos uma mesa com afeto, respeito e cafés especiais para dar voz à sua história que transforma.',
    )
    setFotoFile(null)
    setLogoFile(null)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('data_gravacao', dataGravacao)
      formData.append('horario', horario.trim())
      formData.append('apresentacao', apresentacao.trim())

      if (fotoFile) formData.append('foto_convidado', fotoFile)
      if (logoFile) formData.append('logomarca_empresa', logoFile)

      await pb.collection('convites').create(formData)
      toast.success('Convite gerado com sucesso!')
      setModalOpen(false)
      loadConvites()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cadastrar convite.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Deseja remover o convite para "${name}"?`)) return

    try {
      await pb.collection('convites').delete(id)
      toast.success('Convite removido!')
      loadConvites()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir convite.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-vinho">Gerador de Convites Premium</h2>
          <p className="text-xs text-vinho/70">
            Crie e imprima ou salve em PDF convites sofisticados na identidade oficial do CoffeeCast
            4.0.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-5 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4 text-dourado" />
          Gerar Novo Convite
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-vinho/60">Carregando convites...</div>
      ) : convites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-vinho/10 p-12 text-center space-y-3">
          <Sparkles className="w-12 h-12 text-dourado mx-auto" />
          <h3 className="font-serif text-lg font-bold text-vinho">Nenhum convite emitido</h3>
          <p className="text-xs text-vinho/60 max-w-sm mx-auto">
            Gere convites oficiais personalizados para seus convidados com foto, marca e texto de
            boas-vindas.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="bg-vinho text-white text-xs">
            Gerar primeiro convite
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {convites.map((item) => {
            const guestPhoto = item.foto_convidado
              ? getFileUrl(item, item.foto_convidado, '200x200')
              : 'https://img.usecurling.com/ppl/256?gender=female'
            const companyLogo = item.logomarca_empresa
              ? getFileUrl(item, item.logomarca_empresa, '200x200')
              : ''

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-vinho/10 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-dourado transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={guestPhoto}
                        alt={item.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-dourado"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-base text-vinho">{item.nome}</h4>
                        <span className="text-[11px] text-vinho/60">Convidada Especial</span>
                      </div>
                    </div>

                    {companyLogo && (
                      <img
                        src={companyLogo}
                        alt="Empresa"
                        className="w-10 h-10 object-contain rounded-md border border-vinho/10 p-1"
                      />
                    )}
                  </div>

                  <div className="bg-marfim p-3 rounded-xl border border-vinho/5 space-y-1 text-xs text-vinho">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-dourado-dark" />
                      <span>Data: {formatDateBR(item.data_gravacao)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-dourado-dark" />
                      <span>Horário: {item.horario}</span>
                    </div>
                  </div>

                  <p className="text-xs text-vinho/75 italic line-clamp-3">"{item.apresentacao}"</p>
                </div>

                <div className="pt-3 border-t border-vinho/10 flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => {
                      setPreviewConvite(item)
                      setPreviewOpen(true)
                    }}
                    className="bg-vinho hover:bg-vinho-light text-white text-xs rounded-full px-4 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-dourado" />
                    Visualizar & PDF
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id, item.nome)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Criação do Convite */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-marfim border-2 border-dourado/50 text-vinho">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-vinho">
              Gerar Novo Convite Oficial
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="conv-nome" className="text-xs font-semibold text-vinho">
                Nome do Convidado(a) *
              </Label>
              <Input
                id="conv-nome"
                required
                placeholder="Ex.: Dra. Gabriela Fontes"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-white border-vinho/20 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="conv-data" className="text-xs font-semibold text-vinho">
                  Data da Gravação *
                </Label>
                <Input
                  id="conv-data"
                  type="date"
                  required
                  value={dataGravacao}
                  onChange={(e) => setDataGravacao(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-hora" className="text-xs font-semibold text-vinho">
                  Horário da Gravação *
                </Label>
                <Input
                  id="conv-hora"
                  required
                  placeholder="Ex.: 14:00"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="bg-white border-vinho/20 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conv-apres" className="text-xs font-semibold text-vinho">
                Texto de Apresentação / Mensagem de Boas-Vindas *
              </Label>
              <Textarea
                id="conv-apres"
                required
                rows={3}
                value={apresentacao}
                onChange={(e) => setApresentacao(e.target.value)}
                className="bg-white border-vinho/20 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">Foto do Convidado(a)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                className="bg-white border-vinho/20 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-vinho">
                Logomarca da Empresa (Opcional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
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
                {saving ? 'Gerando...' : 'Gerar Convite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PREVIEW E IMPRESSÃO EM PDF DO CONVITE PREMIUM */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl bg-marfim border-2 border-dourado text-vinho p-0 overflow-hidden">
          {previewConvite && (
            <div>
              {/* Botão de impressão */}
              <div className="p-4 bg-white border-b border-vinho/10 flex items-center justify-between">
                <span className="text-xs font-bold text-vinho">
                  Visualização do Convite Gráfico
                </span>
                <Button
                  onClick={handlePrint}
                  className="bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-dourado" />
                  Imprimir / Salvar PDF
                </Button>
              </div>

              {/* CONTEÚDO DO CONVITE (DESIGN PREMIUM VINHO & DOURADO) */}
              <div
                ref={invitePrintRef}
                className="p-8 sm:p-12 bg-gradient-to-b from-vinho via-[#36142D] to-vinho text-marfim space-y-8 relative overflow-hidden"
              >
                {/* Borda decorativa dourada dupla */}
                <div className="absolute inset-3 border-2 border-dourado/50 rounded-2xl pointer-events-none" />
                <div className="absolute inset-5 border border-dourado/20 rounded-xl pointer-events-none" />

                {/* Cabeçalho do Convite */}
                <div className="text-center space-y-3 relative z-10">
                  <div className="flex justify-center mb-1">
                    <CoffeeCastLogo className="w-16 h-16" variant="gold" />
                  </div>
                  <h3 className="font-serif font-black text-2xl sm:text-3xl tracking-wide text-white">
                    CoffeeCast <span className="text-dourado">4.0</span>
                  </h3>
                  <p className="text-[11px] uppercase tracking-widest text-dourado-light font-bold">
                    Convite Oficial de Participação
                  </p>
                </div>

                {/* Card Central com Foto e Apresentação */}
                <div className="bg-vinho-dark/80 border border-dourado/40 rounded-2xl p-6 sm:p-8 space-y-6 relative z-10 text-center shadow-xl backdrop-blur-sm">
                  {/* Foto da convidada com moldura dourada */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={
                          previewConvite.foto_convidado
                            ? getFileUrl(previewConvite, previewConvite.foto_convidado)
                            : 'https://img.usecurling.com/ppl/256?gender=female'
                        }
                        alt={previewConvite.nome}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-dourado shadow-2xl"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-vinho p-1.5 rounded-full border border-dourado">
                        <Sparkles className="w-4 h-4 text-dourado" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-dourado-light uppercase font-semibold tracking-wider">
                      Convidada de Honra
                    </span>
                    <h4 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {previewConvite.nome}
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm text-marfim/90 leading-relaxed font-light italic max-w-lg mx-auto">
                    "{previewConvite.apresentacao}"
                  </p>

                  {/* Informações de Gravação */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dourado/30 text-xs">
                    <div className="bg-vinho/70 p-3 rounded-xl border border-dourado/20">
                      <span className="text-[10px] text-dourado uppercase font-bold block mb-1">
                        Data da Gravação
                      </span>
                      <span className="font-serif text-sm font-bold text-white">
                        {formatDateBR(previewConvite.data_gravacao)}
                      </span>
                    </div>

                    <div className="bg-vinho/70 p-3 rounded-xl border border-dourado/20">
                      <span className="text-[10px] text-dourado uppercase font-bold block mb-1">
                        Horário Marcado
                      </span>
                      <span className="font-serif text-sm font-bold text-white">
                        {previewConvite.horario}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Convite */}
                <div className="relative z-10 text-center space-y-2 pt-2">
                  <p className="text-xs text-dourado-light italic">
                    "Aqui o café pode até esfriar, mas o papo nunca! ☕️"
                  </p>
                  <p className="text-[10px] text-marfim/60 uppercase tracking-wider">
                    Equipe CoffeeCast 4.0 • Aline Lana
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
