export interface StationData {
  station_id: string;
  station_name: string;
  lat: number;
  lon: number;
  sample_dt: string;
  pol_a: number;
  pol_b: number;
  unit: string;
}

export const parseCSV = (csvText: string): StationData[] => {
  const lines = csvText.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const parsedData: StationData[] = [];
  
  dataLines.forEach((line, index) => {
    try {
      // Parse CSV line considering quoted values
      const values = parseCSVLine(line);
      
      if (values.length >= 8) {
        const stationData: StationData = {
          station_id: values[0],
          station_name: values[1],
          lat: parseFloat(values[2]),
          lon: parseFloat(values[3]),
          sample_dt: values[4],
          pol_a: parseFloat(values[5]),
          pol_b: parseFloat(values[6]),
          unit: values[7]
        };
        
        // Validate required numeric fields
        if (!isNaN(stationData.lat) && !isNaN(stationData.lon) && 
            !isNaN(stationData.pol_a) && !isNaN(stationData.pol_b)) {
          parsedData.push(stationData);
        } else {
          console.warn(`Skipping invalid data at line ${index + 2}:`, line);
        }
      } else {
        console.warn(`Insufficient columns at line ${index + 2}:`, line);
      }
    } catch (error) {
      console.error(`Error parsing line ${index + 2}:`, error);
    }
  });
  
  return parsedData;
};

// Helper function to parse CSV line with quoted values
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  // Remove quotes from values
  return result.map(value => value.replace(/^"(.*)"$/, '$1'));
};

export const importCSVFile = (file: File): Promise<StationData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const data = parseCSV(csvText);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Function to export data back to CSV
export const exportToCSV = (data: StationData[]): string => {
  const headers = ['station_id', 'station_name', 'lat', 'lon', 'sample_dt', 'pol_a', 'pol_b', 'unit'];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      `"${row.station_id}"`,
      `"${row.station_name}"`,
      row.lat.toString(),
      row.lon.toString(),
      `"${row.sample_dt}"`,
      row.pol_a.toString(),
      row.pol_b.toString(),
      `"${row.unit}"`
    ].join(','))
  ].join('\n');
  
  return csvContent;
};

// Function to download CSV file
export const downloadCSV = (data: StationData[], filename: string = 'pollution_data.csv') => {
  const csvContent = exportToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};