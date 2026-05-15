import { Component, type ErrorInfo, type ReactNode } from 'react'

interface SettingsTabErrorBoundaryProps {
  children: ReactNode
  fallbackTitle: string
  fallbackDescription: string
  resetKey: string
}

interface SettingsTabErrorBoundaryState {
  hasError: boolean
  errorText: string
}

export class SettingsTabErrorBoundary extends Component<
  SettingsTabErrorBoundaryProps,
  SettingsTabErrorBoundaryState
> {
  constructor(props: SettingsTabErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorText: '' }
  }

  static getDerivedStateFromError(): SettingsTabErrorBoundaryState {
    return { hasError: true, errorText: '' }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Settings tab render crash:', error, errorInfo)
    this.setState({
      errorText: error?.message ? String(error.message) : String(error),
    })
  }

  componentDidUpdate(prevProps: SettingsTabErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorText: '' })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">{this.props.fallbackTitle}</p>
          <p className="mt-1 text-amber-200/90">{this.props.fallbackDescription}</p>
          {this.state.errorText ? (
            <p className="mt-2 break-all rounded-md bg-black/30 px-2 py-1 font-mono text-[11px] text-amber-100">
              {this.state.errorText}
            </p>
          ) : null}
        </div>
      )
    }

    return this.props.children
  }
}
