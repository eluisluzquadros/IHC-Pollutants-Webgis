# WebGIS Platform for Environmental Data Visualization

An interactive map application that visualizes pollution data from CSV files using MapLibre GL JS, featuring customizable layers with station markers showing pollution levels through mini-bar charts and a heatmap visualization of pollution density.

![WebGIS Platform](https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80)

## 🌟 Features

### 📍 Station Visualization
- **Custom SVG Icons**: Dual vertical bars representing pollution levels (pol_a and pol_b)
- **Interactive Tooltips**: Detailed station information with pollution measurements
- **Real-time Data**: Live pollution level indicators with color-coded status

### 🗺️ Interactive Heatmap
- **Color-gradient Visualization**: Pollution density mapping
- **Adjustable Settings**: Customizable opacity and radius controls
- **Dynamic Updates**: Real-time heatmap rendering based on data changes

### 🎛️ Layer Controls
- **Floating Control Panel**: Toggle different visualization layers
- **Station Layer**: Show/hide individual station markers
- **Heatmap Layer**: Control heatmap visibility and settings
- **Clustering**: Automatic station grouping with median pollution values

### 📊 Advanced Analytics Dashboard
- **KPI Cards**: Total stations, average pollution levels, data points
- **Interactive Charts**: Bar charts, line graphs, and pie charts
- **Trend Analysis**: Pollution level trends over time
- **Distribution Analysis**: Pollution level categorization

### 🎨 Professional Design
- **Dark Theme**: Professional interface with dark blue (#2C3E50), light blue (#3498DB), and highlight red (#E74C3C)
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webgis-pollution-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (ShadCN)
│   ├── MapContainer.tsx # Main map component
│   ├── LayerControlPanel.tsx
│   ├── PollutionDashboard.tsx
│   ├── StationTooltip.tsx
│   └── ...
├── utils/               # Utility functions
│   └── csvImporter.ts   # CSV data processing
├── types/               # TypeScript type definitions
├── styles/              # CSS and styling
└── main.tsx            # Application entry point
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

## 🎯 Usage

### 1. Import Data
- Click the "Import CSV" button in the sidebar
- Select your pollution data CSV file
- Data will be automatically processed and visualized

### 2. Layer Controls
- **Station Markers**: Toggle individual station visibility
- **Heatmap**: Enable/disable pollution density visualization
- **Clustering**: Group nearby stations for better performance
- **Opacity**: Adjust heatmap transparency
- **Radius**: Control heatmap point influence area

### 3. Interactive Features
- **Hover**: Station tooltips with detailed information
- **Click**: Popup with comprehensive station data
- **Zoom**: Navigate and explore different areas
- **Pan**: Move around the map freely

### 4. Analytics Dashboard
- **KPI Overview**: Key metrics at a glance
- **Charts**: Visual data analysis
- **Trends**: Historical pollution patterns
- **Distribution**: Pollution level categorization

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Mapping Library**: MapLibre GL JS
- **UI Components**: ShadCN/UI with Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom design system

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

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with sidebar (1024px+)
- **Tablet**: Adapted layout with collapsible sidebar (768-1023px)
- **Mobile**: Touch-optimized interface with overlay sidebar (<768px)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_BASEMAP_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Customization
- **Map Style**: Modify the basemap URL in MapContainer.tsx
- **Color Scheme**: Update the color constants in the design system
- **Thresholds**: Adjust pollution level thresholds in PollutionDashboard.tsx

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Access Local Maps

1. cd maps
2. python -m http.server 8000
3. Open: http://localhost:8000/mapa.html

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- MapLibre GL JS for the mapping functionality
- ShadCN/UI for the component library
- OpenStreetMap for the base map tiles
- Recharts for the data visualization components

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for environmental monitoring and data visualization**
