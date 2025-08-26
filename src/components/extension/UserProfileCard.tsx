import { LogOut, User, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserProfile } from '@/hooks/useUserProfile'

import { useExtensionContext } from './ExtensionProvider'

export function UserProfileCard() {
  const { auth } = useExtensionContext()
  const { userInfo, isLoading, error, refresh } = useUserProfile()

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          Welcome Back
        </CardTitle>
        <CardDescription>You are currently logged in to BodhiApp</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading ? (
          <div className='flex items-center gap-2 py-4'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span className='text-sm text-gray-600'>Loading user information...</span>
          </div>
        ) : error ? (
          <div className='space-y-3'>
            <div className='flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-600'>
              <AlertCircle className='h-4 w-4' />
              Failed to load user information
            </div>
            <div className='flex gap-2'>
              <Button onClick={refresh} variant='outline' size='sm'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Retry
              </Button>
              <Button onClick={() => auth.logout()} variant='outline' size='sm'>
                <LogOut className='mr-2 h-4 w-4' />
                Logout
              </Button>
            </div>
          </div>
        ) : userInfo ? (
          <div className='space-y-4'>
            {/* User Info Display */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Name:</span>
                <span className='text-sm text-gray-900'>{userInfo.displayName}</span>
              </div>

              {userInfo.email && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>Email:</span>
                  <span className='text-sm text-gray-900'>{userInfo.email}</span>
                </div>
              )}

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Status:</span>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-900'>{userInfo.isLoggedIn ? 'Active' : 'Inactive'}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      userInfo.isLoggedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {userInfo.isLoggedIn ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {userInfo.roles && userInfo.roles.length > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>Roles:</span>
                  <span className='text-sm text-gray-900'>{userInfo.roles.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2 pt-2'>
              <Button onClick={refresh} variant='outline' size='sm'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
              <Button onClick={() => auth.logout()} variant='outline' size='sm'>
                <LogOut className='mr-2 h-4 w-4' />
                Logout
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
