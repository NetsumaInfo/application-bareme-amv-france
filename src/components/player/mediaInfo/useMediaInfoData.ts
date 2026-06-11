import { useEffect, useReducer } from 'react'
import * as tauri from '@/services/tauri'
import { buildFallbackInfo } from '@/components/player/mediaInfo/mediaInfoFormatters'

interface UseMediaInfoDataParams {
  filePath: string
}

interface MediaInfoState {
  info: tauri.MediaInfo | null
  error: string | null
}

type MediaInfoAction =
  | { type: 'resolved'; info: tauri.MediaInfo }
  | { type: 'fallback'; fallback: tauri.MediaInfo }

const INITIAL_STATE: MediaInfoState = { info: null, error: null }

function mediaInfoReducer(state: MediaInfoState, action: MediaInfoAction): MediaInfoState {
  switch (action.type) {
    case 'resolved':
      return { info: action.info, error: null }
    case 'fallback':
      return { info: state.info ?? action.fallback, error: null }
    default:
      return state
  }
}

export function useMediaInfoData({ filePath }: UseMediaInfoDataParams) {
  const [state, dispatch] = useReducer(mediaInfoReducer, INITIAL_STATE)

  useEffect(() => {
    let active = true
    const fallback = buildFallbackInfo(filePath)
    const watchdog = setTimeout(() => {
      if (!active) return
      dispatch({ type: 'fallback', fallback })
    }, 3000)

    tauri.playerGetMediaInfo(filePath)
      .then((next) => {
        if (!active) return
        clearTimeout(watchdog)
        dispatch({ type: 'resolved', info: next })
      })
      .catch((err) => {
        if (!active) return
        clearTimeout(watchdog)
        dispatch({ type: 'fallback', fallback })
        console.warn('MediaInfo fallback used:', err)
      })

    return () => {
      active = false
      clearTimeout(watchdog)
    }
  }, [filePath])

  return {
    info: state.info,
    error: state.error,
  }
}
