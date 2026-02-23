import { useEffect, useMemo, useState } from 'react'
import * as tauri from '@/services/tauri'

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
  const [levels, setLevels] = useState<tauri.AudioLevels>({
    left_db: -90,
    right_db: -90,
    overall_db: -90,
    available: false,
  })

  useEffect(() => {
    if (!enabled) return

    let active = true
    const poll = async () => {
      try {
        const data = await tauri.playerGetAudioLevels()
        if (active) setLevels(data)
      } catch {
        // Ignore polling errors to keep UI responsive.
      }
    }

    poll()
    const timer = setInterval(poll, 220)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [enabled])

  const leftPercent = useMemo(() => dbToPercent(levels.left_db), [levels.left_db])
  const rightPercent = useMemo(() => dbToPercent(levels.right_db), [levels.right_db])
  const leftBarClass = useMemo(() => levelColorClass(levels.left_db), [levels.left_db])
  const rightBarClass = useMemo(() => levelColorClass(levels.right_db), [levels.right_db])
  const leftValueClass = useMemo(() => valueColorClass(levels.left_db), [levels.left_db])
  const rightValueClass = useMemo(() => valueColorClass(levels.right_db), [levels.right_db])

  if (!enabled) return null

  return (
    <div className={`flex items-center gap-1.5 ${tiny ? 'min-w-[66px]' : compact ? 'min-w-[108px]' : 'min-w-[122px]'} ${className || ''}`}>
      <span className={`${compact ? 'text-[10px]' : 'text-[10px]'} text-gray-500 font-mono`}>L</span>
      <div className={`relative ${tiny ? 'w-8 h-1.5' : compact ? 'w-12 h-2' : 'w-14 h-2'} rounded-full bg-white/15 overflow-hidden`}>
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-[width] duration-150 ${leftBarClass}`}
          style={{ width: `${leftPercent}%` }}
        />
      </div>
      {!tiny && (
        <span className={`${compact ? 'text-[10px] w-9' : 'text-[10px] w-10'} font-mono text-right ${muted ? 'text-gray-500' : leftValueClass}`}>
          {muted ? 'mute' : formatDb(levels.left_db)}
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
          {muted ? 'mute' : formatDb(levels.right_db)}
        </span>
      )}
    </div>
  )
}
