routerAdd('POST', '/backend/v1/nine/chat', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const rawMessage = (body.message || '').trim()

    if (!rawMessage) {
      return e.badRequestError('A mensagem é obrigatória.')
    }

    if (rawMessage.length > 1500) {
      return e.badRequestError(
        'A mensagem enviada ultrapassa o limite permitido de 1500 caracteres.',
      )
    }

    // Identificar ou criar conversation_id
    let conversationId = (body.conversation_id || '').trim()
    if (!conversationId) {
      conversationId = 'conv_' + $security.randomString(20)
    }

    // Carregar configuração global da Nine (atendimento_automatico, prompt_sistema)
    let globalConfig = null
    try {
      globalConfig = $app.findFirstRecordByData('nine_config', 'chave', 'global')
    } catch (_) {}

    const isGlobalAuto = globalConfig ? globalConfig.getBool('atendimento_automatico') : true
    const customPrompt = globalConfig ? globalConfig.getString('prompt_sistema') || '' : ''
    const customPromptLivre = globalConfig ? globalConfig.getString('prompt_livre') || '' : ''
    const legacyKnowledge = globalConfig ? globalConfig.getString('base_conhecimento') || '' : ''

    // Buscar ou criar o registro da conversa na coleção nine_conversas
    let conversaRecord = null
    try {
      conversaRecord = $app.findFirstRecordByData(
        'nine_conversas',
        'conversation_id',
        conversationId,
      )
    } catch (_) {}

    const conversasCol = $app.findCollectionByNameOrId('nine_conversas')
    const mensagensCol = $app.findCollectionByNameOrId('nine_mensagens')

    if (!conversaRecord) {
      conversaRecord = new Record(conversasCol)
      conversaRecord.set('conversation_id', conversationId)
      conversaRecord.set('visitante_nome', (body.visitante_nome || '').trim() || 'Visitante')
      // Se global está desligado, já inicia como aguardando_humano
      conversaRecord.set('modo_atendimento', isGlobalAuto ? 'automatico' : 'aguardando_humano')
      conversaRecord.set('ultima_mensagem', rawMessage)
      conversaRecord.set('ultimo_remetente', 'visitante')
      conversaRecord.set('data_ultima_mensagem', new Date().toISOString())
      conversaRecord.set('total_mensagens', 1)
      $app.save(conversaRecord)
    } else {
      // Atualizar dados da conversa
      const currentTotal = conversaRecord.getInt('total_mensagens') || 0
      conversaRecord.set('ultima_mensagem', rawMessage)
      conversaRecord.set('ultimo_remetente', 'visitante')
      conversaRecord.set('data_ultima_mensagem', new Date().toISOString())
      conversaRecord.set('total_mensagens', currentTotal + 1)
      if (!isGlobalAuto && conversaRecord.getString('modo_atendimento') === 'automatico') {
        conversaRecord.set('modo_atendimento', 'aguardando_humano')
      }
      $app.save(conversaRecord)
    }

    // Salvar a mensagem do visitante em nine_mensagens
    try {
      const msgRec = new Record(mensagensCol)
      msgRec.set('conversation_id', conversationId)
      msgRec.set('remetente', 'visitante')
      msgRec.set('remetente_nome', conversaRecord.getString('visitante_nome') || 'Visitante')
      msgRec.set('conteudo', rawMessage)
      $app.save(msgRec)
    } catch (saveMsgErr) {
      console.log('Aviso ao salvar mensagem do visitante:', saveMsgErr)
    }

    const currentMode = conversaRecord.getString('modo_atendimento')

    // SE MODO FOR HUMANO OU ATENDIMENTO AUTOMÁTICO GLOBAL DESLIGADO:
    if (
      !isGlobalAuto ||
      currentMode === 'humano_respondendo' ||
      currentMode === 'aguardando_humano'
    ) {
      const humanNotice =
        'Sua mensagem foi recebida com sucesso! Um integrante da nossa equipe assumiu este atendimento e responderá em instantes por aqui. ☕'

      return e.json(200, {
        content: humanNotice,
        conversation_id: conversationId,
        message_id: '',
        citations: [],
        modo_atendimento: currentMode,
        em_atendimento_humano: true,
      })
    }

    // ATENDIMENTO AUTOMÁTICO ATIVO:
    // Resolver usuário de serviço para o agente nativo
    let userId = ''
    if (e.auth && e.auth.id) {
      userId = e.auth.id
    } else {
      try {
        const visitante = $app.findAuthRecordByEmail('users', 'visitante@app.local')
        if (visitante) {
          userId = visitante.id
        }
      } catch (visitanteLookupErr) {
        console.log('Aviso: lookup de visitante@app.local falhou:', visitanteLookupErr)
      }
    }

    if (!userId) {
      return e.json(503, {
        error: 'Serviço de atendimento temporariamente indisponível.',
      })
    }

    // =========================================================================
    // CONTEXTO DINÂMICO CONSULTADO EM TEMPO REAL NO BANCO DE DADOS
    // A Nine consulta episódios, integrantes, agenda, base de conhecimento e conteúdo
    // =========================================================================
    let dynamicContextParts = []

    // 1. Entradas Ativas da Base de Conhecimento (nine_conhecimento)
    try {
      const knowledgeRecords = $app.findRecordsByFilter(
        'nine_conhecimento',
        'ativo = true',
        'ordem,created',
        50,
        0,
      )
      if (knowledgeRecords && knowledgeRecords.length > 0) {
        let kbText = '### BASE DE CONHECIMENTO OFICIAL (PERGUNTAS, RESPOSTAS E ORIENTAÇÕES):\n'
        for (let i = 0; i < knowledgeRecords.length; i++) {
          const rec = knowledgeRecords[i]
          const tipo = rec.getString('tipo')
          const titulo = rec.getString('titulo')
          const conteudo = rec.getString('conteudo')
          const categoria = rec.getString('categoria')
          kbText += `• [${tipo.toUpperCase()}${categoria ? ' - ' + categoria : ''}] ${titulo}\n  ${conteudo}\n`
        }
        dynamicContextParts.push(kbText)
      }
    } catch (kbErr) {
      console.log('Aviso ao carregar nine_conhecimento:', kbErr)
    }

    // Se ainda houver algo legado em nine_config e não duplicado
    if (legacyKnowledge && dynamicContextParts.length === 0) {
      dynamicContextParts.push('### BASE DE CONHECIMENTO COMPLEMENTAR:\n' + legacyKnowledge)
    }

    // 2. Episódios Lançados (episodios - mais recentes primeiro)
    try {
      const epRecords = $app.findRecordsByFilter('episodios', '', '-numero', 12, 0)
      if (epRecords && epRecords.length > 0) {
        let epText = '### ÚLTIMOS EPISÓDIOS LANÇADOS NO YOUTUBE (TODOS AOS SÁBADOS ÀS 10H):\n'
        for (let i = 0; i < epRecords.length; i++) {
          const ep = epRecords[i]
          const num = ep.getInt('numero')
          const tit = ep.getString('titulo')
          const url = ep.getString('youtube_url')
          epText += `• EP #${num}: "${tit}" | Link: ${url}\n`
        }
        dynamicContextParts.push(epText)
      }
    } catch (epErr) {
      console.log('Aviso ao carregar episodios para Nine:', epErr)
    }

    // 3. Integrantes do Podcast (integrantes)
    try {
      const intRecords = $app.findRecordsByFilter('integrantes', '', 'ordem', 10, 0)
      if (intRecords && intRecords.length > 0) {
        let intText = '### EQUIPE E INTEGRANTES OFICIAIS DO COFFEECAST 4.0:\n'
        for (let i = 0; i < intRecords.length; i++) {
          const it = intRecords[i]
          const nome = it.getString('nome')
          const insta = it.getString('instagram')
          const bio = it.getString('biografia')
          const epLink = it.getString('link_episodio')
          intText += `• ${nome} (${insta || 'Instagram oficial'}): ${bio ? bio.slice(0, 220) : ''}${epLink ? ' | Episódio de apresentação: ' + epLink : ''}\n`
        }
        dynamicContextParts.push(intText)
      }
    } catch (intErr) {
      console.log('Aviso ao carregar integrantes para Nine:', intErr)
    }

    // 4. Agenda e Próximas Gravações / Postagens (agenda)
    try {
      const agendaRecords = $app.findRecordsByFilter(
        'agenda',
        '',
        '-data_postagem,-data_gravacao',
        6,
        0,
      )
      if (agendaRecords && agendaRecords.length > 0) {
        let agText = '### AGENDA DE GRAVAÇÕES E PRÓXIMAS POSTAGENS:\n'
        for (let i = 0; i < agendaRecords.length; i++) {
          const ag = agendaRecords[i]
          const titulo = ag.getString('titulo')
          const convidado = ag.getString('nome_convidado')
          const postagem = ag.getString('data_postagem')
          const empresa = ag.getString('empresa')
          agText += `• ${titulo}${convidado ? ' | Convidado(a): ' + convidado : ''}${empresa ? ' (' + empresa + ')' : ''}${postagem ? ' | Previsão de postagem: ' + postagem.slice(0, 10) : ''}\n`
        }
        dynamicContextParts.push(agText)
      }
    } catch (agErr) {
      console.log('Aviso ao carregar agenda para Nine:', agErr)
    }

    // 5. Páginas e Canais Relevantes do Site
    let pagesText =
      '### PÁGINAS E ROTAS DO SITE COFFEECAST 4.0:\n' +
      '• Página Inicial (/): Episódios, integrantes, fotos, depoimentos e formulário de inscrição de convidados.\n' +
      '• Guia do Convidado (/convidado): Orientações completas de preparação, cronograma do estúdio, dicas de vestimenta (dress code) e café especial.\n' +
      '• Formulário do Roteiro (/roteiro): Formulário detalhado que o(a) convidado(a) confirmado(a) preenche antes da gravação (biografia, empresa, temas para enfatizar, fotos e autorização de imagem).\n' +
      '• Deixar Depoimento (/depoimento): Espaço para ouvintes e convidados registrarem seu relato sobre a transformação que o CoffeeCast causou.\n' +
      '• Novos episódios: Todo sábado às 10h no canal oficial do YouTube (@coffeecast4.0).\n' +
      '• Redes Sociais: Instagram oficial @coffeecast4.0.\n' +
      '• Contato Comercial & Produção: Aline Lana pelo WhatsApp (31) 99129-7619.'
    dynamicContextParts.push(pagesText)

    // 6. Prompt Livre Adicional da Base de Conhecimento (se configurado)
    if (customPromptLivre && customPromptLivre.trim().length > 0) {
      dynamicContextParts.push(
        '### INSTRUÇÕES E ORIENTAÇÕES ADICIONAIS DA BASE DE CONHECIMENTO (PROMPT LIVRE):\n' +
          customPromptLivre.trim(),
      )
    }

    // Juntar todo o bloco de dados do banco
    const dynamicContextBlock = dynamicContextParts.join('\n\n')

    // Diretrizes essenciais de TOM NATURAL e CONVERSA HUMANA (sempre aplicadas a toda resposta)
    const naturalHumanGuidelines =
      'DIRETRIZES DE TOM, ESTILO E NATURALIDADE HUMANA (OBRIGATÓRIO):\n' +
      '1. CONVERSA NATURAL ENTRE DUAS PESSOAS: Responda SEMPRE em português do Brasil com naturalidade e espontaneidade, como duas pessoas conversando à mesa tomando café. Não soe robótica, burocrática, mecânica nem como um manual técnico de instruções.\n' +
      '2. PRIMEIRA PESSOA E CALOR HUMANO: Fale em primeira pessoa ("eu", "aqui no CoffeeCast", "a gente"), com frases fluidas, calorosas e acolhedoras. Varie seu vocabulário e construções frasais; evite repetir bordões ou fórmulas prontas em todas as mensagens.\n' +
      '3. RITMO DE CONVERSA (SEM DESPEJAR TUDO): Dê respostas diretas e amigáveis, do tamanho certo para um papo. Não jogue listas enormes de dados de uma vez se a pessoa fez uma pergunta simples. Entregue o essencial e mantenha o papo vivo.\n' +
      '4. PROATIVIDADE E PERGUNTAS DE VOLTA: Quando fizer sentido para o contexto, faça uma pergunta de volta para entender o que a pessoa precisa ou manter a conversa fluindo de forma gostosa.\n' +
      '5. NOME DA PESSOA E EMOJIS: Se souber o nome do visitante (ou ele se apresentar), use o nome com carinho. Use emojis com moderação e bom gosto, combinando com o clima de café e acolhimento (☕, ✨, 💛).\n\n' +
      'ÂNCORA ESTREITA DE CONHECIMENTO (REGRA INEGOCIÁVEL):\n' +
      '1. Baseie-se ESTRITAMENTE nos conhecimentos oficiais do treinamento (Prompt Master, Base de Conhecimento, Prompt Livre e dados dinâmicos do banco: episódios, integrantes, agenda, páginas e contatos).\n' +
      '2. NUNCA INVENTE informações, datas, nomes, valores, links ou confirmações que não estejam presentes nas fontes fornecidas.\n' +
      '3. Se a informação NÃO constar nessas fontes oficiais, diga com toda a naturalidade humana que não possui essa informação no momento e ofereça com carinho o contato direto da produção: Aline Lana pelo WhatsApp (31) 99129-7619 ou pelo formulário de contato do site.'

    // System prompt base focado na personalidade, comportamento e regras
    const systemPromptBase =
      (customPrompt ? customPrompt + '\n\n' + naturalHumanGuidelines : '') ||
      'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam").\n\n' +
        'Sua personalidade:\n' +
        '- Calorosa, acolhedora, feminina, elegante, prestativa e amigável (adora conversar com café ☕).\n' +
        '- Comunica-se SEMPRE em Português do Brasil.\n\n' +
        naturalHumanGuidelines

    // Montar a instrução unificada separando Personalidade e Contexto Dinâmico
    const fullPromptWithContext =
      systemPromptBase +
      '\n\n==================================================\n' +
      'FONTES OFICIAIS DE CONHECIMENTO E DADOS ATUALIZADOS DO BANCO:\n' +
      dynamicContextBlock +
      '\n==================================================\n' +
      'INSTRUÇÃO FINAL DE RESPOSTA:\n' +
      'Responda à mensagem da pessoa soando como uma conversa natural e acolhedora entre humanos, sem rigidez de robô, usando estritamente os fatos das fontes acima. Se faltar algum dado, diga com simpatia e recomende o WhatsApp da Aline (31) 99129-7619.'

    let responseContent = ''
    let returnedMessageId = ''
    let citations = []
    let modeUsed = 'none'

    // Mensagem aprimorada para o agente nativo com o contexto dinâmico e lembrete de conversa natural
    const visitorName = (conversaRecord.getString('visitante_nome') || '').trim()
    const visitorInfo =
      visitorName && visitorName !== 'Visitante' ? `[NOME DO VISITANTE: ${visitorName}]\n` : ''

    const userMessageWithContext =
      '[INSTRUÇÃO DE TOM: Responda como uma conversa natural e calorosa entre duas pessoas tomando café, em 1ª pessoa, sem rigidez robótica. Baseie-se estritamente nas fontes abaixo e nunca invente dados.]\n\n' +
      visitorInfo +
      '[CONHECIMENTOS E DADOS OFICIAIS DO COFFEECAST 4.0]\n' +
      dynamicContextBlock +
      '\n\n[MENSAGEM DO VISITANTE]\n' +
      rawMessage

    // 1. Tentar executar via $ai.agent("nine-chat")
    if (typeof $ai !== 'undefined' && $ai.agent) {
      try {
        const agentResult = $ai.agent('nine-chat').chat({
          user_id: userId,
          conversation_id: null,
          message: userMessageWithContext,
        })

        if (agentResult && agentResult.content) {
          responseContent = agentResult.content
          returnedMessageId = agentResult.message_id || ''
          citations = agentResult.citations || []
          modeUsed = 'native-agent'
        }
      } catch (agentErr) {
        console.log('Falha ao acionar $ai.agent("nine-chat"):', agentErr)
      }
    }

    // 2. Fallback via $ai.chat usando fullPromptWithContext
    if (!responseContent && typeof $ai !== 'undefined' && typeof $ai.chat === 'function') {
      try {
        const chatRes = $ai.chat({
          model: 'fast',
          messages: [
            {
              role: 'system',
              content: fullPromptWithContext,
            },
            {
              role: 'user',
              content: rawMessage,
            },
          ],
        })

        if (chatRes && chatRes.choices && chatRes.choices[0] && chatRes.choices[0].message) {
          responseContent = chatRes.choices[0].message.content
          modeUsed = 'fast-model-chat'
        }
      } catch (chatErr) {
        console.log('Falha no fallback $ai.chat para Nine:', chatErr)
      }
    }

    if (!responseContent) {
      responseContent = 'Não consegui responder agora — tente novamente em instantes 💛'
      modeUsed = 'fallback-text'
    }

    // Salvar a resposta da Nine em nine_mensagens
    try {
      const nineMsgRec = new Record(mensagensCol)
      nineMsgRec.set('conversation_id', conversationId)
      nineMsgRec.set('remetente', 'nine')
      nineMsgRec.set('remetente_nome', 'Nine')
      nineMsgRec.set('conteudo', responseContent)
      $app.save(nineMsgRec)

      // Atualizar última mensagem e total na conversa
      conversaRecord.set('ultima_mensagem', responseContent)
      conversaRecord.set('ultimo_remetente', 'nine')
      conversaRecord.set('data_ultima_mensagem', new Date().toISOString())
      conversaRecord.set('total_mensagens', (conversaRecord.getInt('total_mensagens') || 0) + 1)
      $app.save(conversaRecord)
    } catch (saveNineMsgErr) {
      console.log('Aviso ao salvar mensagem da Nine:', saveNineMsgErr)
    }

    return e.json(200, {
      content: responseContent,
      conversation_id: conversationId,
      message_id: returnedMessageId,
      citations: citations,
      mode: modeUsed,
      modo_atendimento: conversaRecord.getString('modo_atendimento'),
      em_atendimento_humano: false,
    })
  } catch (err) {
    console.log('Erro geral no endpoint nine-chat:', err)
    return e.json(500, {
      error: 'Não consegui responder agora — tente novamente em instantes 💛',
    })
  }
})

// Rota pública para sincronização (polling) de mensagens do visitante por conversation_id
routerAdd('GET', '/backend/v1/nine/chat/messages', (e) => {
  try {
    const conversationId = (e.requestInfo().query?.conversation_id || '').trim()
    if (!conversationId) {
      return e.badRequestError('conversation_id é obrigatório.')
    }

    let modo = 'automatico'
    try {
      const conv = $app.findFirstRecordByData('nine_conversas', 'conversation_id', conversationId)
      if (conv) {
        modo = conv.getString('modo_atendimento') || 'automatico'
      }
    } catch (_) {}

    let msgs = []
    try {
      const records = $app.findRecordsByFilter(
        'nine_mensagens',
        `conversation_id = "${conversationId}"`,
        'created',
        100,
        0,
      )
      msgs = (records || []).map((r) => ({
        id: r.id,
        remetente: r.getString('remetente'),
        remetente_nome: r.getString('remetente_nome'),
        conteudo: r.getString('conteudo'),
        created: r.getString('created'),
      }))
    } catch (msgErr) {
      console.log('Erro ao buscar mensagens do chat:', msgErr)
    }

    return e.json(200, {
      conversation_id: conversationId,
      modo_atendimento: modo,
      messages: msgs,
    })
  } catch (err) {
    console.log('Erro no endpoint de mensagens do chat público:', err)
    return e.json(500, { error: 'Falha ao buscar mensagens da conversa.' })
  }
})
