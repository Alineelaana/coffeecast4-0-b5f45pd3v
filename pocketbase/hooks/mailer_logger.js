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

    // PASSO 1: Reescreve URLs internas com hash ou rotas do PocketBase para a rota canônica pública
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

    // PASSO 2: Corrige domínios internos .internal.goskip.dev
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

    // PASSO 3: Normaliza entidades HTML (&amp;) em query params
    html = html.replace(
      /redefinir-senha\?token=([a-zA-Z0-9_\-\.]+)&amp;/g,
      'redefinir-senha?token=$1&',
    )
    text = text.replace(
      /redefinir-senha\?token=([a-zA-Z0-9_\-\.]+)&amp;/g,
      'redefinir-senha?token=$1&',
    )

    // PASSO 4: Prefixação de URLs relativas que comecem ou terminem em '/redefinir-senha?token=...'
    // Trata href="/redefinir-senha?token=..." ou texto "/redefinir-senha?token=..."
    html = html.replace(
      /(href=["'])(\/redefinir-senha(?:\?[^\s"'>]*)?)(["'])/g,
      '$1' + siteUrl + '$2$3',
    )
    text = text.replace(/(^|[\s"'(])(\/redefinir-senha\?[^\s"'>)]+)/g, '$1' + siteUrl + '$2')

    // PASSO 5 (REFORÇO): Passe final de normalização robusto
    // Qualquer URL ainda presente que contenha 'confirm-password-reset', 'confirm-verification', 'confirm-email-change' ou '/_/'
    // e que NÃO comece com siteUrl + '/redefinir-senha' deve ser substituída pela URL canônica.
    const normalizeLegacyUrl = function (url) {
      if (!url) return url
      const canonicalPrefix = siteUrl + '/redefinir-senha'
      if (url.startsWith(canonicalPrefix)) {
        return url
      }

      const hasLegacyKeyword =
        url.indexOf('confirm-password-reset') !== -1 ||
        url.indexOf('confirm-verification') !== -1 ||
        url.indexOf('confirm-email-change') !== -1 ||
        url.indexOf('/_/') !== -1

      if (!hasLegacyKeyword) {
        return url
      }

      // Determina a ação
      let actionSuffix = ''
      if (url.indexOf('action=email-change') !== -1 || url.indexOf('confirm-email-change') !== -1) {
        actionSuffix = '&action=email-change'
      } else if (
        url.indexOf('action=verify') !== -1 ||
        url.indexOf('confirm-verification') !== -1
      ) {
        actionSuffix = '&action=verify'
      }

      // Extrai o token
      let token = ''
      const tokenMatch =
        url.match(/[?&#]token=([a-zA-Z0-9_\-\.]+)/) ||
        url.match(/confirm-password-reset\/([a-zA-Z0-9_\-\.]+)/) ||
        url.match(/confirm-verification\/([a-zA-Z0-9_\-\.]+)/) ||
        url.match(/confirm-email-change\/([a-zA-Z0-9_\-\.]+)/) ||
        url.match(/\/([a-zA-Z0-9_\-\.]{20,})/)

      if (tokenMatch && tokenMatch[1]) {
        token = tokenMatch[1]
      }

      if (token) {
        return siteUrl + '/redefinir-senha?token=' + token + actionSuffix
      }
      return url
    }

    // Aplica o passe final no HTML e no texto para qualquer URL encontrada
    html = html.replace(/https?:\/\/[^\s"'<>]+/gi, (matchedUrl) => {
      return normalizeLegacyUrl(matchedUrl)
    })
    text = text.replace(/https?:\/\/[^\s"'<>]+/gi, (matchedUrl) => {
      return normalizeLegacyUrl(matchedUrl)
    })

    // PASSO 6: Verificação de placeholder remanescente {ACTION_URL}
    let urlMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || []
    let rawPlaceholderLeft =
      html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1

    if (rawPlaceholderLeft) {
      let actionUrl = ''
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

      if (!actionUrl && urlMatches.length > 0) {
        actionUrl = urlMatches[0]
      }

      if (!actionUrl) {
        actionUrl = siteUrl + '/redefinir-senha'
      }

      html = html.split('{ACTION_URL}').join(actionUrl)
      if (text) {
        text = text.split('{ACTION_URL}').join(actionUrl)
      }
      urlMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || []
      rawPlaceholderLeft =
        html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1
    }

    msg.html = html
    msg.text = text

    // Extrai o primeiro link de ação completo com o token mascarado para auditoria explícita
    let finalActionUrlMasked = ''
    for (let i = 0; i < urlMatches.length; i++) {
      const u = urlMatches[i]
      if (u.indexOf('/redefinir-senha') !== -1 || u.indexOf('token=') !== -1) {
        finalActionUrlMasked = u.replace(/(token=)([a-zA-Z0-9_\-\.]+)/g, '$1[PROTECTED_TOKEN]')
        break
      }
    }
    if (!finalActionUrlMasked && urlMatches.length > 0) {
      finalActionUrlMasked = urlMatches[0].replace(
        /(token=)([a-zA-Z0-9_\-\.]+)/g,
        '$1[PROTECTED_TOKEN]',
      )
    }

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

    // Extrai URLs de link encontradas para auditoria clara no log
    const hrefs = (html.match(/href="([^"]*)"/gi) || []).map((h) => {
      return h.replace(/(token=|\/)([a-zA-Z0-9_\-\.]{15,})/g, '$1[PROTECTED_TOKEN]')
    })

    console.log(
      '[CoffeeCast Mailer] Tentativa de envio interceptada:',
      JSON.stringify({
        subject: subject,
        sender: sender,
        recipients: recipients,
        hasResolvedUrl: urlMatches.length > 0,
        urlCount: urlMatches.length,
        rawPlaceholderRemaining: rawPlaceholderLeft,
        finalActionUrl: finalActionUrlMasked,
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
