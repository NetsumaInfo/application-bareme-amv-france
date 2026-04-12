import { createRoot } from 'react-dom/client'
import './index.css'
import DetachedResultatsJudgeNotesWindow from './components/interfaces/resultats/DetachedResultatsJudgeNotesWindow'
import { I18nProvider } from '@/i18n'

const root = document.getElementById('root')

if (root) {
  createRoot(root).render(
    <I18nProvider>
      <DetachedResultatsJudgeNotesWindow />
    </I18nProvider>,
  )
}
