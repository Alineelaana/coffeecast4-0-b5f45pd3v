migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Garantir ou atualizar senha do usuário Master alineelaana@gmail.com
    try {
      const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'alineelaana@gmail.com')
      adminUser.setPassword('alineelaana4')
      adminUser.setVerified(true)
      adminUser.set('role', 'master')
      adminUser.set('ativo', true)
      adminUser.set('name', 'Aline Lana')
      app.save(adminUser)
    } catch (_) {
      try {
        const record = new Record(users)
        record.setEmail('alineelaana@gmail.com')
        record.setPassword('alineelaana4')
        record.setVerified(true)
        record.set('name', 'Aline Lana')
        record.set('role', 'master')
        record.set('ativo', true)
        app.save(record)
      } catch (e) {
        console.log('Erro ao criar usuário master:', e)
      }
    }

    // 2. Garantir conteúdo textual oficial em conteudo_site
    const conteudoCol = app.findCollectionByNameOrId('conteudo_site')
    const seedConteudos = [
      {
        chave: 'missao',
        valor:
          'Criar um espaço de conversas autênticas, leves e inspiradoras, onde histórias, experiências e diferentes perspectivas possam gerar conexão, conhecimento, reflexão e transformação.',
      },
      {
        chave: 'visao',
        valor:
          'Tornar o CoffeeCast 4.0 uma marca de conteúdo reconhecida por dar voz a histórias que inspiram, aproximar pessoas e transformar boas conversas em experiências que permanecem.',
      },
      {
        chave: 'valores',
        valor:
          'Autenticidade, respeito, conexão, acolhimento, diversidade de ideias, inspiração, aprendizado, leveza, propósito e valorização das histórias e das pessoas.',
      },
      {
        chave: 'contato_comercial',
        valor: 'Aline Lana / WhatsApp: (31) 99129-7619',
      },
      {
        chave: 'proposito',
        valor:
          'Criar conversas com significado, valorizar histórias humanas e transformar encontros em conteúdo que permanece. No CoffeeCast 4.0, cada voz encontra acolhimento para inspirar novas possibilidades.',
      },
      {
        chave: 'form_titulo',
        valor: 'Preencha o formulário se você tem interesse em participar do nosso podcast.',
      },
      {
        chave: 'form_sucesso_msg',
        valor:
          'Obrigada pelo seu contato! Nossa equipe retornará o mais breve possível, porque aqui o café pode até esfriar, mas o papo nunca! ☕️',
      },
      {
        chave: 'rodape_creditos',
        valor:
          'Site criado e gerenciado por SAF TECNOLOGIA E GESTAO LTDA — CNPJ 65.768.215/0001-00',
      },
    ]

    for (let i = 0; i < seedConteudos.length; i++) {
      const item = seedConteudos[i]
      try {
        const existing = app.findFirstRecordByData('conteudo_site', 'chave', item.chave)
        existing.set('valor', item.valor)
        app.save(existing)
      } catch (_) {
        const rec = new Record(conteudoCol)
        rec.set('chave', item.chave)
        rec.set('valor', item.valor)
        app.save(rec)
      }
    }

    // 3. Garantir as 4 integrantes do CoffeeCast 4.0
    const integrantesCol = app.findCollectionByNameOrId('integrantes')
    const countIntegrantes = app.countRecords('integrantes')
    if (countIntegrantes < 4) {
      const quatroIntegrantes = [
        {
          nome: 'Aline Lana',
          ordem: 1,
          biografia:
            'Idealizadora, comunicadora e anfitriã do CoffeeCast 4.0. Apaixonada por histórias femininas que transformam, aproxima pessoas com escuta calorosa, propósito e autenticidade.',
        },
        {
          nome: 'Marina Duarte',
          ordem: 2,
          biografia:
            'Co-apresentadora e jornalista. Com sensibilidade investigativa e afeto, traz à tona nuances, trajetórias inspiradoras e reflexões que marcam cada episódio.',
        },
        {
          nome: 'Camila Nogueira',
          ordem: 3,
          biografia:
            'Co-apresentadora e empreendedora. Acredita no poder do diálogo como ferramenta de acolhimento e emancipação, criando pontes entre negócios e vidas reais.',
        },
        {
          nome: 'Renata Campos',
          ordem: 4,
          biografia:
            'Co-apresentadora e estrategista de narrativas. Cuida para que cada gravação seja um encontro inesquecível, unindo leveza, profundidade e aprendizados perenes.',
        },
      ]

      for (let i = 0; i < quatroIntegrantes.length; i++) {
        const it = quatroIntegrantes[i]
        try {
          app.findFirstRecordByData('integrantes', 'nome', it.nome)
        } catch (_) {
          const rec = new Record(integrantesCol)
          rec.set('nome', it.nome)
          rec.set('ordem', it.ordem)
          rec.set('biografia', it.biografia)
          app.save(rec)
        }
      }
    }

    // 4. Garantir transações e agenda se ainda não houver
    const countTransacoes = app.countRecords('transacoes')
    if (countTransacoes === 0) {
      const transacoesCol = app.findCollectionByNameOrId('transacoes')
      const t1 = new Record(transacoesCol)
      t1.set('descricao', 'Pagamento de horas de gravação - Estúdio Áudio 4.0')
      t1.set('tipo', 'gravacao')
      t1.set('valor', 650)
      t1.set('data_vencimento', '2026-10-15')
      t1.set('situacao', 'quitado')
      app.save(t1)

      const t2 = new Record(transacoesCol)
      t2.set('descricao', 'Edição profissional de áudio e cortes de vídeo para Reels/YouTube')
      t2.set('tipo', 'edicao')
      t2.set('valor', 850)
      t2.set('data_vencimento', '2026-10-25')
      t2.set('situacao', 'em_aberto')
      app.save(t2)
    }

    const countAgenda = app.countRecords('agenda')
    if (countAgenda === 0) {
      const agendaCol = app.findCollectionByNameOrId('agenda')
      const ag1 = new Record(agendaCol)
      ag1.set('titulo', 'Episódio Especial: Liderança Feminina e Propósito Real')
      ag1.set(
        'roteiro',
        'Bloco 1: Abertura e café de boas-vindas. Bloco 2: Primeiros passos e vulnerabilidade. Bloco 3: Superação de barreiras. Bloco 4: Mensagem final para quem quer empreender com alma.',
      )
      ag1.set('data_agendamento', '2026-10-05')
      ag1.set('data_gravacao', '2026-10-12')
      ag1.set('data_postagem', '2026-10-18')
      ag1.set('tem_convidado', true)
      ag1.set('nome_convidado', 'Dra. Gabriela Fontes')
      ag1.set(
        'biografia_convidado',
        'Médica, mentora de saúde integral feminina e fundadora do Instituto Renascer.',
      )
      ag1.set('empresa', 'Instituto Renascer')
      ag1.set('patrocinado', true)
      ag1.set('patrocinadores', 'Cafés Especiais da Mantiqueira & Flor de Lis Joias')
      app.save(ag1)
    }
  },
  (app) => {
    // Rollback logic if needed
  },
)
