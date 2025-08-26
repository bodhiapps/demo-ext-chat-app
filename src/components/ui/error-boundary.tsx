import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { navigateToRoot } from '@/lib/base-path'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    navigateToRoot()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />
      }

      // Default error UI
      return (
        <div className='flex min-h-screen items-center justify-center bg-white p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
                <AlertTriangle className='h-8 w-8 text-red-600' />
              </div>
              <CardTitle className='text-red-800'>Something went wrong</CardTitle>
              <CardDescription className='text-gray-600'>
                The application encountered an unexpected error. This has been logged for investigation.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Error details (only show in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className='rounded-md bg-red-50 p-3 text-sm text-red-800'>
                  <div className='font-medium'>Error:</div>
                  <div className='mt-1 font-mono text-xs'>{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <details className='mt-2'>
                      <summary className='cursor-pointer font-medium'>Stack Trace</summary>
                      <pre className='mt-1 text-xs'>{this.state.error.stack}</pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className='flex gap-2'>
                <Button onClick={this.handleReset} variant='outline' size='sm' className='flex-1'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant='outline' size='sm' className='flex-1'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Reload Page
                </Button>
              </div>

              <Button onClick={this.handleGoHome} variant='default' size='sm' className='w-full'>
                <Home className='mr-2 h-4 w-4' />
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Unhandled error:', error, errorInfo)

    // In a real app, you might want to send this to an error reporting service
    // like Sentry, LogRocket, etc.
  }, [])
}
