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

    // LGPD: o visitante pode recusar fornecer dados — a Nine respeita e segue com informações gerais
    const refusouDados =
      /(prefiro n[aã]o informar|n[aã]o quero informar|n[aã]o quero passar meus dados|sem informar meus dados|n[aã]o vou informar meus dados)/i.test(
        rawMessage,
      )

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
        // Nome plausível: 1 a 6 palavras; palavra única só se começar com maiúscula (ex.: "Mariana")
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
          'eu',
          'sou',
          'obrigado',
          'obrigada',
          'valeu',
          'tudo',
          'bem',
          'sim',
          'nao',
          'não',
          'ok',
          'oi',
          'tenho',
          'meu',
          'minha',
          'nome',
          'eh',
          'é',
        ]
        const filteredWords = words.filter((w) => !blacklistedWords.includes(w.toLowerCase()))
        const ehNomeUnico = filteredWords.length === 1 && /^[A-ZÀ-Þ]/.test(filteredWords[0])
        if (
          filteredWords.length >= 1 &&
          filteredWords.length <= 6 &&
          (filteredWords.length >= 2 || ehNomeUnico)
        ) {
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
    // Nome aceito com 1 palavra só (ex.: "Mariana") — suficiente para o atendimento
    const hasFullName = Boolean(storedName && storedName.trim().length >= 2)

    let confirmacaoComercial = ''
    let tarefaCriada = false

    const isFullyIdentified = hasValidEmail && hasValidPhone && hasFullName && !refusouDados

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
      let leadContato = null
      let visitanteRetornou = false
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
          leadContato = matchedContato
          if (
            matchedContato.getString('conversation_id') &&
            matchedContato.getString('conversation_id') !== conversationId
          ) {
            visitanteRetornou = true
          }
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
          if (!matchedContato.getString('responsavel')) {
            matchedContato.set('responsavel', 'Aline Lana')
            contatoNeedsSave = true
          }
          if (!matchedContato.getString('status_comercial')) {
            matchedContato.set('status_comercial', 'aguardando_contato')
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
          newContato.set('status_comercial', 'aguardando_contato')
          newContato.set('responsavel', 'Aline Lana')
          newContato.set('prioridade', 'media')
          newContato.set('canal_preferido', 'nao_informado')
          newContato.set('autorizacao_contato', true)
          if (linkedUserId) {
            newContato.set('user', linkedUserId)
          }
          newContato.set('conversation_id', conversationId)
          $app.save(newContato)
          leadContato = newContato
        }
      } catch (syncContatoErr) {
        console.log('Aviso ao sincronizar lead com contatos:', syncContatoErr)
      }

      // -----------------------------------------------------------------------
      // QUALIFICAÇÃO COMERCIAL E TAREFA DE RETORNO — regras reais no backend
      // (não depende apenas do prompt do LLM para gravar dados)
      // -----------------------------------------------------------------------
      if (leadContato) {
        try {
          const INTERESSES = [
            [
              'participar_como_convidado',
              /(participar|ser convidad|aparecer no podcast|gravar um epis[óo]dio|compartilhar.*hist[óo]ria)/i,
            ],
            ['indicar_convidado', /(indicar|sugerir).{0,30}(convidad|pessoa|empresa)/i],
            ['apresentar_empresa', /(apresentar|mostrar).{0,30}empresa/i],
            ['divulgacao', /(divulg|publicidade|publicar|impulsionar)/i],
            ['parceria', /parcer/i],
            ['patrocinio', /patroc[íi]n/i],
            [
              'contratacao',
              /(contratar|contrata[çc][aã]o|pagar para (participar|gravar)|custo para (participar|gravar))/i,
            ],
            [
              'estudio',
              /(usar|alugar|conhecer|locar).{0,20}est[úu]dio|loca[cç][aã]o do est[úu]dio/i,
            ],
            ['proposta_comercial', /(proposta|or[cç]amento|pre[çc]o|valores?)/i],
            [
              'falar_com_equipe',
              /(falar com (a |o )?(aline|equipe|algu[eé]m|atendente|respons[áa]vel|produ[cç][aã]o)|entrar em contato|me contatem|retornar contato|me liguem)/i,
            ],
          ]
          // Múltiplos interesses: todos os modalidades detectados na mensagem
          // (ex.: patrocínio + contratação) são acumulados no JSON `interesses`;
          // o select antigo `interesse` guarda só o interesse PRIMÁRIO válido.
          const INTERESSE_SELECT_VALIDOS = [
            'participar_como_convidado',
            'indicar_convidado',
            'apresentar_empresa',
            'divulgacao',
            'parceria',
            'patrocinio',
            'estudio',
            'proposta_comercial',
            'falar_com_equipe',
          ]
          let interessesDetectados = []
          for (let ii = 0; ii < INTERESSES.length; ii++) {
            if (INTERESSES[ii][1].test(rawMessage)) {
              if (interessesDetectados.indexOf(INTERESSES[ii][0]) === -1) {
                interessesDetectados.push(INTERESSES[ii][0])
              }
            }
          }
          let interesseDetectado = ''
          for (let iv = 0; iv < interessesDetectados.length; iv++) {
            if (INTERESSE_SELECT_VALIDOS.indexOf(interessesDetectados[iv]) !== -1) {
              interesseDetectado = interessesDetectados[iv]
              break
            }
          }

          let canalDetectado = ''
          if (/whatsapp|\bzap\b/i.test(rawMessage)) canalDetectado = 'whatsapp'
          else if (/liga[cç][aã]o|ligacao|telefone|me liguem/i.test(rawMessage))
            canalDetectado = 'ligacao'
          else if (/e-?mail/i.test(rawMessage)) canalDetectado = 'email'

          let horarioDetectado = ''
          const horarioMatch = rawMessage.match(
            /(\d{1,2}\s?[h:]\s?\d{0,2}h?|de manh[ãa]|[àa] tarde|de noite)/i,
          )
          if (horarioMatch) horarioDetectado = horarioMatch[0]

          let leadNeedsSave = false
          if (interesseDetectado && !leadContato.getString('interesse')) {
            leadContato.set('interesse', interesseDetectado)
            leadNeedsSave = true
          }
          // Múltiplos interesses no campo JSON `interesses` — SEM duplicar cadastro
          if (interessesDetectados.length > 0) {
            try {
              let atuais = []
              const rawInt = leadContato.getString('interesses')
              if (rawInt) {
                const parsed = JSON.parse(rawInt)
                if (Array.isArray(parsed)) atuais = parsed
              }
              let mudou = false
              for (let mi = 0; mi < interessesDetectados.length; mi++) {
                if (atuais.indexOf(interessesDetectados[mi]) === -1) {
                  atuais.push(interessesDetectados[mi])
                  mudou = true
                }
              }
              if (mudou) {
                leadContato.set('interesses', JSON.stringify(atuais))
                leadNeedsSave = true
              }
            } catch (intErr) {
              console.log('Aviso ao salvar interesses múltiplos do lead:', intErr)
            }
          }
          if (canalDetectado && leadContato.getString('canal_preferido') !== canalDetectado) {
            leadContato.set('canal_preferido', canalDetectado)
            leadNeedsSave = true
          }
          if (horarioDetectado && !leadContato.getString('melhor_horario')) {
            leadContato.set('melhor_horario', horarioDetectado)
            leadNeedsSave = true
          }
          if (!leadContato.getString('resumo_necessidade')) {
            leadContato.set('resumo_necessidade', rawMessage.slice(0, 500))
            leadNeedsSave = true
          }

          // Solicitação de contato → status "aguardando_contato" + tarefa interna idempotente
          const pediuContato =
            /(quero participar|gostaria de participar|quero (falar|conversar)|entrar em contato|me contatem|retornar contato|pode me ligar|me liguem|agendar|falar com a aline|falar com a equipe)/i.test(
              rawMessage,
            )
          if (pediuContato) {
            const statusAtual = leadContato.getString('status_comercial')
            if (statusAtual !== 'convertido' && statusAtual !== 'encerrado') {
              leadContato.set('status_comercial', 'aguardando_contato')
              leadNeedsSave = true
            }
            if (!leadContato.getString('proxima_acao')) {
              leadContato.set(
                'proxima_acao',
                'Retornar contato do lead — solicitação feita no chat do site',
              )
              leadNeedsSave = true
            }

            const tarefaTitulo = 'Retornar contato — Lead CoffeeCast 4.0'
            let tarefaExistente = []
            try {
              tarefaExistente = $app.findRecordsByFilter(
                'nine_tarefas',
                `lead = "${leadContato.id}" && titulo = "${tarefaTitulo}" && status = "pendente"`,
                '-created',
                1,
                0,
              )
            } catch (_) {}
            if (!tarefaExistente || tarefaExistente.length === 0) {
              const tarefasCol = $app.findCollectionByNameOrId('nine_tarefas')
              const tarefa = new Record(tarefasCol)
              tarefa.set('titulo', tarefaTitulo)
              tarefa.set('lead', leadContato.id)
              tarefa.set('conversation_id', conversationId)
              tarefa.set('nome', leadContato.getString('nome_completo'))
              tarefa.set(
                'telefone',
                leadContato.getString('whatsapp') || leadContato.getString('telefone'),
              )
              tarefa.set('email', leadContato.getString('email'))
              tarefa.set(
                'motivo',
                interesseDetectado ||
                  leadContato.getString('interesse') ||
                  'Solicitação de contato via chat do site',
              )
              tarefa.set(
                'resumo_conversa',
                leadContato.getString('resumo_necessidade') || rawMessage.slice(0, 500),
              )
              tarefa.set(
                'canal_preferido',
                canalDetectado || leadContato.getString('canal_preferido') || 'nao_informado',
              )
              tarefa.set(
                'horario_preferido',
                horarioDetectado || leadContato.getString('melhor_horario'),
              )
              tarefa.set('link_historico', '/admin/contatos')
              tarefa.set('responsavel', 'Aline Lana')
              tarefa.set('prioridade', leadContato.getString('prioridade') || 'media')
              tarefa.set('status', 'pendente')
              tarefa.set('prazo', new Date().toISOString().slice(0, 10))
              $app.save(tarefa)
              tarefaCriada = true
            }

            // -------------------------------------------------------------------
            // RESUMO ESTRUTURADO DO LEAD (resumo_ia) — gerado no backend pelo
            // motor LLM no momento da qualificação, no mesmo padrão do endpoint
            // resumo-ia do nine_comercial.js. Idempotente: só gera se vazio.
            // Fidelidade absoluta: dado ausente na conversa vira "não informado".
            // -------------------------------------------------------------------
            if (!leadContato.getString('resumo_ia')) {
              try {
                let transcriptResumo = ''
                try {
                  const msgsResumo = $app.findRecordsByFilter(
                    'nine_mensagens',
                    `conversation_id = "${conversationId}"`,
                    'created',
                    200,
                    0,
                  )
                  for (let ir = 0; ir < (msgsResumo || []).length; ir++) {
                    const mr = msgsResumo[ir]
                    const quem = mr.getString('remetente') === 'visitante' ? 'Visitante' : 'Nine'
                    transcriptResumo += `${quem}: ${mr.getString('conteudo')}\n`
                  }
                } catch (_) {}
                if (!transcriptResumo) transcriptResumo = 'Visitante: ' + rawMessage

                let resumoIa = ''
                const chatResumo = $ai.chat({
                  model: 'fast',
                  messages: [
                    {
                      role: 'system',
                      content:
                        'Você é assistente comercial do CoffeeCast 4.0. Resuma a conversa em português do Brasil, fielmente, SEM inventar nada. Use exatamente esta estrutura com quebras de linha:\nQuem é o visitante: ...\nO que deseja: ...\nInformações relevantes: ...\nExpectativa: ...\nCanal preferido: ...\nPróxima ação: ...\nQuando um dado não aparece na conversa, escreva "não informado". Seja objetivo.',
                    },
                    { role: 'user', content: transcriptResumo.slice(0, 12000) },
                  ],
                })
                if (
                  chatResumo &&
                  chatResumo.choices &&
                  chatResumo.choices[0] &&
                  chatResumo.choices[0].message
                ) {
                  resumoIa = chatResumo.choices[0].message.content || ''
                }
                if (resumoIa) {
                  leadContato.set('resumo_ia', resumoIa)
                  leadNeedsSave = true
                  // Resumo comercial também no histórico da conversa
                  // (nine_conversas.resumo_contexto — exibido no painel de Leads)
                  try {
                    conversaRecord.set('resumo_contexto', resumoIa.slice(0, 8000))
                  } catch (_) {}
                }
              } catch (resumoErr) {
                console.log('Aviso ao gerar resumo_ia no hook do chat:', resumoErr)
              }
            }

            // Fallback determinístico do resumo quando a IA não responde —
            // nunca bloqueia o fluxo e nunca inventa dado (usa "não informado")
            try {
              if (!conversaRecord.getString('resumo_contexto')) {
                const resumoFallback =
                  'Contato: ' +
                  (leadContato.getString('nome_completo') || 'não informado') +
                  ' (' +
                  (leadContato.getString('email') || 'não informado') +
                  ')' +
                  '\nInteresse: ' +
                  (interessesDetectados.join(', ') || 'não informado') +
                  '\nObjetivo: ' +
                  (leadContato.getString('resumo_necessidade') || 'não informado').slice(0, 300) +
                  '\nCanal preferido: ' +
                  (leadContato.getString('canal_preferido') || 'não informado') +
                  '\nPrioridade sugerida: ' +
                  (leadContato.getString('prioridade') || 'media') +
                  '\nPróxima ação: ' +
                  (leadContato.getString('proxima_acao') || 'Retornar contato')
                conversaRecord.set('resumo_contexto', resumoFallback.slice(0, 8000))
              }
            } catch (_) {}

            // Confirmação ao visitante SÓ depois de gravar de verdade
            confirmacaoComercial =
              '\n\nPerfeito! Já registrei seu interesse e deixei sua solicitação sinalizada para nossa equipe. A Aline poderá dar continuidade ao atendimento assim que possível. ☕💛'
          }

          if (leadNeedsSave) {
            $app.save(leadContato)
          }
        } catch (comercialErr) {
          console.log('Aviso na qualificação comercial da Nine:', comercialErr)
        }
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
      if (!hasValidPhone) missingFields.push('seu WhatsApp (com DDD)')
      if (!hasValidEmail) missingFields.push('seu melhor e-mail')

      let askReply = ''

      if (!hasFullName) {
        // Abertura oficial (apresentação única; nas mensagens seguintes não se reapresenta)
        if (isFirstMessageOfConversation || conversaRecord.getInt('total_mensagens') <= 2) {
          askReply =
            'Olá! Que alegria receber você por aqui! ☕✨\n\n' +
            'Seja muito bem-vindo(a) ao CoffeeCast 4.0! Eu sou a Nine, assistente virtual do CoffeeCast, e estou aqui para te ajudar com tudo o que precisar.\n\n' +
            'Antes de começarmos, como posso te chamar?'
        } else {
          askReply = 'Claro! Antes de continuarmos, me conta: como posso te chamar? ☕'
        }
      } else if (missingFields.length > 0) {
        askReply =
          'Prazer em conhecer você, ' +
          firstName +
          '! 😊\n\n' +
          'Para deixar seu atendimento registrado e facilitar nosso contato, pode me passar ' +
          missingFields.join(' e ') +
          '?\n\n' +
          'Esses dados ajudam nossa equipe a dar continuidade ao seu atendimento e entrar em contato, caso você deseje. 😊\n\n' +
          'E se preferir, pode ficar tranquilo(a): a gente também pode seguir só conversando, sem compromisso! ☕'
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

    // Saudação de retorno — memória de atendimento (identificação já validada por e-mail/telefone)
    if (visitanteRetornou && firstName) {
      try {
        const saudacaoRetorno = new Record(mensagensCol)
        saudacaoRetorno.set('conversation_id', conversationId)
        saudacaoRetorno.set('remetente', 'nine')
        saudacaoRetorno.set('remetente_nome', 'Nine')
        saudacaoRetorno.set(
          'conteudo',
          'Que bom ter você novamente por aqui, ' + firstName + '! 😊☕',
        )
        $app.save(saudacaoRetorno)
        conversaRecord.set(
          'ultima_mensagem',
          'Que bom ter você novamente por aqui, ' + firstName + '! 😊☕',
        )
        conversaRecord.set('ultimo_remetente', 'nine')
      } catch (saudErr) {
        console.log('Aviso ao registrar saudação de retorno:', saudErr)
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

    // Dados comerciais do lead para o prompt (qualificação fiel, sem inventar)
    let leadCommercialInfo = ''
    if (leadContato) {
      leadCommercialInfo =
        '\n\n[DADOS COMERCIAIS REGISTRADOS DO LEAD]\n' +
        'Interesse principal: ' +
        (leadContato.getString('interesse') || 'não informado') +
        '\nInteresses registrados (JSON): ' +
        (leadContato.getString('interesses') || 'não informado') +
        '\nEmpresa/Projeto: ' +
        (leadContato.getString('empresa_projeto') || 'não informado') +
        '\nCanal preferido: ' +
        (leadContato.getString('canal_preferido') || 'não informado') +
        '\nMelhor horário: ' +
        (leadContato.getString('melhor_horario') || 'não informado') +
        '\nStatus comercial: ' +
        (leadContato.getString('status_comercial') || 'novo_lead') +
        '\n[REGRA: ao identificar interesse, pergunte com naturalidade qual é a melhor forma de contato (WhatsApp, ligação ou e-mail) e o melhor horário — sem interrogatório. Se o visitante demonstrar que quer falar com a equipe, informe que o interesse já foi registrado e sinalizado para a Aline. Nunca prometa horários ou agendamentos: apenas registre. Escolher WhatsApp NÃO significa envio automático — o contato é sempre manual pela equipe. Quando o visitante pedir para falar com a equipe, ofereça o link manual de abertura da conversa: https://wa.me/5531991297619?text=Venho%20pelo%20CHAT%20do%20site%20do%20Coffeecast4.0%2C%20gostaria%20de%20falar%20com%20a%20Aline — é apenas um LINK para a pessoa abrir a conversa dela mesma; ZERO envio automático de WhatsApp.]'
    }

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
      ' pelo primeiro nome com calor humano, como à mesa tomando café. Use pronomes adequados se souber o gênero ou linguagem neutra e natural se incerto. Use estritamente os fatos das fontes acima. Se faltar algum dado, indique com carinho o WhatsApp da Aline Lana (31) 99129-7619.' +
      leadCommercialInfo

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

    // Confirmação de registro/tarefa SÓ quando a gravação de verdade aconteceu
    if (confirmacaoComercial) {
      responseContent = responseContent + confirmacaoComercial
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
