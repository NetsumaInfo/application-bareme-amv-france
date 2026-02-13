import { useEffect, useMemo, useState } from 'react'
import * as tauri from '@/services/tauri'

interface AudioDbMeterProps {
  enabled: boolean
  compact?: boolean
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

export default function AudioDbMeter({ enabled, compact, className }: AudioDbMeterProps) {
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

  if (!enabled) return null

  return (
    <div className={`flex items-center gap-1.5 ${compact ? 'min-w-[92px]' : 'min-w-[112px]'} ${className || ''}`}>
      <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-mono`}>L</span>
      <div className={`relative ${compact ? 'w-11 h-1.5' : 'w-14 h-2'} rounded-full bg-white/15 overflow-hidden`}>
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500/80 to-cyan-300/90 transition-[width] duration-150"
          style={{ width: `${leftPercent}%` }}
        />
      </div>
      <span className={`${compact ? 'text-[9px] w-8' : 'text-[10px] w-10'} text-gray-400 font-mono text-right`}>
        {formatDb(levels.left_db)}
      </span>
      <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-mono`}>R</span>
      <div className={`relative ${compact ? 'w-11 h-1.5' : 'w-14 h-2'} rounded-full bg-white/15 overflow-hidden`}>
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-500/80 to-cyan-300/90 transition-[width] duration-150"
          style={{ width: `${rightPercent}%` }}
        />
      </div>
      <span className={`${compact ? 'text-[9px] w-8' : 'text-[10px] w-10'} text-gray-400 font-mono text-right`}>
        {formatDb(levels.right_db)}
      </span>
    </div>
  )
}

