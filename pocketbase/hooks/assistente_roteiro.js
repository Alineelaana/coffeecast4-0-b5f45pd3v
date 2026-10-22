// pocketbase/hooks/assistente_roteiro.js
// Geração de roteiros profissionais e pautas refinadas para o podcast CoffeeCast 4.0
// Produzido pela Nine com padrão editorial de excelência: modelo de referência Grasiele Scorsatto & Márcio Azevedo (Orvex).
// Atua como roteirista-chefe e produtora editorial experiente em entrevistas, storytelling, comunicação e podcasts.
// Suporta episódios individuais, casais/múltiplos convidados e episódios sem convidados.
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

      const semConvidados = body.sem_convidados === true || roteiroId === 'sem_convidados'

      let roteiroPrincipal = null
      const listaRecords = []

      if (!semConvidados) {
        if (!roteiroId) {
          return e.badRequestError('ID do roteiro principal é obrigatório')
        }
        roteiroPrincipal = $app.findRecordById('roteiros_convidados', roteiroId)
        if (!roteiroPrincipal) {
          return e.notFoundError('Roteiro principal não encontrado')
        }
        listaRecords.push(roteiroPrincipal)

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
      const nomesLista =
        nomesArray.length > 0 ? nomesArray.join(' & ') : 'Episódio Especial Entre Apresentadoras'

      // Carregar configurações dinâmicas da Nine
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

      // PROMPT EDITORIAL MESTRE DA NINE BASEADO NO MODELO DE GRAZI E MÁRCIO
      const diretrizesEditoriaisMestre = [
        'Você é a Nine, a roteirista-chefe e produtora editorial sênior do CoffeeCast 4.0.',
        'Sua referência oficial de excelência editorial, tom, elegância, estrutura e organização é o ROTEIRO OFICIAL DE GRASIELE & MÁRCIO (Orvex).',
        '',
        '### IDENTIDADE INSTITUCIONAL DO COFFEECAST 4.0:',
        '• Slogan oficial: "Mais que conversas, histórias que transformam."',
        '• Apresentadora titular: Aline Lana (@alineelaana) — empresária, mentora, palestrante e idealizadora.',
        '• Co-apresentadoras e elenco: Dayana Ribas, Rosi Lima e Flávia Franco.',
        '• Atmosfera: Estúdio intimista, elegante, acolhedor, com mesa de café selecionado. Conversas profundas, humanas, sofisticadas e que conectam.',
        '• Filosofia: "O café pode até esfriar, mas o papo nunca."',
        '',
        '### PILAR 1: TREINAMENTO EDITORIAL DA NINE (COMPREENSÃO ANTES DA FORMULAÇÃO):',
        '1. Analise cuidadosamente todas as informações dos convidados antes de criar o roteiro:',
        '   - Acontecimentos mais relevantes das trajetórias;',
        '   - Desafios, decisões difíceis e momentos de transformação;',
        '   - Características pessoais que tornam a história única e interessante;',
        '   - Experiências profissionais e resultados concretos;',
        '   - Assuntos que geram identificação e conexão real com o público;',
        '   - Conexões entre história pessoal, família, carreira e temas de impacto;',
        '   - Oportunidades de perguntas emocionantes, reflexivas e com forte potencial para cortes de divulgação.',
        '2. O que é PROIBIDO pela Direção Editorial:',
        '   - Roteiros genéricos, superficiais, repetitivos ou excessivamente poéticos/melodramáticos;',
        '   - Perguntas que apenas reproduzam dados da ficha (ex: "você nasceu em tal ano?");',
        '   - Metáforas forçadas, descrições teatrais de cenários, aromas de café, câmeras ou orientações de bastidores desnecessárias.',
        '3. REGRA DURA DE FIDELIDADE FACTUAL: NÃO INVENTE fatos, cargos, títulos, empresas, conquistas ou informações biográficas não confirmadas.',
        '4. REGRA DE OURO — TEMAS SENSÍVEIS (BLOQUEIO TOTAL): Se houver temas sensíveis informados, NUNCA toque neles.',
        '5. As perguntas devem explorar o que existe POR TRÁS dos acontecimentos: decisões, sentimentos, dificuldades, aprendizados, consequências e transformações.',
        '',
        '### PILAR 2: REGRA RIGOROSA DE FORMATAÇÃO E TEXTO LIMPO (CRÍTICO):',
        'NÃO USE CARACTERES DE MARKDOWN como asteriscos duplos (**), sublinhados (__), cerquilhas (###) ou traços como marcadores de listas.',
        'A formatação visual será aplicada diretamente pela interface da plataforma em negrito real, títulos, cores e tipografia.',
        'Escreva texto límpido, elegante, fluído e gramaticalmente perfeito no Português do Brasil culto e natural.',
        '',
        '### PILAR 3: ESTRUTURA EDITORIAL OBRIGATÓRIA (PADRÃO 60 MINUTOS):',
        'O roteiro total soma 60 minutos (55 minutos de conteúdo estruturado + 5 minutos de respiro para a conversa fluir):',
        '1. TÍTULO DO EPISÓDIO (forte, elegante, conectado à essência — ex: "Duas histórias, um propósito")',
        '2. SUBTÍTULO DO EPISÓDIO (frase de impacto — ex: "O poder de transformar pessoas")',
        '3. ABERTURA (3 MINUTOS): Texto corrido escrito em parágrafos para leitura natural e calorosa pelas apresentadoras. Apresenta os convidados, sua história, relevância e introduz a conversa.',
        '4. BLOCO 01 (8 MINUTOS): Origens, história pessoal, raízes e experiências formadoras. (Em casais/parcerias: o momento em que se conheceram).',
        '5. BLOCO 02 (8 MINUTOS): Casamento, família, desafios, escolhas e momentos decisivos da trajetória.',
        '6. BLOCO 03 (12 MINUTOS): O projeto profissional / empresa como propósito (a virada de chave, missão, desafios e conquistas práticas).',
        '7. BLOCO 04 (10 MINUTOS): Liderança, conhecimento prático e desafios contemporâneos (conteúdo útil para o público / conselhos práticos).',
        '8. BLOCO 05 (5 MINUTOS): Perspectivas, sonhos e o que ainda pretendem construir.',
        '9. BLOCO 06 (5 MINUTOS): Bate-bola dinâmico e personalizado com perguntas de resposta rápida, descontraído e intimista.',
        '10. BLOCO 07 (4 MINUTOS): Encerramento com pergunta marcante de LEGADO e reflexão final transformadora para o ouvinte.',
        '11. RESUMO DE TEMPO FINAL: "Duração: 55 minutos de roteiro + 5 minutos para a conversa fluir naturalmente = 60 minutos."',
        '12. PERGUNTAS COMPLEMENTARES OPCIONAIS: Quando couber uma pergunta opcional profunda, identifique com o prefixo exato "Se houver espaço:".',
        '13. NUMERAÇÃO DAS PERGUNTAS: Numere sequencialmente as perguntas em dois dígitos com ponto (01., 02., 03., ..., 18.).',
      ].join('\n')

      let systemPromptEspecifico = ''

      if (semConvidados) {
        systemPromptEspecifico = [
          diretrizesEditoriaisMestre,
          '',
          '### ADAPTAÇÃO PARA EPISÓDIO SEM CONVIDADOS (ENTRE APRESENTADORAS):',
          '• Condução fluida e cúmplice entre Aline Lana e as co-apresentadoras Dayana Ribas, Rosi Lima e Flávia Franco.',
          '• Não crie perguntas artificiais para convidados inexistentes.',
          '• Estruture tópicos de conversa profunda, reflexões, aprendizados da bancada e bate-bola entre as apresentadoras.',
        ].join('\n')
      } else if (ehConjunto) {
        systemPromptEspecifico = [
          diretrizesEditoriaisMestre,
          '',
          '### DIRETRIZES DE ROTEIRO CONJUNTO (CASAL / MÚLTIPLOS CONVIDADOS):',
          '• Convidados reunidos: ' + nomesLista,
          '• Distribua as perguntas equilibradamente entre eles:',
          '  - Perguntas individuais que valorizam a trajetória de cada um (identifique no início da pergunta: "01. NomeDoConvidado: ...")',
          '  - Perguntas conjuntas e de troca mútua (identifique: "Para os dois: ..." ou "Para ambos: ...")',
          '• Construa a narrativa do encontro, cumplicidade, complementariedade e o propósito construído a dois.',
        ].join('\n')
      } else {
        systemPromptEspecifico = [
          diretrizesEditoriaisMestre,
          '',
          '### DIRETRIZES DE ROTEIRO INDIVIDUAL:',
          '• Convidado(a): ' + nomesLista,
          '• Conecte a infância, carreira, momento de virada, diferenciais do negócio e legado que deseja deixar no mundo.',
        ].join('\n')
      }

      // Montagem dos dados de entrada
      const blocosFichas = []
      for (let n = 0; n < convidadosDados.length; n++) {
        const c = convidadosDados[n]
        const headerFicha = ehConjunto
          ? '=== FICHA DO(A) CONVIDADO(A) ' + (n + 1) + ': ' + c.nome + ' ==='
          : '=== FICHA DO(A) CONVIDADO(A): ' + c.nome + ' ==='
        blocosFichas.push(
          [
            headerFicha,
            'Nome Completo: ' + c.nome,
            'Data de Nascimento: ' + (c.dataNascimento || 'Não informada'),
            'Estado Civil: ' + (c.estadoCivil || 'Não informado'),
            'Cônjuge: ' + c.infoConjuge,
            'Filhos: ' + c.infoFilhos,
            'Empresa / Atuação: ' + c.infoEmpresa,
            'Tema Desejado para Enfatizar: ' + c.temaEnfatizar,
            'Temas Sensíveis a EVITAR: ' + c.alertaTemaSensivel,
            'Biografia e Trajetória Enviada: ' + (c.biografia || 'Não informada'),
          ].join('\n'),
        )
      }

      const userMessage = [
        semConvidados
          ? 'Nine, elabore o roteiro completo oficial de estúdio de 60 minutos para este episódio especial de mesa redonda entre as apresentadoras do CoffeeCast 4.0:'
          : ehConjunto
            ? 'Nine, por favor elabore o roteiro conjunto oficial de estúdio de 60 minutos com excelência editorial máxima para ' +
              nomesLista +
              ', seguindo a referência de qualidade de Grazi e Márcio:'
            : 'Nine, por favor elabore o roteiro oficial de estúdio de 60 minutos com excelência editorial máxima para ' +
              nomesLista +
              ', seguindo a referência de qualidade de Grazi e Márcio:',
        '',
        blocosFichas.length > 0
          ? blocosFichas.join('\n\n')
          : 'Tema livre da bancada: conversas que transformam, liderança feminina e negócios.',
        '',
        alertasSensiveisTodos.length > 0
          ? '=== ATENÇÃO ABSOLUTA DA PRODUÇÃO AOS TEMAS SENSÍVEIS (BLOQUEIO) ===\n' +
            textoAlertaSensivelConsolidado +
            '\n'
          : '',
        customTreinamento
          ? '[TREINAMENTO ADICIONAL DA DIREÇÃO]:\n' + customTreinamento.slice(0, 1000) + '\n'
          : '',
        customPromptLivre
          ? '[NOTAS DA BASE DE CONHECIMENTO]:\n' + customPromptLivre.slice(0, 800) + '\n'
          : '',
        'Lembre-se: NÃO use símbolos de markdown como **, __ ou listas com hifens. Escreva texto limpo, perguntas inteligentes que vão além do óbvio, abertura e encerramento com legado, estrutura de 7 blocos e bate-bola.',
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
            message: systemPromptEspecifico + '\n\n====================\n\n' + userMessage,
          })
          if (agentResult && agentResult.content && agentResult.content.trim().length > 150) {
            resultadoTexto = agentResult.content.trim()
            agenteUsado = 'native-agent'
          }
        } catch (agentChatErr) {
          console.log(
            '[assistente_roteiro] Falha ao acionar $ai.agent, fallback via $ai.chat:',
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
                content: systemPromptEspecifico,
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

      // Limpeza de segurança extra: remover eventuais resíduos de markdown asteriscos e sublinhados se o LLM colocou
      resultadoTexto = resultadoTexto
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/^###?\s+/gm, '')
        .replace(/^[-*•]\s+/gm, '')

      const roteirosProcessadosRes = []
      for (let p = 0; p < convidadosDados.length; p++) {
        roteirosProcessadosRes.push({ id: convidadosDados[p].id, nome: convidadosDados[p].nome })
      }

      return e.json(200, {
        sucesso: true,
        agenteUsado: agenteUsado,
        convidado: nomesLista,
        ehConjunto: ehConjunto,
        semConvidados: semConvidados,
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

// Endpoint administrativo para salvar o roteiro editado e estruturado
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
      const statusAprovacao = (body.status_aprovacao || 'rascunho').trim()
      const roteiroEstruturado = body.roteiro_estruturado || null
      const dataGravacao = (body.data_gravacao || '').trim()
      const horarioGravacao = (body.horario_gravacao || '').trim()
      const subtituloEpisodio = (body.subtitulo_episodio || '').trim()
      const empresaCargo = (body.empresa_cargo_personalizado || '').trim()
      const enderecoPersonalizado = (body.endereco_personalizado || '').trim()
      const linkGpsPersonalizado = (body.link_gps_personalizado || '').trim()

      if (!roteiroId) {
        return e.badRequestError('ID do roteiro é obrigatório')
      }

      if (!roteiroTexto && !roteiroEstruturado) {
        return e.badRequestError('O texto ou os blocos do roteiro não podem estar vazios.')
      }

      const roteiroRecord = $app.findRecordById('roteiros_convidados', roteiroId)
      if (!roteiroRecord) {
        return e.notFoundError('Registro de roteiro não encontrado')
      }

      const convidadoNome = roteiroRecord.getString('nome') || 'Convidado(a)'

      if (roteiroTexto) {
        roteiroRecord.set('roteiro_final_texto', roteiroTexto)
      }
      if (statusAprovacao) {
        roteiroRecord.set('status_aprovacao', statusAprovacao)
      }
      if (roteiroEstruturado) {
        roteiroRecord.set('roteiro_estruturado', roteiroEstruturado)
      }
      if (dataGravacao) {
        roteiroRecord.set('data_gravacao', dataGravacao)
      }
      if (horarioGravacao) {
        roteiroRecord.set('horario_gravacao', horarioGravacao)
      }
      if (subtituloEpisodio) {
        roteiroRecord.set('subtitulo_episodio', subtituloEpisodio)
      }
      if (empresaCargo) {
        roteiroRecord.set('empresa_cargo_personalizado', empresaCargo)
      }
      if (enderecoPersonalizado) {
        roteiroRecord.set('endereco_personalizado', enderecoPersonalizado)
      }
      if (linkGpsPersonalizado) {
        roteiroRecord.set('link_gps_personalizado', linkGpsPersonalizado)
      }

      if (idsVinculados.length > 0) {
        roteiroRecord.set('roteiros_vinculados_ids', idsVinculados)
      }
      if (tituloConjunto) {
        roteiroRecord.set('roteiro_conjunto_titulo', tituloConjunto)
      }

      $app.save(roteiroRecord)

      // Registrar auditoria
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
            'Roteiro editorial atualizado/aprovado para "' +
              convidadoNome +
              '" (Status: ' +
              statusAprovacao +
              ').',
          )
          auditRec.set('registro_afetado', roteiroId)
          auditRec.set('tabela_afetada', 'roteiros_convidados')
          auditRec.set('resultado', 'sucesso')
          auditRec.set('metadata', {
            convidado_principal: convidadoNome,
            roteiro_principal_id: roteiroId,
            status_aprovacao: statusAprovacao,
            tem_estrutura_blocos: Boolean(roteiroEstruturado),
            data_gravacao: dataGravacao || null,
            horario_gravacao: horarioGravacao || null,
          })
          $app.save(auditRec)
        }
      } catch (auditErr) {
        console.log('[Roteiro Assistente] Falha não impeditiva na auditoria:', auditErr)
      }

      return e.json(200, {
        sucesso: true,
        mensagem: 'Roteiro salvo com sucesso!',
        convidado: convidadoNome,
        roteiro_id: roteiroId,
        status_aprovacao: statusAprovacao,
      })
    } catch (err) {
      console.log('Erro ao salvar roteiro:', err)
      return e.json(500, {
        error: err.message || 'Erro interno ao salvar roteiro.',
      })
    }
  },
  $apis.requireAuth(),
)
