import React from 'react'

// Lógica da Tela — Patrocinadores & Parceiros (/admin/patrocinadores)
// Documentação funcional da tela no padrão das demais "Lógica da Tela" do painel.

export default function PatrocinadoresLogicaTela() {
  return (
    <section
      aria-label="Lógica da tela Patrocinadores & Parceiros"
      className="bg-white/80 border border-dourado/40 rounded-2xl p-4 sm:p-6 space-y-3 shadow-xs"
    >
      <header className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-vinho text-dourado">
          🤝
        </span>
        <h3 className="font-serif font-bold text-vinho text-sm sm:text-base">
          Lógica da Tela — Patrocinadores &amp; Parceiros
        </h3>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-[13px] text-vinho/80">
        <div className="bg-marfim rounded-xl p-3 border border-vinho/10">
          <p className="font-bold text-vinho mb-1">1. Para que serve</p>
          <p>
            CRM de patrocínio do CoffeeCast 4.0: cadastra empresas parceiras, guarda o contato
            comercial, a modalidade (Cota Master, Cota por Episódio, Permuta, Apoio ou Outro), o
            valor do contrato e as contrapartidas acordadas por escrito.
          </p>
        </div>

        <div className="bg-marfim rounded-xl p-3 border border-vinho/10">
          <p className="font-bold text-vinho mb-1">2. Ciclo de status</p>
          <p>
            <strong>Prospect</strong> → <strong>Em Negociação</strong> → <strong>Ativo</strong> →{' '}
            <strong>Pausado</strong> → <strong>Encerrado</strong>. Somente parceiros "Ativos" entram
            na receita ativa do resumo; cards com pendências em branco ganham destaque âmbar.
          </p>
        </div>

        <div className="bg-marfim rounded-xl p-3 border border-vinho/10">
          <p className="font-bold text-vinho mb-1">3. Episódios vinculados</p>
          <p>
            No cadastro/edição, marque os episódios patrocinados na lista de checkboxes — o vínculo
            é uma relação real com a coleção <strong>episodios</strong>, exibida como badge "N
            episódios" no card.
          </p>
        </div>

        <div className="bg-marfim rounded-xl p-3 border border-vinho/10">
          <p className="font-bold text-vinho mb-1">4. Entregas e pendências</p>
          <p>
            "Entregas realizadas" registra o que já foi cumprido (data + o que foi feito);
            "Pendências" lista o que ainda falta. Card com pendências ganha faixa âmbar e entra na
            contagem "Com Pendências" do resumo.
          </p>
        </div>

        <div className="bg-marfim rounded-xl p-3 border border-vinho/10">
          <p className="font-bold text-vinho mb-1">5. Materiais e logo</p>
          <p>
            Logo (PNG/JPG/WebP/SVG) aparece no card do parceiro. Materiais publicitários (até 10
            arquivos por upload) ficam anexados ao registro para consulta da equipe.
          </p>
        </div>

        <div className="bg-marfim rounded-xl p-3 border border-vinho/10">
          <p className="font-bold text-vinho mb-1">6. Permissões</p>
          <p>
            Lista, cadastro e edição: perfis <strong>master, adm e gerencial</strong>. Exclusão:
            apenas <strong>master e adm</strong> (regras de API aplicadas na collection
            patrocinadores, migration 1753000100018).
          </p>
        </div>
      </div>

      <p className="text-[11px] text-vinho/60">
        Regra permanente: a Nine nunca informa preços de patrocínio — negociação é humana, conduzida
        pela equipe comercial.
      </p>
    </section>
  )
}
