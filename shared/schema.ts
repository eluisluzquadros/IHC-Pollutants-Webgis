import { pgTable, serial, text, real, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Projects table
export const projects = pgTable('projects', {
  id: varchar('id', { length: 100 }).primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  settings: text('settings'), // Can store JSON string
  createdAt: timestamp('created_at').defaultNow()
});

// Environmental monitoring stations table
export const stations = pgTable('stations', {
  id: serial('id').primaryKey(),
  stationId: varchar('station_id', { length: 100 }).notNull().unique(),
  projectId: varchar('project_id', { length: 100 }).notNull(), // Added project isolation
  stationName: text('station_name').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Pollution records table
export const pollutionRecords = pgTable('pollution_records', {
  id: serial('id').primaryKey(),
  stationId: varchar('station_id', { length: 100 }).notNull(),
  projectId: varchar('project_id', { length: 100 }).notNull(), // Added project isolation
  sampleDate: timestamp('sample_date').notNull(),
  polA: real('pol_a').notNull(), // Pollution A reading
  polB: real('pol_b').notNull(), // Pollution B reading
  createdAt: timestamp('created_at').defaultNow()
});

// Define relations
export const stationsRelations = relations(stations, ({ many }) => ({
  pollutionRecords: many(pollutionRecords)
}));

export const pollutionRecordsRelations = relations(pollutionRecords, ({ one }) => ({
  station: one(stations, {
    fields: [pollutionRecords.stationId],
    references: [stations.stationId]
  })
}));

// Export types
export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;
export type PollutionRecord = typeof pollutionRecords.$inferSelect;
export type InsertPollutionRecord = typeof pollutionRecords.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;