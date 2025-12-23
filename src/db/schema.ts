import { pgTable, serial, text, varchar, timestamp, index, vector } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  title: varchar('title', { length: 255 }).notNull(), 
  type: varchar('type', { length: 50 }).default('pdf'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const embeddings = pgTable('embeddings', {
  id: serial('id').primaryKey(),
  resourceId: serial('resource_id').references(() => resources.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  
  embedding: vector('embedding', { dimensions: 768 }).notNull(),
}, (table) => ({
  embeddingIndex: index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops')),
}));

// Relações para facilitar as queries no Drizzle (opcional, mas útil)
export const resourcesRelations = relations(resources, ({ many }) => ({
  embeddings: many(embeddings),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  resource: one(resources, {
    fields: [embeddings.resourceId],
    references: [resources.id],
  }),
}));