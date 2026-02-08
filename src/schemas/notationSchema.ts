import { z } from 'zod'

export const criterionScoreSchema = z.object({
  criterionId: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  isValid: z.boolean(),
  validationErrors: z.array(z.string()),
})

export const noteSchema = z.object({
  clipId: z.string(),
  baremeId: z.string(),
  scores: z.record(z.string(), criterionScoreSchema),
  textNotes: z.string(),
  finalScore: z.number().optional(),
  scoredAt: z.string().optional(),
})

export type NoteFormData = z.infer<typeof noteSchema>
