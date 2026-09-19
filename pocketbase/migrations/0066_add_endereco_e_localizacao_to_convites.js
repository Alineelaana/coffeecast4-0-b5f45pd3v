migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('convites')
    let changed = false

    if (!col.fields.getByName('endereco_gravacao')) {
      col.fields.add(
        new TextField({
          name: 'endereco_gravacao',
          required: false,
        }),
      )
      changed = true
    }

    if (!col.fields.getByName('link_localizacao')) {
      col.fields.add(
        new URLField({
          name: 'link_localizacao',
          required: false,
        }),
      )
      changed = true
    }

    if (changed) {
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('convites')
    let changed = false

    if (col.fields.getByName('endereco_gravacao')) {
      col.fields.removeByName('endereco_gravacao')
      changed = true
    }

    if (col.fields.getByName('link_localizacao')) {
      col.fields.removeByName('link_localizacao')
      changed = true
    }

    if (changed) {
      app.save(col)
    }
  },
)
