import { z } from 'zod'

export const WeightedItemSchema = z.object({
  key: z.string(),
  weight: z.number().min(0),
})
export type WeightedItem = z.infer<typeof WeightedItemSchema>

export const ProjectSchema = z.object({
  include: z.boolean(),
  startYear: z.number().int().or(z.nan()).nullable(),
  projectName: z.string().nullable(),
  projectTitle: z.string().nullable(),
  fundingMillions: z.number().or(z.nan()).nullable(),
  tags: z.array(WeightedItemSchema),
  projectLeads: z.array(z.string()),
  transitionTags: z.array(WeightedItemSchema),
  status: z.string().nullable(),
  transitionPartners: z.array(WeightedItemSchema),
  transitionNoneYet: z.number().optional(),
  transitionSuccess: z.number().optional(),
})
export type Project = z.infer<typeof ProjectSchema>

export type TagAggregate = {
  tag: string
  status: string | null
  totalProjects: number
  successCount: number
  successRate: number
  totalFunding: number
}

export type YearlyCount = {
  year: number
  category: string
  count: number
}

export const SUCCESS_STATUSES: Set<string> = new Set([
  'Success',
  'Success past 5years',
])


