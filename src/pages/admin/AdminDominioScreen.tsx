import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import type { ConteudoSiteRecord } from '@/types/database'
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  HelpCircle,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// Domínio padrão de produção do Skip Cloud para este projeto
const DOMINIO_PADRAO_SKIP = 'https://inicio-do-projeto-df3d5.goskip.app'
const HOST_DESTINO_SKIP = 'inicio-do-projeto-df3d5.goskip.app'
const IP_PADRAO_SKIP = '76.76.21.21' // IP Anycast padrão de CDN / hosting Skip

export default function AdminDominioScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estados de formulário
  const [dominioPersonalizado, setDominioPersonalizado] = useState('')
  const [redirecionarWww, setRedirecionarWww] = useState(true)
  const [aliases, setAliases] = useState('')
  const [status, setStatus] = useState<'pendente_dns' | 'aguardando_propagacao' | 'ativo'>(
    'pendente_dns',
  )
  const [ativadoSuporte, setAtivadoSuporte] = useState(false)
  const [dataSolicitacao, setDataSolicitacao] = useState('')

  // Estado de cópia para feedback visual
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Erros de validação
  const [validationError, setValidationError] = useState<string | null>(null)

  // Map de registros de conteudo_site
  const [recordsMap, setRecordsMap] = useState<Record<string, ConteudoSiteRecord>>({})

  const loadDomainConfig = async () => {
    try {
      setLoading(true)
      const list = await pb.collection('conteudo_site').getFullList<ConteudoSiteRecord>({
        filter: 'chave ~ "dominio_"',
      })

      const map: Record<string, ConteudoSiteRecord> = {}
      list.forEach((item) => {
        map[item.chave] = item
      })
      setRecordsMap(map)

      const dom = map['dominio_personalizado']?.valor || ''
      setDominioPersonalizado(dom)

      const st =
        (map['dominio_status']?.valor as 'pendente_dns' | 'aguardando_propagacao' | 'ativo') ||
        'pendente_dns'
      setStatus(st)

      const redir = map['dominio_redirecionar_www']?.valor !== 'false'
      setRedirecionarWww(redir)

      const al = map['dominio_aliases']?.valor || ''
      setAliases(al)

      const ativ = map['dominio_ativado_suporte']?.valor === 'true'
      setAtivadoSuporte(ativ)

      const dataSol = map['dominio_data_solicitacao']?.valor || ''
      setDataSolicitacao(dataSol)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar configurações de domínio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDomainConfig()
  }, [])

  // Validação estrita do domínio personalizado
  const validateAndSanitizeDomain = (
    raw: string,
  ): { valid: boolean; sanitized: string; error?: string } => {
    let clean = raw.trim().toLowerCase()

    if (!clean) {
      return { valid: true, sanitized: '' }
    }

    // Remove http:// ou https:// se o usuário colou
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      clean = clean.replace(/^https?:\/\//, '')
    }

    // Remove caminhos, barras e portas
    clean = clean.split('/')[0].split(':')[0].trim()

    // Validação com regex para domínios válidos (ex: coffeecast.com.br, meu-podcast.com)
    // Permite letras, números, traços e pontos, devendo ter ao menos um ponto com TLD de 2+ chars
    const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

    if (!domainRegex.test(clean)) {
      return {
        valid: false,
        sanitized: clean,
        error: 'Formato de domínio inválido. Use ex.: coffeecast.com.br (sem http:// ou barras).',
      }
    }

    return { valid: true, sanitized: clean }
  }

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDominioPersonalizado(val)
    if (!val.trim()) {
      setValidationError(null)
      return
    }
    const check = validateAndSanitizeDomain(val)
    if (!check.valid) {
      setValidationError(check.error || 'Formato de domínio inválido')
    } else {
      setValidationError(null)
    }
  }

  const handleCopy = (text: string, key: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Copiado para a área de transferência!')
    setTimeout(() => {
      setCopiedKey(null)
    }, 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const check = validateAndSanitizeDomain(dominioPersonalizado)
    if (!check.valid) {
      toast.error(check.error || 'Por favor, corrija o domínio informado.')
      setValidationError(check.error || 'Formato de domínio inválido')
      return
    }

    setSaving(true)
    const cleanDomain = check.sanitized

    try {
      const now = new Date().toISOString()
      const newStatus = cleanDomain
        ? ativadoSuporte
          ? 'ativo'
          : status === 'ativo'
            ? 'ativo'
            : 'pendente_dns'
        : 'pendente_dns'

      const updates: Array<{ chave: string; valor: string }> = [
        { chave: 'dominio_personalizado', valor: cleanDomain },
        { chave: 'dominio_status', valor: newStatus },
        { chave: 'dominio_redirecionar_www', valor: redirecionarWww ? 'true' : 'false' },
        { chave: 'dominio_aliases', valor: aliases.trim().toLowerCase() },
        { chave: 'dominio_ativado_suporte', valor: ativadoSuporte ? 'true' : 'false' },
        {
          chave: 'dominio_data_solicitacao',
          valor: cleanDomain ? dataSolicitacao || now : '',
        },
      ]

      for (const item of updates) {
        const existing = recordsMap[item.chave]
        if (existing) {
          await pb.collection('conteudo_site').update(existing.id, { valor: item.valor })
        } else {
          await pb.collection('conteudo_site').create({ chave: item.chave, valor: item.valor })
        }
      }

      setDominioPersonalizado(cleanDomain)
      setStatus(newStatus)
      if (cleanDomain && !dataSolicitacao) {
        setDataSolicitacao(now)
      }

      toast.success('Configurações de domínio salvas com sucesso!')
      await loadDomainConfig()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar configurações do domínio.')
    } finally {
      setSaving(false)
    }
  }

  // Tabela com registros DNS recomendados
  const dnsRecords = [
    {
      tipo: 'CNAME',
      nome: 'www',
      valor: HOST_DESTINO_SKIP,
      ttl: '3600 (Automático)',
      finalidade: 'Aponta o subdomínio www para o Skip Cloud',
      copia: HOST_DESTINO_SKIP,
      key: 'cname_www',
    },
    {
      tipo: 'A',
      nome: '@ (ou em branco)',
      valor: IP_PADRAO_SKIP,
      ttl: '3600 (Automático)',
      finalidade: 'Aponta o domínio raiz (apex) para a infraestrutura Skip',
      copia: IP_PADRAO_SKIP,
      key: 'a_root',
    },
    {
      tipo: 'CNAME (Alternativa)',
      nome: '@ (se suportado ALIAS/ANAME)',
      valor: HOST_DESTINO_SKIP,
      ttl: '3600',
      finalidade: 'Para provedores com suporte a CNAME Flattening (Cloudflare, etc.)',
      copia: HOST_DESTINO_SKIP,
      key: 'cname_apex',
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl border border-vinho/10 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-vinho/10 text-vinho flex items-center justify-center shrink-0 border border-vinho/15">
            <Globe className="w-6 h-6 text-dourado-dark" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl font-bold text-vinho">Domínio do Site</h1>
              <Badge className="bg-dourado text-vinho font-bold text-[10px] px-2 py-0.5">
                Exclusivo Master
              </Badge>
            </div>
            <p className="text-xs text-vinho/70 mt-0.5">
              Configure o domínio próprio (ex.: coffeecast.com.br) para o site público do podcast.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadDomainConfig}
            disabled={loading}
            className="w-full sm:w-auto text-xs border-vinho/20 text-vinho hover:bg-vinho/5 min-h-[40px]"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* CARD DO DOMÍNIO ATUAL ATIVO (SKIP CLOUD) */}
      <div className="bg-gradient-to-br from-vinho to-vinho-dark rounded-2xl p-6 text-marfim shadow-md relative overflow-hidden border border-dourado/30">
        <div className="absolute top-0 right-0 transform translate-x-10 -translate-y-10 w-48 h-48 bg-dourado/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-dourado-light">
                Domínio Atual Ativo (Produção Skip Cloud)
              </p>
            </div>
            <p className="font-mono text-base sm:text-lg font-bold text-white break-all">
              {DOMINIO_PADRAO_SKIP}
            </p>
            <p className="text-xs text-marfim/80 max-w-2xl leading-relaxed">
              Este é o endereço seguro padrão onde o CoffeeCast 4.0 está hospedado e funcionando
              atualmente. Ele permanecerá ativo mesmo após a configuração do seu domínio próprio.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <a
              href={DOMINIO_PADRAO_SKIP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-dourado hover:bg-dourado-light text-vinho font-bold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Testar Domínio Ativo
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(DOMINIO_PADRAO_SKIP, 'skip_url')}
              className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full min-h-[38px]"
            >
              {copiedKey === 'skip_url' ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Endereço
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE CONFIGURAÇÃO DE DOMÍNIO */}
      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white rounded-2xl border border-vinho/10 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-vinho/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-vinho/5 text-vinho flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-dourado-dark" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-vinho">
                  Cadastrar Domínio Personalizado
                </h2>
                <p className="text-xs text-vinho/70">
                  Informe o domínio que você registrou no Registro.br, GoDaddy, Hostinger ou
                  Cloudflare.
                </p>
              </div>
            </div>

            {/* STATUS BADGE */}
            {dominioPersonalizado && (
              <div className="hidden sm:flex items-center gap-1.5">
                {status === 'ativo' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold px-3 py-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Domínio Ativo
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-semibold px-3 py-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                    Aguardando configuração de DNS
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* STATUS MOBILE */}
          {dominioPersonalizado && (
            <div className="sm:hidden p-3 rounded-xl bg-marfim/70 border border-vinho/10 flex items-center justify-between">
              <span className="text-xs font-bold text-vinho">Status:</span>
              {status === 'ativo' ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-xs px-2.5 py-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-semibold text-xs px-2.5 py-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700" /> Aguardando DNS
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo Domínio Principal */}
            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor="dominio-input"
                className="text-xs font-bold text-vinho flex items-center justify-between"
              >
                <span>Domínio Personalizado Desejado *</span>
                <span className="text-[11px] font-normal text-vinho/60">
                  Sem http://, sem https:// e sem barras
                </span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-vinho/40">
                  <Globe className="w-4 h-4" />
                </div>
                <Input
                  id="dominio-input"
                  placeholder="Ex.: coffeecast.com.br"
                  value={dominioPersonalizado}
                  onChange={handleDomainChange}
                  className={`pl-10 pr-4 bg-marfim/30 text-vinho font-mono text-sm border-vinho/20 min-h-[46px] rounded-xl ${
                    validationError ? 'border-red-500 focus-visible:ring-red-400' : ''
                  }`}
                />
              </div>
              {validationError ? (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {validationError}
                </p>
              ) : (
                <p className="text-[11px] text-vinho/60">
                  Exemplo: <code className="font-mono font-bold text-vinho">coffeecast.com.br</code>{' '}
                  ou{' '}
                  <code className="font-mono font-bold text-vinho">podcast.minhaempresa.com</code>
                </p>
              )}
            </div>

            {/* Alternância Redirecionamento WWW */}
            <div className="p-4 rounded-xl bg-marfim/50 border border-vinho/10 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label
                  htmlFor="redir-www"
                  className="text-xs font-bold text-vinho cursor-pointer block"
                >
                  Redirecionamento automático www
                </Label>
                <p className="text-[11px] text-vinho/65">
                  Permite acessar tanto com <span className="font-mono">www.</span> quanto sem.
                </p>
              </div>
              <Switch
                id="redir-www"
                checked={redirecionarWww}
                onCheckedChange={setRedirecionarWww}
              />
            </div>

            {/* Domínios Adicionais / Aliases */}
            <div className="p-4 rounded-xl bg-marfim/50 border border-vinho/10 space-y-2">
              <Label
                htmlFor="aliases-input"
                className="text-xs font-bold text-vinho flex items-center justify-between"
              >
                <span>Domínios Aliases (Opcional)</span>
                <span className="text-[10px] font-normal text-vinho/60">Separados por vírgula</span>
              </Label>
              <Input
                id="aliases-input"
                placeholder="Ex.: coffeecast.tv, coffeecast4.com"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                className="bg-white border-vinho/20 text-xs font-mono rounded-lg"
              />
              <p className="text-[10px] text-vinho/60">
                Domínios secundários que apontam para o mesmo site.
              </p>
            </div>
          </div>

          {/* PAINEL DE TRANSIÇÃO / STATUS HONESTO */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 text-amber-950 space-y-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Como funciona a ativação do domínio?
                </h3>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  <strong>O domínio não fica ativo imediatamente sozinho.</strong> Para que seu
                  endereço próprio funcione, você precisa acessar o painel onde comprou o domínio
                  (como Registro.br, GoDaddy, Hostinger ou Cloudflare) e cadastrar os registros DNS
                  indicados abaixo. Após salvar aqui e apontar os registros, a propagação leva de 1
                  a 24 horas.
                </p>
              </div>
            </div>

            {/* Controle de ativação pelo suporte Master */}
            <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  Sinalizador de Ativação do Domínio
                </p>
                <p className="text-[11px] text-amber-900/80">
                  Marque como ativo após os testes de DNS confirmarem que o apontamento propagou.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-amber-900">
                  {ativadoSuporte ? 'Confirmado Ativo' : 'Aguardando DNS'}
                </span>
                <Switch
                  checked={ativadoSuporte}
                  onCheckedChange={(checked) => {
                    setAtivadoSuporte(checked)
                    setStatus(checked ? 'ativo' : 'pendente_dns')
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving || Boolean(validationError)}
              className="w-full sm:w-auto min-h-[44px] bg-vinho hover:bg-vinho-light text-white font-semibold text-xs rounded-full px-7 flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4 text-dourado" />
              {saving ? 'Salvando Configuração...' : 'Salvar Configuração de Domínio'}
            </Button>
          </div>
        </div>
      </form>

      {/* PAINEL DE INSTRUÇÕES DNS CLARAS COM BOTÕES DE CÓPIA */}
      <div className="bg-white rounded-2xl border border-vinho/10 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-vinho/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vinho/5 text-vinho flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 text-dourado-dark" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-vinho">
                Instruções de Apontamento DNS
              </h2>
              <p className="text-xs text-vinho/70">
                Acesse o provedor onde seu domínio foi registrado e crie as entradas DNS abaixo.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-vinho/70 bg-marfim/70 border border-vinho/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-dourado-dark" />
            <span>Valores validados pelo suporte Skip</span>
          </div>
        </div>

        {/* TABELA / CARDS DE REGISTROS DNS */}
        <div className="space-y-3">
          {dnsRecords.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-vinho/10 bg-marfim/30 p-4 hover:border-vinho/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-vinho text-marfim font-mono text-[10px] px-2 py-0.5 font-bold">
                    Tipo: {item.tipo}
                  </Badge>
                  <span className="text-xs font-bold text-vinho">
                    Nome:{' '}
                    <code className="font-mono text-vinho bg-white px-1.5 py-0.5 rounded border border-vinho/15">
                      {item.nome}
                    </code>
                  </span>
                  <span className="text-[11px] text-vinho/60">TTL: {item.ttl}</span>
                </div>
                <p className="text-xs text-vinho/75">{item.finalidade}</p>
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-vinho/60 tracking-wider">
                    Valor de destino:
                  </span>
                  <p className="font-mono text-xs sm:text-sm font-bold text-vinho bg-white p-2 rounded-lg border border-vinho/15 break-all mt-0.5">
                    {item.valor}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex md:flex-col justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(item.copia, item.key)}
                  className="w-full md:w-auto text-xs min-h-[40px] border-vinho/20 hover:bg-vinho/5 text-vinho rounded-xl"
                >
                  {copiedKey === item.key ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5 text-dourado-dark" />
                      Copiar Valor
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* PASSO A PASSO ILUSTRADO */}
        <div className="pt-4 border-t border-vinho/10 space-y-4">
          <h3 className="font-serif text-sm font-bold text-vinho flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-dourado-dark" />
            Passo a passo no provedor do seu domínio
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white border border-vinho/10 space-y-2">
              <div className="w-7 h-7 rounded-full bg-vinho text-dourado font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-vinho">Acesse seu Provedor</h4>
              <p className="text-[11px] text-vinho/70 leading-relaxed">
                Faça login no painel onde comprou o domínio (ex.: Registro.br, GoDaddy, HostGator ou
                Cloudflare) e abra a seção "Gerenciar DNS" ou "Zona DNS".
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-vinho/10 space-y-2">
              <div className="w-7 h-7 rounded-full bg-vinho text-dourado font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-vinho">Crie as Entradas DNS</h4>
              <p className="text-[11px] text-vinho/70 leading-relaxed">
                Adicione a entrada tipo <code className="font-bold">A</code> com o IP{' '}
                <code className="font-bold text-vinho">{IP_PADRAO_SKIP}</code> e a entrada{' '}
                <code className="font-bold">CNAME</code> (www) apontando para{' '}
                <code className="font-bold text-vinho">{HOST_DESTINO_SKIP}</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-vinho/10 space-y-2">
              <div className="w-7 h-7 rounded-full bg-vinho text-dourado font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-vinho">Aguarde a Propagação</h4>
              <p className="text-[11px] text-vinho/70 leading-relaxed">
                O certificado SSL (HTTPS) é emitido de forma automática pelo Skip Cloud assim que o
                apontamento é detectado. A propagação global leva tipicamente de 1 a 24 horas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
