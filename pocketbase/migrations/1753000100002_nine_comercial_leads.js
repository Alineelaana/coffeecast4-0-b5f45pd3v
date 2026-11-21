// pocketbase/migrations/1753000100002_nine_comercial_leads.js
// Nine IA COMERCIAL (CoffeeCast 4.0) — numeração por timestamp (ordinais "009x" não são aceitos).
// 1. Campos comerciais na coleção `contatos` (leads captados pela Nine + qualificação).
// 2. Coleção `nine_tarefas` (tarefas internas de retorno — regra staff).
// 3. 10 seeds institucionais idempotentes em `nine_conhecimento` (por título),
//    incluindo o LINK MANUAL do WhatsApp da Aline (nunca envio automático).

const REGRA_STAFF =
  '@request.auth.role = "master" || @request.auth.role = "gerencial" || @request.auth.role = "adm"'

function adicionarSeFaltando(collection, field) {
  const jaTem = collection.fields.find(function (f) {
    return f.name === field.name
  })
  if (!jaTem) {
    collection.fields.add(field)
  }
}

function garantirAutodates(collection) {
  const tem = function (nome) {
    return !!collection.fields.find(function (f) {
      return f.name === nome
    })
  }
  if (!tem('created')) {
    collection.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
  }
  if (!tem('updated')) {
    collection.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
  }
}

function garantirRegrasStaff(collection) {
  collection.listRule = REGRA_STAFF
  collection.viewRule = REGRA_STAFF
  collection.createRule = REGRA_STAFF
  collection.updateRule = REGRA_STAFF
  collection.deleteRule = REGRA_STAFF
}

const SEEDS_CONHECIMENTO = [
  {
    tipo: 'institucional',
    titulo: 'Nine — Quem somos (CoffeeCast 4.0)',
    categoria: 'Institucional',
    ordem: 1,
    conteudo:
      'O CoffeeCast 4.0 é um podcast com o lema "Mais que conversas, histórias que transformam". ' +
      'Recebe convidados com histórias reais de superação e transformação, gravados em estúdio próprio, ' +
      'com episódios publicados no canal oficial do YouTube (@coffeecast4.0) e presença no Instagram @coffeecast4.0. ' +
      'A produção e o contato comercial são da Aline Lana.',
  },
  {
    tipo: 'faq',
    titulo: 'Nine — Como participar do podcast como convidado',
    categoria: 'Participação',
    ordem: 2,
    conteudo:
      'Quem deseja participar como convidado deve registrar o interesse: pelo chat com a Nine (nome, WhatsApp e e-mail) ' +
      'ou pelo formulário de inscrição da página inicial. O interesse fica registrado para a produção, e a Aline Lana ' +
      'retorna o contato pelo canal preferido informado. A Nine NUNCA promete datas de gravação nem agendamentos: apenas registra.',
  },
  {
    tipo: 'orientacao',
    titulo: 'Nine — Formulário do Roteiro (convidados confirmados)',
    categoria: 'Participação',
    ordem: 3,
    conteudo:
      'Convidados(as) confirmados(as) preenchem o Formulário do Roteiro em /roteiro antes da gravação: biografia, empresa, ' +
      'temas para enfatizar, fotos e autorização de imagem. Também há o Guia do Convidado em /convidado com orientações ' +
      'de preparação, cronograma do estúdio, dress code e café especial.',
  },
  {
    tipo: 'faq',
    titulo: 'Nine — Episódios e dia de publicação',
    categoria: 'Conteúdo',
    ordem: 4,
    conteudo:
      'Novos episódios são publicados TODO SÁBADO às 10h no canal oficial do YouTube @coffeecast4.0. ' +
      'A Nine informa os episódios mais recentes consultados em tempo real no banco do site e nunca inventa números ou títulos.',
  },
  {
    tipo: 'orientacao',
    titulo: 'Nine — Deixar depoimento',
    categoria: 'Conteúdo',
    ordem: 5,
    conteudo:
      'Ouvintes e convidados podem registrar um depoimento sobre a transformação que o CoffeeCast causou, na página /depoimento. ' +
      'A Nine orienta o passo a passo e registra o interesse, sem prometer publicação de depoimento.',
  },
  {
    tipo: 'orientacao',
    titulo: 'Nine — Contato comercial e produção (Aline Lana) — link manual',
    categoria: 'Comercial',
    ordem: 6,
    conteudo:
      'Contato comercial e produção: Aline Lana, WhatsApp (31) 99129-7619. ' +
      'Link manual para o visitante abrir o WhatsApp dele mesmo (a Nine NUNCA envia mensagem automática): ' +
      'https://wa.me/5531991297619?text=Venho%20pelo%20CHAT%20do%20site%20do%20Coffeecast4.0%2C%20gostaria%20de%20falar%20com%20a%20Aline ' +
      'Use este link quando o visitante pedir algo fora da base de conhecimento (ex.: preços, orçamento) ou quiser falar ' +
      'diretamente com a Aline. Nunca simule contato enviado: apenas ofereça o link manual.',
  },
  {
    tipo: 'faq',
    titulo: 'Nine — Estúdio e gravações',
    categoria: 'Estúdio',
    ordem: 7,
    conteudo:
      'O CoffeeCast 4.0 grava em estúdio próprio, com cronograma divulgado ao convidado confirmado pela produção. ' +
      'A Nine informa informações gerais (Guia do Convidado em /convidado) e registra interesse de quem quiser conhecer ' +
      'ou usar o estúdio, sem prometer datas, valores ou disponibilidade.',
  },
  {
    tipo: 'orientacao',
    titulo: 'Nine — Dados que não temos (preço, orçamento, pautas fora da base)',
    categoria: 'Comercial',
    ordem: 8,
    conteudo:
      'A Nine NUNCA inventa preços, valores, orçamentos, datas ou qualquer informação fora das fontes oficiais. ' +
      'Quando o visitante perguntar algo que não consta (ex.: "quanto custa?", "qual o valor de patrocínio?"), ' +
      'ela admite com simpatia que não possui o dado e oferece o contato direto da produção: Aline Lana, ' +
      'WhatsApp (31) 99129-7619, com o link manual de WhatsApp já pré-preenchido, ou os formulários do site.',
  },
  {
    tipo: 'orientacao',
    titulo: 'Nine — LGPD e autorização de contato',
    categoria: 'LGPD',
    ordem: 9,
    conteudo:
      'A Nine coleta nome, WhatsApp e e-mail apenas para personalizar o atendimento e permitir o retorno da equipe. ' +
      'NUNCA presume autorização de marketing: autorização de contato é só para o atendimento solicitado. ' +
      'Se o visitante preferir não informar dados, a Nine respeita e segue com informações gerais. ' +
      'Nenhum disparo automático é feito: WhatsApp, ligação e e-mail são sempre canais MANUAIS da equipe.',
  },
  {
    tipo: 'institucional',
    titulo: 'Nine — Redes sociais e YouTube',
    categoria: 'Institucional',
    ordem: 10,
    conteudo:
      'Canais oficiais do CoffeeCast 4.0: YouTube @coffeecast4.0 (episódios todo sábado às 10h) e Instagram @coffeecast4.0. ' +
      'A Nine compartilha esses canais e registra interesse de parceria, patrocínio e divulgação para a equipe comercial.',
  },
]

migrate(
  (app) => {
    // ---------- 1. Campos comerciais em `contatos` ----------
    const contatos = app.findCollectionByNameOrId('contatos')

    adicionarSeFaltando(
      contatos,
      new SelectField({
        name: 'interesse',
        maxSelect: 1,
        values: [
          'participar_como_convidado',
          'indicar_convidado',
          'apresentar_empresa',
          'divulgacao',
          'parceria',
          'patrocinio',
          'estudio',
          'proposta_comercial',
          'falar_com_equipe',
        ],
      }),
    )
    adicionarSeFaltando(contatos, new TextField({ name: 'empresa_projeto', max: 300 }))
    adicionarSeFaltando(contatos, new TextField({ name: 'resumo_necessidade', max: 2000 }))
    adicionarSeFaltando(
      contatos,
      new SelectField({
        name: 'canal_preferido',
        maxSelect: 1,
        values: ['whatsapp', 'ligacao', 'email', 'nao_informado'],
      }),
    )
    adicionarSeFaltando(contatos, new TextField({ name: 'melhor_horario', max: 100 }))
    adicionarSeFaltando(contatos, new TextField({ name: 'responsavel', max: 120 }))
    adicionarSeFaltando(
      contatos,
      new SelectField({ name: 'prioridade', maxSelect: 1, values: ['baixa', 'media', 'alta'] }),
    )
    adicionarSeFaltando(
      contatos,
      new SelectField({
        name: 'status_comercial',
        maxSelect: 1,
        values: [
          'novo_lead',
          'aguardando_contato',
          'contato_agendado',
          'em_atendimento',
          'convertido',
          'encerrado',
        ],
      }),
    )
    adicionarSeFaltando(contatos, new BoolField({ name: 'autorizacao_contato' }))
    adicionarSeFaltando(contatos, new BoolField({ name: 'nao_contatar' }))
    adicionarSeFaltando(contatos, new DateField({ name: 'data_contato' }))
    adicionarSeFaltando(contatos, new TextField({ name: 'proxima_acao', max: 300 }))
    adicionarSeFaltando(contatos, new DateField({ name: 'data_proximo_retorno' }))
    adicionarSeFaltando(contatos, new TextField({ name: 'resumo_ia', max: 4000 }))
    adicionarSeFaltando(contatos, new JSONField({ name: 'historico_atendimento', maxSize: 500000 }))
    garantirRegrasStaff(contatos)
    app.save(contatos)

    // ---------- 2. Coleção `nine_tarefas` ----------
    let tarefas = null
    try {
      tarefas = app.findCollectionByNameOrId('nine_tarefas')
    } catch (_) {
      tarefas = null
    }
    if (!tarefas) {
      tarefas = new Collection({ name: 'nine_tarefas', type: 'base' })
      app.save(tarefas)
      tarefas = app.findCollectionByNameOrId('nine_tarefas')
    }

    adicionarSeFaltando(tarefas, new TextField({ name: 'titulo', required: true, max: 200 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'lead', max: 30 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'conversation_id', max: 100 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'nome', max: 200 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'telefone', max: 40 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'email', max: 200 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'motivo', max: 500 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'resumo_conversa', max: 2000 }))
    adicionarSeFaltando(
      tarefas,
      new SelectField({
        name: 'canal_preferido',
        maxSelect: 1,
        values: ['whatsapp', 'ligacao', 'email', 'nao_informado'],
      }),
    )
    adicionarSeFaltando(tarefas, new TextField({ name: 'horario_preferido', max: 100 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'link_historico', max: 200 }))
    adicionarSeFaltando(tarefas, new TextField({ name: 'responsavel', max: 120 }))
    adicionarSeFaltando(
      tarefas,
      new SelectField({ name: 'prioridade', maxSelect: 1, values: ['baixa', 'media', 'alta'] }),
    )
    adicionarSeFaltando(
      tarefas,
      new SelectField({ name: 'status', maxSelect: 1, values: ['pendente', 'concluida'] }),
    )
    adicionarSeFaltando(tarefas, new DateField({ name: 'prazo' }))
    adicionarSeFaltando(tarefas, new DateField({ name: 'concluida_em' }))
    garantirAutodates(tarefas)
    garantirRegrasStaff(tarefas)
    app.save(tarefas)

    // ---------- 3. Seeds institucionais idempotentes em `nine_conhecimento` ----------
    for (let i = 0; i < SEEDS_CONHECIMENTO.length; i++) {
      const seed = SEEDS_CONHECIMENTO[i]
      let existentes = []
      try {
        existentes = app.findRecordsByFilter(
          'nine_conhecimento',
          `titulo = "${seed.titulo}"`,
          '-created',
          1,
          0,
        )
      } catch (_) {
        existentes = []
      }
      if (!existentes || existentes.length === 0) {
        const col = app.findCollectionByNameOrId('nine_conhecimento')
        const rec = new Record(col)
        rec.set('tipo', seed.tipo)
        rec.set('titulo', seed.titulo)
        rec.set('conteudo', seed.conteudo)
        rec.set('categoria', seed.categoria)
        rec.set('ativo', true)
        rec.set('ordem', seed.ordem)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Reversível: remove apenas os seeds desta migration (campos/coleção permanecem — sem perda de dados).
    for (let i = 0; i < SEEDS_CONHECIMENTO.length; i++) {
      try {
        const existentes = app.findRecordsByFilter(
          'nine_conhecimento',
          `titulo = "${SEEDS_CONHECIMENTO[i].titulo}"`,
          '-created',
          50,
          0,
        )
        existentes.forEach(function (r) {
          app.delete(r)
        })
      } catch (_) {
        /* coleção pode não existir */
      }
    }
  },
)
