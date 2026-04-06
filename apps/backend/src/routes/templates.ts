import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator as zValidator } from 'hono-openapi/zod'
import { z } from 'zod'

import { db } from '../db'
import * as schema from '../db/schema'
import { MAX_IMAGE_SIZE } from '../validation'

const templateItemInput = z.object({
  src: z.string().max(MAX_IMAGE_SIZE, 'Image must not exceed 1 MB'),
})

const templateTierInput = z.object({
  label: z.string().min(1),
  color: z.string().min(1),
})

const createTemplateBody = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  tiers: z.array(templateTierInput),
  items: z.array(templateItemInput),
})

const templateTierResponse = z.object({
  label: z.string(),
  color: z.string(),
})

const templateItemResponse = z.object({
  src: z.string(),
})

const templateResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  tiers: z.array(templateTierResponse),
  items: z.array(templateItemResponse),
  createdAt: z.string(),
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

    const [template] = await db.insert(schema.templates).values({
      title: body.title,
      description: body.description,
    }).returning()

    if (body.tiers.length > 0) {
      await db.insert(schema.templateTiers).values(
        body.tiers.map((t, i) => ({
          templateId: template.id,
          label: t.label,
          color: t.color,
          position: i,
        })),
      )
    }

    if (body.items.length > 0) {
      await db.insert(schema.templateItems).values(
        body.items.map((item, i) => ({
          templateId: template.id,
          src: item.src,
          position: i,
        })),
      )
    }

    return c.json({
      id: template.id,
      title: template.title,
      description: template.description,
      tiers: body.tiers,
      items: body.items,
      createdAt: template.createdAt.toISOString(),
    }, 201)
  },
)

app.get(
  '/',
  describeRoute({
    description: 'List all templates',
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: resolver(z.array(z.object({
              id: z.string().uuid(),
              title: z.string(),
              description: z.string(),
              tiers: z.array(templateTierResponse),
              createdAt: z.string(),
            }))),
          },
        },
      },
    },
  }),
  async (c) => {
    const templates = await db.select().from(schema.templates)

    const result = await Promise.all(templates.map(async (t) => {
      const tiers = await db.select({
        label: schema.templateTiers.label,
        color: schema.templateTiers.color,
      }).from(schema.templateTiers).where(eq(schema.templateTiers.templateId, t.id)).orderBy(schema.templateTiers.position)

      return {
        id: t.id,
        title: t.title,
        description: t.description,
        tiers,
        createdAt: t.createdAt.toISOString(),
      }
    }))

    return c.json(result)
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

    const tiers = await db.select({
      label: schema.templateTiers.label,
      color: schema.templateTiers.color,
    }).from(schema.templateTiers).where(eq(schema.templateTiers.templateId, id)).orderBy(schema.templateTiers.position)

    const items = await db.select({
      src: schema.templateItems.src,
    }).from(schema.templateItems).where(eq(schema.templateItems.templateId, id)).orderBy(schema.templateItems.position)

    return c.json({
      id: template.id,
      title: template.title,
      description: template.description,
      tiers,
      items,
      createdAt: template.createdAt.toISOString(),
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

    const [deleted] = await db.delete(schema.templates)
      .where(eq(schema.templates.id, id))
      .returning()

    if (!deleted)
      return c.json({ error: 'Template not found' }, 404)

    return c.body(null, 204)
  },
)

export default app
