import { Loader2, Clock, Wifi, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type LoadingVariant = 'default' | 'extension' | 'auth' | 'data' | 'inline'

interface LoadingStateProps {
  variant?: LoadingVariant
  message?: string
  description?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const loadingConfig = {
  default: {
    icon: Loader2,
    message: 'Loading...',
    description: 'Please wait while we process your request',
  },
  extension: {
    icon: Wifi,
    message: 'Detecting extension...',
    description: 'Connecting to Bodhi browser extension',
  },
  auth: {
    icon: RefreshCw,
    message: 'Authenticating...',
    description: 'Redirecting to authentication provider',
  },
  data: {
    icon: Clock,
    message: 'Loading data...',
    description: 'Fetching your information',
  },
  inline: {
    icon: Loader2,
    message: 'Loading...',
    description: '',
  },
}

export function LoadingState({
  variant = 'default',
  message,
  description,
  className,
  size = 'md',
  showIcon = true,
}: LoadingStateProps) {
  const config = loadingConfig[variant]
  const Icon = config.icon

  const displayMessage = message || config.message
  const displayDescription = description !== undefined ? description : config.description

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && <Icon className={cn(sizeClasses[size], 'animate-spin text-gray-400')} />}
        <span className={cn('text-gray-600', textSizeClasses[size])}>{displayMessage}</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      {showIcon && <Icon className={cn(sizeClasses[size], 'mb-3 animate-spin text-gray-400')} />}
      <div className='space-y-2'>
        <div className={cn('font-medium text-gray-900', textSizeClasses[size])}>{displayMessage}</div>
        {displayDescription && <p className='max-w-sm text-sm text-gray-600'>{displayDescription}</p>}
      </div>
    </div>
  )
}

// Specialized loading components for common use cases
export function ExtensionLoadingState(props: Omit<LoadingStateProps, 'variant'>) {
  return <LoadingState variant='extension' {...props} />
}

export function AuthLoadingState(props: Omit<LoadingStateProps, 'variant'>) {
  return <LoadingState variant='auth' {...props} />
}

export function DataLoadingState(props: Omit<LoadingStateProps, 'variant'>) {
  return <LoadingState variant='data' {...props} />
}

export function InlineLoadingState(props: Omit<LoadingStateProps, 'variant'>) {
  return <LoadingState variant='inline' {...props} />
}

// Loading wrapper component
interface LoadingWrapperProps {
  isLoading: boolean
  loadingComponent?: ReactNode
  children: ReactNode
  className?: string
}

export function LoadingWrapper({ isLoading, loadingComponent, children, className }: LoadingWrapperProps) {
  if (isLoading) {
    return <div className={className}>{loadingComponent || <LoadingState />}</div>
  }

  return <>{children}</>
}
