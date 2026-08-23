import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ClerkAuthProvider from './auth/ClerkAuthProvider.jsx'
import { registerOwnerAlertWorker } from './services/ownerAlertService'

registerOwnerAlertWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkAuthProvider>
      <App />
    </ClerkAuthProvider>
  </StrictMode>,
)
