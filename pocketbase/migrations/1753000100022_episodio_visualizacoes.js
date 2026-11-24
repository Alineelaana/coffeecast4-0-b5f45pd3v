// pocketbase/migrations/1753000100022_episodio_visualizacoes.js
// Estatísticas de visualização por episódio:
// - visualizacoes: contador público (number, default 0) — incrementado pelo hook
//   episodio_visualizacao.js quando a página /episodio/:id é aberta com o episódio publicado.
// - ultima_visualizacao: data da última visualização registrada (opcional, para o painel).
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')

    if (!collection.fields.getByName('visualizacoes')) {
      collection.fields.add(
        new Field({
          type: 'number',
          name: 'visualizacoes',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }

    if (!collection.fields.getByName('ultima_visualizacao')) {
      collection.fields.add(
        new Field({
          type: 'date',
          name: 'ultima_visualizacao',
          required: false,
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')
    for (const nome of ['visualizacoes', 'ultima_visualizacao']) {
      if (collection.fields.getByName(nome)) {
        collection.fields.removeByName(nome)
      }
    }
    app.save(collection)
  },
)
