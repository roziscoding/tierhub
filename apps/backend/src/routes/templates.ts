import type { AuthEnv } from '../types'

import { and, asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator as zValidator } from 'hono-openapi/zod'
import { z } from 'zod'

import { db } from '../db'
import * as schema from '../db/schema'
import { requireAuth } from '../middleware/auth'
import { MAX_IMAGE_SIZE } from '../validation'

const DATA_URI_REGEX = /^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,/

const templateItemInput = z.object({
  src: z.string()
    .max(MAX_IMAGE_SIZE, 'Image must not exceed 1 MB')
    .regex(DATA_URI_REGEX, 'Image must be a valid data URI'),
})

const templateTierInput = z.object({
  label: z.string().min(1).max(50),
  color: z.string().regex(/^#[\dA-F]{6}$/i, 'Color must be a valid hex color'),
})

const createTemplateBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  tiers: z.array(templateTierInput).min(1).max(10),
  items: z.array(templateItemInput).min(1).max(100),
})

const uuidParam = z.object({
  id: z.string().uuid(),
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

const app = new Hono<AuthEnv>()

app.use(requireAuth)

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
    const user = c.get('user')

    const result = await db.transaction(async (tx) => {
      const [template] = await tx.insert(schema.templates).values({
        userId: user.id,
        title: body.title,
        description: body.description,
      }).returning()

      await tx.insert(schema.templateTiers).values(
        body.tiers.map((t, i) => ({
          templateId: template.id,
          label: t.label,
          color: t.color,
          position: i,
        })),
      )

      await tx.insert(schema.templateItems).values(
        body.items.map((item, i) => ({
          templateId: template.id,
          src: item.src,
          position: i,
        })),
      )

      return template
    })

    return c.json({
      id: result.id,
      title: result.title,
      description: result.description,
      tiers: body.tiers,
      items: body.items,
      createdAt: result.createdAt.toISOString(),
    }, 201)
  },
)

app.get(
  '/',
  describeRoute({
    description: 'List current user templates',
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
    const user = c.get('user')

    const templates = await db.query.templates.findMany({
      where: eq(schema.templates.userId, user.id),
      with: {
        tiers: {
          columns: { label: true, color: true },
          orderBy: asc(schema.templateTiers.position),
        },
      },
    })

    return c.json(templates.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      tiers: t.tiers,
      createdAt: t.createdAt.toISOString(),
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
  zValidator('param', uuidParam),
  async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    const template = await db.query.templates.findFirst({
      where: and(eq(schema.templates.id, id), eq(schema.templates.userId, user.id)),
      with: {
        tiers: {
          columns: { label: true, color: true },
          orderBy: asc(schema.templateTiers.position),
        },
        items: {
          columns: { src: true },
          orderBy: asc(schema.templateItems.position),
        },
      },
    })

    if (!template)
      return c.json({ error: 'Template not found' }, 404)

    return c.json({
      id: template.id,
      title: template.title,
      description: template.description,
      tiers: template.tiers,
      items: template.items,
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
  zValidator('param', uuidParam),
  async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    const [deleted] = await db.delete(schema.templates)
      .where(and(eq(schema.templates.id, id), eq(schema.templates.userId, user.id)))
      .returning()

    if (!deleted)
      return c.json({ error: 'Template not found' }, 404)

    return c.body(null, 204)
  },
)

export default app
