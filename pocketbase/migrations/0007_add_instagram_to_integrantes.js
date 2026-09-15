migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('integrantes')
    if (!col.fields.getByName('instagram')) {
      col.fields.add(
        new TextField({
          name: 'instagram',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('integrantes')
    const field = col.fields.getByName('instagram')
    if (field) {
      col.fields.removeByName('instagram')
      app.save(col)
    }
  },
)
