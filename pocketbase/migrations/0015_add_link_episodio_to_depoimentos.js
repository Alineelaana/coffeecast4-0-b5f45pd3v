migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('depoimentos')
    if (!col.fields.getByName('link_episodio')) {
      col.fields.add(
        new TextField({
          name: 'link_episodio',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('depoimentos')
    const field = col.fields.getByName('link_episodio')
    if (field) {
      col.fields.removeByName('link_episodio')
      app.save(col)
    }
  },
)
