import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ElementSelector from './pages/preview/index.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();


createRoot(document.getElementById('becu-preview-root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ElementSelector />
    </QueryClientProvider>
  </StrictMode>,
)
