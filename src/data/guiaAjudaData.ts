import type { UserRole } from '@/types/database'

export interface GuiaBotaoAcao {
  nome: string
  onde: string
  paraQueServe: string
  icone?: string
}

export interface GuiaItemSecao {
  id: string
  titulo: string
  subtitulo?: string
  icone: string
  rota?: string
  perfisPermitidos: UserRole[]
  badge?: string
  ondeClicar: string
  paraQueServe: string
  passoAPasso?: string[]
  botoesPrincipais?: GuiaBotaoAcao[]
  dica?: string
  atencao?: string
  exclusivoMaster?: boolean
}

export interface GuiaCategoria {
  id: string
  titulo: string
  descricao: string
  icone: string
  itens: GuiaItemSecao[]
}

/**
 * MÓDULO CENTRALIZADO DO GUIA DE AJUDA & PRIMEIRO ACESSO
 *
 * Sempre que houver novas telas, botões ou fluxos adicionados ao sistema CoffeeCast 4.0,
 * basta atualizar este arquivo com os novos itens e descrições.
 */
export const GUIA_AJUDA_CATEGORIAS: GuiaCategoria[] = [
  {
    id: 'primeiros-passos',
    titulo: '1. Primeiros Passos & Boas-Vindas',
    descricao: 'Como acessar, navegar pela barra superior e encontrar o que você precisa.',
    icone: 'Compass',
    itens: [
      {
        id: 'primeiro-acesso',
        titulo: 'Primeiro Acesso ao Sistema',
        subtitulo: 'Login, senha e boas práticas de boas-vindas',
        icone: 'KeyRound',
        rota: '/login',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        ondeClicar:
          'Acesse a página inicial e clique em "Área Administrativa" ou "Área de Membros", ou vá direto para /login.',
        paraQueServe:
          'Autentica com segurança seu usuário no sistema através de e-mail e senha cadastrados.',
        passoAPasso: [
          'Digite seu e-mail corporativo cadastrado.',
          'Insira sua senha pessoal (caso tenha esquecido, use "Esqueci minha senha" para receber um link de redefinição no seu e-mail).',
          'Clique no botão dourado "Entrar no Sistema".',
          'Você será redirecionado para a tela correspondente ao seu perfil: Master, ADM e Gerencial acessam o Painel (/admin), enquanto Ouro e Prata acessam a Área de Membros (/membros).',
        ],
        botoesPrincipais: [
          {
            nome: 'Entrar no Sistema',
            onde: 'Tela de Login',
            paraQueServe: 'Valida as credenciais com o servidor e inicia a sessão segura.',
          },
          {
            nome: 'Esqueci minha senha',
            onde: 'Abaixo do campo de senha no Login',
            paraQueServe: 'Dispara um e-mail transacional automatizado para criar uma nova senha.',
          },
          {
            nome: 'Voltar ao Site Público',
            onde: 'Rodapé do card de Login',
            paraQueServe: 'Retorna para a página principal pública sem efetuar login.',
          },
        ],
        dica: 'Mantenha sua senha em sigilo. Todas as ações realizadas com seu login ficam registradas na Auditoria do Sistema.',
      },
      {
        id: 'cabecalho-e-navegacao',
        titulo: 'Cabeçalho Superior & Atalhos Globais',
        subtitulo: 'Barra superior fixa presente no Painel e na Área de Membros',
        icone: 'LayoutGrid',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        ondeClicar: 'Fixado no topo da tela em todas as páginas do sistema.',
        paraQueServe:
          'Oferece acesso instantâneo a notificações, seletor de lojas (para Master/ADM), botão de Ajuda, troca rápida entre Painel e Área de Membros e o Meu Perfil.',
        passoAPasso: [
          'Seletor Global de Loja (se for Master ou ADM de multi-lojas): clique no dropdown para alternar o contexto de trabalho entre o CoffeeCast e lojas parceiras.',
          'Botão "Notificações": exibe o contador em vermelho/âmbar com roteiros, contatos e depoimentos aguardando revisão.',
          'Botão "Ajuda" (ícone de interrogação): abre a qualquer momento este Guia de Ajuda para tirar dúvidas.',
          'Botão "Área de Membros": atalho para abrir o acervo de episódios e bastidores da comunidade.',
          'Botão "Ver Site": abre a Home pública do podcast em uma nova aba do navegador.',
          'Avatar do Usuário (canto direito): exibe seu nome, foto e nível de acesso, levando diretamente para a tela "Meu Perfil".',
        ],
        botoesPrincipais: [
          {
            nome: 'Guia de Ajuda',
            onde: 'Canto direito do cabeçalho',
            paraQueServe:
              'Abre este manual interativo com explicações detalhadas de cada aba e botão.',
            icone: 'HelpCircle',
          },
          {
            nome: 'Notificações',
            onde: 'Centro-direita do cabeçalho',
            paraQueServe: 'Leva direto à Central de Notificações com badge de itens pendentes.',
            icone: 'Bell',
          },
          {
            nome: 'Seletor de Loja Ativa',
            onde: 'Centro da topbar (Master/ADM)',
            paraQueServe:
              'Muda a loja ativa do Storefront para gerenciar episódios e dados isolados.',
            icone: 'Store',
          },
        ],
        dica: 'No celular, a barra superior conta com botão de sino de notificações e botão hamburguer que abre o menu lateral completo.',
      },
      {
        id: 'meu-perfil-e-seguranca',
        titulo: 'Meu Perfil & Foto de Perfil',
        subtitulo: 'Personalize seus dados, foto de avatar e credenciais de acesso',
        icone: 'User',
        rota: '/perfil',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        ondeClicar:
          'Clique no seu avatar ou nome no cabeçalho superior (ou no rodapé da barra lateral).',
        paraQueServe:
          'Permite atualizar sua foto de perfil (avatar), nome completo, biografia, telefone/WhatsApp e redefinir sua senha de acesso com segurança instantânea em todo o ecossistema CoffeeCast (cabeçalhos, chat interno e área de membros).',
        passoAPasso: [
          'Para trocar a foto de perfil: clique sobre o avatar redondo ou no botão "Escolher Foto" e selecione uma imagem do seu computador ou celular (formatos JPG, PNG ou WebP de até 8MB).',
          'Veja a pré-visualização instantânea da imagem escolhida.',
          'Para salvar apenas a foto com 1 clique: clique no botão dourado "Salvar Esta Foto Agora" logo abaixo do avatar.',
          'Alternativamente, você também pode preencher ou revisar seu nome completo, telefone e bio e clicar em "Salvar Dados Pessoais" no final do formulário.',
          'Se quiser remover sua foto e voltar ao avatar com iniciais elegantes da marca: clique no botão vermelho "Remover Foto" e confirme.',
          'Se desejar alterar a senha: no cartão "Segurança da Conta", informe a "Senha Atual", digite a "Nova Senha" (mínimo 8 caracteres) e clique em "Atualizar Senha".',
        ],
        botoesPrincipais: [
          {
            nome: 'Escolher Foto / Câmera',
            onde: 'Sobre a imagem redonda de perfil ou logo abaixo dela',
            paraQueServe:
              'Abre o explorador de arquivos para carregar uma foto em formato JPG, PNG ou WebP.',
          },
          {
            nome: 'Salvar Esta Foto Agora',
            onde: 'Caixa de confirmação logo abaixo da pré-visualização da foto',
            paraQueServe:
              'Grava a nova foto imediatamente no PocketBase, atualizando seu avatar no cabeçalho, na barra lateral, no chat e na Área de Membros.',
          },
          {
            nome: 'Salvar Dados Pessoais',
            onde: 'Canto inferior do formulário de dados do perfil',
            paraQueServe:
              'Grava todas as informações pessoais (nome, telefone, bio e foto pendente) com registro em Auditoria.',
          },
          {
            nome: 'Remover Foto',
            onde: 'Ao lado do botão de escolher foto (visível quando há foto carregada)',
            paraQueServe:
              'Remove o arquivo de foto e volta ao avatar padrão com as iniciais do seu nome.',
          },
          {
            nome: 'Sair da Conta (Logout)',
            onde: 'Rodapé da barra lateral ou canto do cabeçalho do perfil',
            paraQueServe: 'Encerra a sessão com segurança e desconecta o usuário.',
          },
        ],
        dica: 'A foto de perfil é compartilhada automaticamente com o Chat Oficial CoffeeCast, aparecendo para todos os colegas de equipe e membros da comunidade nas conversas privadas e nos grupos.',
        atencao:
          'Qualquer membro autenticado (Master, ADM, Gerencial, Ouro ou Prata) tem permissão total para alterar a própria foto e dados pessoais a qualquer momento. Para trocar de senha, é obrigatório informar a senha atual correta por motivos de segurança antifraude.',
      },
    ],
  },
  {
    id: 'gestao-operacional',
    titulo: '2. Painel Administrativo — Gestão Operacional',
    descricao:
      'Telas do dia a dia da produção organizadas em ordem alfabética no menu lateral: agenda, chat, contatos, episódios, financeiro, roteiros, visão geral e IA.',
    icone: 'Sliders',
    itens: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral (Dashboard)',
        subtitulo: 'Painel de métricas e indicadores de desempenho em tempo real',
        icone: 'LayoutDashboard',
        rota: '/admin',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ Item "Visão Geral" (organizado em ordem alfabética).',
        paraQueServe:
          'Reúne os principais números da operação: total de episódios no ar, novos leads, despesas em aberto, gravações agendadas e saldo de horas do estúdio.',
        passoAPasso: [
          'Observe os 5 cartões superiores com contadores em destaque dourado e vinho.',
          'Verifique o gráfico de distribuição de custos por categoria (gravação, edição, marketing, etc.).',
          'Consulte a tabela "Próximas Gravações" para saber quais gravações estão confirmadas no estúdio.',
          'Consulte a lista "Últimos Contatos & Leads" para retornar mensagens de visitantes recentes.',
        ],
        botoesPrincipais: [
          {
            nome: 'Ver todas as gravações',
            onde: 'Acima da tabela de gravações',
            paraQueServe: 'Redireciona diretamente para a tela de Agenda.',
          },
          {
            nome: 'Ver todos os contatos',
            onde: 'Acima da lista de contatos',
            paraQueServe: 'Redireciona para o CRM de Contatos e Leads.',
          },
        ],
        dica: 'O saldo de horas do estúdio aparece em dourado metálico. Se estiver zerado ou negativo, um alerta visual solicitará recarga de pacote.',
      },
      {
        id: 'central-notificacoes',
        titulo: 'Central de Notificações',
        subtitulo: 'Avisos consolidados de roteiros, contatos e depoimentos recebidos',
        icone: 'Bell',
        rota: '/admin/notificacoes',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Notificações" (ou no ícone de sino no cabeçalho superior).',
        paraQueServe:
          'Centraliza tudo o que os visitantes e convidados enviaram pelo site público que ainda não foi revisado pela equipe.',
        passoAPasso: [
          'Utilize os filtros rápidos no topo: "Todas", "Roteiros", "Depoimentos" ou "Contatos".',
          'Clique no card de qualquer notificação para abrir os detalhes completos.',
          'Use o botão "Marcar todas como lidas" para zerar o contador do sino.',
          'Clique no link "Abrir registro" dentro do card para ser levado diretamente à tela de atendimento daquele item.',
        ],
        botoesPrincipais: [
          {
            nome: 'Marcar Todas como Lidas',
            onde: 'Topo direito da tela',
            paraQueServe: 'Atualiza o status de todas as notificações pendentes para visualizadas.',
          },
          {
            nome: 'Filtros por Tipo (Roteiros / Depoimentos / Contatos)',
            onde: 'Barra de abas no topo',
            paraQueServe: 'Filtra os cards por categoria para organizar a rotina de atendimento.',
          },
        ],
      },
      {
        id: 'chat-coffeecast',
        titulo: 'Chat Interno CoffeeCast',
        subtitulo: 'Mensageria instantânea com figurinhas, emojis e grupos',
        icone: 'MessageSquare',
        rota: '/admin/chat',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        ondeClicar:
          'Menu lateral ➔ "Chat CoffeeCast" (ou no botão "Chat" no topo da Área de Membros).',
        paraQueServe:
          'Comunicação interna segura em tempo real entre equipe, apresentadoras, patrocinadores (Ouro) e membros (Prata).',
        passoAPasso: [
          'Selecione uma conversa na coluna esquerda: o canal "# Geral", uma conversa privada 1 a 1 ou um Grupo temático.',
          'Digite sua mensagem no campo inferior.',
          'Para enviar emojis ou figurinhas do CoffeeCast: clique no ícone de sorriso/adesivo ao lado do campo de texto.',
          'Para criar um novo grupo (apenas Master, ADM e Gerencial): clique no botão "+ Novo Grupo" no topo da lista.',
          'Acompanhe o status dos colegas pela bolinha colorida no avatar: Verde (Online), Amarelo (Em pausa) ou Cinza (Offline).',
        ],
        botoesPrincipais: [
          {
            nome: '+ Novo Grupo / Nova Conversa',
            onde: 'Topo da coluna lateral de conversas',
            paraQueServe:
              'Abre modal para escolher integrantes, definir nome e imagem de capa do grupo.',
          },
          {
            nome: 'Seletor de Figurinhas & Emojis',
            onde: 'Barra de digitação do chat',
            paraQueServe:
              'Abre a gaveta com dezenas de figurinhas exclusivas do CoffeeCast e emojis.',
          },
          {
            nome: 'Enviar Mensagem',
            onde: 'Ícone de avião de papel ou tecla Enter',
            paraQueServe:
              'Transmite a mensagem instantaneamente via WebSocket para todos os participantes.',
          },
        ],
        dica: 'Você pode alterar seu status de presença (ex: "Em pausa - gravando") no seu Perfil para avisar os outros usuários.',
      },
      {
        id: 'nine-assistente',
        titulo: 'Nine — Assistente Virtual IA',
        subtitulo: 'Configuração da IA flutuante, base de conhecimento e modo humano',
        icone: 'Bot',
        rota: '/admin/nine',
        perfisPermitidos: ['master', 'adm'],
        ondeClicar: 'Menu lateral ➔ "Nine Assistente Virtual".',
        paraQueServe:
          'Comanda o cérebro da assistente Nine que atende visitantes 24h no site público, colhe leads e cria contas Prata automaticamente.',
        passoAPasso: [
          'Aba "Personalidade & Prompt": ajuste o tom de voz, regras de atendimento e se o atendimento automático está ativado.',
          'Aba "Base de Conhecimento": cadastre perguntas frequentes (FAQs), informações sobre planos de patrocínio e detalhes do estúdio para a IA consultar.',
          'Aba "Prompt Livre": adicione instruções adicionais e regras de negócio específicas.',
          'Aba "Conversas em Andamento": visualize os diálogos em tempo real no site e, se necessário, ative o "Modo Humano" para você mesmo responder ao visitante (com histórico em tempo real e barra de rolagem CoffeeCast com arraste manual suave para cima e para baixo).',
        ],
        botoesPrincipais: [
          {
            nome: 'Salvar Configurações da Nine',
            onde: 'Abaixo do editor de prompt',
            paraQueServe: 'Atualiza imediatamente o comportamento da IA em todo o site público.',
          },
          {
            nome: '+ Novo Item de Conhecimento',
            onde: 'Aba Base de Conhecimento',
            paraQueServe:
              'Adiciona uma nova pergunta/resposta ou instrução institucional ao banco da Nine.',
          },
          {
            nome: 'Assumir Atendimento (Modo Humano)',
            onde: 'Lista de conversas da Nine',
            paraQueServe:
              'Pausa as respostas automáticas da IA naquela conversa e permite ao atendente digitar.',
          },
        ],
        atencao:
          'Ao desativar o atendimento automático, a Nine parará de responder no site até que seja reativada.',
      },
      {
        id: 'gestao-episodios',
        titulo: 'Gestão de Episódios',
        subtitulo: 'Cadastro, numeração e vinculação dos vídeos do YouTube',
        icone: 'Tv',
        rota: '/admin/episodios',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Episódios".',
        paraQueServe:
          'Cadastra os episódios oficiais que aparecem na Home pública e na Área de Membros.',
        passoAPasso: [
          'Clique no botão dourado "+ Novo Episódio".',
          'Informe o número oficial do episódio (ex.: 12), o título completo e a URL do vídeo no YouTube.',
          'O sistema reconhece tanto links tradicionais (watch?v=...) quanto YouTube Shorts e formatos encurtados (youtu.be).',
          'Clique em "Salvar Episódio". O episódio aparecerá automaticamente no carrossel da Home.',
        ],
        botoesPrincipais: [
          {
            nome: '+ Novo Episódio',
            onde: 'Topo direito da tela',
            paraQueServe: 'Abre modal com formulário para cadastrar uma nova gravação.',
          },
          {
            nome: 'Editar (ícone de lápis)',
            onde: 'Ao lado de cada linha da tabela',
            paraQueServe: 'Permite alterar título, número ou link do YouTube.',
          },
          {
            nome: 'Excluir (ícone de lixeira)',
            onde: 'Ao lado de cada linha da tabela',
            paraQueServe: 'Remove o episódio do site após confirmação.',
          },
        ],
      },
      {
        id: 'nossos-momentos',
        titulo: 'Nossos Momentos (Carrossel Dinâmico)',
        subtitulo: 'Upload de fotos de bastidores e ordenação do carrossel da Home',
        icone: 'Camera',
        rota: '/admin/momentos',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Nossos Momentos".',
        paraQueServe:
          'Gerencia as fotos de bastidores, gravações e confraternizações que giram automaticamente a cada 3 segundos na Home pública.',
        passoAPasso: [
          'Clique em "+ Novo Momento".',
          'Faça o upload da fotografia e, se quiser, digite uma legenda curta explicativa.',
          'Defina a ordem numérica de exibição ou use os botões de seta para cima/baixo para reordenar.',
          'Clique em "Salvar". As fotos entram imediatamente na rotação do site.',
        ],
        botoesPrincipais: [
          {
            nome: '+ Novo Momento',
            onde: 'Topo direito da tela',
            paraQueServe: 'Abre o formulário de envio de foto.',
          },
          {
            nome: 'Subir / Descer Ordem (Setas)',
            onde: 'Em cada card de foto',
            paraQueServe: 'Reordena a posição da fotografia no carrossel da Home com 1 clique.',
          },
        ],
      },
      {
        id: 'roteiros-apresentacoes',
        titulo: 'Roteiros e Apresentações',
        subtitulo: 'Formulários dos convidados, sugestão de pauta com IA e upload final',
        icone: 'FileText',
        rota: '/admin/roteiros',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Roteiros e Apresentações".',
        paraQueServe:
          'Recebe as fichas preenchidas pelos convidados no portal público (/roteiro), permitindo criar pautas afinadas com apoio da Nine.',
        passoAPasso: [
          'Localize o convidado na lista de roteiros recebidos.',
          'Clique em "Visualizar Roteiro" para ver os dados familiares, histórico de negócios, temas que ele quer enfatizar e temas sensíveis a evitar.',
          'Clique no botão "Baixar PDF" (disponível tanto na lista quanto no modal de detalhes) para gerar um documento formal A4 com cabeçalho oficial CoffeeCast 4.0, logo, dados e todas as respostas do convidado já prontas para impressão ou salvamento.',
          'Clique no botão "Gerar Sugestão com a Nine" para que a IA analise as respostas e crie um roteiro pronto com perguntas recomendadas para a entrevista.',
          'Edite o texto do roteiro no editor e, se desejar, anexe o arquivo final (PDF/DOCX) aprovado pela produção.',
          'Atualize o status para "Lido" ou "Arquivado".',
        ],
        botoesPrincipais: [
          {
            nome: 'Baixar PDF das Respostas',
            onde: 'Na coluna de ações de cada roteiro e no topo do modal de detalhes',
            paraQueServe:
              'Gera um arquivo PDF em formato A4 padronizado na identidade visual do CoffeeCast contendo todas as perguntas e respostas preenchidas pelo convidado.',
            icone: 'Download',
          },
          {
            nome: 'Gerar Pauta com IA (Nine)',
            onde: 'Dentro do modal de detalhes do roteiro e na aba Nine · Assistente Virtual',
            paraQueServe:
              'Sintetiza a história do convidado e gera automaticamente uma pauta estruturada de perguntas.',
          },
          {
            nome: 'Salvar Roteiro no Registro do Convidado',
            onde: 'Abaixo da sugestão gerada pela Nine na aba Assistente Virtual ou no modal',
            paraQueServe:
              'Vincula a pauta completa gerada pela IA diretamente ao campo de roteiro final do convidado (com suporte a textos amplos de até 100.000 caracteres e registro em Auditoria).',
          },
          {
            nome: 'Salvar Roteiro Final',
            onde: 'Rodapé do editor de roteiro',
            paraQueServe: 'Grava o roteiro aprovado que poderá ser consultado durante a gravação.',
          },
          {
            nome: 'Baixar Foto do Convidado',
            onde: 'Ao lado do avatar do convidado',
            paraQueServe: 'Faz download da imagem em alta resolução enviada pelo convidado.',
          },
        ],
        dica: 'O PDF das respostas gerado possui o cabeçalho e as cores da marca (#4B1E3F e #D4AF37), organiza os temas sensíveis com destaque de alerta visual para a produção e salva o arquivo com o nome personalizado "roteiro-[nome-do-convidado].pdf". Cada download é registrado automaticamente na Auditoria do Sistema.',
      },
      {
        id: 'depoimentos-moderacao',
        titulo: 'Depoimentos & Moderação',
        subtitulo: 'Aprovação de relatos de convidados e download de fotos originais',
        icone: 'MessageSquareQuote',
        rota: '/admin/depoimentos',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Depoimentos".',
        paraQueServe:
          'Modera os relatos enviados pelo site público (/depoimento) e organiza os depoimentos de autoridade exibidos na Home.',
        passoAPasso: [
          'Aba "Depoimentos Recebidos do Site": veja os novos envios com foto, nome, empresa, Instagram e mensagem do convidado.',
          'Clique em "Aprovar e Publicar" para mover o depoimento diretamente para o carrossel da Home pública.',
          'Clique em "Manter Oculto" se preferir guardar o depoimento apenas para uso interno.',
          'Utilize o botão "Baixar Foto Original" para obter a foto em tamanho real para usar nos posts de redes sociais.',
          'Aba "Depoimentos Publicados": edite o texto, reordene ou desative depoimentos ativos.',
        ],
        botoesPrincipais: [
          {
            nome: 'Aprovar e Publicar (1 clique)',
            onde: 'Card de depoimento recebido',
            paraQueServe:
              'Aprova o relato e o torna visível imediatamente para todos os visitantes do site.',
          },
          {
            nome: 'Baixar Foto Original',
            onde: 'Ao lado da foto do depoimento',
            paraQueServe:
              'Download do arquivo de imagem enviado pelo convidado em resolução total.',
          },
          {
            nome: '+ Novo Depoimento Manual',
            onde: 'Topo da aba Depoimentos Publicados',
            paraQueServe: 'Permite cadastrar um depoimento diretamente sem depender de formulário.',
          },
        ],
      },
      {
        id: 'contatos-leads',
        titulo: 'Contatos & Leads Comerciais',
        subtitulo: 'CRM de captação pública e leads gerados pela Nine',
        icone: 'Inbox',
        rota: '/admin/contatos',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Contatos & Leads".',
        paraQueServe:
          'Gerencia as mensagens deixadas no formulário "Quero Participar" da Home e os leads captados pela assistente virtual Nine.',
        passoAPasso: [
          'Filtre os contatos por status: "Novo", "Visualizado" ou "Contatado".',
          'Leads gerados pela Nine possuem uma tag visual dourada especial "Lead Nine IA".',
          'Clique no botão com ícone do WhatsApp para abrir imediatamente uma conversa com o lead no aplicativo oficial já com mensagem pronta.',
          'Abra os detalhes para adicionar "Notas Comerciais" da negociação (ex.: interesse em patrocínio, valor acertado).',
        ],
        botoesPrincipais: [
          {
            nome: 'Iniciar Conversa no WhatsApp',
            onde: 'Coluna de ações de cada contato',
            paraQueServe: 'Abre o WhatsApp Web/App com o telefone do lead preenchido.',
          },
          {
            nome: 'Enviar E-mail (mailto)',
            onde: 'Ao lado do e-mail do contato',
            paraQueServe: 'Abre seu cliente de e-mail padrão para responder à proposta.',
          },
          {
            nome: 'Alterar Status (Novo / Visualizado / Contatado)',
            onde: 'Dropdown no card do contato',
            paraQueServe: 'Avança o lead no funil de atendimento comercial.',
          },
        ],
        dica: 'Contatos captados pela Nine já têm conta Prata criada automaticamente no sistema, o que facilita oferecer upgrades para membro Ouro ou patrocinador.',
      },
      {
        id: 'financeiro-e-rateio',
        titulo: 'Financeiro & Divisão de Valores',
        subtitulo: 'Receitas, despesas, sincronização de pacotes de horas e rateio entre sócios',
        icone: 'DollarSign',
        rota: '/admin/financeiro',
        perfisPermitidos: ['master', 'adm'],
        ondeClicar: 'Menu lateral ➔ "Financeiro".',
        paraQueServe:
          'Controla todo o fluxo financeiro do podcast, compras de pacotes no estúdio e realiza o rateio/divisão de receitas entre as apresentadoras.',
        passoAPasso: [
          'Observe os cards de resumo no topo: Receitas Totais, Despesas Totais e Saldo Líquido.',
          'Para cadastrar uma movimentação: clique em "+ Nova Transação".',
          'Escolha se é "Receita" (ex.: patrocínio, monetização YouTube) ou "Despesa" (edição, aluguel, equipamento).',
          'Informe o valor, categoria, vencimento e se a situação está "Quitada" ou "Em aberto".',
          'Aba "Divisão / Rateio": selecione uma receita e defina os percentuais ou valores que cabem a cada integrante da equipe.',
        ],
        botoesPrincipais: [
          {
            nome: '+ Nova Transação',
            onde: 'Topo direito da tela',
            paraQueServe: 'Abre o formulário de lançamento financeiro.',
          },
          {
            nome: 'Ratear Receita entre Integrantes',
            onde: 'Aba Rateio ou ao editar uma receita',
            paraQueServe: 'Calcula a fatia de cada sócia e gera comprovante de divisão.',
          },
          {
            nome: 'Filtro por Categoria e Situação',
            onde: 'Barra de filtros superior',
            paraQueServe: 'Filtra transações quitadas vs pendentes para conciliação bancária.',
          },
        ],
        atencao:
          'Lançamentos de pacotes de horas do estúdio sincronizam automaticamente com a tela de Controle de Horas.',
      },
      {
        id: 'controle-horas-estudio',
        titulo: 'Controle de Horas (Estúdio)',
        subtitulo: 'Banco de horas contratadas, saldo em dourado e abatimento por gravação',
        icone: 'Clock',
        rota: '/admin/horas',
        perfisPermitidos: ['master', 'adm'],
        ondeClicar: 'Menu lateral ➔ "Controle de Horas".',
        paraQueServe:
          'Garante que o podcast nunca fique sem crédito de estúdio para gravar, monitorando compras de pacotes e consumo.',
        passoAPasso: [
          'Confira o cartão gigante em destaque com o "Saldo de Horas Disponíveis".',
          'Acompanhe a barra de progresso visual de horas consumidas vs contratadas.',
          'Para registrar um novo pacote comprado no estúdio: clique em "+ Adicionar Pacote de Horas".',
          'Informe a quantidade de horas (ex.: 10 horas), o valor pago e a data de aquisição.',
          'Conforme as gravações são agendadas na tela de Agenda, as horas correspondentes são debitadas do saldo.',
        ],
        botoesPrincipais: [
          {
            nome: '+ Adicionar Pacote de Horas',
            onde: 'Topo direito da tela',
            paraQueServe:
              'Cadastra uma nova compra de horas que credita o saldo e gera despesa no financeiro.',
          },
          {
            nome: 'Histórico de Pacotes',
            onde: 'Tabela inferior',
            paraQueServe: 'Lista cada compra de horas realizada com data, valor e notas fiscais.',
          },
        ],
        dica: 'O sistema avisa com badge vermelho quando restarem menos de 3 horas de saldo no estúdio.',
      },
      {
        id: 'agenda-gravacoes',
        titulo: 'Agenda de Gravação',
        subtitulo: 'Calendário visual interativo, cronograma de postagens e horas gastas',
        icone: 'CalendarDays',
        rota: '/admin/agenda',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Agenda de Gravação".',
        paraQueServe:
          'Planeja e coordena datas de gravação em estúdio, datas de postagem nas redes, convidados confirmados e patrocinadores.',
        passoAPasso: [
          'Alterne entre as abas de visualização: "Calendário Interativo", "Lista Completa", "Próximas Gravações" ou "Gravações Passadas".',
          'Para agendar: clique em "+ Novo Agendamento" ou clique diretamente em um dia do calendário.',
          'Preencha o título do episódio, nome do convidado, data/horário de gravação, data prevista de postagem e patrocinadores.',
          'Informe a "Quantidade de horas utilizadas no estúdio" (para débito automático no banco de horas).',
          'Use o campo "Roteiro" com o recurso "Ler mais / Ler menos" para colar anotações rápidas.',
        ],
        botoesPrincipais: [
          {
            nome: '+ Novo Agendamento',
            onde: 'Topo direito da tela',
            paraQueServe: 'Abre o formulário completo de agendamento de estúdio.',
          },
          {
            nome: 'Visão Calendário vs Lista',
            onde: 'Seletor no topo da agenda',
            paraQueServe:
              'Muda entre a visualização mensal com cores por tipo de evento e a lista corrida cronológica.',
          },
          {
            nome: 'Vincular Convidado / Patrocinador',
            onde: 'Dentro do formulário de agendamento',
            paraQueServe: 'Associa os dados que alimentarão o Gerador de Convites.',
          },
        ],
      },
      {
        id: 'gerador-convites',
        titulo: 'Gerador de Convites Premium',
        subtitulo: 'Criação de convites de gala com exportação em JPEG em alta resolução ou PDF',
        icone: 'FileCheck2',
        rota: '/admin/convites',
        perfisPermitidos: ['master', 'adm', 'gerencial'],
        ondeClicar: 'Menu lateral ➔ "Gerador de Convites" (com badge PDF).',
        paraQueServe:
          'Gera convites elegantes no padrão visual ouro/vinho do CoffeeCast com a foto do convidado para enviar por WhatsApp ou imprimir.',
        passoAPasso: [
          'Configure o Endereço e a Localização Padrão no card superior: informe o endereço físico fixo do estúdio e o link do Google Maps (com botão "Testar link" para validação imediata) e clique em "Salvar Padrão". Esses valores virão automaticamente preenchidos em todos os novos convites criados.',
          'Configure o Texto de Apresentação Padrão por Gênero: defina uma mensagem personalizada para Convidado (homem) e outra para Convidada (mulher) e clique em "Salvar Padrão". Ao gerar novos convites, o texto correspondente ao gênero selecionado será preenchido automaticamente.',
          'Clique no botão dourado "Gerar Novo Convite": os campos "Endereço da gravação:", "Localização" e o "Texto de Apresentação" já virão preenchidos com os padrões definidos, mantendo total liberdade para edição individual antes de salvar.',
          'Preencha o nome do convidado ou convidada e selecione o tratamento ("Convidada de Honra" ou "Convidado de Honra"): a seleção atualiza instantaneamente o texto padrão de apresentação correspondente.',
          'Informe a data da gravação e horário marcado para início.',
          'Faça o upload da foto em alta resolução do convidado e, opcionalmente, da logomarca da empresa.',
          'Revise ou ajuste livremente a mensagem de apresentação/boas-vindas.',
          'Visualize o convite em tempo real no preview interativo: a foto do convidado ganha protagonismo nobre no centro do convite com medalhão circular e moldura dupla dourada. O recorte circular é incorporado diretamente à própria imagem (Canvas com canal alfa transparente e foco facial a 18% do topo), garantindo que a foto nunca apareça cortada ou vazando fora do círculo em nenhum dispositivo — seja no PC, no visualizador de PDF do celular ou ao enviar pelo WhatsApp.',
          'Clique em "JPEG" para salvar a imagem em alta resolução e enviar pelo WhatsApp, ou em "Gerar PDF" para exportar o arquivo formal de impressão em tamanho oficial A5 em janela dedicada ou diálogo direto, com fidelidade visual idêntica ao preview, foto circular blindada em qualquer visualizador e link ativo do Maps.',
        ],
        botoesPrincipais: [
          {
            nome: 'Salvar Padrão (Endereço & Localização)',
            onde: 'Card superior da tela de Convites',
            paraQueServe:
              'Grava globalmente o endereço físico e link do Google Maps que virão pré-preenchidos em novos convites.',
            icone: 'Save',
          },
          {
            nome: 'Salvar Padrão (Texto por Gênero)',
            onde: 'Card de Texto de Apresentação Padrão',
            paraQueServe:
              'Grava globalmente as mensagens de boas-vindas padrão diferenciadas para Convidado (homem) e Convidada (mulher).',
            icone: 'Save',
          },
          {
            nome: 'Testar Link (Google Maps)',
            onde: 'Ao lado do campo de Localização Padrão',
            paraQueServe:
              'Abre a URL cadastrada em nova aba para certificar que aponta exatamente para a rota do estúdio.',
            icone: 'ExternalLink',
          },
          {
            nome: 'Baixar Imagem JPEG (Alta Resolução)',
            onde: 'Barra superior de ações do preview',
            paraQueServe:
              'Renderiza o convite em canvas com resolução nítida para redes sociais e WhatsApp.',
          },
          {
            nome: 'Gerar PDF (Formato Oficial A5)',
            onde: 'Barra superior de ações do preview',
            paraQueServe:
              'Abre a janela dedicada de impressão/PDF configurada em formato A5 (148 x 210 mm) sem margens, com todas as cores fiéis ao preview e fallback automático em caso de bloqueio de pop-up.',
          },
          {
            nome: '+ Salvar Convite no Histórico',
            onde: 'Rodapé do formulário',
            paraQueServe:
              'Armazena o convite na lista para reemissão futura sem precisar preencher tudo de novo.',
          },
          {
            nome: 'Ver no Google Maps (Link Clicável)',
            onde: 'No PDF e preview do convite (quando informado)',
            paraQueServe:
              'Abre a rota e localização exata do estúdio no Google Maps diretamente do documento.',
          },
        ],
        dica: 'Dica para salvar o PDF perfeito: ao clicar em "Gerar PDF", o sistema abre uma janela dedicada configurada com CSS @page A5 oficial. Na janela de impressão do navegador, certifique-se de que a opção "Gráficos de segundo plano" (Background graphics) esteja marcada para preservar todos os gradientes de vinho e dourado. Caso o navegador bloqueie novas abas, um fallback automático de impressão é acionado com aviso visual.',
      },
      {
        id: 'auditoria-sistema',
        titulo: 'Auditoria do Sistema & Segurança',
        subtitulo: 'Logs imutáveis, visualizador de antes/depois, alertas e exportação CSV',
        icone: 'Activity',
        rota: '/admin/auditoria',
        perfisPermitidos: ['master', 'adm'],
        ondeClicar: 'Menu lateral ➔ "Auditoria do Sistema".',
        paraQueServe:
          'Registra com precisão forense todas as ações executadas no sistema (criação, edição, exclusão de dados e acessos), garantindo conformidade e proteção antifraude.',
        passoAPasso: [
          'Aba "Dashboard de Auditoria": confira gráficos de operações mais frequentes, usuários mais ativos e severidade de eventos.',
          'Aba "Trilha de Registros": pesquise logs por usuário, ação (CREATE, UPDATE, DELETE), recurso ou período.',
          'Clique em qualquer linha para abrir o "Visualizador Comparativo de Alterações", que mostra lado a lado os valores anteriores (em vermelho) e os novos (em verde).',
          'Aba "Central de Alertas": configure regras automáticas (ex.: muitas exclusões em curto intervalo).',
          'Clique em "Exportar CSV" para baixar a planilha completa de auditoria para auditorias externas.',
        ],
        botoesPrincipais: [
          {
            nome: 'Visualizar Alterações (Diff Antes/Depois)',
            onde: 'Ao clicar em qualquer registro de log',
            paraQueServe: 'Exibe exatamente quais campos foram alterados com destaque de cores.',
          },
          {
            nome: 'Exportar para CSV',
            onde: 'Topo da trilha de registros',
            paraQueServe: 'Baixa relatório completo em planilha para relatórios de compliance.',
          },
          {
            nome: '+ Nova Regra de Alerta',
            onde: 'Aba Central de Alertas',
            paraQueServe:
              'Define limites que disparam avisos de severidade alta para os administradores.',
          },
        ],
        atencao:
          'Os logs de auditoria são imutáveis e não podem ser apagados por nenhum usuário, nem mesmo pelo Master, garantindo idoneidade.',
      },
    ],
  },
  {
    id: 'exclusivo-master',
    titulo: '3. Submenu Exclusivo Master & Governança',
    descricao:
      'Ferramentas de governança e soberania organizadas em ordem alfabética dentro do submenu: Área do Domínio, Auditoria, Backups, Documentação, Editar Site, Gestão de Conversas, Guia de Ajuda, Integrantes, Políticas, Storefront e Usuários.',
    icone: 'Shield',
    itens: [
      {
        id: 'storefront-multi-loja',
        titulo: 'Storefront (Multi-Lojas Ilimitadas)',
        subtitulo: 'Crie e hospede múltiplos podcasts independentes com marca própria',
        icone: 'Store',
        rota: '/admin/storefront',
        perfisPermitidos: ['master', 'adm'],
        badge: 'Multi-Loja',
        exclusivoMaster: true,
        ondeClicar: 'Submenu "Exclusivo Master" ➔ "Storefront".',
        paraQueServe:
          'Permite criar e gerenciar infinitos podcasts parceiros ou lojas filhas. Cada loja possui paleta de cores (5 tons), logotipo, banners, episódios e integrantes isolados.',
        passoAPasso: [
          'Clique em "+ Nova Loja".',
          'Defina o nome da loja, slug amigável (ex.: /loja/meu-podcast) e domínio próprio opcional.',
          'Escolha as 5 cores da paleta personalizada usando os seletores de cor.',
          'Faça o upload da logomarca, favicon e banners da nova marca.',
          'Cadastre os episódios e integrantes específicos dessa loja.',
          'Use o "Seletor Global de Loja" no cabeçalho do painel para alternar entre as lojas ativas.',
        ],
        botoesPrincipais: [
          {
            nome: '+ Nova Loja',
            onde: 'Topo direito da tela de Storefront',
            paraQueServe: 'Abre o assistente para criar uma nova loja ou marca filha do zero.',
          },
          {
            nome: 'Visualizar Loja Pública',
            onde: 'Card de cada loja criada',
            paraQueServe: 'Abre a página pública da loja filha no caminho /loja/[slug].',
          },
          {
            nome: 'Alternar Loja Ativa',
            onde: 'Card da loja ou no topo do painel',
            paraQueServe:
              'Muda o contexto de trabalho de todo o painel administrativo para a loja selecionada.',
          },
        ],
        dica: 'Cada loja pode ter seu próprio domínio personalizado configurado via apontamento DNS.',
      },
      {
        id: 'area-dominio',
        titulo: 'Área do Domínio & DNS',
        subtitulo: 'Instruções de apontamento para colocar o site no domínio corporativo',
        icone: 'Globe',
        rota: '/admin/dominio',
        perfisPermitidos: ['master', 'adm'],
        badge: 'DNS',
        exclusivoMaster: true,
        ondeClicar: 'Submenu "Exclusivo Master" ➔ "Área do Domínio".',
        paraQueServe:
          'Ensina passo a passo como apontar seu domínio registrado (Registro.br, GoDaddy, Hostinger, Cloudflare) para a infraestrutura do CoffeeCast.',
        passoAPasso: [
          'Digite seu domínio no campo indicado (ex.: coffeecast.com.br).',
          'Copie os registros DNS fornecidos na tabela:',
          '— Registro CNAME: nome "www" apontando para o endereço de infraestrutura fornecido.',
          '— Registro A: nome "@" apontando para o endereço IP fixo indicado.',
          'Acesse o painel do seu registrador de domínio e adicione os dois registros.',
          'Acompanhe o status em tempo real: "Pendente DNS", "Aguardando Propagação" ou "Domínio Ativo".',
        ],
        botoesPrincipais: [
          {
            nome: 'Salvar Configuração de Domínio',
            onde: 'Abaixo dos campos de domínio',
            paraQueServe: 'Grava o domínio corporativo e inicia a verificação de propagação.',
          },
          {
            nome: 'Copiar Registro DNS',
            onde: 'Ao lado de cada valor da tabela',
            paraQueServe: 'Copia o CNAME ou IP para a área de transferência com um clique.',
          },
        ],
        atencao:
          'A propagação de DNS na internet costuma levar de alguns minutos até 48 horas dependendo do seu provedor.',
      },
      {
        id: 'usuarios-permissoes',
        titulo: 'Usuários & Permissões Granulares',
        subtitulo: 'Gestão completa de contas e matriz de permissões por tela para o ADM',
        icone: 'UserCheck',
        rota: '/admin/usuarios',
        perfisPermitidos: ['master'],
        badge: 'Master',
        exclusivoMaster: true,
        ondeClicar:
          'Submenu "Exclusivo Master" ➔ "Usuários & Permissões" (acesso exclusivo do Master soberano).',
        paraQueServe:
          'Cria novos operadores, redefine senhas, bloqueia acessos e define com precisão cirúrgica quais telas e lojas cada ADM pode acessar.',
        passoAPasso: [
          'Clique em "+ Novo Usuário".',
          'Preencha nome, e-mail, senha inicial e selecione a categoria: Master, ADM, Gerencial, Ouro ou Prata.',
          'Se selecionar ADM: uma matriz de checkboxes será exibida.',
          'Marque exatamente quais telas o ADM terá acesso (ex.: pode acessar apenas Financeiro e Agenda, sem ver Storefront ou Usuários).',
          'Defina também se ele gerencia todas as lojas ou apenas lojas específicas.',
          'Clique em "Salvar Usuário".',
        ],
        botoesPrincipais: [
          {
            nome: '+ Novo Usuário',
            onde: 'Topo direito da tela',
            paraQueServe: 'Abre formulário para criar uma nova conta de acesso.',
          },
          {
            nome: 'Editar Permissões Granulares',
            onde: 'Coluna de ações de cada usuário ADM',
            paraQueServe: 'Abre a matriz de telas para ativar/desativar acessos modulares.',
          },
          {
            nome: 'Redefinir Senha do Usuário',
            onde: 'Menu de ações do usuário',
            paraQueServe:
              'Permite ao Master definir uma nova senha direta caso o usuário tenha esquecido.',
          },
          {
            nome: 'Bloquear / Ativar Conta',
            onde: 'Interruptor de status ativo',
            paraQueServe: 'Revoga o acesso imediatamente sem apagar o histórico de ações.',
          },
        ],
        dica: 'Essa granularidade permite revender o sistema para clientes que só precisam ver seus relatórios operacionais sem comprometer outras áreas da plataforma.',
      },
      {
        id: 'editar-site-conteudo',
        titulo: 'Editar Site & Redes Sociais',
        subtitulo: 'Textos institucionais, missão, valores, propósito e links de redes sociais',
        icone: 'FileText',
        rota: '/admin/conteudo',
        perfisPermitidos: ['master', 'adm'],
        exclusivoMaster: true,
        ondeClicar: 'Submenu "Exclusivo Master" ➔ "Editar Site".',
        paraQueServe:
          'Atualiza o conteúdo institucional da Home pública e normaliza links de redes sociais do rodapé.',
        passoAPasso: [
          'Edite os textos de Missão, Visão, Valores e Propósito.',
          'Ajuste o texto da chamada comercial do rodapé.',
          'Atualize os links das redes sociais (Instagram, TikTok, Facebook, LinkedIn). O sistema aceita qualquer formato (com @, sem @, URL completa) e normaliza automaticamente.',
          'Defina o aviso de frequência de publicação (ex.: "Novos episódios todas as terças às 20h").',
          'Clique em "Salvar Alterações". O site público atualiza instantaneamente.',
        ],
        botoesPrincipais: [
          {
            nome: 'Salvar Conteúdos do Site',
            onde: 'Rodapé do formulário',
            paraQueServe: 'Aplica os novos textos na Home pública sem necessidade de rebuild.',
          },
        ],
      },
      {
        id: 'equipe-integrantes',
        titulo: 'Integrantes da Equipe Principal',
        subtitulo: 'Cadastro das apresentadoras, biografias, fotos e links de entrevista',
        icone: 'Users2',
        rota: '/admin/integrantes',
        perfisPermitidos: ['master', 'adm'],
        exclusivoMaster: true,
        ondeClicar: 'Submenu "Exclusivo Master" ➔ "Integrantes".',
        paraQueServe:
          'Gerencia os cards das vozes principais do podcast na seção "Quem Faz Acontecer" da Home pública.',
        passoAPasso: [
          'Clique em "+ Nova Integrante".',
          'Preencha nome completo, biografia oficial inspiradora e @ do Instagram.',
          'Faça o upload da foto oficial em alta qualidade.',
          'Opcionalmente, vincule o link do YouTube da entrevista de apresentação da integrante.',
          'Defina a ordem numérica de exibição e clique em "Salvar".',
        ],
        botoesPrincipais: [
          {
            nome: '+ Nova Integrante',
            onde: 'Topo direito da tela',
            paraQueServe: 'Abre o formulário de cadastro de integrante.',
          },
          {
            nome: 'Editar (Lápis)',
            onde: 'No card de cada integrante',
            paraQueServe: 'Permite alterar a foto, biografia ou link do Instagram.',
          },
        ],
      },
      {
        id: 'politicas-site',
        titulo: 'Políticas do Site (LGPD)',
        subtitulo: 'Edição jurídica de Privacidade, Cookies e Termos de Uso',
        icone: 'ShieldAlert',
        rota: '/admin/politicas',
        perfisPermitidos: ['master', 'adm'],
        exclusivoMaster: true,
        ondeClicar: 'Submenu "Exclusivo Master" ➔ "Políticas do Site".',
        paraQueServe:
          'Mantém em dia os termos legais exibidos nas rotas públicas (/politica/privacidade, /politica/cookies e /politica/termos) e no Cookie Banner.',
        passoAPasso: [
          'Selecione qual política deseja editar: "Política de Privacidade", "Política de Cookies" ou "Termos de Uso".',
          'Edite o texto no campo com suporte a formatação.',
          'Clique em "Salvar Política".',
        ],
        botoesPrincipais: [
          {
            nome: 'Salvar Política',
            onde: 'Abaixo do editor de texto',
            paraQueServe: 'Publica a nova versão do texto jurídico no site.',
          },
        ],
      },
      {
        id: 'gestao-conversas-chat',
        titulo: 'Gestão Soberana de Conversas do Chat',
        subtitulo: 'Moderação, exclusão de mensagens e remoção de conversas inteiras',
        icone: 'MessagesSquare',
        rota: '/admin/chat/gestao',
        perfisPermitidos: ['master'],
        badge: 'Master',
        exclusivoMaster: true,
        ondeClicar:
          'Submenu "Exclusivo Master" ➔ "Gestão de Conversas" (acesso exclusivo do Master soberano).',
        paraQueServe:
          'Permite ao Master auditar e moderar todas as salas, grupos e canais do Chat Interno, resguardando a segurança e o respeito corporativo.',
        passoAPasso: [
          'Visualize a lista de todas as conversas existentes no sistema com tipo (geral, privada ou grupo) e data da última mensagem.',
          'Clique em uma conversa para inspecionar os diálogos.',
          'Para remover uma mensagem imprópria: passe o mouse e clique no ícone de lixeira ao lado da mensagem.',
          'Para arquivar ou apagar uma conversa completa: use o botão "Excluir Conversa".',
        ],
        botoesPrincipais: [
          {
            nome: 'Inspecionar Diálogo',
            onde: 'Ao selecionar qualquer conversa da lista',
            paraQueServe: 'Abre o histórico completo de mensagens trocadas.',
          },
          {
            nome: 'Excluir Mensagem Imprópria',
            onde: 'Ao lado de mensagens específicas',
            paraQueServe: 'Remove a mensagem do chat com registro na auditoria.',
          },
        ],
        atencao:
          'Apenas o usuário Master tem acesso a essa tela. Nenhum outro perfil pode inspecionar diálogos de terceiros.',
      },
      {
        id: 'documentacao-oficial',
        titulo: 'Documentação do Sistema (Apresentação & Vendas)',
        subtitulo: 'Dossiê institucional completo com logo oficial e botão para PDF',
        icone: 'BookOpen',
        rota: '/documentacao',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        badge: 'Guia',
        ondeClicar: 'Menu lateral ➔ "Documentação" (ou via rota /documentacao).',
        paraQueServe:
          'Documento oficial de alto padrão com proposta de valor, tabela de permissões, pilares do produto e pitch de vendas para clientes e investidores.',
        passoAPasso: [
          'Navegue pelos 7 capítulos usando o Sumário Executivo.',
          'Clique no botão "Imprimir / Salvar PDF" no topo para gerar um arquivo PDF formal para apresentações de negócios.',
        ],
        botoesPrincipais: [
          {
            nome: 'Imprimir / Salvar PDF',
            onde: 'Canto superior direito da barra de ações',
            paraQueServe:
              'Gera documento de alta definição com estilos de impressão profissionais.',
          },
        ],
      },
    ],
  },
  {
    id: 'site-publico-e-membros',
    titulo: '4. Site Público & Área de Membros',
    descricao: 'Como funcionam as telas acessadas por ouvintes, convidados e membros Ouro e Prata.',
    icone: 'Globe',
    itens: [
      {
        id: 'home-publica',
        titulo: 'Página Inicial (Home Pública)',
        subtitulo: 'A vitrine do podcast na web: hero, episódios, integrantes e formulários',
        icone: 'Home',
        rota: '/',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        ondeClicar: 'Acesse o domínio principal do site.',
        paraQueServe:
          'Apresenta a marca, exibe o player do último episódio, carrossel de episódios com modal do YouTube, integrantes, depoimentos e fotos rotativas.',
        passoAPasso: [
          'Hero inicial: exibe o episódio mais recente com botão de play imediato e link para o YouTube.',
          'Carrossel de Episódios: permite clicar em qualquer card para abrir o modal de reprodução sem sair da página.',
          'Seção Integrantes: apresenta as quatro vozes com link direto para o Instagram e vídeo de entrevista.',
          'Nossos Momentos: fotos rotativas que passam automaticamente a cada 3 segundos.',
          'Formulário "Quero Participar": captação de novas histórias que alimenta a tela de Contatos no painel.',
          'Assistente Nine no canto inferior direito: botão flutuante para tirar dúvidas e captar leads.',
        ],
        botoesPrincipais: [
          {
            nome: 'Assistir ao Episódio (Modal)',
            onde: 'Cards do carrossel de episódios',
            paraQueServe: 'Abre o player do YouTube em tela cheia na própria página.',
          },
          {
            nome: 'Menu Suspenso Superior',
            onde: 'Botão "Menu" no canto superior direito',
            paraQueServe: 'Abre dropdown com todas as 11 seções e páginas públicas do site.',
          },
          {
            nome: 'Área do Convidado',
            onde: 'Cabeçalho e menu suspenso',
            paraQueServe: 'Leva ao portal do convidado (/convidado).',
          },
        ],
      },
      {
        id: 'portal-convidado',
        titulo: 'Portal do Convidado',
        subtitulo: 'Ambiente de acolhimento sem senha para os convidados do estúdio',
        icone: 'UserCheck',
        rota: '/convidado',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        ondeClicar: 'No cabeçalho do site público ➔ "Área do Convidado" (rota /convidado).',
        paraQueServe:
          'Recepciona o convidado com 3 cartões de ação fundamentais antes e depois da gravação.',
        passoAPasso: [
          'Cartão 1 — Preencher Roteiro (/roteiro): o convidado responde suas perguntas biográficas para a pauta.',
          'Cartão 2 — Enviar Depoimento (/depoimento): após gravar, envia seu depoimento e foto para a Home.',
          'Cartão 3 — Falar com a Produção: atalho com mensagem contextualizada para o WhatsApp da produção.',
        ],
        botoesPrincipais: [
          {
            nome: 'Preencher Roteiro do Episódio',
            onde: 'Primeiro cartão do portal',
            paraQueServe: 'Leva ao formulário inteligente de roteiro.',
          },
          {
            nome: 'Deixar Depoimento com Foto',
            onde: 'Segundo cartão do portal',
            paraQueServe: 'Leva ao formulário de envio de relato.',
          },
          {
            nome: 'Falar com a Produção (WhatsApp)',
            onde: 'Terceiro cartão do portal',
            paraQueServe: 'Inicia conversa direta com o time do estúdio.',
          },
        ],
      },
      {
        id: 'area-membros-vip',
        titulo: 'Área de Membros VIP',
        subtitulo: 'Comunidade exclusiva liberada para categorias Master, Gerencial, Ouro e Prata',
        icone: 'ShieldCheck',
        rota: '/membros',
        perfisPermitidos: ['master', 'adm', 'gerencial', 'ouro', 'prata'],
        ondeClicar:
          'No cabeçalho do site público ➔ Botão "Área de Membros" (ou via rota /membros).',
        paraQueServe:
          'Ambiente exclusivo onde os membros têm acesso a todo o acervo de episódios, galeria fechada de bastidores, botão de Chat Interno e gerenciamento do Meu Perfil.',
        passoAPasso: [
          'Confira seu badge de categoria no topo (Master, Gerencial, Ouro ou Prata).',
          'Use o botão "Chat" no cabeçalho da Área de Membros para interagir com os outros membros da comunidade.',
          'Clique em "Meu Perfil" para personalizar sua foto de avatar e bio.',
          'Assista a qualquer episódio do acervo clicando no card com o player integrado.',
          'Se for Master ou Gerencial, utilize o botão "Painel Admin" para alternar para a gestão operacional.',
        ],
        botoesPrincipais: [
          {
            nome: 'Chat CoffeeCast',
            onde: 'Cabeçalho da Área de Membros',
            paraQueServe: 'Abre o chat interno com badge de mensagens não lidas.',
          },
          {
            nome: 'Meu Perfil',
            onde: 'Cabeçalho da Área de Membros',
            paraQueServe: 'Abre a tela de edição de dados e senha.',
          },
          {
            nome: 'Painel Admin (se autorizado)',
            onde: 'Cabeçalho da Área de Membros',
            paraQueServe: 'Retorna ao painel administrativo completo.',
          },
        ],
      },
    ],
  },
]
