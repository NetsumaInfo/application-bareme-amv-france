import { useCallback, useEffect, useRef, useState } from 'react'
import * as tauri from '@/services/tauri'
import type { TrackItem } from '@/services/tauri'

interface UseOverlayTracksParams {
  resetHideTimer: () => void
}

export function useOverlayTracks({ resetHideTimer }: UseOverlayTracksParams) {
  const [subtitleTracks, setSubtitleTracks] = useState<TrackItem[]>([])
  const [audioTracks, setAudioTracks] = useState<TrackItem[]>([])
  const [currentSubtitleId, setCurrentSubtitleId] = useState<number | null>(null)
  const [currentAudioId, setCurrentAudioId] = useState<number | null>(null)
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [audioMenuOpen, setAudioMenuOpen] = useState(false)
  const subRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLDivElement | null>(null)

  const refreshTracks = useCallback(() => {
    tauri.playerGetTracks().then((tracks) => {
      setSubtitleTracks(tracks.subtitle_tracks)
      setAudioTracks(tracks.audio_tracks)

      setCurrentAudioId((prev) => {
        if (tracks.audio_tracks.length === 0) return null
        if (prev !== null && tracks.audio_tracks.some((track) => track.id === prev)) {
          return prev
        }
        return tracks.audio_tracks[0].id
      })

      setCurrentSubtitleId((prev) => {
        if (prev === null) return null
        if (tracks.subtitle_tracks.some((track) => track.id === prev)) return prev
        return null
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    refreshTracks()
    const interval = setInterval(refreshTracks, 1200)
    return () => clearInterval(interval)
  }, [refreshTracks])

  useEffect(() => {
    if (!subMenuOpen && !audioMenuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (subMenuOpen && subRef.current && !subRef.current.contains(event.target as Node)) {
        setSubMenuOpen(false)
      }
      if (audioMenuOpen && audioRef.current && !audioRef.current.contains(event.target as Node)) {
        setAudioMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [subMenuOpen, audioMenuOpen])

  const handleSelectSubtitle = useCallback(async (id: number | null) => {
    try {
      await tauri.playerSetSubtitleTrack(id)
      setCurrentSubtitleId(id)
    } catch (error) {
      console.error('Failed to set subtitle track:', error)
    }
    setSubMenuOpen(false)
    resetHideTimer()
  }, [resetHideTimer])

  const handleSelectAudio = useCallback(async (id: number) => {
    try {
      await tauri.playerSetAudioTrack(id)
      setCurrentAudioId(id)
    } catch (error) {
      console.error('Failed to set audio track:', error)
    }
    setAudioMenuOpen(false)
    resetHideTimer()
  }, [resetHideTimer])

  return {
    subtitleTracks,
    audioTracks,
    currentSubtitleId,
    currentAudioId,
    subMenuOpen,
    audioMenuOpen,
    subRef,
    audioRef,
    setSubMenuOpen,
    setAudioMenuOpen,
    refreshTracks,
    handleSelectSubtitle,
    handleSelectAudio,
  }
}
