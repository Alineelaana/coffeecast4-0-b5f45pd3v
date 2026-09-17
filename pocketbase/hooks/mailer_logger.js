// PocketBase hook para auditoria e garantia de interpolação perfeita nos envios de e-mail.
// Garante que links de ação de autenticação ({ACTION_URL}) e tokens estejam sempre
// 100% resolvidos, válidos e direcionando para as rotas públicas do site CoffeeCast 4.0.
// Produção - CoffeeCast 4.0

onMailerSend((e) => {
  try {
    const msg = e.message || {}
    const subject = msg.subject || 'sem assunto'
    const to = msg.to || []
    const from = msg.from || {}
    let html = msg.html || ''
    let text = msg.text || ''

    // Determina a URL base pública do site
    let siteUrl = $os.getenv('SITE_URL') || ''
    if (!siteUrl) {
      siteUrl = 'https://inicio-do-projeto-df3d5.goskip.app'
    }
    if (siteUrl.endsWith('/')) {
      siteUrl = siteUrl.slice(0, -1)
    }

    // Se houver qualquer URL interna do PocketBase (/_/#/auth/...) no HTML ou texto,
    // ou se contiver o domínio backend interno, substitui para apontar para a rota pública do site.
    // Trata todas as variações de padrão de URL de autenticação:
    // Exemplo: https://.../_/#/auth/confirm-password-reset/<token> -> https://.../redefinir-senha?token=<token>
    // NOTA: Em HTML escapado por entidades (&amp; etc.), normaliza também
    html = html.replace(
      /https?:\/\/[^\s"'<>]+\/(?:_\/)?#\/auth\/confirm-password-reset\/([a-zA-Z0-9_\-\.]+)/g,
      siteUrl + '/redefinir-senha?token=$1',
    )
    text = text.replace(
      /https?:\/\/[^\s"'<>]+\/(?:_\/)?#\/auth\/confirm-password-reset\/([a-zA-Z0-9_\-\.]+)/g,
      siteUrl + '/redefinir-senha?token=$1',
    )

    // Substituição análoga para verificação de e-mail e troca de e-mail
    html = html.replace(
      /https?:\/\/[^\s"'<>]+\/(?:_\/)?#\/auth\/confirm-verification\/([a-zA-Z0-9_\-\.]+)/g,
      siteUrl + '/redefinir-senha?token=$1&action=verify',
    )
    text = text.replace(
      /https?:\/\/[^\s"'<>]+\/(?:_\/)?#\/auth\/confirm-verification\/([a-zA-Z0-9_\-\.]+)/g,
      siteUrl + '/redefinir-senha?token=$1&action=verify',
    )
    html = html.replace(
      /https?:\/\/[^\s"'<>]+\/(?:_\/)?#\/auth\/confirm-email-change\/([a-zA-Z0-9_\-\.]+)/g,
      siteUrl + '/redefinir-senha?token=$1&action=email-change',
    )
    text = text.replace(
      /https?:\/\/[^\s"'<>]+\/(?:_\/)?#\/auth\/confirm-email-change\/([a-zA-Z0-9_\-\.]+)/g,
      siteUrl + '/redefinir-senha?token=$1&action=email-change',
    )

    // Se o backend tiver interpolado com o domínio interno .internal.goskip.dev apontando para /redefinir-senha,
    // ou se contiver qualquer rota apontando para o host interno, corrige para o siteUrl público
    html = html.replace(
      /https?:\/\/[a-zA-Z0-9\-\.]+\.internal\.goskip\.dev(?:\/api\/collections\/users\/[^\s"'<>]*)?\/redefinir-senha/g,
      siteUrl + '/redefinir-senha',
    )
    text = text.replace(
      /https?:\/\/[a-zA-Z0-9\-\.]+\.internal\.goskip\.dev(?:\/api\/collections\/users\/[^\s"'<>]*)?\/redefinir-senha/g,
      siteUrl + '/redefinir-senha',
    )
    html = html.replace(
      /https?:\/\/[a-zA-Z0-9\-\.]+\.internal\.goskip\.dev\/redefinir-senha/g,
      siteUrl + '/redefinir-senha',
    )
    text = text.replace(
      /https?:\/\/[a-zA-Z0-9\-\.]+\.internal\.goskip\.dev\/redefinir-senha/g,
      siteUrl + '/redefinir-senha',
    )

    // Também garante substituição caso {TOKEN} ou &amp; tenha sido gerado
    html = html.replace(
      /redefinir-senha\?token=([a-zA-Z0-9_\-\.]+)&amp;/g,
      'redefinir-senha?token=$1&',
    )
    text = text.replace(
      /redefinir-senha\?token=([a-zA-Z0-9_\-\.]+)&amp;/g,
      'redefinir-senha?token=$1&',
    )
    msg.html = html
    msg.text = text
    // Mascara e-mails de destinatário para auditoria segura nos logs
    const recipients = Array.isArray(to)
      ? to.map((addr) => {
          if (typeof addr === 'string') {
            const parts = addr.split('@')
            if (parts.length === 2) {
              const u = parts[0]
              const masked = u.length > 2 ? u.slice(0, 2) + '***' : u + '***'
              return masked + '@' + parts[1]
            }
            return addr
          }
          if (addr && addr.address) {
            const parts = String(addr.address).split('@')
            if (parts.length === 2) {
              const u = parts[0]
              const masked = u.length > 2 ? u.slice(0, 2) + '***' : u + '***'
              return masked + '@' + parts[1]
            }
            return addr.address
          }
          return 'destinatário_desconhecido'
        })
      : []

    // Remetente configurado
    const sender = typeof from === 'string' ? from : from.address || from.name || 'padrão PB'

    // Procura por URLs resolvidas no e-mail
    const urlMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || []
    const hasHttpUrl = urlMatches.length > 0
    let rawPlaceholderLeft =
      html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1

    // Se houver placeholder cru {ACTION_URL}, identifica a URL de ação resolvida e interpola
    if (rawPlaceholderLeft) {
      let actionUrl = ''
      // Procura nas URLs encontradas aquela que corresponde à ação com token
      for (let i = 0; i < urlMatches.length; i++) {
        const u = urlMatches[i]
        if (
          u.indexOf('token=') !== -1 ||
          u.indexOf('/redefinir-senha') !== -1 ||
          u.indexOf('/reset-password') !== -1 ||
          u.indexOf('confirm-password-reset') !== -1 ||
          u.indexOf('confirm-verification') !== -1 ||
          u.indexOf('confirm-email-change') !== -1
        ) {
          actionUrl = u
          break
        }
      }

      // Se ainda não achou mas há URL HTTP no e-mail, usa a primeira
      if (!actionUrl && urlMatches.length > 0) {
        actionUrl = urlMatches[0]
      }

      // Se mesmo assim não achou URL, usa fallback com rota do site público
      if (!actionUrl) {
        actionUrl = siteUrl + '/redefinir-senha'
      }

      html = html.split('{ACTION_URL}').join(actionUrl)
      msg.html = html
      if (text) {
        text = text.split('{ACTION_URL}').join(actionUrl)
        msg.text = text
      }
      rawPlaceholderLeft =
        html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1
    }

    // Extrai URLs de link encontradas para auditoria clara no log
    const hrefs = (html.match(/href="([^"]*)"/gi) || []).map((h) => {
      return h.replace(/(token=|\/)([a-zA-Z0-9_\-\.]{15,})/g, '$1[PROTECTED_TOKEN]')
    })

    const sampleUrl =
      urlMatches.length > 0
        ? urlMatches[0].replace(/(token=|\/)([a-zA-Z0-9_\-\.]{15,})/g, '$1[PROTECTED_TOKEN]')
        : ''

    console.log(
      '[CoffeeCast Mailer] Tentativa de envio interceptada:',
      JSON.stringify({
        subject: subject,
        recipients: recipients,
        hasResolvedUrl: hasHttpUrl,
        urlCount: urlMatches.length,
        rawPlaceholderRemaining: rawPlaceholderLeft,
        linkSample: sampleUrl,
        hrefs: hrefs,
      }),
    )
  } catch (err) {
    console.log('[CoffeeCast Mailer] Erro ao auditar mensagem pré-envio:', err)
  }

  try {
    e.next()
    console.log(
      '[CoffeeCast Mailer] onMailerSend despachado com sucesso para o transportador do PocketBase.',
    )
  } catch (sendErr) {
    console.log('[CoffeeCast Mailer] Falha no transportador do mailer ao enviar e-mail:', sendErr)
    throw sendErr
  }
})
