/**
 * fileParser.ts
 * Multi-format file parser for Envibase data import.
 * Supported: CSV, XLSX, GeoJSON, GeoParquet, Parquet (via DuckDB WASM).
 *
 * Returns a unified ParseResult for display and storage.
 */

import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { ColumnMapping } from '@/services/storageService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedFileType = 'csv' | 'xlsx' | 'geojson' | 'parquet' | 'geoparquet';

export interface ParseResult {
    fileType: SupportedFileType;
    columns: string[];
    rows: Record<string, unknown>[];
    geojson?: object;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUPPORTED_EXTENSIONS = '.csv,.xlsx,.geojson,.parquet';
export const SUPPORTED_LABEL = 'CSV • XLSX • GeoJSON • Parquet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
    return filename.toLowerCase().split('.').pop() ?? '';
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

async function parseCSV(file: File): Promise<ParseResult> {
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) throw new Error('CSV vazio');

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/["']/g, ''));

    const rows = lines.slice(1)
        .filter(l => l.trim())
        .map(line => {
            const values = line.split(delimiter);
            return Object.fromEntries(
                headers.map((h, i) => [h, values[i]?.trim().replace(/["']/g, '') ?? ''])
            );
        });

    return { fileType: 'csv', columns: headers, rows };
}

// ─── XLSX Parser ──────────────────────────────────────────────────────────────

async function parseXLSX(file: File): Promise<ParseResult> {
    // Dynamically import xlsx when needed (code-split)
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (data.length === 0) return { fileType: 'xlsx', columns: [], rows: [] };
    const columns = Object.keys(data[0]);
    return { fileType: 'xlsx', columns, rows: data };
}

// ─── GeoJSON Parser ───────────────────────────────────────────────────────────

async function parseGeoJSON(file: File): Promise<ParseResult> {
    const text = await file.text();
    const geojson = JSON.parse(text);

    if (geojson.type !== 'FeatureCollection') {
        throw new Error('GeoJSON inválido: esperado FeatureCollection');
    }

    const features = geojson.features ?? [];
    if (features.length === 0) return { fileType: 'geojson', columns: [], rows: [], geojson };

    const allKeys = new Set<string>();
    features.forEach((f: any) => {
        Object.keys(f.properties ?? {}).forEach(k => allKeys.add(k));
    });
    // Add geometry helpers
    allKeys.add('_lon');
    allKeys.add('_lat');

    const columns = Array.from(allKeys);
    const rows = features.map((f: any) => {
        const coords = f.geometry?.coordinates;
        return {
            ...f.properties,
            _lon: Array.isArray(coords) ? coords[0] : undefined,
            _lat: Array.isArray(coords) ? coords[1] : undefined,
        };
    });

    return { fileType: 'geojson', columns, rows, geojson };
}

// ─── Parquet Parser (via DuckDB WASM) ─────────────────────────────────────────

async function parseParquet(file: File, db?: AsyncDuckDB): Promise<ParseResult> {
    if (!db) throw new Error('DuckDB não disponível para Parquet');

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    await db.registerFileBuffer(file.name, uint8);

    const conn = await db.connect();
    try {
        const result = await conn.query(`SELECT * FROM parquet_scan('${file.name}') LIMIT 10000`);
        const schema = result.schema.fields;
        const columns = schema.map((f: any) => f.name);

        const rows: Record<string, unknown>[] = [];
        for (let i = 0; i < result.numRows; i++) {
            const row: Record<string, unknown> = {};
            columns.forEach((col: string, j: number) => {
                row[col] = result.getChildAt(j)?.get(i);
            });
            rows.push(row);
        }

        return { fileType: file.name.includes('geo') ? 'geoparquet' : 'parquet', columns, rows };
    } finally {
        await conn.close();
    }
}

// ─── Main Dispatcher ──────────────────────────────────────────────────────────

export async function parseFile(file: File, db?: AsyncDuckDB): Promise<ParseResult> {
    const ext = getExtension(file.name);

    switch (ext) {
        case 'csv': return parseCSV(file);
        case 'xlsx': case 'xls': return parseXLSX(file);
        case 'geojson': case 'json': return parseGeoJSON(file);
        case 'parquet': return parseParquet(file, db);
        default:
            throw new Error(`Formato não suportado: .${ext}. Use: ${SUPPORTED_LABEL}`);
    }
}

// ─── Auto Column Detect ───────────────────────────────────────────────────────

const LAT_PATTERNS = /^(lat(itude)?|y|_lat|decimallat)$/i;
const LON_PATTERNS = /^(lon(gitude)?|lng|x|_lon|decimallon)$/i;
const DATE_PATTERNS = /^(date|data|datetime|timestamp|ano|year)$/i;
const ID_PATTERNS = /^(id|station_id|stationid|código|codigo|point_id|pointid)$/i;
const NAME_PATTERNS = /^(name|nome|station|estação|estacao|label)$/i;

export function autoDetectMapping(columns: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};

    for (const col of columns) {
        if (!mapping.lat && LAT_PATTERNS.test(col)) mapping.lat = col;
        else if (!mapping.lon && LON_PATTERNS.test(col)) mapping.lon = col;
        else if (!mapping.date && DATE_PATTERNS.test(col)) mapping.date = col;
        else if (!mapping.id && ID_PATTERNS.test(col)) mapping.id = col;
        else if (!mapping.name && NAME_PATTERNS.test(col)) mapping.name = col;
    }

    return mapping;
}
