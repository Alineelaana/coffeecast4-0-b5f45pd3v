/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('bio')) {
      usersCol.fields.add(
        new TextField({
          name: 'bio',
          required: false,
        }),
      )
    }

    app.save(usersCol)
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      if (usersCol.fields.getByName('bio')) {
        usersCol.fields.removeByName('bio')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
