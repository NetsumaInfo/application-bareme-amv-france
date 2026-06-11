import type { Ref } from 'react'
import {
  Camera,
  ChevronFirst,
  ChevronLast,
  FlagTriangleLeft,
  FlagTriangleRight,
  Gauge,
  Maximize2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  XCircle,
} from 'lucide-react'
import { AppContextMenuItem, AppContextMenuSeparator } from '@/components/ui/AppContextMenu'
import { formatTime } from '@/utils/formatters'
import { useI18n } from '@/i18n'
import { PLAYBACK_SPEEDS } from '@/components/player/overlay/overlayConstants'

export interface PlayerMenuContentProps {
  isPlaying: boolean
  speed: number
  loopFile: boolean
  abA: number | null
  abB: number | null
  isPlayerFullscreen: boolean
  onTogglePause: () => void
  onPrevClip: () => void
  onNextClip: () => void
  onFrameBack: () => void
  onFrameStep: () => void
  onScreenshot: () => void
  onToggleFullscreen: () => void
  onApplySpeed: (value: number) => void
  onToggleLoopFile: () => void
  onMarkLoopA: () => void
  onMarkLoopB: () => void
  onClearLoop: () => void
  ref?: Ref<HTMLDivElement>
}

export function PlayerMenuContent({
  isPlaying,
  speed,
  loopFile,
  abA,
  abB,
  isPlayerFullscreen,
  onTogglePause,
  onPrevClip,
  onNextClip,
  onFrameBack,
  onFrameStep,
  onScreenshot,
  onToggleFullscreen,
  onApplySpeed,
  onToggleLoopFile,
  onMarkLoopA,
  onMarkLoopB,
  onClearLoop,
  ref,
}: PlayerMenuContentProps) {
  const { t } = useI18n()
  const hasAbLoop = abA !== null || abB !== null

  return (
    <div
      ref={ref}
      className="inline-block min-w-[172px] overflow-hidden rounded-md border border-slate-700/70 bg-[linear-gradient(180deg,rgba(20,24,36,0.98),rgba(12,16,26,0.98))] shadow-[0_14px_32px_rgba(2,6,23,0.34)] backdrop-blur-xl"
      onContextMenu={(event) => event.preventDefault()}
      role="menu"
      tabIndex={-1}
    >
      <div className="p-0.5">
        <AppContextMenuItem
          dense
          onClick={onTogglePause}
          label={isPlaying ? t('Pause') : t('Lecture')}
          icon={isPlaying ? Pause : Play}
        />
        <AppContextMenuItem dense onClick={onPrevClip} label={t('Clip précédent')} icon={SkipBack} />
        <AppContextMenuItem dense onClick={onNextClip} label={t('Clip suivant')} icon={SkipForward} />

        <AppContextMenuSeparator />

        <AppContextMenuItem dense onClick={onFrameBack} label={t('Image précédente')} icon={ChevronFirst} />
        <AppContextMenuItem dense onClick={onFrameStep} label={t('Image suivante')} icon={ChevronLast} />
        <AppContextMenuItem dense onClick={onScreenshot} label={t("Capture d'écran")} icon={Camera} />

        <AppContextMenuSeparator />

        <div className="flex items-center gap-1 px-1.5 pb-0.5 pt-1">
          <Gauge size={10} strokeWidth={1.85} className="text-slate-400" />
          <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {t('Vitesse de lecture')}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-0.5 px-1 pb-1">
          {PLAYBACK_SPEEDS.map((value) => {
            const active = Math.abs(speed - value) < 0.001
            return (
              <button
                key={value}
                type="button"
                onClick={() => onApplySpeed(value)}
                className={`rounded px-0.5 py-0.5 text-[9px] font-medium transition-colors ${
                  active ? 'bg-primary-500/20 text-primary-200' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {value === 1 ? '1x' : `${value}x`}
              </button>
            )
          })}
        </div>

        <AppContextMenuSeparator />

        <AppContextMenuItem
          dense
          onClick={onToggleLoopFile}
          label={t('Répéter indéfiniment')}
          icon={Repeat}
          active={loopFile}
        />
        <AppContextMenuItem
          dense
          onClick={onMarkLoopA}
          label={abA !== null ? t('Boucle A : {time}').replace('{time}', formatTime(abA)) : t('Boucle — marquer A')}
          icon={FlagTriangleLeft}
          active={abA !== null}
        />
        <AppContextMenuItem
          dense
          onClick={onMarkLoopB}
          label={abB !== null ? t('Boucle B : {time}').replace('{time}', formatTime(abB)) : t('Boucle — marquer B')}
          icon={FlagTriangleRight}
          active={abB !== null}
        />
        <AppContextMenuItem
          dense
          onClick={onClearLoop}
          label={t('Réinitialiser la boucle A-B')}
          icon={XCircle}
          disabled={!hasAbLoop}
        />

        <AppContextMenuSeparator />

        <AppContextMenuItem
          dense
          onClick={onToggleFullscreen}
          label={isPlayerFullscreen ? t('Quitter le plein écran') : t('Plein écran')}
          icon={Maximize2}
        />
      </div>
    </div>
    )
}
