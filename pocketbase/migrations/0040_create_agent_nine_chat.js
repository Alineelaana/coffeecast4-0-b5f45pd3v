migrate(
  (app) => {
    // 1. Criar usuário de serviço para visitantes anônimos conversarem com o agente nativo
    const users = app.findCollectionByNameOrId('users')
    let visitanteUser = null
    try {
      visitanteUser = app.findAuthRecordByEmail('users', 'visitante@app.local')
    } catch (_) {
      try {
        const rec = new Record(users)
        rec.setEmail('visitante@app.local')
        rec.setPassword($security.randomString(28))
        rec.setVerified(true)
        rec.set('name', 'Visitante CoffeeCast')
        rec.set('role', 'prata')
        rec.set('ativo', true)
        app.save(rec)
        visitanteUser = rec
      } catch (userErr) {
        console.log('Aviso ao criar usuário visitante de serviço:', userErr)
      }
    }

    // 2. Definir Agente Nativo de IA exclusivo para o Chat Público do Site: Nine · Assistente Virtual do CoffeeCast 4.0
    // Manter o agente "roteirista-coffeecast" completamente intacto!
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.define === 'function') {
        $ai.agents.define(app, {
          slug: 'nine-chat',
          name: 'Nine · Assistente Virtual do CoffeeCast 4.0',
          description:
            'Nine é a assistente virtual pública do podcast CoffeeCast 4.0. Tira dúvidas de visitantes sobre o podcast, episódios, integrantes, como participar, formulário de roteiro e contato.',
          systemPrompt:
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
            '   - Como participar como convidado(a) ou enviar história: pode preencher o formulário na página inicial ou ir em /roteiro para enviar as informações do episódio gravado.\n' +
            '   - Roteiro do Convidado: página /roteiro (formulário detalhado para quem vai gravar, com biografia, fotos e autorização de imagem).\n' +
            '   - Deixar um depoimento: página /depoimento (espaço para convidados e ouvintes enviarem seus relatos sobre a experiência no CoffeeCast 4.0).\n' +
            '   - Área do Convidado: página /convidado (guia completo com orientações de estúdio, vestimenta e cronograma).\n' +
            '   - Novos episódios: saem todo sábado às 10h no canal oficial do YouTube.\n' +
            '   - Redes Sociais: Instagram @coffeecast4.0.\n\n' +
            '3. Contato e Produção:\n' +
            '   - Contato comercial e produção com Aline Lana pelo WhatsApp: (31) 99129-7619 ou formulário de contato do site.\n\n' +
            'REGRA CRÍTICA DE OURO:\n' +
            '- Se o visitante perguntar sobre algo que você NÃO sabe com certeza, NÃO invente informações!\n' +
            '- Diga educadamente que não possui esse detalhe e oriente o visitante a falar com a produção diretamente através de Aline Lana pelo WhatsApp (31) 99129-7619 ou pelo formulário de contato do site.',
          tier: 'fast',
          tools: [
            {
              collection: 'episodios',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
            {
              collection: 'integrantes',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
            {
              collection: 'depoimentos',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
            {
              collection: 'conteudo_site',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
          ],
          memory: [
            {
              type: 'text',
              payload: {
                text: 'Sobre o CoffeeCast 4.0: Mais que conversas, histórias que transformam. Encontros gravados em estúdio com café especial sobre empreendedorismo, superação, família e desenvolvimento humano. Apresentado por Aline Lana, com Dayana Ribas, Rosi Lima e Flávia Franco. Novos episódios todo sábado às 10h no YouTube. Páginas principais do site: /convidado (guia do convidado), /roteiro (preenchimento de dados do episódio), /depoimento (deixar depoimento), contato com a produção via Aline Lana (31) 99129-7619.',
              },
            },
            {
              type: 'faq',
              payload: {
                qa: [
                  {
                    question: 'O que é o CoffeeCast 4.0?',
                    answer:
                      'O CoffeeCast 4.0 é um podcast conduzido por Aline Lana com foco em conversas autênticas, inspiradoras e transformadoras à mesa de café, abordando histórias reais de vida, superação e empreendedorismo.',
                  },
                  {
                    question: 'Como posso participar como convidado?',
                    answer:
                      'Você pode preencher o formulário na página inicial do site ou falar com nossa produção. Se já foi convidado(a) e vai gravar, preencha seus dados e fotos na página /roteiro!',
                  },
                  {
                    question: 'Como deixar um depoimento?',
                    answer:
                      'Basta acessar /depoimento no nosso site e compartilhar como foi sua experiência com o CoffeeCast 4.0!',
                  },
                  {
                    question: 'Quem são as integrantes do podcast?',
                    answer:
                      'Nossa equipe conta com Aline Lana (apresentadora), Dayana Ribas, Rosi Lima e Flávia Franco.',
                  },
                ],
              },
            },
          ],
        })
      }
    } catch (agentErr) {
      console.log('Aviso ao criar agente nativo nine-chat:', agentErr)
    }
  },
  (app) => {
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && typeof $ai.agents.delete === 'function') {
        $ai.agents.delete(app, 'nine-chat')
      }
    } catch (_) {}

    try {
      const rec = app.findAuthRecordByEmail('users', 'visitante@app.local')
      if (rec) {
        app.delete(rec)
      }
    } catch (_) {}
  },
)
