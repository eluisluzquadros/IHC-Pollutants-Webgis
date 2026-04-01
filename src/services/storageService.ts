/**
 * storageService.ts
 * IndexedDB persistence for Envibase projects and datasets.
 * DB version: 1
 * Stores:
 *   - projects: user project definitions
 *   - datasets: imported tabular / geospatial datasets
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredProject {
    id: string;
    ownerId: string;
    name: string;
    description?: string;
    visibility: 'private' | 'public';
    studyType?: string;
    location?: { country?: string; state?: string; city?: string };
    createdAt: number;
    updatedAt: number;
}

export interface ColumnMapping {
    lat?: string;
    lon?: string;
    date?: string;
    id?: string;
    name?: string;
    [key: string]: string | undefined;
}

export interface StoredDataset {
    id: string;
    projectId: string;
    name: string;
    fileType: string;
    columns: string[];
    mapping: ColumnMapping;
    rows: Record<string, unknown>[];
    recordCount: number;
    createdAt: number;
    geojson?: object;
}

// ─── IndexedDB bootstrap ──────────────────────────────────────────────────────

const DB_NAME = 'envibase-local';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains('projects')) {
                const ps = db.createObjectStore('projects', { keyPath: 'id' });
                ps.createIndex('ownerId', 'ownerId', { unique: false });
            }

            if (!db.objectStoreNames.contains('datasets')) {
                const ds = db.createObjectStore('datasets', { keyPath: 'id' });
                ds.createIndex('projectId', 'projectId', { unique: false });
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function tx<T>(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    return new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(prefix = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Projects API ─────────────────────────────────────────────────────────────

export async function getProjects(ownerId: string): Promise<StoredProject[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const t = db.transaction('projects', 'readonly');
        const store = t.objectStore('projects');
        const index = store.index('ownerId');
        const req = index.getAll(ownerId);
        req.onsuccess = () => resolve(req.result as StoredProject[]);
        req.onerror = () => reject(req.error);
    });
}

export async function saveProject(project: StoredProject): Promise<void> {
    const db = await openDB();
    await tx(db, 'projects', 'readwrite', (store) => store.put(project));
}

export async function deleteProject(id: string): Promise<void> {
    const db = await openDB();
    await tx(db, 'projects', 'readwrite', (store) => store.delete(id));
    // Also delete associated datasets
    const datasets = await getDatasets(id);
    for (const ds of datasets) {
        await deleteDataset(ds.id);
    }
}

// ─── Datasets API ─────────────────────────────────────────────────────────────

export async function getDatasets(projectId: string): Promise<StoredDataset[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const t = db.transaction('datasets', 'readonly');
        const store = t.objectStore('datasets');
        const index = store.index('projectId');
        const req = index.getAll(projectId);
        req.onsuccess = () => resolve(req.result as StoredDataset[]);
        req.onerror = () => reject(req.error);
    });
}

export async function saveDataset(dataset: StoredDataset): Promise<void> {
    const db = await openDB();
    await tx(db, 'datasets', 'readwrite', (store) => store.put(dataset));
}

export async function deleteDataset(id: string): Promise<void> {
    const db = await openDB();
    await tx(db, 'datasets', 'readwrite', (store) => store.delete(id));
}
