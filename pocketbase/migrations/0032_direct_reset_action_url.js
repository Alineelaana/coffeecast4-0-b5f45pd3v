migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('users')

    // Determina a URL base pública canônica do site CoffeeCast 4.0
    let siteUrl = $os.getenv('SITE_URL') || ''
    if (!siteUrl) {
      siteUrl = 'https://inicio-do-projeto-df3d5.goskip.app'
    }
    if (siteUrl.endsWith('/')) {
      siteUrl = siteUrl.slice(0, -1)
    }

    // URLs canônicas diretas sem dependência de {APP_URL}, sem fragmento '#' e sem '/_/'
    const directResetActionUrl = siteUrl + '/redefinir-senha?token={TOKEN}'
    const directVerificationActionUrl = siteUrl + '/redefinir-senha?token={TOKEN}&action=verify'
    const directEmailChangeActionUrl =
      siteUrl + '/redefinir-senha?token={TOKEN}&action=email-change'

    // Mantém o HTML body já existente em 0030_restore_original_action_url.js e atualiza apenas actionUrl
    const currentResetBody =
      usersCollection.resetPasswordTemplate && usersCollection.resetPasswordTemplate.body
        ? usersCollection.resetPasswordTemplate.body
        : ''
    const currentVerificationBody =
      usersCollection.verificationTemplate && usersCollection.verificationTemplate.body
        ? usersCollection.verificationTemplate.body
        : ''
    const currentEmailChangeBody =
      usersCollection.confirmEmailChangeTemplate && usersCollection.confirmEmailChangeTemplate.body
        ? usersCollection.confirmEmailChangeTemplate.body
        : ''

    usersCollection.resetPasswordTemplate = {
      subject:
        (usersCollection.resetPasswordTemplate && usersCollection.resetPasswordTemplate.subject) ||
        'Recupere sua senha — CoffeeCast 4.0 ☕',
      actionUrl: directResetActionUrl,
      body: currentResetBody,
    }

    usersCollection.verificationTemplate = {
      subject:
        (usersCollection.verificationTemplate && usersCollection.verificationTemplate.subject) ||
        'Confirme seu e-mail — CoffeeCast 4.0 ☕',
      actionUrl: directVerificationActionUrl,
      body: currentVerificationBody,
    }

    usersCollection.confirmEmailChangeTemplate = {
      subject:
        (usersCollection.confirmEmailChangeTemplate &&
          usersCollection.confirmEmailChangeTemplate.subject) ||
        'Confirmação de alteração de e-mail — CoffeeCast 4.0 ☕',
      actionUrl: directEmailChangeActionUrl,
      body: currentEmailChangeBody,
    }

    app.save(usersCollection)
  },
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('users')
    if (usersCollection.resetPasswordTemplate) {
      usersCollection.resetPasswordTemplate.actionUrl =
        '{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}'
    }
    if (usersCollection.verificationTemplate) {
      usersCollection.verificationTemplate.actionUrl =
        '{APP_URL}/_/#/auth/confirm-verification/{TOKEN}'
    }
    if (usersCollection.confirmEmailChangeTemplate) {
      usersCollection.confirmEmailChangeTemplate.actionUrl =
        '{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}'
    }
    app.save(usersCollection)
  },
)
