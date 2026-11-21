// src/components/estudio/EstudioLaboratorio.tsx
// Aba 2 do Estúdio Criativo IA — Laboratório de Templates IA (CoffeeCast 4.0)
// "GERAR PROPOSTAS COM IA" via agente CoffeeCast Creative AI (hook único /estudio/templates).
// Template aprovado vira template REUTILIZÁVEL (camadas/áreas/bloqueios), nunca imagem estática.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  camadasAPartirDeProposta,
  comporCapa,
  templateMestrePremiumDourado,
  ESTILOS_TEMPLATE,
  type EstudioCapaInput,
} from '@/lib/estudioMotor'
import { EstudioService, gerarPropostasTemplate, type TemplateProposta } from '@/services/estudio'

interface PropostaComPreview extends TemplateProposta {
  previewDataUrl?: string
}

interface Props {
  onTemplateSalvo?: () => void
}

export default function EstudioLaboratorio({ onTemplateSalvo }: Props) {
  const { toast } = useToast()
  const [nome, setNome] = useState('')
  const [estilo, setEstilo] = useState<string>('Premium Dourado')
  const [paleta, setPaleta] = useState('vinho #4B1E3F, dourado, rosé, marfim')
  const [descricao, setDescricao] = useState('')
  const [elementos, setElementos] = useState('')
  const [gerando, setGerando] = useState(false)
  const [propostas, setPropostas] = useState<PropostaComPreview[]>([])
  const [salvandoIdx, setSalvandoIdx] = useState<number | null>(null)

  async function gerarPropostas() {
    setGerando(true)
    try {
      const res = await gerarPropostasTemplate({
        estilo,
        paleta,
        descricao,
        elementos_obrigatorios: elementos,
      })
      if (!res.sucesso || !res.dados?.propostas?.length) {
        toast({
          title: res.chatgptAtivo ? 'IA indisponível agora' : 'ChatGPT não configurado',
          description: res.mensagem || 'Tente novamente em instantes.',
          variant: 'destructive',
        })
        return
      }
      // prévias comparáveis: renderiza cada proposta com o motor gráfico real
      const comPreview: PropostaComPreview[] = []
      for (const p of res.dados.propostas) {
        const tpl = camadasAPartirDeProposta(p as { nome?: string; camadas?: never[] })
        let previewDataUrl: string | undefined
        try {
          const input: EstudioCapaInput = {
            episodioTitulo: '',
            tituloCapa: 'HISTÓRIAS QUE INSPIRAM',
            convidados: [],
            templateJson: tpl as unknown as { camadas?: never[] },
          }
          const comp = await comporCapa(input, 'base')
          previewDataUrl = comp.dataUrl
        } catch (_) {
          previewDataUrl = undefined
        }
        comPreview.push({ ...p, previewDataUrl })
      }
      setPropostas(comPreview)
      toast({
        title: '3 propostas geradas!',
        description: 'Aprove, edite, regenere ou descarte cada uma.',
      })
    } catch (err) {
      toast({ title: 'Erro ao gerar propostas', description: String(err), variant: 'destructive' })
    } finally {
      setGerando(false)
    }
  }

  async function salvarProposta(p: PropostaComPreview, status: 'ativo' | 'rascunho') {
    setSalvandoIdx(propostas.indexOf(p))
    try {
      const tpl = camadasAPartirDeProposta(p as { nome?: string; camadas?: never[] })
      await EstudioService.templates.criar({
        nome: (p.nome || nome || 'Template sem nome').slice(0, 120),
        estilo: p.estilo || estilo,
        descricao: p.descricao || descricao,
        paleta: p.paleta || paleta,
        formato: '16:9 (1280x720)',
        template_json: tpl as unknown as Record<string, unknown>,
        status,
        bloqueado: false,
        mestre: false,
        versao: 1,
        autor: 'Estúdio Criativo IA',
      })
      toast({
        title: status === 'ativo' ? 'Template publicado!' : 'Rascunho salvo!',
        description: 'Disponível na Biblioteca Criativa → Meus Templates.',
      })
      setPropostas((prev) => prev.filter((x) => x !== p))
      onTemplateSalvo?.()
    } catch (err) {
      toast({ title: 'Erro ao salvar template', description: String(err), variant: 'destructive' })
    } finally {
      setSalvandoIdx(null)
    }
  }

  function regenerar(p: PropostaComPreview) {
    setPropostas((prev) => prev.filter((x) => x !== p))
    toast({ title: 'Proposta descartada', description: 'Ajuste as orientações e gere novamente.' })
    void p
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="tpl-nome" className="text-sm font-semibold">
                Nome do template
              </Label>
              <Input
                id="tpl-nome"
                className="mt-1"
                placeholder="Ex.: CoffeeCast Elegante Vinho"
                value={nome}
                onChange={(ev) => setNome(ev.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Estilo</Label>
              <Select value={estilo} onValueChange={setEstilo}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTILOS_TEMPLATE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tpl-paleta" className="text-sm font-semibold">
                Paleta de cores
              </Label>
              <Input
                id="tpl-paleta"
                className="mt-1"
                value={paleta}
                onChange={(ev) => setPaleta(ev.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tpl-elementos" className="text-sm font-semibold">
                Elementos obrigatórios
              </Label>
              <Input
                id="tpl-elementos"
                className="mt-1"
                placeholder="Ex.: logo no cabeçalho, slogan no rodapé, área de foto à esquerda"
                value={elementos}
                onChange={(ev) => setElementos(ev.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tpl-descricao" className="text-sm font-semibold">
              Descrição criativa / orientações
            </Label>
            <Textarea
              id="tpl-descricao"
              className="mt-1 min-h-20"
              placeholder="Descreva a ideia: atmosfera, referências, hierarquia visual, formato…"
              value={descricao}
              onChange={(ev) => setDescricao(ev.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={gerarPropostas}
            disabled={gerando}
            className="w-full bg-[#4B1E3F] text-white hover:bg-[#5d2650]"
          >
            {gerando ? 'Criando propostas…' : '✨ GERAR PROPOSTAS COM IA'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            O agente CoffeeCast Creative AI propõe 3 variações com estrutura em camadas — o template
            aprovado é reutilizável e editável (não é imagem estática).
          </p>
        </CardContent>
      </Card>

      {propostas.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {propostas.map((p, i) => (
            <Card key={i} className="border border-[#4B1E3F]/15 shadow-sm overflow-hidden">
              <div className="aspect-video bg-muted">
                {p.previewDataUrl ? (
                  <img
                    src={p.previewDataUrl}
                    alt={`Prévia ${p.nome}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Prévia indisponível
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif font-semibold leading-tight">
                    {p.nome || `Proposta ${i + 1}`}
                  </h4>
                  <Badge variant="outline" className="shrink-0 border-[#C9971F]/40 text-[#8a6a2e]">
                    {p.estilo || estilo}
                  </Badge>
                </div>
                {p.paleta && <p className="text-xs text-muted-foreground">Paleta: {p.paleta}</p>}
                {p.descricao && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{p.descricao}</p>
                )}
                {p.estrutura && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium text-foreground">
                      Estrutura visual
                    </summary>
                    <p className="mt-1">{p.estrutura}</p>
                  </details>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    className="bg-[#4B1E3F] text-white hover:bg-[#5d2650]"
                    disabled={salvandoIdx !== null}
                    onClick={() => salvarProposta(p, 'ativo')}
                  >
                    ✔ Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={salvandoIdx !== null}
                    onClick={() => salvarProposta(p, 'rascunho')}
                  >
                    💾 Rascunho
                  </Button>
                  <Button size="sm" variant="ghost" onClick={gerarPropostas} disabled={gerando}>
                    ↻ Regenerar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => regenerar(p)}
                  >
                    ✕ Descartar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground text-sm">Referência oficial</p>
          <p className="mt-1">
            O Template Mestre <strong>{templateMestrePremiumDourado().nome}</strong> é bloqueado e
            serve de base estrutural para novas propostas: cabeçalho oficial, slogan "Mais que
            conversas, histórias que transformam." e rodapé CURTA | INSCREVA-SE | ATIVE O SININHO
            são sempre preservados. Nenhuma variação menciona temporada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
