import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
// import routes from "tempo-routes";

// Lazy load the main application component
const ProfessionalWebGISApp = lazy(() => import("./components/ProfessionalWebGISApp"));

// Professional Loading Component
const AppLoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <div className="absolute inset-0 bg-blue-600 rounded-2xl animate-pulse opacity-20"></div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading WebGIS Platform</h2>
      <p className="text-gray-600">Initializing environmental data visualization...</p>
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Error Fallback Component
const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-red-900 mb-4">Application Error</h1>
      <p className="text-red-700 mb-6 leading-relaxed">
        {error?.message || "An unexpected error occurred while loading the application"}
      </p>
      <div className="space-y-3">
        <Button 
          onClick={resetError}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          Reload Application
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full border-red-300 text-red-700 hover:bg-red-50 font-medium py-3 px-6 rounded-xl transition-colors"
        >
          Hard Refresh
        </Button>
      </div>
    </div>
  </div>
);

function App() {
  const tempoRoutes = import.meta.env.VITE_TEMPO === "true" ? null : null;

  return (
    <Suspense fallback={<AppLoadingFallback />}>
      {import.meta.env.VITE_TEMPO === "true" ? (
        tempoRoutes || (
          <Routes>
            <Route path="/" element={<ProfessionalWebGISApp />} />
            <Route path="*" element={<ProfessionalWebGISApp />} />
          </Routes>
        )
      ) : (
        <Routes>
          <Route path="/" element={<ProfessionalWebGISApp />} />
          <Route path="*" element={<ProfessionalWebGISApp />} />
        </Routes>
      )}
    </Suspense>
  );
}

export default App;