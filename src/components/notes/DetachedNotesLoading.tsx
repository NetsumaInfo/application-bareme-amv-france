export function DetachedNotesLoading() {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#0f0f23', color: '#9ca3af' }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 24, height: 24, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13 }}>En attente des données...</p>
        <p style={{ fontSize: 11, color: '#6b7280' }}>
          Ouvrez un projet et sélectionnez un clip
        </p>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </div>
    </div>
  )
}
