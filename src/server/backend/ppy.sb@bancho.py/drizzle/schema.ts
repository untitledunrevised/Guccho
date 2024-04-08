import { relations } from 'drizzle-orm'
import { bigint, datetime, index, int, json, mysqlEnum, mysqlTable, primaryKey, text, tinyint, varchar } from 'drizzle-orm/mysql-core'
import { users } from '../../bancho.py/drizzle/schema'

export * from '../../bancho.py/drizzle/schema'

export const userpages = mysqlTable('userpages', {
  id: int('id').primaryKey().autoincrement().notNull(),
  userId: int('user_id').notNull(),
  html: text('html'),
  raw: text('raw'),
  rawType: mysqlEnum('raw_type', ['tiptap']),
},
(table) => {
  return {
    userId: index('user_id').on(table.userId),
  }
})

export const scoresForeign = mysqlTable('scores_foreign', {
  id: bigint('id', { mode: 'number' }).notNull(),
  server: varchar('server', { length: 32 }).notNull(),
  originalScoreId: bigint('original_score_id', { mode: 'number' }).notNull(),
  originalPlayerId: int('original_player_id').notNull(),
  recipientId: int('recipient_id').notNull(),
  hasReplay: tinyint('has_replay').notNull(),
  receiptTime: datetime('receipt_time', { mode: 'string' }).notNull(),
},
(table) => {
  return {
    recipientId: index('recipient_id').on(table.recipientId),
    originalPlayerId: index('original_player_id').on(table.originalScoreId),
    server: index('server').on(table.server),
    scoresForeignId: primaryKey({ columns: [table.id], name: 'scores_foreign_id' }),
  }
})
export const scoresSuspicion = mysqlTable('scores_suspicion', {
  scoreId: bigint('score_id', { mode: 'number' }).autoincrement().notNull(),
  suspicionReason: varchar('suspicion_reason', { length: 128 }).notNull(),
  ignored: tinyint('ignored').notNull(),
  detail: json('detail').notNull(),
  suspicionTime: datetime('suspicion_time', { mode: 'string' }).notNull(),
},
(table) => {
  return {
    scoresSuspicionScoreId: primaryKey({ columns: [table.scoreId], name: 'scores_suspicion_score_id' }),
  }
})

export const userpagesRelations = relations(userpages, ({ one }) => ({
  user: one(users, { fields: [userpages.userId], references: [users.id] }),
}))
