// src/lib/financeiroRecorrencia.ts
// Utilitários de recorrência e rateio igual para o Financeiro:
//  - gerarDatasRecorrencia: lista de datas (ISO yyyy-MM-dd) das ocorrências
//  - calcularRateioIgual: divide um total igualmente entre N integrantes,
//    ajustando a última parcela para fechar o total em centavos

export type TipoRecorrencia = 'nenhuma' | 'mensal' | 'personalizado'

export const ROTULO_RECORRENCIA = 'Recorrência'
export const ROTULO_RECORRENCIA_PERSONALIZADA = 'Recorrência personalizada'

export const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

/** Data ISO (yyyy-MM-dd) sem desfuso horário. */
export function paraChaveIso(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** 31 -> "31/03" (dia do mês original); 30 em fevereiro -> "28/02". */
export function diaDoMesAjustado(diaOriginal: number, ano: number, mesZeroBased: number): number {
  const ultimoDia = new Date(ano, mesZeroBased + 1, 0).getDate()
  return Math.min(diaOriginal, ultimoDia)
}

/**
 * Gera as datas das ocorrências mensais entre dataInicio e dataFim (ISO).
 * A data inicial conta como a primeira ocorrência; se dataFim for vazia,
 * gera 12 ocorrências (um ano).
 */
export function gerarDatasRecorrencia(dataInicio: string, dataFim?: string): string[] {
  if (!dataInicio) return []

  const [anoIni, mesIni, diaIni] = dataInicio.split('-').map(Number)
  if (!anoIni || !mesIni || !diaIni) return []

  const dataFinalLimite = dataFim ? new Date(`${dataFim}T12:00:00`) : null
  const datas: string[] = []
  const LIMITE_SEGURANCA = 120 // trava: nunca gerar mais que 10 anos

  for (let i = 0; i < LIMITE_SEGURANCA; i++) {
    const mesZero = mesIni - 1 + i
    const ano = anoIni + Math.floor(mesZero / 12)
    const mes = mesZero % 12
    const dia = diaDoMesAjustado(diaIni, ano, mes)
    const data = new Date(ano, mes, dia, 12, 0, 0)

    if (dataFinalLimite && data > dataFinalLimite) break

    datas.push(paraChaveIso(data))
    if (!dataFinalLimite && datas.length >= 12) break
  }

  return datas
}

export interface ParcelaRateio {
  integranteId: string
  valor: number
}

/** Divide o total igualmente entre N nomes, ajustando a última parcela. */
export function dividirValorIgualmente(total: number, nomes: string[]): Record<string, number> {
  const parcelas = calcularRateioIgual(total, nomes)
  const resultado: Record<string, number> = {}
  for (const p of parcelas) resultado[p.integranteId] = p.valor
  return resultado
}

/** Arredonda para centavos evitando erros de ponto flutuante. */
export function arredondarCentavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/**
 * Divide o total igualmente entre as integrantes selecionadas.
 * As primeiras recebem o valor cheio; a última recebe o ajuste para a soma
 * fechar exatamente o total (ex.: 100 entre 3 → 33.34 + 33.33 + 33.33).
 * A ordem do array de entrada define quem recebe o ajuste.
 */
export function calcularRateioIgual(total: number, integranteIds: string[]): ParcelaRateio[] {
  const ids = integranteIds.filter(Boolean)
  if (ids.length === 0 || !(total > 0)) return []

  const centavosTotal = Math.round(total * 100)
  const centavosBase = Math.floor(centavosTotal / ids.length)
  const resto = centavosTotal - centavosBase * ids.length

  return ids.map((integranteId, i) => {
    const centavos = i < resto ? centavosBase + 1 : centavosBase
    return { integranteId, valor: arredondarCentavos(centavos / 100) }
  })
}

/** "Aluguel" + "2025-01-05" -> "Aluguel — jan/2025" */
export function descricaoComMes(descricao: string, dataIso: string): string {
  const [, mes, dia] = dataIso.split('-')
  const indiceMes = Number(mes) - 1
  const mesCurto = MESES_CURTOS[indiceMes] ?? mes
  const prefixo = dia === '01' ? '' : `${Number(dia)}/`
  return `${descricao} — ${prefixo}${mesCurto}/${dataIso.slice(0, 4)}`
}

/** "2025-01-01" -> "01/01" (para o badge de recorrência). */
export function dataCurtaBR(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-')
  if (!ano || !mes || !dia) return dataIso
  return `${dia}/${mes}/${ano.slice(2)}`
}
