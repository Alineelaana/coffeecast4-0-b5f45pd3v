export interface EmojiItem {
  emoji: string
  name: string
  keywords: string[]
}

export interface EmojiCategory {
  id: string
  label: string
  icon: string
  emojis: EmojiItem[]
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'sorrisos',
    label: 'Sorrisos & Emoções',
    icon: '😊',
    emojis: [
      { emoji: '😀', name: 'Sorriso aberto', keywords: ['sorriso', 'alegria', 'feliz', 'rosto'] },
      {
        emoji: '😃',
        name: 'Rosto feliz com olhos grandes',
        keywords: ['feliz', 'sorriso', 'alegre'],
      },
      {
        emoji: '😄',
        name: 'Sorriso com olhos sorridentes',
        keywords: ['sorriso', 'olhos', 'gargalhada'],
      },
      { emoji: '😁', name: 'Sorriso brilhante', keywords: ['dentes', 'radiante', 'alegre'] },
      { emoji: '😆', name: 'Rindo muito', keywords: ['gargalhada', 'fechados', 'riso'] },
      { emoji: '😅', name: 'Sorriso com suor frio', keywords: ['alivio', 'nervoso', 'suor'] },
      { emoji: '😂', name: 'Chorando de rir', keywords: ['lagrimas', 'rir', 'gargalhada', 'kkk'] },
      { emoji: '🤣', name: 'Rolando de rir', keywords: ['chao', 'rir', 'morrendo', 'kkk'] },
      { emoji: '😉', name: 'Piscadela', keywords: ['piscar', 'cumplice', 'flerte'] },
      { emoji: '😊', name: 'Sorriso tímido', keywords: ['timido', 'fofo', 'meigo'] },
      { emoji: '😇', name: 'Anjinho inocente', keywords: ['anjo', 'inocente', 'aureola'] },
      {
        emoji: '🥰',
        name: 'Rosto apaixonado com corações',
        keywords: ['amor', 'carinho', 'apaixonado'],
      },
      { emoji: '😍', name: 'Olhos de coração', keywords: ['apaixonado', 'amei', 'lindo'] },
      { emoji: '🤩', name: 'Deslumbrado', keywords: ['estrelas', 'uau', 'fascinado'] },
      { emoji: '😘', name: 'Mandando beijo', keywords: ['beijo', 'amor', 'carinho'] },
      { emoji: '😋', name: 'Delicioso / Gostoso', keywords: ['lingua', 'comida', 'delicia'] },
      { emoji: '😜', name: 'Piscando com língua de fora', keywords: ['brincadeira', 'zoeira'] },
      { emoji: '🤪', name: 'Maluco / Divertido', keywords: ['doido', 'maluco', 'festa'] },
      { emoji: '😎', name: 'De óculos escuros', keywords: ['legal', 'estilo', 'top', 'vip'] },
      { emoji: '🤓', name: 'Nerd inteligente', keywords: ['estudo', 'leitura', 'oculos'] },
      {
        emoji: '🧐',
        name: 'Com monóculo / Curioso',
        keywords: ['analisando', 'curioso', 'investigando'],
      },
      {
        emoji: '🥳',
        name: 'Comemorando / Festa',
        keywords: ['aniversario', 'festa', 'chapeu', 'parabens'],
      },
      { emoji: '🤗', name: 'Abraço caloroso', keywords: ['abraco', 'carinho', 'acolhimento'] },
      { emoji: '🤔', name: 'Pensativo', keywords: ['duvida', 'pensando', 'ideia'] },
      { emoji: '🤫', name: 'Segredo / Silêncio', keywords: ['psiu', 'segredo', 'quieto'] },
      { emoji: '🤭', name: 'Ops / Mão na boca', keywords: ['ops', 'risinho', 'vergonha'] },
      { emoji: '🥱', name: 'Bocejando / Sono', keywords: ['sono', 'cansado', 'preguica'] },
      { emoji: '😴', name: 'Dormindo', keywords: ['sono', 'dormir', 'zz'] },
      { emoji: '😌', name: 'Aliviado e em paz', keywords: ['paz', 'zen', 'calma'] },
      { emoji: '🤤', name: 'Babando de vontade', keywords: ['vontade', 'desejo', 'fome'] },
    ],
  },
  {
    id: 'gestos',
    label: 'Gestos & Mãos',
    icon: '👋',
    emojis: [
      { emoji: '👋', name: 'Aceno de mão', keywords: ['ola', 'tchau', 'oi', 'aceno'] },
      { emoji: '🤚', name: 'Costas da mão levantada', keywords: ['espera', 'parar'] },
      { emoji: '✋', name: 'Mão levantada', keywords: ['pare', 'cinco', 'atencao'] },
      { emoji: '👌', name: 'Sinal de OK', keywords: ['ok', 'perfeito', 'tudo certo', 'beleza'] },
      { emoji: '✌️', name: 'Paz e amor / Vitória', keywords: ['vitoria', 'paz', 'dois'] },
      { emoji: '🤞', name: 'Dedos cruzados', keywords: ['sorte', 'torcida', 'esperanca'] },
      { emoji: '🤟', name: 'Gesto de amor', keywords: ['amor', 'rock', 'tamojunto'] },
      { emoji: '🤘', name: 'Chifres do rock', keywords: ['rock', 'energia', 'show'] },
      { emoji: '🤙', name: 'Hang loose / Liga nós', keywords: ['ligar', 'tranquilo', 'surf'] },
      {
        emoji: '👍',
        name: 'Joinha / Polegar para cima',
        keywords: ['joinha', 'positivo', 'aprovado', 'sim', 'top'],
      },
      { emoji: '👎', name: 'Polegar para baixo', keywords: ['negativo', 'nao', 'reprovado'] },
      { emoji: '👊', name: 'Soquinho / Tamo junto', keywords: ['parceria', 'soco', 'tmj'] },
      {
        emoji: '👏',
        name: 'Palmas / Aplausos',
        keywords: ['parabens', 'palmas', 'aplausos', 'show'],
      },
      { emoji: '🙌', name: 'Mãos para o alto', keywords: ['comemoracao', 'aleluia', 'uhul'] },
      { emoji: '👐', name: 'Mãos abertas', keywords: ['aberto', 'acolher', 'abraco'] },
      { emoji: '🤲', name: 'Mãos juntas abertas', keywords: ['prece', 'pedido', 'espera'] },
      {
        emoji: '🤝',
        name: 'Aperto de mãos',
        keywords: ['acordo', 'negocio', 'parceria', 'fechado'],
      },
      {
        emoji: '🙏',
        name: 'Mãos postas / Gratidão',
        keywords: ['obrigado', 'gratidao', 'amem', 'por favor', 'prece'],
      },
      { emoji: '✍️', name: 'Escrevendo', keywords: ['escrever', 'anotar', 'roteiro'] },
      { emoji: '💪', name: 'Bíceps / Força', keywords: ['forca', 'foco', 'treino', 'vamos'] },
      { emoji: '🤳', name: 'Tirando selfie', keywords: ['foto', 'selfie', 'celular'] },
    ],
  },
  {
    id: 'coracoes',
    label: 'Corações & Amor',
    icon: '❤️',
    emojis: [
      { emoji: '❤️', name: 'Coração vermelho clássico', keywords: ['amor', 'paixao', 'coracao'] },
      {
        emoji: '💛',
        name: 'Coração amarelo / dourado',
        keywords: ['ouro', 'dourado', 'coffeecast', 'amizade', 'carinho'],
      },
      { emoji: '🧡', name: 'Coração laranja', keywords: ['energia', 'calor', 'amizade'] },
      { emoji: '💚', name: 'Coração verde', keywords: ['esperanca', 'vida', 'saude'] },
      { emoji: '💙', name: 'Coração azul', keywords: ['confianca', 'paz', 'lealdade'] },
      {
        emoji: '💜',
        name: 'Coração roxo / vinho',
        keywords: ['vinho', 'elegancia', 'coffeecast', 'nobre'],
      },
      {
        emoji: '🤎',
        name: 'Coração marrom / café',
        keywords: ['cafe', 'chocolate', 'aconchego', 'terra'],
      },
      { emoji: '🖤', name: 'Coração preto', keywords: ['estilo', 'elegante', 'moderno'] },
      { emoji: '🤍', name: 'Coração branco', keywords: ['pureza', 'paz', 'luz'] },
      { emoji: '💖', name: 'Coração brilhante', keywords: ['brilho', 'amor', 'especial'] },
      { emoji: '💗', name: 'Coração crescendo', keywords: ['emocao', 'pulsar', 'carinho'] },
      { emoji: '💓', name: 'Coração batendo', keywords: ['vida', 'batimento', 'ritmo'] },
      { emoji: '💞', name: 'Corações girando', keywords: ['cumplicidade', 'uniao'] },
      { emoji: '💕', name: 'Dois corações', keywords: ['afeto', 'sintonia', 'par'] },
      { emoji: '💌', name: 'Carta de amor', keywords: ['recado', 'mensagem', 'carinho'] },
      {
        emoji: '✨',
        name: 'Brilhos reluzentes',
        keywords: ['estrelas', 'magia', 'brilho', 'destaque', 'ouro'],
      },
      { emoji: '⭐', name: 'Estrela dourada', keywords: ['estrela', 'vip', 'nota10'] },
      { emoji: '🌟', name: 'Estrela reluzente', keywords: ['sucesso', 'brilho', 'top'] },
      { emoji: '💫', name: 'Estrela cadente / Giro', keywords: ['ideia', 'encanto'] },
    ],
  },
  {
    id: 'cafe-comida',
    label: 'Café & Bebidas',
    icon: '☕',
    emojis: [
      {
        emoji: '☕',
        name: 'Xícara de café quente',
        keywords: ['cafe', 'coffeecast', 'xicara', 'quentinho', 'expresso'],
      },
      {
        emoji: '🫖',
        name: 'Bule de chá / café',
        keywords: ['bule', 'cha', 'servir', 'coffeecast'],
      },
      { emoji: '🍵', name: 'Xícara de chá sem asa', keywords: ['cha', 'verde', 'quente'] },
      { emoji: '🧋', name: 'Bubble tea / Café gelado', keywords: ['gelado', 'bebida', 'doce'] },
      { emoji: '🥛', name: 'Copo de leite', keywords: ['leite', 'pingado', 'latte'] },
      { emoji: '🥤', name: 'Copo com canudo', keywords: ['refrigerante', 'suco', 'shake'] },
      {
        emoji: '🥂',
        name: 'Taças brindando',
        keywords: ['brinde', 'champanhe', 'comemoracao', 'tim-tim'],
      },
      { emoji: '🍷', name: 'Taça de vinho', keywords: ['vinho', 'taca', 'paleta', 'elegante'] },
      { emoji: '🍺', name: 'Caneca de cerveja', keywords: ['cerveja', 'happy hour'] },
      { emoji: '🍻', name: 'Canecas brindando', keywords: ['brinde', 'chopp', 'amigos'] },
      {
        emoji: '🥐',
        name: 'Croissant quentinho',
        keywords: ['croissant', 'cafe da manha', 'padaria'],
      },
      { emoji: '🥖', name: 'Baguete / Pão francês', keywords: ['pao', 'padaria', 'cafe'] },
      { emoji: '🥯', name: 'Bagel tostado', keywords: ['pao', 'lanche', 'cafe'] },
      { emoji: '🥞', name: 'Panquecas com mel', keywords: ['doce', 'cafe da manha', 'mel'] },
      { emoji: '🧇', name: 'Waffle crocante', keywords: ['waffle', 'lanche', 'doce'] },
      { emoji: '🧀', name: 'Fatia de queijo minas', keywords: ['queijo', 'minas', 'cafe'] },
      { emoji: '🍰', name: 'Fatia de bolo', keywords: ['bolo', 'doce', 'festa'] },
      { emoji: '🧁', name: 'Cupcake delicado', keywords: ['doce', 'confeitaria'] },
      { emoji: '🍪', name: 'Biscoito / Cookie', keywords: ['cookie', 'chocolate', 'biscoito'] },
      { emoji: '🍩', name: 'Donut açucarado', keywords: ['rosquinha', 'doce'] },
      { emoji: '🍫', name: 'Barra de chocolate', keywords: ['chocolate', 'cacau'] },
    ],
  },
  {
    id: 'midia-trabalho',
    label: 'Podcast & Trabalho',
    icon: '🎙️',
    emojis: [
      {
        emoji: '🎙️',
        name: 'Microfone de estúdio',
        keywords: ['podcast', 'gravacao', 'microfone', 'coffeecast', 'estudio'],
      },
      {
        emoji: '🎧',
        name: 'Fones de ouvido',
        keywords: ['ouvir', 'podcast', 'audio', 'headphone'],
      },
      {
        emoji: '🎬',
        name: 'Claquete de cinema',
        keywords: ['gravando', 'video', 'cena', 'episodio'],
      },
      { emoji: '📹', name: 'Câmera de vídeo', keywords: ['filmagem', 'youtube', 'camera'] },
      { emoji: '📷', name: 'Câmera fotográfica', keywords: ['foto', 'ensaio', 'bastidores'] },
      { emoji: '📺', name: 'Televisão / Monitor', keywords: ['tv', 'tela', 'assistir'] },
      { emoji: '📻', name: 'Rádio vintage', keywords: ['radio', 'transmissao', 'voz'] },
      { emoji: '📢', name: 'Megafone / Anúncio', keywords: ['aviso', 'comunicado', 'novidade'] },
      { emoji: '🔔', name: 'Sino de notificação', keywords: ['alerta', 'inscricao', 'lembrete'] },
      { emoji: '💡', name: 'Lâmpada de ideia', keywords: ['ideia', 'criatividade', 'insight'] },
      {
        emoji: '📅',
        name: 'Calendário / Agenda',
        keywords: ['agenda', 'data', 'horario', 'gravacao'],
      },
      { emoji: '⏰', name: 'Despertador / Horário', keywords: ['tempo', 'pontualidade', 'hora'] },
      {
        emoji: '💻',
        name: 'Notebook de trabalho',
        keywords: ['computador', 'producao', 'roteiro'],
      },
      { emoji: '📱', name: 'Celular / WhatsApp', keywords: ['whatsapp', 'contato', 'mensagem'] },
      {
        emoji: '🚀',
        name: 'Foguete de lançamento',
        keywords: ['sucesso', 'lancamento', 'crescimento', 'estreia'],
      },
      {
        emoji: '🏆',
        name: 'Troféu dourado',
        keywords: ['premio', 'vencedor', 'campeao', 'conquista'],
      },
      { emoji: '🎯', name: 'Alvo com flecha', keywords: ['meta', 'foco', 'objetivo'] },
      { emoji: '🔥', name: 'Fogo / Em alta', keywords: ['fogo', 'quente', 'bombando', 'top'] },
    ],
  },
  {
    id: 'natureza-animais',
    label: 'Animais & Natureza',
    icon: '🐱',
    emojis: [
      { emoji: '🐶', name: 'Cachorrinho', keywords: ['cachorro', 'pet', 'fofo'] },
      { emoji: '🐱', name: 'Gatinho', keywords: ['gato', 'pet', 'felino'] },
      { emoji: '🦁', name: 'Leão forte', keywords: ['leao', 'lideranca', 'coragem'] },
      { emoji: '🦊', name: 'Raposa esperta', keywords: ['raposa', 'astuta'] },
      { emoji: '🐻', name: 'Ursinho carinhoso', keywords: ['urso', 'abraco'] },
      { emoji: '🐼', name: 'Panda dócil', keywords: ['panda', 'fofo'] },
      { emoji: '🦉', name: 'Coruja sábia', keywords: ['sabedoria', 'conhecimento', 'noite'] },
      {
        emoji: '🦋',
        name: 'Borboleta da transformação',
        keywords: ['transformacao', 'beleza', 'historia'],
      },
      { emoji: '🌸', name: 'Flor de cerejeira', keywords: ['flor', 'delicadeza', 'primavera'] },
      { emoji: '🌹', name: 'Rosa vermelha', keywords: ['rosa', 'elegancia', 'flor'] },
      { emoji: '🌻', name: 'Girassol iluminado', keywords: ['girassol', 'sol', 'luz', 'energia'] },
      { emoji: '🌿', name: 'Ramo de folhas verdes', keywords: ['planta', 'natureza', 'paz'] },
      { emoji: '☀️', name: 'Sol brilhante', keywords: ['sol', 'dia', 'bom dia', 'calor'] },
      { emoji: '🌙', name: 'Lua crescente', keywords: ['lua', 'noite', 'boa noite'] },
      {
        emoji: '🌈',
        name: 'Arco-íris multicolorido',
        keywords: ['arco-iris', 'esperanca', 'alegria'],
      },
    ],
  },
]

const RECENT_EMOJIS_STORAGE_KEY = 'coffeecast_recent_emojis_v1'
const MAX_RECENT_EMOJIS = 16

export function getRecentEmojis(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY)
    if (!raw) return ['☕', '💛', '✨', '🎙️', '👏', '😊', '🙌', '🔥']
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, MAX_RECENT_EMOJIS)
    }
  } catch {
    /* fallback silencioso */
  }
  return ['☕', '💛', '✨', '🎙️', '👏', '😊', '🙌', '🔥']
}

export function saveRecentEmoji(emoji: string): string[] {
  try {
    const recents = getRecentEmojis().filter((e) => e !== emoji)
    const updated = [emoji, ...recents].slice(0, MAX_RECENT_EMOJIS)
    localStorage.setItem(RECENT_EMOJIS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return [emoji]
  }
}
