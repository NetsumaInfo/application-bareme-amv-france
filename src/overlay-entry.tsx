import { createRoot } from 'react-dom/client'
import './index.css'
import FullscreenOverlay from './components/player/FullscreenOverlay'
import { I18nProvider } from '@/i18n'

const root = document.getElementById('root')

if (root) {
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
  root.style.background = 'transparent'

  createRoot(root).render(
    <I18nProvider>
      <FullscreenOverlay />
    </I18nProvider>,
  )
}
