// pocketbase/migrations/0081_fix_user_verification.js
//
// LIBERAÇÃO DE ACESSO (one-shot, idempotente): usuários com e-mails
// nunca verificados não conseguiam autenticar (POST
// /api/collections/users/auth-with-password retornava 400 "Failed to
// authenticate"), porque nunca receberam o e-mail de verificação (o
// SMTP transacional não está configurado neste backend).
//
// A correção NÃO altera senhas, roles, permissões nem o flag
// `forcar_troca_senha`: os usuários Flávia Franco, Rosi Lima e Manu
// Araujo continuam com a troca obrigatória de senha no primeiro login
// (fluxo já existente: RedefinirSenhaObrigatoriaScreen + endpoint
// /backend/v1/auth/redefinir-senha-obrigatoria).
//
// Marcador de segurança: registro na coleção `nine_config` com a chave
// `user_verification_fix_done_v1` — uma linha cuja única função é
// garantir que a correção aconteça UMA ÚNICA VEZ e nunca se repita nas
// próximas implantações. Em um banco vazio (sem usuários), a migração
// não faz nada.

migrate(
  (app) => {
    const markerKey = 'user_verification_fix_done_v1'

    // 1. Verifica se a correção já foi executada antes (idempotência).
    let marker = null
    try {
      marker = app.findFirstRecordByFilter('nine_config', "chave = '" + markerKey + "'")
    } catch (_) {
      marker = null
    }
    if (marker) {
      console.log(
        'Migração 0081: marcador já existente — a correção de verificação de e-mail já foi executada antes. Nada a fazer.',
      )
      return
    }

    // 2. Localiza TODOS os usuários ativos com e-mail não verificado.
    const usuariosPendentes = app.findRecordsByFilter(
      'users',
      'verified = false && ativo = true',
      'created',
      0,
      0,
    )

    if (!usuariosPendentes || usuariosPendentes.length === 0) {
      console.log('Migração 0081: nenhum usuário ativo com verified=false — nada a corrigir.')
    }

    // 3. Define verified=true para cada um (apenas o campo, sem enviar
    //    e-mail e sem tocar em senha, role ou forcar_troca_senha).
    let nomesAfetados = []
    let idPrimeiroAfetado = ''
    if (usuariosPendentes && usuariosPendentes.length > 0) {
      nomesAfetados = usuariosPendentes.map(function (u) {
        u.setVerified(true)
        app.save(u)
        return u.getString('name') || u.getString('email')
      })
      idPrimeiroAfetado = usuariosPendentes[0].id
      console.log(
        'Migração 0081: verified=true gravado para ' +
          nomesAfetados.join(', ') +
          ' (' +
          usuariosPendentes.length +
          ' usuário(s) liberado(s)).',
      )
    }

    // 4. Grava o marcador para a correção nunca rodar novamente.
    const col = app.findCollectionByNameOrId('nine_config')
    const flag = new Record(col)
    flag.set('chave', markerKey)
    flag.set(
      'observacoes',
      'Marcador de segurança criado automaticamente pela migração 0081: o campo verified foi definido como true para todos os usuários ativos (liberando o acesso bloqueado por falta de verificação de e-mail — nenhum e-mail foi enviado, nenhum dado sensível foi alterado). Este registro não deve ser removido.',
    )
    app.save(flag)

    // 5. Registra na Auditoria (mesma coleção usada pelas demais ações do painel).
    try {
      const colAudit = app.findCollectionByNameOrId('auditoria_eventos')
      const logRec = new Record(colAudit)
      logRec.set('usuario_id', idPrimeiroAfetado)
      logRec.set('usuario_email', 'sistema@coffeecast')
      logRec.set('usuario_nome', 'Migração automática (0081)')
      logRec.set('usuario_role', 'master')
      logRec.set('tipo_acao', 'acao_administrativa')
      logRec.set('area_sistema', 'Autenticação / Segurança')
      logRec.set(
        'descricao',
        'Correção de verificação de e-mail para liberar acesso dos usuários (Flávia Franco, Rosi Lima, Manu Araujo)',
      )
      logRec.set('registro_afetado', idPrimeiroAfetado)
      logRec.set('tabela_afetada', '_pb_users_auth_')
      logRec.set('resultado', 'sucesso')
      logRec.set('metadata', {
        migracao: '0081_fix_user_verification',
        usuarios_afetados: nomesAfetados,
        total_afetados: nomesAfetados.length,
      })
      app.save(logRec)
    } catch (errAudit) {
      console.log('Aviso ao registrar auditoria da correção de verificação (0081):', errAudit)
    }
  },
  (app) => {
    // Down: no-op — não é possível reverter verified=true para o estado
    // anterior com segurança (não se sabe quem nunca recebeu o e-mail).
  },
)
