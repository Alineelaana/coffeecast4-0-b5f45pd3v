routerAdd('POST', '/backend/v1/debug-trigger-reset', (e) => {
  try {
    const userRecord = $app.findAuthRecordByEmail('users', 'alineelaana@gmail.com')
    $mails.sendRecordPasswordReset($app, userRecord)
    return e.json(200, { ok: true, sentTo: 'alineelaana@gmail.com' })
  } catch (err) {
    return e.json(500, { error: err.message, stack: err.stack })
  }
})
