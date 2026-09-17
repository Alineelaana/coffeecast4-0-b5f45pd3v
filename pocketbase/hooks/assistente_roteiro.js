routerAdd(
  'POST',
  '/backend/v1/roteiro-assistente',
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
        return e.forbiddenError('Acesso restrito a usuários Master, ADM autorizados e Gerencial')
      }

      const body = e.requestInfo().body || {}
      const roteiroId = (body.roteiro_id || '').trim()
      if (!roteiroId) {
        return e.badRequestError('ID do roteiro é obrigatório')
      }

      const roteiroRecord = $app.findRecordById('roteiros_convidados', roteiroId)
      if (!roteiroRecord) {
        return e.notFoundError('Roteiro não encontrado')
      }

      const nome = roteiroRecord.getString('nome') || 'Convidado(a)'
      const dataNascimento = roteiroRecord.getString('data_nascimento') || 'Não informada'
      const estadoCivil = roteiroRecord.getString('estado_civil') || 'Não informado'
      const temConjuge = roteiroRecord.getBool('tem_conjuge')
      const nomeConjuge = roteiroRecord.getString('nome_conjuge')
      const temFilhos = roteiroRecord.getBool('tem_filhos')
      const quantidadeFilhos = roteiroRecord.getString('quantidade_filhos')
      const nomesFilhos = roteiroRecord.getString('nomes_filhos')
      const temEmpresa = roteiroRecord.getBool('tem_empresa')
      const nomeEmpresa = roteiroRecord.getString('nome_empresa')
      const sobreEmpresa = roteiroRecord.getString('sobre_empresa')
      const temaEnfatizar =
        roteiroRecord.getString('tema_enfatizar') || 'Trajetória pessoal e profissional'
      const temTemaSensivel = roteiroRecord.getBool('tem_tema_sensivel')
      const temaSensivelDetalhes = roteiroRecord.getString('tema_sensivel_detalhes')
      const biografia = roteiroRecord.getString('biografia') || 'Não informada'

      const promptInstrucoes = [
        'Você é a Nine, a assistente virtual e de produção do podcast CoffeeCast 4.0.',
        'Slogan da marca: "Mais que conversas, histórias que transformam". Identidade: café acolhedor, refinado, conversas profundas, inspiração, empreendedorismo e família.',
        '',
        'Aqui estão os dados enviados pelo(a) convidado(a):',
        '- Nome: ' + nome,
        '- Data de Nascimento: ' + dataNascimento,
        '- Estado Civil: ' + estadoCivil,
        '- Cônjuge: ' +
          (temConjuge && nomeConjuge ? 'Sim, ' + nomeConjuge : 'Não informado/Não se aplica'),
        '- Filhos: ' +
          (temFilhos
            ? 'Sim (' + quantidadeFilhos + ' filhos - Nomes: ' + nomesFilhos + ')'
            : 'Não'),
        '- Empresa / Negócio: ' +
          (temEmpresa
            ? 'Sim (' + nomeEmpresa + ' - Sobre: ' + sobreEmpresa + ')'
            : 'Não informado/Não tem'),
        '- Tema principal que o convidado deseja enfatizar: ' + temaEnfatizar,
        '- Temas sensíveis que prefere EVITAR: ' +
          (temTemaSensivel && temaSensivelDetalhes ? temaSensivelDetalhes : 'Nenhum declarado'),
        '- Biografia enviada: ' + biografia,
        '',
        'REGRA CRÍTICA DE OURO: Se houver qualquer tema sensível informado acima, JAMAIS pergunte ou mencione nada a respeito desse tema no roteiro ou nas perguntas.',
        '',
        'Por favor, gere uma estrutura COMPLETA, elegante, prática e pronta para gravação contendo exatamente:',
        '1. RESUMO DE APRESENTAÇÃO (bio introdutória de 3 a 5 linhas para a apresentadora ler na abertura do podcast).',
        '2. PONTOS FORTES E FOCO DO EPISÓDIO (o que vai emocionar e engajar a audiência).',
        '3. ROTEIRO ESTRUTURADO EM BLOCOS COM SUGESTÕES DE PERGUNTAS:',
        '   - BLOCO 1: Raízes, Infância e Primeiras Escolhas (3 a 4 perguntas)',
        '   - BLOCO 2: Virada de Chave, Família e Empreendedorismo (3 a 4 perguntas)',
        '   - BLOCO 3: O Ponto Alto (' + temaEnfatizar + ') e Superações (3 a 4 perguntas)',
        '   - BLOCO 4: Bate-Bola com Café & Mensagem Final Inspiradora (perguntas rápidas e a pergunta de encerramento da marca: "O que é transformar histórias para você?").',
        '',
        'Escreva tudo em Português do Brasil com excelente redação, formatação limpa em tópicos com marcadores e subtítulos elegantes.',
      ].join('\n')

      let resultadoTexto = ''
      let agenteUsado = 'nenhum'

      // Tentativa 1: Via agente nativo de IA se disponível
      if (typeof $ai !== 'undefined' && $ai.agent) {
        try {
          const agentResult = $ai.agent('roteirista-coffeecast').chat({
            user_id: authUser.id,
            message: promptInstrucoes,
          })
          if (agentResult && agentResult.content) {
            resultadoTexto = agentResult.content
            agenteUsado = 'native-agent'
          }
        } catch (agentChatErr) {
          console.log('Falha ao acionar $ai.agent, tentando $ai.chat:', agentChatErr)
        }
      }

      // Tentativa 2: Fallback via $ai.chat nativo
      if (!resultadoTexto && typeof $ai !== 'undefined' && typeof $ai.chat === 'function') {
        try {
          const chatRes = $ai.chat({
            model: 'fast',
            messages: [
              {
                role: 'system',
                content:
                  'Você é a Nine, assistente virtual do podcast CoffeeCast 4.0. Produza roteiros de alto nível, acolhedores, refinados e inspiradores para entrevistas gravadas em estúdio.',
              },
              {
                role: 'user',
                content: promptInstrucoes,
              },
            ],
          })
          if (chatRes && chatRes.choices && chatRes.choices[0] && chatRes.choices[0].message) {
            resultadoTexto = chatRes.choices[0].message.content
            agenteUsado = 'fast-model-chat'
          }
        } catch (chatErr) {
          console.log('Falha no $ai.chat:', chatErr)
        }
      }

      if (!resultadoTexto) {
        return e.json(503, {
          error: 'Serviço de IA temporariamente indisponível na plataforma.',
          agenteUsado: 'falha',
        })
      }

      return e.json(200, {
        sucesso: true,
        agenteUsado: agenteUsado,
        convidado: nome,
        roteiroSugerido: resultadoTexto,
      })
    } catch (err) {
      console.log('Erro no assistente de roteiro:', err)
      return e.json(500, { error: err.message || 'Erro interno ao processar sugestão de roteiro.' })
    }
  },
  $apis.requireAuth(),
)
