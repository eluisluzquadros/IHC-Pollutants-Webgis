# WebGIS Platform for Environmental Data Visualization

## Overview
This is a professional React + TypeScript application for visualizing environmental pollution data using interactive maps and analytics dashboards. The application was successfully imported from GitHub and configured for the Replit environment.

## Recent Changes
- **2025-09-28**: Successfully imported and configured project for Replit
- **2025-09-28**: Fixed Vite configuration for port 5000 and host settings
- **2025-09-28**: Temporarily simplified MapContainer component due to MapLibre integration issues
- **2025-09-28**: Configured deployment settings for production

## Project Architecture
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.2.3 (configured for port 5000, host: true for Replit)
- **UI Components**: ShadCN/UI with Tailwind CSS
- **Mapping Library**: MapLibre GL JS (temporarily disabled - needs fixing)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Key Features
- Professional WebGIS interface for environmental data
- CSV data import/export functionality
- Interactive pollution data visualization
- Analytics dashboard with KPI cards and charts
- Responsive design (desktop, tablet, mobile)
- Layer controls for stations, heatmaps, and clustering

## Development Setup
- **Port**: 5000 (configured for Replit)
- **Host**: 0.0.0.0 (allows external access in Replit)
- **Dev Command**: `npm run dev`
- **Build Command**: `npm run build`

## Deployment Configuration
- **Target**: Autoscale (stateless web application)
- **Build**: `npm run build`
- **Run**: `npm run preview`

## Recent Improvements
- **2025-09-28**: ✅ Implemented real heatmap interpolation using leaflet.heat
- **2025-09-28**: ✅ Added smooth gradient transitions (green→yellow→orange→red)
- **2025-09-28**: ✅ Fixed opacity control integration with UI slider
- **2025-09-28**: ✅ Added fallback mechanism for heatmap errors

## Current Features Status
- ✅ **Heatmap**: Real interpolation with smooth gradients
- ✅ **Station Markers**: Individual markers with pollution data
- ✅ **Station Clustering**: Groups nearby stations dynamically
- ✅ **Record Clustering**: Shows data density per location
- ✅ **CSV Import/Export**: Full data management capabilities
- ✅ **Analytics Dashboard**: KPIs, charts, and statistics
- ✅ **Responsive Design**: Works on desktop, tablet, mobile

## Next Steps
1. Test all visualization features with real datasets
2. Optimize performance for large datasets (>1000 stations)  
3. Add data filtering and time-series capabilities
4. Implement user preferences and saved views

## User Preferences
- Clean, professional interface preferred
- Focus on environmental data visualization
- Responsive design for all device types