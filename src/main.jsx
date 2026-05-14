import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import './index.css'
import App from './App.jsx'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});


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
