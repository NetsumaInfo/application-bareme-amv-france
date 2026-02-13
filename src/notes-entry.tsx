import { createRoot } from 'react-dom/client'
import { Component, type ReactNode } from 'react'
import './index.css'
import DetachedNotesWindow from './components/notes/DetachedNotesWindow'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#e0e0e0', background: '#0f0f23', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#e94560', marginBottom: 12 }}>Erreur</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#ff6b81' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, color: '#666', marginTop: 8 }}>
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <ErrorBoundary>
      <DetachedNotesWindow />
    </ErrorBoundary>,
  )
}
