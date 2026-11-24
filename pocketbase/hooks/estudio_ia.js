// pocketbase/hooks/estudio_ia.js
// Estúdio Criativo IA + Divulgação Inteligente — CoffeeCast 4.0
// Agente único "CoffeeCast Creative AI" via OpenAI (segredo GCHAT_GPT, gpt-4.1).
// Reutiliza a MESMA chave da integração existente (roteiro + capa de episódio), sem criar
// integração paralela. Não toca na rota única /backend/v1/episodios/capa-ia (episodio_capa_ia.js).
//
// Rotas:
//   POST /backend/v1/estudio/divulgacao   — análise estratégica do roteiro (JSON estruturado)
//   POST /backend/v1/estudio/templates    — propostas de novos templates (Laboratório)
// Padrão de resposta: { sucesso, chatgptAtivo, ... } com fallback silencioso sem erro técnico.
//
// IMPORTANTE (JSVM do PocketBase): callbacks rodam em um pool de VM separado — NENHUMA
// declaração top-level pode ser referenciada dentro deles. Toda a lógica vive inline no
// corpo de cada callback (helpers duplicados de propósito).
//
// CORREÇÃO (causa raiz do "status 200 mas content vazio"): no JSVM do PocketBase,
// resposta.body chega como ARRAY DE BYTES e o helper global toString(bytes) devolve a
// representação Go da lista ("123,10,32,..." — string não-vazia que quebra o JSON.parse).
// A decodificação abaixo NUNCA usa toString(): usa resposta.raw (string) ou o
// decodificador UTF-8 manual byte a byte que preserva acentos pt-BR.

// ---------- ROTA 1: Análise de divulgação do roteiro ----------
routerAdd('POST', '/backend/v1/estudio/divulgacao', (e) => {
  try {
    const authUser = e.auth
    if (!authUser) return e.unauthorizedError('Autenticação necessária')
    const userRole = authUser.getString('role')
    if (!['master', 'gerencial', 'adm', 'editor'].includes(userRole)) {
      return e.forbiddenError('Acesso restrito à equipe autorizada.')
    }

    // -- inline: obter chave da API --
    const apiKey = ($os.getenv('GCHAT_GPT') || '').trim()
    if (!apiKey) {
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: false,
        mensagem:
          'O ChatGPT (OpenAI) não está configurado neste ambiente. Configure a chave GCHAT_GPT para gerar a divulgação com IA.',
      })
    }

    const body = e.requestInfo().body || {}
    const modo = (body.modo || 'completo').trim() // completo | gancho | titulos | thumbnail

    // -- inline: contexto do roteiro --
    const convidados = Array.isArray(body.convidados) ? body.convidados : []
    const linhas = []
    convidados.forEach((c, i) => {
      linhas.push(
        'Convidado ' +
          (i + 1) +
          ': ' +
          (c.nome || '') +
          (c.empresa ? ' | Empresa/Projeto: ' + c.empresa : '') +
          (c.biografia ? ' | Biografia: ' + String(c.biografia).slice(0, 1200) : '') +
          (c.tema ? ' | Tema desejado: ' + c.tema : ''),
      )
    })
    const episodioTitulo = (body.titulo_episodio || '').trim()
    const subtitulo = (body.subtitulo || '').trim()
    const convidadosTexto = linhas.join('\n')
    const roteiroTexto = String(body.roteiro_texto || '').slice(0, 14000)
    const observacoes = String(body.observacoes || '').slice(0, 1000)

    let instrucao = ''
    if (modo === 'gancho') {
      // IMPORTANTE: o frontend (PrepararEpisodioIA) lê d.gancho.gancho_emocional etc. —
      // as chaves DEBEM vir aninhadas em "gancho" (o formato antigo devolvia tudo no
      // topo de "dados", que o frontend não lia: sucesso true com campos vazios).
      instrucao =
        'Encontre o MELHOR GANCHO do episódio para divulgação. Analise o conteúdo real e responda JSON: ' +
        '{"gancho":{"tema_principal":"...","diferencial":"...","gancho_emocional":"...","gancho_informativo":"...",' +
        '"gancho_curiosidade":"...","titulo_youtube":"...","texto_thumbnail":"... (máx 28 caracteres, caixa alta sem gritar)"}}'
    } else if (modo === 'titulos') {
      instrucao =
        'Gere 3 NOVOS títulos para YouTube (diferentes dos anteriores), um por estilo. Responda JSON apenas com {"titulos":[...]} no mesmo formato anterior.'
    } else if (modo === 'thumbnail') {
      instrucao =
        'Gere 3 NOVOS títulos curtos de thumbnail (máx 28 caracteres, caixa alta quando fizer sentido, alto impacto). Responda JSON apenas com {"thumbnails":[...]} no mesmo formato anterior.'
    } else {
      instrucao =
        'Analise o roteiro/ficha abaixo (conteúdo REAL, sem inventar fatos) e produza o kit de divulgação. Responda JSON com estas chaves: ' +
        '{"analise":{"tema_principal":"...","temas_secundarios":["..."],"diferenciais":["..."],' +
        '"pontos_interesse":["..."],"publico_alvo":"...","mensagens_chave":["..."],"palavras_chave":["..."]}, ' +
        '"titulos":[{"estilo":"emocional","titulo":"...","justificativa":"...","palavras_chave":["..."]},' +
        '{"estilo":"informativo","titulo":"...","justificativa":"...","palavras_chave":["..."]},' +
        '{"estilo":"curiosidade","titulo":"...","justificativa":"...","palavras_chave":["..."]}], ' +
        '"thumbnails":[{"titulo":"...","razao":"..."}] (3 itens, máx 28 caracteres), ' +
        '"descricao":"descrição completa do episódio para YouTube (abertura envolvente, apresentação dos convidados, temas, convite, chamada para inscrição, slogan oficial e hashtags no final)", ' +
        '"tags":"tag1, tag2, ...", "hashtags":"#tag1 #tag2 ...", ' +
        '"frases":[{"categoria":"inspiradora|emocional|profissional|reflexiva|curiosidade","frase":"..."}] (5 a 8 itens, NUNCA apresentadas como citação literal dos convidados), ' +
        '"redes":{"instagram":"...","whatsapp":"mensagem curta com link do episódio...","stories":"chamada breve","reels":"texto de divulgação","lancamento":"anúncio de disponibilidade","agradecimento":"mensagem profissional e carinhosa ao convidado"}, ' +
        '"gancho":{"tema_principal":"...","diferencial":"...","gancho_emocional":"...","gancho_informativo":"...","gancho_curiosidade":"...","titulo_youtube":"...","texto_thumbnail":"..."}}'
    }

    const prompt =
      instrucao +
      '\n\n--- DADOS DO EPISÓDIO (CoffeeCast 4.0) ---\n' +
      'Título atual do episódio: ' +
      (episodioTitulo || '(a definir)') +
      '\nSubtítulo: ' +
      (subtitulo || '(nenhum)') +
      '\nSlogan oficial: "Mais que conversas, histórias que transformam."\n' +
      'CONVIDADOS:\n' +
      (convidadosTexto || '(sem convidados — episódio de mesa redonda entre apresentadoras)') +
      '\n\nROTEIRO / FICHA:\n' +
      (roteiroTexto || '(sem roteiro anexado)') +
      (observacoes ? '\n\nOBSERVAÇÕES DA PRODUÇÃO: ' + observacoes : '')

    // -- inline: chamada OpenAI (gpt-4.1) --
    const res = $http.send({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      timeout: 60,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content:
              'Você é o CoffeeCast Creative AI, agente oficial do podcast brasileiro CoffeeCast 4.0. ' +
              'Identidade visual: vinho #4B1E3F, dourado, rosé e marfim; tipografia serifada elegante (Playfair Display); ' +
              'slogan oficial: "Mais que conversas, histórias que transformam." ' +
              'REGRA ABSOLUTA: NUNCA mencione temporada ("4ª Temporada", "Quarta Temporada" etc.) — apenas "CoffeeCast 4.0". ' +
              'Nunca invente fatos, citações literais ou declarações dos convidados; use apenas o conteúdo fornecido. ' +
              'Responda SEMPRE apenas com JSON válido, sem markdown, sem cercas de código.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.75,
        max_tokens: 3500,
      }),
    })

    // -- inline: decodificação correta do corpo (ver cabeçalho do arquivo) --
    const decodificarBytesUtf8 = function (arrBytes) {
      let saida = ''
      let i = 0
      while (i < arrBytes.length) {
        const b = arrBytes[i]
        let code = 0xfffd
        if (b < 0x80) {
          code = b
          i += 1
        } else if (b >= 0xc2 && b < 0xe0 && i + 1 < arrBytes.length) {
          code = ((b & 0x1f) << 6) | (arrBytes[i + 1] & 0x3f)
          i += 2
        } else if (b >= 0xe0 && b < 0xf0 && i + 2 < arrBytes.length) {
          code = ((b & 0x0f) << 12) | ((arrBytes[i + 1] & 0x3f) << 6) | (arrBytes[i + 2] & 0x3f)
          i += 3
        } else if (b >= 0xf0 && b < 0xf5 && i + 3 < arrBytes.length) {
          code =
            ((b & 0x07) << 18) |
            ((arrBytes[i + 1] & 0x3f) << 12) |
            ((arrBytes[i + 2] & 0x3f) << 6) |
            (arrBytes[i + 3] & 0x3f)
          i += 4
        } else {
          i += 1
        }
        if (code <= 0xffff) saida += String.fromCharCode(code)
        else {
          const c = code - 0x10000
          saida += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 0x3ff))
        }
      }
      return saida.replace(/^\uFEFF/, '')
    }
    const decodificarCorpoResposta = function (resposta) {
      if (!resposta) return ''
      if (typeof resposta.raw === 'string' && resposta.raw.length > 0) {
        return resposta.raw.replace(/^\uFEFF/, '')
      }
      const bytes = resposta.body
      if (bytes == null) return ''
      if (typeof bytes === 'string') {
        // Defesa extra: se o corpo chegou como string com a REPRESENTAÇÃO Go da lista de
        // bytes ("123,10,32,32,34,..."), decodifica byte a byte de volta ao UTF-8 real.
        const compacta = bytes.replace(/\s+/g, '')
        if (/^\d{1,3}(,\d{1,3})+$/.test(compacta)) {
          const partes = compacta.split(',')
          let reconstruida = ''
          let valida = true
          for (let r = 0; r < partes.length; r++) {
            const v = parseInt(partes[r], 10)
            if (isNaN(v) || v < 0 || v > 255) {
              valida = false
              break
            }
            reconstruida += String.fromCharCode(v)
          }
          if (valida) {
            return decodificarBytesUtf8(
              reconstruida.split('').map(function (c) {
                return c.charCodeAt(0)
              }),
            )
          }
        }
        return bytes.replace(/^\uFEFF/, '')
      }
      const pareceBytes =
        Array.isArray(bytes) &&
        bytes.length > 0 &&
        typeof bytes[0] === 'number' &&
        bytes[0] >= 0 &&
        bytes[0] <= 255
      if (Array.isArray(bytes) && !pareceBytes) return ''
      if (!Array.isArray(bytes)) return String(bytes)
      return decodificarBytesUtf8(bytes)
    }
    const logarFalhaCorpo = function (tag, status, corpoTexto, erroParse) {
      try {
        const compacto = String(corpoTexto || '')
          .replace(/\s+/g, ' ')
          .trim()
        const partes = [
          '[' +
            tag +
            '] OpenAI status ' +
            status +
            ' — corpo não pôde ser interpretado como JSON (' +
            (corpoTexto ? corpoTexto.length : 0) +
            ' caracteres)',
        ]
        if (erroParse) {
          partes.push(
            'causa do JSON.parse: ' +
              String(erroParse && erroParse.message ? erroParse.message : erroParse),
          )
        }
        partes.push('início do corpo: ' + (compacto.slice(0, 300) || '(vazio)'))
        partes.push('final do corpo: ' + (compacto.slice(-500) || '(vazio)'))
        console.log(partes.join(' — '))
      } catch (_) {}
    }

    const corpoTexto = decodificarCorpoResposta(res)
    let parsed = null
    let erroParseCorpo = null
    try {
      parsed = JSON.parse(corpoTexto)
    } catch (errParseCorpo) {
      erroParseCorpo = errParseCorpo
      parsed = null
    }
    const ok = res.statusCode >= 200 && res.statusCode < 300
    const content =
      parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message
        ? String(parsed.choices[0].message.content || '')
        : ''

    if (!ok || !content) {
      // Diagnóstico: registrar a causa EXATA (erro embutido, finish_reason, usage ou corpo não-JSON)
      let motivo = 'corpo não é JSON válido'
      if (parsed) {
        if (parsed.error) {
          motivo =
            'erro embutido no corpo: ' +
            String(parsed.error.message || parsed.error.code || JSON.stringify(parsed.error)).slice(
              0,
              300,
            )
        } else {
          const choice = parsed.choices && parsed.choices[0] ? parsed.choices[0] : null
          const finish =
            choice && choice.finish_reason ? choice.finish_reason : '(sem finish_reason)'
          const usageTxt = parsed.usage ? ' — usage: ' + JSON.stringify(parsed.usage) : ''
          motivo =
            choice && choice.message && typeof choice.message.content === 'string'
              ? 'content vazio (finish_reason: ' + finish + ')' + usageTxt
              : 'resposta sem choices/message/content (finish_reason: ' + finish + ')' + usageTxt
        }
      }
      if (!parsed) {
        logarFalhaCorpo('estudio_ia', res.statusCode, corpoTexto, erroParseCorpo)
      } else {
        console.log(
          '[estudio_ia] OpenAI status ' +
            res.statusCode +
            ' mas conteúdo vazio (' +
            motivo +
            ') — final do corpo: ' +
            String(corpoTexto || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(-500),
        )
      }
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: true,
        mensagem:
          'A IA não conseguiu concluir a análise agora (instabilidade ou limite atingido). Tente novamente em instantes.',
      })
    }

    // -- inline: extrair JSON da resposta (tolerante) --
    let txt = String(content).trim()
    txt = txt
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const ini = txt.indexOf('{')
    const fim = txt.lastIndexOf('}')
    let dados = null
    let causaFalhaParse = ''
    if (ini !== -1 && fim > ini) {
      try {
        dados = JSON.parse(txt.slice(ini, fim + 1))
      } catch (errJson) {
        dados = null
        causaFalhaParse = String(errJson && errJson.message ? errJson.message : errJson)
      }
    }
    if (!dados) {
      // Diagnóstico: registrar o conteúdo DECODIFICADO que a IA devolveu (primeiros ~600 chars)
      console.log(
        '[estudio_ia] Resposta da IA sem JSON extraível (causa do parse: ' +
          (causaFalhaParse || 'nenhum objeto encontrado') +
          ') — conteúdo decodificado (primeiros 600 chars): ' +
          String(content).replace(/\s+/g, ' ').trim().slice(0, 600),
      )
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: true,
        mensagem:
          'A IA respondeu em formato inesperado (sem JSON válido). Tente gerar novamente em instantes.',
      })
    }

    // -- normalização: aceitar chaves top-level OU aninhadas (defesa contra variações da IA) --
    const paraTexto = (v) => (typeof v === 'string' ? v.trim() : '')
    if (dados.gancho && typeof dados.gancho === 'object') {
      dados.gancho.tema_principal = paraTexto(dados.gancho.tema_principal)
      dados.gancho.diferencial = paraTexto(dados.gancho.diferencial)
      dados.gancho.gancho_emocional = paraTexto(dados.gancho.gancho_emocional)
      dados.gancho.gancho_informativo = paraTexto(dados.gancho.gancho_informativo)
      dados.gancho.gancho_curiosidade = paraTexto(dados.gancho.gancho_curiosidade)
    } else if (dados.gancho_emocional || dados.gancho_informativo || dados.gancho_curiosidade) {
      // IA devolveu as chaves no topo — reaninha para o formato que o frontend espera
      dados.gancho = {
        tema_principal: paraTexto(dados.tema_principal),
        diferencial: paraTexto(dados.diferencial),
        gancho_emocional: paraTexto(dados.gancho_emocional),
        gancho_informativo: paraTexto(dados.gancho_informativo),
        gancho_curiosidade: paraTexto(dados.gancho_curiosidade),
        titulo_youtube: paraTexto(dados.titulo_youtube),
        texto_thumbnail: paraTexto(dados.texto_thumbnail),
      }
      delete dados.gancho_emocional
      delete dados.gancho_informativo
      delete dados.gancho_curiosidade
    }
    if (dados.descricao !== undefined) dados.descricao = paraTexto(dados.descricao)
    if (!Array.isArray(dados.frases)) dados.frases = []

    // -- nunca devolver sucesso true com dados vazios: isso engana o frontend --
    const g0 = dados.gancho || {}
    const temUtil =
      (dados.descricao && dados.descricao.length > 0) ||
      (Array.isArray(dados.frases) && dados.frases.length > 0) ||
      g0.gancho_emocional ||
      g0.gancho_informativo ||
      g0.gancho_curiosidade ||
      (Array.isArray(dados.titulos) && dados.titulos.length > 0)
    if (!temUtil) {
      console.log(
        '[estudio_ia] JSON extraído mas SEM campos utilizáveis — chaves recebidas: ' +
          Object.keys(dados).join(', ') +
          ' — conteúdo decodificado (primeiros 600 chars): ' +
          String(content).replace(/\s+/g, ' ').trim().slice(0, 600),
      )
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: true,
        mensagem:
          'A IA respondeu, mas o conteúdo veio sem os campos esperados (gancho/descrição/frases). Tente gerar novamente em instantes.',
      })
    }

    return e.json(200, {
      sucesso: true,
      chatgptAtivo: true,
      agente: 'CoffeeCast Creative AI',
      dados,
    })
  } catch (err) {
    console.log('[estudio_ia] erro em /estudio/divulgacao: ' + err)
    return e.json(200, {
      sucesso: false,
      chatgptAtivo: true,
      mensagem: 'Não foi possível concluir a geração agora. Tente novamente em instantes.',
    })
  }
})

// ---------- ROTA 2: Propostas de novos templates (Laboratório) ----------
routerAdd('POST', '/backend/v1/estudio/templates', (e) => {
  try {
    const authUser = e.auth
    if (!authUser) return e.unauthorizedError('Autenticação necessária')
    const userRole = authUser.getString('role')
    if (!['master', 'gerencial', 'adm', 'editor'].includes(userRole)) {
      return e.forbiddenError('Acesso restrito à equipe autorizada.')
    }

    // -- inline: obter chave da API --
    const apiKey = ($os.getenv('GCHAT_GPT') || '').trim()
    if (!apiKey) {
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: false,
        mensagem:
          'O ChatGPT (OpenAI) não está configurado neste ambiente. Configure a chave GCHAT_GPT para gerar propostas de templates.',
      })
    }

    const body = e.requestInfo().body || {}
    const estilo = String(body.estilo || 'Premium Dourado').slice(0, 60)
    const paleta = String(body.paleta || 'vinho #4B1E3F, dourado, rosé, marfim').slice(0, 200)
    const descricao = String(body.descricao || '').slice(0, 1000)
    const elementos = String(body.elementos_obrigatorios || '').slice(0, 1000)

    const prompt =
      'Proponha 3 variações de template de capa para o podcast CoffeeCast 4.0 ' +
      '(formato YouTube 16:9, 1280x720). Estilo desejado: ' +
      estilo +
      '. Paleta: ' +
      paleta +
      '. Elementos obrigatórios que toda capa deve preservar: logomarca CoffeeCast 4.0 no cabeçalho, slogan "Mais que conversas, histórias que transformam." no rodapé, área para fotografia do convidado, área para título em destaque, área para logomarca do convidado, rodapé "CURTA | INSCREVA-SE | ATIVE O SININHO". NUNCA mencionar temporada. ' +
      (descricao ? 'Descrição criativa do usuário: ' + descricao + '. ' : '') +
      (elementos ? 'Elementos extras: ' + elementos + '. ' : '') +
      'Responda JSON: {"propostas":[{"nome":"...","estilo":"...","paleta":"...","descricao":"...", ' +
      '"estrutura":"descrição da estrutura visual em camadas (fundo, cabeçalho, área de foto, área de título, rodapé)", ' +
      '"camadas":[{"nome":"...","tipo":"fundo|logo|texto|foto|logo_convidado|rodape","bloqueado":true|false,' +
      '"x":0..1,"y":0..1,"w":0..1,"h":0..1,"cor":"#hex","fonte":"serif|sans","tamanho":0..1}]}]}. ' +
      'Coordenadas x,y,w,h normalizadas (0 a 1) sobre o canvas 16:9.'

    // -- inline: chamada OpenAI (gpt-4.1) --
    const res = $http.send({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      timeout: 60,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content:
              'Você é o CoffeeCast Creative AI, agente oficial do podcast brasileiro CoffeeCast 4.0. ' +
              'Identidade visual: vinho #4B1E3F, dourado, rosé e marfim; tipografia serifada elegante (Playfair Display); ' +
              'slogan oficial: "Mais que conversas, histórias que transformam." ' +
              'REGRA ABSOLUTA: NUNCA mencione temporada ("4ª Temporada", "Quarta Temporada" etc.) — apenas "CoffeeCast 4.0". ' +
              'Nunca invente fatos, citações literais ou declarações dos convidados; use apenas o conteúdo fornecido. ' +
              'Responda SEMPRE apenas com JSON válido, sem markdown, sem cercas de código.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.75,
        max_tokens: 2500,
      }),
    })

    // -- inline: decodificação correta do corpo (ver cabeçalho do arquivo) --
    const decodificarBytesUtf8 = function (arrBytes) {
      let saida = ''
      let i = 0
      while (i < arrBytes.length) {
        const b = arrBytes[i]
        let code = 0xfffd
        if (b < 0x80) {
          code = b
          i += 1
        } else if (b >= 0xc2 && b < 0xe0 && i + 1 < arrBytes.length) {
          code = ((b & 0x1f) << 6) | (arrBytes[i + 1] & 0x3f)
          i += 2
        } else if (b >= 0xe0 && b < 0xf0 && i + 2 < arrBytes.length) {
          code = ((b & 0x0f) << 12) | ((arrBytes[i + 1] & 0x3f) << 6) | (arrBytes[i + 2] & 0x3f)
          i += 3
        } else if (b >= 0xf0 && b < 0xf5 && i + 3 < arrBytes.length) {
          code =
            ((b & 0x07) << 18) |
            ((arrBytes[i + 1] & 0x3f) << 12) |
            ((arrBytes[i + 2] & 0x3f) << 6) |
            (arrBytes[i + 3] & 0x3f)
          i += 4
        } else {
          i += 1
        }
        if (code <= 0xffff) saida += String.fromCharCode(code)
        else {
          const c = code - 0x10000
          saida += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 0x3ff))
        }
      }
      return saida.replace(/^\uFEFF/, '')
    }
    const decodificarCorpoResposta = function (resposta) {
      if (!resposta) return ''
      if (typeof resposta.raw === 'string' && resposta.raw.length > 0) {
        return resposta.raw.replace(/^\uFEFF/, '')
      }
      const bytes = resposta.body
      if (bytes == null) return ''
      if (typeof bytes === 'string') {
        const compacta = bytes.replace(/\s+/g, '')
        if (/^\d{1,3}(,\d{1,3})+$/.test(compacta)) {
          const partes = compacta.split(',')
          let reconstruida = ''
          let valida = true
          for (let r = 0; r < partes.length; r++) {
            const v = parseInt(partes[r], 10)
            if (isNaN(v) || v < 0 || v > 255) {
              valida = false
              break
            }
            reconstruida += String.fromCharCode(v)
          }
          if (valida) {
            return decodificarBytesUtf8(
              reconstruida.split('').map(function (c) {
                return c.charCodeAt(0)
              }),
            )
          }
        }
        return bytes.replace(/^\uFEFF/, '')
      }
      const pareceBytes =
        Array.isArray(bytes) &&
        bytes.length > 0 &&
        typeof bytes[0] === 'number' &&
        bytes[0] >= 0 &&
        bytes[0] <= 255
      if (Array.isArray(bytes) && !pareceBytes) return ''
      if (!Array.isArray(bytes)) return String(bytes)
      return decodificarBytesUtf8(bytes)
    }
    const logarFalhaCorpo = function (tag, status, corpoTexto, erroParse) {
      try {
        const compacto = String(corpoTexto || '')
          .replace(/\s+/g, ' ')
          .trim()
        const partes = [
          '[' +
            tag +
            '] OpenAI status ' +
            status +
            ' — corpo não pôde ser interpretado como JSON (' +
            (corpoTexto ? corpoTexto.length : 0) +
            ' caracteres)',
        ]
        if (erroParse) {
          partes.push(
            'causa do JSON.parse: ' +
              String(erroParse && erroParse.message ? erroParse.message : erroParse),
          )
        }
        partes.push('início do corpo: ' + (compacto.slice(0, 300) || '(vazio)'))
        partes.push('final do corpo: ' + (compacto.slice(-500) || '(vazio)'))
        console.log(partes.join(' — '))
      } catch (_) {}
    }

    const corpoTexto = decodificarCorpoResposta(res)
    let parsed = null
    let erroParseCorpo = null
    try {
      parsed = JSON.parse(corpoTexto)
    } catch (errParseCorpo) {
      erroParseCorpo = errParseCorpo
      parsed = null
    }
    const ok = res.statusCode >= 200 && res.statusCode < 300
    const content =
      parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message
        ? String(parsed.choices[0].message.content || '')
        : ''

    if (!ok || !content) {
      let motivo = 'corpo não é JSON válido'
      if (parsed) {
        if (parsed.error) {
          motivo =
            'erro embutido no corpo: ' +
            String(parsed.error.message || parsed.error.code || JSON.stringify(parsed.error)).slice(
              0,
              300,
            )
        } else {
          const choice = parsed.choices && parsed.choices[0] ? parsed.choices[0] : null
          const finish =
            choice && choice.finish_reason ? choice.finish_reason : '(sem finish_reason)'
          const usageTxt = parsed.usage ? ' — usage: ' + JSON.stringify(parsed.usage) : ''
          motivo =
            choice && choice.message && typeof choice.message.content === 'string'
              ? 'content vazio (finish_reason: ' + finish + ')' + usageTxt
              : 'resposta sem choices/message/content (finish_reason: ' + finish + ')' + usageTxt
        }
      }
      if (!parsed) {
        logarFalhaCorpo('estudio_ia', res.statusCode, corpoTexto, erroParseCorpo)
      } else {
        console.log(
          '[estudio_ia] OpenAI status ' +
            res.statusCode +
            ' mas conteúdo vazio (' +
            motivo +
            ') — final do corpo: ' +
            String(corpoTexto || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(-500),
        )
      }
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: true,
        mensagem: 'A IA não conseguiu propor templates agora. Tente novamente em instantes.',
      })
    }

    // -- inline: extrair JSON da resposta --
    let txt = String(content).trim()
    txt = txt
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const ini = txt.indexOf('{')
    const fim = txt.lastIndexOf('}')
    let dados = null
    let causaFalhaParseTpl = ''
    if (ini !== -1 && fim > ini) {
      try {
        dados = JSON.parse(txt.slice(ini, fim + 1))
      } catch (errJsonTpl) {
        dados = null
        causaFalhaParseTpl = String(
          errJsonTpl && errJsonTpl.message ? errJsonTpl.message : errJsonTpl,
        )
      }
    }
    if (!dados || !Array.isArray(dados.propostas)) {
      console.log(
        '[estudio_ia] Resposta da IA sem JSON extraível (templates — causa do parse: ' +
          (causaFalhaParseTpl || 'nenhum objeto com "propostas"') +
          ') — conteúdo decodificado (primeiros 600 chars): ' +
          String(content).replace(/\s+/g, ' ').trim().slice(0, 600),
      )
      return e.json(200, {
        sucesso: false,
        chatgptAtivo: true,
        mensagem: 'A IA respondeu em formato inesperado. Tente gerar novamente.',
      })
    }

    return e.json(200, {
      sucesso: true,
      chatgptAtivo: true,
      agente: 'CoffeeCast Creative AI',
      dados,
    })
  } catch (err) {
    console.log('[estudio_ia] erro em /estudio/templates: ' + err)
    return e.json(200, {
      sucesso: false,
      chatgptAtivo: true,
      mensagem: 'Não foi possível gerar as propostas agora. Tente novamente em instantes.',
    })
  }
})
