import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches unhandled React render errors.
 * Must be a class component (React limitation).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, pipe to error tracking (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-white p-6 gap-6">
          <div className="text-6xl">⚡</div>
          <h1 className="font-display text-3xl text-primary uppercase italic">
            Algo deu errado
          </h1>
          <p className="text-text-secondary text-sm text-center max-w-xs">
            {this.state.error?.message ?? 'Erro inesperado. Tente recarregar o app.'}
          </p>
          <button
            onClick={this.handleReset}
            className="btn-primary px-8 py-3 rounded-button"
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
