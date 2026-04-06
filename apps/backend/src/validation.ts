import { z } from 'zod'

export const MAX_IMAGE_SIZE = 1_000_000

export const tierItemSchema = z.object({
  src: z.string().max(MAX_IMAGE_SIZE, 'Image must not exceed 1 MB'),
})
