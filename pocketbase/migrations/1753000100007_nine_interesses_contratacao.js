// pocketbase/migrations/1753000100007_nine_interesses_contratacao.js
// Nine IA — CoffeeCast 4.0: encerra a tentativa de adicionar o valor
// "contratacao" ao select `contatos.interesse`.
//
// DECISÃO DA EQUIPE (implementada aqui): a classificação de CONTRATAÇÃO é feita
// pelo campo JSON `contatos.interesses` (multi-interesses — estrutura correta do
// prompt mestre para interesses múltiplos, escrita pelo hook public_chat_nine.js
// na qualificação). O select `interesse` permanece como está, apenas com o
// interesse PRIMÁRIO do lead.
//
// Motivo técnico: na JSVM do PocketBase, editar os `values` de um SelectField já
// existente não persiste (comprovado em 3 abordagens: editar f.values,
// fields.add e substituir por SelectField novo — o app.save() não retorna erro,
// mas o valor não fica gravado).
//
// Esta migration é um NO-OP idempotente (não lança erro, não altera schema):
// apenas garante/verifica os pré-requisitos que JÁ existem e registra a decisão.
// Reversível: down também é no-op (nada foi criado aqui).

/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Pré-requisitos criados pela 1753000100006 — verificação apenas informativa
    // (nunca lança erro: se ausentes, a 0006 os recria ao reaplicar).
    try {
      const colContatos = app.findCollectionByNameOrId('contatos')
      const temInteresses = !!colContatos.fields.getByName('interesses')
      console.log(
        '[1753000100007] contatos.interesses (JSON, multi-interesses) presente: ' + temInteresses,
      )
    } catch (err) {
      console.log('[1753000100007] contatos indisponível nesta fase:', err)
    }

    console.log(
      '[1753000100007] Contratação é classificada em contatos.interesses (JSON) — ' +
        'o select contatos.interesse NÃO é alterado (decisão da equipe).',
    )
  },
  (app) => {
    // down: no-op — esta migration não criou nem removeu nada.
    console.log('[1753000100007] Revertido (no-op)')
  },
)
