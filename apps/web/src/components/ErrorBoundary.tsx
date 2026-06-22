import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorPage } from '../pages/ErrorPage'
import { errorReporter } from '../lib/observability'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void errorReporter.report({
      message: error.message,
      stack: error.stack,
      route: globalThis.window === undefined ? undefined : globalThis.window.location.pathname,
      context: { componentStack: info.componentStack },
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage message={this.state.error?.message} />
    }
    return this.props.children
  }
}
