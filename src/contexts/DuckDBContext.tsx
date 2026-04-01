import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

// Manual bundling of DuckDB-Wasm artifacts
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

interface DuckDBContextType {
    db: duckdb.AsyncDuckDB | null;
    conn: duckdb.AsyncDuckDBConnection | null;
    loading: boolean;
    error: Error | null;
    query: (sql: string) => Promise<any[]>;
    createTable: (tableName: string, data: any[]) => Promise<void>;
}

const DuckDBContext = createContext<DuckDBContextType | undefined>(undefined);

export const DuckDBProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
    const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const initDuckDB = async () => {
            try {
                // Select bundle based on browser capability
                const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

                // Instantiate worker
                const worker = new Worker(bundle.mainWorker!);
                const logger = new duckdb.ConsoleLogger();
                const newDb = new duckdb.AsyncDuckDB(logger, worker);
                await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker);

                // Create connection
                const newConn = await newDb.connect();

                setDb(newDb);
                setConn(newConn);
                console.log("🦆 DuckDB-Wasm Context Initialized");
            } catch (err) {
                console.error("Failed to initialize DuckDB:", err);
                setError(err instanceof Error ? err : new Error('Unknown error initializing DuckDB'));
            } finally {
                setLoading(false);
            }
        };

        if (!db) {
            initDuckDB();
        }

        // Cleanup
        return () => {
            if (conn) {
                conn.close();
            }
            if (db) {
                db.terminate();
            }
        };
    }, []);

    const query = async (sql: string): Promise<any[]> => {
        if (!conn) throw new Error("DuckDB connection not ready");
        const result = await conn.query(sql);
        return result.toArray().map((row: any) => row.toJSON());
    };

    const createTable = async (tableName: string, data: any[]): Promise<void> => {
        if (!conn || !db) throw new Error("DuckDB not ready");

        // Serialize to JSON, register file, and load
        const jsonString = JSON.stringify(data);
        await db.registerFileText(`${tableName}.json`, jsonString);

        // Check if table exists, drop if so
        await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
        await conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${tableName}.json')`);
        console.log(`🦆 Created table ${tableName} with ${data.length} rows`);
    };

    return (
        <DuckDBContext.Provider value={{ db, conn, loading, error, query, createTable }}>
            {children}
        </DuckDBContext.Provider>
    );
};

export const useDuckDB = () => {
    const context = useContext(DuckDBContext);
    if (context === undefined) {
        throw new Error('useDuckDB must be used within a DuckDBProvider');
    }
    return context;
};
