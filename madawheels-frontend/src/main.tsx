
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#111214',
          color: '#fff',
          fontSize: 14,
          borderRadius: 10,
        },
        success: { iconTheme: { primary: '#2e9e5b', secondary: '#fff' } },
        error: { iconTheme: { primary: '#f25656', secondary: '#fff' } },
      }}
    />
    <App />
  </StrictMode>,
)
