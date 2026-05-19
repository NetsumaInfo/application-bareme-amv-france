import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n'

export function OverlayNoVideoState() {
  const { t } = useI18n()
  return (
    <div className="absolute inset-0 z-3 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/86 backdrop-blur-[2px]" />
      <div className="relative flex flex-col items-center gap-2 rounded-xl border border-white/15 bg-slate-950/80 px-5 py-4 text-center">
        <AlertTriangle size={18} className="@[700px]/overlay:hidden text-amber-400" />
        <AlertTriangle size={22} className="hidden @[700px]/overlay:block text-amber-400" />
        <p className="text-sm @[700px]/overlay:text-base font-medium text-white">{t('Aucune vidéo liée')}</p>
        <p className="text-[11px] @[700px]/overlay:text-xs text-gray-300">
          {t("Ce clip n’a pas de média associé.")}
        </p>
      </div>
    </div>
  )
}
