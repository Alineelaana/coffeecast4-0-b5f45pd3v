// pocketbase/migrations/1753000100019_links_spotify_youtube_episodios.js
// Adiciona os campos opcionais de URL 'link_spotify' e 'link_youtube' à coleção 'episodios'.
// Esses campos alimentam os botões "Ouvir no Spotify" e "Assistir no YouTube" do site público.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')
    if (!collection.fields.getByName('link_spotify')) {
      collection.fields.add(
        new Field({
          type: 'url',
          name: 'link_spotify',
          required: false,
        }),
      )
      app.save(collection)
    }
    if (!collection.fields.getByName('link_youtube')) {
      collection.fields.add(
        new Field({
          type: 'url',
          name: 'link_youtube',
          required: false,
        }),
      )
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('episodios')
    if (collection.fields.getByName('link_spotify')) {
      collection.fields.removeByName('link_spotify')
      app.save(collection)
    }
    if (collection.fields.getByName('link_youtube')) {
      collection.fields.removeByName('link_youtube')
      app.save(collection)
    }
  },
)
