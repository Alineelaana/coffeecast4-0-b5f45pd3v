// src/lib/roteiroParser.ts
// Utilitário para converter texto cru de roteiro gerado pela Nine na estrutura tipada
// e vice-versa, permitindo edição granular de blocos, tempos e perguntas, sem markdown e com fidelidade editorial.

import type { RoteiroBloco, RoteiroBlocoPergunta, RoteiroEstruturado } from '@/types/database'

/**
 * Remove qualquer resíduo de caracteres de formatação Markdown e símbolos indesejados:
 * asteriscos duplos/simples (** / *), sublinhados (__ / _), cerquilhas (#, ##, ###),
 * divisores ("---", "___", "==="), citações (">"), tabelas markdown ("|"),
 * colchetes de metadados como "[Para Fulano]" e seções artificiais indesejadas.
 */
export function cleanMarkdownSyntax(text: string): string {
  if (!text) return ''
  return (
    text
      // Remover asteriscos e sublinhados
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remover cerquilhas de títulos
      .replace(/^#{1,6}\s+/gm, '')
      // Remover linhas divisórias de texto (---, ___, ===)
      .replace(/^[ \t]*[-_=]{3,}[ \t]*$/gm, '')
      // Remover citações markdown (>)
      .replace(/^[ \t]*>\s?/gm, '')
      // Remover linhas de tabelas markdown (| e |---|---|)
      .replace(/^[ \t]*\|.*\|[ \t]*$/gm, '')
      // Remover colchetes de metadados como [Para Grasiele] -> Grasiele:
      .replace(/\[(?:Para\s+)?([^\]]+)\]/gi, '$1')
      // Remover cabeçalhos e blocos artificiais inventados fora do padrão
      .replace(/^[ \t]*CABEÇALHO EDITORIAL.*$/gim, '')
      .replace(/^[ \t]*PONTOS FORTES & SINERGIA.*$/gim, '')
      .replace(/^[ \t]*ORIENTAÇÕES DE BASTIDORES.*$/gim, '')
      .replace(/^[ \t]*RESUMO DE APRESENTAÇÃO.*$/gim, '')
      // Normalizar espaçamento de quebras
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

/**
 * Analisa o texto gerado pela Nine (ou editado anteriormente) e produz uma estrutura de blocos
 */
export function parseRoteiroTextToStructure(
  rawText: string,
  meta?: {
    tituloFallback?: string
    subtituloFallback?: string
    convidadosRotulo?: string
    empresaCargo?: string
    dataGravacao?: string
    horarioGravacao?: string
    endereco?: string
    linkGps?: string
  },
): RoteiroEstruturado {
  const cleaned = cleanMarkdownSyntax(rawText)
  const lines = cleaned.split('\n').map((l) => l.trim())

  let tituloEpisodio = meta?.tituloFallback || 'Histórias que Inspiram'
  let subtituloEpisodio = meta?.subtituloFallback || 'O poder de transformar pessoas'
  let duracaoTotalMinutos = 60
  let duracaoRoteiroMinutos = 55
  let duracaoRespiroMinutos = 5

  const blocos: RoteiroBloco[] = []

  // Expressões regulares para detecção de seções
  // Ex: "01 | Duas trajetórias, um encontro - 8 MINUTOS" ou "Abertura | Apresentação do casal - 3 MINUTOS"
  const blocoHeaderRegex =
    /^(?:(\d{2})\s*\|\s*)?([^|—–\n]+?)(?:\s*[|—–]\s*(\d+)\s*(?:minutos?|min)?)?$/i

  let blocoAtual: Partial<RoteiroBloco> | null = null
  let textoIntroBuffer: string[] = []
  let paragrafosEncerramentoBuffer: string[] = []
  let itensBateBolaBuffer: string[] = []
  let perguntasBuffer: RoteiroBlocoPergunta[] = []

  const flushBloco = () => {
    if (!blocoAtual) return

    if (blocoAtual.tipo === 'abertura') {
      blocoAtual.textoIntro = textoIntroBuffer.join('\n\n').trim()
      textoIntroBuffer = []
    } else if (blocoAtual.tipo === 'bate_bola') {
      blocoAtual.textoIntro = textoIntroBuffer.join('\n\n').trim()
      blocoAtual.itensBateBola = [...itensBateBolaBuffer]
      textoIntroBuffer = []
      itensBateBolaBuffer = []
    } else if (blocoAtual.tipo === 'encerramento') {
      blocoAtual.textoIntro = textoIntroBuffer.join('\n\n').trim()
      blocoAtual.paragrafosEncerramento = [...paragrafosEncerramentoBuffer]
      textoIntroBuffer = []
      paragrafosEncerramentoBuffer = []
    } else {
      blocoAtual.textoIntro = textoIntroBuffer.join('\n\n').trim()
      blocoAtual.perguntas = [...perguntasBuffer]
      textoIntroBuffer = []
      perguntasBuffer = []
    }

    blocos.push({
      id: blocoAtual.id || `bloco-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      numero: blocoAtual.numero || String(blocos.length).padStart(2, '0'),
      titulo: blocoAtual.titulo || 'Bloco sem título',
      duracaoMinutos: Number(blocoAtual.duracaoMinutos) || 8,
      tipo: blocoAtual.tipo || 'perguntas',
      textoIntro: blocoAtual.textoIntro || '',
      perguntas: blocoAtual.perguntas || [],
      itensBateBola: blocoAtual.itensBateBola || [],
      perguntaEspecialFinal: blocoAtual.perguntaEspecialFinal || '',
      paragrafosEncerramento: blocoAtual.paragrafosEncerramento || [],
    })

    blocoAtual = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // Detecção de resumo de duração
    if (line.toLowerCase().startsWith('duração:') || line.toLowerCase().startsWith('duracao:')) {
      const matchTotal = line.match(/=\s*(\d+)\s*minutos?/i)
      if (matchTotal) {
        duracaoTotalMinutos = parseInt(matchTotal[1], 10)
      }
      const matchRoteiro = line.match(/(\d+)\s*minutos?\s*de\s*roteiro/i)
      if (matchRoteiro) {
        duracaoRoteiroMinutos = parseInt(matchRoteiro[1], 10)
      }
      continue
    }

    // Detecção de título e subtítulo no topo do texto
    if (blocos.length === 0 && !blocoAtual) {
      if (line.toLowerCase().startsWith('título:') || line.toLowerCase().startsWith('titulo:')) {
        tituloEpisodio = line.replace(/^t[ií]tulo:\s*/i, '').trim()
        continue
      }
      if (
        line.toLowerCase().startsWith('subtítulo:') ||
        line.toLowerCase().startsWith('subtitulo:')
      ) {
        subtituloEpisodio = line.replace(/^subt[ií]tulo:\s*/i, '').trim()
        continue
      }
    }

    // Detecção de Abertura
    if (/^abertura(?:\s*\|\s*|\s*—\s*|\s*-\s*|\s*:?\s*)(.*)$/i.test(line)) {
      flushBloco()
      const match = line.match(/^abertura(?:\s*[|—–]\s*)?(.*?)(?:[|—–]\s*(\d+)\s*minutos?)?$/i)
      const subTitle = (match && match[1]) || 'Apresentação dos convidados'
      let dur = 3
      if (match && match[2]) {
        dur = parseInt(match[2], 10)
      } else if (i + 1 < lines.length && /^\d+\s*minutos?$/i.test(lines[i + 1])) {
        dur = parseInt(lines[i + 1], 10)
        i++
      }

      blocoAtual = {
        id: 'bloco-abertura',
        numero: '00',
        titulo: `Abertura | ${subTitle.trim() || 'Apresentação'}`,
        duracaoMinutos: dur,
        tipo: 'abertura',
      }
      continue
    }

    // Detecção de Bloco numerado (ex: "01 | Duas trajetórias..." ou "01 - ...")
    const matchBlocoNum = line.match(/^(\d{2})\s*[|—–]\s*(.+?)(?:\s*[|—–]\s*(\d+)\s*minutos?)?$/i)
    if (matchBlocoNum) {
      flushBloco()
      const numStr = matchBlocoNum[1]
      let tit = matchBlocoNum[2].trim()
      let dur = 8
      if (matchBlocoNum[3]) {
        dur = parseInt(matchBlocoNum[3], 10)
      } else if (i + 1 < lines.length && /^\d+\s*minutos?$/i.test(lines[i + 1])) {
        dur = parseInt(lines[i + 1], 10)
        i++
      }

      // Identificar tipo
      const titLower = tit.toLowerCase()
      let tipo: RoteiroBloco['tipo'] = 'perguntas'
      if (titLower.includes('bate-bola') || titLower.includes('bate bola')) {
        tipo = 'bate_bola'
        dur = dur || 5
      } else if (
        titLower.includes('legado') ||
        titLower.includes('encerramento') ||
        titLower.includes('conclusão')
      ) {
        tipo = 'encerramento'
        dur = dur || 4
      }

      blocoAtual = {
        id: `bloco-${numStr}`,
        numero: numStr,
        titulo: tit,
        duracaoMinutos: dur,
        tipo: tipo,
      }
      continue
    }

    // Detecção de linha de minutos avulsa logo após título
    if (/^\d+\s*minutos?$/i.test(line) && blocoAtual && !blocoAtual.duracaoMinutos) {
      blocoAtual.duracaoMinutos = parseInt(line, 10)
      continue
    }

    // Se ainda não temos bloco aberto, abrir automaticamente Bloco de Abertura
    if (!blocoAtual) {
      blocoAtual = {
        id: 'bloco-abertura',
        numero: '00',
        titulo: 'Abertura | Apresentação',
        duracaoMinutos: 3,
        tipo: 'abertura',
      }
    }

    // Tratamento de conteúdo dentro do bloco ativo
    if (blocoAtual.tipo === 'abertura') {
      textoIntroBuffer.push(line)
    } else if (blocoAtual.tipo === 'bate_bola') {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        itensBateBolaBuffer.push(line.replace(/^[•\-*]\s*/, '').trim())
      } else if (
        line.toLowerCase().startsWith('pergunta especial') ||
        line.toLowerCase().startsWith('se você pudesse')
      ) {
        blocoAtual.perguntaEspecialFinal = line
      } else {
        textoIntroBuffer.push(line)
      }
    } else if (blocoAtual.tipo === 'encerramento') {
      if (
        line.toLowerCase().includes('quando vocês olham') ||
        line.toLowerCase().includes('legado') ||
        line.toLowerCase().startsWith('pergunta:')
      ) {
        blocoAtual.perguntaEspecialFinal = line
      } else {
        paragrafosEncerramentoBuffer.push(line)
      }
    } else {
      // Bloco de perguntas regular
      const matchPergunta = line.match(/^(\d{2})\.\s*(?:([^:]+):\s*)?(.*)$/)
      if (matchPergunta) {
        const numP = matchPergunta[1]
        const dest = matchPergunta[2]?.trim() || ''
        const textP = matchPergunta[3]?.trim() || ''
        perguntasBuffer.push({
          numero: numP,
          direcionadaPara: dest,
          texto: textP,
          opcional: false,
        })
      } else if (line.toLowerCase().startsWith('se houver espaço:')) {
        const textoOpcional = line.replace(/^se houver espa[cç]o:\s*/i, '').trim()
        perguntasBuffer.push({
          numero: String(perguntasBuffer.length + 1).padStart(2, '0'),
          direcionadaPara: '',
          texto: textoOpcional,
          opcional: true,
        })
      } else {
        // Se já temos perguntas, pode ser continuação da última pergunta ou comentário
        if (perguntasBuffer.length > 0) {
          const ultima = perguntasBuffer[perguntasBuffer.length - 1]
          ultima.texto = `${ultima.texto} ${line}`
        } else {
          textoIntroBuffer.push(line)
        }
      }
    }
  }

  flushBloco()

  // Se por alguma razão o parser não identificou blocos (ex: texto totalmente livre), criar um bloco único estruturado
  if (blocos.length === 0) {
    blocos.push({
      id: 'bloco-01',
      numero: '01',
      titulo: 'Roteiro de Gravação',
      duracaoMinutos: 60,
      tipo: 'perguntas',
      textoIntro: cleaned,
      perguntas: [],
    })
  }

  return {
    tituloEpisodio: tituloEpisodio || meta?.tituloFallback || 'Histórias que Inspiram',
    subtituloEpisodio: subtituloEpisodio || meta?.subtituloFallback || 'Episódio Especial',
    convidadosRotulo: meta?.convidadosRotulo || '',
    empresaCargoRotulo: meta?.empresaCargo || '',
    dataGravacaoFormatada: meta?.dataGravacao || '',
    horarioGravacao: meta?.horarioGravacao || '',
    duracaoTotalMinutos,
    duracaoRoteiroMinutos,
    duracaoRespiroMinutos,
    enderecoEstudio:
      meta?.endereco ||
      'Estúdio Filme — R. Ulisses Sarmento, 24, salas 407 e 408 — Praia do Suá, Vitória — ES, CEP 29052-320',
    linkGps:
      meta?.linkGps ||
      'https://www.google.com/maps/dir/?api=1&destination=R.+Ulisses+Sarmento,+24,+Praia+do+Su%C3%A1,+Vit%C3%B3ria,+ES',
    avisoEstacionamento: 'ESTACIONAMENTO PRÓPRIO DISPONÍVEL AOS CONVIDADOS',
    blocos,
  }
}

/**
 * Converte a estrutura tipada de volta em texto limpo e legível (sem markdown)
 */
export function formatStructureToRoteiroText(est: RoteiroEstruturado): string {
  const parts: string[] = []

  if (est.tituloEpisodio) {
    parts.push(`Título: ${est.tituloEpisodio}`)
  }
  if (est.subtituloEpisodio) {
    parts.push(`Subtítulo: ${est.subtituloEpisodio}`)
  }
  parts.push('')

  for (const bloco of est.blocos) {
    if (bloco.tipo === 'abertura') {
      parts.push(`${bloco.titulo}`)
      parts.push(`${bloco.duracaoMinutos} MINUTOS\n`)
      if (bloco.textoIntro) {
        parts.push(bloco.textoIntro)
      }
      parts.push('')
    } else if (bloco.tipo === 'bate_bola') {
      parts.push(`${bloco.numero} | ${bloco.titulo}`)
      parts.push(`${bloco.duracaoMinutos} MINUTOS\n`)
      if (bloco.textoIntro) {
        parts.push(bloco.textoIntro)
        parts.push('')
      }
      if (bloco.itensBateBola && bloco.itensBateBola.length > 0) {
        for (const item of bloco.itensBateBola) {
          parts.push(`• ${item}`)
        }
        parts.push('')
      }
      if (bloco.perguntaEspecialFinal) {
        parts.push(bloco.perguntaEspecialFinal)
        parts.push('')
      }
    } else if (bloco.tipo === 'encerramento') {
      parts.push(`${bloco.numero} | ${bloco.titulo}`)
      parts.push(`${bloco.duracaoMinutos} MINUTOS\n`)
      if (bloco.textoIntro) {
        parts.push(bloco.textoIntro)
        parts.push('')
      }
      if (bloco.perguntaEspecialFinal) {
        parts.push(bloco.perguntaEspecialFinal)
        parts.push('')
      }
      if (bloco.paragrafosEncerramento && bloco.paragrafosEncerramento.length > 0) {
        for (const p of bloco.paragrafosEncerramento) {
          parts.push(p)
          parts.push('')
        }
      }
    } else {
      // Perguntas normais
      parts.push(`${bloco.numero} | ${bloco.titulo}`)
      parts.push(`${bloco.duracaoMinutos} MINUTOS\n`)
      if (bloco.textoIntro) {
        parts.push(bloco.textoIntro)
        parts.push('')
      }
      if (bloco.perguntas && bloco.perguntas.length > 0) {
        for (const q of bloco.perguntas) {
          if (q.opcional) {
            parts.push(`Se houver espaço: ${q.texto}`)
          } else {
            const dest = q.direcionadaPara ? `${q.direcionadaPara}: ` : ''
            parts.push(`${q.numero}. ${dest}${q.texto}`)
          }
          parts.push('')
        }
      }
    }
  }

  const durRoteiro = est.duracaoRoteiroMinutos || 55
  const durRespiro = est.duracaoRespiroMinutos || 5
  const durTotal = est.duracaoTotalMinutos || durRoteiro + durRespiro

  parts.push(
    `Duração: ${durRoteiro} minutos de roteiro + ${durRespiro} minutos para a conversa fluir naturalmente = ${durTotal} minutos.`,
  )

  return cleanMarkdownSyntax(parts.join('\n')).trim()
}
