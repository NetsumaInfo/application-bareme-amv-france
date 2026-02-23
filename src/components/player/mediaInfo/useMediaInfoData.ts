import { useEffect, useState } from 'react'
import * as tauri from '@/services/tauri'
import { buildFallbackInfo } from '@/components/player/mediaInfo/mediaInfoFormatters'

interface UseMediaInfoDataParams {
  filePath: string
}

export function useMediaInfoData({ filePath }: UseMediaInfoDataParams) {
  const [info, setInfo] = useState<tauri.MediaInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fallback = buildFallbackInfo(filePath)
    const watchdog = setTimeout(() => {
      if (!active) return
      setError(null)
      setInfo((prev) => prev ?? fallback)
    }, 3000)

    tauri.playerGetMediaInfo(filePath)
      .then((next) => {
        if (!active) return
        clearTimeout(watchdog)
        setError(null)
        setInfo(next)
      })
      .catch((err) => {
        if (!active) return
        clearTimeout(watchdog)
        setError(null)
        setInfo((prev) => prev ?? fallback)
        console.warn('MediaInfo fallback used:', err)
      })

    return () => {
      active = false
      clearTimeout(watchdog)
    }
  }, [filePath])

  return {
    info,
    error,
  }
}
