import React from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import AppRouter from './routes';
import { useTheme } from './hooks/useTheme';

const AppContent: React.FC = () => {
  useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-primary-50 dark:from-calm-950 dark:via-calm-900 dark:to-calm-950 transition-colors duration-300">
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'glass-toast',
          style: {
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '16px 24px',
            color: '#1e293b',
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 0 20px 0 rgba(255, 255, 255, 0.5) inset',
            fontSize: '15px',
            fontWeight: '500',
            maxWidth: '420px',
            zIndex: 9999,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              borderLeft: '5px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              borderLeft: '5px solid #ef4444',
            },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
