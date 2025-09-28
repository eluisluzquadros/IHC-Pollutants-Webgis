import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";

function App() {
  const tempoRoutes = import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">
      <div className="loading-spinner"></div>
      <span className="ml-2">Loading...</span>
    </div>}>
      {tempoRoutes || (
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      )}
    </Suspense>
  );
}

export default App;