// src/services/backupExportacao.ts
// Serviço de Backup & Exportação do CoffeeCast 4.0.
// Exporta CSV (BOM UTF-8) e JSON das principais coleções, respeitando a mesma
// matriz de permissões de telas usada pela Nine Online e pelo menu do painel
// (hasScreenPermission — ver AuthContext).
// Nunca usa credenciais elevadas: a exportação acontece com a sessão do usuário
// logado, então as regras de API do PocketBase também limitam o que ele recebe.

import pb from '@/lib/pocketbase/client'

export interface ColecaoExportavel {
  colecao: string
  /** Chave de tela equivalente à matriz de permissões do painel */
  screenKey: string
  rotulo: string
  descricao: string
}

export const COLECOES_EXPORTAVEIS: ColecaoExportavel[] = [
  {
    colecao: 'contatos',
    screenKey: 'leads',
    rotulo: 'Leads (Painel Comercial)',
    descricao: 'Contatos comerciais, status, interesses e retornos agendados',
  },
  {
    colecao: 'contatos',
    screenKey: 'contatos',
    rotulo: 'Contatos do Site',
    descricao: 'Mensagens enviadas pelo formulário "Fale Conosco"',
  },
  {
    colecao: 'episodios',
    screenKey: 'episodios',
    rotulo: 'Episódios',
    descricao: 'Títulos, descrições, links Spotify/YouTube e datas',
  },
  {
    colecao: 'agenda',
    screenKey: 'agenda',
    rotulo: 'Agenda de Gravações',
    descricao: 'Gravações agendadas, convidados e horários',
  },
  {
    colecao: 'roteiros_convidados',
    screenKey: 'roteiros',
    rotulo: 'Roteiros',
    descricao: 'Fichas de roteiro de convidados e conteúdos apresentados',
  },
  {
    colecao: 'nine_tarefas',
    screenKey: 'nine',
    rotulo: 'Tarefas da Nine',
    descricao: 'Retornos criados pela assistente virtual',
  },
  {
    colecao: 'patrocinadores',
    screenKey: 'patrocinadores',
    rotulo: 'Patrocinadores & Parceiros',
    descricao: 'Marcas parceiras e contrapartidas',
  },
  {
    colecao: 'notificacoes',
    screenKey: 'notificacoes',
    rotulo: 'Notificações',
    descricao: 'Histórico de alertas do painel',
  },
]

export interface ResultadoExportacao {
  colecao: string
  rotulo: string
  registros: number
  sucesso: boolean
  motivo?: string
}

const PAGE_SIZE = 500

/** Baixa TODOS os registros de uma coleção paginando (getFullList já pagina internamente). */
async function buscarTodos(collection: string): Promise<Record<string, any>[]> {
  return pb.collection(collection).getFullList({
    sort: '-created',
    $autoCancel: false,
  } as any)
}

function converterParaCsvLinhas(rows: Record<string, any>[]): string[][] {
  if (rows.length === 0) return []
  // Union de chaves, preservando campos vazios/opcionais no CSV também
  const chaves: string[] = []
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!chaves.includes(k) && k !== 'collectionId' && k !== 'collectionName') chaves.push(k)
    }
  }
  return [chaves, ...rows.map((r) => chaves.map((k) => valorCsv(r[k])))]
}

function valorCsv(v: any): string {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.join(' | ')
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function escaparCsv(v: string): string {
  if (/[",;\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

/** CSV com BOM UTF-8 e separador ";" para abrir correto no Excel brasileiro. */
export function gerarCsv(rows: Record<string, any>[]): string {
  const linhas = converterParaCsvLinhas(rows).map((l) => l.map(escaparCsv).join(';'))
  return '\uFEFF' + linhas.join('\r\n')
}

export function baixarArquivo(conteudo: string, nomeArquivo: string, mime: string) {
  const blob = new Blob([conteudo], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function carimboDataHora(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** Expõe apenas as coleções cuja tela o usuário pode ver (mesma matriz da Nine Online). */
export function colecoesPermitidas(
  podeVerTela: (screenKey: string) => boolean,
): ColecaoExportavel[] {
  return COLECOES_EXPORTAVEIS.filter((c) => podeVerTela(c.screenKey))
}

/** Exporta uma coleção: baixa o arquivo e devolve o total exportado. */
export async function exportarColecao(
  item: ColecaoExportavel,
  formato: 'csv' | 'json',
): Promise<ResultadoExportacao> {
  try {
    const rows = await buscarTodos(item.colecao)
    const slug = item.colecao.replace(/_/g, '-')
    const base = `coffeecast-${slug}-${carimboDataHora()}`
    if (formato === 'csv') {
      baixarArquivo(gerarCsv(rows), `${base}.csv`, 'text/csv;charset=utf-8;')
    } else {
      const backup = {
        colecao: item.colecao,
        exportado_em: new Date().toISOString(),
        total: rows.length,
        registros: rows,
      }
      baixarArquivo(
        JSON.stringify(backup, null, 2),
        `${base}.json`,
        'application/json;charset=utf-8;',
      )
    }
    return { colecao: item.colecao, rotulo: item.rotulo, registros: rows.length, sucesso: true }
  } catch (err: any) {
    return {
      colecao: item.colecao,
      rotulo: item.rotulo,
      registros: 0,
      sucesso: false,
      motivo:
        err?.status === 403 || err?.response?.status === 403
          ? 'Sem permissão de leitura nesta coleção'
          : err?.message || 'Erro inesperado',
    }
  }
}

/** Backup completo: todas as coleções permitidas em um único JSON. */
export async function gerarBackupCompleto(
  podeVerTela: (screenKey: string) => boolean,
  onProgresso?: (concluidas: number, total: number, rotulo: string) => void,
): Promise<ResultadoExportacao[]> {
  const itens = colecoesPermitidas(podeVerTela)
  const resultados: ResultadoExportacao[] = []
  const blocos: Record<string, any> = {}

  for (let i = 0; i < itens.length; i++) {
    const item = itens[i]
    onProgresso?.(i, itens.length, item.rotulo)
    try {
      const rows = await buscarTodos(item.colecao)
      blocos[item.colecao] = rows
      resultados.push({
        colecao: item.colecao,
        rotulo: item.rotulo,
        registros: rows.length,
        sucesso: true,
      })
    } catch (err: any) {
      resultados.push({
        colecao: item.colecao,
        rotulo: item.rotulo,
        registros: 0,
        sucesso: false,
        motivo:
          err?.status === 403 || err?.response?.status === 403
            ? 'Coleção restrita (sem permissão)'
            : err?.message || 'Erro inesperado',
      })
    }
  }

  onProgresso?.(itens.length, itens.length, 'Concluído')

  const backup = {
    aplicacao: 'CoffeeCast 4.0',
    tipo: 'backup-completo',
    gerado_em: new Date().toISOString(),
    total_colecoes: itens.length,
    colecoes: blocos,
  }
  baixarArquivo(
    JSON.stringify(backup, null, 2),
    `coffeecast-backup-${carimboDataHora()}.json`,
    'application/json;charset=utf-8;',
  )
  return resultados
}
