// src/components/estudio/EstudioLogicaTela.tsx
// Botão "Lógica da Tela" do Estúdio Criativo IA — documenta objetivos, campos, regras,
// fluxos, integrações, permissões, agente, templates, motor gráfico, downloads, histórico e custos.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

const SECOES: { titulo: string; itens: string[] }[] = [
  {
    titulo: '🎯 Objetivo',
    itens: [
      'Ambiente profissional para criação, edição, armazenamento e exportação de capas para YouTube, TV e divulgação.',
      'Integrado à Divulgação Inteligente da tela de Roteiros — mesmos serviços, mesmos dados, mesmo agente (sem sistemas paralelos).',
    ],
  },
  {
    titulo: '🧠 Agente — CoffeeCast Creative AI',
    itens: [
      'Único agente textual (gpt-4.1) via segredo GCHAT_GPT no backend (hook /estudio/ia, sem chamada do navegador à OpenAI).',
      'Gera títulos, descrições, tags, hashtags, textos de redes sociais, propostas de template e orientações de composição.',
      'NÃO gera/altera imagens de rostos ou logomarcas — a IA nunca recria fotografias ou marcas (regra crítica de preservação).',
      'Se a chave GCHAT_GPT não estiver ativa, o sistema informa a pendência — nada é simulado.',
    ],
  },
  {
    titulo: '🎨 Motor de Composição Gráfica (real, client-side em canvas)',
    itens: [
      'Reconstrói o Template Mestre Oficial em camadas: fundo cinematográfico dourado, cabeçalho oficial, xícara, slogan, rodapés.',
      'Insere fotografias e logomarcas ORIGINAIS (upload do usuário) em áreas próprias, preservando proporções (cover/contain).',
      'Ajuste automático do título: quebras, tamanho e alinhamento calculados conforme o texto.',
      'Exportação real: PNG/JPG em 1280×720 (YouTube HD), 1920×1080 (Full HD) e 3840×2160 (4K) — ampliação avisada ao usuário.',
      'Ajustes de título, foto, logo e resolução NÃO chamam API de imagem (controle de custos).',
    ],
  },
  {
    titulo: '🔒 Template Mestre Oficial — Premium Dourado (bloqueado)',
    itens: [
      'Cadastrado a partir da capa oficial enviada pela usuária; status Ativo + Bloqueado; padrão para novas capas.',
      'Preservado: cabeçalho (logo CoffeeCast 4.0, xícara com coração, tipografia preta/dourada, ondas sonoras), fundo champagne/dourado com refletores, área esquerda (fotos + placas pretas com borda dourada), área central (título serifado), área direita (logomarcas dos convidados), xícara com pires inferior, rodapés "Mais que conversas, histórias que transformam." e CURTA | INSCREVA-SE | ATIVE O SININHO.',
      'Elementos BLOQUEADOS: logo oficial, identidade visual, paleta, cenário, xícara, slogan, rodapé, decorativos, estrutura e proporções.',
      'Elementos EDITÁVEIS: título, subtítulo, fotografias, nomes, logomarcas e distribuição dos elementos variáveis.',
      'REGRA ABSOLUTA: nunca escrever temporada ("Quarta Temporada", "4ª Temporada"…) — somente "CoffeeCast 4.0".',
    ],
  },
  {
    titulo: '🗂️ Abas e dados',
    itens: [
      'Gerador de Capas: episódio (com busca) ou "criar sem episódio", template, título (com ajuste automático), convidados (nome, exibição, foto, empresa, logo, ordem), uploads múltiplos e orientações para a IA.',
      'Laboratório de Templates IA: propõe 3 variações por estilo (Premium Dourado, Black Gold, Minimalista, Cinematográfico, Corporativo, Moderno, Tecnológico, Editorial, Luxo Contemporâneo, Personalizado); aprovado vira template REUTILIZÁVEL em camadas (nunca imagem estática).',
      'Biblioteca Criativa: MEUS TEMPLATES (nome, estilo, versão, status, autor, data) e MINHAS CAPAS (episódio, título, template, resolução, versão, data) com visualizar/duplicar/arquivar/reativar/baixar/excluir.',
    ],
  },
  {
    titulo: '🗄️ Armazenamento e histórico',
    itens: [
      'Coleção capas_templates: templates com template_json (camadas, áreas, bloqueios, fontes) — mestre imutável por regra de API.',
      'Coleção capas_estudio: capas geradas com arquivo real, vínculo ao episódio, status (rascunho/oficial), versão, usuário, data e dados_ia.',
      'Salvar como "capa oficial" preserva o histórico — versões anteriores permanecem na biblioteca.',
    ],
  },
  {
    titulo: '🔐 Permissões (reutilizadas do sistema existente)',
    itens: [
      'ADM: gerenciar templates oficiais, configurar IA, aprovar modelos, excluir e controlar custos.',
      'EDITOR: gerar capas, propor templates, editar, salvar e baixar.',
      'VISUALIZADOR: consultar e baixar quando permitido. Sem autenticação paralela.',
    ],
  },
  {
    titulo: '⚠️ Erros e custos',
    itens: [
      'Operações textuais (IA) e gráficas (canvas) são separadas; nada de imagem é gerado quando só texto é pedido.',
      'Prevenção de cliques duplicados (botões desabilitados durante o processamento) e indicadores reais de progresso.',
      'Erros da OpenAI nunca interrompem o motor gráfico: a capa é composta mesmo sem a IA textual, com aviso claro.',
      'Credenciais protegidas no backend (segredo GCHAT_GPT via $os.getenv) — nunca expostas no frontend.',
    ],
  },
]

export default function EstudioLogicaTela({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Lógica da Tela — Estúdio Criativo IA
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-5">
            {SECOES.map((s) => (
              <div key={s.titulo}>
                <h4 className="font-semibold text-[#4B1E3F]">{s.titulo}</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {s.itens.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
