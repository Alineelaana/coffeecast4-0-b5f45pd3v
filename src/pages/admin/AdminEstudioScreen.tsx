// src/pages/admin/AdminEstudioScreen.tsx
// ESTÚDIO CRIATIVO IA + DIVULGAÇÃO INTELIGENTE — CoffeeCast 4.0
// Abas: Gerador de Capas · Laboratório de Templates IA · Biblioteca Criativa
// Motor gráfico real (canvas) + Template Mestre Oficial "Premium Dourado" bloqueado.

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import EstudioGeradorCapas from '@/components/estudio/EstudioGeradorCapas'
import EstudioLaboratorio from '@/components/estudio/EstudioLaboratorio'
import EstudioBiblioteca from '@/components/estudio/EstudioBiblioteca'
import EstudioLogicaTela from '@/components/estudio/EstudioLogicaTela'
import { templateMestrePremiumDourado } from '@/lib/estudioMotor'

interface EstudioPreset {
  episodio?: { id: string; titulo: string; convidados: never[] } | null
  tituloCapa?: string
  tituloThumbnail?: string
}

interface Props {
  preset?: EstudioPreset | null
  onAbrirBiblioteca?: () => void
}

export default function AdminEstudioScreen({ preset, onAbrirBiblioteca }: Props) {
  const [aba, setAba] = useState<string>('gerador')
  const [bibliotecaAtualizadaEm, setBibliotecaAtualizadaEm] = useState(Date.now())
  const [logicaAberta, setLogicaAberta] = useState(false)

  function irParaBiblioteca() {
    setAba('biblioteca')
    onAbrirBiblioteca?.()
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">
            Estúdio Criativo <span className="text-[#C9971F]">IA</span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Criação, edição, armazenamento e exportação de capas para YouTube, TV e materiais de
            divulgação — alimentado pelo agente <strong>CoffeeCast Creative AI</strong> e pelo
            Template Mestre Oficial <strong>CoffeeCast 4.0 — Premium Dourado</strong>. Fotografias e
            logomarcas originais são sempre preservadas. Nenhuma capa menciona temporada.
          </p>
        </div>
        <Button variant="outline" onClick={() => setLogicaAberta(true)}>
          🧠 Lógica da Tela
        </Button>
      </div>

      <Tabs value={aba} onValueChange={setAba} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="gerador">🎨 Gerador de Capas</TabsTrigger>
          <TabsTrigger value="laboratorio">🧪 Laboratório de Templates IA</TabsTrigger>
          <TabsTrigger value="biblioteca">📚 Biblioteca Criativa</TabsTrigger>
        </TabsList>

        <TabsContent value="gerador" className="mt-5">
          <EstudioGeradorCapas
            preset={preset as never}
            onSalvo={() => setBibliotecaAtualizadaEm(Date.now())}
          />
        </TabsContent>

        <TabsContent value="laboratorio" className="mt-5">
          <EstudioLaboratorio onTemplateSalvo={() => setBibliotecaAtualizadaEm(Date.now())} />
        </TabsContent>

        <TabsContent value="biblioteca" className="mt-5">
          <EstudioBiblioteca atualizadoEm={bibliotecaAtualizadaEm} />
        </TabsContent>
      </Tabs>

      <EstudioLogicaTela open={logicaAberta} onOpenChange={setLogicaAberta} />
    </div>
  )
}
