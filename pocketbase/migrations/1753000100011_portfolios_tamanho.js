// Migration 1753000100011 — Adiciona o campo "tamanho" (bytes do PDF) à collection "portfolios",
// preenchido no momento do envio para exibir o tamanho na listagem sem requisições extras.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('portfolios')
    col.fields.add(
      new NumberField({
        name: 'tamanho',
        required: false,
        onlyInt: true,
        min: 0,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('portfolios')
    col.fields.removeByName('tamanho')
    app.save(col)
  },
)
