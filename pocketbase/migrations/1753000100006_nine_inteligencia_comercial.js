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
//    de patrocínio SEM preços, jornada do convidado, confidencialidade e
//    acervo de episódios.
//
// CORREÇÃO DO PANIC "nil pointer dereference" da versão anterior:
// • o construtor genérico `new Field({...})` é DESCARTADO pela JSVM do
//   PocketBase (campo vazio → nil no Go). Aqui usamos construtores TIPADOS
//   (TextField / JSONField / SelectField) — padrão funcional do projeto
//   (migrations 0057 e 1753000100001).
// • `new Record('nine_conversas')` (string) dereferencia nil — sempre
//   `new Record(collectionObj)`.
// • `collection.fields.some(...)` não existe na JSVM (fields é lista Go) —
//   usamos `fields.getByName(...)` / loop.
// • select alterado via `field.values = [...]` em NOVA instância SelectField
//   buscada pelo nome, e só quando o valor ainda não existe.
//
// Idempotente: localiza registros existentes por título exato antes de criar
// (Estúdio Filme já tem registros na base — nada é duplicado); up/down
// reversíveis; colunas só são criadas se não existirem.
//
// Regras permanentes preservadas: nunca inventar preços/condições/benefícios/
// audiência; sem envio automático de WhatsApp (link manual wa.me da Aline);
// CoffeeCast ≠ Estúdio Filme.

/// <reference path="../pb_data/types.d.ts" />

const CATEGORIA = 'Comercial'

const INTERESSES_COMERCIAIS_EXTRAS = ['contratacao']

// Cada seed: título-âncora exato + conteúdo completo (tipo "orientacao").
const SEEDS = [
  {
    titulo: 'Comercial — Modalidades de participação (convite, contratação, patrocínio, parceria)',
    conteudo:
      'MODALIDADES COMERCIAIS que a Nine conhece e explica: ' +
      '(1) Participação mediante CONVITE — a EQUIPE do CoffeeCast convida pessoalmente; a Nine NÃO emite convite, NÃO garante aprovação e NÃO confirma listas; se a pessoa quer ser convidada, registrar interesse "participar como convidado" para a equipe avaliar (avaliação ≠ confirmação). ' +
      '(2) Participação mediante CONTRATAÇÃO — a pessoa ou empresa CONTRATA a participação; a Nine NÃO inventa valores, pacotes, datas nem resultados; interesse registrado como "contratacao" para a equipe apresentar condições. ' +
      '(3) PATROCÍNIO — a marca/empresa APÓIA o projeto; é DIFERENTE de participação: patrocinar NÃO garante participação e participar NÃO inclui patrocínio (podem coexistir no mesmo lead como interesses distintos). ' +
      '(4) PARCERIA — colaboração de interesse mútuo, também diferente de participação e patrocínio; a Nine registra o objetivo descrito e não promete contrapartidas. ' +
      'Nenhuma modalidade é confirmada pela Nine — registro e encaminhamento à equipe (retorno manual pela Aline, link wa.me exibido na tela — nunca envio automático).',
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
      '"Quem já participou?" / "Onde assisto?" → responder com o ACERVO REAL de episódios PUBLICADOS (nunca inventar episódio, participante ou número; episódio gravado/programado/em edição NÃO é publicado). ' +
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
      '• LOCAL: gravações no Estúdio Filme, Unidade Vitória/ES, Praia do Suá (Rua Ulisses Sarmento, nº 24, salas 407 e 408, CEP 29052-320) — ver categoria "Local de Gravação" (dado editável pela equipe); ' +
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
      '• NÃO tratar episódio gravado, programado ou em edição como publicado — só o publicado pode ser indicado para assistir; ' +
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

migrate(
  (app) => {
    let inseridos = 0

    // ---- 1. contatos.interesses (JSON) + "contratacao" no select interesse ----
    try {
      const colContatos = app.findCollectionByNameOrId('contatos')

      if (!colContatos.fields.getByName('interesses')) {
        colContatos.fields.add(new JSONField({ name: 'interesses', maxSize: 2000000 }))
      }

      // SelectField NÃO pode ser editado em campo já existente (edção de
      // "values" de select não persiste na JSVM — tentativa comprovada nos
      // testes anteriores). Padrão robusto: SUBSTITUIR o select por um novo
      // SelectField com TODOS os valores (atuais + extras) na mesma posição.
      const fInteresse = colContatos.fields.getByName('interesse')
      if (fInteresse && String(fInteresse.type) === 'select') {
        const valoresAtuais = []
        if (fInteresse.values) {
          for (let i = 0; i < fInteresse.values.length; i++) {
            valoresAtuais.push(String(fInteresse.values[i]))
          }
        }
        let mudou = false
        for (let j = 0; j < INTERESSES_COMERCIAIS_EXTRAS.length; j++) {
          const v = INTERESSES_COMERCIAIS_EXTRAS[j]
          if (valoresAtuais.indexOf(v) === -1) {
            valoresAtuais.push(v)
            mudou = true
          }
        }
        if (mudou) {
          const novoSelect = new SelectField({
            name: 'interesse',
            values: valoresAtuais,
          })
          colContatos.fields.removeByName('interesse')
          colContatos.fields.add(novoSelect)
        }
      }

      app.save(colContatos)

      // VERIFICAÇÃO: se o valor não entrou no select, a migration falha
      // (em vez de falhar silenciosamente como antes).
      const reChecagem = app.findCollectionByNameOrId('contatos')
      const fChecagem = reChecagem.fields.getByName('interesse')
      let valoresFinais = []
      if (fChecagem) {
        const crusF = fChecagem.values !== undefined ? fChecagem.values : fChecagem.Values
        if (crusF) {
          for (let i = 0; i < crusF.length; i++) {
            valoresFinais.push(String(crusF[i]))
          }
        }
      }
      for (let j = 0; j < INTERESSES_COMERCIAIS_EXTRAS.length; j++) {
        if (valoresFinais.indexOf(INTERESSES_COMERCIAIS_EXTRAS[j]) === -1) {
          throw new Error(
            'select contatos.interesse sem o valor "' +
              INTERESSES_COMERCIAIS_EXTRAS[j] +
              '" após o save',
          )
        }
      }
    } catch (errC) {
      console.log('[1753000100006] ajuste contatos:', errC)
      throw errC
    }

    // ---- 2. nine_conversas.resumo_contexto (controle de custos de IA) ----
    try {
      const colConv = app.findCollectionByNameOrId('nine_conversas')
      if (!colConv.fields.getByName('resumo_contexto')) {
        colConv.fields.add(new TextField({ name: 'resumo_contexto', max: 8000 }))
        app.save(colConv)
      }
    } catch (errV) {
      console.log('[1753000100006] ajuste nine_conversas:', errV)
    }

    // ---- 3. seeds da categoria "Comercial" (idempotentes por título) ----
    let colConhecimento = null
    try {
      colConhecimento = app.findCollectionByNameOrId('nine_conhecimento')
    } catch (_) {
      colConhecimento = null
    }

    if (colConhecimento) {
      for (let s = 0; s < SEEDS.length; s++) {
        const seed = SEEDS[s]
        let existentes = []
        try {
          existentes = app.findRecordsByFilter(
            'nine_conhecimento',
            'titulo = "' + seed.titulo.replace(/"/g, '\\"') + '"',
            '-created',
            1,
            0,
          )
        } catch (_) {
          existentes = []
        }
        if (existentes && existentes.length > 0) continue

        try {
          const rec = new Record(colConhecimento)
          rec.set('tipo', 'orientacao')
          rec.set('categoria', CATEGORIA)
          rec.set('titulo', seed.titulo)
          rec.set('conteudo', seed.conteudo)
          rec.set('ativo', true)
          rec.set('ordem', 100 + inseridos)
          app.save(rec)
          inseridos++
        } catch (errSeed) {
          console.log('[1753000100006] seed falhou: ' + seed.titulo, errSeed)
        }
      }
    }

    console.log('[1753000100006] Seeds Comercial inseridos: ' + inseridos)
  },
  (app) => {
    // ---- down: remover seeds, "contratacao" e campos criados ----
    for (let s = 0; s < SEEDS.length; s++) {
      const seed = SEEDS[s]
      let existentes = []
      try {
        existentes = app.findRecordsByFilter(
          'nine_conhecimento',
          'titulo = "' + seed.titulo.replace(/"/g, '\\"') + '"',
          '-created',
          50,
          0,
        )
      } catch (_) {
        existentes = []
      }
      for (let i = 0; i < existentes.length; i++) {
        try {
          app.delete(existentes[i])
        } catch (_) {}
      }
    }

    try {
      const colContatos = app.findCollectionByNameOrId('contatos')
      const fInteresse = colContatos.fields.getByName('interesse')
      if (fInteresse && fInteresse.type === 'select' && fInteresse.values) {
        const semExtra = []
        for (let i = 0; i < fInteresse.values.length; i++) {
          if (INTERESSES_COMERCIAIS_EXTRAS.indexOf(String(fInteresse.values[i])) === -1) {
            semExtra.push(fInteresse.values[i])
          }
        }
        if (semExtra.length !== fInteresse.values.length) {
          fInteresse.values = semExtra
          colContatos.fields.add(fInteresse)
          app.save(colContatos)
        }
      }
    } catch (_) {}

    try {
      const colC = app.findCollectionByNameOrId('contatos')
      if (colC.fields.getByName('interesses')) {
        colC.fields.removeByName('interesses')
        app.save(colC)
      }
    } catch (_) {}

    try {
      const colV = app.findCollectionByNameOrId('nine_conversas')
      if (colV.fields.getByName('resumo_contexto')) {
        colV.fields.removeByName('resumo_contexto')
        app.save(colV)
      }
    } catch (_) {}

    console.log('[1753000100006] Revertido')
  },
)
