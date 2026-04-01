/**
 * Statistics Engine for Pollution Data
 * Provides mathematical functions for descriptive and inferential statistics
 */

export interface StatsResult {
    mean: number;
    median: number;
    mode: number[];
    stdDev: number;
    variance: number;
    min: number;
    max: number;
    range: number;
    q1: number;
    q3: number;
    iqr: number;
    count: number;
}

export interface Anomaly {
    index: number;
    value: number;
    zScore: number;
    severity: 'moderate' | 'extreme';
}

/**
 * Calculates comprehensive descriptive statistics for a numeric array
 */
export const calculateStats = (values: number[]): StatsResult | null => {
    if (!values || values.length === 0) return null;

    const count = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    // Median
    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Min, Max, Range
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;

    // Variance & StdDev
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(variance);

    // Mode
    const counts: Record<number, number> = {};
    let maxCount = 0;
    values.forEach(v => {
        counts[v] = (counts[v] || 0) + 1;
        if (counts[v] > maxCount) maxCount = counts[v];
    });
    const mode = Object.entries(counts)
        .filter(([_, c]) => c === maxCount && maxCount > 1)
        .map(([v, _]) => Number(v));

    // Quartiles
    const getQuartile = (q: 0.25 | 0.75) => {
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    };
    const q1 = getQuartile(0.25);
    const q3 = getQuartile(0.75);
    const iqr = q3 - q1;

    return {
        mean, median, mode, stdDev, variance, min, max, range, q1, q3, iqr, count
    };
};

/**
 * Calculates Pearson Correlation Coefficient between two arrays
 */
export const calculateCorrelation = (x: number[], y: number[]): number | null => {
    if (x.length !== y.length || x.length === 0) return null;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    const sumYY = y.reduce((a, b) => a + b * b, 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumXX) - (sumX * sumX)) * ((n * sumYY) - (sumY * sumY)));

    if (denominator === 0) return 0;
    return numerator / denominator;
};

/**
 * Detects anomalies using Z-score method
 */
export const detectAnomalies = (values: number[], threshold: number = 2.5): Anomaly[] => {
    const stats = calculateStats(values);
    if (!stats || stats.stdDev === 0) return [];

    const anomalies: Anomaly[] = [];
    values.forEach((v, i) => {
        const zScore = Math.abs((v - stats.mean) / stats.stdDev);
        if (zScore > threshold) {
            anomalies.push({
                index: i,
                value: v,
                zScore,
                severity: zScore > 3 ? 'extreme' : 'moderate'
            });
        }
    });

    return anomalies.sort((a, b) => b.zScore - a.zScore);
};

/**
 * Calculates the slope of a linear regression line (simple trend)
 */
export const calculateTrend = (values: number[]): number => {
    if (values.length < 2) return 0;
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
};
