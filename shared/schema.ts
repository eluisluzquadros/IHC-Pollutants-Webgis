import { pgTable, serial, text, real, timestamp, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Environmental monitoring stations table
export const stations = pgTable('stations', {
  id: serial('id').primaryKey(),
  stationId: varchar('station_id', { length: 100 }).notNull().unique(),
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