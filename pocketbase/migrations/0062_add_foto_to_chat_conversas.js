/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const conversasCol = app.findCollectionByNameOrId('chat_conversas')

    if (!conversasCol.fields.getByName('foto')) {
      conversasCol.fields.add(
        new FileField({
          name: 'foto',
          required: false,
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }

    app.save(conversasCol)
  },
  (app) => {
    try {
      const conversasCol = app.findCollectionByNameOrId('chat_conversas')
      if (conversasCol.fields.getByName('foto')) {
        conversasCol.fields.removeByName('foto')
      }
      app.save(conversasCol)
    } catch (_) {}
  },
)
