// pocketbase/hooks/assistente_roteiro.js
// Geração de roteiros profissionais e pautas refinadas para o podcast CoffeeCast 4.0
// Produzido pela Nine com padrão editorial elevado: norma-padrão rigorosa do português do Brasil,
// estrutura completa de podcast de estúdio, personalização profunda dos dados do convidado e
// respeito irrestrito a temas sensíveis.
// Suporta geração individual E junção de roteiros (múltiplos convidados / casal / parceiros de negócio).
// NOTA IMPORTANTE DO SKIP CLOUD / POCKETBASE: Não usar declarações no topo do arquivo compartilhadas entre callbacks.
// Todas as funções auxiliares e variáveis devem ser declaradas dentro do escopo de cada routerAdd callback.

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

      const parseDadosConvidado = function (rec) {
        const nome = (rec.getString('nome') || 'Convidado(a)').trim()
        const dataNascimento = (rec.getString('data_nascimento') || '').trim()
        const estadoCivil = (rec.getString('estado_civil') || '').trim()
        const temConjuge = rec.getBool('tem_conjuge')
        const nomeConjuge = (rec.getString('nome_conjuge') || '').trim()
        const temFilhos = rec.getBool('tem_filhos')
        const quantidadeFilhos = (rec.getString('quantidade_filhos') || '').trim()
        const nomesFilhos = (rec.getString('nomes_filhos') || '').trim()
        const temEmpresa = rec.getBool('tem_empresa')
        const nomeEmpresa = (rec.getString('nome_empresa') || '').trim()
        const sobreEmpresa = (rec.getString('sobre_empresa') || '').trim()
        const temaEnfatizar =
          (rec.getString('tema_enfatizar') || '').trim() ||
          'Trajetória de vida, propósito, superação e legado profissional'
        const temTemaSensivel = rec.getBool('tem_tema_sensivel')
        const temaSensivelDetalhes = (rec.getString('tema_sensivel_detalhes') || '').trim()
        const biografia = (rec.getString('biografia') || '').trim()

        const infoConjuge =
          temConjuge && nomeConjuge
            ? 'Sim (' + nomeConjuge + ')'
            : temConjuge
              ? 'Sim'
              : 'Não informado / Não possui'

        let infoFilhos = 'Não'
        if (temFilhos) {
          infoFilhos = 'Sim'
          if (quantidadeFilhos) infoFilhos += ' (' + quantidadeFilhos + ' filho(s)'
          if (nomesFilhos) infoFilhos += ' - Nomes: ' + nomesFilhos
          if (quantidadeFilhos) infoFilhos += ')'
        }

        const infoEmpresa = temEmpresa
          ? (nomeEmpresa || 'Sim') + (sobreEmpresa ? ' — Atuação: ' + sobreEmpresa : '')
          : 'Não informado / Não possui'

        const alertaTemaSensivel =
          temTemaSensivel && temaSensivelDetalhes
            ? temaSensivelDetalhes
            : 'Nenhum declarado pelo convidado'

        return {
          id: rec.id,
          nome: nome,
          dataNascimento: dataNascimento,
          estadoCivil: estadoCivil,
          infoConjuge: infoConjuge,
          infoFilhos: infoFilhos,
          infoEmpresa: infoEmpresa,
          temaEnfatizar: temaEnfatizar,
          temTemaSensivel: temTemaSensivel,
          alertaTemaSensivel: alertaTemaSensivel,
          biografia: biografia,
        }
      }

      const body = e.requestInfo().body || {}
      const roteiroId = (body.roteiro_id || '').trim()
      const idsVinculados = Array.isArray(body.roteiros_vinculados_ids)
        ? body.roteiros_vinculados_ids.filter(function (id) {
            return typeof id === 'string' && id.trim().length > 0
          })
        : []

      if (!roteiroId) {
        return e.badRequestError('ID do roteiro principal é obrigatório')
      }

      const roteiroPrincipal = $app.findRecordById('roteiros_convidados', roteiroId)
      if (!roteiroPrincipal) {
        return e.notFoundError('Roteiro principal não encontrado')
      }

      // Buscar todos os registros vinculados
      const listaRecords = [roteiroPrincipal]
      const idsJaAdicionados = {}
      idsJaAdicionados[roteiroId] = true

      for (let i = 0; i < idsVinculados.length; i++) {
        const idSec = idsVinculados[i].trim()
        if (idSec && !idsJaAdicionados[idSec]) {
          try {
            const rec = $app.findRecordById('roteiros_convidados', idSec)
            if (rec) {
              listaRecords.push(rec)
              idsJaAdicionados[idSec] = true
            }
          } catch (findErr) {
            console.log('[assistente_roteiro] Roteiro vinculado não encontrado:', idSec, findErr)
          }
        }
      }

      const ehConjunto = listaRecords.length > 1
      const convidadosDados = []
      for (let j = 0; j < listaRecords.length; j++) {
        convidadosDados.push(parseDadosConvidado(listaRecords[j]))
      }

      const nomesArray = []
      for (let k = 0; k < convidadosDados.length; k++) {
        nomesArray.push(convidadosDados[k].nome)
      }
      const nomesLista = nomesArray.join(' & ')

      // Carregar conhecimentos e treinamento dinâmico da Nine
      let customTreinamento = ''
      let customPromptLivre = ''
      try {
        const globalCfg = $app.findFirstRecordByData('nine_config', 'chave', 'global')
        if (globalCfg) {
          customTreinamento = (globalCfg.getString('prompt_sistema') || '').trim()
          customPromptLivre = (globalCfg.getString('prompt_livre') || '').trim()
        }
      } catch (_) {}

      // Alertas de temas sensíveis consolidados
      const alertasSensiveisTodos = []
      for (let m = 0; m < convidadosDados.length; m++) {
        const cItem = convidadosDados[m]
        if (cItem.temTemaSensivel) {
          alertasSensiveisTodos.push('• ' + cItem.nome + ': ' + cItem.alertaTemaSensivel)
        }
      }
      const textoAlertaSensivelConsolidado =
        alertasSensiveisTodos.length > 0
          ? alertasSensiveisTodos.join('\n')
          : 'Nenhum declarado pelos convidados'

      // Montagem do Prompt de Sistema da Nine
      let systemPromptRoteiro = ''
      if (ehConjunto) {
        systemPromptRoteiro = [
          'Você é a Nine, a roteirista-chefe e assistente virtual oficial do podcast CoffeeCast 4.0.',
          '',
          '### SOBRE O COFFEECAST 4.0:',
          '• Slogan oficial: "Mais que conversas, histórias que transformam."',
          '• Apresentadora titular: Aline Lana (@alineelaana) — empresária, mentora, palestrante e idealizadora do CoffeeCast.',
          '• Co-apresentadoras e elenco: Dayana Ribas, Rosi Lima e Flávia Franco.',
          '• Atmosfera e Conceito: Podcast gravado presencialmente em estúdio intimista com mesa de café selecionado. Conversas profundas, acolhedoras, humanas, elegantes e de alto nível, com foco em histórias inspiradoras, mulheres que transformam, empreendedorismo com propósito, superação e família.',
          '• Lema do café: "O café pode até esfriar, mas o papo nunca."',
          '',
          '### MISSÃO ESPECIAL: ROTEIRO CONJUNTO DE ESTÚDIO (EPISÓDIO MULTI-CONVIDADOS / CASAL / PARCERIA)',
          'Você está criando UM ÚNICO ROTEIRO OFICIAL DE EPISÓDIO para os convidados reunidos: ' +
            nomesLista +
            '.',
          'ATENÇÃO: NÃO crie roteiros separados por pessoa! O objetivo é um único episódio fluido, harmônico e colaborativo.',
          'Entrelaçar as trajetórias dos convidados com sensibilidade:',
          '• Explore a história individual de cada um, mas valorize intensamente o encontro, a sinergia, os contrastes complementares e a história construída juntos (como casal, sócios, parceiros ou coautores de uma mesma jornada).',
          '• Em cada bloco, equilibre perguntas dirigidas a cada convidado especificamente E perguntas dinâmicas de troca mútua entre eles na mesa.',
          '',
          '### EXIGÊNCIAS RIGOROSAS DE REDAÇÃO E LÍNGUA PORTUGUESA (OBRIGATÓRIO):',
          '1. NORMA-PADRÃO IMPECÁVEL: Escreva em Português do Brasil na norma culta padrão (Acordo Ortográfico vigente). Revise mentalmente cada frase para que NÃO HAJA NENHUM ERRO de concordância nominal, verbal, regência, crase, pontuação, acentuação ou grafia.',
          '2. PROSA NATURAL E REFINADA: Fuja de clichês robóticos ou jargões vazios. O texto deve soar elegante, poético, caloroso e pronto para ser falado com naturalidade por Aline Lana.',
          '3. PONTUAÇÃO E RITMO: Use vírgulas, pontos e travessões para dar ritmo à fala da apresentadora.',
          '4. RESPEITO ABSOLUTO A TEMAS SENSÍVEIS (BLOQUEIO TOTAL): Se houver qualquer tema sensível informado por qualquer um dos convidados, JAMAIS mencione ou tangencie esses assuntos.',
          '',
          '### ESTRUTURA OFICIAL OBRIGATÓRIA DO ROTEIRO CONJUNTO (EM MARKDOWN):',
          '1. **CABEÇALHO EDITORIAL DO EPISÓDIO**',
          '   - Convidados da Edição: ' + nomesLista,
          '   - Tema Central da Conversa Conjunta',
          '   - Tom e Atmosfera Sugeridos',
          '   - Alertas Editoriais de Bastidores e Temas Sensíveis (se houver)',
          '',
          '2. **RESUMO DE APRESENTAÇÃO (BIO DE ABERTURA CONJUNTA PARA ALINE LANA)**',
          '   - Texto marcante, poético e acolhedor (6 a 8 linhas) escrito em primeira pessoa da apresentadora Aline Lana apresentando os convidados, sua cumplicidade e o brilho da sua história compartilhada à mesa de café.',
          '',
          '3. **PONTOS FORTES & SINERGIA DO ENCONTRO**',
          '   - Tópicos destacando o que torna essa conversa a dois/múltipla imperdível para a audiência (a química, os aprendizados complementares, o legado conjunto).',
          '',
          '4. **ROTEIRO ESTRUTURADO EM 4 BLOCOS COM PERGUNTAS DE ALTO NÍVEL**',
          '   (Cada pergunta deve indicar claramente a quem se dirige — ex.: "[Para ambos]", "[Para Convidado 1]", "[Para Convidado 2]", "[Troca entre eles]"):',
          '   - **BLOCO 1: Raízes, Origens e o Ponto de Encontro** (3 a 4 perguntas sobre as origens individuais de cada um e o momento em que seus caminhos se cruzaram).',
          '   - **BLOCO 2: A Virada de Chave, Desafios e Dinâmica da Parceria** (3 a 4 perguntas sobre como lidam com desafios, família, conciliação e decisões difíceis juntos).',
          '   - **BLOCO 3: O Ponto Alto — Propósito Compartilhado e Transformação** (3 a 4 perguntas aprofundadas focadas nos temas centrais solicitados e na área de impacto de ambos).',
          '   - **BLOCO 4: Bate-Bola com Café & Mensagem Final Inspiradora** (perguntas rápidas e afetivas de resposta curta para ambos, finalizando com a pergunta de assinatura do CoffeeCast: *"Para vocês, o que é transformar histórias?"* com resposta de cada um).',
          '',
          '5. **ORIENTAÇÕES DE BASTIDORES PARA A PRODUÇÃO**',
          '   - 2 ou 3 notas práticas de condução para o estúdio acolher os múltiplos convidados com excelência.',
        ].join('\n')
      } else {
        systemPromptRoteiro = [
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
          '1. NORMA-PADRÃO IMPECÁVEL: Escreva em Português do Brasil na norma culta padrão (Acordo Ortográfico vigente). Revise mentalmente cada frase para que NÃO HAJA NENHUM ERRO de concordância nominal, verbal, regência, crase, pontuação, acentuação ou grafia.',
          '2. PROSA NATURAL E REFINADA: Fuja de clichês robóticos ou jargões vazios. O texto deve soar elegante, límpido, acolhedor e pronto para ser falado com naturalidade por Aline Lana.',
          '3. PONTUAÇÃO E RITMO: Use vírgulas, pontos e travessões para dar ritmo à fala da apresentadora.',
          '4. REGRA CRÍTICA DE OURO — TEMAS SENSÍVEIS (BLOQUEIO TOTAL): Se houver qualquer tema sensível informado, JAMAIS mencione ou tangencie esses assuntos.',
          '',
          '### ESTRUTURA PADRÃO OBRIGATÓRIA DO ROTEIRO (FORMATADA EM MARKDOWN):',
          '1. **CABEÇALHO EDITORIAL DO EPISÓDIO**',
          '2. **RESUMO DE APRESENTAÇÃO (BIO DE ABERTURA PARA ALINE LANA LER NO MICROFONE)** (4 a 6 linhas marcantes)',
          '3. **PONTOS FORTES & CONEXÃO EMOCIONAL DO EPISÓDIO**',
          '4. **ROTEIRO ESTRUTURADO EM 4 BLOCOS COM PERGUNTAS DE ALTO NÍVEL**:',
          '   - **BLOCO 1: Raízes, Memórias e os Primeiros Passos**',
          '   - **BLOCO 2: A Virada de Chave, Desafios e Família**',
          '   - **BLOCO 3: O Ponto Alto — Propósito e Transformação**',
          '   - **BLOCO 4: Bate-Bola com Café & Mensagem Final Inspiradora** (finalizando com a pergunta de assinatura da marca: *"Para você, o que é transformar histórias?"*)',
          '5. **ORIENTAÇÕES DE BASTIDORES PARA A PRODUÇÃO**',
        ].join('\n')
      }

      // Montagem da mensagem com os dados dos convidados
      const blocosFichas = []
      for (let n = 0; n < convidadosDados.length; n++) {
        const c = convidadosDados[n]
        const headerFicha = ehConjunto
          ? '=== FICHA DE PRÉ-GRAVAÇÃO DO(A) CONVIDADO(A) ' + (n + 1) + ' (' + c.nome + ') ==='
          : '=== FICHA DE PRÉ-GRAVAÇÃO DO(A) CONVIDADO(A) ==='
        blocosFichas.push(
          [
            headerFicha,
            '- Nome Completo: ' + c.nome,
            '- Data de Nascimento: ' + (c.dataNascimento || 'Não informada'),
            '- Estado Civil: ' + (c.estadoCivil || 'Não informado'),
            '- Cônjuge: ' + c.infoConjuge,
            '- Filhos: ' + c.infoFilhos,
            '- Empresa / Atuação: ' + c.infoEmpresa,
            '- Tema Desejado para Enfatizar: ' + c.temaEnfatizar,
            '- Temas Sensíveis a EVITAR: ' + c.alertaTemaSensivel,
            '- Biografia / Trajetória Enviada: ' + (c.biografia || 'Não informada'),
          ].join('\n'),
        )
      }

      const userMessage = [
        ehConjunto
          ? 'Por favor, Nine, elabore UM ROTEIRO ÚNICO, COMPLETO E OFICIAL para este episódio conjunto com ' +
            nomesLista +
            ':'
          : 'Por favor, Nine, elabore um roteiro completo, impecável e inspirador para a gravação do seguinte episódio:',
        '',
        blocosFichas.join('\n\n'),
        '',
        ehConjunto
          ? '=== SÍNTESE DE TEMAS SENSÍVEIS (BLOQUEIO ABSOLUTO) ===\n' +
            textoAlertaSensivelConsolidado +
            '\n'
          : '',
        customTreinamento
          ? '[DIRETRIZES DE PERSONALIDADE DA NINE CADASTRADAS PELA DIREÇÃO]:\n' +
            customTreinamento.slice(0, 1200) +
            '\n'
          : '',
        customPromptLivre
          ? '[ORIENTAÇÕES ADICIONAIS DA BASE DE CONHECIMENTO]:\n' +
            customPromptLivre.slice(0, 800) +
            '\n'
          : '',
        'Lembre-se: qualidade gramatical impecável no português do Brasil, acolhimento, respeito estrito aos temas sensíveis e perguntas profundas que entrelaçam as vivências.',
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
            message: systemPromptRoteiro + '\n\n====================\n\n' + userMessage,
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

      // Tentativa 2: Fallback via $ai.chat
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

      const roteirosProcessadosRes = []
      for (let p = 0; p < convidadosDados.length; p++) {
        roteirosProcessadosRes.push({ id: convidadosDados[p].id, nome: convidadosDados[p].nome })
      }

      return e.json(200, {
        sucesso: true,
        agenteUsado: agenteUsado,
        convidado: nomesLista,
        ehConjunto: ehConjunto,
        totalConvidados: convidadosDados.length,
        roteirosProcessados: roteirosProcessadosRes,
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

// Endpoint administrativo para salvar a sugestão da Nine diretamente no registro do roteiro principal
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
          'Acesso restrito a administradores Master, Gerencial e ADM autorizados.',
        )
      }

      const body = e.requestInfo().body || {}
      const roteiroId = (body.roteiro_id || '').trim()
      const roteiroTexto = (body.roteiro_texto || '').trim()
      const idsVinculados = Array.isArray(body.roteiros_vinculados_ids)
        ? body.roteiros_vinculados_ids.filter(function (id) {
            return typeof id === 'string' && id.trim().length > 0
          })
        : []
      const tituloConjunto = (body.roteiro_conjunto_titulo || '').trim()

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

      // Atualizar o registro principal com o roteiro da Nine e a lista de roteiros vinculados
      roteiroRecord.set('roteiro_final_texto', roteiroTexto)

      if (idsVinculados.length > 0) {
        roteiroRecord.set('roteiros_vinculados_ids', idsVinculados)
      }
      if (tituloConjunto) {
        roteiroRecord.set('roteiro_conjunto_titulo', tituloConjunto)
      }

      $app.save(roteiroRecord)

      // Coletar nomes dos convidados vinculados para auditoria precisa
      const nomesVinculados = [convidadoNome]
      for (let i = 0; i < idsVinculados.length; i++) {
        try {
          const vincRec = $app.findRecordById('roteiros_convidados', idsVinculados[i])
          if (vincRec) {
            nomesVinculados.push(vincRec.getString('nome') || idsVinculados[i])
          }
        } catch (_) {}
      }

      const ehConjunto = idsVinculados.length > 0
      const descricaoAudit = ehConjunto
        ? 'Junção de roteiros realizada com sucesso para o episódio de [' +
          nomesVinculados.join(' & ') +
          ']. Roteiro oficial conjunto estruturado pela Nine salvo no registro principal (' +
          roteiroId +
          ').'
        : 'Sugestão de roteiro da assistente virtual Nine vinculada ao registro de "' +
          convidadoNome +
          '".'

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
          auditRec.set('descricao', descricaoAudit)
          auditRec.set('registro_afetado', roteiroId)
          auditRec.set('tabela_afetada', 'roteiros_convidados')
          auditRec.set('resultado', 'sucesso')
          auditRec.set('metadata', {
            convidado_principal: convidadoNome,
            convidados_todos: nomesVinculados,
            roteiro_principal_id: roteiroId,
            roteiros_vinculados_ids: idsVinculados,
            eh_juncao_roteiros: ehConjunto,
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
        mensagem: ehConjunto
          ? 'Roteiro conjunto de ' + nomesVinculados.join(' & ') + ' salvo no registro com sucesso!'
          : 'Sugestão da Nine vinculada ao registro de ' + convidadoNome + ' com sucesso!',
        convidado: convidadoNome,
        convidados_reunidos: nomesVinculados,
        roteiro_id: roteiroId,
        eh_conjunto: ehConjunto,
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
