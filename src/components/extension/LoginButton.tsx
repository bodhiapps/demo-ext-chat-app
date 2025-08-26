import { LogIn, LogOut, Loader2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useExtensionContext } from './ExtensionProvider'

export function LoginButton() {
  const { extension, auth } = useExtensionContext()

  const handleLogin = async () => {
    if (!extension.client) return
    await auth.login()
  }

  const handleLogout = () => {
    auth.logout()
  }

  const isLoading = auth.status === 'authenticating'
  const hasError = auth.error

  // Don't render if extension is not ready
  if (!extension.isReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Waiting for Bodhi browser extension to be ready...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>
          {auth.isAuthenticated
            ? 'You are currently logged in to BodhiApp'
            : 'Login with your BodhiApp account via the browser extension'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {auth.isAuthenticated ? (
          <Button onClick={handleLogout} variant='outline' className='w-full'>
            <LogOut className='mr-2 h-4 w-4' />
            Logout
          </Button>
        ) : (
          <Button onClick={handleLogin} disabled={isLoading} className='w-full'>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Redirecting...
              </>
            ) : (
              <>
                <LogIn className='mr-2 h-4 w-4' />
                Login with BodhiApp
              </>
            )}
          </Button>
        )}

        {hasError && (
          <div className='flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-600'>
            <AlertCircle className='h-4 w-4' />
            {auth.error?.message || 'An error occurred'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
