import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

import ErrorBoundary from './components/ErrorBoundary.jsx'

if (!supabaseUrl || !supabaseAnonKey) {
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: sans-serif;">
      <h1>Configuration Error</h1>
      <p>Missing Supabase Environment Variables.</p>
      <p>Please checks your <strong>.env.local</strong> file.</p>
      <pre>VITE_SUPABASE_URL=${supabaseUrl ? 'Set' : 'Missing'}</pre>
      <pre>VITE_SUPABASE_ANON_KEY=${supabaseAnonKey ? 'Set' : 'Missing'}</pre>
    </div>
  `
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
