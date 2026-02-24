import { useEffect, useMemo, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { DetachedFramePreview } from '@/components/notes/DetachedFramePreview'
import { useDetachedFramePreview } from '@/components/notes/detached/useDetachedFramePreview'
import { ResultatsJudgeNotesView } from '@/components/interfaces/resultats/ResultatsJudgeNotesView'
import type { Clip } from '@/types/project'
import type { JudgeSource, CategoryGroup } from '@/utils/results'

interface DetachedJudgeNotesPayload {
  clips: Clip[]
  selectedClipId: string | null
  judges: JudgeSource[]
  categoryGroups: CategoryGroup[]
  judgeColors: Record<string, string>
}

export default function DetachedResultatsJudgeNotesWindow() {
  const [payload, setPayload] = useState<DetachedJudgeNotesPayload | null>(null)

  const selectedClip = useMemo(() => {
    if (!payload) return null
    return payload.clips.find((clip) => clip.id === payload.selectedClipId) ?? payload.clips[0] ?? null
  }, [payload])

  const { framePreview, hideFramePreview, showFramePreview } = useDetachedFramePreview(selectedClip?.filePath)

  useEffect(() => {
    const unlisteners: Array<() => void> = []
    let disposed = false
    const pushUnlisten = (unlisten: () => void) => {
      if (disposed) {
        unlisten()
        return
      }
      unlisteners.push(unlisten)
    }

    listen<DetachedJudgeNotesPayload>('main:resultats-judge-notes-data', (event) => {
      setPayload(event.payload)
    }).then(pushUnlisten)

    emit('resultats-notes:request-data').catch(() => {})

    return () => {
      disposed = true
      for (const unlisten of unlisteners) {
        unlisten()
      }
      emit('resultats-notes:close').catch(() => {})
    }
  }, [])

  if (!payload) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-surface-dark text-gray-400 text-sm">
        Chargement des notes juges...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full p-3 bg-surface-dark">
      <ResultatsJudgeNotesView
        clips={payload.clips}
        selectedClipId={payload.selectedClipId}
        judges={payload.judges}
        categoryGroups={payload.categoryGroups}
        judgeColors={payload.judgeColors}
        detached
        onSelectClip={(clipId) => {
          emit('resultats-notes:select-clip', { clipId }).catch(() => {})
        }}
        onJumpToTimecode={(clipId, seconds) => {
          emit('resultats-notes:timecode-jump', { clipId, seconds }).catch(() => {})
        }}
        onTimecodeHover={({ seconds, anchorRect }) => {
          showFramePreview({ seconds, anchorRect }).catch(() => {})
        }}
        onTimecodeLeave={hideFramePreview}
      />

      <DetachedFramePreview framePreview={framePreview} />
    </div>
  )
}

