import { z } from 'zod'
import type { TranslateFn } from '@/i18n/context'

export function createCreateProjectSchema(t: TranslateFn) {
  return z.object({
    name: z.string().min(1, t('Nom du concours requis')).max(100, t('Nom trop long')),
    judgeName: z.string().min(1, t('Nom du juge requis')).max(100, t('Nom trop long')),
    baremeId: z.string().min(1, t('Sélectionnez un barème')),
    clipNamePattern: z.enum(['pseudo_clip', 'clip_pseudo']),
  })
}

export type CreateProjectFormData = z.infer<ReturnType<typeof createCreateProjectSchema>>
