import { X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { AuthCard } from '@/components/extension/AuthCard'
import { CallbackHandler } from '@/components/extension/CallbackHandler'
import { ExtensionProvider, useExtensionContext } from '@/components/extension/ExtensionProvider'
import { ExtensionStatus } from '@/components/extension/ExtensionStatus'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Toaster } from '@/components/ui/toaster'
import { getLandingError } from '@/lib/landing-error-storage'
import ChatPage from '@/pages/ChatPage'

import './App.css'

// Get base path for routing - handles both dev and production
const getBasePath = () => {
  if (import.meta.env.DEV) return ''
  return `/${import.meta.env.BASE_URL.split('/').filter(Boolean).join('/')}`
}

// Helper to check if current path matches a route
const isCurrentRoute = (route: string) => {
  const basePath = getBasePath()
  const fullPath = `${basePath}${route}`
  return window.location.pathname === route || window.location.pathname === fullPath
}

// Helper to navigate to a route with correct base path
const navigateToRoute = (route: string) => {
  const basePath = getBasePath()
  window.location.href = `${basePath}${route}`
}

function AppContent() {
  const { extension, auth } = useExtensionContext()
  const [landingError, setLandingError] = useState<string | null>(null)

  const canUseChat = extension.client && auth.isAuthenticated

  // Check for stored error message on component mount
  useEffect(() => {
    const errorMessage = getLandingError()
    if (errorMessage) {
      setLandingError(errorMessage)
    }
  }, [])

  return (
    <div className='min-h-screen bg-white'>
      <div className='mx-auto max-w-4xl px-8 py-20'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h1 className='mb-3 text-4xl font-bold text-gray-800'>Bodhi Extension Demo</h1>
          <p className='text-lg text-gray-600'>Connect with the Bodhi browser extension for AI capabilities</p>
        </div>

        {/* Landing Page Error Notification */}
        {landingError && (
          <div className='mb-8'>
            <Alert variant='destructive' className='relative'>
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{landingError}</AlertDescription>
              <Button
                variant='ghost'
                size='sm'
                className='absolute right-2 top-2 h-6 w-6 p-0'
                onClick={() => setLandingError(null)}
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>Dismiss</span>
              </Button>
            </Alert>
          </div>
        )}

        {/* Main Content - Consistent layout for both states */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Extension Status Card - Always visible */}
          <ExtensionStatus />

          {/* Authentication Card - Unified component handles all auth states */}
          <AuthCard />
        </div>

        {/* Chat Page Link */}
        <div className='mt-12 text-center'>
          <button
            onClick={() => canUseChat && navigateToRoute('/chat')}
            disabled={!canUseChat}
            className='inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
          >
            Try Chat Interface
          </button>
          <p className='mt-2 text-sm text-gray-500'>
            {canUseChat ? 'Experience our AI chat interface' : 'You need to be logged in to use the chat'}
          </p>
        </div>
      </div>
    </div>
  )
}

function App() {
  // Check if we're on the callback page
  const isCallbackPage =
    isCurrentRoute('/callback') ||
    new URLSearchParams(window.location.search).has('code') ||
    new URLSearchParams(window.location.search).has('error')

  // Check if we're on the chat page
  const isChatPage = isCurrentRoute('/chat')

  // If this is a callback page, show the callback handler
  if (isCallbackPage) {
    return (
      <ErrorBoundary>
        <ExtensionProvider>
          <CallbackHandler />
          <Toaster />
        </ExtensionProvider>
      </ErrorBoundary>
    )
  }

  // If this is the chat page, show the chat interface
  if (isChatPage) {
    return (
      <ErrorBoundary>
        <ExtensionProvider>
          <ChatPage />
          <Toaster />
        </ExtensionProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <ExtensionProvider>
        <AppContent />
        <Toaster />
      </ExtensionProvider>
    </ErrorBoundary>
  )
}

export default App
