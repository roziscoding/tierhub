import { swaggerUI } from '@hono/swagger-ui'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'

const app = new Hono()

const healthSchema = z.object({ status: z.string() })

app.get(
  '/health',
  describeRoute({
    description: 'Health check',
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: resolver(healthSchema) } } },
    },
  }),
  c => c.json({ status: 'ok' }),
)

app.get('/doc', (c) => {
  return c.json({ openapi: '3.1.0', info: { title: 'TierHub API', version: '0.0.1' }, paths: {} })
})

app.get('/ui', swaggerUI({ url: '/doc' }))

export default app
