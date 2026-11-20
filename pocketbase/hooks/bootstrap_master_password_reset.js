// pocketbase/hooks/bootstrap_master_password_reset.js
//
// DESBLOQUEIO IMEDIATO (one-shot): redefine a senha da conta Master
// alineelaana@gmail.com para o valor de ALINE_PASSWORD_RESET quando o
// marcador abaixo ainda não existir. O marcador é um registro na coleção
// `nine_config` com a chave `master_password_reset_done_v1` — uma linha
// cuja única função é garantir que o reset aconteça UMA ÚNICA VEZ.
//
// IMPORTANTE:
// - A senha NÃO fica no código: vem de $os.getenv("ALINE_PASSWORD_RESET").
//   Configure-a apenas para esta implantação e remova-a depois, se desejar.
// - Se a variável não estiver definida, o hook NÃO faz nada (e não marca nada).
// - Se a conta Master não existir, o hook NÃO faz nada (não cria contas).
// - Este arquivo pode ser removido do projeto depois que o acesso estiver
//   restaurado; o marcador garante que nunca rode duas vezes.

onBootstrap((e) => {
  e.next()
  try {
    const markerKey = 'master_password_reset_done_v1'

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

    // 2. Busca a nova senha na variável de ambiente (nunca em código).
    const novaSenha = String($os.getenv('ALINE_PASSWORD_RESET') || '').trim()
    if (!novaSenha) {
      console.log(
        'Bootstrap Master password reset: variável de ambiente ALINE_PASSWORD_RESET não definida — nenhum reset será feito.',
      )
      return
    }

    // 3. Localiza a conta Master principal (não inventa contas).
    let masterUser = null
    try {
      masterUser = $app.findAuthRecordByEmail('_pb_users_auth_', 'alineelaana@gmail.com')
    } catch (_) {
      console.log(
        'Bootstrap Master password reset: conta alineelaana@gmail.com não encontrada — nenhum reset será feito.',
      )
      return
    }

    // 4. Redefine a senha da conta Master.
    masterUser.setPassword(novaSenha)
    masterUser.set('forcar_troca_senha', false)
    $app.save(masterUser)

    // 5. Grava o marcador para o reset nunca rodar novamente.
    const col = $app.findCollectionByNameOrId('nine_config')
    const flag = new Record(col)
    flag.set('chave', markerKey)
    flag.set(
      'observacoes',
      'Marcador de segurança criado automaticamente pelo bootstrap_master_password_reset.js: a senha da conta Master alineelaana@gmail.com foi redefinida uma única vez a pedido da própria titular (Aline). Este registro não deve ser removido.',
    )
    $app.save(flag)

    console.log(
      'Bootstrap Master password reset: senha da conta alineelaana@gmail.com redefinida com sucesso (executado uma única vez, marcador gravado).',
    )

    // 6. Registra na Auditoria (mesma coleção usada pelas demais ações).
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
        'Senha da conta Master alineelaana@gmail.com redefinida pelo backend (procedimento de desbloqueio único solicitado pela titular). O acesso foi restaurado.',
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
