import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusDisplay } from '@/components/ui/status-display'

import { useExtensionContext } from './ExtensionProvider'

export function ExtensionStatus() {
  const { extension } = useExtensionContext()

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <StatusDisplay type='extension' status={extension.status} showText={false} />
          Extension Status
        </CardTitle>
        <CardDescription>Bodhi browser extension connection status</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Status:</span>
          <StatusDisplay type='extension' status={extension.status} showIcon={false} />
        </div>

        {extension.extensionId && (
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Extension ID:</span>
            <span className='font-mono text-sm text-gray-600'>{extension.extensionId.substring(0, 8)}...</span>
          </div>
        )}

        {extension.serverState && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Server Status:</span>
              <span className='text-sm text-gray-600'>
                {extension.serverState.status}
                {extension.serverState.version && ` (${extension.serverState.version})`}
              </span>
            </div>
          </div>
        )}

        {extension.error && (
          <div className='space-y-2'>
            <span className='text-sm font-medium text-red-700'>Error:</span>
            <p className='rounded bg-red-50 p-2 text-sm text-red-600'>{extension.error.message}</p>
          </div>
        )}

        <div className='flex justify-center gap-2'>
          {(extension.status === 'not-found' || extension.status === 'error') && (
            <Button onClick={extension.retry} disabled={extension.isDetecting} variant='outline' size='sm'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Retry
            </Button>
          )}

          {extension.status === 'ready' && extension.serverState && (
            <Button onClick={extension.refreshServerState} variant='outline' size='sm'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh Server
            </Button>
          )}
        </div>

        {extension.status === 'not-found' && (
          <div className='rounded-lg bg-blue-50 p-4'>
            <h4 className='mb-2 text-sm font-medium text-blue-800'>Extension Not Found</h4>
            <p className='mb-3 text-sm text-blue-700'>
              The Bodhi browser extension is not installed or not enabled. Please:
            </p>
            <ol className='list-inside list-decimal space-y-1 text-sm text-blue-700'>
              <li>Install the Bodhi browser extension</li>
              <li>Make sure it&apos;s enabled in your browser</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
