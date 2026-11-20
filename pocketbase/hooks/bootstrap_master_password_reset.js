// pocketbase/hooks/bootstrap_master_password_reset.js
//
// DESBLOQUEIO IMEDIATO (one-shot, SEM variável de ambiente): restaura o
// acesso da conta Master alineelaana@gmail.com definindo a senha
// diretamente no código deste hook. A titular (Aline) está fora do
// sistema e não possui outro caminho de acesso, e a tentativa anterior
// dependia da variável de ambiente ALINE_PASSWORD_RESET, que não está
// disponível no runtime deste backend.
//
// O valor temporário da senha vive APENAS neste hook (que pode ser
// removido depois que o acesso estiver restaurado). Ao final do reset o
// usuário recebe o flag `forcar_troca_senha = true`, o que obriga a
// troca obrigatória de senha no primeiro login (fluxo já existente:
// RedefinirSenhaObrigatoriaScreen + endpoint
// /backend/v1/auth/redefinir-senha-obrigatoria), substituindo essa
// senha temporária por uma senha própria da titular.
//
// Marcador de segurança: registro na coleção `nine_config` com a chave
// `master_password_reset_done_v2` — uma linha cuja única função é
// garantir que o reset aconteça UMA ÚNICA VEZ e nunca se repita. Se a
// conta Master não existir, o hook não faz nada (nunca inventa contas).

onBootstrap((e) => {
  e.next()
  try {
    const markerKey = 'master_password_reset_done_v2'
    const targetEmail = 'alineelaana@gmail.com'
    // Senha temporária de desbloqueio — será substituída no primeiro login
    // pela própria titular, que cai direto na tela de troca obrigatória.
    const TEMP_PASSWORD = 'Easycafe4*'

    // 1. Verifica se o reset já foi executado antes (idempotência).
    let marker = null
    try {
      marker = $app.findFirstRecordByFilter('nine_config', "chave = '" + markerKey + "'")
    } catch (_) {
      marker = null
    }
    if (marker) {
      return // Reset já aconteceu em uma inicialização anterior. Nunca repete.
    }

    // 2. Localiza a conta Master principal (não inventa contas).
    let masterUser = null
    try {
      masterUser = $app.findAuthRecordByEmail('_pb_users_auth_', targetEmail)
    } catch (_) {
      console.log(
        'Bootstrap Master password reset: conta ' +
          targetEmail +
          ' não encontrada — nenhum reset será feito.',
      )
      return
    }

    // 3. Redefine a senha da conta Master e ativa a troca obrigatória.
    masterUser.setPassword(TEMP_PASSWORD)
    masterUser.set('forcar_troca_senha', true)
    $app.save(masterUser)

    // 4. Grava o marcador para o reset nunca rodar novamente.
    const col = $app.findCollectionByNameOrId('nine_config')
    const flag = new Record(col)
    flag.set('chave', markerKey)
    flag.set(
      'observacoes',
      'Marcador de segurança criado automaticamente pelo bootstrap_master_password_reset.js: a senha da conta Master alineelaana@gmail.com foi redefinida uma única vez a pedido da própria titular (Aline), com troca obrigatória no primeiro login. Este registro não deve ser removido.',
    )
    $app.save(flag)

    console.log(
      'Bootstrap Master password reset: senha da conta ' +
        targetEmail +
        ' redefinida com troca obrigatória ativada (executado uma única vez, marcador gravado).',
    )

    // 5. Registra na Auditoria (mesma coleção usada pelas demais ações do painel).
    try {
      const colAudit = $app.findCollectionByNameOrId('auditoria_eventos')
      const logRec = new Record(colAudit)
      logRec.set('usuario_id', masterUser.id)
      logRec.set('usuario_email', masterUser.getString('email'))
      logRec.set('usuario_nome', masterUser.getString('name') || masterUser.getString('email'))
      logRec.set('usuario_role', masterUser.getString('role'))
      logRec.set('tipo_acao', 'alteracao_senha')
      logRec.set('area_sistema', 'Autenticação / Segurança')
      logRec.set(
        'descricao',
        'Senha de acesso restaurada por solicitação da dona; troca obrigatória no próximo login',
      )
      logRec.set('registro_afetado', masterUser.id)
      logRec.set('tabela_afetada', '_pb_users_auth_')
      logRec.set('resultado', 'sucesso')
      $app.save(logRec)
    } catch (errAudit) {
      console.log('Aviso ao registrar auditoria do reset Master:', errAudit)
    }
  } catch (err) {
    // Nunca derruba a inicialização do PocketBase por causa deste hook.
    console.log('Bootstrap Master password reset: erro ignorado:', err)
  }
})
