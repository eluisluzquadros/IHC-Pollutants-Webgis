// Database abstraction with fallback for local development

// In-memory storage for local development (when DATABASE_URL is not set)
let inMemoryStations = [];
let inMemoryRecords = [];
let useInMemory = false;

let pool = null;
let db = null;
let schema = null;

// Try to initialize PostgreSQL, fallback to in-memory if not available
if (process.env.DATABASE_URL) {
  try {
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    const { drizzle } = require('drizzle-orm/neon-serverless');
    const ws = require('ws');

    // Only load schema when we actually need PostgreSQL
    schema = require('../shared/schema.js');

    neonConfig.webSocketConstructor = ws;
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.warn('⚠️ Failed to connect to PostgreSQL, using in-memory storage:', error.message);
    useInMemory = true;
    schema = null;
    db = null;
    pool = null;
  }
} else {
  console.log('ℹ️ DATABASE_URL not set, using in-memory storage for local development');
  useInMemory = true;
}

// In-memory database abstraction
const inMemoryDb = {
  async deleteStations() {
    inMemoryStations = [];
  },
  async deleteRecords() {
    inMemoryRecords = [];
  },
  async insertStations(stationsData) {
    inMemoryStations = stationsData.map((s, index) => ({
      id: index + 1,
      ...s,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    return inMemoryStations;
  },
  async insertRecords(recordsData) {
    inMemoryRecords = recordsData.map((r, index) => ({
      id: index + 1,
      ...r,
      createdAt: new Date()
    }));
    return inMemoryRecords;
  },
  async getRecordsWithStations() {
    return inMemoryRecords.map(record => {
      const station = inMemoryStations.find(s => s.stationId === record.stationId) || {};
      return {
        id: record.id,
        station_id: record.stationId,
        station_name: station.stationName || `Station ${record.stationId}`,
        latitude: station.latitude || 0,
        longitude: station.longitude || 0,
        location: station.location || '',
        sample_dt: record.sampleDate,
        pol_a: record.polA,
        pol_b: record.polB,
        created_at: record.createdAt
      };
    });
  }
};

module.exports = {
  pool,
  db,
  useInMemory,
  inMemoryDb,
  schema
};