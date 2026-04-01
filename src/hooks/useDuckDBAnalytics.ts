import { useState, useEffect } from 'react';
import { useDuckDB } from '../contexts/DuckDBContext';
import { AnalyticsData } from '../components/PollutionDashboard';

interface UseDuckDBAnalyticsResult {
    analytics: AnalyticsData | undefined;
    loading: boolean;
    error: Error | null;
}


export interface AnalyticsFilters {
    stationQuery?: string;
    dateFrom?: string | null;
    dateTo?: string | null;
    polAMin?: number;
    polBMin?: number;
}

export const useDuckDBAnalytics = (
    tableName: string = 'stations',
    enabled: boolean = true,
    filters?: AnalyticsFilters
): UseDuckDBAnalyticsResult => {
    const { db, conn, query } = useDuckDB();
    const [analytics, setAnalytics] = useState<AnalyticsData | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db || !conn || !enabled) {
            return;
        }

        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            try {
                // Check if table exists
                const tableExists = await query(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
                if (tableExists.length === 0) {
                    setAnalytics(undefined);
                    return;
                }

                // Build WHERE clause
                const conditions: string[] = [];
                if (filters) {
                    if (filters.stationQuery) {
                        conditions.push(`LOWER(station_name) LIKE '%${filters.stationQuery.toLowerCase()}%'`);
                    }
                    if (filters.dateFrom) {
                        conditions.push(`sample_dt >= '${filters.dateFrom}'`);
                    }
                    if (filters.dateTo) {
                        conditions.push(`sample_dt <= '${filters.dateTo}'`);
                    }
                    if (filters.polAMin && filters.polAMin > 0) {
                        conditions.push(`pol_a >= ${filters.polAMin}`);
                    }
                    if (filters.polBMin && filters.polBMin > 0) {
                        conditions.push(`pol_b >= ${filters.polBMin}`);
                    }
                }
                const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

                // 1. Basic aggregates
                const aggregates = await query(`
                    SELECT 
                        COUNT(DISTINCT station_id) as totalStations,
                        AVG(pol_a) as avgPolA,
                        AVG(pol_b) as avgPolB,
                        MAX(pol_a) as maxPolA,
                        MAX(pol_b) as maxPolB,
                        COUNT(CASE WHEN pol_a > 7 OR pol_b > 7 THEN 1 END) as highPollutionStations
                    FROM ${tableName}
                    ${whereClause}
                `);

                if (aggregates.length === 0) throw new Error("No data returned from aggregates query");
                const agg = aggregates[0];

                // 2. Pollution Levels Distribution
                // Note: Filter applies to the base set, then we classify
                const levels = await query(`
                    SELECT 
                        'Low (< 3)' as name, COUNT(*) as value, '#10B981' as color FROM ${tableName} 
                        ${whereClause ? whereClause + ' AND' : 'WHERE'} pol_a < 3 AND pol_b < 3
                    UNION ALL
                    SELECT 
                        'Medium (3-7)' as name, COUNT(*) as value, '#F59E0B' as color FROM ${tableName} 
                        ${whereClause ? whereClause + ' AND' : 'WHERE'} ((pol_a BETWEEN 3 AND 7) OR (pol_b BETWEEN 3 AND 7)) 
                        AND NOT (pol_a > 7 OR pol_b > 7)
                    UNION ALL
                    SELECT 
                        'High (> 7)' as name, COUNT(*) as value, '#EF4444' as color FROM ${tableName} 
                        ${whereClause ? whereClause + ' AND' : 'WHERE'} (pol_a > 7 OR pol_b > 7)
                `);

                // 3. Top Stations for Chart
                const topStations = await query(`
                    SELECT 
                        station_name as name,
                        station_name as station,
                        ROUND(AVG(pol_a), 1) as pol_a,
                        ROUND(AVG(pol_b), 1) as pol_b
                    FROM ${tableName}
                    ${whereClause}
                    GROUP BY station_name
                    ORDER BY (AVG(pol_a) + AVG(pol_b)) DESC
                    LIMIT 6
                `);

                // Construct AnalyticsData object
                const analyticsData: AnalyticsData = {
                    totalStations: Number(agg.totalStations),
                    avgPolA: Number(agg.avgPolA?.toFixed(2) || 0),
                    avgPolB: Number(agg.avgPolB?.toFixed(2) || 0),
                    maxPolA: Number(agg.maxPolA || 0),
                    maxPolB: Number(agg.maxPolB || 0),
                    highPollutionStations: Number(agg.highPollutionStations),
                    useDualAxis: (agg.maxPolA / (agg.maxPolB || 1) > 5) || (agg.maxPolA / (agg.maxPolB || 1) < 0.2),
                    chartData: topStations,
                    pollutionLevels: levels,
                    trendData: [] // TODO: Implement trend query if date column exists
                };

                setAnalytics(analyticsData);
            } catch (err) {
                console.error("Failed to fetch analytics from DuckDB:", err);
                setError(err instanceof Error ? err : new Error("Unknown error"));
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [db, conn, tableName, enabled, query, filters]); // Add filters dependency

    return { analytics, loading, error };
};
