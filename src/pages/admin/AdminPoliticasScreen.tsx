import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import type { PoliticaRecord } from '@/types/database'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ShieldCheck, Save, Sparkles, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function AdminPoliticasScreen() {
  const [activeTab, setActiveTab] = useState<'privacidade' | 'cookies' | 'termos'>('privacidade')
  const [politicas, setPoliticas] = useState<Record<string, PoliticaRecord>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states do tab ativo
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')

  const loadPoliticas = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('politicas').getFullList<PoliticaRecord>()
      const map: Record<string, PoliticaRecord> = {}
      list.forEach((p) => {
        map[p.slug] = p
      })
      setPoliticas(map)

      if (map[activeTab]) {
        setTitulo(map[activeTab].titulo || '')
        setConteudo(map[activeTab].conteudo || '')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar políticas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPoliticas()
  }, [])

  const handleTabChange = (val: string) => {
    const slug = val as 'privacidade' | 'cookies' | 'termos'
    setActiveTab(slug)
    if (politicas[slug]) {
      setTitulo(politicas[slug].titulo || '')
      setConteudo(politicas[slug].conteudo || '')
    } else {
      setTitulo(
        slug === 'privacidade'
          ? 'Política de Privacidade'
          : slug === 'cookies'
            ? 'Política de Cookies'
            : 'Termos de Uso',
      )
      setConteudo('')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const existing = politicas[activeTab]
      const payload = {
        slug: activeTab,
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
      }

      if (existing) {
        await pb.collection('politicas').update(existing.id, payload)
        toast.success(`Política de ${activeTab} atualizada!`)
      } else {
        await pb.collection('politicas').create(payload)
        toast.success(`Política de ${activeTab} criada!`)
      }

      loadPoliticas()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar documento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-vinho">
            Políticas & Termos do Site
          </h2>
          <p className="text-xs text-vinho/70">
            Edite o texto formal da Política de Privacidade, Política de Cookies e Termos de Uso.
          </p>
        </div>

        <Link
          to={`/politica/${activeTab}`}
          target="_blank"
          className="inline-flex items-center justify-center gap-1.5 text-xs text-dourado-dark hover:underline font-semibold bg-white px-4 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-xl sm:rounded-full border border-vinho/15 shadow-xs"
        >
          Visualizar página pública
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-vinho/10 shadow-sm p-4 sm:p-8 space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-marfim border border-vinho/15 p-1 rounded-xl w-full grid grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger
              value="privacidade"
              className="text-xs font-semibold data-[state=active]:bg-vinho data-[state=active]:text-white rounded-lg px-2 sm:px-4 min-h-[40px]"
            >
              Privacidade
            </TabsTrigger>
            <TabsTrigger
              value="cookies"
              className="text-xs font-semibold data-[state=active]:bg-vinho data-[state=active]:text-white rounded-lg px-2 sm:px-4 min-h-[40px]"
            >
              Cookies
            </TabsTrigger>
            <TabsTrigger
              value="termos"
              className="text-xs font-semibold data-[state=active]:bg-vinho data-[state=active]:text-white rounded-lg px-2 sm:px-4 min-h-[40px]"
            >
              Termos
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSave} className="space-y-5 pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="pol-titulo" className="text-xs font-semibold text-vinho">
                Título do Documento *
              </Label>
              <Input
                id="pol-titulo"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-marfim border-vinho/20 text-sm font-serif font-bold text-vinho"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pol-conteudo" className="text-xs font-semibold text-vinho">
                Conteúdo Jurídico e Orientações *
              </Label>
              <Textarea
                id="pol-conteudo"
                required
                rows={14}
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                className="bg-marfim border-vinho/20 text-xs sm:text-sm font-light leading-relaxed font-mono p-4"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-vinho/60">
                <ShieldCheck className="w-4 h-4 text-dourado-dark shrink-0" />
                <span>Salvo e protegido na infraestrutura Skip Cloud</span>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white text-xs font-bold px-6 py-2 rounded-full shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5 text-dourado" />
                {saving ? 'Gravando...' : 'Salvar Política'}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  )
}
