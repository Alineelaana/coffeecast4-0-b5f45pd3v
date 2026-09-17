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
    const usersCol = $app.findCollectionByNameOrId('users')

    let isFirstMessageOfConversation = false

    if (!conversaRecord) {
      isFirstMessageOfConversation = true
      conversaRecord = new Record(conversasCol)
      conversaRecord.set('conversation_id', conversationId)
      conversaRecord.set('visitante_nome', (body.visitante_nome || '').trim() || 'Visitante')
      conversaRecord.set('modo_atendimento', isGlobalAuto ? 'automatico' : 'aguardando_humano')
      conversaRecord.set('ultima_mensagem', rawMessage)
      conversaRecord.set('ultimo_remetente', 'visitante')
      conversaRecord.set('data_ultima_mensagem', new Date().toISOString())
      conversaRecord.set('total_mensagens', 1)
      $app.save(conversaRecord)
    } else {
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

    // =========================================================================
    // FLUXO DE IDENTIFICAÇÃO DO VISITANTE (Nome completo, e-mail e telefone/WhatsApp)
    // Regras obrigatórias:
    // 1. No início de cada NOVA conversa, antes de continuar o atendimento, solicitar nome completo, e-mail e telefone/WhatsApp.
    // 2. O visitante pode mandar os dados juntos ou separadamente; fazer parse e validação rigorosos no servidor.
    // 3. Ao identificar os 3 dados válidos: verificar por e-mail OU telefone se já possui cadastro.
    //    - Se já existir: atualizar ou complementar dados faltantes sem criar duplicado.
    //    - Se não existir: criar automaticamente usuário nível 'prata', nome completo, e-mail, telefone e origem 'Nine — Chat do Site'.
    // 4. Vincular o usuário à conversa (campo 'user' e campos de contato) e passar a chamar pelo primeiro nome.
    // =========================================================================

    // Helpers inline de extração e validação (regras goja: tudo dentro da função)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/

    let storedEmail = (conversaRecord.getString('visitante_email') || '').trim().toLowerCase()
    let storedPhone = (conversaRecord.getString('visitante_telefone') || '').trim()
    let storedName = (conversaRecord.getString('visitante_nome') || '').trim()
    let linkedUserId = (conversaRecord.getString('user') || '').trim()

    // Se já tinha nome genérico "Visitante", considera não coletado
    if (storedName === 'Visitante') {
      storedName = ''
    }

    // Se já estiver vinculado a um usuário cadastrado, garantir dados preenchidos
    if (linkedUserId) {
      try {
        const existingLinkedUser = $app.findFirstRecordByData('users', 'id', linkedUserId)
        if (existingLinkedUser) {
          if (!storedName) storedName = existingLinkedUser.getString('name')
          if (!storedEmail) storedEmail = existingLinkedUser.getString('email').toLowerCase()
          if (!storedPhone) storedPhone = existingLinkedUser.getString('telefone')
        }
      } catch (_) {}
    }

    // Tentar detectar novos dados na mensagem atual
    const emailMatch = rawMessage.match(emailRegex)
    if (emailMatch && emailMatch[0]) {
      storedEmail = emailMatch[0].trim().toLowerCase()
    }

    // Detectar telefone na mensagem atual
    const phoneMatch = rawMessage.match(phoneRegex)
    if (phoneMatch && phoneMatch[0]) {
      const cleanedDigits = phoneMatch[0].replace(/\D/g, '')
      // Telefone brasileiro plausível: 10 ou 11 dígitos (com DDD) ou 8/9 dígitos
      if (cleanedDigits.length >= 8 && cleanedDigits.length <= 13) {
        storedPhone = phoneMatch[0].trim()
      }
    }

    // Detectar nome completo se ainda não tínhamos
    if (!storedName) {
      // Remover e-mail e telefone da mensagem para isolar potencial nome
      let msgWithoutData = rawMessage
      if (emailMatch && emailMatch[0]) {
        msgWithoutData = msgWithoutData.replace(emailMatch[0], '')
      }
      if (phoneMatch && phoneMatch[0]) {
        msgWithoutData = msgWithoutData.replace(phoneMatch[0], '')
      }
      msgWithoutData = msgWithoutData.replace(/nome\s*(?:completo)?\s*[:=-]?/gi, '')
      msgWithoutData = msgWithoutData.replace(/meu\s*nome\s*é\s*/gi, '')
      msgWithoutData = msgWithoutData.replace(/sou\s*(?:o|a)\s*/gi, '')
      msgWithoutData = msgWithoutData.replace(/me\s*chamo\s*/gi, '')

      const lines = msgWithoutData.split(/[\n,;]/)
      for (let li = 0; li < lines.length; li++) {
        const lineCandidate = lines[li].replace(/[^a-zA-ZÀ-ÿ\s]/g, ' ').trim()
        const words = lineCandidate.split(/\s+/).filter((w) => w.length >= 2)
        // Nome plausível: 2 a 5 palavras, começando com maiúscula ou letras comuns, sem palavras-chave comuns de pergunta
        const blacklistedWords = [
          'ola',
          'olá',
          'bom',
          'dia',
          'boa',
          'tarde',
          'noite',
          'gostaria',
          'quero',
          'saber',
          'como',
          'funciona',
          'sobre',
          'nine',
          'coffeecast',
        ]
        const filteredWords = words.filter((w) => !blacklistedWords.includes(w.toLowerCase()))
        if (filteredWords.length >= 2 && filteredWords.length <= 6) {
          storedName = filteredWords
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ')
          break
        }
      }
    }

    // Atualizar registro da conversa com os dados acumulados até aqui
    if (storedEmail) conversaRecord.set('visitante_email', storedEmail)
    if (storedPhone) conversaRecord.set('visitante_telefone', storedPhone)
    if (storedName) conversaRecord.set('visitante_nome', storedName)

    // Se temos os 3 dados (nome completo, e-mail válido e telefone plausível), sincronizar no banco (users)
    const hasValidEmail = Boolean(
      storedEmail && storedEmail.includes('@') && storedEmail.includes('.'),
    )
    const hasValidPhone = Boolean(storedPhone && storedPhone.replace(/\D/g, '').length >= 8)
    const hasFullName = Boolean(storedName && storedName.trim().split(/\s+/).length >= 2)

    const isFullyIdentified = hasValidEmail && hasValidPhone && hasFullName

    if (isFullyIdentified) {
      // 1. Procurar no banco por e-mail OU telefone
      let matchedUser = null

      if (storedEmail) {
        try {
          matchedUser = $app.findAuthRecordByEmail('users', storedEmail)
        } catch (_) {}
      }

      if (!matchedUser && storedPhone) {
        try {
          // Busca por telefone exato ou dígito limpo
          const phoneUsers = $app.findRecordsByFilter(
            'users',
            `telefone ~ "${storedPhone.replace(/\D/g, '').slice(-8)}"`,
            '-created',
            1,
            0,
          )
          if (phoneUsers && phoneUsers.length > 0) {
            matchedUser = phoneUsers[0]
          }
        } catch (_) {}
      }

      const nowIso = new Date().toISOString()
      const originTag = 'Nine — Chat do Site (' + nowIso.slice(0, 10) + ')'

      if (matchedUser) {
        // Já existe: atualizar/complementar dados que estiverem vazios
        let needsSave = false
        if (!matchedUser.getString('name') && storedName) {
          matchedUser.set('name', storedName)
          needsSave = true
        }
        if (!matchedUser.getString('telefone') && storedPhone) {
          matchedUser.set('telefone', storedPhone)
          needsSave = true
        }
        if (!matchedUser.getString('origem')) {
          matchedUser.set('origem', originTag)
          needsSave = true
        }
        if (needsSave) {
          try {
            $app.save(matchedUser)
          } catch (updateErr) {
            console.log('Aviso ao complementar dados de usuário existente:', updateErr)
          }
        }
        linkedUserId = matchedUser.id
      } else {
        // Não existe: criar novo usuário nível Prata
        try {
          const newUser = new Record(usersCol)
          newUser.setEmail(storedEmail)
          newUser.setPassword($security.randomString(24))
          newUser.setVerified(true)
          newUser.set('name', storedName)
          newUser.set('telefone', storedPhone)
          newUser.set('role', 'prata')
          newUser.set('ativo', true)
          newUser.set('origem', originTag)
          $app.save(newUser)
          linkedUserId = newUser.id
        } catch (createPrataErr) {
          console.log('Aviso ao criar usuário nível Prata pela Nine:', createPrataErr)
          // Se falhou por email duplicado, busca novamente
          try {
            const retryUser = $app.findAuthRecordByEmail('users', storedEmail)
            if (retryUser) {
              linkedUserId = retryUser.id
            }
          } catch (_) {}
        }
      }

      if (linkedUserId) {
        conversaRecord.set('user', linkedUserId)
      }

      // -----------------------------------------------------------------------
      // SINCRONIZAÇÃO AUTOMÁTICA COM A ÁREA DE CONTATOS & LEADS (COMERCIAL)
      // Todo usuário criado ou identificado pela Nine deve aparecer em contatos.
      // Sem duplicar contatos: se e-mail ou telefone já existirem, atualiza.
      // -----------------------------------------------------------------------
      try {
        const contatosCol = $app.findCollectionByNameOrId('contatos')
        let matchedContato = null

        if (storedEmail) {
          try {
            matchedContato = $app.findFirstRecordByData('contatos', 'email', storedEmail)
          } catch (_) {}
        }

        if (!matchedContato && storedPhone) {
          const cleanPhone = storedPhone.replace(/\D/g, '').slice(-8)
          if (cleanPhone.length >= 8) {
            try {
              const phoneContatos = $app.findRecordsByFilter(
                'contatos',
                `whatsapp ~ "${cleanPhone}" || telefone ~ "${cleanPhone}"`,
                '-created',
                1,
                0,
              )
              if (phoneContatos && phoneContatos.length > 0) {
                matchedContato = phoneContatos[0]
              }
            } catch (_) {}
          }
        }

        if (matchedContato) {
          // Atualiza dados faltantes no contato existente
          let contatoNeedsSave = false
          if (!matchedContato.getString('user') && linkedUserId) {
            matchedContato.set('user', linkedUserId)
            contatoNeedsSave = true
          }
          if (!matchedContato.getString('origem')) {
            matchedContato.set('origem', originTag)
            contatoNeedsSave = true
          }
          if (!matchedContato.getString('conversation_id')) {
            matchedContato.set('conversation_id', conversationId)
            contatoNeedsSave = true
          }
          if (!matchedContato.getString('whatsapp') && storedPhone) {
            matchedContato.set('whatsapp', storedPhone)
            contatoNeedsSave = true
          }
          if (!matchedContato.getString('telefone') && storedPhone) {
            matchedContato.set('telefone', storedPhone)
            contatoNeedsSave = true
          }
          if (contatoNeedsSave) {
            $app.save(matchedContato)
          }
        } else {
          // Cria novo contato para o comercial
          const newContato = new Record(contatosCol)
          newContato.set('nome_completo', storedName || 'Contato Nine')
          newContato.set('email', storedEmail)
          newContato.set('telefone', storedPhone)
          newContato.set('whatsapp', storedPhone)
          newContato.set('origem', originTag)
          newContato.set('como_nos_conheceu', 'Nine — Chat do Site')
          newContato.set(
            'motivo',
            `Lead captado pela Nine no chat do site. Mensagem inicial: "${rawMessage.slice(0, 300)}"`,
          )
          newContato.set('status', 'novo')
          if (linkedUserId) {
            newContato.set('user', linkedUserId)
          }
          newContato.set('conversation_id', conversationId)
          $app.save(newContato)
        }
      } catch (syncContatoErr) {
        console.log('Aviso ao sincronizar lead com contatos:', syncContatoErr)
      }
    }

    $app.save(conversaRecord)

    // Primeiro nome do visitante para tratamento acolhedor
    let firstName = ''
    if (storedName) {
      firstName = storedName.trim().split(/\s+/)[0]
    }

    // Se ainda NÃO está totalmente identificado (falta nome, e-mail ou telefone):
    // A Nine deve solicitar os dados pendentes de forma acolhedora, natural e não burocrática,
    // explicando que é para personalizar o atendimento com carinho.
    // Se o visitante tiver feito uma pergunta na primeira mensagem, a Nine acolhe com gentileza e pede os dados.
    if (!isFullyIdentified) {
      const missingFields = []
      if (!hasFullName) missingFields.push('seu nome completo')
      if (!hasValidEmail) missingFields.push('seu melhor e-mail')
      if (!hasValidPhone) missingFields.push('seu telefone ou WhatsApp com DDD')

      let askReply = ''

      if (isFirstMessageOfConversation || conversaRecord.getInt('total_mensagens') <= 2) {
        askReply =
          'Olá! Que alegria receber você aqui no CoffeeCast 4.0! ☕✨\n\n' +
          'Antes de mergulharmos no nosso papo, me conta: qual é o ' +
          missingFields.join(', ') +
          '? Assim eu já preparo um café bem quentinho e personalizo todo o seu atendimento com o maior carinho.'
      } else {
        // Mensagem subsequente enquanto ainda faltam dados
        const firstNameGreeting = firstName ? `${firstName}, ` : ''
        askReply =
          `Com certeza! ${firstNameGreeting}Para eu te passar todos os detalhes certinhos e registrar nosso contato com carinho, só me confirma, por favor: ` +
          missingFields.join(' e ') +
          '? ☕'
      }

      // Salvar a resposta da Nine
      try {
        const nineMsgRec = new Record(mensagensCol)
        nineMsgRec.set('conversation_id', conversationId)
        nineMsgRec.set('remetente', 'nine')
        nineMsgRec.set('remetente_nome', 'Nine')
        nineMsgRec.set('conteudo', askReply)
        $app.save(nineMsgRec)

        conversaRecord.set('ultima_mensagem', askReply)
        conversaRecord.set('ultimo_remetente', 'nine')
        conversaRecord.set('data_ultima_mensagem', new Date().toISOString())
        conversaRecord.set('total_mensagens', (conversaRecord.getInt('total_mensagens') || 0) + 1)
        $app.save(conversaRecord)
      } catch (saveAskErr) {
        console.log('Aviso ao salvar solicitação de dados pela Nine:', saveAskErr)
      }

      return e.json(200, {
        content: askReply,
        conversation_id: conversationId,
        message_id: '',
        citations: [],
        mode: 'collecting-visitor-data',
        modo_atendimento: conversaRecord.getString('modo_atendimento'),
        em_atendimento_humano: false,
        coleta_pendente: true,
      })
    }

    // =========================================================================
    // VISITANTE IDENTIFICADO! PROSSEGUIR COM ATENDIMENTO NATURAL E PERSONALIZADO
    // =========================================================================

    // Resolver usuário de serviço para o agente nativo (usa o próprio usuário cadastrado ou o visitante@app.local)
    let agentUserId = linkedUserId
    if (!agentUserId) {
      if (e.auth && e.auth.id) {
        agentUserId = e.auth.id
      } else {
        try {
          const visitante = $app.findAuthRecordByEmail('users', 'visitante@app.local')
          if (visitante) {
            agentUserId = visitante.id
          }
        } catch (_) {}

        if (!agentUserId) {
          try {
            const usersColRef = $app.findCollectionByNameOrId('users')
            const rec = new Record(usersColRef)
            rec.setEmail('visitante@app.local')
            rec.setPassword($security.randomString(28))
            rec.setVerified(true)
            rec.set('name', 'Visitante CoffeeCast')
            rec.set('role', 'prata')
            rec.set('ativo', true)
            $app.save(rec)
            agentUserId = rec.id
          } catch (_) {}
        }
      }
    }

    // CONTEXTO DINÂMICO CONSULTADO EM TEMPO REAL NO BANCO DE DADOS
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

    // 6. Prompt Livre Adicional da Base de Conhecimento
    if (customPromptLivre && customPromptLivre.trim().length > 0) {
      dynamicContextParts.push(
        '### INSTRUÇÕES E ORIENTAÇÕES ADICIONAIS DA BASE DE CONHECIMENTO (PROMPT LIVRE):\n' +
          customPromptLivre.trim(),
      )
    }

    const dynamicContextBlock = dynamicContextParts.join('\n\n')

    // Diretrizes essenciais de NORMA-PADRÃO, LÍNGUA, TOM NATURAL E PERSONALIZAÇÃO
    const naturalHumanGuidelines =
      'DIRETRIZES DE LÍNGUA, NORMA-PADRÃO E ACORDO ORTOGRÁFICO (OBRIGATÓRIO E RIGOROSO):\n' +
      '1. NORMA-PADRÃO DO PORTUGUÊS DO BRASIL: Responda SEMPRE em português do Brasil, seguindo com absoluto rigor a norma-padrão e o Acordo Ortográfico vigente. NUNCA cometa erros de concordância nominal ou verbal, regência, crase, pontuação, acentuação gráfica ou escrita.\n' +
      '2. TRATAMENTO PELO PRIMEIRO NOME: Chame sempre a pessoa pelo primeiro nome (' +
      (firstName || 'visitante') +
      '), iniciando o atendimento com acolhimento caloroso e educado.\n' +
      '3. PRONOMES E GÊNERO: Quando houver informação suficiente sobre a pessoa (como nome ou autodescrição inequívocos), utilize os pronomes e flexões adequados. Se não houver certeza absoluta, NUNCA presuma gênero: utilize uma linguagem neutra, fluida e natural (ex.: "Que bom ter sua companhia!", "Seja muito bem-vindo(a)!", "É um grande prazer conversar com você!").\n' +
      '4. CONVERSA NATURAL ENTRE DUAS PESSOAS: Fale como quem bate um papo à mesa com café fresquinho. Calorosa, espontânea, humana e empática. Nada de respostas burocráticas ou robóticas.\n' +
      '5. PRIMEIRA PESSOA E CALOR HUMANO: Fale em primeira pessoa ("eu", "aqui no CoffeeCast", "a gente"), demonstrando simpatia genuína.\n' +
      '6. RITMO DE CONVERSA (SEM DESPEJAR TUDO): Dê respostas claras e no tamanho ideal para um diálogo. Não jogue listas gigantes se a pergunta for simples.\n' +
      '7. PROATIVIDADE E PERGUNTAS DE VOLTA: Faça uma pergunta de volta para manter o papo vivo e entender o que a pessoa precisa.\n' +
      '8. EMOJIS COM MODERAÇÃO: Use emojis elegantes com bom gosto e no tom do café e acolhimento (☕, ✨, 💛).\n\n' +
      'ÂNCORA ESTREITA DE CONHECIMENTO (REGRA INEGOCIÁVEL):\n' +
      '1. Baseie-se ESTRITAMENTE nos conhecimentos oficiais do treinamento (Prompt Master, Base de Conhecimento, Prompt Livre e dados dinâmicos do banco: episódios, integrantes, agenda, páginas e contatos).\n' +
      '2. NUNCA INVENTE informações, datas, nomes, valores, links ou confirmações que não estejam presentes nas fontes fornecidas.\n' +
      '3. Se a informação NÃO constar nessas fontes oficiais, admita com toda a simpatia e naturalidade que não possui esse dado no momento e recomende com carinho o contato direto da produção: Aline Lana pelo WhatsApp (31) 99129-7619 ou pelos formulários de contato do site.'

    const systemPromptBase =
      (customPrompt ? customPrompt + '\n\n' + naturalHumanGuidelines : '') ||
      'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam").\n\n' +
        naturalHumanGuidelines

    const fullPromptWithContext =
      systemPromptBase +
      '\n\n==================================================\n' +
      'FONTES OFICIAIS DE CONHECIMENTO E DADOS ATUALIZADOS DO BANCO:\n' +
      dynamicContextBlock +
      '\n==================================================\n' +
      'INSTRUÇÃO FINAL DE RESPOSTA:\n' +
      'Responda em português do Brasil padrão (Acordo Ortográfico vigente), sem erros de concordância ou pontuação. Chame ' +
      (firstName || 'a pessoa') +
      ' pelo primeiro nome com calor humano, como à mesa tomando café. Use pronomes adequados se souber o gênero ou linguagem neutra e natural se incerto. Use estritamente os fatos das fontes acima. Se faltar algum dado, indique com carinho o WhatsApp da Aline Lana (31) 99129-7619.'

    let responseContent = ''
    let returnedMessageId = ''
    let citations = []
    let modeUsed = 'none'

    const visitorContextInfo =
      `[DADOS DO VISITANTE IDENTIFICADO]\n` +
      `Primeiro nome: ${firstName || 'Amigo(a)'}\n` +
      `Nome completo: ${storedName || 'Visitante'}\n` +
      `E-mail: ${storedEmail || 'não informado'}\n` +
      `Telefone/WhatsApp: ${storedPhone || 'não informado'}\n` +
      `[REGRA: Chame ${firstName || 'a pessoa'} pelo primeiro nome. Responda em português do Brasil padrão estrito, sem erros de concordância ou ortografia, com tom caloroso e natural. Se o gênero for incerto, use linguagem neutra.]\n\n`

    const userMessageWithContext =
      visitorContextInfo +
      '[CONHECIMENTOS E DADOS OFICIAIS DO COFFEECAST 4.0]\n' +
      dynamicContextBlock +
      '\n\n[MENSAGEM DO VISITANTE]\n' +
      rawMessage

    // 1. Tentar executar via $ai.agent("nine-chat") com agentUserId
    if (agentUserId && typeof $ai !== 'undefined' && $ai.agent) {
      try {
        const agentResult = $ai.agent('nine-chat').chat({
          user_id: agentUserId,
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

    // 2. Fallback via $ai.chat
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
      const welcomeFallback = firstName
        ? `${firstName}, que alegria ter você aqui! ☕ `
        : 'Olá! ☕ '
      responseContent =
        welcomeFallback +
        'Obrigada por compartilhar seus dados. Como posso te ajudar hoje sobre os episódios, integrantes ou gravações do CoffeeCast 4.0?'
      modeUsed = 'fallback-greeting'
    }

    // Salvar a resposta da Nine em nine_mensagens
    try {
      const nineMsgRec = new Record(mensagensCol)
      nineMsgRec.set('conversation_id', conversationId)
      nineMsgRec.set('remetente', 'nine')
      nineMsgRec.set('remetente_nome', 'Nine')
      nineMsgRec.set('conteudo', responseContent)
      $app.save(nineMsgRec)

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
      visitante_nome: storedName,
      primeiro_nome: firstName,
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
