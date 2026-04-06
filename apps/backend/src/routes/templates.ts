import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator as zValidator } from 'hono-openapi/zod'
import { z } from 'zod'

import { db } from '../db'
import * as schema from '../db/schema'
import { MAX_IMAGE_SIZE } from '../validation'

const tierItemInput = z.object({
  src: z.string().max(MAX_IMAGE_SIZE, 'Image must not exceed 1 MB'),
})

const tierInput = z.object({
  label: z.string().min(1),
  color: z.string().min(1),
  position: z.string(),
  items: z.array(tierItemInput),
})

const createTemplateBody = z.object({
  name: z.string().min(1),
  tiers: z.array(tierInput),
})

const templateResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tiers: z.array(z.object({
    id: z.string().uuid(),
    label: z.string(),
    color: z.string(),
    position: z.string(),
    items: z.array(z.object({
      id: z.string().uuid(),
      src: z.string(),
    })),
  })),
})

const app = new Hono()

app.post(
  '/',
  describeRoute({
    description: 'Create a template',
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: resolver(templateResponse) } } },
    },
  }),
  zValidator('json', createTemplateBody),
  async (c) => {
    const body = c.req.valid('json')

    const [template] = await db.insert(schema.templates).values({ name: body.name }).returning()

    const tiersWithItems = []
    for (const tierInput of body.tiers) {
      const [tier] = await db.insert(schema.tiers).values({
        templateId: template.id,
        label: tierInput.label,
        color: tierInput.color,
        position: tierInput.position,
      }).returning()

      const items = tierInput.items.length > 0
        ? await db.insert(schema.tierItems).values(
            tierInput.items.map(item => ({ tierId: tier.id, src: item.src })),
          ).returning()
        : []

      tiersWithItems.push({ ...tier, items })
    }

    return c.json({
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      tiers: tiersWithItems,
    }, 201)
  },
)

app.get(
  '/',
  describeRoute({
    description: 'List all templates',
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: resolver(z.array(z.object({ id: z.string().uuid(), name: z.string(), createdAt: z.string(), updatedAt: z.string() }))) } } },
    },
  }),
  async (c) => {
    const templates = await db.select({
      id: schema.templates.id,
      name: schema.templates.name,
      createdAt: schema.templates.createdAt,
      updatedAt: schema.templates.updatedAt,
    }).from(schema.templates)

    return c.json(templates.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })))
  },
)

app.get(
  '/:id',
  describeRoute({
    description: 'Get a template by ID',
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: resolver(templateResponse) } } },
      404: { description: 'Not found' },
    },
  }),
  async (c) => {
    const { id } = c.req.param()

    const template = await db.query.templates.findFirst({
      where: eq(schema.templates.id, id),
    })

    if (!template)
      return c.json({ error: 'Template not found' }, 404)

    const tiers = await db.select().from(schema.tiers).where(eq(schema.tiers.templateId, id))

    const tiersWithItems = await Promise.all(tiers.map(async (tier) => {
      const items = await db.select().from(schema.tierItems).where(eq(schema.tierItems.tierId, tier.id))
      return { ...tier, items }
    }))

    return c.json({
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      tiers: tiersWithItems,
    })
  },
)

app.delete(
  '/:id',
  describeRoute({
    description: 'Delete a template',
    responses: {
      204: { description: 'Deleted' },
      404: { description: 'Not found' },
    },
  }),
  async (c) => {
    const { id } = c.req.param()

    const [deleted] = await db.delete(schema.templates).where(eq(schema.templates.id, id)).returning()

    if (!deleted)
      return c.json({ error: 'Template not found' }, 404)

    return c.body(null, 204)
  },
)

export default app
