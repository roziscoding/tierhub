import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tiers = pgTable('tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  color: text('color').notNull(),
  position: text('position').notNull(),
})

export const tierItems = pgTable('tier_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tierId: uuid('tier_id').notNull().references(() => tiers.id, { onDelete: 'cascade' }),
  src: text('src').notNull(),
})
