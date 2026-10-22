// pocketbase/hooks/assistente_roteiro.js
// Geração de roteiros profissionais e pautas refinadas para o podcast CoffeeCast 4.0
// Produzido pela Nine com padrão editorial elevado: norma-padrão rigorosa do português do Brasil,
// estrutura completa de podcast de estúdio, personalização profunda dos dados do convidado e
// respeito irrestrito a temas sensíveis.

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
        return e.forbiddenError(
          'Acesso restrito a administradores Master, Gerencial e ADM autorizados.',
        )
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

      // 1. Extração segura de dados da ficha do(a) convidado(a)
      const nome = (roteiroRecord.getString('nome') || 'Convidado(a)').trim()
      const dataNascimento = (roteiroRecord.getString('data_nascimento') || '').trim()
      const estadoCivil = (roteiroRecord.getString('estado_civil') || '').trim()
      const temConjuge = roteiroRecord.getBool('tem_conjuge')
      const nomeConjuge = (roteiroRecord.getString('nome_conjuge') || '').trim()
      const temFilhos = roteiroRecord.getBool('tem_filhos')
      const quantidadeFilhos = (roteiroRecord.getString('quantidade_filhos') || '').trim()
      const nomesFilhos = (roteiroRecord.getString('nomes_filhos') || '').trim()
      const temEmpresa = roteiroRecord.getBool('tem_empresa')
      const nomeEmpresa = (roteiroRecord.getString('nome_empresa') || '').trim()
      const sobreEmpresa = (roteiroRecord.getString('sobre_empresa') || '').trim()
      const temaEnfatizar =
        (roteiroRecord.getString('tema_enfatizar') || '').trim() ||
        'Trajetória de vida, propósito, superação e legado profissional'
      const temTemaSensivel = roteiroRecord.getBool('tem_tema_sensivel')
      const temaSensivelDetalhes = (roteiroRecord.getString('tema_sensivel_detalhes') || '').trim()
      const biografia = (roteiroRecord.getString('biografia') || '').trim()

      // 2. Carregar conhecimentos e treinamento dinâmico da Nine (se houver no banco)
      let customTreinamento = ''
      let customPromptLivre = ''
      try {
        const globalCfg = $app.findFirstRecordByData('nine_config', 'chave', 'global')
        if (globalCfg) {
          customTreinamento = (globalCfg.getString('prompt_sistema') || '').trim()
          customPromptLivre = (globalCfg.getString('prompt_livre') || '').trim()
        }
      } catch (_) {}

      // Formatar resumo familiar e profissional
      const infoConjuge =
        temConjuge && nomeConjuge
          ? `Sim (${nomeConjuge})`
          : temConjuge
            ? 'Sim'
            : 'Não informado / Não possui'
      let infoFilhos = 'Não'
      if (temFilhos) {
        infoFilhos = `Sim`
        if (quantidadeFilhos) infoFilhos += ` (${quantidadeFilhos} filho(s)`
        if (nomesFilhos) infoFilhos += ` - Nomes: ${nomesFilhos}`
        if (quantidadeFilhos) infoFilhos += `)`
      }
      const infoEmpresa = temEmpresa
        ? `${nomeEmpresa || 'Sim'}${sobreEmpresa ? ` — Atuação: ${sobreEmpresa}` : ''}`
        : 'Não informado / Não possui'

      const alertaTemaSensivel =
        temTemaSensivel && temaSensivelDetalhes
          ? temaSensivelDetalhes
          : 'Nenhum declarado pelo convidado'

      // 3. Montagem do Prompt de Sistema Especialista da Nine para Roteiros
      const systemPromptRoteiro = [
        'Você é a Nine, a roteirista-chefe e assistente virtual oficial do podcast CoffeeCast 4.0.',
        '',
        '### SOBRE O COFFEECAST 4.0:',
        '• Slogan oficial: "Mais que conversas, histórias que transformam."',
        '• Apresentadora titular: Aline Lana (@alineelaana) — empresária, mentora, palestrante e idealizadora do CoffeeCast.',
        '• Co-apresentadoras e elenco: Dayana Ribas, Rosi Lima e Flávia Franco.',
        '• Atmosfera e Conceito: Podcast gravado presencialmente em estúdio intimista com mesa de café selecionado. Conversas profundas, acolhedoras, humanas, elegantes e de alto nível, com foco em histórias inspiradoras, mulheres que transformam, empreendedorismo com propósito, superação e família.',
        '• Lema do café: "O café pode até esfriar, mas o papo nunca."',
        '',
        '### EXIGÊNCIAS RIGOROSAS DE REDAÇÃO E LÍNGUA PORTUGUESA (OBRIGATÓRIO):',
        '1. NORMA-PADRÃO IMPECÁVEL: Escreva em Português do Brasil na norma culta padrão (Acordo Ortográfico vigente). Revise mentalmente cada frase para que NÃO HAJA NENHUM ERRO de concordância nominal, concordância verbal, regência, crase, pontuação, acentuação ou grafia.',
        '2. PROSA NATURAL E REFINADA: Fuja de clichês robóticos, frases truncadas, construções de tradução literal do inglês ou jargões vazios. O texto deve soar fluente, poético, caloroso e pronto para ser falado com naturalidade pela apresentadora.',
        '3. PONTUAÇÃO E RITMO: Use vírgulas, pontos e travessões com precisão para dar ritmo à fala da apresentadora.',
        '4. ADEQUAÇÃO AO CONVIDADO: Adapte o vocabulário e o tom à história do convidado, sem jamais presumir dados que ele não enviou.',
        '',
        '### REGRA CRÍTICA DE OURO — TEMAS SENSÍVEIS (BLOQUEIO TOTAL):',
        '• Se houver qualquer tema sensível informado pela produção ou pelo convidado (como política, religião, litígios, traumas específicos ou vida íntima), É TERMINANTEMENTE PROIBIDO mencionar, sugerir ou fazer qualquer pergunta direta ou indireta que tangencie esse assunto.',
        '• O estúdio do CoffeeCast 4.0 é um espaço de acolhimento, respeito e segurança psicológica.',
        '',
        '### ESTRUTURA PADRÃO OBRIGATÓRIA DO ROTEIRO (ENTREGUE TODAS AS SEÇÕES FORMATADAS EM MARKDOWN):',
        '1. **CABEÇALHO EDITORIAL DO EPISÓDIO**',
        '   - Nome do(a) Convidado(a), tema central da edição, tom sugerido para a conversa e aviso explícito de proteção sobre temas sensíveis (se houver).',
        '',
        '2. **RESUMO DE APRESENTAÇÃO (BIO DE ABERTURA PARA ALINE LANA LER NO MICROFONE)**',
        '   - Texto marcante, envolvente e acolhedor (de 4 a 6 linhas), escrito em primeira pessoa da apresentadora (ex.: "Hoje o nosso café tem um aroma especial..."), apresentando o(a) convidado(a) pelo seu legado, humanidade e trajetória transformadora.',
        '',
        '3. **PONTOS FORTES & CONEXÃO EMOCIONAL DO EPISÓDIO**',
        '   - Destaque em tópicos elegantes dos momentos de maior brilho, inspiração e aprendizado prático que irão encantar a audiência do CoffeeCast.',
        '',
        '4. **ROTEIRO ESTRUTURADO EM 4 BLOCOS COM PERGUNTAS DE ALTO NÍVEL** (cada pergunta deve ser instigante, aberta, profunda e natural, acompanhada de um breve direcionamento ou gancho para a apresentadora conduzir):',
        '   - **BLOCO 1: Raízes, Memórias e os Primeiros Passos** (3 a 4 perguntas sobre infância, família, referências que moldaram o caráter e primeiras decisões de vida).',
        '   - **BLOCO 2: A Virada de Chave, Desafios e Família** (3 a 4 perguntas sobre momentos decisivos, conciliação entre vida pessoal/filhos/cônjuge e a coragem de empreender ou trilhar o próprio caminho).',
        '   - **BLOCO 3: O Ponto Alto — Propósito e Transformação** (3 a 4 perguntas aprofundadas focadas no tema principal solicitado pelo convidado e na sua área de impacto).',
        '   - **BLOCO 4: Bate-Bola com Café & Mensagem Final Inspiradora** (perguntas dinâmicas e afetivas de 1 a 2 palavras, fechando com a pergunta de assinatura da marca: *"Para você, o que é transformar histórias?"*).',
        '',
        '5. **ORIENTAÇÕES DE BASTIDORES PARA A PRODUÇÃO**',
        '   - 2 ou 3 notas curtas e práticas de estúdio para enriquecer a experiência do convidado (ex.: referências a mencionar com carinho, ganchos para o café servido na mesa).',
      ].join('\n')

      // 4. Montagem da Mensagem do Usuário com a ficha do convidado
      const userMessage = [
        'Por favor, Nine, elabore um roteiro completo, impecável e inspirador para a gravação do seguinte episódio:',
        '',
        '=== DADOS DA FICHA DE PRÉ-GRAVAÇÃO DO(A) CONVIDADO(A) ===',
        `- Nome Completo: ${nome}`,
        `- Data de Nascimento: ${dataNascimento || 'Não informada'}`,
        `- Estado Civil: ${estadoCivil || 'Não informado'}`,
        `- Cônjuge: ${infoConjuge}`,
        `- Filhos: ${infoFilhos}`,
        `- Empresa / Negócio / Atuação: ${infoEmpresa}`,
        `- Tema Principal Solicitado pelo(a) Convidado(a): ${temaEnfatizar}`,
        `- Temas Sensíveis a EVITAR com Rigor: ${alertaTemaSensivel}`,
        `- Biografia / Trajetória Enviada: ${biografia || 'Não informada'}`,
        '',
        customTreinamento
          ? `[DIRETRIZES DE PERSONALIDADE DA NINE CADASTRADAS PELA DIREÇÃO]:\n${customTreinamento.slice(0, 1200)}\n`
          : '',
        customPromptLivre
          ? `[ORIENTAÇÕES ADICIONAIS DA BASE DE CONHECIMENTO]:\n${customPromptLivre.slice(0, 800)}\n`
          : '',
        'Lembre-se: qualidade gramatical impecável no português do Brasil, acolhimento, respeito aos temas sensíveis e profundidade em cada pergunta.',
      ]
        .filter(Boolean)
        .join('\n')

      let resultadoTexto = ''
      let agenteUsado = 'nenhum'

      // Tentativa 1: Agente nativo 'roteirista-coffeecast'
      if (typeof $ai !== 'undefined' && $ai.agent) {
        try {
          const agentResult = $ai.agent('roteirista-coffeecast').chat({
            user_id: authUser.id,
            message: `${systemPromptRoteiro}\n\n====================\n\n${userMessage}`,
          })
          if (agentResult && agentResult.content && agentResult.content.trim().length > 150) {
            resultadoTexto = agentResult.content.trim()
            agenteUsado = 'native-agent'
          }
        } catch (agentChatErr) {
          console.log(
            '[assistente_roteiro] Falha ao acionar $ai.agent, acionando fallback via $ai.chat:',
            agentChatErr,
          )
        }
      }

      // Tentativa 2: Fallback via $ai.chat com model: 'fast' e prompt robusto
      if (!resultadoTexto && typeof $ai !== 'undefined' && typeof $ai.chat === 'function') {
        try {
          const chatRes = $ai.chat({
            model: 'fast',
            messages: [
              {
                role: 'system',
                content: systemPromptRoteiro,
              },
              {
                role: 'user',
                content: userMessage,
              },
            ],
          })
          if (chatRes && chatRes.choices && chatRes.choices[0] && chatRes.choices[0].message) {
            const rawContent = (chatRes.choices[0].message.content || '').trim()
            if (rawContent.length > 150) {
              resultadoTexto = rawContent
              agenteUsado = 'fast-model-chat'
            }
          }
        } catch (chatErr) {
          console.log('[assistente_roteiro] Falha no fallback $ai.chat:', chatErr)
        }
      }

      if (!resultadoTexto) {
        return e.json(503, {
          error:
            'A Nine está temporariamente indisponível para gerar o roteiro neste instante. Por favor, tente novamente em alguns segundos.',
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
      return e.json(500, {
        error: err.message || 'Erro interno ao processar sugestão de roteiro.',
      })
    }
  },
  $apis.requireAuth(),
)

// Endpoint administrativo para salvar a sugestão da Nine diretamente no registro do roteiro
routerAdd(
  'POST',
  '/backend/v1/roteiro-assistente/salvar',
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
          return e.forbiddenError('Você não tem permissão para editar roteiros.')
        }
      } else if (userRole !== 'master' && userRole !== 'gerencial') {
        return e.forbiddenError(
          'Acesso restrito a administradores Master, Gerencial e ADM autorizados',
        )
      }

      const body = e.requestInfo().body || {}
      const roteiroId = (body.roteiro_id || '').trim()
      const roteiroTexto = (body.roteiro_texto || '').trim()

      if (!roteiroId) {
        return e.badRequestError('ID do roteiro é obrigatório')
      }

      if (!roteiroTexto) {
        return e.badRequestError('O texto da sugestão do roteiro não pode estar vazio.')
      }

      const roteiroRecord = $app.findRecordById('roteiros_convidados', roteiroId)
      if (!roteiroRecord) {
        return e.notFoundError('Registro de roteiro não encontrado')
      }

      const convidadoNome = roteiroRecord.getString('nome') || 'Convidado(a)'

      // Atualizar o registro com o roteiro sugerido pela Nine
      roteiroRecord.set('roteiro_final_texto', roteiroTexto)
      $app.save(roteiroRecord)

      // Registrar na Auditoria do Sistema
      try {
        const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
        if (colAudit) {
          const auditRec = new Record(colAudit)
          auditRec.set('usuario_id', authUser.id)
          auditRec.set('usuario_email', authUser.getString('email'))
          auditRec.set('usuario_nome', authUser.getString('name') || 'Administrador')
          auditRec.set('usuario_role', userRole)
          auditRec.set('tipo_acao', 'edicao')
          auditRec.set('area_sistema', 'Roteiros & Pautas')
          auditRec.set(
            'descricao',
            'Sugestão de roteiro da assistente virtual Nine vinculada ao registro de "' +
              convidadoNome +
              '".',
          )
          auditRec.set('registro_afetado', roteiroId)
          auditRec.set('tabela_afetada', 'roteiros_convidados')
          auditRec.set('resultado', 'sucesso')
          auditRec.set('metadata', {
            convidado_nome: convidadoNome,
            origem: 'Assistente Nine',
            tamanho_caracteres: roteiroTexto.length,
          })
          $app.save(auditRec)
        }
      } catch (auditErr) {
        console.log('[Roteiro Assistente] Falha não impeditiva ao registrar auditoria:', auditErr)
      }

      return e.json(200, {
        sucesso: true,
        mensagem: 'Sugestão da Nine vinculada ao registro do convidado com sucesso!',
        convidado: convidadoNome,
        roteiro_id: roteiroId,
      })
    } catch (err) {
      console.log('Erro ao salvar sugestão de roteiro da Nine:', err)
      return e.json(500, {
        error: err.message || 'Erro interno ao salvar a sugestão no registro do roteiro.',
      })
    }
  },
  $apis.requireAuth(),
)
