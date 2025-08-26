import { X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import { AuthCard } from '@/components/extension/AuthCard'
import { ExtensionProvider, useExtensionContext } from '@/components/extension/ExtensionProvider'
import { ExtensionStatus } from '@/components/extension/ExtensionStatus'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingState } from '@/components/ui/loading-state'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { useAuthServer } from '@/hooks/useAuthServer'
import { useExtensionApi } from '@/hooks/useExtensionApi'
import { isCurrentRoute, navigateToRoute } from '@/lib/base-path'
import { getLandingError, storeLandingError } from '@/lib/landing-error-storage'
import ChatPage from '@/pages/ChatPage'

import './App.css'

function OAuthCallbackProcessor() {
  const { toast } = useToast()
  const { extension } = useExtensionContext()
  const authServer = useAuthServer()
  const extensionApi = useExtensionApi(extension.client)
  const [isProcessing, setIsProcessing] = useState(true)

  // Atomic processing - ensure token exchange happens only once
  const processingRef = useRef<Promise<void> | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    // If already processed or processing, don't start again
    if (processedRef.current || processingRef.current) {
      return
    }

    const processOAuthCallback = async () => {
      try {
        console.log('🔄 [OAuthCallbackProcessor] Starting ATOMIC OAuth callback processing...')

        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        // Handle OAuth error
        if (error) {
          const errorMessage = errorDescription || error
          const displayError =
            errorMessage === 'access_denied' ? 'User denied access to the application' : `OAuth error: ${errorMessage}`
          throw new Error(displayError)
        }

        // Validate required parameters
        if (!code) {
          throw new Error('Authorization code not found in callback URL')
        }
        if (!state) {
          throw new Error('State parameter not found in callback URL')
        }

        console.log('🔄 Processing OAuth callback - ATOMIC EXECUTION...')

        // ATOMIC: Exchange code for tokens - this can only happen once
        await authServer.exchangeCodeForTokens(code, state)
        console.log('✅ Token exchange completed successfully')

        // Load user info to complete authentication
        await extensionApi.sendApiRequest('GET', '/bodhi/v1/user')
        console.log('✅ User info loaded successfully')

        // Mark as processed before clearing URL to prevent re-processing
        processedRef.current = true

        // Clear URL parameters and redirect to clean root
        const url = new URL(window.location.href)
        url.search = ''
        window.history.replaceState({}, '', url.toString())

        toast({
          title: 'Authentication Successful',
          description: 'You are now logged in and can use the chat interface.',
        })
      } catch (error) {
        console.error('❌ OAuth callback processing failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error'

        // Mark as processed even on error to prevent retry loops
        processedRef.current = true

        // Store error for display on landing page
        storeLandingError(errorMessage)

        // Clear URL and redirect to root
        const url = new URL(window.location.href)
        url.search = ''
        window.history.replaceState({}, '', url.toString())

        // Force page reload to show error
        window.location.reload()
      } finally {
        setIsProcessing(false)
        processingRef.current = null
      }
    }

    // Store the processing promise to prevent concurrent executions
    processingRef.current = processOAuthCallback()
  }, [authServer, extensionApi, toast])

  if (isProcessing) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <div className='mx-auto w-full max-w-md text-center'>
          <LoadingState message='Processing authentication...' />
          <p className='mt-4 text-sm text-gray-600'>Please wait while we complete your login...</p>
        </div>
      </div>
    )
  }

  return null
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
  // Check if we have OAuth callback parameters in the URL
  const urlParams = new URLSearchParams(window.location.search)
  const hasOAuthParams = urlParams.has('code') || urlParams.has('error')

  // Check if we're on the chat page
  const isChatPage = isCurrentRoute('/chat')

  // If we have OAuth callback parameters, process them
  if (hasOAuthParams) {
    return (
      <ErrorBoundary>
        <ExtensionProvider>
          <OAuthCallbackProcessor />
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

  // Default: show the main app content
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
