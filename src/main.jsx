import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { queryClient } from './services/api'
import { AuthProvider } from './contexts/AuthContext'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import App from './App.jsx'
import './index.css'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration)
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'inherit',
            },
          }}
        />
        <PWAInstallPrompt />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
