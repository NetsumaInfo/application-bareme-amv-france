import { z } from 'zod'

export const projectSettingsSchema = z.object({
  autoSave: z.boolean(),
  autoSaveInterval: z.number().min(5).max(300),
  defaultPlaybackSpeed: z.number().min(0.25).max(4),
  defaultVolume: z.number().min(0).max(100),
  hideFinalScoreUntilEnd: z.boolean(),
  hideTotals: z.boolean().default(false),
  showMiniatures: z.boolean().default(false),
  showAddRowButton: z.boolean().default(false),
  thumbnailDefaultTimeSec: z.number().min(0).max(600).default(10),
})

export const clipSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  displayName: z.string(),
  author: z.string().optional(),
  duration: z.number().min(0),
  hasInternalSubtitles: z.boolean(),
  audioTrackCount: z.number().min(0),
  scored: z.boolean(),
  order: z.number().min(0),
})

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nom du concours requis'),
  judgeName: z.string().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
  baremeId: z.string(),
  clipsFolderPath: z.string(),
  settings: projectSettingsSchema,
  filePath: z.string().optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nom du concours requis').max(100, 'Nom trop long'),
  judgeName: z.string().min(1, 'Nom du juge requis').max(100, 'Nom trop long'),
  baremeId: z.string().min(1, 'Sélectionnez un barème'),
})

export type CreateProjectFormData = z.infer<typeof createProjectSchema>
