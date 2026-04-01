import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateStats, detectAnomalies } from './statisticsEngine';
import { StationData } from './csvImporter';

/**
 * Generates a professional PDF report for the current statistical analysis
 */
export const generatePDFReport = (
    data: StationData[],
    visiblePollutants: string[],
    isSpatiallyFiltered: boolean = false
) => {
    const doc = new jsPDF();
    const showA = visiblePollutants.includes('pol_a');
    const showB = visiblePollutants.includes('pol_b');
    const dateStr = new Date().toLocaleString();

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text('Relatório de Análise Ambiental', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${dateStr}`, 14, 30);
    doc.text(`Total de Registros: ${data.length}`, 140, 30);

    doc.setLineWidth(0.5);
    doc.setDrawColor(59, 130, 246);
    doc.line(14, 35, 196, 35);

    let yPos = 45;

    // --- Summary Section ---
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('1. Visão Geral do Conjunto de Dados', 14, yPos);
    yPos += 10;

    const stationCount = new Set(data.map(d => d.station_id)).size;
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Este relatório analisa os níveis de poluição em ${stationCount} estações de monitoramento.`, 14, yPos);
    yPos += 15;

    // --- Statistics Tables ---
    if (showA) {
        const statsA = calculateStats(data.map(d => d.pol_a));
        if (statsA) {
            doc.setFontSize(12);
            doc.setTextColor(16, 185, 129); // Emerald
            doc.text('Poluição A: Estatísticas Descritivas', 14, yPos);
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['Métrica', 'Valor', 'Unidade']],
                body: [
                    ['Média', statsA.mean.toFixed(3), data[0].unit],
                    ['Mediana', statsA.median.toFixed(3), data[0].unit],
                    ['Desvio Padrão', statsA.stdDev.toFixed(3), ''],
                    ['Variância', statsA.variance.toFixed(3), ''],
                    ['Mínimo', statsA.min.toFixed(2), data[0].unit],
                    ['Máximo', statsA.max.toFixed(2), data[0].unit],
                    ['Amplitude', statsA.range.toFixed(2), data[0].unit],
                    ['Intervalo Interquartil (IQR)', statsA.iqr.toFixed(3), ''],
                ],
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    if (showB) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        const statsB = calculateStats(data.map(d => d.pol_b));
        if (statsB) {
            doc.setFontSize(12);
            doc.setTextColor(59, 130, 246); // Blue
            doc.text('Poluição B: Estatísticas Descritivas', 14, yPos);
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['Métrica', 'Valor', 'Unidade']],
                body: [
                    ['Média', statsB.mean.toFixed(3), data[0].unit],
                    ['Mediana', statsB.median.toFixed(3), data[0].unit],
                    ['Desvio Padrão', statsB.stdDev.toFixed(3), ''],
                    ['Variância', statsB.variance.toFixed(3), ''],
                    ['Mínimo', statsB.min.toFixed(2), data[0].unit],
                    ['Máximo', statsB.max.toFixed(2), data[0].unit],
                    ['Amplitude', statsB.range.toFixed(2), data[0].unit],
                    ['Intervalo Interquartil (IQR)', statsB.iqr.toFixed(3), ''],
                ],
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    // --- Insights & Anomalies ---
    if (yPos > 220) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('2. Detecção de Anomalias & Insights', 14, yPos);
    yPos += 10;

    const anomaliesA = showA ? detectAnomalies(data.map(d => d.pol_a)) : [];
    const anomaliesB = showB ? detectAnomalies(data.map(d => d.pol_b)) : [];

    if (anomaliesA.length > 0 || anomaliesB.length > 0) {
        const anomalyData = [
            ...anomaliesA.map(a => ['Pollution A', data[a.index].station_name, a.value.toString(), a.severity, a.zScore.toFixed(2)]),
            ...anomaliesB.map(a => ['Pollution B', data[a.index].station_name, a.value.toString(), a.severity, a.zScore.toFixed(2)])
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Poluente', 'Estação', 'Valor', 'Severidade', 'Z-Score']],
            body: anomalyData.slice(0, 15), // Cap to top 15
            headStyles: { fillColor: [245, 158, 11] }, // Orange/Amber
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Nenhuma anomalia estatística significativa detectada no conjunto de dados.', 14, yPos);
        yPos += 10;
    }

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 14, 285);
        doc.text('Plataforma WebGIS de Inteligência Ambiental', 140, 285);
        
        if (isSpatiallyFiltered) {
            doc.setFontSize(8);
            doc.setTextColor(59, 130, 246); // Blue color to stand out slightly
            doc.text('* Dados filtrados por Área Geográfica Desenhada no mapa.', 14, 290);
        }
    }

    // Save the PDF
    doc.save(`Analise_Ambiental_${new Date().toISOString().split('T')[0]}.pdf`);
};
