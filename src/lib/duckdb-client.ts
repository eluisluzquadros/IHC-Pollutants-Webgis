import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_eh,
        mainWorker: eh_worker,
    },
};

export class DuckDBClient {
    private static instance: DuckDBClient;
    private db: duckdb.AsyncDuckDB | null = null;
    private conn: duckdb.AsyncDuckDBConnection | null = null;
    private isInitializing = false;

    private constructor() { }

    public static getInstance(): DuckDBClient {
        if (!DuckDBClient.instance) {
            DuckDBClient.instance = new DuckDBClient();
        }
        return DuckDBClient.instance;
    }

    public async init(): Promise<void> {
        if (this.db) return;
        if (this.isInitializing) {
            // Simple polling wait if already initializing
            while (this.isInitializing) {
                await new Promise(r => setTimeout(r, 100));
                if (this.db) return;
            }
            return;
        }

        this.isInitializing = true;
        try {
            // Select bundle based on browser capability
            const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

            // Instantiate worker
            const worker = new Worker(bundle.mainWorker!);
            const logger = new duckdb.ConsoleLogger();
            this.db = new duckdb.AsyncDuckDB(logger, worker);
            await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);

            // Create connection
            this.conn = await this.db.connect();
            console.log("🦆 DuckDB-Wasm Initialized Successfully");

        } catch (error) {
            console.error("Failed to initialize DuckDB:", error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    public async query(sql: string): Promise<any[]> {
        if (!this.conn) await this.init();
        if (!this.conn) throw new Error("DuckDB connection failed");

        const result = await this.conn.query(sql);
        return result.toArray().map((row: any) => row.toJSON());
    }

    public async registerFile(fileName: string, buffer: Uint8Array): Promise<void> {
        if (!this.db) await this.init();
        if (!this.db) throw new Error("DuckDB not initialized");

        await this.db.registerFileBuffer(fileName, buffer);
    }

    public async createTableFromJSON(tableName: string, data: any[]): Promise<void> {
        if (!this.conn) await this.init();
        if (!this.conn) throw new Error("DuckDB connection failed");

        // Clean way: Serialize to JSON, load into table
        // For MVP, we'll assume flat objects. 
        // In production, Apache Arrow conversion is faster.

        const jsonString = JSON.stringify(data);
        await this.registerFile(`${tableName}.json`, new TextEncoder().encode(jsonString));

        await this.conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${tableName}.json')`);
        console.log(`🦆 Created table ${tableName} with ${data.length} rows`);
    }

    public async getTableSchema(tableName: string): Promise<any[]> {
        return this.query(`DESCRIBE ${tableName}`);
    }
}
