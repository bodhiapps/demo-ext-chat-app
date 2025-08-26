import { ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusDisplay } from '@/components/ui/status-display'
import { useAuthServer } from '@/hooks/useAuthServer'
import { useExtensionApi } from '@/hooks/useExtensionApi'
import { navigateToRoot } from '@/lib/base-path'

import { useExtensionContext } from './ExtensionProvider'

type ProcessingState =
  | { status: 'loading' }
  | { status: 'processing'; step: string }
  | { status: 'success' }
  | { status: 'error'; message: string }

interface CallbackStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

const defaultSteps: CallbackStep[] = [
  { id: 'validate', label: 'Validating callback', status: 'pending' },
  { id: 'exchange', label: 'Exchanging tokens', status: 'pending' },
  { id: 'userinfo', label: 'Loading user info', status: 'pending' },
  { id: 'complete', label: 'Login complete', status: 'pending' },
]

/**
 * CallbackHandler handles OAuth callback processing following React best practices:
 *
 * 1. Single useEffect with stable dependencies (extension.client)
 * 2. Self-contained processing logic inside useEffect
 * 3. Mounted guard to prevent duplicate calls and state updates after unmount
 * 4. Direct token exchange calls instead of reactive hook chains
 * 5. No dependency on changing auth state that could trigger re-runs
 */
export function CallbackHandler() {
  const { extension } = useExtensionContext()
  const authServer = useAuthServer()
  const extensionApi = useExtensionApi(extension.client)

  const [state, setState] = useState<ProcessingState>({ status: 'loading' })
  const [steps, setSteps] = useState<CallbackStep[]>(defaultSteps)

  const updateStepStatus = (stepId: string, status: CallbackStep['status']) => {
    setSteps(prev => prev.map(step => (step.id === stepId ? { ...step, status } : step)))
  }

  const setStepError = () => {
    setSteps(prev => prev.map(step => (step.status === 'active' ? { ...step, status: 'error' } : step)))
  }

  // Self-contained atomic processing - follows reference implementation pattern
  useEffect(() => {
    let mounted = true

    const processCallback = async () => {
      try {
        setState({ status: 'processing', step: 'Processing OAuth callback...' })

        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        // Step 1: Validate
        updateStepStatus('validate', 'active')

        if (error) {
          const errorMessage = errorDescription || error
          throw new Error(
            errorMessage === 'access_denied' ? 'User denied access to the application' : `OAuth error: ${errorMessage}`
          )
        }

        if (!code) {
          throw new Error('Authorization code not found in callback URL')
        }

        if (!state) {
          throw new Error('State parameter not found in callback URL')
        }

        if (!mounted) return
        updateStepStatus('validate', 'completed')

        // Step 2: Exchange tokens - ATOMIC SINGLE CALL
        updateStepStatus('exchange', 'active')
        setState({ status: 'processing', step: 'Exchanging authorization code for tokens...' })

        console.log('🔄 [CallbackHandler] Starting atomic token exchange...')
        await authServer.exchangeCodeForTokens(code, state)
        console.log('✅ [CallbackHandler] Token exchange completed successfully')

        if (!mounted) return
        updateStepStatus('exchange', 'completed')

        // Step 3: Load user info
        updateStepStatus('userinfo', 'active')
        setState({ status: 'processing', step: 'Loading user information...' })

        console.log('🔄 [CallbackHandler] Loading user info...')
        await extensionApi.sendApiRequest('GET', '/bodhi/v1/user')
        console.log('✅ [CallbackHandler] User info loaded successfully')

        if (!mounted) return
        updateStepStatus('userinfo', 'completed')

        // Step 4: Complete
        updateStepStatus('complete', 'completed')
        setState({ status: 'success' })

        // Auto-redirect after success
        setTimeout(() => {
          if (mounted) {
            console.log('🔄 [CallbackHandler] Redirecting to home page...')
            navigateToRoot()
          }
        }, 2000)
      } catch (error) {
        if (!mounted) return
        console.error('❌ [CallbackHandler] OAuth callback processing failed:', error)
        setStepError()
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Only process if we have callback parameters and extension is ready
    const urlParams = new URLSearchParams(window.location.search)
    const hasCallbackParams = urlParams.has('code') || urlParams.has('error')

    if (hasCallbackParams && extension.client) {
      console.log('🚀 [CallbackHandler] Starting callback processing (atomic, single execution)')
      processCallback()
    } else if (!extension.client) {
      setState({ status: 'loading' })
    }

    return () => {
      console.log('🧹 [CallbackHandler] Cleanup: preventing duplicate calls')
      mounted = false
    }
  }, [extension.client, authServer, extensionApi]) // Only stable dependencies

  const handleRetry = () => {
    console.log('🔄 [CallbackHandler] User requested retry - reloading page')
    window.location.reload()
  }

  const handleReturnHome = () => {
    navigateToRoot()
  }

  // Render different states
  if (state.status === 'loading') {
    return (
      <div className='flex h-screen justify-center bg-white pt-20'>
        <div className='mx-auto w-full max-w-4xl px-8'>
          <div className='mb-8 text-center'>
            <h1 className='mb-2 text-4xl font-bold text-gray-800'>OAuth Callback</h1>
            <p className='text-gray-600'>Initializing...</p>
          </div>
          <Card className='mx-auto w-full max-w-md'>
            <CardContent className='py-8 text-center'>
              <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin' />
              <p className='text-sm text-gray-600'>Waiting for extension...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isProcessing = state.status === 'processing'
  const hasError = state.status === 'error'
  const isCompleted = state.status === 'success'

  return (
    <div className='flex h-screen justify-center bg-white pt-20'>
      <div className='mx-auto w-full max-w-4xl px-8'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-4xl font-bold text-gray-800'>OAuth Callback</h1>
          <p className='text-gray-600'>Completing authentication with BodhiApp</p>
        </div>

        {/* Main Content */}
        <Card className='mx-auto w-full max-w-md'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ArrowRight className='h-5 w-5' />
              Processing Login
            </CardTitle>
            <CardDescription>{isProcessing ? (state as any).step : 'Processing OAuth callback'}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Progress Steps */}
            <div className='space-y-4'>
              {steps.map((step, index) => (
                <div key={step.id} className='flex items-center gap-3'>
                  <StatusDisplay type='callbackStep' status={step.status} showText={false} />
                  <span
                    className={`text-sm ${
                      step.status === 'completed'
                        ? 'text-green-700'
                        : step.status === 'error'
                          ? 'text-red-700'
                          : step.status === 'active'
                            ? 'text-blue-700'
                            : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && step.status === 'completed' && (
                    <div className='ml-2 h-px flex-1 bg-green-300' />
                  )}
                </div>
              ))}
            </div>

            {/* Error Display */}
            {hasError && (
              <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                <div className='mb-2 flex items-center gap-2 text-red-800'>
                  <XCircle className='h-4 w-4' />
                  <span className='font-medium'>Authentication Failed</span>
                </div>
                <p className='text-sm text-red-700'>{(state as any).message}</p>
              </div>
            )}

            {/* Success Message */}
            {isCompleted && (
              <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                <div className='mb-2 flex items-center gap-2 text-green-800'>
                  <CheckCircle className='h-4 w-4' />
                  <span className='font-medium'>Login Successful!</span>
                </div>
                <p className='text-sm text-green-700'>Redirecting to home page...</p>
              </div>
            )}

            {/* Manual Actions */}
            {hasError && (
              <div className='flex gap-2'>
                <Button onClick={handleRetry} disabled={isProcessing} variant='outline' size='sm'>
                  Retry
                </Button>
                <Button onClick={handleReturnHome} variant='outline' size='sm'>
                  Return Home
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CallbackHandler
