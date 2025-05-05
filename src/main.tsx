import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ConvexProvider } from 'convex/react'
import { convex } from './lib/convex.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
