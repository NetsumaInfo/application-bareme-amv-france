import { z } from 'zod'

export const validationRuleSchema = z.object({
  type: z.enum(['min', 'max', 'required', 'step']),
  value: z.union([z.number(), z.boolean()]),
  message: z.string(),
})

export const criterionSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  name: z.string().min(1, 'Nom du critère requis'),
  description: z.string().optional(),
  type: z.enum(['numeric', 'slider', 'boolean', 'select', 'text']),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  category: z.string().optional(),
  validationRules: z.array(validationRuleSchema).optional(),
}).refine(
  (data) => {
    if (data.type === 'select' && (!data.options || data.options.length === 0)) {
      return false
    }
    return true
  },
  { message: "Les critères de type 'select' doivent avoir au moins une option" }
).refine(
  (data) => {
    if (data.min !== undefined && data.max !== undefined && data.min > data.max) {
      return false
    }
    return true
  },
  { message: 'Le minimum ne peut pas être supérieur au maximum' }
)

export const baremeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nom du barème requis'),
  description: z.string().optional(),
  isOfficial: z.boolean(),
  criteria: z.array(criterionSchema).min(1, 'Au moins un critère requis'),
  categoryColors: z.record(z.string(), z.string()).optional(),
  totalPoints: z.number().positive('Le total des points doit être positif'),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BaremeFormData = z.infer<typeof baremeSchema>
export type CriterionFormData = z.infer<typeof criterionSchema>
