import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n'

interface OverlayNoVideoStateProps {
  compactControls: boolean
}

export function OverlayNoVideoState({ compactControls }: OverlayNoVideoStateProps) {
  const { t } = useI18n()
  return (
    <div className="absolute inset-0 z-3 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/86" />
      <div className="relative flex flex-col items-center gap-2 rounded-xl border border-white/15 bg-slate-950/80 px-5 py-4 text-center">
        <AlertTriangle size={compactControls ? 18 : 22} className="text-amber-400" />
        <p className={`${compactControls ? 'text-sm' : 'text-base'} font-medium text-white`}>{t('Aucune vidéo liée')}</p>
        <p className={`${compactControls ? 'text-[11px]' : 'text-xs'} text-gray-300`}>
          {t("Ce clip n’a pas de média associé.")}
        </p>
      </div>
    </div>
  )
}
