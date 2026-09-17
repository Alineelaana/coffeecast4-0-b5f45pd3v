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

    // Carregar configuração global da Nine (atendimento_automatico, prompt_sistema, base_conhecimento)
    let globalConfig = null
    try {
      globalConfig = $app.findFirstRecordByData('nine_config', 'chave', 'global')
    } catch (_) {}

    const isGlobalAuto = globalConfig ? globalConfig.getBool('atendimento_automatico') : true
    const customPrompt = globalConfig ? globalConfig.getString('prompt_sistema') || '' : ''
    const customKnowledge = globalConfig ? globalConfig.getString('base_conhecimento') || '' : ''

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
      // Se modo for humano_respondendo ou aguardando_humano, mantém para o humano
      // Se global estiver desligado e estiver em automatico, muda para aguardando_humano
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

    // SE MODO FOR HUMANO (humano_respondendo ou aguardando_humano) OU ATENDIMENTO AUTOMÁTICO GLOBAL DESLIGADO:
    // A Nine NÃO gera resposta de IA nessa conversa.
    if (
      !isGlobalAuto ||
      currentMode === 'humano_respondendo' ||
      currentMode === 'aguardando_humano'
    ) {
      // Se estava aguardando ou assumido por humano, responder avisando gentilmente
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

    let responseContent = ''
    let returnedMessageId = ''
    let citations = []
    let modeUsed = 'none'

    // Montar instruções completas combinando o prompt base do treinamento e a base de conhecimento
    let combinedSystemPrompt =
      customPrompt ||
      'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam").\n\n' +
        'Sua personalidade:\n' +
        '- Calorosa, acolhedora, feminina, elegante, prestativa e amigável (adora usar metáforas de café ☕).\n' +
        '- Comunica-se SEMPRE em Português do Brasil.\n' +
        '- Dá respostas concisas, claras, objetivas e gentis (evite textos excessivamente longos ou cansativos).\n\n' +
        'Conhecimentos fundamentais sobre o CoffeeCast 4.0:\n' +
        '1. Equipe / Integrantes do Podcast:\n' +
        '   - Aline Lana: Apresentadora e empresária (@alineelaana), apaixonada por viagens, conexões e histórias que transformam.\n' +
        '   - Dayana Ribas: Integrante (@dayanaribas_), advogada licenciada, estudante de psicanálise e mãe.\n' +
        '   - Rosi Lima: Integrante (@rosiii.lima), educadora e gestora por experiência, movida por pessoas e ideias.\n' +
        '   - Flávia Franco: Integrante (@flaviaaffranco), psicoterapeuta sistêmica e consultora estratégica de cultura e desenvolvimento humano.\n\n' +
        '2. Canais e Links do Site:\n' +
        '   - Como participar como convidado(a) ou enviar história: formulário na home ou /roteiro.\n' +
        '   - Roteiro do Convidado: página /roteiro.\n' +
        '   - Deixar um depoimento: página /depoimento.\n' +
        '   - Área do Convidado: página /convidado.\n' +
        '   - Novos episódios: todo sábado às 10h no canal oficial do YouTube.\n' +
        '   - Redes Sociais: Instagram @coffeecast4.0.\n\n' +
        '3. Contato e Produção:\n' +
        '   - Aline Lana pelo WhatsApp: (31) 99129-7619 ou formulário do site.\n\n' +
        'REGRA CRÍTICA DE OURO:\n' +
        '- Se não souber com certeza, oriente a falar com a produção por WhatsApp (31) 99129-7619.'

    if (customKnowledge) {
      combinedSystemPrompt +=
        '\n\nBASE DE CONHECIMENTO ADICIONAL FORNECIDA PELA EQUIPE:\n' + customKnowledge
    }

    // 1. Tentar executar via $ai.agent("nine-chat")
    if (typeof $ai !== 'undefined' && $ai.agent) {
      try {
        const agentResult = $ai.agent('nine-chat').chat({
          user_id: userId,
          conversation_id: null,
          message: rawMessage,
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

    // 2. Se agente nativo não responder, fallback via $ai.chat usando prompt treinado atualizado
    if (!responseContent && typeof $ai !== 'undefined' && typeof $ai.chat === 'function') {
      try {
        const chatRes = $ai.chat({
          model: 'fast',
          messages: [
            {
              role: 'system',
              content: combinedSystemPrompt,
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

    // Obter conversa para checar modo de atendimento
    let modo = 'automatico'
    try {
      const conv = $app.findFirstRecordByData('nine_conversas', 'conversation_id', conversationId)
      if (conv) {
        modo = conv.getString('modo_atendimento') || 'automatico'
      }
    } catch (_) {}

    // Buscar mensagens ordenadas cronologicamente
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
