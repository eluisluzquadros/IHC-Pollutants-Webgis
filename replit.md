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

## Known Issues
- MapLibre GL JS integration temporarily disabled due to React component errors
- MapContainer currently shows placeholder - needs MapLibre re-integration

## Next Steps
1. Fix MapLibre GL JS integration for full map functionality
2. Test CSV data import/export features
3. Verify all dashboard analytics work correctly
4. Add proper error boundaries for production

## User Preferences
- Clean, professional interface preferred
- Focus on environmental data visualization
- Responsive design for all device types