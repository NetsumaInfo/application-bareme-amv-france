import type {
  Clip,
  ImportedJudgeCriterionScore,
  ImportedJudgeData,
  ImportedJudgeNote,
  Project,
  ProjectData,
} from '@/types/project'
import { DEFAULT_PROJECT_SETTINGS } from '@/types/project'
import { generateId, parseClipName } from '@/utils/formatters'
import { sanitizeColor } from '@/utils/colors'

interface NormalizedProjectData {
  project: Project
  clips: Clip[]
  importedJudges: ImportedJudgeData[]
}

function numberOr(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeJudgeColors(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  return Object.entries(raw as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
    if (!key.trim()) return acc
    if (typeof value !== 'string') return acc
    acc[key] = sanitizeColor(value)
    return acc
  }, {})
}

function normalizeImportedJudges(rawImportedJudges: unknown[]): ImportedJudgeData[] {
  return rawImportedJudges
    .map((item) => {
      const row = item as Record<string, unknown>
      const judgeName = typeof row.judgeName === 'string'
        ? row.judgeName
        : typeof row.judge_name === 'string'
          ? row.judge_name
          : ''
      if (!judgeName.trim()) return null

      const notesRaw = (row.notes as Record<string, unknown> | undefined) ?? {}
      const notes: Record<string, ImportedJudgeNote> = {}

      for (const [clipId, noteValue] of Object.entries(notesRaw)) {
        const noteRow = noteValue as Record<string, unknown>
        const scoresRaw = (noteRow.scores as Record<string, unknown> | undefined) ?? {}
        const scores: Record<string, ImportedJudgeCriterionScore> = {}

        for (const [criterionId, scoreValue] of Object.entries(scoresRaw)) {
          const scoreRow = scoreValue as Record<string, unknown>
          scores[criterionId] = {
            value: (scoreRow.value as number | string | boolean) ?? 0,
            isValid: scoreRow.isValid !== false,
          }
        }

        const parsedFinalScore = Number(noteRow.finalScore)
        const textNotes = typeof noteRow.textNotes === 'string'
          ? noteRow.textNotes
          : typeof noteRow.text_notes === 'string'
            ? noteRow.text_notes
            : undefined
        const criterionNotesRaw = noteRow.criterionNotes && typeof noteRow.criterionNotes === 'object'
          ? (noteRow.criterionNotes as Record<string, unknown>)
          : noteRow.criterion_notes && typeof noteRow.criterion_notes === 'object'
            ? (noteRow.criterion_notes as Record<string, unknown>)
            : {}
        const criterionNotes = Object.fromEntries(
          Object.entries(criterionNotesRaw)
            .filter(([key, value]) => key.trim().length > 0 && typeof value === 'string')
            .map(([key, value]) => [key, value as string]),
        )
        const categoryNotesRaw = noteRow.categoryNotes && typeof noteRow.categoryNotes === 'object'
          ? (noteRow.categoryNotes as Record<string, unknown>)
          : noteRow.category_notes && typeof noteRow.category_notes === 'object'
            ? (noteRow.category_notes as Record<string, unknown>)
            : {}
        const categoryNotes = Object.fromEntries(
          Object.entries(categoryNotesRaw)
            .filter(([key, value]) => key.trim().length > 0 && typeof value === 'string')
            .map(([key, value]) => [key, value as string]),
        )
        notes[clipId] = Number.isFinite(parsedFinalScore)
          ? {
              scores,
              finalScore: parsedFinalScore,
              textNotes,
              criterionNotes,
              categoryNotes,
            }
          : {
              scores,
              textNotes,
              criterionNotes,
              categoryNotes,
            }
      }

      return {
        judgeName: judgeName.trim(),
        notes,
      }
    })
    .filter((judge): judge is ImportedJudgeData => judge !== null)
}

export function normalizeProjectDataInput(data: ProjectData): NormalizedProjectData {
  const now = new Date().toISOString()
  const rawProject = (data.project ?? {}) as unknown as Record<string, unknown>
  const rawSettings = (rawProject.settings ?? {}) as Record<string, unknown>
  const clampedThumbnailDefaultTime = Math.max(
    0,
    Math.min(
      600,
      numberOr(
        rawSettings.thumbnailDefaultTimeSec ?? rawSettings.thumbnail_default_time_sec,
        DEFAULT_PROJECT_SETTINGS.thumbnailDefaultTimeSec,
      ),
    ),
  )
  const normalizedMultiPseudoDisplayMode = (() => {
    const rawMode = rawSettings.multiPseudoDisplayMode ?? rawSettings.multi_pseudo_display_mode
    if (
      rawMode === 'collab_mep'
      || rawMode === 'first_three'
      || rawMode === 'all'
    ) {
      return rawMode
    }

    const legacyCollabMep = rawSettings.showCollabMepLabels ?? rawSettings.show_collab_mep_labels
    if (typeof legacyCollabMep === 'boolean') {
      return legacyCollabMep ? 'collab_mep' : 'all'
    }

    return DEFAULT_PROJECT_SETTINGS.multiPseudoDisplayMode
  })()

  const project: Project = {
    id: (rawProject.id as string) || generateId(),
    name: (rawProject.name as string) || 'Projet AMV',
    judgeName:
      (rawProject.judgeName as string) ||
      (rawProject.judge_name as string) ||
      '',
    createdAt:
      (rawProject.createdAt as string) ||
      (rawProject.created_at as string) ||
      now,
    updatedAt:
      (rawProject.updatedAt as string) ||
      (rawProject.updated_at as string) ||
      now,
    baremeId:
      (rawProject.baremeId as string) ||
      (rawProject.bareme_id as string) ||
      data.baremeId ||
      '',
    clipsFolderPath:
      (rawProject.clipsFolderPath as string) ||
      (rawProject.clips_folder_path as string) ||
      '',
    settings: {
      autoSave:
        typeof rawSettings.autoSave === 'boolean'
          ? rawSettings.autoSave
          : typeof rawSettings.auto_save === 'boolean'
            ? rawSettings.auto_save
            : DEFAULT_PROJECT_SETTINGS.autoSave,
      autoSaveInterval: numberOr(
        rawSettings.autoSaveInterval ?? rawSettings.auto_save_interval,
        DEFAULT_PROJECT_SETTINGS.autoSaveInterval,
      ),
      defaultPlaybackSpeed: numberOr(
        rawSettings.defaultPlaybackSpeed ?? rawSettings.default_playback_speed,
        DEFAULT_PROJECT_SETTINGS.defaultPlaybackSpeed,
      ),
      defaultVolume: numberOr(
        rawSettings.defaultVolume ?? rawSettings.default_volume,
        DEFAULT_PROJECT_SETTINGS.defaultVolume,
      ),
      judgeColors: normalizeJudgeColors(rawSettings.judgeColors ?? rawSettings.judge_colors),
      hideFinalScoreUntilEnd:
        typeof rawSettings.hideFinalScoreUntilEnd === 'boolean'
          ? rawSettings.hideFinalScoreUntilEnd
          : typeof rawSettings.hide_final_score_until_end === 'boolean'
            ? rawSettings.hide_final_score_until_end
            : DEFAULT_PROJECT_SETTINGS.hideFinalScoreUntilEnd,
      hideTotals:
        typeof rawSettings.hideTotals === 'boolean'
          ? rawSettings.hideTotals
          : typeof rawSettings.hide_totals === 'boolean'
            ? rawSettings.hide_totals
            : DEFAULT_PROJECT_SETTINGS.hideTotals,
      showMiniatures:
        typeof rawSettings.showMiniatures === 'boolean'
          ? rawSettings.showMiniatures
          : typeof rawSettings.show_miniatures === 'boolean'
            ? rawSettings.show_miniatures
            : DEFAULT_PROJECT_SETTINGS.showMiniatures,
      multiPseudoDisplayMode: normalizedMultiPseudoDisplayMode,
      showAddRowButton:
        typeof rawSettings.showAddRowButton === 'boolean'
          ? rawSettings.showAddRowButton
          : typeof rawSettings.show_add_row_button === 'boolean'
            ? rawSettings.show_add_row_button
            : DEFAULT_PROJECT_SETTINGS.showAddRowButton,
      thumbnailDefaultTimeSec: clampedThumbnailDefaultTime,
    },
    filePath:
      (rawProject.filePath as string | undefined) ||
      (rawProject.file_path as string | undefined),
  }

  const rawClips = Array.isArray(data.clips) ? data.clips : []
  const clips = rawClips.map((clip, index) => {
    const rawClip = clip as unknown as Record<string, unknown>
    const fileName =
      (rawClip.fileName as string) ||
      (rawClip.file_name as string) ||
      ''
    const parsed = parseClipName(fileName)
    const maybeThumbnailTime = Number(rawClip.thumbnailTime ?? rawClip.thumbnail_time)
    const thumbnailTime = Number.isFinite(maybeThumbnailTime) && maybeThumbnailTime >= 0
      ? maybeThumbnailTime
      : undefined

    return {
      id: (rawClip.id as string) || generateId(),
      fileName,
      filePath:
        (rawClip.filePath as string) ||
        (rawClip.file_path as string) ||
        '',
      displayName: (rawClip.displayName as string) || parsed.displayName,
      author: (rawClip.author as string | undefined) || parsed.author,
      duration: numberOr(rawClip.duration, 0),
      hasInternalSubtitles: Boolean(
        rawClip.hasInternalSubtitles ?? rawClip.has_internal_subtitles ?? false,
      ),
      audioTrackCount:
        Math.max(1, Number(rawClip.audioTrackCount ?? rawClip.audio_track_count ?? 1) || 1),
      scored: Boolean(rawClip.scored),
      order: numberOr(rawClip.order, index),
      thumbnailTime,
    }
  })

  const projectLike = data as unknown as Record<string, unknown>
  const rawImportedJudges = Array.isArray(projectLike.importedJudges)
    ? projectLike.importedJudges
    : Array.isArray(projectLike.imported_judges)
      ? projectLike.imported_judges
      : []

  return {
    project,
    clips,
    importedJudges: normalizeImportedJudges(rawImportedJudges as unknown[]),
  }
}
