# Product Requirements Document (PRD)
**Project Name**: IHC Pollutants WebGIS
**Version**: 1.1

## 1. Executive Summary
The IHC Pollutants WebGIS is an advanced environmental data visualization platform. It combines an interactive map, professional dashboards, data management (import/export), and a multi-provider AI Assistant to help researchers, environmental analysts, and public administrators make data-driven decisions regarding air and water quality.

## 2. Target Audience
- Environment Analysts
- Urban Planners
- Public Policy Makers
- Data Scientists and Researchers

## 3. Key Features
1. **Interactive WebGIS Map**:
   - High-performance rendering for geospatial points.
   - Clustered data points for scalability.
   - Heatmap interpolation for spatial distribution analysis of pollutants.
2. **Data Management**:
   - Local CSV parsing with flexible column assignment.
   - Pre-loaded sample datasets for rapid prototyping.
   - Data export capabilities.
3. **Analytics Dashboard**:
   - Real-time KPIs (Total Stations, Average Pollution, etc.).
   - Visual charts showing pollution trends and distribution (Recharts).
4. **AI Assistant**:
   - Support for multiple LLM providers (OpenAI, Google Gemini, Anthropic Claude, Zhipu, DeepSeek, MiniMax).
   - Natural language queries that interact directly with the map state and data context.
   - Context-aware filtering and data insights.

## 4. Technical Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, ShadCN UI.
- **Mapping**: MapLibre GL JS, Leaflet (markercluster, heat).
- **Backend (AI Services)**: Node.js, Express, dotenv.
- **Data Persistence**: IndexedDB for local session storage, optionally PostgreSQL + Drizzle ORM.

## 5. Non-Functional Requirements
- **Performance**: Capable of fluid rendering of thousands of points. Fast initial load time.
- **Responsiveness**: Mobile-first design (drawer on mobile, collapsible sidebar on tablets, full UI on desktops).
- **Security**: Local loading of `.env` files for API keys, backend abstraction over LLM calls preventing API keys leakage in the frontend.
