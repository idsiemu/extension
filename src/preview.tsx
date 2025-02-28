import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/preview/index.tsx'

createRoot(document.getElementById('becu-preview-root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
