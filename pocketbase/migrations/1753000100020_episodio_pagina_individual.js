// pocketbase/migrations/1753000100020_episodio_pagina_individual.js
// Campos que alimentam a PÁGINA INDIVIDUAL de episódio no site público (/episodio/:id):
// - descricao: texto completo exibido na página e usado como meta description/og:description
// - convidados: nome(s) do(s) convidado(s) (texto simples, separado por vírgula quando vários)
// - biografia_convidados: biografia opcional dos convidados
// - data_episodio: data oficial do episódio (exibida em pt-BR; cai para created quando vazia)
// - foto_convidados: foto opcional do convidado (além da capa capa_ia)
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')

    const novosCampos = [
      { name: 'descricao', type: 'text', max: 4000 },
      { name: 'convidados', type: 'text', max: 500 },
      { name: 'biografia_convidados', type: 'text', max: 4000 },
      { name: 'data_episodio', type: 'date' },
      {
        name: 'foto_convidados',
        type: 'file',
        maxSize: 10485760,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      },
    ]

    for (const campo of novosCampos) {
      if (collection.fields.getByName(campo.name)) continue
      collection.fields.add(
        new Field({
          type: campo.type,
          name: campo.name,
          required: false,
          ...(campo.type === 'text' ? { max: campo.max } : {}),
          ...(campo.type === 'file'
            ? { maxSelect: 1, maxSize: campo.maxSize, mimeTypes: campo.mimeTypes, thumbs: [] }
            : {}),
        }),
      )
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')
    for (const nome of [
      'descricao',
      'convidados',
      'biografia_convidados',
      'data_episodio',
      'foto_convidados',
    ]) {
      if (collection.fields.getByName(nome)) {
        collection.fields.removeByName(nome)
      }
    }
    app.save(collection)
  },
)
