// PocketBase hook para auditoria e garantia absoluta de URLs canônicas públicas
// nos e-mails transacionais do CoffeeCast 4.0.
// Converte qualquer resquício de domínio interno, hash antigo (/_\/#/...) ou rota PocketBase
// para a rota pública definitiva: https://inicio-do-projeto-df3d5.goskip.app/redefinir-senha?token=<token>

onMailerSend((e) => {
  try {
    const msg = e.message || {}
    const subject = msg.subject || 'sem assunto'
    const to = msg.to || []
    const from = msg.from || {}
    let html = msg.html || ''
    let text = msg.text || ''

    // URL Canônica Pública Oficial
    const CANONICAL_SITE_URL = 'https://inicio-do-projeto-df3d5.goskip.app'
    const CANONICAL_RESET_PREFIX = CANONICAL_SITE_URL + '/redefinir-senha'

    // Investigação e auditoria do valor da variável de ambiente SITE_URL
    const rawEnvSiteUrl = $os.getenv('SITE_URL') || ''
    console.log(
      '[CoffeeCast Mailer] SITE_URL em runtime:',
      rawEnvSiteUrl ? rawEnvSiteUrl : '<VAZIO/NÃO_DEFINIDO>',
    )

    // Função de reescrita de segurança direta:
    // Qualquer URL que aponte para .internal.goskip.dev, ou contenha /_/, ou confirm-password-reset,
    // ou seja relativa (/redefinir-senha...) é canonicamente convertida para a URL pública.
    const sanitizeUrl = function (rawUrl) {
      if (!rawUrl) return rawUrl

      // Se já for a URL pública canônica com token, não precisa de reescrita complexa
      if (rawUrl.startsWith(CANONICAL_RESET_PREFIX + '?token=')) {
        return rawUrl.replace(/&amp;/g, '&')
      }

      const isLegacyOrInternal =
        rawUrl.indexOf('.internal.goskip.dev') !== -1 ||
        rawUrl.indexOf('confirm-password-reset') !== -1 ||
        rawUrl.indexOf('confirm-verification') !== -1 ||
        rawUrl.indexOf('confirm-email-change') !== -1 ||
        rawUrl.indexOf('/_/') !== -1 ||
        rawUrl.indexOf('{ACTION_URL}') !== -1

      if (!isLegacyOrInternal) {
        return rawUrl
      }

      // Extrai a ação específica caso não seja reset de senha padrão
      let actionSuffix = ''
      if (rawUrl.indexOf('confirm-verification') !== -1 || rawUrl.indexOf('action=verify') !== -1) {
        actionSuffix = '&action=verify'
      } else if (
        rawUrl.indexOf('confirm-email-change') !== -1 ||
        rawUrl.indexOf('action=email-change') !== -1
      ) {
        actionSuffix = '&action=email-change'
      }

      // Extrai o token
      let token = ''
      const tokenMatch =
        rawUrl.match(/[?&#]token=([a-zA-Z0-9_\-.]+)/) ||
        rawUrl.match(/confirm-(?:password-reset|verification|email-change)\/([a-zA-Z0-9_\-.]+)/) ||
        rawUrl.match(/\/([a-zA-Z0-9_\-.]{20,})/)

      if (tokenMatch && tokenMatch[1]) {
        token = tokenMatch[1]
      }

      if (token) {
        return CANONICAL_RESET_PREFIX + '?token=' + token + actionSuffix
      }

      return rawUrl
    }

    // 1. Substituição de qualquer URL HTTP/HTTPS no HTML e no texto
    html = html.replace(/https?:\/\/[^\s"'<>]+/gi, (m) => sanitizeUrl(m))
    text = text.replace(/https?:\/\/[^\s"'<>]+/gi, (m) => sanitizeUrl(m))

    // 2. Normalização de hrefs relativos (ex.: href="/redefinir-senha?token=...")
    html = html.replace(
      /(href=["'])(\/redefinir-senha(?:\?[^\s"'>]*)?)(["'])/g,
      '$1' + CANONICAL_SITE_URL + '$2$3',
    )
    text = text.replace(
      /(^|[\s"'(])(\/redefinir-senha\?[^\s"'>)]+)/g,
      '$1' + CANONICAL_SITE_URL + '$2',
    )

    // 3. Normalização de entidades &amp; em links
    html = html.replace(/(redefinir-senha\?token=[a-zA-Z0-9_\-.]+)&amp;/g, '$1&')
    text = text.replace(/(redefinir-senha\?token=[a-zA-Z0-9_\-.]+)&amp;/g, '$1&')

    // 4. Salvaguarda final para placeholder {ACTION_URL} se ainda restar por qualquer motivo
    if (html.indexOf('{ACTION_URL}') !== -1 || text.indexOf('{ACTION_URL}') !== -1) {
      const fallbackUrl = CANONICAL_RESET_PREFIX
      html = html.split('{ACTION_URL}').join(fallbackUrl)
      text = text.split('{ACTION_URL}').join(fallbackUrl)
    }

    msg.html = html
    msg.text = text

    // Extrai URLs do corpo para verificação e log
    const allUrls = html.match(/https?:\/\/[^\s"'<>]+/gi) || []
    let finalActionUrlMasked = ''
    for (let i = 0; i < allUrls.length; i++) {
      const u = allUrls[i]
      if (u.indexOf('/redefinir-senha') !== -1 || u.indexOf('token=') !== -1) {
        finalActionUrlMasked = u.replace(/(token=)([a-zA-Z0-9_\-.]+)/g, '$1[PROTECTED_TOKEN]')
        break
      }
    }
    if (!finalActionUrlMasked && allUrls.length > 0) {
      finalActionUrlMasked = allUrls[0].replace(
        /(token=)([a-zA-Z0-9_\-.]+)/g,
        '$1[PROTECTED_TOKEN]',
      )
    }

    // Destinatário mascarado
    const recipients = Array.isArray(to)
      ? to.map((addr) => {
          const raw = typeof addr === 'string' ? addr : (addr && addr.address) || ''
          const parts = raw.split('@')
          if (parts.length === 2) {
            const u = parts[0]
            const masked = u.length > 2 ? u.slice(0, 2) + '***' : u + '***'
            return masked + '@' + parts[1]
          }
          return raw || 'destinatário'
        })
      : []

    const sender =
      typeof from === 'string' ? from : (from && (from.address || from.name)) || 'padrão PB'

    // LOGS EM LINHAS PRÓPRIAS E COMPLETAS (NÃO TRUNCADAS):
    console.log('[CoffeeCast Mailer] --- DISPARO DE E-MAIL DETECTADO ---')
    console.log('[CoffeeCast Mailer] Assunto:', subject)
    console.log('[CoffeeCast Mailer] Destinatário:', recipients.join(', '))
    console.log('[CoffeeCast Mailer] Remetente:', sender)
    console.log(
      '[CoffeeCast Mailer] URL final de ação:',
      finalActionUrlMasked || '<NENHUMA_URL_ENCONTRADA>',
    )
    console.log('[CoffeeCast Mailer] Total de URLs no e-mail:', allUrls.length)
  } catch (err) {
    console.log('[CoffeeCast Mailer] Erro no processamento de onMailerSend:', err)
  }

  try {
    e.next()
    console.log(
      '[CoffeeCast Mailer] onMailerSend concluído com sucesso e entregue ao transportador.',
    )
  } catch (sendErr) {
    console.log('[CoffeeCast Mailer] Falha no transportador do mailer:', sendErr)
    throw sendErr
  }
})
