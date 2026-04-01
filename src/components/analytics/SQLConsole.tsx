import React, { useState } from 'react';
import { useDuckDB } from '../../contexts/DuckDBContext';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Play, Loader2, Download, Database } from 'lucide-react';

export const SQLConsole: React.FC = () => {
    const { query, loading: dbLoading, error: dbError } = useDuckDB();
    const [sql, setSql] = useState('SELECT 42 AS answer, \'DuckDB\' AS name');
    const [results, setResults] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExecute = async () => {
        setExecuting(true);
        setError(null);
        try {
            const res = await query(sql);
            setResults(res);
            if (res.length > 0) {
                setColumns(Object.keys(res[0]));
            } else {
                setColumns([]);
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Query execution failed');
            setResults([]);
        } finally {
            setExecuting(false);
        }
    };

    const handleExport = () => {
        if (results.length === 0) return;

        // Simple CSV export
        const headers = columns.join(',');
        const rows = results.map(row => columns.map(col => JSON.stringify(row[col])).join(','));
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_results.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (dbLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <span className="ml-2 text-slate-400">Initializing DuckDB-Wasm...</span>
            </div>
        );
    }

    if (dbError) {
        return (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg">
                Error initializing database: {dbError.message}
            </div>
        );
    }

    return (
        <Card className="w-full h-full bg-glass-dark border-glass text-slate-200 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                <CardTitle className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    SQL Analytical Console
                </CardTitle>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleExport}
                        disabled={results.length === 0}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                    >
                        <Download className="h-3 w-3 mr-2" />
                        Export
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleExecute}
                        disabled={executing}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest px-4 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
                    >
                        {executing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Play className="h-3 w-3 mr-2" />}
                        Execute
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                <div className="relative group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/0 rounded-xl blur opacity-0 group-hover/input:opacity-100 transition duration-500"></div>
                    <Textarea
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                        className="font-mono text-[11px] min-h-[140px] bg-black/40 border-glass text-emerald-50/90 resize-y focus:border-emerald-500/50 transition-all rounded-xl shadow-inner relative z-10"
                        placeholder="SELECT * FROM pollution_records WHERE value > 50..."
                    />
                </div>

                {error && (
                    <div className="p-3 text-[10px] font-bold text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl animate-in fade-in zoom-in-95 duration-300">
                        {error}
                    </div>
                )}

                <div className="rounded-xl border border-glass overflow-hidden bg-black/20 shadow-inner">
                    <div className="max-h-[350px] overflow-auto custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-white/5 sticky top-0 backdrop-blur-md z-20">
                                <TableRow className="hover:bg-transparent border-white/5">
                                    {columns.map(col => (
                                        <TableHead key={col} className="text-[10px] font-black text-gray-400 uppercase tracking-widest py-3 px-4">{col}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.length > 0 ? (
                                    results.map((row, i) => (
                                        <TableRow key={i} className="hover:bg-emerald-500/5 border-white/5 transition-colors group/row">
                                            {columns.map(col => (
                                                <TableCell key={`${i}-${col}`} className="font-mono text-[10px] text-gray-300 py-2.5 px-4 group-hover/row:text-white transition-colors">
                                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length || 1} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-600 gap-2">
                                                <Database className="w-6 h-6 opacity-20" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">{executing ? 'Processing Analytical Stream...' : 'No data records selected'}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="bg-black/40 px-4 py-2 text-[9px] text-gray-500 font-mono border-t border-glass flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="uppercase tracking-tighter">Engine: DuckDB-Wasm Runtime</span>
                        </div>
                        <span className="font-black text-emerald-500/60">{results.length} RECORDS RETURNED</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
