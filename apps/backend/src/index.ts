import process from 'node:process'
import { swaggerUI } from '@hono/swagger-ui'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { rateLimiter } from 'hono-rate-limiter'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { z } from 'zod'

import { auth } from './auth'
import templates from './routes/templates'

const app = new Hono()

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}))
app.use(bodyLimit({ maxSize: 50_000_000 }))

app.use(
  '/api/auth/*',
  rateLimiter({
    windowMs: 60_000,
    limit: 20,
    keyGenerator: c => c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip') ?? 'unknown',
  }),
)

app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw)
})

app.route('/templates', templates)

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

if (process.env.NODE_ENV !== 'production') {
  app.get('/doc', (c) => {
    return c.json({ openapi: '3.1.0', info: { title: 'TierHub API', version: '0.0.1' }, paths: {} })
  })

  app.get('/ui', swaggerUI({ url: '/doc' }))
}

export default app
