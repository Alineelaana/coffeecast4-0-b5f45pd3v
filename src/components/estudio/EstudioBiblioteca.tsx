// src/components/estudio/EstudioBiblioteca.tsx
// Aba 3 do Estúdio Criativo IA — Biblioteca Criativa (MEUS TEMPLATES / MINHAS CAPAS)

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { pb } from '@/lib/pocketbase/client'
import {
  EstudioService,
  type CapaEstudioRecord,
  type CapaTemplateRecord,
  urlArquivoCapa,
} from '@/services/estudio'
import { baixarDataUrl, dataUrlParaBlob } from '@/lib/estudioMotor'

interface Props {
  atualizadoEm?: number // muda quando um template/capa novo é salvo, para recarregar
}

export default function EstudioBiblioteca({ atualizadoEm }: Props) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<CapaTemplateRecord[]>([])
  const [capas, setCapas] = useState<CapaEstudioRecord[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [tpl, cp] = await Promise.all([
        EstudioService.templates.listar(['status != "arquivado"'], { sort: '-created' }),
        EstudioService.capas.listar([], { sort: '-created' }),
      ])
      setTemplates(tpl.items)
      setCapas(cp.items)
    } catch (_) {
      /* biblioteca vazia ou erro de rede — mantém listas vazias */
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar, atualizadoEm])

  async function alternarStatusTemplate(t: CapaTemplateRecord) {
    try {
      await EstudioService.templates.atualizar(t.id, {
        status: t.status === 'ativo' ? 'arquivado' : 'ativo',
      })
      toast({ title: t.status === 'ativo' ? 'Template arquivado' : 'Template reativado' })
      void carregar()
    } catch (err) {
      toast({
        title: 'Erro ao atualizar template',
        description: String(err),
        variant: 'destructive',
      })
    }
  }

  async function duplicarTemplate(t: CapaTemplateRecord) {
    try {
      await EstudioService.templates.criar({
        nome: `${t.nome} (cópia)`,
        estilo: t.estilo,
        descricao: t.descricao,
        paleta: t.paleta,
        formato: t.formato,
        template_json: (t.template_json || {}) as Record<string, unknown>,
        status: 'rascunho',
        bloqueado: false,
        mestre: false,
        versao: (t.versao || 1) + 1,
        autor: pb.authStore.record?.email || 'Estúdio Criativo IA',
      })
      toast({
        title: 'Template duplicado como rascunho',
        description: 'Edite-o no Laboratório e publique.',
      })
      void carregar()
    } catch (err) {
      toast({ title: 'Erro ao duplicar', description: String(err), variant: 'destructive' })
    }
  }

  async function excluirCapa(c: CapaEstudioRecord) {
    if (!window.confirm(`Excluir a capa "${c.titulo}"? Esta ação não pode ser desfeita.`)) return
    try {
      await EstudioService.capas.excluir(c.id)
      toast({ title: 'Capa excluída' })
      void carregar()
    } catch (err) {
      toast({ title: 'Erro ao excluir', description: String(err), variant: 'destructive' })
    }
  }

  async function baixarCapa(c: CapaEstudioRecord, formato: 'png' | 'jpg') {
    try {
      const url = urlArquivoCapa(c, c.arquivo)
      if (!url) throw new Error('Arquivo não disponível')
      const resp = await fetch(url)
      const blob = await resp.blob()
      const ext = c.arquivo.split('.').pop() || formato
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `capa-coffeecast-${c.id.slice(0, 8)}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      toast({ title: 'Erro no download', description: String(err), variant: 'destructive' })
    }
  }

  return (
    <Tabs defaultValue="templates" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="templates">Meus Templates</TabsTrigger>
        <TabsTrigger value="capas">Minhas Capas</TabsTrigger>
      </TabsList>

      <TabsContent value="templates" className="mt-4">
        {carregando ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando templates…</p>
        ) : templates.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum template ainda. Crie no <strong>Laboratório de Templates IA</strong>.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((t) => {
              const camadas = (t.template_json as { camadas?: unknown[] })?.camadas || []
              const areas = camadas.filter(
                (c) => (c as { tipo?: string }).tipo === 'area_convidado',
              ).length
              return (
                <Card key={t.id} className="border shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-semibold leading-tight">{t.nome}</h4>
                      <div className="flex shrink-0 gap-1">
                        {t.mestre && <Badge className="bg-[#4B1E3F] text-[#F5E9D7]">Mestre</Badge>}
                        {t.bloqueado && <Badge variant="outline">🔒</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <Badge variant="secondary">{t.estilo || 'sem estilo'}</Badge>
                      <Badge variant="outline">v{t.versao || 1}</Badge>
                      <Badge
                        variant="outline"
                        className={
                          t.status === 'ativo'
                            ? 'border-emerald-500/40 text-emerald-700'
                            : 'border-amber-500/40 text-amber-700'
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.formato || '16:9'} · {areas} área(s) de convidado · por {t.autor || '—'} ·{' '}
                      {t.created ? new Date(t.created).toLocaleDateString('pt-BR') : ''}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {t.descricao || 'Sem descrição.'}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {!t.bloqueado && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => duplicarTemplate(t)}>
                            Duplicar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => alternarStatusTemplate(t)}
                          >
                            {t.status === 'ativo' ? 'Arquivar' : 'Reativar'}
                          </Button>
                        </>
                      )}
                      {t.bloqueado && (
                        <p className="text-xs text-muted-foreground">
                          Elementos oficiais protegidos — admins podem criar novas versões a partir
                          dele.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="capas" className="mt-4">
        {carregando ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando capas…</p>
        ) : capas.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma capa ainda. Gere na aba <strong>Gerador de Capas</strong>.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capas.map((c) => {
              const url = urlArquivoCapa(c, c.arquivo)
              return (
                <Card key={c.id} className="border shadow-sm overflow-hidden">
                  <div className="aspect-video bg-muted">
                    {url ? (
                      <img
                        src={url}
                        alt={c.titulo}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Sem arquivo
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-semibold leading-tight line-clamp-2">
                        {c.titulo}
                      </h4>
                      {c.oficial && (
                        <Badge className="shrink-0 bg-[#C9971F] text-white">Oficial</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.episodio_id ? `Episódio ${c.episodio_id.slice(0, 6)}` : 'Sem episódio'} ·{' '}
                      {c.template_nome || 'template'} · {c.resolucao || '1280x720'} · v
                      {c.versao || 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.created ? new Date(c.created).toLocaleString('pt-BR') : ''} ·{' '}
                      {c.usuario || ''}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.arquivo && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => baixarCapa(c, 'png')}>
                            ⬇ PNG
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => baixarCapa(c, 'jpg')}>
                            ⬇ JPG
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => excluirCapa(c)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
