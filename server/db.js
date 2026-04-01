// Database abstraction with fallback for local development
const schema = require('../shared/schema.js');

// In-memory storage for local development (when DATABASE_URL is not set)
let inMemoryStations = [];
let inMemoryRecords = [];
let useInMemory = false;

let pool = null;
let db = null;

// Try to initialize PostgreSQL, fallback to in-memory if not available
if (process.env.DATABASE_URL) {
  try {
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    const { drizzle } = require('drizzle-orm/neon-serverless');
    const ws = require("ws");

    neonConfig.webSocketConstructor = ws;
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.warn('⚠️ Failed to connect to PostgreSQL, using in-memory storage:', error.message);
    useInMemory = true;
  }
} else {
  console.log('ℹ️ DATABASE_URL not set, using in-memory storage for local development');
  useInMemory = true;
}

// In-memory database abstraction
const inMemoryDb = {
  async deleteStations(projectId) {
    if (projectId) {
      inMemoryStations = inMemoryStations.filter(s => s.projectId !== projectId);
    } else {
      inMemoryStations = [];
    }
  },
  async deleteRecords(projectId) {
    if (projectId) {
      inMemoryRecords = inMemoryRecords.filter(r => r.projectId !== projectId);
    } else {
      inMemoryRecords = [];
    }
  },
  async insertStations(stationsData) {
    const startId = inMemoryStations.length > 0 ? Math.max(...inMemoryStations.map(s => s.id)) : 0;
    const newStations = stationsData.map((s, index) => ({
      id: startId + index + 1,
      ...s,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    inMemoryStations.push(...newStations);
    return newStations;
  },
  async insertRecords(recordsData) {
    const startId = inMemoryRecords.length > 0 ? Math.max(...inMemoryRecords.map(r => r.id)) : 0;
    const newRecords = recordsData.map((r, index) => ({
      id: startId + index + 1,
      ...r,
      createdAt: new Date()
    }));
    inMemoryRecords.push(...newRecords);
    return newRecords;
  },
  async getRecordsWithStations(projectId) {
    const filteredRecords = projectId
      ? inMemoryRecords.filter(r => r.projectId === projectId)
      : inMemoryRecords;

    return filteredRecords.map(record => {
      const station = inMemoryStations.find(s => s.stationId === record.stationId) || {};
      return {
        id: record.id,
        station_id: record.stationId,
        project_id: record.projectId,
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
  inMemoryDb
};