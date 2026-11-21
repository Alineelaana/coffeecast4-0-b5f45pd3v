// pocketbase/migrations/1753000100004_nine_estacionamento_confirmado.js
// Treinamento complementar da Nine IA — ESTACIONAMENTO CONFIRMADO.
//
// A equipe confirmou: o Estúdio Filme (unidade Vitória/ES, local de gravação
// do CoffeeCast 4.0) TEM ESTACIONAMENTO PRÓPRIO, disponível para os convidados,
// com total segurança e conforto durante a gravação.
//
// Esta migration é idempotente: substitui a resposta antiga "prefiro confirmar"
// pelos registros da categoria "Local de Gravação" em nine_conhecimento —
// registros que continuam EDITÁVEIS pela equipe em Administração → Nine IA.
// Nada de estacionamento vira hardcode no código dos hooks.
//
// Regras preservadas: CoffeeCast ≠ Estúdio Filme; nunca inventar preços,
// equipamentos ou disponibilidade de agenda; WhatsApp da Aline só como link
// manual wa.me/5531991297619 — nunca envio automático.

const RESPOSTA_FAQ =
  '• Tem estacionamento? → Sim! O Estúdio Filme conta com estacionamento próprio, disponível para os nossos convidados. ' +
  'Assim, você chega, grava e vai embora com total segurança e conforto. ☕✨'

const RESPOSTA_FAQ_ANTIGA =
  '• Tem estacionamento? → "Essa informação eu prefiro confirmar" — não afirmar nada.'

// Regra (3) antiga e nova dentro do registro de regras comportamentais.
const REGRA_ANTIGA =
  '(3) Estacionamento: responder "essa informação eu prefiro confirmar" — nunca afirmar que existe ou não. '

const REGRA_NOVA =
  '(3) Estacionamento: CONFIRMADO pela equipe — o estúdio conta com estacionamento PRÓPRIO, disponível para os ' +
  'convidados, com segurança e conforto do início ao fim da gravação. '

// "estacionamento," saiu da lista de "nunca inventar" (agora é dado confirmado).
const NUNCA_INVENTAR_ANTIGA =
  'disponibilidade de agenda, estacionamento, premiações ou números de clientes.'

const NUNCA_INVENTAR_NOVA =
  'disponibilidade de agenda, premiações ou números de clientes. ' +
  '(Estacionamento NÃO está mais nessa lista: é informação CONFIRMADA — estacionamento próprio para convidados.)'

// Diferencial adicionado à lista de estrutura/diferenciais.
const DIFERENCIAL_NOVO =
  'estacionamento próprio disponível para os convidados do CoffeeCast ' +
  '(informação CONFIRMADA pela equipe — segurança e conforto do início ao fim da gravação). '

// Frase adicionada ao registro de experiência dos convidados.
const EXPERIENCIA_COMPLEMENTO =
  'Conforto e segurança: o local conta com estacionamento PRÓPRIO, disponível para os convidados — você chega, ' +
  'grava e vai embora com total segurança e conforto. '

function atualizarRegistro(app, titulo, funcaoDeTroca) {
  let registros = []
  try {
    registros = app.findRecordsByFilter(
      'nine_conhecimento',
      `titulo = "${titulo}"`,
      '-created',
      50,
      0,
    )
  } catch (_) {
    registros = []
  }
  for (let i = 0; i < (registros || []).length; i++) {
    const rec = registros[i]
    const novoConteudo = funcaoDeTroca(rec.getString('conteudo') || '')
    if (novoConteudo !== null && novoConteudo !== rec.getString('conteudo')) {
      rec.set('conteudo', novoConteudo)
      app.save(rec)
    }
  }
}

function trocarSePresente(conteudo, antigo, novo) {
  if (conteudo.indexOf(antigo) !== -1) {
    return conteudo.split(antigo).join(novo)
  }
  return null
}

migrate(
  (app) => {
    // ---------- 1. FAQ modelo: resposta "Tem estacionamento?" ----------
    atualizarRegistro(
      app,
      'Local de Gravação — Perguntas frequentes (respostas modelo)',
      function (conteudo) {
        return trocarSePresente(conteudo, RESPOSTA_FAQ_ANTIGA, RESPOSTA_FAQ)
      },
    )

    // ---------- 2. Regras comportamentais: estacionamento deixa de ser desconhecido ----------
    atualizarRegistro(
      app,
      'Local de Gravação — Regras de resposta e tratamento de desconhecidos',
      function (conteudo) {
        let novo = trocarSePresente(conteudo, REGRA_ANTIGA, REGRA_NOVA)
        if (novo === null) return null
        const semInventar = trocarSePresente(novo, NUNCA_INVENTAR_ANTIGA, NUNCA_INVENTAR_NOVA)
        if (semInventar !== null) novo = semInventar
        return novo
      },
    )

    // ---------- 3. Diferenciais: incluir estacionamento próprio ----------
    atualizarRegistro(
      app,
      'Local de Gravação — Estrutura e diferenciais divulgados',
      function (conteudo) {
        let novo = trocarSePresente(conteudo, NUNCA_INVENTAR_ANTIGA, NUNCA_INVENTAR_NOVA)
        if (novo === null) return null
        // anexa o diferencial logo após "atendimento personalizado, "
        const ancora = 'atendimento personalizado, '
        if (novo.indexOf(ancora) !== -1 && novo.indexOf('estacionamento próprio') === -1) {
          novo = novo.replace(ancora, ancora + DIFERENCIAL_NOVO)
        }
        return novo
      },
    )

    // ---------- 4. Experiência dos convidados: mencionar o estacionamento próprio ----------
    atualizarRegistro(
      app,
      'Local de Gravação — Experiência dos convidados no espaço',
      function (conteudo) {
        if (conteudo.indexOf('estacionamento próprio') !== -1) return null
        return trocarSePresente(
          conteudo,
          'Dúvidas sobre a experiência de participar → ',
          EXPERIENCIA_COMPLEMENTO + 'Dúvidas sobre a experiência de participar → ',
        )
      },
    )
  },
  (app) => {
    // Down: restaura as respostas antigas (mesma técnica de substituição).
    atualizarRegistro(
      app,
      'Local de Gravação — Perguntas frequentes (respostas modelo)',
      function (conteudo) {
        return trocarSePresente(conteudo, RESPOSTA_FAQ, RESPOSTA_FAQ_ANTIGA)
      },
    )
    atualizarRegistro(
      app,
      'Local de Gravação — Regras de resposta e tratamento de desconhecidos',
      function (conteudo) {
        let novo = trocarSePresente(conteudo, REGRA_NOVA, REGRA_ANTIGA)
        if (novo === null) return null
        const voltaLista = trocarSePresente(novo, NUNCA_INVENTAR_NOVA, NUNCA_INVENTAR_ANTIGA)
        if (voltaLista !== null) novo = voltaLista
        return novo
      },
    )
    atualizarRegistro(
      app,
      'Local de Gravação — Estrutura e diferenciais divulgados',
      function (conteudo) {
        let novo = trocarSePresente(conteudo, DIFERENCIAL_NOVO, '')
        if (novo === null) return null
        const voltaLista = trocarSePresente(novo, NUNCA_INVENTAR_NOVA, NUNCA_INVENTAR_ANTIGA)
        if (voltaLista !== null) novo = voltaLista
        return novo
      },
    )
    atualizarRegistro(
      app,
      'Local de Gravação — Experiência dos convidados no espaço',
      function (conteudo) {
        return trocarSePresente(conteudo, EXPERIENCIA_COMPLEMENTO, '')
      },
    )
  },
)
