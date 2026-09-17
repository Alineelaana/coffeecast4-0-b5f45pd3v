migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('users')

    // Estilo HTML responsivo, limpo, robusto e acolhedor (Vinho #4B1E3F, Dourado #D4AF37, Fundo Suave #FAF8F5)
    // Marcação à prova de clientes de e-mail (Gmail web/app, Outlook, Apple Mail):
    // 1. Botão bulletproof padrão Litmus/CampaignMonitor com display:inline-block, padding e border diretos na âncora <a>.
    // 2. Link por extenso seguro em parágrafo com word-break:break-all.
    // 3. Sem comentários condicionais inválidos ou aninhamento excessivo que quebre a clicabilidade.

    // 1. Template de Redefinição de Senha
    usersCollection.resetPasswordTemplate = {
      subject: 'Recupere sua senha — CoffeeCast 4.0 ☕',
      body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupere sua senha — CoffeeCast 4.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D1A29; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F5F1; padding: 32px 12px; margin: 0;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EBE3D7; margin: 0 auto;">
          
          <!-- Top Header com Vinho e Dourado -->
          <tr>
            <td align="center" style="background-color: #4B1E3F; padding: 36px 24px 28px; text-align: center;">
              <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">☕</div>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #FFFFFF; letter-spacing: 0.5px;">
                CoffeeCast <span style="color: #D4AF37;">4.0</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #E8D5C4; font-style: italic; letter-spacing: 0.3px;">
                Mais que conversas, histórias que transformam.
              </p>
            </td>
          </tr>

          <!-- Linha de detalhe dourado -->
          <tr>
            <td height="4" style="background-color: #D4AF37; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 36px 30px 28px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #4B1E3F; font-weight: bold;">
                Olá!
              </h2>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Recebemos um pedido para redefinir a senha da sua conta no <strong>CoffeeCast 4.0</strong>.
              </p>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Para cadastrar sua nova senha com facilidade e segurança, clique no botão abaixo:
              </p>

              <!-- Bloco de Ação / Botão Bulletproof -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="background-color: #4B1E3F; border: 2px solid #D4AF37; border-radius: 50px; color: #FFFFFF; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: bold; line-height: 1.2; padding: 14px 34px; text-align: center; text-decoration: none; -webkit-text-size-adjust: none;">
                      Redefinir minha senha &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Segurança e Validade -->
              <div style="background-color: #FDFBF8; border: 1px solid #EFE8DE; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 14px 16px; margin: 24px 0 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6E5D6C;">
                  <strong>Importante:</strong> Este link é seguro e de uso único. Se você não solicitou a recuperação, pode desconsiderar esta mensagem — sua conta continua protegida.
                </p>
              </div>

              <!-- Link alternativo por extenso -->
              <p style="margin: 0 0 28px; font-size: 12px; line-height: 1.6; color: #8F7F8D; word-break: break-all;">
                Se preferir ou se o botão acima não responder, copie e cole o link a seguir diretamente no navegador:<br>
                <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="color: #4B1E3F; text-decoration: underline; font-weight: 500;">{ACTION_URL}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #EFEAE3; margin: 24px 0 20px;">

              <!-- Assinatura Acolhedora -->
              <p style="margin: 0 0 4px; font-size: 14px; color: #4B1E3F; font-weight: 600;">
                Com carinho,
              </p>
              <p style="margin: 0; font-size: 14px; color: #6E5D6C; line-height: 1.4;">
                <strong>Equipe CoffeeCast 4.0</strong><br>
                <span style="font-size: 12px; color: #9A8998;">Mais que conversas, histórias que transformam.</span>
              </p>
            </td>
          </tr>

          <!-- Rodapé informativo -->
          <tr>
            <td style="background-color: #F7F3EE; padding: 20px 24px; text-align: center; border-top: 1px solid #EBE3D7;">
              <p style="margin: 0; font-size: 11px; color: #9E8F9D; line-height: 1.5;">
                CoffeeCast 4.0 &bull; E-mail transacional de segurança do seu acesso à plataforma.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }

    // 2. Template de Confirmação de E-mail (Boas-vindas)
    usersCollection.verificationTemplate = {
      subject: 'Confirme seu e-mail — CoffeeCast 4.0 ☕',
      body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu e-mail — CoffeeCast 4.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D1A29; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F5F1; padding: 32px 12px; margin: 0;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EBE3D7; margin: 0 auto;">
          
          <!-- Top Header com Vinho e Dourado -->
          <tr>
            <td align="center" style="background-color: #4B1E3F; padding: 36px 24px 28px; text-align: center;">
              <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">☕</div>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #FFFFFF; letter-spacing: 0.5px;">
                CoffeeCast <span style="color: #D4AF37;">4.0</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #E8D5C4; font-style: italic; letter-spacing: 0.3px;">
                Mais que conversas, histórias que transformam.
              </p>
            </td>
          </tr>

          <!-- Linha dourada -->
          <tr>
            <td height="4" style="background-color: #D4AF37; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 36px 30px 28px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #4B1E3F; font-weight: bold;">
                Boas-vindas ao CoffeeCast 4.0!
              </h2>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Ficamos muito felizes em ter você aqui conosco! Para confirmar seu cadastro e liberar seu acesso, clique no botão abaixo:
              </p>

              <!-- Bloco de Ação / Botão Bulletproof -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="background-color: #4B1E3F; border: 2px solid #D4AF37; border-radius: 50px; color: #FFFFFF; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: bold; line-height: 1.2; padding: 14px 34px; text-align: center; text-decoration: none; -webkit-text-size-adjust: none;">
                      Confirmar meu e-mail &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Validade -->
              <div style="background-color: #FDFBF8; border: 1px solid #EFE8DE; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 14px 16px; margin: 24px 0 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6E5D6C;">
                  Se você não realizou esta inscrição na plataforma do CoffeeCast 4.0, fique tranquilo(a): pode apenas ignorar este e-mail.
                </p>
              </div>

              <!-- Link alternativo por extenso -->
              <p style="margin: 0 0 28px; font-size: 12px; line-height: 1.6; color: #8F7F8D; word-break: break-all;">
                Se tiver qualquer dificuldade com o botão acima, use o endereço a seguir:<br>
                <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="color: #4B1E3F; text-decoration: underline; font-weight: 500;">{ACTION_URL}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #EFEAE3; margin: 24px 0 20px;">

              <!-- Assinatura Acolhedora -->
              <p style="margin: 0 0 4px; font-size: 14px; color: #4B1E3F; font-weight: 600;">
                Com carinho,
              </p>
              <p style="margin: 0; font-size: 14px; color: #6E5D6C; line-height: 1.4;">
                <strong>Equipe CoffeeCast 4.0</strong><br>
                <span style="font-size: 12px; color: #9A8998;">Mais que conversas, histórias que transformam.</span>
              </p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background-color: #F7F3EE; padding: 20px 24px; text-align: center; border-top: 1px solid #EBE3D7;">
              <p style="margin: 0; font-size: 11px; color: #9E8F9D; line-height: 1.5;">
                CoffeeCast 4.0 &bull; E-mail transacional de validação da sua conta.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }

    // 3. Template de Confirmação de Troca de E-mail
    usersCollection.confirmEmailChangeTemplate = {
      subject: 'Confirmação de alteração de e-mail — CoffeeCast 4.0 ☕',
      body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de alteração de e-mail — CoffeeCast 4.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D1A29; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F5F1; padding: 32px 12px; margin: 0;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EBE3D7; margin: 0 auto;">
          
          <!-- Top Header com Vinho e Dourado -->
          <tr>
            <td align="center" style="background-color: #4B1E3F; padding: 36px 24px 28px; text-align: center;">
              <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">☕</div>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #FFFFFF; letter-spacing: 0.5px;">
                CoffeeCast <span style="color: #D4AF37;">4.0</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #E8D5C4; font-style: italic; letter-spacing: 0.3px;">
                Mais que conversas, histórias que transformam.
              </p>
            </td>
          </tr>

          <!-- Linha dourada -->
          <tr>
            <td height="4" style="background-color: #D4AF37; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 36px 30px 28px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #4B1E3F; font-weight: bold;">
                Olá!
              </h2>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Recebemos uma solicitação para atualizar o e-mail de acesso da sua conta no <strong>CoffeeCast 4.0</strong>.
              </p>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Para confirmar seu novo endereço e concluir a alteração, clique no botão abaixo:
              </p>

              <!-- Bloco de Ação / Botão Bulletproof -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="background-color: #4B1E3F; border: 2px solid #D4AF37; border-radius: 50px; color: #FFFFFF; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: bold; line-height: 1.2; padding: 14px 34px; text-align: center; text-decoration: none; -webkit-text-size-adjust: none;">
                      Confirmar novo e-mail &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso -->
              <div style="background-color: #FDFBF8; border: 1px solid #EFE8DE; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 14px 16px; margin: 24px 0 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6E5D6C;">
                  Caso não tenha solicitado esta alteração, não se preocupe: sua conta permanece com o endereço atual.
                </p>
              </div>

              <!-- Link alternativo por extenso -->
              <p style="margin: 0 0 28px; font-size: 12px; line-height: 1.6; color: #8F7F8D; word-break: break-all;">
                Se preferir, copie e cole este link diretamente no seu navegador:<br>
                <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="color: #4B1E3F; text-decoration: underline; font-weight: 500;">{ACTION_URL}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #EFEAE3; margin: 24px 0 20px;">

              <!-- Assinatura Acolhedora -->
              <p style="margin: 0 0 4px; font-size: 14px; color: #4B1E3F; font-weight: 600;">
                Com carinho,
              </p>
              <p style="margin: 0; font-size: 14px; color: #6E5D6C; line-height: 1.4;">
                <strong>Equipe CoffeeCast 4.0</strong><br>
                <span style="font-size: 12px; color: #9A8998;">Mais que conversas, histórias que transformam.</span>
              </p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background-color: #F7F3EE; padding: 20px 24px; text-align: center; border-top: 1px solid #EBE3D7;">
              <p style="margin: 0; font-size: 11px; color: #9E8F9D; line-height: 1.5;">
                CoffeeCast 4.0 &bull; E-mail transacional de atualização cadastral.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }

    app.save(usersCollection)
  },
  (app) => {
    // Reversão mantém compatibilidade básica
    const usersCollection = app.findCollectionByNameOrId('users')
    usersCollection.resetPasswordTemplate = {
      subject: 'Reset your {APP_NAME} password',
      body: '<p>Hello,</p><p>Click on the button below to reset your password.</p><p><a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener">Reset password</a></p>',
    }
    app.save(usersCollection)
  },
)
