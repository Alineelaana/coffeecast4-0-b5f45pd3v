migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('users')

    // Estilo HTML responsivo, elegante e acolhedor (Vinho #4B1E3F, Dourado #D4AF37, Fundo Marfim/Suave #FAF8F5)
    // 1. Password Reset Template
    usersCollection.resetPasswordTemplate = {
      subject: 'Recupere sua senha — CoffeeCast 4.0 ☕',
      body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupere sua senha — CoffeeCast 4.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D1A29; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F5F1; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(75, 30, 63, 0.08); border: 1px solid #EBE3D7;">
          
          <!-- Top Header com Vinho e Dourado -->
          <tr>
            <td style="background-color: #4B1E3F; background: linear-gradient(135deg, #4B1E3F 0%, #301026 100%); padding: 36px 30px 30px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 32px; line-height: 1; margin-bottom: 8px;">☕</span>
                    <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #FFFFFF; letter-spacing: 0.5px;">
                      CoffeeCast <span style="color: #D4AF37;">4.0</span>
                    </h1>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #E8D5C4; font-style: italic; letter-spacing: 0.3px;">
                      Mais que conversas, histórias que transformam.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Linha de detalhe dourado -->
          <tr>
            <td height="4" style="background-color: #D4AF37; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td style="padding: 38px 34px 28px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #4B1E3F; font-weight: bold;">
                Olá!
              </h2>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Recebemos um pedido para redefinir a senha de acesso à sua conta no <strong>CoffeeCast 4.0</strong>.
              </p>

              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Para criar sua nova senha com facilidade e segurança, clique no botão especial abaixo:
              </p>

              <!-- Botão de Ação CTA -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 50px; background-color: #4B1E3F; box-shadow: 0 6px 18px rgba(75, 30, 63, 0.28);">
                          <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 15px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: bold; color: #FFFFFF; text-decoration: none; border-radius: 50px; border: 1px solid #D4AF37; letter-spacing: 0.4px;">
                            Redefinir minha senha &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Aviso de fallback / segurança -->
              <div style="background-color: #FDFBF8; border: 1px solid #EFE8DE; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 14px 16px; margin: 24px 0 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6E5D6C;">
                  <strong>Importante:</strong> Este link é de uso único e expira por segurança. Se você não solicitou a redefinição de senha, não se preocupe: sua conta permanece totalmente protegida e você pode desconsiderar esta mensagem.
                </p>
              </div>

              <!-- Link por extenso se o botão não abrir -->
              <p style="margin: 0 0 28px; font-size: 12px; line-height: 1.5; color: #8F7F8D; word-break: break-all;">
                Se tiver qualquer dificuldade com o botão acima, copie e cole o link a seguir no seu navegador:<br>
                <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="color: #4B1E3F; text-decoration: underline;">{ACTION_URL}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #EFEAE3; margin: 28px 0 24px;">

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
            <td style="background-color: #F7F3EE; padding: 20px 30px; text-align: center; border-top: 1px solid #EBE3D7;">
              <p style="margin: 0; font-size: 11px; color: #9E8F9D; line-height: 1.5;">
                CoffeeCast 4.0 &bull; Este é um e-mail transacional automático do seu acesso à plataforma.
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

    // 2. Verification Template (Confirmação de e-mail / boas-vindas)
    usersCollection.verificationTemplate = {
      subject: 'Confirme seu e-mail — CoffeeCast 4.0 ☕',
      body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu e-mail — CoffeeCast 4.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D1A29; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F5F1; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(75, 30, 63, 0.08); border: 1px solid #EBE3D7;">
          <tr>
            <td style="background-color: #4B1E3F; background: linear-gradient(135deg, #4B1E3F 0%, #301026 100%); padding: 36px 30px 30px; text-align: center;">
              <span style="display: inline-block; font-size: 32px; line-height: 1; margin-bottom: 8px;">☕</span>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #FFFFFF; letter-spacing: 0.5px;">
                CoffeeCast <span style="color: #D4AF37;">4.0</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #E8D5C4; font-style: italic; letter-spacing: 0.3px;">
                Mais que conversas, histórias que transformam.
              </p>
            </td>
          </tr>
          <tr>
            <td height="4" style="background-color: #D4AF37; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 38px 34px 28px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #4B1E3F; font-weight: bold;">
                Boas-vindas ao CoffeeCast 4.0!
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Estamos muito felizes em ter você conosco! Para validar seu endereço de e-mail e confirmar seu cadastro, por favor clique no botão abaixo:
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 50px; background-color: #4B1E3F; box-shadow: 0 6px 18px rgba(75, 30, 63, 0.28);">
                          <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 15px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: bold; color: #FFFFFF; text-decoration: none; border-radius: 50px; border: 1px solid #D4AF37; letter-spacing: 0.4px;">
                            Confirmar meu e-mail &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="background-color: #FDFBF8; border: 1px solid #EFE8DE; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 14px 16px; margin: 24px 0 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6E5D6C;">
                  Se você não realizou este cadastro, basta ignorar este e-mail com segurança.
                </p>
              </div>
              <p style="margin: 0 0 28px; font-size: 12px; line-height: 1.5; color: #8F7F8D; word-break: break-all;">
                Se o botão não funcionar, acesse diretamente o endereço:<br>
                <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="color: #4B1E3F; text-decoration: underline;">{ACTION_URL}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #EFEAE3; margin: 28px 0 24px;">
              <p style="margin: 0 0 4px; font-size: 14px; color: #4B1E3F; font-weight: 600;">
                Com carinho,
              </p>
              <p style="margin: 0; font-size: 14px; color: #6E5D6C; line-height: 1.4;">
                <strong>Equipe CoffeeCast 4.0</strong><br>
                <span style="font-size: 12px; color: #9A8998;">Mais que conversas, histórias que transformam.</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F7F3EE; padding: 20px 30px; text-align: center; border-top: 1px solid #EBE3D7;">
              <p style="margin: 0; font-size: 11px; color: #9E8F9D; line-height: 1.5;">
                CoffeeCast 4.0 &bull; Este é um e-mail transacional automático do seu acesso à plataforma.
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

    // 3. Confirm Email Change Template
    usersCollection.confirmEmailChangeTemplate = {
      subject: 'Confirmação de alteração de e-mail — CoffeeCast 4.0 ☕',
      body: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de alteração de e-mail — CoffeeCast 4.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D1A29; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F5F1; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(75, 30, 63, 0.08); border: 1px solid #EBE3D7;">
          <tr>
            <td style="background-color: #4B1E3F; background: linear-gradient(135deg, #4B1E3F 0%, #301026 100%); padding: 36px 30px 30px; text-align: center;">
              <span style="display: inline-block; font-size: 32px; line-height: 1; margin-bottom: 8px;">☕</span>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #FFFFFF; letter-spacing: 0.5px;">
                CoffeeCast <span style="color: #D4AF37;">4.0</span>
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #E8D5C4; font-style: italic; letter-spacing: 0.3px;">
                Mais que conversas, histórias que transformam.
              </p>
            </td>
          </tr>
          <tr>
            <td height="4" style="background-color: #D4AF37; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 38px 34px 28px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #4B1E3F; font-weight: bold;">
                Olá!
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Recebemos uma solicitação para atualizar o endereço de e-mail associado à sua conta no <strong>CoffeeCast 4.0</strong>.
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #40323E;">
                Para confirmar seu novo e-mail e manter sua conta atualizada, clique no botão abaixo:
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 50px; background-color: #4B1E3F; box-shadow: 0 6px 18px rgba(75, 30, 63, 0.28);">
                          <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 15px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: bold; color: #FFFFFF; text-decoration: none; border-radius: 50px; border: 1px solid #D4AF37; letter-spacing: 0.4px;">
                            Confirmar novo e-mail &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="background-color: #FDFBF8; border: 1px solid #EFE8DE; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 14px 16px; margin: 24px 0 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6E5D6C;">
                  Caso não tenha solicitado esta alteração, por favor ignore esta mensagem.
                </p>
              </div>
              <p style="margin: 0 0 28px; font-size: 12px; line-height: 1.5; color: #8F7F8D; word-break: break-all;">
                Se o botão não funcionar, copie e cole o link no seu navegador:<br>
                <a href="{ACTION_URL}" target="_blank" rel="noopener noreferrer" style="color: #4B1E3F; text-decoration: underline;">{ACTION_URL}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #EFEAE3; margin: 28px 0 24px;">
              <p style="margin: 0 0 4px; font-size: 14px; color: #4B1E3F; font-weight: 600;">
                Com carinho,
              </p>
              <p style="margin: 0; font-size: 14px; color: #6E5D6C; line-height: 1.4;">
                <strong>Equipe CoffeeCast 4.0</strong><br>
                <span style="font-size: 12px; color: #9A8998;">Mais que conversas, histórias que transformam.</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F7F3EE; padding: 20px 30px; text-align: center; border-top: 1px solid #EBE3D7;">
              <p style="margin: 0; font-size: 11px; color: #9E8F9D; line-height: 1.5;">
                CoffeeCast 4.0 &bull; Este é um e-mail transacional automático do seu acesso à plataforma.
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
    const usersCollection = app.findCollectionByNameOrId('users')

    // Reverte para o padrão do PocketBase
    usersCollection.resetPasswordTemplate = {
      subject: 'Reset your {APP_NAME} password',
      body: '<p>Hello,</p><p>Click on the button below to reset your password.</p><p><a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener">Reset password</a></p><p><i>If you didn\'t ask to reset your password, you can ignore this email.</i></p><p>Thanks,<br>{APP_NAME} team</p>',
    }

    usersCollection.verificationTemplate = {
      subject: 'Verify your {APP_NAME} email',
      body: '<p>Hello,</p><p>Click on the button below to verify your email address.</p><p><a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener">Verify</a></p><p><i>If you didn\'t ask to verify your email address, you can ignore this email.</i></p><p>Thanks,<br>{APP_NAME} team</p>',
    }

    usersCollection.confirmEmailChangeTemplate = {
      subject: 'Confirm your {APP_NAME} new email address',
      body: '<p>Hello,</p><p>Click on the button below to confirm your new email address.</p><p><a class="btn" href="{ACTION_URL}" target="_blank" rel="noopener">Confirm email</a></p><p><i>If you didn\'t ask to change your email address, you can ignore this email.</i></p><p>Thanks,<br>{APP_NAME} team</p>',
    }

    app.save(usersCollection)
  },
)
