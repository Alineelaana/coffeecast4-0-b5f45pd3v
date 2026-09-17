routerAdd('POST', '/backend/v1/nine/chat', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const rawMessage = (body.message || '').trim()

    if (!rawMessage) {
      return e.badRequestError('A mensagem é obrigatória.')
    }

    // Limitar razoavelmente o tamanho da mensagem do visitante (máx 1500 caracteres)
    if (rawMessage.length > 1500) {
      return e.badRequestError(
        'A mensagem enviada ultrapassa o limite permitido de 1500 caracteres.',
      )
    }

    // Resolver usuário: se houver usuário autenticado no request, usa o dele;
    // senão, usa o usuário de serviço visitante@app.local
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
    let returnedConversationId = body.conversation_id || null
    let returnedMessageId = ''
    let citations = []
    let modeUsed = 'none'

    // 1. Tentar executar via agente nativo $ai.agent("nine-chat")
    if (typeof $ai !== 'undefined' && $ai.agent) {
      try {
        const agentResult = $ai.agent('nine-chat').chat({
          user_id: userId,
          conversation_id: body.conversation_id || null,
          message: rawMessage,
        })

        if (agentResult && agentResult.content) {
          responseContent = agentResult.content
          returnedConversationId = agentResult.conversation_id || returnedConversationId
          returnedMessageId = agentResult.message_id || ''
          citations = agentResult.citations || []
          modeUsed = 'native-agent'
        }
      } catch (agentErr) {
        console.log('Falha ao acionar $ai.agent("nine-chat"):', agentErr)
      }
    }

    // 2. Se o agente nativo falhar ou não estiver disponível, fallback via $ai.chat nativo
    if (!responseContent && typeof $ai !== 'undefined' && typeof $ai.chat === 'function') {
      try {
        const chatRes = $ai.chat({
          model: 'fast',
          messages: [
            {
              role: 'system',
              content:
                'Você é a Nine, a assistente virtual oficial do podcast CoffeeCast 4.0 ("Mais que conversas, histórias que transformam"). ' +
                'Tom caloroso, acolhedor, feminino, elegante e prestativo (use metáforas de café ☕). Respostas curtas e gentis em Português do Brasil. ' +
                'Apresentadora: Aline Lana (@alineelaana). Integrantes: Dayana Ribas (@dayanaribas_), Rosi Lima (@rosiii.lima) e Flávia Franco (@flaviaaffranco). ' +
                'Episódios saem todo sábado às 10h no YouTube. Páginas: /roteiro (formulário para convidados enviarem seus dados e fotos), /depoimento (deixar depoimento), /convidado (guia do convidado), formulário na home para participar. ' +
                'Contato com a produção: Aline Lana pelo WhatsApp (31) 99129-7619 ou formulário do site. ' +
                'REGRA CRÍTICA: Se não souber algo, NÃO invente! Oriente a falar com a produção por WhatsApp ou formulário.',
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
      return e.json(503, {
        error: 'Não consegui responder agora — tente novamente em instantes 💛',
        modeUsed: 'failure',
      })
    }

    return e.json(200, {
      content: responseContent,
      conversation_id: returnedConversationId,
      message_id: returnedMessageId,
      citations: citations,
      mode: modeUsed,
    })
  } catch (err) {
    console.log('Erro geral no endpoint nine-chat:', err)
    return e.json(500, {
      error: 'Não consegui responder agora — tente novamente em instantes 💛',
    })
  }
})
