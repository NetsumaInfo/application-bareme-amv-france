import { useMemo } from 'react'
import { useRealtimeAudioLevels } from '@/hooks/useRealtimeAudioLevels'
import { useI18n } from '@/i18n'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

interface AudioDbMeterProps {
  enabled: boolean
  compact?: boolean
  tiny?: boolean
  muted?: boolean
  className?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function dbToPercent(db: number): number {
  if (!Number.isFinite(db)) return 0
  return clamp(((db + 60) / 60) * 100, 0, 100)
}

function formatDb(db: number): string {
  if (!Number.isFinite(db) || db <= -89.9) return '-inf'
  return `${db.toFixed(1)}`
}

function levelColorClass(db: number): string {
  if (!Number.isFinite(db) || db <= -60) return 'from-slate-500/60 to-slate-400/60'
  if (db >= -6) return 'from-red-500/90 to-orange-400/90'
  if (db >= -18) return 'from-amber-400/90 to-yellow-300/90'
  return 'from-emerald-500/85 to-cyan-300/85'
}

function valueColorClass(db: number): string {
  if (!Number.isFinite(db) || db <= -89.9) return 'text-gray-500'
  if (db >= -6) return 'text-red-300'
  if (db >= -18) return 'text-amber-300'
  return 'text-emerald-300'
}

export default function AudioDbMeter({ enabled, compact, tiny, muted, className }: AudioDbMeterProps) {
  const { t } = useI18n()
  const levels = useRealtimeAudioLevels(enabled)

  const leftPercent = useMemo(() => dbToPercent(levels.left_db), [levels.left_db])
  const rightPercent = useMemo(() => dbToPercent(levels.right_db), [levels.right_db])
  const leftBarClass = useMemo(() => levelColorClass(levels.left_db), [levels.left_db])
  const rightBarClass = useMemo(() => levelColorClass(levels.right_db), [levels.right_db])
  const leftValueClass = useMemo(() => valueColorClass(levels.left_db), [levels.left_db])
  const rightValueClass = useMemo(() => valueColorClass(levels.right_db), [levels.right_db])
  const meterTooltipText = muted ? t('Muet') : `${formatDb(levels.overall_db)} dB`

  if (!enabled) return null

  return (
    <HoverTextTooltip text={meterTooltipText} className="inline-flex">
      <div
        className={`flex items-center gap-1.5 ${tiny ? 'min-w-[66px]' : compact ? 'min-w-[108px]' : 'min-w-[122px]'} ${className || ''}`}
      >
        <span className={`${compact ? 'text-[10px]' : 'text-[10px]'} text-gray-500 font-mono`}>L</span>
        <div className={`relative ${tiny ? 'w-8 h-1.5' : compact ? 'w-12 h-2' : 'w-14 h-2'} rounded-full bg-white/15 overflow-hidden`}>
          <div
            className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-[width] duration-150 ${leftBarClass}`}
            style={{ width: `${leftPercent}%` }}
          />
        </div>
        {!tiny && (
          <span className={`${compact ? 'text-[10px] w-9' : 'text-[10px] w-10'} font-mono text-right ${muted ? 'text-gray-500' : leftValueClass}`}>
            {muted ? t('Muet') : formatDb(levels.left_db)}
          </span>
        )}
        <span className={`${compact ? 'text-[10px]' : 'text-[10px]'} text-gray-500 font-mono`}>R</span>
        <div className={`relative ${tiny ? 'w-8 h-1.5' : compact ? 'w-12 h-2' : 'w-14 h-2'} rounded-full bg-white/15 overflow-hidden`}>
          <div
            className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-[width] duration-150 ${rightBarClass}`}
            style={{ width: `${rightPercent}%` }}
          />
        </div>
        {!tiny && (
          <span className={`${compact ? 'text-[10px] w-9' : 'text-[10px] w-10'} font-mono text-right ${muted ? 'text-gray-500' : rightValueClass}`}>
            {muted ? t('Muet') : formatDb(levels.right_db)}
          </span>
        )}
      </div>
    </HoverTextTooltip>
  )
}
