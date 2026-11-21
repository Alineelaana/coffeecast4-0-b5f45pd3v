// pocketbase/migrations/1753000000000_add_capa_ia_episodios.js
// Adiciona o campo de arquivo 'capa_ia' à coleção 'episodios' (capa gerada com IA via ChatGPT/OpenAI)

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')
    if (!collection.fields.getByName('capa_ia')) {
      collection.fields.add(
        new Field({
          type: 'file',
          name: 'capa_ia',
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        }),
      )
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')
    const f = collection.fields.getByName('capa_ia')
    if (f) {
      collection.fields.removeByName('capa_ia')
      app.save(collection)
    }
  },
)
