import { User, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useExtensionContext } from './ExtensionProvider'

interface UserInfoRowProps {
  label: string
  value: any
  badge?: string
}

function UserInfoRow({ label, value, badge }: UserInfoRowProps) {
  const renderValue = () => {
    if (typeof value === 'boolean') {
      return (
        <div className='flex items-center gap-2'>
          <span>{value ? 'Yes' : 'No'}</span>
          {badge && (
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {value ? 'Active' : 'Inactive'}
            </span>
          )}
        </div>
      )
    }

    if (Array.isArray(value)) {
      return value.join(', ')
    }

    if (value !== null && typeof value === 'object') {
      return <pre className='overflow-x-auto rounded bg-gray-50 p-2 text-xs'>{JSON.stringify(value, null, 2)}</pre>
    }

    if (value !== null && value !== undefined) {
      return String(value)
    }

    return 'N/A'
  }

  return (
    <div className='flex flex-col gap-1'>
      <span className='text-sm font-medium text-gray-700'>{label}:</span>
      <div className='text-sm text-gray-600'>{renderValue()}</div>
    </div>
  )
}

export function UserProfile() {
  const { extension, auth } = useExtensionContext()

  // Automatically load user info when authenticated and extension is ready
  useEffect(() => {
    if (auth.isAuthenticated && extension.client && !auth.userInfo) {
      auth.refreshUserInfo()
    }
  }, [auth.isAuthenticated, extension.client, auth.userInfo, auth.refreshUserInfo])

  if (!auth.isAuthenticated) {
    return null
  }

  const handleRefresh = async () => {
    if (extension.client) {
      try {
        await auth.refreshUserInfo()
      } catch (error) {
        console.error('Failed to refresh user info:', error)
      }
    }
  }

  const userInfo = auth.userInfo?.body || auth.userInfo

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              User Profile
            </CardTitle>
            <CardDescription>Information from your authenticated BodhiApp session</CardDescription>
          </div>
          <Button onClick={() => auth.logout()} variant='outline' size='sm'>
            Logout
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!auth.userInfo ? (
          <div className='flex items-center gap-2 py-4'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span className='text-sm text-gray-600'>Loading user information...</span>
          </div>
        ) : auth.error ? (
          <div className='space-y-3'>
            <div className='flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-600'>
              <AlertCircle className='h-4 w-4' />
              Failed to load user information: {auth.error.message}
            </div>
            <Button onClick={handleRefresh} variant='outline' size='sm'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Retry
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* First show the raw response body as expected by test patterns */}
            {auth.userInfo?.body && <UserInfoRow label='Response Body' value={auth.userInfo.body} />}

            {/* Display individual user fields */}
            {userInfo?.logged_in !== undefined && (
              <UserInfoRow label='Logged In' value={userInfo.logged_in} badge='status' />
            )}

            {userInfo?.username && <UserInfoRow label='Username' value={userInfo.username} />}

            {userInfo?.email && <UserInfoRow label='Email' value={userInfo.email} />}

            {(userInfo?.name || userInfo?.full_name) && (
              <UserInfoRow label='Full Name' value={userInfo.name || userInfo.full_name} />
            )}

            {userInfo?.roles && Array.isArray(userInfo.roles) && <UserInfoRow label='Roles' value={userInfo.roles} />}

            {userInfo?.scopes && Array.isArray(userInfo.scopes) && (
              <UserInfoRow label='Scopes' value={userInfo.scopes} />
            )}

            {userInfo?.client_id && <UserInfoRow label='Client ID' value={userInfo.client_id} />}

            {userInfo?.session_id && <UserInfoRow label='Session ID' value={userInfo.session_id} />}

            {userInfo?.token_type && <UserInfoRow label='Token Type' value={userInfo.token_type} />}

            {userInfo?.expires_in && <UserInfoRow label='Token Expires In' value={`${userInfo.expires_in} seconds`} />}

            {/* Show any additional fields */}
            {userInfo &&
              Object.keys(userInfo)
                .filter(
                  key =>
                    ![
                      'logged_in',
                      'username',
                      'email',
                      'name',
                      'full_name',
                      'roles',
                      'scopes',
                      'client_id',
                      'session_id',
                      'token_type',
                      'expires_in',
                    ].includes(key)
                )
                .map(key => (
                  <UserInfoRow
                    key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={userInfo[key]}
                  />
                ))}

            <div className='pt-2'>
              <Button onClick={handleRefresh} variant='outline' size='sm'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
