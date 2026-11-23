// pocketbase/hooks/openai_chat.js
// Integração do ChatGPT (OpenAI) como motor principal de IA do CoffeeCast 4.0.
// A chave é lida do segredo de ambiente GCHAT_GPT e NUNCA é exposta em respostas ou logs.
//
// Endpoints:
//   POST /backend/v1/nine/motor          -> gera texto (roteiro) com ChatGPT; fallback = Skip AI
//   GET  /backend/v1/nine/motor-status   -> indica qual motor está ativo (para o painel Master)
//
// Regras:
//   - Se GCHAT_GPT não estiver definida, responde { motor: 'skip-ai', chatgptAtivo: false }
//     e o frontend continua usando o motor padrão (Skip AI) sem qualquer erro.
//   - Em caso de falha/timeout/limite da OpenAI, responde { motor: 'skip-ai', fallback: true }
//     e o front-end aciona o motor padrão sem mostrar erro técnico.

routerAdd(
  'POST',
  '/backend/v1/nine/motor',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const userRole = authUser.getString('role')
      if (userRole === 'adm') {
        const perms = authUser.get('adm_permissions') || {}
        const allowedScreens = Array.isArray(perms.allowedScreens) ? perms.allowedScreens : []
        if (!allowedScreens.includes('roteiros')) {
          return e.forbiddenError('Você não tem permissão para usar o assistente de roteiros.')
        }
      } else if (userRole !== 'master' && userRole !== 'gerencial') {
        return e.forbiddenError(
          'Acesso restrito a administradores Master, Gerencial e ADM autorizados.',
        )
      }

      const apiKey = ($os.getenv('GCHAT_GPT') || '').trim()
      if (!apiKey) {
        // Sem chave: motor padrão (Skip AI)
        return e.json(200, {
          motor: 'skip-ai',
          chatgptAtivo: false,
          motivo: 'sem_chave',
          mensagem:
            'ChatGPT (OpenAI) não configurado neste ambiente. Usando o motor padrão da Nine.',
        })
      }

      const body = e.requestInfo().body || {}
      const systemPrompt = (body.system_prompt || '').trim()
      const userPrompt = (body.user_prompt || '').trim()
      const contexto = body.contexto || {}

      if (!systemPrompt) {
        return e.badRequestError('O prompt do sistema é obrigatório para a geração com ChatGPT.')
      }

      // Monta a mensagem do usuário incorporando o contexto editorial (convidados etc.)
      let userMessage = userPrompt
      if (contexto && typeof contexto === 'object') {
        const partes = []
        if (contexto.fichas) partes.push(contexto.fichas)
        if (contexto.alertas) partes.push(contexto.alertas)
        if (contexto.treinamento_adicional) partes.push(contexto.treinamento_adicional)
        if (contexto.notas_base) partes.push(contexto.notas_base)
        if (partes.length > 0) {
          userMessage = (userMessage || 'Gere o roteiro.') + '\n\n' + partes.join('\n\n')
        }
      }

      // ===== Chamada principal: ChatGPT (OpenAI) via chat completions =====
      const chatgptRes = $http.send({
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 8000,
          temperature: 0.7,
        }),
      })

      // -- Decodificação correta do corpo: no JSVM do PocketBase, resposta.body chega como
      //    array de bytes (String(array) vira "123,10,32,..."); usar resposta.raw (string) ou
      //    o helper global toString(bytes); último recurso: UTF-8 manual que preserva acentos pt-BR.
      const decodificarCorpoResposta = function (resposta) {
        if (!resposta) return ''
        if (typeof resposta.raw === 'string' && resposta.raw.length > 0) {
          return resposta.raw.replace(/^\uFEFF/, '')
        }
        const bytes = resposta.body
        if (bytes == null) return ''
        if (typeof bytes === 'string') return bytes
        if (typeof toString === 'function') {
          try {
            const viaToString = toString(bytes)
            if (typeof viaToString === 'string' && viaToString.length > 0) return viaToString
          } catch (_) {}
        }
        if (!Array.isArray(bytes)) return String(bytes)
        let saida = ''
        let i = 0
        while (i < bytes.length) {
          const b = bytes[i]
          let code = 0xfffd
          if (b < 0x80) {
            code = b
            i += 1
          } else if (b >= 0xc2 && b < 0xe0 && i + 1 < bytes.length) {
            code = ((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f)
            i += 2
          } else if (b >= 0xe0 && b < 0xf0 && i + 2 < bytes.length) {
            code = ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
            i += 3
          } else if (b >= 0xf0 && b < 0xf5 && i + 3 < bytes.length) {
            code =
              ((b & 0x07) << 18) |
              ((bytes[i + 1] & 0x3f) << 12) |
              ((bytes[i + 2] & 0x3f) << 6) |
              (bytes[i + 3] & 0x3f)
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

      const corpoTexto = decodificarCorpoResposta(chatgptRes)
      let parsed = null
      let erroParseCorpo = null
      try {
        parsed = JSON.parse(corpoTexto)
      } catch (errParseCorpo) {
        erroParseCorpo = errParseCorpo
        parsed = null
      }

      // Se o corpo veio com erro embutido (HTTP 200 com error) ou não é JSON, já marca parsed = null
      if (parsed && parsed.error) {
        console.log(
          '[openai_chat] OpenAI retornou erro embutido no corpo (status ' +
            chatgptRes.statusCode +
            '): ' +
            String(parsed.error.message || parsed.error.code || JSON.stringify(parsed.error)).slice(
              0,
              300,
            ) +
            ' — final do corpo: ' +
            String(corpoTexto || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(-500),
        )
        parsed = null
      } else if (!parsed) {
        logarFalhaCorpo('openai_chat', chatgptRes.statusCode, corpoTexto, erroParseCorpo)
      }

      const textoChatgpt =
        parsed &&
        parsed.choices &&
        parsed.choices[0] &&
        parsed.choices[0].message &&
        typeof parsed.choices[0].message.content === 'string'
          ? parsed.choices[0].message.content.trim()
          : ''

      if (chatgptRes.statusCode >= 200 && chatgptRes.statusCode < 300 && textoChatgpt.length > 0) {
        // Auditoria: registra qual motor foi usado
        try {
          const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
          if (colAudit) {
            const auditRec = new Record(colAudit)
            auditRec.set('usuario_id', authUser.id)
            auditRec.set('usuario_email', authUser.getString('email'))
            auditRec.set('usuario_nome', authUser.getString('name') || 'Administrador')
            auditRec.set('usuario_role', userRole)
            auditRec.set('tipo_acao', 'criacao')
            auditRec.set('area_sistema', 'Roteiros & Pautas')
            auditRec.set('descricao', 'Roteiro gerado com o motor ChatGPT (OpenAI) pela Nine.')
            auditRec.set('resultado', 'sucesso')
            auditRec.set('metadata', {
              motor: 'chatgpt-openai',
              modelo: 'gpt-4.1',
              tipo_geracao: contexto.tipo || 'roteiro',
              tamanho_caracteres: textoChatgpt.length,
            })
            $app.save(auditRec)
          }
        } catch (auditErr) {
          console.log('[openai_chat] Auditoria falhou (não impeditiva):', auditErr)
        }

        return e.json(200, {
          motor: 'chatgpt',
          chatgptAtivo: true,
          modelo: 'gpt-4.1',
          texto: textoChatgpt,
        })
      }

      // Falha da OpenAI: cai para o motor padrão (Skip AI), sem erro visível
      console.log(
        '[openai_chat] OpenAI falhou (status ' +
          chatgptRes.statusCode +
          '); caindo para o motor padrão. ' +
          (parsed
            ? 'finish_reason: ' +
              (parsed.choices && parsed.choices[0] && parsed.choices[0].finish_reason
                ? parsed.choices[0].finish_reason
                : '(sem finish_reason)')
            : ''),
      )
      return e.json(200, {
        motor: 'skip-ai',
        chatgptAtivo: false,
        motivo: 'falha_openai',
        mensagem:
          'O ChatGPT não respondeu neste momento. A Nine continuará com o motor padrão, sem interrupção.',
      })
    } catch (err) {
      // Qualquer exceção (timeout, rede etc.): cai para o motor padrão
      console.log('[openai_chat] Exceção na chamada OpenAI:', err)
      return e.json(200, {
        motor: 'skip-ai',
        chatgptAtivo: false,
        motivo: 'excecao',
        mensagem:
          'O ChatGPT ficou indisponível agora. A Nine continuará com o motor padrão, sem interrupção.',
      })
    }
  },
  $apis.requireAuth(),
)

// Status do motor (usado no painel Master para exibir o badge "Motor: ChatGPT (OpenAI)")
routerAdd(
  'POST',
  '/backend/v1/nine/motor-status',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Autenticação necessária')
      }
      const userRole = authUser.getString('role')
      if (userRole !== 'master' && userRole !== 'gerencial' && userRole !== 'adm') {
        return e.forbiddenError('Acesso restrito à administração.')
      }
      const apiKey = ($os.getenv('GCHAT_GPT') || '').trim()
      return e.json(200, {
        chatgptAtivo: apiKey.length > 0,
        motor: apiKey.length > 0 ? 'chatgpt' : 'nine',
        rotulo: apiKey.length > 0 ? 'Motor: ChatGPT (OpenAI)' : 'Motor: Nine (padrão)',
      })
    } catch (err) {
      return e.json(200, { chatgptAtivo: false, motor: 'nine', rotulo: 'Motor: Nine (padrão)' })
    }
  },
  $apis.requireAuth(),
)
