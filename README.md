# 🤖 AI-Powered WebGIS Platform for Environmental Data Visualization

**Next-generation environmental monitoring platform** combining interactive mapping with intelligent AI analysis. Chat with your environmental data using natural language, get instant insights, and visualize pollution patterns through professional WebGIS interface powered by OpenAI.

[![WebGIS Platform](https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80)](https://github.com/eluisluzquadros/IHC-Pollutants-Webgis)

🔗 **Repository**: [github.com/eluisluzquadros/IHC-Pollutants-Webgis](https://github.com/eluisluzquadros/IHC-Pollutants-Webgis)

🔗 **Deploy Demo**: [https://ihc-pollutants-webgis-eluzquadros.replit.app](https://ihc-pollutants-webgis-eluzquadros.replit.app)

🔗 **Dev Demo**: [https://6171eee4-df21-4832-ae4c-40bd1562f34e-00-6osxgaprsq2w.kirk.replit.dev](https://6171eee4-df21-4832-ae4c-40bd1562f34e-00-6osxgaprsq2w.kirk.replit.dev)
---

## 🚀 Key Features

### 🤖 **AI Assistant (Powered by OpenAI)** ✅ **FULLY OPERATIONAL**
- **Natural Language Queries**: "Show me stations with high pollution" or "What's the average pollution level?"
- **Intelligent Data Analysis**: AI interprets your environmental data and provides insights
- **Interactive Map Control**: AI can filter, highlight, and navigate the map based on your requests
- **Real-time Chat Interface**: Floating chat widget with conversation history
- **Contextual Responses**: AI understands your data context and provides relevant environmental insights
- **Instant Loading**: AI service now loads immediately on app startup (fixed lazy loading issue)

### 🗺️ **Professional WebGIS Interface**
- **CSS Grid Layout**: Industry-standard 25% sidebar + 75% map canvas proportions
- **Modern AppBar**: Professional header with live metrics, branding, and global controls
- **Responsive Design**: Mobile-first approach with adaptive breakpoints (desktop ≥1280px, tablet 1024-1279px, mobile <1024px)
- **Mobile Drawer**: Smooth sidebar-to-drawer conversion with overlay and touch interactions

### 📍 **Advanced Visualization Layers**
- **Station Markers**: Custom SVG icons with dual pollution level indicators (pol_a and pol_b)
- **Real Clustering**: Professional circular numbered clusters using Leaflet.markercluster
- **Interpolated Heatmaps**: Smooth gradient visualization (green→yellow→orange→red) using leaflet.heat
- **Interactive Controls**: Layer toggles, opacity sliders, and radius adjustments
- **Zoom-responsive**: Automatic clustering and aggregation based on zoom level

### 📊 **Analytics Dashboard**
- **Live KPI Cards**: Real-time metrics with total stations, pollution averages, and data points
- **Interactive Charts**: Bar charts, trend analysis, and distribution visualization using Recharts
- **Responsive Tabs**: Compact sidebar organization with data management and analytics
- **CSV Import/Export**: Full data lifecycle management with validation

### 🎨 **Professional Design System**
- **Modern Color Palette**: Professional dark theme with blue accent colors
- **Consistent Typography**: Clean, readable interface with proper visual hierarchy
- **Smooth Animations**: Polished interactions with loading states and transitions
- **Accessibility**: Proper contrast ratios and keyboard navigation support

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** package manager
- **OpenAI API Key** for AI Assistant functionality

### Full-Stack Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/eluisluzquadros/IHC-Pollutants-Webgis.git
   cd IHC-Pollutants-Webgis
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server && npm install && cd ..
   ```

2.1. **Setup Environment Variables (Local Development)**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file and add your OpenAI API key:
   # OPENAI_API_KEY=your-actual-api-key-here
   ```

3. **Configure OpenAI API Key**
   ```bash
   # For local development:
   export OPENAI_API_KEY="your-api-key-here"
   
   # For Replit: Use the Secrets panel in the sidebar
   # 1. Click on "Secrets" in the Replit sidebar
   # 2. Add key: OPENAI_API_KEY
   # 3. Add your OpenAI API key as the value
   ```

4. **Start both Frontend and Backend**
   ```bash
   # In Replit: Both workflows start automatically
   # Or manually in separate terminals:
   
   # Terminal 1: Start AI Backend (from project root)
   cd server
   npm start
   
   # Terminal 2: Start Frontend (from project root)
   npm run dev
   ```

5. **Access the application**
   - **Development**: `http://localhost:5000`
   - **Offline Demo**: `maps/mapa.html`

### 🤖 **AI Assistant Setup** ✅ **READY TO USE**

The AI Assistant is fully operational and requires an OpenAI API key to function:

1. **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Set Environment Variable**: `OPENAI_API_KEY=your-key`
3. **Verify Connection**: Click on "AI Assistant" tab in the sidebar
4. **Start Chatting**: Ask questions like "Give me a data summary" or "What are the highest pollution levels?"

> **✅ Latest Fix (2025-09-29)**: Resolved lazy loading issue - AI Assistant now loads immediately on app startup for instant availability.

### 📱 **Replit Development**

Configured for Replit with:
- **Port 5000**: Frontend server (Vite configured)
- **Dual Workflows**: Automatic frontend + backend startup
- **Proxy Configuration**: Seamless AI Assistant connectivity
- **Host Settings**: `0.0.0.0` for external access

## 📁 Project Structure

```
├── src/                     # Frontend React application
│   ├── components/          # React components
│   │   ├── ui/              # ShadCN UI components
│   │   ├── AppBar.tsx       # Professional header component
│   │   ├── ChatBot.tsx      # AI Assistant interface
│   │   ├── home.tsx         # Main application layout
│   │   ├── ModernSidebar.tsx # Responsive sidebar
│   │   └── MapContainer.tsx  # Interactive map
│   ├── services/            # API services
│   │   └── openaiService.ts # AI backend integration
│   ├── utils/               # Utility functions
│   │   └── csvImporter.ts   # Data processing
│   └── contexts/            # React contexts
├── server/                  # AI Backend (Node.js + Express)
│   ├── server.js            # Express server with OpenAI
│   └── package.json         # Backend dependencies
├── maps/                    # Offline demo
│   └── mapa.html            # Static version
└── vite.config.ts           # Development proxy configuration
```

## 📊 Data Format

The application expects CSV files with the following structure:

```csv
station_id,station_name,lat,lon,sample_dt,pol_a,pol_b,unit
ST001,Station Alpha,-23.5505,-46.6333,2024-01-15,4.2,3.8,µg/m³
ST002,Station Beta,-23.5489,-46.6388,2024-01-15,6.1,5.4,µg/m³
```

### Required Columns:
- `station_id`: Unique identifier for each station
- `station_name`: Display name for the station
- `lat`: Latitude coordinate (decimal degrees)
- `lon`: Longitude coordinate (decimal degrees)
- `sample_dt`: Sample date (ISO format)
- `pol_a`: Pollution measurement A (numeric)
- `pol_b`: Pollution measurement B (numeric)
- `unit`: Measurement unit (e.g., µg/m³)

## 🎯 Usage Guide

### 🤖 **AI Assistant Interactions**
- **Natural Language**: Ask "Show me all stations with pollution > 5" or "What's the trend?"
- **Map Control**: "Zoom to the highest pollution area" or "Filter by station type"
- **Data Analysis**: "Calculate average pollution levels" or "Show distribution"
- **Chat Interface**: Click the AI icon (bottom-right) to start conversing

### 📊 **Data Management**
- **Import CSV**: Use sidebar "Import Data" tab with drag-and-drop support
- **Export Results**: Download filtered or analyzed data as CSV
- **Data Validation**: Automatic validation with error reporting
- **Real-time Updates**: Live metrics and KPI updates

### 🗺️ **Map Interactions**
- **Layer Controls**: Toggle stations, heatmaps, and clustering via sidebar
- **Station Details**: Hover for quick info, click for detailed popup
- **Heatmap Controls**: Adjust opacity (0-100%) and radius settings
- **Clustering**: Automatic grouping with numbered clusters
- **Navigation**: Pan, zoom, and full-screen map controls

### 📱 **Responsive Interface**
- **Desktop**: Full sidebar with all controls visible
- **Tablet**: Collapsible sidebar with touch optimization
- **Mobile**: Drawer-style sidebar with overlay navigation

## 🛠️ Full-Stack Technology

### **Frontend Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.2.3 (configured for port 5000, proxy support)
- **UI Library**: ShadCN/UI components with Tailwind CSS
- **Mapping**: MapLibre GL JS with Leaflet.heat and Leaflet.markercluster
- **Charts**: Recharts for analytics dashboard
- **Icons**: Lucide React icon system
- **Routing**: React Router DOM

### **Backend Stack**
- **Runtime**: Node.js with Express.js
- **AI Integration**: OpenAI API (GPT models)
- **CORS**: Configured for frontend-backend communication
- **Environment**: Replit-optimized with dual workflow support

### **Development Tools**
- **TypeScript**: Full type safety across frontend
- **Vite Proxy**: Seamless development server integration
- **Hot Reload**: Real-time development updates
- **CSS Grid**: Professional WebGIS layout architecture

## 🎨 Design System

### Color Palette
- **Primary**: Dark Blue (#2C3E50)
- **Secondary**: Light Blue (#3498DB)
- **Accent**: Highlight Red (#E74C3C)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)

### Pollution Level Indicators
- **Low (< 3)**: Green indicators
- **Medium (3-7)**: Yellow/Orange indicators
- **High (> 7)**: Red indicators

## 📱 Professional Responsive Design

### **Responsive Breakpoints** (Mobile-First)
- **Desktop** (≥1280px): Full sidebar + map canvas layout with all features
- **Tablet** (1024-1279px): Optimized layout with collapsible sidebar
- **Mobile** (<1024px): Drawer-based sidebar with overlay and touch interactions

### **WebGIS Standards**
- **CSS Grid Layout**: Industry-standard 25% sidebar + 75% map proportions
- **AppBar Component**: Professional header with consistent branding
- **Adaptive Controls**: Touch-optimized interface elements for mobile
- **Z-Index Management**: Proper layering for modals, tooltips, and overlays

### **Performance Optimizations**
- **Efficient Rendering**: Optimized component re-renders
- **Lazy Loading**: Components loaded as needed
- **Responsive Images**: Adaptive image sizing
- **Mobile Gestures**: Native touch interactions for map navigation

## 🔧 Configuration

### **Environment Variables**
```bash
# Required for AI Assistant
OPENAI_API_KEY=your-openai-api-key-here

# Optional customization
VITE_BASEMAP_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

### **Replit Configuration**
- **Port 5000**: Frontend development server
- **Dual Workflows**: Frontend + AI Backend automatically managed
- **Proxy Setup**: Vite proxy routes `/api/*` to backend
- **Host Settings**: `0.0.0.0` for external access

### **Customization Options**
- **AI Models**: Switch between GPT models in `/server/server.js`
- **Map Styling**: Update basemap URL and layer styles
- **Color Themes**: Modify design system in Tailwind configuration
- **Pollution Thresholds**: Adjust classification levels in analytics dashboard

## 🚀 Deployment

### **Production Build**
```bash
# Build frontend
npm run build

# Update offline demo
cp dist/index.html maps/mapa.html
cp -r dist/assets maps/
```

### **Replit Deployment** ✨
- **Auto-Deploy**: Configured for Replit's autoscale deployment
- **Build Command**: `npm run build`
- **Start Command**: `npm run preview`
- **Environment**: Automatic secrets management for OpenAI API key

### **Self-Hosted Deployment**
```bash
# Frontend (static files)
npm run build
# Deploy dist/ folder to CDN/static hosting

# Backend (Node.js server)
cd server
npm install --production
node server.js
```

### **Offline Demo Access**
```bash
# Serve static demo locally
cd maps && python -m http.server 8000
# Open: http://localhost:8000/mapa.html
```

## 🤝 Contributing

### **Development Setup**
1. **Fork & Clone**: [github.com/eluisluzquadros/IHC-Pollutants-Webgis](https://github.com/eluisluzquadros/IHC-Pollutants-Webgis)
2. **Feature Branch**: `git checkout -b feature/ai-enhancement`
3. **Local Development**: Set up OpenAI API key and test both frontend + backend
4. **Test Changes**: Verify AI Assistant, map interactions, and responsive design
5. **Submit PR**: Include screenshots of UI changes and AI interaction examples

### **Contribution Areas**
- 🤖 **AI Features**: Enhanced natural language processing and map interactions
- 🗺️ **Mapping**: New visualization types and analysis tools
- 📊 **Analytics**: Advanced environmental data analysis and reporting
- 🎨 **UX/UI**: Responsive design improvements and accessibility features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for powering the intelligent AI Assistant
- **MapLibre GL JS** + **Leaflet** ecosystem for professional mapping
- **ShadCN/UI** for the modern component library
- **Replit** for the seamless development and deployment platform
- **OpenStreetMap** community for base map tiles
- **Recharts** for interactive data visualization
- **Environmental Monitoring Community** for inspiring real-world impact

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for environmental monitoring and data visualization**
