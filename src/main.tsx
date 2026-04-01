import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { DuckDBProvider } from './contexts/DuckDBContext';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DuckDBProvider>
          <App />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'white',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
              },
            }}
          />
        </DuckDBProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);