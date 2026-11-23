/**
 * Error Boundary da área de Roteiros (& Pautas).
 *
 * Se qualquer erro de runtime acontecer durante o render da tela (dado
 * inesperado do banco, campo novo, formato de data etc.), mostramos uma
 * mensagem amigável no visual vinho/dourado do painel — com opção de tentar
 * novamente ou voltar — em vez de deixar a tela inteira ficar branca.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RoteirosErrorBoundaryProps {
  children: ReactNode
}

interface RoteirosErrorBoundaryState {
  hasError: boolean
  mensagem: string
}

export class RoteirosErrorBoundary extends Component<
  RoteirosErrorBoundaryProps,
  RoteirosErrorBoundaryState
> {
  constructor(props: RoteirosErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, mensagem: '' }
  }

  static getDerivedStateFromError(error: unknown): RoteirosErrorBoundaryState {
    const mensagem =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Erro inesperado ao renderizar a área de Roteiros.'
    return { hasError: true, mensagem }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[RoteirosErrorBoundary] Erro capturado na área de Roteiros:', error, info)
  }

  handleTentarNovamente = () => {
    this.setState({ hasError: false, mensagem: '' })
  }

  handleVoltar = () => {
    // Volta para o Dashboard do painel admin (rota segura e já validada).
    window.location.assign('/admin')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-vinho/15 shadow-sm p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-bold text-vinho">
                A área de Roteiros não pôde ser carregada
              </h2>
              <p className="text-sm text-vinho/70 leading-relaxed">
                Encontramos um problema inesperado nesta tela, mas o restante do painel continua
                funcionando normalmente. Você pode tentar novamente ou voltar ao Painel Geral.
              </p>
              {this.state.mensagem && (
                <p className="text-[11px] text-vinho/50 font-mono bg-marfim/60 rounded-xl p-2 break-words">
                  {this.state.mensagem}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                onClick={this.handleTentarNovamente}
                className="bg-vinho hover:bg-vinho-light text-white font-semibold rounded-xl min-h-[44px] flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-dourado" />
                <span>Tentar novamente</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={this.handleVoltar}
                className="border-vinho/20 text-vinho hover:bg-vinho hover:text-white font-semibold rounded-xl min-h-[44px] flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-dourado-dark" />
                <span>Voltar ao Painel</span>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
