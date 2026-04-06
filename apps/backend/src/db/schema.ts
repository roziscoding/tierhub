import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { user } from './auth-schema'

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const templateTiers = pgTable('template_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  color: text('color').notNull(),
  position: integer('position').notNull(),
})

export const templateItems = pgTable('template_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  src: text('src').notNull(),
  position: integer('position').notNull(),
})

export const templatesRelations = relations(templates, ({ many }) => ({
  tiers: many(templateTiers),
  items: many(templateItems),
}))

export const templateTiersRelations = relations(templateTiers, ({ one }) => ({
  template: one(templates, { fields: [templateTiers.templateId], references: [templates.id] }),
}))

export const templateItemsRelations = relations(templateItems, ({ one }) => ({
  template: one(templates, { fields: [templateItems.templateId], references: [templates.id] }),
}))
