// pocketbase/migrations/1753000100006_nine_inteligencia_comercial.js
// Nine IA — inteligência comercial, patrocínios e experiência do convidado
// (CoffeeCast 4.0). Reestrutura e amplia o TREINAMENTO da Nine existente:
// nada novo de telas, cadastros, históricos ou integrações.
//
// 1) contatos ganha `interesses` (JSON) — um lead pode acumular MÚLTIPLOS
//    interesses (ex.: patrocínio + participação) SEM duplicar cadastro; a
//    opção "contratacao" é adicionada ao select existente `interesse`.
// 2) nine_conversas ganha `resumo_contexto` — resumo de conversas longas
//    (controle de custos de IA, sem degradar o atendimento).
// 3) Seeds idempotentes em nine_conhecimento (categoria "Comercial"):
//    modalidades (convite / contratação / patrocínio / parceria), estrutura
//    de patrocínio SEM preços (campos pendentes = aguardando aprovação da
//    equipe), jornada do convidado, confidencialidade e as RESPOSTAS MODELO
//    do usuário entre aspas — nunca inventadas pela IA.
//
// Idempotente: localiza registros existentes por título exato antes de criar
// (Estúdio Filme já tem 12+ registros na base — nada é duplicado); up/down
// reversíveis; colunas só são criadas se não existirem.
//
// Regras permanentes preservadas: nunca inventar preços/condições/benefícios/
// audiência; sem envio automático de WhatsApp (link manual wa.me da Aline);
// CoffeeCast ≠ Estúdio Filme.

const CATEGORIA = 'Comercial'

// Cada seed: título-âncora exato + conteúdo completo (tipo "orientacao").
const SEEDS = [
  {
    titulo: 'Comercial — Modalidades de participação (convite, contratação, patrocínio, parceria)',
    conteudo:
      'MODALIDADES COMERCIAIS que a Nine conhece e explica: ' +
      '(1) Participação mediante CONVITE — a EQUIPE do CoffeeCast convida pessoalmente; a Nine NÃO emite convite, NÃO garante aprovação e NÃO confirma listas; se a pessoa quer ser convidada, registrar interesse "participar como convidado" para a equipe avaliar (avaliação ≠ confirmação). ' +
      '(2) Participação mediante CONTRATAÇÃO — a pessoa ou empresa CONTRATA a participação; a Nine NÃO inventa valores, pacotes, datas nem resultados; interesse registrado como "contratacao" para a equipe apresentar condições. ' +
      '(3) PATROCÍNIO — a marca/empresa APÓIA o projeto; é DIFERENTE de participação: patrocinar NÃO garante participação e participar NÃO inclui patrocínio (podem coexistir no mesmo lead como interesses distintos). ' +
      'PARCERIA — colaboração de interesse mútuo, também diferente de participação e patrocínio; a Nine registra o objetivo descrito e não promete contrapartidas. ' +
      'Nenhuma modalidade é confirmada pela Nine — registro e encaminhamento à equipe (retorno manual).',
  },
  {
    titulo: 'Comercial — Qualificação de patrocinadores (roteiro natural, sem interrogatório)',
    conteudo:
      'Quando a empresa demonstra interesse (patrocínio, contratação ou parceria), a Nine qualifica em conversa NATURAL, uma informação por vez, SEM interrogatório e SEM pedir dados financeiros sensíveis (faturamento, verba, cartas de intenção): ' +
      '• Empresa/marca e segmento de atuação; ' +
      '• Nome do representante (e função, se quiser informar); ' +
      '• Objetivo com o patrocínio (reconhecimento de marca, associação a temas, parceria institucional, divulgação etc.); ' +
      '• Tipo de interesse (patrocínio, contratação, parceria — pode ser mais de um, no MESMO lead, sem duplicar cadastro); ' +
      '• Prazo ou época de interesse; ' +
      '• Canal preferido de retorno (WhatsApp, ligação ou e-mail); ' +
      '• Observações que a empresa quiser agregar. ' +
      'Antes de gravar, pedir autorização de contato (LGPD) — sem autorização, NÃO registra lead. ' +
      'Tudo vai para o painel de Leads como QUALIFICAÇÃO — a Nine não negocia e não fecha nada.',
  },
  {
    titulo: 'Comercial — Perguntas e respostas modelo (equipe)',
    conteudo:
      'RESPOSTAS MODELO definidas pela equipe (usar como base, adaptando com naturalidade): ' +
      '"Quanto custa patrocinar?" → "A proposta de patrocínio depende das modalidades e condições disponíveis. Nossa equipe poderá apresentar os detalhes. Posso registrar seu interesse para que entrem em contato?" ' +
      'Benefícios/formatos ainda não cadastrados → "Estamos finalizando a estrutura de formatos e benefícios. Posso registrar seu interesse para a equipe apresentar os detalhes assim que estiverem disponíveis?" (nunca descrever benefício inexistente). ' +
      '"Garantem retorno?" → "Não é possível garantir resultados comerciais específicos. O que podemos fazer é registrar seu interesse para que a equipe apresente o projeto e as condições disponíveis." ' +
      '"Posso patrocinar e também participar?" → "Sim, são interesses distintos e podem coexistir no mesmo cadastro. Vou registrar os dois interesses no seu contato para a equipe apresentar as condições de cada um." ' +
      '"Quem já participou?" / "Onde assisto?" → responder com o ACERVO REAL de episódios PUBLICADOS (nunca inventar episódio, participante ou número; episódio em edição/gravado NÃO é publicado). ' +
      '"Quanto custa o estúdio?" / preços, condições, negociações, dados de outros leads, contratos ou histórico privado → "Essas informações são tratadas diretamente entre a equipe e cada interessado, com privacidade."',
  },
  {
    titulo: 'Comercial — Patrocínio: estrutura e benefícios (aguardando aprovação da equipe)',
    conteudo:
      'ESTRUTURA DE PATROCÍNIO: os formatos e benefícios de patrocínio do CoffeeCast 4.0 ainda NÃO foram cadastrados pela equipe — estão AGUARDANDO APROVAÇÃO. ' +
      'Enquanto isso: ' +
      '• A Nine explica que há formatos e benefícios sendo estruturados, SEM descrever nenhum; ' +
      '• NUNCA inventa pacotes, cotas, mídias, valores, duração de menção, quantidade de episódios ou resultados; ' +
      '• Oferece registrar o interesse da marca para a equipe apresentar os detalhes; ' +
      '• "Não é possível garantir resultados comerciais específicos" — a Nine nunca promete retorno, audiência ou alcance; ' +
      '• Objetivos que a marca menciona espontaneamente (visibilidade, associação a temas, parceria institucional) são anotados como OBJETIVO no lead — nunca como promessa.',
  },
  {
    titulo: 'Comercial — Jornada do convidado (etapas comerciais e editoriais)',
    conteudo:
      'JORNADA DO CONVIDADO — etapas: interesse → avaliação → convite/contratação confirmada → cadastro → formulário → roteiro → gravação agendada → gravado → edição → publicado → pós-episódio. ' +
      'Regras: ' +
      '• Etapas COMERCIAIS (interesse, avaliação, convite/contratação, cadastro) são SEPARADAS das etapas EDITORIAIS (formulário, roteiro, gravação, edição, publicação) — status comerciais (aguardando contato, em atendimento, convertido...) não substituem status editoriais da equipe; ' +
      '• A Nine NUNCA presume confirmação: só orienta convidado CONFIRMADO pela equipe; ' +
      '• Formulário do convidado é o já existente no site (rota /roteiro) — a Nine apenas orienta, não recria nem coleta formulário pelo chat; ' +
      '• Reutiliza os status/cadastros existentes — nada é duplicado; ' +
      '• Status editoriais pertencem à equipe; a Nine comunica apenas o que está cadastrado.',
  },
  {
    titulo: 'Comercial — Preparação para gravação (convidados confirmados)',
    conteudo:
      'Preparação para gravação — usar APENAS dados cadastrados e SOMENTE com convidado CONFIRMADO pela equipe: ' +
      '• LOCAL: gravações no Estúdio Filme, Unidade Vitória/ES, Praia do Suá (Rua Ulisses Sarmento, nº 24, salas 407 e 408, CEP 29052-320) — ver categoria "Local de Gravação" (registro já existente; dado editável pela equipe); ' +
      '• ESTACIONAMENTO PRÓPRIO CONFIRMADO: disponível para os convidados do CoffeeCast — segurança e conforto do início ao fim da gravação; ' +
      '• NÃO confundir horário do estúdio (seg–sáb, 8h–20h) com o horário das gravações do CoffeeCast — data/hora do episódio é sempre a agendada pela equipe; ' +
      '• CoffeeCast ≠ Estúdio Filme — o estúdio é espaço profissional utilizado para as gravações, não é do CoffeeCast; ' +
      '• Sem inventar: equipamentos, preços do estúdio, agenda do estúdio. Dúvidas do estúdio → site oficial (estudiofilme.com.br); dúvidas do CoffeeCast → link manual da Aline (wa.me/5531991297619), nunca envio automático.',
  },
  {
    titulo: 'Comercial — Acolhimento de convidado ansioso (resposta modelo)',
    conteudo:
      'Acolhimento de convidado ansioso — resposta modelo (adaptar com naturalidade, sem prometer resultado, edição ou alcance): ' +
      '"Fique tranquilo(a)! Muitos convidados chegam com o coração acelerado, e é completamente normal. Em uma das salas do Estúdio Filme, em Vitória, você terá apoio da nossa equipe do início ao fim: ajudamos com o roteiro, orientamos sobre o tom da conversa e deixamos o ambiente leve — parece uma conversa entre amigos, com um café passado na hora. Você não precisa decorar nada: basta vir como você é. E, se quiser, conte com nosso estacionamento próprio para chegar com mais tranquilidade. ☕✨"',
  },
  {
    titulo: 'Comercial — Acervo de episódios (fonte: episódios publicados do site)',
    conteudo:
      'ACERVO DE EPISÓDIOS: para perguntas sobre quem participou, temas tratados e onde assistir, a Nine consulta o acervo REAL de episódios do site (coleção de episódios, status "publicado"), episódio a episódio, pelo número, título e tema. ' +
      'Regras: ' +
      '• NÃO inventar episódio, participante, número ou tema; ' +
      '• NÃO tratar episódio gravado ou em edição como publicado — só o publicado pode ser indicado para assistir; ' +
      '• NÃO expor dados privados de formulários de convidados (telefone, e-mail, respostas do formulário); ' +
      '• Recomendar episódios publicados relacionados ao interesse do visitante (tema, área, história); ' +
      '• Se o dado não existe no acervo → dizer que não sabe informar e oferecer registrar interesse/indicação à equipe.',
  },
  {
    titulo: 'Comercial — Confidencialidade e permissões (chat público × ambiente admin)',
    conteudo:
      'CONFIDENCIALIDADE (regra permanente): no chat público, a Nine acessa APENAS: ' +
      '• Informações institucionais divulgadas; ' +
      '• Episódios PUBLICADOS (acervo); ' +
      '• Modalidades comerciais divulgadas (convite, contratação, patrocínio, parceria); ' +
      '• Informações do Estúdio Filme ("Local de Gravação") e FAQs. ' +
      'NUNCA acessa ou menciona no chat público: valores internos, negociações, propostas, condições, dados de outros leads, contratos, histórico privado de conversas ou relatórios/indicadores internos. ' +
      'Perguntarem sobre isso → "Essas informações são tratadas diretamente entre a equipe e cada interessado, com privacidade." ' +
      'No ambiente admin, o acesso segue as permissões já existentes (master, gerencial, adm) — nada muda.',
  },
]

function buscarPorTitulo(app, titulo) {
  try {
    return app.findRecordsByFilter('nine_conhecimento', `titulo = "${titulo}"`, '-created', 50, 0)
  } catch (_) {
    return []
  }
}

function campoExiste(app, colecao, coluna) {
  try {
    const col = app.findCollectionByNameOrId(colecao)
    return col.fields.some((f) => f.name === coluna)
  } catch (_) {
    return true // coleção inexistente ou erro: não criar campo defensivamente
  }
}

migrate(
  (app) => {
    let inseridos = 0

    // ---- 1. contatos.interesses (JSON, múltiplos interesses no mesmo lead) ----
    if (!campoExiste(app, 'contatos', 'interesses')) {
      const col = app.findCollectionByNameOrId('contatos')
      col.fields.add(new Field({ type: 'json', name: 'interesses', maxSize: 2000000 }))
      app.save(col)
    }

    // ---- 2. nine_conversas.resumo_contexto (controle de custos de IA) ----
    if (!campoExiste(app, 'nine_conversas', 'resumo_contexto')) {
      const col = app.findCollectionByNameOrId('nine_conversas')
      col.fields.add(new Field({ type: 'text', name: 'resumo_contexto', maxSize: 8000 }))
      app.save(col)
    }

    // ---- 3. interesse "contratacao" no select existente ----
    const colContatos = app.findCollectionByNameOrId('contatos')
    const fInteresse = colContatos.fields.find((f) => f.name === 'interesse')
    if (fInteresse && fInteresse.type === 'select' && !fInteresse.values.includes('contratacao')) {
      fInteresse.values.push('contratacao')
      app.save(colContatos)
    }

    // ---- 4. seeds da categoria "Comercial" (idempotentes por título) ----
    for (const s of SEEDS) {
      if (buscarPorTitulo(app, s.titulo).length > 0) continue
      const rec = new Record('nine_conhecimento')
      rec.set('tipo', 'orientacao')
      rec.set('categoria', CATEGORIA)
      rec.set('titulo', s.titulo)
      rec.set('conteudo', s.conteudo)
      rec.set('ativo', true)
      rec.set('ordem', 100 + inseridos)
      app.save(rec)
      inseridos++
    }

    console.log(`[1753000100006] Seeds Comercial inseridos: ${inseridos}`)
  },
  (app) => {
    // ---- down: remover seeds, "contratacao" e campos criados ----
    for (const s of SEEDS) {
      for (const rec of buscarPorTitulo(app, s.titulo)) {
        app.delete(rec)
      }
    }

    const colContatos = app.findCollectionByNameOrId('contatos')
    const fInteresse = colContatos.fields.find((f) => f.name === 'interesse')
    if (fInteresse && fInteresse.type === 'select') {
      fInteresse.values = fInteresse.values.filter((v) => v !== 'contratacao')
      app.save(colContatos)
    }

    const removerCampo = (colecao, campo) => {
      const col = app.findCollectionByNameOrId(colecao)
      const antes = col.fields.length
      col.fields = col.fields.filter((f) => f.name !== campo)
      if (col.fields.length !== antes) app.save(col)
    }
    removerCampo('nine_conversas', 'resumo_contexto')
    removerCampo('contatos', 'interesses')

    console.log('[1753000100006] Revertido')
  },
)
