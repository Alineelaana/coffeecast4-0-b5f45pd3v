// Bloco "Pendências de hoje" do Dashboard (CoffeeCast 4.0).
// Contadores REAIS via PocketBase — zero dados fictícios:
//  - Leads "aguardando contato"   → coleção `contatos`, status_comercial = "aguardando_contato"
//  - Tarefas da Nine pendentes/atrasadas → coleção `nine_tarefas` (status = "pendente",
//    incluindo as atrasadas: prazo < hoje)
//  - Episódios em edição/produção → coleção `episodios`, status = "programado"
//    (aguardando publicação) OU status vazio/sem status (recém-criado, em produção)
//
// Cada linha é clicável e navega para a tela correspondente, MAS só aparece
// se o usuário logado tem permissão da tela — MESMA lógica do hasScreenPermission
// (AuthContext): Master = todas; ADM = allowedScreens; Gerencial = lista fixa.
// Se uma consulta falhar, a linha mostra "—" sem quebrar o bloco (Promise por
// linha com catch individual).

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { ClipboardList, Users, CalendarClock, Tv, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ContadorValor = number | null // null = consulta falhou → exibe "—"

interface PendenciaLinha {
  chave: string
  rotulo: string
  legenda: string
  rota: string
  icone: React.ReactNode
  cor: string // classes de fundo/ícone na identidade vinho/dourado
  contar: () => Promise<number>
}

const hojeYmd = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function PendenciasHoje(): React.ReactElement {
  const { user, hasScreenPermission } = useAuth()

  const [valores, setValores] = useState<Record<string, ContadorValor>>({
    leads: null,
    tarefas: null,
    episodios: null,
  })

  const linhas = React.useMemo<PendenciaLinha[]>(() => {
    if (!user) return []
    const defs: PendenciaLinha[] = []

    // Leads — tela "leads" (mesma screenKey do Painel Comercial de Leads)
    if (hasScreenPermission('leads')) {
      defs.push({
        chave: 'leads',
        rotulo: 'Leads aguardando contato',
        legenda: 'Painel de Leads',
        rota: '/admin/leads',
        icone: <Users className="h-4 w-4" />,
        cor: 'bg-dourado/15 text-dourado-dark',
        contar: async () => {
          const res = await pb.collection('contatos').getList(1, 1, {
            filter: 'status_comercial = "aguardando_contato"',
            fields: 'id',
          })
          return res.totalItems
        },
      })
    }

    // Tarefas da Nine — tela "nine" (mesma screenKey da tela Nine)
    if (hasScreenPermission('nine')) {
      defs.push({
        chave: 'tarefas',
        rotulo: 'Tarefas da Nine pendentes/atrasadas',
        legenda: 'Tarefas de retorno',
        rota: '/admin/nine',
        icone: <CalendarClock className="h-4 w-4" />,
        cor: 'bg-vinho/10 text-vinho',
        contar: async () => {
          const res = await pb.collection('nine_tarefas').getList(1, 1, {
            filter: 'status = "pendente"',
            fields: 'id,prazo',
          })
          // Pendentes totais (inclui as atrasadas — prazo < hoje).
          return res.totalItems
        },
      })
    }

    // Episódios — tela "episodios"
    if (hasScreenPermission('episodios')) {
      defs.push({
        chave: 'episodios',
        rotulo: 'Episódios em produção/edição',
        legenda: 'Episódios',
        rota: '/admin/episodios',
        icone: <Tv className="h-4 w-4" />,
        cor: 'bg-rose-soft text-rose-brand',
        contar: async () => {
          // Na prática do painel, "em produção/edição" = episódio gravado mas ainda
          // não publicado: status vazio (recém-criado) ou "programado" (aguardando
          // a data/hora de publicação chegar). "publicado" não é pendência.
          const res = await pb.collection('episodios').getList(1, 1, {
            filter: '(status = "programado" || status = "" )',
            fields: 'id',
          })
          return res.totalItems
        },
      })
    }

    return defs
  }, [user, hasScreenPermission])

  useEffect(() => {
    let cancelled = false
    // Consultas independentes — falha em uma não afeta as outras.
    linhas.forEach((linha) => {
      linha
        .contar()
        .then((n) => {
          if (!cancelled) setValores((prev) => ({ ...prev, [linha.chave]: n }))
        })
        .catch((err) => {
          console.warn('Pendências de hoje — falha ao contar "' + linha.chave + '":', err)
          if (!cancelled) setValores((prev) => ({ ...prev, [linha.chave]: null }))
        })
    })
    return () => {
      cancelled = true
    }
  }, [linhas])

  if (!user || linhas.length === 0) return null

  return (
    <div className="rounded-2xl border border-dourado/30 bg-[#FBF7EF] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <ClipboardList className="h-5 w-5 text-[#4B1E3F]" />
        <h2 className="font-[Playfair_Display] text-lg sm:text-xl font-semibold text-[#4B1E3F]">
          Pendências de hoje
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {linhas.map((linha) => {
          const valor = valores[linha.chave]
          return (
            <Link
              key={linha.chave}
              to={linha.rota}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-dourado/20 bg-white/80 px-4 py-3',
                'transition-colors hover:bg-dourado/10 hover:border-dourado/40 focus:outline-none focus:ring-2 focus:ring-dourado/40',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  linha.cor,
                )}
              >
                {linha.icone}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[#4B1E3F] truncate">
                  {linha.rotulo}
                </span>
                <span className="block text-xs text-[#8A6D3B]/70 truncate">{linha.legenda}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-[Playfair_Display] text-2xl font-semibold text-[#4B1E3F] tabular-nums">
                  {valor === null ? '—' : valor}
                </span>
                <ChevronRight className="h-4 w-4 text-[#4B1E3F]/40 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
