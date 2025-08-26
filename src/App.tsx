import { AuthCard } from '@/components/extension/AuthCard'
import { CallbackHandler } from '@/components/extension/CallbackHandler'
import { ExtensionProvider } from '@/components/extension/ExtensionProvider'
import { ExtensionStatus } from '@/components/extension/ExtensionStatus'
import { ErrorBoundary } from '@/components/ui/error-boundary'

import './App.css'

function AppContent() {
  return (
    <div className='min-h-screen bg-white'>
      <div className='mx-auto max-w-4xl px-8 py-20'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h1 className='mb-3 text-4xl font-bold text-gray-800'>Bodhi Extension Demo</h1>
          <p className='text-lg text-gray-600'>Connect with the Bodhi browser extension for AI capabilities</p>
        </div>

        {/* Main Content - Consistent layout for both states */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Extension Status Card - Always visible */}
          <ExtensionStatus />

          {/* Authentication Card - Unified component handles all auth states */}
          <AuthCard />
        </div>
      </div>
    </div>
  )
}

function App() {
  // Check if we're on the callback page
  const isCallbackPage =
    window.location.pathname === '/callback' ||
    new URLSearchParams(window.location.search).has('code') ||
    new URLSearchParams(window.location.search).has('error')

  // If this is a callback page, show the callback handler
  if (isCallbackPage) {
    return (
      <ErrorBoundary>
        <ExtensionProvider>
          <CallbackHandler />
        </ExtensionProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <ExtensionProvider>
        <AppContent />
      </ExtensionProvider>
    </ErrorBoundary>
  )
}

export default App
